import { analyzePosterImage, scorePosterCandidate } from "./posterAnalysis";
import { choosePosterFamily } from "./posterFamilies";
import { calculateComposition } from "./posterComposition";
import { calculateTypography } from "./posterTypography";
import { applyGraphicLanguageToFamily, inferGraphicLanguage } from "./graphicLanguage";

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

function drawImageCover(ctx, image, crop, width, height, settings, family = {}) {
  ctx.save();
  const language = family?.graphicLanguage || {};
  const brightness = isManual(settings, "brightness") ? settingNumber(settings, "brightness", 102) : Math.round((language.brightness || 1.02) * 100);
  const contrast = isManual(settings, "contrast") ? settingNumber(settings, "contrast", 114) : Math.round((language.contrast || 1.14) * 100);
  const saturation = isManual(settings, "saturation") ? settingNumber(settings, "saturation", 106) : Math.round((language.saturation || 1.06) * 100);
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();
}

function alpha(base, settings) {
  const strength = isManual(settings, "gradientStrength") ? settingNumber(settings, "gradientStrength", 90) / 90 : 1;
  return Math.max(0, Math.min(0.98, base * strength));
}

function drawDesignZone(ctx, image, crop, width, height, composition, settings, family = {}) {
  const zone = composition.designZone || { x: 0, y: 0, w: 0.39, h: 1 };
  const language = family?.graphicLanguage || {};
  const darkness = language.darkness || 0.7;
  const redIntensity = language.redIntensity || 0.46;
  const zx = width * zone.x;
  const zw = width * zone.w;
  ctx.save();
  ctx.beginPath();
  ctx.rect(zx, 0, zw, height);
  ctx.clip();
  ctx.filter = `blur(${Math.round(10 + (language.texture_density || 0.42) * 14)}px) brightness(${Math.round((1 - darkness) * 72)}%) contrast(${Math.round(42 + (language.graphic_aggression || 0.58) * 22)}%) saturate(${Math.round(76 + redIntensity * 32)}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.filter = "none";

  const blackout = ctx.createLinearGradient(zx, 0, zx + zw, 0);
  blackout.addColorStop(0, `rgba(0,0,0,${alpha(0.52 + darkness * 0.42, settings)})`);
  blackout.addColorStop(0.62, `rgba(0,0,0,${alpha(0.42 + darkness * 0.4, settings)})`);
  blackout.addColorStop(1, `rgba(0,0,0,${alpha(0.16 + darkness * 0.22, settings)})`);
  ctx.fillStyle = blackout;
  ctx.fillRect(zx, 0, zw, height);

  const redCore = ctx.createRadialGradient(zx + zw * 0.3, height * 0.48, 0, zx + zw * 0.3, height * 0.48, zw * 0.98);
  redCore.addColorStop(0, `rgba(208,0,18,${alpha(redIntensity, settings)})`);
  redCore.addColorStop(0.5, `rgba(208,0,18,${alpha(redIntensity * 0.45, settings)})`);
  redCore.addColorStop(1, "rgba(208,0,18,0)");
  ctx.fillStyle = redCore;
  ctx.fillRect(zx, 0, zw, height);
  ctx.restore();
}

function drawAdaptiveAtmosphere(ctx, width, height, composition, family, settings) {
  const zone = composition.designZone || { x: 0, y: 0, w: 0.39, h: 1 };
  const language = family?.graphicLanguage || {};
  const treatment = family?.treatment || family?.gradient || language.atmosphere || "warm-hero";
  const redTone = treatment === "soft-bloom" ? "214,173,91" : treatment === "documentary-air" ? "255,255,255" : treatment === "warm-haze" ? "236,146,72" : treatment === "cinema-noir" ? "80,108,155" : "208,0,18";
  const aggression = language.graphic_aggression || 0.58;
  const redIntensity = language.redIntensity || 0.46;
  const edge = width * zone.w;

  const integratedShade = ctx.createLinearGradient(0, 0, width, 0);
  integratedShade.addColorStop(0, `rgba(0,0,0,${alpha(0.36 + aggression * 0.3, settings)})`);
  integratedShade.addColorStop(Math.min(0.52, zone.w + 0.08), `rgba(0,0,0,${alpha(0.1 + aggression * 0.12, settings)})`);
  integratedShade.addColorStop(1, `rgba(0,0,0,${alpha(0.18 + aggression * 0.28, settings)})`);
  ctx.fillStyle = integratedShade;
  ctx.fillRect(0, 0, width, height);

  const seamGlow = ctx.createRadialGradient(edge * 0.88, height * 0.46, 0, edge * 0.88, height * 0.46, width * 0.34);
  seamGlow.addColorStop(0, `rgba(${redTone},${alpha(redIntensity * 0.72, settings)})`);
  seamGlow.addColorStop(0.48, `rgba(${redTone},${alpha(redIntensity * 0.32, settings)})`);
  seamGlow.addColorStop(1, `rgba(${redTone},0)`);
  ctx.fillStyle = seamGlow;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width * 0.58, height * 0.44, height * 0.08, width * 0.58, height * 0.44, width * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${alpha(0.36 + aggression * 0.36, settings)})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawBorderTexture(ctx, width, height, settings, family = {}) {
  const language = family?.graphicLanguage || {};
  const autoAmount = Math.round((language.texture_density ?? 0.42) * 90);
  const amount = isManual(settings, "borderTexture") ? settingNumber(settings, "borderTexture", 42) : autoAmount;
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

function subjectCanvasBox(image, analysis, crop, width, height) {
  const box = analysis.subjectBox || { x: 0.5, y: 0.2, w: 0.38, h: 0.62 };
  const cropX = crop.sx / image.width;
  const cropY = crop.sy / image.height;
  const cropW = crop.sw / image.width;
  const cropH = crop.sh / image.height;
  return {
    x: ((box.x - cropX) / cropW) * width,
    y: ((box.y - cropY) / cropH) * height,
    w: (box.w / cropW) * width,
    h: (box.h / cropH) * height,
  };
}

function artDirectionTone(family = {}) {
  const language = family.graphicLanguage || {};
  if (language.atmosphere === "soft-bloom") return { rgb: "214,173,91", warm: "255,226,170" };
  if (language.atmosphere === "documentary-air") return { rgb: "255,255,255", warm: "220,235,255" };
  if (language.atmosphere === "warm-haze") return { rgb: "236,146,72", warm: "255,196,124" };
  return { rgb: "208,0,18", warm: "255,56,72" };
}

function drawTransformedEnvironment(ctx, image, crop, width, height, family, settings) {
  const language = family.graphicLanguage || {};
  const tone = artDirectionTone(family);
  const aggression = language.graphic_aggression || 0.58;
  const depth = language.poster_density || 0.58;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(width * 0.34, height * 0.02, width * 0.5, height * 0.36, width * (0.36 + aggression * 0.14), height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.clip();
  ctx.filter = `blur(${Math.round(18 + depth * 18)}px) brightness(${Math.round(34 + (1 - aggression) * 22)}%) contrast(${Math.round(120 + aggression * 26)}%) saturate(${Math.round(92 + aggression * 44)}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, -width * 0.04, -height * 0.04, width * 1.1, height * 1.1);
  ctx.filter = "none";
  const wash = ctx.createLinearGradient(0, 0, width * 0.58, height);
  wash.addColorStop(0, `rgba(0,0,0,${alpha(0.78, settings)})`);
  wash.addColorStop(0.45, `rgba(${tone.rgb},${alpha(0.16 + aggression * 0.28, settings)})`);
  wash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i += 1) {
    ctx.globalAlpha = 0.08 + aggression * 0.06;
    ctx.strokeStyle = `rgba(${tone.warm},1)`;
    ctx.lineWidth = width * (0.004 + i * 0.002);
    ctx.beginPath();
    ctx.moveTo(width * (-0.04 + i * 0.04), height * (0.22 + i * 0.12));
    ctx.bezierCurveTo(width * 0.22, height * (0.16 + i * 0.08), width * 0.38, height * (0.34 + i * 0.08), width * (0.58 + i * 0.06), height * (0.16 + i * 0.14));
    ctx.stroke();
  }
  ctx.restore();
}

