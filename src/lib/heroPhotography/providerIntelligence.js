function textOf(value) {
  try { return JSON.stringify(value || {}).toLowerCase(); } catch (_) { return ""; }
}

function classifyRenderIntent({ productionBlueprint, instructions, campaignFamily, targetPlatform }) {
  const text = `${textOf(productionBlueprint)} ${textOf(instructions)} ${campaignFamily || ""} ${targetPlatform || ""}`;
  if (/explicit|hardcore|porn|sexual|adult/.test(text)) return "Adult Commercial";
  if (/fitness|gym|athletic|body/.test(text)) return "Fitness";
  if (/fashion|editorial|magazine|luxury/.test(text)) return "Fashion";
  if (/travel|hotel|outdoor|destination/.test(text)) return "Travel";
  if (/beauty|skin|portrait|face/.test(text)) return "Commercial Portrait";
  if (/product|brand|campaign/.test(text)) return "Product";
  if (/cover|key art|poster|netflix|hbo|amazon/.test(text)) return "Editorial Cover";
  return "Art Direction";
}

function profileFor(provider) {
  const isOpenRouter = provider.id === "rendering_intelligence_openrouter";
  return {
    provider: provider.name,
    providerId: provider.id,
    providerFamily: isOpenRouter ? "OpenRouter routed image providers" : provider.name,
    supportsImageInput: true,
    supportsImageOutput: true,
    supportsImageEditing: isOpenRouter,
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
  const adultRisk = ["Adult Commercial", "Explicit Adult"].includes(classification);
  const technical = profile.supportsImageInput && profile.supportsImageOutput ? 1 : 0;
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
    technicalCompatibility: technical === 1 ? "image input and output supported" : "missing image capability",
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