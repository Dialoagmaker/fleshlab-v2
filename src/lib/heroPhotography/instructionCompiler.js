function unwrap(value) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

export function compileHeroPhotographyInstructions({ productionBlueprint, platformRules, campaignFamily }) {
  const identity = productionBlueprint.identity_protection;
  const creative = productionBlueprint.creative_direction;
  const rendering = productionBlueprint.rendering_instructions;
  return {
    engine: "FLESHLAB Hero Photography Engine",
    execution_mode: "execute_blueprint_only",
    campaign_family: campaignFamily,
    platform_rules: platformRules,
    quality_target: ["Netflix Key Art", "Premium Editorial Cover", "Luxury Campaign Photography", "AAA Streaming Artwork"],
    non_goal: "Do not target generic AI image quality.",
    preserve: rendering.preserve,
    modify_only: rendering.modify,
    generate_only: rendering.generate,
    forbidden: rendering.forbidden,
    identity_protection: {
      facial_identity: unwrap(identity.face_preservation_required),
      body_proportions: unwrap(identity.body_preservation_required),
      pose: unwrap(identity.pose_preservation_required),
      expression: unwrap(identity.expression_preservation_required),
      gaze_direction: true,
      skin_tone: unwrap(identity.skin_tone_preservation_required),
      distinguishing_visual_characteristics: unwrap(identity.preserve_regions),
      capability_limit: unwrap(identity.identity_capability),
      risk: unwrap(identity.identity_risk)
    },
    creative_decisions: {
      story: unwrap(creative.story),
      emotional_promise: unwrap(creative.emotional_promise),
      subject_hierarchy: unwrap(creative.subject_hierarchy),
      background_strategy: unwrap(creative.background_strategy),
      lighting_strategy: unwrap(creative.lighting_strategy),
      color_language: unwrap(creative.color_language),
      atmosphere: unwrap(creative.atmosphere),
      depth: unwrap(creative.depth),
      texture: unwrap(creative.texture),
      effects: unwrap(creative.effects),
      crop: unwrap(creative.crop),
      focal_emphasis: unwrap(creative.focal_emphasis)
    },
    provider_directive: "Translate these instructions to the provider without adding new creative decisions. If an instruction cannot be honored, fail with structured warnings instead of improvising.",
    performer_rule: "Never invent a different performer. Preserve requested identity, pose, expression, gaze, skin tone and body proportions.",
    editable_scope_rule: "Modify only elements explicitly listed in modify_only or generate_only. Everything else is protected."
  };
}