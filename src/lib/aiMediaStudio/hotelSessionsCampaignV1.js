import { rankEmotionalCommercialFrames } from "@/lib/aiMediaStudio/localAnalyzer";

const BRAND = "FLESHLAB";
const TERRITORY = "Hotel Sessions";
const TITLE = "THE CHECK-IN";
const PROMISE = "Every room has a secret. This one starts at check-in.";
const CTA = "Watch the check-in";
const LINE = "AMATEUR WINS.";

function safeBaseName(item) {
  return (item?.fileName || "hotel_sessions_campaign").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase();
}

function makeAsset(filename, blob, previewUrl = null, kind = "file") {
  return { filename, blob, size: blob.size, url: URL.createObjectURL(blob), previewUrl, status: "ready", kind };
}

function textBlob(name, data, type = "application/json") {
  const content = type === "application/json" ? JSON.stringify(data, null, 2) : String(data);
  return makeAsset(name, new Blob([content], { type }), null, type.includes("html") ? "web" : "copy");
}

function imageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

function coverImage(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (image.width - sw) * 0.5;
  const sy = (image.height - sh) * 0.48;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

function fillTextBlock(ctx, text, x, y, maxWidth, size, lineGap = 0.86) {
  ctx.font = `900 ${size}px Impact, Arial Black, Inter, sans-serif`;
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = word; }
  });
  if (line) lines.push(line);
  lines.forEach((item, index) => {
    const yy = y + index * size * lineGap;
    ctx.strokeText(item, x, yy);
    ctx.fillText(item, x, yy);
  });
  return y + lines.length * size * lineGap;
}

function drawBrand(ctx, width, height, scale = 1) {
  const w = Math.min(width * 0.22, 300 * scale);
  const h = w * 0.34;
  const x = width - w - width * 0.055;
  const y = height * 0.07;
  ctx.save();
  ctx.fillStyle = "rgba(5,5,5,0.88)";
  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.font = `900 ${h * 0.48}px Impact, Arial Black, sans-serif`;
  ctx.fillStyle = "#f4f1ea";
  ctx.fillText(BRAND, x + w * 0.07, y + h * 0.55);
  ctx.fillStyle = "#cf102d";
  ctx.font = `800 ${h * 0.12}px Inter, sans-serif`;
  ctx.fillText(LINE, x + w * 0.23, y + h * 0.82);
  ctx.restore();
}

function drawCampaign(ctx, image, spec) {
  const { width, height, variant } = spec;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  coverImage(ctx, image, width, height);
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(0, 0, width, height);
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.78)");
  grad.addColorStop(0.48, "rgba(0,0,0,0.14)");
  grad.addColorStop(1, "rgba(0,0,0,0.74)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  const titleX = variant === "story" ? width * 0.09 : width * 0.54;
  const titleY = variant === "banner" ? height * 0.43 : variant === "story" ? height * 0.2 : height * 0.32;
  const maxW = variant === "story" ? width * 0.82 : width * 0.4;
  const titleSize = variant === "banner" ? height * 0.18 : variant === "story" ? width * 0.16 : width * 0.07;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = width * 0.012;
  ctx.lineWidth = Math.max(5, titleSize * 0.05);
  ctx.strokeStyle = "rgba(0,0,0,0.78)";
  ctx.fillStyle = "#f4f1ea";
  const afterTitleY = fillTextBlock(ctx, TITLE, titleX, titleY, maxW, titleSize);
  ctx.restore();
  ctx.fillStyle = "#cf102d";
  ctx.fillRect(titleX, afterTitleY + height * 0.02, Math.min(maxW * 0.62, width * 0.28), Math.max(5, height * 0.012));
  if (variant !== "thumbnail" && variant !== "banner") {
    ctx.font = `800 ${Math.max(20, width * 0.018)}px Inter, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(PROMISE.toUpperCase(), titleX, afterTitleY + height * 0.08, maxW);
  }
  if (variant !== "thumbnail" && variant !== "banner") {
    ctx.fillStyle = "#cf102d";
    const ctaY = afterTitleY + height * 0.13;
    const ctaW = Math.min(maxW * 0.68, width * 0.25);
    const ctaH = Math.max(34, height * 0.052);
    ctx.beginPath();
    ctx.roundRect(titleX, ctaY, ctaW, ctaH, ctaH * 0.5);
    ctx.fill();
    ctx.font = `900 ${ctaH * 0.38}px Inter, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText(CTA.toUpperCase(), titleX + ctaH * 0.45, ctaY + ctaH * 0.65, ctaW - ctaH * 0.8);
  }
  drawBrand(ctx, width, height, variant === "story" ? 1.2 : 1);
  ctx.font = `900 ${Math.max(14, width * 0.014)}px Inter, sans-serif`;
  ctx.fillStyle = "#cf102d";
  ctx.fillText("FLESHLAB HOTEL ORIGINAL", width * 0.055, height * 0.93);
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.fillText("RAW BUT PREMIUM", width * 0.24, height * 0.93);
  ctx.fillText("AMATEUR WINS", width * 0.4, height * 0.93);
}

async function imageAsset(base, name, image, spec) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  drawCampaign(ctx, image, spec);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
  const url = URL.createObjectURL(blob);
  return makeAsset(`${base}_${name}.jpg`, blob, url, "visual");
}

