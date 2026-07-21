import { validateHeroPhotographyInputs } from "./inputValidator";
import { compileHeroPhotographyInstructions } from "./instructionCompiler";
import { fileToDataUrl, readImageResolution } from "./frameEncoding";
import { getHeroPhotographyProvider } from "./providerRegistry";
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

export async function executeHeroPhotographyRender({ sourceFrameFile, productionBlueprint, platformRules, campaignFamily, providerId }) {
  const startedAt = performance.now();
  const inputValidation = validateHeroPhotographyInputs({ sourceFrameFile, productionBlueprint, platformRules, campaignFamily });
  if (!inputValidation.valid) return structuredFailure("input_rejected", "Hero Photography Engine rejected the render inputs.", { errors: inputValidation.errors });

  const provider = getHeroPhotographyProvider(providerId);
  const instructions = compileHeroPhotographyInstructions({ productionBlueprint, platformRules, campaignFamily });
  const blueprintHash = hashPayload({ instructions, productionBlueprint });

  try {
    const sourceFrameDataUrl = await fileToDataUrl(sourceFrameFile);
    const sourceResolution = await readImageResolution(sourceFrameDataUrl);
    const providerStartedAt = performance.now();
    const render = await provider.render({ sourceFrameDataUrl, identityReferenceDataUrl: sourceFrameDataUrl, instructions, productionBlueprint });
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
      identityPreservationStatus: {
        status: "accepted",
        rule: "same source frame used as identity reference; provider instructed to preserve identity-critical areas",
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
        provider_metadata: render.providerMetadata
      }
    };
    outputPackage.creativeCritic = runCreativeCritic(outputPackage, productionBlueprint);
    return outputPackage;
  } catch (error) {
    return structuredFailure("provider_failed", error.message || "Hero Photography provider failed.", {
      provider: { id: provider.id, name: provider.name },
      providerData: error.providerData || null,
      renderTimeMs: Math.round(performance.now() - startedAt),
      blueprint_execution_hash: blueprintHash
    });
  }
}