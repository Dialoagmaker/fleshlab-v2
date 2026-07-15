export const COVER_FORMATS = [
  { id: "landscape", label: "16:9 Landscape", width: 1920, height: 1080 },
  { id: "post", label: "4:5 Promotional Post", width: 1080, height: 1350 },
  { id: "square", label: "1:1 Square", width: 1080, height: 1080 },
  { id: "story", label: "9:16 Story", width: 1080, height: 1920 },
  { id: "custom", label: "Custom", width: 1600, height: 900 },
];

export const COVER_PRESETS = [
  { id: "cinematic", label: "FLESHLAB Cinematic", red: "#cf163f", charcoal: "#070707", stroke: "#8f102c" },
  { id: "wild", label: "Into the Wild", red: "#b91532", charcoal: "#0b0907", stroke: "#7f2d12" },
  { id: "bts", label: "Behind the Scenes", red: "#d62839", charcoal: "#101010", stroke: "#444444" },
  { id: "premium", label: "Premium Release", red: "#e11d48", charcoal: "#030303", stroke: "#b8860b" },
  { id: "summer", label: "Summer Heat", red: "#ef233c", charcoal: "#120707", stroke: "#f97316" },
  { id: "raw", label: "Raw Amateur", red: "#c1121f", charcoal: "#080808", stroke: "#5a5a5a" },
  { id: "fan", label: "Fan Favorite", red: "#db1748", charcoal: "#09070c", stroke: "#7c3aed" },
  { id: "exclusive", label: "Exclusive Premiere", red: "#f31245", charcoal: "#020202", stroke: "#ffffff" },
];

export const DEFAULT_COVER_SETTINGS = {
  formatId: "landscape",
  customWidth: 1600,
  customHeight: 900,
  presetId: "cinematic",
  zoom: 1.08,
  x: 0,
  y: 0,
  brightness: 100,
  contrast: 108,
  saturation: 104,
  titleSize: 118,
  subtitleSize: 64,
  titleY: 44,
  gradientStrength: 78,
  logoPosition: "top-left",
  borderTexture: 65,
  safeMargin: 7,
  sellingPoints: "REAL MOMENTS\nRAW & AUTHENTIC\nEXCLUSIVE CONTENT",
  showSafeMargins: true,
};

export function getCoverDimensions(settings) {
  const format = COVER_FORMATS.find(item => item.id === settings.formatId) || COVER_FORMATS[0];
  if (format.id !== "custom") return { width: format.width, height: format.height, label: format.label };
  return { width: Math.max(320, Number(settings.customWidth) || 1600), height: Math.max(320, Number(settings.customHeight) || 900), label: "Custom" };
}

export async function blobToCanvasImage(blob) {
  if (window.createImageBitmap) return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = reject;
    image.src = url;
  });
}

function seededNoise(index) {
  const value = Math.sin(index * 999.123) * 10000;
  return value - Math.floor(value);
}

function drawCoverImage(ctx, image, rect, settings) {
  const iw = image.width;
  const ih = image.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * Number(settings.zoom || 1);
  const sw = rect.w / scale;
  const sh = rect.h / scale;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) / 2 - Number(settings.x || 0) * iw * 0.004));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) / 2 - Number(settings.y || 0) * ih * 0.004));
  ctx.save();
  ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
  ctx.drawImage(image, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  let line = "";
  let drawn = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + drawn * lineHeight);
      drawn += 1;
      line = word;
      if (drawn >= maxLines) return drawn;
    } else {
      line = test;
    }
  }
  if (line && drawn < maxLines) {
    ctx.fillText(line, x, y + drawn * lineHeight);
    drawn += 1;
  }
  return drawn;
}

