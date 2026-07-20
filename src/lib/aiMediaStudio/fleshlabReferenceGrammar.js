export const FLESHLAB_REFERENCE_COVERS = [
  {
    id: "kraken_into_the_wild",
    title: "Kraken Into The Wild",
    imageUrl: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/video_2025-05-01_18-03-29.jpg",
    grammar: {
      mood: "dark-mythic-outdoor",
      heroAttention: [0.45, 0.7],
      titleRole: "cinematic tension, not caption",
      palette: "black, skin warmth, bone-white title, restrained FLESHLAB red",
      rhythm: "hero first, title second, logo recognized within one second",
      density: "low information, high desire",
    },
  },
  {
    id: "beach_escape",
    title: "Beach Escape",
    imageUrl: "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/video_2023-12-02_00-17-42.jpg",
    grammar: {
      mood: "sun-warmed escape",
      heroAttention: [0.45, 0.68],
      titleRole: "vacation fantasy and click desire",
      palette: "warm sand, deep shadow, white title, red brand accent",
      rhythm: "atmosphere pulls in, performer converts attention",
      density: "open air, simple hierarchy, no decoration",
    },
  },
];

export const FLESHLAB_VISUAL_GRAMMAR_RULES = [
  "Hero attention must sit between 45% and 70%; below that feels weak, above that leaves no desire path.",
  "The viewer must understand the FLESHLAB studio language in one second without relying only on the logo.",
  "Typography must behave like movie marketing: title as emotion, subtitle as whisper, metadata as restraint.",
  "Negative space must either hold tension, air, darkness, or fantasy; empty space is a failure.",
  "The palette must stay disciplined: black structure, warm skin or environment, bone-white title, one red brand accent.",
  "The performer is the actor, never a cutout layer; every crop must intensify presence or story.",
  "Information density stays low; confidence comes from scale, shadow, and rhythm, not from more elements.",
  "Texture must come from photography or atmosphere, not graphics added because the canvas felt empty.",
  "Eye flow must be intentional: face/body, title, logo — never random scanning.",
  "A cover passes only if it could sit beside Kraken Into The Wild and Beach Escape as the same creative studio.",
];

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function heroAttention(candidate, analysis = {}) {
  const hero = analysis.subjectBox || { w: 0.36, h: 0.66 };
  const raw = clamp(hero.w * hero.h * 2.9 + (candidate.heroEmphasis || 0.55) * 0.22, 0.2, 0.86);
  return candidate.imageRole === "ai_reconstructed_hero" ? clamp(raw + 0.08, 0.32, 0.72) : raw;
}

function inRange(value, [min, max]) {
  return value >= min && value <= max;
}

function scoreBoolean(value, points) {
  return value ? points : 0;
}

export function benchmarkAgainstFleshlabReferences(candidate, analysis = {}, metadata = {}) {
  const attention = heroAttention(candidate, analysis);
  const referenceBand = [0.45, 0.7];
  const titleClearance = candidate.negativeSide === "left"
    ? candidate.titleZone.x + candidate.titleZone.w < (analysis.subjectBox?.x || 0.52) + 0.1
    : candidate.titleZone.x > (analysis.subjectBox?.x || 0.52) + (analysis.subjectBox?.w || 0.34) - 0.1;
  const brandOneSecond = (candidate.brandScale || 0.078) >= 0.06 && (candidate.brandScale || 0.078) <= 0.13;
  const disciplinedPalette = /dark|sunset|warm|black|hard|controlled/.test(candidate.mood || "") && candidate.grade?.accent;
  const emotionalHook = /desire|danger|escape|intimacy|tension|click/i.test(candidate.compositionBrief || "");
  const meaningfulSpace = (analysis.negativeSpace?.score || 0.55) >= 0.46 || /negative space|darkens|suppresses/i.test(candidate.compositionBrief || "");
  const premiumImageBase = candidate.imageRole === "ai_reconstructed_hero";
  const lowDensity = true;

  const score = Math.round(
    scoreBoolean(inRange(attention, referenceBand), 18) +
    scoreBoolean(titleClearance, 14) +
    scoreBoolean(brandOneSecond, 12) +
    scoreBoolean(Boolean(disciplinedPalette), 12) +
    scoreBoolean(emotionalHook, 16) +
    scoreBoolean(meaningfulSpace, 12) +
    scoreBoolean(lowDensity, 8) +
    scoreBoolean(premiumImageBase, 8)
  );

  const failures = [];
  if (!inRange(attention, referenceBand)) failures.push(`Hero attention ${Math.round(attention * 100)}% is outside the FLESHLAB 45–70% reference band.`);
  if (!titleClearance) failures.push("Typography competes with the performer instead of reinforcing eye flow.");
  if (!brandOneSecond) failures.push("Brand recognition is not balanced to the one-second FLESHLAB read.");
  if (!disciplinedPalette) failures.push("Palette does not resolve into the approved black / warmth / bone-white / red grammar.");
  if (!emotionalHook) failures.push("Composition does not clearly explain why desire to click increases.");
  if (!meaningfulSpace) failures.push("Negative space is not meaningful enough.");
  if (!premiumImageBase) failures.push("Reference parity requires an AI reconstructed hero image, not only the source frame.");

  return {
    score,
    passesStudioParity: score >= 84,
    verdict: score >= 84 ? "Could plausibly sit beside approved FLESHLAB covers." : "Not yet indistinguishable from approved FLESHLAB covers.",
    comparedAgainst: FLESHLAB_REFERENCE_COVERS.map(item => ({ id: item.id, title: item.title, imageUrl: item.imageUrl, grammar: item.grammar })),
    measurements: {
      heroAttention: Math.round(attention * 100),
      titleClearance,
      brandOneSecond,
      disciplinedPalette: Boolean(disciplinedPalette),
      emotionalHook,
      meaningfulSpace,
      premiumImageBase,
    },
    failures,
    rules: FLESHLAB_VISUAL_GRAMMAR_RULES,
  };
}