const TEXT_SIGNALS = [
  { phrase: "explicit adult", category: "EXPLICIT_ADULT", weight: 0.62, reason: "Affirmative explicit-adult wording appears in the creative/policy input." },
  { phrase: "explicit sex", category: "EXPLICIT_ADULT", weight: 0.62, reason: "Affirmative explicit-sex wording appears in the creative/policy input." },
  { phrase: "sexual act", category: "EXPLICIT_ADULT", weight: 0.6, reason: "Affirmative sexual-act wording appears in the creative/policy input." },
  { phrase: "hardcore", category: "EXPLICIT_ADULT", weight: 0.62, reason: "Hardcore-content wording appears in the creative/policy input." },
  { phrase: "porn", category: "EXPLICIT_ADULT", weight: 0.6, reason: "Pornography wording appears in the creative/policy input." },
  { phrase: "nude", category: "EXPLICIT_ADULT", weight: 0.52, reason: "Nudity wording appears in the creative/policy input." },
  { phrase: "naked", category: "EXPLICIT_ADULT", weight: 0.52, reason: "Nudity wording appears in the creative/policy input." },
  { phrase: "visible genitals", category: "EXPLICIT_ADULT", weight: 0.66, reason: "Explicit anatomy wording appears in the creative/policy input." },
  { phrase: "visible nipples", category: "EXPLICIT_ADULT", weight: 0.58, reason: "Explicit anatomy wording appears in the creative/policy input." },
  { phrase: "adult commercial", category: "ADULT_COMMERCIAL", weight: 0.48, reason: "Explicit adult-commercial wording appears in the creative/policy input." },
  { phrase: "adult-oriented", category: "ADULT_COMMERCIAL", weight: 0.48, reason: "Explicit adult-oriented commercial wording appears in the creative/policy input." },
  { phrase: "adult marketing", category: "ADULT_COMMERCIAL", weight: 0.44, reason: "Explicit adult-marketing wording appears in the creative/policy input." },
  { phrase: "onlyfans", category: "ADULT_COMMERCIAL", weight: 0.44, reason: "Creator-platform context can indicate adult-commercial positioning." },
  { phrase: "lingerie", category: "SAFE_EDITORIAL", weight: 0.04, reason: "Lingerie styling is fashion-adjacent and remains safe editorial unless explicit adult-commercial wording is present." },
  { phrase: "underwear", category: "SAFE_EDITORIAL", weight: 0.04, reason: "Underwear creative is canonical SAFE_EDITORIAL unless explicit adult-commercial wording is present." },
  { phrase: "bikini", category: "SAFE_EDITORIAL", weight: 0.04, reason: "Bikini/swimwear styling is canonical SAFE_EDITORIAL unless explicit adult-commercial wording is present." }
];

const CONTEXT_SIGNALS = [
  { phrase: "performer", category: "SAFE_EDITORIAL", weight: 0.03, reason: "Performer context is identity/credit metadata and is not adult-commercial evidence by itself." },
  { phrase: "creator", category: "SAFE_EDITORIAL", weight: 0.03, reason: "Creator-brand context is identity/credit metadata and is not adult-commercial evidence by itself." },
  { phrase: "campaign", category: "SAFE_EDITORIAL", weight: 0.06, reason: "Campaign wording supports commercial/editorial intent." },
  { phrase: "fashion", category: "SAFE_EDITORIAL", weight: 0.08, reason: "Fashion wording supports safe editorial intent." },
  { phrase: "editorial", category: "SAFE_EDITORIAL", weight: 0.08, reason: "Editorial wording supports safe editorial intent." }
];

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value ?? "");
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function textOf(value) {
  try { return stableStringify(value || {}).toLowerCase(); } catch (_) { return ""; }
}

function evidenceId(type, signal, index) {
  return `${type}-${signal}-${index}`.replace(/[^a-z0-9-]/gi, "_");
}

function isNegatedExplicitContext(text, matchIndex) {
  const before = text.slice(Math.max(0, matchIndex - 72), matchIndex);
  return /\b(never|not|no|non|without|avoid|forbidden|blocked|prohibited|must not|do not|excluded|disallowed)\b/i.test(before);
}

function addTextEvidence(text, rules, type) {
  const evidence = [];
  rules.forEach(rule => {
    const escaped = rule.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
    let match;
    let index = 0;
    while ((match = pattern.exec(text)) !== null) {
      const negatedExplicit = rule.category === "EXPLICIT_ADULT" && isNegatedExplicitContext(text, match.index);
      evidence.push({
        id: evidenceId(type, rule.phrase, index),
        type,
        signal: match[0],
        category: negatedExplicit ? "SAFE_EDITORIAL" : rule.category,
        weight: negatedExplicit ? 0 : rule.weight,
        diagnosticOnly: negatedExplicit,
        ignoredReason: negatedExplicit ? "Explicit term appears inside a negative/forbidden/safety context and cannot promote the canonical category." : null,
        reason: negatedExplicit ? "Ignored explicit wording because it is a safety constraint, not requested content." : rule.reason,
        confidence: Number(Math.min(0.96, 0.72 + (negatedExplicit ? 0 : rule.weight) / 2).toFixed(2))
      });
      index += 1;
    }
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
      category: "SAFE_EDITORIAL",
      weight: 0,
      diagnosticOnly: true,
      reason: "Pixel sampling detected skin-tone exposure; this is diagnostic only and cannot change the canonical category.",
      confidence: Number(Math.min(0.82, 0.52 + ratio).toFixed(2))
    }];
  } catch (_) {
    return [];
  }
}

function scoreEvidence(evidence) {
  const raw = { SAFE_EDITORIAL: 0.18, ADULT_COMMERCIAL: 0.02, EXPLICIT_ADULT: 0, UNSUPPORTED: 0 };
  evidence.forEach(item => {
    if (item.diagnosticOnly) return;
    raw[item.category] = (raw[item.category] || 0) + item.weight;
  });
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

export async function runPolicyEvidenceAudit({ sourceFrameFile, productionBlueprint, instructions, campaignFamily, targetPlatform, forcedImageEvidence = null }) {
  const text = `${textOf(productionBlueprint)} ${textOf(instructions)} ${(campaignFamily || "").toLowerCase()} ${(targetPlatform || "").toLowerCase()}`;
  const imageEvidence = Array.isArray(forcedImageEvidence) ? forcedImageEvidence : await auditImageEvidence(sourceFrameFile);
  const evidence = [
    ...addTextEvidence(text, TEXT_SIGNALS, "TEXT"),
    ...imageEvidence,
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
      weightedPath: evidence.map(item => ({ signal: item.signal, type: item.type, category: item.category, weight: item.weight, diagnosticOnly: Boolean(item.diagnosticOnly), ignoredReason: item.ignoredReason || null })),
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