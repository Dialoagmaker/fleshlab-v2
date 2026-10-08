import { rule } from "./field";
import { FLESHLAB_BRAND_DNA } from "./brandRules";

const familyDefaults = {
  KRAKEN: { atmosphere: "dark red high-impact", texture: "distressed premium", color: "black red white" },
  "DARK PREMIUM": { atmosphere: "controlled shadow luxury", texture: "fine grain", color: "black warm skin deep red" },
  "LUXURY HOTEL": { atmosphere: "warm suite luxury", texture: "soft glow", color: "warm gold black red" },
  "NETFLIX KEY ART": { atmosphere: "cinematic streaming poster", texture: "clean cinematic", color: "high-contrast controlled palette" },
  EDITORIAL: { atmosphere: "magazine editorial", texture: "clean type-led", color: "source-led accents" },
  "RAW AMATEUR": { atmosphere: "authentic raw premium", texture: "light documentary grain", color: "natural skin and dark brand frame" },
  "OUTDOOR CINEMATIC": { atmosphere: "open cinematic scale", texture: "natural contrast", color: "source environment palette" },
  CUSTOM: { atmosphere: "custom source-led", texture: "controlled", color: "source palette" }
};

export function directCreative(unifiedFacts, identityFacts, marketingFacts, campaignFamily, titlePolicyInput = {}) {
  const family = familyDefaults[campaignFamily] || familyDefaults.CUSTOM;
  const userTitle = String(titlePolicyInput.userTitle || "").trim();
  const generatedTitle = marketingFacts.recommended_visual_promise.value || marketingFacts.campaign_category.value || campaignFamily;
  const selectedTitleSource = userTitle ? "user" : "generated";
  const space = unifiedFacts.attention_and_space?.value || {};
  const scene = unifiedFacts.subject_and_scene?.value || {};
  const titleZone = space.local_negative_space?.[0] || space.local_attention?.[3] || null;
  const logoZone = space.local_negative_space?.[1] || titleZone;

  return {
    module: "CREATIVE_DIRECTOR",
    output_type: "CreativeDecisions",
    schema_version: "2.0",
    campaign_family: rule(campaignFamily, 1, "user_selection"),
    brand_dna: rule(FLESHLAB_BRAND_DNA, 1, "brand_rule"),
    title_policy: {
      userTitle: rule(userTitle, 1, "user_selection"),
      generatedTitle: rule(generatedTitle, marketingFacts.recommended_visual_promise.confidence || .62, "creative_rule"),
      selectedTitleSource: rule(selectedTitleSource, 1, userTitle ? "user_selection" : "creative_rule"),
      selectedTitle: rule(selectedTitleSource === "user" ? userTitle : generatedTitle, 1, selectedTitleSource === "user" ? "user_selection" : "creative_rule"),
      selectedSubtitle: rule(marketingFacts.emotional_hook.value || "", marketingFacts.emotional_hook.confidence || .5, "semantic_vision"),
      selectedCampaign: rule(campaignFamily, 1, "user_selection")
    },
    story: rule(marketingFacts.recommended_visual_promise.value, .7, "creative_rule"),
    emotional_promise: rule(marketingFacts.emotional_hook.value, marketingFacts.emotional_hook.confidence, "semantic_vision"),
    subject_hierarchy: rule(identityFacts.face_visible.value ? "identity-led subject hierarchy" : "silhouette-or-scene-led hierarchy", .72, "creative_rule"),
    background_strategy: rule(identityFacts.editable_regions.value, .68, "creative_rule"),
    lighting_strategy: rule(unifiedFacts.technical_quality.value.exposure === "underexposed" ? "lift readability without changing source direction" : "preserve source light and add controlled emphasis", .76, "creative_rule"),
    lighting_direction: rule("derive from source luminance distribution", .62, "local_measurement"),
    color_language: rule(family.color, .86, "brand_rule"),
    atmosphere: rule(family.atmosphere, .86, "brand_rule"),
    depth: rule(unifiedFacts.technical_quality.value.blur > .65 ? "increase separation carefully" : "preserve perceived depth", .7, "creative_rule"),
    texture: rule(family.texture, .82, "brand_rule"),
    effects: rule({ fog: "low", particles: "none or very subtle", grain: family.texture }, .78, "creative_rule"),
    crop: rule(marketingFacts.recommended_crop.value, marketingFacts.recommended_crop.confidence, "marketing_rule"),
    focal_emphasis: rule(space.strongest_visual_feature || scene.subject || "source attention anchor", .68, "creative_rule"),
    typography_strategy: rule({ style: "blueprint-controlled display typography", hierarchy: marketingFacts.recommended_title_hierarchy.value, source: "Creative Brain" }, .82, "creative_rule"),
    logo_placement_strategy: rule({ zone: logoZone, role: "quiet brand signature" }, logoZone ? .64 : .24, "deterministic_fusion"),
    title_zone: rule(titleZone, titleZone ? .7 : .25, "deterministic_fusion"),
    subtitle_zone: rule(titleZone, titleZone ? .62 : .25, "deterministic_fusion"),
    logo_zone: rule(logoZone, logoZone ? .64 : .24, "deterministic_fusion"),
    preserve_modify_generate_local_composite_forbidden: {
      PRESERVE: identityFacts.preserve_regions.value,
      MODIFY: identityFacts.editable_regions.value,
      GENERATE: ["background extension only where editable", "atmosphere consistent with campaign family"],
      LOCAL_COMPOSITE: ["typography", "logo", "deterministic overlays"],
      FORBIDDEN: ["identity drift", "identity-authentication claim", "factual CTR prediction", "unverified relationship/location claims"]
    },
    forbidden_changes: rule(["alter preserved identity areas", "invent unsupported story facts", "change source body identity", "claim identity authentication", "claim factual CTR prediction"], 1, "creative_rule")
  };
}