function buildConsensus(item, frame) {
  return {
    campaignTerritory: TERRITORY,
    campaignName: "Hotel Sessions Episode 4",
    commercialPromise: PROMISE,
    primaryFantasy: "private access inside a hotel room",
    audience: "premium amateur viewers who click on secrecy, authenticity and location-based tension",
    creativeIdea: "A hotel doorway becomes the entrance to a private secret.",
    emotionalHook: "The viewer arrives at the moment before the room becomes private.",
    heroStrategy: "performer-in-doorway as emotional center; protect face, torso and doorway silhouette",
    visualLanguage: "warm dark premium amateur realism, one red FLESHLAB accent, restrained campaign density",
    brandLanguage: "raw but premium; amateur but intentional; AMATEUR WINS as proof mark",
    typographySystem: `${TITLE} dominates; promise supports; CTA appears only on interactive/large formats`,
    marketingPsychology: "curiosity plus authentic private access drives the click",
    sourceFrame: frame ? `selected at ${Math.round(frame.time)}s with commercial score ${Math.round(frame.hero?.score || 0)}` : "fallback selected frame",
  };
}

function buildProductionPlan() {
  return [
    "Master Key Art 16:9", "Homepage Hero", "Video Cover", "Instagram Post", "Instagram Story", "Facebook Post", "X Banner", "SEO Metadata", "Landing Page", "Email Header", "Campaign Analytics", "Launch Checklist"
  ];
}

function buildSeo(base) {
  return {
    title: "Hotel Sessions Episode 4 — The Check-In | FLESHLAB",
    description: "Every room has a secret. Watch the premium amateur Hotel Sessions campaign from FLESHLAB.",
    ogTitle: "THE CHECK-IN — Hotel Sessions",
    ogDescription: PROMISE,
    slug: `${base}-hotel-sessions-the-check-in`,
    keywords: ["Hotel Sessions", "FLESHLAB", "premium amateur", "The Check-In", "Amateur Wins"],
  };
}

function buildLandingPage() {
  return `<!doctype html><html><head><title>${TITLE} — Hotel Sessions</title><meta name="description" content="${PROMISE}"></head><body style="margin:0;background:#050505;color:#f4f1ea;font-family:Inter,Arial,sans-serif"><main style="min-height:100vh;display:grid;place-items:center;padding:48px"><section style="max-width:860px"><p style="color:#cf102d;font-weight:900;letter-spacing:.24em">FLESHLAB HOTEL ORIGINAL</p><h1 style="font-size:72px;line-height:.9;margin:20px 0">${TITLE}</h1><p style="font-size:24px;color:#ddd">${PROMISE}</p><a style="display:inline-block;margin-top:24px;background:#cf102d;color:white;padding:16px 26px;border-radius:999px;text-decoration:none;font-weight:900">${CTA}</a><p style="margin-top:42px;color:#999">Raw but premium. Amateur but intentional. ${LINE}</p></section></main></body></html>`;
}

function buildAnalytics(campaignId) {
  return {
    campaignId,
    territory: TERRITORY,
    trackedEvents: ["campaign_impression", "asset_click", "landing_view", "video_start", "ppv_checkout_start", "purchase"],
    dimensions: ["asset_type", "platform", "campaign_territory", "hero_strategy", "title_strategy"],
    utm: { utm_campaign: "hotel_sessions_ep4_check_in", utm_source: "fleshlab", utm_medium: "campaign" },
  };
}

function buildChecklist() {
  return [
    { item: "Campaign Consensus locked", done: true },
    { item: "All V1 deliverables generated from one consensus", done: true },
    { item: "No independent asset messaging", done: true },
    { item: "SEO metadata created", done: true },
    { item: "Landing page package created", done: true },
    { item: "Analytics package created", done: true },
    { item: "Human final review before public launch", done: false },
  ];
}

export async function createHotelSessionsCampaign(item) {
  if (!item?.frames?.length) throw new Error("Analyze one video first.");
  const base = safeBaseName(item);
  const campaignId = `${base}_hotel_sessions_v1`;
  const [frame] = rankEmotionalCommercialFrames(item.frames, 1, 30);
  const image = await imageFromBlob((frame || item.frames[0]).blob);
  const consensus = buildConsensus(item, frame || item.frames[0]);
  const productionPlan = buildProductionPlan();
  const assets = [];
  assets.push(await imageAsset(base, "master_key_art", image, { width: 1920, height: 1080, variant: "master" }));
  assets.push(await imageAsset(base, "homepage_hero", image, { width: 1920, height: 900, variant: "hero" }));
  assets.push(await imageAsset(base, "video_cover", image, { width: 1280, height: 720, variant: "thumbnail" }));
  assets.push(await imageAsset(base, "instagram_post", image, { width: 1080, height: 1080, variant: "post" }));
  assets.push(await imageAsset(base, "instagram_story", image, { width: 1080, height: 1920, variant: "story" }));
  assets.push(await imageAsset(base, "facebook_post", image, { width: 1200, height: 630, variant: "master" }));
  assets.push(await imageAsset(base, "x_banner", image, { width: 1500, height: 500, variant: "banner" }));
  assets.push(await imageAsset(base, "email_header", image, { width: 1200, height: 480, variant: "banner" }));
  assets.push(textBlob(`${base}_seo_metadata.json`, buildSeo(base)));
  assets.push(textBlob(`${base}_landing_page.html`, buildLandingPage(), "text/html"));
  assets.push(textBlob(`${base}_campaign_analytics.json`, buildAnalytics(campaignId)));
  assets.push(textBlob(`${base}_launch_checklist.json`, buildChecklist()));
  assets.push(textBlob(`${base}_campaign_consensus.json`, consensus));
  assets.push(textBlob(`${base}_production_plan.json`, productionPlan));
  return { campaignId, consensus, productionPlan, assets, checklist: buildChecklist(), analytics: buildAnalytics(campaignId), createdAt: new Date().toISOString() };
}