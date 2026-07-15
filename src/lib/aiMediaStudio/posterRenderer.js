import { analyzePosterImage, scorePosterCandidate } from "./posterAnalysis";
import { choosePosterFamily } from "./posterFamilies";
import { calculateComposition } from "./posterComposition";
import { calculateTypography } from "./posterTypography";

const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";
const VARIANTS = ["title", "performer", "balanced", "close_hero", "brand_hero", "action"];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

let logoPromise;
let logoCrop;
function getLogo() {
  if (!logoPromise) logoPromise = loadImage(OFFICIAL_LOGO_URL);
  return logoPromise;
}

function getLogoCrop(logo) {
  if (logoCrop) return logoCrop;
  const full = { sx: 0, sy: 0, sw: logo.width, sh: logo.height };
  try {
    const canvas = document.createElement("canvas");
    canvas.width = logo.width;
    canvas.height = logo.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(logo, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (data[(y * canvas.width + x) * 4 + 3] > 8) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (minX > maxX || minY > maxY) logoCrop = full;
    else {
      const pad = 4;
      const sx = Math.max(0, minX - pad);
      const sy = Math.max(0, minY - pad);
      logoCrop = {
        sx,
        sy,
        sw: Math.min(canvas.width - sx, maxX - minX + 1 + pad * 2),
        sh: Math.min(canvas.height - sy, maxY - minY + 1 + pad * 2),
      };
    }
  } catch (error) {
    logoCrop = full;
  }
  return logoCrop;
}

function isManual(settings, key) {
  return Boolean(settings?.manualOverrides?.[key]);
}

function hasManualEditing(settings) {
  return Object.values(settings?.manualOverrides || {}).some(Boolean) || (settings?.variant && settings.variant !== "auto");
}

function settingNumber(settings, key, fallback) {
  return Number.isFinite(Number(settings?.[key])) ? Number(settings[key]) : fallback;
}

function drawImageCover(ctx, image, crop, width, height, settings) {
  ctx.save();
  const brightness = isManual(settings, "brightness") ? settingNumber(settings, "brightness", 102) : 102;
  const contrast = isManual(settings, "contrast") ? settingNumber(settings, "contrast", 114) : 114;
  const saturation = isManual(settings, "saturation") ? settingNumber(settings, "saturation", 106) : 106;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();
}

function alpha(base, settings) {
  const strength = isManual(settings, "gradientStrength") ? settingNumber(settings, "gradientStrength", 90) / 90 : 1;
  return Math.max(0, Math.min(0.98, base * strength));
}

function drawDesignZone(ctx, image, crop, width, height, composition, settings) {
  const zone = composition.designZone || { x: 0, y: 0, w: 0.39, h: 1 };
  const zx = width * zone.x;
  const zw = width * zone.w;
  ctx.save();
  ctx.beginPath();
  ctx.rect(zx, 0, zw, height);
  ctx.clip();
  ctx.filter = "blur(16px) brightness(42%) contrast(48%) saturate(84%)";
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.filter = "none";

  const blackout = ctx.createLinearGradient(zx, 0, zx + zw, 0);
  blackout.addColorStop(0, `rgba(0,0,0,${alpha(0.94, settings)})`);
  blackout.addColorStop(0.62, `rgba(0,0,0,${alpha(0.82, settings)})`);
  blackout.addColorStop(1, `rgba(0,0,0,${alpha(0.34, settings)})`);
  ctx.fillStyle = blackout;
  ctx.fillRect(zx, 0, zw, height);

  const redCore = ctx.createRadialGradient(zx + zw * 0.3, height * 0.48, 0, zx + zw * 0.3, height * 0.48, zw * 0.98);
  redCore.addColorStop(0, `rgba(208,0,18,${alpha(0.46, settings)})`);
  redCore.addColorStop(0.5, `rgba(208,0,18,${alpha(0.2, settings)})`);
  redCore.addColorStop(1, "rgba(208,0,18,0)");
  ctx.fillStyle = redCore;
  ctx.fillRect(zx, 0, zw, height);
  ctx.restore();
}

function drawAdaptiveAtmosphere(ctx, width, height, composition, family, settings) {
  const zone = composition.designZone || { x: 0, y: 0, w: 0.39, h: 1 };
  const treatment = family?.treatment || family?.gradient || "warm-hero";
  const redTone = treatment === "premium-gold" ? "214,173,91" : treatment === "cinema-noir" ? "80,108,155" : "208,0,18";
  const edge = width * zone.w;

  const integratedShade = ctx.createLinearGradient(0, 0, width, 0);
  integratedShade.addColorStop(0, `rgba(0,0,0,${alpha(0.62, settings)})`);
  integratedShade.addColorStop(Math.min(0.52, zone.w + 0.08), `rgba(0,0,0,${alpha(0.18, settings)})`);
  integratedShade.addColorStop(1, `rgba(0,0,0,${alpha(0.42, settings)})`);
  ctx.fillStyle = integratedShade;
  ctx.fillRect(0, 0, width, height);

  const seamGlow = ctx.createRadialGradient(edge * 0.88, height * 0.46, 0, edge * 0.88, height * 0.46, width * 0.34);
  seamGlow.addColorStop(0, `rgba(${redTone},${alpha(0.3, settings)})`);
  seamGlow.addColorStop(0.48, `rgba(${redTone},${alpha(0.13, settings)})`);
  seamGlow.addColorStop(1, `rgba(${redTone},0)`);
  ctx.fillStyle = seamGlow;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width * 0.58, height * 0.44, height * 0.08, width * 0.58, height * 0.44, width * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${alpha(0.62, settings)})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawBorderTexture(ctx, width, height, settings) {
  const amount = isManual(settings, "borderTexture") ? settingNumber(settings, "borderTexture", 42) : 42;
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.32, amount / 260);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, width * 0.0012);
  const inset = width * 0.012;
  for (let i = 0; i < Math.ceil(amount / 10); i += 1) {
    const offset = inset + i * width * 0.0025;
    ctx.strokeRect(offset, offset, width - offset * 2, height - offset * 2);
    ctx.beginPath();
    ctx.moveTo(offset, height * (0.14 + i * 0.07));
    ctx.lineTo(width * (0.18 + i * 0.08), offset);
    ctx.stroke();
  }
  ctx.restore();
}

