import { analyzeVisionLayer } from "./visionLayer";

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function sideFromBox(box) {
  const centerX = box.x + box.w / 2;
  return centerX < 0.42 ? "left" : centerX > 0.58 ? "right" : "center";
}

export async function analyzePosterImage(image, targetWidth = 360) {
  const vision = await analyzeVisionLayer(image, { targetWidth });
  const subjectBox = vision.bodyBox || { x: 0.5, y: 0.2, w: 0.38, h: 0.62 };
  const subjectCenter = vision.primarySubject?.visualFocus || { x: subjectBox.x + subjectBox.w / 2, y: subjectBox.y + subjectBox.h / 2 };
  const subjectSide = vision.primarySubject?.side || sideFromBox(subjectBox);
  const preferredTextSide = subjectSide === "left" ? "right" : subjectSide === "right" ? "left" : "auto";
  const negativeSpace = vision.safeTypographyZone || { x: 0.06, y: 0.32, w: 0.34, h: 0.36, score: 0.3 };

  return {
    width: vision.dimensions.width,
    height: vision.dimensions.height,
    cells: vision.cells || [],
    vision,
    subjectBox,
    subjectCenter,
    subjectSide,
    preferredTextSide,
    negativeSpace,
    brightness: vision.brightness,
    backgroundComplexity: vision.backgroundComplexity,
    subjectDominance: Number((vision.primarySubject?.dominance || 0).toFixed(2)),
    subjectVisibility: Number((vision.primarySubject?.visibilityScore || 0).toFixed(2)),
    subjectSeparation: Number((vision.primarySubject?.separationScore || 0).toFixed(2)),
    subjectCropRisk: Number((vision.primarySubject?.cropRisk || 0).toFixed(2)),
    visualCuriosity: vision.visualCuriosity,
    sceneReadability: vision.sceneReadability,
    interactionStrength: vision.interactionStrength,
    bodyLanguage: vision.bodyLanguage,
    emotionalPresence: vision.emotionalPresence,
    storyContinuation: vision.storyContinuation,
    clickPotential: vision.clickPotential,
    thumbnailImpact: vision.thumbnailImpact,
    storyScore: vision.storyScore,
    imageQualityScore: vision.imageQualityScore,
    detections: {
      face: vision.faceBox || null,
      body: vision.bodyBox || subjectBox,
      torso: vision.torsoBox || null,
      dominantVisualFocus: subjectCenter,
    },
  };
}

export function scorePosterCandidate({ analysis, typographyScore = 0.7, brandScore = 0.82, layoutScore = 0.7, graphicLanguageScore = 0.62 }) {
  const faceScore = analysis.detections?.face ? 1 : analysis.vision?.capabilities?.faceDetection ? 0.28 : 0.48;
  const readableSubject = clamp((analysis.sceneReadability || 0) * 0.46 + (analysis.subjectSeparation || 0) * 0.24 + faceScore * 0.18 + (analysis.bodyLanguage || 0) * 0.12);
  const hierarchy = clamp(typographyScore * 0.58 + brandScore * 0.18 + layoutScore * 0.24);
  const composition = clamp(layoutScore * 0.42 + hierarchy * 0.32 + readableSubject * 0.16 + (analysis.thumbnailImpact || 0) * 0.1);
  const marketing = clamp(hierarchy * 0.38 + (analysis.clickPotential || 0) * 0.24 + (analysis.thumbnailImpact || 0) * 0.18 + (analysis.visualCuriosity || 0) * 0.1 + brandScore * 0.1);
  const story = clamp((analysis.storyScore || 0) * 0.32 + readableSubject * 0.28 + (analysis.interactionStrength || 0) * 0.16 + marketing * 0.24);
  const graphicLanguage = clamp(graphicLanguageScore);
  const professionalMarketingScore = clamp(hierarchy * 0.34 + marketing * 0.26 + composition * 0.18 + readableSubject * 0.08 + graphicLanguage * 0.14);
  const imageQuality = clamp((analysis.imageQualityScore || 0) * 0.22 + readableSubject * 0.24 + composition * 0.18 + hierarchy * 0.22 + graphicLanguage * 0.14);
  const total = clamp(professionalMarketingScore * 0.38 + marketing * 0.2 + hierarchy * 0.16 + story * 0.12 + graphicLanguage * 0.14);
  const qualityFailures = [];
  if (readableSubject < 0.26) qualityFailures.push("subject cannot be recognised");
  if (typographyScore < 0.62) qualityFailures.push("title not dominant enough for thumbnail");
  if (hierarchy < 0.68) qualityFailures.push("weak commercial hierarchy");
  if (professionalMarketingScore < 0.68) qualityFailures.push("not professional marketing key art");
  if (graphicLanguage < 0.58) qualityFailures.push("graphic language too weak");
  if (total < 0.66) qualityFailures.push("weak commercial impact");

  return {
    total: Math.round(total * 100),
    story: Math.round(story * 100),
    imageQuality: Math.round(imageQuality * 100),
    hierarchy: Math.round(hierarchy * 100),
    composition: Math.round(composition * 100),
    professionalMarketing: Math.round(professionalMarketingScore * 100),
    graphicLanguage: Math.round(graphicLanguage * 100),
    subjectDominance: Math.round((analysis.subjectDominance || 0) * 100),
    negativeSpace: Math.round(analysis.negativeSpace.score * 100),
    typography: Math.round(typographyScore * 100),
    brand: Math.round(brandScore * 100),
    marketing: Math.round(marketing * 100),
    passesQualityGate: qualityFailures.length === 0,
    qualityFailures,
  };
}