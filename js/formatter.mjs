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

export function applyStyles(text, { bold, italic, underline, superscript }) {
  let result = text;

  if (underline) {
    result = insertUnderlineInsideFirstColor(result);
  }

  result = wrapStyle(result, superscript, "<sup>", "</sup>");
  result = wrapStyle(result, italic, "<i>", "</i>");
  result = wrapStyle(result, bold, "<b>", "</b>");

  return result;
}
