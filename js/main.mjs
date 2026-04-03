import { build, parts } from "./gradientEngine.mjs";
import { renderFormattedOutput, renderPreview } from "./render.mjs";
import { renderSaved } from "./saved.mjs";
import { getList, saveList } from "./storage.mjs";
import { state } from "./state.mjs";
import { applyStyles } from "./formatter.mjs";
import { initGuide } from "./guide.mjs";
import { initLogoAudio } from "./logoAudio.mjs";

const el = id => document.getElementById(id);

const input = el("textInput");
const output = el("output");
const preview = el("preview");
const outputDisplay = el("outputDisplay");

const gradientBar = el("gradientBar");
const zone1 = el("zone1");
const zone2 = el("zone2");

const bold = el("bold");
const italic = el("italic");
const underline = el("underline");
const superscript = el("superscript");

const depth = el("depth");
const stepValue = el("stepValue");
const sliderGroup = el("sliderGroup");

const charWarning = el("charWarning");

const saveUserBtn = el("saveUserBtn");
const saveQuipBtn = el("saveQuipBtn");
const removeModeBtn = el("removeModeBtn");

const userList = el("userList");
const quipList = el("quipList");

const actions = document.createElement("div");
actions.className = "gradient-actions";
gradientBar.appendChild(actions);
const copyBtn = el("copyBtn");

const randomBtn = document.createElement("button");
const swapBtn = document.createElement("button");

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

function copy(text, label = "Copied") {
  if (!text) return;
  navigator.clipboard.writeText(text);
  showToast(label);
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

  let c1 = get();
  let c2 = get();

  while (dist(c1, c2) < minDistance) {
    c2 = get();
  }

  const toHex = c =>
    "#" +
    c.r.toString(16).padStart(2, "0") +
    c.g.toString(16).padStart(2, "0") +
    c.b.toString(16).padStart(2, "0");

  return [toHex(c1), toHex(c2)];
}

function updateGradientBar() {
  const g = `linear-gradient(90deg, ${state.c1}, ${state.c2})`;
  gradientBar.style.background = g;
  document.documentElement.style.setProperty("--slider-gradient", g);

  const h1 = el("hex1");
  const h2 = el("hex2");
  if (h1) h1.textContent = state.c1;
  if (h2) h2.textContent = state.c2;
}

function setColors(c1, c2) {
  state.c1 = c1;
  state.c2 = c2;

  if (p1) p1.setColor(c1);
  if (p2) p2.setColor(c2);

  updateGradientBar();
  update();


  if (typeof guide !== "undefined") {
    guide.updateGuideExample();
  }

  updateUIGradient();
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

const p1 = Pickr.create({
  el: "#zone1",
  theme: "nano",
  useAsButton: true,
  default: "#ff0000",
  components: { preview: true, hue: true, interaction: { input: true } }
});

const p2 = Pickr.create({
  el: "#zone2",
  theme: "nano",
  useAsButton: true,
  default: "#00ff00",
  components: { preview: true, hue: true, interaction: { input: true } }
});

p1.on("change", c => setColors(c.toHEXA().toString(), state.c2));
p2.on("change", c => setColors(state.c1, c.toHEXA().toString()));

zone1.onclick = () => p1.show();
zone2.onclick = () => p2.show();

randomBtn.innerHTML = `<i class="fa-solid fa-shuffle"></i>`;
swapBtn.innerHTML = `<i class="fa-solid fa-right-left"></i>`;

randomBtn.setAttribute("aria-label", "Random");
swapBtn.setAttribute("aria-label", "Swap");

randomBtn.className = "gradient-btn";
swapBtn.className = "gradient-btn";

randomBtn.onclick = () => {
  const [c1, c2] = randColor();
  setColors(c1, c2);

  if (typeof gtag === "function") {
    gtag('event', 'random_colors', {
      event_category: 'interaction'
    });
  }
};

swapBtn.onclick = () => setColors(state.c2, state.c1);

actions.appendChild(randomBtn);
actions.appendChild(swapBtn);

copyBtn.onclick = () => {
  const text = stripClosingTags(output.value);
  copy(text);

  if (typeof gtag === "function") {
    gtag('event', 'generate', {
      event_category: 'usage',
      event_label: 'copy_clicked',
      value: text.length
    });
  }
};

document.querySelectorAll(".mode").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".mode").forEach(x => x.classList.remove("active"));
    b.classList.add("active");

    const textLen = input.value.length || 1;
    const mode = +b.dataset.mode;

    state.mode = mode;

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

    update();
  };
});

