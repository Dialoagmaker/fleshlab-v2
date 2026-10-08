import { rule } from "./field";
import { FLESHLAB_BRAND_DNA } from "./brandRules";

export function analyzeMarketing(unifiedFacts, identityFacts, targetPlatform) {
  const attention = unifiedFacts.attention_and_space?.value || {};
  const quality = unifiedFacts.technical_quality?.value || {};
  const scene = unifiedFacts.subject_and_scene?.value || {};
  const thumb = Math.max(0, Math.min(100, Math.round((attention.local_attention?.[0]?.score || .3) * 42 + (quality.sharpness || .3) * 30 + (identityFacts.face_visible.value ? 16 : 6))));
  const fit = targetPlatform === "Video thumbnail" ? thumb : Math.round((thumb * .65) + (identityFacts.identity_risk.value === "high" ? 10 : 18));

  return {
    module: "MARKETING_ANALYZER",
    output_type: "MarketingFacts",
    schema_version: "2.0",
    target_platform: rule(targetPlatform, 1, "user_selection"),
    brand_rules_used: rule(FLESHLAB_BRAND_DNA.pillars, 1, "brand_rule"),
    strongest_selling_point: rule(attention.strongest_visual_feature || scene.subject || "strongest visual feature uncertain", .7, "semantic_vision"),
    weakest_marketing_point: rule(attention.weakest_visual_feature || unifiedFacts.uncertainties?.[0]?.value || "weakness uncertain", .68, "semantic_vision"),
    likely_audience_response: rule(scene.expression || scene.activity || "audience response cannot be performance-predicted", .58, "marketing_rule"),
    thumbnail_readability: rule(thumb > 70 ? "strong" : thumb > 45 ? "moderate" : "weak", .68, "marketing_rule"),
    emotional_hook: rule(unifiedFacts.story_signals?.value?.emotional_tone || "uncertain", unifiedFacts.story_signals?.confidence || .5, "semantic_vision"),
    campaign_category: rule(scene.scene_category || "visual_campaign", .62, "semantic_vision"),
    recommended_visual_promise: rule(unifiedFacts.story_signals?.value?.likely_narrative || "image-specific visual promise only", .62, "marketing_rule"),
    marketing_risks: rule([...(unifiedFacts.uncertainties || []).map(u => u.value || u.field), ...(identityFacts.identity_risk.value.includes("high") ? ["identity preservation risk"] : [])], .76, "marketing_rule"),
    content_platform_fit: rule(fit > 70 ? "strong heuristic fit" : fit > 45 ? "moderate heuristic fit" : "weak heuristic fit", .62, "marketing_rule"),
    recommended_crop: rule(targetPlatform === "Banner" ? "wide banner-safe crop" : targetPlatform === "Instagram" ? "square or 4:5 crop" : "16:9 key-art crop", .74, "marketing_rule"),
    recommended_title_hierarchy: rule(identityFacts.face_visible.value ? "subject first, title second" : "title/graphic first, subject second", .72, "marketing_rule"),
    heuristic_attention_strength: rule(thumb, .64, "marketing_rule"),
    heuristic_thumbnail_strength: rule(thumb, .64, "marketing_rule"),
    heuristic_campaign_fit: rule(fit, .58, "marketing_rule")
  };
}