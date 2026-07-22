function unwrap(value) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value];
}

function joinList(value, fallback) {
  const list = asList(value);
  return list.length ? list.join("; ") : fallback;
}

function buildHeroPhotographyPlan({ productionBlueprint, platformRules, campaignFamily }) {
  const creative = productionBlueprint.creative_direction;
  const rendering = productionBlueprint.rendering_instructions;
  const composition = productionBlueprint.composition_plan || {};
  const story = unwrap(creative.story) || unwrap(creative.focal_emphasis) || "source-led commercial moment";
  const emotionalHook = unwrap(creative.emotional_promise) || "premium emotional focus";
  const subject = unwrap(creative.subject_hierarchy) || "strongest visible subject";
  const editable = joinList(rendering.modify, "non-identity environment, atmosphere, light and production design");
  const generated = joinList(rendering.generate, "commercial environment extension and depth");
  const forbidden = joinList(rendering.forbidden, "identity drift, changed person, changed emotional intent");
  const typographyZone = unwrap(composition.title_zone) || unwrap(composition.subtitle_zone) || "intentional negative space away from face and emotional focal point";

  return {
    philosophy: {
      input: "Uploaded frame as creative reference and identity/story continuity source",
      output: "Creative commercial key-art reconstruction",
      never_output: "Enhanced screenshot, simple retouch, upscaled frame, or template-like copy of the source geometry",
      goal: "Create a premium cinematic advertising photograph inspired by the source frame while protecting recognizable subject and story continuity."
    },
    source_frame_understanding: {
      emotional_moment: emotionalHook,
      visual_story: story,
      strongest_subject: subject,
      weakest_visual_elements: editable,
      distractions: "compression artifacts, flat lighting, weak depth, accidental framing and low production polish should be creatively rebuilt, not merely retouched",
      opportunities: generated,
      emotional_hook: emotionalHook
    },
    hero_photography_plan: {
      Camera: "Choose a premium commercial hero angle inspired by the source moment. Lens perspective, crop, framing and camera distance may change to create stronger key art and typography space.",
      Lens: "Use cinematic editorial lens treatment with controlled perspective, premium subject separation, depth and advertising polish.",
      Lighting: {
        key_light: unwrap(creative.lighting_strategy) || "designed cinematic key light that upgrades the scene into premium advertising photography",
        fill_light: "controlled low fill for sculpted contrast and readable subject detail",
        rim_light: "stronger commercial rim or edge separation when useful for premium key art",
        practical_lights: "motivated cinematic practicals and atmosphere may be introduced when consistent with the story world",
        shadows_reflections_texture: "designed shadows, reflections, moisture, atmosphere, texture and premium color contrast"
      },
      Background: "Rebuild the background treatment for cinematic depth, clean negative space, atmosphere and commercial polish while preserving recognizable scene inspiration.",
      Environment: `Creative reconstruction is allowed. Improve or redesign non-identity environment, atmosphere, light, depth, framing and production design: ${editable}; identity and core emotional intent remain protected: ${forbidden}.`,
      Composition: "Create intentional key-art composition with negative space for typography. Reframe, extend, simplify or stylize the scene when it improves the commercial poster result.",
      Story: story,
      Emotional_Hook: emotionalHook,
      Luxury_Level: "Netflix Key Art / Amazon Originals / HBO Campaign / luxury fashion editorial / premium magazine cover",
      Editorial_Style: unwrap(creative.atmosphere) || campaignFamily || "creative cinematic commercial key art",
      Hero_Rendering_Brief: "Creative Reconstruction Mode: first answer what photograph an international entertainment Creative Director would commission for this story. Use the uploaded frame only for subject identity, authenticity, recognizable action/moment and campaign continuity. Produce the photograph that should have been captured: premium cinematic campaign photography with upgraded lighting, depth, composition, lens perspective, background treatment, atmosphere, framing, cinematic color and intentional negative space. Typography comes only after the image works without text. Do not output an enhanced screenshot, cover, thumbnail, or template."
    },
    reconstruction_report_template: "Creative key-art reconstruction should preserve recognizable subject identity and story continuity while allowing changed composition, lens perspective, lighting, background treatment, atmosphere, framing and negative space."
  };
}

export function compileHeroPhotographyInstructions({ productionBlueprint, platformRules, campaignFamily }) {
  const identity = productionBlueprint.identity_protection;
  const creative = productionBlueprint.creative_direction;
  const rendering = productionBlueprint.rendering_instructions;
  const heroPlan = buildHeroPhotographyPlan({ productionBlueprint, platformRules, campaignFamily });
  return {
    engine: "FLESHLAB Hero Photography Engine",
    execution_mode: "creative_commercial_key_art_reconstruction",
    campaign_family: campaignFamily,
    platform_rules: platformRules,
    quality_target: ["recognizable subject identity", "recognizable story continuity", "professionally reconstructed lighting", "intentional typography space", "cinematic commercial key-art quality"],
    non_goal: "Never output a simple enhanced screenshot, generic AI image, or template-like copy of the source geometry.",
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
    source_frame_understanding: heroPlan.source_frame_understanding,
    hero_photography_plan: heroPlan.hero_photography_plan,
    reconstruction_report_template: heroPlan.reconstruction_report_template,
    provider_directive: "Use the uploaded source frame as creative reference for identity, story, action and scene inspiration. Discover the campaign concept first, then reconstruct the image as commissioned premium entertainment key art with new lighting, composition, lens perspective, atmosphere, depth and intentional negative space. Never return an enhanced screenshot or template-like cover.",
    performer_rule: "Never invent a different performer. Preserve recognizable identity, skin tone and distinguishing visual characteristics, while allowing non-identity pose/framing/composition improvements for key art.",
    editable_scope_rule: "Creative reconstruction is allowed for lighting, background treatment, atmosphere, framing, lens perspective, depth, negative space, color grade and commercial polish. Exact scene geometry and object placement are not locked."
  };
}