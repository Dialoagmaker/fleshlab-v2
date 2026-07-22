import { FLESHLAB_BRAND_IDENTITY } from "@/lib/aiMediaStudio/brandIdentityEngine";
import { createCompositionPlan } from "@/lib/heroPhotography/compositionEngine";
import { createLayerPlan } from "@/lib/heroPhotography/layerCompositionEngine";
import { createKeyArtBrief, createLayoutSketch } from "@/lib/heroPhotography/keyArtWorkflow";

const RED = "#cf102d";
const WHITE = "#f4f1ea";
const BLACK = "#020202";

let logoPromise;
function loadLogo() {
  if (!logoPromise) {
    logoPromise = new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = FLESHLAB_BRAND_IDENTITY.logoUrl;
    });
  }
  return logoPromise;
}

function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function compact(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function font(size, family = "Bebas Neue", weight = 900) { return `${weight} ${Math.round(size)}px "${family}", Impact, Arial Black, sans-serif`; }
function rgba(rgb, alpha) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`; }
function mixRgb(a, b, weight = 0.5) { return a.map((value, index) => Math.round(value * (1 - weight) + b[index] * weight)); }

function extractImagePalette(image) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, 48, 48);
    const data = ctx.getImageData(0, 0, 48, 48).data;
    let r = 0, g = 0, b = 0, count = 0;
    let hi = [244, 241, 234], lo = [12, 4, 6], hiScore = -1, loScore = 999;
    for (let i = 0; i < data.length; i += 16) {
      const px = [data[i], data[i + 1], data[i + 2]];
      const luma = px[0] * 0.2126 + px[1] * 0.7152 + px[2] * 0.0722;
      r += px[0]; g += px[1]; b += px[2]; count += 1;
      if (luma > hiScore) { hiScore = luma; hi = px; }
      if (luma < loScore) { loScore = luma; lo = px; }
    }
    const avg = [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
    const warm = avg[0] + avg[1] * 0.45 > avg[2] * 1.55;
    return {
      average: avg,
      highlight: mixRgb(hi, WHITE === "#f4f1ea" ? [244, 241, 234] : [255, 255, 255], 0.25),
      shadow: mixRgb(lo, [0, 0, 0], 0.58),
      ambient: mixRgb(avg, warm ? [42, 12, 8] : [8, 18, 28], 0.52),
      warm
    };
  } catch {
    return { average: [32, 12, 16], highlight: [244, 241, 234], shadow: [4, 2, 3], ambient: [24, 6, 10], warm: true };
  }
}

function applyPaletteToDirection(direction, palette) {
  const imageAccent = palette.warm ? mixRgb([207, 16, 45], palette.average, 0.18) : mixRgb([207, 16, 45], [40, 72, 88], 0.12);
  return { ...direction, palette, accent: `rgb(${imageAccent[0]},${imageAccent[1]},${imageAccent[2]})`, shadowRgb: palette.shadow, ambientRgb: palette.ambient, highlightRgb: palette.highlight };
}

function chooseDirection(campaign = {}, analysis = {}) {
  const text = `${campaign.campaignTitle || ""} ${campaign.collection || ""} ${campaign.releaseName || ""} ${campaign.campaignLabel || ""}`.toLowerCase();
  const subjectRight = (analysis.subjectCenter?.x ?? 0.55) >= 0.5;
  if (/bathroom|shower|soap|steam|hole|ass/.test(text)) return { key: "bathroom_noir", accent: RED, texture: "steam tile fracture", titleTone: "hard white cinema title", heroSide: subjectRight ? "right" : "left", split: 0.55 };
  if (/beach|summer|pool|island|ocean/.test(text)) return { key: "sun_escape", accent: "#ff3348", texture: "heated horizon scratches", titleTone: "open-air cinema title", heroSide: subjectRight ? "right" : "left", split: 0.53 };
  if (/gym|fitness|locker|workout/.test(text)) return { key: "kinetic_body", accent: "#ff2433", texture: "motion ticks", titleTone: "athletic block title", heroSide: subjectRight ? "right" : "left", split: 0.52 };
  if (/behind|bts|raw|documentary/.test(text)) return { key: "raw_access", accent: "#f05b2a", texture: "contact-sheet grain", titleTone: "documentary impact title", heroSide: subjectRight ? "right" : "left", split: 0.54 };
  return { key: "premium_release", accent: RED, texture: "cinematic red fracture", titleTone: "premium title mass", heroSide: subjectRight ? "right" : "left", split: 0.54 };
}

function coverImageRect(ctx, image, box, focus, zoom = 1.08) {
  const scale = Math.max(box.w / image.width, box.h / image.height) * clamp(zoom, 0.96, 1.42);
  const sw = box.w / scale;
  const sh = box.h / scale;
  const sx = clamp(image.width * focus.x - sw / 2, 0, Math.max(0, image.width - sw));
  const sy = clamp(image.height * focus.y - sh * 0.48, 0, Math.max(0, image.height - sh));
  ctx.drawImage(image, sx, sy, sw, sh, box.x, box.y, box.w, box.h);
}

function getZones(width, height, direction) {
  const portrait = height > width * 1.15;
  const banner = width / height > 2.1;
  if (portrait) {
    const photoH = height * 0.5;
    return {
      mode: "vertical-split",
      photo: { x: 0, y: 0, w: width, h: photoH + height * 0.05 },
      graphic: { x: 0, y: photoH * 0.82, w: width, h: height - photoH * 0.82 },
      title: { x: width * 0.08, y: height * 0.55, w: width * 0.84, h: height * 0.25, align: "left" },
      meta: { x: width * 0.08, y: height * 0.81, w: width * 0.84, h: height * 0.12 },
      logo: { x: width * 0.07, y: height * 0.045, w: width * 0.26 },
      split: photoH / height,
    };
  }
  const splitX = width * (banner ? 0.5 : direction.split);
  const titleLeft = direction.heroSide === "right";
  const titleX = titleLeft ? width * 0.055 : splitX + width * 0.065;
  const titleW = titleLeft ? splitX * 0.84 : width - titleX - width * 0.055;
  return {
    mode: "side-split",
    photo: titleLeft ? { x: splitX - width * 0.05, y: 0, w: width - splitX + width * 0.05, h: height } : { x: 0, y: 0, w: splitX + width * 0.05, h: height },
    graphic: titleLeft ? { x: 0, y: 0, w: splitX + width * 0.08, h: height } : { x: splitX - width * 0.08, y: 0, w: width - splitX + width * 0.08, h: height },
    title: { x: titleX, y: height * (banner ? 0.18 : 0.24), w: titleW, h: height * (banner ? 0.52 : 0.44), align: "left" },
    meta: { x: titleX, y: height * 0.74, w: titleW, h: height * 0.14 },
    logo: { x: titleX, y: height * 0.055, w: Math.min(titleW * 0.44, width * 0.18) },
    split: splitX / width,
  };
}

function drawBackgroundAtmosphere(ctx, image, width, height, zones, direction, analysis) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.filter = "blur(28px) brightness(28%) contrast(150%) saturate(116%)";
  coverImageRect(ctx, image, { x: 0, y: 0, w: width, h: height }, analysis.subjectCenter || { x: 0.5, y: 0.48 }, 1.18);
  ctx.restore();
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, rgba(direction.shadowRgb || [0, 0, 0], 0.92));
  grad.addColorStop(0.42, rgba(direction.ambientRgb || [18, 4, 8], 0.76));
  grad.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(zones.graphic.x + zones.graphic.w * 0.48, height * 0.43, 0, zones.graphic.x + zones.graphic.w * 0.48, height * 0.43, Math.max(width, height) * 0.48);
  glow.addColorStop(0, rgba(direction.ambientRgb || [207,16,45], 0.34));
  glow.addColorStop(0.48, rgba(direction.ambientRgb || [207,16,45], 0.1));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawHeroPhotography(ctx, image, width, height, zones, direction, analysis) {
  ctx.save();
  ctx.beginPath();
  if (zones.mode === "side-split") {
    const p = zones.photo;
    const slant = width * 0.08;
    if (direction.heroSide === "right") {
      ctx.moveTo(p.x + slant, 0); ctx.lineTo(width, 0); ctx.lineTo(width, height); ctx.lineTo(p.x - slant, height);
    } else {
      ctx.moveTo(0, 0); ctx.lineTo(p.x + p.w + slant, 0); ctx.lineTo(p.x + p.w - slant, height); ctx.lineTo(0, height);
    }
    ctx.closePath();
  } else {
    ctx.rect(zones.photo.x, zones.photo.y, zones.photo.w, zones.photo.h);
  }
  ctx.clip();
  ctx.filter = "brightness(88%) contrast(148%) saturate(112%)";
  coverImageRect(ctx, image, zones.photo, analysis.subjectCenter || { x: 0.52, y: 0.48 }, zones.mode === "vertical-split" ? 1.06 : 1.15);
  ctx.restore();

  const edge = ctx.createLinearGradient(zones.photo.x, 0, zones.photo.x + zones.photo.w, 0);
  if (direction.heroSide === "right") {
    edge.addColorStop(0, "rgba(0,0,0,0.96)"); edge.addColorStop(0.1, "rgba(0,0,0,0.68)"); edge.addColorStop(0.28, "rgba(0,0,0,0.22)"); edge.addColorStop(1, "rgba(0,0,0,0.1)");
  } else {
    edge.addColorStop(0, "rgba(0,0,0,0.1)"); edge.addColorStop(0.72, "rgba(0,0,0,0.22)"); edge.addColorStop(0.9, "rgba(0,0,0,0.68)"); edge.addColorStop(1, "rgba(0,0,0,0.96)");
  }
  ctx.fillStyle = edge;
  ctx.fillRect(zones.photo.x, zones.photo.y, zones.photo.w, zones.photo.h);
}

function drawSubjectDepth(ctx, image, width, height, zones, direction, analysis) {
  if (zones.mode !== "side-split") return;
  const p = zones.photo;
  const focusX = p.x + p.w * 0.52;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(focusX, height * 0.48, p.w * 0.3, height * 0.52, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = width * 0.04;
  ctx.filter = "brightness(104%) contrast(136%) saturate(110%)";
  coverImageRect(ctx, image, p, analysis.subjectCenter || { x: 0.52, y: 0.48 }, 1.15);
  ctx.restore();
}

function drawPhotoBackgroundFusion(ctx, image, width, height, zones, direction, analysis) {
  const g = zones.graphic;
  const p = zones.photo;
  const seamX = zones.mode === "vertical-split" ? 0 : direction.heroSide === "right" ? p.x + width * 0.035 : p.x + p.w - width * 0.035;
  ctx.save();
  ctx.beginPath();
  ctx.rect(g.x, g.y, g.w, g.h);
  ctx.clip();
  ctx.globalAlpha = 0.34;
  ctx.filter = "blur(14px) brightness(44%) contrast(155%) saturate(126%)";
  coverImageRect(ctx, image, { x: 0, y: 0, w: width, h: height }, analysis.subjectCenter || { x: 0.5, y: 0.48 }, 1.2);
  ctx.restore();

  ctx.save();
  const seam = zones.mode === "vertical-split"
    ? ctx.createLinearGradient(0, zones.graphic.y - height * 0.08, 0, zones.graphic.y + height * 0.18)
    : ctx.createLinearGradient(seamX - width * 0.16, 0, seamX + width * 0.16, 0);
  if (zones.mode === "vertical-split") {
    seam.addColorStop(0, "rgba(0,0,0,0)"); seam.addColorStop(0.34, "rgba(0,0,0,0.48)"); seam.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = seam;
    ctx.fillRect(0, zones.graphic.y - height * 0.08, width, height * 0.28);
  } else if (direction.heroSide === "right") {
    seam.addColorStop(0, "rgba(0,0,0,0.9)"); seam.addColorStop(0.46, "rgba(0,0,0,0.48)"); seam.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = seam;
    ctx.fillRect(seamX - width * 0.16, 0, width * 0.32, height);
  } else {
    seam.addColorStop(0, "rgba(0,0,0,0)"); seam.addColorStop(0.54, "rgba(0,0,0,0.48)"); seam.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = seam;
    ctx.fillRect(seamX - width * 0.16, 0, width * 0.32, height);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = rgba(direction.ambientRgb || [207,16,45], 0.58);
  ctx.lineWidth = Math.max(5, width * 0.006);
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    const y = height * (i % 2 ? 0.14 : 0.84) + i * height * 0.018;
    const startX = zones.mode === "vertical-split" ? width * 0.06 : seamX - width * 0.42;
    ctx.moveTo(startX, y);
    ctx.bezierCurveTo(startX + width * 0.24, y - height * 0.06, startX + width * 0.5, y + height * 0.04, startX + width * 0.82, y - height * 0.02);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStructuralGraphics(ctx, width, height, zones, direction) {
  const g = zones.graphic;
  ctx.save();
  const field = ctx.createLinearGradient(g.x, g.y, g.x + g.w, g.y + g.h);
  if (direction.heroSide === "right" || zones.mode === "vertical-split") {
    field.addColorStop(0, rgba(direction.shadowRgb || [0, 0, 0], 0.97));
    field.addColorStop(0.48, rgba(direction.ambientRgb || [18, 3, 7], 0.86));
    field.addColorStop(0.78, rgba(direction.shadowRgb || [0, 0, 0], 0.48));
    field.addColorStop(1, "rgba(0,0,0,0.08)");
  } else {
    field.addColorStop(0, "rgba(0,0,0,0.08)");
    field.addColorStop(0.22, rgba(direction.shadowRgb || [0, 0, 0], 0.48));
    field.addColorStop(0.56, rgba(direction.ambientRgb || [18, 3, 7], 0.86));
    field.addColorStop(1, rgba(direction.shadowRgb || [0, 0, 0], 0.97));
  }
  ctx.fillStyle = field;
  ctx.fillRect(g.x, g.y, g.w, g.h);
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = rgba(direction.ambientRgb || [207,16,45], 0.38);
  for (let i = 0; i < 9; i += 1) {
    ctx.lineWidth = Math.max(2, width * (0.004 + (i % 3) * 0.002));
    ctx.beginPath();
    ctx.moveTo(g.x + g.w * (0.08 + i * 0.025), height * (0.18 + i * 0.045));
    ctx.bezierCurveTo(g.x + g.w * 0.28, height * (0.12 + i * 0.052), g.x + g.w * 0.55, height * (0.23 + i * 0.038), g.x + g.w * 0.86, height * (0.18 + i * 0.04));
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(244,241,234,0.12)";
  ctx.lineWidth = Math.max(1, width * 0.0012);
  if (direction.key === "bathroom_noir") {
    const tile = Math.max(42, width * 0.055);
    for (let x = g.x; x < g.x + g.w; x += tile) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - width * 0.16, height); ctx.stroke(); }
    for (let y = 0; y < height; y += tile * 0.74) { ctx.beginPath(); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y + height * 0.05); ctx.stroke(); }
  }
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = direction.accent;
  ctx.lineWidth = Math.max(8, width * 0.012);
  ctx.font = font(width * 0.42, "Bebas Neue", 900);
  ctx.strokeText("A", g.x + g.w * 0.08, height * 0.62, g.w * 0.5);
  ctx.beginPath();
  ctx.arc(g.x + g.w * 0.25, height * 0.43, g.w * 0.23, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = direction.accent;
  ctx.lineWidth = Math.max(4, width * 0.005);
  ctx.beginPath();
  ctx.moveTo(zones.title.x, zones.title.y - height * 0.035);
  ctx.lineTo(zones.title.x + zones.title.w * 0.74, zones.title.y - height * 0.07);
  ctx.stroke();
  ctx.restore();
}

function scoreLines(ctx, lines, maxWidth) {
  const widths = lines.map(line => ctx.measureText(line).width);
  if (widths.some(width => width > maxWidth)) return -Infinity;
  const max = Math.max(...widths);
  const min = Math.min(...widths);
  const orphanPenalty = lines.some(line => line.length <= 3) ? 0.28 : 0;
  return 1 - Math.abs(max - min) / Math.max(1, maxWidth) - orphanPenalty - lines.length * 0.018;
}

function balancedWrapLines(ctx, words, maxWidth, maxLines) {
  if (!words.length) return [];
  let best = null;
  function walk(start, lines) {
    if (start >= words.length) {
      const score = scoreLines(ctx, lines, maxWidth);
      if (!best || score > best.score) best = { lines, score };
      return;
    }
    if (lines.length >= maxLines) return;
    for (let end = start + 1; end <= words.length; end += 1) {
      const line = words.slice(start, end).join(" ");
      if (ctx.measureText(line).width > maxWidth && end > start + 1) break;
      walk(end, [...lines, line]);
    }
  }
  walk(0, []);
  return best?.lines || null;
}

function chooseImpactIndex(ctx, lines, width, height) {
  if (lines.length <= 1) return -1;
  const weights = lines.map((line, index) => {
    const visualWeight = ctx.measureText(line).width / Math.max(1, width);
    const centrality = 1 - Math.abs(index - (lines.length - 1) / 2) / Math.max(1, lines.length);
    return visualWeight * 0.64 + centrality * 0.28 + (index === lines.length - 1 ? 0.08 : 0);
  });
  const strongest = weights.indexOf(Math.max(...weights));
  return height > width * 1.15 && lines.length > 4 ? Math.min(strongest, lines.length - 2) : strongest;
}

function planTitle(ctx, title, zones, width, height) {
  const words = compact(title).split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [], fontSize: 0, leadCount: 0, impactIndex: -1, lineHeight: 0, valid: true };
  const maxLines = height > width * 1.15 ? 7 : width / height > 2.1 ? 4 : 6;
  const start = height > width * 1.15 ? width * 0.14 : width / height > 2.1 ? height * 0.24 : width * 0.088;
  const min = Math.max(18, Math.min(width, height) * 0.033);
  for (let size = start; size >= min; size -= Math.max(2, start * 0.04)) {
    ctx.font = font(size, "Bebas Neue", 900);
    const lines = balancedWrapLines(ctx, words, zones.title.w, maxLines);
    if (!lines) continue;
    const lineHeight = size * 0.92;
    if (lines.length * lineHeight <= zones.title.h) return { lines, fontSize: size, leadCount: lines.length > 3 ? 1 : 0, impactIndex: chooseImpactIndex(ctx, lines, width, height), lineHeight, valid: true };
  }
  ctx.font = font(min, "Bebas Neue", 900);
  const lines = balancedWrapLines(ctx, words, zones.title.w, maxLines + 2) || [compact(title)];
  return { lines, fontSize: min, leadCount: 0, impactIndex: chooseImpactIndex(ctx, lines, width, height), lineHeight: min * 0.92, valid: false };
}

function drawTitle(ctx, title, zones, width, height, direction) {
  const plan = planTitle(ctx, title, zones, width, height);
  const boxes = [];
  ctx.save();
  ctx.textAlign = zones.title.align;
  let y = zones.title.y + plan.fontSize * 0.82;
  plan.lines.forEach((line, index) => {
    const isLead = index < plan.leadCount;
    const isImpact = index === plan.impactIndex && plan.lines.length > 1;
    const size = isLead ? plan.fontSize * 1.14 : isImpact ? plan.fontSize * 1.04 : plan.fontSize * 0.92;
    ctx.font = font(size, "Bebas Neue", 900);
    ctx.strokeStyle = "rgba(0,0,0,0.96)";
    ctx.lineWidth = Math.max(3, size * 0.072);
    ctx.shadowColor = "rgba(0,0,0,0.78)";
    ctx.shadowBlur = size * 0.14;
    const fill = ctx.createLinearGradient(zones.title.x, y - size, zones.title.x, y + size * 0.2);
    fill.addColorStop(0, "#ffffff"); fill.addColorStop(0.5, WHITE); fill.addColorStop(1, "#a7a7a7");
    ctx.fillStyle = isImpact ? (direction?.accent || RED) : fill;
    if (isImpact) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = rgba(direction?.ambientRgb || [255,40,54], 0.42);
      ctx.lineWidth = Math.max(5, size * 0.08);
      ctx.beginPath();
      ctx.moveTo(zones.title.x - width * 0.01, y - size * 0.24);
      ctx.bezierCurveTo(zones.title.x + zones.title.w * 0.18, y - size * 0.36, zones.title.x + zones.title.w * 0.52, y - size * 0.06, zones.title.x + zones.title.w * 0.92, y - size * 0.2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeText(line, zones.title.x, y, zones.title.w);
    ctx.fillText(line, zones.title.x, y, zones.title.w);
    const metrics = ctx.measureText(line);
    boxes.push({ x: zones.title.x, y: y - size * 0.82, w: Math.min(metrics.width, zones.title.w), h: size, text: line });
    if (isLead || isImpact) {
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = isImpact ? "rgba(255,255,255,0.22)" : rgba(direction?.ambientRgb || [207,16,45], 0.7);
      ctx.lineWidth = Math.max(3, width * 0.004);
      ctx.beginPath(); ctx.moveTo(zones.title.x, y + size * 0.11); ctx.lineTo(zones.title.x + Math.min(metrics.width, zones.title.w) * 0.94, y + size * 0.03); ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
    y += plan.lineHeight * (isImpact ? 0.92 : 1);
  });
  ctx.restore();
  const visible = boxes.every(box => box.x >= 0 && box.y >= 0 && box.x + box.w <= width + 2 && box.y + box.h <= height + 2);
  return { ...plan, boxes, visible, bottom: y };
}

function drawMeta(ctx, campaign, zones, width, height, direction, titleBottom) {
  const performer = compact(campaign.performerName || campaign.creatorName || "");
  const collection = compact(campaign.collection || "");
  const episode = compact(campaign.episode || "");
  const label = compact(campaign.campaignLabel || campaign.releaseName || "");
  const cta = compact(campaign.primaryCTA || campaign.cta || "");
  const startY = Math.max(zones.meta.y, titleBottom + height * 0.026);
  const barH = Math.max(height * 0.062, 44);
  const box = { x: zones.meta.x, y: startY - barH * 0.26, w: zones.meta.w, h: barH * 1.18 };
  ctx.save();
  ctx.textAlign = "left";
  const glass = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
  glass.addColorStop(0, "rgba(0,0,0,0.78)");
  glass.addColorStop(0.52, rgba(direction.shadowRgb || [0, 0, 0], 0.58));
  glass.addColorStop(1, "rgba(255,255,255,0.035)");
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, Math.max(4, width * 0.006));
  ctx.fill();
  ctx.strokeStyle = "rgba(244,241,234,0.16)";
  ctx.lineWidth = Math.max(1, width * 0.0011);
  ctx.stroke();
  ctx.fillStyle = direction.accent;
  ctx.fillRect(box.x, box.y, box.w * 0.34, Math.max(2, height * 0.004));
  const items = [performer && `CAST  ${performer}`, collection && `COLLECTION  ${collection}`, episode && `EPISODE  ${episode}`, label && `RELEASE  ${label}`, cta && `WATCH  ${cta}`].filter(Boolean).slice(0, 4);
  ctx.font = font(Math.max(9, width * 0.0088), "Inter", 900);
  let cursor = box.x + width * 0.014;
  const y = box.y + box.h * 0.62;
  items.forEach((item, index) => {
    if (index > 0) {
      ctx.strokeStyle = "rgba(244,241,234,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursor, box.y + box.h * 0.28);
      ctx.lineTo(cursor, box.y + box.h * 0.82);
      ctx.stroke();
      cursor += width * 0.014;
    }
    ctx.fillStyle = index === 0 ? WHITE : "rgba(244,241,234,0.72)";
    const max = box.x + box.w - cursor - width * 0.012;
    ctx.fillText(item.toUpperCase(), cursor, y, max);
    cursor += Math.min(ctx.measureText(item.toUpperCase()).width + width * 0.026, box.w * 0.28);
  });
  ctx.restore();
  return box;
}

function drawBadges(ctx, campaign, zones, width, height, direction) {
  const items = (campaign.badges || []).slice(0, 3).map(compact).filter(Boolean);
  if (!items.length) return;
  const y = Math.min(height * 0.93, zones.meta.y + zones.meta.h * 0.8);
  const groupW = zones.meta.w / Math.max(3, items.length);
  ctx.save();
  ctx.font = font(Math.max(9, width * 0.0095), "Inter", 950);
  items.forEach((item, index) => {
    const x = zones.meta.x + groupW * index;
    const icon = Math.max(22, width * 0.03);
    ctx.strokeStyle = direction.accent;
    ctx.lineWidth = Math.max(2, width * 0.002);
    if (index === 0) {
      ctx.strokeRect(x, y - icon * 0.5, icon * 0.78, icon * 0.52);
      ctx.beginPath(); ctx.arc(x + icon * 0.39, y - icon * 0.24, icon * 0.16, 0, Math.PI * 2); ctx.stroke();
    } else if (index === 1) {
      ctx.beginPath(); ctx.arc(x + icon * 0.34, y - icon * 0.23, icon * 0.34, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + icon * 0.25, y - icon * 0.42); ctx.lineTo(x + icon * 0.52, y - icon * 0.23); ctx.lineTo(x + icon * 0.25, y - icon * 0.04); ctx.closePath(); ctx.stroke();
    } else {
      ctx.strokeRect(x + icon * 0.1, y - icon * 0.46, icon * 0.55, icon * 0.45);
      ctx.beginPath(); ctx.arc(x + icon * 0.38, y - icon * 0.46, icon * 0.18, Math.PI, 0); ctx.stroke();
    }
    ctx.fillStyle = WHITE;
    const words = item.split(" ");
    ctx.fillText(words.slice(0, 2).join(" "), x + icon, y - icon * 0.28, groupW - icon - width * 0.018);
    ctx.fillText(words.slice(2).join(" "), x + icon, y + icon * 0.08, groupW - icon - width * 0.018);
    if (index < items.length - 1) {
      ctx.fillStyle = "rgba(244,241,234,0.32)";
      ctx.fillRect(x + groupW - width * 0.018, y - icon * 0.7, 1, icon * 1.18);
    }
  });
  ctx.restore();
}

async function drawLogo(ctx, zones, width, height) {
  const logo = await loadLogo();
  ctx.save();
  if (logo) {
    const h = zones.logo.w * (logo.height / logo.width);
    ctx.drawImage(logo, zones.logo.x, zones.logo.y, zones.logo.w, h);
    ctx.restore();
    return { ...zones.logo, h };
  }
  ctx.font = font(Math.max(22, zones.logo.w * 0.18), "Inter", 950);
  ctx.fillStyle = WHITE;
  ctx.fillText("FLESHLAB", zones.logo.x, zones.logo.y + height * 0.05, zones.logo.w);
  ctx.restore();
  return { ...zones.logo, h: height * 0.06 };
}

function finalTexture(ctx, width, height, zones, direction) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 190; i += 1) {
    ctx.fillStyle = i % 5 === 0 ? rgba(direction.ambientRgb || [207,16,45], 0.16) : "rgba(255,255,255,0.055)";
    ctx.fillRect((i * 67) % width, (i * 41) % height, Math.max(1, width * 0.001), Math.max(1, width * 0.001));
  }
  ctx.strokeStyle = rgba(direction.ambientRgb || [207,16,45], 0.42);
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeRect(width * 0.018, width * 0.018, width - width * 0.036, height - width * 0.036);
  ctx.restore();
}

function validateTitle(title, titlePlan) {
  const drawn = compact(titlePlan.lines.join(" "));
  const source = compact(title);
  const failures = [];
  if (source && drawn !== source) failures.push("source title was not preserved verbatim");
  if (source && !titlePlan.visible) failures.push("title extends outside canvas");
  if (source && !titlePlan.valid) failures.push("title required emergency minimum size");
  return { passed: failures.length === 0, failures, drawnTitle: drawn };
}

function intersects(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function createPolishVariants(format, campaign) {
  const seed = compact(`${campaign.campaignTitle || ""}${campaign.collection || ""}${format.key || ""}`).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const variants = [
    { key: "cinema-monumental", split: -0.02, titleY: -0.035, logoY: 0, titleScale: 1 },
    { key: "intimate-lowburn", split: 0.025, titleY: 0.035, logoY: -0.01, titleScale: 0.94 },
    { key: "diagonal-tension", split: -0.045, titleY: -0.005, logoY: 0.012, titleScale: 0.98 },
    { key: "streaming-premiere", split: 0.04, titleY: -0.02, logoY: 0, titleScale: 0.92 }
  ];
  return variants.slice(seed % variants.length).concat(variants.slice(0, seed % variants.length));
}

function applyPolishVariant(zones, width, height, variant) {
  const adjusted = JSON.parse(JSON.stringify(zones));
  if (adjusted.mode === "side-split") {
    const dx = width * variant.split;
    adjusted.graphic.w = clamp((adjusted.graphic.w + dx) / width, 0.42, 0.68) * width;
    adjusted.title.y = clamp(adjusted.title.y + height * variant.titleY, height * 0.12, height * 0.34);
    adjusted.title.h = clamp(adjusted.title.h * variant.titleScale, height * 0.34, height * 0.5);
    adjusted.meta.y = Math.min(height * 0.8, adjusted.title.y + adjusted.title.h + height * 0.035);
    adjusted.logo.y = clamp(adjusted.logo.y + height * variant.logoY, height * 0.035, height * 0.12);
  } else {
    adjusted.title.y = clamp(adjusted.title.y + height * variant.titleY, height * 0.5, height * 0.64);
    adjusted.title.h = clamp(adjusted.title.h * variant.titleScale, height * 0.2, height * 0.31);
    adjusted.meta.y = Math.min(height * 0.84, adjusted.title.y + adjusted.title.h + height * 0.025);
  }
  adjusted.polishVariant = variant.key;
  return adjusted;
}

function validateComposition({ titlePlan, logoBox, metaBox, zones, width, height }) {
  const failures = [];
  const titleArea = titlePlan.boxes.reduce((area, box) => ({
    x: Math.min(area.x, box.x),
    y: Math.min(area.y, box.y),
    w: Math.max(area.x + area.w, box.x + box.w) - Math.min(area.x, box.x),
    h: Math.max(area.y + area.h, box.y + box.h) - Math.min(area.y, box.y)
  }), titlePlan.boxes[0] || null);
  if (titleArea && logoBox && intersects(titleArea, logoBox)) failures.push("logo overlaps title");
  if (titleArea && metaBox && intersects(titleArea, metaBox)) failures.push("metadata overlaps title");
  if (logoBox && (logoBox.y < 0 || logoBox.y + logoBox.h > height || logoBox.x < 0 || logoBox.x + logoBox.w > width)) failures.push("logo outside canvas");
  if (zones.title.w < width * 0.22) failures.push("insufficient title stage");
  const score = 100
    - failures.length * 28
    - Math.max(0, titlePlan.lines.length - 5) * 4
    + Math.min(18, titlePlan.fontSize / Math.max(1, Math.min(width, height)) * 180)
    + (zones.mode === "side-split" ? 8 : 4);
  return { passed: failures.length === 0, failures, score };
}

export async function renderKrakenCampaignComposerAsset({ image, analysis = {}, format, campaign = {} }) {
  const palette = extractImagePalette(image);
  const baseDirection = chooseDirection(campaign, analysis);
  const title = compact(campaign.campaignTitle || campaign.primaryTitle || "");
  const attempts = [];

  for (const variant of createPolishVariants(format, campaign)) {
    const direction = applyPaletteToDirection({ ...baseDirection, polishVariant: variant.key }, palette);
    const canvas = document.createElement("canvas");
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d");
    const zones = applyPolishVariant(getZones(format.width, format.height, direction), format.width, format.height, variant);
    const compositionPlan = createCompositionPlan({ analysis, format, campaign });
    compositionPlan.layerPlan = createLayerPlan({ compositionPlan, analysis, format });
    const keyArtBrief = createKeyArtBrief({ campaign, mood: { label: direction.key, accent: direction.accent }, analysis, format });
    const layoutSketch = createLayoutSketch({ compositionPlan, campaign, format, keyArtBrief });

    drawBackgroundAtmosphere(ctx, image, format.width, format.height, zones, direction, analysis);
    drawHeroPhotography(ctx, image, format.width, format.height, zones, direction, analysis);
    drawSubjectDepth(ctx, image, format.width, format.height, zones, direction, analysis);
    drawStructuralGraphics(ctx, format.width, format.height, zones, direction);
    drawPhotoBackgroundFusion(ctx, image, format.width, format.height, zones, direction, analysis);
    const titlePlan = drawTitle(ctx, title, zones, format.width, format.height, direction);
    const metaBox = drawMeta(ctx, campaign, zones, format.width, format.height, direction, titlePlan.bottom);
    drawBadges(ctx, campaign, zones, format.width, format.height, direction);
    const logo = await drawLogo(ctx, zones, format.width, format.height);
    finalTexture(ctx, format.width, format.height, zones, direction);

    const titleValidation = validateTitle(title, titlePlan);
    const compositionValidation = validateComposition({ titlePlan, logoBox: logo, metaBox, zones, width: format.width, height: format.height });
    attempts.push({ canvas, direction, zones, compositionPlan, keyArtBrief, layoutSketch, titlePlan, logo, titleValidation, compositionValidation, score: compositionValidation.score + (titleValidation.passed ? 20 : -80) });
  }

  const best = attempts.filter(attempt => attempt.titleValidation.passed && attempt.compositionValidation.passed).sort((a, b) => b.score - a.score)[0];
  if (!best) {
    const failures = attempts.flatMap(attempt => [...attempt.titleValidation.failures, ...attempt.compositionValidation.failures]);
    throw new Error(`Campaign Composer blocked export: ${[...new Set(failures)].join(", ")}.`);
  }

  best.compositionPlan.dynamicTypographyLayout = best.zones.title;
  best.compositionPlan.typographyPlan = best.titlePlan;
  best.compositionPlan.typographyWarnings = [];
  best.compositionPlan.krakenArchitecture = { direction: best.direction, zones: best.zones, logo: best.logo, validation: best.compositionValidation, candidateCount: attempts.length, layerOrder: ["background atmosphere", "hero photography", "subject depth", "structural graphics", "photo fusion", "title", "premium info bar", "badges", "logo", "finish"] };

  const blob = await new Promise(resolve => best.canvas.toBlob(resolve, "image/jpeg", 0.95));
  return {
    format,
    filename: `${campaign.base || "kraken-campaign"}_${format.key}_kraken_key_art.jpg`,
    width: format.width,
    height: format.height,
    size: blob.size,
    blob,
    url: URL.createObjectURL(blob),
    legacyPreviewUrl: null,
    legacyRendererLabel: null,
    kind: "visual",
    status: "ready",
    campaignConceptId: campaign.campaignConceptId,
    brandPlan: { family: "KRAKEN Key Art", designSystem: "FLESHLAB KRAKEN Campaign Composer", mood: best.direction.key, layout: { compositionPlan: best.compositionPlan, layoutSketch: best.layoutSketch }, graphicLanguage: best.direction.texture, creativeConcept: best.compositionPlan.creativeConcept, brandDnaRules: best.compositionPlan.brandDnaRules },
    keyArtBrief: best.keyArtBrief,
    layoutSketch: best.layoutSketch,
    compositionPlan: best.compositionPlan,
    layerPlan: best.compositionPlan.layerPlan,
    typographyWarnings: [],
    campaignMetadata: campaign.campaignMetadata,
    downstreamStage: "Final KRAKEN Key Art",
    campaignComposerReady: true,
  };
}