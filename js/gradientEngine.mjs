import { hexToRgb, interpolateColor, rgbToHex } from "./gradient.mjs";
import { state } from "./state.mjs";

function visible(text){
  return [...text].filter(c => c !== " ");
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

export function parts(text, depth){
  const a = hexToRgb(state.c1);
  const b = hexToRgb(state.c2);

  const chars = [...text];
  const vis = visible(text);
  const steps = getSteps(text, depth);

  let vi = 0;

  return chars.map(ch => {
    if(ch === " ") return { ch, hex: null };

    const f = factor(vi, vis.length, steps);
    const col = interpolateColor(a, b, f);

    const hex = rgbToHex(col.r, col.g, col.b);
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