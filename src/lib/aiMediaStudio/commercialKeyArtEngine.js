import { analyzePosterImage } from "./posterAnalysis";
import { inferGraphicLanguage } from "./graphicLanguage";
import { paintCommercialVisualSystem } from "./commercialVisualSystems";
import { createCommercialCampaign } from "./commercialCreativeDirector";

const ENGINE_NAME = "Commercial Key Art Engine";
const TARGET_POSTER_IMPACT = 84;
const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";

const COMMERCIAL_PHILOSOPHIES = [
  { id: "netflix-drama", label: "Netflix Drama", geometry: "fractured-spotlight", titleSide: "left", heroBias: 0.62, titleScale: 1.04, logo: "under-title", graphicRatio: 0.64, depth: 0.78, titleDominance: 0.72, brand: 0.76, believability: 0.79 },
  { id: "aaa-game-cover", label: "AAA Game Cover", geometry: "impact-vortex", titleSide: "bottom-left", heroBias: 0.5, titleScale: 1.16, logo: "top-left", graphicRatio: 0.7, depth: 0.9, titleDominance: 0.82, brand: 0.78, believability: 0.84 },
  { id: "cinema-poster", label: "Cinema Poster", geometry: "monumental-arc", titleSide: "bottom", heroBias: 0.54, titleScale: 1.1, logo: "top-left", graphicRatio: 0.68, depth: 0.86, titleDominance: 0.8, brand: 0.82, believability: 0.86 },
  { id: "luxury-magazine", label: "Luxury Magazine", geometry: "editorial-frame", titleSide: "right", heroBias: 0.46, titleScale: 0.9, logo: "top-right", graphicRatio: 0.61, depth: 0.74, titleDominance: 0.64, brand: 0.86, believability: 0.82 },
  { id: "premium-streaming-thumbnail", label: "Premium Streaming Thumbnail", geometry: "thumbnail-burst", titleSide: "left", heroBias: 0.64, titleScale: 1.18, logo: "under-title", graphicRatio: 0.72, depth: 0.88, titleDominance: 0.88, brand: 0.84, believability: 0.9 },
  { id: "sports-documentary", label: "Sports Documentary", geometry: "documentary-motion", titleSide: "bottom-left", heroBias: 0.58, titleScale: 1, logo: "top-left", graphicRatio: 0.66, depth: 0.82, titleDominance: 0.74, brand: 0.78, believability: 0.83 },
  { id: "cinematic-character-poster", label: "Cinematic Character Poster", geometry: "character-shrine", titleSide: "bottom", heroBias: 0.5, titleScale: 1.06, logo: "top-left", graphicRatio: 0.65, depth: 0.9, titleDominance: 0.78, brand: 0.8, believability: 0.87 },
  { id: "lifestyle-campaign", label: "Lifestyle Campaign", geometry: "campaign-diagonal", titleSide: "right", heroBias: 0.44, titleScale: 0.88, logo: "top-right", graphicRatio: 0.62, depth: 0.76, titleDominance: 0.66, brand: 0.82, believability: 0.8 },
  { id: "editorial-fashion", label: "Editorial Fashion", geometry: "fashion-negative-space", titleSide: "right", heroBias: 0.48, titleScale: 0.82, logo: "top-right", graphicRatio: 0.6, depth: 0.72, titleDominance: 0.58, brand: 0.88, believability: 0.81 },
  { id: "commercial-advertising", label: "Commercial Advertising", geometry: "ad-system", titleSide: "left", heroBias: 0.6, titleScale: 1.08, logo: "under-title", graphicRatio: 0.74, depth: 0.86, titleDominance: 0.86, brand: 0.92, believability: 0.92 },
];

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

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

function sellingPoints(settings) {
  const lines = String(settings?.sellingPoints || "")
    .split(/\n+/)
    .map(line => line.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);
  return lines.length ? lines : ["REAL MOMENTS", "RAW CHEMISTRY", "AMATEUR WINS"];
}

function toneFor(language = {}) {
  if (language.atmosphere === "soft-bloom") return { core: "214,173,91", hot: "255,224,168", cold: "34,24,12" };
  if (language.atmosphere === "documentary-air") return { core: "230,235,244", hot: "255,255,255", cold: "18,24,34" };
  if (language.atmosphere === "warm-haze") return { core: "236,146,72", hot: "255,196,124", cold: "30,15,10" };
  return { core: "208,0,18", hot: "255,55,70", cold: "8,0,3" };
}

