import { normalizeCanonicalCategory, policyRiskForCanonicalCategory } from "@/lib/canonicalContentPolicy";

function textOf(value) {
  try { return JSON.stringify(value || {}).toLowerCase(); } catch (_) { return ""; }
}

function classifyRenderIntent({ productionBlueprint, instructions, campaignFamily, targetPlatform }) {
  const text = `${textOf(productionBlueprint)} ${textOf(instructions)} ${campaignFamily || ""} ${targetPlatform || ""}`;
  let rawCategory = "SAFE_EDITORIAL";
  let reason = "General commercial art-direction request.";
  let confidence = 0.64;
  if (/explicit|hardcore|porn|sexual/.test(text)) { rawCategory = "EXPLICIT"; reason = "Explicit or sexual language appears in the render context."; confidence = 0.82; }
  else if (/adult/.test(text)) { rawCategory = "ADULT_MARKETING"; reason = "Adult-commercial language appears in the render context."; confidence = 0.78; }
  else if (/fitness|gym|athletic|body/.test(text)) { rawCategory = "FITNESS"; reason = "Fitness or athletic visual intent appears in the render context."; confidence = 0.72; }
  else if (/swim/.test(text)) { rawCategory = "SWIMWEAR"; reason = "Swimwear context appears in the render context."; confidence = 0.7; }
  else if (/underwear/.test(text)) { rawCategory = "UNDERWEAR"; reason = "Underwear context appears in the render context."; confidence = 0.7; }
  else if (/beauty|skin|portrait|face/.test(text)) { rawCategory = "SAFE_PORTRAIT"; reason = "Portrait or identity-forward commercial intent appears in the render context."; confidence = 0.7; }
  else if (/product|brand|campaign/.test(text)) { rawCategory = "SAFE_PRODUCT"; reason = "Product or brand campaign context appears in the render context."; confidence = 0.66; }
  else if (/fashion|editorial|magazine|luxury|cover|key art|poster|netflix|hbo|amazon/.test(text)) { rawCategory = "SAFE_EDITORIAL"; reason = "Editorial, fashion, cover, or premium key-art context appears in the render context."; confidence = 0.69; }
  const category = normalizeCanonicalCategory(rawCategory, "SAFE_EDITORIAL");
  return {
    category,
    rawCategory,
    canonicalCategory: category,
    source: "frontend_provider_intelligence",
    confidence,
    policyRisk: policyRiskForCanonicalCategory(category),
    technicalIntent: "IMAGE_REFERENCE_GENERATION",
    reason,
    version: "provider-intelligence-v4-canonical-policy"
  };
}

function profileFor(provider) {
  const isOpenRouter = provider.id === "rendering_intelligence_openrouter";
  return {
    provider: provider.name,
    providerId: provider.id,
    providerFamily: isOpenRouter ? "OpenRouter routed image providers (route-level capability required)" : provider.name,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsImageEditing: false,
    executableCapabilityLevel: isOpenRouter ? "route_level_backend_verified" : "adapter_level",
    supportsCommercialPhotography: true,
    supportsEditorialKeyArt: true,
    supportsBrandConsistency: true,
    supportsAdultSafeCommercial: false,
    supportedAspectRatios: ["16:9"],
    maxImageSize: "Backend limit: 9MB reference image / 12M data URL chars",
    preferredUseCases: ["Commercial Portrait", "Editorial Cover", "Fashion", "Fitness", "Product", "Art Direction"],
    knownContentRestrictions: ["Provider-family safety policy may reject adult, explicit, or ambiguous human imagery"],
    knownFailurePatterns: ["CONTENT_POLICY", "IMAGE_SAFETY", "PROHIBITED_CONTENT", "UNSUPPORTED_IMAGE_INPUT"],
    expectedLatency: "10s-60s depending on routed model",
    qualityTier: "high",
    costTier: "variable"
  };
}

function scoreProfile(profile, classification) {
  const category = normalizeCanonicalCategory(typeof classification === "object" ? classification.canonicalCategory || classification.category : classification, "SAFE_EDITORIAL");
  const adultRisk = ["ADULT_COMMERCIAL", "EXPLICIT_ADULT"].includes(category);
  const technical = profile.executableCapabilityLevel === "route_level_backend_verified" ? 0.6 : profile.supportsImageInput && profile.supportsImageOutput ? 1 : 0;
  const policy = adultRisk && !profile.supportsAdultSafeCommercial ? 0.28 : 0.86;
  const commercial = profile.supportsCommercialPhotography ? 0.9 : 0.45;
  const identity = profile.supportsImageEditing ? 0.78 : 0.48;
  const latency = profile.expectedLatency.includes("10s") ? 0.72 : 0.55;
  const cost = profile.costTier === "variable" ? 0.62 : 0.72;
  const risk = adultRisk ? 0.35 : 0.72;
  const score = Number((technical * 0.22 + policy * 0.24 + commercial * 0.18 + identity * 0.14 + latency * 0.08 + cost * 0.06 + risk * 0.08).toFixed(3));
  return {
    provider: profile.provider,
    providerId: profile.providerId,
    providerFamily: profile.providerFamily,
    score,
    technicalCompatibility: profile.executableCapabilityLevel === "route_level_backend_verified" ? "requires concrete model-endpoint capability verification" : technical === 1 ? "image input and output supported" : "missing image capability",
    policyCompatibility: policy >= 0.8 ? "compatible" : "policy risk",
    commercialQuality: commercial,
    identityPreservationCapability: identity,
    expectedSuccessProbability: risk,
    estimatedLatency: profile.expectedLatency,
    estimatedCost: profile.costTier,
    knownFailureRisk: 1 - risk,
    knownRisks: profile.knownFailurePatterns
  };
}

export function planProviderExecution({ providers, productionBlueprint, instructions, targetPlatform, campaignFamily }) {
  const contentClassification = classifyRenderIntent({ productionBlueprint, instructions, campaignFamily, targetPlatform });
  const profiles = providers.map(profileFor);
  const ranking = profiles.map(profile => scoreProfile(profile, contentClassification)).sort((a, b) => b.score - a.score);
  const selected = ranking[0] || null;
  return {
    stage: "Provider Intelligence",
    contentClassification,
    providerProfiles: profiles,
    providerRanking: ranking,
    selectedProvider: selected,
    routingDecision: selected ? {
      selectedProvider: selected.provider,
      providerFamily: selected.providerFamily,
      reason: "Highest compatibility score among available rendering providers before render attempt."
    } : {
      selectedProvider: null,
      providerFamily: null,
      reason: "No rendering provider is available."
    }
  };
}