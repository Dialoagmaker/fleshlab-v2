const TEXT_SIGNALS = [
  { phrase: "explicit", category: "EXPLICIT_ADULT", weight: 0.58, reason: "Explicit-content wording appears in the creative/policy input." },
  { phrase: "hardcore", category: "EXPLICIT_ADULT", weight: 0.62, reason: "Hardcore-content wording appears in the creative/policy input." },
  { phrase: "porn", category: "EXPLICIT_ADULT", weight: 0.6, reason: "Pornography wording appears in the creative/policy input." },
  { phrase: "sexual", category: "EXPLICIT_ADULT", weight: 0.58, reason: "Sexual-content wording appears in the creative/policy input." },
  { phrase: "nude", category: "EXPLICIT_ADULT", weight: 0.52, reason: "Nudity wording appears in the creative/policy input." },
  { phrase: "naked", category: "EXPLICIT_ADULT", weight: 0.52, reason: "Nudity wording appears in the creative/policy input." },
  { phrase: "visible genitals", category: "EXPLICIT_ADULT", weight: 0.66, reason: "Explicit anatomy wording appears in the creative/policy input." },
  { phrase: "visible nipples", category: "EXPLICIT_ADULT", weight: 0.58, reason: "Explicit anatomy wording appears in the creative/policy input." },
  { phrase: "adult", category: "ADULT_COMMERCIAL", weight: 0.48, reason: "Adult-commercial wording appears in the creative/policy input." },
  { phrase: "onlyfans", category: "ADULT_COMMERCIAL", weight: 0.44, reason: "Creator-platform context can indicate adult-commercial positioning." },
  { phrase: "lingerie", category: "ADULT_COMMERCIAL", weight: 0.4, reason: "Lingerie wording indicates adult-commercial or fashion-adjacent styling." },
  { phrase: "underwear", category: "ADULT_COMMERCIAL", weight: 0.36, reason: "Underwear wording indicates adult-commercial or fashion-adjacent styling." },
  { phrase: "bikini", category: "ADULT_COMMERCIAL", weight: 0.12, reason: "Bikini wording indicates swimwear styling, not explicit content by itself." }
];

const CONTEXT_SIGNALS = [
  { phrase: "performer", category: "ADULT_COMMERCIAL", weight: 0.08, reason: "Performer context is relevant but not explicit by itself." },
  { phrase: "creator", category: "ADULT_COMMERCIAL", weight: 0.06, reason: "Creator-brand context is relevant but not explicit by itself." },
  { phrase: "campaign", category: "SAFE_EDITORIAL", weight: 0.06, reason: "Campaign wording supports commercial/editorial intent." },
  { phrase: "fashion", category: "SAFE_EDITORIAL", weight: 0.08, reason: "Fashion wording supports safe editorial intent." },
  { phrase: "editorial", category: "SAFE_EDITORIAL", weight: 0.08, reason: "Editorial wording supports safe editorial intent." }
];

function textOf(value) {
  try { return JSON.stringify(value || {}).toLowerCase(); } catch (_) { return ""; }
}

function evidenceId(type, signal, index) {
  return `${type}-${signal}-${index}`.replace(/[^a-z0-9-]/gi, "_");
}

function addTextEvidence(text, rules, type) {
  const evidence = [];
  rules.forEach(rule => {
    const escaped = rule.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(`\\b${escaped}\\b`, "gi")) || [];
    matches.forEach((match, index) => evidence.push({
      id: evidenceId(type, rule.phrase, index),
      type,
      signal: match,
      category: rule.category,
      weight: rule.weight,
      reason: rule.reason,
      confidence: Number(Math.min(0.96, 0.72 + rule.weight / 2).toFixed(2))
    }));
  });
  return evidence;
}

