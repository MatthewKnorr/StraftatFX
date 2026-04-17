import { hexToRgb, interpolateColor, normalizeHex, rgbToHex } from "./gradient.mjs";
import { state } from "./state.mjs";

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

export function parts(text, depth){
  const chars = [...text];
  const vis = visible(text);
  const steps = getSteps(text, depth);
  const colors = palette();

  let vi = 0;

  return chars.map(ch => {
    if(ch === " ") return { ch, hex: null };

    let hex;

    if(colors.length >= steps){
      const colorIndex = steps <= 1 ? 0 : Math.min(Math.floor(factor(vi, vis.length, steps) * (steps - 1)), steps - 1);
      hex = colors[colorIndex];
    } else {
      const f = factor(vi, vis.length, steps);
      hex = getColorAtFactor(colors, f);
    }

    vi++;

    return { ch, hex };
  });
}

export function build(text, depth){
  let out = "";
  let last = null;

  for(const { ch, hex } of parts(text, depth)){
    if(ch === " "){
      out += " ";
      continue;
    }

    if(hex !== last){
      out += `<${hex}>`;
      last = hex;
    }

    out += ch;
  }

  return out;
}