function font(size, family = "Bebas Neue", weight = 900) {
  return `${weight} ${size}px "${family}", Impact, Arial, sans-serif`;
}

function drawTitle(ctx, typography, composition, width, height, family) {
  const box = composition.textArea;
  const x = width * box.x;
  const footerLimit = height * (composition.footerY || 0.895) - height * 0.04;
  let y = Math.min(height * box.y, Math.max(height * 0.08, footerLimit - typography.totalHeight));

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.92)";
  ctx.shadowBlur = width * 0.011;
  ctx.fillStyle = "#f4f4f4";
  ctx.strokeStyle = "rgba(0,0,0,0.52)";
  ctx.lineWidth = Math.max(2, typography.size * 0.015);
  ctx.font = font(typography.size, family.typography.titleFont);
  typography.lines.forEach(line => {
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
    y += typography.lineHeight;
  });

  if (typography.subtitleLines?.length) {
    y += typography.subtitleSize * 0.18;
    ctx.font = font(typography.subtitleSize, family.typography.accentFont);
    ctx.fillStyle = "#d00012";
    ctx.strokeStyle = "rgba(0,0,0,0.72)";
    ctx.lineWidth = Math.max(2, typography.subtitleSize * 0.018);
    typography.subtitleLines.forEach(line => {
      ctx.strokeText(line, x, y);
      ctx.fillText(line, x, y);
      y += typography.subtitleLineHeight;
    });
  }

  if (typography.performerLines?.length) {
    y += typography.performerSize * 0.36;
    ctx.font = font(typography.performerSize, "Inter", 900);
    ctx.letterSpacing = `${Math.max(1, width * 0.0018)}px`;
    ctx.fillStyle = "rgba(244,244,244,0.92)";
    ctx.strokeStyle = "rgba(0,0,0,0.76)";
    ctx.lineWidth = Math.max(2, typography.performerSize * 0.012);
    typography.performerLines.forEach(line => {
      ctx.strokeText(line, x, y);
      ctx.fillText(line, x, y);
      y += typography.performerLineHeight;
    });
  }

  ctx.restore();
}

