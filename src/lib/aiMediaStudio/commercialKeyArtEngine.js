import { analyzePosterImage } from "./posterAnalysis";
import { inferGraphicLanguage } from "./graphicLanguage";

const ENGINE_NAME = "Commercial Key Art Engine";
const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function font(size, family = "Bebas Neue", weight = 900) {
  return `${weight} ${size}px "${family}", Impact, Arial, sans-serif`;
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function splitTitle(metadata = {}) {
  const raw = upper(metadata.videoTitle || metadata.title || "FLESHLAB ORIGINAL");
  const explicit = upper(metadata.optionalSubtitle || metadata.campaignName || "");
  if (raw.includes("|")) {
    const [title, subtitle] = raw.split("|").map(item => item.trim()).filter(Boolean);
    return { title: title || raw, subtitle: explicit || subtitle || "" };
  }
  return { title: raw, subtitle: explicit };
}

function sellingPoints(settings) {
  const lines = String(settings?.sellingPoints || "")
    .split(/\n+/)
    .map(line => line.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);
  return lines.length ? lines : ["REAL MOMENTS", "RAW CHEMISTRY", "AMATEUR WINS"];
}

function cropForHero(image, analysis, language, width, height, settings = {}) {
  const outputAspect = width / height;
  let sw = image.width;
  let sh = image.height;
  if (image.width / image.height > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;

  const hero = analysis.subjectBox || { x: 0.52, y: 0.14, w: 0.34, h: 0.72 };
  const cx = (hero.x + hero.w * 0.52) * image.width;
  const cy = (hero.y + hero.h * 0.48) * image.height;
  const zoom = clamp((language.cropZoomMultiplier || 1) * 1.08 * (Number(settings.zoom) || 1), 0.9, 1.8);
  sw /= zoom;
  sh /= zoom;

  const sx = clamp(cx - sw * 0.58, 0, Math.max(0, image.width - sw));
  const sy = clamp(cy - sh * 0.48, 0, Math.max(0, image.height - sh));
  return { sx, sy, sw, sh };
}

function heroOnCanvas(image, analysis, crop, width, height) {
  const hero = analysis.subjectBox || { x: 0.52, y: 0.14, w: 0.34, h: 0.72 };
  return {
    x: ((hero.x * image.width - crop.sx) / crop.sw) * width,
    y: ((hero.y * image.height - crop.sy) / crop.sh) * height,
    w: (hero.w * image.width / crop.sw) * width,
    h: (hero.h * image.height / crop.sh) * height,
  };
}

function toneFor(language = {}) {
  if (language.atmosphere === "soft-bloom") return { core: "214,173,91", hot: "255,224,168", cold: "34,24,12" };
  if (language.atmosphere === "documentary-air") return { core: "230,235,244", hot: "255,255,255", cold: "18,24,34" };
  if (language.atmosphere === "warm-haze") return { core: "236,146,72", hot: "255,196,124", cold: "30,15,10" };
  return { core: "208,0,18", hot: "255,55,70", cold: "8,0,3" };
}

function loadLogo() {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = OFFICIAL_LOGO_URL;
  });
}

function measureLines(ctx, text, maxWidth, startSize, minSize, family, maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  for (let size = startSize; size >= minSize; size -= 4) {
    ctx.font = font(size, family, 900);
    const lines = [];
    let current = "";
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (!current || ctx.measureText(next).width <= maxWidth) current = next;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) return { lines, size, lineHeight: size * 0.74 };
  }
  return { lines: [text], size: minSize, lineHeight: minSize * 0.78 };
}

function buildPlanScore(analysis, language) {
  const story = clamp((analysis.visualCuriosity || 0.55) * 0.24 + (analysis.emotionalPresence || 0.55) * 0.22 + (analysis.interactionStrength || 0.5) * 0.16 + language.strength * 0.38);
  const artDirection = clamp(0.22 + language.strength * 0.28 + (language.poster_density || 0.6) * 0.18 + (language.graphic_aggression || 0.58) * 0.14 + (analysis.subjectSeparation || 0.55) * 0.1 + (analysis.thumbnailImpact || 0.55) * 0.08);
  const graphicDesignRatio = 0.62;
  const polish = clamp(0.18 + artDirection * 0.42 + story * 0.2 + graphicDesignRatio * 0.2);
  const total = clamp(artDirection * 0.42 + story * 0.18 + polish * 0.24 + graphicDesignRatio * 0.16);
  const failures = [];
  if (graphicDesignRatio < 0.58) failures.push("not enough graphic design reconstruction");
  if (artDirection < 0.78) failures.push("still reads as screenshot with text");
  if (polish < 0.76) failures.push("not believable as premium streaming key art");
  if (total < 0.78) failures.push("commercial key art threshold not met");
  return {
    total: Math.round(total * 100),
    artDirection: Math.round(artDirection * 100),
    graphicDesignRatio: Math.round(graphicDesignRatio * 100),
    story: Math.round(story * 100),
    polish: Math.round(polish * 100),
    marketing: Math.round(polish * 100),
    imageQuality: Math.round(polish * 100),
    passesQualityGate: failures.length === 0,
    qualityFailures: failures,
  };
}

