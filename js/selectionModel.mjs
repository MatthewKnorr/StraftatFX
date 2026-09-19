import { state } from "./state.mjs";
import { applyStyles } from "./formatter.mjs";
import { parts, compactHexTag, hexToRgb, interpolateColor, rgbToHex } from "./gradient.mjs";

export function textTokens(text) {
  return [...text.matchAll(/[\s\S]/gu)].map(match => ({
    ch: match[0], start: match.index, end: match.index + match[0].length
  }));
}

export class SelectionModel {
  text = "";
  marks = [];

  sync(text) {
    if (text === this.text) return;
    let left = 0;
    while (left < text.length && left < this.text.length && text[left] === this.text[left]) left++;
    let right = 0;
    while (right < text.length - left && right < this.text.length - left && text[text.length - 1 - right] === this.text[this.text.length - 1 - right]) right++;
    this.marks.splice(left, this.text.length - left - right, ...Array(text.length - left - right).fill(null));
    this.text = text;
  }

  selected(start, end) {
    return textTokens(this.text).filter(token => token.start < end && token.end > start);
  }

  patch(start, end, patch) {
    for (const token of this.selected(start, end)) {
      if (token.ch === " ") continue;
      const previous = this.marks[token.start] || {};
      const next = { ...previous, ...patch, effects: { ...previous.effects, ...patch.effects } };
      for (let i = token.start; i < token.end; i++) this.marks[i] = next;
    }
  }

  clear(start, end) {
    for (const token of this.selected(start, end)) this.marks.fill(null, token.start, token.end);
  }

  clearEffects(key = null) {
    for (const mark of new Set(this.marks)) {
      if (!mark) continue;
      if (key === null) mark.effects = {};
      else if (mark.effects) delete mark.effects[key];
      if (key === null || key === 'trueRandomEffects') delete mark.randomEffects;
      if (key === 'markEnabled' && mark.effects) delete mark.effects.mark;
    }
  }

  clearColors() {
    for (const mark of new Set(this.marks)) {
      if (mark) delete mark.hex;
    }
  }

  color(start, end, colors) {
    const tokens = this.selected(start, end).filter(token => token.ch !== " ");
    tokens.forEach((token, index) => {
      const position = index / Math.max(1, tokens.length - 1) * (colors.length - 1);
      const left = Math.floor(position), right = Math.min(left + 1, colors.length - 1);
      const rgb = interpolateColor(hexToRgb(colors[left]), hexToRgb(colors[right]), position - left);
      this.patch(token.start, token.end, { hex: compactHexTag(rgbToHex(rgb.r, rgb.g, rgb.b)) });
    });
  }

  compose(depth, globalEffects, globalRandom = [], previewColors = null, { maxLength = Infinity } = {}) {
    // Paragraph layout and unchanged font/style belong to the whole message.
    const outerEffects = {};
    for (const key of ['align', 'pos', 'indent', 'lineIndent', 'margin', 'width', 'lineHeight', 'space', 'font', 'namedStyle']) {
      if (!this.marks.some(mark => Object.hasOwn(mark?.effects || {}, key))) {
        outerEffects[key] = globalEffects[key];
      }
    }
    const tokens = textTokens(this.text);
    const gradient = parts(tokens.map(token => token.ch).join(""), depth, previewColors);
    let visibleIndex = 0;
    const rendered = tokens.map((token, index) => {
      const mark = this.marks[token.start] || {};
      const randomEffects = mark.randomEffects ?? globalRandom[visibleIndex] ?? [];
      if (token.ch !== " ") visibleIndex++;
      return { ...gradient[index], effects: { ...globalEffects, ...mark.effects }, hex: previewColors ? gradient[index].hex : mark.hex || gradient[index].hex, randomEffects };
    });
    const serialize = (includeRandom = true) => {
      let raw = "", run = "", lastKey = null, runEffects = {}, lastHex = null;
      const flush = () => {
        if (run) raw += applyStyles(run, runEffects);
        run = "";
        lastHex = null;
      };
      for (const part of rendered) {
        // Spaces stay outside all scoped effects.
        if (part.ch === " ") { flush(); raw += " "; lastKey = null; continue; }
        const key = JSON.stringify(part.effects);
        if (key !== lastKey) {
          flush();
          runEffects = { ...part.effects };
          for (const outerKey of Object.keys(outerEffects)) delete runEffects[outerKey];
          lastKey = key;
        }
        let value = part.ch;
        for (const fx of (includeRandom ? [...part.randomEffects].reverse() : [])) value = fx.open + value + fx.close;
        if (state.mode === 5 || part.hex !== lastHex) {
          run += `<${part.hex}>`;
          lastHex = part.hex;
        }
        run += value;
      }
      flush();
      return applyStyles(raw, outerEffects);
    };
    if (Number.isFinite(maxLength)) {
      let remaining = Math.max(0, maxLength - serialize(false).length);
      for (const part of rendered) {
        part.randomEffects = part.ch === ' ' ? [] : part.randomEffects.filter(fx => {
          const cost = fx.open.length + fx.close.length;
          if (cost > remaining) return false;
          remaining -= cost;
          return true;
        });
      }
    }
    return { raw: serialize(), parts: rendered };
  }

  get active() { return this.marks.some(Boolean); }
}

