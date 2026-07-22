import { analyzeTechnicalVision } from "./technicalVision";
import { analyzeSemanticVision } from "./semanticVision";
import { fuseFacts } from "./factFusion";
import { analyzeIdentity } from "./identityAnalyzer";
import { analyzeMarketing } from "./marketingAnalyzer";
import { directCreative } from "./creativeDirector";
import { planProduction } from "./productionPlanner";
import { validateProductionBlueprint } from "./validator";

export async function runCreativeBrainPipeline(file, { targetPlatform, campaignFamily, userTitle = "" }) {
  if (!file?.type?.startsWith("image/")) throw new Error("Development Mode accepts one uploaded Hero Frame only: PNG, JPG, JPEG, or WEBP.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Supported Hero Frame formats: PNG, JPG, JPEG, WEBP.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Hero Frame is too large. Use an image under 15MB.");
  const technicalFacts = await analyzeTechnicalVision(file);
  const semanticFacts = await analyzeSemanticVision(file);
  const unifiedFacts = fuseFacts(technicalFacts, semanticFacts);
  const identityFacts = analyzeIdentity(unifiedFacts);
  const marketingFacts = analyzeMarketing(unifiedFacts, identityFacts, targetPlatform);
  const creativeDecisions = directCreative(unifiedFacts, identityFacts, marketingFacts, campaignFamily, { userTitle });
  const productionBlueprint = planProduction(unifiedFacts, identityFacts, marketingFacts, creativeDecisions);
  productionBlueprint.workflow_mode = "development_hero_frame_first";
  productionBlueprint.selected_source_frame = {
    source: "manual_hero_frame_upload",
    file_name: file.name || "uploaded-hero-frame",
    mime_type: file.type,
    no_video_decoding: true,
    no_frame_extraction: true
  };
  const validation = validateProductionBlueprint(productionBlueprint);
  if (!validation.valid) {
    const error = new Error(`Production Blueprint validation failed: ${validation.errors.join("; ")}`);
    error.validation = validation;
    throw error;
  }
  return {
    workflowMode: "Development Mode · Hero Frame Input",
    selectedSourceFrame: { file_name: file.name || "uploaded-hero-frame", mime_type: file.type },
    technicalFacts,
    semanticFacts,
    unifiedFacts,
    identityFacts,
    marketingFacts,
    creativeDecisions,
    productionBlueprint,
    validation
  };
}

export const CREATIVE_BRAIN_PIPELINE_GRAPH = [
  "DEVELOPMENT_HERO_FRAME_INPUT -> Selected Source Frame",
  "LOCAL_TECHNICAL_VISION -> TechnicalImageFacts",
  "SEMANTIC_VISION -> SemanticImageFacts",
  "FACT_FUSION(TechnicalImageFacts, SemanticImageFacts) -> UnifiedImageFacts",
  "IDENTITY_ANALYZER(UnifiedImageFacts) -> IdentityFacts",
  "MARKETING_ANALYZER(UnifiedImageFacts, IdentityFacts, BrandRules, TargetPlatform) -> MarketingFacts",
  "CREATIVE_DIRECTOR(UnifiedImageFacts, IdentityFacts, MarketingFacts, BrandDNA, CampaignFamily) -> CreativeDecisions",
  "PRODUCTION_PLANNER(all module outputs) -> ProductionBlueprint",
  "HERO_PHOTOGRAPHY_ENGINE(Selected Source Frame, ProductionBlueprint) -> Professional Hero Photograph",
  "CREATIVE_CRITIC(Uploaded Hero Frame, Rendered Hero Photograph) -> Editorial Cover Readiness"
];

export const PRODUCTION_PIPELINE_ENTRY_POINT = "VIDEO -> Frame Selection -> Selected Source Frame -> Creative Brain -> Hero Photography Engine";