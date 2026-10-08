const clampScore = score => Math.max(0, Math.min(10, Math.round(score * 10) / 10));

export function reviewArtDirectionPlan(plan = {}) {
  const hasOneDominant = ['hero_performer', 'main_title', 'environment'].includes(plan.visual_priority?.dominant_element);
  const hasEmotion = Boolean(plan.emotional_goal && plan.emotional_goal.length > 12);
  const hasEyePath = Array.isArray(plan.eye_path) && plan.eye_path.length >= 3;
  const hasRhythm = Array.isArray(plan.visual_rhythm) && plan.visual_rhythm.length >= 4;
  const hasAtmosphere = Boolean(plan.atmosphere && plan.color_grade && plan.light_shaping);

  const scores = {
    visual_impact: clampScore((hasOneDominant ? 8.7 : 6.5) + (hasAtmosphere ? 1.1 : 0)),
    poster_hierarchy: clampScore((hasOneDominant ? 9.1 : 6.4) + (hasEyePath ? 0.5 : 0)),
    typography: clampScore(plan.typography_style?.role === 'composition' ? 9.1 : 7.1),
    emotional_clarity: clampScore((hasEmotion ? 8.9 : 6.2) + (hasEyePath ? 0.4 : 0)),
    negative_space: clampScore(plan.composition_style?.negative_space_role ? 9.0 : 7.0),
    premium_feel: clampScore(hasAtmosphere && hasRhythm ? 9.2 : 7.4),
    storytelling: clampScore(hasEmotion && hasEyePath ? 9.3 : 6.8),
    originality: clampScore(plan.composition_style?.template_dependency === 'none' ? 9.2 : 7.0),
  };

  const blockers = Object.entries(scores)
    .filter(([, score]) => score < 9)
    .map(([category, score]) => `${category}: ${score}/10`);

  return {
    scores,
    export_ready: blockers.length === 0,
    blockers,
    instruction: blockers.length ? 'revise art direction before rendering' : 'approved for v3 rendering',
  };
}