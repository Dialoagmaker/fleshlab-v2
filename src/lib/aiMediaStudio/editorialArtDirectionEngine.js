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

function textFor(metadata = {}) {
  return `${metadata.videoTitle || metadata.title || ""} ${metadata.optionalSubtitle || metadata.subtitle || ""} ${metadata.contentType || ""} ${metadata.campaignName || ""}`.toLowerCase();
}

export const EDITORIAL_DESIGN_SYSTEMS = {
  luxury_hotel: { label: "Luxury Hotel", typographyStyle: "luxury_serif", mood: "private luxury", accent: "214,166,94", paper: "250,238,216", bg: "#080403", warmth: 0.92, contrast: 1.25, saturation: 1.04 },
  travel_poster: { label: "Travel Poster", typographyStyle: "travel_poster", mood: "escape", accent: "238,104,42", paper: "255,238,206", bg: "#091018", warmth: 0.86, contrast: 1.18, saturation: 1.12 },
  netflix_drama: { label: "Netflix Drama", typographyStyle: "drama_condensed", mood: "cinematic drama", accent: "208,0,18", paper: "244,240,231", bg: "#030303", warmth: 0.55, contrast: 1.36, saturation: 0.92 },
  reality_show: { label: "Reality Show", typographyStyle: "reality_bold", mood: "direct reality", accent: "255,62,36", paper: "255,255,255", bg: "#08090b", warmth: 0.66, contrast: 1.28, saturation: 1.08 },
  action: { label: "Action", typographyStyle: "action_impact", mood: "hard impact", accent: "221,24,38", paper: "235,238,239", bg: "#030405", warmth: 0.38, contrast: 1.44, saturation: 0.9 },
  lifestyle_magazine: { label: "Lifestyle Magazine", typographyStyle: "magazine_editorial", mood: "editorial lifestyle", accent: "225,196,148", paper: "250,246,238", bg: "#090706", warmth: 0.78, contrast: 1.18, saturation: 0.98 },
  minimal_premium: { label: "Minimal Premium", typographyStyle: "minimal_spaced", mood: "quiet premium", accent: "208,0,18", paper: "245,242,236", bg: "#030303", warmth: 0.52, contrast: 1.32, saturation: 0.86 },
  dark_erotic_cinema: { label: "Dark Erotic Cinema", typographyStyle: "dark_cinema", mood: "low-key cinema", accent: "208,0,18", paper: "244,240,231", bg: "#010101", warmth: 0.48, contrast: 1.48, saturation: 0.9 },
  vacation: { label: "Vacation", typographyStyle: "vacation_script", mood: "vacation heat", accent: "255,126,47", paper: "255,239,204", bg: "#071018", warmth: 0.9, contrast: 1.18, saturation: 1.15 },
  summer: { label: "Summer", typographyStyle: "vacation_script", mood: "summer glow", accent: "255,184,64", paper: "255,247,222", bg: "#0a1316", warmth: 0.94, contrast: 1.15, saturation: 1.16 },
  urban: { label: "Urban", typographyStyle: "urban_stack", mood: "city tension", accent: "208,0,18", paper: "238,238,232", bg: "#050607", warmth: 0.42, contrast: 1.4, saturation: 0.92 },
  gym: { label: "Gym", typographyStyle: "action_impact", mood: "hard-body discipline", accent: "190,22,36", paper: "232,235,236", bg: "#030405", warmth: 0.34, contrast: 1.46, saturation: 0.9 },
};

export function classifyEditorialDesignSystem(metadata = {}, analysis = {}) {
  const text = textFor(metadata);
  if (/hotel|suite|room|romance|luxury|vip/.test(text)) return "luxury_hotel";
  if (/beach|travel|trip|island|destination|adventure/.test(text)) return "travel_poster";
  if (/vacation|holiday|escape/.test(text)) return "vacation";
  if (/summer|pool|sun/.test(text)) return "summer";
  if (/gym|workout|fit|trainer|muscle/.test(text)) return "gym";
  if (/documentary|story|behind|real/.test(text)) return "lifestyle_magazine";
  if (/reality|casting|live/.test(text)) return "reality_show";
  if (/action|fight|chase|intense/.test(text)) return "action";
  if (/urban|city|street|night/.test(text)) return "urban";
  if (/dark|cinema|fantasy|massage|private/.test(text)) return "dark_erotic_cinema";
  if ((analysis.backgroundComplexity || 0) < 0.38) return "minimal_premium";
  return "netflix_drama";
}

