export const confidence = (value) => Math.max(0, Math.min(1, Number(Number(value || 0).toFixed(3))));
export const measured = (value, c = 1) => ({ value, confidence: confidence(c), source: "local_measurement" });
export const semantic = (value, c = 0.5) => ({ value, confidence: confidence(c), source: "semantic_vision" });
export const rule = (value, c = 0.75, source = "creative_rule") => ({ value, confidence: confidence(c), source });