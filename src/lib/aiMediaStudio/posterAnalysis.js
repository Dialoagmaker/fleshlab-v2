function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function emptyGrid(width, height, cols = 12, rows = 8) {
  return Array.from({ length: cols * rows }, (_, index) => ({
    index,
    col: index % cols,
    row: Math.floor(index / cols),
    x: (index % cols) / cols,
    y: Math.floor(index / cols) / rows,
    w: 1 / cols,
    h: 1 / rows,
    luma: 0,
    contrast: 0,
    edge: 0,
    saliency: 0,
    samples: 0,
    negativeScore: 0,
  }));
}

function bestNegativeSpace(cells, subjectBox, preferred = "auto") {
  const scored = cells.map(cell => {
    const cx = cell.x + cell.w / 2;
    const cy = cell.y + cell.h / 2;
    const insideSubject = cx > subjectBox.x && cx < subjectBox.x + subjectBox.w && cy > subjectBox.y && cy < subjectBox.y + subjectBox.h;
    const sideBias = preferred === "left" ? 1 - cx : preferred === "right" ? cx : 0.5 + Math.abs(cx - 0.5);
    const score = cell.negativeScore + sideBias * 0.16 - (insideSubject ? 0.8 : 0);
    return { ...cell, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0] || { x: 0.06, y: 0.32, w: 0.34, h: 0.36 };
  const sameSide = scored.filter(cell => Math.abs(cell.col - best.col) <= 2 && Math.abs(cell.row - best.row) <= 2).slice(0, 9);
  const minX = Math.min(...sameSide.map(cell => cell.x));
  const maxX = Math.max(...sameSide.map(cell => cell.x + cell.w));
  const minY = Math.min(...sameSide.map(cell => cell.y));
  const maxY = Math.max(...sameSide.map(cell => cell.y + cell.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, score: best.score };
}

export async function analyzePosterImage(image, targetWidth = 360) {
  const aspect = image.width / image.height;
  const width = targetWidth;
  const height = Math.max(1, Math.round(width / aspect));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const cells = emptyGrid(width, height);
  const cols = 12;
  const rows = 8;
  let totalLuma = 0;
  let totalEdge = 0;
  let maxEdge = 0;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  let saliencyWeight = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = (y * width + x) * 4;
      const l = luminance(data[i], data[i + 1], data[i + 2]);
      const lx = luminance(data[i + 4], data[i + 5], data[i + 6]);
      const ly = luminance(data[i + width * 4], data[i + width * 4 + 1], data[i + width * 4 + 2]);
      const edge = Math.abs(l - lx) + Math.abs(l - ly);
      const saturation = (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2])) / 255;
      const centerBias = 1 - Math.min(1, Math.hypot(x / width - 0.5, y / height - 0.46) / 0.72);
      const saliency = edge * 0.62 + saturation * 38 + centerBias * 18;
      const cell = cells[Math.min(cols - 1, Math.floor((x / width) * cols)) + Math.min(rows - 1, Math.floor((y / height) * rows)) * cols];
      cell.luma += l;
      cell.edge += edge;
      cell.saliency += saliency;
      cell.samples += 1;
      totalLuma += l;
      totalEdge += edge;
      maxEdge = Math.max(maxEdge, edge);
      if (saliency > 36) {
        const weight = saliency;
        minX = Math.min(minX, x / width);
        minY = Math.min(minY, y / height);
        maxX = Math.max(maxX, x / width);
        maxY = Math.max(maxY, y / height);
        saliencyWeight += weight;
      }
    }
  }

  cells.forEach(cell => {
    const samples = Math.max(1, cell.samples);
    cell.luma /= samples;
    cell.edge /= samples;
    cell.saliency /= samples;
    cell.contrast = cell.edge / Math.max(1, maxEdge);
    cell.negativeScore = clamp((1 - cell.contrast) * 0.48 + (1 - clamp(cell.saliency / 80)) * 0.42 + (cell.luma < 42 ? 0.18 : 0));
  });

  let subjectBox = saliencyWeight ? {
    x: clamp(minX - 0.04),
    y: clamp(minY - 0.04),
    w: clamp(maxX - minX + 0.08, 0.18, 0.88),
    h: clamp(maxY - minY + 0.08, 0.18, 0.92),
  } : { x: 0.5, y: 0.2, w: 0.38, h: 0.62 };

  let face = null;
  if (window.FaceDetector) {
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
      const faces = await detector.detect(canvas);
      if (faces?.[0]?.boundingBox) {
        const box = faces[0].boundingBox;
        face = { x: box.x / width, y: box.y / height, w: box.width / width, h: box.height / height };
        subjectBox = {
          x: clamp(Math.min(subjectBox.x, face.x - face.w * 0.9)),
          y: clamp(Math.min(subjectBox.y, face.y - face.h * 0.35)),
          w: clamp(Math.max(subjectBox.x + subjectBox.w, face.x + face.w * 1.8) - Math.min(subjectBox.x, face.x - face.w * 0.9), 0.18, 0.9),
          h: clamp(Math.max(subjectBox.y + subjectBox.h, face.y + face.h * 3.2) - Math.min(subjectBox.y, face.y - face.h * 0.35), 0.22, 0.92),
        };
      }
    } catch (_) {
      face = null;
    }
  }

  const subjectCenter = { x: subjectBox.x + subjectBox.w / 2, y: subjectBox.y + subjectBox.h / 2 };
  const subjectSide = subjectCenter.x < 0.42 ? "left" : subjectCenter.x > 0.58 ? "right" : "center";
  const preferredTextSide = subjectSide === "left" ? "right" : subjectSide === "right" ? "left" : "auto";
  const negativeSpace = bestNegativeSpace(cells, subjectBox, preferredTextSide);
  const brightness = totalLuma / Math.max(1, (width * height) / 4);
  const backgroundComplexity = clamp(cells.reduce((sum, cell) => sum + cell.contrast, 0) / cells.length);
  const subjectDominance = clamp((subjectBox.w * subjectBox.h) * 1.45);
  const thumbnailImpact = clamp(subjectDominance * 0.36 + backgroundComplexity * 0.22 + negativeSpace.score * 0.32 + (brightness > 55 && brightness < 170 ? 0.1 : 0));

  return {
    width,
    height,
    cells,
    subjectBox,
    subjectCenter,
    subjectSide,
    preferredTextSide,
    negativeSpace,
    brightness: Number(brightness.toFixed(2)),
    backgroundComplexity: Number(backgroundComplexity.toFixed(2)),
    subjectDominance: Number(subjectDominance.toFixed(2)),
    thumbnailImpact: Number(thumbnailImpact.toFixed(2)),
    detections: {
      face,
      eyes: null,
      body: subjectBox,
      torso: subjectBox,
      shoulders: null,
      pose: subjectBox.w > subjectBox.h * 0.72 ? "wide" : "upright",
      gazeDirection: null,
      dominantVisualFocus: subjectCenter,
    },
  };
}

export function scorePosterCandidate({ analysis, typographyScore = 0.7, brandScore = 0.82, layoutScore = 0.7 }) {
  const hierarchy = clamp(analysis.subjectDominance * 0.46 + typographyScore * 0.34 + analysis.negativeSpace.score * 0.2);
  const composition = clamp(layoutScore * 0.42 + analysis.negativeSpace.score * 0.31 + analysis.subjectDominance * 0.27);
  const marketing = clamp(analysis.thumbnailImpact * 0.42 + hierarchy * 0.32 + brandScore * 0.26);
  const total = clamp(hierarchy * 0.26 + composition * 0.26 + analysis.subjectDominance * 0.18 + marketing * 0.2 + brandScore * 0.1);
  return {
    total: Math.round(total * 100),
    hierarchy: Math.round(hierarchy * 100),
    composition: Math.round(composition * 100),
    subjectDominance: Math.round(analysis.subjectDominance * 100),
    negativeSpace: Math.round(analysis.negativeSpace.score * 100),
    typography: Math.round(typographyScore * 100),
    brand: Math.round(brandScore * 100),
    marketing: Math.round(marketing * 100),
  };
}