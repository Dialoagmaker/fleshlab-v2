const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const round = (value, digits = 3) => Number(Number(value || 0).toFixed(digits));

function luminance(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
function saturation(r, g, b) { const max = Math.max(r, g, b), min = Math.min(r, g, b); return max ? (max - min) / max : 0; }
function skinSignal(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const warm = r > 85 && g > 35 && b > 18 && max - min > 12 && r >= g && r > b;
  return warm ? clamp((r - b) / 140 + (r - g) / 210) : 0;
}
function quantizedColor(r, g, b) { return `#${[r, g, b].map(v => Math.round(v / 32) * 32).map(v => Math.min(255, v).toString(16).padStart(2, "0")).join("")}`; }

async function detectFaces(bitmap, width, height) {
  if (!("FaceDetector" in window)) return { available: false, faces: [] };
  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 12 });
    const faces = await detector.detect(bitmap);
    return { available: true, faces: faces.map(face => ({
      x: round(face.boundingBox.x / width), y: round(face.boundingBox.y / height),
      width: round(face.boundingBox.width / width), height: round(face.boundingBox.height / height),
    })) };
  } catch (_) {
    return { available: false, faces: [] };
  }
}

function gridAnalysis(data, width, height, cols = 12, rows = 8) {
  const cells = [];
  const colorCounts = new Map();
  let lumaSum = 0, satSum = 0, edgeSum = 0, under = 0, over = 0, count = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const l = luminance(r, g, b);
      const right = (y * width + Math.min(width - 1, x + 2)) * 4;
      const down = (Math.min(height - 1, y + 2) * width + x) * 4;
      const edge = Math.abs(l - luminance(data[right], data[right + 1], data[right + 2])) + Math.abs(l - luminance(data[down], data[down + 1], data[down + 2]));
      lumaSum += l; satSum += saturation(r, g, b); edgeSum += edge;
      if (l < 0.12) under += 1;
      if (l > 0.92) over += 1;
      colorCounts.set(quantizedColor(r, g, b), (colorCounts.get(quantizedColor(r, g, b)) || 0) + 1);
      count += 1;
    }
  }

  const cellW = width / cols, cellH = height / rows;
  for (let cy = 0; cy < rows; cy += 1) {
    for (let cx = 0; cx < cols; cx += 1) {
      let lum = 0, sat = 0, edge = 0, skin = 0, n = 0;
      for (let y = Math.floor(cy * cellH); y < Math.min(height - 1, Math.floor((cy + 1) * cellH)); y += 3) {
        for (let x = Math.floor(cx * cellW); x < Math.min(width - 1, Math.floor((cx + 1) * cellW)); x += 3) {
          const i = (y * width + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const l = luminance(r, g, b);
          const right = (y * width + Math.min(width - 1, x + 3)) * 4;
          lum += l; sat += saturation(r, g, b); skin += skinSignal(r, g, b);
          edge += Math.abs(l - luminance(data[right], data[right + 1], data[right + 2]));
          n += 1;
        }
      }
      const nx = (cx + 0.5) / cols, ny = (cy + 0.5) / rows;
      const center = 1 - clamp(Math.hypot(nx - 0.5, ny - 0.48) / 0.72);
      const score = clamp((edge / Math.max(1, n)) * 4.8 + (skin / Math.max(1, n)) * 0.42 + (sat / Math.max(1, n)) * 0.24 + center * 0.18);
      cells.push({ zone: `cell_${cx}_${cy}`, x: round(cx / cols), y: round(cy / rows), width: round(1 / cols), height: round(1 / rows), attention_strength: round(score), luminance: round(lum / Math.max(1, n)), saturation: round(sat / Math.max(1, n)), skin_signal: round(skin / Math.max(1, n)), edge_strength: round(edge / Math.max(1, n)) });
    }
  }

  return {
    cells,
    global: { average_luminance: round(lumaSum / count), average_saturation: round(satSum / count), sharpness_score: round(clamp((edgeSum / count) * 7) * 100, 1), underexposed_percent: round((under / count) * 100, 1), overexposed_percent: round((over / count) * 100, 1) },
    dominant_colors: Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([hex, hits]) => ({ hex, share: round(hits / count) }))
  };
}

function subjectBoxFromAttention(cells) {
  const active = cells.filter(cell => cell.attention_strength > 0.55 || cell.skin_signal > 0.12).sort((a, b) => b.attention_strength - a.attention_strength).slice(0, 14);
  if (!active.length) return null;
  const minX = Math.min(...active.map(c => c.x));
  const minY = Math.min(...active.map(c => c.y));
  const maxX = Math.max(...active.map(c => c.x + c.width));
  const maxY = Math.max(...active.map(c => c.y + c.height));
  return { x: round(minX), y: round(minY), width: round(maxX - minX), height: round(maxY - minY), basis: "attention_skin_edge_cluster" };
}

