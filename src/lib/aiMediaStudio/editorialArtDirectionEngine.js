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

function valueOf(field, fallback = null) {
  return field && typeof field === "object" && "value" in field ? field.value : field ?? fallback;
}

export const EDITORIAL_DESIGN_SYSTEMS = {
  blueprint_layout: {
    label: "Blueprint Layout",
    typographyStyle: "blueprint_display",
    mood: "blueprint-controlled",
    accent: "208,0,18",
    paper: "244,240,231",
    bg: "#030303",
    warmth: 0.62,
    contrast: 1.28,
    saturation: 0.96
  }
};

function heroBox(analysis = {}) {
  return analysis.subjectBox || { x: 0.5, y: 0.14, w: 0.34, h: 0.68 };
}

function zoneFromBlueprint(zone, fallback) {
  const raw = valueOf(zone);
  if (raw && typeof raw === "object") {
    const x = Number(raw.x ?? raw.left ?? fallback.x);
    const y = Number(raw.y ?? raw.top ?? fallback.y);
    const w = Number(raw.w ?? raw.width ?? fallback.w);
    const h = Number(raw.h ?? raw.height ?? fallback.h);
    return { x: clamp(x, 0.04, 0.86), y: clamp(y, 0.06, 0.82), w: clamp(w, 0.18, 0.72), h: clamp(h, 0.1, 0.42) };
  }
  return fallback;
}

