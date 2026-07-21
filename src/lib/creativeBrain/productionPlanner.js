export function planProduction(unifiedFacts, identityFacts, marketingFacts, creativeDecisions) {
  return {
    schema_version: "2.0",
    source_analysis: unifiedFacts,
    identity_protection: identityFacts,
    marketing_strategy: marketingFacts,
    creative_direction: creativeDecisions,
    composition_plan: {
      subject_anchor: unifiedFacts.preservation_candidates.value.local_subject_box,
      title_zone: creativeDecisions.title_zone,
      subtitle_zone: creativeDecisions.subtitle_zone,
      logo_zone: creativeDecisions.logo_zone,
      recommended_crop: creativeDecisions.crop,
      target_output_dimensions: marketingFacts.target_platform.value === "Banner" ? { width: 1920, height: 640 } : { width: 1920, height: 1080 },
      provenance: { subject_anchor: "deterministic_fusion", title_zone: "deterministic_fusion", crop: "marketing_rule", target_output_dimensions: "marketing_rule" }
    },
    rendering_instructions: {
      preserve: creativeDecisions.preserve_modify_generate_local_composite_forbidden.PRESERVE,
      modify: creativeDecisions.preserve_modify_generate_local_composite_forbidden.MODIFY,
      generate: creativeDecisions.preserve_modify_generate_local_composite_forbidden.GENERATE,
      local_composite: creativeDecisions.preserve_modify_generate_local_composite_forbidden.LOCAL_COMPOSITE,
      forbidden: creativeDecisions.preserve_modify_generate_local_composite_forbidden.FORBIDDEN
    },
    quality_requirements: {
      no_biometric_claims: true,
      no_predicted_ctr: true,
      require_preserve_strategy: true,
      require_modify_strategy: true,
      require_unresolved_conflict_review: unifiedFacts.conflicts.length > 0,
      performance_metrics_allowed: ["heuristic_attention_strength", "heuristic_thumbnail_strength", "heuristic_campaign_fit"]
    },
    uncertainties: [...new Set([...(unifiedFacts.uncertainties || []).map(u => typeof u === "string" ? u : JSON.stringify(u)), ...(identityFacts.identity_uncertainties?.value || []), ...(marketingFacts.marketing_risks?.value || [])])],
    provenance: {
      source_analysis: "deterministic_fusion from local measurement and semantic vision",
      identity_protection: "identity_rule plus deterministic_fusion",
      marketing_strategy: "marketing_rule plus brand_rule plus user_selection",
      creative_direction: "creative_rule plus brand_rule plus user_selection",
      composition_plan: "deterministic_fusion plus marketing_rule",
      rendering_instructions: "creative_rule",
      target_platform: "user_selection",
      campaign_family: "user_selection"
    }
  };
}