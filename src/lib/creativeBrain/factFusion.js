import { rule, confidence } from "./field";

function unwrap(fact) { return fact && typeof fact === "object" && "value" in fact ? fact.value : fact; }
function low(name, fact, list) { if (fact?.confidence < .55) list.push({ field: name, confidence: fact.confidence, value: fact.value }); }
function conflict(field, tech, semantic, conflicts) { if (tech !== undefined && semantic !== undefined && String(tech).toLowerCase() !== String(semantic).toLowerCase()) conflicts.push({ field, technical_value: tech, semantic_value: semantic }); }

export function fuseFacts(technicalFacts, semanticFacts) {
  const conflicts = [];
  const uncertainties = [];
  Object.entries(semanticFacts).forEach(([k, v]) => low(k, v, uncertainties));
  conflict("image_quality", unwrap(technicalFacts.exposure), unwrap(semanticFacts.perceived_production_quality), conflicts);

  return {
    module: "FACT_FUSION",
    output_type: "UnifiedImageFacts",
    schema_version: "2.0",
    technical: technicalFacts,
    semantic: semanticFacts,
    dimensions: rule({ width: unwrap(technicalFacts.width), height: unwrap(technicalFacts.height), aspect_ratio: unwrap(technicalFacts.aspect_ratio) }, 1, "deterministic_fusion"),
    technical_quality: rule({ sharpness: unwrap(technicalFacts.sharpness), blur: unwrap(technicalFacts.blur), exposure: unwrap(technicalFacts.exposure), contrast: unwrap(technicalFacts.contrast), luminance_distribution: unwrap(technicalFacts.luminance_distribution) }, .9, "deterministic_fusion"),
    color: rule(unwrap(technicalFacts.dominant_colors), .82, "deterministic_fusion"),
    subject_and_scene: rule({ people: unwrap(semanticFacts.number_of_people), subject: unwrap(semanticFacts.visible_subject_description), pose: unwrap(semanticFacts.pose), body_orientation: unwrap(semanticFacts.body_orientation), head_direction: unwrap(semanticFacts.head_direction), gaze: unwrap(semanticFacts.gaze), expression: unwrap(semanticFacts.facial_expression), clothing_state: unwrap(semanticFacts.clothing_state), environment: unwrap(semanticFacts.environment), scene_category: unwrap(semanticFacts.scene_category), visible_objects: unwrap(semanticFacts.visible_objects), activity: unwrap(semanticFacts.apparent_activity) }, confidence(Math.min(semanticFacts.visible_subject_description?.confidence || .4, semanticFacts.environment?.confidence || .4)), "semantic_vision"),
    attention_and_space: rule({ local_attention: unwrap(technicalFacts.crop_safety)?.attention_zones || [], local_negative_space: unwrap(technicalFacts.approximate_negative_space) || [], semantic_negative_space: unwrap(semanticFacts.usable_negative_space), semantic_typography_areas: unwrap(semanticFacts.areas_suitable_for_typography), strongest_visual_feature: unwrap(semanticFacts.strongest_visual_feature), weakest_visual_feature: unwrap(semanticFacts.weakest_visual_feature) }, .72, "deterministic_fusion"),
    preservation_candidates: rule({ local_faces: unwrap(technicalFacts.optional_face_bounding_boxes), local_subject_box: unwrap(technicalFacts.approximate_subject_box), semantic_preserve: unwrap(semanticFacts.elements_to_preserve), semantic_editable: unwrap(semanticFacts.elements_safe_to_change) }, .72, "deterministic_fusion"),
    story_signals: rule({ emotional_tone: unwrap(semanticFacts.emotional_tone), intimacy_level: unwrap(semanticFacts.intimacy_level), photographic_style: unwrap(semanticFacts.photographic_style), likely_narrative: unwrap(semanticFacts.likely_narrative) }, .68, "semantic_vision"),
    conflicts,
    uncertainties: [...uncertainties, ...(unwrap(semanticFacts.uncertainty_or_ambiguity) || []).map(item => ({ field: "semantic_uncertainty", value: item }))],
    provenance: { dimensions: "local measurement overrides semantic guesses", technical_quality: "local measurement", scene_meaning: "semantic vision", conflict_policy: "preserve conflicts; no silent resolution" }
  };
}