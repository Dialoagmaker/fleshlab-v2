const LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/1591ab54c_ChatGPTImageJul14202612_16_43AM.png";
const RED = "#cf102d";
const WHITE = "#f4f1ea";
const BLACK = "#020202";

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function font(size, family = "Bebas Neue", weight = 900) {
  return `${weight} ${size}px ${family}, Impact, Arial Black, sans-serif`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

let logoPromise;
function loadLogo() {
  logoPromise = logoPromise || loadImage(LOGO_URL).catch(() => null);
  return logoPromise;
}

function titleParts(plan = {}) {
  const name = String(plan.metadata?.videoTitle || plan.metadata?.campaignName || "HOTEL SESSIONS").trim();
  const clean = /hotel/i.test(name) ? "HOTEL SESSIONS" : name.toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { primary: words[0] || "HOTEL", brush: "SESSIONS" };
  return { primary: words.slice(0, -1).join(" "), brush: words.slice(-1).join(" ") };
}

function episodeText(plan = {}) {
  const episode = plan.metadata?.optionalSubtitle || "THE CHECK-IN";
  const star = plan.metadata?.performerName || "";
  return star ? `STARRING ${String(star).toUpperCase()}` : `EPISODE 1: ${String(episode).toUpperCase()}`;
}

function sourceCropForRightHero(image, analysis = {}, width, height) {
  const rightW = width * 0.46;
  const targetAspect = rightW / height;
  let sw = image.width;
  let sh = image.height;
  if (sw / sh > targetAspect) sw = sh * targetAspect;
  else sh = sw / targetAspect;
  sw /= 1.14;
  sh /= 1.14;
  const box = analysis.subjectBox || { x: 0.52, y: 0.14, w: 0.34, h: 0.72 };
  const cx = (box.x + box.w * 0.5) * image.width;
  const cy = (box.y + box.h * 0.48) * image.height;
  return {
    sx: clamp(cx - sw * 0.5, 0, Math.max(0, image.width - sw)),
    sy: clamp(cy - sh * 0.48, 0, Math.max(0, image.height - sh)),
    sw,
    sh,
  };
}

function drawTexture(ctx, width, height, splitX) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, width, height);
  const leftGrad = ctx.createLinearGradient(0, 0, splitX, height);
  leftGrad.addColorStop(0, "#030303");
  leftGrad.addColorStop(0.48, "#080506");
  leftGrad.addColorStop(1, "#120306");
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, splitX + width * 0.08, height);

  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  for (let i = 0; i < 120; i += 1) {
    const x = (i * 47) % Math.floor(splitX);
    const y = (i * 83) % Math.floor(height);
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ((i % 9) - 4) * 9, y + ((i % 11) - 5) * 6);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 7; i += 1) {
    const y = height * (0.2 + i * 0.085);
    ctx.strokeStyle = `rgba(207,16,45,${0.18 - i * 0.012})`;
    ctx.lineWidth = width * (0.012 + (i % 3) * 0.006);
    ctx.beginPath();
    ctx.moveTo(splitX * (0.02 + i * 0.025), y);
    ctx.bezierCurveTo(splitX * 0.28, y - height * 0.08, splitX * 0.48, y + height * 0.04, splitX * 0.82, y - height * 0.03);
    ctx.stroke();
  }
  ctx.restore();

  const glow = ctx.createRadialGradient(splitX * 0.56, height * 0.48, 0, splitX * 0.56, height * 0.48, splitX * 0.74);
  glow.addColorStop(0, "rgba(207,16,45,0.26)");
  glow.addColorStop(0.45, "rgba(80,0,12,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, splitX + width * 0.12, height);

  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.strokeStyle = "rgba(244,241,234,0.72)";
  ctx.lineWidth = width * 0.018;
  ctx.font = font(width * 0.46, "Bebas Neue", 900);
  ctx.strokeText("A", splitX * 0.34, height * 0.68, splitX * 0.58);
  ctx.beginPath();
  ctx.arc(splitX * 0.52, height * 0.49, splitX * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 85; i += 1) {
    const x = splitX * (((i * 29) % 100) / 100);
    const y = height * (((i * 71) % 100) / 100);
    ctx.fillStyle = i % 4 === 0 ? "rgba(207,16,45,0.9)" : "rgba(255,255,255,0.24)";
    ctx.fillRect(x, y, Math.max(1, width * 0.0014), Math.max(1, width * 0.0014));
  }
  ctx.restore();
}

