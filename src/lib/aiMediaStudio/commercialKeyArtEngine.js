import { analyzePosterImage } from "./posterAnalysis";
import { inferGraphicLanguage } from "./graphicLanguage";
import { paintCommercialVisualSystem } from "./commercialVisualSystems";
import { createCommercialCampaign } from "./commercialCreativeDirector";

const ENGINE_NAME = "FLESHLAB Local Editorial Cover Composer v4.1";
const TARGET_COMMERCIAL_AD_SCORE = 78;
const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";

const COMMERCIAL_PHILOSOPHIES = [
  { id: "bathroom_cold_steam", label: "Cold Steam Bathroom", geometry: "editorial-frame", titleSide: "bottom-left", heroBias: 0.52, titleScale: 0.9, logo: "top-left", graphicRatio: 0.7, depth: 0.88, titleDominance: 0.78, brand: 0.9, believability: 0.9, typographyFamily: "minimal-ceramic", colorLanguage: "cold-white-steam-red", hierarchy: "atmosphere-first", logoStrategy: "quiet-authority", atmosphere: "cold-steam", visualSystemId: "environment-bathroom-cinema" },
  { id: "hotel_gold_premium", label: "Hotel Gold Premium", geometry: "monumental-arc", titleSide: "bottom", heroBias: 0.56, titleScale: 1.12, logo: "top-left", graphicRatio: 0.74, depth: 0.92, titleDominance: 0.84, brand: 0.88, believability: 0.92, typographyFamily: "cinema-title", colorLanguage: "warm-gold-black-red", hierarchy: "luxury-fantasy", logoStrategy: "studio-mark", atmosphere: "warm-haze", visualSystemId: "environment-hotel-luxury" },
  { id: "outdoor_natural_wide", label: "Natural Wide Outdoor", geometry: "documentary-motion", titleSide: "right", heroBias: 0.48, titleScale: 0.86, logo: "top-right", graphicRatio: 0.68, depth: 0.84, titleDominance: 0.72, brand: 0.84, believability: 0.9, typographyFamily: "documentary-minimal", colorLanguage: "green-natural-black-red", hierarchy: "place-first", logoStrategy: "quiet-authority", atmosphere: "natural-air", visualSystemId: "environment-outdoor-wide" },
  { id: "night_neon_contrast", label: "Night Neon Contrast", geometry: "thumbnail-burst", titleSide: "left", heroBias: 0.62, titleScale: 1.18, logo: "under-title", graphicRatio: 0.8, depth: 0.9, titleDominance: 0.88, brand: 0.82, believability: 0.86, typographyFamily: "loud-campaign", colorLanguage: "blue-neon-red-black", hierarchy: "mystery-impact", logoStrategy: "small-proof", atmosphere: "neon-night", visualSystemId: "environment-night-neon" },
  { id: "gym_industrial_steel", label: "Industrial Gym Steel", geometry: "diagonal-power", titleSide: "bottom-left", heroBias: 0.6, titleScale: 1.05, logo: "top-left", graphicRatio: 0.76, depth: 0.9, titleDominance: 0.82, brand: 0.86, believability: 0.88, typographyFamily: "compressed-industrial", colorLanguage: "steel-concrete-red", hierarchy: "body-power", logoStrategy: "studio-mark", atmosphere: "hard-steel", visualSystemId: "environment-gym-industrial" },
  { id: "a24_minimal_tension", label: "A24 Minimal Tension", geometry: "floating-offset", titleSide: "right", heroBias: 0.45, titleScale: 0.78, logo: "top-right", graphicRatio: 0.64, depth: 0.82, titleDominance: 0.7, brand: 0.9, believability: 0.92, typographyFamily: "magazine-stack", colorLanguage: "cream-black-red", hierarchy: "negative-space-story", logoStrategy: "masthead", atmosphere: "soft-bloom", visualSystemId: "a24-minimal-key-art" },
  { id: "aaa_character_cover", label: "AAA Character Cover", geometry: "center-crush", titleSide: "bottom", heroBias: 0.58, titleScale: 1.2, logo: "top-left", graphicRatio: 0.82, depth: 0.96, titleDominance: 0.9, brand: 0.86, believability: 0.88, typographyFamily: "cinema-title", colorLanguage: "cinematic-red-shadow", hierarchy: "character-first", logoStrategy: "studio-mark", atmosphere: "impact-red", visualSystemId: "aaa-character-key-art" },
  { id: "album_cover_luxury", label: "Luxury Album Cover", geometry: "floating-offset", titleSide: "bottom-left", heroBias: 0.5, titleScale: 0.92, logo: "top-left", graphicRatio: 0.7, depth: 0.86, titleDominance: 0.76, brand: 0.9, believability: 0.92, typographyFamily: "magazine-stack", colorLanguage: "luxury-black-gold-red", hierarchy: "mood-first", logoStrategy: "quiet-authority", atmosphere: "soft-bloom", visualSystemId: "luxury-album-key-art" },
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

function stableSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value) {
  const text = stableSerialize(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function automaticCandidateSettings(settings = {}) {
  return {
    formatId: settings.formatId,
    customWidth: settings.customWidth,
    customHeight: settings.customHeight,
    sellingPoints: settings.sellingPoints,
  };
}

function splitTitle(metadata = {}) {
  const raw = upper(metadata.videoTitle || metadata.title || "");
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
    activePhilosophyId: philosophy.id,
    visualSystemId: philosophy.visualSystemId,
    atmosphere: philosophy.atmosphere || baseLanguage.atmosphere,
    typographyFamily: philosophy.typographyFamily,
    colorStrategy: philosophy.colorLanguage,
    logoStrategy: philosophy.logoStrategy,
    hierarchy: philosophy.hierarchy,
    strength: clamp((baseLanguage.strength || 0.62) + attemptIndex * 0.025),
    poster_density: clamp(Math.max(baseLanguage.poster_density || 0.58, philosophy.graphicRatio)),
    graphic_aggression: clamp(Math.max(baseLanguage.graphic_aggression || 0.58, philosophy.graphicRatio - 0.04)),
    redIntensity: clamp(Math.max(baseLanguage.redIntensity || 0.46, 0.52 + attemptIndex * 0.025)),
    emotional_intensity: clamp(Math.max(baseLanguage.emotional_intensity || 0.66, philosophy.depth)),
  };
}

function buildPlanScore(analysis, language, philosophy, attemptIndex) {
  const curiosity = clamp(analysis.visualCuriosity || 0.55);
  const emotionalPresence = clamp(analysis.emotionalPresence || 0.55);
  const interaction = clamp(analysis.interactionStrength || 0.5);
  const separation = clamp(analysis.subjectSeparation || 0.55);
  const negativeSpace = clamp(analysis.negativeSpace?.score || 0.54);
  const complexity = clamp(analysis.backgroundComplexity || 0.5);
  const depth = clamp(philosophy.depth * 0.42 + philosophy.graphicRatio * 0.28 + separation * 0.2 + attemptIndex * 0.012);
  const screenshotRisk = clamp(complexity * 0.42 + (1 - depth) * 0.34 + (1 - philosophy.graphicRatio) * 0.24);
  const scrollStopPower = clamp(curiosity * 0.28 + philosophy.graphicRatio * 0.24 + depth * 0.2 + philosophy.believability * 0.18 + (1 - screenshotRisk) * 0.1);
  const premiumFeel = clamp(philosophy.believability * 0.34 + depth * 0.28 + philosophy.brand * 0.16 + negativeSpace * 0.12 + (1 - screenshotRisk) * 0.1);
  const emotionalImpact = clamp(emotionalPresence * 0.34 + curiosity * 0.25 + interaction * 0.16 + language.strength * 0.15 + philosophy.depth * 0.1);
  const heroDominance = clamp(separation * 0.42 + philosophy.heroBias * 0.24 + depth * 0.24 + attemptIndex * 0.012);
  const brandRecognition = clamp(philosophy.brand * 0.58 + philosophy.graphicRatio * 0.24 + language.strength * 0.18);
  const thumbnailReadability = clamp(heroDominance * 0.48 + scrollStopPower * 0.26 + philosophy.titleDominance * 0.16 + negativeSpace * 0.1);
  const total = clamp(
    scrollStopPower * 0.3 +
    premiumFeel * 0.2 +
    emotionalImpact * 0.15 +
    heroDominance * 0.15 +
    brandRecognition * 0.1 +
    thumbnailReadability * 0.1
  );
  const failures = [];
  if (scrollStopPower < 0.76) failures.push("Scroll stop test failed: not enough instant desire");
  if (premiumFeel < 0.74) failures.push("Premium test failed: not expensive enough");
  if (emotionalImpact < 0.68) failures.push("Emotional impact too weak");
  if (heroDominance < 0.7) failures.push("Squint test failed: hero does not dominate");
  if (screenshotRisk > 0.46) failures.push("Screenshot test failed: still reads as a video frame");
  if (philosophy.graphicRatio < 0.68) failures.push("No-text test failed: insufficient commercial artwork transformation");
  if (thumbnailReadability < 0.72) failures.push("Typography hierarchy too weak");
  if (total * 100 < TARGET_COMMERCIAL_AD_SCORE) failures.push("Commercial Advertising Score threshold not met");
  return {
    total: Math.round(total * 100),
    scrollStopPower: Math.round(scrollStopPower * 100),
    premiumFeel: Math.round(premiumFeel * 100),
    emotionalImpact: Math.round(emotionalImpact * 100),
    hero: Math.round(heroDominance * 100),
    brand: Math.round(brandRecognition * 100),
    thumbnailReadability: Math.round(thumbnailReadability * 100),
    screenshotRisk: Math.round(screenshotRisk * 100),
    artDirection: Math.round(depth * 100),
    graphicDesignRatio: Math.round(philosophy.graphicRatio * 100),
    story: Math.round(emotionalImpact * 100),
    title: Math.round(thumbnailReadability * 100),
    polish: Math.round(premiumFeel * 100),
    marketing: Math.round(scrollStopPower * 100),
    imageQuality: Math.round(premiumFeel * 100),
    passesQualityGate: failures.length === 0,
    qualityFailures: failures,
    designActions: rejectionActions(failures),
  };
}

function orderedPhilosophies(campaign = {}) {
  const setting = campaign?.visualNarrative?.setting || "";
  const preferred = COMMERCIAL_PHILOSOPHIES.filter(item => setting.includes(item.id.split("_")[0]) || setting.includes(item.visualSystemId.split("-")[1] || ""));
  const rest = COMMERCIAL_PHILOSOPHIES.filter(item => !preferred.includes(item));
  return [...preferred, ...rest].map(item => ({ ...item }));
}

function tuneCommercialConcept(concept, failures = [], score = {}, iteration = 1) {
  const reason = failures.join(" ").toLowerCase();
  const baseId = concept.baseId || concept.id;
  const next = { ...concept, baseId, id: `${baseId}-optimized-${iteration + 1}`, optimizationDirectives: [] };
  const push = (label) => next.optimizationDirectives.push(label);

  if (/hero|squint/.test(reason) || score.hero < 78) {
    next.heroBias += 0.075;
    next.depth += 0.035;
    push("increase hero dominance");
  }
  if (/screenshot|no-text|video frame|artwork/.test(reason) || score.screenshotRisk > 38) {
    next.graphicRatio += 0.09;
    next.depth += 0.045;
    next.believability += 0.035;
    push("reduce screenshot feeling and increase artwork transformation");
  }
  if (/scroll|desire|commercial|premium|expensive|emotional/.test(reason) || score.scrollStopPower < 82 || score.premiumFeel < 80) {
    next.graphicRatio += 0.045;
    next.depth += 0.045;
    next.believability += 0.05;
    next.brand += 0.025;
    push("increase commercial atmosphere and premium desire");
  }
  if (/typography|hierarchy|thumbnail|title/.test(reason) || score.thumbnailReadability < 78) {
    next.titleDominance += 0.08;
    next.titleScale += 0.06;
    push("increase typography hierarchy without changing template");
  }
  if (!next.optimizationDirectives.length) {
    next.graphicRatio += 0.025;
    next.depth += 0.025;
    next.believability += 0.025;
    push("general commercial refinement");
  }

  next.heroBias = clamp(next.heroBias, 0.38, 0.72);
  next.graphicRatio = clamp(next.graphicRatio, 0.58, 0.96);
  next.depth = clamp(next.depth, 0.68, 0.98);
  next.titleDominance = clamp(next.titleDominance, 0.52, 0.96);
  next.titleScale = clamp(next.titleScale, 0.78, 1.34);
  next.brand = clamp(next.brand, 0.68, 0.98);
  next.believability = clamp(next.believability, 0.72, 0.98);
  return next;
}

function cropForHero(image, analysis, language, width, height, settings = {}) {
  const philosophy = language.activePhilosophy || COMMERCIAL_PHILOSOPHIES[0];
  const outputAspect = width / height;
  const sourceAspect = image.width / image.height;
  const isPortraitSource = sourceAspect < 0.9;
  const landscapeOutput = outputAspect > 1.15;
  const cropRisk = analysis.subjectCropRisk || 0;
  const mustPreserveComposition = (isPortraitSource && landscapeOutput) || cropRisk > 0.34;

  if (mustPreserveComposition) {
    const heroSide = philosophy.titleSide === "right" ? 0.36 : 0.64;
    return {
      sx: 0,
      sy: 0,
      sw: image.width,
      sh: image.height,
      zoom: 1,
      fitMode: "portraitEditorial",
      portraitX: heroSide,
      compositionProtection: {
        rule: "portrait source becomes editorial hero layer over atmospheric landscape extension",
        sourceAspect,
        outputAspect,
        preservesFullPerformer: true,
        protectedZones: ["head", "face", "eyes", "hair", "shoulders", "chest", "hands", "primary action", "body silhouette"],
      },
    };
  }

  let sw = image.width;
  let sh = image.height;
  if (sourceAspect > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;
  const hero = analysis.subjectBox || { x: 0.52, y: 0.14, w: 0.34, h: 0.72 };
  const cx = (hero.x + hero.w * 0.52) * image.width;
  const cy = (hero.y + hero.h * 0.48) * image.height;
  const zoom = clamp((Number(settings.zoom) || 1) * (1.01 + philosophy.depth * 0.035), 0.95, 1.12);
  sw /= zoom;
  sh /= zoom;
  const horizontalBias = philosophy.titleSide === "right" ? 0.42 : philosophy.titleSide === "bottom" ? 0.52 : philosophy.heroBias;
  const sx = clamp(cx - sw * horizontalBias, 0, Math.max(0, image.width - sw));
  const sy = clamp(cy - sh * 0.48, 0, Math.max(0, image.height - sh));
  return { sx, sy, sw, sh, zoom, fitMode: "cover" };
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
  const crop = cropForHero(image, analysis, graphicLanguage, width, height, automaticCandidateSettings(settings));
  const score = buildPlanScore(analysis, graphicLanguage, philosophy, attemptIndex);
  const campaignTitle = metadata.videoTitle || metadata.title || metadata.campaignName || "";
  const emotionalHook = metadata.optionalSubtitle || metadata.contentType || metadata.campaignName || "";
  const candidateId = `candidate_${attemptIndex + 1}_${philosophy.id}`;
  const iterationId = `concept_iteration_${attemptIndex + 1}`;
  const conceptId = `concept_${philosophy.id}_${stableHash({ campaignTitle, emotionalHook })}`;
  const renderPlanSignature = {
    candidateId,
    iterationId,
    philosophyId: philosophy.id,
    conceptId,
    visualSystemId: philosophy.visualSystemId,
    crop,
    titleGeometry: { side: philosophy.titleSide, hierarchy: philosophy.hierarchy, scale: philosophy.titleScale, dominance: philosophy.titleDominance },
    logoGeometry: { anchor: philosophy.logo, strategy: philosophy.logoStrategy },
    colorStrategy: philosophy.colorLanguage,
    typographyFamily: philosophy.typographyFamily,
    atmosphereSettings: { atmosphere: philosophy.atmosphere, depth: philosophy.depth, graphicRatio: philosophy.graphicRatio, density: graphicLanguage.poster_density, redIntensity: graphicLanguage.redIntensity },
  };
  const renderPlanHash = stableHash(renderPlanSignature);
  const renderPlanId = `render_${philosophy.id}_${renderPlanHash}`;
  const canvasCacheKey = `${candidateId}_${renderPlanId}_${width}x${height}`;
  const diagnostic = {
    candidateId,
    iterationId,
    philosophyId: philosophy.id,
    philosophyName: philosophy.label,
    conceptId,
    campaignTitle,
    emotionalHook,
    visualSystemId: philosophy.visualSystemId,
    renderPlanId,
    renderPlanHash,
    crop,
    titleGeometry: renderPlanSignature.titleGeometry,
    logoGeometry: renderPlanSignature.logoGeometry,
    colorStrategy: philosophy.colorLanguage,
    typographyFamily: philosophy.typographyFamily,
    atmosphereSettings: renderPlanSignature.atmosphereSettings,
    canvasCacheKey,
    score,
  };
  const selected = {
    engine: ENGINE_NAME,
    candidate_id: candidateId,
    iteration_id: iterationId,
    concept_id: conceptId,
    visual_system_id: philosophy.visualSystemId,
    render_plan_id: renderPlanId,
    render_plan_hash: renderPlanHash,
    canvas_cache_key: canvasCacheKey,
    attempt: attemptIndex + 1,
    variant: philosophy.id,
    poster_family_id: philosophy.id,
    poster_family_label: philosophy.label,
    philosophy: `Local editorial layout: ${philosophy.label}. Use the source frame cleanly; premium cinematic key art requires AI hero-image reconstruction.`, 
    impact_score: score.total,
    hero_score: score.hero,
    thumbnail_score: score.polish,
    commercial_score: score.polish,
    rejection_reasons: score.qualityFailures,
    design_actions: score.designActions,
    optimization_directives: philosophy.optimizationDirectives || [],
    score,
    crop,
    diagnostic,
  };
  return {
    engine: ENGINE_NAME,
    metadata,
    campaign,
    analysis,
    graphicLanguage,
    philosophy,
    candidateId,
    iterationId,
    conceptId,
    renderPlanId,
    renderPlanHash,
    canvasCacheKey,
    diagnostic,
    family: { id: philosophy.id, label: philosophy.label },
    visualStory: { emotionalCenter: graphicLanguage.thumbnail_priority, viewerFeeling: graphicLanguage.energy },
    artDirection: { graphicDesignRatio: philosophy.graphicRatio, pipeline: ["Source Frame", "Editorial Crop", "Negative Space", "Typography", "Brand Elements", "Local Editorial Cover"], visualSystemId: philosophy.visualSystemId, compositionProtection: crop.compositionProtection || null }, 
    selected,
    best: selected,
    variants: [selected],
    attempts: [],
    winner_reason: score.passesQualityGate ? `${philosophy.label} reached Commercial Advertising Score ${score.total}.` : `${philosophy.label} rejected: ${score.qualityFailures.join(", ")}.`,
  };
}

function assertCandidateUniqueness(plans) {
  const checks = [
    ["candidateId", plan => plan.candidateId],
    ["conceptId", plan => plan.conceptId],
    ["renderPlanId", plan => plan.renderPlanId],
    ["renderPlanHash", plan => plan.renderPlanHash],
    ["canvasCacheKey", plan => plan.canvasCacheKey],
    ["philosophyName", plan => plan.philosophy.label],
  ];
  checks.forEach(([field, getter]) => {
    const values = plans.map(getter);
    const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
    if (duplicates.length) {
      throw new Error(`Candidate uniqueness assertion failed: duplicate ${field} = ${duplicates[0]}`);
    }
  });
}

export async function generateCommercialKeyArtPlan(image, metadata = {}, settings = {}, width = 1920, height = 1080) {
  const analysis = await analyzePosterImage(image);
  const baseLanguage = inferGraphicLanguage(metadata, analysis);
  const rawCampaign = createCommercialCampaign({ analysis, metadata });
  const exactTitle = metadata.videoTitle || metadata.title || "";
  const exactSubtitle = metadata.optionalSubtitle || metadata.subtitle || "";
  const exactPerformer = metadata.performerName || metadata.performer || "";
  const exactCategory = metadata.contentType || "";
  const exactCampaign = metadata.campaignName || metadata.series || "";
  const campaign = {
    ...rawCampaign,
    mainTitle: exactTitle,
    title: exactTitle,
    subtitle: exactSubtitle,
    episodeTitle: exactSubtitle,
    performer: exactPerformer,
    footerCategory: exactCategory || exactCampaign,
    marketingTagline: exactCampaign || exactCategory,
  };
  const conceptPhilosophies = orderedPhilosophies(campaign).slice(0, 6).map((philosophy, index) => ({
    ...philosophy,
    baseId: philosophy.id,
    optimizationDirectives: [
      `diagnostic concept ${index + 1}`,
      `commercial philosophy: ${philosophy.label}`,
      `typography family: ${philosophy.typographyFamily}`,
      `color language: ${philosophy.colorLanguage}`,
      `visual hierarchy: ${philosophy.hierarchy}`,
      `logo strategy: ${philosophy.logoStrategy}`,
    ],
  }));

  const planned = conceptPhilosophies.map((philosophy, index) => buildAttemptPlan(image, metadata, automaticCandidateSettings(settings), width, height, analysis, baseLanguage, campaign, philosophy, index));
  assertCandidateUniqueness(planned);
  const selectedPlan = planned.reduce((best, plan) => plan.selected.score.total > best.selected.score.total ? plan : best, planned[0]);

  return {
    ...selectedPlan,
    preparedIterations: planned,
    variants: planned.map(plan => plan.selected),
    diagnostics: planned.map(plan => plan.diagnostic),
    uniquenessAssertions: { passed: true, checkedFields: ["candidateId", "conceptId", "renderPlanId", "renderPlanHash", "canvasCacheKey", "philosophyName"] },
    attempts: planned.map(plan => ({ candidateId: plan.candidateId, philosophy: plan.philosophy.label, renderPlanHash: plan.renderPlanHash, score: plan.selected.score, accepted: plan.selected.score.passesQualityGate && plan.selected.score.total >= TARGET_COMMERCIAL_AD_SCORE, designActions: plan.selected.design_actions, optimizationDirectives: plan.selected.optimization_directives })),
    winner_reason: `${selectedPlan.philosophy.label} selected by the Local Editorial Cover Composer after comparing clean frame-based layouts.`, 
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
  const brush = subtitle || "";
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
  const visualScore = Number(systemResult.commercialAdvertisingScore) || plan.selected.score.total;
  const score = {
    ...plan.selected.score,
    total: Math.round(plan.selected.score.total * 0.42 + visualScore * 0.58),
    renderedComposition: visualScore,
    passesQualityGate: plan.selected.score.passesQualityGate || systemResult.artworkValidation === "passed",
  };
  return { ...plan, selected: { ...plan.selected, ...systemResult, score } };
}

function copyCanvas(source, target) {
  target.width = source.width;
  target.height = source.height;
  const ctx = target.getContext("2d");
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0);
}

export async function renderCommercialKeyArtToCanvas(canvas, image, metadata = {}, settings = {}, width = 1920, height = 1080, existingPlan = null) {
  const basePlan = existingPlan?.preparedIterations ? existingPlan : await generateCommercialKeyArtPlan(image, metadata, automaticCandidateSettings(settings), width, height);
  const iterations = basePlan.preparedIterations || [basePlan];
  const attempts = [];
  let bestPlan = null;
  let bestCanvas = null;

  for (let index = 0; index < iterations.length; index += 1) {
    const scratch = document.createElement("canvas");
    const renderedPlan = await paintCommercialPipeline(scratch, image, iterations[index], automaticCandidateSettings(settings), width, height);
    const accepted = renderedPlan.selected.score.passesQualityGate && renderedPlan.selected.score.total >= TARGET_COMMERCIAL_AD_SCORE;
    attempts.push({
      attempt: index + 1,
      candidateId: renderedPlan.candidateId,
      philosophy: renderedPlan.philosophy.label,
      renderPlanHash: renderedPlan.renderPlanHash,
      impact: renderedPlan.selected.score.total,
      accepted,
      rejectedBecause: renderedPlan.selected.score.qualityFailures,
      designActions: renderedPlan.selected.design_actions,
      optimizationDirectives: renderedPlan.selected.optimization_directives,
    });

    if (!bestPlan || renderedPlan.selected.score.total > bestPlan.selected.score.total) {
      bestPlan = renderedPlan;
      bestCanvas = scratch;
    }
  }

  if (bestCanvas) copyCanvas(bestCanvas, canvas);
  canvas.__fleshlabPosterPlan = {
    ...bestPlan,
    attempts,
    approvalStatus: bestPlan?.selected?.score?.passesQualityGate ? "approved" : "best_attempt_not_approved",
    winner_reason: bestPlan?.selected?.score?.passesQualityGate ? `${bestPlan.philosophy.label} selected after comparing ${attempts.length} local editorial layouts.` : `Best local editorial layout: ${(bestPlan?.selected?.score?.qualityFailures || []).join(", ")}`, 
  };
  return canvas.__fleshlabPosterPlan;
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
  const commercialPlan = plan?.preparedIterations ? plan : await generateCommercialKeyArtPlan(image, metadata, automaticCandidateSettings(settings), width, height);
  const conceptPlan = commercialPlan.preparedIterations?.find(item => item.selected.candidate_id === variantPlan?.candidate_id || item.selected.render_plan_hash === variantPlan?.render_plan_hash) || commercialPlan;
  canvas.dataset.cacheKey = conceptPlan.canvasCacheKey;
  const renderedPlan = await paintCommercialPipeline(canvas, image, conceptPlan, settings, width, height);
  canvas.__fleshlabPosterPlan = renderedPlan;
  return renderedPlan;
}