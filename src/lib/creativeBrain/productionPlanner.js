export function planProduction(imageFacts, identityFacts, marketingFacts, creativeDecisions) {
  const aspect = imageFacts.dimensions?.orientation === "portrait" ? "9:16_source_adapt_to_16:9_with_safe_crop" : "16:9";
  const preserve = identityFacts.areas_that_must_never_change || [];
  const modify = identityFacts.areas_that_may_change || [];

  return {
    schema_version: "1.0",
    source_analysis: imageFacts,
    identity_protection: {
      face_lock: identityFacts.face_visibility.clear_enough_to_preserve,
      body_lock: identityFacts.body_visibility.visible,
      pose_lock: identityFacts.pose_visibility.visible,
      expression_lock: identityFacts.expression_visibility.visible,
      skin_tone_lock: identityFacts.skin_tone_lock.required,
      hairstyle_lock: identityFacts.hairstyle_lock.required,
      identity_priority: identityFacts.identity_priority,
      identity_confidence: identityFacts.identity_confidence,
      preserve_areas: preserve,
      safely_modifiable_areas: modify,
      limitations: identityFacts.uncertainties
    },
    creative_direction: creativeDecisions,
    marketing_strategy: marketingFacts,
    composition_plan: {
      strongest_composition: creativeDecisions.composition,
      headline_zone: creativeDecisions.typography_zones?.[0] || null,
      logo_zone: creativeDecisions.logo_zones?.[0] || null,
      subject_anchor: imageFacts.subject_position,
      negative_space: imageFacts.negative_space,
      aspect_ratio: aspect,
      target_output_dimensions: aspect === "16:9" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 }
    },
    rendering_instructions: {
      PRESERVE: preserve.map(item => ({ element: item.area, box: item.box, instruction: item.instruction })),
      MODIFY: modify.map(item => ({ element: item.area, box: item.box, action: "available_for_background_or_atmosphere_adjustment" })),
      GENERATE: [
        { element: "background_extension_or_cleanup", action: imageFacts.background_environment.status === "not_semantically_identified_locally" ? "only_if_renderer_can_infer_from_source" : "match_source_environment" },
        { element: "atmosphere", value: creativeDecisions.atmosphere }
      ],
      LOCAL_COMPOSITE: [
        { element: "typography", zone: creativeDecisions.typography_zones?.[0] || null },
        { element: "logo", zone: creativeDecisions.logo_zones?.[0] || null }
      ],
      FORBIDDEN: ["alter detected face", "alter locked subject/body cluster", "change identity-defining skin tone", "invent factual campaign claims", "present heuristic CTR as factual"],
      subject_preservation: identityFacts.identity_priority,
      face_preservation: identityFacts.face_visibility.clear_enough_to_preserve ? "LOCK" : "UNCERTAIN",
      body_preservation: identityFacts.body_visibility.visible ? "LOCK" : "UNCERTAIN",
      pose_preservation: identityFacts.pose_visibility.visible ? "LOCK_PROXY" : "UNKNOWN",
      expression_preservation: identityFacts.expression_visibility.visible ? "LOCK" : "UNKNOWN",
      crop: imageFacts.camera_and_crop.crop,
      aspect_ratio: aspect,
      background_action: "protect_preserve_areas_modify_only_safe_zones",
      background_description: imageFacts.background_environment.status,
      lighting_action: creativeDecisions.lighting_action,
      lighting_direction: creativeDecisions.lighting_direction,
      lighting_temperature: imageFacts.dominant_colors?.[0]?.hex || "source_palette",
      atmosphere: creativeDecisions.atmosphere,
      depth: creativeDecisions.depth,
      color_grade: creativeDecisions.color_grade,
      effects: { fog: "low_or_none", particles: "none_unless_brand_requires", grain: "subtle" },
      typography_zone: creativeDecisions.typography_zones?.[0] || null,
      logo_zone: creativeDecisions.logo_zones?.[0] || null,
      forbidden_changes: ["identity drift", "face replacement", "body replacement", "unverified nudity changes", "fake performance metrics"],
      target_output_dimensions: aspect === "16:9" ? "1920x1080" : "1080x1920"
    },
    quality_requirements: {
      identity_confidence_minimum: identityFacts.face_visibility.visible ? 70 : 35,
      source_quality_score: imageFacts.image_quality.score,
      require_human_review: identityFacts.identity_confidence < 60 || imageFacts.visible_people.count === null,
      unsupported_metrics: ["actual CTR", "biometric match", "semantic clothing/nudity classification", "object detection"]
    },
    uncertainties: [...new Set([...(imageFacts.uncertainties || []), ...(identityFacts.uncertainties || []), ...(marketingFacts.uncertainties || []), ...(creativeDecisions.uncertainties || [])])]
  };
}