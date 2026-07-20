const MEMORY_KEY = "fleshlab_cover_creative_memory_v1";

export const FLESHLAB_DNA = [
  "raw",
  "premium",
  "modern",
  "cinematic",
  "confident",
  "minimal",
  "authentic",
  "Asian",
  "story-driven",
  "performer-first",
  "dark luxury",
];

export const WORLD_KNOWLEDGE_AREAS = [
  "photography", "cinematography", "advertising", "movie marketing", "fashion campaigns", "magazine covers",
  "streaming artwork", "human attention", "eye tracking", "color psychology", "composition", "negative space",
  "lighting", "camera language", "storytelling", "environment", "luxury branding", "editorial design",
  "emotion", "consumer psychology", "visual hierarchy", "click behaviour", "social media", "thumbnail psychology",
  "premium entertainment branding",
];

export const DESIGN_KNOWLEDGE_AREAS = [
  "composition", "typography", "branding", "graphic design", "editorial design", "luxury design", "minimalism",
  "motion direction", "visual rhythm", "contrast", "depth", "scale", "balance", "proportion", "grid systems",
  "dynamic composition", "title hierarchy", "subtitle hierarchy", "logo hierarchy", "color systems", "texture usage",
  "light direction", "story-driven design",
];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function safeReadMemory() {
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : { lessons: [], rejectedReasons: {}, approvedPatterns: {} };
  } catch {
    return { lessons: [], rejectedReasons: {}, approvedPatterns: {} };
  }
}

function safeWriteMemory(memory) {
  try {
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Local memory is an enhancement; the engine still works without it.
  }
}

function phrase(metadata = {}, fallback = "a charged FLESHLAB scene") {
  return metadata.videoTitle || metadata.title || metadata.campaignName || fallback;
}

function inferEmotion(metadata = {}, analysis = {}) {
  const text = `${metadata.videoTitle || ""} ${metadata.optionalSubtitle || ""} ${metadata.contentType || ""} ${metadata.campaignName || ""}`.toLowerCase();
  if (/beach|summer|escape|vacation|island|outdoor|wild/.test(text)) return "escape, heat, and fantasy permission";
  if (/hotel|suite|private|vip|luxury/.test(text)) return "private luxury and intimate access";
  if (/kraken|night|danger|wild|dark/.test(text)) return "danger, appetite, and mythic tension";
  if ((analysis.backgroundComplexity || 0) > 0.6) return "controlled chaos converted into desire";
  return "direct performer magnetism and premium curiosity";
}

function heroDescription(analysis = {}) {
  const face = analysis?.detections?.face;
  const box = analysis.subjectBox || { x: 0.5, y: 0.18, w: 0.36, h: 0.66 };
  if (face) return "the performer’s face and body line";
  if (box.x + box.w * 0.5 < 0.45) return "the performer weighted on the left side";
  if (box.x + box.w * 0.5 > 0.55) return "the performer weighted on the right side";
  return "the performer’s central silhouette";
}

function judgeWorld({ candidate, metadata, analysis }) {
  const emotion = inferEmotion(metadata, analysis);
  const hero = heroDescription(analysis);
  const lightingClear = (analysis.subjectSeparation || 0.55) > 0.5;
  const environmentUseful = (analysis.backgroundComplexity || 0.42) < 0.72;
  const clickPromise = /escape|luxury|danger|desire|magnetism|tension|curiosity/.test(emotion);
  const score = clamp(52 + (lightingClear ? 14 : -8) + (environmentUseful ? 12 : -6) + (clickPromise ? 18 : 0) + (candidate.imageRole === "ai_reconstructed_hero" ? 8 : 0));
  return {
    engine: "World Knowledge Engine",
    score,
    whyItWorks: `${phrase(metadata)} sells when ${hero} becomes the emotional evidence. The cover must feel like a photographed moment with a clear consumer promise: ${emotion}.`,
    decisions: {
      story: phrase(metadata),
      hero,
      emotion,
      cameraLanguage: lightingClear ? "use confident subject separation and cinematic shadow" : "increase subject separation before trusting the frame",
      environment: environmentUseful ? "environment supports atmosphere" : "environment must be suppressed so clutter does not beat the performer",
      clickBehaviour: clickPromise ? "the image creates a simple reason to click" : "the click promise is still unclear",
    },
  };
}