async function drawLogo(ctx, composition, width, height) {
  const logo = await getLogo();
  const source = getLogoCrop(logo);
  const w = width * composition.logoArea.w;
  const h = w * (source.sh / source.sw);
  ctx.save();
  ctx.globalAlpha = 0.94;
  ctx.shadowColor = "rgba(0,0,0,0.82)";
  ctx.shadowBlur = width * 0.008;
  ctx.drawImage(logo, source.sx, source.sy, source.sw, source.sh, width * composition.logoArea.x, height * composition.logoArea.y, w, h);
  ctx.restore();
}

function sellingPoints(settings) {
  const lines = String(settings?.sellingPoints || "")
    .split(/\n+/)
    .map(line => line.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);
  return lines.length ? lines : ["REAL MOMENTS", "RAW CHEMISTRY", "AMATEUR WINS"];
}

function drawFooter(ctx, composition, width, height, settings) {
  const points = sellingPoints(settings);
  if (!composition.footerVisible && !points.length) return;
  const y = height * (composition.footerY || 0.895);
  const x = width * composition.textArea.x;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = font(width * 0.014, "Bebas Neue", 400);
  points.forEach((text, index) => {
    ctx.fillText(text, x + index * width * 0.13, y);
    if (index < points.length - 1) {
      ctx.fillStyle = "rgba(208,0,18,0.75)";
      ctx.fillRect(x + width * (0.104 + index * 0.13), y - width * 0.012, 1, width * 0.018);
      ctx.fillStyle = "rgba(255,255,255,0.72)";
    }
  });
  ctx.restore();
}

function fittedTitleSize(ctx, lines, maxWidth, desiredSize, family) {
  let size = desiredSize;
  const minSize = Math.max(48, maxWidth * 0.18);
  while (size > minSize) {
    ctx.font = font(size, family, 900);
    if (lines.every(line => ctx.measureText(line).width <= maxWidth)) return size;
    size -= 4;
  }
  return size;
}

async function drawKeyArtComposition(ctx, renderPlan, width, height, settings) {
  const { composition, typography, family } = renderPlan;
  const box = composition.textArea;
  const x = width * box.x;
  const maxWidth = width * box.w;
  let y = height * box.y;

  ctx.save();
  const titleTarget = (height * (composition.designZone?.h || 1) * 0.42) / Math.max(1, typography.lines.length);
  const titleSize = fittedTitleSize(ctx, typography.lines, maxWidth, Math.max(typography.size, titleTarget / 0.78), family.typography.titleFont);
  const titleLineHeight = titleSize * 0.76;
  ctx.globalAlpha = 1;
  ctx.shadowColor = "rgba(0,0,0,0.98)";
  ctx.shadowBlur = width * 0.018;
  ctx.lineWidth = Math.max(4, titleSize * 0.022);
  ctx.strokeStyle = "rgba(0,0,0,0.72)";
  ctx.fillStyle = "#f8f4ef";
  ctx.font = font(titleSize, family.typography.titleFont, 900);
  typography.lines.forEach(line => {
    ctx.strokeText(line, x, y + titleSize);
    ctx.fillText(line, x, y + titleSize);
    y += titleLineHeight;
  });

  if (typography.performerLines?.length) {
    y += height * 0.018;
    const performerSize = Math.max(width * 0.038, Math.min(width * 0.064, typography.performerSize * 1.15));
    ctx.shadowBlur = width * 0.01;
    ctx.lineWidth = Math.max(2, performerSize * 0.014);
    ctx.strokeStyle = "rgba(0,0,0,0.78)";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = font(performerSize, "Inter", 900);
    typography.performerLines.forEach(line => {
      ctx.strokeText(line, x, y + performerSize);
      ctx.fillText(line, x, y + performerSize);
      y += performerSize * 1.08;
    });
  }

  y += height * 0.026;
  const logo = await getLogo();
  const source = getLogoCrop(logo);
  const logoW = Math.max(width * 0.15, Math.min(width * 0.2, width * composition.logoArea.w));
  const logoH = logoW * (source.sh / source.sw);
  ctx.globalAlpha = 0.96;
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = width * 0.01;
  ctx.drawImage(logo, source.sx, source.sy, source.sw, source.sh, x, y, logoW, logoH);
  y += logoH + height * 0.032;

  if (typography.subtitleLines?.length) {
    const subtitleSize = Math.max(width * 0.022, Math.min(width * 0.04, typography.subtitleSize));
    const subtitleLineHeight = subtitleSize * 1.04;
    ctx.globalAlpha = 1;
    ctx.shadowBlur = width * 0.008;
    ctx.lineWidth = Math.max(2, subtitleSize * 0.018);
    ctx.strokeStyle = "rgba(0,0,0,0.76)";
    ctx.fillStyle = "rgba(248,244,239,0.82)";
    ctx.font = font(subtitleSize, "Inter", 900);
    typography.subtitleLines.forEach(line => {
      ctx.strokeText(line, x, y + subtitleSize);
      ctx.fillText(line, x, y + subtitleSize);
      y += subtitleLineHeight;
    });
  }

  const points = sellingPoints(settings);
  if (points.length) {
    y += height * 0.026;
    ctx.shadowBlur = width * 0.004;
    ctx.fillStyle = "rgba(255,255,255,0.56)";
    ctx.font = font(width * 0.0125, "Bebas Neue", 400);
    let pointX = x;
    points.forEach((text, index) => {
      ctx.fillText(text, pointX, y);
      pointX += ctx.measureText(text).width + width * 0.018;
      if (index < points.length - 1) {
        ctx.fillStyle = "rgba(208,0,18,0.72)";
        ctx.fillRect(pointX - width * 0.01, y - width * 0.01, 1, width * 0.016);
        ctx.fillStyle = "rgba(255,255,255,0.56)";
      }
    });
  }
  ctx.restore();
}

