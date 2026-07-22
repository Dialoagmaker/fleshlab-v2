import { FLESHLAB_BRAND_IDENTITY } from "@/lib/aiMediaStudio/brandIdentityEngine";

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

function inferCampaignMood(campaign = {}) {
  const text = `${campaign.campaignTitle || ""} ${campaign.subtitle || ""} ${campaign.campaignLabel || ""} ${campaign.releaseName || ""} ${campaign.seriesName || ""}`.toLowerCase();
  if (/behind|bts|backstage/.test(text)) return MOODS.behind;
  if (/exclusive|release|premiere|ppv/.test(text)) return MOODS.exclusive;
  if (/travel|city|journey|location|manila|taipei|tokyo|bangkok/.test(text)) return MOODS.travel;
  if (/summer|sun|heat/.test(text)) return MOODS.summer;
  if (/night|club|after dark|neon/.test(text)) return MOODS.nightlife;
  if (/hotel|room|suite|check-in|check in/.test(text)) return MOODS.hotel;
  if (/beach|island|ocean|pool/.test(text)) return MOODS.beach;
  if (/fitness|gym|body|motion|training/.test(text)) return MOODS.fitness;
  if (/studio|lab|original/.test(text)) return MOODS.studio;
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

function layoutFor(format, analysis) {
  const portrait = format.height > format.width;
  const ultraWide = format.width / format.height > 2.2;
  const subjectSide = analysis.subjectSide || "center";
  if (portrait) return { image: { x: 0.07, y: 0.07, w: 0.86, h: 0.56 }, panel: { x: 0.08, y: 0.56, w: 0.84, h: 0.36 }, textAlign: "center", portrait: true };
  if (ultraWide) return { image: { x: 0.46, y: 0.08, w: 0.5, h: 0.84 }, panel: { x: 0.04, y: 0.12, w: 0.42, h: 0.76 }, textAlign: "left" };
  if (subjectSide === "left") return { image: { x: 0.04, y: 0.08, w: 0.58, h: 0.84 }, panel: { x: 0.57, y: 0.12, w: 0.38, h: 0.76 }, textAlign: "left" };
  return { image: { x: 0.38, y: 0.08, w: 0.58, h: 0.84 }, panel: { x: 0.05, y: 0.12, w: 0.4, h: 0.76 }, textAlign: "left" };
}

function toPx(zone, width, height) { return { x: zone.x * width, y: zone.y * height, w: zone.w * width, h: zone.h * height }; }

function drawImageMask(ctx, image, width, height, analysis, layout, mood, format) {
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
  for (let i = 0; i < 360; i += 1) {
    const x = (i * 97) % width;
    const y = (i * 53) % height;
    ctx.fillRect(x, y, 1 + (i % 3), 1);
  }
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

function drawGraphicLanguage(ctx, width, height, layout, mood, format) {
  const panel = toPx(layout.panel, width, height);
  ctx.save();
  ctx.fillStyle = mood.panel;
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
  ctx.rotate(-0.1);
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
  ctx.rotate(-0.16);
  ctx.fillRect(0, height * 0.24, width * 1.1, Math.max(18, height * 0.04));
  ctx.restore();
}

function wrap(ctx, text, maxWidth, maxLines) {
  const words = upper(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(test).width <= maxWidth) line = test;
    else { lines.push(line); line = word; }
  });
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const size = Math.ceil(words.length / maxLines);
  return Array.from({ length: maxLines }, (_, index) => words.slice(index * size, (index + 1) * size).join(" ")).filter(Boolean);
}

