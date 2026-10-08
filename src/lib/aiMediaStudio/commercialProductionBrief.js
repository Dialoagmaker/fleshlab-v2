import { createArtDirectionPlan, createCommercialAgencyValidation, createHeroImageReconstructionPlan, createVisualCampaignFromReconstructedHero, validateNoTextHeroImage } from "./coverEngineV4Stages";

const BRAND = "FLESHLAB";
const RED = "#cf102d";
const PAPER = "#f4f1ea";

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function font(size, family = "Impact", weight = 900) {
  return `${weight} ${size}px ${family}, Arial Black, Inter, sans-serif`;
}

function looksLikeFilename(value = "") {
  const text = String(value).trim();
  return /\.(mp4|mov|m4v|webm)$/i.test(text) || /(^|[_-])(vid|img|dsc|scene|final|export|copy|edit|render|take)([_-]|$)/i.test(text) || /[_-]{2,}|\d{6,}/.test(text);
}

function resolveTitle(metadata = {}, campaign = {}) {
  const visualCampaign = metadata.visualCampaign || {};
  return upper(visualCampaign.campaignTitle || campaign.visualCampaignTitle || "THE CHECK-IN");
}

function resolveSubtitle(metadata = {}, campaign = {}) {
  const visualCampaign = metadata.visualCampaign || {};
  return upper(visualCampaign.subtitle || campaign.visualCampaignSubtitle || "A PRIVATE MOMENT TURNS INTO A STORY");
}

function heroBoxPixels(analysis, crop, image, width, height) {
  const source = analysis.subjectBox || { x: 0.52, y: 0.16, w: 0.32, h: 0.66 };
  return {
    x: ((source.x * image.width - crop.sx) / crop.sw) * width,
    y: ((source.y * image.height - crop.sy) / crop.sh) * height,
    w: (source.w * image.width / crop.sw) * width,
    h: (source.h * image.height / crop.sh) * height,
  };
}

