function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isManual(settings, key) {
  return Boolean(settings?.manualOverrides?.[key]);
}

function safeMargin(settings) {
  return clamp((Number(settings?.safeMargin) || 7) / 100, 0.03, 0.14);
}

export function calculateCrop(image, analysis, outputWidth, outputHeight, variant = "balanced", settings = {}) {
  const sourceAspect = image.width / image.height;
  const outputAspect = outputWidth / outputHeight;
  let sw = image.width;
  let sh = image.height;
  if (sourceAspect > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;

  const subject = analysis.subjectBox;
  const cx = (subject.x + subject.w / 2) * image.width;
  const cy = (subject.y + subject.h / 2) * image.height;
  const variantBias = variant === "performer" ? 0 : variant === "title" ? (analysis.subjectSide === "left" ? -0.14 : 0.14) : 0;
  let sx = cx - sw * (0.5 + variantBias);
  let sy = cy - sh * 0.46;

  const zoom = isManual(settings, "zoom") ? clamp(Number(settings.zoom) || 1, 0.7, 2.2) : 1;
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
  return { sx, sy, sw, sh };
}

export function calculateTextArea(analysis, variant = "balanced", settings = {}) {
  const ns = analysis.negativeSpace;
  const subject = analysis.subjectBox;
  let area;
  if (variant === "title") {
    const leftOpen = subject.x > 0.42;
    area = leftOpen ? { x: 0.055, y: 0.34, w: 0.38, h: 0.38, align: "left" } : { x: 0.57, y: 0.34, w: 0.36, h: 0.38, align: "left" };
  } else if (variant === "performer") {
    area = subject.y > 0.3 ? { x: 0.07, y: 0.08, w: 0.46, h: 0.26, align: "left" } : { x: 0.07, y: 0.66, w: 0.52, h: 0.25, align: "left" };
  } else if (analysis.subjectSide === "center") {
    area = { x: 0.07, y: 0.66, w: 0.56, h: 0.25, align: "left" };
  } else {
    area = {
      x: Math.max(0.05, Math.min(0.58, ns.x)),
      y: Math.max(0.18, Math.min(0.64, ns.y + 0.04)),
      w: Math.max(0.32, Math.min(0.46, ns.w + 0.13)),
      h: Math.max(0.25, Math.min(0.42, ns.h + 0.12)),
      align: "left",
    };
  }

  const margin = safeMargin(settings);
  if (isManual(settings, "titleY")) area.y = clamp((Number(settings.titleY) || 57) / 100, margin, 1 - margin - area.h);
  area.x = clamp(area.x, margin, 1 - margin - area.w);
  area.y = clamp(area.y, margin, 1 - margin - area.h);
  return area;
}

export function calculateLogoArea(textArea, variant = "balanced", settings = {}) {
  const margin = safeMargin(settings);
  let logoArea;
  if (variant === "title") logoArea = { x: textArea.x, y: 0.06, w: 0.155 };
  else if (variant === "performer") logoArea = { x: 0.055, y: 0.06, w: 0.14 };
  else logoArea = { x: textArea.x, y: Math.max(0.05, textArea.y - 0.25), w: 0.148 };
  logoArea.w = clamp(logoArea.w, 0.12, Math.min(0.18, 1 - margin * 2));
  logoArea.x = clamp(logoArea.x, margin, 1 - margin - logoArea.w);
  logoArea.y = clamp(logoArea.y, margin, 1 - margin - logoArea.w * 0.35);
  return logoArea;
}

export function shouldShowFooter(analysis, variant = "balanced") {
  if (variant === "performer") return false;
  return analysis.negativeSpace.score > 0.54 && analysis.backgroundComplexity < 0.64;
}

export function calculateComposition(image, analysis, family, width, height, variant = "balanced", settings = {}) {
  const crop = calculateCrop(image, analysis, width, height, variant, settings);
  const textArea = calculateTextArea(analysis, variant, settings);
  const logoArea = calculateLogoArea(textArea, variant, settings);
  const footerVisible = shouldShowFooter(analysis, variant);
  const layoutScore = Math.min(1, 0.5 + analysis.negativeSpace.score * 0.32 + analysis.subjectDominance * 0.18);
  return { crop, textArea, logoArea, footerVisible, footerY: 1 - safeMargin(settings) - 0.025, variant, familyId: family.id, layoutScore };
}