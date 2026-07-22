import { analyzePosterImage } from "@/lib/aiMediaStudio/posterAnalysis";
import { renderPremiumCampaignAsset } from "@/lib/heroPhotography/premiumCampaignDesignSystem";
import { buildCampaignConcepts, getDefaultCampaignConcept } from "@/lib/heroPhotography/storyIntelligence";
import { validateCampaignDirection } from "@/lib/heroPhotography/campaignCreativeDirector";

export const HERO_CAMPAIGN_FORMATS = [
  { key: "campaign_landscape", label: "Campaign Landscape", width: 1280, height: 720, role: "landscape_key_art" },
  { key: "campaign_square", label: "Square Campaign Key Art", width: 1080, height: 1080, role: "square_key_art" },
  { key: "campaign_vertical", label: "Vertical Campaign Key Art", width: 1080, height: 1920, role: "vertical_key_art" },
  { key: "campaign_banner", label: "Campaign Banner", width: 1500, height: 500, role: "banner_key_art" },
  { key: "website_hero", label: "Website Hero Campaign", width: 1920, height: 900, role: "hero_key_art" },
  { key: "premium_one_sheet", label: "Premium One-Sheet", width: 1600, height: 2400, role: "one_sheet_key_art" },
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

function getSourcePlatformTitle(output, pipeline) {
  const blueprint = pipeline?.productionBlueprint || output?.heroPhotographyPlan?.productionBlueprint || {};
  return compact(blueprint.originalTitle || blueprint.videoTitle || blueprint.sourceTitle || output?.heroPhotographyPlan?.originalTitle || output?.heroPhotographyPlan?.videoTitle || output?.heroPhotographyPlan?.sourceTitle || output?.heroPhotographyPlan?.campaignTitle || "");
}

export function getCampaignMetadataSuggestion(output, pipeline, campaignFamily) {
  const blueprint = pipeline?.productionBlueprint || output?.heroPhotographyPlan?.productionBlueprint || {};
  const sourcePlatformTitle = getSourcePlatformTitle(output, pipeline);
  const metadata = {
    campaignTitle: sourcePlatformTitle || compact(blueprint.campaignTitle || output?.heroPhotographyPlan?.campaignTitle || ""),
    originalTitle: sourcePlatformTitle || compact(blueprint.originalTitle || blueprint.videoTitle || blueprint.campaignTitle || output?.heroPhotographyPlan?.campaignTitle || ""),
    performerName: compact(blueprint.performerName || blueprint.creatorName || output?.heroPhotographyPlan?.creatorName || ""),
    subtitle: compact(blueprint.campaignSubtitle || blueprint.seriesName || ""),
    episode: compact(blueprint.episode || ""),
    cta: compact(blueprint.primaryCTA || ""),
    campaignLabel: compact(blueprint.campaignLabel || campaignFamily || ""),
    releaseName: compact(blueprint.releaseName || blueprint.seriesName || "")
  };
  const concept = getDefaultCampaignConcept({ metadata, blueprint, campaignFamily });
  return {
    campaignTitle: metadata.campaignTitle || metadata.originalTitle || "",
    performerName: metadata.performerName,
    subtitle: metadata.subtitle,
    episode: metadata.episode,
    cta: metadata.cta,
    campaignLabel: metadata.campaignLabel,
    releaseName: metadata.releaseName || metadata.subtitle,
    originalTitle: metadata.originalTitle
  };
}

function resolveMetadataField(key, userMetadata, savedMetadata, aiSuggestion, fallback) {
  const userValue = compact(userMetadata?.[key]);
  if (userMetadata?.source?.[key] === "user") return { value: userValue, source: "user" };
  if (userMetadata?.source?.[key] === "ai") return { value: userValue, source: "ai" };
  const options = [[savedMetadata?.[key], "project"], [aiSuggestion?.[key], "ai"], [fallback, "fallback"]];
  const selected = options.find(([value]) => compact(value));
  return { value: compact(selected?.[0] || fallback), source: selected?.[1] || "fallback" };
}

export function mergeCampaignMetadata({ output, pipeline, campaignFamily, userMetadata = {}, savedMetadata = {} }) {
  const aiSuggestion = getCampaignMetadataSuggestion(output, pipeline, campaignFamily);
  const fallbacks = { campaignTitle: "", performerName: "", subtitle: "", episode: "", cta: "", campaignLabel: "", releaseName: "", originalTitle: "" };
  const metadata = { source: {} };
  Object.keys(fallbacks).forEach(key => {
    if (key === "campaignTitle") {
      const userTitle = compact(userMetadata?.campaignTitle);
      const savedTitle = compact(savedMetadata?.campaignTitle);
      const suggestedTitle = compact(aiSuggestion?.campaignTitle);
      if (userTitle) {
        metadata.campaignTitle = userTitle;
        metadata.source.campaignTitle = "user";
      } else if (savedTitle) {
        metadata.campaignTitle = savedTitle;
        metadata.source.campaignTitle = "project";
      } else if (suggestedTitle) {
        metadata.campaignTitle = suggestedTitle;
        metadata.source.campaignTitle = "ai";
      } else {
        metadata.campaignTitle = "";
        metadata.source.campaignTitle = "empty";
      }
      return;
    }
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
  const campaignReadiness = concepts.map(concept => ({
    campaignConceptId: concept.campaignConceptId,
    ...validateCampaignDirection(concept.campaignDirection)
  }));
  const blocked = campaignReadiness.find(result => !result.ready);
  if (blocked) {
    throw new Error(`Campaign concept is incomplete. Missing: ${blocked.missing.join(", ")}`);
  }
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
    campaignReadiness,
    createdAt: new Date().toISOString(),
    pipeline: ["Story Discovery", "Campaign Concept", "Art Direction", "Photography Direction", "Layout Concept", "Typography Direction", "Final Key Art"],
    downstreamReady: visualAssets.length === HERO_CAMPAIGN_FORMATS.length * concepts.length
  };
}