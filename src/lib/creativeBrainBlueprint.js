export const CREATIVE_BRAIN_BLUEPRINT_SCHEMA = {
  type: "object",
  properties: {
    blueprint_version: { type: "string" },
    source_image: {
      type: "object",
      properties: {
        file_name: { type: "string" },
        analyzed_at: { type: "string" },
        image_type: { type: "string" },
        orientation: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["file_name", "analyzed_at", "image_type", "orientation", "confidence"]
    },
    image_understanding: {
      type: "object",
      properties: {
        strongest_selling_point: { type: "string" },
        weakest_point: { type: "string" },
        emotional_impact: { type: "string" },
        visual_story: { type: "string" },
        marketing_potential: { type: "object", properties: { score: { type: "number" }, reason: { type: "string" } }, required: ["score", "reason"] },
        thumbnail_potential: { type: "object", properties: { score: { type: "number" }, reason: { type: "string" } }, required: ["score", "reason"] },
        eye_tracking: { type: "array", items: { type: "object", properties: { order: { type: "number" }, zone: { type: "string" }, reason: { type: "string" } }, required: ["order", "zone", "reason"] } },
        attention_map: { type: "array", items: { type: "object", properties: { zone: { type: "string" }, x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" }, attention_strength: { type: "number" }, purpose: { type: "string" } }, required: ["zone", "x", "y", "width", "height", "attention_strength", "purpose"] } },
        negative_space: { type: "array", items: { type: "object", properties: { zone: { type: "string" }, x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" }, usability: { type: "string" } }, required: ["zone", "x", "y", "width", "height", "usability"] } },
        safe_typography_zones: { type: "array", items: { type: "object", properties: { zone: { type: "string" }, x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" }, recommended_text_role: { type: "string" }, safety_score: { type: "number" } }, required: ["zone", "x", "y", "width", "height", "recommended_text_role", "safety_score"] } }
      },
      required: ["strongest_selling_point", "weakest_point", "emotional_impact", "visual_story", "marketing_potential", "thumbnail_potential", "eye_tracking", "attention_map", "negative_space", "safe_typography_zones"]
    },
    identity_protection: {
      type: "object",
      properties: {
        face: { type: "object", properties: { instruction: { type: "string" }, lock_reason: { type: "string" } }, required: ["instruction", "lock_reason"] },
        body: { type: "object", properties: { instruction: { type: "string" }, lock_reason: { type: "string" } }, required: ["instruction", "lock_reason"] },
        pose: { type: "object", properties: { instruction: { type: "string" }, lock_reason: { type: "string" } }, required: ["instruction", "lock_reason"] },
        expression: { type: "object", properties: { instruction: { type: "string" }, lock_reason: { type: "string" } }, required: ["instruction", "lock_reason"] },
        skin_preservation: { type: "object", properties: { instruction: { type: "string" }, preservation_notes: { type: "string" } }, required: ["instruction", "preservation_notes"] },
        identity_confidence: { type: "number" }
      },
      required: ["face", "body", "pose", "expression", "skin_preservation", "identity_confidence"]
    },
    creative_direction: {
      type: "object",
      properties: {
        campaign_style: { type: "string" },
        lighting: { type: "string" },
        atmosphere: { type: "string" },
        mood: { type: "string" },
        color_grading: { type: "string" },
        lens: { type: "string" },
        focal_length: { type: "string" },
        depth: { type: "string" },
        environment: { type: "string" },
        storytelling: { type: "string" },
        cinematic_references: { type: "array", items: { type: "string" } }
      },
      required: ["campaign_style", "lighting", "atmosphere", "mood", "color_grading", "lens", "focal_length", "depth", "environment", "storytelling", "cinematic_references"]
    },
    marketing_strategy: {
      type: "object",
      properties: {
        target_audience: { type: "string" },
        platform: { type: "string" },
        expected_ctr: { type: "object", properties: { index: { type: "number" }, range: { type: "string" }, reason: { type: "string" } }, required: ["index", "range", "reason"] },
        strongest_headline_position: { type: "string" },
        strongest_logo_position: { type: "string" },
        strongest_composition: { type: "string" }
      },
      required: ["target_audience", "platform", "expected_ctr", "strongest_headline_position", "strongest_logo_position", "strongest_composition"]
    },
    rendering_instructions: {
      type: "object",
      properties: {
        face: { type: "string" },
        body: { type: "string" },
        background: { type: "string" },
        light: { type: "string" },
        atmosphere: { type: "string" },
        depth: { type: "string" },
        fog: { type: "string" },
        particles: { type: "string" },
        lens: { type: "string" },
        color: { type: "string" },
        typography: { type: "string" },
        safe_zone: { type: "string" },
        logo: { type: "string" },
        composition: { type: "string" },
        forbidden_changes: { type: "array", items: { type: "string" } }
      },
      required: ["face", "body", "background", "light", "atmosphere", "depth", "fog", "particles", "lens", "color", "typography", "safe_zone", "logo", "composition", "forbidden_changes"]
    },
    final_decision: {
      type: "object",
      properties: {
        production_readiness: { type: "string" },
        creative_risk: { type: "string" },
        director_note: { type: "string" }
      },
      required: ["production_readiness", "creative_risk", "director_note"]
    }
  },
  required: ["blueprint_version", "source_image", "image_understanding", "identity_protection", "creative_direction", "marketing_strategy", "rendering_instructions", "final_decision"]
};

export function buildCreativeBrainInstruction(fileName) {
  return `You are the FLESHLAB Creative Brain. You never generate images. You never write prompts. You never describe yourself. You act only as a senior advertising Creative Director analyzing one uploaded source image and producing one structured Creative Production Blueprint JSON.

Analyze the uploaded image as an advertising agency would: commercial hook, attention flow, identity preservation, campaign direction, platform marketing strategy, and structured rendering instructions for a separate renderer.

Rules:
- Output JSON only through the provided schema.
- Do not include a prompt field.
- Do not instruct image generation in prose.
- Use normalized coordinates from 0 to 1 for attention_map, negative_space, and safe_typography_zones.
- Rendering instructions must be short structured values, not a paragraph.
- Use LOCK where identity must be preserved.
- If something is uncertain, say so inside the relevant reason field and lower the confidence score.
- Treat the file name as metadata only: ${fileName || "uploaded-image"}.`;
}