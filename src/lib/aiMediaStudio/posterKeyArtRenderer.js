import { blobToCanvasImage, canvasToBlob, getCoverDimensions } from './coverRenderer';
import { analyzePosterImage } from './posterAnalysis';
import { getPosterFamilySearchSpace } from './posterFamilies';
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

function cropCover(image, width, height, subjectBox = {}, mode = 'hero', zoom = 1) {
  const outputAspect = width / height;
  const sourceAspect = image.width / image.height;
  let sw = image.width;
  let sh = image.height;
  if (sourceAspect > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;
  sw = Math.max(1, sw / zoom);
  sh = Math.max(1, sh / zoom);
  const cx = ((subjectBox.x || 0.35) + (subjectBox.w || 0.3) / 2) * image.width;
  const cy = ((subjectBox.y || 0.22) + (subjectBox.h || 0.56) / 2) * image.height;
  const bias = mode === 'title' ? 0.08 : mode === 'environment' ? -0.08 : 0;
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

function compositionZone(composition, subject, dominant) {
  const subjectCenter = subject.x + subject.w / 2;
  const leftOpen = subjectCenter > 0.5;
  const baseX = leftOpen ? 0.055 : 0.57;
  const baseW = leftOpen ? 0.42 : 0.38;
  const zones = {
    anchor: { x: baseX, y: dominant === 'main_title' ? 0.34 : 0.47, w: baseW, h: 0.36, align: 'left' },
    close_hero: { x: leftOpen ? 0.055 : 0.6, y: subject.y > 0.42 ? 0.08 : 0.6, w: leftOpen ? 0.4 : 0.34, h: 0.28, align: 'left' },
    floating: { x: leftOpen ? 0.08 : 0.52, y: 0.18, w: 0.4, h: 0.32, align: 'left' },
    lower: { x: 0.07, y: 0.62, w: 0.55, h: 0.26, align: 'left' },
    brand_hero: { x: leftOpen ? 0.06 : 0.58, y: 0.42, w: leftOpen ? 0.42 : 0.35, h: 0.34, align: 'left' },
    minimal: { x: 0.08, y: 0.72, w: 0.44, h: 0.18, align: 'left' },
    editorial: { x: 0.055, y: 0.1, w: 0.48, h: 0.48, align: 'left' },
    premium: { x: leftOpen ? 0.07 : 0.56, y: 0.52, w: 0.38, h: 0.24, align: 'left' },
    action: { x: leftOpen ? 0.06 : 0.55, y: 0.31, w: 0.45, h: 0.38, align: 'left' },
    emotional: { x: leftOpen ? 0.07 : 0.55, y: 0.58, w: 0.38, h: 0.24, align: 'left' },
  };
  return zones[composition] || zones.anchor;
}

function buildLayout(analysis, artDirection, composition, width, height, posterFamily = {}) {
  const subject = analysis.subjectBox || { x: 0.34, y: 0.18, w: 0.32, h: 0.64 };
  const dominant = artDirection.visual_priority?.dominant_element || posterFamily.dominantElement || 'hero_performer';
  let textZone = compositionZone(composition, subject, dominant);
  if (overlaps(textZone, subject) && !['commercial-thumbnail', 'editorial-poster'].includes(posterFamily.id)) {
    textZone = compositionZone(subject.y > 0.38 ? 'floating' : 'lower', subject, dominant);
  }
  const familyZoom = posterFamily.cropZoom || 1;
  const compositionZoom = composition === 'close_hero' ? 1.08 : composition === 'brand_hero' ? 1.04 : composition === 'minimal' ? 0.96 : 1;
  const logoWidth = posterFamily.id === 'commercial-thumbnail' ? 0.16 : posterFamily.id === 'minimal-poster' ? 0.105 : clamp(width > height ? 0.13 : 0.145, 0.11, 0.16);
  return {
    cropMode: dominant === 'environment' ? 'environment' : dominant === 'main_title' ? 'title' : 'hero',
    cropZoom: familyZoom * compositionZoom,
    subjectBox: subject,
    textZone,
    logo: { x: textZone.x, y: Math.max(0.045, textZone.y - 0.13), w: logoWidth },
    footer: { x: textZone.x, y: 0.94, w: 0.72 },
    visualConcept: posterFamily,
    composition,
    protectedZones: ['eyes', 'face', 'head', 'chest', 'torso', 'tattoos', 'hands', 'body silhouette'],
  };
}

function scoreCandidate(layout, artDirection, analysis, posterFamily = {}) {
  const subjectArea = (layout.subjectBox.w || 0.3) * (layout.subjectBox.h || 0.55);
  const collision = overlaps(layout.textZone, layout.subjectBox);
  const bias = posterFamily.scoreBias || {};
  const hero_score = clamp(Math.round(64 + subjectArea * 70 + (layout.cropZoom - 1) * 44 - (analysis.backgroundComplexity || 0.5) * 8 - (collision ? 14 : 0) + (bias.hero || 0)), 0, 100);
  const thumbnail_score = clamp(Math.round(68 + layout.logo.w * 92 - (collision ? 18 : 0) - (layout.textZone.y > 0.66 ? 3 : 0) + (bias.thumbnail || 0)), 0, 100);
  const commercial_score = clamp(Math.round(68 + (artDirection.design_review?.export_ready ? 8 : 4) + (layout.cropZoom - 1) * 22 - (analysis.backgroundComplexity || 0.5) * 4 + (bias.commercial || 0)), 0, 100);
  const impact_score = clamp(Math.round(hero_score * 0.38 + thumbnail_score * 0.27 + commercial_score * 0.35), 0, 100);
  const rejection_reasons = [];
  if (hero_score < 82) rejection_reasons.push('Hero score below target');
  if (thumbnail_score < 82) rejection_reasons.push('Thumbnail recognition below target');
  if (commercial_score < 82) rejection_reasons.push('Commercial curiosity below target');
  if (collision) rejection_reasons.push('Typography overlaps protected hero geometry');
  return { impact_score, hero_score, thumbnail_score, commercial_score, rejection_reasons };
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

function drawConceptOverlay(ctx, layout, width, height, heroX, heroY) {
  const concept = layout.visualConcept?.treatment || 'warm-hero';
  const base = ctx.createLinearGradient(0, 0, width, height);
  if (concept === 'high-click') {
    base.addColorStop(0, 'rgba(80,0,10,0.52)'); base.addColorStop(0.55, 'rgba(0,0,0,0.1)'); base.addColorStop(1, 'rgba(0,0,0,0.7)');
  } else if (concept === 'cinema-noir') {
    base.addColorStop(0, 'rgba(0,12,28,0.64)'); base.addColorStop(0.58, 'rgba(0,0,0,0.18)'); base.addColorStop(1, 'rgba(0,0,0,0.82)');
  } else if (concept === 'minimal-premium') {
    base.addColorStop(0, 'rgba(0,0,0,0.28)'); base.addColorStop(0.6, 'rgba(0,0,0,0.04)'); base.addColorStop(1, 'rgba(0,0,0,0.58)');
  } else if (concept === 'premium-gold') {
    base.addColorStop(0, 'rgba(58,36,0,0.42)'); base.addColorStop(0.48, 'rgba(0,0,0,0.08)'); base.addColorStop(1, 'rgba(0,0,0,0.66)');
  } else if (concept === 'dark-red') {
    base.addColorStop(0, 'rgba(12,0,10,0.76)'); base.addColorStop(0.48, 'rgba(0,0,0,0.2)'); base.addColorStop(1, 'rgba(60,0,12,0.78)');
  } else if (concept === 'editorial-red' || concept === 'action-red') {
    base.addColorStop(0, 'rgba(120,0,18,0.42)'); base.addColorStop(0.5, 'rgba(0,0,0,0.06)'); base.addColorStop(1, 'rgba(0,0,0,0.72)');
  } else if (concept === 'soft-emotional') {
    base.addColorStop(0, 'rgba(40,12,20,0.34)'); base.addColorStop(0.55, 'rgba(0,0,0,0.06)'); base.addColorStop(1, 'rgba(0,0,0,0.62)');
  } else {
    base.addColorStop(0, 'rgba(0,10,22,0.46)'); base.addColorStop(0.52, 'rgba(0,0,0,0.08)'); base.addColorStop(1, 'rgba(6,0,8,0.62)');
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(heroX, heroY, width * 0.12, heroX, heroY, width * 0.76);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, concept === 'minimal-premium' ? 'rgba(0,0,0,0.48)' : 'rgba(0,0,0,0.74)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  if (concept === 'action-red') {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#d00012';
    ctx.lineWidth = width * 0.012;
    ctx.beginPath();
    ctx.moveTo(width * 0.06, height * 0.86);
    ctx.lineTo(width * 0.86, height * 0.12);
    ctx.stroke();
    ctx.restore();
  }
}

function drawKeyArtImage(ctx, image, crop, layout, width, height) {
  const concept = layout.visualConcept?.treatment || 'warm-hero';
  const filterMap = {
    'high-click': 'brightness(110%) contrast(132%) saturate(122%)',
    'cinema-noir': 'brightness(92%) contrast(128%) saturate(86%)',
    documentary: 'brightness(101%) contrast(108%) saturate(82%)',
    'minimal-premium': 'brightness(98%) contrast(112%) saturate(78%)',
    'editorial-red': 'brightness(104%) contrast(126%) saturate(112%)',
    'premium-gold': 'brightness(106%) contrast(118%) saturate(104%)',
    'dark-red': 'brightness(86%) contrast(135%) saturate(96%)',
    'action-red': 'brightness(107%) contrast(138%) saturate(116%)',
    'soft-emotional': 'brightness(106%) contrast(106%) saturate(92%)',
  };
  ctx.save();
  ctx.filter = filterMap[concept] || 'brightness(104%) contrast(121%) saturate(108%)';
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();

  const subject = layout.subjectBox;
  const heroX = width * (subject.x + subject.w / 2);
  const heroY = height * (subject.y + subject.h * 0.42);
  const heroGlow = ctx.createRadialGradient(heroX, heroY, 0, heroX, heroY, width * 0.36);
  heroGlow.addColorStop(0, concept === 'premium-gold' ? 'rgba(255,214,135,0.2)' : 'rgba(255,190,145,0.18)');
  heroGlow.addColorStop(0.5, 'rgba(255,190,145,0.04)');
  heroGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = heroGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.filter = concept === 'minimal-premium' ? 'blur(14px) brightness(48%) saturate(45%)' : 'blur(10px) brightness(58%) saturate(55%)';
  ctx.globalAlpha = concept === 'high-click' ? 0.28 : 0.42;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();
  drawConceptOverlay(ctx, layout, width, height, heroX, heroY);
}

function drawAtmosphericPanel(ctx, layout, width, height) {
  const zone = layout.textZone;
  const concept = layout.visualConcept?.treatment || 'warm-hero';
  const x = width * Math.max(0, zone.x - 0.055);
  const y = height * Math.max(0, zone.y - 0.16);
  const w = width * Math.min(0.62, zone.w + 0.18);
  const h = height * Math.min(0.72, zone.h + 0.34);
  const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
  gradient.addColorStop(0, concept === 'minimal-premium' ? 'rgba(0,0,0,0.48)' : 'rgba(0,0,0,0.88)');
  gradient.addColorStop(0.64, concept === 'high-click' ? 'rgba(120,0,14,0.42)' : 'rgba(0,0,0,0.46)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);

  if (concept === 'minimal-premium' || concept === 'soft-emotional') return;
  ctx.save();
  ctx.globalAlpha = concept === 'editorial-red' ? 0.55 : 0.4;
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
  ctx.globalAlpha = layout.visualConcept?.id === 'minimal-poster' ? 0.74 : 0.92;
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = width * 0.008;
  ctx.drawImage(logo, width * layout.logo.x, height * layout.logo.y, w, h);
  ctx.restore();
}

function drawTypography(ctx, layout, metadata, artDirection, width, height) {
  const { title, brush, subtitle, performer } = splitTitle(metadata);
  const family = layout.visualConcept || {};
  const type = family.typography || {};
  const zone = layout.textZone;
  const maxWidth = width * zone.w;
  let y = height * zone.y;
  const x = width * zone.x;
  const titleSize = clamp(width * (type.titleScale || (artDirection.visual_priority.dominant_element === 'main_title' ? 0.094 : 0.072)), 52, 205);
  const brushSize = clamp(titleSize * (type.accentScale || 0.54), 28, 110);
  const subtitleSize = clamp(titleSize * 0.25, 20, 52);
  const performerSize = clamp(titleSize * 0.22, 18, 44);
  const titleLines = wrap(ctx, title, maxWidth, titleSize, type.titleFont || 'Bebas Neue', family.id === 'commercial-thumbnail' ? 2 : 3);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.94)';
  ctx.shadowBlur = width * 0.012;
  ctx.fillStyle = family.id === 'premium-poster' ? '#f6e8c8' : '#f4f1ed';
  ctx.strokeStyle = family.id === 'editorial-poster' ? 'rgba(208,0,18,0.72)' : 'rgba(0,0,0,0.62)';
  ctx.lineWidth = Math.max(2, titleSize * 0.018);
  ctx.font = font(titleSize, type.titleFont || 'Bebas Neue');
  titleLines.forEach(line => {
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
    y += titleSize * 0.78;
  });

  if (brush && family.id !== 'minimal-poster') {
    y += brushSize * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(family.id === 'action-poster' ? -6 * Math.PI / 180 : -2.5 * Math.PI / 180);
    ctx.font = font(brushSize, type.accentFont || 'Permanent Marker');
    ctx.fillStyle = family.id === 'premium-poster' ? '#d6ad5b' : '#d00012';
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

  if (family.id !== 'minimal-poster') {
    ctx.font = font(width * 0.014, 'Bebas Neue', 400);
    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.fillText('RAW CHEMISTRY   •   REAL MOMENTS   •   FLESHLAB ORIGINAL', width * layout.footer.x, height * layout.footer.y);
  }
  ctx.restore();
}

function optimizeInsideFamily(analysis, artDirection, posterFamily, width, height) {
  const options = (posterFamily.compositions || ['anchor']).map(composition => {
    const layout = buildLayout(analysis, artDirection, composition, width, height, posterFamily);
    const scores = scoreCandidate(layout, artDirection, analysis, posterFamily);
    return { composition, layout, ...scores };
  });
  return [...options].sort((a, b) => b.impact_score - a.impact_score)[0];
}

export async function generateKeyArtPlan(image, metadata, settings, width, height) {
  const analysis = await analyzePosterImage(image);
  const families = getPosterFamilySearchSpace(analysis, metadata).slice(0, 8);
  const variants = families.map((posterFamily, index) => {
    const artDirection = createPosterArtDirectionPlan({ visionAnalysis: analysis, storyAnalysis: {}, heroPerformer: metadata?.performerName, posterFamily, metadata });
    const optimized = optimizeInsideFamily(analysis, artDirection, posterFamily, width, height);
    return {
      candidate_number: index + 1,
      poster_family_id: posterFamily.id,
      poster_family_label: posterFamily.label,
      poster_family: posterFamily,
      philosophy: posterFamily.philosophy,
      variant: optimized.composition,
      layout: optimized.layout,
      artDirection,
      optimization_path: ['Poster Family', 'Composition', 'Crop', 'Typography', 'Branding', 'Micro Adjustments'],
      ...optimized,
    };
  });
  const selected = [...variants].sort((a, b) => b.impact_score - a.impact_score)[0];
  return {
    analysis,
    family: selected.poster_family,
    artDirection: selected.artDirection,
    variants,
    selected,
    winner_reason: `${selected.poster_family_label} won because that poster philosophy produced the strongest combined commercial impact before micro-layout tuning.`,
  };
}

export async function renderKeyArtToCanvas(canvas, image, plan, metadata, settings, width, height, candidate = plan.selected) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const crop = cropCover(image, width, height, candidate.layout.subjectBox, candidate.layout.cropMode, candidate.layout.cropZoom);
  drawKeyArtImage(ctx, image, crop, candidate.layout, width, height);
  drawAtmosphericPanel(ctx, candidate.layout, width, height);
  drawGrain(ctx, width, height);
  await drawLogo(ctx, candidate.layout, width, height);
  drawTypography(ctx, candidate.layout, metadata, candidate.artDirection || plan.artDirection, width, height);
  canvas.__fleshlabPosterPlan = { ...plan, renderedCandidate: candidate };
  return { ...plan, renderedCandidate: candidate };
}

export async function renderKeyArtCoverToCanvas(canvas, frameBlob, metadata, settings) {
  const dims = getCoverDimensions(settings);
  const image = await blobToCanvasImage(frameBlob);
  const plan = await generateKeyArtPlan(image, metadata, settings, dims.width, dims.height);
  await renderKeyArtToCanvas(canvas, image, plan, metadata, settings, dims.width, dims.height);
  return plan;
}

export { canvasToBlob, getCoverDimensions };