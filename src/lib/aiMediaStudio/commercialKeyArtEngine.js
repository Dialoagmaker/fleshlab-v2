import { analyzePosterImage } from "./posterAnalysis";
import { paintCommercialVisualSystem } from "./commercialVisualSystems";
import { stablePlanHash } from "./fleshlabVisualLanguage";
import { buildEditorialArtDirectionPlan } from "./editorialArtDirectionEngine";
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
  const blueprint = metadata.productionBlueprint || null;
  const selectedTitle = blueprint?.title_policy?.selectedTitle?.value || metadata.selectedTitle || metadata.videoTitle || metadata.title || "";
  const selectedSubtitle = blueprint?.title_policy?.selectedSubtitle?.value || metadata.selectedSubtitle || metadata.optionalSubtitle || metadata.subtitle || "";
  const selectedCampaign = blueprint?.title_policy?.selectedCampaign?.value || metadata.selectedCampaign || metadata.campaignName || "";
  return {
    ...metadata,
    selectedTitle,
    mainTitle: selectedTitle,
    title: selectedTitle,
    videoTitle: selectedTitle,
    selectedSubtitle,
    subtitle: selectedSubtitle,
    episodeTitle: selectedSubtitle,
    performer: metadata.performerName || metadata.performer || "",
    selectedCampaign,
    footerCategory: selectedCampaign,
    marketingTagline: selectedCampaign,
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
    visual_system_id: candidate.visual_system_id || "fleshlab-editorial-art-direction",
    render_plan_id: `render_${hash}`,
    render_plan_hash: hash,
    canvas_cache_key: `${candidate.id}_${hash}_${width}x${height}`,
    attempt: index + 1,
    variant: candidate.label,
    creative_title: candidate.selectedTitle || candidate.creativeTitle,
    creative_director_outcome: candidate.artDirector?.outcome,
    poster_family_id: "blueprint_execution",
    poster_family_label: candidate.label,
    philosophy: candidate.imageRole === "ai_reconstructed_hero"
      ? "Render Planner executes Blueprint-approved hero image, typography, branding, and export only."
      : "Render Planner executes the selected Story Frame and Production Blueprint only.",
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
      visualSystemId: candidate.visual_system_id,
      visualSystemLabel: candidate.visual_system_label,
      typographyStyle: candidate.typographyStyle,
      compositionMode: candidate.compositionMode,
      grade: candidate.grade,
      critique: candidate.critique,
      compositionBrief: candidate.compositionBrief,
      creativeTitle: candidate.selectedTitle || candidate.creativeTitle,
      selectedTitle: candidate.selectedTitle || candidate.creativeTitle,
      sourceTitle: candidate.sourceTitle,
      reviewBoard: candidate.reviewBoard,
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
  const languagePlan = buildEditorialArtDirectionPlan({ image, metadata: normalizedMetadata, analysis, width, height });
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
    family: { id: languagePlan.designSystem?.id || "editorial_art_direction", label: languagePlan.designSystem?.label || languagePlan.selected.label },
    artDirection: {
      pipeline: ["Production Blueprint", "Selected Source Frame", "Layout Geometry", "Render Map", "Typography Draw", "Branding", "Creative Critic", "Export"],
      visualSystemId: languagePlan.designSystem?.id || "fleshlab-editorial-art-direction-system",
      compositionProtection: languagePlan.selected.crop.compositionProtection || null,
    },
    preparedIterations: languagePlan.candidates.map((candidate, index) => ({
      ...languagePlan,
      metadata: {
        ...normalizedMetadata,
        title: normalizedMetadata.selectedTitle,
        mainTitle: normalizedMetadata.selectedTitle,
        videoTitle: normalizedMetadata.selectedTitle,
      },
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
      accepted: variant.creative_director_outcome === "APPROVED",
      designActions: variant.design_actions,
      optimizationDirectives: variant.optimization_directives,
    })),
    winner_reason: normalizedMetadata.aiReconstructed
      ? `${languagePlan.selected.label} executed from Production Blueprint on the reconstructed hero image.`
      : `${languagePlan.selected.label} executed from Production Blueprint on the selected source frame.`,
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
    approvalStatus: bestPlan?.selected?.score?.passesQualityGate ? "approved" : "needs_review",
    winner_reason: bestPlan?.metadata?.aiReconstructed
      ? `${bestPlan.selected.variant} completed Blueprint execution on the reconstructed hero image.`
      : `${bestPlan.selected.variant} completed Blueprint execution on the selected source frame.`,
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