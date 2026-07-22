import { analyzePosterImage } from "@/lib/aiMediaStudio/posterAnalysis";
import { renderPremiumCampaignAsset } from "@/lib/heroPhotography/premiumCampaignDesignSystem";
import { buildCampaignConcepts, getDefaultCampaignConcept } from "@/lib/heroPhotography/storyIntelligence";

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

function imageFromSource(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function compact(value) { return String(value || "").replace(/\s+/g, " ").trim(); }

export function getCampaignMetadataSuggestion(output, pipeline, campaignFamily) {
  const blueprint = pipeline?.productionBlueprint || output?.heroPhotographyPlan?.productionBlueprint || {};
  const metadata = {
    originalTitle: compact(blueprint.originalTitle || blueprint.videoTitle || blueprint.campaignTitle || output?.heroPhotographyPlan?.campaignTitle || ""),
    performerName: compact(blueprint.performerName || blueprint.creatorName || output?.heroPhotographyPlan?.creatorName || "Featured Creator"),
    subtitle: compact(blueprint.campaignSubtitle || blueprint.seriesName || ""),
    cta: compact(blueprint.primaryCTA || "Watch Now"),
    campaignLabel: compact(blueprint.campaignLabel || campaignFamily || ""),
    releaseName: compact(blueprint.releaseName || blueprint.seriesName || "")
  };
  const concept = getDefaultCampaignConcept({ metadata, blueprint, campaignFamily });
  return {
    campaignTitle: concept.primaryTitle,
    performerName: metadata.performerName,
    subtitle: concept.collection,
    cta: metadata.cta,
    campaignLabel: concept.campaignLabel,
    releaseName: concept.collection,
    originalTitle: metadata.originalTitle
  };
}

function resolveMetadataField(key, userMetadata, savedMetadata, aiSuggestion, fallback) {
  const userValue = compact(userMetadata?.[key]);
  if (userMetadata?.source?.[key] === "user" && userValue) return { value: userValue, source: "user" };
  if (userMetadata?.source?.[key] === "ai" && userValue) return { value: userValue, source: "ai" };
  const options = [[savedMetadata?.[key], "project"], [aiSuggestion?.[key], "ai"], [fallback, "fallback"]];
  const selected = options.find(([value]) => compact(value));
  return { value: compact(selected?.[0] || fallback), source: selected?.[1] || "fallback" };
}

export function mergeCampaignMetadata({ output, pipeline, campaignFamily, userMetadata = {}, savedMetadata = {} }) {
  const aiSuggestion = getCampaignMetadataSuggestion(output, pipeline, campaignFamily);
  const fallbacks = { campaignTitle: "CHECK-IN", performerName: "Featured Creator", subtitle: "Hotel Sessions", cta: "Watch Now", campaignLabel: "Premium", releaseName: "Hotel Sessions", originalTitle: "" };
  const metadata = { source: {} };
  Object.keys(fallbacks).forEach(key => {
    const resolved = resolveMetadataField(key, userMetadata, savedMetadata, aiSuggestion, fallbacks[key]);
    metadata[key] = resolved.value;
    metadata.source[key] = resolved.source;
  });
  return { ...metadata, aiSuggestion };
}

export async function composeCampaignFromHero(output, pipeline, campaignFamily, metadata = {}) {
  if (!output?.heroImage) throw new Error("Hero Photograph is required before composing campaign assets.");
  const image = await imageFromSource(output.heroImage);
  let analysis = fallbackAnalysis;
  try { analysis = { ...fallbackAnalysis, ...(await analyzePosterImage(image)) }; } catch { analysis = fallbackAnalysis; }

  const resolvedMetadata = mergeCampaignMetadata({ output, pipeline, campaignFamily, userMetadata: metadata.userMetadata, savedMetadata: metadata.savedMetadata });
  const blueprint = pipeline?.productionBlueprint || output?.heroPhotographyPlan?.productionBlueprint || {};
  const concepts = buildCampaignConcepts({ metadata: resolvedMetadata, blueprint, campaignFamily });
  const visualAssets = [];

  for (const campaign of concepts) {
    for (const format of HERO_CAMPAIGN_FORMATS) {
      visualAssets.push(await renderPremiumCampaignAsset({ image, analysis, format, campaign }));
    }
  }

  return {
    campaignId: concepts[0]?.base || "premium-key-art",
    campaignData: concepts[0],
    campaignConcepts: concepts,
    campaignMetadata: concepts[0]?.campaignMetadata,
    sourceHeroImage: output.heroImage,
    currentVisualAssets: [],
    visualAssets,
    typographyWarnings: [],
    createdAt: new Date().toISOString(),
    pipeline: ["Hero Photography", "Story Intelligence", "Campaign Concept", "Campaign Naming", "Creative Direction", "Graphic Design System", "Typography System", "Campaign Composer", "Final Key Art"],
    downstreamReady: visualAssets.length === HERO_CAMPAIGN_FORMATS.length * concepts.length
  };
}