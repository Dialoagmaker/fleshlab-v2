function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function toScore(value) {
  return Math.round(clamp(value) * 100);
}

async function blobToBitmap(blob) {
  if (window.createImageBitmap) return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = reject;
    image.src = url;
  });
}

function isSkinLike(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  return r > 58 && g > 32 && b > 20 && r > g * 1.05 && r > b * 1.18 && max - min > 14 && brightness > 45 && brightness < 235;
}

async function imageStats(blob) {
  const bitmap = await blobToBitmap(blob);
  const width = 128;
  const height = 72;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const drawW = bitmap.width * scale;
  const drawH = bitmap.height * scale;
  ctx.drawImage(bitmap, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
  const data = ctx.getImageData(0, 0, width, height).data;
  const histogram = new Array(64).fill(0);
  const luma = [];
  let skin = 0, skinR = 0, skinG = 0, skinB = 0, skinX = 0, skinY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const bin = (Math.floor(r / 64) * 16) + (Math.floor(g / 64) * 4) + Math.floor(b / 64);
      histogram[bin] += 1;
      luma.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
      if (isSkinLike(r, g, b)) {
        skin += 1;
        skinR += r;
        skinG += g;
        skinB += b;
        skinX += x;
        skinY += y;
      }
    }
  }

  const total = width * height;
  return {
    histogram: histogram.map(value => value / total),
    luma,
    skinRatio: skin / total,
    skinColor: skin ? [skinR / skin, skinG / skin, skinB / skin] : [0, 0, 0],
    skinCentroid: skin ? [skinX / skin / width, skinY / skin / height] : [0, 0],
  };
}

function histogramSimilarity(a, b) {
  return a.reduce((sum, value, index) => sum + Math.min(value, b[index]), 0);
}

function lumaCorrelation(a, b) {
  const avgA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const avgB = b.reduce((sum, value) => sum + value, 0) / b.length;
  let numerator = 0, denomA = 0, denomB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const da = a[i] - avgA;
    const db = b[i] - avgB;
    numerator += da * db;
    denomA += da * da;
    denomB += db * db;
  }
  if (!denomA || !denomB) return 0;
  return clamp((numerator / Math.sqrt(denomA * denomB) + 1) / 2);
}

function skinSimilarity(original, enhanced) {
  if (original.skinRatio < 0.01 || enhanced.skinRatio < 0.01) return 0;
  const colorDistance = Math.sqrt(original.skinColor.reduce((sum, value, index) => sum + Math.pow(value - enhanced.skinColor[index], 2), 0));
  const tone = clamp(1 - colorDistance / 75);
  const ratio = clamp(1 - Math.abs(original.skinRatio - enhanced.skinRatio) / Math.max(original.skinRatio, enhanced.skinRatio, 0.05));
  const centroidDistance = Math.sqrt(Math.pow(original.skinCentroid[0] - enhanced.skinCentroid[0], 2) + Math.pow(original.skinCentroid[1] - enhanced.skinCentroid[1], 2));
  const layout = clamp(1 - centroidDistance / 0.38);
  return tone * 0.45 + ratio * 0.25 + layout * 0.3;
}

export function scoreIdentityReferenceFrame(frame) {
  const hero = frame?.hero || {};
  const metrics = frame?.metrics || {};
  const faceVisible = Boolean(hero.faceVisible || hero.faceZoneRatio >= 0.8);
  const sharp = clamp(Number(metrics.sharpness || 0) / 75);
  const lit = clamp(1 - Math.abs(Number(metrics.brightness || 128) - 132) / 105);
  const exposure = clamp(1 - (Number(metrics.overexposure || 0) + Number(metrics.underexposure || 0)) / 80);
  const faceSize = clamp(Number(hero.subjectDominance || 0) * 2.8);
  const frontal = clamp((1 - Number(hero.cropRisk || 0.48)) * 0.65 + (faceSize >= 0.34 ? 0.35 : 0));
  const eyes = faceVisible ? clamp(sharp * 0.38 + lit * 0.28 + frontal * 0.34) : 0;
  const face = faceVisible ? toScore(0.24 + eyes * 0.26 + sharp * 0.16 + lit * 0.12 + exposure * 0.1 + frontal * 0.12) : 0;
  const hair = faceVisible ? toScore(0.24 + sharp * 0.2 + clamp(Number(metrics.contrast || 0) / 80) * 0.22 + frontal * 0.18 + faceSize * 0.16) : 0;
  const body = toScore(clamp(Number(hero.upperBodyRatio || 0)) * 0.36 + clamp(Number(hero.subjectDominance || 0) * 2.4) * 0.32 + clamp(Number(hero.subjectSeparation || hero.compositionScore || 0)) * 0.32);
  const pose = toScore(clamp(Number(hero.bodyLanguage || 0)) * 0.36 + clamp(Number(hero.compositionScore || 0)) * 0.26 + frontal * 0.2 + clamp(Number(hero.sceneReadability || 0)) * 0.18);
  const overall = Math.round(face * 0.42 + hair * 0.12 + body * 0.18 + pose * 0.18 + toScore(lit * exposure) * 0.1);
  const reasons = [];
  if (!faceVisible) reasons.push("face not clearly visible");
  if (eyes < 0.48) reasons.push("eyes not clear enough");
  if (hair < 52) reasons.push("hair not clear enough");
  if (faceSize < 0.28) reasons.push("face is too small");
  if (sharp < 0.38) reasons.push("soft frame");
  if (lit * exposure < 0.42) reasons.push("weak lighting");
  if (frontal < 0.42) reasons.push("face angle/crop is weak");
  return { face, hair, body, pose, overall, eyes: toScore(eyes), faceSize: toScore(faceSize), hasClearFace: face >= 58 && overall >= 52, reasons };
}

export function selectStrongestIdentityReferenceFrame(frames = []) {
  return [...frames]
    .map(frame => ({ frame, identityReference: scoreIdentityReferenceFrame(frame) }))
    .filter(item => item.identityReference.hasClearFace)
    .sort((a, b) => b.identityReference.overall - a.identityReference.overall || b.identityReference.face - a.identityReference.face)[0] || null;
}

export async function validateIdentityPreservation(originalBlob, enhancedBlob, referenceFrame = null) {
  const original = await imageStats(originalBlob);
  const enhanced = await imageStats(enhancedBlob);
  const histogram = histogramSimilarity(original.histogram, enhanced.histogram);
  const structure = lumaCorrelation(original.luma, enhanced.luma);
  const skin = skinSimilarity(original, enhanced);
  const reference = referenceFrame ? scoreIdentityReferenceFrame(referenceFrame) : null;
  const face = toScore(structure * 0.38 + skin * 0.28 + histogram * 0.16 + ((reference?.face || 55) / 100) * 0.18);
  const hair = toScore(histogram * 0.58 + structure * 0.26 + ((reference?.hair || 55) / 100) * 0.16);
  const body = toScore(skin * 0.46 + structure * 0.24 + histogram * 0.1 + ((reference?.body || 55) / 100) * 0.2);
  const pose = toScore(structure * 0.52 + skin * 0.12 + histogram * 0.12 + ((reference?.pose || 55) / 100) * 0.24);
  const overall = Math.round(face * 0.34 + hair * 0.14 + body * 0.18 + pose * 0.22 + Math.round((histogram * 0.4 + structure * 0.4 + skin * 0.2) * 100) * 0.12);
  return {
    accepted: overall >= 50,
    identityConfidence: overall,
    checks: { face, hair, body, pose, overall },
    reference,
  };
}