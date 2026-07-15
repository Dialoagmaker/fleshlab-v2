const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";

function font(size, family = "Bebas Neue", weight = 900) {
  return `${weight} ${size}px "${family}", Impact, Arial, sans-serif`;
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function splitTitle(metadata = {}) {
  const raw = upper(metadata.videoTitle || metadata.title || "FLESHLAB ORIGINAL");
  const explicit = upper(metadata.optionalSubtitle || metadata.campaignName || "");
  if (raw.includes("|")) {
    const [title, subtitle] = raw.split("|").map(item => item.trim()).filter(Boolean);
    return { title: title || raw, subtitle: explicit || subtitle || "" };
  }
  return { title: raw, subtitle: explicit };
}

function coverCrop(image, crop, ctx, width, height, dx = 0, dy = 0, scale = 1) {
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, dx, dy, width * scale, height * scale);
}

function titleLines(ctx, text, maxWidth, startSize, family = "Bebas Neue", maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  for (let size = startSize; size > startSize * 0.42; size -= 4) {
    ctx.font = font(size, family, 900);
    const lines = [];
    let current = "";
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (!current || ctx.measureText(next).width <= maxWidth) current = next;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) return { lines, size, lineHeight: size * 0.78 };
  }
  return { lines: [text], size: startSize * 0.48, lineHeight: startSize * 0.38 };
}

let logoPromise;
function logo() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = OFFICIAL_LOGO_URL;
    });
  }
  return logoPromise;
}

async function drawLogo(ctx, x, y, w, accent = true) {
  const img = await logo();
  const h = w * (img.height / img.width);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = w * 0.08;
  ctx.drawImage(img, x, y, w, h);
  if (accent) {
    ctx.fillStyle = "rgba(208,0,18,0.85)";
    ctx.fillRect(x, y + h + w * 0.08, w * 0.65, Math.max(2, w * 0.018));
  }
  ctx.restore();
  return h;
}

function sellingPoints(settings) {
  return String(settings?.sellingPoints || "REAL MOMENTS\nRAW CHEMISTRY\nAMATEUR WINS")
    .split(/\n+/)
    .map(item => item.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);
}

function drawFooter(ctx, width, height, settings, color = "rgba(255,255,255,0.62)") {
  let x = width * 0.055;
  const y = height * 0.925;
  ctx.save();
  ctx.font = font(width * 0.014, "Bebas Neue", 400);
  sellingPoints(settings).forEach(text => {
    ctx.fillStyle = "rgba(208,0,18,0.9)";
    ctx.fillRect(x, y - width * 0.011, width * 0.008, width * 0.008);
    ctx.fillStyle = color;
    ctx.fillText(text, x + width * 0.014, y);
    x += ctx.measureText(text).width + width * 0.045;
  });
  ctx.restore();
}

function heroBox(image, analysis, crop, width, height) {
  const hero = analysis.subjectBox || { x: 0.5, y: 0.14, w: 0.36, h: 0.72 };
  return {
    x: ((hero.x * image.width - crop.sx) / crop.sw) * width,
    y: ((hero.y * image.height - crop.sy) / crop.sh) * height,
    w: (hero.w * image.width / crop.sw) * width,
    h: (hero.h * image.height / crop.sh) * height,
  };
}

async function netflixDrama(canvas, image, plan, settings, width, height) {
  const ctx = canvas.getContext("2d");
  const { title, subtitle } = splitTitle(plan.campaign || plan.metadata);
  const hero = heroBox(image, plan.analysis, plan.selected.crop, width, height);
  ctx.fillStyle = "#050406";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.filter = "brightness(72%) contrast(112%) saturate(90%)";
  coverCrop(image, plan.selected.crop, ctx, width, height);
  ctx.restore();
  const leftShade = ctx.createLinearGradient(0, 0, width, 0);
  leftShade.addColorStop(0, "rgba(0,0,0,0.92)");
  leftShade.addColorStop(0.42, "rgba(0,0,0,0.36)");
  leftShade.addColorStop(1, "rgba(0,0,0,0.64)");
  ctx.fillStyle = leftShade;
  ctx.fillRect(0, 0, width, height);
  const faceGlow = ctx.createRadialGradient(hero.x + hero.w * 0.45, hero.y + hero.h * 0.18, 0, hero.x + hero.w * 0.45, hero.y + hero.h * 0.18, hero.h * 0.72);
  faceGlow.addColorStop(0, "rgba(255,218,180,0.24)");
  faceGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = faceGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "rgba(208,0,18,0.45)";
  ctx.fillRect(width * 0.055, height * 0.16, width * 0.006, height * 0.54);
  ctx.globalAlpha = 1;
  await drawLogo(ctx, width * 0.055, height * 0.07, width * 0.13, false);
  const block = titleLines(ctx, title, width * 0.42, width * 0.094, "Bebas Neue", 3);
  let y = height * 0.58;
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = width * 0.018;
  ctx.fillStyle = "rgba(255,250,244,0.92)";
  ctx.font = font(block.size, "Bebas Neue", 900);
  block.lines.forEach(line => { ctx.fillText(line, width * 0.055, y); y += block.lineHeight; });
  if (subtitle) {
    ctx.font = font(width * 0.022, "Inter", 800);
    ctx.fillStyle = "rgba(255,255,255,0.56)";
    ctx.fillText(subtitle, width * 0.058, y + height * 0.018);
  }
  drawFooter(ctx, width, height, settings, "rgba(255,255,255,0.46)");
  return { logoHeight: width * 0.05 };
}

