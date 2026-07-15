const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";

export const COVER_FORMATS = [
  { id: "landscape", label: "16:9 Landscape", width: 1920, height: 1080 },
  { id: "post", label: "4:5 Promotional Post", width: 1080, height: 1350 },
  { id: "square", label: "1:1 Square", width: 1080, height: 1080 },
  { id: "story", label: "9:16 Story", width: 1080, height: 1920 },
  { id: "custom", label: "Custom", width: 1600, height: 900 },
];

export const COVER_PRESETS = [
  { id: "cinematic", label: "FLESHLAB Master", red: "#d00012", charcoal: "#030303", stroke: "#7a000b" },
  { id: "raw", label: "FLESHLAB Red", red: "#d00012", charcoal: "#030303", stroke: "#7a000b" },
  { id: "premium", label: "FLESHLAB Premium", red: "#d00012", charcoal: "#030303", stroke: "#7a000b" },
];

export const DEFAULT_COVER_SETTINGS = {
  formatId: "landscape",
  customWidth: 1600,
  customHeight: 900,
  presetId: "cinematic",
  zoom: 1.54,
  x: 0,
  y: 0,
  brightness: 103,
  contrast: 118,
  saturation: 105,
  titleSize: 210,
  subtitleSize: 132,
  titleY: 48,
  gradientStrength: 94,
  logoPosition: "top-left",
  borderTexture: 58,
  safeMargin: 7,
  sellingPoints: "REAL MOMENTS\nRAW & AUTHENTIC\nEXCLUSIVE CONTENT",
  showSafeMargins: false,
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

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Official logo asset could not be loaded"));
    image.src = src;
  });
}

function seededNoise(index) {
  const value = Math.sin(index * 999.123) * 10000;
  return value - Math.floor(value);
}

function fontBebas(size, weight = 900) {
  return `${weight} ${size}px "Bebas Neue", Impact, "Arial Black", sans-serif`;
}

function fontBrush(size) {
  return `900 ${size}px "Permanent Marker", Impact, "Arial Black", sans-serif`;
}

function drawBase(ctx, width, height, preset) {
  ctx.fillStyle = preset.charcoal;
  ctx.fillRect(0, 0, width, height);
}

function drawPerformerPhoto(ctx, image, width, height, settings) {
  if (!image) return;

  const iw = image.width;
  const ih = image.height;
  const scale = Math.max(width / iw, height / ih) * Number(settings.zoom || 1.54);
  const sw = width / scale;
  const sh = height / scale;
  const focusX = 0.63 - Number(settings.x || 0) * 0.004;
  const focusY = 0.4 - Number(settings.y || 0) * 0.004;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * focusX));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * focusY));

  ctx.save();
  ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  ctx.restore();
}

