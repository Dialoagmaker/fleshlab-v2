function pickMainZone(zones = [], fallback = "center") {
  return zones[0] ? { zone: zones[0].zone, box: { x: zones[0].x, y: zones[0].y, width: zones[0].width, height: zones[0].height } } : { zone: fallback, box: null };
}

export function directCreative(imageFacts, identityFacts, marketingFacts) {
  const headline = pickMainZone(imageFacts.safe_typography_zones, "no_safe_headline_zone");
  const logo = pickMainZone((imageFacts.safe_typography_zones || []).slice(1), "secondary_safe_zone");
  const light = imageFacts.lighting?.dominant_direction || "balanced";
  const exposure = imageFacts.image_quality?.exposure;
  const campaign = marketingFacts.campaign_category;
  const preserveSubject = identityFacts.areas_that_must_never_change?.length > 0;

  return {
    module: "CREATIVE_DIRECTOR",
    output_type: "CreativeDecisions",
    schema_version: "1.0",
    input_modules: ["ImageFacts", "IdentityFacts", "MarketingFacts"],
    lighting_direction: light,
    lighting_action: exposure === "very_dark" ? "increase_subject_readability_without_changing_identity" : "preserve_existing_light_direction",
    atmosphere: campaign === "premium_visual_campaign" ? "premium_controlled" : "clean_commercial",
    story: marketingFacts.strongest_selling_point,
    luxury_level: campaign === "premium_visual_campaign" ? "high" : "medium",
    emotion: identityFacts.face_visibility?.visible ? "identity_led" : "mystery_or_silhouette_led",
    composition: preserveSubject ? "protect_subject_cluster_and_use_negative_space" : "build_hierarchy_from_attention_map",
    perspective: imageFacts.camera_and_crop?.camera_angle === "not_implemented_locally" ? "preserve_existing_perspective" : imageFacts.camera_and_crop.camera_angle,
    depth: imageFacts.depth?.estimate || "uncertain",
    visual_hierarchy: [
      { rank: 1, element: "subject_or_attention_anchor", source: imageFacts.attention_map?.[0]?.zone || "unknown" },
      { rank: 2, element: "headline", target_zone: headline.zone },
      { rank: 3, element: "logo", target_zone: logo.zone }
    ],
    typography_zones: [headline],
    logo_zones: [logo],
    color_grade: imageFacts.lighting?.average_luminance < 0.3 ? "lift_shadows_preserve_mood" : "preserve_dominant_palette",
    uncertainties: ["environment semantics are not available locally", "creative references are intentionally not generated as prompts"]
  };
}