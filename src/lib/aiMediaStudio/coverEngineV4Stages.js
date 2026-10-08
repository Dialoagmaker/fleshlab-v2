function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function pick(items, seed) {
  return items[Math.abs(Math.floor(seed * 997)) % items.length];
}

function seedFromAnalysis(analysis = {}) {
  return clamp((analysis.visualCuriosity || 0.41) * 0.37 + (analysis.emotionalPresence || 0.38) * 0.29 + (analysis.subjectDominance || 0.42) * 0.21 + (analysis.negativeSpace?.score || analysis.negativeSpaceScore || 0.36) * 0.13);
}

export function createHeroImageReconstructionPlan(analysis = {}) {
  const screenshotRisk = clamp((analysis.backgroundComplexity || 0.52) * 0.3 + (1 - (analysis.subjectSeparation || 0.36)) * 0.28 + (analysis.cropRisk || 0.42) * 0.2 + (1 - (analysis.visualCuriosity || 0.35)) * 0.22);
  return Object.freeze({
    stage: 'Hero Image Reconstruction',
    typographyForbidden: true,
    cropStrategy: 'AI canvas extension for vertical sources; preserve original performer frame with no crop, no stretch, no letterbox',
    depthEnhancement: clamp(0.62 + screenshotRisk * 0.34),
    subjectSeparation: clamp(0.68 + screenshotRisk * 0.22),
    backgroundSuppression: clamp(0.72 + screenshotRisk * 0.2),
    localContrast: clamp(1.24 + screenshotRisk * 0.22),
    colorGrade: 'premium nocturne: deep black, warm skin, restrained FLESHLAB red',
    lensCompression: clamp(0.42 + (analysis.subjectDominance || 0.42) * 0.28),
    shadowReconstruction: clamp(0.64 + screenshotRisk * 0.22),
    noTextMinimumScore: 78,
  });
}

export function createVisualCampaignFromReconstructedHero(analysis = {}, reconstruction = {}) {
  const seed = seedFromAnalysis(analysis);
  const mood = pick(['PRIVATE NIGHT', 'AFTER HOURS', 'THE CHECK-IN', 'NO ONE KNOCKS', 'ROOM SERVICE', 'BEHIND THE DOOR'], seed);
  const subtitle = pick(['A private moment turns into a story.', 'One room. One decision. No rehearsal.', 'Real chemistry after dark.', 'The camera finds what the room keeps.', 'A first night becomes the campaign.'], seed + 0.17);
  const series = pick(['HOTEL SESSIONS', 'AMATEUR WINS', 'PRIVATE FILES', 'FIRST NIGHT'], seed + 0.31);
  const angle = reconstruction.backgroundSuppression > 0.8 ? 'forbidden private-room tension' : 'raw creator transformation';
  return Object.freeze({
    stage: 'Creative Director',
    metadataBlind: true,
    campaignTitle: mood,
    subtitle,
    seriesName: series,
    episodeName: pick(['THE ROOM', 'THE FIRST TAKE', 'AFTER MIDNIGHT', 'CHECK-IN'], seed + 0.49),
    tagline: subtitle,
    campaignMood: pick(['intimate noir', 'private-room tension', 'raw premium documentary', 'late-night confession'], seed + 0.63),
    marketingAngle: angle,
  });
}

export function createArtDirectionPlan(visualCampaign = {}, reconstruction = {}, width, height) {
  return Object.freeze({
    stage: 'Art Director',
    typographyOnlyAfterImageApproval: true,
    gridSystem: 'two-column cinematic poster grid',
    negativeSpaceIntent: 'newly extended cinematic environment, not black bars or unused canvas',
    titleTone: 'bold streaming campaign typography with strict safe margins',
    brandPlacement: 'certification mark, subordinate to campaign title',
    ctaPlacement: 'outside hero face/body zones',
    commercialBalance: 'hero image first, typography second',
    visualRhythm: 'large quiet dark field against sculpted subject',
    exportSize: { width, height },
    campaignTitle: visualCampaign.campaignTitle,
  });
}

export function validateNoTextHeroImage(canvas, brief) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = brief.exportRules;
  const hero = brief.heroSafeZones.hero;
  const sample = (box) => {
    const x = Math.max(0, Math.floor(box.x));
    const y = Math.max(0, Math.floor(box.y));
    const w = Math.max(1, Math.min(width - x, Math.floor(box.w)));
    const h = Math.max(1, Math.min(height - y, Math.floor(box.h)));
    const data = ctx.getImageData(x, y, w, h).data;
    let total = 0;
    let min = 255;
    let max = 0;
    for (let i = 0; i < data.length; i += 20) {
      const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      total += l;
      min = Math.min(min, l);
      max = Math.max(max, l);
    }
    return { avg: total / Math.max(1, data.length / 20), range: max - min };
  };
  const heroSample = sample(hero);
  const backgroundSample = sample({ x: 0, y: 0, w: width, h: height });
  const heroDominance = clamp((hero.w * hero.h) / (width * height) * 2.4);
  const separation = clamp((heroSample.avg - backgroundSample.avg + 80) / 150);
  const depth = clamp(heroSample.range / 120 * 0.52 + brief.reconstructionPlan.depthEnhancement * 0.48);
  const screenshotLikeness = clamp(1 - (brief.reconstructionPlan.backgroundSuppression * 0.38 + depth * 0.36 + separation * 0.26));
  const score = Math.round(heroDominance * 25 + separation * 25 + depth * 25 + (1 - screenshotLikeness) * 25);
  const failures = [];
  if (score < brief.reconstructionPlan.noTextMinimumScore) failures.push('no-text reconstructed hero is not publishable');
  if (screenshotLikeness > 0.38) failures.push('still reads as screenshot before typography');
  if (heroDominance < 0.34) failures.push('hero does not dominate without text');
  return { passed: failures.length === 0, score, failures, components: { heroDominance: Math.round(heroDominance * 100), separation: Math.round(separation * 100), depth: Math.round(depth * 100), screenshotLikeness: Math.round(screenshotLikeness * 100) } };
}

export function createCommercialAgencyValidation(renderedValidation, noTextValidation) {
  const agencyQuestions = {
    netflix: renderedValidation.total >= 86 && noTextValidation.score >= 80,
    hboMax: renderedValidation.components?.premiumSimilarity >= 78 && noTextValidation.components?.depth >= 70,
    primeVideo: renderedValidation.total >= 82 && renderedValidation.components?.heroDominance >= 52,
    agencyPresentation: noTextValidation.passed && renderedValidation.total >= 84,
    designerSignature: noTextValidation.score >= 80 && renderedValidation.components?.screenshotLikeness <= 34,
    screenshotRejected: renderedValidation.components?.screenshotLikeness <= 34 && noTextValidation.components?.screenshotLikeness <= 38,
    typographyRemovable: noTextValidation.passed,
  };
  const passed = Object.values(agencyQuestions).every(Boolean);
  return { passed, agencyQuestions, failures: Object.entries(agencyQuestions).filter(([, value]) => !value).map(([key]) => key) };
}