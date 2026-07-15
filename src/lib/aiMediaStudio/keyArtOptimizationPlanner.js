export function deriveOptimizationActions(diagnostics) {
  const scores = diagnostics?.scores || {};
  const reasons = diagnostics?.rejection_reasons || [];
  const actions = [];

  if (scores.hero_dominance_proxy < 55 || reasons.some(reason => reason.toLowerCase().includes('hero'))) {
    actions.push({
      constraint: 'hero_dominance',
      failure: 'Hero dominance is below target.',
      action: 'Increase crop priority around the detected hero cluster and protect face/body zones from future overlays.',
      expected_effect: 'Hero occupies more perceived visual weight before typography is considered.',
    });
  }

  if (scores.face_eye_priority < 28 || reasons.some(reason => reason.toLowerCase().includes('face'))) {
    actions.push({
      constraint: 'face_eye_attention',
      failure: 'Face/head attention is weak or uncertain.',
      action: 'Bias the next candidate toward upper-body framing, reduce competing texture near the head, and increase local facial contrast.',
      expected_effect: 'Viewer fixation moves toward the head/face area earlier in first-glance perception.',
    });
  }

  if (scores.background_noise > 30 || reasons.some(reason => reason.toLowerCase().includes('background'))) {
    actions.push({
      constraint: 'background_competition',
      failure: 'Background energy competes with the intended hero.',
      action: 'Suppress background contrast, deepen peripheral shadows, and reserve high-saliency zones only for the performer.',
      expected_effect: 'Walls, doors, floors and clutter become visually secondary to the performer.',
    });
  }

  if (scores.visual_attention < 50 || reasons.some(reason => reason.toLowerCase().includes('weak visual'))) {
    actions.push({
      constraint: 'attention_concentration',
      failure: 'Visual attention is not concentrated enough for commercial key art.',
      action: 'Tighten composition around the strongest attention cluster and increase separation between hero and environment.',
      expected_effect: 'The next candidate should produce a clearer first-glance fixation path.',
    });
  }

  if (!actions.length) {
    actions.push({
      constraint: 'candidate_progression',
      failure: 'No hard rejection, but candidate still requires comparative scoring before export.',
      action: 'Keep this candidate as a benchmark and compare against the next candidate instead of exporting immediately.',
      expected_effect: 'The system behaves as an optimizer rather than a one-shot renderer.',
    });
  }

  return actions.map((action, index) => ({
    iteration_step: index + 1,
    ...action,
  }));
}

export function buildOptimizationTrace(diagnostics, options = {}) {
  const target = options.target || 75;
  const maxIterations = options.maxIterations || 6;
  const actions = deriveOptimizationActions(diagnostics);
  const score = diagnostics?.scores?.hero_dominance_proxy || 0;
  const status = score >= target ? 'candidate_can_be_compared' : 'optimization_required';

  return {
    mode: 'diagnostic_planner_only',
    target_score: target,
    max_iterations: maxIterations,
    current_proxy_score: score,
    status,
    should_export: false,
    note: 'Phase diagnostic only: this creates informed optimization actions but does not render, export, randomize layouts, or touch Poster Engine v2.',
    actions,
  };
}