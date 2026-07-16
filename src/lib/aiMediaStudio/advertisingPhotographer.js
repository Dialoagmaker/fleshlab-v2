function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function value(frame, path, fallback = 0) {
  return path.split('.').reduce((current, key) => current?.[key], frame) ?? fallback;
}

export function detectScreenshotLanguage(frame) {
  const hero = frame?.hero || {};
  const metrics = frame?.metrics || {};
  const backgroundComplexity = clamp(hero.backgroundComplexity ?? (1 - (hero.negativeSpaceScore ?? 0.42)));
  const flatLighting = 1 - clamp((metrics.contrast ?? 36) / 95);
  const weakSilhouette = 1 - clamp((hero.subjectDominance ?? 0.35) * 0.7 + (hero.subjectSeparation ?? 0.35) * 0.3);
  const staticPosture = 1 - clamp((hero.bodyLanguage ?? 0.38) * 0.6 + (hero.interactionStrength ?? 0.32) * 0.4);
  const consumerTexture = 1 - clamp((metrics.sharpness ?? 38) / 110);
  const accidentalComposition = 1 - clamp((hero.compositionScore ?? 0.36) * 0.7 + (hero.visualCuriosity ?? 0.35) * 0.3);
  const phonePerspective = clamp((hero.cropRisk ?? 0.45) * 0.55 + backgroundComplexity * 0.25 + weakSilhouette * 0.2);
  const likeness = clamp(flatLighting * 0.2 + weakSilhouette * 0.18 + staticPosture * 0.14 + consumerTexture * 0.14 + accidentalComposition * 0.2 + phonePerspective * 0.14);
  const clues = [];
  if (flatLighting > 0.58) clues.push('flat ambient lighting');
  if (weakSilhouette > 0.56) clues.push('weak poster silhouette');
  if (staticPosture > 0.62) clues.push('static posture');
  if (consumerTexture > 0.58) clues.push('consumer video texture');
  if (accidentalComposition > 0.56) clues.push('accidental composition');
  if (backgroundComplexity > 0.56) clues.push('visible room/background clutter');
  if (phonePerspective > 0.56) clues.push('phone-camera perspective');
  return { likeness: Math.round(likeness * 100), clues, stillReadsAsScreenshot: likeness >= 0.58 };
}

export function scoreAdvertisingPhotographerFrame(frame) {
  const hero = frame?.hero || {};
  const metrics = frame?.metrics || {};
  const screenshot = detectScreenshotLanguage(frame);
  const posterSilhouette = clamp((hero.subjectDominance ?? 0.4) * 0.42 + (hero.subjectSeparation ?? 0.36) * 0.38 + (1 - (hero.cropRisk ?? 0.45)) * 0.2);
  const commercialPose = clamp((hero.bodyLanguage ?? 0.38) * 0.45 + (hero.interactionStrength ?? 0.32) * 0.25 + (hero.compositionScore ?? 0.35) * 0.3);
  const emotionalExpression = clamp((hero.emotionalPresence ?? 0.38) * 0.55 + (hero.storyContinuation ?? 0.35) * 0.2 + (hero.visualCuriosity ?? 0.35) * 0.25);
  const lightingDirection = clamp((metrics.contrast ?? 35) / 88 * 0.44 + (hero.subjectSeparation ?? 0.36) * 0.34 + (1 - (metrics.overexposure ?? 0.2)) * 0.12 + (1 - (metrics.underexposure ?? 0.2)) * 0.1);
  const backgroundSimplicity = clamp((hero.negativeSpaceScore ?? 0.42) * 0.72 + (1 - (hero.backgroundComplexity ?? 0.52)) * 0.28);
  const storyPotential = clamp((hero.visualCuriosity ?? 0.35) * 0.4 + (hero.storyContinuation ?? 0.36) * 0.35 + (hero.clickPotential ?? 0.35) * 0.25);
  const thumbnailReadability = clamp((hero.thumbnailImpact ?? 0.36) * 0.38 + posterSilhouette * 0.42 + lightingDirection * 0.2);
  const premiumPhotography = clamp(posterSilhouette * 0.2 + commercialPose * 0.16 + emotionalExpression * 0.14 + lightingDirection * 0.2 + backgroundSimplicity * 0.13 + storyPotential * 0.1 + thumbnailReadability * 0.07);
  const advertisingValue = Math.round((premiumPhotography * 100) - screenshot.likeness * 0.34);
  const gates = {
    posterSilhouette: posterSilhouette >= 0.48,
    commercialPose: commercialPose >= 0.42,
    emotionalExpression: emotionalExpression >= 0.38,
    lightingDirection: lightingDirection >= 0.44,
    subjectIsolation: (hero.subjectSeparation ?? 0.36) >= 0.34,
    backgroundSimplicity: backgroundSimplicity >= 0.38,
    storyPotential: storyPotential >= 0.38,
    thumbnailReadability: thumbnailReadability >= 0.42,
    visualMemorability: (hero.visualCuriosity ?? 0.35) >= 0.34,
    premiumPhotography: premiumPhotography >= 0.46,
    screenshotLanguage: !screenshot.stillReadsAsScreenshot,
  };
  const passed = advertisingValue >= 42 && Object.values(gates).filter(Boolean).length >= 8;
  return { ...frame, advertisingPhotographer: { advertisingValue, passed, gates, screenshot, metrics: { posterSilhouette: Math.round(posterSilhouette * 100), commercialPose: Math.round(commercialPose * 100), emotionalExpression: Math.round(emotionalExpression * 100), lightingDirection: Math.round(lightingDirection * 100), backgroundSimplicity: Math.round(backgroundSimplicity * 100), storyPotential: Math.round(storyPotential * 100), thumbnailReadability: Math.round(thumbnailReadability * 100), premiumPhotography: Math.round(premiumPhotography * 100) } } };
}

export function selectAdvertisingHeroFrames(frames = [], limit = 12) {
  return frames
    .map(scoreAdvertisingPhotographerFrame)
    .filter(frame => frame.advertisingPhotographer.passed)
    .sort((a, b) => b.advertisingPhotographer.advertisingValue - a.advertisingPhotographer.advertisingValue)
    .slice(0, limit);
}

export function selectBestAdvertisingHeroFrame(frames = []) {
  return selectAdvertisingHeroFrames(frames, 1)[0] || null;
}