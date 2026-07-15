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
  const logoW = Math.max(250, width * 0.265);
  const logoH = Math.max(58, height * 0.078);
  const x = margin;
  const y = margin;
  ctx.save();
  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeRect(x, y, logoW, logoH);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x, y, logoW, logoH);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${logoH * 0.63}px Impact, Arial Black, sans-serif`;
  ctx.fillText("FLESH", x + logoW * 0.05, y + logoH * 0.72);
  const fleshW = ctx.measureText("FLESH").width;
  ctx.fillStyle = preset.red;
  ctx.fillText("LAB", x + logoW * 0.05 + fleshW, y + logoH * 0.72);
  ctx.fillStyle = preset.red;
  ctx.font = `800 ${Math.max(14, width * 0.014)}px Arial Black, sans-serif`;
  ctx.letterSpacing = `${Math.max(4, width * 0.006)}px`;
  ctx.fillText("AMATEUR WINS.", x + logoW * 0.01, y + logoH + height * 0.045);
  ctx.restore();
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
  if (vertical) return { x: Math.round(width * 0.3), y: Math.round(height * 0.08), w: Math.round(width * 0.7), h: Math.round(height * 0.76) };
  if (squareish) return { x: Math.round(width * 0.36), y: 0, w: Math.round(width * 0.64), h: height };
  return { x: Math.round(width * 0.42), y: 0, w: Math.round(width * 0.58), h: height };
}

function drawLeftPanel(ctx, width, height, preset, imageRect, settings) {
  const panelW = imageRect.x + width * 0.11;
  ctx.save();
  const panelGradient = ctx.createLinearGradient(0, 0, panelW, 0);
  panelGradient.addColorStop(0, "rgba(0,0,0,0.98)");
  panelGradient.addColorStop(0.58, "rgba(0,0,0,0.92)");
  panelGradient.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = panelGradient;
  ctx.fillRect(0, 0, panelW, height);
  ctx.globalAlpha = Math.min(0.5, Number(settings.borderTexture || 60) / 150);
  ctx.fillStyle = preset.red;
  for (let i = 0; i < 18; i += 1) {
    const y = seededNoise(i + 77) * height;
    const h = Math.max(5, height * 0.008);
    ctx.save();
    ctx.translate(width * 0.02 + seededNoise(i) * width * 0.08, y);
    ctx.rotate((-8 + seededNoise(i + 5) * 16) * Math.PI / 180);
    ctx.fillRect(0, 0, width * (0.15 + seededNoise(i + 9) * 0.28), h);
    ctx.restore();
  }
  ctx.restore();
}

function drawCampaignLabel(ctx, text, x, y, width, preset) {
  if (!text) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-1.5 * Math.PI / 180);
  ctx.fillStyle = preset.red;
  ctx.fillRect(0, 0, width, Math.max(32, width * 0.07));
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.max(18, width * 0.04)}px Arial Black, sans-serif`;
  ctx.fillText(String(text).toUpperCase(), width * 0.06, width * 0.052);
  ctx.restore();
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
  drawLeftPanel(ctx, width, height, preset, imageRect, settings);

  const vignette = ctx.createRadialGradient(width * 0.78, height * 0.42, height * 0.08, width * 0.78, height * 0.42, width * 0.7);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.68)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const margin = Math.round(width * (Number(settings.safeMargin || 7) / 100));
  drawLogo(ctx, width, height, preset, settings, margin);

  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = width * 0.014;
  const vertical = height > width * 1.15;
  const textMax = Math.max(width * 0.34, imageRect.x - margin * 0.65);
  const titlePercent = vertical ? Math.max(34, Number(settings.titleY || 44)) : Number(settings.titleY || 44);
  const titleY = Math.round(height * (titlePercent / 100));
  const label = metadata.campaignName || metadata.contentType || metadata.optionalSubtitle;
  drawCampaignLabel(ctx, label, margin, titleY - height * 0.09, Math.min(textMax * 0.82, width * 0.34), preset);

  const titleSize = Math.max(34, Number(settings.titleSize || 118) * width / 1920);
  const subtitleSize = Math.max(24, Number(settings.subtitleSize || 64) * width / 1920);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${titleSize}px Impact, Arial Black, sans-serif`;
  const lines = drawWrappedText(ctx, metadata.performerName || "TITLE", margin, titleY, textMax, titleSize * 0.93, 2);
  ctx.fillStyle = preset.red;
  ctx.font = `900 ${subtitleSize}px Impact, Arial Black, sans-serif`;
  drawWrappedText(ctx, metadata.videoTitle || "SUBTITLE", margin, titleY + lines * titleSize * 0.92 + height * 0.035, textMax, subtitleSize * 1.02, 2);

  const underlineY = Math.min(height - height * 0.2, titleY + lines * titleSize + subtitleSize * 1.65);
  const underline = ctx.createLinearGradient(margin, 0, margin + textMax, 0);
  underline.addColorStop(0, preset.red);
  underline.addColorStop(0.7, "rgba(255,255,255,0.18)");
  underline.addColorStop(1, "rgba(255,255,255,0)");
  ctx.shadowBlur = width * 0.008;
  ctx.fillStyle = underline;
  ctx.fillRect(margin, underlineY, textMax, Math.max(3, height * 0.006));

  const barH = Math.max(72, height * 0.105);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.88)";
  ctx.fillRect(0, height - barH, width, barH);
  ctx.fillStyle = preset.red;
  ctx.fillRect(0, height - barH, width, Math.max(5, height * 0.007));
  const points = String(settings.sellingPoints || "").split(/\n|,/).map(item => item.trim()).filter(Boolean).slice(0, 3);
  ctx.font = `800 ${Math.max(13, width * 0.013)}px Arial Black, sans-serif`;
  points.forEach((point, index) => {
    const x = margin + index * (width - margin * 2) / 3;
    ctx.strokeStyle = preset.red;
    ctx.lineWidth = Math.max(2, width * 0.002);
    ctx.strokeRect(x, height - barH * 0.58, barH * 0.23, barH * 0.23);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(point.toUpperCase(), x + barH * 0.34, height - barH * 0.36);
    if (index > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x - width * 0.035, height - barH * 0.7, 2, barH * 0.48);
    }
  });

  drawTexture(ctx, width, height, preset, settings.borderTexture);
  return canvas;
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Cover export failed")), type, quality));
}