import { analyzePosterImage } from "@/lib/aiMediaStudio/posterAnalysis";
import { createArtDirectionPlan } from "@/lib/aiMediaStudio/artDirectionEngine";
import { FLESHLAB_BRAND_IDENTITY } from "@/lib/aiMediaStudio/brandIdentityEngine";
import { renderPremiumCampaignAsset } from "@/lib/heroPhotography/premiumCampaignDesignSystem";

export const HERO_CAMPAIGN_FORMATS = [
  { key: "youtube_thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720, role: "thumbnail" },
  { key: "instagram_feed", label: "Instagram Feed", width: 1080, height: 1080, role: "feed" },
  { key: "instagram_story", label: "Instagram Story", width: 1080, height: 1920, role: "story" },
  { key: "x_banner", label: "X Banner", width: 1500, height: 500, role: "banner" },
  { key: "website_hero", label: "Website Hero", width: 1920, height: 900, role: "hero" },
  { key: "ppv_cover", label: "PPV Cover", width: 1600, height: 2400, role: "cover" },
];

const fallbackAnalysis = {
  subjectCenter: { x: 0.5, y: 0.48 },
  subjectSide: "center",
  negativeSpace: { x: 0.08, y: 0.56, w: 0.52, h: 0.3, score: 0.72 },
  detections: {},
  backgroundComplexity: 0.42,
  brightness: 0.54,
  subjectSeparation: 0.64,
};

let logoPromise;
function loadLogo() {
  if (!logoPromise) {
    logoPromise = new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = FLESHLAB_BRAND_IDENTITY.logoUrl;
    });
  }
  return logoPromise;
}

