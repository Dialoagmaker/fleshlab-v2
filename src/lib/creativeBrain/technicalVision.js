import { measured, confidence } from "./field";

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const round = (v, d = 3) => Number(Number(v || 0).toFixed(d));
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const sat = (r, g, b) => { const max = Math.max(r, g, b), min = Math.min(r, g, b); return max ? (max - min) / max : 0; };
const skin = (r, g, b) => r > 85 && g > 35 && b > 18 && r >= g && r > b ? clamp((r - b) / 140 + (r - g) / 220) : 0;
const color = (r, g, b) => `#${[r,g,b].map(v => Math.min(255, Math.round(v / 32) * 32).toString(16).padStart(2, "0")).join("")}`;

async function detectFaces(bitmap) {
  if (!("FaceDetector" in window)) return { available: false, boxes: [] };
  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 12 });
    const faces = await detector.detect(bitmap);
    return { available: true, boxes: faces.map(face => ({ x: round(face.boundingBox.x / bitmap.width), y: round(face.boundingBox.y / bitmap.height), width: round(face.boundingBox.width / bitmap.width), height: round(face.boundingBox.height / bitmap.height) })) };
  } catch (_) { return { available: false, boxes: [] }; }
}

function sampleGrid(data, width, height, cols = 12, rows = 8) {
  const colors = new Map();
  let l = 0, s = 0, e = 0, under = 0, over = 0, n = 0;
  const cells = [];
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    const i = (y * width + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
    const current = lum(r, g, b), right = (y * width + Math.min(width - 1, x + 2)) * 4, down = (Math.min(height - 1, y + 2) * width + x) * 4;
    const edge = Math.abs(current - lum(data[right], data[right + 1], data[right + 2])) + Math.abs(current - lum(data[down], data[down + 1], data[down + 2]));
    l += current; s += sat(r, g, b); e += edge; n += 1; if (current < 0.12) under += 1; if (current > 0.92) over += 1;
    colors.set(color(r, g, b), (colors.get(color(r, g, b)) || 0) + 1);
  }
  const cw = width / cols, ch = height / rows;
  for (let cy = 0; cy < rows; cy += 1) for (let cx = 0; cx < cols; cx += 1) {
    let cl = 0, cs = 0, ce = 0, ck = 0, cn = 0;
    for (let y = Math.floor(cy * ch); y < Math.min(height - 1, Math.floor((cy + 1) * ch)); y += 4) for (let x = Math.floor(cx * cw); x < Math.min(width - 1, Math.floor((cx + 1) * cw)); x += 4) {
      const i = (y * width + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2], current = lum(r, g, b), right = (y * width + Math.min(width - 1, x + 4)) * 4;
      cl += current; cs += sat(r, g, b); ck += skin(r, g, b); ce += Math.abs(current - lum(data[right], data[right + 1], data[right + 2])); cn += 1;
    }
    const center = 1 - clamp(Math.hypot((cx + .5) / cols - .5, (cy + .5) / rows - .48) / .72);
    const attention = clamp((ce / Math.max(1, cn)) * 5 + (ck / Math.max(1, cn)) * .42 + (cs / Math.max(1, cn)) * .22 + center * .16);
    cells.push({ zone: `cell_${cx}_${cy}`, box: { x: round(cx / cols), y: round(cy / rows), width: round(1 / cols), height: round(1 / rows) }, attention: round(attention), luminance: round(cl / Math.max(1, cn)), edge: round(ce / Math.max(1, cn)), skin_signal: round(ck / Math.max(1, cn)) });
  }
  return { global: { luminance: l / n, saturation: s / n, sharpness: clamp((e / n) * 7), under: under / n, over: over / n }, cells, colors: Array.from(colors.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([hex, hits]) => ({ hex, share: round(hits / n) })) };
}

export async function analyzeTechnicalVision(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 720 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const sampled = sampleGrid(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
  const faces = await detectFaces(bitmap);
  const attention = [...sampled.cells].sort((a,b)=>b.attention-a.attention);
  const active = attention.filter(c => c.attention > .55 || c.skin_signal > .12).slice(0,14);
  const subjectBox = active.length ? { x: round(Math.min(...active.map(c=>c.box.x))), y: round(Math.min(...active.map(c=>c.box.y))), width: round(Math.max(...active.map(c=>c.box.x+c.box.width)) - Math.min(...active.map(c=>c.box.x))), height: round(Math.max(...active.map(c=>c.box.y+c.box.height)) - Math.min(...active.map(c=>c.box.y))) } : null;
  bitmap.close?.();

  return {
    module: "LOCAL_TECHNICAL_VISION",
    output_type: "TechnicalImageFacts",
    schema_version: "2.0",
    width: measured(canvas.width), height: measured(canvas.height), original_width: measured(Math.round(canvas.width / scale)), original_height: measured(Math.round(canvas.height / scale)),
    aspect_ratio: measured(round(canvas.width / canvas.height, 4)), file_size_bytes: measured(file.size), mime_type: measured(file.type || "unknown"),
    sharpness: measured(round(sampled.global.sharpness), .88), blur: measured(round(1 - sampled.global.sharpness), .82), exposure: measured(sampled.global.luminance < .24 ? "underexposed" : sampled.global.luminance > .78 ? "overexposed" : "usable", .86),
    contrast: measured(round(sampled.global.sharpness), .76), dominant_colors: measured(sampled.colors, .8), luminance_distribution: measured({ average: round(sampled.global.luminance), underexposed_share: round(sampled.global.under), overexposed_share: round(sampled.global.over) }, .86),
    approximate_subject_occupancy: measured(subjectBox ? round(subjectBox.width * subjectBox.height) : 0, subjectBox ? .58 : .22), approximate_subject_box: measured(subjectBox, subjectBox ? .58 : .2),
    approximate_negative_space: measured(sampled.cells.filter(c => c.attention < .18).slice(0,8).map(c => c.box), .62), optional_face_bounding_boxes: measured({ detector_available: faces.available, boxes: faces.boxes }, faces.available ? .78 : .1),
    crop_safety: measured({ safe_typography_zones: sampled.cells.filter(c => c.attention < .22 && c.edge < .045).slice(0,8).map(c => c.box), attention_zones: attention.slice(0,8).map(c => ({ ...c.box, score: c.attention })) }, .62),
    provenance: { source: "local_measurement", dependencies: ["createImageBitmap", "canvas.getImageData", "optional browser FaceDetector"] }
  };
}