async function aaaGameCover(canvas, image, plan, settings, width, height) {
  const ctx = canvas.getContext("2d");
  const { title, subtitle } = splitTitle(plan.campaign || plan.metadata);
  const crop = plan.selected.crop;
  ctx.fillStyle = "#020000";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.filter = "brightness(86%) contrast(150%) saturate(125%)";
  coverCrop(image, crop, ctx, width, height, -width * 0.03, -height * 0.03, 1.08);
  ctx.restore();
  const explosion = ctx.createRadialGradient(width * 0.52, height * 0.42, 0, width * 0.52, height * 0.42, width * 0.72);
  explosion.addColorStop(0, "rgba(255,255,255,0.16)");
  explosion.addColorStop(0.22, "rgba(208,0,18,0.34)");
  explosion.addColorStop(1, "rgba(0,0,0,0.84)");
  ctx.fillStyle = explosion;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 9; i += 1) {
    ctx.strokeStyle = i % 2 ? "rgba(255,255,255,0.14)" : "rgba(255,25,42,0.28)";
    ctx.lineWidth = width * (0.006 + i * 0.001);
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.45);
    ctx.lineTo(width * (((i * 17) % 100) / 100), height * (((i * 31) % 100) / 100));
    ctx.stroke();
  }
  for (let i = 0; i < 140; i += 1) {
    ctx.fillStyle = i % 4 ? "rgba(255,255,255,0.28)" : "rgba(255,0,24,0.48)";
    ctx.fillRect(width * (((i * 41) % 100) / 100), height * (((i * 73) % 100) / 100), width * 0.002, width * 0.002);
  }
  ctx.restore();
  await drawLogo(ctx, width * 0.055, height * 0.055, width * 0.16, true);
  const block = titleLines(ctx, title, width * 0.72, width * 0.17, "Bebas Neue", 2);
  let y = height * 0.66;
  ctx.shadowColor = "rgba(255,0,28,0.65)";
  ctx.shadowBlur = width * 0.028;
  ctx.lineWidth = width * 0.006;
  ctx.strokeStyle = "rgba(0,0,0,0.88)";
  ctx.fillStyle = "#fff7ef";
  ctx.font = font(block.size, "Bebas Neue", 900);
  block.lines.forEach(line => { ctx.strokeText(line, width * 0.055, y); ctx.fillText(line, width * 0.055, y); y += block.lineHeight; });
  if (subtitle) {
    ctx.font = font(width * 0.038, "Permanent Marker", 900);
    ctx.fillStyle = "#d00012";
    ctx.fillText(subtitle, width * 0.08, y + height * 0.02);
  }
  drawFooter(ctx, width, height, settings, "rgba(255,255,255,0.7)");
  return { logoHeight: width * 0.06 };
}

async function luxuryMagazine(canvas, image, plan, settings, width, height) {
  const ctx = canvas.getContext("2d");
  const { title, subtitle } = splitTitle(plan.campaign || plan.metadata);
  ctx.fillStyle = "#e8dfd2";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0b0908";
  ctx.fillRect(width * 0.08, height * 0.08, width * 0.5, height * 0.82);
  ctx.save();
  ctx.beginPath();
  ctx.rect(width * 0.1, height * 0.1, width * 0.46, height * 0.78);
  ctx.clip();
  ctx.filter = "brightness(94%) contrast(96%) saturate(74%)";
  coverCrop(image, plan.selected.crop, ctx, width * 0.46, height * 0.78, width * 0.1, height * 0.1, 1);
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(width * 0.62, height * 0.13, width * 0.3, height * 0.7);
  await drawLogo(ctx, width * 0.66, height * 0.08, width * 0.16, false);
  ctx.fillStyle = "#17110d";
  ctx.font = font(width * 0.024, "Inter", 900);
  ctx.fillText("FLESHLAB EDITORIAL", width * 0.66, height * 0.22);
  const block = titleLines(ctx, title, width * 0.28, width * 0.062, "Inter", 5);
  let y = height * 0.34;
  ctx.font = font(block.size, "Inter", 900);
  block.lines.forEach(line => { ctx.fillText(line, width * 0.66, y); y += block.lineHeight * 1.08; });
  if (subtitle) {
    ctx.font = font(width * 0.022, "Inter", 500);
    ctx.fillStyle = "rgba(23,17,13,0.62)";
    ctx.fillText(subtitle, width * 0.66, y + height * 0.04);
  }
  ctx.fillStyle = "#d00012";
  ctx.fillRect(width * 0.66, height * 0.77, width * 0.12, 2);
  ctx.font = font(width * 0.014, "Inter", 800);
  ctx.fillStyle = "rgba(23,17,13,0.62)";
  sellingPoints(settings).forEach((point, index) => ctx.fillText(point, width * 0.66, height * (0.82 + index * 0.032)));
  return { logoHeight: width * 0.055 };
}

