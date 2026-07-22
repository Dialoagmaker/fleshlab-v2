function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function ratio(format) { return format.width / format.height; }
function upper(value) { return String(value || "").trim().toUpperCase(); }
function zone(x, y, w, h) { return { x: clamp(x), y: clamp(y), w: clamp(w, 0.02), h: clamp(h, 0.02) }; }

const STRATEGIES = {
  subject_left_typography_right: { family: "bold_editorial", image: 0.64, type: 0.28, brand: 0.08 },
  subject_right_typography_left: { family: "premium_editorial", image: 0.7, type: 0.22, brand: 0.08 },
  centered_cinematic: { family: "cinematic_documentary", image: 0.78, type: 0.14, brand: 0.08 },
  bottom_title_editorial: { family: "magazine_cover", image: 0.68, type: 0.24, brand: 0.08 },
  minimal_corner_lockup: { family: "minimal_premium", image: 0.84, type: 0.1, brand: 0.06 },
  conversion_first_landing: { family: "commercial_advertising", image: 0.55, type: 0.34, brand: 0.11 },
  exclusivity_ppv_cover: { family: "exclusive_premium_cover", image: 0.64, type: 0.27, brand: 0.09 },
  creator_led_portrait: { family: "creator_led_portrait", image: 0.72, type: 0.2, brand: 0.08 },
  full_bleed_documentary: { family: "full_bleed_documentary", image: 0.82, type: 0.12, brand: 0.06 },
};

const PLATFORM_RULES = {
  youtube_thumbnail: { strategyBias: ["subject_left_typography_right", "subject_right_typography_left", "bottom_title_editorial"], maxLines: 2, cta: false, logoScale: 0.105, titleScale: "dominant", cropZoom: 1.14, safe: 0.045 },
  youtube_cover: { strategyBias: ["centered_cinematic", "subject_right_typography_left", "minimal_corner_lockup"], maxLines: 2, cta: false, logoScale: 0.072, titleScale: "balanced", cropZoom: 1, safe: 0.09 },
  x_banner: { strategyBias: ["minimal_corner_lockup", "subject_right_typography_left", "centered_cinematic"], maxLines: 1, cta: false, logoScale: 0.055, titleScale: "restrained", cropZoom: 0.98, safe: 0.08 },
  instagram_feed: { strategyBias: ["bottom_title_editorial", "creator_led_portrait", "subject_right_typography_left"], maxLines: 3, cta: true, logoScale: 0.085, titleScale: "editorial", cropZoom: 1.05, safe: 0.06 },
  instagram_story: { strategyBias: ["creator_led_portrait", "bottom_title_editorial", "conversion_first_landing"], maxLines: 3, cta: true, logoScale: 0.092, titleScale: "dominant", cropZoom: 1.18, safe: 0.11 },
  facebook_cover: { strategyBias: ["subject_right_typography_left", "centered_cinematic", "minimal_corner_lockup"], maxLines: 2, cta: false, logoScale: 0.06, titleScale: "balanced", cropZoom: 1, safe: 0.07 },
  website_hero: { strategyBias: ["conversion_first_landing", "subject_right_typography_left", "centered_cinematic"], maxLines: 3, cta: true, logoScale: 0.07, titleScale: "dominant", cropZoom: 1, safe: 0.07 },
  landing_page_banner: { strategyBias: ["conversion_first_landing", "subject_left_typography_right", "minimal_corner_lockup"], maxLines: 2, cta: true, logoScale: 0.065, titleScale: "dominant", cropZoom: 1, safe: 0.07 },
  ppv_cover: { strategyBias: ["exclusivity_ppv_cover", "creator_led_portrait", "bottom_title_editorial"], maxLines: 3, cta: true, logoScale: 0.088, titleScale: "dominant", cropZoom: 1.2, safe: 0.065 },
  exclusive_release_cover: { strategyBias: ["exclusivity_ppv_cover", "magazine_cover", "creator_led_portrait"], maxLines: 3, cta: true, logoScale: 0.084, titleScale: "dominant", cropZoom: 1.16, safe: 0.06 },
  behind_the_scenes_cover: { strategyBias: ["full_bleed_documentary", "minimal_corner_lockup", "centered_cinematic"], maxLines: 3, cta: false, logoScale: 0.064, titleScale: "restrained", cropZoom: 1, safe: 0.06 },
};