export async function generateCommercialKeyArtPlan(image, metadata = {}, settings = {}, width = 1920, height = 1080) {
  const analysis = await analyzePosterImage(image);
  const graphicLanguage = inferGraphicLanguage(metadata, analysis);
  const crop = cropForHero(image, analysis, graphicLanguage, width, height, settings);
  const score = buildPlanScore(analysis, graphicLanguage);
  const selected = {
    engine: ENGINE_NAME,
    variant: "painted-commercial-key-art",
    poster_family_id: "commercial-key-art-engine",
    poster_family_label: ENGINE_NAME,
    philosophy: "Paint a new commercial composition from source material; typography is the final architectural layer.",
    impact_score: score.total,
    hero_score: Math.round((analysis.subjectSeparation || 0.55) * 100),
    thumbnail_score: Math.round((analysis.thumbnailImpact || 0.55) * 100),
    commercial_score: score.polish,
    score,
    crop,
  };
  return {
    engine: ENGINE_NAME,
    metadata,
    analysis,
    graphicLanguage,
    family: { id: "commercial-key-art-engine", label: ENGINE_NAME },
    visualStory: { emotionalCenter: graphicLanguage.thumbnail_priority, viewerFeeling: graphicLanguage.energy },
    artDirection: { graphicDesignRatio: 0.62, pipeline: ["Frame", "Hero Isolation", "Background Reconstruction", "Depth Creation", "Atmospheric Lighting", "Commercial Color Grade", "Graphic Shapes", "Red Identity System", "Textures", "Light Effects", "Particles", "Typography", "Footer System", "Commercial Polish"] },
    selected,
    best: selected,
    variants: [selected],
    winner_reason: "Single painted key-art pipeline; old layout candidate selection is frozen.",
  };
}

