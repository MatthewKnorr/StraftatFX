import { bindRandomFxHover } from "./randomFxFeedback.mjs";
import { compactHexTag, fitPaletteToCount } from "./gradient.mjs";
import { SelectionModel } from "./selectionModel.mjs";

export function initSelectionEditor({ input, mount, onChange, openDrawer, getEffects, getColors, makeRandomEffects, generateColors }) {
  const model = new SelectionModel();
  let range = null;
  let palette = getColors().slice();
  let colorCount = palette.length;
  const locks = [false, false, false, false];
  const pickers = [];
  const flags = [["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"], ["strike", "Strike"], ["superscript", "Sup"], ["subscript", "Sub"]];
  mount.innerHTML = `
    <div class="effects-section-title">Selection styling</div>
    <p class="selection-help">Highlight text in your message, then edit it here. Use the Styles and Layout tabs to style the whole message.</p>
    <div class="selection-status" aria-live="polite">No text selected</div>
    <fieldset class="selection-fields" disabled>
      <div class="selection-section"><div class="effects-section-title">Emphasis</div><div class="selection-flags">${flags.map(([key, label]) => `<label><input type="checkbox" data-selection-effect="${key}"><span>${label}</span></label>`).join("")}</div>
      </div><div class="selection-section"><div class="effects-section-title">Typography &amp; Layout</div><div class="selection-grid">
        <label>Style<select data-selection-effect="namedStyle"><option value="">Normal</option><option>Title</option><option>H1</option><option>H2</option></select></label>
        <label>Font<select data-selection-effect="font"><option value="">Default</option><option value="LiberationSans SDF">Liberation Sans SDF</option></select></label>
        <label>Scale<input type="number" min="0.01" max="3" step="0.01" data-selection-effect="size" placeholder="1.00"></label>
        <label>Case<select data-selection-effect="caseEffect"><option value="">Normal</option><option value="smallcaps">Small Case</option><option value="uppercase">Uppercase</option></select></label>
        <label>Rotation (deg)<input type="number" min="-360" max="360" data-selection-effect="rotate" placeholder="0"></label>
        <label>Letter spacing (px)<input type="number" min="-80" max="80" data-selection-effect="cspace" placeholder="0"></label>
        <label>Vertical offset (em)<input type="number" min="-5" max="5" step="0.1" data-selection-effect="voffset" placeholder="0"></label>

      </div>
      </div>
      <div class="selection-section selection-palette">
        <div class="effects-section-title">Selection gradient</div>
        <div class="selection-count-group" aria-label="Selection color count">${[1, 2, 3, 4].map(count => `<button type="button" data-selection-count="${count}">${count} Color${count === 1 ? "" : "s"}</button>`).join("")}</div>
        <div class="selection-gradient-track">
          <div class="selection-gradient-bar" role="img" aria-label="Selected text gradient"></div>
          <div class="selection-stops">${[0, 1, 2, 3].map(index => `<div class="selection-stop gradient-handle" data-stop="${index}"><div class="handle-chip"><button type="button" class="selection-stop-lock handle-lock" aria-label="Lock selection color ${index + 1}"><i class="fa-solid fa-lock-open" aria-hidden="true"></i></button><button type="button" class="selection-stop-edit handle-hex" aria-label="Edit selection color ${index + 1}"><span class="selection-stop-hex"></span></button></div></div>`).join("")}</div>
        </div>
        <div class="selection-palette-tools">${[["shuffle", "fa-shuffle", "Shuffle"], ["inverse", "fa-right-left", "Inverse"], ["rotate-colors", "fa-rotate", "Rotate"], ["gradient", "fa-arrow-down", "Use main gradient"]].map(([action, icon, label]) => `<button type="button" class="gradient-btn" data-selection-action="${action}" aria-label="${label}" title="${label}"><i class="fa-solid ${icon}" aria-hidden="true"></i><span class="gradient-btn-label">${label}</span></button>`).join("")}</div>
      </div>
      <div class="selection-section randomfx-section"><div class="effects-section-title">RandomFx</div><div class="selection-actions"><button type="button" data-selection-action="shambles"><span class="randomfx-label">RandomFx</span></button><button type="button" data-selection-action="reroll">Reroll</button><button type="button" data-selection-action="clear-fx">Clear FX</button></div></div>
      <button class="selection-reset" type="button" data-selection-action="clear">Clear selection style</button>
    </fieldset>
    <p class="selection-help">Selected effects override whole-message effects. Clear selection style restores inherited formatting.</p>`;
  bindRandomFxHover(mount.querySelector('[data-selection-action="shambles"]'));
  const controls = [...mount.querySelectorAll("[data-selection-effect]")];
  const fields = mount.querySelector("fieldset");
  const status = mount.querySelector(".selection-status");
  const countButtons = [...mount.querySelectorAll("[data-selection-count]")];
  const stops = [...mount.querySelectorAll(".selection-stop")];
  const gradientBar = mount.querySelector(".selection-gradient-bar");
  const fullPalette = () => palette.slice(0, colorCount);
  function refreshPalette() {
    const colors = fullPalette();
    gradientBar.style.background = colors.length === 1 ? colors[0] : `linear-gradient(90deg, ${colors.join(", ")})`;
    countButtons.forEach(button => {
      const active = Number(button.dataset.selectionCount) === colorCount;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    stops.forEach((stop, index) => {
      stop.hidden = index >= colorCount;
      const color = palette[index] || "#EEE";
      stop.style.setProperty("--stop-color", color);
      stop.querySelector(".selection-stop-hex").textContent = compactHexTag(color);
      const lock = stop.querySelector(".selection-stop-lock");
      lock.setAttribute("aria-pressed", String(locks[index]));
      lock.setAttribute("aria-label", `${locks[index] ? "Unlock" : "Lock"} selection color ${index + 1}`);
      lock.title = locks[index] ? "Locked" : "Lock color";
      lock.querySelector("i").className = `fa-solid ${locks[index] ? "fa-lock" : "fa-lock-open"}`;
      stop.classList.toggle("locked", locks[index]);
      pickers[index]?.setColor(color, true);
    });
  }

  function refresh() {
    fields.disabled = !range;
    status.textContent = range ? `Editing "${input.value.slice(range.start, range.end)}"` : "Highlight text to begin";
    const first = range && model.selected(range.start, range.end).find(token => token.ch !== " ");
    const effects = { ...getEffects(), ...(first ? model.marks[first.start]?.effects : {}) };
    controls.forEach(control => {
      const value = effects[control.dataset.selectionEffect];
      if (control.type === "checkbox") control.checked = Boolean(value);
      else control.value = control.dataset.selectionEffect === "size" && value !== "" && value != null ? Number(value) / 100 : value ?? "";
    });
    const hasRandom = range && model.selected(range.start, range.end).some(token => model.marks[token.start]?.randomEffects?.length);
    mount.querySelector('[data-selection-action="shambles"]').setAttribute("aria-pressed", String(Boolean(hasRandom)));
    mount.querySelector('[data-selection-action="shambles"]').classList.toggle("active", Boolean(hasRandom));
    if (!range) pickers.forEach(picker => picker.hide());
    refreshPalette();
  }

  function capture() {
    model.sync(input.value);
    const start = input.selectionStart, end = input.selectionEnd;
    const changed = range?.start !== start || range?.end !== end;
    range = start !== end ? { start, end } : null;
    if (range && changed) {
      const selected = model.selected(start, end).filter(token => token.ch !== " ");
      const selectedColors = selected.map(token => model.marks[token.start]?.hex);
      const mainColors = getColors();
      colorCount = mainColors.length;
      palette = selectedColors.length && selectedColors.every(Boolean) ? fitPaletteToCount(selectedColors, colorCount) : mainColors.slice();
      locks.fill(false);
    }
    refresh();
  }
  input.addEventListener("select", capture);
  input.addEventListener("effectschange", refresh);
  input.addEventListener("pointerup", capture);
  input.addEventListener("keyup", capture);
  input.addEventListener("input", () => { model.sync(input.value); range = null; refresh(); });
  controls.forEach(control => control.addEventListener("input", () => {
    if (!range) return;
    const key = control.dataset.selectionEffect;
    let value = control.type === "checkbox" ? control.checked : control.value;
    if (control.type === "number" && value !== "") {
      value = String(Math.max(Number(control.min), Math.min(Number(control.max), Number(value) || 0)));
      control.value = value;
    }
    const effects = { [key]: key === "size" && value !== "" ? Math.round(Number(value) * 100) : value };
    if (key === "superscript" && value) effects.subscript = false;
    if (key === "subscript" && value) effects.superscript = false;
    model.patch(range.start, range.end, { effects });
    refresh();
    onChange();
  }));
  const applyColors = () => {
    if (!range) return;
    model.color(range.start, range.end, fullPalette());
    refreshPalette();
    onChange();
  };
  function shufflePalette() {
    const generated = generateColors(colorCount);
    palette = generated.map((color, index) => locks[index] && palette[index] ? palette[index] : color);
    applyColors();
  }
  countButtons.forEach(button => button.onclick = () => {
    if (!range) return;
    colorCount = Number(button.dataset.selectionCount);
    shufflePalette();
  });
  stops.forEach((stop, index) => {
    const edit = stop.querySelector(".selection-stop-edit");
    const picker = Pickr.create({ el: edit, theme: "nano", useAsButton: true, default: palette[index] || "#EEE", components: { preview: true, hue: true, interaction: { input: true } } });
    picker.on("change", color => {
      if (!range || !color) return;
      palette[index] = compactHexTag(color.toHEXA().toString());
      applyColors();
    });
    edit.addEventListener("click", () => { if (range) picker.show(); });
    stop.querySelector(".selection-stop-lock").onclick = () => {
      locks[index] = !locks[index];
      refreshPalette();
    };
    pickers.push(picker);
  });
  mount.querySelectorAll("[data-selection-action]").forEach(button => button.onclick = () => {
    if (!range) return;
    const action = button.dataset.selectionAction;
    if (action === "shuffle") return shufflePalette();
    if (action === "gradient") {
      const mainColors = getColors();
      colorCount = mainColors.length;
      palette = mainColors.map((color, index) => locks[index] && palette[index] ? palette[index] : color);
      return applyColors();
    }
    if (action === "inverse" || action === "rotate-colors") {
      const slots = Array.from({ length: colorCount }, (_, index) => index).filter(index => !locks[index]);
      const colors = slots.map(index => palette[index]);
      if (action === "inverse") colors.reverse();
      else if (colors.length) colors.unshift(colors.pop());
      slots.forEach((slot, index) => { palette[slot] = colors[index]; });
      return applyColors();
    }
    if (action === "clear-fx") model.patch(range.start, range.end, { randomEffects: [] });
    if (action === "clear") model.clear(range.start, range.end);
    if (action === "shambles" || action === "reroll") {
      const tokens = model.selected(range.start, range.end).filter(token => token.ch !== " ");
      const enabled = tokens.some(token => model.marks[token.start]?.randomEffects?.length);
      const turningOff = action === "shambles" && enabled;
      const plan = turningOff ? [] : makeRandomEffects("x".repeat(tokens.length));
      tokens.forEach((token, index) => model.patch(token.start, token.end, { randomEffects: plan[index] || [] }));
    }
    refresh(); onChange();
  });
  mount.closest(".editor-drawer")?.addEventListener("drawerclose", () => pickers.forEach(picker => picker.hide()));
  refresh();
  return model;
}
