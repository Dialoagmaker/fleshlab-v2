import { createCampaignDesignDirection } from "@/lib/heroPhotography/campaignCreativeDirector";

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
  const performer = compact(metadata.performerName || blueprint.performerName || blueprint.creatorName || "");
  const campaignTitle = compact(metadata.campaignTitle || "");
  const campaignTitleSource = metadata.source?.campaignTitle || "fallback";
  return pool.slice(0, 3).map((concept, index) => {
    const collection = compact(metadata.subtitle || "");
    const episode = compact(metadata.episode || "");
    const campaignType = performer ? "performer" : collection && episode ? "story" : collection ? "collection" : "brand";
    const campaignIdentity = campaignTitle || collection || concept.collection || concept.primaryTitle || campaignType;
    const heroWord = campaignTitle;
    const campaignDirection = createCampaignDesignDirection({ story, metadata, campaignFamily, index });
    const base = `${safeSlug(campaignIdentity)}_${safeSlug(collection || campaignType)}_${safeSlug(performer || campaignType)}`;
    return {
      ...concept,
      sceneDescription: story.sourceTitle,
      campaignType,
      campaignIdentity,
      heroWord,
      primaryTitle: campaignTitle,
      base,
      campaignConceptId: `${safeSlug(campaignTitle)}-${index + 1}`,
      campaignTitle,
      campaignTitleSource,
      titleSource: campaignTitleSource,
      campaignDirection,
      creativeDirection: campaignDirection,
      subtitle: collection,
      collection,
      seriesName: collection,
      performerName: performer || null,
      creatorName: performer || null,
      episode,
      primaryCTA: compact(metadata.cta || ""),
      campaignLabel: compact(metadata.campaignLabel || ""),
      releaseName: compact(metadata.releaseName || ""),
      storyIntelligence: story,
      campaignMetadata: {
        sceneDescription: story.sourceTitle,
        campaignType,
        campaignIdentity,
        heroWord,
        campaignTitle,
        campaignTitleSource,
        titleSource: campaignTitleSource,
        campaignDirection,
        creativeDirection: campaignDirection,
        campaignMood: campaignDirection.campaignMood,
        campaignGenre: campaignDirection.campaignGenre,
        campaignIdentityBible: campaignDirection.campaignIdentity,
        visualDNA: campaignDirection.visualDNA,
        visualGenre: campaignDirection.visualGenre,
        visualStory: campaignDirection.visualStory,
        heroMoment: campaignDirection.heroMoment,
        emotionalHook: campaignDirection.emotionalHook,
        photographyStyle: campaignDirection.photographyStyle,
        artDirection: campaignDirection.artDirection,
        lightingPhilosophy: campaignDirection.lightingPhilosophy,
        colorNarrative: campaignDirection.colorNarrative,
        colorLanguage: campaignDirection.colorLanguage,
        typographyEnergy: campaignDirection.typographyEnergy,
        typographyStyle: campaignDirection.typographyStyle,
        compositionStrategy: campaignDirection.compositionStrategy,
        brandEnergy: campaignDirection.brandEnergy,
        posterHierarchy: campaignDirection.posterHierarchy,
        performer: performer || null,
        collection: collection || null,
        performerName: performer || null,
        episode: episode || null,
        cta: compact(metadata.cta || ""),
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