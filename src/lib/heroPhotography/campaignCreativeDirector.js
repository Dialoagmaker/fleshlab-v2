function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

const TERRITORY_LANGUAGE = {
  hotel: {
    genre: "cinematic intimate drama",
    colorNarrative: "deep blacks, wet highlights, warm skin, surgical red tension",
    typographyEnergy: "quiet but severe premium-series title energy",
    backgroundRole: "privacy, steam, surfaces and reflected light reveal the story world"
  },
  summer: {
    genre: "premium escapist campaign",
    colorNarrative: "sun-heated contrast, saturated skin warmth, clean bright escape tones",
    typographyEnergy: "bold sun-cut campaign typography with open air confidence",
    backgroundRole: "location, heat and movement make the fantasy feel expansive"
  },
  outdoor: {
    genre: "AAA adventure documentary",
    colorNarrative: "earth shadows, hard highlights, red danger accents, cinematic grit",
    typographyEnergy: "rugged expedition title energy",
    backgroundRole: "terrain and distance create stakes around the performer"
  },
  nightlife: {
    genre: "neo-noir premium series",
    colorNarrative: "black, neon red, violet shadows, glossy contrast",
    typographyEnergy: "after-dark thriller title energy",
    backgroundRole: "darkness and practical light imply secrecy and danger"
  },
  exclusive: {
    genre: "luxury fashion-documentary campaign",
    colorNarrative: "black field, cream highlights, controlled red brand heat",
    typographyEnergy: "minimal luxury campaign typography",
    backgroundRole: "negative space, texture and atmosphere frame the performer as the story"
  }
};

const COMPOSITIONS = [
  { key: "performer_monumental", performerDominanceSide: "right", titlePlacement: "left", compositionWeight: "performer_dominant", focusPath: "eye starts on performer, lands on title, returns to emotion" },
  { key: "environment_mystery", performerDominanceSide: "left", titlePlacement: "right", compositionWeight: "environment_dominant", focusPath: "eye reads atmosphere first, then performer, then title" },
  { key: "intimate_pressure", performerDominanceSide: "right", titlePlacement: "left", compositionWeight: "balanced", focusPath: "eye starts at face/body tension, title locks the memory" }
];

export function createCampaignDesignDirection({ story = {}, metadata = {}, campaignFamily = "", index = 0 }) {
  const language = TERRITORY_LANGUAGE[story.territory] || TERRITORY_LANGUAGE.exclusive;
  const composition = COMPOSITIONS[index % COMPOSITIONS.length];
  const sourceTitle = compact(story.sourceTitle || metadata.originalTitle || metadata.campaignTitle || "the source moment");
  const campaignTitle = compact(metadata.campaignTitle || sourceTitle);

  return {
    campaignMood: story.mood || "premium, cinematic, emotionally charged",
    campaignGenre: language.genre,
    visualStory: story.fantasy || `A premium campaign built around ${sourceTitle}`,
    heroMoment: campaignTitle || sourceTitle,
    emotionalHook: story.emotionalHook || "curiosity, intimacy and visual tension",
    colorNarrative: language.colorNarrative,
    typographyEnergy: language.typographyEnergy,
    compositionIntent: composition.key,
    compositionWeight: composition.compositionWeight,
    performerDominanceSide: composition.performerDominanceSide,
    titlePlacement: composition.titlePlacement,
    focusPath: composition.focusPath,
    backgroundRole: language.backgroundRole,
    imageRole: "The image carries the campaign story; typography supports the emotional read.",
    negativeSpacePrinciple: "Find negative space from the image and story instead of applying a fixed text slot.",
    campaignFamily
  };
}