async function commercialAdvertising(canvas, image, plan, settings, width, height) {
  const ctx = canvas.getContext("2d");
  const { title, subtitle } = splitTitle(plan.campaign || plan.metadata);
  ctx.fillStyle = "#f6f4ef";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, width * 0.38, height);
  ctx.fillStyle = "#d00012";
  ctx.fillRect(width * 0.38, 0, width * 0.018, height);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(width * 0.46, height * 0.11, width * 0.45, height * 0.62, width * 0.018);
  ctx.clip();
  ctx.filter = "brightness(100%) contrast(105%) saturate(92%)";
  coverCrop(image, plan.selected.crop, ctx, width * 0.45, height * 0.62, width * 0.46, height * 0.11, 1);
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.14)";
  ctx.lineWidth = 2;
  ctx.strokeRect(width * 0.46, height * 0.11, width * 0.45, height * 0.62);
  await drawLogo(ctx, width * 0.06, height * 0.07, width * 0.18, true);
  const block = titleLines(ctx, title, width * 0.28, width * 0.075, "Inter", 4);
  let y = height * 0.28;
  ctx.font = font(block.size, "Inter", 900);
  ctx.fillStyle = "#fff";
  block.lines.forEach(line => { ctx.fillText(line, width * 0.06, y); y += block.lineHeight * 1.04; });
  if (subtitle) {
    ctx.font = font(width * 0.022, "Inter", 800);
    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.fillText(subtitle, width * 0.06, y + height * 0.025);
  }
  ctx.fillStyle = "#d00012";
  ctx.beginPath();
  ctx.roundRect(width * 0.06, height * 0.72, width * 0.22, height * 0.058, height * 0.029);
  ctx.fill();
  ctx.font = font(width * 0.019, "Inter", 900);
  ctx.fillStyle = "#fff";
  ctx.fillText("WATCH NOW", width * 0.088, height * 0.758);
  ctx.font = font(width * 0.014, "Inter", 800);
  ctx.fillStyle = "rgba(10,10,10,0.68)";
  sellingPoints(settings).forEach((point, index) => ctx.fillText(point, width * 0.47 + index * width * 0.15, height * 0.82));
  return { logoHeight: width * 0.07 };
}

async function cinemaPoster(canvas, image, plan, settings, width, height) {
  const ctx = canvas.getContext("2d");
  const { title, subtitle } = splitTitle(plan.campaign || plan.metadata);
  ctx.fillStyle = "#030303";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.filter = "brightness(82%) contrast(130%) saturate(86%)";
  coverCrop(image, plan.selected.crop, ctx, width, height);
  ctx.restore();
  const arch = ctx.createRadialGradient(width * 0.5, height * 0.42, width * 0.1, width * 0.5, height * 0.42, width * 0.62);
  arch.addColorStop(0, "rgba(255,255,255,0.08)");
  arch.addColorStop(0.45, "rgba(208,0,18,0.2)");
  arch.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = arch;
  ctx.fillRect(0, 0, width, height);
  await drawLogo(ctx, width * 0.055, height * 0.055, width * 0.15, true);
  const block = titleLines(ctx, title, width * 0.72, width * 0.12, "Bebas Neue", 2);
  let y = height * 0.72;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.92)";
  ctx.shadowBlur = width * 0.02;
  ctx.font = font(block.size, "Bebas Neue", 900);
  ctx.fillStyle = "#f5eee4";
  block.lines.forEach(line => { ctx.fillText(line, width * 0.5, y); y += block.lineHeight; });
  if (subtitle) {
    ctx.font = font(width * 0.026, "Inter", 800);
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.fillText(subtitle, width * 0.5, y + height * 0.02);
  }
  ctx.textAlign = "left";
  drawFooter(ctx, width, height, settings, "rgba(255,255,255,0.5)");
  return { logoHeight: width * 0.06 };
}

export async function paintCommercialVisualSystem(canvas, image, plan, settings, width, height) {
  canvas.width = width;
  canvas.height = height;
  const id = plan.philosophy?.id || plan.selected?.variant;
  if (id === "netflix-drama") return await netflixDrama(canvas, image, plan, settings, width, height);
  if (id === "aaa-game-cover" || id === "premium-streaming-thumbnail") return await aaaGameCover(canvas, image, plan, settings, width, height);
  if (id === "luxury-magazine" || id === "editorial-fashion" || id === "lifestyle-campaign") return await luxuryMagazine(canvas, image, plan, settings, width, height);
  if (id === "commercial-advertising") return await commercialAdvertising(canvas, image, plan, settings, width, height);
  return await cinemaPoster(canvas, image, plan, settings, width, height);
}