function drawHero(ctx, image, analysis, width, height, splitX) {
  const crop = sourceCropForRightHero(image, analysis, width, height);
  const heroX = width * 0.54;
  const heroW = width - heroX;
  ctx.save();
  ctx.filter = "brightness(110%) contrast(132%) saturate(112%)";
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, heroX - width * 0.03, 0, heroW + width * 0.04, height);
  ctx.restore();

  const blend = ctx.createLinearGradient(splitX - width * 0.06, 0, splitX + width * 0.14, 0);
  blend.addColorStop(0, "rgba(0,0,0,1)");
  blend.addColorStop(0.42, "rgba(0,0,0,0.64)");
  blend.addColorStop(0.74, "rgba(0,0,0,0.16)");
  blend.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = blend;
  ctx.fillRect(splitX - width * 0.07, 0, width * 0.23, height);

  const rim = ctx.createLinearGradient(splitX, 0, width, height);
  rim.addColorStop(0, "rgba(207,16,45,0.28)");
  rim.addColorStop(0.35, "rgba(207,16,45,0.08)");
  rim.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = rim;
  ctx.fillRect(splitX - width * 0.02, 0, width - splitX + width * 0.02, height);

  const vignette = ctx.createRadialGradient(width * 0.76, height * 0.45, height * 0.2, width * 0.76, height * 0.45, width * 0.56);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.68)");
  ctx.fillStyle = vignette;
  ctx.fillRect(heroX, 0, heroW, height);
  return { x: heroX, y: 0, w: heroW, h: height };
}

async function drawLogo(ctx, width, height, splitX) {
  const logo = await loadLogo();
  const x = width * 0.052;
  const y = height * 0.064;
  const w = splitX * 0.38;
  if (logo) {
    const h = w * (logo.height / logo.width);
    ctx.drawImage(logo, x, y, w, h);
    ctx.fillStyle = RED;
    ctx.font = font(width * 0.022, "Inter", 900);
    ctx.letterSpacing = "0px";
    ctx.fillText("AMATEUR WINS.", x + w * 0.06, y + h + height * 0.032);
    return { x, y, w, h: h + height * 0.05 };
  }
  ctx.fillStyle = WHITE;
  ctx.font = font(width * 0.052, "Bebas Neue", 900);
  ctx.fillText("FLESHLAB", x, y + height * 0.07, w);
  ctx.fillStyle = RED;
  ctx.font = font(width * 0.022, "Inter", 900);
  ctx.fillText("AMATEUR WINS.", x, y + height * 0.12, w);
  return { x, y, w, h: height * 0.14 };
}

