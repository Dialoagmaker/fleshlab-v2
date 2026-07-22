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
      input: "Uploaded frame as immutable ground-truth reference",
      output: "Reference-fidelity professional retouch",
      never_output: "Different generated scene, changed pose, changed identity, changed environment, changed framing, or invented composition",
      goal: "Preserve the exact video moment while improving only photographic production quality."
    },
    source_frame_understanding: {
      emotional_moment: emotionalHook,
      visual_story: story,
      strongest_subject: subject,
      weakest_visual_elements: editable,
      distractions: "compression artifacts, noise, flat lighting, low dynamic range, weak sharpness and low production polish may be corrected without moving or changing scene content",
      opportunities: generated,
      emotional_hook: emotionalHook
    },
    hero_photography_plan: {
      Camera: "Preserve the exact source camera angle, framing, perspective, subject distance and apparent focal length; do not choose a new hero angle.",
      Lens: "Preserve the source lens perspective and spatial relationships; improve perceived optical quality, sharpness and depth without changing focal length or crop.",
      Lighting: {
        key_light: unwrap(creative.lighting_strategy) || "source-consistent cinematic key light that improves readability without changing the moment",
        fill_light: "controlled low fill that preserves the original lighting direction and shadow logic",
        rim_light: "subtle source-consistent edge separation that does not change pose, environment or object placement",
        practical_lights: "only lights already implied by the source frame; no new visible fixtures or invented props",
        shadows_reflections_texture: "source-faithful shadows, realistic moisture, water reflections, texture recovery and premium color contrast"
      },
      Background: "Preserve the exact bathroom layout, wall geometry, shower area, towel position, soap placement, water placement and object positions from the uploaded frame.",
      Environment: `Do not redesign or generate new environment. Only retouch allowed photographic qualities: ${editable}; forbidden changes remain ${forbidden}.`,
      Composition: "Preserve the exact original composition, framing, perspective, camera angle, subject distance and object positions. Do not create new typography space by moving, cropping, extending or reframing the scene.",
      Story: story,
      Emotional_Hook: emotionalHook,
      Luxury_Level: "High-end cinema-camera capture / professional retouch / premium color grade",
      Editorial_Style: unwrap(creative.atmosphere) || campaignFamily || "reference-fidelity cinematic retouch",
      Hero_Rendering_Brief: "Reference Fidelity Mode: preserve the uploaded frame as immutable source material. Perform expert photographer/retoucher enhancement only: cinematic lighting, HDR, clean skin rendering, realistic moisture, water reflections, sharpness, depth, color grading, subtle steam, noise removal and texture recovery. Maintain at least 95% structural similarity."
    },
    reconstruction_report_template: "Reference fidelity enhancement must remain recognizably the same exact moment from the uploaded frame. Reject changes to identity, face, pose, body shape, shower/bathroom layout, framing, camera angle, object positions, soap, water, towel, necklace, gaze or expression."
  };
}

export function compileHeroPhotographyInstructions({ productionBlueprint, platformRules, campaignFamily }) {
  const identity = productionBlueprint.identity_protection;
  const creative = productionBlueprint.creative_direction;
  const rendering = productionBlueprint.rendering_instructions;
  const heroPlan = buildHeroPhotographyPlan({ productionBlueprint, platformRules, campaignFamily });
  return {
    engine: "FLESHLAB Hero Photography Engine",
    execution_mode: "reference_fidelity_professional_retouch",
    campaign_family: campaignFamily,
    platform_rules: platformRules,
    quality_target: ["95%+ structural similarity", "same identity", "same pose", "same environment", "cinema-camera production quality"],
    non_goal: "Never output a different generated scene, changed performer, changed pose, changed environment, changed camera angle, changed framing, or invented composition.",
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
    provider_directive: "Use the uploaded source frame as immutable ground truth. Enhance only production quality like an expert photographer and retoucher; do not reconstruct, redesign, reframe, extend, replace, or reinterpret the scene.",
    performer_rule: "Never invent a different performer. Preserve facial identity, facial proportions, expression, gaze, head angle, body proportions, body posture, arms, hands, necklace and skin tone from the exact reference frame.",
    editable_scope_rule: "Allowed edits are limited to photographic retouching: cinematic lighting, dynamic range, clean skin rendering, realistic moisture, water reflections, sharpness, depth, premium color grade, subtle steam, noise removal and texture recovery. All scene geometry and object placement are protected."
  };
}