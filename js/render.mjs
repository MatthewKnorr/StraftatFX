function escapeHtml(value){
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseTag(rawTag){
  const [name, ...rest] = rawTag.split("=");
  return {
    name: name.trim(),
    value: rest.join("=").trim()
  };
}

function parseAlpha(value){
  const raw = String(value || "").replace(/^#/, "");
  const parsed = parseInt(raw.slice(0, 2), 16);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed / 255)) : 1;
}

function numericValue(value){
  const parsed = parseFloat(String(value || "").replace(/[%a-z]/gi, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function signedIndentStyle(value){
  const amount = numericValue(value);
  if (!amount) return "";
  return amount < 0 ? `transform:translateX(${amount}px);` : `padding-left:${amount}px;`;
}

function cssLength(value, fallbackUnit = "px"){
  const raw = String(value || "").trim();
  const parsed = numericValue(raw);
  if (parsed === null) return `0${fallbackUnit}`;
  if (/em$/i.test(raw)) return `${parsed}em`;
  if (/%$/i.test(raw)) return `${parsed}%`;
  if (/px$/i.test(raw)) return `${parsed}px`;
  return `${parsed}${fallbackUnit}`;
}

function renderTag(rawTag, color, closing = false){
  return `<span style="color:${color || "#fff"};opacity:.6">&lt;${closing ? "/" : ""}${escapeHtml(rawTag)}&gt;</span>`;
}

function renderGeneratedGap(value){
  const length = cssLength(value, "em");
  return `<span class="output-generated-space" style="width:${length}" title="generated space ${escapeHtml(value)}"></span>`;
}

export function renderFormattedOutput(raw, { showTags = true } = {}){
  let html = "";
  let paragraphStyle = null;
  function appendVisible(markup, style) {
    if (showTags) { html += markup; return; }
    if (style !== paragraphStyle) {
      if (paragraphStyle !== null) html += '</span>';
      html += `<span class="rich-text-line" style="display:block;${style}">`;
      paragraphStyle = style;
    }
    html += markup;
  }
  let color = null;
  let bold = false;
  let italic = false;
  let underline = false;
  let strike = false;
  let superscript = false;
  let subscript = false;
  let caseEffect = "";
  let cspace = "";
  let mspace = "";
  let align = "";
  let pos = "";
  let indent = "";
  let lineIndent = "";
  let margin = "";
  let contentWidth = "";
  let lineHeight = "";
  let rotate = "";
  let voffset = "";
  let mark = "";
  let alpha = "";
  let size = "";
  let fontWeight = "";
  let font = "";
  let namedStyle = "";
  const layoutStyle = () => [
    `text-align:${['left', 'center', 'right', 'justified'].includes(align) ? (align === 'justified' ? 'justify' : align) : 'left'};`,
    contentWidth ? `width:${numericValue(contentWidth) || 100}%;` : '',
    pos ? `margin-left:${numericValue(pos) || 0}px;` : '',
    indent ? signedIndentStyle(indent) : '',
    lineIndent ? `text-indent:${numericValue(lineIndent) || 0}px;` : '',
    margin ? `margin-inline:${numericValue(margin) || 0}px;` : '',
    lineHeight ? `line-height:${numericValue(lineHeight) || 100}%;` : ''
  ].join('');
  const tagStacks = new Map();
  const tagStyle = "opacity:.6";

  const regex = /<(#?[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?)>|<(\/?)([^>]+)>|([\s\S])/gu;
  let match;

  while((match = regex.exec(raw))){
    if(match[1]){
      color = match[1];
      if (showTags) html += `<span style="color:${color};${tagStyle}">&lt;${escapeHtml(color)}&gt;</span>`;
    } else if(match[3]){
      const isClosing = match[2] === "/";
      const parsed = parseTag(match[3]);
      const tagName = parsed.name;
      const stack = tagStacks.get(tagName) || [];
      if (isClosing) stack.pop(); else stack.push(parsed.value);
      tagStacks.set(tagName, stack);
      const closing = stack.length === 0;
      const value = stack.at(-1) || "";

      if(tagName === "b") bold = !closing;
      if(tagName === "i") italic = !closing;
      if(tagName === "u") underline = !closing;
      if(tagName === "s") strike = !closing;
      if(tagName === "sup") superscript = !closing;
      if(tagName === "sub") subscript = !closing;
      if(["allcaps", "uppercase", "smallcaps", "lowercase"].includes(tagName)) caseEffect = closing ? "" : tagName;
      if(tagName === "cspace") cspace = closing ? "" : value;
      if(tagName === "mspace") mspace = closing ? "" : value;
      if(tagName === "align") align = closing ? "" : value;
      if(tagName === "pos") pos = closing ? "" : value;
      if(tagName === "indent") indent = closing ? "" : value;
      if(tagName === "line-indent") lineIndent = closing ? "" : value;
      if(tagName === "margin") margin = closing ? "" : value;
      if(tagName === "width") contentWidth = closing ? "" : value;
      if(tagName === "line-height") lineHeight = closing ? "" : value;
      if(tagName === "rotate") rotate = closing ? "" : value;
      if(tagName === "voffset") voffset = closing ? "" : value;
      if(tagName === "mark") mark = closing ? "" : value;
      if(tagName === "alpha") alpha = closing ? "" : value;
      if(tagName === "size") size = closing ? "" : value;
      if(tagName === "font-weight") fontWeight = closing ? "" : value;
      if(tagName === "font") font = closing ? "" : value.replaceAll('"', "");
      if(tagName === "style") namedStyle = closing ? "" : value.replaceAll('"', "");
      if (!isClosing && showTags) html += renderTag(match[3], color);

      if(!closing && tagName === "space"){
        appendVisible(renderGeneratedGap(value), layoutStyle());
      }

    } else {
      if (match[4] === " ") {
        appendVisible('<span class="plain-text-space"> </span>', paragraphStyle ?? layoutStyle());
        continue;
      }
      const decoration = [underline ? "underline" : "", strike ? "line-through" : ""].filter(Boolean).join(" ") || "none";
      const vertical = superscript
        ? "font-size:0.65em;vertical-align:super;"
        : subscript
          ? "font-size:0.65em;vertical-align:sub;"
          : "";
      const pastedAngle = numericValue(rotate) || 0;
      const transform = rotate ? `transform:rotate(${-pastedAngle}deg);` : "";
      const offset = voffset ? `position:relative;top:${-(numericValue(voffset) || 0)}em;` : "";
      const textTransform = caseEffect === "uppercase" || caseEffect === "allcaps"
        ? "uppercase"
        : caseEffect === "lowercase"
          ? "lowercase"
          : "none";
      const fontVariant = caseEffect === "smallcaps" ? "small-caps" : "normal";
      const spacing = cspace ? `letter-spacing:${numericValue(cspace) || 0}em;` : "";
      const monospace = font === "LiberationSans SDF" ? 'font-family:&quot;Liberation Sans&quot;,Arial,sans-serif;' : mspace ? "font-family:monospace;" : "";
      const monoWidth = mspace ? `width:${numericValue(mspace) || 0}em;min-width:${numericValue(mspace) || 0}em;text-align:center;` : "";
      const line = lineHeight ? `line-height:${numericValue(lineHeight) || 100}%;` : "";
      const opacity = alpha ? `opacity:${parseAlpha(alpha)};` : "";
      const background = mark ? `background:${mark};` : "";
      const namedSize = {Title: 150, H1: 135, H2: 120}[namedStyle];
      const sizeStyle = size || namedSize ? `font-size:${size ? numericValue(size) || 100 : namedSize}%;` : "";
      const weight = fontWeight || (bold || namedSize ? "700" : "400");
      const layout = `${transform}${offset}${monoWidth}display:inline-block;`;
      const blockStyle = [
        align || contentWidth || pos || indent || lineIndent || margin ? "display:inline-block;" : "",
        align ? `text-align:${align};` : "",
        contentWidth ? `width:${numericValue(contentWidth) || 100}%;` : "",
        pos ? `margin-left:${numericValue(pos) || 0}px;` : "",
        indent ? signedIndentStyle(indent) : "",
        lineIndent ? `text-indent:${numericValue(lineIndent) || 0}px;` : "",
        margin ? `margin-inline:${numericValue(margin) || 0}px;` : ""
      ].join("");
      const displayChar = escapeHtml(match[4]);
      appendVisible(`<span style="${showTags ? blockStyle : ''}"><span style="color:${color || "#fff"};font-weight:${weight};font-style:${italic ? "italic" : "normal"};text-decoration-line:${decoration};text-decoration-thickness:1.5px;text-decoration-skip-ink:none;white-space:pre-wrap;text-transform:${textTransform};font-variant:${fontVariant};${spacing}${monospace}${line}${opacity}${background}${sizeStyle}${vertical}${layout}">${displayChar}</span></span>`, layoutStyle());
    }
  }

  return html + (paragraphStyle !== null ? '</span>' : '');
}

export function renderRichPreview(preview, raw) {
  Object.assign(preview.style, {
    fontWeight: "400", fontStyle: "normal", textDecoration: "none",
    textTransform: "none", fontVariant: "normal", letterSpacing: "normal",
    lineHeight: "", opacity: "1", background: "", textAlign: "left",
    fontFamily: "", marginLeft: "", transform: "", paddingLeft: "",
    marginRight: "", width: "", textIndent: ""
  });
  preview.innerHTML = renderFormattedOutput(raw, { showTags: false });
}
