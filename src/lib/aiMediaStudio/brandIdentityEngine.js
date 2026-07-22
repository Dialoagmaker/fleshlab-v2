import { analyzePosterImage } from "./posterAnalysis";
import { rankEmotionalCommercialFrames } from "./localAnalyzer";
import { createArtDirectionPlan } from "./artDirectionEngine";

export const FLESHLAB_BRAND_IDENTITY = {
  logoUrl: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/1591ab54c_ChatGPTImageJul14202612_16_43AM.png",
  brand: "FLESHLAB",
  lockup: "FLESHLAB AMATEUR WINS.",
  slogan: "AMATEUR WINS.",
  colors: { black: "#050506", red: "#cf102d", cream: "#f4f1ea", muted: "rgba(244,241,234,0.68)" },
  fonts: { display: "Bebas Neue", body: "Inter", accent: "Permanent Marker" },
  restrictions: { minimumClearspace: 0.04, neverStretchLogo: true, minimumTextContrastRatio: 4.5, minimumSafeMargin: 0.05 },
  ctaStyles: { brand_solid: { background: "#cf102d", color: "#ffffff", radius: "pill" } },
};

export const BRAND_CAMPAIGN_FORMATS = [
  { key: "youtube_thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720, role: "thumbnail" },
  { key: "youtube_cover", label: "YouTube Cover", width: 2560, height: 1440, role: "cover" },
  { key: "x_banner", label: "X Banner", width: 1500, height: 500, role: "banner" },
  { key: "instagram_feed", label: "Instagram Feed", width: 1080, height: 1080, role: "feed" },
  { key: "instagram_story", label: "Instagram Story", width: 1080, height: 1920, role: "story" },
  { key: "facebook_cover", label: "Facebook Cover", width: 1640, height: 624, role: "banner" },
  { key: "website_hero", label: "Website Hero", width: 1920, height: 900, role: "hero" },
  { key: "landing_page_banner", label: "Landing Page Banner", width: 1920, height: 720, role: "banner" },
  { key: "ppv_cover", label: "PPV Cover", width: 1600, height: 2400, role: "cover" },
  { key: "exclusive_release_cover", label: "Exclusive Release Cover", width: 1600, height: 2000, role: "cover" },
  { key: "behind_the_scenes_cover", label: "Behind The Scenes Cover", width: 1600, height: 1200, role: "cover" },
];

let logoPromise;
function loadLogo() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = FLESHLAB_BRAND_IDENTITY.logoUrl;
    });
  }
  return logoPromise;
}

function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function upper(value) { return String(value || "").trim().toUpperCase(); }
function font(size, family = "Inter", weight = 900) { return `${weight} ${Math.round(size)}px "${family}", Impact, Arial, sans-serif`; }
function px(rect, width, height) { return { x: rect.x * width, y: rect.y * height, w: rect.w * width, h: rect.h * height }; }
function safeBaseName(item) { return (item?.fileName || "fleshlab_brand_campaign").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase(); }

function imageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(blob);
  });
}

function coverImage(ctx, image, width, height, focus, zoom = 1) {
  const baseScale = Math.max(width / image.width, height / image.height);
  const scale = baseScale * clamp(zoom, 0.92, 1.24);
  const sw = width / scale;
  const sh = height / scale;
  const sx = clamp(image.width * focus.x - sw / 2, 0, Math.max(0, image.width - sw));
  const sy = clamp(image.height * focus.y - sh / 2, 0, Math.max(0, image.height - sh));
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

function applyImageTreatment(ctx, plan, width, height) {
  const overlay = px(plan.imageTreatment.textReadabilityOverlay.zone, width, height);
  const strength = plan.imageTreatment.textReadabilityOverlay.strength;
  const gradient = ctx.createLinearGradient(overlay.x, overlay.y, overlay.x + overlay.w, overlay.y + overlay.h);
  gradient.addColorStop(0, `rgba(0,0,0,${0.52 + strength})`);
  gradient.addColorStop(0.62, `rgba(0,0,0,${0.32 + strength * 0.6})`);
  gradient.addColorStop(1, "rgba(0,0,0,0.04)");
  ctx.fillStyle = gradient;
  ctx.fillRect(overlay.x, overlay.y, overlay.w, overlay.h);
  const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.18, width / 2, height / 2, Math.max(width, height) * 0.7);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${plan.imageTreatment.edgeVignette + plan.imageTreatment.backgroundSuppression})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