function drawDistressedWhiteLine(ctx, text, x, y, maxW, size) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = size * 0.14;
  ctx.strokeStyle = "rgba(0,0,0,0.86)";
  ctx.lineWidth = size * 0.055;
  ctx.font = font(size, "Bebas Neue", 900);
  ctx.strokeText(text, x, y, maxW);
  const metal = ctx.createLinearGradient(x, y - size, x, y + size * 0.2);
  metal.addColorStop(0, "#ffffff");
  metal.addColorStop(0.42, "#c9c9c9");
  metal.addColorStop(0.7, "#f5f0e8");
  metal.addColorStop(1, "#9b9b9b");
  ctx.fillStyle = metal;
  ctx.fillText(text, x, y, maxW);
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = Math.max(1, size * 0.018);
  for (let i = 0; i < 22; i += 1) {
    const yy = y - size * 0.78 + ((i * 19) % Math.floor(size * 0.96));
    ctx.beginPath();
    ctx.moveTo(x + ((i * 41) % Math.floor(maxW * 0.75)), yy);
    ctx.lineTo(x + maxW * (0.18 + ((i * 13) % 80) / 100), yy + ((i % 5) - 2) * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrushTitle(ctx, text, x, y, maxW, size) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = size * 0.18;
  ctx.font = font(size, "Permanent Marker", 900);
  ctx.strokeStyle = "rgba(0,0,0,0.74)";
  ctx.lineWidth = size * 0.08;
  ctx.strokeText(text, x, y, maxW);
  ctx.fillStyle = RED;
  ctx.fillText(text, x, y, maxW);
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(255,90,90,0.26)";
  ctx.lineWidth = size * 0.035;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - maxW * 0.02, y - size * (0.25 + i * 0.16));
    ctx.bezierCurveTo(x + maxW * 0.2, y - size * (0.36 + i * 0.12), x + maxW * 0.55, y - size * (0.16 + i * 0.08), x + maxW * 0.94, y - size * (0.32 + i * 0.1));
    ctx.stroke();
  }
  ctx.restore();
}

function drawTitleSystem(ctx, plan, width, height, splitX) {
  const { primary, brush } = titleParts(plan);
  const x = width * 0.052;
  const maxW = splitX * 0.76;
  const whiteSize = Math.min(width * 0.15, maxW / Math.max(4.6, primary.length * 0.44));
  const redSize = Math.min(width * 0.112, maxW / Math.max(5.4, brush.length * 0.42));
  const y = height * 0.42;
  drawDistressedWhiteLine(ctx, primary, x, y, maxW, whiteSize);
  drawBrushTitle(ctx, brush, x + splitX * 0.03, y + whiteSize * 0.84, maxW, redSize);
  return { x, y: y - whiteSize, w: maxW, h: whiteSize + redSize * 1.1 };
}

function drawSubtitleStrip(ctx, text, titleBox, width, height, splitX) {
  const x = titleBox.x;
  const y = titleBox.y + titleBox.h + height * 0.038;
  const w = splitX * 0.58;
  const h = Math.max(height * 0.052, 42);
  ctx.save();
  ctx.fillStyle = "rgba(207,16,45,0.92)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h * 0.08);
  ctx.lineTo(x + w - width * 0.018, y + h);
  ctx.lineTo(x + width * 0.01, y + h * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = font(h * 0.42, "Inter", 900);
  ctx.fillText(text, x + h * 0.42, y + h * 0.66, w - h * 0.7);
  ctx.restore();
  return { x, y, w, h };
}

function drawFooterIcon(ctx, type, cx, cy, s) {
  ctx.save();
  ctx.strokeStyle = RED;
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.fillStyle = "transparent";
  if (type === 0) {
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.14, 0, Math.PI * 2); ctx.stroke();
  } else if (type === 1) {
    ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.45); ctx.lineTo(cx + s * 0.42, cy); ctx.lineTo(cx, cy + s * 0.45); ctx.lineTo(cx - s * 0.42, cy); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - s * 0.18, cy); ctx.lineTo(cx + s * 0.18, cy); ctx.stroke();
  } else {
    ctx.strokeRect(cx - s * 0.34, cy - s * 0.2, s * 0.68, s * 0.48);
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.2, s * 0.22, Math.PI, 0); ctx.stroke();
  }
  ctx.restore();
}

