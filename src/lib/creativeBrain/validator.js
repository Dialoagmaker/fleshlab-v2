function hasPlaceholder(value) {
  const text = JSON.stringify(value).toLowerCase();
  return ["lorem", "todo", "placeholder", "insert ", "replace me"].some(term => text.includes(term));
}
const forbiddenClaimKeys = new Set([
  "predicted_ctr",
  "expected_ctr",
  "actual_ctr",
  "biometric_verified",
  "biometric_match"
]);

const safePolicyKeys = new Set([
  "no_predicted_ctr",
  "no_biometric_claims"
]);

function isNegativePolicyText(text) {
  const normalized = text.toLowerCase().replace(/[\s_-]+/g, " ");
  return normalized.includes("no guaranteed identity claim") ||
    normalized.includes("no guaranteed identity claims") ||
    normalized.includes("biometric verification is not performed") ||
    normalized.includes("no biometric claim") ||
    normalized.includes("no biometric claims");
}

function findAffirmativeUnsupportedString(value) {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, " ");
  if (isNegativePolicyText(normalized)) return null;
  if (normalized.includes("guaranteed identity")) return "affirmative_identity_guarantee";
  if (normalized.includes("biometrically verified")) return "affirmative_biometric_verification";
  if (normalized.includes("biometric match confirmed")) return "affirmative_biometric_match";
  return null;
}

export function findUnsupportedClaim(value, path = ["productionBlueprint"]) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const issue = findUnsupportedClaim(value[index], [...path, String(index)]);
      if (issue) return issue;
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase();
      const childPath = [...path, key];
      if (forbiddenClaimKeys.has(normalizedKey) && !safePolicyKeys.has(normalizedKey)) {
        return {
          code: "UNSUPPORTED_CLAIM",
          path: childPath.join("."),
          field: key,
          value: child,
          reason: "forbidden_key"
        };
      }
      const issue = findUnsupportedClaim(child, childPath);
      if (issue) return issue;
    }
    return null;
  }

  if (typeof value === "string") {
    const reason = findAffirmativeUnsupportedString(value);
    if (reason) {
      return {
        code: "UNSUPPORTED_CLAIM",
        path: path.join("."),
        field: path[path.length - 1] || "value",
        value,
        reason
      };
    }
  }

  return null;
}
function confidenceErrors(value, path = "root", errors = []) {
  if (!value || typeof value !== "object") return errors;
  if (Object.prototype.hasOwnProperty.call(value, "confidence") && (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1)) errors.push(`${path}.confidence outside 0-1`);
  Object.entries(value).forEach(([key, child]) => confidenceErrors(child, `${path}.${key}`, errors));
  return errors;
}

export function validateProductionBlueprint(blueprint) {
  const errors = [];
  const required = ["schema_version", "source_analysis", "identity_protection", "marketing_strategy", "creative_direction", "title_policy", "typography_strategy", "composition_plan", "rendering_instructions", "quality_requirements", "uncertainties", "provenance"];
  required.forEach(key => { if (!(key in blueprint)) errors.push(`missing ${key}`); });
  if (blueprint.schema_version !== "2.0") errors.push("schema_version must be 2.0");
  ["preserve", "modify", "generate", "local_composite", "forbidden"].forEach(key => {
    if (!Array.isArray(blueprint.rendering_instructions?.[key])) errors.push(`rendering_instructions.${key} must be an array`);
  });
  if (!blueprint.rendering_instructions?.preserve?.length) errors.push("empty preserve strategy");
  if (!blueprint.rendering_instructions?.modify?.length) errors.push("empty modify strategy");
  if (!blueprint.title_policy?.selectedTitle?.value) errors.push("title_policy.selectedTitle is required");
  if (!blueprint.provenance || typeof blueprint.provenance !== "object") errors.push("provenance missing");
  if (hasPlaceholder(blueprint)) errors.push("placeholder text detected");
  const unsupportedClaim = findUnsupportedClaim(blueprint);
  const issues = unsupportedClaim ? [unsupportedClaim] : [];
  if (unsupportedClaim) errors.push(`${unsupportedClaim.code} at ${unsupportedClaim.path}: ${unsupportedClaim.reason}`);
  errors.push(...confidenceErrors(blueprint));
  if (blueprint.source_analysis?.conflicts?.length && !blueprint.quality_requirements?.require_unresolved_conflict_review) errors.push("contradictory instructions unresolved");
  return { valid: errors.length === 0, errors, issues };
}