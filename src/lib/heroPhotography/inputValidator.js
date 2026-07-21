import { validateProductionBlueprint } from "@/lib/creativeBrain/validator";

function valueOf(field) {
  return field && typeof field === "object" && "value" in field ? field.value : field;
}

export function validateHeroPhotographyInputs({ sourceFrameFile, productionBlueprint, platformRules, campaignFamily }) {
  const errors = [];
  if (!sourceFrameFile) errors.push("Selected Source Frame is required.");
  if (!sourceFrameFile?.type?.startsWith?.("image/")) errors.push("Selected Source Frame must be an image.");
  if (!productionBlueprint) errors.push("Production Blueprint is required.");
  if (!productionBlueprint?.identity_protection) errors.push("Identity Protection Rules are required.");
  if (!productionBlueprint?.creative_direction) errors.push("Creative Decisions are required.");
  if (!productionBlueprint?.rendering_instructions) errors.push("Rendering Instructions are required.");
  if (!productionBlueprint?.quality_requirements) errors.push("Quality Requirements are required.");
  if (!platformRules) errors.push("Platform Rules are required.");
  if (!campaignFamily) errors.push("Campaign Family is required.");

  if (productionBlueprint) {
    const validation = validateProductionBlueprint(productionBlueprint);
    if (!validation.valid) errors.push(`Blueprint is invalid: ${validation.errors.join("; ")}`);
    const identity = productionBlueprint.identity_protection;
    const faceRequired = Boolean(valueOf(identity?.face_preservation_required));
    const faceClarity = valueOf(identity?.face_clarity);
    const preserve = productionBlueprint.rendering_instructions?.preserve || [];
    const modify = productionBlueprint.rendering_instructions?.modify || [];
    if (!preserve.length) errors.push("Blueprint has no preserve instructions.");
    if (!modify.length) errors.push("Blueprint has no editable/modify instructions.");
    if (faceRequired && faceClarity === "unclear") errors.push("Identity protection cannot be honored because face clarity is unclear.");
  }

  return { valid: errors.length === 0, errors };
}