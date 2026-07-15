import { blobToCanvasImage, canvasToBlob, getCoverDimensions } from './coverRenderer';
import { analyzePosterImage } from './posterAnalysis';
import { choosePosterFamily } from './posterFamilies';
import createPosterArtDirectionPlan from './posterArtDirector';

const LOGO_URL = 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

let logoPromise;
function loadLogo() {
  if (!logoPromise) logoPromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = LOGO_URL;
  });
  return logoPromise;
}

function font(size, family = 'Bebas Neue', weight = 900) {
  return `${weight} ${size}px "${family}", Impact, Arial, sans-serif`;
}

function cropCover(image, width, height, subjectBox = {}, mode = 'hero') {
  const outputAspect = width / height;
  const sourceAspect = image.width / image.height;
  let sw = image.width;
  let sh = image.height;
  if (sourceAspect > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;

  const cx = ((subjectBox.x || 0.35) + (subjectBox.w || 0.3) / 2) * image.width;
  const cy = ((subjectBox.y || 0.22) + (subjectBox.h || 0.56) / 2) * image.height;
  const bias = mode === 'title' ? 0.08 : mode === 'environment' ? -0.04 : 0;
  return {
    sx: clamp(cx - sw * (0.48 + bias), 0, Math.max(0, image.width - sw)),
    sy: clamp(cy - sh * 0.48, 0, Math.max(0, image.height - sh)),
    sw,
    sh,
  };
}

function overlaps(a, b) {
  if (!a || !b) return false;
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

function buildLayout(analysis, artDirection, variant, width, height) {
  const subject = analysis.subjectBox || { x: 0.34, y: 0.18, w: 0.32, h: 0.64 };
  const subjectCenter = subject.x + subject.w / 2;
  const dominant = artDirection.visual_priority?.dominant_element || 'hero_performer';
  const leftOpen = subjectCenter > 0.5;
  const textX = leftOpen ? 0.055 : 0.57;
  const textW = leftOpen ? 0.42 : 0.38;
  let textZone = { x: textX, y: dominant === 'main_title' ? 0.34 : 0.47, w: textW, h: 0.36, align: 'left' };

  if (variant === 'floating') textZone = { x: leftOpen ? 0.08 : 0.52, y: 0.18, w: 0.4, h: 0.32, align: 'left' };
  if (variant === 'lower') textZone = { x: 0.07, y: 0.62, w: 0.55, h: 0.26, align: 'left' };
  if (overlaps(textZone, subject)) textZone = { x: leftOpen ? 0.055 : 0.58, y: subject.y > 0.38 ? 0.08 : 0.62, w: leftOpen ? 0.42 : 0.36, h: 0.3, align: 'left' };

  return {
    cropMode: dominant === 'environment' ? 'environment' : dominant === 'main_title' ? 'title' : 'hero',
    subjectBox: subject,
    textZone,
    logo: { x: textZone.x, y: Math.max(0.045, textZone.y - 0.13), w: clamp(width > height ? 0.13 : 0.145, 0.12, 0.15) },
    footer: { x: textZone.x, y: 0.94, w: 0.72 },
    protectedZones: ['eyes', 'face', 'head', 'chest', 'torso', 'tattoos', 'hands', 'body silhouette'],
  };
}

function scoreCandidate(layout, artDirection, analysis) {
  let score = 96;
  if (overlaps(layout.textZone, layout.subjectBox)) score -= 18;
  if ((analysis.backgroundComplexity || 0.5) > 0.72) score -= 4;
  if (!artDirection.design_review?.export_ready) score -= 3;
  if (layout.logo.w < 0.12 || layout.logo.w > 0.15) score -= 5;
  return clamp(Math.round(score), 0, 100);
}

function splitTitle(metadata = {}) {
  const title = String(metadata.videoTitle || 'FLESHLAB ORIGINAL').trim().toUpperCase();
  const brush = String(metadata.campaignName || metadata.contentType || '').trim().toUpperCase();
  const subtitle = String(metadata.optionalSubtitle || '').trim().toUpperCase();
  const performer = String(metadata.performerName || '').trim().toUpperCase();
  return { title, brush, subtitle, performer };
}

function wrap(ctx, text, maxWidth, size, family, maxLines = 3) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  ctx.font = font(size, family);
  words.forEach(word => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) current = next;
    else { lines.push(current); current = word; }
  });
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function drawKeyArtImage(ctx, image, crop, layout, width, height) {
  ctx.save();
  ctx.filter = 'brightness(104%) contrast(121%) saturate(108%)';
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();

  const subject = layout.subjectBox;
  const heroX = width * (subject.x + subject.w / 2);
  const heroY = height * (subject.y + subject.h * 0.42);
  const heroGlow = ctx.createRadialGradient(heroX, heroY, 0, heroX, heroY, width * 0.36);
  heroGlow.addColorStop(0, 'rgba(255,190,145,0.18)');
  heroGlow.addColorStop(0.5, 'rgba(255,190,145,0.04)');
  heroGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = heroGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.filter = 'blur(10px) brightness(58%) saturate(55%)';
  ctx.globalAlpha = 0.42;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();

  const cool = ctx.createLinearGradient(0, 0, width, height);
  cool.addColorStop(0, 'rgba(0,10,22,0.46)');
  cool.addColorStop(0.52, 'rgba(0,0,0,0.08)');
  cool.addColorStop(1, 'rgba(6,0,8,0.62)');
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(heroX, heroY, width * 0.12, heroX, heroY, width * 0.76);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.74)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawAtmosphericPanel(ctx, layout, width, height) {
  const zone = layout.textZone;
  const x = width * Math.max(0, zone.x - 0.055);
  const y = height * Math.max(0, zone.y - 0.16);
  const w = width * Math.min(0.58, zone.w + 0.16);
  const h = height * Math.min(0.72, zone.h + 0.34);
  const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
  gradient.addColorStop(0, 'rgba(0,0,0,0.88)');
  gradient.addColorStop(0.64, 'rgba(0,0,0,0.46)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);

  ctx.save();
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 36; i += 1) {
    const py = y + ((i * 67) % Math.max(1, h));
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(208,0,18,0.34)' : 'rgba(255,255,255,0.055)';
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x + ((i * 31) % Math.max(1, w * 0.3)), py);
    ctx.lineTo(x + w * (0.35 + (i % 7) * 0.08), py - h * 0.08);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrain(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 900; i += 1) {
    const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * width;
    const y = (Math.sin(i * 37.3) * 0.5 + 0.5) * height;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

async function drawLogo(ctx, layout, width, height) {
  const logo = await loadLogo();
  const w = width * layout.logo.w;
  const h = w * (logo.height / logo.width);
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = width * 0.008;
  ctx.drawImage(logo, width * layout.logo.x, height * layout.logo.y, w, h);
  ctx.restore();
}

function drawTypography(ctx, layout, metadata, artDirection, width, height) {
  const { title, brush, subtitle, performer } = splitTitle(metadata);
  const zone = layout.textZone;
  const maxWidth = width * zone.w;
  let y = height * zone.y;
  const x = width * zone.x;
  const titleSize = clamp(width * (artDirection.visual_priority.dominant_element === 'main_title' ? 0.094 : 0.072), 64, 188);
  const brushSize = clamp(titleSize * 0.54, 38, 102);
  const subtitleSize = clamp(titleSize * 0.25, 22, 48);
  const performerSize = clamp(titleSize * 0.22, 20, 42);
  const titleLines = wrap(ctx, title, maxWidth, titleSize, 'Bebas Neue', 3);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.94)';
  ctx.shadowBlur = width * 0.012;
  ctx.fillStyle = '#f4f1ed';
  ctx.strokeStyle = 'rgba(0,0,0,0.62)';
  ctx.lineWidth = Math.max(2, titleSize * 0.018);
  ctx.font = font(titleSize, 'Bebas Neue');
  titleLines.forEach(line => {
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
    y += titleSize * 0.78;
  });

  if (brush) {
    y += brushSize * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-2.5 * Math.PI / 180);
    ctx.font = font(brushSize, 'Permanent Marker');
    ctx.fillStyle = '#d00012';
    ctx.fillText(brush, 0, 0);
    ctx.restore();
    y += brushSize * 0.72;
  }

  if (subtitle) {
    ctx.font = font(subtitleSize, 'Inter', 800);
    ctx.fillStyle = 'rgba(244,244,244,0.82)';
    wrap(ctx, subtitle, maxWidth, subtitleSize, 'Inter', 2).forEach(line => {
      ctx.fillText(line, x, y);
      y += subtitleSize * 1.15;
    });
  }

  if (performer) {
    y += performerSize * 0.5;
    ctx.font = font(performerSize, 'Inter', 900);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillText(`STARRING ${performer}`, x, y);
  }

  ctx.font = font(width * 0.014, 'Bebas Neue', 400);
  ctx.fillStyle = 'rgba(255,255,255,0.58)';
  ctx.fillText('RAW CHEMISTRY   •   REAL MOMENTS   •   FLESHLAB ORIGINAL', width * layout.footer.x, height * layout.footer.y);
  ctx.restore();
}

