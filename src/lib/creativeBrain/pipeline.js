import { analyzeVision } from "./visionAnalysis";
import { analyzeIdentity } from "./identityAnalyzer";
import { analyzeMarketing } from "./marketingAnalyzer";
import { directCreative } from "./creativeDirector";
import { planProduction } from "./productionPlanner";

export async function runCreativeBrainPipeline(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Creative Brain accepts one still image file only.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image is too large. Use an image under 15MB.");
  const imageFacts = await analyzeVision(file);
  const identityFacts = analyzeIdentity(imageFacts);
  const marketingFacts = analyzeMarketing(imageFacts);
  const creativeDecisions = directCreative(imageFacts, identityFacts, marketingFacts);
  const productionBlueprint = planProduction(imageFacts, identityFacts, marketingFacts, creativeDecisions);
  return { imageFacts, identityFacts, marketingFacts, creativeDecisions, productionBlueprint };
}

export const CREATIVE_BRAIN_PIPELINE_GRAPH = [
  "IMAGE",
  "VISION_ANALYSIS -> ImageFacts",
  "IDENTITY_ANALYZER(ImageFacts) -> IdentityFacts",
  "MARKETING_ANALYZER(ImageFacts) -> MarketingFacts",
  "CREATIVE_DIRECTOR(ImageFacts, IdentityFacts, MarketingFacts) -> CreativeDecisions",
  "PRODUCTION_PLANNER(ImageFacts, IdentityFacts, MarketingFacts, CreativeDecisions) -> ProductionBlueprint"
];