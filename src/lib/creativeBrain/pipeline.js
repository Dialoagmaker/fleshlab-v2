import { analyzeTechnicalVision } from "./technicalVision";
import { analyzeSemanticVision } from "./semanticVision";
import { fuseFacts } from "./factFusion";
import { analyzeIdentity } from "./identityAnalyzer";
import { analyzeMarketing } from "./marketingAnalyzer";
import { directCreative } from "./creativeDirector";
import { planProduction } from "./productionPlanner";
import { validateProductionBlueprint } from "./validator";

export async function runCreativeBrainPipeline(file, { targetPlatform, campaignFamily }) {
  if (!file?.type?.startsWith("image/")) throw new Error("Creative Brain accepts one still image file only.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image is too large. Use an image under 15MB.");
  const technicalFacts = await analyzeTechnicalVision(file);
  const semanticFacts = await analyzeSemanticVision(file);
  const unifiedFacts = fuseFacts(technicalFacts, semanticFacts);
  const identityFacts = analyzeIdentity(unifiedFacts);
  const marketingFacts = analyzeMarketing(unifiedFacts, identityFacts, targetPlatform);
  const creativeDecisions = directCreative(unifiedFacts, identityFacts, marketingFacts, campaignFamily);
  const productionBlueprint = planProduction(unifiedFacts, identityFacts, marketingFacts, creativeDecisions);
  const validation = validateProductionBlueprint(productionBlueprint);
  if (!validation.valid) {
    const error = new Error(`Production Blueprint validation failed: ${validation.errors.join("; ")}`);
    error.validation = validation;
    throw error;
  }
  return { technicalFacts, semanticFacts, unifiedFacts, identityFacts, marketingFacts, creativeDecisions, productionBlueprint, validation };
}

export const CREATIVE_BRAIN_PIPELINE_GRAPH = [
  "IMAGE",
  "LOCAL_TECHNICAL_VISION -> TechnicalImageFacts",
  "SEMANTIC_VISION -> SemanticImageFacts",
  "FACT_FUSION(TechnicalImageFacts, SemanticImageFacts) -> UnifiedImageFacts",
  "IDENTITY_ANALYZER(UnifiedImageFacts) -> IdentityFacts",
  "MARKETING_ANALYZER(UnifiedImageFacts, IdentityFacts, BrandRules, TargetPlatform) -> MarketingFacts",
  "CREATIVE_DIRECTOR(UnifiedImageFacts, IdentityFacts, MarketingFacts, BrandDNA, CampaignFamily) -> CreativeDecisions",
  "PRODUCTION_PLANNER(all module outputs) -> ProductionBlueprint"
];