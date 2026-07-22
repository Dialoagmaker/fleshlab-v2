import { base44 } from "@/api/base44Client";

export const openRouterHeroProvider = {
  id: "rendering_intelligence_openrouter",
  name: "Rendering Intelligence Provider",
  async render({ sourceFrameDataUrl, instructions, productionBlueprint, privacyIntent, providerIntelligencePlan, renderContext = {} }) {
    let response;
    try {
      response = await base44.functions.invoke("openRouterAICover", {
      action: "generate",
      consent: true,
      privacy_guard: privacyIntent,
      story_reference_data_url: sourceFrameDataUrl,
      aspect_ratio: "16:9",
      metadata: {
        videoTitle: instructions.hero_photography_plan?.Story || instructions.creative_decisions?.story || "",
        optionalSubtitle: instructions.hero_photography_plan?.Emotional_Hook || instructions.creative_decisions?.emotional_promise || "",
        campaignName: instructions.campaign_family,
        contentType: "creative commercial key-art reconstruction from consent-approved selected Hero Frame",
        heroPhotographyPlan: instructions.hero_photography_plan,
        sourceFrameUnderstanding: instructions.source_frame_understanding,
        productionBlueprint,
        sourceAssetId: renderContext.sourceAssetId || "selected-hero-frame",
        blueprintExecutionHash: renderContext.blueprintExecutionHash || "",
        editorialIntent: providerIntelligencePlan?.editorialIntent,
        policyEvidenceAudit: providerIntelligencePlan?.policyEvidenceAudit,
        policyClassification: providerIntelligencePlan?.policyClassification,
        contentClassification: providerIntelligencePlan?.policyClassification || providerIntelligencePlan?.contentClassification,
        providerIntelligence: providerIntelligencePlan,
        renderingParameters: { aspect_ratio: "16:9", output: "creative_commercial_key_art_reconstruction", reconstruction_required: true, reference_fidelity_required: false, creative_reconstruction_allowed: true }
      }
    });
    } catch (error) {
      const providerData = error.response?.data || error.data || null;
      const wrapped = new Error(providerData?.error || error.message || "Rendering Intelligence provider failed.");
      wrapped.providerData = providerData;
      throw wrapped;
    }
    const data = response.data || {};
    if (!data.ok || !data.generated_image_data_url) {
      const error = new Error(data.error || "Provider failed to return a hero image.");
      error.providerData = data;
      throw error;
    }
    return {
      imageDataUrl: data.generated_image_data_url,
      model: data.model || data.selected_model || data.resolved_model || data.provider_intelligence?.attemptedModels?.slice(-1)?.[0] || "model not exposed",
      providerFamily: data.provider_family || data.provider_intelligence?.providerFamily || null,
      routeCapability: data.route_capability || null,
      seed: data.seed || null,
      reconstructionReport: data.reconstruction_report || null,
      providerMetadata: data,
      warnings: [data.production_qa?.public_message, ...(data.warnings || [])].filter(Boolean)
    };
  }
};