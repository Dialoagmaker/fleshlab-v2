function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function createCells(cols, rows) {
  return Array.from({ length: cols * rows }, (_, index) => ({
    index,
    col: index % cols,
    row: Math.floor(index / cols),
    x: (index % cols) / cols,
    y: Math.floor(index / cols) / rows,
    w: 1 / cols,
    h: 1 / rows,
    luma: 0,
    edge: 0,
    saliency: 0,
    saturation: 0,
    samples: 0,
  }));
}

function roundBox(box) {
  return {
    x: Number(clamp(box.x).toFixed(3)),
    y: Number(clamp(box.y).toFixed(3)),
    w: Number(clamp(box.w, 0, 1).toFixed(3)),
    h: Number(clamp(box.h, 0, 1).toFixed(3)),
  };
}

function mapValues(cells, key, cols, rows) {
  return { cols, rows, values: cells.map(cell => Number(clamp(cell[key]).toFixed(3))) };
}

function findSafeTypographyZone(cells, subjectBox, preferredSide) {
  const scored = cells.map(cell => {
    const cx = cell.x + cell.w / 2;
    const cy = cell.y + cell.h / 2;
    const insideSubject = cx > subjectBox.x && cx < subjectBox.x + subjectBox.w && cy > subjectBox.y && cy < subjectBox.y + subjectBox.h;
    const sideBias = preferredSide === "left" ? 1 - cx : preferredSide === "right" ? cx : 0.5 + Math.abs(cx - 0.5);
    return { ...cell, score: cell.negativeScore + sideBias * 0.16 - (insideSubject ? 0.8 : 0) };
  }).sort((a, b) => b.score - a.score);
  const best = scored[0] || { col: 1, row: 2, x: 0.06, y: 0.3, w: 0.32, h: 0.36, score: 0.3 };
  const cluster = scored.filter(cell => Math.abs(cell.col - best.col) <= 2 && Math.abs(cell.row - best.row) <= 2).slice(0, 9);
  return {
    x: Math.min(...cluster.map(cell => cell.x)),
    y: Math.min(...cluster.map(cell => cell.y)),
    w: Math.max(...cluster.map(cell => cell.x + cell.w)) - Math.min(...cluster.map(cell => cell.x)),
    h: Math.max(...cluster.map(cell => cell.y + cell.h)) - Math.min(...cluster.map(cell => cell.y)),
    score: clamp(best.score),
  };
}

function deriveTorsoBox(subjectBox, faceBox) {
  if (faceBox) {
    return roundBox({
      x: subjectBox.x + subjectBox.w * 0.18,
      y: Math.min(1, faceBox.y + faceBox.h * 0.9),
      w: subjectBox.w * 0.64,
      h: subjectBox.h * 0.48,
    });
  }
  return roundBox({ x: subjectBox.x + subjectBox.w * 0.16, y: subjectBox.y + subjectBox.h * 0.18, w: subjectBox.w * 0.68, h: subjectBox.h * 0.5 });
}

function selectiveCurve(value) {
  return clamp((value - 0.25) / 0.56);
}

