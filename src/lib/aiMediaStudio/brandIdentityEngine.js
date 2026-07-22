import { analyzePosterImage } from "./posterAnalysis";
import { rankEmotionalCommercialFrames } from "./localAnalyzer";

export const FLESHLAB_BRAND_IDENTITY = {
  logoUrl: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/1591ab54c_ChatGPTImageJul14202612_16_43AM.png",
  brand: "FLESHLAB",
  slogan: "AMATEUR WINS.",
  colors: { black: "#050506", red: "#cf102d", cream: "#f4f1ea", muted: "rgba(244,241,234,0.68)" },
  fonts: { display: "Bebas Neue", body: "Inter", accent: "Permanent Marker" },
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

const LAYOUT_FAMILIES = [
  { id: "luxury_editorial", label: "Luxury Editorial", mood: "premium restraint", density: 0.42, accent: "#cf102d" },
  { id: "netflix_documentary", label: "Netflix Documentary", mood: "story-first dramatic", density: 0.58, accent: "#e5172f" },
  { id: "premium_fashion", label: "Premium Fashion", mood: "clean high contrast", density: 0.34, accent: "#f4f1ea" },
  { id: "high_end_fitness", label: "High-End Fitness", mood: "kinetic athletic", density: 0.66, accent: "#ff2842" },
  { id: "streetwear", label: "Streetwear", mood: "bold urban", density: 0.74, accent: "#cf102d" },
  { id: "summer_campaign", label: "Summer Campaign", mood: "warm commercial", density: 0.5, accent: "#ff6b35" },
  { id: "dark_cinematic", label: "Dark Cinematic", mood: "noir premium", density: 0.62, accent: "#b80d22" },
  { id: "magazine_cover", label: "Magazine Cover", mood: "editorial hierarchy", density: 0.54, accent: "#f4f1ea" },
  { id: "minimal_premium", label: "Minimal Premium", mood: "quiet luxury", density: 0.26, accent: "#cf102d" },
  { id: "commercial_advertising", label: "Commercial Advertising", mood: "clear conversion", density: 0.6, accent: "#cf102d" },
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

function safeBaseName(item) {
  return (item?.fileName || "fleshlab_brand_campaign").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase();
}

function imageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(blob);
  });
}

function coverImage(ctx, image, width, height, focus = { x: 0.5, y: 0.48 }) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = clamp(image.width * focus.x - sw / 2, 0, Math.max(0, image.width - sw));
  const sy = clamp(image.height * focus.y - sh / 2, 0, Math.max(0, image.height - sh));
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

