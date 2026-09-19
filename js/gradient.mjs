import { state } from "./state.mjs";

export function normalizeHex(hex) {
  const raw = String(hex || "").trim().replace(/^#/, "").toUpperCase();

  if (raw.length === 3) {
    return raw === "FFF" ? "#EEE" : `#${raw}`;
  }

  if (raw.length === 6) {
    if (raw === "FFFFFF") return "#EEE";
    const canCompress = raw[0] === raw[1] && raw[2] === raw[3] && raw[4] === raw[5];
    return canCompress
      ? `#${raw[0]}${raw[2]}${raw[4]}`
      : `#${raw}`;
  }

  if (raw.length === 8 && raw.endsWith("FF")) {
    return normalizeHex(raw.slice(0, 6));
  }

  return `#${raw}`;
}

export function compactHexTag(hex) {
  const raw = normalizeHex(hex).slice(1);
  if (raw.length === 6) {
    // Quantize each channel to the nearest compact RGB value.
    const compact = [0, 2, 4].map(index =>
      Math.round(parseInt(raw.slice(index, index + 2), 16) / 17).toString(16)
    ).join("").toUpperCase();
    return compact === "FFF" ? "#EEE" : `#${compact}`;
  }
  return `#${raw}`;
}

export function hexToRgb(hex) {
  const raw = String(hex || "").trim().replace(/^#/, "");
  const expanded = raw.length === 3
    ? raw.split("").map(ch => ch + ch).join("")
    : raw.slice(0, 6);
  const n = parseInt(expanded, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r, g, b) {
  return normalizeHex(
    "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")
  );
}

export function interpolateColor(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  };
}

function visible(text){
  return [...text].filter(c => c !== " ");
}

function palette(){
  const colors = state.colors.length ? state.colors : ["#0F9", "#FF7A00"];
  return colors.map(normalizeHex);
}

function getSteps(text, depth){
  const count = visible(text).length;

  if(state.mode === 1) return 1;
  if(state.mode === 2) return 2;
  if(state.mode === 3) return 3;
  if(state.mode === 4) return 4;
  if(state.mode === 5) return count;
  if(state.mode === 6) return Math.min(+depth.value, count);

  return count;
}

function factor(i, total, steps){
  if(steps <= 1) return 0;

  if(state.mode === 5){
    return i / (total - 1 || 1);
  }

  const size = total / steps;
  const bucket = Math.min(Math.floor(i / size), steps - 1);
  return bucket / (steps - 1);
}

function getColorAtFactor(colors, t){
  if(colors.length === 1) return colors[0];

  const scaled = t * (colors.length - 1);
  const leftIndex = Math.floor(scaled);
  const rightIndex = Math.min(leftIndex + 1, colors.length - 1);
  const localT = scaled - leftIndex;

  if(leftIndex === rightIndex || localT === 0){
    return colors[leftIndex];
  }

  const left = hexToRgb(colors[leftIndex]);
  const right = hexToRgb(colors[rightIndex]);
  const col = interpolateColor(left, right, localT);

  return rgbToHex(col.r, col.g, col.b);
}

export function parts(text, depth, previewColors = null){
  const chars = [...text];
  const vis = visible(text);
  const steps = getSteps(text, depth);
  const colors = previewColors?.length ? previewColors.map(normalizeHex) : palette();

  let vi = 0;

  return chars.map(ch => {
    if(ch === " ") return { ch, hex: null };

    let hex;

    if(state.mode === 5){
      hex = getColorAtFactor(colors, factor(vi, vis.length, steps));
    } else if(colors.length >= steps){
      const colorIndex = steps <= 1 ? 0 : Math.min(Math.floor(factor(vi, vis.length, steps) * (steps - 1)), steps - 1);
      hex = colors[colorIndex];
    } else {
      const f = factor(vi, vis.length, steps);
      hex = getColorAtFactor(colors, f);
    }

    vi++;

    return { ch, hex: compactHexTag(hex) };
  });
}

export function build(text, depth, options = {}){
  let out = "";
  let last = null;
  const formatHex = compactHexTag;
  const randomEffects = Array.isArray(options.randomEffects) ? options.randomEffects : [];
  let visibleIndex = 0;

  for(const { ch, hex } of parts(text, depth, options.previewColors)){
    if(ch === " "){
      out += " ";
      continue;
    }

    const tagHex = formatHex(hex);

    // Compact RGB can repeat adjacent values. Per Letter still emits a tag
    // for every visible character; only grouped modes coalesce equal colors.
    if(state.mode === 5 || tagHex !== last){
      out += `<${tagHex}>`;
      last = tagHex;
    }

    const effects = randomEffects[visibleIndex] || [];
    effects.forEach(effect => {
      out += effect.open;
    });

    out += ch;

    [...effects].reverse().forEach(effect => {
      out += effect.close;
    });

    visibleIndex++;
  }

  return out;
}

export const CLEAN_HARMONIES = {
  1: [{ name: "Monochromatic", offsets: [0] }],
  2: [
    { name: "Complementary", offsets: [0, 180] },
    { name: "Analogous Pair", offsets: [0, 30] },
    { name: "Split Pair", offsets: [0, 60] },
    { name: "Near Complementary", offsets: [0, 165] }
  ],
  3: [
    { name: "Analogous", offsets: [0, 30, 60] },
    { name: "Triadic", offsets: [0, 120, 240] },
    { name: "Split Complementary", offsets: [0, 150, 210] },
    { name: "Double Analogous / Wide Analogous", offsets: [0, 60, 120] }
  ],
  4: [
    { name: "Tetradic / Rectangle", offsets: [0, 60, 180, 240] },
    { name: "Square", offsets: [0, 90, 180, 270] },
    { name: "Double Complementary", offsets: [0, 30, 180, 210] },
    { name: "Analogous Four", offsets: [0, 30, 60, 90] }
  ]
};

// Only relationships with exactly the selected number of colors are eligible.
export function createCleanHarmony(count, baseHue, random = Math.random) {
  const compatible = CLEAN_HARMONIES[count];
  if (!compatible) throw new RangeError("Clean palettes need 1–4 colors");
  const { offsets } = compatible[Math.floor(random() * compatible.length)];
  const saturation = 0.58 + random() * 0.22;
  const lightness = 0.48 + random() * 0.12;

  return offsets.map((offset) => ({
    h: ((baseHue + offset) % 360 + 360) % 360,
    s: Math.max(0.48, Math.min(0.88, saturation + (random() - 0.5) * 0.12)),
    l: Math.max(0.4, Math.min(0.72, lightness + (random() - 0.5) * 0.16))
  }));
}

// Apply the bias to every harmony member, not just the starting hue.
export function temperatureHue(hue, temperature = 0) {
  const h = ((hue % 360) + 360) % 360;
  const amount = Math.min(1, Math.abs(Number(temperature) || 0) / 100);
  if (!amount) return h;
  const start = temperature > 0 ? 330 : 170;
  const target = start + (((h - start) % 360 + 360) % 360) / 360 * 90;
  const delta = ((target - h + 540) % 360) - 180;
  return (h + delta * amount + 360) % 360;
}

export function generateCleanColors(count, baseHue, random = Math.random, temperature = 0) {
  return createCleanHarmony(count, baseHue, random).map(({ h, s, l }) => {
    h = temperatureHue(h, temperature);
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    const sectors = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]];
    return rgbToHex(...sectors[Math.floor(h / 60)].map(channel => Math.round((channel + m) * 255)));
  });
}

// Sample a preset across its full span while preserving the editor's color count.
export function fitPaletteToCount(colors, count) {
  if (!Number.isInteger(count) || count < 1 || count > 4) throw new RangeError("Expected 1-4 colors");
  if (!colors.length) return [];
  return Array.from({ length: count }, (_, index) => {
    const position = count === 1 ? 0 : index * (colors.length - 1) / (count - 1);
    const left = Math.floor(position);
    const right = Math.min(left + 1, colors.length - 1);
    const rgb = interpolateColor(hexToRgb(colors[left]), hexToRgb(colors[right]), position - left);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });
}
