import { buildVisualAttentionMap } from '@/lib/aiMediaStudio/visualAttentionMap';

export const DEFAULT_CANDIDATE_PARAMS = {
  zoom: 1,
  focusX: 0.5,
  focusY: 0.48,
  backgroundSuppression: 0,
  localContrast: 0,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 100) / 100;

export function posterImpactProxy(map) {
  const scores = map?.scores || {};
  return Math.round(
    (scores.visual_attention || 0) * 0.28 +
    (scores.hero_dominance_proxy || 0) * 0.32 +
    (scores.face_eye_priority || 0) * 0.24 +
    Math.max(0, 100 - (scores.background_noise || 0)) * 0.16
  );
}

function action(reason, parameter, oldValue, newValue, expectedImprovement) {
  return {
    reason,
    parameter,
    old_value: round(oldValue),
    new_value: round(newValue),
    expected_improvement: expectedImprovement,
  };
}

export function buildExecutableActions(diagnostics, params = DEFAULT_CANDIDATE_PARAMS) {
  const scores = diagnostics?.scores || {};
  const hero = diagnostics?.hero_candidate;
  const actions = [];

  if (scores.hero_dominance_proxy < 70) {
    actions.push(action(
      'Hero Dominance too low',
      'zoom',
      params.zoom,
      clamp(params.zoom + 0.12, 1, 1.45),
      8
    ));
  }

  if (scores.face_eye_priority < 36 && hero) {
    actions.push(action(
      'Face/head attention too weak',
      'focusY',
      params.focusY,
      clamp(hero.y + hero.h * 0.38, 0.26, 0.58),
      5
    ));
  }

  if (scores.background_noise > 28) {
    actions.push(action(
      'Background competition too high',
      'backgroundSuppression',
      params.backgroundSuppression,
      clamp(params.backgroundSuppression + 14, 0, 70),
      5
    ));
  }

  if (scores.visual_attention < 58) {
    actions.push(action(
      'Visual attention not concentrated enough',
      'localContrast',
      params.localContrast,
      clamp(params.localContrast + 10, 0, 55),
      4
    ));
  }

  if (!actions.length) {
    actions.push(action(
      'Candidate is acceptable but still needs comparative pressure',
      'zoom',
      params.zoom,
      clamp(params.zoom + 0.04, 1, 1.45),
      2
    ));
  }

  return actions;
}

export function renderCandidateImage(image, params = DEFAULT_CANDIDATE_PARAMS) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(960, sourceWidth);
  canvas.height = Math.round(canvas.width / (sourceWidth / sourceHeight));
  const ctx = canvas.getContext('2d');

  const cropWidth = sourceWidth / params.zoom;
  const cropHeight = sourceHeight / params.zoom;
  const cropX = clamp(params.focusX * sourceWidth - cropWidth / 2, 0, sourceWidth - cropWidth);
  const cropY = clamp(params.focusY * sourceHeight - cropHeight / 2, 0, sourceHeight - cropHeight);
  const contrast = 100 + params.localContrast;

  ctx.filter = `contrast(${contrast}%) saturate(${100 + params.localContrast * 0.35}%)`;
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';

  if (params.backgroundSuppression > 0) {
    const strength = params.backgroundSuppression / 100;
    const gradient = ctx.createRadialGradient(
      canvas.width * params.focusX,
      canvas.height * params.focusY,
      canvas.width * 0.12,
      canvas.width * params.focusX,
      canvas.height * params.focusY,
      canvas.width * 0.78
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${0.62 * strength})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas;
}

export function runOneOptimizationIteration(image, diagnostics, params = DEFAULT_CANDIDATE_PARAMS) {
  const actions = buildExecutableActions(diagnostics, params);
  let currentParams = { ...params };
  let currentMap = diagnostics;
  let currentScore = posterImpactProxy(currentMap);
  let currentCanvas = renderCandidateImage(image, currentParams);
  const actionResults = [];

  actions.forEach((candidateAction) => {
    const testParams = { ...currentParams, [candidateAction.parameter]: candidateAction.new_value };
    const testCanvas = renderCandidateImage(image, testParams);
    const testMap = buildVisualAttentionMap(testCanvas);
    const testScore = posterImpactProxy(testMap);
    const actualImprovement = testScore - currentScore;
    const accepted = actualImprovement > 0;

    actionResults.push({
      ...candidateAction,
      actual_improvement: actualImprovement,
      status: accepted ? 'accepted' : 'reverted',
    });

    if (accepted) {
      currentParams = testParams;
      currentMap = testMap;
      currentScore = testScore;
      currentCanvas = testCanvas;
    }
  });

  return {
    started_at: new Date().toISOString(),
    initial_score: posterImpactProxy(diagnostics),
    final_score: currentScore,
    total_delta: currentScore - posterImpactProxy(diagnostics),
    final_params: currentParams,
    final_map: currentMap,
    rendered_candidate: currentCanvas,
    action_results: actionResults,
  };
}