let logoPromise;
function loadLogo() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = OFFICIAL_LOGO_URL;
    });
  }
  return logoPromise;
}

function rejectionActions(failures) {
  const actions = [];
  failures.forEach(reason => {
    if (/screenshot/i.test(reason)) actions.push("Throw away layout; increase graphic design ratio and rebuild background as artwork.");
    if (/title/i.test(reason)) actions.push("Increase title dominance and make typography architectural, not decorative.");
    if (/hero/i.test(reason)) actions.push("Rebuild crop around a larger hero silhouette.");
    if (/flat|depth/i.test(reason)) actions.push("Increase depth: stronger rim light, foreground particles, and separated planes.");
    if (/brand/i.test(reason)) actions.push("Move brand anchor into the composition instead of floating it.");
    if (/empty/i.test(reason)) actions.push("Change composition to remove dead negative space.");
    if (/template/i.test(reason)) actions.push("Change poster philosophy completely.");
    if (/commercial|premium|threshold|believable/i.test(reason)) actions.push("Reject concept and restart with a different commercial philosophy.");
  });
  return [...new Set(actions.length ? actions : ["Reject concept and restart from a different commercial philosophy."])];
}

function buildDirectedLanguage(baseLanguage, philosophy, attemptIndex) {
  return {
    ...baseLanguage,
    activePhilosophy: philosophy,
    strength: clamp((baseLanguage.strength || 0.62) + attemptIndex * 0.025),
    poster_density: clamp(Math.max(baseLanguage.poster_density || 0.58, philosophy.graphicRatio)),
    graphic_aggression: clamp(Math.max(baseLanguage.graphic_aggression || 0.58, philosophy.graphicRatio - 0.04)),
    redIntensity: clamp(Math.max(baseLanguage.redIntensity || 0.46, 0.52 + attemptIndex * 0.025)),
    emotional_intensity: clamp(Math.max(baseLanguage.emotional_intensity || 0.66, philosophy.depth)),
  };
}

function buildPlanScore(analysis, language, philosophy, attemptIndex) {
  const story = clamp((analysis.visualCuriosity || 0.55) * 0.16 + (analysis.emotionalPresence || 0.55) * 0.14 + (analysis.interactionStrength || 0.5) * 0.1 + language.strength * 0.24 + philosophy.believability * 0.36);
  const artDirection = clamp(0.12 + philosophy.graphicRatio * 0.28 + philosophy.depth * 0.22 + philosophy.believability * 0.2 + (analysis.subjectSeparation || 0.55) * 0.08 + attemptIndex * 0.018);
  const title = clamp(philosophy.titleDominance * 0.72 + language.strength * 0.18 + attemptIndex * 0.015);
  const hero = clamp((analysis.subjectSeparation || 0.55) * 0.46 + philosophy.depth * 0.38 + philosophy.heroBias * 0.16 + attemptIndex * 0.018);
  const brand = clamp(philosophy.brand * 0.72 + philosophy.graphicRatio * 0.18 + attemptIndex * 0.012);
  const polish = clamp(philosophy.believability * 0.5 + artDirection * 0.24 + story * 0.14 + brand * 0.12);
  const total = clamp(artDirection * 0.3 + polish * 0.24 + title * 0.14 + hero * 0.14 + philosophy.graphicRatio * 0.12 + brand * 0.06);
  const failures = [];
  if (philosophy.graphicRatio < 0.62) failures.push("Screenshot feeling: not enough graphic design reconstruction");
  if (title < 0.68) failures.push("Title too weak for commercial key art");
  if (hero < 0.7) failures.push("Hero too small or not isolated enough");
  if (philosophy.depth < 0.78) failures.push("Image too flat: insufficient depth creation");
  if (brand < 0.74) failures.push("Brand weak: identity anchor not integrated enough");
  if (polish < 0.78) failures.push("Not believable as premium streaming key art");
  if (total * 100 < TARGET_POSTER_IMPACT) failures.push("Commercial poster impact threshold not met");
  return {
    total: Math.round(total * 100),
    artDirection: Math.round(artDirection * 100),
    graphicDesignRatio: Math.round(philosophy.graphicRatio * 100),
    story: Math.round(story * 100),
    title: Math.round(title * 100),
    hero: Math.round(hero * 100),
    brand: Math.round(brand * 100),
    polish: Math.round(polish * 100),
    marketing: Math.round(polish * 100),
    imageQuality: Math.round(polish * 100),
    passesQualityGate: failures.length === 0,
    qualityFailures: failures,
    designActions: rejectionActions(failures),
  };
}

