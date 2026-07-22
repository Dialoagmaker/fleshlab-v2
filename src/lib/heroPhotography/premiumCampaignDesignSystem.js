import { FLESHLAB_BRAND_IDENTITY } from "@/lib/aiMediaStudio/brandIdentityEngine";
import { createCompositionPlan } from "@/lib/heroPhotography/compositionEngine";
import { createLayerPlan } from "@/lib/heroPhotography/layerCompositionEngine";

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

const MOODS = {
  luxury: { label: "Luxury Editorial", grade: "rgba(20,12,10,0.34)", accent: "#cf102d", secondary: "#f4f1ea", panel: "rgba(5,5,6,0.78)", texture: 0.08, badge: "PREMIUM EDITORIAL" },
  behind: { label: "Behind The Scenes", grade: "rgba(28,18,10,0.28)", accent: "#f05b2a", secondary: "#f4f1ea", panel: "rgba(4,4,5,0.74)", texture: 0.12, badge: "BTS ACCESS" },
  exclusive: { label: "Exclusive Release", grade: "rgba(18,0,4,0.36)", accent: "#f0183d", secondary: "#ffffff", panel: "rgba(7,7,8,0.82)", texture: 0.1, badge: "EXCLUSIVE" },
  travel: { label: "Travel", grade: "rgba(12,18,22,0.24)", accent: "#cf102d", secondary: "#dfefff", panel: "rgba(3,7,10,0.74)", texture: 0.07, badge: "ON LOCATION" },
  summer: { label: "Summer", grade: "rgba(34,13,4,0.22)", accent: "#ff3b45", secondary: "#ffe7b4", panel: "rgba(8,5,4,0.72)", texture: 0.08, badge: "SUMMER HEAT" },
  nightlife: { label: "Nightlife", grade: "rgba(7,4,18,0.36)", accent: "#ff1744", secondary: "#cfc8ff", panel: "rgba(4,4,12,0.8)", texture: 0.13, badge: "AFTER DARK" },
  hotel: { label: "Hotel Sessions", grade: "rgba(24,8,8,0.32)", accent: "#cf102d", secondary: "#f4f1ea", panel: "rgba(5,5,6,0.78)", texture: 0.1, badge: "HOTEL SESSIONS" },
  beach: { label: "Beach Escape", grade: "rgba(7,18,22,0.2)", accent: "#ff3348", secondary: "#d7f5ff", panel: "rgba(4,8,10,0.74)", texture: 0.07, badge: "BEACH ESCAPE" },
  fitness: { label: "Fitness", grade: "rgba(6,10,8,0.28)", accent: "#ff2433", secondary: "#d7ffe6", panel: "rgba(4,7,5,0.76)", texture: 0.08, badge: "BODY / MOTION" },
  studio: { label: "Studio", grade: "rgba(12,12,14,0.32)", accent: "#cf102d", secondary: "#f4f1ea", panel: "rgba(5,5,6,0.8)", texture: 0.08, badge: "STUDIO ORIGINAL" },
};