export async function generateKeyArtPlan(image, metadata, settings, width, height) {
  const analysis = await analyzePosterImage(image);
  const family = choosePosterFamily(analysis, metadata);
  const artDirection = createPosterArtDirectionPlan({ visionAnalysis: analysis, storyAnalysis: {}, heroPerformer: metadata?.performerName, posterFamily: family, metadata });
  const variants = ['anchor', 'floating', 'lower'].map(variant => {
    const layout = buildLayout(analysis, artDirection, variant, width, height);
    const impact_score = scoreCandidate(layout, artDirection, analysis);
    return { variant, layout, impact_score };
  }).sort((a, b) => b.impact_score - a.impact_score);
  return { analysis, family, artDirection, variants, selected: variants.find(item => item.impact_score >= 90) || variants[0] };
}

export async function renderKeyArtToCanvas(canvas, image, plan, metadata, settings, width, height) {
  if (plan.selected.impact_score < 90) throw new Error(`Poster Impact Score ${plan.selected.impact_score}/100. v3 rejected this composition before export.`);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const crop = cropCover(image, width, height, plan.selected.layout.subjectBox, plan.selected.layout.cropMode);
  drawKeyArtImage(ctx, image, crop, plan.selected.layout, width, height);
  drawAtmosphericPanel(ctx, plan.selected.layout, width, height);
  drawGrain(ctx, width, height);
  await drawLogo(ctx, plan.selected.layout, width, height);
  drawTypography(ctx, plan.selected.layout, metadata, plan.artDirection, width, height);
  canvas.__fleshlabPosterPlan = plan;
  return plan;
}

export async function renderKeyArtCoverToCanvas(canvas, frameBlob, metadata, settings) {
  const dims = getCoverDimensions(settings);
  const image = await blobToCanvasImage(frameBlob);
  const plan = await generateKeyArtPlan(image, metadata, settings, dims.width, dims.height);
  await renderKeyArtToCanvas(canvas, image, plan, metadata, settings, dims.width, dims.height);
  return plan;
}

export { canvasToBlob, getCoverDimensions };