async function drawOfficialLogo(ctx, rect, plan, width) {
  const logo = await loadLogo();
  const maxW = rect.w;
  const logoW = Math.min(maxW, width * plan.brand.logoScale);
  if (logo) {
    const logoH = logoW * (logo.height / logo.width);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = width * 0.012;
    ctx.drawImage(logo, rect.x, rect.y, logoW, logoH);
    ctx.restore();
    return { w: logoW, h: logoH };
  }
  ctx.font = font(logoW * 0.18, FLESHLAB_BRAND_IDENTITY.fonts.body, 950);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.fillText("FLESHLAB", rect.x, rect.y + logoW * 0.12);
  return { w: logoW, h: logoW * 0.16 };
}

function drawTextLines(ctx, lines, rect, size, maxLines) {
  ctx.save();
  ctx.font = font(size, FLESHLAB_BRAND_IDENTITY.fonts.display, 900);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.strokeStyle = "rgba(0,0,0,0.72)";
  ctx.lineWidth = Math.max(3, size * 0.028);
  ctx.shadowColor = "rgba(0,0,0,0.96)";
  ctx.shadowBlur = size * 0.18;
  const lineHeight = size * 0.82;
  lines.slice(0, maxLines).forEach((line, index) => {
    const y = rect.y + size + index * lineHeight;
    ctx.strokeText(line, rect.x, y, rect.w);
    ctx.fillText(line, rect.x, y, rect.w);
  });
  ctx.restore();
}

function titleSize(plan, format) {
  const base = format.height > format.width ? format.width * 0.18 : format.width * 0.085;
  if (plan.title.scaleIntent === "dominant") return base * 1.05;
  if (plan.title.scaleIntent === "restrained") return base * 0.72;
  return base * 0.88;
}

function drawCreator(ctx, text, rect, width) {
  ctx.font = font(Math.max(18, width * 0.021), FLESHLAB_BRAND_IDENTITY.fonts.body, 900);
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.fillText(upper(text), rect.x, rect.y + rect.h * 0.7, rect.w);
}

function drawCTA(ctx, text, rect, width) {
  const h = rect.h;
  const w = Math.min(rect.w, Math.max(rect.w * 0.58, upper(text).length * h * 0.34));
  ctx.save();
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.red;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, w, h, h * 0.5);
  ctx.fill();
  ctx.font = font(h * 0.36, FLESHLAB_BRAND_IDENTITY.fonts.body, 900);
  ctx.fillStyle = "white";
  ctx.fillText(upper(text), rect.x + h * 0.42, rect.y + h * 0.64, w - h * 0.84);
  ctx.restore();
}

async function renderBrandAsset(image, analysis, format, campaignData, artDirectionPlan) {
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  const focus = analysis.subjectCenter || { x: 0.5, y: 0.48 };
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.black;
  ctx.fillRect(0, 0, format.width, format.height);
  const brightness = artDirectionPlan.imageTreatment.contrast === "high" ? 76 : 84;
  ctx.filter = `brightness(${brightness}%) contrast(128%) saturate(108%)`;
  coverImage(ctx, image, format.width, format.height, focus, artDirectionPlan.composition.subjectScale);
  ctx.filter = "none";
  applyImageTreatment(ctx, artDirectionPlan, format.width, format.height);

  const logoRect = px(artDirectionPlan.brand.logoZone, format.width, format.height);
  const logo = await drawOfficialLogo(ctx, logoRect, artDirectionPlan, format.width);
  if (artDirectionPlan.brand.showSlogan) {
    ctx.font = font(Math.max(12, format.width * 0.012), FLESHLAB_BRAND_IDENTITY.fonts.body, 900);
    ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.red;
    ctx.fillText(FLESHLAB_BRAND_IDENTITY.slogan, logoRect.x, logoRect.y + logo.h + format.height * 0.022, logoRect.w);
  }

  const titleRect = px(artDirectionPlan.title.zone, format.width, format.height);
  const lines = artDirectionPlan.title.lineBreakPlan.preferredLines;
  drawTextLines(ctx, lines, titleRect, titleSize(artDirectionPlan, format), artDirectionPlan.title.maxLines);
  drawCreator(ctx, campaignData.creatorName || "FLESHLAB CREATOR", px(artDirectionPlan.creator.zone, format.width, format.height), format.width);
  if (artDirectionPlan.cta.visible) drawCTA(ctx, campaignData.primaryCTA, px(artDirectionPlan.cta.zone, format.width, format.height), format.width);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return { format, blob, url: URL.createObjectURL(blob), filename: `${campaignData.base}_${format.key}.jpg`, size: blob.size, kind: "visual", status: "ready", width: format.width, height: format.height, previewUrl: null, brandPlan: { family: artDirectionPlan.layoutFamily, logoPlacement: artDirectionPlan.brand.logoZone, textZone: artDirectionPlan.title.zone, artDirectionPlan } };
}

function makeTextAsset(filename, data, type = "application/json") {
  const content = type === "application/json" ? JSON.stringify(data, null, 2) : String(data);
  const blob = new Blob([content], { type });
  return { filename, blob, size: blob.size, url: URL.createObjectURL(blob), status: "ready", kind: type.includes("html") ? "web" : "copy" };
}

