import { bindRandomFxHover } from "./randomFxFeedback.mjs";
import { initFloating } from "./floating.mjs";
import { shufflePresets } from "./presetOrder.mjs";
import { initLogoAudio } from "./logoAudio.mjs";
import { initGuide } from "./guide.mjs";
import { applyStyles, compactOutput } from "./formatter.mjs";
import { getList, saveList, state } from "./state.mjs";
import { renderSaved } from "./saved.mjs";
import { renderFormattedOutput, renderRichPreview } from "./render.mjs";
import { generateCleanColors, build, parts, compactHexTag, normalizeHex, fitPaletteToCount } from "./gradient.mjs";
import { initSelectionEditor } from "./selectionEditor.mjs";

window.addEventListener("DOMContentLoaded", () => {
  const el = id => document.getElementById(id);

  const input = el("textInput");
  const namedStyle = el("namedStyle");
  const fontEffect = el("fontEffect");
  let selectionModel = null;
  const output = el("output");
  const preview = el("preview");
  const outputDisplay = el("outputDisplay");

  const gradientBar = el("gradientBar");
  const gradientHandles = el("gradientHandles");
  const gradientToolbar = el("gradientToolbar");
  const recentGradients = el("recentGradients");
  const colorCountButtons = [...document.querySelectorAll(".color-count-btn")];
  const advancedTabs = [...document.querySelectorAll(".advanced-tab")];
  const advancedTabPanels = [...document.querySelectorAll(".advanced-tab-panel")];
  const temperatureSlider = el("temperatureSlider");
  const temperatureValue = el("temperatureValue");
  const themeModeButtons = [...document.querySelectorAll(".theme-mode")];
  const intensityToggle = el("intensityToggle");
  const intensityContent = el("intensityContent");
  const intensityCurrent = el("intensityCurrent");
  const presetCategories = el("presetCategories");
  const presetThemes = el("presetThemes");
  const presetFavoriteBtn = el("presetFavoriteBtn");
  const advancedDrawer = el("advancedDrawer");
  const advancedCloseBtn = el("advancedCloseBtn");
  const presetDrawer = el("presetDrawer");
  const presetSelectionName = el("presetSelectionName");
  let hoveredPresetColors = null;
  let recentPreviewActive = false;
  const RECENT_GRADIENT_LIMIT = 7;
  const presetCloseBtn = el("presetCloseBtn");

  const bold = el("bold");
  const italic = el("italic");
  const underline = el("underline");
  const strike = el("strike");
  const superscript = el("superscript");
  const subscript = el("subscript");
  const effectsToggle = el("effectsToggle");
  const effectsResetBtn = el("effectsResetBtn");
  const gradientResetBtn = el("gradientResetBtn");
  const effectsContent = el("effectsContent");
  const effectsCurrent = el("effectsCurrent");
  const caseEffect = el("caseEffect");
  const cspace = el("cspace");
  const mspace = el("mspace");
  const align = el("align");
  const pos = el("pos");
  const indent = el("indent");
  const lineIndent = el("lineIndent");
  const margin = el("margin");
  const widthEffect = el("widthEffect");
  const lineHeight = el("lineHeight");
  const rotate = el("rotate");
  const voffset = el("voffset");
  const mark = el("mark");
  const markEnabled = el("markEnabled");
  const highlightCustomBtn = el("highlightCustomBtn");
  const space = el("space");
  const highlightSwatches = [...document.querySelectorAll(".highlight-swatch")];
  const optionButtons = [...document.querySelectorAll(".option-effect")];

  const depth = el("depth");
  const stepValue = el("stepValue");
  const sliderGroup = el("sliderGroup");

  const charWarning = el("charWarning");

  const saveGradientBtn = el("saveGradientBtn");
  const saveQuipBtn = el("saveQuipBtn");
  const removeModeBtn = el("removeModeBtn");

  const quipList = el("quipList");

  const copyBtn = el("copyBtn");
  const autoCopyBtn = el("autoCopyBtn");
  const trueRandomEffects = el("trueRandomEffects");
  const trueRandomRerollBtn = el("trueRandomRerollBtn");
  const generatorModeButtons = [...document.querySelectorAll(".generator-mode-btn")];

  const randomBtn = document.createElement("button");
  const swapBtn = document.createElement("button");
  const rotateBtn = document.createElement("button");
  const presetBtn = document.createElement("button");
  const advancedBtn = document.createElement("button");
  let pickrs = [];
  let desiredColorCount = 2;
  let paletteColors = [];
  let autoIntensityManaged = true;
  let autoCopyEnabled = localStorage.getItem("gd-auto-copy") === "1";
  let lastAutoCopied = "";
  let presetData = {};
  let activePresetCategory = "";
  let activePresetKey = "";
  let colorTemperature = +(localStorage.getItem("gd-color-temperature") || 0);
  let activeThemeMode = localStorage.getItem("gd-theme-mode") || "dark";
  let generatorMode = ["random", "true-random"].includes(localStorage.getItem("gd-generator-mode")) ? "random" : "clean";
  let randomEffectPlan = [];
  let removeModeExitTimer = 0;
  const favoritePresetCategory = "Favorites";
  const userPresetCategory = "Saved Gradients";
  function readStoredLocks() {
    try {
      const stored = JSON.parse(localStorage.getItem("gd-color-locks") || "[]");
      return Array.isArray(stored) ? stored.map(Boolean) : [];
    } catch {
      return [];
    }
  }

  function persistColorLocks() {
    localStorage.setItem("gd-color-locks", JSON.stringify(state.colorLocks.slice(0, 4)));
  }

  function syncColorLocks() {
    const current = Array.isArray(state.colorLocks) ? state.colorLocks : [];
    state.colorLocks = Array.from({ length: 4 }, (_, index) => Boolean(current[index]));
    persistColorLocks();
    updateGradientResetState();
  }

  function isColorLocked(index) {
    return Boolean(state.colorLocks[index]);
  }

  function anyActiveColorLocked(count = activeColorCount()) {
    return state.colorLocks.slice(0, count).some(Boolean);
  }

  function toggleColorLock(index) {
    syncColorLocks();
    state.colorLocks[index] = !state.colorLocks[index];
    persistColorLocks();
    renderColorHandles();
    updateGradientResetState();
    showToast(state.colorLocks[index] ? "Color locked" : "Color unlocked");
  }

  function isTrueRandomEffectsEnabled() {
    return trueRandomEffects?.value === "on";
  }

  function resetRandomEffectPlan() {
    randomEffectPlan = [];
  }

  function getCopyText() {
    return output.value;
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

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function updateRemoveModeUI() {
    const active = state.removeMode;
    document.body.classList.toggle("remove-mode", active);
    removeModeBtn.innerHTML = active
      ? '<i class="fa-solid fa-check" aria-hidden="true"></i><span>Done</span>'
      : '<i class="fa-solid fa-trash" aria-hidden="true"></i><span>Remove</span>';
    removeModeBtn.classList.toggle("active", active);
    removeModeBtn.setAttribute("aria-pressed", String(active));
    removeModeBtn.setAttribute("aria-label", active ? "Done removing" : "Manage saved items");
    removeModeBtn.title = active ? "Done removing" : "Manage saved items";
    document.querySelectorAll(".saved-item-clipboard").forEach(item => {
      item.tabIndex = active ? -1 : 0;
      if (active) {
        item.removeAttribute("role");
        item.removeAttribute("aria-label");
      } else {
        item.setAttribute("role", "button");
        item.setAttribute("aria-label", "Copy saved text");
      }
    });
  }

  function finishRemoveMode() {
    clearTimeout(removeModeExitTimer);
    if (!state.removeMode) return;
    state.removeMode = false;
    updateRemoveModeUI();
    renderPresetThemes();
  }

  function scheduleRemoveModeExit() {
    clearTimeout(removeModeExitTimer);
    removeModeExitTimer = setTimeout(finishRemoveMode, 3000);
  }

  function copy(text, label = "Copied", { silent = false } = {}) {
    text = compactOutput(text);
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


  function shuffleGradient({ track = true } = {}) {
    rememberRecentGradient(state.colors);
    const activeCount = activeColorCount();
    paletteColors = ensurePaletteSize(Math.max(desiredColorCount, activeCount));
    const generated = randColors(Math.max(activeCount, 1));
    const next = paletteColors.slice(0, activeCount);

    for (let index = 0; index < activeCount; index++) {
      next[index] = isColorLocked(index) ? (next[index] || state.colors[index]) : generated[index];
    }

    setColors(next, { track });
  }

  function trackAutoCopy(action, text = "") {
    if (!window.gtag) return;

    window.gtag("event", action, {
      event_category: "engagement",
      event_label: autoCopyEnabled ? "enabled" : "disabled",
      value: text.length
    });
  }

  function formatPresetCategory(label) {
    if (label === favoritePresetCategory) return favoritePresetCategory;
    return label.replace(/_/g, " ");
  }

  function getFavoritePresets() {
    return getList("gd-preset-favorites")
      .filter(entry => entry && entry.name && Array.isArray(entry.colors) && entry.colors.length);
  }

  function getUserCreatedPresets() {
    return getList("gd-gradients")
      .map((entry, index) => {
        const colors = Array.isArray(entry?.colors) ? entry.colors : Array.isArray(entry) ? entry : [];
        if (!colors.length) return null;
        return {
          name: entry?.name || `Saved ${index + 1}`,
          colors: colors.map(normalizeHex),
          key: gradientSignature(colors)
        };
      })
      .filter(Boolean);
  }

  function saveFavoritePresets(list) {
    saveList("gd-preset-favorites", list);
  }

  function makePresetKey(entry) {
    return gradientSignature(entry.colors);
  }

  function getPresetCatalog() {
    const favorites = getFavoritePresets();
    const userCreated = getUserCreatedPresets();
    const builtInCatalog = Object.fromEntries(
      Object.entries(presetData).map(([category, entries]) => [
        category,
        entries.map(entry => ({
          name: entry.name,
          colors: entry.colors.map(normalizeHex),
          key: gradientSignature(entry.colors)
        }))
      ])
    );

    const catalog = {
      [userPresetCategory]: userCreated,
      ...builtInCatalog
    };

    if (!favorites.length) return catalog;

    return {
      [userPresetCategory]: userCreated,
      [favoritePresetCategory]: favorites.map(entry => ({
        name: entry.name,
        colors: entry.colors.map(normalizeHex),
        key: gradientSignature(entry.colors)
      })),
      ...builtInCatalog
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
      const active = category === activePresetCategory;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      presetCategories.appendChild(button);
    });
  }

  const presetOrders = new Map();

  function shuffleActivePresets() {
    const keys = (getPresetCatalog()[activePresetCategory] || []).map(makePresetKey);
    presetOrders.set(activePresetCategory, shufflePresets(keys, presetOrders.get(activePresetCategory)));
  }

  function renderPresetThemes() {
    clearPresetHover();
    presetThemes.innerHTML = "";

    if (!presetOrders.has(activePresetCategory)) shuffleActivePresets();
    const order = presetOrders.get(activePresetCategory);
    const activeThemes = [...(getPresetCatalog()[activePresetCategory] || [])]
      .sort((a, b) => order.indexOf(makePresetKey(a)) - order.indexOf(makePresetKey(b)));

    if (!activeThemes.length) {
      presetThemes.innerHTML = `<div class="preset-empty">No presets in this tab yet.</div>`;
      return;
    }

    activeThemes.forEach(entry => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-theme";
      button.dataset.signature = makePresetKey(entry);
      button.setAttribute("aria-pressed", String(makePresetKey(entry) === activePresetKey));
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

      if (activePresetCategory === userPresetCategory) {
        const removeButton = document.createElement("span");
        removeButton.tabIndex = 0;
        removeButton.setAttribute("role", "button");
        removeButton.setAttribute("aria-label", `Remove ${entry.name}`);
        removeButton.onkeydown = event => {
          if (!["Enter", " "].includes(event.key)) return;
          event.preventDefault();
          event.stopPropagation();
          removeButton.click();
        };
        removeButton.className = "preset-theme-remove";
        removeButton.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>';
        removeButton.title = "Remove saved preset";
        button.appendChild(removeButton);
      }

      presetThemes.appendChild(button);
    });
  }

  function renderPresetSelection() {
    const preset = getActivePresetEntry();
    renderPresetCategories();
    presetFavoriteBtn.disabled = !preset;
    el("presetRandomBtn").disabled = !(getPresetCatalog()[activePresetCategory] || []).length;
    presetSelectionName.textContent = preset?.name || "No preset selected";
    const isFavorite = preset && getFavoritePresets().some(entry => entry.name === preset.name && gradientSignature(entry.colors) === gradientSignature(preset.colors));
    presetFavoriteBtn.querySelector("span").textContent = isFavorite ? "Remove Favorite" : "Save Favorite";
    presetFavoriteBtn.querySelector("i").className = `${isFavorite ? "fa-solid" : "fa-regular"} fa-star`;
    presetFavoriteBtn.setAttribute("aria-pressed", String(Boolean(isFavorite)));
    presetFavoriteBtn.classList.toggle("active", Boolean(isFavorite));
  }

  function renderEditorPresetPreview(animate = false) {
    renderColorHandles();
    updateColorCountButtons();
    updateGradientBar();
    const previousColors = animate
      ? [...preview.querySelectorAll(".preview-text > span")].map(span => getComputedStyle(span).color)
      : [];
    renderMessage();
    if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      preview.querySelectorAll(".preview-text > span").forEach((span, index) => {
        if (previousColors[index] && span.animate) {
          span.animate([{ color: previousColors[index] }, { color: getComputedStyle(span).color }], {
            duration: 240, easing: "ease-in-out"
          });
        }
      });
    }
  }

  function clearPresetHover() {
    recentPreviewActive = false;
    if (!hoveredPresetColors) return;
    hoveredPresetColors = null;
    renderEditorPresetPreview();
  }

  let lastOpenedDrawer = "advanced";
  let syncingDrawerLayout = false;
  function compactDrawers() {
    return window.innerWidth < advancedDrawer.getBoundingClientRect().width + presetDrawer.getBoundingClientRect().width + 608;
  }

  function updateDrawerLayout() {
    if (syncingDrawerLayout) return;
    syncingDrawerLayout = true;
    const compact = compactDrawers();
    document.body.classList.toggle("compact-drawers", compact);
    if (compact && advancedDrawer.classList.contains("is-open") && presetDrawer.classList.contains("is-open")) {
      const keep = advancedDrawer.contains(document.activeElement) ? "advanced" : presetDrawer.contains(document.activeElement) ? "preset" : lastOpenedDrawer;
      setDrawerOpen(keep === "advanced" ? "preset" : "advanced", false, { restoreFocus: false });
    }
    const left = advancedDrawer.classList.contains("is-open") ? advancedDrawer.getBoundingClientRect().width : 0;
    const right = presetDrawer.classList.contains("is-open") ? presetDrawer.getBoundingClientRect().width : 0;
    const fitsBeside = window.innerWidth - left - right >= 480;
    document.documentElement.style.setProperty("--editor-left-space", fitsBeside ? `${left}px` : "0px");
    document.documentElement.style.setProperty("--editor-right-space", fitsBeside ? `${right}px` : "0px");
    syncingDrawerLayout = false;
    fitPreview();
  }
  window.addEventListener("resize", updateDrawerLayout);

  function setDrawerOpen(name, open, { restoreFocus = true } = {}) {
    clearPresetHover();
    if (name === "preset" && open && !presetDrawer.classList.contains("is-open")) {
      shuffleActivePresets();
      renderPresetThemes();
    }
    if (open) lastOpenedDrawer = name;
    const compact = compactDrawers();
    const drawers = [
      { name: "preset", panel: presetDrawer, button: presetBtn, close: presetCloseBtn },
      { name: "advanced", panel: advancedDrawer, button: advancedBtn, close: advancedCloseBtn }
    ];
    drawers.forEach(drawer => {
      if (open) drawer.panel.style.zIndex = drawer.name === name ? "101" : "100";
      if (drawer.name !== name && !(open && compact)) return;
      const active = open && drawer.name === name;
      document.body.classList.toggle(drawer.name + "-drawer-open", active);
      drawer.panel.classList.toggle("is-open", active);
      drawer.panel.inert = !active;
      if (!active) drawer.panel.dispatchEvent(new Event("drawerclose"));
      drawer.panel.setAttribute("aria-hidden", String(!active));
      drawer.button.setAttribute("aria-expanded", String(active));
      drawer.button.classList.toggle("active", active);
      if (active) drawer.close.focus({ preventScroll: true });
      else if (!open && drawer.name === name && restoreFocus) drawer.button.focus({ preventScroll: true });
    });
    updateDrawerLayout();
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

    if (!hasActivePreset) activePresetKey = "";
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
      renderPresetSelection();
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
    renderPresetSelection();
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
    updateGradientResetState();

    if (track && window.gtag) {
      window.gtag('event', 'mode_change', {
        event_category: 'feature',
        event_label: `mode_${mode}`
      });
    }
  }

  function syncShortTextDefaults(text = input.value) {
    const visible = visibleCount(text);

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

  function randomRawHex() {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    // Mix the full RGB range with neutrals and very dark/light colors.
    // Equal RGB sampling alone makes exact black or white very rare.
    const zone = values[0] & 7;
    const raw = values[1];
    if (zone === 0) return "#000";
    if (zone === 1) return "#EEE";
    if (zone === 2) {
      const gray = (raw & 255).toString(16).padStart(2, "0");
      return normalizeHex("#" + gray.repeat(3));
    }
    const channels = [raw & 255, (raw >>> 8) & 255, (raw >>> 16) & 255];
    if (zone === 3) channels.forEach((value, i) => { channels[i] = value & 31; });
    if (zone === 4) channels.forEach((value, i) => { channels[i] = 224 + (value & 31); });
    return normalizeHex("#" + channels.map(value => value.toString(16).padStart(2, "0")).join(""));
  }

  function randColors(count) {
    if (generatorMode === "random") {
      return Array.from({ length: count }, randomRawHex);
    }
    return generateCleanColors(count, Math.random() * 360, Math.random, colorTemperature);
  }

  function activeColorCount(text = input.value) {
    return Math.max(1, Math.min(4, desiredColorCount));
  }

  function getHandlePosition(index, count) {
    if (count <= 1) return 50;

    const inset = count === 2 ? 16 : 10;
    return inset + ((100 - inset * 2) * index) / (count - 1);
  }

  function getGradientPreview(colors = state.colors) {
    const stops = colors.length ? colors : ["#0F9", "#FF7A00"];
    return `linear-gradient(90deg, ${(stops.length === 1 ? [stops[0], stops[0]] : stops).join(", ")})`;
  }

  function ensurePaletteSize(targetCount) {
    const next = [...paletteColors];

    if (next.length < targetCount) {
      const generated = randColors(targetCount);

      while (next.length < targetCount) {
        next.push(generated[next.length]);
      }

      return next;
    }

    return next;
  }

  function syncColorsToText(text = input.value) {
    const desired = activeColorCount(text);

    updateColorCountButtons();

    paletteColors = ensurePaletteSize(desiredColorCount);

    const nextColors = paletteColors.slice(0, desired);

    if (state.colors.length !== nextColors.length || state.colors.some((color, index) => color !== nextColors[index])) {
      state.colors = nextColors;
      return true;
    }

    return false;
  }

  function updateGradientBar() {
    const colors = hoveredPresetColors;
    const g = getGradientPreview(colors || state.colors);
    gradientBar.style.background = g;
    document.documentElement.style.setProperty("--slider-gradient", g);
  }

  function getRecentGradients() {
    return getList("gd-recent-gradients")
      .filter(entry => Array.isArray(entry?.colors) && entry.colors.length)
      .slice(0, RECENT_GRADIENT_LIMIT)
      .map(entry => ({ colors: entry.colors.map(normalizeHex) }));
  }

  function renderRecentGradients() {
    if (!recentGradients) return;
    clearRecentHover();

    const recent = getRecentGradients();
    recentGradients.innerHTML = "";
    recentGradients.classList.toggle("hidden", recent.length === 0);

    recent.forEach((entry, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-gradient-swatch";
      button.dataset.index = String(index);
      button.title = entry.colors.join(", ");
      button.setAttribute("aria-label", `Recent gradient ${index + 1}: ${entry.colors.join(", ")}`);
      button.style.background = getGradientPreview(entry.colors);
      recentGradients.appendChild(button);
    });
  }

  function rememberRecentGradient(colors) {
    const normalized = colors.map(normalizeHex);
    if (!normalized.length) return;

    const signature = gradientSignature(normalized);
    const next = [
      { colors: normalized },
      ...getRecentGradients().filter(entry => gradientSignature(entry.colors) !== signature)
    ].slice(0, RECENT_GRADIENT_LIMIT);

    saveList("gd-recent-gradients", next);
    renderRecentGradients();
  }

  function temperatureLabel(value) {
    if (value <= -100) return "Cool";
    if (value < -18) return "Cool Mix";
    if (value >= 100) return "Hot";
    if (value > 18) return "Hot Mix";
    return "Balanced";
  }

  function renderTemperatureControl() {
    if (!temperatureSlider || !temperatureValue) return;
    temperatureSlider.disabled = generatorMode !== "clean";
    temperatureSlider.value = String(colorTemperature);
    temperatureValue.textContent = temperatureLabel(colorTemperature);
    updateGradientResetState();
  }

  function generatorModeLabel(mode) {
    if (mode === "clean") return "Clean";
    return "Random";
  }

  function renderGeneratorModeControls() {
    renderTemperatureControl();
    generatorModeButtons.forEach(button => {
      button.classList.toggle("active", button.dataset.generatorMode === generatorMode);
      button.setAttribute("aria-pressed", String(button.dataset.generatorMode === generatorMode));
    });

    if (intensityCurrent) {
      intensityCurrent.title = `Gradient: ${modeLabel(state.mode)}. Generator: ${generatorModeLabel(generatorMode)}.`;
    }

    updateGradientResetState();
  }

  function setGeneratorMode(mode, { shuffle = true } = {}) {
    generatorMode = ["clean", "random"].includes(mode) ? mode : "clean";
    localStorage.setItem("gd-generator-mode", generatorMode);
    renderGeneratorModeControls();

    if (shuffle) {
      shuffleGradient();
    } else {
      update();
    }
  }

  function updateGradientResetState() {
    if (!gradientResetBtn) return;
    gradientResetBtn.disabled = colorTemperature === 0
      && state.mode === 5
      && generatorMode === "clean"
      && !anyActiveColorLocked();
  }

  function setThemeMode(mode) {
    activeThemeMode = mode === "light" ? "light" : "dark";
    document.body.classList.toggle("theme-light", activeThemeMode === "light");
    document.body.classList.toggle("theme-dark", activeThemeMode === "dark");
    localStorage.setItem("gd-theme-mode", activeThemeMode);

    themeModeButtons.forEach(button => {
      button.classList.toggle("active", button.dataset.themeMode === activeThemeMode);
    });

    updateCharCount();
  }

  function updateColorCountButtons() {
    colorCountButtons.forEach(button => {
      const count = +button.dataset.colorCount;
      button.disabled = false;
      button.classList.remove("hidden-option");
      button.classList.toggle("active", count === (hoveredPresetColors?.length || desiredColorCount));
    });
  }

  function destroyPickrs() {
    pickrs.forEach(pickr => pickr.destroyAndRemove());
    pickrs = [];
  }

  function renderColorHandles() {
    destroyPickrs();
    gradientHandles.innerHTML = "";

    const displayColors = hoveredPresetColors || state.colors;
    const count = displayColors.length;
    syncColorLocks();

    displayColors.forEach((color, index) => {
      const handle = document.createElement("div");
      handle.className = "gradient-handle";
      handle.style.setProperty("--stop-color", color);
      handle.style.left = `${getHandlePosition(index, count)}%`;
      handle.setAttribute("role", "button");
      handle.setAttribute("tabindex", "0");
      handle.setAttribute("aria-label", `Edit color ${index + 1}`);

      if (count > 1 && index === 0) handle.classList.add("edge-left");
      if (count > 1 && index === count - 1) handle.classList.add("edge-right");
      if (isColorLocked(index)) handle.classList.add("locked");

      handle.innerHTML = `
        <div class="handle-inner">
          <div class="handle-line"></div>
          <div class="handle-chip">
            <button class="handle-lock" type="button" aria-label="${isColorLocked(index) ? "Unlock" : "Lock"} color ${index + 1}" title="${isColorLocked(index) ? "Color locked — click to unlock" : "Lock color"}">
              <i class="fa-solid ${isColorLocked(index) ? "fa-lock" : "fa-lock-open"}" aria-hidden="true"></i>
            </button>
            <div class="handle-hex">${compactHexTag(color)}</div>
          </div>
        </div>
      `;

      gradientHandles.appendChild(handle);

      if (hoveredPresetColors) {
        handle.removeAttribute('role');
        handle.removeAttribute('tabindex');
        handle.querySelector('.handle-lock').disabled = true;
        return;
      }

      const pickr = Pickr.create({
        el: handle,
        theme: "nano",
        useAsButton: true,
        default: color,
        components: { preview: true, hue: true, interaction: { input: true } }
      });

      pickr.on("change", picked => {
        const hex = compactHexTag(picked.toHEXA().toString());
        handle.querySelector(".handle-hex").textContent = hex;
        handle.style.setProperty("--stop-color", hex);
        setColorAt(index, hex, { rerender: false });
      });

      handle.querySelector(".handle-lock")?.addEventListener("click", event => {
        event.stopPropagation();
        toggleColorLock(index);
      });

      handle.addEventListener("click", event => {
        if (event.target.closest(".handle-lock")) return;
        pickr.show();
      });

      handle.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        pickr.show();
      });

      pickrs.push(pickr);
    });
  }

  function setColors(colors, { rerender = true, track = true } = {}) {
    // A committed edit must replace any temporary preset preview, including its disabled handles.
    const hadPreview = Boolean(hoveredPresetColors);
    hoveredPresetColors = null;
    recentPreviewActive = false;
    state.colors = colors.map(compactHexTag);
    selectionModel?.clearColors();
    syncColorLocks();
    paletteColors = ensurePaletteSize(Math.max(desiredColorCount, state.colors.length));

    state.colors.forEach((color, index) => {
      paletteColors[index] = color;
    });

    updateGradientBar();

    if (rerender || hadPreview) {
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

    if (track) {
      rememberRecentGradient(state.colors);
    }
  }

  function setColorAt(index, color, options = {}) {
    paletteColors = ensurePaletteSize(Math.max(desiredColorCount, state.colors.length));
    paletteColors[index] = color;
    setColors(paletteColors.slice(0, state.colors.length), options);
  }

  function presetColorsBySlot(colors) {
    const current = paletteColors.slice();
    state.colors.forEach((color, index) => { current[index] = color; });
    const fitted = fitPaletteToCount(colors, Math.min(4, colors.length));
    return fitted.map((color, index) => isColorLocked(index) && current[index] ? current[index] : color);
  }

  function applySavedGradient(colors) {
    const next = presetColorsBySlot(colors);
    hoveredPresetColors = null;
    desiredColorCount = next.length;
    updateColorCountButtons();
    syncColorLocks();
    paletteColors = ensurePaletteSize(next.length);
    next.forEach((color, index) => { paletteColors[index] = normalizeHex(color); });
    setColors(paletteColors.slice(0, desiredColorCount));
    return { ok: true };
  }

  function applyPresetGradient() {
    const preset = getActivePresetEntry();
    if (!preset) return false;

    if (!input.value.trim()) {
      input.value = preset.name;
      update();
    }

    const result = applySavedGradient(preset.colors);

    if (result?.ok === false) {
      showToast(result.message);
      return false;
    }

    showToast(`${preset.name} applied`);
    return true;
  }

  async function loadPresetGradients() {
    try {
      const categories = {
        Anime: "anime",
        Anime_Characters: "anime_characters",
        Superpowered: "superpowered",
        Video_Games: "video-games",
        Movies_TV: "movies-tv",
        Vibes: "vibes",
        Brands: "brands"
      };
      presetData = Object.fromEntries(await Promise.all(
        Object.entries(categories).map(async ([category, file]) => {
          const response = await fetch(`./gradients/${file}.json`, { cache: "no-store" });
          if (!response.ok) throw new Error(`Failed to load ${category} gradients`);
          return [category, await response.json()];
        })
      ));

      ensureActivePresetSelection();

      renderPresetCategories();
      renderPresetThemes();
      renderPresetSelection();
    } catch {
      presetData = {};
      ensureActivePresetSelection();
      renderPresetCategories();
      renderPresetThemes();
      presetFavoriteBtn.disabled = true;
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

  function effectInputs() {
    return [
      bold, italic, underline, strike, superscript, subscript, caseEffect, cspace, mspace, align,
      pos, indent, lineIndent, margin, widthEffect, lineHeight, rotate, voffset, mark,
      markEnabled, space, trueRandomEffects, namedStyle, fontEffect, el("textScale")
    ].filter(Boolean);
  }

  function getEffects() {
    return {
      size: el("textScale").value === "" ? "" : Math.round(Math.max(0.01, Math.min(3, Number(el("textScale").value))) * 100),
      namedStyle: namedStyle.value,
      font: fontEffect.value,
      bold: bold?.checked || false,
      italic: italic?.checked || false,
      underline: underline?.checked || false,
      strike: strike?.checked || false,
      superscript: superscript?.checked || false,
      subscript: subscript?.checked || false,
      caseEffect: caseEffect?.value || "",
      cspace: cspace?.value || "",
      mspace: mspace?.value || "",
      align: align?.value || "",
      pos: pos?.value || "",
      indent: indent?.value || "",
      lineIndent: lineIndent?.value || "",
      margin: margin?.value || "",
      width: widthEffect?.value || "",
      lineHeight: lineHeight?.value || "",
      rotate: rotate?.value || "",
      voffset: voffset?.value || "",
      mark: mark?.value || "#ffff00",
      markEnabled: markEnabled?.checked || false,
      space: space?.value || "",
      trueRandomEffects: isTrueRandomEffectsEnabled()
    };
  }

  function getRandomEffectDefinitions() {
    return [
      { open: "<b>", close: "</b>", preview: { bold: true } },
      { open: "<i>", close: "</i>", preview: { italic: true } },
      { open: "<u>", close: "</u>", preview: { underline: true } },
      { open: "<s>", close: "</s>", preview: { strike: true } },
      { open: "<smallcaps>", close: "</smallcaps>", preview: { caseEffect: "smallcaps" } },
      { open: "<rotate=45>", close: "</rotate>", preview: { rotate: 45 } },
      { open: "<rotate=-45>", close: "</rotate>", preview: { rotate: -45 } },
      { open: "<rotate=25>", close: "</rotate>", preview: { rotate: 25 } },
      { open: "<rotate=-25>", close: "</rotate>", preview: { rotate: -25 } },
      { open: "<voffset=0.22em>", close: "</voffset>", preview: { voffset: 0.22 } },
      { open: "<voffset=-0.18em>", close: "</voffset>", preview: { voffset: -0.18 } }
    ];
  }

  function makeRandomEffectPlan(text) {
    const total = visibleCount(text);
    const plan = Array.from({ length: total }, () => []);
    const definitions = getRandomEffectDefinitions();
    let index = 0;

    while (index < total) {
      const segmentLength = randomInt(1, Math.min(3, total - index));

      if (Math.random() < 0.24) {
        index += segmentLength;
        continue;
      }

      const shuffled = [...definitions].sort(() => Math.random() - 0.5);
      const effectCount = Math.random() < 0.32 ? 2 : 1;
      const effects = shuffled.slice(0, effectCount);

      for (let offset = 0; offset < segmentLength; offset++) {
        plan[index + offset] = effects;
      }

      index += segmentLength;
    }

    return plan;
  }

  function getRandomEffectPlan(text) {
    if (!isTrueRandomEffectsEnabled()) return [];

    // Keep effects by visible character position until explicitly rerolled.
    // New positions get effects without changing the existing ones.
    const total = visibleCount(text);
    if (randomEffectPlan.length < total) {
      randomEffectPlan.push(...makeRandomEffectPlan("x".repeat(total - randomEffectPlan.length)));
    }

    return randomEffectPlan.slice(0, total);
  }

  function partsWithRandomEffects(text, randomEffects, previewColors = null) {
    let visibleIndex = 0;

    return parts(text, depth, previewColors).map(part => {
      if (part.ch === " ") return part;

      const randomEffectsForChar = randomEffects[visibleIndex] || [];
      visibleIndex++;

      return {
        ...part,
        randomEffects: randomEffectsForChar
      };
    });
  }

  function effectDefinitions() {
    return [
      ["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"], ["strike", "Strike"],
      ["superscript", "Sup"], ["subscript", "Sub"], ["caseEffect", "Case"],
      ["cspace", "Letter spacing"], ["mspace", "Fixed width"], ["align", "Alignment"],
      ["pos", "Position"], ["indent", "Indent"], ["lineIndent", "Line indent"],
      ["margin", "Margin"], ["width", "Width", "widthEffect"], ["lineHeight", "Line height"],
      ["rotate", "Rotation"], ["voffset", "Vertical offset"], ["markEnabled", "Color block"],
      ["space", "Space"], ["trueRandomEffects", "RandomFx"], ["namedStyle", "Named style"],
      ["font", "Font", "fontEffect"], ["size", "Scale", "textScale"]
    ];
  }

  function getActiveEffectEntries() {
    const effects = getEffects();
    return effectDefinitions().filter(([key]) => Boolean(effects[key]) || selectionModel?.marks.some(mark =>
      key === "trueRandomEffects" ? mark?.randomEffects?.length : Boolean(mark?.effects?.[key])))
      .map(([key, label, control]) => {
        const values = [...new Set([effects[key], ...(selectionModel?.marks || []).map(mark => mark?.effects?.[key])]
          .filter(value => value !== undefined && value !== null && value !== '' && value !== false))];
        const units = { cspace: 'px', mspace: 'px', pos: 'px', indent: 'px', lineIndent: 'px', margin: 'px', width: '%', lineHeight: '%', rotate: '°', voffset: 'em', space: 'em', size: '%' };
        const valueLabels = values.filter(value => value !== true).map(value => {
          if (key === 'font') return String(value).replace(/ SDF$/, '');
          if (key === 'caseEffect') return ({ smallcaps: 'Small caps', uppercase: 'Uppercase', lowercase: 'Lowercase' })[value] || value;
          if (key === 'align') return String(value).replace(/^./, letter => letter.toUpperCase());
          return `${value}${units[key] || ''}`;
        });
        if (key === 'namedStyle') label = `${valueLabels.join(' / ')} style`;
        else if (valueLabels.length && key !== 'trueRandomEffects') label += ` ${valueLabels.join(' / ')}`;
        return [key, label, control];
      });
  }

  function getActiveEffectLabels() {
    return getActiveEffectEntries().map(([, label]) => label);
  }

  function updateEffectsSummary() {
    const entries = getActiveEffectEntries();
    const labels = entries.map(([, label]) => label);
    effectsCurrent.textContent = labels.length ? `${labels.length} effect${labels.length === 1 ? "" : "s"} applied` : "Off";
    effectsCurrent.title = labels.length ? labels.join(", ") : "No text effects";
    effectsCurrent.classList.toggle("active", labels.length > 0);
    effectsResetBtn.disabled = labels.length === 0;
    const list = el("activeEffectList");
    list.replaceChildren();
    if (!entries.length) list.textContent = "No active effects";
    entries.forEach(([key, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.removeEffect = key;
      const text = document.createElement('span');
      text.className = 'active-effect-label';
      text.textContent = label;
      const remove = document.createElement('span');
      remove.className = 'active-effect-remove';
      remove.textContent = '\u00d7';
      remove.setAttribute('aria-hidden', 'true');
      button.append(text, remove);
      button.setAttribute("aria-label", `Remove ${label}`);
      list.appendChild(button);
    });
  }

  function removeEffect(key) {
    const definition = effectDefinitions().find(([effect]) => effect === key);
    if (!definition) return;
    const control = el(definition[2] || key);
    if (control) {
      if (control.type === "checkbox") control.checked = false;
      else control.value = "";
    }
    if (key === "trueRandomEffects") resetRandomEffectPlan();
    selectionModel?.clearEffects(key);
    updateHighlightUI();
    updateOptionButtons();
    input.dispatchEvent(new Event("effectschange"));
    update();
  }

  function updateEffectControlStates() {
    document.querySelectorAll(".effect-control").forEach(control => {
      const fields = [...control.querySelectorAll("input, select")];
      const hasValue = fields.some(field => {
        if (field.type === "checkbox") return field.checked;
        if (field.type === "hidden") return field.value !== "";
        if (field.type === "color") return markEnabled?.checked && field.value !== (field.defaultValue || "#ffff00");
        if (field.type === "range") return field.value !== field.defaultValue;
        return field.value !== "";
      });

      control.classList.toggle("has-value", hasValue);
    });
  }

  function updateHighlightUI() {
    const color = mark?.value || "#ffff00";

    document.documentElement.style.setProperty("--highlight-current", color);

    highlightSwatches.forEach(button => {
      button.classList.toggle("active", button.dataset.color.toLowerCase() === color.toLowerCase());
    });
  }

  function updateOptionButtons() {
    optionButtons.forEach(button => {
      const target = el(button.dataset.optionTarget);
      if (!target) return;

      button.classList.toggle("active", target.value === button.dataset.optionValue);
    });
    updateEffectControlStates();
  }

  function resetEffects() {
    effectInputs().forEach(control => {
      if (control.type === "checkbox") {
        control.checked = false;
      } else if (control.type === "range") {
        control.value = control.defaultValue;
      } else if (control.tagName === "SELECT") {
        control.value = "";
      } else if (control.type === "color") {
        control.value = control.defaultValue || "#ffff00";
      } else {
        control.value = "";
      }
    });

    resetRandomEffectPlan();
    updateHighlightUI();
    updateOptionButtons();
  }

  function resetTab(tab) {
    if (tab === "text") {
      selectionModel?.marks.fill(null);
    } else {
      const panel = advancedTabPanels.find(panel => panel.dataset.advancedPanel === tab);
      if (!panel) return;
      panel.querySelectorAll("input, select").forEach(control => {
        if (control.type === "checkbox") control.checked = false;
        else control.value = "";
      });
      if (tab === "styles") resetRandomEffectPlan();
    }
    updateHighlightUI();
    updateOptionButtons();
    input.dispatchEvent(new Event("effectschange"));
    update();
  }

  function resetGradientControls() {
    colorTemperature = 0;
    localStorage.setItem("gd-color-temperature", "0");
    generatorMode = "clean";
    localStorage.setItem("gd-generator-mode", generatorMode);
    state.colorLocks = [false, false, false, false];
    persistColorLocks();
    autoIntensityManaged = false;
    setMode(5);
    renderGeneratorModeControls();
    renderTemperatureControl();
    renderColorHandles();
  }

  function reorderUnlockedColors(transform, emptyMessage) {
    const activeCount = activeColorCount();
    paletteColors = ensurePaletteSize(Math.max(desiredColorCount, activeCount));

    const unlockedIndexes = Array.from({ length: activeCount }, (_, index) => index)
      .filter(index => !isColorLocked(index));

    if (unlockedIndexes.length < 2) {
      showToast(emptyMessage);
      return;
    }

    const current = paletteColors.slice(0, activeCount);
    const reordered = transform(unlockedIndexes.map(index => current[index]));

    unlockedIndexes.forEach((index, valueIndex) => {
      current[index] = reordered[valueIndex];
    });

    setColors(current);
  }

  randomBtn.innerHTML = `<i class="fa-solid fa-shuffle"></i><span class="gradient-btn-label">Shuffle</span>`;
  swapBtn.innerHTML = `<i class="fa-solid fa-right-left"></i><span class="gradient-btn-label">Inverse</span>`;
  rotateBtn.innerHTML = `<i class="fa-solid fa-rotate"></i><span class="gradient-btn-label">Rotate</span>`;
  presetBtn.innerHTML = `<i class="fa-solid fa-swatchbook"></i><span class="gradient-btn-label">Preset & Saved Gradients</span>`;

  randomBtn.setAttribute("aria-label", "Shuffle gradient");
  swapBtn.setAttribute("aria-label", "Inverse gradient");
  rotateBtn.setAttribute("aria-label", "Rotate gradient");
  presetBtn.setAttribute("aria-label", "Preset & saved gradients");
  randomBtn.title = "Shuffle";
  swapBtn.title = "Inverse";
  rotateBtn.title = "Rotate unlocked colors";
  presetBtn.title = "Preset & Saved Gradients";

  randomBtn.className = "gradient-btn";
  swapBtn.className = "gradient-btn";
  rotateBtn.className = "gradient-btn";
  presetBtn.className = "gradient-btn";

  randomBtn.onclick = () => {
    shuffleGradient();

    if (window.gtag) {
      window.gtag('event', 'random_used', {
        event_category: 'feature'
      });
    }
  };

  swapBtn.onclick = () => {
    reorderUnlockedColors(colors => [...colors].reverse(), "Unlock two colors to inverse");
  };

  rotateBtn.onclick = () => {
    reorderUnlockedColors(colors => {
      const next = [...colors];
      next.unshift(next.pop());
      return next;
    }, "Unlock two colors to rotate");
  };
  gradientToolbar.appendChild(randomBtn);
  gradientToolbar.appendChild(swapBtn);
  gradientToolbar.appendChild(rotateBtn);
  advancedBtn.type = "button";
  advancedBtn.className = "gradient-btn";
  advancedBtn.title = "Advanced Controls";
  advancedBtn.setAttribute("aria-label", "Advanced controls");
  advancedBtn.innerHTML = '<i class="fa-solid fa-sliders"></i><span class="gradient-btn-label">Advanced Controls</span>';
  gradientToolbar.appendChild(advancedBtn);
  gradientToolbar.appendChild(presetBtn);

  colorCountButtons.forEach(button => {
    button.onclick = () => {
      if (button.disabled) return;
      desiredColorCount = +button.dataset.colorCount;
      updateColorCountButtons();
      shuffleGradient();
    };
  });

  advancedTabs.forEach(tab => {
    tab.onclick = () => {
      const activeTab = tab.dataset.advancedTab;

      advancedTabs.forEach(button => {
        const active = button.dataset.advancedTab === activeTab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });

      advancedTabPanels.forEach(panel => {
        panel.classList.toggle("hidden", panel.dataset.advancedPanel !== activeTab);
      });
    };
  });

  intensityToggle.onclick = () => {
    intensityContent.classList.toggle("hidden");
    intensityToggle.classList.toggle("open", !intensityContent.classList.contains("hidden"));
  };

  function setEffectsManagerOpen(open) {
    effectsContent.classList.toggle("hidden", !open);
    effectsToggle.setAttribute("aria-expanded", String(open));
    if (open) el("effectsCloseBtn").focus({ preventScroll: true });
  }
  effectsToggle.onclick = () => setEffectsManagerOpen(effectsContent.classList.contains("hidden"));
  el("effectsCloseBtn").onclick = () => {
    setEffectsManagerOpen(false);
    effectsToggle.focus();
  };
  el("effectsDock").addEventListener("keydown", event => {
    if (event.key !== "Escape" || effectsContent.classList.contains("hidden")) return;
    event.stopPropagation();
    setEffectsManagerOpen(false);
    effectsToggle.focus();
  });
  el("activeEffectList").onclick = event => {
    const button = event.target.closest("[data-remove-effect]");
    if (!button) return;
    removeEffect(button.dataset.removeEffect);
    (el("activeEffectList").querySelector("button") || effectsToggle).focus();
  };
  document.querySelectorAll("[data-reset-tab]").forEach(button => {
    button.onclick = () => {
      resetTab(button.dataset.resetTab);
      showToast(`${button.textContent.replace("Reset ", "")} reset`);
    };
  });
  effectsResetBtn.onclick = () => {
    resetEffects();
    selectionModel?.clearEffects();
    input.dispatchEvent(new Event("effectschange"));
    update();
    effectsToggle.focus();
    showToast("All text effects cleared");
  };

  gradientResetBtn.onclick = () => {
    resetGradientControls();
    update();
    showToast("Gradient controls reset");
  };

  highlightSwatches.forEach(button => {
    button.onclick = () => {
      mark.value = button.dataset.color;
      markEnabled.checked = true;
      updateHighlightUI();
      update();
    };
  });

  if (highlightCustomBtn && mark) {
    highlightCustomBtn.onclick = () => {
      mark.click();
    };
  }

  mark?.addEventListener("input", () => {
    if (markEnabled) markEnabled.checked = true;
    updateHighlightUI();
    updateEffectControlStates();
    update();
  });

  optionButtons.forEach(button => {
    if (button.dataset.optionTarget === "trueRandomEffects") bindRandomFxHover(button);
    button.onclick = () => {
      const target = el(button.dataset.optionTarget);
      if (!target) return;

      const nextValue = button.dataset.optionValue || "";
      const canToggleOff = ["caseEffect", "trueRandomEffects"].includes(button.dataset.optionTarget);
      const turningOff = canToggleOff && target.value === nextValue;
      target.value = turningOff ? "" : nextValue;
      updateOptionButtons();
      update();
    };
  });

  trueRandomRerollBtn?.addEventListener("click", () => {
    trueRandomEffects.value = "on";
    resetRandomEffectPlan();
    updateOptionButtons();
    update();
    showToast("RandomFx rerolled");
  });

  function previewRecentGradient(event) {
    if (event.pointerType === "touch") return;
    const button = event.target.closest(".recent-gradient-swatch");
    if (!button || button.contains(event.relatedTarget)) return;
    const entry = getRecentGradients()[+button.dataset.index];
    if (!entry) return;
    recentPreviewActive = true;
    hoveredPresetColors = presetColorsBySlot(entry.colors);
    renderEditorPresetPreview(true);
  }

  function clearRecentHover() {
    if (!recentPreviewActive) return;
    recentPreviewActive = false;
    hoveredPresetColors = null;
    renderEditorPresetPreview(true);
  }

  // Preview sources can disappear or lose pointer events when focus/window state changes.
  gradientBar.addEventListener("pointerenter", clearPresetHover);
  input.addEventListener("focus", clearPresetHover);
  window.addEventListener("blur", clearPresetHover);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearPresetHover();
  });

  recentGradients?.addEventListener("pointerover", previewRecentGradient);
  recentGradients?.addEventListener("focusin", previewRecentGradient);
  recentGradients?.addEventListener("pointerleave", clearRecentHover);
  recentGradients?.addEventListener("pointercancel", clearRecentHover);
  recentGradients?.addEventListener("focusout", event => {
    if (!recentGradients.contains(event.relatedTarget)) clearRecentHover();
  });

  recentGradients?.addEventListener("click", event => {
    const button = event.target.closest(".recent-gradient-swatch");
    if (!button) return;

    const entry = getRecentGradients()[+button.dataset.index];
    if (!entry) return;

    recentPreviewActive = false;
    hoveredPresetColors = null;
    applySavedGradient(entry.colors);
    showToast("Recent gradient restored");
  });

  temperatureSlider?.addEventListener("input", () => {
    colorTemperature = +temperatureSlider.value;
    localStorage.setItem("gd-color-temperature", String(colorTemperature));
    renderTemperatureControl();
  });

  generatorModeButtons.forEach(button => {
    button.onclick = () => {
      setGeneratorMode(button.dataset.generatorMode);
      showToast(`${generatorModeLabel(generatorMode)} generator`);
    };
  });

  themeModeButtons.forEach(button => {
    button.onclick = () => setThemeMode(button.dataset.themeMode);
  });

  copyBtn.onclick = () => {
    const text = getCopyText();
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
    trackAutoCopy("auto_copy_toggle");

    if (autoCopyEnabled) {
      const text = getCopyText();
      if (text) {
        copy(text, "Auto copy enabled", { silent: false });
        lastAutoCopied = text;
        trackAutoCopy("auto_copy_trigger", text);
        return;
      }
    }

    showToast(autoCopyEnabled ? "Auto copy enabled" : "Auto copy disabled");
  };


  saveGradientBtn.onclick = () => {
    const colors = paletteColors.slice(0, desiredColorCount).map(normalizeHex);
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
    activePresetCategory = userPresetCategory;
    activePresetKey = signature;
    ensureActivePresetSelection();
    renderPresetCategories();
    renderPresetThemes();
    renderPresetSelection();
    renderSaved(quipList, savedOptions);
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

  function composeMessage(previewColors = null) {
    selectionModel?.sync(input.value);
    const effects = getEffects();
    const randomEffects = getRandomEffectPlan(input.value);
    if (selectionModel) {
      return selectionModel.compose(depth, effects, randomEffects, previewColors, { maxLength: 500 });
    }
    return {
      raw: applyStyles(build(input.value, depth, { randomEffects, previewColors }), effects),
      parts: partsWithRandomEffects(input.value, randomEffects, previewColors)
    };
  }

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

    renderMessage({ autoCopy: true });

    if (window.gtag && text.length > 3) {
      window.gtag('event', 'active_use', {
        event_category: 'engagement',
        value: text.length
      });
    }
  }

  function renderMessage({ autoCopy = false } = {}) {
    const message = composeMessage(hoveredPresetColors);
    const clean = compactOutput(message.raw);
    updateEffectsSummary();
    updateCharCount(clean.length);

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

    if (autoCopy && !hoveredPresetColors && autoCopyEnabled && clean && clean !== lastAutoCopied) {
      lastAutoCopied = clean;
      copy(clean, "Copied", { silent: true });
      trackAutoCopy("auto_copy_trigger", clean);
    }

    renderRichPreview(preview, clean);

    fitPreview();
  }

  saveQuipBtn.onclick = () => {
    const v = getCopyText();
    if (!v.trim()) return;

    let list = getList("gd-quips");

    if (list.includes(v)) {
      showToast("Already added");
      return;
    }

    list.push(v);
    saveList("gd-quips", list);

    renderSaved(quipList, savedOptions);
    showToast("Saved to Phrases");

    if (window.gtag) {
      window.gtag('event', 'save_quip', {
        event_category: 'engagement'
      });
    }
  };

  removeModeBtn.onclick = () => {
    clearTimeout(removeModeExitTimer);
    state.removeMode = !state.removeMode;
    updateRemoveModeUI();
    renderPresetThemes();
  };

  [input, ...effectInputs()].forEach(e => e.oninput = () => {
    if (e === superscript && superscript.checked) subscript.checked = false;
    if (e === subscript && subscript.checked) superscript.checked = false;
    updateOptionButtons();

    update();
  });

  updateOptionButtons();

  const savedOptions = {
    onAfterChange: () => {
      update();
      scheduleRemoveModeExit();
    }
  };

  presetCategories.onclick = event => {
    const button = event.target.closest(".preset-category");
    if (!button) return;

    clearPresetHover();
    activePresetCategory = button.dataset.category;
    activePresetKey = "";
    shuffleActivePresets();
    renderPresetCategories();
    renderPresetThemes();
    renderPresetSelection();
  };

  presetThemes.onclick = event => {
    const button = event.target.closest(".preset-theme");
    if (!button) return;

    if (event.target.closest(".preset-theme-remove") && activePresetCategory === userPresetCategory) {
      const signature = button.dataset.signature;
      const gradients = getList("gd-gradients");
      saveList("gd-gradients", gradients.filter(entry => {
        const colors = Array.isArray(entry?.colors) ? entry.colors : Array.isArray(entry) ? entry : [];
        return gradientSignature(colors) !== signature;
      }));
      ensureActivePresetSelection();
      renderPresetCategories();
      renderPresetThemes();
      renderPresetSelection();
      showToast("Gradient removed");
      return;
    }

    clearPresetHover();
    activePresetKey = button.dataset.signature;
    presetThemes.querySelectorAll(".preset-theme").forEach(item => {
      const selected = item.dataset.signature === activePresetKey;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderPresetSelection();
    applyPresetGradient();
  };

  presetThemes.addEventListener("pointerover", event => {
    if (event.pointerType === "touch") return;
    const button = event.target.closest(".preset-theme");
    if (!button || button.contains(event.relatedTarget)) return;
    const entry = (getPresetCatalog()[activePresetCategory] || []).find(item => makePresetKey(item) === button.dataset.signature);
    if (!entry) return;
    recentPreviewActive = false;
    hoveredPresetColors = presetColorsBySlot(entry.colors);
    renderEditorPresetPreview();
  });
  presetThemes.addEventListener("pointerout", event => {
    const button = event.target.closest(".preset-theme");
    if (button && !button.contains(event.relatedTarget)) clearPresetHover();
  });
  presetThemes.addEventListener("pointercancel", clearPresetHover);
  presetThemes.addEventListener("pointerleave", clearPresetHover);

  presetFavoriteBtn.onclick = () => toggleFavoritePreset();
  function applyRandomCategoryPreset() {
    const entries = getPresetCatalog()[activePresetCategory] || [];
    clearPresetHover();
    const preset = entries.length ? entries[randomInt(0, entries.length - 1)] : null;
    activePresetKey = preset ? makePresetKey(preset) : "";
    renderPresetCategories();
    renderPresetThemes();
    renderPresetSelection();
    if (preset) applyPresetGradient();
  }
  el("presetRandomBtn").onclick = applyRandomCategoryPreset;
  el("clearFxBtn").onclick = () => {
    trueRandomEffects.value = "";
    resetRandomEffectPlan();
    selectionModel?.marks.forEach(mark => { if (mark) delete mark.randomEffects; });
    updateOptionButtons();
    update();
  };
  [
    { name: "preset", panel: presetDrawer, button: presetBtn, close: presetCloseBtn },
    { name: "advanced", panel: advancedDrawer, button: advancedBtn, close: advancedCloseBtn }
  ].forEach(drawer => {
    drawer.button.setAttribute("aria-controls", drawer.panel.id);
    drawer.button.setAttribute("aria-expanded", "false");
    drawer.button.onclick = () => {
      const open = !drawer.panel.classList.contains("is-open");
      if (open && drawer.name === "advanced") {
        advancedTabs.find(tab => tab.dataset.advancedTab === "styles")?.click();
      }
      setDrawerOpen(drawer.name, open);
    };
    drawer.close.onclick = () => setDrawerOpen(drawer.name, false);

  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (advancedDrawer.classList.contains("is-open") && advancedDrawer.contains(document.activeElement)) setDrawerOpen("advanced", false);
    else if (presetDrawer.classList.contains("is-open")) setDrawerOpen("preset", false);
    else if (advancedDrawer.classList.contains("is-open")) setDrawerOpen("advanced", false);
  });
  document.querySelector(".container").addEventListener("transitionend", event => {
    if (event.propertyName === "width") fitPreview();
  });

  selectionModel = initSelectionEditor({
    input, mount: el("selectionEditor"), onChange: update,
    openDrawer: () => {
      setDrawerOpen("advanced", true);
      advancedTabs.find(tab => tab.dataset.advancedTab === "text")?.click();
      el("selectionEditor").scrollIntoView({ block: "nearest" });
    },
    getEffects, getColors: () => state.colors.slice(), makeRandomEffects: makeRandomEffectPlan, generateColors: randColors
  });

  requestAnimationFrame(async () => {
    state.colorLocks = readStoredLocks();
    syncColorLocks();
    generatorMode = ["clean", "random"].includes(generatorMode) ? generatorMode : "clean";
    paletteColors = randColors(desiredColorCount);
    setColors(paletteColors.slice(0, desiredColorCount), { track: false });

    updateRemoveModeUI();
    setMode(state.mode);
    await loadPresetGradients();
    renderSaved(quipList, savedOptions);
    renderAutoCopyButton();
    renderGeneratorModeControls();
    renderRecentGradients();
    renderTemperatureControl();
    setThemeMode(activeThemeMode);
    updateHighlightUI();

    updateDrawerLayout();
    initFloating();

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

  function updateCharCount(len = compactOutput(composeMessage().raw).length) {
    const totalPill = document.getElementById("totalCountPill");
    const steamPill = document.getElementById("steamCountPill");
    if (!totalPill || !steamPill) return;

    const steamLimit = 32;
    const isLightMode = document.body.classList.contains("theme-light");

    totalPill.textContent = `${len} / 500`;
    steamPill.textContent = `${Math.min(len, steamLimit)} / ${steamLimit} Steam Limit`;

    if (len > 450) {
      totalPill.style.color = "#ff6b6b";
      totalPill.style.opacity = "1";
    } else if (len > 32) {
      totalPill.style.color = isLightMode ? "#8a5d00" : "#facc15";
      totalPill.style.opacity = "0.9";
    } else {
      totalPill.style.color = isLightMode ? "#3a4f41" : "#777";
      totalPill.style.opacity = isLightMode ? "1" : "0.7";
    }

    if (len > steamLimit) {
      steamPill.style.color = isLightMode ? "#a4471f" : "#ff8b5e";
      steamPill.style.opacity = "1";
      steamPill.classList.add("warn");
    } else {
      steamPill.style.color = isLightMode ? "#236b3f" : "#8ad7a7";
      steamPill.style.opacity = "0.95";
      steamPill.classList.remove("warn");
    }
  }

});
