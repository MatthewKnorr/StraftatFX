export function renderFormattedOutput(raw){
  let html = "";
  let color = null;
  let bold = false;
  let italic = false;
  let underline = false;
  let superscript = false;
  const tagStyle = "opacity:.6";

  const regex = /<(#?[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?)>|<(\/?)(b|i|u|sup)>|(.)/g;
  let match;

  while((match = regex.exec(raw))){
    if(match[1]){
      color = match[1];
      html += `<span style="color:${color};${tagStyle}">&lt;${color}&gt;</span>`;
    } else if(match[3]){
      const closing = match[2] === "/";
      if(match[3] === "b") bold = !closing;
      if(match[3] === "i") italic = !closing;
      if(match[3] === "u") underline = !closing;
      if(match[3] === "sup") superscript = !closing;
      html += `<span style="color:${color || "#fff"};${tagStyle}">&lt;${closing ? "/" : ""}${match[3]}&gt;</span>`;
    } else {
      html += `<span style="color:${color || "#fff"};font-weight:${bold ? "700" : "400"};font-style:${italic ? "italic" : "normal"};text-decoration:${underline ? "underline" : "none"};${superscript ? "font-size:0.65em;vertical-align:super;" : ""}">${match[4] === " " ? "&nbsp;" : match[4]}</span>`;
    }
  }

  return html;
}

export function renderPreview(preview, parts, styles){
  preview.innerHTML = "";

  preview.style.fontWeight = styles.bold ? "700" : "400";
  preview.style.fontStyle = styles.italic ? "italic" : "normal";
  preview.style.textDecoration = styles.underline ? "underline" : "none";

  for(const { ch, hex } of parts){
    const s = document.createElement("span");
    s.textContent = ch;

    if(hex) s.style.color = hex;

    if(styles.superscript){
      s.style.fontSize = "0.65em";
      s.style.verticalAlign = "super";
    }

    preview.appendChild(s);
  }
}
