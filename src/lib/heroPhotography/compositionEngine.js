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
  return clean(campaign.campaignTitle || campaign.campaignIdentity || campaign.primaryTitle || "PRIVATE ACCESS").toUpperCase();
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
  const titleSide = dominantSide === "RIGHT" ? "LEFT" : "RIGHT";
  const family = chooseFamily({ format, analysis, campaign, creativeConcept });
  const portrait = format.height > format.width;
  const ultraWide = format.width / format.height > 1.9;
  const photoWeight = portrait ? 0.58 : ultraWide ? 0.64 : 0.62;
  const graphicWeight = 1 - photoWeight;
  const graphicZone = titleSide === "LEFT"
    ? { x: 0, y: 0, w: portrait ? 0.68 : graphicWeight + 0.12, h: 1 }
    : { x: portrait ? 0.32 : photoWeight - 0.12, y: 0, w: portrait ? 0.68 : graphicWeight + 0.12, h: 1 };
  const photoZone = dominantSide === "RIGHT"
    ? { x: portrait ? 0.34 : graphicWeight * 0.76, y: 0, w: portrait ? 0.66 : photoWeight + graphicWeight * 0.24, h: 1 }
    : { x: 0, y: 0, w: portrait ? 0.66 : photoWeight + graphicWeight * 0.24, h: 1 };

  return {
    creativeConcept,
    layoutStyle: "FULL_BLEED_KEY_ART",
    layoutFamily: family,
    photoWeight: pct(photoWeight),
    graphicWeight: pct(graphicWeight),
    dominantSide,
    titleZone: titleSide,
    logoZone: titleSide === "LEFT" ? "TOP_LEFT" : "TOP_RIGHT",
    informationZone: titleSide === "LEFT" ? "BOTTOM_LEFT" : "BOTTOM_RIGHT",
    subjectCrop: family === "MOVIE_POSTER" ? "TIGHT" : "MEDIUM",
    subjectMask: "EDGE_BLEND",
    backgroundExtension: "YES",
    backgroundDarkening: titleSide === "LEFT" ? "LEFT_ONLY" : "RIGHT_ONLY",
    graphicField: "BLACK_TEXTURE",
    accentStyle: "RED_BRUSH",
    hierarchy: "EMOTION_FIRST",
    brandDnaRules: {
      typographyProportion: "oversized identity first, metadata last",
      graphicRhythm: "black mass, red strike, cinematic photo counterweight",
      negativeSpace: "large quiet field before detail",
      logoTreatment: "brand as architecture, not watermark",
      textureIntensity: "visible but subordinate to face and title"
    },
    qualityGate: "Reject Canva, dashboard, card, slide, and overlay-generator compositions",
    eyePath: titleSide === "LEFT" ? "LOGO_TO_IDENTITY_TO_FACE_TO_FEATURE_STRIP" : "FACE_TO_IDENTITY_TO_LOGO_TO_FEATURE_STRIP",
    visualTension: analysis.backgroundComplexity > 0.62 ? "HIGH" : "CONTROLLED",
    safeTypographyArea: graphicZone,
    photoZone,
    graphicZone,
    subjectFocus: {
      x: clamp(analysis.subjectCenter?.x ?? 0.52, 0.24, 0.78),
      y: clamp(analysis.subjectCenter?.y ?? 0.46, 0.22, 0.72)
    },
    cropZoom: family === "MOVIE_POSTER" ? 1.2 : format.role === "thumbnail" ? 1.24 : 1.14
  };
}