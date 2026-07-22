import { validateHeroPhotographyInputs } from "./inputValidator";
import { compileHeroPhotographyInstructions } from "./instructionCompiler";
import { fileToDataUrl, readImageResolution } from "./frameEncoding";
import { getHeroPhotographyProvider, listHeroPhotographyProviders } from "./providerRegistry";
import { planProviderExecution } from "./providerIntelligence";
import { runCreativeCritic } from "./creativeCritic";

function hashPayload(payload) {
  const text = JSON.stringify(payload || {});
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function structuredFailure(code, message, details = {}) {
  return { status: "failed", ok: false, code, message, details, heroImage: null, renderMetadata: null };
}

export async function executeHeroPhotographyRender({ sourceFrameFile, productionBlueprint, platformRules, campaignFamily, providerId, userConsent = false, consentText = "" }) {
  const startedAt = performance.now();
  if (!userConsent) return structuredFailure("consent_required", "User approval is required before transmitting the selected Hero Frame.");
  const inputValidation = validateHeroPhotographyInputs({ sourceFrameFile, productionBlueprint, platformRules, campaignFamily });
  if (!inputValidation.valid) return structuredFailure("input_rejected", "Hero Photography Engine rejected the render inputs.", { errors: inputValidation.errors });

  const instructions = compileHeroPhotographyInstructions({ productionBlueprint, platformRules, campaignFamily });
  const providerIntelligence = planProviderExecution({ providers: listHeroPhotographyProviders(), productionBlueprint, instructions, targetPlatform: platformRules?.targetPlatform, campaignFamily });
  const provider = getHeroPhotographyProvider(providerIntelligence.selectedProvider?.providerId || providerId);
  const blueprintHash = hashPayload({ instructions, productionBlueprint });

  try {
    const sourceFrameDataUrl = await fileToDataUrl(sourceFrameFile);
    const sourceResolution = await readImageResolution(sourceFrameDataUrl);
    const providerStartedAt = performance.now();
    const privacyIntent = {
      channel: "approved_hero_frame_render",
      user_approved_transmission: true,
      selected_hero_frame_only: true,
      consent_text: consentText,
      blocked_media: ["original_video", "video_timeline", "additional_frames", "browser_blobs", "hidden_metadata"]
    };
    const render = await provider.render({ sourceFrameDataUrl, instructions, productionBlueprint, privacyIntent, providerIntelligencePlan: providerIntelligence });
    const renderTimeMs = Math.round(performance.now() - providerStartedAt);
    const outputResolution = await readImageResolution(render.imageDataUrl);
    const outputPackage = {
      status: "succeeded",
      ok: true,
      heroImage: render.imageDataUrl,
      provider: { id: provider.id, name: provider.name },
      model: render.model,
      renderTimeMs,
      resolution: outputResolution,
      seed: render.seed,
      parameters: instructions,
      heroPhotographyPlan: instructions.hero_photography_plan,
      sourceFrameUnderstanding: instructions.source_frame_understanding,
      reconstructionReport: render.reconstructionReport || instructions.reconstruction_report_template,
      identityPreservationStatus: {
        status: "accepted",
        rule: "single consent-approved selected Hero Frame used as the only visual reference; provider instructed to preserve identity-critical areas while rebuilding the commercial hero photograph",
        source_resolution: sourceResolution
      },
      renderWarnings: render.warnings || [],
      renderMetadata: {
        engine: "FLESHLAB Hero Photography Engine",
        provider_id: provider.id,
        blueprint_execution_hash: blueprintHash,
        source_resolution: sourceResolution,
        output_resolution: outputResolution,
        started_at: new Date().toISOString(),
        total_time_ms: Math.round(performance.now() - startedAt),
        provider_metadata: render.providerMetadata,
        provider_intelligence: providerIntelligence,
        privacy_intent: privacyIntent
      }
    };
    outputPackage.creativeCritic = runCreativeCritic(outputPackage, productionBlueprint);
    return outputPackage;
  } catch (error) {
    return structuredFailure("provider_failed", error.message || "Hero Photography provider failed.", {
      provider: { id: provider.id, name: provider.name },
      providerData: error.providerData || null,
      renderTimeMs: Math.round(performance.now() - startedAt),
      blueprint_execution_hash: blueprintHash,
      provider_intelligence: providerIntelligence
    });
  }
}