function cropFromHero(image, analysis, width, height, zoom = 1.2) {
  const outputAspect = width / height;
  let sw = image.width;
  let sh = image.height;
  if (image.width / image.height > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;
  sw /= zoom;
  sh /= zoom;
  const box = analysis.subjectBox || { x: 0.52, y: 0.16, w: 0.32, h: 0.66 };
  const cx = (box.x + box.w * 0.5) * image.width;
  const cy = (box.y + box.h * 0.47) * image.height;
  return {
    sx: clamp(cx - sw * 0.52, 0, Math.max(0, image.width - sw)),
    sy: clamp(cy - sh * 0.48, 0, Math.max(0, image.height - sh)),
    sw,
    sh,
    zoom,
  };
}

function intersects(a, b, pad = 0) {
  return !(a.x + a.w + pad < b.x || b.x + b.w + pad < a.x || a.y + a.h + pad < b.y || b.y + b.h + pad < a.y);
}

function measureTitle(ctx, title, maxWidth, maxLines, startSize, minSize) {
  const words = title.split(/\s+/).filter(Boolean);
  for (let size = startSize; size >= minSize; size -= 4) {
    ctx.font = font(size);
    const lines = [];
    let line = "";
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (!line || ctx.measureText(test).width <= maxWidth) line = test;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    if (lines.length <= maxLines) return { lines, size, lineHeight: size * 0.82, width: Math.max(...lines.map(item => ctx.measureText(item).width), 0), height: lines.length * size * 0.82 };
  }
  ctx.font = font(minSize);
  return { lines: [title], size: minSize, lineHeight: minSize * 0.82, width: Math.min(maxWidth, ctx.measureText(title).width), height: minSize * 0.82 };
}

function buildTypographyPlan(width, height, hero, metadata, campaign, side) {
  const probe = document.createElement("canvas").getContext("2d");
  const safe = Math.round(width * 0.055);
  const title = resolveTitle(metadata, campaign);
  const subtitle = resolveSubtitle(metadata, campaign);
  const maxWidth = side === "left" ? Math.max(width * 0.34, hero.x - safe * 1.4) : Math.max(width * 0.34, width - (hero.x + hero.w) - safe * 1.4);
  const x = side === "left" ? safe : width - safe - maxWidth;
  const y = height * 0.18;
  const titleBlock = measureTitle(probe, title, maxWidth, 3, width * 0.105, width * 0.048);
  const subtitleSize = Math.max(24, Math.min(width * 0.026, maxWidth / Math.max(16, subtitle.length * 0.55)));
  const subtitleBox = { x, y: y + titleBlock.height + height * 0.035, w: maxWidth, h: subtitleSize * 2.2 };
  const titleBox = { x, y, w: Math.min(maxWidth, titleBlock.width), h: titleBlock.height };
  const ctaBox = { x, y: subtitleBox.y + subtitleBox.h + height * 0.035, w: Math.min(maxWidth * 0.54, width * 0.24), h: Math.max(44, height * 0.055) };
  const logoBox = { x, y: height * 0.065, w: Math.min(width * 0.17, 260), h: Math.min(width * 0.058, 88) };
  return { title, subtitle, titleBlock, subtitleSize, titleBox, subtitleBox, ctaBox, logoBox, side, safeMargin: safe };
}

function buildBriefCandidate(image, plan, metadata, settings, width, height, revision = {}) {
  const analysis = plan.analysis || {};
  const reconstructionPlan = createHeroImageReconstructionPlan(analysis);
  const visualCampaign = createVisualCampaignFromReconstructedHero(analysis, reconstructionPlan);
  const artDirection = createArtDirectionPlan(visualCampaign, reconstructionPlan, width, height);
  const campaign = { ...(plan.campaign || {}), visualCampaignTitle: visualCampaign.campaignTitle, visualCampaignSubtitle: visualCampaign.subtitle, cta: "WATCH NOW", footerCategory: visualCampaign.seriesName };
  const creativeMetadata = { visualCampaign };
  const crop = cropFromHero(image, analysis, width, height, revision.zoom || Number(settings.zoom) || 1.3);
  const hero = heroBoxPixels(analysis, crop, image, width, height);
  const side = revision.side || ((hero.x + hero.w * 0.5) > width * 0.52 ? "left" : "right");
  const typography = buildTypographyPlan(width, height, hero, creativeMetadata, campaign, side);
  const face = analysis.detections?.face ? heroBoxPixels({ subjectBox: analysis.detections.face }, crop, image, width, height) : { x: hero.x + hero.w * 0.28, y: hero.y + hero.h * 0.08, w: hero.w * 0.44, h: hero.h * 0.22 };
  return Object.freeze({
    type: "CommercialProductionBrief",
    locked: true,
    revision: revision.revision || 1,
    stageContracts: { advertisingPhotographer: metadata.advertisingPhotographer || null, reconstructionPlan, visualCampaign, artDirection },
    heroFrame: { source: "advertising_photographer_selection", frameIndex: metadata.frameIndex || null },
    heroCrop: crop,
    heroSafeZones: { hero, face, body: hero },
    faceSafeZones: [face],
    bodySafeZones: [hero],
    negativeSpaceMap: { preferredSide: side, typographyZone: { x: typography.titleBox.x, y: typography.titleBox.y, w: Math.max(typography.titleBox.w, typography.subtitleBox.w), h: typography.ctaBox.y + typography.ctaBox.h - typography.titleBox.y } },
    compositionGrid: { width, height, safeMargin: typography.safeMargin, heroColumn: side === "left" ? "right" : "left", textColumn: side },
    visualHierarchy: { first: "hero", second: "title", third: "brand", fourth: "subtitle", fifth: "cta" },
    titleHierarchy: { text: typography.title, box: typography.titleBox, lines: typography.titleBlock.lines, fontSize: typography.titleBlock.size, lineHeight: typography.titleBlock.lineHeight },
    subtitleHierarchy: { text: typography.subtitle, box: typography.subtitleBox, fontSize: typography.subtitleSize },
    logoRules: { text: BRAND, box: typography.logoBox, minWidth: width * 0.12 },
    ctaRules: { text: upper(campaign.cta || "WATCH NOW"), box: typography.ctaBox },
    brandRules: { accent: RED, paper: PAPER, footer: upper(campaign.footerCategory || "FLESHLAB ORIGINAL") },
    reconstructionPlan,
    lightingPlan: { heroRim: true, typographyShadow: true, backgroundSuppression: revision.backgroundSuppression ?? reconstructionPlan.backgroundSuppression },
    colorGradePlan: { palette: reconstructionPlan.colorGrade, contrast: reconstructionPlan.localContrast, saturation: 1.08 },
    backgroundPlan: { mode: "reconstructed_from_source", blur: width * 0.028, darkness: reconstructionPlan.backgroundSuppression },
    texturePlan: { grain: 0.035, particles: 24 },
    artDirectionPlan: { ...artDirection, qualityBar: "premium_streaming_key_art", noTextMustStillWork: true },
    typographyPlan: typography,
    platformRules: { safeMargin: typography.safeMargin, forbidTextFaceOverlap: true, forbidBorderTouch: true },
    exportRules: { width, height, rendererMustObeyBrief: true },
  });
}

function validateBrief(brief) {
  const issues = [];
  const safe = brief.platformRules.safeMargin;
  const textBoxes = [brief.titleHierarchy.box, brief.subtitleHierarchy.box, brief.ctaRules.box, brief.logoRules.box];
  textBoxes.forEach((box, index) => {
    if (box.x < safe || box.y < safe || box.x + box.w > brief.exportRules.width - safe || box.y + box.h > brief.exportRules.height - safe) issues.push(`safe margin violation ${index}`);
  });
  brief.faceSafeZones.forEach(face => {
    if (textBoxes.some(box => intersects(box, face, safe * 0.2))) issues.push("typography overlaps face safe zone");
  });
  if (intersects(brief.titleHierarchy.box, brief.heroSafeZones.hero, safe * 0.12)) issues.push("title overlaps hero");
  if (intersects(brief.ctaRules.box, { x: 0, y: brief.exportRules.height * 0.88, w: brief.exportRules.width, h: brief.exportRules.height * 0.12 }, 0)) issues.push("cta overlaps footer");
  if (brief.logoRules.box.w < brief.logoRules.minWidth) issues.push("logo too small");
  return issues;
}

export function createCommercialProductionBrief(image, plan, metadata, settings, width, height) {
  const attempts = [
    { revision: 1, side: undefined, zoom: 1.24, backgroundSuppression: 0.72 },
    { revision: 2, side: "left", zoom: 1.18, backgroundSuppression: 0.78 },
    { revision: 3, side: "right", zoom: 1.18, backgroundSuppression: 0.78 },
    { revision: 4, side: "left", zoom: 1.08, backgroundSuppression: 0.84 },
  ];
  let best = null;
  for (const revision of attempts) {
    const brief = buildBriefCandidate(image, plan, metadata, settings, width, height, revision);
    const issues = validateBrief(brief);
    if (!issues.length) return brief;
    best = best || brief;
  }
  return best;
}

function drawCovered(ctx, image, crop, x, y, w, h) {
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, x, y, w, h);
}

