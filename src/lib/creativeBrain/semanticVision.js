import { base44 } from "@/api/base44Client";
import { uploadApprovedHeroFrame } from "@/lib/creativeBrain/heroFrameUploadAdapter";

const fact = (type) => ({ type: "object", properties: { value: { type }, confidence: { type: "number" }, source: { type: "string" } }, required: ["value", "confidence", "source"] });
const stringFact = fact("string");
const numberFact = fact("number");
const arrayFact = { type: "object", properties: { value: { type: "array", items: { type: "string" } }, confidence: { type: "number" }, source: { type: "string" } }, required: ["value", "confidence", "source"] };

export const SEMANTIC_IMAGE_FACTS_SCHEMA = {
  type: "object",
  properties: {
    module: { type: "string" }, output_type: { type: "string" }, schema_version: { type: "string" },
    number_of_people: numberFact, visible_subject_description: stringFact, pose: stringFact, body_orientation: stringFact, head_direction: stringFact, gaze: stringFact, facial_expression: stringFact, clothing_state: stringFact,
    environment: stringFact, scene_category: stringFact, visible_objects: arrayFact, apparent_activity: stringFact, emotional_tone: stringFact, intimacy_level: stringFact, photographic_style: stringFact,
    perceived_production_quality: stringFact, strongest_visual_feature: stringFact, weakest_visual_feature: stringFact, likely_narrative: stringFact, usable_negative_space: arrayFact, areas_suitable_for_typography: arrayFact,
    elements_to_preserve: arrayFact, elements_safe_to_change: arrayFact, uncertainty_or_ambiguity: arrayFact,
    provider_disclosure: { type: "object", properties: { integration: { type: "string" }, model: { type: "string" }, provider: { type: "string" } }, required: ["integration", "model", "provider"] }
  },
  required: ["module", "output_type", "schema_version", "number_of_people", "visible_subject_description", "pose", "body_orientation", "head_direction", "gaze", "facial_expression", "clothing_state", "environment", "scene_category", "visible_objects", "apparent_activity", "emotional_tone", "intimacy_level", "photographic_style", "perceived_production_quality", "strongest_visual_feature", "weakest_visual_feature", "likely_narrative", "usable_negative_space", "areas_suitable_for_typography", "elements_to_preserve", "elements_safe_to_change", "uncertainty_or_ambiguity", "provider_disclosure"]
};

export async function analyzeSemanticVision(file) {
  const uploaded = await uploadApprovedHeroFrame(file, { consentGranted: true });
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Analyze only the visible semantic content of this single uploaded image. Return SemanticImageFacts JSON only. Every field must include value, confidence 0-1, and source exactly semantic_vision. Do not create a production blueprint. Do not write prompts. Do not invent names, identities, exact locations, relationships, dates, or events. If uncertain, lower confidence and add the issue to uncertainty_or_ambiguity.`,
    file_urls: [uploaded.signed_url],
    response_json_schema: SEMANTIC_IMAGE_FACTS_SCHEMA
  });
  return {
    ...result,
    module: "SEMANTIC_VISION",
    output_type: "SemanticImageFacts",
    schema_version: "2.0",
    provider_disclosure: { integration: "Base44 Core InvokeLLM", model: "automatic", provider: "provider not exposed by Base44" },
    privacy: { source_file_upload: "request-bound private Hero Frame", temporary_signed_url_seconds: uploaded.expires_in || 900, public_url_created: false, request_id_revoked_after_upload: true, file_uri: uploaded.file_uri }
  };
}