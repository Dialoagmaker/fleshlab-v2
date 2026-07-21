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
      input: "Video frame as scouting/reference image",
      output: "Professional Hero Photograph",
      never_output: "Enhanced Screenshot",
      goal: "Rebuild the scene as if it had been planned as a premium commercial photoshoot."
    },
    source_frame_understanding: {
      emotional_moment: emotionalHook,
      visual_story: story,
      strongest_subject: subject,
      weakest_visual_elements: editable,
      distractions: "compression artifacts, accidental frame clutter, amateur framing, flat lighting and unused canvas must not survive as screenshot artifacts",
      opportunities: generated,
      emotional_hook: emotionalHook
    },
    hero_photography_plan: {
      Camera: "World-class commercial campaign camera position; use the source frame only to understand the moment, then choose a deliberate premium hero angle.",
      Lens: "Cinematic editorial lens language, 50-85mm equivalent when subject-led; controlled perspective, shallow-to-medium depth, no wide screenshot distortion.",
      Lighting: {
        key_light: unwrap(creative.lighting_strategy) || "large soft directional commercial key light shaped for face and body readability",
        fill_light: "controlled low fill that preserves premium shadow contrast",
        rim_light: "subtle rim or edge light for subject separation from the redesigned environment",
        practical_lights: "motivated practicals integrated into the scene for cinematic realism",
        shadows_reflections_texture: "designed shadows, believable reflections, premium surface texture and color contrast"
      },
      Background: unwrap(creative.background_strategy) || "redesigned commercial background that preserves story logic while removing accidental screenshot clutter",
      Environment: `May redesign ${editable}; may generate ${generated}; must not perform ${forbidden}.`,
      Composition: `Premium key-art composition with intentional typography space in ${JSON.stringify(typographyZone)}; typography must never cover face, emotional focal point, or storytelling element.`,
      Story: story,
      Emotional_Hook: emotionalHook,
      Luxury_Level: "Netflix Key Art / Amazon Originals / HBO Campaign / luxury fashion editorial / premium magazine cover",
      Editorial_Style: unwrap(creative.atmosphere) || campaignFamily || "premium commercial editorial",
      Hero_Rendering_Brief: "Create the hero photograph that would have been captured by a top commercial photographer and advertising art director on a planned shoot. Reconstruct production value, lighting, environment, depth and composition; do not enhance the source screenshot."
    },
    reconstruction_report_template: "Generated hero photograph should differ from the original frame through commercial reconstruction: planned camera, lens, lighting, production design, background, atmosphere, depth, texture, color contrast, and intentional typography space — not through simple enhancement."
  };
}

export function compileHeroPhotographyInstructions({ productionBlueprint, platformRules, campaignFamily }) {
  const identity = productionBlueprint.identity_protection;
  const creative = productionBlueprint.creative_direction;
  const rendering = productionBlueprint.rendering_instructions;
  const heroPlan = buildHeroPhotographyPlan({ productionBlueprint, platformRules, campaignFamily });
  return {
    engine: "FLESHLAB Hero Photography Engine",
    execution_mode: "commercial_hero_photography_reconstruction",
    campaign_family: campaignFamily,
    platform_rules: platformRules,
    quality_target: ["Netflix Key Art", "Amazon Originals", "HBO Campaign", "Luxury Fashion Editorial", "Premium Magazine Cover"],
    non_goal: "Never output an enhanced screenshot or generic AI image.",
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
    provider_directive: "Use the source frame as a scouting/reference image. Execute the Hero Photography Plan as a premium commercial photoshoot reconstruction, not as frame enhancement.",
    performer_rule: "Never invent a different performer. Preserve requested identity, pose, expression, gaze, skin tone and body proportions unless the Blueprint explicitly allows a change.",
    editable_scope_rule: "Redesign only background, lighting, color palette, atmosphere, environment, reflections, architecture, furniture, depth, time of day and other elements allowed by modify_only or generate_only. Everything else is protected."
  };
}