function paintBackground(ctx, image, brief) {
  const { width, height } = brief.exportRules;
  ctx.fillStyle = "#030303";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.filter = `blur(${brief.backgroundPlan.blur}px) brightness(34%) contrast(150%) saturate(82%)`;
  ctx.globalAlpha = 0.82;
  drawCovered(ctx, image, brief.heroCrop, -width * 0.08, -height * 0.08, width * 1.16, height * 1.16);
  ctx.restore();
  const shadow = ctx.createLinearGradient(0, 0, width, height);
  shadow.addColorStop(0, `rgba(0,0,0,${brief.backgroundPlan.darkness})`);
  shadow.addColorStop(0.5, "rgba(0,0,0,0.28)");
  shadow.addColorStop(1, `rgba(0,0,0,${Math.min(0.94, brief.backgroundPlan.darkness + 0.14)})`);
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, width, height);
}

function paintHero(ctx, image, brief) {
  const { width, height } = brief.exportRules;
  const hero = brief.heroSafeZones.hero;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hero.x + hero.w * 0.5, hero.y + hero.h * 0.46, Math.max(80, hero.w * 0.74), Math.max(120, hero.h * 0.68), 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.filter = `brightness(118%) contrast(${Math.round(brief.colorGradePlan.contrast * 100)}%) saturate(112%)`;
  drawCovered(ctx, image, brief.heroCrop, 0, 0, width, height);
  ctx.restore();
  const key = ctx.createRadialGradient(hero.x + hero.w * 0.45, hero.y + hero.h * 0.22, 0, hero.x + hero.w * 0.48, hero.y + hero.h * 0.3, hero.h * 0.62);
  key.addColorStop(0, "rgba(255,218,172,0.28)");
  key.addColorStop(0.42, "rgba(255,160,96,0.12)");
  key.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(207,16,45,0.26)";
  ctx.lineWidth = Math.max(3, width * 0.004);
  ctx.beginPath();
  ctx.ellipse(hero.x + hero.w * 0.52, hero.y + hero.h * 0.46, Math.max(80, hero.w * 0.78), Math.max(120, hero.h * 0.7), 0, Math.PI * 0.74, Math.PI * 1.45);
  ctx.stroke();
  ctx.restore();
}

