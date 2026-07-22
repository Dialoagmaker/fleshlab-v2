function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function toRect(box, width, height, fallback) {
  const source = box || fallback;
  return {
    x: clamp(source.x, 0, 1) * width,
    y: clamp(source.y, 0, 1) * height,
    w: clamp(source.w, 0.02, 1) * width,
    h: clamp(source.h, 0.02, 1) * height,
  };
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function intersectionArea(a, b) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

function rectToZone(rect, width, height) {
  return { x: rect.x / width, y: rect.y / height, w: rect.w / width, h: rect.h / height };
}

function sampleRect(ctx, rect, width, height) {
  const sx = Math.max(0, Math.round(rect.x));
  const sy = Math.max(0, Math.round(rect.y));
  const sw = Math.max(1, Math.min(width - sx, Math.round(rect.w)));
  const sh = Math.max(1, Math.min(height - sy, Math.round(rect.h)));
  const stepX = Math.max(1, Math.floor(sw / 18));
  const stepY = Math.max(1, Math.floor(sh / 18));
  let total = 0;
  let contrast = 0;
  let count = 0;
  try {
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    for (let y = 0; y < sh; y += stepY) {
      for (let x = 0; x < sw; x += stepX) {
        const index = (y * sw + x) * 4;
        const light = (data[index] + data[index + 1] + data[index + 2]) / 765;
        total += light;
        contrast += Math.abs(light - 0.5);
        count += 1;
      }
    }
  } catch {
    return { brightness: 0.38, calmness: 0.56, readability: 0.62 };
  }
  const brightness = count ? total / count : 0.38;
  const calmness = 1 - clamp((contrast / Math.max(count, 1)) * 1.9, 0, 1);
  const readability = clamp((brightness < 0.62 ? 0.72 : 0.52) + calmness * 0.24, 0, 1);
  return { brightness, calmness, readability };
}

function expandRect(rect, amount, width, height) {
  const x = clamp(rect.x - amount, 0, width);
  const y = clamp(rect.y - amount, 0, height);
  return {
    x,
    y,
    w: clamp(rect.w + amount * 2, 0, width - x),
    h: clamp(rect.h + amount * 2, 0, height - y),
  };
}

function buildCandidateLayouts(width, height, titleWordCount, bodyBox) {
  const portrait = height > width;
  const longTitle = titleWordCount > 7;
  const safe = Math.max(26, Math.min(width, height) * 0.055);
  const midY = bodyBox.y + bodyBox.h * 0.5;
  return [
    { name: "left aligned", mode: "LEFT_ALIGNED", align: "left", box: { x: safe, y: height * 0.16, w: width * (portrait ? 0.72 : 0.45), h: height * 0.52 } },
    { name: "right aligned", mode: "RIGHT_ALIGNED", align: "right", box: { x: width * (portrait ? 0.18 : 0.51), y: height * 0.16, w: width * (portrait ? 0.72 : 0.43), h: height * 0.52 } },
    { name: "centered", mode: "CENTERED", align: "center", box: { x: width * 0.14, y: portrait ? height * 0.58 : height * 0.2, w: width * 0.72, h: height * 0.32 } },
    { name: "split layout", mode: "SPLIT_LAYOUT", align: bodyBox.x + bodyBox.w / 2 > width / 2 ? "left" : "right", box: bodyBox.x + bodyBox.w / 2 > width / 2 ? { x: safe, y: height * 0.12, w: width * 0.5, h: height * 0.7 } : { x: width * 0.46, y: height * 0.12, w: width * 0.48, h: height * 0.7 } },
    { name: "bottom title", mode: "BOTTOM_TITLE", align: "center", box: { x: safe, y: Math.max(height * 0.62, midY + height * 0.08), w: width - safe * 2, h: height * 0.28 } },
    { name: "diagonal composition", mode: "DIAGONAL", align: bodyBox.x + bodyBox.w / 2 > width / 2 ? "left" : "right", diagonal: true, box: bodyBox.x + bodyBox.w / 2 > width / 2 ? { x: safe, y: height * 0.2, w: width * 0.62, h: height * 0.42 } : { x: width * 0.32, y: height * 0.2, w: width * 0.62, h: height * 0.42 } },
    { name: "full-width typography", mode: "FULL_WIDTH", align: "center", box: { x: safe, y: bodyBox.y > height * 0.42 ? height * 0.1 : height * 0.66, w: width - safe * 2, h: longTitle ? height * 0.3 : height * 0.22 } },
    { name: "image-overlap typography", mode: "IMAGE_OVERLAP", align: bodyBox.x + bodyBox.w / 2 > width / 2 ? "left" : "right", overlap: true, box: bodyBox.x + bodyBox.w / 2 > width / 2 ? { x: safe, y: height * 0.42, w: width * 0.7, h: height * 0.34 } : { x: width * 0.26, y: height * 0.42, w: width * 0.7, h: height * 0.34 } },
  ];
}

function scoreCandidate(candidate, ctx, width, height, metrics, titleWordCount) {
  const { performerBox, faceBox, bodyBox, focalPoint } = metrics;
  const box = candidate.box;
  const sample = sampleRect(ctx, box, width, height);
  const faceHit = intersectionArea(box, expandRect(faceBox, Math.min(width, height) * 0.04, width, height));
  const bodyHit = intersectionArea(box, bodyBox);
  const performerHit = intersectionArea(box, performerBox);
  const overlapRatio = performerHit / Math.max(box.w * box.h, 1);
  const facePenalty = faceHit > 0 ? 170 : 0;
  const bodyPenalty = candidate.overlap ? overlapRatio * 38 : overlapRatio * 145;
  const capacity = clamp((box.w * box.h) / (width * height * (titleWordCount > 7 ? 0.18 : 0.11)), 0, 1.3);
  const edgeUse = clamp((box.w / width) * 0.65 + (box.h / height) * 0.35, 0, 1);
  const focalDistance = Math.hypot((box.x + box.w / 2) / width - focalPoint.x, (box.y + box.h / 2) / height - focalPoint.y);
  const balance = 1 - clamp(focalDistance / 0.82, 0, 1);
  const layoutBonus = candidate.mode === "FULL_WIDTH" && titleWordCount > 8 ? 34 : candidate.mode === "BOTTOM_TITLE" && height > width ? 24 : candidate.mode === "DIAGONAL" ? 14 : 0;
  return sample.readability * 72 + sample.calmness * 45 + capacity * 62 + edgeUse * 26 + balance * 22 + layoutBonus - facePenalty - bodyPenalty;
}

export function analyzeFinalImageComposition({ ctx, width, height, analysis = {} }) {
  const focus = analysis.detections?.dominantVisualFocus || analysis.subjectCenter || { x: 0.52, y: 0.46 };
  const fallbackBody = { x: clamp(focus.x - 0.18, 0.04, 0.76), y: clamp(focus.y - 0.18, 0.05, 0.72), w: 0.36, h: 0.56 };
  const bodyBox = toRect(analysis.detections?.body || analysis.subjectBox, width, height, fallbackBody);
  const faceBox = toRect(analysis.detections?.face, width, height, { x: fallbackBody.x + fallbackBody.w * 0.28, y: fallbackBody.y + fallbackBody.h * 0.04, w: fallbackBody.w * 0.44, h: fallbackBody.h * 0.22 });
  const performerBox = expandRect(bodyBox, Math.min(width, height) * 0.035, width, height);
  const focalPoint = { x: clamp(focus.x, 0.05, 0.95), y: clamp(focus.y, 0.05, 0.95) };
  const leftMass = performerBox.x + performerBox.w / 2 < width / 2 ? 0.62 : 0.38;
  return {
    performerBox,
    faceBox,
    bodyBox,
    focalPoint,
    visualBalance: { subjectMassLeft: leftMass, subjectMassRight: 1 - leftMass },
    availableNegativeSpace: analysis.negativeSpace,
  };
}

export function chooseCompositionAwareTypographyLayout({ ctx, width, height, analysis = {}, title = "" }) {
  const titleWordCount = compact(title).split(" ").filter(Boolean).length;
  const metrics = analyzeFinalImageComposition({ ctx, width, height, analysis });
  const candidates = buildCandidateLayouts(width, height, titleWordCount, metrics.bodyBox)
    .map(candidate => ({ ...candidate, score: scoreCandidate(candidate, ctx, width, height, metrics, titleWordCount) }))
    .sort((a, b) => b.score - a.score);
  const selected = candidates[0];
  return {
    layoutName: selected.name,
    layoutMode: selected.mode,
    align: selected.align,
    box: selected.box,
    diagonal: Boolean(selected.diagonal),
    overlap: Boolean(selected.overlap),
    score: Math.round(selected.score),
    candidates: candidates.slice(0, 4).map(item => ({ layout: item.name, score: Math.round(item.score), zone: rectToZone(item.box, width, height) })),
    performerBoundingBox: rectToZone(metrics.performerBox, width, height),
    facePosition: rectToZone(metrics.faceBox, width, height),
    bodyPosition: rectToZone(metrics.bodyBox, width, height),
    imageFocalPoint: metrics.focalPoint,
    visualBalance: metrics.visualBalance,
    availableNegativeSpace: metrics.availableNegativeSpace,
  };
}