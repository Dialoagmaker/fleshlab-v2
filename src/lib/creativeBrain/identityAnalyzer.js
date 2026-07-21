const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

function boxArea(box) { return box ? Number(box.width || 0) * Number(box.height || 0) : 0; }

export function analyzeIdentity(imageFacts) {
  const faces = imageFacts.face_visibility?.faces || [];
  const clearFaces = imageFacts.face_visibility?.clear_face_count || 0;
  const subject = imageFacts.subject_position?.status ? null : imageFacts.subject_position;
  const bestFace = [...faces].sort((a, b) => boxArea(b) - boxArea(a))[0] || null;
  const faceConfidence = bestFace ? Math.min(92, 45 + boxArea(bestFace) * 950 + (imageFacts.image_quality.score || 0) * 0.25) : 0;
  const bodyConfidence = subject ? Math.min(86, 35 + boxArea(subject) * 90 + (imageFacts.image_quality.score || 0) * 0.25) : 0;
  const confidence = Math.round(Math.max(faceConfidence, bodyConfidence * 0.72));

  const preserve = [];
  if (bestFace) preserve.push({ area: "face", box: bestFace, instruction: "LOCK", basis: "detected face box" });
  if (subject) preserve.push({ area: "body_or_subject_cluster", box: subject, instruction: "LOCK", basis: subject.basis });

  return {
    module: "IDENTITY_ANALYZER",
    output_type: "IdentityFacts",
    schema_version: "1.0",
    input_modules: ["ImageFacts"],
    face_visibility: { visible: faces.length > 0, clear_enough_to_preserve: clearFaces > 0, confidence: Math.round(faceConfidence), faces_detected: faces.length, detector_available: imageFacts.face_visibility?.detector_available === true },
    body_visibility: { visible: Boolean(subject), confidence: Math.round(bodyConfidence), body_box: subject || null, limitation: "body box is an attention-cluster proxy, not anatomical segmentation" },
    expression_visibility: { visible: false, confidence: 0, limitation: "expression classifier not implemented locally" },
    pose_visibility: { visible: Boolean(subject), confidence: subject ? 38 : 0, limitation: "pose landmarks not implemented locally" },
    skin_tone_lock: { required: (imageFacts.attention_map || []).some(z => z.skin_signal > 0.12), confidence: Math.round((imageFacts.attention_map || []).reduce((m, z) => Math.max(m, z.skin_signal || 0), 0) * 100), limitation: "skin detection is color-range heuristic" },
    hairstyle_lock: { required: faces.length > 0, confidence: faces.length > 0 ? 24 : 0, limitation: "hair is not segmented locally" },
    identity_priority: confidence >= 60 ? "high" : confidence >= 35 ? "medium" : "low_or_uncertain",
    areas_that_must_never_change: preserve,
    areas_that_may_change: (imageFacts.negative_space || []).slice(0, 5).map(zone => ({ area: zone.zone, box: { x: zone.x, y: zone.y, width: zone.width, height: zone.height }, reason: "low-attention negative space" })),
    identity_confidence: confidence,
    uncertainties: [
      ...(faces.length ? [] : ["no clear face was detected, so identity protection cannot be face-verified"]),
      "no biometric identity embedding is used",
      "no segmentation mask is produced"
    ]
  };
}