function paintComposition(ctx, brief) {
  const { width, height } = brief.exportRules;
  const zone = brief.negativeSpaceMap.typographyZone;
  const panel = ctx.createLinearGradient(zone.x, 0, zone.x + zone.w, 0);
  panel.addColorStop(0, "rgba(0,0,0,0.88)");
  panel.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = panel;
  ctx.fillRect(Math.max(0, zone.x - width * 0.03), 0, Math.min(width * 0.5, zone.w + width * 0.12), height);
  ctx.fillStyle = RED;
  ctx.fillRect(zone.x, Math.max(brief.platformRules.safeMargin, zone.y - height * 0.045), width * 0.18, Math.max(5, height * 0.009));
}

function paintBrand(_, brief) {
  const ctx = brief.ctx;
  const box = brief.logoRules.box;
  ctx.fillStyle = "rgba(0,0,0,0.88)";
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = Math.max(2, brief.exportRules.width * 0.0015);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = PAPER;
  ctx.font = font(box.h * 0.48);
  ctx.fillText(BRAND, box.x + box.w * 0.07, box.y + box.h * 0.58, box.w * 0.86);
  ctx.fillStyle = RED;
  ctx.fillRect(box.x, box.y + box.h + brief.exportRules.width * 0.008, box.w * 0.62, Math.max(3, brief.exportRules.height * 0.006));
}

function paintTypography(ctx, brief) {
  const title = brief.titleHierarchy;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = brief.exportRules.width * 0.012;
  ctx.strokeStyle = "rgba(0,0,0,0.86)";
  ctx.lineWidth = Math.max(4, title.fontSize * 0.04);
  ctx.fillStyle = PAPER;
  ctx.font = font(title.fontSize);
  let y = title.box.y + title.fontSize;
  title.lines.forEach(line => {
    ctx.strokeText(line, title.box.x, y, title.box.w);
    ctx.fillText(line, title.box.x, y, title.box.w);
    y += title.lineHeight;
  });
  const sub = brief.subtitleHierarchy;
  ctx.font = font(sub.fontSize, "Inter", 800);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(sub.text, sub.box.x, sub.box.y + sub.fontSize, sub.box.w);
  ctx.restore();
}

function paintFooterCta(ctx, brief) {
  const { width, height } = brief.exportRules;
  const cta = brief.ctaRules.box;
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.roundRect(cta.x, cta.y, cta.w, cta.h, cta.h * 0.5);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = font(cta.h * 0.36, "Inter", 900);
  ctx.fillText(brief.ctaRules.text, cta.x + cta.h * 0.42, cta.y + cta.h * 0.64, cta.w - cta.h * 0.75);
  ctx.font = font(width * 0.014, "Inter", 900);
  ctx.fillStyle = RED;
  ctx.fillText(brief.brandRules.footer, width * 0.055, height * 0.93);
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.fillText("RAW BUT PREMIUM", width * 0.24, height * 0.93);
}

function finalGrade(ctx, brief) {
  const { width, height } = brief.exportRules;
  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.45, height * 0.12, width * 0.5, height * 0.45, width * 0.82);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(207,16,45,0.42)";
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeRect(width * 0.018, width * 0.018, width - width * 0.036, height - width * 0.036);
}

function sampleContrast(ctx, box) {
  const data = ctx.getImageData(Math.max(0, Math.floor(box.x)), Math.max(0, Math.floor(box.y)), Math.max(1, Math.floor(box.w)), Math.max(1, Math.floor(box.h))).data;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 16) {
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    min = Math.min(min, l);
    max = Math.max(max, l);
  }
  return clamp((max - min) / 120, 0, 1);
}

