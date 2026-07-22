function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sideLabel(side) {
  return side === "LEFT" ? "left" : "right";
}

export function createKeyArtBrief({ campaign = {}, mood = {}, analysis = {}, format = {} }) {
  const subjectSide = (analysis.subjectSide || (analysis.subjectCenter?.x < 0.5 ? "left" : "right")).toLowerCase();
  const titleSide = subjectSide === "left" ? "right" : "left";

  return {
    mood: [mood.label || "Premium", campaign.storyIntelligence?.mood || "Exclusive", campaign.storyIntelligence?.emotionalHook || "Raw access"].filter(Boolean),
    composition: format.height > format.width ? "Vertical editorial key art" : `Split ${titleSide}`,
    typography: "Adaptive editorial typography from the unchanged source-platform title only",
    photography: [`Subject ${subjectSide}`, "Face/identity priority", `Negative space ${titleSide}`, "Background adapted to layout"],
    graphicLanguage: ["Black field", "FLESHLAB red accent", "Distressed texture", "Editorial hierarchy"],
    intent: "Design the artwork first, then adapt Hero Photography into that composition."
  };
}

export function createLayoutSketch({ compositionPlan = {}, campaign = {}, format = {}, keyArtBrief = {} }) {
  const titleSide = compositionPlan.titleZone || "LEFT";
  const subjectSide = compositionPlan.dominantSide || "RIGHT";
  const logoPosition = titleSide === "LEFT" ? "top left" : "top right";
  const infoPosition = titleSide === "LEFT" ? "lower left" : "lower right";
  const photoCrop = subjectSide === "RIGHT" ? "right-side hero crop" : "left-side hero crop";
  const hasPerformer = Boolean(compact(campaign.performerName));
  const hasSubtitle = Boolean(compact(campaign.collection || campaign.subtitle));

  return {
    blueprint: `${keyArtBrief.composition || "Split editorial composition"} · ${compositionPlan.layoutFamily || "KEY_ART"}`,
    elements: [
      { element: "Logo", position: logoPosition, reason: "Anchors the brand before the eye enters the title block." },
      { element: "Campaign Title", position: `${sideLabel(titleSide)} graphic field`, reason: "The source-platform video title is preserved verbatim and receives the largest controlled typography area." },
      { element: "Subtitle / Collection", position: hasSubtitle ? `${infoPosition}, below title rhythm` : "omitted", reason: hasSubtitle ? "Supports the title without competing with it." : "No collection metadata was provided, so no placeholder is created." },
      { element: "Performer", position: hasPerformer ? `${infoPosition}, near subject path` : "omitted", reason: hasPerformer ? "Connects the marketing title to the visible subject after the main read." : "No performer metadata was provided, so the hierarchy stays title-led." },
      { element: "Feature Strip", position: "bottom safe band", reason: "Provides format and release cues after the title and image have already sold the artwork." },
      { element: "Empty Space", position: `${sideLabel(titleSide)} title field`, reason: "Protected negative space keeps typography intentional instead of pasted over photography." },
      { element: "Photo Crop", position: photoCrop, reason: "Hero Photography is recropped and separated to serve the designed layout, not the other way around." },
      { element: "Subject Scale", position: compositionPlan.subjectCrop === "TIGHT" ? "large poster scale" : "medium cinematic scale", reason: "Scale is selected from the format and subject side so the title and image share one editorial rhythm." }
    ],
    adaptation: ["Extend canvas from the source image", "Create negative space for typography", "Darken the graphic field", "Blur and grade background extension", "Increase subject separation"],
    typographyRule: "Follow the sketch; preserve every source-platform title word exactly and only change visual presentation."
  };
}