import { analyzePosterImage, scorePosterCandidate } from './posterAnalysis';
import { calculateComposition } from './posterComposition';
import { calculateTypography } from './posterTypography';
import { getPosterFamilySearchSpace } from './posterFamilies';
import createPosterArtDirectionPlan from './posterArtDirector';

function scoreCommercialCandidate({ analysis, typography, composition, posterFamily }) {
  const base = scorePosterCandidate({
    analysis,
    typographyScore: typography.score,
    brandScore: posterFamily.id === 'commercial-thumbnail' ? 0.96 : 0.88,
    layoutScore: composition.layoutScore,
  });
  const bias = posterFamily.scoreBias || {};
  const hero_score = Math.max(0, Math.min(100, Math.round(Math.max(base.subjectDominance, base.imageQuality) + (bias.hero || 0))));
  const thumbnail_score = Math.max(0, Math.min(100, Math.round(Math.max(base.hierarchy, base.typography) + (bias.thumbnail || 0))));
  const commercial_score = Math.max(0, Math.min(100, Math.round(Math.max(base.marketing, base.story) + (bias.commercial || 0))));
  const impact_score = Math.max(0, Math.min(100, Math.round(hero_score * 0.38 + thumbnail_score * 0.27 + commercial_score * 0.35)));
  const rejection_reasons = [];
  if (hero_score < 82) rejection_reasons.push('Hero score below target');
  if (thumbnail_score < 82) rejection_reasons.push('Thumbnail recognition below target');
  if (commercial_score < 82) rejection_reasons.push('Commercial curiosity below target');
  if (impact_score < 78) rejection_reasons.push('Not strong enough for commercial key art');
  return {
    score: { ...base, total: impact_score, heroScore: hero_score, readabilityScore: thumbnail_score, commercialScore: commercial_score, qualityFailures: rejection_reasons, passesQualityGate: rejection_reasons.length === 0 },
    impact_score,
    hero_score,
    thumbnail_score,
    commercial_score,
    rejection_reasons,
  };
}

function optimizeInsideFamily({ image, analysis, posterFamily, artDirection, metadata, settings, width, height, ctx }) {
  const candidates = (posterFamily.compositions || ['balanced']).map(variant => {
    const composition = calculateComposition(image, analysis, posterFamily, width, height, variant, settings);
    const typography = calculateTypography(ctx, composition.textArea, width, posterFamily, metadata, settings);
    const scores = scoreCommercialCandidate({ analysis, typography, composition, posterFamily });
    return { variant, family: posterFamily, artDirection, analysis, composition, typography, ...scores };
  });
  return [...candidates].sort((a, b) => b.impact_score - a.impact_score)[0];
}

export async function generateKeyArtPlan(image, metadata, settings, width, height) {
  const analysis = await analyzePosterImage(image);
  const families = getPosterFamilySearchSpace(analysis, metadata).slice(0, 8);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const variants = families.map((posterFamily, index) => {
    const artDirection = createPosterArtDirectionPlan({ visionAnalysis: analysis, storyAnalysis: {}, heroPerformer: metadata?.performerName, posterFamily, metadata });
    const optimized = optimizeInsideFamily({ image, analysis, posterFamily, artDirection, metadata, settings, width, height, ctx });
    return {
      candidate_number: index + 1,
      poster_family_id: posterFamily.id,
      poster_family_label: posterFamily.label,
      poster_family: posterFamily,
      philosophy: posterFamily.philosophy,
      optimization_path: ['Poster Family', 'Composition', 'Crop', 'Typography', 'Branding', 'Micro Adjustments'],
      ...optimized,
    };
  });

  const sorted = [...variants].sort((a, b) => b.impact_score - a.impact_score);
  const selected = sorted.find(candidate => !candidate.rejection_reasons?.length) || sorted[0];
  return {
    analysis,
    family: selected.family,
    metadata,
    variants,
    best: selected,
    selected,
    winner_reason: `${selected.poster_family_label} won because its poster philosophy produced the strongest commercial impact before shared-renderer tuning.`,
    render_contract: 'plan-only: v3 selects what to render; the universal poster renderer draws preview and export',
  };
}