function drawLogo(ctx, width, height, preset, settings, margin) {
  const x = settings.logoPosition === "top-right" ? width - margin : margin;
  const align = settings.logoPosition === "top-right" ? "right" : "left";
  ctx.textAlign = align;
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.max(32, width * 0.038)}px Impact, Arial Black, sans-serif`;
  ctx.fillText("FLESHLAB", x, margin + height * 0.035);
  ctx.fillStyle = preset.red;
  ctx.font = `800 ${Math.max(14, width * 0.014)}px Arial Black, sans-serif`;
  ctx.fillText("AMATEUR WINS.", x, margin + height * 0.07);
}

function drawTexture(ctx, width, height, preset, strength) {
  const count = Math.round((Number(strength || 0) / 100) * 90);
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = preset.stroke;
  ctx.lineWidth = Math.max(3, width * 0.004);
  for (let i = 0; i < count; i += 1) {
    const edge = i % 4;
    const n = seededNoise(i + width + height);
    ctx.beginPath();
    if (edge === 0) { ctx.moveTo(n * width, 0); ctx.lineTo(n * width + width * 0.12, height * 0.025); }
    if (edge === 1) { ctx.moveTo(width, n * height); ctx.lineTo(width - width * 0.12, n * height + height * 0.04); }
    if (edge === 2) { ctx.moveTo(n * width, height); ctx.lineTo(n * width - width * 0.08, height - height * 0.035); }
    if (edge === 3) { ctx.moveTo(0, n * height); ctx.lineTo(width * 0.11, n * height - height * 0.035); }
    ctx.stroke();
  }
  ctx.restore();
}

function getImageRect(width, height) {
  const vertical = height > width * 1.15;
  const squareish = Math.abs(width - height) < width * 0.15;
  if (vertical) return { x: 0, y: Math.round(height * 0.19), w: width, h: Math.round(height * 0.55) };
  if (squareish) return { x: Math.round(width * 0.31), y: 0, w: Math.round(width * 0.69), h: height };
  return { x: Math.round(width * 0.36), y: 0, w: Math.round(width * 0.64), h: height };
}

export async function renderCoverToCanvas(canvas, frameBlob, metadata, settings) {
  const preset = COVER_PRESETS.find(item => item.id === settings.presetId) || COVER_PRESETS[0];
  const { width, height } = getCoverDimensions(settings);
  const image = await blobToCanvasImage(frameBlob);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = preset.charcoal;
  ctx.fillRect(0, 0, width, height);

  const imageRect = getImageRect(width, height);
  drawCoverImage(ctx, image, imageRect, settings);

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, `rgba(0,0,0,${Number(settings.gradientStrength || 70) / 100})`);
  gradient.addColorStop(0.46, `rgba(0,0,0,${Number(settings.gradientStrength || 70) / 150})`);
  gradient.addColorStop(1, "rgba(0,0,0,0.05)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const margin = Math.round(width * (Number(settings.safeMargin || 7) / 100));
  drawLogo(ctx, width, height, preset, settings, margin);

  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = width * 0.012;
  const vertical = height > width * 1.15;
  const textMax = imageRect.x > width * 0.2 ? imageRect.x - margin * 1.2 : width - margin * 2;
  const titlePercent = vertical && Number(settings.titleY || 44) === 44 ? 76 : Number(settings.titleY || 44);
  const titleY = Math.round(height * (titlePercent / 100));
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.max(30, Number(settings.titleSize || 110) * width / 1920)}px Impact, Arial Black, sans-serif`;
  const lines = drawWrappedText(ctx, metadata.performerName || "PERFORMER NAME", margin, titleY, textMax, Number(settings.titleSize || 110) * width / 1600, 2);
  ctx.fillStyle = preset.red;
  ctx.font = `900 ${Math.max(22, Number(settings.subtitleSize || 64) * width / 1920)}px Impact, Arial Black, sans-serif`;
  drawWrappedText(ctx, metadata.videoTitle || "VIDEO TITLE", margin, titleY + lines * Number(settings.titleSize || 110) * width / 1550 + height * 0.035, textMax, Number(settings.subtitleSize || 64) * width / 1500, 2);

  if (metadata.optionalSubtitle) {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = `700 ${Math.max(16, width * 0.016)}px Arial, sans-serif`;
    ctx.fillText(metadata.optionalSubtitle, margin, titleY + height * 0.25);
  }

  const barH = Math.max(58, height * 0.075);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.fillRect(0, height - barH, width, barH);
  ctx.fillStyle = preset.red;
  ctx.fillRect(0, height - barH, width, Math.max(4, height * 0.006));
  const points = String(settings.sellingPoints || "").split(/\n|,/).map(item => item.trim()).filter(Boolean).slice(0, 3);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.max(14, width * 0.014)}px Arial Black, sans-serif`;
  points.forEach((point, index) => ctx.fillText(`◆ ${point.toUpperCase()}`, margin + index * (width - margin * 2) / 3, height - barH / 2 + width * 0.006));

  drawTexture(ctx, width, height, preset, settings.borderTexture);
  return canvas;
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Cover export failed")), type, quality));
}