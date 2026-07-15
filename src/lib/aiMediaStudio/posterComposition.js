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

export function calculateTextArea(analysis, variant = "balanced", settings = {}, family = {}) {
  const margin = safeMargin(settings);
  const language = family?.graphicLanguage || {};
  const baseZone = language.designZoneWidth || (variant === "performer" ? 0.42 : 0.39);
  const designZoneWidth = clamp(baseZone, 0.3, 0.45);
  const area = {
    x: margin,
    y: variant === "title" ? 0.085 : 0.095,
    w: Math.max(0.24, designZoneWidth - margin * (language.negative_space_strategy === "premium_silence" ? 1.85 : 1.55)),
    h: 0.82,
    align: "left",
  };

  if (isManual(settings, "titleY")) area.y = clamp((Number(settings.titleY) || 10) / 100, margin, 1 - margin - area.h);
  area.x = clamp(area.x, margin, 0.45 - area.w);
  area.y = clamp(area.y, margin, 1 - margin - area.h);
  return area;
}

export function calculateLogoArea(textArea, variant = "balanced", settings = {}, family = {}) {
  const margin = safeMargin(settings);
  const logoArea = { x: textArea.x, y: textArea.y, w: 0.18 };

  if (isManual(settings, "logoScale")) logoArea.w *= clamp((Number(settings.logoScale) || 100) / 100, 0.85, 1.35);
  logoArea.w = clamp(logoArea.w, 0.15, 0.2);
  if (isManual(settings, "logoX")) logoArea.x += (Number(settings.logoX) || 0) / 100;
  if (isManual(settings, "logoY")) logoArea.y += (Number(settings.logoY) || 0) / 100;
  logoArea.x = clamp(logoArea.x, margin, 0.45 - logoArea.w);
  logoArea.y = clamp(logoArea.y, margin, 1 - margin - logoArea.w * 0.35);
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
  const artDirectionScore = Math.min(1, languageFit * 0.42 + (family?.graphicLanguage?.poster_density || 0.58) * 0.18 + (family?.graphicLanguage?.emotional_intensity || 0.66) * 0.18 + (analysis.subjectSeparation || 0.55) * 0.14 + (analysis.visualCuriosity || 0.55) * 0.08);
  const layoutScore = Math.min(1, 0.6 + languageFit * 0.12 + artDirectionScore * 0.18 + (family?.id === "commercial-thumbnail" ? 0.06 : 0) + (variant === "title" ? 0.04 : 0));
  return { crop, textArea, logoArea, designZone, footerVisible, footerY: 1 - safeMargin(settings) - 0.025, variant, familyId: family.id, layoutScore, artDirectionScore };
}