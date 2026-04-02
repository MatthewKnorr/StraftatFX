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
  if (underline) {
    open += "<u>";
    close = "</u>" + close;
  }
  if (superscript) {
    open += "<sup>";
    close = "</sup>" + close;
  }

  return open + text + close;
}