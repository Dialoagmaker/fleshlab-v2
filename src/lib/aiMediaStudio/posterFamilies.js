export const POSTER_FAMILIES = [
  {
    id: 'hero-poster',
    label: 'Hero Poster',
    philosophy: 'Make the performer the product; title and brand support the body/face memory.',
    dominantElement: 'hero_performer',
    compositions: ['close_hero', 'anchor', 'brand_hero'],
    cropZoom: 1.18,
    treatment: 'warm-hero',
    scoreBias: { hero: 9, thumbnail: 2, commercial: 4 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Permanent Marker', titleScale: 0.072, accentScale: 0.54 },
  },
  {
    id: 'movie-poster',
    label: 'Movie Poster',
    philosophy: 'Sell the scene as a cinematic event with hierarchy, atmosphere, and trailer-poster drama.',
    dominantElement: 'environment',
    compositions: ['floating', 'anchor', 'lower'],
    cropZoom: 1.02,
    treatment: 'cinema-noir',
    scoreBias: { hero: 2, thumbnail: 4, commercial: 8 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Inter', titleScale: 0.084, accentScale: 0.34 },
  },
  {
    id: 'commercial-thumbnail',
    label: 'Commercial Thumbnail',
    philosophy: 'Maximize two-second click clarity: face/body, giant readable title, strong brand stamp.',
    dominantElement: 'main_title',
    compositions: ['brand_hero', 'close_hero', 'anchor'],
    cropZoom: 1.12,
    treatment: 'high-click',
    scoreBias: { hero: 5, thumbnail: 12, commercial: 7 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Permanent Marker', titleScale: 0.135, accentScale: 0.48 },
  },
  {
    id: 'story-poster',
    label: 'Story Poster',
    philosophy: 'Make the viewer ask what happened before and what happens next.',
    dominantElement: 'environment',
    compositions: ['floating', 'lower', 'anchor'],
    cropZoom: 0.98,
    treatment: 'documentary',
    scoreBias: { hero: 1, thumbnail: 2, commercial: 9 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Inter', titleScale: 0.066, accentScale: 0.3 },
  },
  {
    id: 'minimal-poster',
    label: 'Minimal Poster',
    philosophy: 'Use restraint, negative space, and premium quietness instead of shouting.',
    dominantElement: 'hero_performer',
    compositions: ['minimal', 'floating', 'anchor'],
    cropZoom: 1.03,
    treatment: 'minimal-premium',
    scoreBias: { hero: 4, thumbnail: -1, commercial: 8 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Inter', titleScale: 0.055, accentScale: 0.28 },
  },
  {
    id: 'editorial-poster',
    label: 'Editorial Poster',
    philosophy: 'Feel like a provocative magazine cover with structured type and graphic tension.',
    dominantElement: 'main_title',
    compositions: ['editorial', 'floating', 'brand_hero'],
    cropZoom: 1.05,
    treatment: 'editorial-red',
    scoreBias: { hero: 2, thumbnail: 5, commercial: 9 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Inter', titleScale: 0.095, accentScale: 0.26 },
  },
  {
    id: 'premium-poster',
    label: 'Premium Poster',
    philosophy: 'Luxury studio key art: polished contrast, controlled branding, high perceived value.',
    dominantElement: 'hero_performer',
    compositions: ['premium', 'anchor', 'floating'],
    cropZoom: 1.08,
    treatment: 'premium-gold',
    scoreBias: { hero: 5, thumbnail: 4, commercial: 10 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Inter', titleScale: 0.07, accentScale: 0.3 },
  },
  {
    id: 'dark-poster',
    label: 'Dark Poster',
    philosophy: 'Mystery and shadow first; red accents and contrast create adult tension.',
    dominantElement: 'hero_performer',
    compositions: ['close_hero', 'floating', 'lower'],
    cropZoom: 1.12,
    treatment: 'dark-red',
    scoreBias: { hero: 4, thumbnail: 3, commercial: 8 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Permanent Marker', titleScale: 0.076, accentScale: 0.5 },
  },
  {
    id: 'action-poster',
    label: 'Action Poster',
    philosophy: 'Use diagonal energy, impact, and motion tension to make the poster feel alive.',
    dominantElement: 'hero_performer',
    compositions: ['action', 'close_hero', 'brand_hero'],
    cropZoom: 1.15,
    treatment: 'action-red',
    scoreBias: { hero: 7, thumbnail: 7, commercial: 6 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Permanent Marker', titleScale: 0.09, accentScale: 0.5 },
  },
  {
    id: 'emotional-poster',
    label: 'Emotional Poster',
    philosophy: 'Lead with intimacy and vulnerability; make the image feel personal, not generic.',
    dominantElement: 'hero_performer',
    compositions: ['emotional', 'minimal', 'floating'],
    cropZoom: 1.1,
    treatment: 'soft-emotional',
    scoreBias: { hero: 8, thumbnail: 1, commercial: 7 },
    typography: { titleFont: 'Bebas Neue', accentFont: 'Inter', titleScale: 0.063, accentScale: 0.28 },
  },
];

export function getPosterFamilySearchSpace(analysis = {}, metadata = {}) {
  const text = [metadata.videoTitle, metadata.optionalSubtitle, metadata.campaignName, metadata.contentType].filter(Boolean).join(' ').toLowerCase();
  const preferred = [];
  if (/dark|night|hotel|room|secret|forbidden/.test(text) || analysis.brightness < 0.45) preferred.push('dark-poster', 'movie-poster');
  if (/first|raw|real|amateur|debut/.test(text)) preferred.push('emotional-poster', 'story-poster');
  if (/beach|outdoor|travel|summer|island|cebu/.test(text)) preferred.push('hero-poster', 'premium-poster');
  if (/action|rough|wild|intense/.test(text)) preferred.push('action-poster', 'commercial-thumbnail');

  const byId = new Map(POSTER_FAMILIES.map(family => [family.id, family]));
  const ordered = preferred.map(id => byId.get(id)).filter(Boolean);
  POSTER_FAMILIES.forEach(family => {
    if (!ordered.some(item => item.id === family.id)) ordered.push(family);
  });
  return ordered;
}

export function choosePosterFamily(analysis, metadata = {}) {
  return getPosterFamilySearchSpace(analysis, metadata)[0];
}