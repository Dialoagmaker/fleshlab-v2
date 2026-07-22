function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function includesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

const DIRECTIONS = {
  beach_escape: {
    key: "beach_escape",
    label: "Beach Escape",
    composition: "BOTTOM_CINEMA_BAND",
    titleAlign: "center",
    titleZone: "CENTER",
    fontFamily: "Bebas Neue",
    graphicLanguage: "sun-washed gradient, horizon band, open negative space",
    accent: "#ffb23f",
    secondary: "#d7f5ff",
    graphicZone: { x: 0.08, y: 0.58, w: 0.84, h: 0.32 },
    photoZone: { x: 0, y: 0, w: 1, h: 1 },
    photoTreatment: "FULL_BLEED"
  },
  hotel_sessions: {
    key: "hotel_sessions",
    label: "Hotel Sessions",
    composition: "RIGHT_EDITORIAL_PANEL",
    titleAlign: "left",
    titleZone: "RIGHT",
    fontFamily: "Inter",
    graphicLanguage: "luxury hotel keycard panel, warm shadow, restrained linework",
    accent: "#cf102d",
    secondary: "#f4f1ea",
    graphicZone: { x: 0.56, y: 0.08, w: 0.38, h: 0.78 },
    photoZone: { x: 0, y: 0, w: 0.68, h: 1 }
  },
  private_access: {
    key: "private_access",
    label: "Private Access",
    composition: "CENTER_VAULT",
    titleAlign: "center",
    titleZone: "CENTER",
    fontFamily: "Inter",
    graphicLanguage: "minimal vault card, centered premium restraint, thin red rules",
    accent: "#f0183d",
    secondary: "#ffffff",
    graphicZone: { x: 0.17, y: 0.18, w: 0.66, h: 0.52 },
    photoZone: { x: 0, y: 0, w: 1, h: 1 },
    photoTreatment: "FULL_BLEED"
  },
  behind_scenes: {
    key: "behind_scenes",
    label: "Behind The Scenes",
    composition: "CONTACT_SHEET",
    titleAlign: "left",
    titleZone: "LEFT",
    fontFamily: "Inter",
    graphicLanguage: "documentary contact sheet, stamped labels, production notes",
    accent: "#f05b2a",
    secondary: "#f4f1ea",
    graphicZone: { x: 0.05, y: 0.11, w: 0.43, h: 0.72 },
    photoZone: { x: 0.38, y: 0, w: 0.62, h: 1 }
  },
  outdoor_adventure: {
    key: "outdoor_adventure",
    label: "Outdoor Adventure",
    composition: "EXPEDITION_TOP_BANNER",
    titleAlign: "left",
    titleZone: "LEFT",
    fontFamily: "Bebas Neue",
    graphicLanguage: "expedition map marks, wide cinematic title, rugged border",
    accent: "#d9a441",
    secondary: "#e8efe2",
    graphicZone: { x: 0.06, y: 0.08, w: 0.62, h: 0.34 },
    photoZone: { x: 0, y: 0, w: 1, h: 1 },
    photoTreatment: "FULL_BLEED"
  },
  bareback_hotel: {
    key: "bareback_hotel",
    label: "Bareback Hotel",
    composition: "MOTEL_NOIR",
    titleAlign: "right",
    titleZone: "RIGHT",
    fontFamily: "Bebas Neue",
    graphicLanguage: "noir motel signage, hard red slash, deep room shadows",
    accent: "#ff2638",
    secondary: "#f4f1ea",
    graphicZone: { x: 0.52, y: 0.12, w: 0.42, h: 0.7 },
    photoZone: { x: 0, y: 0, w: 0.7, h: 1 }
  },
  massage_room: {
    key: "massage_room",
    label: "Massage Room",
    composition: "SOFT_SPA_CENTER",
    titleAlign: "center",
    titleZone: "CENTER",
    fontFamily: "Inter",
    graphicLanguage: "soft spa panel, amber haze, quiet centered title",
    accent: "#d6a15d",
    secondary: "#fff0da",
    graphicZone: { x: 0.16, y: 0.52, w: 0.68, h: 0.34 },
    photoZone: { x: 0, y: 0, w: 1, h: 1 },
    photoTreatment: "FULL_BLEED"
  },
  gym_session: {
    key: "gym_session",
    label: "Gym Session",
    composition: "KINETIC_SIDEBAR",
    titleAlign: "left",
    titleZone: "LEFT",
    fontFamily: "Bebas Neue",
    graphicLanguage: "athletic sidebar, motion ticks, high-energy red blocks",
    accent: "#ff2433",
    secondary: "#d7ffe6",
    graphicZone: { x: 0.05, y: 0.08, w: 0.36, h: 0.78 },
    photoZone: { x: 0.28, y: 0, w: 0.72, h: 1 }
  },
  editorial_default: {
    key: "editorial_default",
    label: "Editorial Release",
    composition: "ASYMMETRIC_EDITORIAL",
    titleAlign: "left",
    titleZone: "LEFT",
    fontFamily: "Bebas Neue",
    graphicLanguage: "asymmetric key art, red editorial strike, cinematic negative space",
    accent: "#f0183d",
    secondary: "#f4f1ea",
    graphicZone: { x: 0.06, y: 0.1, w: 0.42, h: 0.74 },
    photoZone: { x: 0.38, y: 0, w: 0.62, h: 1 }
  }
};

export function resolveCampaignArtDirection(campaign = {}) {
  const text = clean([
    campaign.campaignTitle,
    campaign.collection,
    campaign.subtitle,
    campaign.releaseName,
    campaign.campaignLabel,
    campaign.storyIntelligence?.setting,
    campaign.storyIntelligence?.sourceTitle
  ].filter(Boolean).join(" ")).toLowerCase();

  if (includesAny(text, ["beach", "summer", "pool", "island", "ocean"])) return DIRECTIONS.beach_escape;
  if (includesAny(text, ["bareback", "motel"])) return DIRECTIONS.bareback_hotel;
  if (includesAny(text, ["massage", "spa", "oil"])) return DIRECTIONS.massage_room;
  if (includesAny(text, ["gym", "fitness", "workout", "muscle", "locker"])) return DIRECTIONS.gym_session;
  if (includesAny(text, ["behind", "bts", "backstage", "documentary", "raw"])) return DIRECTIONS.behind_scenes;
  if (includesAny(text, ["outdoor", "adventure", "wild", "forest", "travel", "off grid"])) return DIRECTIONS.outdoor_adventure;
  if (includesAny(text, ["hotel", "room", "bathroom", "shower", "check-in"])) return DIRECTIONS.hotel_sessions;
  if (includesAny(text, ["private access", "exclusive", "vault"])) return DIRECTIONS.private_access;
  return DIRECTIONS.editorial_default;
}