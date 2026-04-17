import { build, parts } from "./gradientEngine.mjs";
import { renderFormattedOutput, renderPreview } from "./render.mjs";
import { renderSaved } from "./saved.mjs";
import { getList, saveList } from "./storage.mjs";
import { state } from "./state.mjs";
import { applyStyles } from "./formatter.mjs";
import { initGuide } from "./guide.mjs";
import { initLogoAudio } from "./logoAudio.mjs";
import { initFloating } from "./floating.mjs";
import { hexToRgb, normalizeHex } from "./gradient.mjs";

window.addEventListener("DOMContentLoaded", () => {
  const el = id => document.getElementById(id);

  const input = el("textInput");
  const output = el("output");
  const preview = el("preview");
  const outputDisplay = el("outputDisplay");

  const gradientBar = el("gradientBar");
  const gradientHandles = el("gradientHandles");
  const gradientToolbar = el("gradientToolbar");
  const colorCountButtons = [...document.querySelectorAll(".color-count-btn")];
  const intensityToggle = el("intensityToggle");
  const intensityContent = el("intensityContent");
  const intensityCurrent = el("intensityCurrent");
  const presetCategories = el("presetCategories");
  const presetThemes = el("presetThemes");
  const presetDetail = el("presetDetail");
  const presetDetailName = el("presetDetailName");
  const presetDetailPreview = el("presetDetailPreview");
  const presetDetailColors = el("presetDetailColors");
  const presetFavoriteBtn = el("presetFavoriteBtn");
  const presetApplyBtn = el("presetApplyBtn");
  const presetPopup = el("presetPopup");
  const presetCloseBtn = el("presetCloseBtn");

  const bold = el("bold");
  const italic = el("italic");
  const underline = el("underline");
  const superscript = el("superscript");

  const depth = el("depth");
  const stepValue = el("stepValue");
  const sliderGroup = el("sliderGroup");

  const charWarning = el("charWarning");

  const saveGradientBtn = el("saveGradientBtn");
  const saveQuipBtn = el("saveQuipBtn");
  const removeModeBtn = el("removeModeBtn");

  const gradientList = el("gradientList");
  const quipList = el("quipList");

  const copyBtn = el("copyBtn");
  const autoCopyBtn = el("autoCopyBtn");

  const randomBtn = document.createElement("button");
  const swapBtn = document.createElement("button");
  const presetBtn = document.createElement("button");
  let pickrs = [];
  let desiredColorCount = 2;
  let paletteColors = [];
  let autoIntensityManaged = true;
  let autoCopyEnabled = localStorage.getItem("gd-auto-copy") === "1";
  let lastAutoCopied = "";
  let presetData = {};
  let activePresetCategory = "";
  let activePresetKey = "";
  const favoritePresetCategory = "Favorites";

  function stripClosingTags(text) {
    return text.replace(/<\/(b|i|u|sup)>/g, "");
  }

  function showToast(text) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1200);
  }

  function updateRemoveModeUI() {
    const active = state.removeMode;
    document.body.classList.toggle("remove-mode", active);
    removeModeBtn.textContent = active ? "Done Removing" : "Remove";
    removeModeBtn.classList.toggle("active", active);
  }

  function copy(text, label = "Copied", { silent = false } = {}) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (!silent) showToast(label);
    }).catch(() => {
      if (!silent) showToast("Copy failed");
    });
  }

  function renderAutoCopyButton() {
    if (!autoCopyBtn) return;
    autoCopyBtn.textContent = autoCopyEnabled ? "Auto Copy On" : "Auto Copy Off";
    autoCopyBtn.classList.toggle("active", autoCopyEnabled);
  }

  function formatPresetCategory(label) {
    if (label === favoritePresetCategory) return favoritePresetCategory;
    return label.replace(/_/g, " ");
  }

  function getFavoritePresets() {
    return getList("gd-preset-favorites")
      .filter(entry => entry && entry.name && Array.isArray(entry.colors) && entry.colors.length);
  }

  function saveFavoritePresets(list) {
    saveList("gd-preset-favorites", list);
  }

  function makePresetKey(entry) {
    return gradientSignature(entry.colors);
  }

  function getPresetCatalog() {
    const favorites = getFavoritePresets();
    if (!favorites.length) return { ...presetData };
    return {
      [favoritePresetCategory]: favorites.map(entry => ({
        name: entry.name,
        colors: entry.colors.map(normalizeHex),
        key: gradientSignature(entry.colors)
      })),
      ...Object.fromEntries(
        Object.entries(presetData).map(([category, entries]) => [
          category,
          entries.map(entry => ({
            name: entry.name,
            colors: entry.colors.map(normalizeHex),
            key: gradientSignature(entry.colors)
          }))
        ])
      )
    };
  }

  function getActivePresetEntry() {
    const list = getPresetCatalog()[activePresetCategory] || [];
    return list.find(entry => makePresetKey(entry) === activePresetKey) || null;
  }

  function getPresetCategories() {
    return Object.keys(getPresetCatalog());
  }

  function renderPresetCategories() {
    presetCategories.innerHTML = "";

    getPresetCategories().forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-category";
      button.dataset.category = category;
      button.textContent = formatPresetCategory(category);
      button.classList.toggle("active", category === activePresetCategory);
      presetCategories.appendChild(button);
    });
  }

  function renderPresetThemes() {
    presetThemes.innerHTML = "";

    const activeThemes = getPresetCatalog()[activePresetCategory] || [];

    if (!activeThemes.length) {
      presetThemes.innerHTML = `<div class="preset-empty">No presets in this tab yet.</div>`;
      return;
    }

    activeThemes.forEach(entry => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-theme";
      button.dataset.signature = makePresetKey(entry);
      button.style.setProperty("--preset-theme-bg", entry.colors.length === 1
        ? entry.colors[0]
        : `linear-gradient(135deg, ${entry.colors.join(", ")})`);
      button.classList.toggle("active", makePresetKey(entry) === activePresetKey);
      const swatches = entry.colors.map(color => `
        <span class="preset-theme-swatch" style="background:${color}" title="${color}"></span>
      `).join("");
      button.innerHTML = `
        <span class="preset-theme-content">
          <span class="preset-theme-meta">
            <span class="preset-theme-name">${entry.name}</span>
            <span class="preset-theme-swatches">${swatches}</span>
          </span>
        </span>
      `;
      presetThemes.appendChild(button);
    });
  }

  function renderPresetDetail() {
    const preset = getActivePresetEntry();
    if (!preset) {
      presetFavoriteBtn.disabled = true;
      presetApplyBtn.disabled = true;
      presetDetailName.textContent = "No preset selected";
      presetDetailPreview.style.background = "linear-gradient(135deg, #2b2b2b, #121212)";
      presetDetail.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)), linear-gradient(180deg, rgba(18, 18, 18, 0.9), rgba(10, 10, 10, 0.84))";
      presetDetailColors.innerHTML = "";
      presetFavoriteBtn.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.18)";
      presetApplyBtn.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.22)";
      return;
    }

    presetFavoriteBtn.disabled = false;
    presetApplyBtn.disabled = false;

    presetDetailPreview.classList.add("is-updating");
    presetDetailName.textContent = preset.name;
    presetDetail.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)), linear-gradient(180deg, rgba(18, 18, 18, 0.9), rgba(10, 10, 10, 0.84))";
    presetDetailPreview.style.background = `linear-gradient(90deg, ${preset.colors.join(", ")})`;
    presetApplyBtn.style.background = `linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03)), linear-gradient(90deg, ${preset.colors.join(", ")})`;
    const shadowColor = preset.colors[Math.floor(preset.colors.length / 2)] || preset.colors[0] || "#ffffff";
    presetFavoriteBtn.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.22), 0 0 22px ${shadowColor}33`;
    presetApplyBtn.style.boxShadow = `0 16px 28px rgba(0, 0, 0, 0.26), 0 0 28px ${shadowColor}4d`;
    presetDetailColors.innerHTML = "";

    window.clearTimeout(renderPresetDetail.previewTimer);
    renderPresetDetail.previewTimer = window.setTimeout(() => {
      presetDetailPreview.classList.remove("is-updating");
    }, 220);

    preset.colors.forEach(color => {
      const chip = document.createElement("span");
      chip.className = "preset-color-chip";
      chip.textContent = color;
      presetDetailColors.appendChild(chip);
    });

    const isFavorite = getFavoritePresets().some(entry => entry.name === preset.name && gradientSignature(entry.colors) === gradientSignature(preset.colors));
    presetFavoriteBtn.textContent = isFavorite ? "Remove Favorite" : "Save Favorite";
    presetFavoriteBtn.classList.toggle("active", isFavorite);
  }

  function ensureActivePresetSelection() {
    const catalog = getPresetCatalog();
    const categories = Object.keys(catalog);

    if (!categories.length) {
      activePresetCategory = "";
      activePresetKey = "";
      return;
    }

    if (!catalog[activePresetCategory]?.length) {
      activePresetCategory = categories.find(category => (catalog[category] || []).length) || categories[0];
    }

    const currentList = catalog[activePresetCategory] || [];
    const hasActivePreset = currentList.some(entry => makePresetKey(entry) === activePresetKey);

    if (!hasActivePreset) {
      activePresetKey = currentList[0] ? makePresetKey(currentList[0]) : "";
    }
  }

  function toggleFavoritePreset() {
    const preset = getActivePresetEntry();
    if (!preset) return;

    const favorites = getFavoritePresets();
    const existingIndex = favorites.findIndex(entry =>
      entry.name === preset.name && gradientSignature(entry.colors) === gradientSignature(preset.colors)
    );

    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
      saveFavoritePresets(favorites);
      ensureActivePresetSelection();

      renderPresetCategories();
      renderPresetThemes();
      renderPresetDetail();
      showToast("Favorite removed");
      return;
    }

    favorites.push({
      name: preset.name,
      colors: preset.colors.map(normalizeHex)
    });
    saveFavoritePresets(favorites);
    activePresetCategory = favoritePresetCategory;
    activePresetKey = makePresetKey(preset);
    ensureActivePresetSelection();
    renderPresetCategories();
    renderPresetThemes();
    renderPresetDetail();
    showToast("Favorite saved");
  }

  function visibleChars(text) {
    return [...text].filter(ch => ch !== " ");
  }

  function visibleCount(text = input.value) {
    return visibleChars(text).length;
  }

  function gradientSignature(colors) {
    return colors.map(normalizeHex).join("|");
  }

  function maxColorStops(text = input.value) {
    const visible = visibleCount(text);
    if (visible <= 1) return 1;
    return Math.max(2, Math.min(4, Math.ceil(visible / 2)));
  }

  function modeLabel(mode) {
    if (mode === 1) return "1";
    if (mode === 2) return "1/2";
    if (mode === 3) return "1/3";
    if (mode === 4) return "1/4";
    if (mode === 5) return "Per Letter";
    if (mode === 6) return "Custom";
    return "Per Letter";
  }

  function setMode(mode, { track = false } = {}) {
    state.mode = mode;

    document.querySelectorAll(".mode").forEach(button => {
      button.classList.toggle("active", +button.dataset.mode === mode);
    });

    const textLen = visibleCount() || 1;

    if (mode === 6) {
      sliderGroup.classList.remove("hidden");
      depth.max = textLen;
      if (+depth.value > textLen) depth.value = textLen;
      stepValue.textContent = depth.value;
    } else {
      sliderGroup.classList.add("hidden");

      let steps = textLen;

      if (mode === 1) steps = 1;
      if (mode === 2) steps = Math.ceil(textLen / 2);
      if (mode === 3) steps = Math.ceil(textLen / 3);
      if (mode === 4) steps = Math.ceil(textLen / 4);
      if (mode === 5) steps = textLen;

      depth.value = steps;
      depth.max = textLen;
      stepValue.textContent = steps;
    }

    intensityCurrent.textContent = modeLabel(mode);

    if (track && window.gtag) {
      window.gtag('event', 'mode_change', {
        event_category: 'feature',
        event_label: `mode_${mode}`
      });
    }
  }

  function syncShortTextDefaults(text = input.value) {
    const visible = visibleCount(text);
    const nextDesired = visible <= 1 ? 1 : 2;

    if (visible <= 2 && desiredColorCount !== nextDesired) {
      desiredColorCount = nextDesired;
    }

    if (visible <= 2) {
      autoIntensityManaged = true;
      setMode(visible <= 1 ? 1 : 2);
      return;
    }

    if (autoIntensityManaged && (state.mode === 1 || state.mode === 2)) {
      setMode(5);
    }

    autoIntensityManaged = false;
  }

  function rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const lightness = (max + min) / 2;
    const delta = max - min;

    if (delta === 0) {
      return { h: 0, s: 0, l: lightness };
    }

    const saturation = lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);

    let hue = 0;

    if (max === rn) hue = (gn - bn) / delta + (gn < bn ? 6 : 0);
    else if (max === gn) hue = (bn - rn) / delta + 2;
    else hue = (rn - gn) / delta + 4;

    return { h: hue * 60, s: saturation, l: lightness };
  }

  function randColor(minDistance = 120) {
    function get() {
      return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
      };
    }

    function dist(a, b) {
      return Math.sqrt(
        (a.r - b.r) ** 2 +
        (a.g - b.g) ** 2 +
        (a.b - b.b) ** 2
      );
    }

    let next = get();

    if (Array.isArray(minDistance)) {
      const existing = minDistance.map(hex => {
        const rgb = hexToRgb(hex);
        return { rgb, hsl: rgbToHsl(rgb) };
      });

      function isTooSimilar(candidate) {
        const candidateHsl = rgbToHsl(candidate);

        return existing.some(({ rgb, hsl }) => {
          const hueGap = Math.min(Math.abs(hsl.h - candidateHsl.h), 360 - Math.abs(hsl.h - candidateHsl.h));
          const lightGap = Math.abs(hsl.l - candidateHsl.l);
          const satGap = Math.abs(hsl.s - candidateHsl.s);
          const rgbGap = dist(rgb, candidate);

          return rgbGap < 125 || (hueGap < 28 && lightGap < 0.18) || (hueGap < 20 && satGap < 0.22);
        });
      }

      let attempts = 0;

      while (isTooSimilar(next) && attempts < 80) {
        next = get();
        attempts++;
      }
    }

    return normalizeHex(
      "#" +
      next.r.toString(16).padStart(2, "0") +
      next.g.toString(16).padStart(2, "0") +
      next.b.toString(16).padStart(2, "0")
    );
  }

  function randColors(count) {
    const colors = [];

    while (colors.length < count) {
      const next = randColor(colors);
      colors.push(next);
    }

    return colors;
  }

  function activeColorCount(text = input.value) {
    const visible = visibleCount(text);
    const maxAllowed = maxColorStops(text);

    if (visible === 0) {
      return desiredColorCount;
    }

    return Math.max(1, Math.min(desiredColorCount, maxAllowed, visible));
  }

  function getHandlePosition(index, count) {
    if (count <= 1) return 50;

    const inset = count === 2 ? 16 : 10;
    return inset + ((100 - inset * 2) * index) / (count - 1);
  }

  function getGradientPreview(colors = state.colors) {
    if (!colors.length) {
      return "linear-gradient(90deg, #00FF9C, #FF7A00)";
    }

    if (colors.length === 1) {
      return `linear-gradient(90deg, ${colors[0]}, ${colors[0]})`;
    }

    return `linear-gradient(90deg, ${colors.join(", ")})`;
  }

  function ensurePaletteSize(targetCount) {
    const next = [...paletteColors];

    while (next.length < targetCount) {
      next.push(randColor(next));
    }

    return next;
  }

  function syncColorsToText(text = input.value) {
    const maxAllowed = maxColorStops(text);
    const desired = activeColorCount(text);

    updateColorCountButtons(maxAllowed);

    paletteColors = ensurePaletteSize(desiredColorCount);

    const nextColors = paletteColors.slice(0, desired);

    if (state.colors.length !== nextColors.length || state.colors.some((color, index) => color !== nextColors[index])) {
      state.colors = nextColors;
      return true;
    }

    return false;
  }

  function updateGradientBar() {
    const g = getGradientPreview();
    gradientBar.style.background = g;
    document.documentElement.style.setProperty("--slider-gradient", g);
  }

  function updateColorCountButtons(maxAllowed = maxColorStops()) {
    const visible = visibleCount();

    colorCountButtons.forEach(button => {
      const count = +button.dataset.colorCount;
      const unavailable = count > maxAllowed;
      const hidden = (count === 2 && visible <= 1) || (count >= 3 && unavailable);
      button.disabled = unavailable;
      button.classList.toggle("hidden-option", hidden);
      button.classList.toggle("active", count === desiredColorCount);
    });
  }

  function destroyPickrs() {
    pickrs.forEach(pickr => pickr.destroyAndRemove());
    pickrs = [];
  }

  function renderColorHandles() {
    destroyPickrs();
    gradientHandles.innerHTML = "";

    const count = state.colors.length;

    state.colors.forEach((color, index) => {
      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "gradient-handle";
      handle.style.left = `${getHandlePosition(index, count)}%`;

      if (count > 1 && index === 0) handle.classList.add("edge-left");
      if (count > 1 && index === count - 1) handle.classList.add("edge-right");

      handle.innerHTML = `
        <div class="handle-inner">
          <div class="handle-line"></div>
          <div class="handle-hex">${color}</div>
        </div>
      `;

      gradientHandles.appendChild(handle);

      const pickr = Pickr.create({
        el: handle,
        theme: "nano",
        useAsButton: true,
        default: color,
        components: { preview: true, hue: true, interaction: { input: true } }
      });

      pickr.on("change", picked => {
        const hex = normalizeHex(picked.toHEXA().toString());
        handle.querySelector(".handle-hex").textContent = hex;
        setColorAt(index, hex, { rerender: false });
      });

      handle.addEventListener("click", () => pickr.show());
      pickrs.push(pickr);
    });
  }

  function setColors(colors, { rerender = true, track = true } = {}) {
    state.colors = colors.map(normalizeHex);
    paletteColors = ensurePaletteSize(Math.max(desiredColorCount, state.colors.length));

    state.colors.forEach((color, index) => {
      paletteColors[index] = color;
    });

    updateGradientBar();

    if (rerender) {
      renderColorHandles();
    }

    update();

    if (window.guide?.updateGuideExample) {
      window.guide.updateGuideExample();
    }

    updateUIGradient();

    if (track && window.gtag) {
      window.gtag('event', 'color_change', {
        event_category: 'feature'
      });
    }
  }

  function setColorAt(index, color, options = {}) {
    paletteColors = ensurePaletteSize(Math.max(desiredColorCount, state.colors.length));
    paletteColors[index] = color;
    setColors(paletteColors.slice(0, state.colors.length), options);
  }

  function applySavedGradient(colors) {
    const visible = visibleCount();
    const maxAllowed = maxColorStops(input.value);

    if (!input.value.trim()) {
      return { ok: false, message: `Type more text to use this ${colors.length}-color gradient` };
    }

    if (colors.length > visible || colors.length > maxAllowed) {
      return { ok: false, message: `You need more text for this ${colors.length}-color gradient` };
    }

    desiredColorCount = colors.length;
    paletteColors = ensurePaletteSize(colors.length);
    colors.forEach((color, index) => {
      paletteColors[index] = normalizeHex(color);
    });

    setColors(paletteColors.slice(0, colors.length));
    return { ok: true };
  }

  function applyPresetGradient() {
    const preset = getActivePresetEntry();
    if (!preset) return;

    if (!input.value.trim()) {
      input.value = preset.name;
      update();
    }

    const result = applySavedGradient(preset.colors);

    if (result?.ok === false) {
      showToast(result.message);
      return;
    }

    showToast(`${preset.name} applied`);
  }

  async function loadPresetGradients() {
    try {
      const response = await fetch("./gradients.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load preset gradients");

      const data = await response.json();
      presetData = data || {};

      ensureActivePresetSelection();

      renderPresetCategories();
      renderPresetThemes();
      renderPresetDetail();
    } catch {
      presetData = {};
      ensureActivePresetSelection();
      renderPresetCategories();
      renderPresetThemes();
      presetDetailName.textContent = "Presets unavailable";
      presetDetail.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)), linear-gradient(180deg, rgba(18, 18, 18, 0.9), rgba(10, 10, 10, 0.84))";
      presetDetailPreview.style.background = "linear-gradient(90deg, #333, #111)";
      presetDetailColors.innerHTML = "";
      presetFavoriteBtn.disabled = true;
      presetApplyBtn.disabled = true;
    }
  }

  function fitPreview() {
    const el = preview;
    if (!el) return;

    const textLength = input.value.length;

    const maxChars = 500;
    const minSize = 18;
    const maxSize = 72;

    const ratio = Math.min(textLength / maxChars, 1);
    const eased = Math.pow(ratio, 0.5);

    let size = maxSize - (maxSize - minSize) * eased;

    el.style.fontSize = size + "px";

    while (el.scrollWidth > el.clientWidth && size > 12) {
      size -= 1;
      el.style.fontSize = size + "px";
    }
  }

  randomBtn.innerHTML = `<i class="fa-solid fa-shuffle"></i>`;
  swapBtn.innerHTML = `<i class="fa-solid fa-right-left"></i>`;
  presetBtn.innerHTML = `<i class="fa-solid fa-swatchbook"></i>`;

  randomBtn.setAttribute("aria-label", "Random");
  swapBtn.setAttribute("aria-label", "Swap");
  presetBtn.setAttribute("aria-label", "Preset Palettes");

  randomBtn.className = "gradient-btn";
  swapBtn.className = "gradient-btn";
  presetBtn.className = "gradient-btn";

  randomBtn.onclick = () => {
    paletteColors = randColors(Math.max(desiredColorCount, 1));
    setColors(paletteColors.slice(0, activeColorCount()));

    if (window.gtag) {
      window.gtag('event', 'random_used', {
        event_category: 'feature'
      });
    }
  };

  swapBtn.onclick = () => {
    const activeCount = activeColorCount();
    paletteColors = ensurePaletteSize(Math.max(desiredColorCount, activeCount));

    const swapped = [...paletteColors.slice(0, activeCount)].reverse();
    swapped.forEach((color, index) => {
      paletteColors[index] = color;
    });

    setColors(paletteColors.slice(0, activeCount));
  };
  gradientToolbar.appendChild(randomBtn);
  gradientToolbar.appendChild(swapBtn);
  gradientToolbar.appendChild(presetBtn);

  colorCountButtons.forEach(button => {
    button.onclick = () => {
      if (button.disabled) return;
      desiredColorCount = +button.dataset.colorCount;
      updateColorCountButtons();
      paletteColors = ensurePaletteSize(desiredColorCount);
      setColors(paletteColors.slice(0, activeColorCount()));
    };
  });

  intensityToggle.onclick = () => {
    intensityContent.classList.toggle("hidden");
    intensityToggle.classList.toggle("open", !intensityContent.classList.contains("hidden"));
  };

  copyBtn.onclick = () => {
    const text = stripClosingTags(output.value);
    copy(text);

    if (window.gtag) {
      window.gtag('event', 'copy_text', {
        event_category: 'engagement',
        value: text.length
      });

      window.gtag('event', 'conversion_copy', {
        event_category: 'conversion',
        value: text.length
      });
    }
  };

  autoCopyBtn.onclick = () => {
    autoCopyEnabled = !autoCopyEnabled;
    localStorage.setItem("gd-auto-copy", autoCopyEnabled ? "1" : "0");
    renderAutoCopyButton();

    if (autoCopyEnabled) {
      const text = stripClosingTags(output.value);
      if (text) {
        copy(text, "Auto copy enabled", { silent: false });
        lastAutoCopied = text;
        return;
      }
    }

    showToast(autoCopyEnabled ? "Auto copy enabled" : "Auto copy disabled");
  };

  saveGradientBtn.onclick = () => {
    const colors = paletteColors.slice(0, activeColorCount()).map(normalizeHex);
    if (!colors.length) return;

    let list = getList("gd-gradients");
    const signature = gradientSignature(colors);
    const exists = list.some(entry => {
      const entryColors = Array.isArray(entry?.colors) ? entry.colors : Array.isArray(entry) ? entry : [];
      return gradientSignature(entryColors) === signature;
    });

    if (exists) {
      showToast("Gradient already saved");
      return;
    }

    list.push({ colors });
    saveList("gd-gradients", list);
    renderSaved(quipList, gradientList, savedOptions);
    update();
    showToast("Gradient saved");
  };

  document.querySelectorAll(".mode").forEach(button => {
    button.onclick = () => {
      autoIntensityManaged = false;
      setMode(+button.dataset.mode, { track: true });
      update();
    };
  });

  depth.oninput = () => {
    stepValue.textContent = depth.value;
    update();
  };

  let lastTracked = "";
  let trackTimeout;

  function update() {
    const text = input.value;
    syncShortTextDefaults(text);
    const syncedColors = syncColorsToText(text);

    clearTimeout(trackTimeout);

    trackTimeout = setTimeout(() => {
      if (window.gtag && text !== lastTracked) {
        window.gtag('event', 'generate_text', {
          event_category: 'usage',
          value: text.length
        });

        const len = text.length;
        let bucket = "short";
        if (len > 10) bucket = "medium";
        if (len > 20) bucket = "long";
        if (len > 32) bucket = "steam_limit";

        window.gtag('event', 'text_length', {
          event_category: 'usage',
          event_label: bucket
        });

        lastTracked = text;
      }
    }, 400);

    const textLen = visibleCount(text) || 1;
    depth.max = textLen;

    if (+depth.value > textLen) {
      depth.value = textLen;
    }

    stepValue.textContent = depth.value;

    if (syncedColors) {
      renderColorHandles();
      updateGradientBar();
      updateUIGradient();
    }

    const built = build(text, depth);

    const styled = applyStyles(built, {
      bold: bold.checked,
      italic: italic.checked,
      underline: underline.checked,
      superscript: superscript.checked
    });

    const clean = stripClosingTags(styled);

    if (clean.length > 500) {
      charWarning.classList.remove("hidden");
      output.value = "";
      outputDisplay.innerHTML = "";
      preview.innerHTML = "";
      return;
    } else {
      charWarning.classList.add("hidden");
    }

    output.value = clean;
    outputDisplay.innerHTML = renderFormattedOutput(clean);

    if (autoCopyEnabled && clean && clean !== lastAutoCopied) {
      lastAutoCopied = clean;
      copy(clean, "Copied", { silent: true });
    }

    renderPreview(preview, parts(text, depth), {
      bold: bold.checked,
      italic: italic.checked,
      underline: underline.checked,
      superscript: superscript.checked
    });

    if (window.gtag && text.length > 3) {
      window.gtag('event', 'active_use', {
        event_category: 'engagement',
        value: text.length
      });
    }

    fitPreview();
    updateCharCount();
  }

  saveQuipBtn.onclick = () => {
    const v = stripClosingTags(output.value.trim());
    if (!v) return;

    let list = getList("gd-quips");

    if (list.includes(v)) {
      showToast("Already added");
      return;
    }

    list.push(v);
    saveList("gd-quips", list);

    renderSaved(quipList, gradientList, savedOptions);
    showToast("Clipboard saved");

    if (window.gtag) {
      window.gtag('event', 'save_quip', {
        event_category: 'engagement'
      });
    }
  };

  removeModeBtn.onclick = () => {
    state.removeMode = !state.removeMode;
    updateRemoveModeUI();
    renderSaved(quipList, gradientList, savedOptions);
  };

  [input, bold, italic, underline, superscript].forEach(e => e.oninput = update);

  const savedOptions = {
    onApplyGradient: applySavedGradient,
    onGradientError: showToast,
    onAfterChange: update
  };

  presetCategories.onclick = event => {
    const button = event.target.closest(".preset-category");
    if (!button) return;

    activePresetCategory = button.dataset.category;
    activePresetKey = getPresetCatalog()[activePresetCategory]?.[0]
      ? makePresetKey(getPresetCatalog()[activePresetCategory][0])
      : "";
    renderPresetCategories();
    renderPresetThemes();
    renderPresetDetail();
  };

  presetThemes.onclick = event => {
    const button = event.target.closest(".preset-theme");
    if (!button) return;

    activePresetKey = button.dataset.signature;
    renderPresetThemes();
    renderPresetDetail();
  };

  presetApplyBtn.onclick = () => {
    applyPresetGradient();
  };

  presetFavoriteBtn.onclick = () => {
    toggleFavoritePreset();
  };

  presetBtn.onclick = () => {
    presetPopup.classList.remove("hidden");
  };

  presetCloseBtn.onclick = () => {
    presetPopup.classList.add("hidden");
  };

  presetPopup?.addEventListener("click", e => {
    if (e.target === presetPopup) {
      presetPopup.classList.add("hidden");
    }
  });

  requestAnimationFrame(async () => {
    paletteColors = randColors(4);
    setColors(paletteColors.slice(0, desiredColorCount), { track: false });

    updateRemoveModeUI();
    setMode(state.mode);
    await loadPresetGradients();
    renderSaved(quipList, gradientList, savedOptions);
    renderAutoCopyButton();

    initFloating(20);

    window.guide = initGuide({
      depth,
      onOpen: () => {
        if (window.gtag) {
          window.gtag("event", "open_guide", {
            event_category: "navigation"
          });
        }
      }
    });

    updateCharCount();
    initLogoAudio();
  });

  function updateUIGradient() {
    const gradient = getGradientPreview();
    document.documentElement.style.setProperty("--guide-gradient", gradient);
  }

  function updateCharCount() {
    const totalPill = document.getElementById("totalCountPill");
    const steamPill = document.getElementById("steamCountPill");
    if (!totalPill || !steamPill) return;

    const text = input.value;

    const built = build(text, depth);

    const styled = applyStyles(built, {
      bold: bold.checked,
      italic: italic.checked,
      underline: underline.checked,
      superscript: superscript.checked
    });

    const clean = stripClosingTags(styled);
    const len = clean.length;
    const steamLimit = 32;

    totalPill.textContent = `${len} / 500`;
    steamPill.textContent = `${Math.min(len, steamLimit)} / ${steamLimit} Steam Limit`;

    if (len > 450) {
      totalPill.style.color = "#ff6b6b";
      totalPill.style.opacity = "1";
    } else if (len > 32) {
      totalPill.style.color = "#facc15";
      totalPill.style.opacity = "0.9";
    } else {
      totalPill.style.color = "#777";
      totalPill.style.opacity = "0.7";
    }

    if (len > steamLimit) {
      steamPill.style.color = "#ff8b5e";
      steamPill.style.opacity = "1";
      steamPill.classList.add("warn");
    } else {
      steamPill.style.color = "#8ad7a7";
      steamPill.style.opacity = "0.95";
      steamPill.classList.remove("warn");
    }
  }

});