function drawSubjectSeparation(ctx, image, renderPlan, width, height) {
  const { analysis, composition, family } = renderPlan;
  const language = family.graphicLanguage || {};
  const hero = subjectCanvasBox(image, analysis, composition.crop, width, height);
  const padX = hero.w * 0.24;
  const padY = hero.h * 0.14;

  ctx.save();
  const halo = ctx.createRadialGradient(hero.x + hero.w * 0.54, hero.y + hero.h * 0.36, 0, hero.x + hero.w * 0.54, hero.y + hero.h * 0.36, Math.max(hero.w, hero.h) * 0.68);
  halo.addColorStop(0, `rgba(255,255,255,${0.08 + (language.emotional_intensity || 0.66) * 0.1})`);
  halo.addColorStop(0.44, `rgba(208,0,18,${(language.redIntensity || 0.46) * 0.16})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hero.x + hero.w * 0.5, hero.y + hero.h * 0.47, Math.max(18, hero.w * 0.68 + padX), Math.max(18, hero.h * 0.58 + padY), 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.filter = `brightness(${Math.round(104 + (language.emotional_intensity || 0.66) * 8)}%) contrast(${Math.round(114 + (language.graphic_aggression || 0.58) * 18)}%) saturate(${Math.round(104 + (language.redIntensity || 0.46) * 12)}%)`;
  ctx.drawImage(image, composition.crop.sx, composition.crop.sy, composition.crop.sw, composition.crop.sh, 0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(${artDirectionTone(family).warm},${0.16 + (language.graphic_aggression || 0.58) * 0.16})`;
  ctx.lineWidth = Math.max(2, width * 0.003);
  ctx.beginPath();
  ctx.moveTo(hero.x + hero.w * 0.08, hero.y + hero.h * 0.12);
  ctx.bezierCurveTo(hero.x - hero.w * 0.08, hero.y + hero.h * 0.38, hero.x + hero.w * 0.02, hero.y + hero.h * 0.72, hero.x + hero.w * 0.24, hero.y + hero.h * 0.96);
  ctx.stroke();
  ctx.restore();
}

async function drawIntegratedLogo(ctx, x, y, maxW, width) {
  const logo = await getLogo();
  const source = getLogoCrop(logo);
  const logoW = Math.max(width * 0.13, Math.min(width * 0.19, maxW));
  const logoH = logoW * (source.sh / source.sw);
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = width * 0.012;
  ctx.drawImage(logo, source.sx, source.sy, source.sw, source.sh, x, y, logoW, logoH);
  ctx.restore();
  return { w: logoW, h: logoH };
}

function drawAtmosphericForeground(ctx, width, height, family) {
  const language = family.graphicLanguage || {};
  const tone = artDirectionTone(family);
  const density = language.texture_density || 0.42;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < Math.round(22 + density * 46); i += 1) {
    const x = width * ((i * 37) % 100) / 100;
    const y = height * ((i * 61) % 100) / 100;
    ctx.globalAlpha = 0.025 + density * 0.035;
    ctx.fillStyle = `rgba(${tone.warm},1)`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.8, width * (0.0006 + ((i % 3) * 0.00045))), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

async function drawKeyArtComposition(ctx, renderPlan, image, width, height, settings) {
  const { composition, typography, family } = renderPlan;
  const language = family.graphicLanguage || {};
  const tone = artDirectionTone(family);
  const aggression = language.graphic_aggression || 0.58;
  const hero = subjectCanvasBox(image, renderPlan.analysis, composition.crop, width, height);
  const titleX = Math.max(width * 0.035, Math.min(width * 0.11, hero.x - width * 0.46));
  const maxWidth = Math.min(width * (0.54 + aggression * 0.12), Math.max(width * 0.42, hero.x + hero.w * 0.32 - titleX));
  let y = height * (0.12 + (1 - aggression) * 0.035);
  const titleTarget = (height * (0.48 + aggression * 0.14)) / Math.max(1, typography.lines.length);
  const titleSize = fittedTitleSize(ctx, typography.lines, maxWidth, Math.max(typography.size, titleTarget / 0.75), family.typography.titleFont);
  const titleLineHeight = titleSize * (language.typography_style === "minimal_elegant" ? 0.9 : 0.74);

  drawTransformedEnvironment(ctx, image, composition.crop, width, height, family, settings);

  ctx.save();
  ctx.globalAlpha = 0.24 + aggression * 0.14;
  ctx.shadowColor = `rgba(${tone.rgb},0.9)`;
  ctx.shadowBlur = width * 0.025;
  ctx.fillStyle = `rgba(${tone.rgb},0.18)`;
  ctx.strokeStyle = "rgba(0,0,0,0.72)";
  ctx.lineWidth = Math.max(5, titleSize * 0.03);
  ctx.font = font(titleSize * 1.04, family.typography.titleFont, 900);
  typography.lines.forEach((line, index) => {
    ctx.strokeText(line, titleX - width * 0.01, y + titleSize + index * titleLineHeight);
    ctx.fillText(line, titleX - width * 0.01, y + titleSize + index * titleLineHeight);
  });
  ctx.restore();

  drawSubjectSeparation(ctx, image, renderPlan, width, height);
  drawAtmosphericForeground(ctx, width, height, family);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.shadowColor = "rgba(0,0,0,0.98)";
  ctx.shadowBlur = width * (0.014 + aggression * 0.008);
  ctx.lineWidth = Math.max(4, titleSize * 0.024);
  ctx.strokeStyle = "rgba(0,0,0,0.8)";
  ctx.fillStyle = language.typography_style === "minimal_elegant" ? "#f2eee7" : "#fff7ee";
  ctx.font = font(titleSize, family.typography.titleFont, 900);
  typography.lines.forEach(line => {
    ctx.strokeText(line, titleX, y + titleSize);
    ctx.fillText(line, titleX, y + titleSize);
    y += titleLineHeight;
  });

  y += height * 0.02;
  const logoSize = await drawIntegratedLogo(ctx, titleX, y, width * composition.logoArea.w, width);
  y += logoSize.h + height * 0.028;

  if (typography.performerLines?.length) {
    const performerSize = Math.max(width * 0.032, Math.min(width * 0.056, typography.performerSize));
    ctx.shadowBlur = width * 0.01;
    ctx.lineWidth = Math.max(2, performerSize * 0.014);
    ctx.strokeStyle = "rgba(0,0,0,0.78)";
    ctx.fillStyle = `rgba(${tone.warm},0.9)`;
    ctx.font = font(performerSize, "Inter", 900);
    typography.performerLines.forEach(line => {
      ctx.strokeText(line, titleX, y + performerSize);
      ctx.fillText(line, titleX, y + performerSize);
      y += performerSize * 1.04;
    });
  }

  if (typography.subtitleLines?.length) {
    y += height * 0.018;
    const subtitleSize = Math.max(width * 0.02, Math.min(width * 0.035, typography.subtitleSize));
    ctx.font = font(subtitleSize, family.typography.accentFont, 900);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.strokeStyle = "rgba(0,0,0,0.76)";
    ctx.lineWidth = Math.max(2, subtitleSize * 0.018);
    typography.subtitleLines.forEach(line => {
      ctx.strokeText(line, titleX, y + subtitleSize);
      ctx.fillText(line, titleX, y + subtitleSize);
      y += subtitleSize * 1.02;
    });
  }

  const points = sellingPoints(settings);
  if (points.length) {
    y += height * 0.025;
    ctx.shadowBlur = width * 0.004;
    ctx.fillStyle = "rgba(255,255,255,0.54)";
    ctx.font = font(width * 0.012, "Bebas Neue", 400);
    let pointX = titleX;
    points.forEach((text, index) => {
      ctx.fillText(text, pointX, y);
      pointX += ctx.measureText(text).width + width * 0.016;
      if (index < points.length - 1) {
        ctx.fillStyle = `rgba(${tone.rgb},0.72)`;
        ctx.fillRect(pointX - width * 0.008, y - width * 0.01, 1, width * 0.016);
        ctx.fillStyle = "rgba(255,255,255,0.54)";
      }
    });
  }
  ctx.restore();
}

export async function generatePosterPlan(image, metadata, settings, width, height) {
  const analysis = await analyzePosterImage(image);
  const graphicLanguage = inferGraphicLanguage(metadata, analysis);
  const family = applyGraphicLanguageToFamily(choosePosterFamily(analysis, metadata, graphicLanguage), graphicLanguage);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const variants = VARIANTS.map(variant => {
    const composition = calculateComposition(image, analysis, family, width, height, variant, settings);
    const typography = calculateTypography(ctx, composition.textArea, width, family, metadata, settings, height);
    const score = scorePosterCandidate({ analysis, typographyScore: typography.score, brandScore: 0.9, layoutScore: composition.layoutScore, graphicLanguageScore: graphicLanguage.strength, artDirectionScore: composition.artDirectionScore });
    return { variant, family, graphicLanguage, analysis, composition, typography, score };
  }).sort((a, b) => b.score.total - a.score.total);
  const best = variants.find(candidate => candidate.score.passesQualityGate) || variants[0];
  return { analysis, family, graphicLanguage, metadata, variants, best };
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
  drawImageCover(ctx, image, renderPlan.composition.crop, width, height, settings, renderPlan.family);
  drawAdaptiveAtmosphere(ctx, width, height, renderPlan.composition, renderPlan.family, settings);
  await drawKeyArtComposition(ctx, renderPlan, image, width, height, settings);
  drawBorderTexture(ctx, width, height, settings, renderPlan.family);
  canvas.__fleshlabPosterPlan = { ...plan, selected: renderPlan };
  return canvas.__fleshlabPosterPlan;
}

export async function renderPosterToCanvas(canvas, image, metadata, settings, width, height) {
  const plan = await generatePosterPlan(image, metadata, settings, width, height);
  const chosen = selectPosterVariant(plan, settings);
  if (!chosen.score.passesQualityGate && !hasManualEditing(settings)) throw new Error(`No poster composition met the semantic quality threshold: ${chosen.score.qualityFailures.join(", ")}.`);
  return await renderPosterVariantToCanvas(canvas, image, plan, chosen, settings, width, height);
}