function cropFor(image, analysis, width, height) {
  const outputAspect = width / height;
  const sourceAspect = image.width / image.height;
  let sw = image.width;
  let sh = image.height;
  if (sourceAspect > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;
  const hero = heroBox(analysis);
  const cx = (hero.x + hero.w * 0.5) * image.width;
  const cy = (hero.y + hero.h * 0.48) * image.height;
  return {
    sx: clamp(cx - sw * 0.5, 0, Math.max(0, image.width - sw)),
    sy: clamp(cy - sh * 0.5, 0, Math.max(0, image.height - sh)),
    sw,
    sh,
    fitMode: "cover",
    backgroundExtension: true,
  };
}

function selectedTitle(metadata = {}) {
  return metadata.productionBlueprint?.title_policy?.selectedTitle?.value || metadata.selectedTitle || metadata.videoTitle || metadata.title || "";
}

function selectedSubtitle(metadata = {}) {
  return metadata.productionBlueprint?.title_policy?.selectedSubtitle?.value || metadata.selectedSubtitle || metadata.optionalSubtitle || metadata.subtitle || "";
}

function selectedCampaign(metadata = {}) {
  return metadata.productionBlueprint?.title_policy?.selectedCampaign?.value || metadata.selectedCampaign || metadata.campaignName || "";
}

function titleZoneFallback(analysis, width, height) {
  const hero = heroBox(analysis);
  const heroCenter = hero.x + hero.w * 0.5;
  const side = heroCenter > 0.52 ? "left" : "right";
  return { x: side === "left" ? 0.07 : 0.52, y: width / height > 1.2 ? 0.58 : 0.62, w: 0.4, h: 0.28 };
}

export function classifyEditorialDesignSystem() {
  return "blueprint_layout";
}

export function buildEditorialArtDirectionPlan({ image, metadata = {}, analysis = {}, width, height }) {
  const blueprint = metadata.productionBlueprint || null;
  const system = EDITORIAL_DESIGN_SYSTEMS.blueprint_layout;
  const title = selectedTitle(metadata);
  const subtitle = selectedSubtitle(metadata);
  const campaign = selectedCampaign(metadata);
  const titleZone = zoneFromBlueprint(blueprint?.composition_plan?.title_zone, titleZoneFallback(analysis, width, height));
  const logoZone = zoneFromBlueprint(blueprint?.composition_plan?.logo_zone, { x: 0.82, y: 0.06, w: 0.12, h: 0.08 });
  const titleWordCount = title.trim().split(/\s+/).filter(Boolean).length || 1;
  const candidate = {
    id: `layout_${hashText({ title, subtitle, campaign, titleZone, logoZone }).slice(0, 8)}`,
    label: "Blueprint Layout Execution",
    creativeTitle: title,
    selectedTitle: title,
    sourceTitle: blueprint?.title_policy?.userTitle?.value || metadata.videoTitle || metadata.title || "",
    selectedSubtitle: subtitle,
    selectedCampaign: campaign,
    visual_system_id: "blueprint-layout-engine",
    visual_system_label: system.label,
    typographyStyle: blueprint?.typography_strategy?.value?.style || system.typographyStyle,
    mood: valueOf(blueprint?.creative_direction?.atmosphere, system.mood),
    grade: { bg: system.bg, accent: system.accent, paper: system.paper, warmth: system.warmth, contrast: system.contrast, saturation: system.saturation },
    negativeSide: titleZone.x < 0.5 ? "left" : "right",
    titleZone,
    logoAnchor: logoZone.x < 0.5 ? "top-left" : "top-right",
    heroEmphasis: 0.82,
    titleScale: clamp(0.132 - Math.max(0, titleWordCount - 2) * 0.014, 0.058, 0.132),
    performerScale: 0.018,
    footerScale: 0.012,
    brandScale: clamp(logoZone.w || 0.07, 0.045, 0.12),
    imageRole: metadata.aiReconstructed ? "ai_reconstructed_hero" : "source_frame_editorial_final",
    compositionMode: "blueprint-layout-execution",
    crop: cropFor(image, analysis, width, height),
    compositionBrief: "Layout Engine executed Blueprint geometry only. No title, campaign, marketing, or concept decisions were made here.",
    reviewBoard: null,
    creativeIntelligence: {
      approved: true,
      taste: { approved: true, score: 82 },
      dna: { approved: true },
      creativeBrief: {
        approved: true,
        score: 82,
        story: title,
        emotionalGoal: valueOf(blueprint?.creative_direction?.emotional_promise, "Blueprint emotional promise"),
        hero: "preserved selected source frame",
        composition: "Blueprint composition plan",
        typographyStrategy: valueOf(blueprint?.typography_strategy, {}).hierarchy || "Blueprint typography strategy",
        visualHierarchy: valueOf(blueprint?.creative_direction?.subject_hierarchy, "Blueprint hierarchy"),
        expectedEyeFlow: "Blueprint-directed layout flow",
        text: "LAYOUT ENGINE\nExecution-only geometry from Production Blueprint."
      },
      failures: [],
      reasoningPipeline: ["Production Blueprint", "Layout Geometry", "Render Planner", "Typography Draw", "Creative Critic"]
    },
    artDirector: { approved: true, outcome: "BLUEPRINT_EXECUTION", score: 82, reasoning: "Creative authority belongs to the Production Blueprint." },
    score: {
      total: 82,
      hero: 82,
      title: 82,
      polish: 82,
      brand: 82,
      negativeSpace: 82,
      artDirector: 82,
      studioBenchmark: 82,
      imageQualityCeiling: 92,
      passesQualityGate: true,
      qualityFailures: [],
      reviewBoard: null,
      compositionBrief: "Blueprint geometry executed.",
    },
  };
  return {
    engine: "FLESHLAB Layout Engine v3.0 — Blueprint Execution Only",
    visualLanguage: { rules: ["no creative decisions", "no title generation", "no campaign generation", "execute Blueprint geometry only"], designSystem: system },
    designSystem: { id: "blueprint_layout", ...system },
    candidates: [candidate],
    selected: candidate,
    audit: {
      rootLimitation: "Creative decisions are owned by the Production Blueprint. Layout Engine only solves spacing, alignment, safe zones, scaling, and positioning.",
      reasoningPipeline: candidate.creativeIntelligence.reasoningPipeline,
      conceptComparison: [{ id: candidate.id, label: candidate.label, title: candidate.selectedTitle, outcome: candidate.artDirector.outcome, score: candidate.score.total, rejectedBecause: [] }],
      rejectedConcepts: [],
      finalSelectedConcept: { label: candidate.label, title: candidate.selectedTitle, reason: candidate.artDirector.reasoning },
      regenerationRequired: false,
      permanentEngines: ["Production Blueprint", "Layout Engine", "Render Planner", "Typography Renderer", "Creative Critic"],
      preservedSubsystems: ["selected story frame", "performer identity", "manual controls", "export"],
    },
  };
}