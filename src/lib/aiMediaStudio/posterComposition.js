function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isManual(settings, key) {
  return Boolean(settings?.manualOverrides?.[key]);
}

function safeMargin(settings) {
  return clamp((Number(settings?.safeMargin) || 7) / 100, 0.03, 0.14);
}

export function calculateCrop(image, analysis, outputWidth, outputHeight, variant = "balanced", settings = {}, family = {}) {
  const sourceAspect = image.width / image.height;
  const outputAspect = outputWidth / outputHeight;
  let sw = image.width;
  let sh = image.height;
  if (sourceAspect > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;

  const subject = analysis.subjectBox;
  const cx = (subject.x + subject.w / 2) * image.width;
  const cy = (subject.y + subject.h / 2) * image.height;
  const language = family?.graphicLanguage || {};
  const commercialBias = variant === "performer" || variant === "close_hero" ? 0.18 : 0.13;
  let sx = cx - sw * (0.5 + commercialBias);
  let sy = cy - sh * 0.46;

  const autoZoom = Math.max(family?.cropZoom || 1, variant === "performer" || variant === "close_hero" ? 1.22 : 1.12) * (language.camera_feeling === "aspirational_lifestyle" ? 0.96 : 1);
  const zoom = isManual(settings, "zoom") ? clamp(Number(settings.zoom) || 1, 0.7, 2.4) : clamp(autoZoom, 0.85, 2.4);
  if (zoom !== 1) {
    const centerX = sx + sw / 2;
    const centerY = sy + sh / 2;
    sw = clamp(sw / zoom, 1, image.width);
    sh = clamp(sh / zoom, 1, image.height);
    sx = centerX - sw / 2;
    sy = centerY - sh / 2;
  }

  if (isManual(settings, "x")) sx += (Number(settings.x) || 0) / 100 * sw * 0.55;
  if (isManual(settings, "y")) sy += (Number(settings.y) || 0) / 100 * sh * 0.55;

  sx = clamp(sx, 0, Math.max(0, image.width - sw));
  sy = clamp(sy, 0, Math.max(0, image.height - sh));
  return { sx, sy, sw, sh, zoom };
}

function overlaps(a, b) {
  if (!a || !b) return false;
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

export function calculateTextArea(analysis, variant = "balanced", settings = {}, family = {}) {
  const margin = safeMargin(settings);
  const language = family?.graphicLanguage || {};
  const negative = analysis?.negativeSpace || null;
  const face = analysis?.detections?.face || null;
  const baseZone = language.designZoneWidth || (variant === "performer" ? 0.44 : 0.41);
  const designZoneWidth = clamp(baseZone, 0.34, 0.52);
  const preferred = negative && negative.score > 0.42
    ? { x: negative.x, y: Math.max(negative.y, 0.14), w: Math.max(negative.w, 0.34), h: Math.max(negative.h, 0.34), align: negative.x > 0.5 ? "right" : "left" }
    : { x: margin, y: variant === "title" ? 0.16 : 0.18, w: Math.max(0.32, designZoneWidth - margin * 1.35), h: 0.72, align: "left" };
  const area = {
    x: clamp(preferred.x, margin, 1 - margin - 0.32),
    y: clamp(preferred.y, margin + 0.08, 0.72),
    w: clamp(preferred.w, 0.32, 0.56),
    h: clamp(preferred.h, 0.28, 0.76),
    align: preferred.align || "left",
  };

  if (overlaps(area, face)) {
    area.x = face.x + face.w / 2 > 0.5 ? margin : 1 - margin - area.w;
    area.y = Math.max(area.y, margin + 0.1);
  }
  if (isManual(settings, "titleY")) area.y = clamp((Number(settings.titleY) || 10) / 100, margin, 1 - margin - area.h);
  area.x = clamp(area.x, margin, 1 - margin - area.w);
  area.y = clamp(area.y, margin, 1 - margin - area.h);
  return area;
}

export function calculateLogoArea(textArea, variant = "balanced", settings = {}, family = {}) {
  const margin = safeMargin(settings);
  const logoArea = { x: textArea.x < 0.5 ? margin : 1 - margin - 0.16, y: margin, w: 0.16 };

  if (isManual(settings, "logoScale")) logoArea.w *= clamp((Number(settings.logoScale) || 100) / 100, 0.85, 1.18);
  logoArea.w = clamp(logoArea.w, 0.12, 0.17);
  if (isManual(settings, "logoX")) logoArea.x += (Number(settings.logoX) || 0) / 100;
  if (isManual(settings, "logoY")) logoArea.y += (Number(settings.logoY) || 0) / 100;
  logoArea.x = clamp(logoArea.x, margin, 1 - margin - logoArea.w);
  logoArea.y = clamp(logoArea.y, margin, Math.max(margin, textArea.y - logoArea.w * 0.42));
  return logoArea;
}

export function shouldShowFooter(analysis, variant = "balanced", family = {}) {
  if (variant === "performer" || variant === "close_hero" || family.id === "minimal-poster") return false;
  return analysis.negativeSpace.score > 0.54 && analysis.backgroundComplexity < 0.64;
}

export function calculateComposition(image, analysis, family, width, height, variant = "balanced", settings = {}) {
  const crop = calculateCrop(image, analysis, width, height, variant, settings, family);
  const textArea = calculateTextArea(analysis, variant, settings, family);
  const logoArea = calculateLogoArea(textArea, variant, settings, family);
  const designZone = { x: 0, y: 0, w: clamp(textArea.w + textArea.x + safeMargin(settings) * 0.85, 0.3, family?.graphicLanguage?.designZoneWidth ? Math.max(0.34, family.graphicLanguage.designZoneWidth + 0.04) : 0.45), h: 1 };
  const footerVisible = shouldShowFooter(analysis, variant, family);
  const languageFit = family?.graphicLanguage?.strength || 0.62;
  const artDirectionScore = Math.min(1, 0.18 + languageFit * 0.34 + (family?.graphicLanguage?.poster_density || 0.58) * 0.17 + (family?.graphicLanguage?.emotional_intensity || 0.66) * 0.15 + (analysis.subjectSeparation || 0.55) * 0.1 + (analysis.visualCuriosity || 0.55) * 0.06);
  const layoutScore = Math.min(1, 0.6 + languageFit * 0.12 + artDirectionScore * 0.18 + (family?.id === "commercial-thumbnail" ? 0.06 : 0) + (variant === "title" ? 0.04 : 0));
  return { crop, textArea, logoArea, designZone, footerVisible, footerY: 1 - safeMargin(settings) - 0.025, variant, familyId: family.id, layoutScore, artDirectionScore };
}