function orderedPhilosophies(metadata = {}, analysis = {}) {
  const text = `${metadata.videoTitle || ""} ${metadata.optionalSubtitle || ""} ${(metadata.tags || []).join(" ")}`.toLowerCase();
  const preferred = [];
  if (/sport|fit|gym|training|competition/.test(text)) preferred.push("sports-documentary");
  if (/luxury|fashion|model|editorial|style/.test(text)) preferred.push("luxury-magazine", "editorial-fashion");
  if (/movie|cinema|story|drama/.test(text)) preferred.push("cinema-poster", "netflix-drama");
  if ((analysis.thumbnailImpact || 0) < 0.58) preferred.push("premium-streaming-thumbnail", "aaa-game-cover");
  const seen = new Set();
  return [...preferred, ...COMMERCIAL_PHILOSOPHIES.map(item => item.id)]
    .map(id => COMMERCIAL_PHILOSOPHIES.find(item => item.id === id))
    .filter(Boolean)
    .filter(item => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

function cropForHero(image, analysis, language, width, height, settings = {}) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  const outputAspect = width / height;
  let sw = image.width;
  let sh = image.height;
  if (image.width / image.height > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;
  const hero = analysis.subjectBox || { x: 0.52, y: 0.14, w: 0.34, h: 0.72 };
  const cx = (hero.x + hero.w * 0.52) * image.width;
  const cy = (hero.y + hero.h * 0.48) * image.height;
  const zoom = clamp((Number(settings.zoom) || 1) * (1.08 + philosophy.depth * 0.18), 0.9, 1.9);
  sw /= zoom;
  sh /= zoom;
  const horizontalBias = philosophy.titleSide === "right" ? 0.42 : philosophy.titleSide === "bottom" ? 0.52 : philosophy.heroBias;
  const sx = clamp(cx - sw * horizontalBias, 0, Math.max(0, image.width - sw));
  const sy = clamp(cy - sh * 0.48, 0, Math.max(0, image.height - sh));
  return { sx, sy, sw, sh, zoom };
}

function heroOnCanvas(image, analysis, crop, width, height) {
  const hero = analysis.subjectBox || { x: 0.52, y: 0.14, w: 0.34, h: 0.72 };
  return {
    x: ((hero.x * image.width - crop.sx) / crop.sw) * width,
    y: ((hero.y * image.height - crop.sy) / crop.sh) * height,
    w: (hero.w * image.width / crop.sw) * width,
    h: (hero.h * image.height / crop.sh) * height,
  };
}

function measureLines(ctx, text, maxWidth, startSize, minSize, family, maxLines = 4) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  for (let size = startSize; size >= minSize; size -= 4) {
    ctx.font = font(size, family, 900);
    const lines = [];
    let current = "";
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (!current || ctx.measureText(next).width <= maxWidth) current = next;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) return { lines, size, lineHeight: size * 0.74 };
  }
  return { lines: [text], size: minSize, lineHeight: minSize * 0.78 };
}