function heroBox(analysis = {}) {
  return analysis.subjectBox || { x: 0.5, y: 0.14, w: 0.34, h: 0.68 };
}

function negativeSide(hero, conceptIndex) {
  if (conceptIndex === 1) return hero.x + hero.w * 0.5 > 0.5 ? "left" : "right";
  if (conceptIndex === 2) return hero.x + hero.w * 0.5 > 0.5 ? "right" : "left";
  return hero.x + hero.w * 0.5 > 0.52 ? "left" : "right";
}

function cropFor(image, analysis, width, height, side, conceptIndex) {
  const outputAspect = width / height;
  const sourceAspect = image.width / image.height;
  const hero = heroBox(analysis);
  const portraitToLandscape = sourceAspect < 0.95 && outputAspect > 1.2;
  if (portraitToLandscape || conceptIndex === 1) {
    return { sx: 0, sy: 0, sw: image.width, sh: image.height, fitMode: "portraitEditorial", portraitX: side === "left" ? 0.66 : 0.34, backgroundExtension: true };
  }
  let sw = image.width;
  let sh = image.height;
  if (sourceAspect > outputAspect) sw = image.height * outputAspect;
  else sh = image.width / outputAspect;
  const zoom = [1.08, 1.0, 1.18][conceptIndex] || 1.08;
  sw /= zoom;
  sh /= zoom;
  const cx = (hero.x + hero.w * (side === "left" ? 0.64 : 0.36)) * image.width;
  const cy = (hero.y + hero.h * ([0.44, 0.5, 0.38][conceptIndex] || 0.46)) * image.height;
  return {
    sx: clamp(cx - sw * (side === "left" ? 0.64 : 0.36), 0, Math.max(0, image.width - sw)),
    sy: clamp(cy - sh * 0.48, 0, Math.max(0, image.height - sh)),
    sw,
    sh,
    zoom,
    fitMode: "cover",
    backgroundExtension: true,
  };
}

const REVIEW_CATEGORIES = [
  "Visual Impact",
  "Originality",
  "Storytelling",
  "Marketing Strength",
  "Luxury Feel",
  "Streaming Appeal",
  "Brand Identity",
  "Thumbnail Performance",
  "Emotional Hook",
  "Professionalism",
];

function titleZoneFor(side, conceptIndex, aspect) {
  const wide = aspect > 1.2;
  if (conceptIndex === 0) return { x: side === "left" ? 0.1 : 0.47, y: wide ? 0.58 : 0.62, w: wide ? 0.42 : 0.46, h: 0.28 };
  if (conceptIndex === 1) return { x: side === "left" ? 0.075 : 0.5, y: wide ? 0.11 : 0.12, w: wide ? 0.34 : 0.4, h: 0.32 };
  return { x: side === "left" ? 0.18 : 0.12, y: wide ? 0.69 : 0.66, w: wide ? 0.56 : 0.68, h: 0.22 };
}

function conceptLabel(index) {
  return ["Concept A — Cinematic Poster", "Concept B — Luxury Editorial Magazine", "Concept C — Streaming Platform Key Art"][index] || `Concept ${index + 1}`;
}

function conceptArchetype(index) {
  return [
    {
      composition: "cinematic rule-of-thirds crop with performer atmosphere, deep shadow, and title integrated into the scene",
      hierarchy: "image and emotion first, title as a restrained dramatic promise",
      crop: "tighter dramatic crop with directional eye travel",
      colorTreatment: "dark cinema grade with controlled FLESHLAB red tension",
      emotionalFocus: "curiosity and private access",
    },
    {
      composition: "luxury editorial negative space with asymmetry, restraint, and magazine cover discipline",
      hierarchy: "portrait presence first, premium whitespace second, quiet title third",
      crop: "protected portrait crop with background extension",
      colorTreatment: "warm editorial contrast with tactile premium paper tones",
      emotionalFocus: "exclusivity and intimate confidence",
    },
    {
      composition: "streaming key-art lockup with full-bleed cinematic image, bottom title field, and thumbnail punch",
      hierarchy: "instant read at small size while preserving performer dominance",
      crop: "bolder impact crop with strong foreground/background separation",
      colorTreatment: "high-contrast platform grade with bold brand recognition",
      emotionalFocus: "clickable episode-level tension",
    },
  ][index];
}

