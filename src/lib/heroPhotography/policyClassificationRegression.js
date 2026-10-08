import { runPolicyEvidenceAudit } from "./policyEvidenceAudit";

const replayRequest = {
  productionBlueprint: {
    creative_direction: {
      story: { value: "premium creator portrait campaign" },
      emotional_promise: { value: "confident editorial presence" },
      subject_hierarchy: { value: "creator as strongest visible subject" },
      atmosphere: { value: "premium commercial editorial" }
    },
    rendering_instructions: {
      preserve: ["identity", "pose", "expression"],
      modify: ["lighting", "background", "commercial depth"],
      generate: ["campaign atmosphere"],
      forbidden: ["identity drift"]
    },
    identity_protection: { face_preservation_required: { value: true } },
    quality_requirements: { target: "premium hero photography" }
  },
  instructions: {
    engine: "FLESHLAB Hero Photography Engine",
    campaign_family: "KRAKEN",
    provider_directive: "premium commercial photoshoot reconstruction",
    hero_photography_plan: { Editorial_Style: "premium commercial editorial" }
  },
  campaignFamily: "KRAKEN",
  targetPlatform: "youtube_thumbnail"
};

const diagnosticSkinEvidence = [{
  id: "IMAGE-skin-tone-exposure-estimate-regression",
  type: "IMAGE",
  signal: "skin-tone exposure estimate 42.0%",
  category: "SAFE_EDITORIAL",
  weight: 0,
  diagnosticOnly: true,
  reason: "Regression replay: image skin-tone diagnostic must not alter canonical classification.",
  confidence: 0.82
}];

export async function runDeterministicPolicyClassificationRegression() {
  const previous = await runPolicyEvidenceAudit({ ...replayRequest, sourceFrameFile: null, forcedImageEvidence: [] });
  const current = await runPolicyEvidenceAudit({ ...replayRequest, sourceFrameFile: null, forcedImageEvidence: diagnosticSkinEvidence });
  const safetyConstraintReplay = await runPolicyEvidenceAudit({
    ...replayRequest,
    productionBlueprint: { ...replayRequest.productionBlueprint, rendering_instructions: { ...replayRequest.productionBlueprint.rendering_instructions, forbidden: ["explicit adult content", "identity drift"] } },
    sourceFrameFile: null,
    forcedImageEvidence: []
  });
  const previousCategory = previous.policyClassification.canonicalCategory;
  const currentCategory = current.policyClassification.canonicalCategory;
  if (previousCategory !== currentCategory) {
    throw new Error(`Deterministic policy regression failed: ${previousCategory} changed to ${currentCategory}`);
  }
  if (currentCategory !== "SAFE_EDITORIAL") {
    throw new Error(`Expected SAFE_EDITORIAL, received ${currentCategory}`);
  }
  if (safetyConstraintReplay.policyClassification.canonicalCategory === "EXPLICIT_ADULT") {
    throw new Error("Safety/forbidden explicit wording incorrectly promoted the request to EXPLICIT_ADULT.");
  }
  return { ok: true, previous, current, safetyConstraintReplay, canonicalCategory: currentCategory };
}