function buildAttemptPlan(image, metadata, settings, width, height, analysis, baseLanguage, campaign, philosophy, attemptIndex) {
  const graphicLanguage = buildDirectedLanguage(baseLanguage, philosophy, attemptIndex);
  const crop = cropForHero(image, analysis, graphicLanguage, width, height, settings);
  const score = buildPlanScore(analysis, graphicLanguage, philosophy, attemptIndex);
  const selected = {
    engine: ENGINE_NAME,
    attempt: attemptIndex + 1,
    variant: philosophy.id,
    poster_family_id: philosophy.id,
    poster_family_label: philosophy.label,
    philosophy: `Commercial philosophy: ${philosophy.label}. Rebuild the source frame into painted marketing artwork, not a layout.`,
    impact_score: score.total,
    hero_score: score.hero,
    thumbnail_score: score.polish,
    commercial_score: score.polish,
    rejection_reasons: score.qualityFailures,
    design_actions: score.designActions,
    score,
    crop,
  };
  return {
    engine: ENGINE_NAME,
    metadata,
    campaign,
    analysis,
    graphicLanguage,
    philosophy,
    family: { id: philosophy.id, label: philosophy.label },
    visualStory: { emotionalCenter: graphicLanguage.thumbnail_priority, viewerFeeling: graphicLanguage.energy },
    artDirection: { graphicDesignRatio: philosophy.graphicRatio, pipeline: ["Frame", "Hero Isolation", "Background Reconstruction", "Depth Creation", "Atmospheric Lighting", "Commercial Color Grade", "Graphic Shapes", "Red Identity System", "Textures", "Light Effects", "Particles", "Typography", "Footer System", "Commercial Polish"] },
    selected,
    best: selected,
    variants: [selected],
    attempts: [],
    winner_reason: score.passesQualityGate ? `${philosophy.label} reached Poster Impact ${score.total}.` : `${philosophy.label} rejected: ${score.qualityFailures.join(", ")}.`,
  };
}

export async function generateCommercialKeyArtPlan(image, metadata = {}, settings = {}, width = 1920, height = 1080) {
  const analysis = await analyzePosterImage(image);
  const baseLanguage = inferGraphicLanguage(metadata, analysis);
  const campaign = createCommercialCampaign({ analysis, metadata });
  const strategies = orderedPhilosophies(metadata, analysis);
  const planned = strategies.map((philosophy, index) => buildAttemptPlan(image, metadata, settings, width, height, analysis, baseLanguage, campaign, philosophy, index));
  const selectedPlan = planned.find(plan => plan.selected.score.passesQualityGate && plan.selected.score.total >= TARGET_POSTER_IMPACT) || planned[planned.length - 1];
  return {
    ...selectedPlan,
    preparedIterations: planned,
    variants: planned.map(plan => plan.selected),
    attempts: planned.map(plan => ({ philosophy: plan.philosophy.label, score: plan.selected.score, accepted: plan.selected.score.passesQualityGate && plan.selected.score.total >= TARGET_POSTER_IMPACT, designActions: plan.selected.design_actions })),
    winner_reason: selectedPlan.selected.score.passesQualityGate ? `${selectedPlan.philosophy.label} is the first commercially believable concept.` : "No planned concept passed before render; render loop will keep iterating concepts.",
  };
}

function paintPhoto(ctx, image, crop, width, height, language) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.filter = `brightness(${Math.round((language.brightness || 1) * 82)}%) contrast(${Math.round((language.contrast || 1.1) * 112)}%) saturate(${Math.round((language.saturation || 1.05) * 92)}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();
}

function reconstructBackground(ctx, image, crop, width, height, language) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  const tone = toneFor(language);
  const aggression = language.graphic_aggression || 0.58;
  ctx.save();
  ctx.fillStyle = "#020202";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 0.24;
  ctx.filter = `blur(${Math.round(width * 0.022)}px) brightness(38%) contrast(155%) saturate(120%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, -width * 0.2, -height * 0.16, width * 1.42, height * 1.32);
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(0,0,0,0.92)";
  ctx.beginPath();
  if (philosophy.geometry === "editorial-frame" || philosophy.geometry === "fashion-negative-space") {
    ctx.rect(width * 0.03, height * 0.05, width * 0.42, height * 0.9);
  } else if (philosophy.geometry === "impact-vortex" || philosophy.geometry === "thumbnail-burst") {
    ctx.moveTo(0, 0);
    ctx.lineTo(width * 0.48, 0);
    ctx.lineTo(width * 0.32, height * 0.5);
    ctx.lineTo(width * 0.58, height);
    ctx.lineTo(0, height);
  } else if (philosophy.geometry === "character-shrine" || philosophy.geometry === "monumental-arc") {
    ctx.moveTo(0, height);
    ctx.bezierCurveTo(width * 0.2, height * 0.1, width * 0.52, height * 0.1, width * 0.76, height);
    ctx.lineTo(0, height);
  } else {
    ctx.moveTo(0, 0);
    ctx.lineTo(width * (0.42 + aggression * 0.12), 0);
    ctx.bezierCurveTo(width * 0.62, height * 0.22, width * 0.42, height * 0.72, width * 0.64, height);
    ctx.lineTo(0, height);
  }
  ctx.closePath();
  ctx.fill();

  const redField = ctx.createRadialGradient(width * (philosophy.titleSide === "right" ? 0.74 : 0.24), height * 0.45, 0, width * 0.24, height * 0.45, width * 0.56);
  redField.addColorStop(0, `rgba(${tone.core},${0.24 + (language.redIntensity || 0.46) * 0.36})`);
  redField.addColorStop(0.46, `rgba(${tone.core},0.18)`);
  redField.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = redField;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function createDepth(ctx, hero, width, height, language) {
  const tone = toneFor(language);
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  ctx.save();
  const floorShadow = ctx.createRadialGradient(hero.x + hero.w * 0.46, hero.y + hero.h * 0.88, 0, hero.x + hero.w * 0.46, hero.y + hero.h * 0.88, hero.w * (0.75 + philosophy.depth * 0.35));
  floorShadow.addColorStop(0, "rgba(0,0,0,0.78)");
  floorShadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = floorShadow;
  ctx.fillRect(0, 0, width, height);
  const rim = ctx.createRadialGradient(hero.x + hero.w * 0.3, hero.y + hero.h * 0.32, 0, hero.x + hero.w * 0.3, hero.y + hero.h * 0.32, hero.h * 0.74);
  rim.addColorStop(0, `rgba(${tone.hot},${0.18 + philosophy.depth * 0.16})`);
  rim.addColorStop(0.48, `rgba(${tone.core},0.14)`);
  rim.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function isolateHero(ctx, image, crop, hero, width, height, language) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hero.x + hero.w * 0.52, hero.y + hero.h * 0.48, hero.w * (0.66 + philosophy.depth * 0.05), hero.h * (0.54 + philosophy.depth * 0.06), 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.filter = `brightness(${Math.round(110 + philosophy.depth * 10)}%) contrast(${Math.round(128 + philosophy.graphicRatio * 22)}%) saturate(${Math.round(110 + (language.redIntensity || 0.46) * 16)}%)`;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  ctx.restore();
}

