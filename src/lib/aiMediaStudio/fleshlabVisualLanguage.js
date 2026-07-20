import { FLESHLAB_REFERENCE_COVERS, FLESHLAB_VISUAL_GRAMMAR_RULES, benchmarkAgainstFleshlabReferences } from "./fleshlabReferenceGrammar";
import { consultCreativeIntelligence } from "./creativeIntelligenceEngine";

const ENGINE_NAME = "FLESHLAB Creative Intelligence Engine v6.0";

export const FLESHLAB_VISUAL_LANGUAGE = {
  engineName: ENGINE_NAME,
  references: FLESHLAB_REFERENCE_COVERS,
  color: {
    black: "#030303",
    deepBlack: "#000000",
    red: "208,0,18",
    redHex: "#d00012",
    bone: "244,240,231",
    muted: "180,178,172",
  },
  typography: {
    titleFamily: "Bebas Neue",
    supportingFamily: "Inter",
    titleWeight: 900,
    titleTracking: "tight",
    hierarchy: "title first, performer second, brand quiet but constant",
  },
  rules: FLESHLAB_VISUAL_GRAMMAR_RULES,
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function hashText(value) {
  const text = JSON.stringify(value || {});
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function seedFrom({ metadata, analysis, index = 0 }) {
  const text = `${metadata?.videoTitle || metadata?.title || ""}|${metadata?.performerName || ""}|${index}|${hashText(analysis)}`;
  const numeric = [...text].reduce((sum, char, i) => sum + char.charCodeAt(0) * (i + 17), 0);
  return (numeric % 997) / 997;
}

function heroBox(analysis = {}) {
  return analysis.subjectBox || { x: 0.52, y: 0.16, w: 0.34, h: 0.66 };
}

function faceBox(analysis = {}) {
  return analysis?.detections?.face || null;
}

function negativeSideFor(hero, seed) {
  if (hero.x + hero.w * 0.5 > 0.58) return "left";
  if (hero.x + hero.w * 0.5 < 0.42) return "right";
  return seed > 0.5 ? "left" : "right";
}

function moodFrom(metadata = {}, analysis = {}) {
  const text = `${metadata.videoTitle || ""} ${metadata.optionalSubtitle || ""} ${metadata.contentType || ""} ${metadata.campaignName || ""}`.toLowerCase();
  if (/beach|escape|summer|outdoor|wild|island|vacation/.test(text)) return "sunset-wilderness";
  if (/kraken|night|wild|danger|into/.test(text)) return "dark-mythic";
  if (/hotel|suite|luxury|private/.test(text)) return "warm-premium";
  if (/gym|steel|workout/.test(text)) return "hard-shadow";
  if ((analysis.backgroundComplexity || 0) > 0.58) return "controlled-chaos";
  return "black-red-editorial";
}

function critiqueStill(metadata = {}, analysis = {}) {
  const hero = heroBox(analysis);
  const face = faceBox(analysis);
  const heroCenter = hero.x + hero.w * 0.5;
  const eyeTarget = face ? "the performer's face" : heroCenter < 0.45 ? "the performer on the left side" : heroCenter > 0.55 ? "the performer on the right side" : "the central body silhouette";
  const emotion = moodFrom(metadata, analysis) === "sunset-wilderness" ? "escape and sun-warmed desire" : moodFrom(metadata, analysis) === "dark-mythic" ? "danger, appetite, and mystery" : moodFrom(metadata, analysis) === "warm-premium" ? "private intimacy and luxury" : "direct physical tension";
  const shouldDisappear = (analysis.backgroundComplexity || 0) > 0.55 ? "busy background detail and accidental smartphone clutter" : "anything that competes with the performer";
  const shouldDarken = heroCenter > 0.5 ? "the left side of the frame, so the eye can travel from performer to title" : "the right side of the frame, so the title does not fight the performer";
  const shouldGrow = (analysis.subjectSeparation || 0) < 0.58 ? "the performer silhouette and face separation" : "the emotional contrast already present in the performer";
  return {
    strongestVisualElement: eyeTarget,
    naturalEyePath: face ? "face first, then shoulder/body line, then title, then the quiet FLESHLAB mark" : "body silhouette first, then title, then brand mark",
    emotion,
    story: metadata.videoTitle || metadata.campaignName || "a charged FLESHLAB moment that should feel discovered, not decorated",
    shouldBecomeLarger: shouldGrow,
    shouldBecomeDarker: shouldDarken,
    shouldDisappear,
    heroDecision: "the performer remains the actor; typography must orbit the emotional gaze, not occupy empty space",
  };
}

function artDirectorBrief(candidate, critique, metadata = {}) {
  const sideName = candidate.negativeSide === "left" ? "left" : "right";
  const performerSide = candidate.negativeSide === "left" ? "right" : "left";
  const imageMode = candidate.imageRole === "ai_reconstructed_hero" ? "The base image is an AI reconstructed hero photograph, so the composition can aim for premium streaming key art." : "The base image is still the original frame, so the composition stays editorial and does not pretend to be full cinematic key art.";
  return [
    `The strongest visual element is ${critique.strongestVisualElement}.`,
    `The performer occupies the ${performerSide} emotional weight of the stage while the ${sideName} side is reserved for negative space and title tension.`,
    `The eye should travel ${critique.naturalEyePath}.`,
    `${critique.emotion} is the emotional hook, so the cover darkens ${critique.shouldBecomeDarker} and suppresses ${critique.shouldDisappear}.`,
    `The title is not information; it is placed where it reinforces the gaze and increases the desire to click ${metadata.videoTitle ? `on “${metadata.videoTitle}”` : "on the scene"}.`,
    imageMode,
  ].join("\n");
}

function artDirectorApproval(candidate, critique, brief) {
  const hasHero = Boolean(candidate.heroEmphasis > 0.42);
  const hasEyePath = /face|body|silhouette|performer/i.test(brief) && /title/i.test(brief);
  const hasDesireReason = /desire|tension|intimacy|danger|escape|click/i.test(brief);
  const avoidsDecoration = !/decorate|fill space|red line for/i.test(brief);
  const emotionalClarity = critique.emotion.length > 8;
  const score = [hasHero, hasEyePath, hasDesireReason, avoidsDecoration, emotionalClarity].filter(Boolean).length;
  return { approved: score >= 4, score: score * 20, checks: { hasHero, hasEyePath, hasDesireReason, avoidsDecoration, emotionalClarity } };
}

function colorGradeFor(mood) {
  const grades = {
    "sunset-wilderness": { bg: "#050403", warmth: 0.86, contrast: 1.2, saturation: 1.04, accent: "208,0,18", paper: "250,238,216" },
    "dark-mythic": { bg: "#010101", warmth: 0.5, contrast: 1.34, saturation: 0.96, accent: "208,0,18", paper: "244,240,231" },
    "warm-premium": { bg: "#060302", warmth: 0.92, contrast: 1.22, saturation: 1.08, accent: "208,0,18", paper: "248,231,200" },
    "hard-shadow": { bg: "#030405", warmth: 0.36, contrast: 1.36, saturation: 0.92, accent: "190,22,36", paper: "232,235,236" },
    "controlled-chaos": { bg: "#020202", warmth: 0.62, contrast: 1.3, saturation: 0.94, accent: "208,0,18", paper: "244,240,231" },
    "black-red-editorial": { bg: "#030303", warmth: 0.68, contrast: 1.26, saturation: 1, accent: "208,0,18", paper: "244,240,231" },
  };
  return grades[mood] || grades["black-red-editorial"];
}

function titleScaleFor(title = "", aspect = 16 / 9) {
  const words = String(title).trim().split(/\s+/).filter(Boolean).length || 2;
  const lengthPenalty = clamp((words - 2) * 0.055, 0, 0.25);
  const aspectBoost = aspect > 1.4 ? 1 : aspect < 0.85 ? 0.78 : 0.9;
  return clamp((0.132 - lengthPenalty) * aspectBoost, 0.052, 0.145);
}

function cropFor(image, analysis, width, height, candidate) {
  const outputAspect = width / height;
  const sourceAspect = image.width / image.height;
  const portraitToLandscape = sourceAspect < 0.9 && outputAspect > 1.2;
  const hero = heroBox(analysis);
  if (portraitToLandscape || (analysis.subjectCropRisk || 0) > 0.34) {
    return {
      sx: 0,
      sy: 0,
      sw: image.width,
      sh: image.height,
      fitMode: "portraitEditorial",
      portraitX: candidate.negativeSide === "left" ? 0.64 : 0.36,
      compositionProtection: {
        rule: "preserve original frame as editorial subject layer; do not manufacture environment",
        premiumRequirement: "use AI hero reconstruction for streaming-platform key art",
      },
    };
  }
  let sw = image.width;
  let sh = image.height;
  if (sourceAspect > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;
  const cx = (hero.x + hero.w * (candidate.negativeSide === "left" ? 0.62 : 0.38)) * image.width;
  const cy = (hero.y + hero.h * 0.48) * image.height;
  const zoom = 1.02 + candidate.heroEmphasis * 0.08;
  sw /= zoom;
  sh /= zoom;
  return {
    sx: clamp(cx - sw * (candidate.negativeSide === "left" ? 0.62 : 0.38), 0, Math.max(0, image.width - sw)),
    sy: clamp(cy - sh * 0.48, 0, Math.max(0, image.height - sh)),
    sw,
    sh,
    zoom,
    fitMode: "cover",
  };
}

function protectTitleFromFace(titleZone, face) {
  if (!face) return titleZone;
  const overlapsY = titleZone.y < face.y + face.h && titleZone.y + titleZone.h > face.y;
  const overlapsX = titleZone.x < face.x + face.w && titleZone.x + titleZone.w > face.x;
  if (!overlapsX || !overlapsY) return titleZone;
  return { ...titleZone, y: face.y > 0.5 ? 0.08 : 0.58 };
}

function buildCandidate({ image, metadata, analysis, width, height, index }) {
  const seed = seedFrom({ metadata, analysis, index });
  const hero = heroBox(analysis);
  const face = faceBox(analysis);
  const mood = moodFrom(metadata, analysis);
  const negativeSide = index % 3 === 0 ? negativeSideFor(hero, seed) : index % 3 === 1 ? "left" : "right";
  const aspect = width / height;
  const safeMargin = aspect > 1.2 ? 0.055 : 0.075;
  const titleW = negativeSide === "left" ? Math.max(0.34, Math.min(0.55, hero.x - 0.02)) : Math.max(0.34, Math.min(0.5, 1 - (hero.x + hero.w) - 0.02));
  const titleX = negativeSide === "left" ? safeMargin + seed * 0.025 : 1 - safeMargin - titleW - seed * 0.025;
  const titleYBase = aspect > 1.2 ? (seed > 0.62 ? 0.16 : 0.54) : (seed > 0.5 ? 0.12 : 0.62);
  const titleZone = protectTitleFromFace({ x: titleX, y: titleYBase, w: titleW, h: 0.28 }, face);
  const logoAnchor = seed > 0.5 ? "top-left" : "top-right";
  const heroEmphasis = clamp((analysis.subjectSeparation || 0.56) * 0.6 + (analysis.visualCuriosity || 0.54) * 0.4 + index * 0.025, 0.42, 0.9);
  const critique = critiqueStill(metadata, analysis);
  const candidate = {
    id: `fleshlab_rule_${index + 1}_${hashText({ metadata, mood, negativeSide, seed }).slice(0, 6)}`,
    label: ["FLESHLAB Editorial", "Negative Space", "Streaming Crop", "Hero Lock"][index] || "FLESHLAB Editorial",
    seed,
    mood,
    grade: colorGradeFor(mood),
    negativeSide,
    titleZone,
    logoAnchor,
    heroEmphasis,
    titleScale: titleScaleFor(metadata.videoTitle || metadata.title || "", aspect),
    performerScale: clamp(0.017 + heroEmphasis * 0.009, 0.018, 0.03),
    footerScale: aspect > 1.2 ? 0.014 : 0.017,
    brandScale: aspect > 1.2 ? 0.078 : 0.11,
    imageRole: metadata?.aiReconstructed ? "ai_reconstructed_hero" : "source_frame_editorial",
    critique,
  };
  const withCrop = { ...candidate, crop: cropFor(image, analysis, width, height, candidate) };
  const initialBrief = artDirectorBrief(withCrop, critique, metadata);
  const creativeIntelligence = consultCreativeIntelligence({ candidate: { ...withCrop, compositionBrief: initialBrief }, metadata, analysis });
  const compositionBrief = creativeIntelligence.creativeBrief.text;
  const artDirector = artDirectorApproval(withCrop, critique, compositionBrief);
  return {
    ...withCrop,
    compositionBrief,
    creativeIntelligence,
    artDirector: {
      ...artDirector,
      approved: artDirector.approved && creativeIntelligence.approved,
      score: Math.round((artDirector.score + creativeIntelligence.overallScore) / 2),
      checks: { ...artDirector.checks, creativeBriefApproved: creativeIntelligence.creativeBrief.approved, tasteApproved: creativeIntelligence.taste.approved },
    },
  };
}

function scoreCandidate(candidate, analysis = {}, metadata = {}) {
  const hero = heroBox(analysis);
  const benchmark = benchmarkAgainstFleshlabReferences(candidate, analysis, metadata);
  const titleAvoidsHero = candidate.negativeSide === "left" ? candidate.titleZone.x + candidate.titleZone.w < hero.x + 0.08 : candidate.titleZone.x > hero.x + hero.w - 0.08;
  const negativeSpace = clamp(analysis.negativeSpace?.score || 0.55);
  const heroStrength = clamp((analysis.subjectSeparation || 0.56) * 0.48 + (analysis.visualCuriosity || 0.56) * 0.32 + candidate.heroEmphasis * 0.2);
  const colorConsistency = candidate.mood ? 0.88 : 0.72;
  const typographySafety = titleAvoidsHero ? 0.9 : 0.62;
  const brandConsistency = 0.92;
  const intelligenceScore = (candidate.creativeIntelligence?.overallScore || 70) / 100;
  const localCeiling = candidate.imageRole === "ai_reconstructed_hero" ? 0.96 : 0.8;
  const totalRaw = heroStrength * 0.18 + negativeSpace * 0.11 + colorConsistency * 0.11 + typographySafety * 0.13 + brandConsistency * 0.1 + (benchmark.score / 100) * 0.17 + intelligenceScore * 0.2;
  const total = Math.round(clamp(totalRaw * localCeiling, 0, 1) * 100);
  const weaknesses = [];
  if (candidate.imageRole !== "ai_reconstructed_hero") weaknesses.push("Local source-frame layout cannot reach premium streaming-image quality without AI reconstruction.");
  if (!candidate.artDirector?.approved) weaknesses.push("Art-director brief is not strong enough to justify rendering.");
  (candidate.creativeIntelligence?.failures || []).forEach(failure => weaknesses.push(failure));
  if (!titleAvoidsHero) weaknesses.push("Title zone is close to the performer; manual review recommended.");
  if (negativeSpace < 0.48) weaknesses.push("Limited natural negative space in the source frame.");
  benchmark.failures.forEach(failure => weaknesses.push(failure));
  return {
    total,
    hero: Math.round(heroStrength * 100),
    title: Math.round(typographySafety * 100),
    polish: Math.round(colorConsistency * 100),
    brand: Math.round(brandConsistency * 100),
    negativeSpace: Math.round(negativeSpace * 100),
    artDirector: candidate.artDirector?.score || 0,
    studioBenchmark: benchmark.score,
    imageQualityCeiling: Math.round(localCeiling * 100),
    passesQualityGate: candidate.artDirector?.approved && candidate.creativeIntelligence?.approved && benchmark.passesStudioParity && total >= (candidate.imageRole === "ai_reconstructed_hero" ? 88 : 70),
    qualityFailures: [...new Set(weaknesses)],
    compositionBrief: candidate.compositionBrief,
    studioBenchmarkReport: benchmark,
    creativeIntelligence: candidate.creativeIntelligence,
  };
}

export function buildFleshlabCoverPlan({ image, metadata = {}, analysis = {}, width, height }) {
  const candidates = [0, 1, 2, 3].map(index => {
    const candidate = buildCandidate({ image, metadata, analysis, width, height, index });
    return { ...candidate, score: scoreCandidate(candidate, analysis, metadata) };
  }).sort((a, b) => Number(b.artDirector?.approved) - Number(a.artDirector?.approved) || b.score.total - a.score.total);
  const selected = candidates[0];
  return {
    engine: ENGINE_NAME,
    visualLanguage: FLESHLAB_VISUAL_LANGUAGE,
    candidates,
    selected,
    audit: {
      rootLimitation: metadata?.aiReconstructed ? "AI hero base image supplied; local renderer is now decoration and brand system." : "Source frame only; local renderer is limited to editorial layout and cannot create premium key art photography.",
      reasoningPipeline: selected.creativeIntelligence?.reasoningPipeline || [],
      permanentEngines: ["World Knowledge", "Design Knowledge", "Creative Director", "Internal Critic", "Taste Engine", "FLESHLAB DNA", "Explainability"],
      replacedSubsystems: ["static philosophy templates", "template-like title sides", "environment fabrication", "premium scoring for source frames"],
      preservedSubsystems: ["frame analysis", "manual controls", "review", "export"],
    },
  };
}

export function stablePlanHash(value) {
  return hashText(value);
}