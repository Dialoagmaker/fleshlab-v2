import { resolveCampaignArtDirection } from "@/lib/heroPhotography/campaignArtDirection";

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

const LITERAL_LOCATION_HERO_WORDS = new Set(["BATHROOM", "BEDROOM", "KITCHEN", "SOFA", "DOOR", "ROOM", "SHOWER", "TOILET", "SINK", "BED"]);

function identityFromCampaignConcept(campaign = {}) {
  return clean(campaign.campaignTitle || campaign.campaignIdentity || campaign.primaryTitle || campaign.collection || "").toUpperCase();
}

export function createCreativeConcept(campaign = {}, analysis = {}) {
  const text = `${campaign.campaignIdentity || ""} ${campaign.heroWord || ""} ${campaign.subtitle || ""} ${campaign.campaignLabel || ""}`.toLowerCase();
  const steam = /steam|hotel|spa|private access|check-in|after hours/.test(text);
  const outdoor = /beach|summer|wild|jungle|outdoor|location/.test(text);
  const raw = /raw|real|documentary|behind/.test(text);
  const campaignIdentity = identityFromCampaignConcept(campaign);
  return {
    campaignEmotion: steam ? "INTIMATE_TENSION" : outdoor ? "SUNLIT_ESCAPE" : raw ? "RAW_ACCESS" : "PREMIUM_DESIRE",
    campaignFantasy: steam ? "Luxury private-room access" : outdoor ? "On-location freedom" : raw ? "Unfiltered behind-the-scenes truth" : "Exclusive premium encounter",
    visualTension: analysis.backgroundComplexity > 0.62 ? "HIGH_CONTRAST" : "CONTROLLED_SEDUCTION",
    targetAudience: "Premium entertainment viewer seeking fast emotional clarity",
    marketingHook: campaign.campaignLabel || campaign.collection || (steam ? "PRIVATE ACCESS" : outdoor ? "ON LOCATION" : "EXCLUSIVE"),
    storytellingAngle: steam ? "privacy, steam, forbidden luxury" : outdoor ? "heat, motion, destination energy" : raw ? "access, realism, creator proximity" : "brand-led cinematic reveal",
    dominantVisualWord: campaignIdentity,
    campaignIdentity
  };
}

function inferDominantSide(analysis = {}) {
  const subjectX = analysis.subjectCenter?.x ?? 0.58;
  if ((analysis.subjectSide || "") === "left" || subjectX < 0.42) return "LEFT";
  return "RIGHT";
}

function chooseFamily({ format, analysis, creativeConcept }) {
  const ratio = format.width / format.height;
  const complexity = analysis.backgroundComplexity ?? 0.45;
  if (format.role === "cover" || ratio < 0.75) return "MOVIE_POSTER";
  if (format.role === "hero" || ratio > 1.9) return "STREAMING_HERO";
  if (creativeConcept?.campaignEmotion === "SUNLIT_ESCAPE") return "LUXURY_CAMPAIGN";
  if (complexity > 0.68 || creativeConcept?.campaignEmotion === "RAW_ACCESS") return "DOCUMENTARY";
  if ((analysis.subjectSeparation ?? 0.6) > 0.72) return "FASHION_EDITORIAL";
  return "SPLIT_KEY_ART";
}

export function createCompositionPlan({ analysis = {}, format = {}, campaign = {} }) {
  const creativeConcept = createCreativeConcept(campaign, analysis);
  const dominantSide = inferDominantSide(analysis);
  const artDirection = resolveCampaignArtDirection(campaign);
  const family = chooseFamily({ format, analysis, campaign, creativeConcept });
  const titleSide = artDirection.titleZone === "CENTER" ? "CENTER" : artDirection.titleZone || (dominantSide === "RIGHT" ? "LEFT" : "RIGHT");
  const graphicZone = artDirection.graphicZone;
  const photoZone = artDirection.photoZone;

  return {
    creativeConcept,
    artDirection,
    layoutStyle: "ART_DIRECTED_KEY_ART",
    layoutFamily: artDirection.composition || family,
    photoWeight: pct(photoZone.w),
    graphicWeight: pct(graphicZone.w),
    dominantSide,
    titleZone: titleSide,
    titleAlign: artDirection.titleAlign,
    logoZone: titleSide === "RIGHT" ? "TOP_RIGHT" : titleSide === "CENTER" ? "TOP_CENTER" : "TOP_LEFT",
    informationZone: titleSide === "RIGHT" ? "BOTTOM_RIGHT" : titleSide === "CENTER" ? "BOTTOM_CENTER" : "BOTTOM_LEFT",
    subjectCrop: family === "MOVIE_POSTER" ? "TIGHT" : "MEDIUM",
    subjectMask: artDirection.photoTreatment === "FULL_BLEED" ? "ATMOSPHERIC_BLEND" : "EDGE_BLEND",
    backgroundExtension: "YES",
    backgroundDarkening: artDirection.composition,
    graphicField: artDirection.graphicLanguage,
    accentStyle: artDirection.accent,
    hierarchy: "CAMPAIGN_IDENTITY_FIRST",
    brandDnaRules: {
      typographyProportion: "adaptive title system based on current campaign data only",
      graphicRhythm: artDirection.graphicLanguage,
      negativeSpace: "typography assigned to campaign-specific safe area",
      logoTreatment: "consistent small brand anchor, never competing with title",
      textureIntensity: "changes by campaign identity"
    },
    qualityGate: "Reject repeated template compositions and hardcoded fallback copy",
    eyePath: `${artDirection.label}_TO_SUBJECT_TO_METADATA`,
    visualTension: analysis.backgroundComplexity > 0.62 ? "HIGH" : "CONTROLLED",
    safeTypographyArea: graphicZone,
    photoZone,
    graphicZone,
    subjectFocus: {
      x: clamp(analysis.subjectCenter?.x ?? 0.52, 0.24, 0.78),
      y: clamp(analysis.subjectCenter?.y ?? 0.46, 0.22, 0.72)
    },
    cropZoom: artDirection.photoTreatment === "FULL_BLEED" ? 1.08 : family === "MOVIE_POSTER" ? 1.2 : format.role === "thumbnail" ? 1.24 : 1.14
  };
}