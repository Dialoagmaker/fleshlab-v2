export function calculateCrop(image, analysis, outputWidth, outputHeight, variant = "balanced") {
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
  const sx = Math.max(0, Math.min(image.width - sw, cx - sw * (0.5 + variantBias)));
  const sy = Math.max(0, Math.min(image.height - sh, cy - sh * 0.46));
  return { sx, sy, sw, sh };
}

export function calculateTextArea(analysis, variant = "balanced") {
  const ns = analysis.negativeSpace;
  const subject = analysis.subjectBox;
  if (variant === "title") {
    const leftOpen = subject.x > 0.42;
    return leftOpen ? { x: 0.055, y: 0.34, w: 0.38, h: 0.38, align: "left" } : { x: 0.57, y: 0.34, w: 0.36, h: 0.38, align: "left" };
  }
  if (variant === "performer") {
    return subject.y > 0.3 ? { x: 0.07, y: 0.08, w: 0.46, h: 0.26, align: "left" } : { x: 0.07, y: 0.66, w: 0.52, h: 0.25, align: "left" };
  }
  if (analysis.subjectSide === "center") return { x: 0.07, y: 0.66, w: 0.56, h: 0.25, align: "left" };
  return {
    x: Math.max(0.05, Math.min(0.58, ns.x)),
    y: Math.max(0.18, Math.min(0.64, ns.y + 0.04)),
    w: Math.max(0.32, Math.min(0.46, ns.w + 0.13)),
    h: Math.max(0.25, Math.min(0.42, ns.h + 0.12)),
    align: "left",
  };
}

export function calculateLogoArea(textArea, variant = "balanced") {
  if (variant === "title") return { x: textArea.x, y: 0.07, w: 0.115 };
  if (variant === "performer") return { x: 0.055, y: 0.065, w: 0.102 };
  return { x: textArea.x, y: Math.max(0.055, textArea.y - 0.22), w: 0.108 };
}

export function shouldShowFooter(analysis, variant = "balanced") {
  if (variant === "performer") return false;
  return analysis.negativeSpace.score > 0.54 && analysis.backgroundComplexity < 0.64;
}

export function calculateComposition(image, analysis, family, width, height, variant = "balanced") {
  const crop = calculateCrop(image, analysis, width, height, variant);
  const textArea = calculateTextArea(analysis, variant);
  const logoArea = calculateLogoArea(textArea, variant);
  const footerVisible = shouldShowFooter(analysis, variant);
  const layoutScore = Math.min(1, 0.5 + analysis.negativeSpace.score * 0.32 + analysis.subjectDominance * 0.18);
  return { crop, textArea, logoArea, footerVisible, variant, familyId: family.id, layoutScore };
}