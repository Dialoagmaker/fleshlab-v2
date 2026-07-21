import { rule, confidence } from "./field";

const localFaceBoxes = (unified) => unified.preservation_candidates?.value?.local_faces?.boxes || [];

export function analyzeIdentity(unifiedFacts) {
  const faces = localFaceBoxes(unifiedFacts);
  const subjectBox = unifiedFacts.preservation_candidates?.value?.local_subject_box || null;
  const semanticPreserve = unifiedFacts.preservation_candidates?.value?.semantic_preserve || [];
  const semanticEditable = unifiedFacts.preservation_candidates?.value?.semantic_editable || [];
  const faceVisible = faces.length > 0 || /face|eyes|head/i.test(JSON.stringify(semanticPreserve));
  const faceClarity = faces.length ? Math.min(1, (faces[0].width * faces[0].height) * 18 + (unifiedFacts.technical_quality?.value?.sharpness || 0) * .35) : .25;
  const risk = faceVisible && faceClarity > .55 ? "medium" : faceVisible ? "high" : "very_high_uncertain";

  return {
    module: "IDENTITY_ANALYZER",
    output_type: "IdentityFacts",
    schema_version: "2.0",
    face_visible: rule(faceVisible, faceVisible ? .7 : .45, "deterministic_fusion"),
    face_clarity: rule(faceClarity > .65 ? "clear" : faceClarity > .35 ? "partial" : "unclear", confidence(faceClarity), "deterministic_fusion"),
    face_preservation_required: rule(faceVisible, .82, "creative_rule"),
    body_preservation_required: rule(Boolean(subjectBox || /body|subject|person/i.test(JSON.stringify(semanticPreserve))), .78, "creative_rule"),
    pose_preservation_required: rule(true, .72, "creative_rule"),
    expression_preservation_required: rule(faceVisible, faceVisible ? .68 : .32, "creative_rule"),
    hairstyle_preservation_required: rule(faceVisible, faceVisible ? .58 : .24, "creative_rule"),
    skin_tone_preservation_required: rule(true, .7, "creative_rule"),
    preserve_regions: rule([{ element: "source identity-critical areas", local_box: subjectBox, semantic_elements: semanticPreserve, instruction: "preserve" }], .78, "deterministic_fusion"),
    editable_regions: rule(semanticEditable.length ? semanticEditable : ["low-attention background or negative-space zones only"], .62, "deterministic_fusion"),
    identity_risk: rule(risk, .74, "identity_rule"),
    identity_capability: rule("visual preservation guidance only; no identity-authentication capability", 1, "identity_rule"),
    identity_uncertainties: rule(["no biometric identity embedding", "no segmentation mask", ...(faces.length ? [] : ["local face detector did not provide a clear face box"])], .9, "identity_rule")
  };
}