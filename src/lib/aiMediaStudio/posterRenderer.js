import { analyzePosterImage, scorePosterCandidate } from "./posterAnalysis";
import { choosePosterFamily } from "./posterFamilies";
import { calculateComposition } from "./posterComposition";
import { calculateTypography } from "./posterTypography";

const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";
const VARIANTS = ["title", "performer", "balanced"];

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
function getLogo() {
  if (!logoPromise) logoPromise = loadImage(OFFICIAL_LOGO_URL);
  return logoPromise;
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

function drawAdaptiveAtmosphere(ctx, width, height, composition, family, settings) {
  const { textArea } = composition;
  const x = width * textArea.x;
  const y = height * Math.max(0, textArea.y - 0.18);
  const w = width * Math.min(0.62, textArea.w + 0.16);
  const h = height * Math.min(0.76, textArea.h + 0.34);
  const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
  const leftHeavy = textArea.x < 0.5;
  gradient.addColorStop(0, leftHeavy ? `rgba(0,0,0,${alpha(0.90, settings)})` : `rgba(0,0,0,${alpha(0.18, settings)})`);
  gradient.addColorStop(0.55, `rgba(0,0,0,${alpha(0.58, settings)})`);
  gradient.addColorStop(1, leftHeavy ? "rgba(0,0,0,0)" : `rgba(0,0,0,${alpha(0.88, settings)})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(Math.max(0, x - width * 0.05), 0, Math.min(width, w + width * 0.1), height);

  const vignette = ctx.createRadialGradient(width * 0.62, height * 0.44, height * 0.1, width * 0.62, height * 0.44, width * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${alpha(0.48, settings)})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  if (family.gradient !== "cinema-vignette") {
    const red = ctx.createRadialGradient(x + w * 0.25, y + h * 0.5, 0, x + w * 0.25, y + h * 0.5, w * 0.8);
    red.addColorStop(0, `rgba(208,0,18,${alpha(0.15, settings)})`);
    red.addColorStop(1, "rgba(208,0,18,0)");
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, width, height);
  }
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
  let y = height * box.y;
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
  if (typography.subtitle) {
    ctx.translate(x, y + typography.subtitleSize * 0.15);
    ctx.rotate(-2.3 * Math.PI / 180);
    ctx.font = font(typography.subtitleSize, family.typography.accentFont);
    ctx.fillStyle = "#d00012";
    ctx.fillText(typography.subtitle, 0, 0);
  }
  ctx.restore();
}

async function drawLogo(ctx, composition, width, height) {
  const logo = await getLogo();
  const w = width * composition.logoArea.w;
  const h = w * (logo.height / logo.width);
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = width * 0.006;
  ctx.drawImage(logo, width * composition.logoArea.x, height * composition.logoArea.y, w, h);
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

export async function generatePosterPlan(image, metadata, settings, width, height) {
  const analysis = await analyzePosterImage(image);
  const family = choosePosterFamily(analysis, metadata);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const variants = VARIANTS.map(variant => {
    const composition = calculateComposition(image, analysis, family, width, height, variant, settings);
    const typography = calculateTypography(ctx, composition.textArea, width, family, metadata, settings);
    const score = scorePosterCandidate({ analysis, typographyScore: typography.score, brandScore: 0.86, layoutScore: composition.layoutScore });
    return { variant, family, analysis, composition, typography, score };
  }).sort((a, b) => b.score.total - a.score.total);
  return { analysis, family, metadata, variants, best: variants[0] };
}

export function selectPosterVariant(plan, settings = {}) {
  if (!plan) return null;
  if (settings.variant && settings.variant !== "auto") return plan.variants.find(item => item.variant === settings.variant) || plan.best;
  return plan.best;
}

export async function renderPosterVariantToCanvas(canvas, image, plan, variantPlan, settings, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const refreshedComposition = calculateComposition(image, plan.analysis, plan.family, width, height, variantPlan.variant, settings);
  const refreshedTypography = calculateTypography(ctx, refreshedComposition.textArea, width, plan.family, plan.metadata, settings);
  const renderPlan = { ...variantPlan, composition: refreshedComposition, typography: refreshedTypography };
  ctx.fillStyle = "#030303";
  ctx.fillRect(0, 0, width, height);
  drawImageCover(ctx, image, renderPlan.composition.crop, width, height, settings);
  drawAdaptiveAtmosphere(ctx, width, height, renderPlan.composition, renderPlan.family, settings);
  drawBorderTexture(ctx, width, height, settings);
  drawTitle(ctx, renderPlan.typography, renderPlan.composition, width, height, renderPlan.family);
  await drawLogo(ctx, renderPlan.composition, width, height);
  drawFooter(ctx, renderPlan.composition, width, height, settings);
  canvas.__fleshlabPosterPlan = { ...plan, selected: renderPlan };
  return canvas.__fleshlabPosterPlan;
}

export async function renderPosterToCanvas(canvas, image, metadata, settings, width, height) {
  const plan = await generatePosterPlan(image, metadata, settings, width, height);
  const chosen = selectPosterVariant(plan, settings);
  if (!chosen.score.passesQualityGate && !hasManualEditing(settings)) throw new Error(`No poster composition met the semantic quality threshold: ${chosen.score.qualityFailures.join(", ")}.`);
  return await renderPosterVariantToCanvas(canvas, image, plan, chosen, settings, width, height);
}