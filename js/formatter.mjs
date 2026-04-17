export function applyStyles(text, { bold, italic, underline, superscript }) {
  let open = "";
  let close = "";

  if (bold) {
    open += "<b>";
    close = "</b>" + close;
  }
  if (italic) {
    open += "<i>";
    close = "</i>" + close;
  }
  if (superscript) {
    open += "<sup>";
    close = "</sup>" + close;
  }

  let result = open + text + close;

  if (underline) {
    const colorTag = /(<#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?>)/;
    if (colorTag.test(result)) {
      const bodyWithUnderline = (open + text).replace(colorTag, "$1<u>");
      result = bodyWithUnderline + "</u>" + close;
    } else {
      result = "<u>" + result + "</u>";
    }
  }

  return result;
}
