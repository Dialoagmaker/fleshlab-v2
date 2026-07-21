const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));

export function analyzeMarketing(imageFacts) {
  const quality = imageFacts.image_quality?.score || 0;
  const hasSubject = !imageFacts.subject_position?.status;
  const hasFace = (imageFacts.face_visibility?.clear_face_count || 0) > 0;
  const topAttention = imageFacts.attention_map?.[0]?.attention_strength || 0;
  const safeZones = imageFacts.safe_typography_zones || [];
  const darkPenalty = imageFacts.lighting?.underexposed_percent > 35 ? 16 : 0;
  const noFacePenalty = hasFace ? 0 : 12;
  const thumbnail = Math.max(0, Math.min(100, Math.round(topAttention * 42 + quality * 0.38 + (hasSubject ? 16 : 0) + (safeZones.length ? 8 : 0) - darkPenalty - noFacePenalty)));
  const commercial = Math.max(0, Math.min(100, Math.round(thumbnail * 0.55 + quality * 0.25 + (imageFacts.dominant_colors?.length ? 8 : 0))));

  const risks = [];
  if (!hasFace) risks.push("face visibility is weak or unavailable");
  if (!hasSubject) risks.push("main subject is not confidently localized");
  if (imageFacts.image_quality?.exposure === "very_dark") risks.push("image is very dark");
  if (safeZones.length < 2) risks.push("limited safe typography space");

  return {
    module: "MARKETING_ANALYZER",
    output_type: "MarketingFacts",
    schema_version: "1.0",
    input_modules: ["ImageFacts"],
    attention_attractor: imageFacts.attention_map?.[0] ? { zone: imageFacts.attention_map[0].zone, reason: "highest local attention score", strength: imageFacts.attention_map[0].attention_strength } : { zone: null, reason: "no attention zone found", strength: 0 },
    attention_weaknesses: risks,
    thumbnail_strength: { heuristic_score: thumbnail, basis: "attention + quality + subject + typography space", performance_calibrated: false },
    commercial_potential: { heuristic_score: commercial, basis: "thumbnail strength + quality + color structure", performance_calibrated: false },
    target_audience: { value: "not inferable from pixels alone", limitation: "requires campaign/business context" },
    campaign_category: quality > 70 && hasSubject ? "premium_visual_campaign" : quality > 45 ? "utility_marketing_asset" : "needs_source_improvement",
    marketing_risks: risks,
    strongest_selling_point: hasFace ? "visible face/identity can anchor attention" : hasSubject ? "subject silhouette or body position anchors attention" : "color and contrast are the primary available hooks",
    weakest_visual_element: risks[0] || "no major weakness detected by local heuristics",
    ctr_heuristic_estimate: { index: round(commercial), label: "heuristic only", not_factual_ctr: true },
    uncertainties: ["target audience and campaign performance cannot be proven from pixels alone", "CTR is not calibrated against real campaign data"]
  };
}