function imageFromSource(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function upper(value) { return String(value || "").trim().toUpperCase(); }
function compact(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function font(size, family = "Inter", weight = 900) { return `${weight} ${Math.round(size)}px "${family}", Impact, Arial, sans-serif`; }
function rect(zone, w, h) { return { x: zone.x * w, y: zone.y * h, w: zone.w * w, h: zone.h * h }; }
function safeSlug(value, fallback = "campaign") { return compact(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback; }

function coverImage(ctx, image, width, height, focus, zoom = 1) {
  const scale = Math.max(width / image.width, height / image.height) * clamp(zoom, 0.9, 1.28);
  const sw = width / scale;
  const sh = height / scale;
  const sx = clamp(image.width * focus.x - sw / 2, 0, Math.max(0, image.width - sw));
  const sy = clamp(image.height * focus.y - sh / 2, 0, Math.max(0, image.height - sh));
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

function drawAccents(ctx, width, height, plan) {
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.red;
  ctx.translate(width * 0.74, height * 0.08);
  ctx.rotate(-0.08);
  ctx.fillRect(0, 0, width * 0.34, Math.max(10, height * 0.018));
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "rgba(244,241,234,0.2)";
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeRect(width * 0.025, height * 0.035, width * 0.95, height * 0.93);
  ctx.globalAlpha = plan.layoutFamily?.includes("Streetwear") ? 0.18 : 0.1;
  ctx.fillStyle = "#ffffff";
  for (let x = 0; x < width; x += width * 0.045) for (let y = 0; y < height; y += height * 0.06) ctx.fillRect(x, y, 1.4, 1.4);
  ctx.restore();
}

function applyGrade(ctx, plan, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = plan.imageTreatment.grade === "high_energy_drop" ? "rgba(207,16,45,0.16)" : "rgba(5,5,6,0.08)";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  const overlay = rect(plan.imageTreatment.textReadabilityOverlay.zone, width, height);
  const gradient = ctx.createLinearGradient(overlay.x, overlay.y, overlay.x + overlay.w, overlay.y + overlay.h);
  gradient.addColorStop(0, "rgba(0,0,0,0.76)");
  gradient.addColorStop(0.64, "rgba(0,0,0,0.38)");
  gradient.addColorStop(1, "rgba(0,0,0,0.04)");
  ctx.fillStyle = gradient;
  ctx.fillRect(overlay.x, overlay.y, overlay.w, overlay.h);
}

async function drawLogo(ctx, zone, width, height) {
  const box = rect(zone, width, height);
  const logo = await loadLogo();
  if (logo) {
    const logoW = Math.min(box.w, width * 0.18);
    const logoH = logoW * (logo.height / logo.width);
    ctx.drawImage(logo, box.x, box.y, logoW, logoH);
    return logoH;
  }
  ctx.font = font(width * 0.036, "Inter", 950);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.fillText("FLESHLAB", box.x, box.y + height * 0.045, box.w);
  return height * 0.045;
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = upper(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = "";
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = word; }
  });
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const packed = [];
  const perLine = Math.ceil(words.length / maxLines);
  for (let i = 0; i < words.length && packed.length < maxLines; i += perLine) packed.push(words.slice(i, i + perLine).join(" "));
  return packed;
}

function fitBlock(ctx, text, maxWidth, baseSize, minSize, maxLines, family = "Bebas Neue") {
  for (let size = baseSize; size >= minSize; size -= Math.max(2, baseSize * 0.045)) {
    ctx.font = font(size, family, 900);
    const lines = wrapLines(ctx, text, maxWidth, maxLines);
    if (lines.length <= maxLines && lines.every(line => ctx.measureText(line).width <= maxWidth)) return { lines, size, warning: null };
  }
  ctx.font = font(minSize, family, 900);
  const lines = wrapLines(ctx, text, maxWidth, maxLines);
  return { lines: lines.slice(0, maxLines), size: minSize, warning: `Text may be too long for ${formatLabel(maxWidth)}; reduced to minimum safe size.` };
}

function formatLabel(width) { return `${Math.round(width)}px safe text zone`; }

function drawTextLines(ctx, lines, x, y, maxWidth, size, family = "Bebas Neue", color = FLESHLAB_BRAND_IDENTITY.colors.cream) {
  ctx.font = font(size, family, 900);
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(0,0,0,0.78)";
  ctx.lineWidth = Math.max(2, size * 0.035);
  ctx.shadowColor = "rgba(0,0,0,0.88)";
  ctx.shadowBlur = size * 0.16;
  lines.forEach((line, index) => {
    const lineY = y + size + index * size * 0.84;
    ctx.strokeText(upper(line), x, lineY, maxWidth);
    ctx.fillText(upper(line), x, lineY, maxWidth);
  });
}

function drawCampaignCopy(ctx, plan, format, campaign) {
  const warnings = [];
  const box = rect(plan.title.zone, format.width, format.height);
  const maxTitleLines = plan.title.maxLines || 3;
  const titleBase = format.height > format.width ? format.width * 0.17 : format.width * 0.082;
  const titleFit = fitBlock(ctx, campaign.campaignTitle, box.w, titleBase, Math.max(34, format.width * 0.032), maxTitleLines);
  if (titleFit.warning) warnings.push(`${format.label}: campaign title ${titleFit.warning}`);
  drawTextLines(ctx, titleFit.lines, box.x, box.y, box.w, titleFit.size);
  const subtitleY = box.y + titleFit.size * (1 + Math.min(titleFit.lines.length, maxTitleLines) * 0.84) + format.height * 0.012;
  if (campaign.subtitle) drawTextLines(ctx, [campaign.subtitle], box.x, subtitleY, box.w, Math.max(18, format.width * 0.022), "Inter", "rgba(244,241,234,0.84)");
  const creator = rect(plan.creator.zone, format.width, format.height);
  const creatorFit = fitBlock(ctx, campaign.performerName, creator.w, Math.max(18, format.width * 0.021), Math.max(14, format.width * 0.014), 2, "Inter");
  if (creatorFit.warning) warnings.push(`${format.label}: performer name ${creatorFit.warning}`);
  drawTextLines(ctx, creatorFit.lines, creator.x, creator.y, creator.w, creatorFit.size, "Inter", "rgba(255,255,255,0.9)");
  return warnings;
}

function drawCTA(ctx, plan, format, text) {
  if (!plan.cta.visible || !text) return;
  const box = rect(plan.cta.zone, format.width, format.height);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.red;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, box.h * 0.5);
  ctx.fill();
  ctx.font = font(box.h * 0.35, "Inter", 900);
  ctx.fillStyle = "#fff";
  ctx.fillText(upper(text), box.x + box.h * 0.4, box.y + box.h * 0.64, box.w - box.h * 0.8);
}

export function getCampaignMetadataSuggestion(output, pipeline, campaignFamily) {
  const blueprint = pipeline?.productionBlueprint || output?.heroPhotographyPlan?.productionBlueprint || {};
  return {
    campaignTitle: compact(blueprint.campaignTitle || output?.heroPhotographyPlan?.campaignTitle || campaignFamily || "Hero Campaign"),
    performerName: compact(blueprint.performerName || blueprint.creatorName || output?.heroPhotographyPlan?.creatorName || "Featured Creator"),
    subtitle: compact(blueprint.campaignSubtitle || blueprint.seriesName || output?.heroPhotographyPlan?.campaignSubtitle || "Hero Photography Campaign"),
    cta: compact(blueprint.primaryCTA || "Watch Now"),
    campaignLabel: compact(blueprint.campaignLabel || campaignFamily || ""),
    releaseName: compact(blueprint.releaseName || blueprint.seriesName || "")
  };
}

function resolveMetadataField(key, userMetadata, savedMetadata, aiSuggestion, fallback) {
  if (["user", "ai"].includes(userMetadata?.source?.[key])) return { value: compact(userMetadata?.[key]), source: userMetadata.source[key] };
  const options = [[savedMetadata?.[key], "project"], [aiSuggestion?.[key], "ai"], [fallback, "fallback"]];
  const selected = options.find(([value]) => compact(value));
  return { value: compact(selected?.[0] || fallback), source: selected?.[1] || "fallback" };
}

export function mergeCampaignMetadata({ output, pipeline, campaignFamily, userMetadata = {}, savedMetadata = {} }) {
  const aiSuggestion = getCampaignMetadataSuggestion(output, pipeline, campaignFamily);
  const fallbacks = { campaignTitle: "Hero Campaign", performerName: "Featured Creator", subtitle: "", cta: "", campaignLabel: "", releaseName: "" };
  const metadata = { source: {} };
  Object.keys(fallbacks).forEach(key => {
    const resolved = resolveMetadataField(key, userMetadata, savedMetadata, aiSuggestion, fallbacks[key]);
    metadata[key] = resolved.value;
    metadata.source[key] = resolved.source;
  });
  return { ...metadata, aiSuggestion };
}

function campaignDataFromOutput(output, pipeline, campaignFamily, metadata = {}) {
  const resolved = mergeCampaignMetadata({ output, pipeline, campaignFamily, userMetadata: metadata.userMetadata, savedMetadata: metadata.savedMetadata });
  return {
    base: `${safeSlug(resolved.campaignTitle)}_${safeSlug(resolved.performerName)}`,
    campaignTitle: resolved.campaignTitle,
    performerName: resolved.performerName,
    creatorName: resolved.performerName,
    subtitle: resolved.subtitle,
    campaignSubtitle: resolved.subtitle,
    seriesName: resolved.releaseName || resolved.subtitle || "Hero Photography Campaign",
    primaryCTA: resolved.cta,
    campaignLabel: resolved.campaignLabel,
    releaseName: resolved.releaseName,
    source: resolved.source,
    campaignMetadata: { campaignTitle: resolved.campaignTitle, performerName: resolved.performerName, subtitle: resolved.subtitle, cta: resolved.cta, campaignLabel: resolved.campaignLabel, releaseName: resolved.releaseName, source: resolved.source },
    releaseType: "premium_release",
    campaignGoal: "conversion",
    emotionalTone: "premium cinematic",
  };
}

async function renderCurrentAsset(image, analysis, format, campaign) {
  const plan = createArtDirectionPlan({ heroImage: image, analysis, brandIdentity: FLESHLAB_BRAND_IDENTITY, campaignBrief: campaign, campaignTitle: campaign.campaignTitle, creatorName: campaign.performerName, seriesName: campaign.seriesName, primaryCTA: campaign.primaryCTA, secondaryCTA: "Join FLESHLAB", platform: format.key, aspectRatio: `${format.width}:${format.height}`, releaseType: campaign.releaseType, campaignGoal: campaign.campaignGoal, emotionalTone: campaign.emotionalTone, creativeDirection: format.key === "x_banner" ? "luxury_editorial" : format.key === "ppv_cover" ? "streetwear_drop" : undefined, format });
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.black;
  ctx.fillRect(0, 0, format.width, format.height);
  ctx.filter = "brightness(82%) contrast(130%) saturate(112%)";
  coverImage(ctx, image, format.width, format.height, analysis.subjectCenter || fallbackAnalysis.subjectCenter, plan.composition.subjectScale);
  ctx.filter = "none";
  applyGrade(ctx, plan, format.width, format.height);
  drawAccents(ctx, format.width, format.height, plan);
  await drawLogo(ctx, plan.brand.logoZone, format.width, format.height);
  const typographyWarnings = drawCampaignCopy(ctx, plan, format, campaign);
  drawCTA(ctx, plan, format, campaign.primaryCTA);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return { format, filename: `${campaign.base}_${format.key}.jpg`, width: format.width, height: format.height, size: blob.size, blob, url: URL.createObjectURL(blob), kind: "visual", status: "ready", brandPlan: { family: plan.layoutFamily, artDirectionPlan: plan }, typographyWarnings, campaignMetadata: campaign.campaignMetadata, downstreamStage: "Campaign Assets", campaignComposerReady: true };
}

export async function composeCampaignFromHero(output, pipeline, campaignFamily, metadata = {}) {
  if (!output?.heroImage) throw new Error("Hero Photograph is required before composing campaign assets.");
  const image = await imageFromSource(output.heroImage);
  let analysis = fallbackAnalysis;
  try { analysis = { ...fallbackAnalysis, ...(await analyzePosterImage(image)) }; } catch { analysis = fallbackAnalysis; }
  const campaignData = campaignDataFromOutput(output, pipeline, campaignFamily, metadata);
  const currentVisualAssets = [];
  const visualAssets = [];
  for (const format of HERO_CAMPAIGN_FORMATS) {
    currentVisualAssets.push(await renderCurrentAsset(image, analysis, format, campaignData));
    visualAssets.push(await renderPremiumCampaignAsset({ image, analysis, format, campaign: campaignData }));
  }
  const typographyWarnings = [...currentVisualAssets, ...visualAssets].flatMap(asset => asset.typographyWarnings || []);
  return { campaignId: campaignData.base, campaignData, campaignMetadata: campaignData.campaignMetadata, sourceHeroImage: output.heroImage, currentVisualAssets, visualAssets, typographyWarnings, createdAt: new Date().toISOString(), pipeline: ["Hero Photography", "Premium Campaign Design System", "Brand Graphic Language", "Editorial Typography", "Campaign Composer", "Campaign Assets"], downstreamReady: visualAssets.length === HERO_CAMPAIGN_FORMATS.length };
}