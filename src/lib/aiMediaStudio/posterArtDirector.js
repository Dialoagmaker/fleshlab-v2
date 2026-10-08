import { buildVisualRhythm, chooseDominantElement, defineEyePath, inferEmotionalGoal, getSignalValue } from './artDirectorSignals';
import { reviewArtDirectionPlan } from './posterDesignReview';

function heroFocusFromVision(visionAnalysis = {}, heroPerformer = {}) {
  const face = getSignalValue(visionAnalysis, ['faceScore', 'hero.faceScore', 'subject.faceScore'], 0.5);
  const body = getSignalValue(visionAnalysis, ['bodyPresence', 'hero.bodyPresence', 'subjectPresence'], 0.5);
  const direction = visionAnalysis?.subject?.direction || visionAnalysis?.hero?.direction || 'toward viewer';
  return {
    hero_name: heroPerformer?.display_name || heroPerformer?.name || heroPerformer || 'hero performer',
    primaryAnchor: face >= body ? 'hero face/eyes' : 'hero body silhouette',
    emotional_read: face >= 0.65 ? 'personal and confrontational' : 'physical and atmospheric',
    gaze_or_motion: direction,
  };
}

function typographyForDominance(dominantElement, emotionalGoal) {
  if (dominantElement === 'main_title') {
    return { role: 'composition', dominant_layer: 'title', title_behavior: 'architectural anchor', subtitle_behavior: 'small emotional fuse', performer_behavior: 'premium credit, not a label' };
  }
  if (dominantElement === 'environment') {
    return { role: 'composition', dominant_layer: 'environment', title_behavior: 'quiet interruption', subtitle_behavior: 'story clue', performer_behavior: 'human signature' };
  }
  return { role: 'composition', dominant_layer: 'performer', title_behavior: 'supporting counterweight', subtitle_behavior: emotionalGoal.includes('curiosity') ? 'hook line' : 'intimate whisper', performer_behavior: 'primary remembered name' };
}

function cinematicTreatment(visionAnalysis = {}, emotionalGoal = '') {
  const brightness = getSignalValue(visionAnalysis, ['brightness', 'technical.brightness'], 0.5);
  const contrast = getSignalValue(visionAnalysis, ['contrast', 'technical.contrast'], 0.5);
  const darkMood = emotionalGoal.includes('danger') || emotionalGoal.includes('mystery') || brightness < 0.45;
  return {
    color_grade: darkMood ? 'cool shadows, warm skin, restrained red accents' : 'warm skin, soft highlights, cool background separation',
    atmosphere: contrast > 0.62 ? 'high-tension cinematic contrast' : 'soft premium haze with controlled depth',
    light_shaping: 'micro dodge on hero, burn background clutter, bloom only on practical highlights',
    image_transformation: ['local contrast', 'selective sharpening on hero', 'background separation', 'film grain', 'controlled bloom', 'micro dodge and burn'],
  };
}

export function createPosterArtDirectionPlan({ visionAnalysis = {}, storyAnalysis = {}, heroPerformer = {}, posterFamily = {}, metadata = {} } = {}) {
  const emotional_goal = inferEmotionalGoal({ visionAnalysis, storyAnalysis, metadata });
  const dominant_element = chooseDominantElement({ visionAnalysis, storyAnalysis, posterFamily });
  const hero_focus = heroFocusFromVision(visionAnalysis, heroPerformer);
  const treatment = cinematicTreatment(visionAnalysis, emotional_goal);
  const eye_path = defineEyePath(dominant_element, hero_focus);

  const plan = {
    engine_stage: 'PosterArtDirector',
    version: 'v3-art-direction-brief',
    emotional_goal,
    visual_priority: { dominant_element, supporting_elements: ['secondary typography', 'studio mark', 'footer details'] },
    hero_focus,
    typography_style: typographyForDominance(dominant_element, emotional_goal),
    composition_style: { template_dependency: 'none', negative_space_role: 'active breathing room, not empty pixels', overlap_permission: 'text may overlap cinematic gradients, architecture, shoulders, shadows, or soft blur when readability improves' },
    ...treatment,
    tension_direction: emotional_goal.includes('curiosity') ? 'pull viewer from unanswered story clue into hero presence' : 'hold viewer on hero, then release into title memory',
    visual_weight: { rule: 'exactly one dominant element', dominant_element },
    visual_rhythm: buildVisualRhythm(dominant_element),
    eye_path,
    two_second_memory: dominant_element === 'main_title' ? 'the title as a premium fantasy promise' : dominant_element === 'environment' ? 'the world around the scene' : 'the performer as the emotional product',
  };

  return { ...plan, design_review: reviewArtDirectionPlan(plan) };
}

export default createPosterArtDirectionPlan;