function fitText(ctx, text, maxWidth, start, min, lines, family = "Bebas Neue") {
  for (let size = start; size >= min; size -= Math.max(2, start * 0.045)) {
    ctx.font = font(size, family, 900);
    const wrapped = wrap(ctx, text, maxWidth, lines);
    if (wrapped.length <= lines && wrapped.every(line => ctx.measureText(line).width <= maxWidth)) return { size, lines: wrapped };
  }
  ctx.font = font(min, family, 900);
  return { size: min, lines: wrap(ctx, text, maxWidth, lines).slice(0, lines) };
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

function drawEditorialType(ctx, width, height, layout, mood, campaign, logoBottom) {
  const panel = toPx(layout.panel, width, height);
  const pad = panel.w * 0.06;
  const x = panel.x + pad;
  const maxW = panel.w - pad * 2;
  const center = layout.textAlign === "center";
  ctx.textAlign = center ? "center" : "left";
  const textX = center ? panel.x + panel.w / 2 : x;

  const title = compact(campaign.campaignTitle || "Hero Campaign");
  const theme = compact(campaign.subtitle || campaign.seriesName || mood.label);
  const performer = compact(campaign.performerName || campaign.creatorName || "Featured Creator");
  const supporting = compact(campaign.campaignLabel || campaign.releaseName || campaign.primaryCTA || mood.badge);
  const yStart = Math.max(logoBottom + height * 0.035, panel.y + panel.h * 0.21);

  ctx.font = font(Math.max(10, width * 0.009), "Inter", 950);
  ctx.fillStyle = mood.accent;
  if (center) ctx.fillText(mood.badge, textX, yStart, maxW);
  else drawTrackingText(ctx, mood.badge, x, yStart, Math.max(1, width * 0.0016), maxW);

  const titleFit = fitText(ctx, title, maxW, height > width ? width * 0.17 : width * 0.082, Math.max(32, width * 0.03), height > width ? 3 : 2);
  ctx.font = font(titleFit.size, "Bebas Neue", 900);
  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.cream;
  ctx.strokeStyle = "rgba(0,0,0,0.72)";
  ctx.lineWidth = Math.max(2, titleFit.size * 0.025);
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = titleFit.size * 0.1;
  titleFit.lines.forEach((line, index) => {
    const y = yStart + titleFit.size * 0.78 + index * titleFit.size * 0.82;
    ctx.strokeText(line, textX, y, maxW);
    ctx.fillText(line, textX, y, maxW);
  });
  ctx.shadowBlur = 0;

  const afterTitle = yStart + titleFit.size * (1 + titleFit.lines.length * 0.82) + height * 0.028;
  ctx.fillStyle = mood.accent;
  ctx.fillRect(center ? textX - maxW * 0.16 : x, afterTitle - height * 0.01, maxW * 0.32, Math.max(4, height * 0.006));

  ctx.font = font(Math.max(16, width * 0.022), "Inter", 850);
  ctx.fillStyle = mood.secondary;
  ctx.fillText(upper(theme), textX, afterTitle + height * 0.035, maxW);

  ctx.font = font(Math.max(13, width * 0.015), "Inter", 900);
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.fillText(`PERFORMER / ${upper(performer)}`, textX, afterTitle + height * 0.085, maxW);

  ctx.font = font(Math.max(10, width * 0.011), "Inter", 800);
  ctx.fillStyle = "rgba(244,241,234,0.62)";
  ctx.fillText(upper(supporting), textX, afterTitle + height * 0.125, maxW);

  if (campaign.primaryCTA) {
    const ctaH = Math.max(30, height * 0.05);
    const ctaW = Math.min(maxW, Math.max(maxW * 0.46, upper(campaign.primaryCTA).length * ctaH * 0.32));
    const ctaX = center ? textX - ctaW / 2 : x;
    const ctaY = panel.y + panel.h - ctaH - panel.h * 0.08;
    ctx.fillStyle = mood.accent;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH * 0.5);
    ctx.fill();
    ctx.font = font(ctaH * 0.34, "Inter", 950);
    ctx.fillStyle = "#fff";
    ctx.fillText(upper(campaign.primaryCTA), center ? textX : ctaX + ctaH * 0.42, ctaY + ctaH * 0.64, ctaW - ctaH * 0.84);
  }
  ctx.textAlign = "left";
}

export async function renderPremiumCampaignAsset({ image, analysis, format, campaign }) {
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  const mood = inferCampaignMood(campaign);
  const layout = layoutFor(format, analysis || {});

  ctx.fillStyle = FLESHLAB_BRAND_IDENTITY.colors.black;
  ctx.fillRect(0, 0, format.width, format.height);
  drawBackgroundStage(ctx, image, format.width, format.height, analysis || {}, mood);
  drawTexture(ctx, format.width, format.height, mood);
  drawImageMask(ctx, image, format.width, format.height, analysis || {}, layout, mood, format);
  drawGraphicLanguage(ctx, format.width, format.height, layout, mood, format);
  const logoBottom = await drawLogo(ctx, format.width, format.height, layout);
  drawEditorialType(ctx, format.width, format.height, layout, mood, campaign, logoBottom);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.93));
  return {
    format,
    filename: `${campaign.base}_${format.key}_premium.jpg`,
    width: format.width,
    height: format.height,
    size: blob.size,
    blob,
    url: URL.createObjectURL(blob),
    kind: "visual",
    status: "ready",
    brandPlan: { family: mood.label, designSystem: "FLESHLAB Premium Campaign Design System", mood: mood.label, layout },
    typographyWarnings: [],
    campaignMetadata: campaign.campaignMetadata,
    downstreamStage: "Campaign Assets",
    campaignComposerReady: true,
  };
}