export function buildDefaultCampaignData(item, base = safeBaseName(item)) {
  return { base, campaignTitle: "THE CHECK-IN", creatorName: item?.performerName || item?.creatorName || "FLESHLAB CREATOR", seriesName: "Hotel Sessions", contentType: "Premium amateur release", platform: "multi-platform", aspectRatio: "multi-format", primaryCTA: "Watch the check-in", secondaryCTA: "Join FLESHLAB", releaseType: "premium_release", campaignGoal: "conversion", emotionalTone: "premium cinematic", slogan: FLESHLAB_BRAND_IDENTITY.slogan, commercialPromise: "Every room has a secret. This one starts at check-in." };
}

export async function createBrandIdentityCampaign(item, campaignData = {}) {
  if (!item?.frames?.length) throw new Error("Analyze one video first.");
  const base = campaignData.base || safeBaseName(item);
  const data = { ...buildDefaultCampaignData(item, base), ...campaignData, base };
  const [rankedFrame] = rankEmotionalCommercialFrames(item.frames, 1, 30);
  const frame = rankedFrame || item.frames[0];
  const image = await imageFromBlob(frame.blob);
  const analysis = await analyzePosterImage(image);
  const visualAssets = [];
  const artDirectionPlans = [];
  for (const format of BRAND_CAMPAIGN_FORMATS) {
    const artDirectionPlan = createArtDirectionPlan({ heroImage: image, analysis, brandIdentity: FLESHLAB_BRAND_IDENTITY, campaignBrief: data, campaignTitle: data.campaignTitle, creatorName: data.creatorName, seriesName: data.seriesName, primaryCTA: data.primaryCTA, secondaryCTA: data.secondaryCTA, platform: format.key, aspectRatio: `${format.width}:${format.height}`, releaseType: data.releaseType, campaignGoal: data.campaignGoal, emotionalTone: data.emotionalTone, format });
    artDirectionPlans.push(artDirectionPlan);
    visualAssets.push(await renderBrandAsset(image, analysis, format, data, artDirectionPlan));
  }
  const brandSystem = { brand: FLESHLAB_BRAND_IDENTITY, formats: BRAND_CAMPAIGN_FORMATS, campaignData: data, pipeline: "Creative Brain → Production Blueprint → Hero Photography → Creative Director → Brand Identity Engine → Art Direction Engine → Campaign Intelligence Engine → Campaign Generator", sourceFrame: `selected at ${Math.round(frame.time || 0)}s`, analysisSummary: { subjectSide: analysis.subjectSide, negativeSpace: analysis.negativeSpace, protectedZones: analysis.detections, backgroundComplexity: analysis.backgroundComplexity, brightness: analysis.brightness }, artDirectionPlans };
  return { campaignId: `${base}_art_direction_engine`, campaignData: data, brandSystem, visualAssets, sourceFrame: frame, createdAt: new Date().toISOString() };
}

export function createBrandTextAssets(base, campaign) {
  const data = campaign.campaignData;
  const seo = { title: `${data.campaignTitle} — ${data.seriesName} | FLESHLAB`, description: data.commercialPromise, ogTitle: `${data.campaignTitle} — ${data.creatorName}`, ogDescription: data.commercialPromise, slug: `${base}-${data.seriesName}-${data.campaignTitle}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), keywords: ["FLESHLAB", data.seriesName, data.campaignTitle, data.creatorName, "Amateur Wins"] };
  const landing = `<!doctype html><html><head><title>${seo.title}</title><meta name="description" content="${seo.description}"></head><body style="margin:0;background:#050506;color:#f4f1ea;font-family:Inter,Arial,sans-serif"><main style="min-height:100vh;display:grid;place-items:center;padding:48px"><section style="max-width:940px"><p style="color:#cf102d;font-weight:900;letter-spacing:.24em">FLESHLAB / AMATEUR WINS.</p><h1 style="font-size:86px;line-height:.86;margin:20px 0">${data.campaignTitle}</h1><p style="font-size:24px;color:#ddd">${data.commercialPromise}</p><a style="display:inline-block;margin-top:24px;background:#cf102d;color:white;padding:16px 26px;border-radius:999px;text-decoration:none;font-weight:900">${data.primaryCTA}</a></section></main></body></html>`;
  return [makeTextAsset(`${base}_brand_identity_plan.json`, campaign.brandSystem), makeTextAsset(`${base}_art_direction_plans.json`, campaign.brandSystem.artDirectionPlans), makeTextAsset(`${base}_seo_metadata.json`, seo), makeTextAsset(`${base}_landing_page.html`, landing, "text/html")];
}