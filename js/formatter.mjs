export function compactOutput(text) {
  const active = new Map();
  return String(text).replace(/<([^>]+)>/g, (tag, body) => {
    if (body.startsWith('/')) return '';
    const [name] = body.split('=');
    const key = body.startsWith('#') ? 'color' : name.toLowerCase();
    // These tags insert content or move the cursor each time they occur.
    if (['space', 'br', 'page', 'pos'].includes(key)) return tag;
    const value = body.toLowerCase();
    if (active.get(key) === value) return '';
    active.set(key, value);
    return tag;
  });
}

function wrapStyle(text, enabled, openTag, closeTag) {
  if (!enabled) return text;
  return `${openTag}${text}${closeTag}`;
}

function insertUnderlineInsideFirstColor(text) {
  const colorTag = /(<#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?>)/;

  if (!colorTag.test(text)) {
    return `<u>${text}</u>`;
  }

  return `${text.replace(colorTag, "$1<u>")}</u>`;
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return Math.max(min, Math.min(max, number));
}

function pxToEm(value) {
  const px = clampNumber(value, -80, 80);
  if (px === "") return "";
  return +(px / 16).toFixed(3);
}

function clampEm(value, min, max) {
  const number = clampNumber(value, min, max);
  if (number === "") return "";
  return +number.toFixed(2);
}

function pastedRotate(value) {
  const number = clampNumber(value, -360, 360);
  if (number === "") return "";
  return Object.is(number, -0) ? 0 : number;
}

export function applyStyles(text, effects = {}) {
  let result = text;
  const caseTags = new Set(["smallcaps", "lowercase", "uppercase"]);

  if (effects.underline) {
    result = insertUnderlineInsideFirstColor(result);
  }

  result = wrapStyle(result, hasValue(effects.space), `<space=${clampEm(effects.space, 0, 32)}em>`, "");
  result = wrapStyle(result, effects.markEnabled, `<mark=${effects.mark || "#FFFF00"}>`, "</mark>");
  result = wrapStyle(result, hasValue(effects.voffset), `<voffset=${clampNumber(effects.voffset, -5, 5)}em>`, "</voffset>");
  result = wrapStyle(result, hasValue(effects.rotate), `<rotate=${pastedRotate(effects.rotate)}>`, "</rotate>");
  result = wrapStyle(result, hasValue(effects.lineHeight), `<line-height=${clampNumber(effects.lineHeight, 1, 300)}%>`, "</line-height>");
  result = wrapStyle(result, hasValue(effects.width), `<width=${clampNumber(effects.width, 1, 100)}%>`, "</width>");
  result = wrapStyle(result, hasValue(effects.margin), `<margin=${clampNumber(effects.margin, 0, 500)}>`, "</margin>");
  result = wrapStyle(result, hasValue(effects.lineIndent), `<line-indent=${clampNumber(effects.lineIndent, -500, 500)}>`, "</line-indent>");
  result = wrapStyle(result, hasValue(effects.indent), `<indent=${clampNumber(effects.indent, -500, 500)}>`, "</indent>");
  result = wrapStyle(result, hasValue(effects.pos), `<pos=${clampNumber(effects.pos, -500, 500)}>`, "</pos>");
  result = wrapStyle(result, effects.align, `<align=${effects.align}>`, "</align>");
  result = wrapStyle(result, hasValue(effects.mspace), `<mspace=${Math.max(0, pxToEm(effects.mspace))}em>`, "</mspace>");
  result = wrapStyle(result, hasValue(effects.cspace), `<cspace=${pxToEm(effects.cspace)}em>`, "</cspace>");
  result = wrapStyle(result, caseTags.has(effects.caseEffect), `<${effects.caseEffect}>`, `</${effects.caseEffect}>`);
  result = wrapStyle(result, effects.subscript, "<sub>", "</sub>");
  result = wrapStyle(result, effects.superscript, "<sup>", "</sup>");
  result = wrapStyle(result, effects.strike, "<s>", "</s>");
  result = wrapStyle(result, effects.italic, "<i>", "</i>");
  result = wrapStyle(result, effects.bold, "<b>", "</b>");
  result = wrapStyle(result, hasValue(effects.size), `<size=${clampNumber(effects.size, 1, 300)}%>`, "</size>");
  result = wrapStyle(result, effects.font === "LiberationSans SDF", '<font="LiberationSans SDF">', "</font>");
  result = wrapStyle(result, ["Title", "H1", "H2"].includes(effects.namedStyle), `<style="${effects.namedStyle}">`, "</style>");

  return result;
}