export async function generatePosterPlan(image, metadata, settings, width, height) {
  const analysis = await analyzePosterImage(image);
  const family = choosePosterFamily(analysis, metadata);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const variants = VARIANTS.map(variant => {
    const composition = calculateComposition(image, analysis, family, width, height, variant, settings);
    const typography = calculateTypography(ctx, composition.textArea, width, family, metadata, settings, height);
    const score = scorePosterCandidate({ analysis, typographyScore: typography.score, brandScore: 0.9, layoutScore: composition.layoutScore });
    return { variant, family, analysis, composition, typography, score };
  }).sort((a, b) => b.score.total - a.score.total);
  const best = variants.find(candidate => candidate.score.passesQualityGate) || variants[0];
  return { analysis, family, metadata, variants, best };
}

export function selectPosterVariant(plan, settings = {}) {
  if (!plan) return null;
  if (settings.variant && settings.variant !== "auto") return plan.variants.find(item => item.variant === settings.variant) || plan.best;
  return plan.variants.find(candidate => candidate.score.passesQualityGate) || plan.best;
}

export async function renderPosterVariantToCanvas(canvas, image, plan, variantPlan, settings, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const renderFamily = variantPlan.family || plan.family;
  const refreshedComposition = calculateComposition(image, plan.analysis, renderFamily, width, height, variantPlan.variant, settings);
  const refreshedTypography = calculateTypography(ctx, refreshedComposition.textArea, width, renderFamily, plan.metadata, settings, height);
  const renderPlan = { ...variantPlan, family: renderFamily, composition: refreshedComposition, typography: refreshedTypography };
  ctx.fillStyle = "#030303";
  ctx.fillRect(0, 0, width, height);
  drawImageCover(ctx, image, renderPlan.composition.crop, width, height, settings);
  drawDesignZone(ctx, image, renderPlan.composition.crop, width, height, renderPlan.composition, settings);
  drawAdaptiveAtmosphere(ctx, width, height, renderPlan.composition, renderPlan.family, settings);
  drawBorderTexture(ctx, width, height, settings);
  await drawKeyArtComposition(ctx, renderPlan, width, height, settings);
  canvas.__fleshlabPosterPlan = { ...plan, selected: renderPlan };
  return canvas.__fleshlabPosterPlan;
}

export async function renderPosterToCanvas(canvas, image, metadata, settings, width, height) {
  const plan = await generatePosterPlan(image, metadata, settings, width, height);
  const chosen = selectPosterVariant(plan, settings);
  if (!chosen.score.passesQualityGate && !hasManualEditing(settings)) throw new Error(`No poster composition met the semantic quality threshold: ${chosen.score.qualityFailures.join(", ")}.`);
  return await renderPosterVariantToCanvas(canvas, image, plan, chosen, settings, width, height);
}