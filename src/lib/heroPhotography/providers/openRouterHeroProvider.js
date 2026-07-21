import { base44 } from "@/api/base44Client";

export const openRouterHeroProvider = {
  id: "rendering_intelligence_openrouter",
  name: "Rendering Intelligence Provider",
  async render({ sourceFrameDataUrl, identityReferenceDataUrl, instructions, productionBlueprint }) {
    const response = await base44.functions.invoke("openRouterAICover", {
      action: "generate",
      consent: true,
      story_reference_data_url: sourceFrameDataUrl,
      identity_reference_data_url: identityReferenceDataUrl || sourceFrameDataUrl,
      aspect_ratio: "16:9",
      metadata: {
        videoTitle: instructions.creative_decisions?.story || "Blueprint Hero Photograph",
        optionalSubtitle: instructions.creative_decisions?.emotional_promise || "Blueprint execution",
        campaignName: instructions.campaign_family,
        contentType: "Hero photography execution",
        heroPhotographyEngine: instructions,
        productionBlueprint
      }
    });
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
      providerMetadata: data,
      warnings: [data.production_qa?.public_message, ...(data.warnings || [])].filter(Boolean)
    };
  }
};