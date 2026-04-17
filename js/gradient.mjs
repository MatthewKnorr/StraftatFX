export function normalizeHex(hex) {
  const raw = String(hex || "").trim().replace(/^#/, "").toUpperCase();

  if (raw.length === 3) {
    return `#${raw}`;
  }

  if (raw.length === 6) {
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

export function randomHex(){
  return normalizeHex("#" + Math.floor(Math.random()*16777215).toString(16).padStart(6,"0"));
}