function drawBeachEscapePanel(ctx, width, height, preset, settings) {
  const panelW = width * 0.42;
  const strength = Math.min(0.98, Math.max(0.82, Number(settings.gradientStrength || 94) / 100));

  const panel = ctx.createLinearGradient(0, 0, width * 0.62, 0);
  panel.addColorStop(0, `rgba(0,0,0,${strength})`);
  panel.addColorStop(0.42, `rgba(0,0,0,${strength * 0.98})`);
  panel.addColorStop(0.68, "rgba(0,0,0,0.72)");
  panel.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = panel;
  ctx.fillRect(0, 0, width * 0.66, height);

  const edge = ctx.createLinearGradient(panelW * 0.82, 0, panelW * 1.18, 0);
  edge.addColorStop(0, "rgba(208,0,18,0.04)");
  edge.addColorStop(0.52, "rgba(208,0,18,0.13)");
  edge.addColorStop(1, "rgba(208,0,18,0)");
  ctx.fillStyle = edge;
  ctx.fillRect(panelW * 0.74, 0, panelW * 0.5, height);

  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 34; i += 1) {
    const x = width * (0.025 + seededNoise(i) * 0.34);
    const y = height * (0.12 + seededNoise(i + 5) * 0.64);
    ctx.strokeStyle = i % 3 === 0 ? preset.red : "rgba(255,255,255,0.22)";
    ctx.lineWidth = i % 3 === 0 ? width * 0.003 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width * (0.04 + seededNoise(i + 20) * 0.13), y + height * (-0.025 + seededNoise(i + 30) * 0.05));
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 180; i += 1) {
    const x = width * seededNoise(i + 70);
    const y = height * seededNoise(i + 170);
    const s = seededNoise(i + 270) > 0.88 ? 2 : 1;
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(width * 0.66, height * 0.44, height * 0.18, width * 0.66, height * 0.44, width * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.44)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

async function drawOfficialLogo(ctx, width, height) {
  const logo = await loadCanvasImage(OFFICIAL_LOGO_URL);
  const logoW = width * 0.142;
  const logoH = logoW * (logo.height / logo.width);
  const x = width * 0.062;
  const y = height * 0.07;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.86)";
  ctx.shadowBlur = width * 0.008;
  ctx.drawImage(logo, x, y, logoW, logoH);
  ctx.restore();
}

function resolvePosterText(metadata) {
  const rawTitle = String(metadata.videoTitle || "BEACH ESCAPE").trim().toUpperCase();
  const performer = String(metadata.performerName || "").trim().toUpperCase();
  const explicitSubtitle = String(metadata.optionalSubtitle || metadata.campaignName || "").trim().toUpperCase();

  if (rawTitle.includes("|")) {
    const [main, sub] = rawTitle.split("|").map(part => part.trim());
    return { title: main, subtitle: explicitSubtitle || sub || "", performer };
  }

  if (explicitSubtitle) return { title: rawTitle, subtitle: explicitSubtitle, performer };

  const words = rawTitle.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { title: rawTitle, subtitle: "", performer };
  return { title: words.slice(0, -1).join(" "), subtitle: words[words.length - 1], performer };
}

function fitFont(ctx, text, maxWidth, startSize, minSize, fontFactory) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = fontFactory(size);
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 4;
  }
  return minSize;
}

