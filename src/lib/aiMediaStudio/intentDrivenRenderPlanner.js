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
  return hash >>> 0;
}

function noise(seed, index = 0) {
  const x = Math.sin(seed * 0.0001 + index * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function titleWordCount(metadata = {}) {
  return String(metadata.title || metadata.mainTitle || metadata.videoTitle || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length || 2;
}

function emotionFamily(brief = {}) {
  const text = `${brief.emotionalGoal || ""} ${brief.story || ""}`.toLowerCase();
  if (/escape|heat|summer|beach|fantasy/.test(text)) return "escape";
  if (/luxury|private|intimate|access|vip/.test(text)) return "luxury";
  if (/danger|mythic|dark|appetite|tension/.test(text)) return "danger";
  if (/chaos|controlled/.test(text)) return "chaos";
  return "magnetism";
}

function performerSideFromBrief(brief = {}, fallback = "right") {
  const flow = String(brief.expectedEyeFlow || "").toLowerCase();
  if (/performer on the right/.test(flow)) return "right";
  if (/performer on the left/.test(flow)) return "left";
  return fallback;
}

function solveTitleVerticalIntent(emotion, seed, aspect) {
  const high = aspect > 1.2 ? 0.15 + noise(seed, 2) * 0.08 : 0.1 + noise(seed, 2) * 0.06;
  const low = aspect > 1.2 ? 0.53 + noise(seed, 3) * 0.15 : 0.6 + noise(seed, 3) * 0.12;
  if (emotion === "luxury") return low;
  if (emotion === "danger") return noise(seed, 4) > 0.48 ? high : low;
  if (emotion === "escape") return noise(seed, 5) > 0.55 ? high : low;
  if (emotion === "chaos") return 0.44 + noise(seed, 6) * 0.22;
  return noise(seed, 7) > 0.5 ? high : low;
}

function solveGrade(baseGrade, emotion, seed) {
  const grade = { ...baseGrade };
  if (emotion === "escape") {
    grade.warmth = clamp((grade.warmth || 0.7) + 0.1, 0, 1);
    grade.saturation = clamp((grade.saturation || 1) + 0.04, 0.8, 1.18);
  }
  if (emotion === "luxury") {
    grade.contrast = clamp((grade.contrast || 1.2) + 0.08, 1, 1.42);
    grade.warmth = clamp((grade.warmth || 0.7) + 0.08, 0, 1);
  }
  if (emotion === "danger") {
    grade.contrast = clamp((grade.contrast || 1.2) + 0.12, 1, 1.5);
    grade.saturation = clamp((grade.saturation || 1) - 0.05 + noise(seed, 8) * 0.04, 0.78, 1.08);
  }
  return grade;
}

export function solveIntentDrivenRenderMap({ baseMap, plan, metadata = {}, width, height }) {
  const candidate = plan.candidate || baseMap;
  const intelligence = candidate.creativeIntelligence || plan.selected?.diagnostic?.creativeIntelligence || plan.selected?.score?.creativeIntelligence;
  const brief = intelligence?.creativeBrief || {};
  const director = intelligence?.engines?.director;
  const seed = hashText({
    title: metadata.title || metadata.mainTitle || metadata.videoTitle,
    brief: brief.text,
    candidate: candidate.id || plan.selected?.candidate_id,
    renderHash: plan.selected?.render_plan_hash,
  });
  const aspect = width / height;
  const emotion = emotionFamily(brief);
  const performerSide = performerSideFromBrief(brief, baseMap.negativeSide === "left" ? "right" : "left");
  const negativeSide = performerSide === "right" ? "left" : "right";
  const words = titleWordCount(metadata);
  const heroDominance = clamp(((plan.selected?.score?.hero || 65) / 100) * 0.72 + 0.18 + noise(seed, 9) * 0.08, 0.5, 0.84);
  const visualTension = clamp((intelligence?.taste?.score || 78) / 100 + (emotion === "danger" ? 0.06 : 0), 0.58, 0.96);
  const titleWidth = clamp(0.32 + (1 - heroDominance) * 0.3 + Math.max(0, words - 3) * 0.018 + noise(seed, 10) * 0.06, 0.32, aspect > 1.2 ? 0.58 : 0.72);
  const safe = aspect > 1.2 ? 0.045 + noise(seed, 11) * 0.035 : 0.07;
  const titleX = negativeSide === "left" ? safe : 1 - safe - titleWidth;
  const titleY = clamp(solveTitleVerticalIntent(emotion, seed, aspect), 0.09, 0.72);
  const titleScale = clamp((0.152 - Math.max(0, words - 2) * 0.016) * (aspect > 1.2 ? 1 : 0.82) * (0.92 + visualTension * 0.14), 0.054, 0.16);
  const logoQuietness = clamp(0.9 - visualTension * 0.22, 0.58, 0.78);
  const logoAnchor = negativeSide === "left"
    ? (titleY > 0.44 ? "top-left" : "top-right")
    : (titleY > 0.44 ? "top-right" : "top-left");

  const renderingInstructions = {
    visualPlan: {
      story: brief.story,
      emotionalGoal: brief.emotionalGoal,
      hero: brief.hero,
      eyeFlow: brief.expectedEyeFlow,
    },
    intentions: {
      visualWeight: `Performer carries ${Math.round(heroDominance * 100)}% of first-read weight; title counterbalances without stealing the hero.`,
      balance: `${performerSide} performer weight balanced by ${negativeSide} negative-space typography.`,
      heroScale: heroDominance > 0.72 ? "large and dominant, protected from text" : "confident but with more atmosphere",
      depth: emotion === "luxury" ? "soft depth and expensive shadow" : emotion === "danger" ? "hard depth and high contrast" : "atmospheric depth",
      light: emotion === "escape" ? "warm environmental light" : emotion === "danger" ? "low-key directional light" : "controlled cinematic shadow",
      negativeSpace: "space exists to pull the title into the story, not to fill a template slot",
      photography: "the image must feel like a campaign photograph before it feels like a graphic",
      visualRhythm: director?.direction || "performer, title, brand in three deliberate reads",
      typographyIntegration: "title locks into the emotional shadow field instead of floating over the frame",
      brandHarmony: "logo remains a third-read luxury signature",
    },
    solvedGeometryReason: "Geometry was solved from intent: hero dominance, eye flow, negative-space balance, typography integration, and quiet branding.",
  };

  const crop = { ...(baseMap.crop || {}) };
  if (crop.fitMode === "portraitEditorial") {
    crop.portraitX = performerSide === "right" ? 0.66 + noise(seed, 12) * 0.04 : 0.3 + noise(seed, 12) * 0.04;
  } else if (crop.sw && crop.sh) {
    const zoom = 1.01 + heroDominance * 0.08 + noise(seed, 13) * 0.025;
    const cxBias = performerSide === "right" ? 0.57 : 0.43;
    crop.zoom = zoom;
    crop.intentBias = cxBias;
  }

  return {
    ...baseMap,
    crop,
    grade: solveGrade(baseMap.grade, emotion, seed),
    titleZone: { x: titleX, y: titleY, w: titleWidth, h: 0.3 },
    logoAnchor,
    brandScale: clamp((baseMap.brandScale || 0.078) * logoQuietness, 0.048, 0.105),
    titleScale,
    performerScale: clamp((baseMap.performerScale || 0.022) * (0.9 + visualTension * 0.18), 0.016, 0.034),
    footerScale: clamp((baseMap.footerScale || 0.014) * (0.88 + noise(seed, 14) * 0.18), 0.011, 0.019),
    negativeSide,
    performerSide,
    emotionFamily: emotion,
    heroDominance,
    visualTension,
    renderingInstructions,
  };
}