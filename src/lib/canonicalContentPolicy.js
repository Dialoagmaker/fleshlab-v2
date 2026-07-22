export const CANONICAL_CONTENT_TAXONOMY = {
  SAFE_EDITORIAL: {
    semanticMeaning: "Non-explicit editorial, commercial, portrait, fitness, fashion, product, lifestyle, swimwear, and underwear creative.",
    policyRisk: "standard",
    providerCompatibility: "Allowed when provider supports general safe image-reference generation.",
    externalProviderMapping: { openrouter: "standard image policy", google_gemini: "safe editorial image generation", openai_image: "standard image generation", black_forest_labs: "general image generation", bytedance_seed: "general image generation" }
  },
  ADULT_COMMERCIAL: {
    semanticMeaning: "Adult-oriented commercial or suggestive marketing that is not explicit sexual content.",
    policyRisk: "restricted",
    providerCompatibility: "Allowed only when provider explicitly supports adult commercial imagery after governance checks.",
    externalProviderMapping: { openrouter: "provider-specific adult-commercial policy", google_gemini: "not assumed", openai_image: "not assumed", black_forest_labs: "not assumed", bytedance_seed: "adult-commercial support must be explicit" }
  },
  EXPLICIT_ADULT: {
    semanticMeaning: "Explicit adult sexual content or verified explicit adult production material.",
    policyRisk: "restricted_explicit",
    providerCompatibility: "Allowed only when provider explicitly supports explicit adult generation; ADULT_COMMERCIAL is incompatible unless explicitly upgraded.",
    externalProviderMapping: { openrouter: "explicit provider support required", google_gemini: "not supported unless provider says explicit", openai_image: "not supported unless provider says explicit", black_forest_labs: "not supported unless provider says explicit", bytedance_seed: "not supported unless provider says explicit" }
  },
  UNSUPPORTED: {
    semanticMeaning: "Blocked, unverified, unknown, or unsupported content category.",
    policyRisk: "blocked",
    providerCompatibility: "Never route externally.",
    externalProviderMapping: { openrouter: "blocked", google_gemini: "blocked", openai_image: "blocked", black_forest_labs: "blocked", bytedance_seed: "blocked" }
  }
};

const ALIASES = {
  SAFE_EDITORIAL: "SAFE_EDITORIAL", COMMERCIAL_PORTRAIT: "SAFE_EDITORIAL", EDITORIAL_COVER: "SAFE_EDITORIAL", FASHION: "SAFE_EDITORIAL", FITNESS: "SAFE_EDITORIAL", TRAVEL: "SAFE_EDITORIAL", PRODUCT: "SAFE_EDITORIAL", SAFE_PRODUCT: "SAFE_EDITORIAL", ART_DIRECTION: "SAFE_EDITORIAL", SAFE_BRAND: "SAFE_EDITORIAL", SAFE_PORTRAIT: "SAFE_EDITORIAL", LIFESTYLE: "SAFE_EDITORIAL", SWIMWEAR: "SAFE_EDITORIAL", UNDERWEAR: "SAFE_EDITORIAL",
  ADULT_COMMERCIAL: "ADULT_COMMERCIAL", ADULT_MARKETING: "ADULT_COMMERCIAL", SUGGESTIVE_ADULT: "ADULT_COMMERCIAL",
  EXPLICIT: "EXPLICIT_ADULT", EXPLICIT_ADULT: "EXPLICIT_ADULT", EXPLICIT_VERIFIED_ADULT: "EXPLICIT_ADULT",
  UNSUPPORTED: "UNSUPPORTED", BLOCKED_OR_UNVERIFIED: "UNSUPPORTED"
};

export function categoryToken(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function normalizeCanonicalCategory(value, fallback = "UNSUPPORTED") {
  return ALIASES[categoryToken(value)] || fallback;
}

export function policyRiskForCanonicalCategory(value) {
  return CANONICAL_CONTENT_TAXONOMY[normalizeCanonicalCategory(value)]?.policyRisk || "blocked";
}