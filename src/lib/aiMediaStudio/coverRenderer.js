const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";

export const COVER_FORMATS = [
  { id: "landscape", label: "16:9 Landscape", width: 1920, height: 1080 },
  { id: "post", label: "4:5 Promotional Post", width: 1080, height: 1350 },
  { id: "square", label: "1:1 Square", width: 1080, height: 1080 },
  { id: "story", label: "9:16 Story", width: 1080, height: 1920 },
  { id: "custom", label: "Custom", width: 1600, height: 900 },
];

export const COVER_PRESETS = [
  { id: "cinematic", label: "FLESHLAB Cinematic", red: "#cf0018", charcoal: "#050505", stroke: "#7a0010" },
  { id: "raw", label: "Reference Match", red: "#d00012", charcoal: "#030303", stroke: "#5f0008" },
  { id: "premium", label: "Premium Release", red: "#e11d48", charcoal: "#030303", stroke: "#b8860b" },
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
  contrast: 112,
  saturation: 106,
  titleSize: 118,
  subtitleSize: 64,
  titleY: 44,
  gradientStrength: 88,
  logoPosition: "top-left",
  borderTexture: 82,
  safeMargin: 7,
  sellingPoints: "EXCLUSIVE CONTENT\nHIGH QUALITY VIDEO\nONLY ON FLESHLAB",
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

function fillBackground(ctx, width, height) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#020202");
  bg.addColorStop(0.58, "#070707");
  bg.addColorStop(1, "#101010");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}

function drawPhoto(ctx, image, width, height, settings, preset) {
  if (image) {
    const iw = image.width;
    const ih = image.height;
    const scale = Math.max(width / iw, height / ih) * Number(settings.zoom || 1.16);
    const sw = width / scale;
    const sh = height / scale;
    const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * 0.64 - Number(settings.x || 0) * iw * 0.004));
    const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * 0.48 - Number(settings.y || 0) * ih * 0.004));
    ctx.save();
    ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
    ctx.restore();
  } else {
    const beach = ctx.createLinearGradient(width * 0.45, 0, width, height);
    beach.addColorStop(0, "#102534");
    beach.addColorStop(0.35, "#5a8faf");
    beach.addColorStop(0.62, "#dfb77e");
    beach.addColorStop(1, "#080808");
    ctx.fillStyle = beach;
    ctx.fillRect(width * 0.42, 0, width * 0.58, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.beginPath();
    ctx.ellipse(width * 0.73, height * 0.58, width * 0.16, height * 0.38, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.arc(width * 0.72, height * 0.25, height * 0.115, 0, Math.PI * 2);
    ctx.fill();
  }

  const leftWall = ctx.createLinearGradient(0, 0, width * 0.72, 0);
  leftWall.addColorStop(0, "rgba(0,0,0,0.99)");
  leftWall.addColorStop(0.48, "rgba(0,0,0,0.94)");
  leftWall.addColorStop(0.72, "rgba(0,0,0,0.48)");
  leftWall.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = leftWall;
  ctx.fillRect(0, 0, width * 0.74, height);

  const vignette = ctx.createRadialGradient(width * 0.78, height * 0.35, height * 0.12, width * 0.78, height * 0.35, width * 0.62);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.48)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawAWatermark(ctx, width, height, preset) {
  ctx.save();
  const cx = width * 0.13;
  const cy = height * 0.24;
  ctx.strokeStyle = "rgba(208,0,18,0.42)";
  ctx.lineWidth = width * 0.006;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, width * (0.105 + i * 0.013), 0.12, Math.PI * 1.92);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = preset.red;
  ctx.font = `900 ${width * 0.22}px Impact, Arial Black, sans-serif`;
  ctx.fillText("A", width * 0.02, height * 0.43);
  ctx.restore();
}

function drawGrunge(ctx, width, height, preset, strength) {
  const count = Math.round((Number(strength || 70) / 100) * 130);
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const red = i % 3 !== 0;
    ctx.strokeStyle = red ? "rgba(208,0,18,0.28)" : "rgba(255,255,255,0.12)";
    ctx.lineWidth = Math.max(1, width * (0.0008 + seededNoise(i) * 0.0024));
    const x = seededNoise(i + 3) * width * 0.56;
    const y = seededNoise(i + 8) * height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width * (0.04 + seededNoise(i + 17) * 0.3), y + height * (-0.03 + seededNoise(i + 21) * 0.06));
    ctx.stroke();
  }
  ctx.restore();
}

async function drawOfficialLogo(ctx, width, height) {
  const logo = await loadCanvasImage(OFFICIAL_LOGO_URL);
  const logoW = width * 0.29;
  const logoH = logoW * (logo.height / logo.width);
  const x = width * 0.215;
  const y = height * 0.058;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = width * 0.01;
  ctx.drawImage(logo, x, y, logoW, logoH);
  ctx.restore();
}

function splitTitle(metadata) {
  const title = String(metadata.videoTitle || "BEACH ESCAPE").trim().toUpperCase();
  if (title.includes("|")) {
    const [white, red] = title.split("|").map(part => part.trim());
    return { white, red };
  }
  const words = title.split(/\s+/).filter(Boolean);
  if (metadata.optionalSubtitle) return { white: title, red: String(metadata.optionalSubtitle).toUpperCase() };
  if (words.length <= 1) return { white: title, red: "" };
  return { white: words.slice(0, -1).join(" "), red: words[words.length - 1] };
}

