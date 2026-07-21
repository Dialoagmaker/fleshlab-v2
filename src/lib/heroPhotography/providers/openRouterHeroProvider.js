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
        videoTitle: instructions.hero_photography_plan?.Story || instructions.creative_decisions?.story || "",
        optionalSubtitle: instructions.hero_photography_plan?.Emotional_Hook || instructions.creative_decisions?.emotional_promise || "",
        campaignName: instructions.campaign_family,
        contentType: "professional hero photograph reconstructed from video frame reference",
        heroPhotographyEngine: instructions,
        heroPhotographyPlan: instructions.hero_photography_plan,
        sourceFrameUnderstanding: instructions.source_frame_understanding,
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
      reconstructionReport: data.reconstruction_report || null,
      providerMetadata: data,
      warnings: [data.production_qa?.public_message, ...(data.warnings || [])].filter(Boolean)
    };
  }
};