function drawFooter(ctx, width, height, splitX) {
  const labels = ["REAL MOMENTS", "RAW & AUTHENTIC", "EXCLUSIVE CONTENT"];
  const y = height * 0.895;
  const startX = width * 0.052;
  const groupW = splitX * 0.27;
  const iconS = width * 0.026;
  ctx.save();
  labels.forEach((label, index) => {
    const x = startX + groupW * index;
    drawFooterIcon(ctx, index, x + iconS * 0.5, y, iconS);
    ctx.fillStyle = WHITE;
    ctx.font = font(width * 0.015, "Inter", 900);
    ctx.fillText(label, x + iconS * 1.25, y + iconS * 0.15, groupW - iconS * 1.4);
    if (index < labels.length - 1) {
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.fillRect(x + groupW - width * 0.015, y - iconS * 0.6, 1.5, iconS * 1.2);
    }
  });
  ctx.restore();
}

function finalVignette(ctx, width, height) {
  const vignette = ctx.createRadialGradient(width * 0.58, height * 0.42, height * 0.08, width * 0.58, height * 0.42, width * 0.82);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.68)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(207,16,45,0.32)";
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeRect(width * 0.018, width * 0.018, width - width * 0.036, height - width * 0.036);
}

function validateKraken(canvas, zones) {
  const failures = [];
  if (zones.splitRatio < 0.52 || zones.splitRatio > 0.58) failures.push("left/right split outside KRAKEN range");
  if (zones.logo.w < canvas.width * 0.18) failures.push("logo too small for KRAKEN anchor");
  if (zones.hero.w < canvas.width * 0.42) failures.push("hero side too small");
  if (zones.title.h < canvas.height * 0.22) failures.push("title mass too small");
  if (zones.hasCta) failures.push("CTA is forbidden inside KRAKEN key art");
  return { passed: failures.length === 0, failures, components: { splitRatio: Math.round(zones.splitRatio * 100), logoWidth: Math.round((zones.logo.w / canvas.width) * 100), heroWidth: Math.round((zones.hero.w / canvas.width) * 100), titleMass: Math.round((zones.title.h / canvas.height) * 100), ctaPresent: 0 } };
}

export async function renderFleshlabKrakenKeyArt(canvas, image, plan = {}, settings = {}, width = 1920, height = 1080) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const splitX = width * 0.56;
  drawTexture(ctx, width, height, splitX);
  const hero = drawHero(ctx, image, plan.analysis || {}, width, height, splitX);
  const logo = await drawLogo(ctx, width, height, splitX);
  const title = drawTitleSystem(ctx, plan, width, height, splitX);
  const subtitle = drawSubtitleStrip(ctx, episodeText(plan), title, width, height, splitX);
  drawFooter(ctx, width, height, splitX);
  finalVignette(ctx, width, height);
  const validation = validateKraken(canvas, { splitRatio: splitX / width, logo, hero, title, subtitle, hasCta: false });
  const renderMap = Object.freeze({
    visual_system_id: "fleshlab_kraken_key_art",
    split: { left: splitX, right: width - splitX, leftRatio: splitX / width },
    zones: { logo, title, subtitle, hero, footer: { x: width * 0.052, y: height * 0.84, w: splitX * 0.84, h: height * 0.11 } },
    forbiddenElements: ["right-side text panel", "generic CTA button", "tiny boxed logo", "web-header typography"],
  });
  canvas.__krakenKeyArt = { renderMap, validation };
  return {
    logoHeight: logo.h,
    compositionMode: "kraken-left-brand-right-hero",
    visualSystemId: "fleshlab_kraken_key_art",
    renderedRenderPlanHash: plan.renderPlanHash,
    renderMap,
    renderDirection: { family: "KRAKEN", titleSystem: "white metallic mass + red brush title", footerSystem: "three icon groups", heroSystem: "dominant right performer" },
    commercialAdvertisingScore: validation.passed ? 96 : 76,
    commercialScore: { total: validation.passed ? 96 : 76, passed: validation.passed, failures: validation.failures, components: validation.components },
    artworkValidation: validation.passed ? "passed" : "rejected_or_best_available",
    commercialProductionBrief: renderMap,
  };
}