async function auditImageEvidence(file) {
  if (!file || typeof createImageBitmap !== "function") return [];
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, size, size);
    const data = context.getImageData(0, 0, size, size).data;
    let skinTonePixels = 0;
    let sampled = 0;
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const looksLikeSkinTone = r > 95 && g > 40 && b > 20 && max - min > 15 && r > g && r > b;
      if (looksLikeSkinTone) skinTonePixels += 1;
      sampled += 1;
    }
    bitmap.close?.();
    const ratio = sampled ? skinTonePixels / sampled : 0;
    if (ratio < 0.16) return [];
    return [{
      id: "IMAGE-skin-tone-exposure-estimate-0",
      type: "IMAGE",
      signal: `skin-tone exposure estimate ${(ratio * 100).toFixed(1)}%`,
      category: "ADULT_COMMERCIAL",
      weight: ratio > 0.38 ? 0.18 : 0.1,
      reason: "Pixel sampling detected skin-tone exposure; this is not anatomy detection and does not prove explicit content.",
      confidence: Number(Math.min(0.82, 0.52 + ratio).toFixed(2))
    }];
  } catch (_) {
    return [];
  }
}

function scoreEvidence(evidence) {
  const raw = { SAFE_EDITORIAL: 0.18, ADULT_COMMERCIAL: 0.02, EXPLICIT_ADULT: 0, UNSUPPORTED: 0 };
  evidence.forEach(item => { raw[item.category] = (raw[item.category] || 0) + item.weight; });
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0) || 1;
  const scores = Object.fromEntries(Object.entries(raw).map(([category, value]) => [category, Number((value / total).toFixed(3))]));
  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return { scores, winningCategory: ordered[0][0], confidence: ordered[0][1], margin: Number((ordered[0][1] - (ordered[1]?.[1] || 0)).toFixed(3)) };
}

function counterfactuals(evidence) {
  return evidence.map(item => {
    const remaining = evidence.filter(candidate => candidate.id !== item.id);
    const result = scoreEvidence(remaining);
    return {
      without: item.signal,
      removedType: item.type,
      recalculatedCategory: result.winningCategory,
      recalculatedScores: result.scores,
      recalculatedConfidence: result.confidence
    };
  });
}

export async function runPolicyEvidenceAudit({ sourceFrameFile, productionBlueprint, instructions, campaignFamily, targetPlatform }) {
  const text = `${textOf(productionBlueprint)} ${textOf(instructions)} ${(campaignFamily || "").toLowerCase()} ${(targetPlatform || "").toLowerCase()}`;
  const evidence = [
    ...addTextEvidence(text, TEXT_SIGNALS, "TEXT"),
    ...(await auditImageEvidence(sourceFrameFile)),
    ...addTextEvidence(text, CONTEXT_SIGNALS, "CONTEXT")
  ];
  const scored = scoreEvidence(evidence);
  const flags = [];
  if (scored.winningCategory === "EXPLICIT_ADULT" && scored.margin < 0.05) flags.push("LOW_CLASSIFICATION_MARGIN");
  if (scored.confidence < 0.7) flags.push("REVIEW_RECOMMENDED");

  return {
    stage: "Policy Evidence Audit",
    classification: scored.winningCategory,
    confidence: scored.confidence,
    evidence,
    decisionTrace: {
      weightedPath: evidence.map(item => ({ signal: item.signal, type: item.type, category: item.category, weight: item.weight })),
      total: scored.scores,
      winningCategory: scored.winningCategory,
      margin: scored.margin,
      flags
    },
    alternativeClassifications: scored.scores,
    counterfactualResults: counterfactuals(evidence),
    policyClassification: {
      category: scored.winningCategory,
      canonicalCategory: scored.winningCategory,
      source: "policy_evidence_audit",
      confidence: scored.confidence,
      policyRisk: scored.winningCategory === "EXPLICIT_ADULT" ? "restricted_explicit" : scored.winningCategory === "ADULT_COMMERCIAL" ? "restricted" : scored.winningCategory === "UNSUPPORTED" ? "blocked" : "standard",
      evidenceCount: evidence.length,
      auditFlags: flags,
      version: "policy-evidence-audit-v1"
    }
  };
}