function fitText(ctx, text, maxWidth, startSize, minSize, fontFamily) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `900 ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 4;
  }
  return minSize;
}

function drawBrushWord(ctx, text, x, y, maxWidth, preset, width) {
  if (!text) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-4 * Math.PI / 180);
  const size = fitText(ctx, text, maxWidth, width * 0.16, width * 0.07, "Permanent Marker, Impact, Arial Black, sans-serif");
  const textW = ctx.measureText(text).width;
  ctx.fillStyle = preset.red;
  for (let i = 0; i < 8; i += 1) {
    ctx.globalAlpha = 0.22;
    ctx.fillRect(-width * 0.005 + i * width * 0.004, size * (0.42 + seededNoise(i) * 0.22), textW * (0.76 + seededNoise(i + 9) * 0.28), width * 0.012);
  }
  ctx.globalAlpha = 1;
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = width * 0.012;
  ctx.fillStyle = preset.red;
  ctx.font = `900 ${size}px Permanent Marker, Impact, Arial Black, sans-serif`;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawMainTypography(ctx, width, height, metadata, preset, settings) {
  const { white, red } = splitTitle(metadata);
  const x = width * 0.055;
  const maxWidth = width * 0.52;
  const titleWords = white.split(/\s+/).filter(Boolean);
  const titleLines = titleWords.length > 2 ? [titleWords.slice(0, Math.ceil(titleWords.length / 2)).join(" "), titleWords.slice(Math.ceil(titleWords.length / 2)).join(" ")] : [white];
  const longest = titleLines.reduce((a, b) => (a.length > b.length ? a : b), "");
  const whiteSize = fitText(ctx, longest, maxWidth, width * 0.2, width * 0.085, "Bebas Neue, Impact, Arial Black, sans-serif");
  const lineHeight = whiteSize * 0.82;
  const y = height * 0.52 - (titleLines.length - 1) * lineHeight * 0.42;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = width * 0.012;
  ctx.fillStyle = "#f2f2f2";
  ctx.strokeStyle = "rgba(0,0,0,0.44)";
  ctx.lineWidth = width * 0.0024;
  ctx.font = `900 ${whiteSize}px Bebas Neue, Impact, Arial Black, sans-serif`;
  titleLines.forEach((line, index) => {
    const lineY = y + index * lineHeight;
    ctx.strokeText(line, x, lineY);
    ctx.fillText(line, x, lineY);
  });

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#000000";
  for (let i = 0; i < 28; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + seededNoise(i) * maxWidth, y - whiteSize * 0.82);
    ctx.lineTo(x + seededNoise(i + 20) * maxWidth, y + lineHeight * titleLines.length - whiteSize * 0.08);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const redY = y + lineHeight * titleLines.length + height * 0.075;
  drawBrushWord(ctx, red, x + width * 0.005, redY, maxWidth * 0.98, preset, width);

  const small = String(metadata.performerName || metadata.campaignName || "KRAKEN SOLO").toUpperCase();
  ctx.save();
  ctx.fillStyle = preset.red;
  ctx.fillRect(x + width * 0.06, height * 0.762, width * 0.008, height * 0.034);
  ctx.fillStyle = "#ffffff";
  ctx.font = `400 ${width * 0.037}px Bebas Neue, Arial, sans-serif`;
  ctx.fillText(small, x + width * 0.105, height * 0.796);
  ctx.restore();
}

function drawFooterIcons(ctx, width, height, preset, settings) {
  const labels = String(settings.sellingPoints || "EXCLUSIVE CONTENT\nHIGH QUALITY VIDEO\nONLY ON FLESHLAB").split(/\n|,/).map(item => item.trim()).filter(Boolean).slice(0, 3);
  while (labels.length < 3) labels.push(["EXCLUSIVE CONTENT", "HIGH QUALITY VIDEO", "ONLY ON FLESHLAB"][labels.length]);

  const startX = width * 0.13;
  const gap = width * 0.155;
  const y = height * 0.88;
  ctx.save();
  labels.forEach((label, index) => {
    const x = startX + index * gap;
    ctx.strokeStyle = preset.red;
    ctx.fillStyle = preset.red;
    ctx.lineWidth = width * 0.0022;
    if (index === 0) {
      ctx.strokeRect(x - width * 0.019, y - height * 0.023, width * 0.038, height * 0.032);
      ctx.beginPath(); ctx.arc(x, y - height * 0.007, width * 0.0075, 0, Math.PI * 2); ctx.stroke();
    } else if (index === 1) {
      ctx.strokeRect(x - width * 0.027, y - height * 0.024, width * 0.054, height * 0.034);
      ctx.font = `900 ${width * 0.019}px Arial Black, sans-serif`;
      ctx.fillText("HD", x - width * 0.018, y + height * 0.002);
    } else {
      ctx.strokeRect(x - width * 0.017, y - height * 0.015, width * 0.034, height * 0.029);
      ctx.beginPath(); ctx.arc(x, y - height * 0.018, width * 0.014, Math.PI, 0); ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = `400 ${width * 0.019}px Bebas Neue, Arial, sans-serif`;
    const parts = label.toUpperCase().split(" ");
    ctx.fillText(parts.slice(0, Math.ceil(parts.length / 2)).join(" "), x - width * 0.045, y + height * 0.06);
    ctx.fillText(parts.slice(Math.ceil(parts.length / 2)).join(" "), x - width * 0.045, y + height * 0.088);
    if (index > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(x - gap * 0.5, y - height * 0.035, 2, height * 0.09);
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
      document.fonts.load("900 140px Bebas Neue"),
      document.fonts.load("900 120px Permanent Marker"),
    ]);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  fillBackground(ctx, width, height);
  drawPhoto(ctx, image, width, height, settings, preset);
  drawAWatermark(ctx, width, height, preset);
  drawGrunge(ctx, width, height, preset, settings.borderTexture);
  await drawOfficialLogo(ctx, width, height);
  drawMainTypography(ctx, width, height, metadata, preset, settings);
  drawFooterIcons(ctx, width, height, preset, settings);

  return canvas;
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Cover export failed")), type, quality));
}