function looksLiteralTitle(title) {
  const text = String(title || "").toLowerCase();
  return !text || text.split(/\s+/).length > 5 || /scene|video|cover|episode|part|with|featuring|compilation|full|trailer/.test(text);
}

function premiumTitleFor(metadata = {}, index) {
  const supplied = metadata.videoTitle || metadata.title || metadata.campaignName || "";
  if (!looksLiteralTitle(supplied)) return supplied;
  const text = textFor(metadata);
  const bank = /hotel|suite|room|private|vip/.test(text)
    ? ["After Check-In", "Private Premiere", "Room Key"]
    : /beach|summer|vacation|pool|island/.test(text)
      ? ["Heat Index", "The Escape", "Sun Permission"]
      : /gym|workout|fit|trainer/.test(text)
        ? ["Hard Form", "Discipline", "The Set"]
        : /night|dark|city|urban/.test(text)
          ? ["After Dark", "No Witness", "Night Signal"]
          : ["The Invitation", "Private Signal", "Amateur Wins"];
  return bank[index % bank.length];
}

function boardEntry(score, reasoning) {
  return { score: Math.round(clamp(score, 0, 100)), reasoning };
}

function reviewConcept({ candidate, archetype, metadata, analysis, index }) {
  const separation = analysis.subjectSeparation || 0.55;
  const negative = analysis.negativeSpace?.score || 0.52;
  const titlePremium = !looksLiteralTitle(candidate.creativeTitle);
  const titleTooDominant = candidate.titleScale > 0.13 || candidate.titleZone.w > 0.62;
  const splitLayoutRisk = candidate.titleZone.x > 0.52 && (analysis.subjectBox?.x || 0.5) < 0.38;
  const impactBase = 78 + separation * 12 + (index === 2 ? 4 : 0) - (titleTooDominant ? 10 : 0);
  const board = {
    "Visual Impact": boardEntry(impactBase, `${archetype.composition}; performer remains the attention anchor instead of becoming decoration.`),
    Originality: boardEntry(82 + index * 4 - (splitLayoutRisk ? 12 : 0), `Concept is judged as a real art direction, not a color swap: ${archetype.crop}.`),
    Storytelling: boardEntry(80 + (titlePremium ? 8 : -10) + separation * 5, `Title and image must create a story question: “${candidate.creativeTitle}” supports ${archetype.emotionalFocus}.`),
    "Marketing Strength": boardEntry(82 + (index === 2 ? 7 : 0) + (titlePremium ? 4 : -8), "Judged for premium click intent, not literal description."),
    "Luxury Feel": boardEntry(80 + (index === 1 ? 10 : 3) + negative * 5 - (titleTooDominant ? 8 : 0), "Luxury requires restraint, hierarchy, and intentional negative space."),
    "Streaming Appeal": boardEntry(81 + (index === 2 ? 10 : index === 0 ? 5 : 0), "Must look plausible beside Netflix/HBO/A24/Apple TV+ key art."),
    "Brand Identity": boardEntry(84 + (candidate.brandScale >= 0.06 ? 5 : -6), "FLESHLAB should feel premium, modern, bold, authentic, and not logo-dependent."),
    "Thumbnail Performance": boardEntry(80 + (index === 2 ? 9 : 2) - (titleTooDominant ? 7 : 0), "Small-size read must preserve image impact and curiosity."),
    "Emotional Hook": boardEntry(81 + (titlePremium ? 8 : -12) + separation * 4, `Emotional hook is ${archetype.emotionalFocus}, not a caption of the image.`),
    Professionalism: boardEntry(83 + (titleTooDominant ? -10 : 5) - (splitLayoutRisk ? 9 : 0), "Approval requires professional entertainment marketing quality, not technical correctness."),
  };
  const scores = Object.values(board).map(item => item.score);
  const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const lowest = Math.min(...scores);
  const outcome = average >= 88 && lowest >= 78 && !titleTooDominant && !splitLayoutRisk ? "APPROVED" : average >= 78 ? "REVISE" : "REJECT";
  const rejectedBecause = [];
  if (titleTooDominant) rejectedBecause.push("Typography risks overpowering the image.");
  if (splitLayoutRisk) rejectedBecause.push("Composition risks becoming a basic left-image/right-headline template.");
  if (!titlePremium) rejectedBecause.push("Title is too literal for premium entertainment marketing.");
  if (average < 88) rejectedBecause.push("Review Board score does not reach professional key-art quality.");
  return {
    categories: REVIEW_CATEGORIES.map(name => ({ name, ...board[name] })),
    average,
    lowest,
    outcome,
    approved: outcome === "APPROVED",
    rejectedBecause,
    directorReasoning: outcome === "APPROVED"
      ? `Approved because it reaches professional key-art quality: ${archetype.hierarchy}, ${archetype.colorTreatment}, and a curiosity-led title.`
      : `Not approved because ${rejectedBecause.join(" ")}`,
  };
}

