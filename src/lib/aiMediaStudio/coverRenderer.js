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
  { id: "raw", label: "FLESHLAB Red", red: "#cf0018", charcoal: "#030303", stroke: "#620008" },
  { id: "premium", label: "FLESHLAB Premium", red: "#e11d2e", charcoal: "#030303", stroke: "#8b000e" },
];

export const DEFAULT_COVER_SETTINGS = {
  formatId: "landscape",
  customWidth: 1600,
  customHeight: 900,
  presetId: "cinematic",
  zoom: 1.2,
  x: 0,
  y: 0,
  brightness: 102,
  contrast: 114,
  saturation: 106,
  titleSize: 190,
  subtitleSize: 130,
  titleY: 52,
  gradientStrength: 90,
  logoPosition: "top-left",
  borderTexture: 42,
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
  const scale = Math.max(width / iw, height / ih) * Number(settings.zoom || 1.2);
  const sw = width / scale;
  const sh = height / scale;
  const focusX = 0.62 - Number(settings.x || 0) * 0.004;
  const focusY = 0.48 - Number(settings.y || 0) * 0.004;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * focusX));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * focusY));

  ctx.save();
  ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  ctx.restore();
}

function drawDarkGradient(ctx, width, height, settings) {
  const strength = Math.min(0.98, Math.max(0.62, Number(settings.gradientStrength || 90) / 100));
  const left = ctx.createLinearGradient(0, 0, width * 0.72, 0);
  left.addColorStop(0, `rgba(0,0,0,${strength})`);
  left.addColorStop(0.42, `rgba(0,0,0,${strength * 0.94})`);
  left.addColorStop(0.68, "rgba(0,0,0,0.50)");
  left.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, width * 0.76, height);

  const bottom = ctx.createLinearGradient(0, height * 0.68, 0, height);
  bottom.addColorStop(0, "rgba(0,0,0,0)");
  bottom.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, height * 0.58, width, height * 0.42);

  const vignette = ctx.createRadialGradient(width * 0.72, height * 0.42, height * 0.15, width * 0.72, height * 0.42, width * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawSubtleBrushLayer(ctx, width, height, preset, settings) {
  const strength = Math.round((Number(settings.borderTexture || 42) / 100) * 32);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = preset.stroke;
  ctx.lineWidth = Math.max(2, width * 0.002);
  for (let i = 0; i < strength; i += 1) {
    const x = width * (0.02 + seededNoise(i) * 0.46);
    const y = height * (0.08 + seededNoise(i + 6) * 0.72);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width * (0.04 + seededNoise(i + 12) * 0.18), y + height * (-0.015 + seededNoise(i + 18) * 0.03));
    ctx.stroke();
  }
  ctx.restore();
}

async function drawLogoAndClaim(ctx, width, height, preset) {
  const logo = await loadCanvasImage(OFFICIAL_LOGO_URL);
  const logoW = width * 0.29;
  const logoH = logoW * (logo.height / logo.width);
  const x = width * 0.075;
  const y = height * 0.065;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.82)";
  ctx.shadowBlur = width * 0.012;
  ctx.drawImage(logo, x, y, logoW, logoH);
  ctx.restore();

  const claimY = y + logoH + height * 0.028;
  ctx.save();
  ctx.font = fontBebas(width * 0.026, 400);
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.fillText("AMATEUR", x + width * 0.03, claimY);
  ctx.fillStyle = preset.red;
  ctx.fillText("WINS.", x + width * 0.155, claimY);
  ctx.restore();
}

