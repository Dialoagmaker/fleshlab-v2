import { trackEvent } from "@/lib/analytics";

export const RECRUITMENT_ASSUMPTIONS = [
  { id: "hero_clarity", section: "Hero", assumption: "The main promise makes qualified visitors continue.", expected_behavior: "CTA click or scroll beyond hero", success_metric: "Hero → intake rate above 18%", failure_metric: "High hero exits or low CTA rate", measurement_event: "recruitment_hero_interaction" },
  { id: "studio_support", section: "Why FLESHLAB", assumption: "Specific support items increase trust.", expected_behavior: "Section viewed before intake start", success_metric: "Viewed users start intake more often", failure_metric: "No lift versus unviewed users", measurement_event: "recruitment_section_viewed" },
  { id: "earnings_honesty", section: "How You Earn", assumption: "Honest income caveats improve quality, not just volume.", expected_behavior: "Qualified applications after viewing earnings section", success_metric: "Approval rate improves", failure_metric: "Applications increase but approval rate falls", measurement_event: "recruitment_section_viewed" },
  { id: "model_choice", section: "Creator Models", assumption: "Clear 40% / 70% model choice reduces confusion.", expected_behavior: "Preferred model selected in verification", success_metric: "More complete applications with selected model", failure_metric: "More not-sure submissions", measurement_event: "recruitment_verification_started" },
  { id: "credibility_layer", section: "Proof", assumption: "Process and product previews reduce uncertainty.", expected_behavior: "Proof viewed before intake completion", success_metric: "Higher intake completion rate", failure_metric: "No change or lower scroll depth", measurement_event: "recruitment_section_viewed" },
  { id: "trust_cards", section: "Trust Cards", assumption: "Privacy, consent and contract cards reduce abandonment.", expected_behavior: "Users continue after seeing trust cards", success_metric: "Lower form-step abandonment", failure_metric: "Trust-card viewers still abandon", measurement_event: "recruitment_trust_card_viewed" },
  { id: "private_intake", section: "Private Intake", assumption: "Low-friction intake increases first conversion.", expected_behavior: "Start and complete intake", success_metric: "Intake completion rate above 35% of starts", failure_metric: "Starts without completions", measurement_event: "recruitment_private_intake_completed" },
  { id: "verification_message", section: "Verification", assumption: "Milestone language makes verification feel safer.", expected_behavior: "Verification started and submitted", success_metric: "Step 1 → submit rate improves", failure_metric: "Users abandon at media or ID step", measurement_event: "recruitment_verification_completed" },
];

export const EXPERIMENT_MATRIX = [
  { key: "hero_message", priority: "High", variants: ["professional_studio", "creator_growth", "private_first"], metric: "Hero interaction → intake started", status: "Ready" },
  { key: "primary_cta", priority: "High", variants: ["Apply today", "Start privately", "Find my creator path"], metric: "CTA click rate", status: "Ready" },
  { key: "trust_card_density", priority: "High", variants: ["compact", "standard", "proof_first"], metric: "Form continuation rate", status: "Ready" },
  { key: "product_preview_visibility", priority: "Medium", variants: ["visible", "collapsed", "after_intake"], metric: "Intake completion and verification start", status: "Ready" },
  { key: "faq_placement", priority: "Medium", variants: ["before_intake", "after_intake", "near_verification"], metric: "FAQ open → completion rate", status: "Ready" },
  { key: "roadmap_placement", priority: "Medium", variants: ["before_apply", "after_intake", "after_verification"], metric: "Verification start rate", status: "Planned" },
  { key: "sticky_cta", priority: "Low", variants: ["off", "after_hero", "after_proof"], metric: "CTA click rate and quality", status: "Planned" },
];

export const AB_TESTING_ROADMAP = [
  "Hero message and primary CTA",
  "Private intake path selector copy",
  "Trust card density near forms",
  "Credibility proof visibility",
  "FAQ placement around objections",
  "Verification messaging and upload reassurance",
  "Sticky CTA behaviour after proof section",
];

export const RECRUITMENT_FUNNEL_STAGES = [
  ["landing", "Landing"],
  ["hero_interaction", "Hero interaction"],
  ["why_viewed", "Why FLESHLAB viewed"],
  ["proof_viewed", "Proof viewed"],
  ["creator_path_selected", "Creator path selected"],
  ["private_intake_started", "Private intake started"],
  ["private_intake_completed", "Private intake completed"],
  ["verification_started", "Verification started"],
  ["verification_completed", "Verification completed"],
  ["application_submitted", "Application submitted"],
  ["approved", "Approved"],
  ["first_production", "First production"],
  ["first_publication", "First publication"],
  ["first_revenue", "First revenue"],
  ["active_90d", "Active creator after 90 days"],
];

export const QUALITY_METRICS = ["Qualified applicants", "Approval rate", "First production completion", "First publication", "30-day retention", "90-day retention", "Revenue-generating creators", "Average time to first publication", "Average review time"];

export const MONTHLY_OPTIMIZATION_FRAMEWORK = ["Find the biggest funnel drop-off", "Compare conversion by country, device, path and source", "Compare section views against completion quality", "Select one high-impact experiment", "Run for a fixed period", "Keep, revert or iterate based on behaviour"];

const EVENT_BY_STAGE = {
  landing: "recruitment_landing_view",
  hero_interaction: "performer_apply_click",
  private_intake_started: "application_start",
  verification_started: "application_start",
  verification_completed: "application_submit",
  application_submitted: "application_submit",
};

export function getRecruitmentVariant(experimentKey) {
  const experiment = EXPERIMENT_MATRIX.find((item) => item.key === experimentKey);
  if (!experiment) return "control";
  const storageKey = `fl_recruitment_exp_${experimentKey}`;
  const existing = window.localStorage?.getItem(storageKey);
  if (existing) return existing;
  const variant = experiment.variants[Math.floor(Math.random() * experiment.variants.length)] || "control";
  window.localStorage?.setItem(storageKey, variant);
  trackEvent("recruitment_experiment_exposed", { experiment_key: experimentKey, variant });
  return variant;
}

export function trackRecruitmentFunnelStage(stageKey, params = {}) {
  trackEvent(EVENT_BY_STAGE[stageKey] || "recruitment_funnel_stage", { stage_key: stageKey, ...params });
}

export function trackRecruitmentSectionViewed(sectionKey, params = {}) {
  trackEvent("recruitment_section_viewed", { section_key: sectionKey, ...params });
  if (sectionKey === "why_fleshlab") trackRecruitmentFunnelStage("why_viewed", params);
  if (sectionKey === "credibility_proof") trackRecruitmentFunnelStage("proof_viewed", params);
}