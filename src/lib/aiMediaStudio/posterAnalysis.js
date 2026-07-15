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
  const story = clamp((analysis.storyScore || 0) * 0.52 + faceScore * 0.14 + (analysis.subjectVisibility || 0) * 0.18 + (analysis.subjectSeparation || 0) * 0.16);
  const imageQuality = clamp((analysis.imageQualityScore || 0) * 0.38 + (analysis.thumbnailImpact || 0) * 0.24 + (1 - (analysis.backgroundComplexity || 0)) * 0.14 + typographySafety * 0.24);
  const hierarchy = clamp(story * 0.36 + typographySafety * 0.32 + layoutScore * 0.2 + brandScore * 0.12);
  const composition = clamp(layoutScore * 0.34 + typographySafety * 0.28 + (analysis.subjectSeparation || 0) * 0.22 + (1 - (analysis.subjectCropRisk || 0)) * 0.16);
  const marketing = clamp((analysis.thumbnailImpact || 0) * 0.34 + story * 0.3 + imageQuality * 0.22 + brandScore * 0.14);
  const total = clamp(story * 0.3 + composition * 0.24 + imageQuality * 0.22 + hierarchy * 0.14 + marketing * 0.1);
  const qualityFailures = [];
  if (analysis.subjectDominance < 0.16) qualityFailures.push("performer too small");
  if (analysis.subjectVisibility < 0.32) qualityFailures.push("performer not readable");
  if (analysis.subjectCropRisk > 0.72) qualityFailures.push("body cropped awkwardly");
  if (analysis.backgroundComplexity > 0.78) qualityFailures.push("background clutter dominates");
  if (analysis.negativeSpace.score < 0.32) qualityFailures.push("no safe typography space");
  if (analysis.thumbnailImpact < 0.34) qualityFailures.push("weak thumbnail impact");
  if (analysis.vision?.capabilities?.faceDetection && !analysis.detections?.face) qualityFailures.push("face not visible enough");
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