import { analyzePosterImage } from "./posterAnalysis";
import { paintCommercialVisualSystem } from "./commercialVisualSystems";
import { buildFleshlabCoverPlan, stablePlanHash } from "./fleshlabVisualLanguage";
import { recordCreativeLesson } from "./creativeIntelligenceEngine";

const TARGET_STREAMING_SCORE = 88;

function automaticCandidateSettings(settings = {}) {
  return {
    formatId: settings.formatId,
    customWidth: settings.customWidth,
    customHeight: settings.customHeight,
    sellingPoints: settings.sellingPoints,
  };
}

function normalizeMetadata(metadata = {}, image = null) {
  const aiReconstructed = Boolean(metadata.aiReconstructed || image?.__fleshlabAIReconstructed);
  return {
    ...metadata,
    mainTitle: metadata.videoTitle || metadata.title || "",
    title: metadata.videoTitle || metadata.title || "",
    subtitle: metadata.optionalSubtitle || metadata.subtitle || "",
    episodeTitle: metadata.optionalSubtitle || metadata.subtitle || "",
    performer: metadata.performerName || metadata.performer || "",
    footerCategory: metadata.contentType || metadata.campaignName || "",
    marketingTagline: metadata.campaignName || metadata.contentType || "",
    aiReconstructed,
  };
}

function buildVariant(plan, candidate, index, width, height) {
  const hash = stablePlanHash({ candidate, width, height });
  const qualityFailures = candidate.score.qualityFailures || [];
  return {
    engine: plan.engine,
    candidate_id: candidate.id,
    iteration_id: `rule_pass_${index + 1}`,
    concept_id: `fleshlab_language_${stablePlanHash(plan.metadata).slice(0, 8)}`,
    visual_system_id: "fleshlab-inferred-visual-language",
    render_plan_id: `render_${hash}`,
    render_plan_hash: hash,
    canvas_cache_key: `${candidate.id}_${hash}_${width}x${height}`,
    attempt: index + 1,
    variant: candidate.label,
    poster_family_id: "fleshlab_inferred_language",
    poster_family_label: candidate.label,
    philosophy: candidate.imageRole === "ai_reconstructed_hero"
      ? "AI reconstructed hero image supplied; local engine applies FLESHLAB brand, typography, grading, and export only."
      : "Source-frame editorial layout only; premium streaming key art requires AI hero-image reconstruction first.",
    impact_score: candidate.score.total,
    hero_score: candidate.score.hero,
    thumbnail_score: candidate.score.title,
    commercial_score: candidate.score.total,
    rejection_reasons: qualityFailures,
    design_actions: qualityFailures,
    optimization_directives: plan.visualLanguage.rules,
    score: candidate.score,
    crop: candidate.crop,
    diagnostic: {
      candidateId: candidate.id,
      renderPlanHash: hash,
      mood: candidate.mood,
      negativeSide: candidate.negativeSide,
      titleZone: candidate.titleZone,
      logoAnchor: candidate.logoAnchor,
      imageRole: candidate.imageRole,
      critique: candidate.critique,
      compositionBrief: candidate.compositionBrief,
      creativeIntelligence: candidate.creativeIntelligence,
      artDirectorApproval: candidate.artDirector,
      studioBenchmark: candidate.score.studioBenchmarkReport,
      rootArchitectureLimit: plan.audit.rootLimitation,
    },
  };
}

export async function generateCommercialKeyArtPlan(image, metadata = {}, settings = {}, width = 1920, height = 1080) {
  const analysis = await analyzePosterImage(image);
  const normalizedMetadata = normalizeMetadata(metadata, image);
  const languagePlan = buildFleshlabCoverPlan({ image, metadata: normalizedMetadata, analysis, width, height });
  const variants = languagePlan.candidates.map((candidate, index) => buildVariant({ ...languagePlan, metadata: normalizedMetadata }, candidate, index, width, height));
  const selectedIndex = Math.max(0, languagePlan.candidates.findIndex(candidate => candidate.id === languagePlan.selected.id));
  const selected = variants[selectedIndex] || variants[0];
  return {
    ...languagePlan,
    metadata: normalizedMetadata,
    analysis,
    settings: automaticCandidateSettings(settings),
    selected,
    best: selected,
    variants,
    family: { id: "fleshlab_inferred_language", label: languagePlan.selected.label },
    artDirection: {
      pipeline: ["Video", "Moment Selection", "Creative Director", "Photographic Brief", "AI Photographer", "Professional Hero Image", "Art Director", "Typography", "Branding", "Quality Review", "Export"],
      visualSystemId: "fleshlab-ai-photographer-cover-system",
      compositionProtection: languagePlan.selected.crop.compositionProtection || null,
    },
    preparedIterations: languagePlan.candidates.map((candidate, index) => ({
      ...languagePlan,
      metadata: normalizedMetadata,
      analysis,
      selected: variants[index],
      best: variants[index],
      candidateId: candidate.id,
      renderPlanHash: variants[index].render_plan_hash,
      candidate,
    })),
    diagnostics: variants.map(variant => variant.diagnostic),
    attempts: variants.map(variant => ({
      candidateId: variant.candidate_id,
      philosophy: variant.variant,
      renderPlanHash: variant.render_plan_hash,
      score: variant.score,
      accepted: variant.score.total >= (normalizedMetadata.aiReconstructed ? TARGET_STREAMING_SCORE : 70),
      designActions: variant.design_actions,
      optimizationDirectives: variant.optimization_directives,
    })),
    winner_reason: normalizedMetadata.aiReconstructed
      ? `${languagePlan.selected.label} selected after applying inferred FLESHLAB rules to the reconstructed hero image.`
      : `${languagePlan.selected.label} selected as the strongest local editorial layout; premium key art still requires AI reconstruction.`,
  };
}