export async function analyzeVision(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 720 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const grid = gridAnalysis(pixels, canvas.width, canvas.height);
  const faces = await detectFaces(bitmap, bitmap.width, bitmap.height);
  const attention = [...grid.cells].sort((a, b) => b.attention_strength - a.attention_strength);
  const safeText = [...grid.cells].filter(c => c.attention_strength < 0.22 && c.edge_strength < 0.045).slice(0, 8);
  const negative = [...grid.cells].filter(c => c.attention_strength < 0.18).slice(0, 8);
  const subject = subjectBoxFromAttention(grid.cells);
  const leftLight = grid.cells.filter(c => c.x < 0.5).reduce((s, c) => s + c.luminance, 0) / 48;
  const rightLight = grid.cells.filter(c => c.x >= 0.5).reduce((s, c) => s + c.luminance, 0) / 48;

  const qualityScore = Math.round(clamp((grid.global.sharpness_score / 100) * 0.34 + (1 - Math.abs(grid.global.average_luminance - 0.48)) * 0.32 + grid.global.average_saturation * 0.18 + (subject ? 0.16 : 0.04)) * 100);
  bitmap.close?.();

  return {
    module: "VISION_ANALYSIS",
    output_type: "ImageFacts",
    schema_version: "1.0",
    source: { file_name: file.name, mime_type: file.type || "unknown", file_size_bytes: file.size, analyzed_at: new Date().toISOString() },
    dimensions: { width: canvas.width, height: canvas.height, original_width: Math.round(canvas.width / scale), original_height: Math.round(canvas.height / scale), orientation: canvas.width > canvas.height ? "landscape" : canvas.width < canvas.height ? "portrait" : "square", aspect_ratio: round(canvas.width / canvas.height, 4) },
    visible_people: { count: faces.available ? faces.faces.length : null, method: faces.available ? "browser_face_detector" : "not_available_locally", limitation: faces.available ? "faces only; bodies without visible faces may be missed" : "local browser has no reliable people detector" },
    face_visibility: { detector_available: faces.available, faces: faces.faces, clear_face_count: faces.faces.filter(f => f.width * f.height > 0.015 && qualityScore > 45).length },
    subject_position: subject || { status: "not_detected", reason: "no stable attention or skin/edge cluster found" },
    pose: { status: "not_implemented_locally", observable_proxy: subject ? "subject region estimated from attention cluster" : "no subject proxy" },
    expression: { status: "not_implemented_locally" },
    gaze_direction: { status: "not_implemented_locally" },
    clothing_or_nudity_state: { status: "not_implemented_locally", reason: "no local clothing or nudity classifier is used" },
    camera_and_crop: { crop: subject ? "subject-driven crop possible" : "no subject crop", camera_angle: "not_implemented_locally" },
    lighting: { dominant_direction: leftLight > rightLight + 0.04 ? "left" : rightLight > leftLight + 0.04 ? "right" : "balanced", average_luminance: grid.global.average_luminance, underexposed_percent: grid.global.underexposed_percent, overexposed_percent: grid.global.overexposed_percent },
    background_environment: { status: "not_semantically_identified_locally", visual_density: round(attention.filter(c => c.attention_strength > 0.4 && c.skin_signal < 0.05).length / attention.length), reason: "local module measures density/color/depth proxies, not room semantics" },
    depth: { estimate: subject && grid.global.sharpness_score > 35 ? "moderate" : "uncertain", basis: "subject attention cluster plus edge strength" },
    dominant_colors: grid.dominant_colors,
    image_quality: { score: qualityScore, sharpness_score: grid.global.sharpness_score, exposure: grid.global.average_luminance < 0.24 ? "very_dark" : grid.global.average_luminance > 0.78 ? "very_bright" : "usable", contrast_proxy: round(grid.global.sharpness_score / 100), limitations: "heuristic pixel metrics only" },
    attention_map: attention.slice(0, 8),
    negative_space: negative,
    safe_typography_zones: safeText.map(z => ({ ...z, recommended_text_role: z.y < 0.35 ? "headline_or_logo" : "subtitle_or_supporting_text", safety_score: round((1 - z.attention_strength) * 100, 1) })),
    uncertainties: [
      ...(!faces.available ? ["face and people count depend on unavailable browser FaceDetector"] : []),
      "pose, expression, gaze, clothing, nudity, objects, and environment semantics are not locally classified",
      "attention and typography zones are heuristic pixel estimates"
    ]
  };
}