depth.oninput = () => {
  stepValue.textContent = depth.value;
  update();
};

function update() {
  const text = input.value;

  const textLen = text.length || 1;
  depth.max = textLen;

  if (+depth.value > textLen) {
    depth.value = textLen;
  }

  stepValue.textContent = depth.value;

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

  renderPreview(preview, parts(text, depth), {
    bold: bold.checked,
    italic: italic.checked,
    underline: underline.checked,
    superscript: superscript.checked
  });

  fitPreview();
  updateCharCount();
}

saveUserBtn.onclick = () => {
  const v = stripClosingTags(output.value.trim());
  if (!v) return;

  let list = getList("gd-users");

  if (list.includes(v)) {
    showToast("Already added");
    return;
  }

  list.push(v);
  saveList("gd-users", list);

  renderSaved(userList, quipList);
  showToast("Username saved");

  if (typeof gtag === "function") {
    gtag('event', 'save_username', {
      event_category: 'engagement'
    });
  }
};

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

  renderSaved(userList, quipList);
  showToast("Quip saved");

  if (typeof gtag === "function") {
    gtag('event', 'save_quip', {
      event_category: 'engagement'
    });
  }
};

removeModeBtn.onclick = () => {
  state.removeMode = !state.removeMode;
  document.body.classList.toggle("remove-mode", state.removeMode);
  renderSaved(userList, quipList);
};

[input, bold, italic, underline, superscript].forEach(e => e.oninput = update);

requestAnimationFrame(() => {
  const [c1, c2] = randColor();
  setColors(c1, c2);

  renderSaved(userList, quipList);

  window.guide = initGuide({ depth });

  updateCharCount();
  initLogoAudio();
});


const guideView = document.getElementById("guideView");
const openGuide = document.getElementById("openGuide");
const closeGuide = document.getElementById("closeGuide");

if (openGuide && guideView) {
  openGuide.addEventListener("click", () => {
    guideView.classList.remove("hidden");
  });
}

if (closeGuide && guideView) {
  closeGuide.addEventListener("click", () => {
    guideView.classList.add("hidden");
  });
}

guideView?.addEventListener("click", (e) => {
  if (e.target === guideView) {
    guideView.classList.add("hidden");
  }
});

function updateGuideExample() {
  const el = document.getElementById("guideExample");
  if (!el) return;

  const text = "UberMonkey";

  const built = build(text, depth);
  const styledParts = parts(text, depth);

  el.innerHTML = "";

  styledParts.forEach(({ ch, hex }) => {
    const span = document.createElement("span");
    span.textContent = ch;
    if (hex) span.style.color = hex;
    el.appendChild(span);
  });
}

updateGuideExample();

function updateUIGradient() {
  const gradient = `linear-gradient(90deg, ${state.c1}, ${state.c2})`;
  document.documentElement.style.setProperty("--guide-gradient", gradient);
}

function updateCharCount() {
  const el = document.getElementById("charCount");
  if (!el) return;

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

  el.textContent = `${len} / 500`;

  if (len > 450) {
    el.style.color = "#ff6b6b"; 
    el.style.opacity = "1";
  } else if (len > 32) {
    el.style.color = "#facc15"; 
    el.style.opacity = "0.9";
  } else {
    el.style.color = "#777"; 
    el.style.opacity = "0.7";
  }
}