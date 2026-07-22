function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function inferDominantSide(analysis = {}) {
  const subjectX = analysis.subjectCenter?.x ?? 0.58;
  if ((analysis.subjectSide || "") === "left" || subjectX < 0.42) return "LEFT";
  return "RIGHT";
}

function chooseFamily({ format, analysis }) {
  const ratio = format.width / format.height;
  const complexity = analysis.backgroundComplexity ?? 0.45;
  if (format.role === "cover" || ratio < 0.75) return "MOVIE_POSTER";
  if (format.role === "hero" || ratio > 1.9) return "STREAMING_HERO";
  if (complexity > 0.68) return "DOCUMENTARY";
  if ((analysis.subjectSeparation ?? 0.6) > 0.72) return "FASHION_EDITORIAL";
  return "SPLIT_KEY_ART";
}

export function createCompositionPlan({ analysis = {}, format = {}, campaign = {} }) {
  const dominantSide = inferDominantSide(analysis);
  const titleSide = dominantSide === "RIGHT" ? "LEFT" : "RIGHT";
  const family = chooseFamily({ format, analysis, campaign });
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
    backgroundDarkening: "LEFT_ONLY",
    graphicField: "BLACK_TEXTURE",
    accentStyle: "RED_BRUSH",
    hierarchy: "HERO",
    eyePath: titleSide === "LEFT" ? "LOGO_TO_TITLE_TO_FACE_TO_FEATURE_STRIP" : "FACE_TO_TITLE_TO_LOGO_TO_FEATURE_STRIP",
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