import { FLESHLAB_FRANCHISE_LIBRARY } from "./fleshlabBrandBible";

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function cleanWords(metadata = {}) {
  const safeFields = [
    metadata.description,
    metadata.short_summary,
    metadata.summary,
    metadata.tags?.join?.(" "),
    metadata.categories?.join?.(" "),
    metadata.performerName,
    metadata.brandName,
    metadata.sceneNotes,
    metadata.aiDescription,
  ];
  return safeFields.filter(Boolean).join(" ").toLowerCase();
}

function contains(text, words) {
  return words.some(word => text.includes(word));
}

function deterministicIndex(seed, length) {
  return Math.abs(Math.round(seed * 1000)) % length;
}

function narrativeFromAnalysis(analysis = {}, metadata = {}) {
  const text = cleanWords(metadata);
  const brightness = clamp(analysis.averageBrightness ?? analysis.brightness ?? analysis.sceneBrightness ?? 0.42);
  const curiosity = clamp(analysis.visualCuriosity ?? analysis.clickPotential ?? 0.58);
  const interaction = clamp(analysis.interactionStrength ?? analysis.emotionalPresence ?? 0.56);
  const background = clamp(analysis.backgroundComplexity ?? 0.44);
  const subject = clamp(analysis.subjectSeparation ?? analysis.subjectVisibility ?? 0.58);
  const night = brightness < 0.48 || contains(text, ["night", "midnight", "after dark", "late"]);
  const privateRoom = background < 0.58 || contains(text, ["room", "bedroom", "hotel", "motel", "suite", "apartment"]);
  const outdoor = contains(text, ["outdoor", "forest", "nature", "trail", "park", "outside", "public"]);
  const water = contains(text, ["beach", "pool", "sea", "ocean", "water", "shore", "island"]);
  const hotel = contains(text, ["hotel", "motel", "suite", "check in", "room service"]);
  const bathroom = contains(text, ["bathroom", "shower", "steam", "ceramic", "tile", "mirror"]);
  const gym = contains(text, ["gym", "fitness", "locker", "steel", "concrete", "workout"]);
  const closeEncounter = interaction > 0.52 || contains(text, ["couple", "duo", "two", "pair", "encounter"]);
  const premium = subject > 0.56 && curiosity > 0.5;
  return { text, brightness, curiosity, interaction, background, subject, night, privateRoom, outdoor, water, hotel, bathroom, gym, closeEncounter, premium };
}

function classifyProduct(narrative) {
  const t = narrative.text;
  if (contains(t, ["trailer", "teaser", "preview"])) return "Trailer";
  if (contains(t, ["behind the scenes", "bts", "backstage", "making of"])) return "Behind The Scenes";
  if (contains(t, ["massage", "spa", "service"])) return "Massage";
  if (narrative.bathroom) return "Bathroom";
  if (narrative.gym) return "Gym";
  if (narrative.night) return "Night";
  if (narrative.hotel) return "Hotel Session";
  if (narrative.water || contains(t, ["vacation", "holiday", "resort", "escape"])) return "Vacation";
  if (narrative.outdoor) return "Outdoor";
  if (contains(t, ["twink", "young", "boyish"])) return "Twink";
  if (contains(t, ["pov", "point of view"])) return "POV";
  if (contains(t, ["solo", "alone"])) return "Solo";
  if (narrative.closeEncounter) return "Couple";
  return "Feature Release";
}

function classifyFantasy(narrative, product) {
  const t = narrative.text;
  if (contains(t, ["danger", "risk", "public", "caught"])) return narrative.outdoor ? "Public Risk" : "Danger";
  if (contains(t, ["forbidden", "secret", "hidden", "private", "locked"])) return "Secret";
  if (contains(t, ["romantic", "soft", "tender"])) return "Romantic";
  if (contains(t, ["wild", "rough", "raw"])) return "Raw";
  if (contains(t, ["dominance", "dom", "control"])) return "Dominance";
  if (contains(t, ["submission", "submissive", "obedient"])) return "Submission";
  if (product === "Vacation") return "Vacation";
  if (product === "Outdoor") return narrative.privateRoom ? "Adventure" : "Wild";
  if (narrative.night && narrative.privateRoom) return "Forbidden";
  if (narrative.curiosity > 0.62) return "Curiosity";
  return narrative.closeEncounter ? "Private" : "Curiosity";
}

function classifyVisualElement(narrative) {
  if (narrative.water) return "Water";
  if (narrative.outdoor) return "Nature";
  if (narrative.bathroom) return "Bathroom";
  if (narrative.gym) return "Gym";
  if (narrative.hotel) return "Hotel";
  if (narrative.privateRoom) return narrative.closeEncounter ? "Interaction" : "Room";
  if (narrative.subject > 0.66) return "Face";
  if (narrative.background > 0.62) return "Landscape";
  return narrative.closeEncounter ? "Interaction" : "Body";
}