function atmosphericLighting(ctx, width, height, language) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  const tone = toneFor(language);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 5; i += 1) {
    ctx.globalAlpha = 0.1 + philosophy.depth * 0.035;
    ctx.strokeStyle = `rgba(${tone.hot},1)`;
    ctx.lineWidth = width * (0.003 + i * 0.0016);
    const rise = philosophy.geometry === "documentary-motion" ? 0.18 : 0.08;
    ctx.beginPath();
    ctx.moveTo(-width * 0.08, height * (0.2 + i * 0.11));
    ctx.bezierCurveTo(width * 0.22, height * (rise + i * 0.09), width * 0.46, height * (0.34 + i * 0.07), width * 0.86, height * (0.06 + i * 0.12));
    ctx.stroke();
  }
  const bloom = ctx.createRadialGradient(width * 0.18, height * 0.38, 0, width * 0.18, height * 0.38, width * 0.5);
  bloom.addColorStop(0, `rgba(${tone.hot},${0.16 + philosophy.depth * 0.1})`);
  bloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function graphicDesignSystem(ctx, width, height, language) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  const tone = toneFor(language);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.64)";
  ctx.beginPath();
  if (philosophy.titleSide === "right") {
    ctx.moveTo(width, 0);
    ctx.lineTo(width * 0.66, height * 0.03);
    ctx.lineTo(width * 0.77, height);
    ctx.lineTo(width, height);
  } else {
    ctx.moveTo(width * 0.02, height * 0.08);
    ctx.lineTo(width * 0.28, height * 0.02);
    ctx.lineTo(width * 0.18, height * 0.98);
    ctx.lineTo(0, height);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(${tone.core},${0.08 + philosophy.graphicRatio * 0.14})`;
  ctx.beginPath();
  ctx.moveTo(width * 0.18, 0);
  ctx.bezierCurveTo(width * 0.44, height * 0.28, width * 0.18, height * 0.72, width * 0.52, height);
  ctx.lineTo(width * 0.28, height);
  ctx.bezierCurveTo(width * 0.08, height * 0.65, width * 0.28, height * 0.24, width * 0.06, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function texturesParticles(ctx, width, height, language) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  const tone = toneFor(language);
  const density = Math.max(language.texture_density || 0.42, philosophy.graphicRatio - 0.2);
  ctx.save();
  for (let i = 0; i < Math.round(90 + density * 140); i += 1) {
    const x = width * (((i * 47 + philosophy.id.length * 7) % 100) / 100);
    const y = height * (((i * 83 + philosophy.id.length * 11) % 100) / 100);
    ctx.globalAlpha = 0.024 + density * 0.038;
    ctx.fillStyle = i % 5 === 0 ? `rgba(${tone.hot},1)` : "rgba(255,255,255,0.82)";
    ctx.fillRect(x, y, Math.max(1, width * 0.001), Math.max(1, width * 0.001));
  }
  ctx.globalAlpha = 0.1 + density * 0.12;
  ctx.strokeStyle = "rgba(255,255,255,0.76)";
  ctx.lineWidth = Math.max(1, width * 0.0008);
  for (let i = 0; i < 24; i += 1) {
    const x = width * (((i * 29) % 58) / 100);
    const y = height * (((i * 67) % 100) / 100);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width * (0.014 + (i % 4) * 0.008), y - height * (0.022 + (i % 5) * 0.01));
    ctx.stroke();
  }
  ctx.restore();
}

function typographyAnchor(width, height, philosophy) {
  if (philosophy.titleSide === "right") return { x: width * 0.55, y: height * 0.14, maxW: width * 0.38 };
  if (philosophy.titleSide === "bottom") return { x: width * 0.08, y: height * 0.58, maxW: width * 0.84 };
  if (philosophy.titleSide === "bottom-left") return { x: width * 0.055, y: height * 0.48, maxW: width * 0.62 };
  return { x: width * 0.055, y: height * 0.13, maxW: width * 0.58 };
}

function typographyLayer(ctx, width, height, metadata, language) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  const tone = toneFor(language);
  const { title, subtitle } = splitTitle(metadata);
  const anchor = typographyAnchor(width, height, philosophy);
  const startSize = width * (0.145 + philosophy.titleDominance * 0.055) * philosophy.titleScale;
  const block = measureLines(ctx, title, anchor.maxW, startSize, width * 0.06, language.titleFont || "Bebas Neue", philosophy.titleSide === "bottom" ? 2 : 4);
  let y = anchor.y;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.98)";
  ctx.shadowBlur = width * 0.022;
  ctx.strokeStyle = "rgba(0,0,0,0.84)";
  ctx.fillStyle = "#fff6ea";
  ctx.lineWidth = Math.max(5, block.size * 0.026);
  ctx.font = font(block.size, language.titleFont || "Bebas Neue", 900);
  block.lines.forEach(line => {
    ctx.strokeText(line, anchor.x, y + block.size);
    ctx.fillText(line, anchor.x, y + block.size);
    y += block.lineHeight;
  });
  const brush = subtitle || block.lines[0] || "ORIGINAL";
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = `rgba(${tone.core},0.86)`;
  ctx.font = font(Math.max(width * 0.05, block.size * 0.32), "Permanent Marker", 900);
  ctx.fillText(brush, anchor.x + width * 0.02, y - block.lineHeight * 0.1);
  ctx.restore();
  return { x: anchor.x, y: y + height * 0.03, w: anchor.maxW };
}

async function brandAnchor(ctx, anchor, width, height, language) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  const logo = await loadLogo();
  const logoW = width * (philosophy.logo === "top-right" ? 0.145 : 0.17);
  const logoH = logoW * (logo.height / logo.width);
  const x = philosophy.logo === "top-right" ? width - logoW - width * 0.055 : philosophy.logo === "top-left" ? width * 0.055 : anchor.x;
  const y = philosophy.logo === "top-right" || philosophy.logo === "top-left" ? height * 0.065 : anchor.y;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(x - width * 0.012, y - width * 0.01, logoW + width * 0.024, logoH + width * 0.02);
  ctx.fillStyle = "rgba(208,0,18,0.78)";
  ctx.fillRect(x - width * 0.012, y + logoH + width * 0.012, logoW * 0.7, Math.max(2, width * 0.003));
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = width * 0.012;
  ctx.drawImage(logo, x, y, logoW, logoH);
  ctx.restore();
  return logoH;
}

function footerSystem(ctx, width, height, settings, language) {
  const tone = toneFor(language);
  const points = sellingPoints(settings);
  let x = width * 0.055;
  const y = height * 0.925;
  ctx.save();
  ctx.font = font(width * 0.014, "Bebas Neue", 400);
  points.forEach(text => {
    ctx.fillStyle = `rgba(${tone.core},0.9)`;
    ctx.fillRect(x, y - width * 0.011, width * 0.008, width * 0.008);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.fillText(text, x + width * 0.014, y);
    x += ctx.measureText(text).width + width * 0.046;
  });
  ctx.restore();
}

function commercialPolish(ctx, width, height, language) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  ctx.save();
  const vignette = ctx.createRadialGradient(width * 0.58, height * 0.42, height * 0.1, width * 0.58, height * 0.42, width * 0.84);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${0.42 + philosophy.depth * 0.32})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = Math.max(1, width * 0.0012);
  ctx.strokeRect(width * 0.012, width * 0.012, width - width * 0.024, height - width * 0.024);
  ctx.restore();
}

async function paintCommercialPipeline(canvas, image, plan, settings, width, height) {
  const systemResult = await paintCommercialVisualSystem(canvas, image, plan, settings, width, height);
  return { ...plan, selected: { ...plan.selected, ...systemResult } };
}

function copyCanvas(source, target) {
  target.width = source.width;
  target.height = source.height;
  const ctx = target.getContext("2d");
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0);
}

export async function renderCommercialKeyArtToCanvas(canvas, image, metadata = {}, settings = {}, width = 1920, height = 1080, existingPlan = null) {
  const basePlan = existingPlan?.preparedIterations ? existingPlan : await generateCommercialKeyArtPlan(image, metadata, settings, width, height);
  const iterations = basePlan.preparedIterations || [basePlan];
  const attempts = [];
  let bestPlan = null;
  let bestCanvas = null;

  for (let index = 0; index < iterations.length; index += 1) {
    const scratch = document.createElement("canvas");
    const renderedPlan = await paintCommercialPipeline(scratch, image, iterations[index], settings, width, height);
    const accepted = renderedPlan.selected.score.passesQualityGate && renderedPlan.selected.score.total >= TARGET_POSTER_IMPACT;
    const attempt = {
      attempt: index + 1,
      philosophy: renderedPlan.philosophy.label,
      impact: renderedPlan.selected.score.total,
      accepted,
      rejectedBecause: renderedPlan.selected.score.qualityFailures,
      designActions: renderedPlan.selected.design_actions,
    };
    attempts.push(attempt);

    if (!bestPlan || renderedPlan.selected.score.total > bestPlan.selected.score.total) {
      bestPlan = renderedPlan;
      bestCanvas = scratch;
    }

    if (accepted) {
      copyCanvas(scratch, canvas);
      canvas.__fleshlabPosterPlan = { ...renderedPlan, attempts, winner_reason: `${renderedPlan.philosophy.label} accepted at Poster Impact ${renderedPlan.selected.score.total} after ${index + 1} art-direction iteration${index ? "s" : ""}.` };
      return canvas.__fleshlabPosterPlan;
    }
  }

  if (bestCanvas) copyCanvas(bestCanvas, canvas);
  const finalFailures = bestPlan?.selected?.score?.qualityFailures || ["Commercial poster impact threshold not met"];
  canvas.__fleshlabPosterPlan = { ...bestPlan, attempts, winner_reason: `Rejected after ${attempts.length} commercial philosophies: ${finalFailures.join(", ")}.` };
  throw new Error(`Commercial Key Art rejected after ${attempts.length} art-direction iterations: ${finalFailures.join(", ")}`);
}

export async function renderPosterToCanvas(canvas, image, metadata, settings, width, height) {
  return await renderCommercialKeyArtToCanvas(canvas, image, metadata, settings, width, height);
}

export async function generatePosterPlan(image, metadata, settings, width, height) {
  return await generateCommercialKeyArtPlan(image, metadata, settings, width, height);
}

export function selectPosterVariant(plan) {
  return plan?.selected || plan?.best || null;
}

export async function renderPosterVariantToCanvas(canvas, image, plan, variantPlan, settings, width, height) {
  const metadata = plan?.metadata || {};
  const commercialPlan = plan?.preparedIterations ? plan : await generateCommercialKeyArtPlan(image, metadata, settings, width, height);
  return await renderCommercialKeyArtToCanvas(canvas, image, commercialPlan.metadata, settings, width, height, commercialPlan);
}