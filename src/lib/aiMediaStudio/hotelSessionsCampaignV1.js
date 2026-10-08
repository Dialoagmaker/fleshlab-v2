import { createBrandIdentityCampaign, createBrandTextAssets } from "@/lib/aiMediaStudio/brandIdentityEngine";

function safeBaseName(item) {
  return (item?.fileName || "hotel_sessions_campaign").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase();
}

function makeTextAsset(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  return { filename, blob, size: blob.size, url: URL.createObjectURL(blob), status: "ready", kind: "copy" };
}

function buildConsensus(campaign) {
  const data = campaign.campaignData;
  return {
    campaignTerritory: data.seriesName,
    campaignName: `${data.seriesName} — ${data.campaignTitle}`,
    commercialPromise: data.commercialPromise,
    primaryFantasy: "premium amateur access with official FLESHLAB campaign identity",
    audience: "premium amateur viewers who respond to creator-led branded releases",
    creativeIdea: "Hero Photography becomes official FLESHLAB key art through integrated brand composition, not pasted overlays.",
    emotionalHook: data.commercialPromise,
    heroStrategy: "protect face/body features, use negative space for logo, title, creator and CTA hierarchy",
    visualLanguage: "official FLESHLAB red/black/cream identity with adaptive professional layout families",
    brandLanguage: "Brand Identity Engine supplies official logo, AMATEUR WINS lockup, typography, color and CTA restrictions; Art Direction Engine decides executable staging per asset.",
    typographySystem: "Bebas Neue display hierarchy with Inter creator/CTA support, line-break planning and platform-specific scale intent",
    marketingPsychology: "art-directed hierarchy balances subject recognition, brand recall and conversion intent per platform",
    sourceFrame: campaign.brandSystem.sourceFrame,
  };
}

function buildProductionPlan() {
  return ["YouTube Thumbnail", "YouTube Cover", "X Banner", "Instagram Feed", "Instagram Story", "Facebook Cover", "Website Hero", "Landing Page Banner", "PPV Cover", "Exclusive Release Cover", "Behind The Scenes Cover"];
}

function buildChecklist() {
  return [
    { item: "Brand Identity Engine applied", done: true },
    { item: "Official logo and AMATEUR WINS lockup included", done: true },
    { item: "Creator, title and CTA integrated", done: true },
    { item: "Face/body protected by layout scoring", done: true },
    { item: "Platform-specific asset suite generated", done: true },
    { item: "Human final review before public launch", done: false },
  ];
}

function buildAnalytics(campaignId) {
  return { campaignId, trackedEvents: ["campaign_impression", "asset_click", "landing_view", "video_start", "ppv_checkout_start", "purchase"], dimensions: ["asset_type", "platform", "layout_family", "brand_identity_engine"] };
}

export async function createHotelSessionsCampaign(item) {
  const base = safeBaseName(item);
  const brandCampaign = await createBrandIdentityCampaign(item, { base, seriesName: "Hotel Sessions", campaignTitle: "THE CHECK-IN", primaryCTA: "Watch the check-in" });
  const consensus = buildConsensus(brandCampaign);
  const productionPlan = buildProductionPlan();
  const campaignId = brandCampaign.campaignId;
  const checklist = buildChecklist();
  const analytics = buildAnalytics(campaignId);
  const assets = [...brandCampaign.visualAssets, ...createBrandTextAssets(base, brandCampaign), makeTextAsset(`${base}_campaign_analytics.json`, analytics), makeTextAsset(`${base}_launch_checklist.json`, checklist), makeTextAsset(`${base}_campaign_consensus.json`, consensus), makeTextAsset(`${base}_production_plan.json`, productionPlan)];
  return { campaignId, consensus, productionPlan, assets, checklist, analytics, brandSystem: brandCampaign.brandSystem, createdAt: brandCampaign.createdAt };
}

const VARIATION_DIRECTIONS = [
  { key: "luxury_editorial", label: "Luxury Editorial", description: "Minimal typography, restrained logo, premium spacing." },
  { key: "netflix_documentary", label: "Netflix Documentary", description: "Darker cinematic story-first composition." },
  { key: "streetwear_drop", label: "Streetwear Drop", description: "Bold launch energy, aggressive crop, stronger brand." },
];

function planFor(campaign, formatKey = "website_hero") {
  return campaign.brandSystem.artDirectionPlans.find(plan => plan.platformDirection.platform === formatKey) || campaign.brandSystem.artDirectionPlans[0];
}

function matrixFor(direction, campaign) {
  const plan = planFor(campaign);
  return {
    layoutFamily: plan.layoutFamily,
    crop: `${plan.composition.cropMode} / scale ${plan.composition.subjectScale}`,
    subject: plan.composition.subjectAnchor,
    title: `${plan.title.zone.x.toFixed(2)},${plan.title.zone.y.toFixed(2)} / ${plan.title.scaleIntent}`,
    logo: `${plan.brand.logoZone.x.toFixed(2)},${plan.brand.logoZone.y.toFixed(2)} / ${plan.brand.brandProminence}`,
    type: plan.title.lineBreakPlan.preferredLines.join(" / "),
    cta: plan.cta.visible ? `${plan.cta.prominence} ${plan.cta.style}` : "hidden",
    hierarchy: `image ${plan.composition.visualWeight.image}, type ${plan.composition.visualWeight.typography}, brand ${plan.composition.visualWeight.brand}`,
    grade: plan.imageTreatment.grade,
    intent: direction.description,
  };
}

export async function createHotelSessionsCampaignComparison(item) {
  const base = safeBaseName(item);
  const directions = [];
  for (const direction of VARIATION_DIRECTIONS) {
    const brandCampaign = await createBrandIdentityCampaign(item, { base, creativeDirection: direction.key, seriesName: "Hotel Sessions", campaignTitle: "THE CHECK-IN", primaryCTA: "Watch the check-in" });
    const campaignId = brandCampaign.campaignId;
    const checklist = buildChecklist();
    const analytics = buildAnalytics(campaignId);
    const consensus = buildConsensus(brandCampaign);
    const productionPlan = buildProductionPlan();
    const assets = [...brandCampaign.visualAssets, ...createBrandTextAssets(`${base}_${direction.key}`, brandCampaign), makeTextAsset(`${base}_${direction.key}_campaign_analytics.json`, analytics), makeTextAsset(`${base}_${direction.key}_launch_checklist.json`, checklist), makeTextAsset(`${base}_${direction.key}_campaign_consensus.json`, consensus), makeTextAsset(`${base}_${direction.key}_production_plan.json`, productionPlan)];
    const campaign = { campaignId, consensus, productionPlan, assets, checklist, analytics, brandSystem: brandCampaign.brandSystem, createdAt: brandCampaign.createdAt };
    directions.push({ ...direction, campaign, matrix: matrixFor(direction, campaign) });
  }
  const report = { directions, changedSummary: "Luxury Editorial prioritizes image-first spacing and restrained logo; Netflix Documentary moves into darker story-first staging; Streetwear Drop increases crop, typography and brand weight for launch energy." };
  return { source: "single_selected_hero_photography_frame", directions, report, createdAt: new Date().toISOString() };
}