function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
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

export async function validateIdentityPreservation(originalBlob, enhancedBlob) {
  const original = await imageStats(originalBlob);
  const enhanced = await imageStats(enhancedBlob);
  const histogram = histogramSimilarity(original.histogram, enhanced.histogram);
  const structure = lumaCorrelation(original.luma, enhanced.luma);
  const skin = skinSimilarity(original, enhanced);
  const confidence = Math.round((histogram * 0.34 + structure * 0.38 + skin * 0.28) * 100);
  return {
    accepted: confidence >= 95,
    identityConfidence: confidence,
    checks: {
      globalImageSimilarity: Math.round(histogram * 100),
      structureSimilarity: Math.round(structure * 100),
      performerSkinAndPlacementSimilarity: Math.round(skin * 100),
    },
  };
}