function drawDistressedText(ctx, text, x, y, size, maxWidth) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.96)";
  ctx.shadowBlur = size * 0.08;
  ctx.lineWidth = Math.max(2, size * 0.018);
  ctx.strokeStyle = "rgba(0,0,0,0.62)";
  ctx.fillStyle = "#f2f2f2";
  ctx.font = fontBebas(size);
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);

  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(1, size * 0.018);
  for (let i = 0; i < 20; i += 1) {
    const yy = y - size * (0.82 - seededNoise(i) * 0.68);
    ctx.beginPath();
    ctx.moveTo(x + seededNoise(i + 10) * maxWidth, yy);
    ctx.lineTo(x + seededNoise(i + 40) * maxWidth, yy + size * (-0.04 + seededNoise(i + 80) * 0.08));
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrackedText(ctx, text, centerX, y, spacing) {
  const chars = text.split("");
  const widths = chars.map(char => ctx.measureText(char).width);
  const total = widths.reduce((sum, value) => sum + value, 0) + Math.max(0, chars.length - 1) * spacing;
  let x = centerX - total / 2;
  chars.forEach((char, index) => {
    ctx.fillText(char, x, y);
    x += widths[index] + spacing;
  });
}

function drawTitleBlock(ctx, width, height, metadata, preset) {
  const { title, subtitle, performer } = resolvePosterText(metadata);
  const panelW = width * 0.42;
  const x = width * 0.058;
  const maxWidth = panelW * 0.78;
  const titleY = height * 0.45;
  const titleSize = fitFont(ctx, title, maxWidth, width * 0.15, width * 0.072, size => fontBebas(size));

  drawDistressedText(ctx, title, x, titleY, titleSize, maxWidth);

  let performerY = titleY + height * 0.18;
  if (subtitle) {
    const subtitleSize = fitFont(ctx, subtitle, maxWidth, width * 0.118, width * 0.06, size => fontBrush(size));
    const subY = titleY + titleSize * 0.78;
    ctx.save();
    ctx.translate(x, subY);
    ctx.rotate(-2.5 * Math.PI / 180);
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = width * 0.01;
    ctx.fillStyle = preset.red;
    ctx.font = fontBrush(subtitleSize);
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
    performerY = subY + subtitleSize * 0.7;
  }

  if (performer) {
    ctx.save();
    ctx.font = `700 ${width * 0.018}px Inter, Arial, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    drawTrackedText(ctx, performer, x + maxWidth * 0.5, performerY, width * 0.004);
    ctx.restore();
  }
}

function drawFooter(ctx, width, height, preset, settings) {
  const labels = String(settings.sellingPoints || "REAL MOMENTS\nRAW & AUTHENTIC\nEXCLUSIVE CONTENT")
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  while (labels.length < 3) labels.push(["REAL MOMENTS", "RAW & AUTHENTIC", "EXCLUSIVE CONTENT"][labels.length]);

  const panelW = width * 0.42;
  const baseY = height * 0.855;
  const startX = width * 0.086;
  const gap = panelW * 0.255;

  ctx.save();
  labels.forEach((label, index) => {
    const x = startX + index * gap;
    ctx.strokeStyle = preset.red;
    ctx.fillStyle = preset.red;
    ctx.lineWidth = Math.max(1.4, width * 0.0012);

    if (index === 0) {
      ctx.strokeRect(x - width * 0.009, baseY - height * 0.019, width * 0.018, height * 0.017);
      ctx.beginPath(); ctx.arc(x, baseY - height * 0.0105, width * 0.0038, 0, Math.PI * 2); ctx.stroke();
    } else if (index === 1) {
      ctx.strokeRect(x - width * 0.015, baseY - height * 0.018, width * 0.03, height * 0.018);
      ctx.font = `900 ${width * 0.0105}px Arial, sans-serif`;
      ctx.fillText("HD", x - width * 0.009, baseY - height * 0.0045);
    } else {
      ctx.strokeRect(x - width * 0.008, baseY - height * 0.013, width * 0.016, height * 0.017);
      ctx.beginPath(); ctx.arc(x, baseY - height * 0.015, width * 0.007, Math.PI, 0); ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = fontBebas(width * 0.0128, 400);
    const words = label.toUpperCase().split(" ");
    const first = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const second = words.slice(Math.ceil(words.length / 2)).join(" ");
    ctx.fillText(first, x - width * 0.029, baseY + height * 0.037);
    if (second) ctx.fillText(second, x - width * 0.029, baseY + height * 0.055);

    if (index > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(x - gap * 0.48, baseY - height * 0.035, 1, height * 0.072);
    }
  });
  ctx.restore();
}

export async function renderCoverToCanvas(canvas, frameBlob, metadata, settings) {
  const preset = COVER_PRESETS.find(item => item.id === settings.presetId) || COVER_PRESETS[0];
  const { width, height } = getCoverDimensions(settings);
  const image = frameBlob ? await blobToCanvasImage(frameBlob) : null;

  if (document?.fonts?.load) {
    await Promise.all([
      document.fonts.load("900 210px Bebas Neue"),
      document.fonts.load("900 132px Permanent Marker"),
    ]);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  drawBase(ctx, width, height, preset);
  drawPerformerPhoto(ctx, image, width, height, settings);
  drawBeachEscapePanel(ctx, width, height, preset, settings);
  await drawOfficialLogo(ctx, width, height);
  drawTitleBlock(ctx, width, height, metadata, preset, settings);
  drawFooter(ctx, width, height, preset, settings);

  return canvas;
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Cover export failed")), type, quality));
}