const CREATIVE_DIRECTIONS = {
  luxury_editorial: { label: "Luxury Editorial", grade: "soft_luxury_editorial", strategies: { default: ["minimal_corner_lockup", "centered_cinematic", "bottom_title_editorial"], ppv_cover: ["minimal_corner_lockup", "exclusivity_ppv_cover", "creator_led_portrait"] }, weight: { image: 0.86, typography: 0.08, brand: 0.06 }, logo: 0.72, titleScale: "restrained", crop: 0.96, cta: "subtle" },
  netflix_documentary: { label: "Netflix Documentary", grade: "dark_documentary", strategies: { default: ["full_bleed_documentary", "centered_cinematic", "bottom_title_editorial"], youtube_thumbnail: ["centered_cinematic", "bottom_title_editorial", "full_bleed_documentary"] }, weight: { image: 0.76, typography: 0.18, brand: 0.06 }, logo: 0.7, titleScale: "cinematic", crop: 1.06, cta: "hidden" },
  streetwear_drop: { label: "Streetwear Drop", grade: "high_energy_drop", strategies: { default: ["bottom_title_editorial", "subject_left_typography_right", "subject_right_typography_left"], instagram_story: ["conversion_first_landing", "creator_led_portrait", "bottom_title_editorial"], ppv_cover: ["exclusivity_ppv_cover", "bottom_title_editorial", "creator_led_portrait"] }, weight: { image: 0.52, typography: 0.34, brand: 0.14 }, logo: 1.24, titleScale: "oversized", crop: 1.22, cta: "prominent" },
};

