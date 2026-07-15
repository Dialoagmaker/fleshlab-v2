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

export function scorePosterCandidate({ analysis, typographyScore = 0.7, brandScore = 0.82, layoutScore = 0.7 }) {
  const faceScore = analysis.detections?.face ? 1 : analysis.vision?.capabilities?.faceDetection ? 0.18 : 0.45;
  const typographySafety = clamp(analysis.negativeSpace.score * 0.66 + typographyScore * 0.34);
  const story = clamp((analysis.storyScore || 0) * 0.46 + (analysis.clickPotential || 0) * 0.18 + (analysis.visualCuriosity || 0) * 0.12 + (analysis.sceneReadability || 0) * 0.12 + faceScore * 0.06 + (analysis.interactionStrength || 0) * 0.06);
  const imageQuality = clamp((analysis.imageQualityScore || 0) * 0.42 + (analysis.sceneReadability || 0) * 0.24 + (analysis.thumbnailImpact || 0) * 0.18 + typographySafety * 0.16);
  const hierarchy = clamp(story * 0.38 + typographySafety * 0.28 + layoutScore * 0.18 + (analysis.thumbnailImpact || 0) * 0.16);
  const composition = clamp(layoutScore * 0.28 + typographySafety * 0.22 + (analysis.sceneReadability || 0) * 0.22 + (analysis.bodyLanguage || 0) * 0.16 + (analysis.subjectSeparation || 0) * 0.12);
  const marketing = clamp((analysis.clickPotential || 0) * 0.34 + story * 0.28 + (analysis.visualCuriosity || 0) * 0.16 + imageQuality * 0.12 + brandScore * 0.1);
  const total = clamp(story * 0.34 + marketing * 0.22 + imageQuality * 0.2 + composition * 0.14 + hierarchy * 0.1);
  const qualityFailures = [];
  if (analysis.subjectDominance < 0.18) qualityFailures.push("performer too small");
  if (analysis.sceneReadability < 0.3) qualityFailures.push("subject cannot be recognised");
  if (analysis.subjectCropRisk > 0.72) qualityFailures.push("crop destroys visual understanding");
  if (analysis.backgroundComplexity > 0.86 && analysis.subjectSeparation < 0.34) qualityFailures.push("unreadable silhouette");
  if (analysis.thumbnailImpact < 0.34) qualityFailures.push("weak thumbnail impact");
  if (analysis.vision?.capabilities?.faceDetection && !analysis.detections?.face && analysis.sceneReadability < 0.42) qualityFailures.push("face and subject not readable enough");
  if (total < 0.55) qualityFailures.push("weak story score");

  return {
    total: Math.round(total * 100),
    story: Math.round(story * 100),
    imageQuality: Math.round(imageQuality * 100),
    hierarchy: Math.round(hierarchy * 100),
    composition: Math.round(composition * 100),
    subjectDominance: Math.round((analysis.subjectDominance || 0) * 100),
    negativeSpace: Math.round(analysis.negativeSpace.score * 100),
    typography: Math.round(typographyScore * 100),
    brand: Math.round(brandScore * 100),
    marketing: Math.round(marketing * 100),
    passesQualityGate: qualityFailures.length === 0,
    qualityFailures,
  };
}