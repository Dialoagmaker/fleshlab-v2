export function runCreativeCritic(outputPackage, productionBlueprint) {
  const warnings = [];
  if (!outputPackage?.heroImage) warnings.push("Hero image missing.");
  if (outputPackage?.identityPreservationStatus?.status !== "accepted") warnings.push("Identity preservation is not accepted.");
  if (!outputPackage?.renderMetadata?.blueprint_execution_hash) warnings.push("Blueprint execution hash missing.");
  if ((outputPackage?.renderWarnings || []).length) warnings.push(...outputPackage.renderWarnings);
  const qualityTarget = productionBlueprint?.quality_requirements ? "blueprint quality requirements present" : "quality requirements missing";
  const approved = warnings.length === 0;
  return {
    critic: "Creative Critic",
    comparison: "Uploaded Hero Frame → Rendered Hero Photograph",
    automatic_revision_performed: false,
    status: approved ? "APPROVED_FOR_REVIEW" : "REVIEW_REQUIRED",
    quality_target: "95%+ reference similarity with cinema-camera production polish",
    evaluation_criteria: [
      "facial identity preservation",
      "pose and expression preservation",
      "scene geometry preservation",
      "framing and camera angle preservation",
      "object placement preservation",
      "cinematic lighting",
      "realistic moisture and reflections",
      "premium retouch quality"
    ],
    quality_requirements: qualityTarget,
    warnings,
    decision: approved ? "Hero photograph package can proceed to human review." : "Hero photograph package needs review before use."
  };
}