export function analyzeVisionFromImageData(imageData, options = {}) {
  const cols = options.cols || 12;
  const rows = options.rows || 8;
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const cells = createCells(cols, rows);
  let totalLuma = 0;
  let maxEdge = 0;
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
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
      cell.saturation += saturation;
      cell.samples += 1;
      totalLuma += l;
      maxEdge = Math.max(maxEdge, edge);
      if (saliency > 36 && l > 22 && l < 238) {
        minX = Math.min(minX, x / width);
        minY = Math.min(minY, y / height);
        maxX = Math.max(maxX, x / width);
        maxY = Math.max(maxY, y / height);
        saliencyWeight += saliency;
      }
    }
  }

  cells.forEach(cell => {
    const samples = Math.max(1, cell.samples);
    cell.luma /= samples;
    cell.edge /= samples;
    cell.saliency /= samples;
    cell.saturation /= samples;
    cell.contrast = cell.edge / Math.max(1, maxEdge);
    cell.focusScore = clamp(cell.saliency / 80);
    cell.clutterScore = clamp(cell.contrast * 0.56 + cell.focusScore * 0.44);
    cell.negativeScore = clamp((1 - cell.contrast) * 0.48 + (1 - cell.focusScore) * 0.42 + (cell.luma < 42 ? 0.18 : 0));
    cell.backgroundScore = clamp((1 - cell.focusScore) * 0.52 + (1 - cell.contrast) * 0.48);
  });

  let bodyBox = saliencyWeight ? roundBox({ x: minX - 0.04, y: minY - 0.04, w: maxX - minX + 0.08, h: maxY - minY + 0.08 }) : roundBox({ x: 0.5, y: 0.2, w: 0.38, h: 0.62 });
  const faceBox = options.faceBox ? roundBox(options.faceBox) : null;
  if (faceBox) {
    bodyBox = roundBox({
      x: Math.min(bodyBox.x, faceBox.x - faceBox.w * 0.9),
      y: Math.min(bodyBox.y, faceBox.y - faceBox.h * 0.35),
      w: Math.max(bodyBox.x + bodyBox.w, faceBox.x + faceBox.w * 1.8) - Math.min(bodyBox.x, faceBox.x - faceBox.w * 0.9),
      h: Math.max(bodyBox.y + bodyBox.h, faceBox.y + faceBox.h * 3.2) - Math.min(bodyBox.y, faceBox.y - faceBox.h * 0.35),
    });
  }

  const center = { x: bodyBox.x + bodyBox.w / 2, y: bodyBox.y + bodyBox.h / 2 };
  const side = center.x < 0.42 ? "left" : center.x > 0.58 ? "right" : "center";
  const preferredTextSide = side === "left" ? "right" : side === "right" ? "left" : "auto";
  const safeTypographyZone = findSafeTypographyZone(cells, bodyBox, preferredTextSide);
  const brightness = totalLuma / Math.max(1, (width * height) / 4);
  const backgroundComplexity = clamp(cells.reduce((sum, cell) => sum + cell.clutterScore, 0) / cells.length);
  const dominance = clamp(bodyBox.w * bodyBox.h * 1.45);
  const edgeInset = Math.min(bodyBox.x, bodyBox.y, 1 - (bodyBox.x + bodyBox.w), 1 - (bodyBox.y + bodyBox.h));
  const edgeTension = clamp((0.11 - edgeInset) / 0.11);
  const destructiveCropRisk = clamp((0.12 - dominance) / 0.12) * clamp((0.02 - edgeInset) / 0.02);
  const lightingScore = clamp(1 - Math.abs(brightness - 126) / 126);
  const focusStrength = clamp(cells.reduce((sum, cell) => sum + cell.focusScore, 0) / cells.length);
  const averageSaturation = clamp(cells.reduce((sum, cell) => sum + cell.saturation, 0) / cells.length);
  const closeUpStrength = clamp((dominance - 0.2) / 0.42);
  const asymmetry = clamp(Math.abs(center.x - 0.5) * 1.9 + Math.abs(center.y - 0.48) * 0.9);
  const separationScore = clamp((1 - backgroundComplexity) * 0.26 + safeTypographyZone.score * 0.24 + dominance * 0.26 + focusStrength * 0.24);
  const sceneReadability = clamp(dominance * 0.24 + separationScore * 0.28 + lightingScore * 0.16 + focusStrength * 0.18 + (faceBox ? 0.14 : 0.05) - destructiveCropRisk * 0.42);
  const visualCuriosity = clamp(edgeTension * 0.18 + closeUpStrength * 0.2 + focusStrength * 0.22 + asymmetry * 0.14 + averageSaturation * 0.1 + safeTypographyZone.score * 0.08 + dominance * 0.08);
  const intimacy = clamp(closeUpStrength * 0.38 + (faceBox ? 0.24 : 0.08) + dominance * 0.22 + lightingScore * 0.16);
  const interactionStrength = clamp(focusStrength * 0.34 + edgeTension * 0.22 + asymmetry * 0.18 + separationScore * 0.18 + averageSaturation * 0.08);
  const bodyLanguage = clamp(dominance * 0.24 + edgeTension * 0.22 + asymmetry * 0.2 + focusStrength * 0.2 + separationScore * 0.14);
  const emotionalPresence = clamp((faceBox ? 0.36 : 0.12) + intimacy * 0.28 + lightingScore * 0.16 + focusStrength * 0.2);
  const storyContinuation = clamp(edgeTension * 0.28 + asymmetry * 0.26 + interactionStrength * 0.24 + visualCuriosity * 0.22);
  const thumbnailImpact = clamp(visualCuriosity * 0.24 + sceneReadability * 0.22 + bodyLanguage * 0.18 + intimacy * 0.14 + interactionStrength * 0.14 + storyContinuation * 0.08);
  const clickPotentialRaw = clamp(visualCuriosity * 0.23 + sceneReadability * 0.2 + interactionStrength * 0.16 + bodyLanguage * 0.14 + emotionalPresence * 0.12 + thumbnailImpact * 0.1 + storyContinuation * 0.05 - destructiveCropRisk * 0.24);
  const storyScore = clamp(Math.pow(selectiveCurve(clickPotentialRaw), 0.72));
  const imageQualityScore = clamp(lightingScore * 0.24 + focusStrength * 0.24 + sceneReadability * 0.22 + separationScore * 0.18 + (1 - destructiveCropRisk) * 0.12);

  return {
    source: options.source || "heuristic",
    dimensions: { width, height },
    capabilities: { faceDetection: Boolean(options.faceDetectionSupported) },
    subjectCount: saliencyWeight ? 1 : 0,
    primarySubject: { box: bodyBox, visualFocus: center, side, dominance, visibilityScore: sceneReadability, cropRisk: destructiveCropRisk, edgeTension, separationScore, faceVisible: Boolean(faceBox) },
    faceBox: faceBox || undefined,
    bodyBox,
    torsoBox: deriveTorsoBox(bodyBox, faceBox),
    safeTypographyZone,
    backgroundMask: mapValues(cells, "backgroundScore", cols, rows),
    negativeSpaceMask: mapValues(cells, "negativeScore", cols, rows),
    clutterMap: mapValues(cells, "clutterScore", cols, rows),
    visualFocusMap: mapValues(cells, "focusScore", cols, rows),
    cells,
    brightness: Number(brightness.toFixed(2)),
    backgroundComplexity: Number(backgroundComplexity.toFixed(2)),
    visualCuriosity: Number(visualCuriosity.toFixed(2)),
    sceneReadability: Number(sceneReadability.toFixed(2)),
    interactionStrength: Number(interactionStrength.toFixed(2)),
    bodyLanguage: Number(bodyLanguage.toFixed(2)),
    emotionalPresence: Number(emotionalPresence.toFixed(2)),
    storyContinuation: Number(storyContinuation.toFixed(2)),
    clickPotential: Number(clickPotentialRaw.toFixed(2)),
    thumbnailImpact: Number(thumbnailImpact.toFixed(2)),
    storyScore: Number(storyScore.toFixed(2)),
    imageQualityScore: Number(imageQualityScore.toFixed(2)),
  };
}