function paintPhoto(ctx, image, crop, width, height, language) {
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.filter = `brightness(${Math.round((language.brightness || 1) * 88)}%) contrast(${Math.round((language.contrast || 1.1) * 108)}%) saturate(${Math.round((language.saturation || 1.05) * 94)}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();
}

function reconstructBackground(ctx, image, crop, width, height, language) {
  const tone = toneFor(language);
  const aggression = language.graphic_aggression || 0.58;
  ctx.save();
  ctx.fillStyle = "#020202";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 0.28;
  ctx.filter = `blur(${Math.round(width * 0.018)}px) brightness(42%) contrast(145%) saturate(115%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, -width * 0.18, -height * 0.12, width * 1.35, height * 1.24);
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(0,0,0,0.92)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width * (0.42 + aggression * 0.12), 0);
  ctx.bezierCurveTo(width * 0.62, height * 0.22, width * 0.42, height * 0.72, width * 0.64, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  const redField = ctx.createRadialGradient(width * 0.24, height * 0.45, 0, width * 0.24, height * 0.45, width * 0.48);
  redField.addColorStop(0, `rgba(${tone.core},${0.22 + (language.redIntensity || 0.46) * 0.34})`);
  redField.addColorStop(0.44, `rgba(${tone.core},0.18)`);
  redField.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = redField;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function createDepth(ctx, hero, width, height, language) {
  const tone = toneFor(language);
  ctx.save();
  const floorShadow = ctx.createRadialGradient(hero.x + hero.w * 0.46, hero.y + hero.h * 0.88, 0, hero.x + hero.w * 0.46, hero.y + hero.h * 0.88, hero.w * 0.9);
  floorShadow.addColorStop(0, "rgba(0,0,0,0.72)");
  floorShadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = floorShadow;
  ctx.fillRect(0, 0, width, height);
  const rim = ctx.createRadialGradient(hero.x + hero.w * 0.26, hero.y + hero.h * 0.32, 0, hero.x + hero.w * 0.26, hero.y + hero.h * 0.32, hero.h * 0.62);
  rim.addColorStop(0, `rgba(${tone.hot},0.22)`);
  rim.addColorStop(0.48, `rgba(${tone.core},0.12)`);
  rim.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function isolateHero(ctx, image, crop, hero, width, height, language) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hero.x + hero.w * 0.52, hero.y + hero.h * 0.48, hero.w * 0.7, hero.h * 0.58, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.filter = `brightness(${Math.round(108 + (language.emotional_intensity || 0.66) * 8)}%) contrast(${Math.round(126 + (language.graphic_aggression || 0.58) * 18)}%) saturate(${Math.round(108 + (language.redIntensity || 0.46) * 14)}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();
}

function atmosphericLighting(ctx, width, height, language) {
  const tone = toneFor(language);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 5; i += 1) {
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = `rgba(${tone.hot},1)`;
    ctx.lineWidth = width * (0.004 + i * 0.0016);
    ctx.beginPath();
    ctx.moveTo(-width * 0.08, height * (0.2 + i * 0.11));
    ctx.bezierCurveTo(width * 0.22, height * (0.08 + i * 0.09), width * 0.46, height * (0.34 + i * 0.07), width * 0.86, height * (0.06 + i * 0.12));
    ctx.stroke();
  }
  const bloom = ctx.createRadialGradient(width * 0.18, height * 0.38, 0, width * 0.18, height * 0.38, width * 0.5);
  bloom.addColorStop(0, `rgba(${tone.hot},0.22)`);
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function graphicDesignSystem(ctx, width, height, language) {
  const tone = toneFor(language);
  const density = language.poster_density || 0.58;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.beginPath();
  ctx.moveTo(width * 0.02, height * 0.08);
  ctx.lineTo(width * 0.28, height * 0.02);
  ctx.lineTo(width * 0.18, height * 0.98);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(${tone.core},${0.08 + density * 0.12})`;
  ctx.beginPath();
  ctx.moveTo(width * 0.18, 0);
  ctx.bezierCurveTo(width * 0.44, height * 0.28, width * 0.18, height * 0.72, width * 0.52, height);
  ctx.lineTo(width * 0.28, height);
  ctx.bezierCurveTo(width * 0.08, height * 0.65, width * 0.28, height * 0.24, width * 0.06, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function texturesParticles(ctx, width, height, language) {
  const tone = toneFor(language);
  const density = language.texture_density || 0.42;
  ctx.save();
  for (let i = 0; i < Math.round(80 + density * 120); i += 1) {
    const x = width * (((i * 47) % 100) / 100);
    const y = height * (((i * 83) % 100) / 100);
    ctx.globalAlpha = 0.025 + density * 0.035;
    ctx.fillStyle = i % 5 === 0 ? `rgba(${tone.hot},1)` : "rgba(255,255,255,0.82)";
    ctx.fillRect(x, y, Math.max(1, width * 0.001), Math.max(1, width * 0.001));
  }
  ctx.globalAlpha = 0.1 + density * 0.12;
  ctx.strokeStyle = "rgba(255,255,255,0.76)";
  ctx.lineWidth = Math.max(1, width * 0.0008);
  for (let i = 0; i < 24; i += 1) {
    const x = width * (((i * 29) % 58) / 100);
    const y = height * (((i * 67) % 100) / 100);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width * (0.014 + (i % 4) * 0.008), y - height * (0.022 + (i % 5) * 0.01));
    ctx.stroke();
  }
  ctx.restore();
}

function typographyLayer(ctx, width, height, metadata, language) {
  const tone = toneFor(language);
  const { title, subtitle } = splitTitle(metadata);
  const titleMaxWidth = width * 0.58;
  const startSize = width * (0.15 + (language.graphic_aggression || 0.58) * 0.035);
  const block = measureLines(ctx, title, titleMaxWidth, startSize, width * 0.075, language.titleFont || "Bebas Neue", 4);
  let x = width * 0.055;
  let y = height * 0.13;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.98)";
  ctx.shadowBlur = width * 0.022;
  ctx.strokeStyle = "rgba(0,0,0,0.84)";
  ctx.fillStyle = "#fff6ea";
  ctx.lineWidth = Math.max(5, block.size * 0.026);
  ctx.font = font(block.size, language.titleFont || "Bebas Neue", 900);
  block.lines.forEach(line => {
    ctx.strokeText(line, x, y + block.size);
    ctx.fillText(line, x, y + block.size);
    y += block.lineHeight;
  });
  const brush = subtitle || block.lines[0] || "ORIGINAL";
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = `rgba(${tone.core},0.86)`;
  ctx.font = font(Math.max(width * 0.055, block.size * 0.36), "Permanent Marker", 900);
  ctx.fillText(brush, x + width * 0.02, y - block.lineHeight * 0.1);
  ctx.restore();
  return { x, y: y + height * 0.03, w: titleMaxWidth };
}

async function brandAnchor(ctx, anchor, width) {
  const logo = await loadLogo();
  const logoW = width * 0.17;
  const logoH = logoW * (logo.height / logo.width);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(anchor.x - width * 0.012, anchor.y - width * 0.01, logoW + width * 0.024, logoH + width * 0.02);
  ctx.fillStyle = "rgba(208,0,18,0.78)";
  ctx.fillRect(anchor.x - width * 0.012, anchor.y + logoH + width * 0.012, logoW * 0.7, Math.max(2, width * 0.003));
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = width * 0.012;
  ctx.drawImage(logo, anchor.x, anchor.y, logoW, logoH);
  ctx.restore();
  return logoH;
}

function footerSystem(ctx, width, height, settings, language) {
  const tone = toneFor(language);
  const points = sellingPoints(settings);
  let x = width * 0.055;
  const y = height * 0.925;
  ctx.save();
  ctx.font = font(width * 0.014, "Bebas Neue", 400);
  points.forEach(text => {
    ctx.fillStyle = `rgba(${tone.core},0.9)`;
    ctx.fillRect(x, y - width * 0.011, width * 0.008, width * 0.008);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.fillText(text, x + width * 0.014, y);
    x += ctx.measureText(text).width + width * 0.046;
  });
  ctx.restore();
}

function commercialPolish(ctx, width, height, language) {
  const aggression = language.graphic_aggression || 0.58;
  ctx.save();
  const vignette = ctx.createRadialGradient(width * 0.58, height * 0.42, height * 0.1, width * 0.58, height * 0.42, width * 0.84);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${0.46 + aggression * 0.24})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = Math.max(1, width * 0.0012);
  ctx.strokeRect(width * 0.012, width * 0.012, width - width * 0.024, height - width * 0.024);
  ctx.restore();
}

