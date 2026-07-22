export function createLayerPlan({ compositionPlan = {}, analysis = {}, format = {} }) {
  const subjectSide = compositionPlan.dominantSide || "RIGHT";
  const portrait = format.height > format.width;
  return {
    backgroundLayer: "extended blurred hero photography, darkened into cinematic backing plate",
    atmosphereLayer: "volumetric red-black fog, depth haze, subtle dust particles",
    graphicFieldLayer: `${compositionPlan.graphicField || "BLACK_TEXTURE"} structural field with painted transition`,
    photoLayer: `${compositionPlan.subjectCrop || "MEDIUM"} crop, relit subject, embedded into graphic architecture`,
    maskLayer: {
      strategy: "soft foreground subject recovery over typography edges",
      detectedRegions: ["head", "shoulders", "torso", "arms", "hands"],
      faceProtection: "never cover eyes or central face zone",
      subjectSide,
      silhouette: portrait ? "vertical torso ellipse" : "head-shoulder-torso ellipse"
    },
    heroTypographyLayer: "multi-plane campaign identity: collection back-plane, hero word mid-plane, performer lower plane",
    foregroundFXLayer: "light streaks, depth fog, red brush energy, vignette bloom, dust",
    brandLayer: "large integrated FLESHLAB mark as architectural element, not watermark",
    featureLayer: "editorial feature strip with separators and premium spacing",
    qualityGate: "reject flat text-on-image output; require visible depth, subject separation, integrated graphic field, and cinematic key-art feel"
  };
}