function hasPlaceholder(value) {
  const text = JSON.stringify(value).toLowerCase();
  return ["lorem", "todo", "placeholder", "insert ", "replace me"].some(term => text.includes(term));
}
function hasUnsupportedClaims(value) {
  const text = JSON.stringify(value).toLowerCase();
  return text.includes("predicted_ctr") || text.includes("expected_ctr") || text.includes("actual_ctr") || text.includes("biometric_verified") || text.includes("biometric_match") || text.includes("guaranteed identity");
}
function confidenceErrors(value, path = "root", errors = []) {
  if (!value || typeof value !== "object") return errors;
  if (Object.prototype.hasOwnProperty.call(value, "confidence") && (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1)) errors.push(`${path}.confidence outside 0-1`);
  Object.entries(value).forEach(([key, child]) => confidenceErrors(child, `${path}.${key}`, errors));
  return errors;
}

export function validateProductionBlueprint(blueprint) {
  const errors = [];
  const required = ["schema_version", "source_analysis", "identity_protection", "marketing_strategy", "creative_direction", "composition_plan", "rendering_instructions", "quality_requirements", "uncertainties", "provenance"];
  required.forEach(key => { if (!(key in blueprint)) errors.push(`missing ${key}`); });
  if (blueprint.schema_version !== "2.0") errors.push("schema_version must be 2.0");
  ["preserve", "modify", "generate", "local_composite", "forbidden"].forEach(key => {
    if (!Array.isArray(blueprint.rendering_instructions?.[key])) errors.push(`rendering_instructions.${key} must be an array`);
  });
  if (!blueprint.rendering_instructions?.preserve?.length) errors.push("empty preserve strategy");
  if (!blueprint.rendering_instructions?.modify?.length) errors.push("empty modify strategy");
  if (!blueprint.provenance || typeof blueprint.provenance !== "object") errors.push("provenance missing");
  if (hasPlaceholder(blueprint)) errors.push("placeholder text detected");
  if (hasUnsupportedClaims(blueprint)) errors.push("unsupported claim detected");
  errors.push(...confidenceErrors(blueprint));
  if (blueprint.source_analysis?.conflicts?.length && !blueprint.quality_requirements?.require_unresolved_conflict_review) errors.push("contradictory instructions unresolved");
  return { valid: errors.length === 0, errors };
}