function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function upper(value) { return String(value || "").trim().toUpperCase(); }
function font(size, family = "Inter", weight = 900) { return `${weight} ${Math.round(size)}px "${family}", Impact, Arial, sans-serif`; }
function compact(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function toPx(zone, width, height) { return { x: zone.x * width, y: zone.y * height, w: zone.w * width, h: zone.h * height }; }

function inferCampaignMood(campaign = {}) {
  if (campaign.moodKey && MOODS[campaign.moodKey]) return MOODS[campaign.moodKey];
  return MOODS.luxury;
}

function coverImage(ctx, image, width, height, focus, zoom = 1) {
  const scale = Math.max(width / image.width, height / image.height) * clamp(zoom, 0.92, 1.32);
  const sw = width / scale;
  const sh = height / scale;
  const sx = clamp(image.width * focus.x - sw / 2, 0, Math.max(0, image.width - sw));
  const sy = clamp(image.height * focus.y - sh / 2, 0, Math.max(0, image.height - sh));
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

function drawBackgroundStage(ctx, image, width, height, analysis, mood) {
  ctx.save();
  ctx.filter = "blur(18px) brightness(38%) contrast(145%) saturate(118%)";
  coverImage(ctx, image, width, height, analysis.subjectCenter || { x: 0.5, y: 0.5 }, 1.08);
  ctx.restore();
  ctx.fillStyle = mood.grade;
  ctx.fillRect(0, 0, width, height);
  const radial = ctx.createRadialGradient(width * 0.78, height * 0.18, 0, width * 0.78, height * 0.18, width * 0.56);
  radial.addColorStop(0, "rgba(240,24,61,0.34)");
  radial.addColorStop(0.42, "rgba(240,24,61,0.08)");
  radial.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);
}

function layoutFor(format, analysis, campaign) {
  const portrait = format.height > format.width;
  const ultraWide = format.width / format.height > 2.2;
  if (campaign.designVariant === "full_bleed") return portrait ? { image: { x: 0, y: 0, w: 1, h: 1 }, panel: { x: 0.08, y: 0.56, w: 0.84, h: 0.34 }, textAlign: "left", fullBleed: true } : { image: { x: 0, y: 0, w: 1, h: 1 }, panel: { x: 0.06, y: 0.12, w: ultraWide ? 0.38 : 0.42, h: 0.74 }, textAlign: "left", fullBleed: true };
  if (campaign.designVariant === "poster_panel") return portrait ? { image: { x: 0.08, y: 0.06, w: 0.84, h: 0.52 }, panel: { x: 0.08, y: 0.55, w: 0.84, h: 0.38 }, textAlign: "center" } : { image: { x: 0.1, y: 0.08, w: 0.5, h: 0.84 }, panel: { x: 0.54, y: 0.12, w: 0.38, h: 0.76 }, textAlign: "left" };
  if (portrait) return { image: { x: 0.07, y: 0.07, w: 0.86, h: 0.56 }, panel: { x: 0.08, y: 0.56, w: 0.84, h: 0.36 }, textAlign: "center", portrait: true };
  if (ultraWide) return { image: { x: 0.46, y: 0.08, w: 0.5, h: 0.84 }, panel: { x: 0.04, y: 0.12, w: 0.42, h: 0.76 }, textAlign: "left" };
  if ((analysis.subjectSide || "center") === "left") return { image: { x: 0.04, y: 0.08, w: 0.58, h: 0.84 }, panel: { x: 0.57, y: 0.12, w: 0.38, h: 0.76 }, textAlign: "left" };
  return { image: { x: 0.38, y: 0.08, w: 0.58, h: 0.84 }, panel: { x: 0.05, y: 0.12, w: 0.4, h: 0.76 }, textAlign: "left" };
}

function drawImageMask(ctx, image, width, height, analysis, layout, mood, format) {
  if (layout.fullBleed) {
    ctx.save();
    ctx.filter = "brightness(70%) contrast(142%) saturate(112%)";
    coverImage(ctx, image, width, height, analysis.subjectCenter || { x: 0.5, y: 0.48 }, format.role === "thumbnail" ? 1.12 : 1.04);
    ctx.restore();
    const shade = ctx.createLinearGradient(0, 0, width, height);
    shade.addColorStop(0, "rgba(0,0,0,0.82)");
    shade.addColorStop(0.48, "rgba(0,0,0,0.26)");
    shade.addColorStop(1, "rgba(0,0,0,0.74)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  const box = toPx(layout.image, width, height);
  ctx.save();
  ctx.beginPath();
  const cut = Math.min(box.w, box.h) * 0.04;
  ctx.moveTo(box.x + cut, box.y);
  ctx.lineTo(box.x + box.w, box.y);
  ctx.lineTo(box.x + box.w - cut, box.y + box.h);
  ctx.lineTo(box.x, box.y + box.h);
  ctx.closePath();
  ctx.clip();
  ctx.filter = "brightness(84%) contrast(136%) saturate(112%)";
  coverImage(ctx, image, box.w, box.h, analysis.subjectCenter || { x: 0.5, y: 0.48 }, format.role === "thumbnail" ? 1.12 : 1.04);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "rgba(244,241,234,0.22)";
  ctx.lineWidth = Math.max(2, width * 0.0025);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = mood.accent;
  ctx.lineWidth = Math.max(5, width * 0.007);
  ctx.beginPath();
  ctx.moveTo(box.x - width * 0.012, box.y + box.h * 0.12);
  ctx.lineTo(box.x + box.w * 0.38, box.y + box.h * 0.02);
  ctx.stroke();
  ctx.restore();
}

function drawTexture(ctx, width, height, mood) {
  ctx.save();
  ctx.globalAlpha = mood.texture;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 360; i += 1) ctx.fillRect((i * 97) % width, (i * 53) % height, 1 + (i % 3), 1);
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(width * (0.08 + i * 0.12), 0);
    ctx.lineTo(width * (0.02 + i * 0.12), height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGraphicLanguage(ctx, width, height, layout, mood, format, campaign) {
  const panel = toPx(layout.panel, width, height);
  ctx.save();
  ctx.fillStyle = campaign.designVariant === "full_bleed" ? "rgba(0,0,0,0.34)" : mood.panel;
  ctx.beginPath();
  ctx.roundRect(panel.x, panel.y, panel.w, panel.h, Math.max(10, width * 0.012));
  ctx.fill();
  ctx.strokeStyle = "rgba(244,241,234,0.14)";
  ctx.lineWidth = Math.max(1, width * 0.0018);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = mood.accent;
  ctx.translate(panel.x - width * 0.025, panel.y + panel.h * 0.08);
  ctx.rotate(campaign.designVariant === "poster_panel" ? 0.04 : -0.1);
  ctx.fillRect(0, 0, panel.w * 0.76, Math.max(9, height * 0.016));
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeRect(width * 0.025, height * 0.035, width * 0.95, height * 0.93);
  ctx.strokeStyle = mood.accent;
  ctx.lineWidth = Math.max(4, width * 0.004);
  [[0.025, 0.035], [0.94, 0.035], [0.025, 0.92], [0.94, 0.92]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(width * x, height * y);
    ctx.lineTo(width * (x + 0.035), height * y);
    ctx.moveTo(width * x, height * y);
    ctx.lineTo(width * x, height * (y + 0.055));
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const streak = ctx.createLinearGradient(0, height * 0.2, width, height * 0.74);
  streak.addColorStop(0, "rgba(255,255,255,0)");
  streak.addColorStop(0.48, "rgba(255,255,255,0.16)");
  streak.addColorStop(0.52, "rgba(240,24,61,0.24)");
  streak.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = streak;
  ctx.translate(width * 0.08, format.role === "banner" ? -height * 0.15 : 0);
  ctx.rotate(campaign.designVariant === "poster_panel" ? 0.12 : -0.16);
  ctx.fillRect(0, height * 0.24, width * 1.1, Math.max(18, height * 0.04));
  ctx.restore();
}

function scoreWrappedLines(ctx, lines, maxWidth) {
  const widths = lines.map(line => ctx.measureText(line).width);
  if (widths.some(width => width > maxWidth)) return -Infinity;
  const avg = widths.reduce((sum, width) => sum + width, 0) / Math.max(1, widths.length);
  const variance = widths.reduce((sum, width) => sum + Math.abs(width - avg), 0) / Math.max(1, widths.length);
  return Math.max(...widths) / maxWidth - variance / maxWidth * 0.52;
}

function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  let best = null;
  function walk(start, remaining, lines) {
    if (remaining === 1) {
      const candidate = [...lines, words.slice(start).join(" ")];
      const score = scoreWrappedLines(ctx, candidate, maxWidth) - candidate.length * 0.025;
      if (!best || score > best.score) best = { lines: candidate, score };
      return;
    }
    for (let end = start + 1; end <= words.length - remaining + 1; end += 1) walk(end, remaining - 1, [...lines, words.slice(start, end).join(" ")]);
  }
  for (let count = 1; count <= Math.min(maxLines, words.length); count += 1) walk(0, count, []);
  return best?.lines || [words.join(" ")];
}

function fitText(ctx, text, maxWidth, start, min, lines, family = "Bebas Neue") {
  for (let size = start; size >= min; size -= Math.max(2, start * 0.045)) {
    ctx.font = font(size, family, 900);
    const wrapped = wrap(ctx, text, maxWidth, lines);
    if (wrapped.every(line => ctx.measureText(line).width <= maxWidth)) return { size, lines: wrapped, family };
  }
  ctx.font = font(min, family, 900);
  return { size: min, lines: wrap(ctx, text, maxWidth, lines), family };
}

function drawTrackingText(ctx, text, x, y, tracking, maxWidth) {
  let cursor = x;
  upper(text).split("").forEach(char => {
    const width = ctx.measureText(char).width;
    if (cursor + width > x + maxWidth) return;
    ctx.fillText(char, cursor, y);
    cursor += width + tracking;
  });
}

async function drawLogo(ctx, width, height, layout) {
  const logo = await loadLogo();
  const panel = toPx(layout.panel, width, height);
  const logoW = Math.min(panel.w * 0.42, width * 0.14);
  if (logo) {
    const logoH = logoW * (logo.height / logo.width);
    ctx.drawImage(logo, panel.x + panel.w * 0.06, panel.y + panel.h * 0.06, logoW, logoH);
    return panel.y + panel.h * 0.06 + logoH;
  }
  ctx.font = font(width * 0.026, "Inter", 950);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.fillText("FLESHLAB", panel.x + panel.w * 0.06, panel.y + panel.h * 0.11, logoW);
  return panel.y + panel.h * 0.12;
}

function drawBadgeRow(ctx, badges, x, y, maxW, mood, center = false) {
  const clean = (badges || []).slice(0, 4).map(upper).filter(Boolean);
  if (!clean.length) return;
  ctx.font = font(13, "Inter", 900);
  const gap = 8;
  const boxes = clean.map(label => ({ label, w: Math.min(maxW * 0.45, ctx.measureText(label).width + 22) }));
  const total = boxes.reduce((sum, box) => sum + box.w, 0) + gap * (boxes.length - 1);
  let cursor = center ? x - total / 2 : x;
  boxes.forEach(box => {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.strokeStyle = mood.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cursor, y, box.w, 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillText(box.label, cursor + 11, y + 16, box.w - 22);
    cursor += box.w + gap;
  });
}

function drawEditorialType(ctx, width, height, layout, mood, campaign, logoBottom) {
  const panel = toPx(layout.panel, width, height);
  const pad = panel.w * 0.06;
  const x = panel.x + pad;
  const maxW = panel.w - pad * 2;
  const center = layout.textAlign === "center";
  ctx.textAlign = center ? "center" : "left";
  const textX = center ? panel.x + panel.w / 2 : x;

  const title = compact(campaign.primaryTitle || campaign.campaignTitle || "PRIVATE ACCESS");
  const collection = compact(campaign.collection || campaign.subtitle || campaign.seriesName || "");
  const performer = compact(campaign.performerName || campaign.creatorName || "");
  const episode = compact(campaign.episode || "Episode 01");
  const yStart = Math.max(logoBottom + height * 0.035, panel.y + panel.h * 0.21);

  ctx.font = font(Math.max(10, width * 0.009), "Inter", 950);
  ctx.fillStyle = mood.accent;
  if (center) ctx.fillText(mood.badge, textX, yStart, maxW);
  else drawTrackingText(ctx, mood.badge, x, yStart, Math.max(1, width * 0.0016), maxW);

  const hasSupportingText = Boolean(collection || performer || episode);
  const titleFit = fitText(ctx, title, maxW, hasSupportingText ? (height > width ? width * 0.22 : width * 0.11) : (height > width ? width * 0.28 : width * 0.145), Math.max(28, width * 0.028), 2);
  ctx.font = font(titleFit.size, titleFit.family || "Bebas Neue", 900);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.strokeStyle = "rgba(0,0,0,0.72)";
  ctx.lineWidth = Math.max(2, titleFit.size * 0.025);
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = titleFit.size * 0.1;
  titleFit.lines.forEach((line, index) => {
    const y = yStart + titleFit.size * 0.86 + index * titleFit.size * 1.02;
    ctx.strokeText(upper(line), textX, y, maxW);
    ctx.fillText(upper(line), textX, y, maxW);
  });
  ctx.shadowBlur = 0;

  const afterTitle = yStart + titleFit.size * (1 + titleFit.lines.length * 1.02) + height * 0.025;
  ctx.fillStyle = mood.accent;
  ctx.fillRect(center ? textX - maxW * 0.16 : x, afterTitle - height * 0.01, maxW * 0.32, Math.max(4, height * 0.006));

  if (collection) {
    ctx.font = font(Math.max(16, width * 0.022), "Inter", 850);
    ctx.fillStyle = mood.secondary;
    ctx.fillText(upper(collection), textX, afterTitle + height * 0.035, maxW);
  }

  let detailY = afterTitle + height * 0.085;
  if (performer) {
    ctx.font = font(Math.max(13, width * 0.015), "Inter", 900);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillText(`PERFORMER / ${upper(performer)}`, textX, detailY, maxW);
    detailY += height * 0.037;
  }

  if (episode) {
    ctx.font = font(Math.max(11, width * 0.012), "Inter", 900);
    ctx.fillStyle = "rgba(244,241,234,0.68)";
    ctx.fillText(upper(episode), textX, detailY, maxW);
    detailY += height * 0.028;
  }

  drawBadgeRow(ctx, campaign.badges, center ? textX : x, detailY, maxW, mood, center);
  ctx.textAlign = "left";
}

function coverImageRect(ctx, image, box, focus, zoom = 1) {
  const scale = Math.max(box.w / image.width, box.h / image.height) * clamp(zoom, 0.94, 1.38);
  const sw = box.w / scale;
  const sh = box.h / scale;
  const sx = clamp(image.width * focus.x - sw / 2, 0, Math.max(0, image.width - sw));
  const sy = clamp(image.height * focus.y - sh / 2, 0, Math.max(0, image.height - sh));
  ctx.drawImage(image, sx, sy, sw, sh, box.x, box.y, box.w, box.h);
}

function splitKeyArtTitle(title) {
  const words = upper(title || "PRIVATE ACCESS").split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [words[0] || "PRIVATE", ""];
  if (words.length === 2) return [words[0], words[1]];
  return [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")];
}

function drawDistressedField(ctx, width, height, mood) {
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.black;
  ctx.fillRect(0, 0, width, height);
  const redGlow = ctx.createRadialGradient(width * 0.16, height * 0.34, 0, width * 0.16, height * 0.34, width * 0.5);
  redGlow.addColorStop(0, "rgba(240,24,61,0.32)");
  redGlow.addColorStop(0.45, "rgba(240,24,61,0.08)");
  redGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = redGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#ffffff";
  for (let i = 0; i < 26; i += 1) {
    ctx.beginPath();
    ctx.moveTo((i * 73) % width, 0);
    ctx.lineTo(((i * 73) % width) - width * 0.22, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = mood.accent;
  for (let i = 0; i < 90; i += 1) ctx.fillRect((i * 61) % width, (i * 47) % height, 1 + (i % 6), 1 + (i % 3));
  ctx.restore();
}

async function drawLargeLogo(ctx, x, y, maxW) {
  const logo = await loadLogo();
  if (logo) {
    const w = maxW;
    const h = w * (logo.height / logo.width);
    ctx.drawImage(logo, x, y, w, h);
    return y + h;
  }
  ctx.font = font(maxW * 0.13, "Inter", 950);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.fillText("FLESHLAB", x, y + maxW * 0.12, maxW);
  return y + maxW * 0.14;
}

function drawFeatureStrip(ctx, campaign, width, height, mood) {
  const items = (campaign.badges || ["Exclusive", "On Location", "4K", "Director Cut"]).slice(0, 5).map(upper);
  const y = height * 0.88;
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(width * 0.04, y, width * 0.86, height * 0.07);
  ctx.fillStyle = mood.accent;
  ctx.fillRect(width * 0.04, y, width * 0.012, height * 0.07);
  ctx.font = font(Math.max(12, width * 0.011), "Inter", 950);
  let x = width * 0.07;
  const icons = ["▶", "◆", "◎", "✦", "▣"];
  items.forEach((item, index) => {
    ctx.fillStyle = index % 2 ? "rgba(255,255,255,0.72)" : FLESHLAB_BRAND_IDENTITY.colors.cream;
    ctx.fillText(`${icons[index]} ${item}`, x, y + height * 0.044, width * 0.18);
    x += width * 0.16;
    if (index < items.length - 1) {
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fillRect(x - width * 0.018, y + height * 0.014, 1, height * 0.04);
    }
  });
}

function drawLayerBackgroundExtension(ctx, image, width, height, plan, mood) {
  ctx.save();
  ctx.filter = "blur(26px) brightness(38%) contrast(150%) saturate(115%)";
  coverImage(ctx, image, width, height, plan.subjectFocus, plan.cropZoom * 1.08);
  ctx.restore();
  ctx.fillStyle = mood.grade;
  ctx.fillRect(0, 0, width, height);
}

function drawLayerAtmosphere(ctx, width, height, mood) {
  const haze = ctx.createRadialGradient(width * 0.62, height * 0.42, 0, width * 0.62, height * 0.42, width * 0.8);
  haze.addColorStop(0, "rgba(255,255,255,0.08)");
  haze.addColorStop(0.28, "rgba(240,24,61,0.12)");
  haze.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = mood.secondary;
  for (let i = 0; i < 120; i += 1) ctx.fillRect((i * 83) % width, (i * 41) % height, 1, 1);
  ctx.restore();
}

function drawLayerPhoto(ctx, image, width, height, plan, photo) {
  ctx.save();
  ctx.beginPath();
  if (plan.dominantSide === "RIGHT") {
    ctx.moveTo(photo.x + photo.w * 0.04, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(photo.x - width * 0.08, height);
  } else {
    ctx.moveTo(0, 0);
    ctx.lineTo(photo.w + width * 0.08, 0);
    ctx.lineTo(photo.w - photo.w * 0.04, height);
    ctx.lineTo(0, height);
  }
  ctx.closePath();
  ctx.clip();
  ctx.filter = "brightness(82%) contrast(150%) saturate(110%)";
  coverImageRect(ctx, image, photo, plan.subjectFocus, plan.cropZoom);
  ctx.restore();
}

function drawLayerSubjectMask(ctx, image, width, height, plan, photo) {
  const cx = photo.x + photo.w * (plan.subjectFocus.x > 0.5 ? 0.58 : 0.42);
  const cy = height * 0.48;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, photo.w * 0.28, height * 0.5, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = width * 0.035;
  ctx.filter = "brightness(99%) contrast(132%) saturate(108%)";
  coverImageRect(ctx, image, photo, plan.subjectFocus, plan.cropZoom);
  ctx.restore();
}

function drawLayerForegroundFx(ctx, width, height, mood, plan) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const streak = ctx.createLinearGradient(0, height * 0.15, width, height * 0.75);
  streak.addColorStop(0, "rgba(255,255,255,0)");
  streak.addColorStop(0.48, "rgba(255,255,255,0.15)");
  streak.addColorStop(0.52, "rgba(240,24,61,0.28)");
  streak.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = streak;
  ctx.translate(plan.titleZone === "LEFT" ? width * 0.08 : -width * 0.12, 0);
  ctx.rotate(plan.titleZone === "LEFT" ? -0.12 : 0.12);
  ctx.fillRect(0, height * 0.32, width * 1.15, Math.max(18, height * 0.045));
  ctx.restore();
}

async function drawFullBleedKeyArt(ctx, image, width, height, analysis, mood, campaign, format, compositionPlan) {
  const plan = compositionPlan || createCompositionPlan({ analysis, format, campaign });
  plan.layerPlan = createLayerPlan({ compositionPlan: plan, analysis, format });
  const graphic = toPx(plan.graphicZone, width, height);
  const photo = toPx(plan.photoZone, width, height);
  const titleOnLeft = plan.titleZone === "LEFT";

  drawLayerBackgroundExtension(ctx, image, width, height, plan, mood);
  drawLayerAtmosphere(ctx, width, height, mood);

  ctx.save();
  ctx.beginPath();
  if (titleOnLeft) {
    ctx.rect(0, 0, graphic.w + width * 0.14, height);
  } else {
    ctx.rect(graphic.x - width * 0.14, 0, width - graphic.x + width * 0.14, height);
  }
  ctx.clip();
  drawDistressedField(ctx, width, height, mood);
  ctx.restore();

  drawLayerPhoto(ctx, image, width, height, plan, photo);

  const blend = titleOnLeft
    ? ctx.createLinearGradient(photo.x - width * 0.1, 0, photo.x + width * 0.16, 0)
    : ctx.createLinearGradient(photo.x + photo.w - width * 0.16, 0, photo.x + photo.w + width * 0.1, 0);
  blend.addColorStop(0, titleOnLeft ? "rgba(0,0,0,1)" : "rgba(0,0,0,0)");
  blend.addColorStop(0.5, "rgba(0,0,0,0.6)");
  blend.addColorStop(1, titleOnLeft ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
  ctx.fillStyle = blend;
  ctx.fillRect(Math.min(graphic.x, photo.x), 0, Math.abs(photo.x - graphic.x) + width * 0.24, height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = mood.accent;
  ctx.translate(titleOnLeft ? width * 0.24 : width * 0.78, height * 0.23);
  ctx.rotate(titleOnLeft ? -0.13 : 0.13);
  ctx.fillRect(titleOnLeft ? -width * 0.08 : -width * 0.42, 0, width * 0.5, Math.max(10, height * 0.025));
  ctx.fillRect(titleOnLeft ? width * 0.05 : -width * 0.36, height * 0.38, width * 0.42, Math.max(7, height * 0.014));
  ctx.restore();

  const safeX = titleOnLeft ? graphic.x + width * 0.055 : graphic.x + graphic.w - width * 0.055;
  const maxTextW = graphic.w * 0.78;
  ctx.textAlign = titleOnLeft ? "left" : "right";
  const logoX = titleOnLeft ? safeX : safeX - Math.min(width * 0.28, maxTextW);
  const logoBottom = await drawLargeLogo(ctx, logoX, height * 0.07, Math.min(width * 0.28, maxTextW));
  const collection = upper(campaign.collection || campaign.subtitle || campaign.campaignLabel || "");
  if (collection) {
    ctx.font = font(Math.max(13, width * 0.014), "Inter", 950);
    ctx.fillStyle = mood.accent;
    if (titleOnLeft) drawTrackingText(ctx, collection, safeX, logoBottom + height * 0.065, Math.max(1.5, width * 0.002), maxTextW);
    else ctx.fillText(collection, safeX, logoBottom + height * 0.065, maxTextW);
  }

  const [primary, secondary] = splitKeyArtTitle(plan.creativeConcept?.campaignIdentity || campaign.primaryTitle || campaign.campaignTitle);
  const performerName = upper(campaign.performerName || campaign.creatorName);
  const hasMetadata = Boolean(collection || performerName || campaign.episode);
  const titleY = logoBottom + (hasMetadata ? height * 0.22 : height * 0.3);
  const primaryFit = fitText(ctx, primary, maxTextW, hasMetadata ? Math.min(height * 0.24, width * 0.16) : Math.min(height * 0.34, width * 0.22), Math.max(42, width * 0.052), 1, "Bebas Neue");
  ctx.font = font(primaryFit.size, "Bebas Neue", 900);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.strokeStyle = "rgba(0,0,0,0.88)";
  ctx.lineWidth = Math.max(3, primaryFit.size * 0.035);
  ctx.shadowColor = "rgba(240,24,61,0.5)";
  ctx.shadowBlur = primaryFit.size * 0.12;
  ctx.strokeText(primary, safeX, titleY, maxTextW);
  ctx.fillText(primary, safeX, titleY, maxTextW);

  if (secondary) {
    ctx.font = font(Math.max(primaryFit.size * 0.58, width * 0.045), "Permanent Marker", 900);
    ctx.fillStyle = mood.accent;
    ctx.strokeStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
    ctx.lineWidth = Math.max(1.5, primaryFit.size * 0.012);
    ctx.save();
    ctx.translate(titleOnLeft ? safeX + width * 0.02 : safeX - width * 0.02, titleY + primaryFit.size * 0.62);
    ctx.rotate(titleOnLeft ? -0.055 : 0.055);
    ctx.strokeText(secondary, 0, 0, maxTextW * 0.9);
    ctx.fillText(secondary, 0, 0, maxTextW * 0.9);
    ctx.restore();
  }
  ctx.shadowBlur = 0;

  drawLayerSubjectMask(ctx, image, width, height, plan, photo);

  if (performerName) {
    ctx.font = font(Math.max(14, width * 0.015), "Inter", 950);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    if (titleOnLeft) drawTrackingText(ctx, `${performerName} SOLO`, safeX, height * 0.72, Math.max(1.4, width * 0.0015), maxTextW);
    else ctx.fillText(`${performerName} SOLO`, safeX, height * 0.72, maxTextW);
  }
  ctx.textAlign = "left";

  drawLayerForegroundFx(ctx, width, height, mood, plan);
  drawFeatureStrip(ctx, campaign, width, height, mood);

  const vignette = ctx.createRadialGradient(width * 0.68, height * 0.46, height * 0.05, width * 0.68, height * 0.46, width * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.74)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  return plan;
}

async function drawLegacyPanelRenderer(ctx, image, width, height, analysis, mood, campaign, format) {
  const layout = layoutFor(format, analysis || {}, campaign || {});
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.black;
  ctx.fillRect(0, 0, width, height);
  drawBackgroundStage(ctx, image, width, height, analysis || {}, mood);
  drawTexture(ctx, width, height, mood);
  drawImageMask(ctx, image, width, height, analysis || {}, layout, mood, format);
  drawGraphicLanguage(ctx, width, height, layout, mood, format, campaign || {});
  const logoBottom = await drawLogo(ctx, width, height, layout);
  drawEditorialType(ctx, width, height, layout, mood, campaign || {}, logoBottom);
  return layout;
}

export async function renderPremiumCampaignAsset({ image, analysis, format, campaign }) {
  const mood = inferCampaignMood(campaign);
  const legacyCanvas = document.createElement("canvas");
  legacyCanvas.width = format.width;
  legacyCanvas.height = format.height;
  const legacyLayout = await drawLegacyPanelRenderer(legacyCanvas.getContext("2d"), image, format.width, format.height, analysis || {}, mood, campaign || {}, format);
  const legacyBlob = await new Promise(resolve => legacyCanvas.toBlob(resolve, "image/jpeg", 0.9));

  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  const compositionPlan = createCompositionPlan({ analysis: analysis || {}, format, campaign: campaign || {} });
  await drawFullBleedKeyArt(ctx, image, format.width, format.height, analysis || {}, mood, campaign || {}, format, compositionPlan);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.93));
  return {
    format,
    filename: `${campaign.base}_${format.key}_key_art.jpg`,
    width: format.width,
    height: format.height,
    size: blob.size,
    blob,
    url: URL.createObjectURL(blob),
    legacyPreviewUrl: URL.createObjectURL(legacyBlob),
    legacyRendererLabel: "Current panel-based renderer",
    kind: "visual",
    status: "ready",
    campaignConceptId: campaign.campaignConceptId,
    brandPlan: { family: mood.label, designSystem: "FLESHLAB Creative Director Renderer", mood: mood.label, layout: { legacy: legacyLayout, compositionPlan }, graphicLanguage: "creative_director_key_art", creativeConcept: compositionPlan.creativeConcept, brandDnaRules: compositionPlan.brandDnaRules },
    compositionPlan,
    layerPlan: compositionPlan.layerPlan,
    typographyWarnings: [],
    campaignMetadata: campaign.campaignMetadata,
    downstreamStage: "Final Key Art",
    campaignComposerReady: true,
  };
}