function overlaps(a, b) {
  if (!a || !b) return false;
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function titleIntelligence(title = "", maxLines = 3) {
  const words = upper(title).split(/\s+/).filter(Boolean);
  const dominant = words.slice().sort((a, b) => b.length - a.length).slice(0, 2);
  if (words.length <= maxLines) return { preferredLines: words, fallbackLines: [words.join(" ")], emphasisWords: dominant };
  const midpoint = Math.ceil(words.length / Math.min(maxLines, 3));
  const lines = [];
  for (let i = 0; i < words.length && lines.length < maxLines; i += midpoint) lines.push(words.slice(i, i + midpoint).join(" "));
  return { preferredLines: lines, fallbackLines: [words.join(" ")], emphasisWords: dominant };
}

function strategyGeometry(strategyId, analysis, format, rules) {
  const safe = rules.safe;
  const subjectSide = analysis.subjectSide || "center";
  const textOnLeft = strategyId.includes("right_typography_left") || (subjectSide === "right" && !strategyId.includes("centered"));
  const textOnRight = strategyId.includes("left_typography_right") || subjectSide === "left";
  const portrait = format.height > format.width;
  if (strategyId === "centered_cinematic") return { logo: zone(safe, safe, 0.2, 0.1), title: zone(0.24, 0.66, 0.52, 0.22), creator: zone(0.24, 0.86, 0.32, 0.06), cta: zone(0.58, 0.84, 0.24, 0.07), overlay: zone(0, 0.52, 1, 0.48), negativeSpaceTarget: "bottom_center" };
  if (strategyId === "bottom_title_editorial") return { logo: zone(safe, safe, 0.22, 0.1), title: zone(safe, 0.6, 0.72, 0.25), creator: zone(safe, 0.84, 0.34, 0.06), cta: zone(safe, 0.9, 0.3, 0.06), overlay: zone(0, 0.48, 1, 0.52), negativeSpaceTarget: "lower_band" };
  if (strategyId === "minimal_corner_lockup") return { logo: zone(safe, safe, 0.2, 0.09), title: zone(safe, 0.72, portrait ? 0.76 : 0.42, 0.16), creator: zone(safe, 0.88, 0.28, 0.05), cta: zone(0.68, 0.86, 0.22, 0.06), overlay: zone(0, 0.62, portrait ? 1 : 0.54, 0.38), negativeSpaceTarget: "corner_lockup" };
  if (strategyId === "conversion_first_landing") return { logo: zone(safe, safe, 0.2, 0.09), title: zone(safe, 0.24, portrait ? 0.78 : 0.4, 0.3), creator: zone(safe, 0.55, 0.34, 0.06), cta: zone(safe, 0.66, 0.28, 0.07), overlay: zone(0, 0, portrait ? 1 : 0.52, 1), negativeSpaceTarget: "copy_safe_region" };
  if (strategyId === "exclusivity_ppv_cover") return { logo: zone(safe, safe, 0.24, 0.1), title: zone(safe, 0.56, 0.78, 0.28), creator: zone(safe, 0.46, 0.5, 0.07), cta: zone(safe, 0.86, 0.38, 0.06), overlay: zone(0, 0.42, 1, 0.58), negativeSpaceTarget: "premium_lower_cover" };
  if (strategyId === "creator_led_portrait") return { logo: zone(safe, safe, 0.2, 0.09), title: zone(safe, 0.62, 0.72, 0.22), creator: zone(safe, 0.52, 0.48, 0.07), cta: zone(safe, 0.87, 0.34, 0.06), overlay: zone(0, 0.5, 1, 0.5), negativeSpaceTarget: "creator_story_band" };
  if (strategyId === "full_bleed_documentary") return { logo: zone(safe, safe, 0.18, 0.08), title: zone(safe, 0.7, 0.5, 0.16), creator: zone(safe, 0.86, 0.36, 0.05), cta: zone(0.68, 0.86, 0.2, 0.05), overlay: zone(0, 0.62, 0.7, 0.38), negativeSpaceTarget: "documentary_lower_left" };
  const x = textOnRight ? 0.57 : textOnLeft ? safe : analysis.negativeSpace?.x || safe;
  const w = portrait ? 0.78 : 0.38;
  return { logo: zone(x, safe, 0.2, 0.09), title: zone(x, portrait ? 0.5 : 0.28, w, portrait ? 0.26 : 0.34), creator: zone(x, portrait ? 0.78 : 0.62, w * 0.8, 0.06), cta: zone(x, portrait ? 0.86 : 0.72, w * 0.58, 0.07), overlay: zone(textOnRight ? 0.48 : 0, 0, portrait ? 1 : 0.52, 1), negativeSpaceTarget: textOnRight ? "right_center" : "left_center" };
}

function planCandidate(strategyId, input, index) {
  const rules = PLATFORM_RULES[input.format.key] || PLATFORM_RULES.instagram_feed;
  const strategy = STRATEGIES[strategyId] || STRATEGIES.subject_right_typography_left;
  const geometry = strategyGeometry(strategyId, input.analysis, input.format, rules);
  const titlePlan = titleIntelligence(input.campaignTitle, rules.maxLines);
  const logoProminence = input.format.role === "thumbnail" ? "visible_small_size" : strategy.brand > 0.09 ? "assertive" : "restrained";
  return {
    id: `${input.format.key}_${strategyId}_${index + 1}`,
    layoutFamily: strategy.family,
    strategy: strategyId,
    composition: { cropMode: ratio(input.format) > 2 ? "wide_asymmetric_stage" : input.format.height > input.format.width ? "vertical_creator_stage" : "asymmetric_medium_portrait", subjectAnchor: input.analysis.subjectSide === "left" ? "left_center" : input.analysis.subjectSide === "right" ? "right_center" : "center", subjectScale: rules.cropZoom, focalPriority: input.format.role === "thumbnail" ? ["face", "campaign_title", "brand", "creator"] : ["campaign_title", "face", "brand", "creator", "cta"], negativeSpaceTarget: geometry.negativeSpaceTarget, visualWeight: { image: strategy.image, typography: strategy.type, brand: strategy.brand } },
    brand: { logoZone: geometry.logo, logoScale: rules.logoScale, logoTreatment: "official_png_white_primary", showSlogan: input.format.key !== "youtube_thumbnail", sloganZone: "below_logo", brandProminence: logoProminence },
    title: { zone: geometry.title, alignment: geometry.title.x > 0.5 ? "left" : "left", maxWidth: geometry.title.w, maxLines: rules.maxLines, scaleIntent: rules.titleScale, case: "uppercase", tracking: "tight", contrastTreatment: "light_on_dark", lineBreakPlan: titlePlan },
    creator: { zone: geometry.creator, prominence: input.format.key.includes("ppv") ? "primary_support" : "secondary", format: "creator_credit" },
    cta: { visible: rules.cta, zone: geometry.cta, prominence: input.format.key.includes("landing") ? "secondary" : "tertiary", style: "brand_solid" },
    imageTreatment: { grade: input.format.key === "behind_the_scenes_cover" ? "documentary_warm" : "warm_cinematic", contrast: input.format.role === "thumbnail" ? "high" : "medium_high", backgroundSuppression: input.analysis.backgroundComplexity > 0.52 ? 0.28 : 0.16, edgeVignette: 0.08, textReadabilityOverlay: { enabled: true, zone: geometry.overlay, strength: input.analysis.backgroundComplexity > 0.52 ? 0.34 : 0.24 } },
    constraints: { neverCoverFace: true, neverCoverProtectedBodyZones: true, minimumLogoClearspace: 0.04, minimumTextContrastRatio: 4.5, minimumSafeMargin: rules.safe },
    platformDirection: { platform: input.format.key, aspectRatio: `${input.format.width}:${input.format.height}`, campaignGoal: input.campaignGoal || "conversion", releaseType: input.releaseType || "premium_release" },
    rationale: [],
  };
}

function applyCreativeDirection(plan, input) {
  const direction = CREATIVE_DIRECTIONS[input.creativeDirection];
  if (!direction) return plan;
  const next = { ...plan, creativeDirection: direction.label };
  next.layoutFamily = direction.label;
  next.composition = { ...next.composition, subjectScale: clamp(next.composition.subjectScale * direction.crop, 0.9, 1.34), visualWeight: direction.weight };
  next.brand = { ...next.brand, logoScale: clamp(next.brand.logoScale * direction.logo, 0.04, 0.16), brandProminence: direction.cta === "prominent" ? "assertive" : "restrained" };
  next.title = { ...next.title, scaleIntent: direction.titleScale };
  next.cta = { ...next.cta, visible: direction.cta === "hidden" ? false : next.cta.visible, prominence: direction.cta === "prominent" ? "primary" : "tertiary" };
  next.imageTreatment = { ...next.imageTreatment, grade: direction.grade, contrast: direction.grade === "dark_documentary" ? "high" : next.imageTreatment.contrast, backgroundSuppression: direction.grade === "high_energy_drop" ? 0.34 : direction.grade === "soft_luxury_editorial" ? 0.12 : next.imageTreatment.backgroundSuppression, textReadabilityOverlay: { ...next.imageTreatment.textReadabilityOverlay, strength: direction.grade === "high_energy_drop" ? 0.38 : direction.grade === "soft_luxury_editorial" ? 0.16 : 0.3 } };
  next.rationale = [...next.rationale, `${direction.label} forces ${next.strategy.replaceAll("_", " ")} with ${direction.titleScale} typography and ${direction.grade} image treatment.`];
  return next;
}

function scorePlan(plan, input) {
  const zones = [plan.brand.logoZone, plan.title.zone, plan.creator.zone, plan.cta.visible ? plan.cta.zone : null].filter(Boolean);
  const protectedZones = [input.analysis.detections?.face, input.analysis.detections?.body, input.analysis.detections?.torso].filter(Boolean);
  const rejectionReasons = [];
  if (input.analysis.detections?.face && zones.some(z => overlaps(z, input.analysis.detections.face))) rejectionReasons.push("overlaps face zone");
  if (protectedZones.slice(1).some(p => zones.some(z => overlaps(z, p)))) rejectionReasons.push("overlaps protected body zone");
  const safe = plan.constraints.minimumSafeMargin;
  if (zones.some(z => z.x < safe || z.y < safe || z.x + z.w > 1 - safe || z.y + z.h > 1 - safe)) rejectionReasons.push("outside platform safe margins");
  const neg = input.analysis.negativeSpace || { x: 0.1, y: 0.3, score: 0.4 };
  const titleCenter = { x: plan.title.zone.x + plan.title.zone.w / 2, y: plan.title.zone.y + plan.title.zone.h / 2 };
  const negativeSpaceUsage = clamp(1 - (Math.abs(titleCenter.x - (neg.x + neg.w / 2)) + Math.abs(titleCenter.y - (neg.y + neg.h / 2))) / 1.4);
  const readability = clamp((input.analysis.subjectSeparation || 0.5) * 0.35 + negativeSpaceUsage * 0.45 + (1 - (input.analysis.backgroundComplexity || 0.4)) * 0.2);
  if (readability < 0.34) rejectionReasons.push("insufficient readable text zone");
  const platformSuitability = PLATFORM_RULES[input.format.key]?.strategyBias.includes(plan.strategy) ? 0.92 : 0.68;
  const intent = plan.cta.visible === Boolean(PLATFORM_RULES[input.format.key]?.cta) ? 0.9 : 0.62;
  const score = Math.round(clamp(readability * 0.27 + platformSuitability * 0.24 + negativeSpaceUsage * 0.18 + intent * 0.16 + (rejectionReasons.length ? 0.2 : 0.88) * 0.15) * 100);
  return { total: score, subjectProtection: rejectionReasons.some(r => r.includes("face") || r.includes("body")) ? 0 : 100, titleReadability: Math.round(readability * 100), platformSuitability: Math.round(platformSuitability * 100), negativeSpaceUsage: Math.round(negativeSpaceUsage * 100), campaignIntent: Math.round(intent * 100), rejectionReasons, accepted: rejectionReasons.length === 0 && score >= 68 };
}

export function createArtDirectionPlan(input) {
  const rules = PLATFORM_RULES[input.format.key] || PLATFORM_RULES.instagram_feed;
  const direction = CREATIVE_DIRECTIONS[input.creativeDirection];
  const strategies = direction?.strategies?.[input.format.key] || direction?.strategies?.default || rules.strategyBias;
  const candidates = strategies.map((strategy, index) => applyCreativeDirection(planCandidate(strategy, input, index), input));
  const scored = candidates.map(candidate => ({ plan: candidate, score: scorePlan(candidate, input) }));
  scored.sort((a, b) => b.score.total - a.score.total);
  const selected = scored.find(item => item.score.accepted) || scored[0];
  const finalPlan = { ...selected.plan };
  finalPlan.rationale = [
    `Subject detected on ${input.analysis.subjectSide || "center"}; composition anchors subject as ${finalPlan.composition.subjectAnchor}.`,
    `Title line plan uses ${finalPlan.title.lineBreakPlan.preferredLines.length} line(s) for ${upper(input.campaignTitle).length} characters.`,
    `${input.format.label} uses ${finalPlan.strategy.replaceAll("_", " ")} to match platform behavior.`,
    `Text readability overlay targets ${finalPlan.composition.negativeSpaceTarget}.`,
    selected.score.rejectionReasons.length ? `Rejected risks handled: ${selected.score.rejectionReasons.join(", ")}.` : "Selected plan passed face/body, safe-margin and readability checks.",
  ];
  return { ...finalPlan, candidates: scored.map(item => item.plan), selectedCandidate: finalPlan.id, selectionScores: Object.fromEntries(scored.map(item => [item.plan.id, item.score])), selectionRationale: finalPlan.rationale, validation: selected.score };
}