function creativeBriefFor(system, metadata, candidate, archetype, review) {
  const title = candidate.creativeTitle;
  return {
    approved: review.approved,
    score: review.average,
    story: title,
    emotionalGoal: archetype.emotionalFocus,
    hero: "the preserved selected story frame performer",
    composition: archetype.composition,
    typographyStrategy: `${system.label} typography must support the image: size, weight, contrast, balance, readability, luxury, magazine quality, and poster quality are all judged.`,
    visualHierarchy: archetype.hierarchy,
    expectedEyeFlow: candidate.negativeSide === "left" ? "performer field → emotional title tension → quiet FLESHLAB signature" : "performer presence → atmosphere → designed title → quiet FLESHLAB signature",
    text: `EDITORIAL ART DIRECTION\nDesign system: ${system.label}\nPremium title: ${title}\nComposition: ${archetype.composition}\nCrop: ${archetype.crop}\nHierarchy: ${archetype.hierarchy}\nColor: ${archetype.colorTreatment}\nEmotional focus: ${archetype.emotionalFocus}\nCreative Director outcome: ${review.outcome}\nCreative Director reasoning: ${review.directorReasoning}`,
  };
}

export function buildEditorialArtDirectionPlan({ image, metadata = {}, analysis = {}, width, height }) {
  const systemId = classifyEditorialDesignSystem(metadata, analysis);
  const system = EDITORIAL_DESIGN_SYSTEMS[systemId] || EDITORIAL_DESIGN_SYSTEMS.netflix_drama;
  const hero = heroBox(analysis);
  const aspect = width / height;
  const concepts = [0, 1, 2].map(index => {
    const side = negativeSide(hero, index);
    const archetype = conceptArchetype(index);
    const concept = conceptLabel(index);
    const titleZone = titleZoneFor(side, index, aspect);
    const baseCandidate = {
      creativeTitle: premiumTitleFor(metadata, index),
      label: concept,
      negativeSide: side,
      titleZone,
      titleScale: clamp(index === 2 ? 0.104 : 0.118 - String(metadata.videoTitle || metadata.title || "").split(/\s+/).length * 0.006, 0.058, 0.122),
      brandScale: index === 1 ? 0.055 : 0.064,
    };
    const review = reviewConcept({ candidate: baseCandidate, archetype, metadata, analysis, index });
    const creativeBrief = creativeBriefFor(system, metadata, baseCandidate, archetype, review);
    const qualityFailures = review.approved ? [] : review.rejectedBecause;
    return {
      id: `editorial_${index + 1}_${hashText({ systemId, title: metadata.videoTitle, index, premium: baseCandidate.creativeTitle }).slice(0, 6)}`,
      label: concept,
      conceptArchetype: archetype,
      creativeTitle: baseCandidate.creativeTitle,
      sourceTitle: metadata.videoTitle || metadata.title || "Untitled",
      visual_system_id: systemId,
      visual_system_label: system.label,
      typographyStyle: index === 1 ? "magazine_editorial" : index === 2 ? "drama_condensed" : system.typographyStyle,
      mood: system.mood,
      grade: { bg: system.bg, accent: system.accent, paper: system.paper, warmth: system.warmth, contrast: system.contrast, saturation: system.saturation },
      negativeSide: side,
      titleZone,
      logoAnchor: index === 2 ? "top-right" : side === "left" ? "top-left" : "top-right",
      heroEmphasis: clamp([0.82, 0.74, 0.88][index], 0.68, 0.9),
      titleScale: baseCandidate.titleScale,
      performerScale: 0.018,
      footerScale: 0.012,
      brandScale: baseCandidate.brandScale,
      imageRole: "source_frame_editorial_final",
      compositionMode: ["cinematic-poster-depth", "luxury-editorial-negative-space", "streaming-platform-key-art"][index],
      crop: cropFor(image, analysis, width, height, side, index),
      compositionBrief: creativeBrief.text,
      reviewBoard: review,
      creativeIntelligence: {
        approved: review.approved,
        taste: { approved: review.approved, score: review.average },
        dna: { approved: review.categories.find(item => item.name === "Brand Identity")?.score >= 78 },
        creativeBrief,
        failures: qualityFailures,
        reviewBoard: review,
        reasoningPipeline: ["Concept Exploration", "Review Board", "Title Quality", "Creative Director", "Rejection Authority", "Selection"],
      },
      artDirector: { approved: review.approved, outcome: review.outcome, score: review.average, reasoning: review.directorReasoning, reviewBoard: review },
      score: {
        total: review.average,
        hero: review.categories.find(item => item.name === "Visual Impact")?.score || review.average,
        title: review.categories.find(item => item.name === "Emotional Hook")?.score || review.average,
        polish: review.categories.find(item => item.name === "Professionalism")?.score || review.average,
        brand: review.categories.find(item => item.name === "Brand Identity")?.score || review.average,
        negativeSpace: review.categories.find(item => item.name === "Luxury Feel")?.score || review.average,
        artDirector: review.average,
        studioBenchmark: review.average,
        imageQualityCeiling: 92,
        passesQualityGate: review.approved,
        qualityFailures,
        reviewBoard: review,
        compositionBrief: creativeBrief.text,
        creativeIntelligence: { creativeBrief, reviewBoard: review },
      },
    };
  });
  const approvedConcepts = concepts.filter(candidate => candidate.artDirector.approved).sort((a, b) => b.score.total - a.score.total);
  const rankedConcepts = [...concepts].sort((a, b) => b.score.total - a.score.total);
  const selected = approvedConcepts[0] || rankedConcepts[0];
  return {
    engine: "FLESHLAB Editorial Art Direction Engine v2.0 — Creative Director Remediation",
    visualLanguage: { rules: ["three genuinely different concepts", "Review Board critique before approval", "Creative Director may reject all concepts", "premium title quality", "professional entertainment key-art threshold"], designSystem: system },
    designSystem: { id: systemId, ...system },
    candidates: concepts,
    selected,
    audit: {
      rootLimitation: "AI Hero Photography is optional. The selected Story Frame is the final hero asset and is never replaced.",
      reasoningPipeline: selected.creativeIntelligence.reasoningPipeline,
      conceptComparison: concepts.map(candidate => ({ id: candidate.id, label: candidate.label, title: candidate.creativeTitle, outcome: candidate.artDirector.outcome, score: candidate.score.total, rejectedBecause: candidate.score.qualityFailures })),
      rejectedConcepts: concepts.filter(candidate => !candidate.artDirector.approved).map(candidate => ({ label: candidate.label, title: candidate.creativeTitle, score: candidate.score.total, reasons: candidate.score.qualityFailures })),
      finalSelectedConcept: selected.artDirector.approved ? { label: selected.label, title: selected.creativeTitle, reason: selected.artDirector.reasoning } : null,
      regenerationRequired: approvedConcepts.length === 0,
      permanentEngines: ["Concept Explorer", "Creative Review Board", "Creative Director", "Typography Director", "Commercial Export"],
      preservedSubsystems: ["selected story frame", "performer identity", "manual controls", "export"],
    },
  };
}