function classifyCommercialCategory(product, fantasy, visualElement) {
  if (product === "Vacation" || visualElement === "Water") return "Luxury Magazine";
  if (product === "Bathroom") return "A24 Minimal Tension";
  if (product === "Gym") return "AAA Character Cover";
  if (product === "Night") return "Cinematic Movie Poster";
  if (product === "Outdoor") return fantasy === "Public Risk" ? "Documentary Style" : "Cinematic Movie Poster";
  if (product === "Behind The Scenes") return "Reality TV";
  if (product === "Trailer") return "YouTube Hero";
  if (product === "Hotel Session" && ["Forbidden", "Secret", "Danger"].includes(fantasy)) return "Netflix Poster";
  if (["Face", "Interaction", "Body"].includes(visualElement)) return "Premium Thumbnail";
  return "Streaming Cover";
}

function scoreFranchise(franchise, brief) {
  let score = 0;
  if (franchise.products.includes(brief.product)) score += 4;
  if (franchise.fantasies.includes(brief.fantasy)) score += 3;
  if (franchise.visuals.includes(brief.visualElement)) score += 2;
  if (franchise.categories.includes(brief.category)) score += 1.5;
  return score;
}

function selectFranchise(brief) {
  return [...FLESHLAB_FRANCHISE_LIBRARY]
    .sort((a, b) => scoreFranchise(b, brief) - scoreFranchise(a, brief))[0];
}

function episodeIndex(metadata = {}, narrative) {
  const explicit = Number(metadata.episodeNumber || metadata.episode || metadata.seriesEpisode);
  if (Number.isFinite(explicit) && explicit > 0) return explicit - 1;
  const seed = narrative.curiosity * 0.37 + narrative.interaction * 0.29 + narrative.subject * 0.23 + narrative.brightness * 0.11;
  return deterministicIndex(seed, 6);
}

export function createCommercialCampaign({ analysis = {}, metadata = {} } = {}) {
  const narrative = narrativeFromAnalysis(analysis, metadata);
  const product = classifyProduct(narrative);
  const fantasy = classifyFantasy(narrative, product);
  const visualElement = classifyVisualElement(narrative);
  const category = classifyCommercialCategory(product, fantasy, visualElement);
  const brief = { product, fantasy, visualElement, category };
  const franchise = selectFranchise(brief);
  const index = episodeIndex(metadata, narrative) % franchise.episodes.length;
  const episodeNumber = index + 1;
  const episodeTitle = franchise.episodes[index];
  const performer = metadata.performerName || metadata.performer || "FLESHLAB Cast";
  const explicitTitle = metadata.videoTitle || metadata.title || metadata.campaignName || franchise.campaignName;
  const explicitSubtitle = metadata.optionalSubtitle || metadata.subtitle || `Episode ${episodeNumber}: ${episodeTitle}`;
  const hookLine = `${franchise.tagline} ${product === "Trailer" ? "The preview starts now." : "The episode starts here."}`;
  return {
    ...brief,
    campaignName: metadata.campaignName || franchise.campaignName,
    mainTitle: explicitTitle,
    title: explicitTitle,
    episodeNumber,
    episodeTitle,
    subtitle: explicitSubtitle,
    performer,
    hookLine,
    hook: hookLine,
    marketingTagline: franchise.tagline,
    footerCategory: franchise.footerCategory,
    cta: franchise.cta,
    source: "fleshlab_brand_bible",
    brandBibleAnswers: {
      commercialProduct: product,
      emotionalFantasy: fantasy,
      strongestVisualElement: visualElement,
      commercialCategory: category,
    },
    visualNarrative: {
      subjects: narrative.closeEncounter ? "two-person encounter" : "performer-led private scene",
      setting: narrative.bathroom ? "bathroom cold steam ceramic" : narrative.gym ? "gym industrial steel concrete" : narrative.hotel ? "hotel warm luxury" : narrative.water ? "water vacation natural light" : narrative.outdoor ? "outdoor natural wide" : narrative.night ? "night blue neon contrast" : narrative.privateRoom ? "private room cinematic darkness" : "undisclosed cinematic location",
      emotionalHook: fantasy,
      dominantEmotion: fantasy,
      fantasy,
      strongestVisualElement: visualElement,
      commercialPromise: "award-level entertainment key art: unique composition, performer as hero, official FLESHLAB brand recognition",
    },
    artDirectorDoctrine: {
      role: "Creative Director, not cover composer",
      mandate: "commercial entertainment key art, not template filling or generic AI poster decoration",
      brandDNA: ["raw", "authentic", "premium", "Asian", "modern", "dark", "cinematic", "luxury", "minimal", "confident"],
      logoRule: "official logo only; never redraw or reinterpret",
      finalTest: "ten covers must feel different, belong to one brand, and communicate story before the title is read",
    },
    hierarchy: ["performer", "story atmosphere", "title as design", "official brand anchor", "premium negative space"],
    clickScore: Math.round((0.46 + narrative.curiosity * 0.22 + narrative.interaction * 0.17 + narrative.subject * 0.15) * 100),
    titleSource: explicitTitle === franchise.campaignName ? "franchise" : "user_input",
  };
}