export async function renderCommercialKeyArtToCanvas(canvas, image, metadata = {}, settings = {}, width = 1920, height = 1080, existingPlan = null) {
  const plan = existingPlan?.engine === ENGINE_NAME ? existingPlan : await generateCommercialKeyArtPlan(image, metadata, settings, width, height);
  const language = plan.graphicLanguage;
  const crop = plan.selected.crop;
  const hero = heroOnCanvas(image, plan.analysis, crop, width, height);
  const manualAllowed = Object.values(settings?.manualOverrides || {}).some(Boolean);
  if (!plan.selected.score.passesQualityGate && !manualAllowed) throw new Error(`Commercial Key Art rejected: ${plan.selected.score.qualityFailures.join(", ")}`);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  reconstructBackground(ctx, image, crop, width, height, language);
  paintPhoto(ctx, image, crop, width, height, language);
  createDepth(ctx, hero, width, height, language);
  atmosphericLighting(ctx, width, height, language);
  graphicDesignSystem(ctx, width, height, language);
  texturesParticles(ctx, width, height, language);
  isolateHero(ctx, image, crop, hero, width, height, language);
  const anchor = typographyLayer(ctx, width, height, metadata, language);
  const logoHeight = await brandAnchor(ctx, { x: anchor.x, y: anchor.y }, width);
  footerSystem(ctx, width, height, settings, language);
  commercialPolish(ctx, width, height, language);
  canvas.__fleshlabPosterPlan = { ...plan, selected: { ...plan.selected, logoHeight } };
  return canvas.__fleshlabPosterPlan;
}

export async function renderPosterToCanvas(canvas, image, metadata, settings, width, height) {
  return await renderCommercialKeyArtToCanvas(canvas, image, metadata, settings, width, height);
}

export async function generatePosterPlan(image, metadata, settings, width, height) {
  return await generateCommercialKeyArtPlan(image, metadata, settings, width, height);
}

export function selectPosterVariant(plan) {
  return plan?.selected || plan?.best || null;
}

export async function renderPosterVariantToCanvas(canvas, image, plan, variantPlan, settings, width, height) {
  const metadata = plan?.metadata || {};
  const commercialPlan = plan?.engine === ENGINE_NAME ? plan : await generateCommercialKeyArtPlan(image, metadata, settings, width, height);
  return await renderCommercialKeyArtToCanvas(canvas, image, commercialPlan.metadata, settings, width, height, commercialPlan);
}