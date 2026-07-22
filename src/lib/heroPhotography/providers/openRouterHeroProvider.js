import { base44 } from "@/api/base44Client";

export const openRouterHeroProvider = {
  id: "rendering_intelligence_openrouter",
  name: "Rendering Intelligence Provider",
  async render({ sourceFrameDataUrl, instructions, productionBlueprint, privacyIntent, providerIntelligencePlan }) {
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
        contentType: "professional hero photograph from consent-approved selected Hero Frame",
        heroPhotographyPlan: instructions.hero_photography_plan,
        sourceFrameUnderstanding: instructions.source_frame_understanding,
        productionBlueprint,
        providerIntelligence: providerIntelligencePlan,
        renderingParameters: { aspect_ratio: "16:9", output: "professional_hero_photograph" }
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
      model: data.model || data.resolved_model || "model not exposed",
      seed: data.seed || null,
      reconstructionReport: data.reconstruction_report || null,
      providerMetadata: data,
      warnings: [data.production_qa?.public_message, ...(data.warnings || [])].filter(Boolean)
    };
  }
};