function judgeDesign({ candidate, metadata, analysis }) {
  const titleClear = candidate.negativeSide === "left"
    ? candidate.titleZone.x + candidate.titleZone.w < (analysis.subjectBox?.x || 0.52) + 0.1
    : candidate.titleZone.x > (analysis.subjectBox?.x || 0.52) + (analysis.subjectBox?.w || 0.34) - 0.1;
  const logoQuiet = candidate.brandScale >= 0.06 && candidate.brandScale <= 0.13;
  const negativeSpaceMeaningful = (analysis.negativeSpace?.score || 0.55) > 0.46;
  const titleScalePremium = candidate.titleScale >= 0.052 && candidate.titleScale <= 0.145;
  const score = clamp(48 + (titleClear ? 18 : -12) + (logoQuiet ? 12 : -8) + (negativeSpaceMeaningful ? 14 : -6) + (titleScalePremium ? 10 : 0) + (candidate.grade ? 8 : 0));
  return {
    engine: "Design Knowledge Engine",
    score,
    whyItWorks: `Premium covers work when scale, contrast, and restraint make the title feel inevitable. This concept uses ${candidate.negativeSide} negative space so typography supports the performer instead of decorating the frame.`,
    decisions: {
      composition: titleClear ? "performer and title occupy separate psychological zones" : "composition needs better performer/title separation",
      typography: titleScalePremium ? "title can behave as emotional key art" : "title scale feels unstable",
      hierarchy: "performer first, title second, logo third",
      branding: logoQuiet ? "brand reads premium and controlled" : "logo hierarchy is too loud or too small",
      rhythm: negativeSpaceMeaningful ? "negative space creates pacing" : "negative space is not yet a story device",
    },
  };
}

function simulateDirector(world, design, { candidate, metadata, analysis }) {
  const eyeFlow = candidate.negativeSide === "left"
    ? "performer on the right → title tension on the left → quiet logo read"
    : "performer on the left → title tension on the right → quiet logo read";
  const emotion = world.decisions.emotion;
  const score = clamp((world.score * 0.5) + (design.score * 0.5));
  return {
    engine: "Creative Director",
    score,
    approved: score >= 76,
    questions: {
      story: world.decisions.story,
      hero: world.decisions.hero,
      eyeTravel: eyeFlow,
      emotionThatSells: emotion,
      composition: design.decisions.composition,
      typography: design.decisions.typography,
      branding: design.decisions.branding,
    },
    direction: `Sell ${emotion}. Keep the performer as the hero, make the eye travel ${eyeFlow}, and let typography behave like a cinematic promise rather than a label.`,
  };
}

function scoreTaste({ world, design, director, candidate }) {
  const dna = candidate.imageRole === "ai_reconstructed_hero" ? 8 : -10;
  return clamp(world.score * 0.28 + design.score * 0.28 + director.score * 0.32 + 12 + dna);
}

