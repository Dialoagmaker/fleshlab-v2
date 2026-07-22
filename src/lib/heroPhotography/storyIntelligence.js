function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function upper(value) {
  return compact(value).toUpperCase();
}

function includesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function safeSlug(value, fallback = "campaign") {
  return compact(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

const LITERAL_LOCATION_HERO_WORDS = new Set(["BATHROOM", "BEDROOM", "KITCHEN", "SOFA", "DOOR", "ROOM", "SHOWER", "TOILET", "SINK", "BED"]);

function isExplicitUserCampaignTitle(metadata = {}, title = "") {
  return metadata.source?.campaignTitle === "user" && compact(metadata.campaignTitle) && upper(metadata.campaignTitle) === upper(title);
}

function deriveHeroWord(campaignIdentity, metadata = {}, fallback = "PRIVATE ACCESS") {
  const identity = upper(campaignIdentity || fallback);
  if (!identity) return fallback;
  if (LITERAL_LOCATION_HERO_WORDS.has(identity) && !isExplicitUserCampaignTitle(metadata, identity)) return fallback;
  return identity;
}

export function createStoryIntelligence({ metadata = {}, blueprint = {}, campaignFamily = "" }) {
  const sourceTitle = compact(metadata.originalTitle || metadata.videoTitle || metadata.title || blueprint.originalTitle || blueprint.videoTitle || blueprint.sourceTitle || "");
  const text = `${sourceTitle} ${metadata.subtitle || ""} ${metadata.releaseName || ""} ${campaignFamily || ""}`.toLowerCase();
  const isHotel = includesAny(text, ["hotel", "suite", "room", "check", "bathroom", "shower", "steam"]);
  const isNight = includesAny(text, ["night", "midnight", "after hours", "club", "dark"]);
  const isBeach = includesAny(text, ["beach", "summer", "pool", "island", "ocean", "heat"]);
  const isOutdoor = includesAny(text, ["outdoor", "wild", "forest", "road", "travel", "off grid"]);

  const setting = isBeach ? "sunlit escape" : isOutdoor ? "remote location" : isHotel ? "private hotel interior" : isNight ? "after-dark private space" : "premium private setting";
  const mood = isBeach ? "hot, open, escapist" : isOutdoor ? "raw, cinematic, off-grid" : isNight ? "nocturnal, intimate, exclusive" : isHotel ? "clean, steamy, private, premium" : "intimate, premium, memorable";
  const fantasy = isBeach ? "an invite into a summer escape" : isOutdoor ? "leaving the city for something unfiltered" : isNight ? "access after everyone else has left" : isHotel ? "private access behind a closed hotel door" : "private access to a premium moment";
  const emotionalHook = isBeach ? "heat and freedom" : isOutdoor ? "risk and discovery" : isNight ? "secrecy and anticipation" : isHotel ? "clean seduction and privacy" : "desire through exclusivity";

  return {
    sourceTitle,
    fantasy,
    mood,
    emotionalHook,
    setting,
    memorable: isHotel ? "steam, morning light, privacy, polished intimacy" : isBeach ? "sun, skin, movement, escape" : isOutdoor ? "location, isolation, raw atmosphere" : "identity, atmosphere, access",
    territory: isBeach ? "summer" : isOutdoor ? "outdoor" : isNight ? "nightlife" : isHotel ? "hotel" : "exclusive"
  };
}

const conceptPools = {
  hotel: [
    { primaryTitle: "CHECK-IN", collection: "Hotel Sessions", moodKey: "hotel", designVariant: "editorial_split", badges: ["Exclusive", "Private", "On Location", "4K"] },
    { primaryTitle: "AFTER HOURS", collection: "Midnight Collection", moodKey: "nightlife", designVariant: "full_bleed", badges: ["Behind The Scenes", "After Dark", "Director Cut", "4K"] },
    { primaryTitle: "STEAM", collection: "Private Moments", moodKey: "luxury", designVariant: "poster_panel", badges: ["Private", "Clean", "Intimate", "Exclusive"] }
  ],
  summer: [
    { primaryTitle: "SUMMER HEAT", collection: "Beach Escape", moodKey: "summer", designVariant: "full_bleed", badges: ["On Location", "Exclusive", "4K", "Raw"] },
    { primaryTitle: "OFF GRID", collection: "Travel Files", moodKey: "travel", designVariant: "editorial_split", badges: ["Location", "Private", "Director Cut", "4K"] },
    { primaryTitle: "BEACH ESCAPE", collection: "Summer Collection", moodKey: "beach", designVariant: "poster_panel", badges: ["Premium", "Open Air", "Exclusive", "4K"] }
  ],
  outdoor: [
    { primaryTitle: "INTO THE WILD", collection: "Off Grid", moodKey: "travel", designVariant: "full_bleed", badges: ["On Location", "Raw", "4K", "Exclusive"] },
    { primaryTitle: "THE ARRIVAL", collection: "Travel Files", moodKey: "luxury", designVariant: "editorial_split", badges: ["Cinematic", "Location", "Director Cut", "4K"] },
    { primaryTitle: "RAW", collection: "Field Notes", moodKey: "behind", designVariant: "poster_panel", badges: ["Behind The Scenes", "Raw", "Private", "4K"] }
  ],
  nightlife: [
    { primaryTitle: "AFTER HOURS", collection: "Midnight Collection", moodKey: "nightlife", designVariant: "full_bleed", badges: ["After Dark", "Exclusive", "4K", "Private"] },
    { primaryTitle: "MIDNIGHT", collection: "Private Access", moodKey: "exclusive", designVariant: "poster_panel", badges: ["Director Cut", "Private", "Premium", "4K"] },
    { primaryTitle: "PRIVATE ACCESS", collection: "Night Sessions", moodKey: "luxury", designVariant: "editorial_split", badges: ["Exclusive", "Behind The Scenes", "4K", "Limited"] }
  ],
  exclusive: [
    { primaryTitle: "PRIVATE ACCESS", collection: "FLESHLAB Originals", moodKey: "exclusive", designVariant: "poster_panel", badges: ["Exclusive", "Premium", "4K", "Director Cut"] },
    { primaryTitle: "THE ARRIVAL", collection: "New Releases", moodKey: "luxury", designVariant: "editorial_split", badges: ["Premiere", "On Location", "4K", "Private"] },
    { primaryTitle: "RAW", collection: "Private Moments", moodKey: "behind", designVariant: "full_bleed", badges: ["Behind The Scenes", "Raw", "Exclusive", "4K"] }
  ]
};

export function buildCampaignConcepts({ metadata = {}, blueprint = {}, campaignFamily = "" }) {
  const story = createStoryIntelligence({ metadata, blueprint, campaignFamily });
  const pool = conceptPools[story.territory] || conceptPools.exclusive;
  const performer = compact(metadata.performerName || blueprint.performerName || blueprint.creatorName || "Featured Creator");
  const userCampaignTitle = compact(metadata.campaignTitle);
  const userTitleIsExplicit = metadata.source?.campaignTitle === "user" && userCampaignTitle;
  return pool.slice(0, 3).map((concept, index) => {
    const episode = `Episode ${String(index + 1).padStart(2, "0")}`;
    const campaignIdentity = userTitleIsExplicit ? userCampaignTitle : compact(concept.campaignIdentity || concept.primaryTitle || concept.collection || "PRIVATE ACCESS");
    const heroWord = deriveHeroWord(campaignIdentity, metadata, concept.primaryTitle || "PRIVATE ACCESS");
    const campaignTitle = userCampaignTitle || campaignIdentity;
    const base = `${safeSlug(heroWord)}_${safeSlug(concept.collection)}_${safeSlug(performer)}`;
    return {
      ...concept,
      sceneDescription: story.sourceTitle,
      campaignIdentity,
      heroWord,
      primaryTitle: heroWord,
      base,
      campaignConceptId: `${safeSlug(heroWord)}-${index + 1}`,
      campaignTitle,
      subtitle: concept.collection,
      seriesName: concept.collection,
      performerName: performer,
      creatorName: performer,
      episode,
      primaryCTA: compact(metadata.cta || "Watch Now"),
      campaignLabel: compact(metadata.campaignLabel || story.emotionalHook),
      releaseName: compact(metadata.releaseName || concept.collection),
      storyIntelligence: story,
      campaignMetadata: {
        sceneDescription: story.sourceTitle,
        campaignIdentity,
        heroWord,
        campaignTitle,
        collection: concept.collection,
        performerName: performer,
        episode,
        badges: concept.badges,
        sourceTitle: story.sourceTitle,
        metadataOnlyDescription: story.sourceTitle,
        fantasy: story.fantasy,
        mood: story.mood,
        emotionalHook: story.emotionalHook,
        setting: story.setting,
        memorable: story.memorable
      },
      releaseType: "premium_key_art",
      campaignGoal: "emotion_first_entertainment_key_art",
      emotionalTone: story.mood
    };
  });
}

export function getDefaultCampaignConcept({ metadata = {}, blueprint = {}, campaignFamily = "" }) {
  return buildCampaignConcepts({ metadata, blueprint, campaignFamily })[0];
}