function intersects(a, b) {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

function chooseFamily(format, analysis, campaignData) {
  const seed = `${format.key}${campaignData.campaignTitle}${campaignData.platform}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const offset = format.role === "story" ? 3 : format.role === "banner" ? 6 : analysis.backgroundComplexity > 0.62 ? 8 : 0;
  return LAYOUT_FAMILIES[(seed + offset) % LAYOUT_FAMILIES.length];
}

function chooseTextZone(format, analysis) {
  const safe = format.role === "story" ? 0.08 : 0.055;
  const subject = analysis.subjectBox || { x: 0.52, y: 0.2, w: 0.34, h: 0.62 };
  const protectedZones = [analysis.detections?.face, analysis.detections?.body, analysis.detections?.torso].filter(Boolean);
  const portrait = format.height > format.width;
  const candidates = portrait ? [
    { id: "top", x: safe, y: safe, w: 1 - safe * 2, h: 0.34 },
    { id: "bottom", x: safe, y: 0.58, w: 1 - safe * 2, h: 0.34 },
  ] : [
    { id: "left", x: safe, y: 0.13, w: 0.38, h: 0.7 },
    { id: "right", x: 0.57, y: 0.13, w: 0.38, h: 0.7 },
    { id: "bottom", x: safe, y: 0.58, w: 0.58, h: 0.32 },
  ];
  return candidates.map(zone => {
    const overlap = protectedZones.reduce((score, protectedZone) => score + (intersects(zone, protectedZone) ? 1 : 0), 0);
    const distance = Math.abs((zone.x + zone.w / 2) - (subject.x + subject.w / 2));
    const negativeMatch = analysis.negativeSpace ? Math.abs(zone.x - analysis.negativeSpace.x) + Math.abs(zone.y - analysis.negativeSpace.y) : 0.5;
    return { ...zone, score: distance * 1.2 - overlap * 3 - negativeMatch * 0.45 };
  }).sort((a, b) => b.score - a.score)[0] || candidates[0];
}

function wrapText(ctx, text, maxWidth, startSize, maxLines = 4, family = "Bebas Neue") {
  const words = upper(text).split(/\s+/).filter(Boolean);
  for (let size = startSize; size >= startSize * 0.42; size -= 4) {
    ctx.font = font(size, family, 900);
    const lines = [];
    let line = "";
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (!line || ctx.measureText(test).width <= maxWidth) line = test;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    if (lines.length <= maxLines) return { lines, size, lineHeight: size * 0.82 };
  }
  return { lines: words.slice(0, maxLines), size: startSize * 0.42, lineHeight: startSize * 0.36 };
}

function drawBrandField(ctx, width, height, zone, family) {
  const x = zone.x * width;
  const y = zone.y * height;
  const w = zone.w * width;
  const h = zone.h * height;
  const direction = zone.id === "right" ? [x + w, y, x, y] : [x, y, x + w, y];
  const field = ctx.createLinearGradient(...direction);
  field.addColorStop(0, `rgba(0,0,0,${0.78 + family.density * 0.15})`);
  field.addColorStop(0.58, `rgba(0,0,0,${0.48 + family.density * 0.18})`);
  field.addColorStop(1, "rgba(0,0,0,0.04)");
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(x + w * 0.3, y + h * 0.34, 0, x + w * 0.3, y + h * 0.34, Math.max(w, h));
  glow.addColorStop(0, "rgba(207,16,45,0.22)");
  glow.addColorStop(0.55, "rgba(207,16,45,0.08)");
  glow.addColorStop(1, "rgba(207,16,45,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

async function drawOfficialLogo(ctx, x, y, maxWidth, width) {
  const logo = await loadLogo();
  const logoW = Math.min(maxWidth, width * 0.24);
  if (logo) {
    const logoH = logoW * (logo.height / logo.width);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.82)";
    ctx.shadowBlur = width * 0.012;
    ctx.drawImage(logo, x, y, logoW, logoH);
    ctx.restore();
    return { w: logoW, h: logoH };
  }
  ctx.save();
  ctx.font = font(logoW * 0.17, "Inter", 950);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.fillText("FLESHLAB", x, y + logoW * 0.11);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.red;
  ctx.font = font(logoW * 0.055, "Inter", 900);
  ctx.fillText("AMATEUR WINS.", x + logoW * 0.12, y + logoW * 0.17);
  ctx.restore();
  return { w: logoW, h: logoW * 0.2 };
}

function drawCTA(ctx, text, x, y, maxWidth, height) {
  const cta = upper(text || "WATCH NOW");
  const h = Math.max(34, height * 0.052);
  const w = Math.min(maxWidth, Math.max(maxWidth * 0.36, cta.length * h * 0.34));
  ctx.save();
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.red;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h * 0.5);
  ctx.fill();
  ctx.font = font(h * 0.36, "Inter", 900);
  ctx.fillStyle = "white";
  ctx.fillText(cta, x + h * 0.42, y + h * 0.64, w - h * 0.84);
  ctx.restore();
  return { w, h };
}

async function renderBrandAsset(image, analysis, format, campaignData) {
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  const family = chooseFamily(format, analysis, campaignData);
  const zone = chooseTextZone(format, analysis);
  const focus = analysis.subjectCenter || { x: 0.5, y: 0.48 };
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.black;
  ctx.fillRect(0, 0, format.width, format.height);
  ctx.filter = `brightness(${format.role === "banner" ? 74 : 84}%) contrast(126%) saturate(106%)`;
  coverImage(ctx, image, format.width, format.height, focus);
  ctx.filter = "none";
  drawBrandField(ctx, format.width, format.height, zone, family);

  const x = zone.x * format.width;
  let y = zone.y * format.height;
  const maxW = zone.w * format.width;
  const base = format.height > format.width ? format.width * 0.17 : format.width * (format.role === "banner" ? 0.072 : 0.086);
  const title = wrapText(ctx, campaignData.campaignTitle, maxW, base, format.role === "banner" ? 2 : 4, FLESHLAB_BRAND_IDENTITY.fonts.display);
  const logo = await drawOfficialLogo(ctx, x, y, maxW * 0.58, format.width);
  y += logo.h + format.height * 0.055;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.96)";
  ctx.shadowBlur = format.width * 0.016;
  ctx.strokeStyle = "rgba(0,0,0,0.7)";
  ctx.lineWidth = Math.max(3, title.size * 0.026);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.font = font(title.size, FLESHLAB_BRAND_IDENTITY.fonts.display, 900);
  title.lines.forEach(line => {
    ctx.strokeText(line, x, y + title.size, maxW);
    ctx.fillText(line, x, y + title.size, maxW);
    y += title.lineHeight;
  });
  ctx.restore();

  ctx.fillStyle = family.accent;
  ctx.fillRect(x, y + format.height * 0.018, Math.min(maxW * 0.58, format.width * 0.32), Math.max(4, format.height * 0.01));
  y += format.height * 0.07;

  const creator = upper(campaignData.creatorName || "FLESHLAB CREATOR");
  ctx.font = font(Math.max(18, format.width * 0.021), FLESHLAB_BRAND_IDENTITY.fonts.body, 900);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(creator, x, y, maxW);
  y += format.height * 0.045;

  if (format.role !== "thumbnail" && format.role !== "banner") {
    ctx.font = font(Math.max(16, format.width * 0.017), FLESHLAB_BRAND_IDENTITY.fonts.body, 800);
    ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.muted;
    ctx.fillText(upper(campaignData.seriesName || campaignData.contentType), x, y, maxW);
    y += format.height * 0.055;
    drawCTA(ctx, campaignData.primaryCTA, x, y, maxW * 0.78, format.height);
  }

  ctx.save();
  ctx.font = font(Math.max(14, format.width * 0.014), FLESHLAB_BRAND_IDENTITY.fonts.body, 900);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.red;
  ctx.fillText(FLESHLAB_BRAND_IDENTITY.slogan, format.width * 0.055, format.height * 0.93);
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.fillText(upper(family.label), format.width * 0.22, format.height * 0.93);
  ctx.restore();

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return {
    format,
    family,
    zone,
    blob,
    url: URL.createObjectURL(blob),
    filename: `${campaignData.base}_${format.key}.jpg`,
    size: blob.size,
    kind: "visual",
    status: "ready",
    width: format.width,
    height: format.height,
    previewUrl: null,
    brandPlan: {
      family: family.label,
      logoPlacement: zone.id,
      textZone: zone,
      protectedSubject: analysis.detections,
      brandIdentity: "Official FLESHLAB logo, AMATEUR WINS lockup, official red/black/cream palette, Bebas Neue + Inter hierarchy",
    },
  };
}

function makeTextAsset(filename, data, type = "application/json") {
  const content = type === "application/json" ? JSON.stringify(data, null, 2) : String(data);
  const blob = new Blob([content], { type });
  return { filename, blob, size: blob.size, url: URL.createObjectURL(blob), status: "ready", kind: type.includes("html") ? "web" : "copy" };
}

export function buildDefaultCampaignData(item, base = safeBaseName(item)) {
  return {
    base,
    campaignTitle: "THE CHECK-IN",
    creatorName: item?.performerName || item?.creatorName || "FLESHLAB CREATOR",
    seriesName: "Hotel Sessions",
    contentType: "Premium amateur release",
    platform: "multi-platform",
    aspectRatio: "multi-format",
    primaryCTA: "Watch the check-in",
    secondaryCTA: "Join FLESHLAB",
    slogan: FLESHLAB_BRAND_IDENTITY.slogan,
    commercialPromise: "Every room has a secret. This one starts at check-in.",
  };
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
  for (const format of BRAND_CAMPAIGN_FORMATS) visualAssets.push(await renderBrandAsset(image, analysis, format, data));
  const brandSystem = { brand: FLESHLAB_BRAND_IDENTITY, formats: BRAND_CAMPAIGN_FORMATS, campaignData: data, sourceFrame: `selected at ${Math.round(frame.time || 0)}s`, analysisSummary: { subjectSide: analysis.subjectSide, negativeSpace: analysis.negativeSpace, protectedZones: analysis.detections } };
  return { campaignId: `${base}_brand_identity_engine`, campaignData: data, brandSystem, visualAssets, sourceFrame: frame, createdAt: new Date().toISOString() };
}

export function createBrandTextAssets(base, campaign) {
  const data = campaign.campaignData;
  const seo = { title: `${data.campaignTitle} — ${data.seriesName} | FLESHLAB`, description: data.commercialPromise, ogTitle: `${data.campaignTitle} — ${data.creatorName}`, ogDescription: data.commercialPromise, slug: `${base}-${data.seriesName}-${data.campaignTitle}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), keywords: ["FLESHLAB", data.seriesName, data.campaignTitle, data.creatorName, "Amateur Wins"] };
  const landing = `<!doctype html><html><head><title>${seo.title}</title><meta name="description" content="${seo.description}"></head><body style="margin:0;background:#050506;color:#f4f1ea;font-family:Inter,Arial,sans-serif"><main style="min-height:100vh;display:grid;place-items:center;padding:48px"><section style="max-width:940px"><p style="color:#cf102d;font-weight:900;letter-spacing:.24em">FLESHLAB / AMATEUR WINS.</p><h1 style="font-size:86px;line-height:.86;margin:20px 0">${data.campaignTitle}</h1><p style="font-size:24px;color:#ddd">${data.commercialPromise}</p><a style="display:inline-block;margin-top:24px;background:#cf102d;color:white;padding:16px 26px;border-radius:999px;text-decoration:none;font-weight:900">${data.primaryCTA}</a></section></main></body></html>`;
  return [makeTextAsset(`${base}_brand_identity_plan.json`, campaign.brandSystem), makeTextAsset(`${base}_seo_metadata.json`, seo), makeTextAsset(`${base}_landing_page.html`, landing, "text/html")];
}