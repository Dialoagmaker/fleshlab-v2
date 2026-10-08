function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hash(value) {
  return compact(value).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

const GENRES = [
  { name: "Luxury Fashion Editorial", lens: "85mm editorial portrait compression", lighting: "large soft key with glossy rim separation", color: "black, cream highlights, controlled red heat", type: "elegant minimal serif-condensed restraint", energy: "luxury, controlled, magnetic", hierarchy: "performer first, brand whisper, title as signature" },
  { name: "Netflix Documentary", lens: "35mm observational realism", lighting: "motivated practical light and honest shadows", color: "muted documentary warmth with selective red tension", type: "clean documentary title system", energy: "real, intimate, human", hierarchy: "story world first, performer second, title as chapter" },
  { name: "A24 Cinema", lens: "50mm cinematic tension lens", lighting: "single motivated key, deep falloff, unsettling negative space", color: "moody neutrals, bruised shadows, one sharp red accent", type: "quiet arthouse typography", energy: "mysterious, dangerous, memorable", hierarchy: "emotion first, silence second, title last" },
  { name: "Adventure Campaign", lens: "28mm environmental hero perspective", lighting: "hard natural key with atmospheric rim", color: "earth, heat, sky, cinematic red marker", type: "rugged expedition typography", energy: "freedom, distance, risk", hierarchy: "environment and performer share dominance" },
  { name: "Luxury Hotel Advertising", lens: "70mm polished interior editorial", lighting: "controlled practical glow, clean reflective highlights", color: "deep blacks, wet highlights, warm skin, premium red", type: "severe luxury title restraint", energy: "private, expensive, seductive", hierarchy: "performer as luxury object, environment as promise" },
  { name: "Street Photography", lens: "35mm close documentary street lens", lighting: "available light with flash-like edge energy", color: "urban blacks, sodium warmth, raw red signage", type: "raw compressed campaign type", energy: "immediate, alive, unpolished-premium", hierarchy: "moment first, texture second, title as stamp" },
  { name: "High-End Fitness Editorial", lens: "50mm athletic commercial lens", lighting: "sculpted body key, crisp rim, controlled contrast", color: "graphite, sweat highlights, electric red pulse", type: "kinetic athletic typography", energy: "discipline, heat, power", hierarchy: "body line first, motion second, title as force" },
  { name: "Summer Lifestyle", lens: "35mm sunlit lifestyle lens", lighting: "bright directional sun and soft fill", color: "sun heat, skin warmth, sea/sky air, fresh red", type: "open confident lifestyle typography", energy: "freedom, heat, escape", hierarchy: "location atmosphere first, performer as invitation" }
];

const COMPOSITIONS = [
  { strategy: "centered_monument", side: "center", placement: "center", band: "low", weight: "performer_dominant", focus: "eye locks on performer symmetry, then title lands like a campaign mark" },
  { strategy: "wide_environment", side: "left", placement: "right", band: "middle", weight: "environment_dominant", focus: "eye enters through the world, discovers performer, then reads the title" },
  { strategy: "intimate_closeup", side: "right", placement: "left", band: "middle", weight: "performer_dominant", focus: "eye starts on proximity and tension, then title clarifies the promise" },
  { strategy: "low_title_cinema", side: "center", placement: "center", band: "low", weight: "balanced", focus: "image carries the poster; typography sits as final confirmation" },
  { strategy: "documentary_caption", side: "left", placement: "right", band: "top", weight: "balanced", focus: "story evidence and atmosphere lead before the title speaks" },
  { strategy: "asymmetric_fashion", side: "right", placement: "left", band: "top", weight: "performer_dominant", focus: "negative space feels styled, not empty; title behaves like a fashion masthead" }
];

function chooseGenre(story, metadata, campaignFamily, index) {
  const text = `${story.territory || ""} ${story.mood || ""} ${story.sourceTitle || ""} ${metadata.campaignTitle || ""} ${campaignFamily || ""}`.toLowerCase();
  if (/hotel|room|suite|bath|shower|steam/.test(text)) return GENRES[4];
  if (/beach|summer|pool|island|ocean|sun/.test(text)) return GENRES[7];
  if (/gym|fitness|workout|locker|sport/.test(text)) return GENRES[6];
  if (/outdoor|travel|road|forest|wild|adventure/.test(text)) return GENRES[3];
  if (/behind|raw|documentary|bts/.test(text)) return GENRES[1];
  return GENRES[(hash(text) + index) % GENRES.length];
}

export function createCampaignBible({ story = {}, metadata = {}, campaignFamily = "", index = 0 }) {
  const genre = chooseGenre(story, metadata, campaignFamily, index);
  const composition = COMPOSITIONS[(hash(`${metadata.campaignTitle || ""} ${story.sourceTitle || ""}`) + index) % COMPOSITIONS.length];
  const sourceTitle = compact(story.sourceTitle || metadata.originalTitle || metadata.campaignTitle || "source moment");
  const identity = compact(metadata.campaignTitle || sourceTitle || genre.name);
  const emotion = compact(story.emotionalHook || genre.energy);
  return {
    campaignIdentity: identity,
    campaignTheme: story.territory || genre.name,
    visualDNA: `${genre.name} / ${composition.strategy} / ${emotion}`,
    visualGenre: genre.name,
    photographyStyle: `${genre.name}: ${genre.lens}`,
    artDirection: story.fantasy || `Create the official campaign world for ${identity}`,
    typographyStyle: genre.type,
    lightingPhilosophy: genre.lighting,
    colorLanguage: genre.color,
    compositionStrategy: composition.strategy,
    brandEnergy: genre.energy,
    posterHierarchy: genre.hierarchy,
    campaignMood: story.mood || genre.energy,
    campaignGenre: genre.name,
    audienceEmotion: emotion,
    visualStory: story.fantasy || `The viewer should want to know the story behind ${sourceTitle}`,
    heroMoment: identity,
    emotionalHook: emotion,
    colorNarrative: genre.color,
    typographyPersonality: genre.type,
    typographyEnergy: genre.type,
    compositionIntent: composition.strategy,
    compositionWeight: composition.weight,
    performerDominanceSide: composition.side,
    titlePlacement: composition.placement,
    titleBand: composition.band,
    focusPath: composition.focus,
    backgroundRole: "The background actively explains the world, not decoration.",
    heroQuestion: "Who is the hero, what world do they belong to, and what remains after five seconds?",
    viewerFirstLook: composition.focus,
    twoSecondEmotion: emotion,
    imageRole: "The image must work as campaign identity before typography is added.",
    negativeSpacePrinciple: "Negative space is commissioned from the photographic concept, never reserved as a template slot.",
    campaignFamily
  };
}

export function validateCampaignBible(bible = {}) {
  const required = ["campaignIdentity", "campaignTheme", "visualDNA", "photographyStyle", "artDirection", "typographyStyle", "lightingPhilosophy", "colorLanguage", "compositionStrategy", "brandEnergy", "posterHierarchy"];
  const missing = required.filter(key => !compact(bible[key]));
  return { ready: missing.length === 0, missing, required };
}