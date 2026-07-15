const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function getSignalValue(source, keys, fallback = 0.5) {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], source);
    if (Number.isFinite(Number(value))) return clamp(Number(value));
  }
  return fallback;
}

export function inferEmotionalGoal({ visionAnalysis = {}, storyAnalysis = {}, metadata = {} }) {
  const tags = [metadata.videoTitle, metadata.optionalSubtitle, metadata.contentType, storyAnalysis.theme, storyAnalysis.mood]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/hotel|check|late|night|secret|door|room/.test(tags)) return 'charged curiosity with private-room tension';
  if (/beach|escape|trip|travel|outdoor/.test(tags)) return 'sunlit adventure and physical freedom';
  if (/first|amateur|raw|real|home/.test(tags)) return 'raw amateur intimacy and vulnerability';
  if (/danger|dark|forbidden|rough/.test(tags)) return 'dangerous seduction and controlled risk';

  const contrast = getSignalValue(visionAnalysis, ['contrast', 'technical.contrast'], 0.5);
  const brightness = getSignalValue(visionAnalysis, ['brightness', 'technical.brightness'], 0.5);
  if (contrast > 0.68 && brightness < 0.48) return 'noir tension and expensive mystery';
  if (brightness > 0.64) return 'warm desire and accessible fantasy';
  return 'premium cinematic desire with intimate tension';
}

export function chooseDominantElement({ visionAnalysis = {}, storyAnalysis = {}, posterFamily = {} }) {
  const face = getSignalValue(visionAnalysis, ['faceScore', 'hero.faceScore', 'subject.faceScore'], 0.5);
  const body = getSignalValue(visionAnalysis, ['bodyPresence', 'hero.bodyPresence', 'subjectPresence'], 0.5);
  const environment = getSignalValue(visionAnalysis, ['environmentScore', 'scene.environmentScore', 'negativeSpace'], 0.42);
  const titleConcept = storyAnalysis?.titleStrength === 'high' ? 0.8 : 0.48;
  const familyBias = posterFamily?.id === 'v2-title' ? 0.15 : posterFamily?.id === 'v2-performer' ? -0.15 : 0;

  const performerScore = Math.max(face, body) - familyBias;
  const titleScore = titleConcept + familyBias;
  if (environment > performerScore + 0.18 && environment > titleScore) return 'environment';
  if (titleScore > performerScore + 0.1) return 'main_title';
  return 'hero_performer';
}

export function defineEyePath(dominantElement, heroFocus = {}) {
  if (dominantElement === 'main_title') return ['main title', 'hero face/body', 'subtitle hook', 'studio mark'];
  if (dominantElement === 'environment') return ['scene atmosphere', 'hero silhouette', 'title interruption', 'performer credit'];
  const anchor = heroFocus?.primaryAnchor || 'hero face/body';
  return [anchor, 'emotional hook text', 'main title', 'studio mark'];
}

export function buildVisualRhythm(dominantElement) {
  if (dominantElement === 'main_title') return ['heavy title mass', 'quiet performer pause', 'small emotional hook', 'breathing footer'];
  if (dominantElement === 'environment') return ['wide atmospheric calm', 'sharp human tension', 'small title pressure', 'open negative space'];
  return ['dominant human presence', 'controlled title counterweight', 'small intimate subtitle', 'quiet premium branding'];
}