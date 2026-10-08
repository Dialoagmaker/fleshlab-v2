export const EDITORIAL_CLASSIFICATION_SCHEMA = {
  editorialDomain: ["FASHION", "BEAUTY", "FITNESS", "PRODUCT", "PORTRAIT", "LIFESTYLE", "ENTERTAINMENT", "ART"],
  creativePurpose: ["COMMERCIAL_CAMPAIGN", "EDITORIAL", "BRAND", "LOOKBOOK", "COVER_ART", "SOCIAL_MEDIA", "ADVERTISEMENT"],
  visualGenre: ["HERO_PORTRAIT", "EDITORIAL_PORTRAIT", "STUDIO_FASHION", "FITNESS_EDITORIAL", "BEAUTY_CLOSEUP", "PRODUCT_HERO"],
  brandContext: ["PREMIUM_CREATOR_BRAND", "STUDIO_BRAND", "TALENT_BRAND", "PRODUCT_BRAND", "ENTERTAINMENT_BRAND"],
  photographicStyle: ["LUXURY_STUDIO", "CINEMATIC_KEY_ART", "CLEAN_COMMERCIAL", "EDITORIAL_MAGAZINE", "ATHLETIC_STUDIO", "ART_DIRECTED_PORTRAIT"]
};

function textOf(value) {
  try { return JSON.stringify(value || {}).toLowerCase(); } catch (_) { return ""; }
}

function pickDomain(text) {
  if (/fitness|gym|athletic|training|body|sport/.test(text)) return ["FITNESS", 0.92];
  if (/beauty|skin|face|closeup|grooming/.test(text)) return ["BEAUTY", 0.9];
  if (/product|merch|packshot|commerce/.test(text)) return ["PRODUCT", 0.88];
  if (/portrait|headshot|identity|talent/.test(text)) return ["PORTRAIT", 0.86];
  if (/lifestyle|travel|home|daily/.test(text)) return ["LIFESTYLE", 0.82];
  if (/entertainment|series|episode|poster|cover|key art|campaign/.test(text)) return ["ENTERTAINMENT", 0.84];
  if (/art|gallery|conceptual|experimental/.test(text)) return ["ART", 0.8];
  return ["FASHION", 0.82];
}

function pickPurpose(text) {
  if (/advertisement|ad campaign|paid media/.test(text)) return "ADVERTISEMENT";
  if (/social|instagram|tiktok|shorts/.test(text)) return "SOCIAL_MEDIA";
  if (/cover|poster|key art|thumbnail/.test(text)) return "COVER_ART";
  if (/lookbook|catalog/.test(text)) return "LOOKBOOK";
  if (/brand|branding|identity system/.test(text)) return "BRAND";
  if (/editorial|magazine|feature/.test(text)) return "EDITORIAL";
  return "COMMERCIAL_CAMPAIGN";
}

function pickGenre(text, domain) {
  if (domain === "FITNESS") return "FITNESS_EDITORIAL";
  if (domain === "BEAUTY") return "BEAUTY_CLOSEUP";
  if (domain === "PRODUCT") return "PRODUCT_HERO";
  if (domain === "FASHION" && /studio|fashion|lookbook|wardrobe/.test(text)) return "STUDIO_FASHION";
  if (/editorial|magazine|luxury|portrait/.test(text)) return "EDITORIAL_PORTRAIT";
  return "HERO_PORTRAIT";
}

function pickStyle(text, domain) {
  if (/cinematic|poster|key art|dramatic/.test(text)) return "CINEMATIC_KEY_ART";
  if (/magazine|editorial|fashion/.test(text)) return "EDITORIAL_MAGAZINE";
  if (domain === "FITNESS") return "ATHLETIC_STUDIO";
  if (/clean|product|commercial/.test(text)) return "CLEAN_COMMERCIAL";
  if (/portrait|art directed/.test(text)) return "ART_DIRECTED_PORTRAIT";
  return "LUXURY_STUDIO";
}

export function classifyEditorialIntent({ productionBlueprint, instructions, campaignFamily, targetPlatform }) {
  const text = `${textOf(productionBlueprint)} ${textOf(instructions)} ${(campaignFamily || "").toLowerCase()} ${(targetPlatform || "").toLowerCase()}`;
  const [editorialDomain, domainConfidence] = pickDomain(text);
  const creativePurpose = pickPurpose(text);
  const visualGenre = pickGenre(text, editorialDomain);
  const photographicStyle = pickStyle(text, editorialDomain);

  return {
    editorialDomain,
    creativePurpose,
    visualGenre,
    brandContext: /creator|performer|talent/.test(text) ? "PREMIUM_CREATOR_BRAND" : "STUDIO_BRAND",
    photographicStyle,
    identityPreservation: /identity|face|portrait|hero frame|reference|talent|performer/.test(text),
    referenceImageRequired: true,
    confidence: Number(Math.min(0.96, Math.max(0.72, domainConfidence)).toFixed(2)),
    source: "editorial_classification_engine",
    version: "editorial-intent-v1"
  };
}