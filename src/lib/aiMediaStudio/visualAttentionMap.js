const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function luminance(r, g, b) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function skinSignal(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const warm = r > 95 && g > 40 && b > 20 && max - min > 15 && r > g && r > b;
  const soft = r > 70 && g > 45 && b > 35 && r >= g && g >= b * 0.72;
  return warm || soft ? clamp((r - b) / 120 + (r - g) / 180, 0.1, 1) : 0;
}

function cellStats(data, width, height, cellX, cellY, cellW, cellH) {
  let lum = 0;
  let sat = 0;
  let skin = 0;
  let edge = 0;
  let count = 0;
  const startX = Math.floor(cellX * cellW);
  const startY = Math.floor(cellY * cellH);
  const endX = Math.min(width - 1, Math.floor(startX + cellW));
  const endY = Math.min(height - 1, Math.floor(startY + cellH));

  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const l = luminance(r, g, b);
      const right = ((y * width + Math.min(width - 1, x + 2)) * 4);
      const down = ((Math.min(height - 1, y + 2) * width + x) * 4);
      const lr = luminance(data[right], data[right + 1], data[right + 2]);
      const ld = luminance(data[down], data[down + 1], data[down + 2]);
      lum += l;
      sat += (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
      skin += skinSignal(r, g, b);
      edge += Math.abs(l - lr) + Math.abs(l - ld);
      count += 1;
    }
  }

  return {
    luminance: count ? lum / count : 0,
    saturation: count ? sat / count : 0,
    skin: count ? skin / count : 0,
    edge: count ? clamp(edge / count * 7) : 0,
  };
}

function candidateBox(cells, cols, rows) {
  const active = cells.filter(cell => cell.energy > 0.66 || cell.skin > 0.16);
  if (!active.length) return null;
  const minX = Math.min(...active.map(cell => cell.x));
  const maxX = Math.max(...active.map(cell => cell.x + 1));
  const minY = Math.min(...active.map(cell => cell.y));
  const maxY = Math.max(...active.map(cell => cell.y + 1));
  return { x: minX / cols, y: minY / rows, w: (maxX - minX) / cols, h: (maxY - minY) / rows };
}

export function buildVisualAttentionMap(image, options = {}) {
  const cols = options.cols || 32;
  const rows = options.rows || 18;
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(960, image.naturalWidth || image.width);
  canvas.height = Math.round(canvas.width / ((image.naturalWidth || image.width) / (image.naturalHeight || image.height)));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;

  const cells = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const stats = cellStats(pixels, canvas.width, canvas.height, x, y, cellW, cellH);
      const nx = (x + 0.5) / cols;
      const ny = (y + 0.5) / rows;
      const centerBias = 1 - clamp(Math.hypot(nx - 0.5, ny - 0.46) / 0.72);
      const faceEyeProxy = stats.skin * (ny < 0.58 ? 1 : 0.55) + stats.edge * 0.24;
      const bodyProxy = stats.skin * 0.55 + stats.edge * 0.44 + centerBias * 0.18;
      const motionProxy = stats.edge * stats.saturation;
      const texturePenalty = stats.edge > 0.72 && stats.skin < 0.08 ? 0.18 : 0;
      const energy = clamp(faceEyeProxy * 0.34 + bodyProxy * 0.3 + stats.edge * 0.2 + centerBias * 0.16 - texturePenalty);
      cells.push({ x, y, nx, ny, ...stats, centerBias, faceEyeProxy, bodyProxy, motionProxy, energy });
    }
  }

  const sorted = [...cells].sort((a, b) => b.energy - a.energy);
  const heroCandidate = candidateBox(sorted.slice(0, Math.ceil(cells.length * 0.13)), cols, rows);
  const topEnergy = sorted.slice(0, 18).reduce((sum, cell) => sum + cell.energy, 0) / 18;
  const faceEyePriority = sorted.slice(0, 30).reduce((sum, cell) => sum + cell.faceEyeProxy, 0) / 30;
  const bodySilhouettePriority = sorted.slice(0, 30).reduce((sum, cell) => sum + cell.bodyProxy, 0) / 30;
  const backgroundNoise = cells.filter(cell => cell.energy > 0.45 && cell.skin < 0.06).length / cells.length;
  const heroDominanceProxy = clamp(topEnergy * 0.5 + faceEyePriority * 0.26 + bodySilhouettePriority * 0.24 - backgroundNoise * 0.22);

  const scores = {
    visual_attention: Math.round(topEnergy * 100),
    face_eye_priority: Math.round(clamp(faceEyePriority) * 100),
    body_silhouette_priority: Math.round(clamp(bodySilhouettePriority) * 100),
    background_noise: Math.round(clamp(backgroundNoise) * 100),
    hero_dominance_proxy: Math.round(heroDominanceProxy * 100),
  };

  const rejectionReasons = [];
  if (scores.visual_attention < 45) rejectionReasons.push('Weak visual attention concentration');
  if (scores.face_eye_priority < 18) rejectionReasons.push('Face/eye proxy is too weak for confident hero anchoring');
  if (scores.background_noise > 34) rejectionReasons.push('Background visual energy competes with the hero');
  if (!heroCandidate) rejectionReasons.push('No stable hero candidate cluster found');

  return {
    version: 'phase-1-visual-attention-map',
    dimensions: { width: canvas.width, height: canvas.height, cols, rows },
    scores,
    cells,
    top_zones: sorted.slice(0, 12),
    hero_candidate: heroCandidate,
    rejection_reasons: rejectionReasons,
    debug: {
      objective: 'diagnostics only — no rendering changes',
      energy_formula: 'face/eye proxy + body proxy + edge energy + center bias - texture penalty',
      note: 'Phase 1 measures visual energy and saliency; it does not decide typography or key-art treatment.',
    },
  };
}