export function validateRenderedProductionCanvas(canvas, brief) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const briefIssues = validateBrief(brief);
  const titleReadability = sampleContrast(ctx, brief.titleHierarchy.box);
  const subtitleReadability = sampleContrast(ctx, brief.subtitleHierarchy.box);
  const logoVisibility = sampleContrast(ctx, brief.logoRules.box);
  const hero = brief.heroSafeZones.hero;
  const heroDominance = clamp((hero.w * hero.h) / (brief.exportRules.width * brief.exportRules.height) * 2.6, 0, 1);
  const noCollision = briefIssues.length ? 0 : 1;
  const premiumSimilarity = clamp(0.55 + titleReadability * 0.12 + heroDominance * 0.18 + noCollision * 0.15);
  const screenshotLikeness = clamp(1 - (brief.lightingPlan.backgroundSuppression * 0.46 + noCollision * 0.22 + premiumSimilarity * 0.32));
  const total = Math.round(titleReadability * 18 + subtitleReadability * 10 + logoVisibility * 10 + heroDominance * 18 + noCollision * 18 + premiumSimilarity * 18 + (1 - screenshotLikeness) * 8);
  const failures = [...briefIssues];
  if (titleReadability < 0.58) failures.push("title readability failed");
  if (subtitleReadability < 0.38) failures.push("subtitle readability failed");
  if (logoVisibility < 0.35) failures.push("logo visibility failed");
  if (heroDominance < 0.38) failures.push("hero dominance failed");
  if (screenshotLikeness > 0.42) failures.push("screenshot likeness too high");
  if (total < 82) failures.push("final rendered commercial score below threshold");
  return { total, passed: failures.length === 0, failures, components: { titleReadability: Math.round(titleReadability * 100), subtitleReadability: Math.round(subtitleReadability * 100), logoVisibility: Math.round(logoVisibility * 100), heroDominance: Math.round(heroDominance * 100), typographyCollisions: Math.round(noCollision * 100), premiumSimilarity: Math.round(premiumSimilarity * 100), screenshotLikeness: Math.round(screenshotLikeness * 100) } };
}

export function renderProductionBriefToCanvas(canvas, image, brief, options = {}) {
  canvas.width = brief.exportRules.width;
  canvas.height = brief.exportRules.height;
  const ctx = canvas.getContext("2d");
  const paintBrief = { ...brief, ctx };
  paintBackground(ctx, image, brief);
  paintHero(ctx, image, brief);
  if (options.noText) {
    finalGrade(ctx, brief);
    return;
  }
  paintComposition(ctx, brief);
  paintBrand(ctx, paintBrief);
  paintTypography(ctx, brief);
  paintFooterCta(ctx, brief);
  finalGrade(ctx, brief);
}

export async function renderBriefDrivenCommercialKeyArt(canvas, image, plan, settings, width, height) {
  const metadata = { advertisingPhotographer: plan.metadata?.advertisingPhotographer || null, frameIndex: plan.selected?.candidate_id };
  let brief = createCommercialProductionBrief(image, plan, metadata, settings, width, height);
  const noTextCanvas = document.createElement("canvas");
  renderProductionBriefToCanvas(noTextCanvas, image, brief, { noText: true });
  let noTextValidation = validateNoTextHeroImage(noTextCanvas, brief);
  if (!noTextValidation.passed) {
    brief = createCommercialProductionBrief(image, plan, metadata, { ...settings, zoom: 1.38 }, width, height);
    renderProductionBriefToCanvas(noTextCanvas, image, brief, { noText: true });
    noTextValidation = validateNoTextHeroImage(noTextCanvas, brief);
  }
  renderProductionBriefToCanvas(canvas, image, brief);
  let validation = validateRenderedProductionCanvas(canvas, brief);
  let agencyValidation = createCommercialAgencyValidation(validation, noTextValidation);
  if (!agencyValidation.passed) {
    brief = createCommercialProductionBrief(image, plan, metadata, { ...settings, zoom: 1.18 }, width, height);
    renderProductionBriefToCanvas(noTextCanvas, image, brief, { noText: true });
    noTextValidation = validateNoTextHeroImage(noTextCanvas, brief);
    renderProductionBriefToCanvas(canvas, image, brief);
    validation = validateRenderedProductionCanvas(canvas, brief);
    agencyValidation = createCommercialAgencyValidation(validation, noTextValidation);
  }
  canvas.__commercialProductionBrief = brief;
  canvas.__commercialRenderedValidation = validation;
  canvas.__noTextHeroValidation = noTextValidation;
  canvas.__commercialAgencyValidation = agencyValidation;
  return { logoHeight: brief.logoRules.box.h, compositionMode: brief.compositionGrid.textColumn, visualSystemId: "cover-engine-v4-production", renderedRenderPlanHash: plan.renderPlanHash, renderMap: brief, renderDirection: brief.artDirectionPlan, commercialAdvertisingScore: validation.total, commercialScore: { ...validation, noTextValidation, agencyValidation }, artworkValidation: agencyValidation.passed ? "passed" : "rejected_or_best_available", commercialProductionBrief: brief };
}