function copyCanvas(source, target) {
  target.width = source.width;
  target.height = source.height;
  const ctx = target.getContext("2d");
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0);
}

async function paintPlan(canvas, image, plan, settings, width, height) {
  const result = await paintCommercialVisualSystem(canvas, image, plan, settings, width, height);
  const renderedScore = Number(result.commercialAdvertisingScore) || plan.selected.score.total;
  return {
    ...plan,
    selected: {
      ...plan.selected,
      ...result,
      score: {
        ...plan.selected.score,
        renderedComposition: renderedScore,
        total: Math.round(plan.selected.score.total * 0.45 + renderedScore * 0.55),
        passesQualityGate: result.artworkValidation === "passed" && result.internalCritic?.approved,
        qualityFailures: result.internalCritic?.approved ? plan.selected.score.qualityFailures : [...new Set([...(plan.selected.score.qualityFailures || []), ...(result.internalCritic?.redesignDirectives || [])])],
      },
      internalCritic: result.internalCritic,
    },
  };
}

export async function renderCommercialKeyArtToCanvas(canvas, image, metadata = {}, settings = {}, width = 1920, height = 1080, existingPlan = null) {
  const basePlan = existingPlan?.preparedIterations ? existingPlan : await generateCommercialKeyArtPlan(image, metadata, automaticCandidateSettings(settings), width, height);
  const iterations = basePlan.preparedIterations || [basePlan];
  const attempts = [];
  let bestPlan = null;
  let bestCanvas = null;

  for (let index = 0; index < iterations.length; index += 1) {
    const scratch = document.createElement("canvas");
    const renderedPlan = await paintPlan(scratch, image, iterations[index], automaticCandidateSettings(settings), width, height);
    attempts.push({
      attempt: index + 1,
      candidateId: renderedPlan.selected.candidate_id,
      philosophy: renderedPlan.selected.variant,
      renderPlanHash: renderedPlan.selected.render_plan_hash,
      impact: renderedPlan.selected.score.total,
      accepted: renderedPlan.selected.score.passesQualityGate,
      rejectedBecause: renderedPlan.selected.score.qualityFailures,
      designActions: renderedPlan.selected.design_actions,
    });
    const shouldReplace = !bestPlan || (renderedPlan.selected.score.passesQualityGate && !bestPlan.selected.score.passesQualityGate) || (renderedPlan.selected.score.passesQualityGate === bestPlan.selected.score.passesQualityGate && renderedPlan.selected.score.total > bestPlan.selected.score.total);
    if (shouldReplace) {
      bestPlan = renderedPlan;
      bestCanvas = scratch;
    }
  }

  recordCreativeLesson({ plan: bestPlan, critic: bestPlan?.selected?.internalCritic });
  if (bestCanvas) copyCanvas(bestCanvas, canvas);
  canvas.__fleshlabPosterPlan = {
    ...bestPlan,
    attempts,
    approvalStatus: bestPlan?.selected?.score?.passesQualityGate ? "approved" : "needs_ai_reconstruction_or_review",
    winner_reason: bestPlan?.metadata?.aiReconstructed
      ? `${bestPlan.selected.variant} passed the reconstructed-hero branding pass.`
      : `${bestPlan.selected.variant} is a local editorial layout, not final premium key art.`,
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
  const conceptPlan = plan?.preparedIterations?.find(item => item.selected?.candidate_id === variantPlan?.candidate_id || item.selected?.render_plan_hash === variantPlan?.render_plan_hash) || plan;
  canvas.dataset.cacheKey = conceptPlan?.selected?.canvas_cache_key || "fleshlab-cover";
  const renderedPlan = await paintPlan(canvas, image, conceptPlan, settings, width, height);
  canvas.__fleshlabPosterPlan = renderedPlan;
  return renderedPlan;
}