export function consultCreativeIntelligence({ candidate, metadata = {}, analysis = {} }) {
  const memory = safeReadMemory();
  const world = judgeWorld({ candidate, metadata, analysis });
  const design = judgeDesign({ candidate, metadata, analysis });
  const director = simulateDirector(world, design, { candidate, metadata, analysis });
  const tasteScore = scoreTaste({ world, design, director, candidate });
  const failures = [];
  if (world.score < 74) failures.push("World Knowledge rejected the concept: the real-world photographic or marketing reason is weak.");
  if (design.score < 74) failures.push("Design Knowledge rejected the concept: hierarchy, typography, or negative space is not premium enough.");
  if (!director.approved) failures.push("Creative Director rejected the concept before rendering.");
  if (tasteScore < 78) failures.push("Taste Engine rejected the concept as not selective enough for premium entertainment artwork.");

  const creativeBrief = {
    engine: "Explainability Engine",
    approved: failures.length === 0,
    score: Math.round((world.score + design.score + director.score + tasteScore) / 4),
    story: director.questions.story,
    emotionalGoal: director.questions.emotionThatSells,
    hero: director.questions.hero,
    composition: director.questions.composition,
    typographyStrategy: director.questions.typography,
    visualHierarchy: director.questions.branding,
    expectedEyeFlow: director.questions.eyeTravel,
    elementReasons: [
      `Performer exists to carry story and desire: ${director.questions.hero}.`,
      `Title exists to name the emotion, not to fill space: ${director.questions.emotionThatSells}.`,
      "Logo exists as a restrained luxury signature, never as decoration.",
      "Shadow and negative space exist to guide attention and remove accidental clutter.",
    ],
    text: [
      "CREATIVE BRIEF",
      `Story: ${director.questions.story}`,
      `Emotional goal: ${director.questions.emotionThatSells}`,
      `Hero: ${director.questions.hero}`,
      `Composition: ${director.questions.composition}`,
      `Typography strategy: ${director.questions.typography}`,
      `Visual hierarchy: performer first, title second, FLESHLAB signature third`,
      `Expected eye flow: ${director.questions.eyeTravel}`,
      "Element reasons:",
      "- Performer carries the story and must dominate attention.",
      "- Typography turns the story into a premium entertainment promise.",
      "- Branding confirms the universe without stealing focus.",
      "- Negative space creates tension, not emptiness.",
    ].join("\n"),
  };

  return {
    engines: { world, design, director },
    taste: { engine: "Taste Engine", score: Math.round(tasteScore), approved: tasteScore >= 78, memorySampleSize: memory.lessons.length },
    dna: { engine: "FLESHLAB DNA", values: FLESHLAB_DNA, approved: true },
    creativeBrief,
    overallScore: creativeBrief.score,
    approved: creativeBrief.approved,
    failures,
    reasoningPipeline: [
      "World Knowledge",
      "Design Knowledge",
      "Creative Direction",
      "Composition",
      "Photography",
      "Typography",
      "Branding",
      "Critique",
      "Automatic redesign",
      "Export",
    ],
  };
}

export function critiqueRenderedCover({ plan, renderMap, renderedScore }) {
  const intelligence = plan?.candidate?.creativeIntelligence || plan?.selected?.diagnostic?.creativeIntelligence;
  const score = Number(renderedScore) || 0;
  const questions = {
    wouldIClickThis: score >= 86 && intelligence?.taste?.approved,
    feelsPremium: score >= 88,
    feelsLikeFleshlab: intelligence?.dna?.approved && score >= 84,
    performerDominates: (plan?.selected?.score?.hero || 0) >= 62,
    typographyEmotionallyCorrect: (plan?.selected?.score?.title || 0) >= 78,
    everyElementHasPurpose: Boolean(intelligence?.creativeBrief?.approved),
    distracts: !intelligence?.approved || score < 84,
    agencyApproved: score >= 88 && Boolean(intelligence?.approved),
  };
  const failures = Object.entries(questions)
    .filter(([key, value]) => key === "distracts" ? value : !value)
    .map(([key]) => key);
  const isFinalEditorialSource = renderMap.imageRole === "source_frame_editorial_final";
  const approved = isFinalEditorialSource ? score >= 78 && questions.performerDominates && questions.typographyEmotionallyCorrect : failures.length === 0 && renderMap.imageRole === "ai_reconstructed_hero";
  return {
    engine: "Internal Critic",
    approved,
    score: Math.round(score),
    questions,
    verdict: approved ? "Approved for export." : "Rejected. Redesign automatically before export.",
    redesignDirectives: failures.map(item => `Improve: ${item.replace(/([A-Z])/g, " $1").toLowerCase()}.`),
  };
}

export function recordCreativeLesson({ plan, critic }) {
  const memory = safeReadMemory();
  const approved = Boolean(critic?.approved);
  const lesson = {
    at: new Date().toISOString(),
    approved,
    score: critic?.score || plan?.selected?.score?.total || 0,
    mood: plan?.candidate?.mood || plan?.selected?.diagnostic?.mood,
    imageRole: plan?.candidate?.imageRole || plan?.selected?.diagnostic?.imageRole,
    reasons: critic?.redesignDirectives || plan?.selected?.score?.qualityFailures || [],
  };
  memory.lessons = [lesson, ...(memory.lessons || [])].slice(0, 80);
  lesson.reasons.forEach(reason => {
    memory.rejectedReasons[reason] = (memory.rejectedReasons[reason] || 0) + (approved ? 0 : 1);
  });
  if (approved && lesson.mood) memory.approvedPatterns[lesson.mood] = (memory.approvedPatterns[lesson.mood] || 0) + 1;
  safeWriteMemory(memory);
  return memory;
}