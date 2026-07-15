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

function drawImageCover(ctx, image, crop, width, height, settings) {
  ctx.save();
  ctx.filter = `brightness(${settings.brightness || 102}%) contrast(${settings.contrast || 114}%) saturate(${settings.saturation || 106}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();
}

function drawAdaptiveAtmosphere(ctx, width, height, composition, family) {
  const { textArea } = composition;
  const x = width * textArea.x;
  const y = height * Math.max(0, textArea.y - 0.18);
  const w = width * Math.min(0.62, textArea.w + 0.16);
  const h = height * Math.min(0.76, textArea.h + 0.34);
  const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
  const leftHeavy = textArea.x < 0.5;
  gradient.addColorStop(0, leftHeavy ? "rgba(0,0,0,0.90)" : "rgba(0,0,0,0.18)");
  gradient.addColorStop(0.55, "rgba(0,0,0,0.58)");
  gradient.addColorStop(1, leftHeavy ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.88)");
  ctx.fillStyle = gradient;
  ctx.fillRect(Math.max(0, x - width * 0.05), 0, Math.min(width, w + width * 0.1), height);

  const vignette = ctx.createRadialGradient(width * 0.62, height * 0.44, height * 0.1, width * 0.62, height * 0.44, width * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.48)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  if (family.gradient !== "cinema-vignette") {
    const red = ctx.createRadialGradient(x + w * 0.25, y + h * 0.5, 0, x + w * 0.25, y + h * 0.5, w * 0.8);
    red.addColorStop(0, "rgba(208,0,18,0.15)");
    red.addColorStop(1, "rgba(208,0,18,0)");
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, width, height);
  }
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

function drawFooter(ctx, composition, width, height) {
  if (!composition.footerVisible) return;
  const y = height * 0.895;
  const x = width * composition.textArea.x;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = font(width * 0.014, "Bebas Neue", 400);
  ["REAL MOMENTS", "RAW CHEMISTRY", "AMATEUR WINS"].forEach((text, index) => {
    ctx.fillText(text, x + index * width * 0.13, y);
    if (index < 2) {
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
    const composition = calculateComposition(image, analysis, family, width, height, variant);
    const typography = calculateTypography(ctx, composition.textArea, width, family, metadata);
    const score = scorePosterCandidate({ analysis, typographyScore: typography.score, brandScore: 0.86, layoutScore: composition.layoutScore });
    return { variant, family, analysis, composition, typography, score };
  }).sort((a, b) => b.score.total - a.score.total);
  return { analysis, family, variants, best: variants[0] };
}

export async function renderPosterVariantToCanvas(canvas, image, plan, variantPlan, settings, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#030303";
  ctx.fillRect(0, 0, width, height);
  drawImageCover(ctx, image, variantPlan.composition.crop, width, height, settings);
  drawAdaptiveAtmosphere(ctx, width, height, variantPlan.composition, variantPlan.family);
  drawTitle(ctx, variantPlan.typography, variantPlan.composition, width, height, variantPlan.family);
  await drawLogo(ctx, variantPlan.composition, width, height);
  drawFooter(ctx, variantPlan.composition, width, height);
  canvas.__fleshlabPosterPlan = plan;
  return plan;
}

export async function renderPosterToCanvas(canvas, image, metadata, settings, width, height) {
  const plan = await generatePosterPlan(image, metadata, settings, width, height);
  const chosen = plan.best;
  if (!chosen.score.passesQualityGate) throw new Error(`No poster composition met the semantic quality threshold: ${chosen.score.qualityFailures.join(", ")}.`);
  return await renderPosterVariantToCanvas(canvas, image, plan, chosen, settings, width, height);
}