function resolvePosterText(metadata) {
  const performer = String(metadata.performerName || "").trim().toUpperCase();
  const title = String(metadata.videoTitle || "KRAKEN INTO THE WILD").trim().toUpperCase();
  const explicitSubtitle = String(metadata.optionalSubtitle || metadata.campaignName || "").trim().toUpperCase();

  if (performer) {
    return { title: performer, subtitle: explicitSubtitle || title };
  }

  if (title.includes("|")) {
    const [main, sub] = title.split("|").map(part => part.trim());
    return { title: main, subtitle: explicitSubtitle || sub || "" };
  }

  const words = title.split(/\s+/).filter(Boolean);
  if (explicitSubtitle) return { title, subtitle: explicitSubtitle };
  if (words.length <= 1) return { title, subtitle: "" };
  return { title: words.slice(0, -1).join(" "), subtitle: words[words.length - 1] };
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

function drawTitleBlock(ctx, width, height, metadata, preset, settings) {
  const { title, subtitle } = resolvePosterText(metadata);
  const x = width * 0.07;
  const maxWidth = width * 0.49;
  const titleY = height * (Number(settings.titleY || 52) / 100);
  const titleSize = fitFont(ctx, title, maxWidth, width * 0.185, width * 0.082, size => fontBebas(size));

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = width * 0.012;
  ctx.lineWidth = width * 0.002;
  ctx.strokeStyle = "rgba(0,0,0,0.58)";
  ctx.fillStyle = "#f1f1f1";
  ctx.font = fontBebas(titleSize);
  ctx.strokeText(title, x, titleY);
  ctx.fillText(title, x, titleY);

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#111111";
  for (let i = 0; i < 18; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + seededNoise(i) * maxWidth, titleY - titleSize * 0.8);
    ctx.lineTo(x + seededNoise(i + 20) * maxWidth, titleY - titleSize * 0.04);
    ctx.stroke();
  }
  ctx.restore();

  if (subtitle) {
    const subtitleSize = fitFont(ctx, subtitle, maxWidth, width * 0.128, width * 0.06, size => fontBrush(size));
    const subY = titleY + subtitleSize * 0.78;
    ctx.save();
    ctx.translate(x, subY);
    ctx.rotate(-3.5 * Math.PI / 180);
    ctx.shadowColor = "rgba(0,0,0,0.88)";
    ctx.shadowBlur = width * 0.012;
    ctx.fillStyle = preset.red;
    ctx.font = fontBrush(subtitleSize);
    ctx.fillText(subtitle, 0, 0);

    const lineW = Math.min(maxWidth, ctx.measureText(subtitle).width * 0.9);
    ctx.globalAlpha = 0.72;
    ctx.fillRect(width * 0.005, subtitleSize * 0.15, lineW, Math.max(5, width * 0.006));
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

  const baseY = height * 0.9;
  const startX = width * 0.11;
  const gap = width * 0.145;

  ctx.save();
  labels.forEach((label, index) => {
    const x = startX + index * gap;
    ctx.strokeStyle = preset.red;
    ctx.fillStyle = preset.red;
    ctx.lineWidth = width * 0.0018;

    if (index === 0) {
      ctx.strokeRect(x - width * 0.013, baseY - height * 0.024, width * 0.026, height * 0.024);
      ctx.beginPath(); ctx.arc(x, baseY - height * 0.012, width * 0.005, 0, Math.PI * 2); ctx.stroke();
    } else if (index === 1) {
      ctx.strokeRect(x - width * 0.019, baseY - height * 0.024, width * 0.038, height * 0.026);
      ctx.font = `900 ${width * 0.014}px Arial, sans-serif`;
      ctx.fillText("HD", x - width * 0.012, baseY - height * 0.006);
    } else {
      ctx.strokeRect(x - width * 0.012, baseY - height * 0.016, width * 0.024, height * 0.022);
      ctx.beginPath(); ctx.arc(x, baseY - height * 0.018, width * 0.01, Math.PI, 0); ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = fontBebas(width * 0.015, 400);
    const words = label.toUpperCase().split(" ");
    const first = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const second = words.slice(Math.ceil(words.length / 2)).join(" ");
    ctx.fillText(first, x - width * 0.04, baseY + height * 0.045);
    if (second) ctx.fillText(second, x - width * 0.04, baseY + height * 0.068);

    if (index > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(x - gap * 0.5, baseY - height * 0.04, 1.5, height * 0.085);
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
      document.fonts.load("900 180px Bebas Neue"),
      document.fonts.load("900 130px Permanent Marker"),
    ]);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  drawBase(ctx, width, height, preset);
  drawPerformerPhoto(ctx, image, width, height, settings);
  drawDarkGradient(ctx, width, height, settings);
  drawSubtleBrushLayer(ctx, width, height, preset, settings);
  await drawLogoAndClaim(ctx, width, height, preset);
  drawTitleBlock(ctx, width, height, metadata, preset, settings);
  drawFooter(ctx, width, height, preset, settings);

  return canvas;
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Cover export failed")), type, quality));
}