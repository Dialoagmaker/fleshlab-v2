import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const SECRET_NAME = 'KIMI_API_KEY';
const EXISTING_TEXT_MODEL_SECRET = 'KIMI_MODEL';
const PREFERRED_IMAGE_MODELS = [
  'black-forest-labs/flux.2-max',
  'black-forest-labs/flux.2-pro',
  'google/gemini-2.5-flash-image',
  'openai/gpt-image-1'
];
const MAX_DATA_URL_CHARS = 12_000_000;
const MAX_REFERENCE_BYTES = 9_000_000;
const MAX_AUTOMATIC_ATTEMPTS = 4;
const RENDERING_CLASSIFICATIONS = ['SAFE_EDITORIAL', 'SAFE_PRODUCT', 'SAFE_BRAND', 'SAFE_PORTRAIT', 'LIFESTYLE', 'FITNESS', 'SWIMWEAR', 'UNDERWEAR', 'ADULT_MARKETING', 'EXPLICIT', 'UNSUPPORTED'];
const DEFAULT_SAFE_CATEGORIES = ['SAFE_EDITORIAL', 'SAFE_PRODUCT', 'SAFE_BRAND', 'SAFE_PORTRAIT', 'LIFESTYLE', 'FITNESS', 'SWIMWEAR', 'UNDERWEAR'];
const ROUTING_WEIGHTS = { policy: 0.40, quality: 0.25, reliability: 0.15, runtime: 0.10, cost: 0.10 };
const PROVIDER_FAILURE_MEMORY = new Map();
const FAILURE_MEMORY_TTL_MS = 10 * 60 * 1000;
const ROUTE_CAPABILITY_MEMORY = new Map();
const ROUTE_CAPABILITY_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
const REQUIRED_IMAGE_REFERENCE_OPERATION = 'IMAGE_REFERENCE_GENERATION';

const KEY_ART_DIRECTOR_PROMPT = `You are the FLESHLAB Hero Photography Director.

Core principle:
The input video frame is only a scouting/reference image. The output must be the professional hero photograph that would have been captured if this scene had been planned as a premium commercial photo shoot.

Never output an enhanced screenshot.
Never merely upscale, sharpen, denoise, relight, beautify, or crop the source frame.
Reconstruct the scene as world-class commercial photography and advertising art direction.

Use two separate visual references when provided:
- Identity Reference: preserve the same apparent person, face, body, tattoos, hairstyle, proportions, and recognizable appearance.
- Story Reference: preserve the emotional moment, visual story, action logic, pose when protected, and emotional intent.

You may redesign when the provided Hero Photography Plan allows:
- background, lighting, color palette, atmosphere, environment, reflections, architecture, furniture, depth, weather, and time of day.

You may NOT redesign:
- apparent person, protected pose, identity, protected expression, protected gaze, emotional intent, or protected storytelling facts.

Production quality target:
Netflix Key Art, Amazon Originals, HBO Campaign, luxury fashion editorial, premium magazine cover.
Never target generic AI-generated imagery.

Cinematic photography requirements:
Explicitly design key light, fill light, rim light, practical lights, depth, foreground, background, texture, shadows, reflections, and color contrast.

Composition requirement:
Leave intentional typography space. Typography space must never cover the face, emotional focal point, or storytelling element.

Output ONLY the professional 16:9 hero photograph. Do not include typography, logos, watermarks, captions, UI, or poster text.`;

function json(data, status = 200) {
  return Response.json(data, { status });
}

function safeJson(value) {
  try { return JSON.stringify(value || null); } catch (_) { return '{}'; }
}

function isAllowedStaff(user) {
  return user && ['admin', 'super_admin', 'manager', 'staff', 'employee'].includes(user.role);
}

function estimateBytesFromDataUrl(dataUrl) {
  const base64 = String(dataUrl || '').split(',')[1] || '';
  return Math.floor(base64.length * 0.75);
}

function parseDataUrlInfo(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return { ok: false, mime_type: null, byte_length: 0 };
  const mime = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  return { ok: true, mime_type: mime, byte_length: estimateBytesFromDataUrl(dataUrl) };
}

function extractProviderMessage(bodyText) {
  const raw = String(bodyText || '');
  try {
    const data = JSON.parse(raw);
    const direct = data?.error?.message || data?.error_description || data?.message || data?.detail || data?.details;
    if (typeof direct === 'string') return direct;
    if (data?.error && typeof data.error === 'string') return data.error;
    return JSON.stringify(data);
  } catch (_) {
    return raw;
  }
}

function parseOpenRouterError(status, bodyText, headers = null, payloadSummary = null) {
  let parsed = null;
  try { parsed = JSON.parse(String(bodyText || '{}')); } catch (_) { parsed = null; }
  const error = parsed?.error || {};
  const metadata = error?.metadata || parsed?.metadata || null;
  const openrouterMetadata = parsed?.openrouter_metadata || null;
  const code = String(error?.code ?? status ?? 'openrouter_error');
  const message = error?.message || extractProviderMessage(bodyText);
  const category = categorizeOpenRouterError(status, code, message, metadata);
  const retryable = ['RATE_LIMIT', 'PROVIDER_FAILURE', 'MODEL_UNAVAILABLE', 'TIMEOUT'].includes(category);
  const provider = metadata?.provider_name || openrouterMetadata?.provider_name || openrouterMetadata?.provider || null;
  const rejectionType = classifyProviderRejection(message, metadata);
  return {
    http_status: status,
    openrouter_code: code,
    openrouter_error_message: message,
    message,
    metadata,
    openrouter_metadata: openrouterMetadata,
    provider,
    resolved_provider: provider,
    request_id: headers?.get('x-request-id') || headers?.get('x-openrouter-request-id') || openrouterMetadata?.request_id || null,
    generation_id: parsed?.id || parsed?.generation_id || parsed?.data?.id || null,
    processing_began: status === 200,
    request_reached_provider: Boolean(provider),
    rejection_type: rejectionType,
    category,
    retryable,
    raw_response: String(bodyText || '').slice(0, 6000),
    payload_summary: payloadSummary
  };
}

function classifyProviderRejection(message, metadata) {
  const lower = `${message || ''} ${metadata?.block_reason || ''} ${metadata?.finish_reason || ''}`.toLowerCase();
  if (lower.includes('prohibited') || lower.includes('blocked') || lower.includes('moderation') || lower.includes('policy') || lower.includes('guardrail') || lower.includes('flagged')) return 'content';
  if (lower.includes('image') || lower.includes('input_reference') || lower.includes('input reference') || lower.includes('base64') || lower.includes('parse')) return 'reference_image';
  if (lower.includes('payload') || lower.includes('parameter')) return 'payload';
  return 'unknown';
}

function categorizeOpenRouterError(status, code, message, metadata) {
  const lower = String(message || '').toLowerCase();
  const errorType = String(metadata?.error_type || metadata?.provider_code || '').toLowerCase();
  if (lower.includes('prohibited') || lower.includes('blocked') || lower.includes('moderation') || lower.includes('policy') || lower.includes('guardrail') || lower.includes('flagged')) return 'CONTENT_POLICY';
  if (status === 400) {
    if (lower.includes('image') || lower.includes('input_reference') || lower.includes('input reference') || lower.includes('base64')) return 'UNSUPPORTED_IMAGE_INPUT';
    return 'INVALID_PAYLOAD';
  }
  if (status === 401 || status === 403 && lower.includes('key')) return 'AUTH_ERROR';
  if (status === 402 || lower.includes('credit') || lower.includes('insufficient')) return 'NO_CREDITS';
  if (status === 403 || lower.includes('moderation') || lower.includes('policy') || lower.includes('guardrail') || lower.includes('flagged')) return 'CONTENT_POLICY';
  if (status === 408 || status === 524 || lower.includes('timeout')) return 'TIMEOUT';
  if (status === 429 || errorType.includes('rate_limit')) return 'RATE_LIMIT';
  if (status === 502 || status === 503 || status === 529) return 'PROVIDER_FAILURE';
  if (status === 404 || lower.includes('not found') || lower.includes('unavailable')) return 'MODEL_UNAVAILABLE';
  return 'PROVIDER_FAILURE';
}

function publicFailureMessage(diagnostic) {
  if (!diagnostic) return 'The production asset could not be generated. Try another frame or continue locally.';
  if (diagnostic.category === 'NO_CREDITS') return 'Production capacity is temporarily unavailable. Continue locally or try again later.';
  if (diagnostic.category === 'VERIFICATION_REQUIRED') return 'Verified adult, consent, rights, and source checks are required before external production.';
  if (diagnostic.category === 'NO_COMPATIBLE_RENDERING_PIPELINE') return 'No approved production pipeline is currently compatible with this request. Continue locally.';
  if (diagnostic.category === 'NO_COMPATIBLE_PROVIDER_AVAILABLE') return 'No currently configured rendering route supports both the required image-reference operation and the provider policy requirements.';
  if (diagnostic.category === 'UNSUPPORTED_REFERENCE_IMAGE' || diagnostic.category === 'UNSUPPORTED_IMAGE_INPUT') return 'No currently configured rendering route supports both the required image-reference operation and the provider policy requirements.';
  if (diagnostic.category === 'INVALID_PAYLOAD') return 'The selected frame could not be prepared for production. Try another frame.';
  if (diagnostic.category === 'CONTENT_POLICY') return 'All approved production pipelines declined this request. Continue with the local workflow.';
  if (diagnostic.category === 'RATE_LIMIT' || diagnostic.category === 'TIMEOUT' || diagnostic.category === 'PROVIDER_FAILURE') return 'The production pipeline is temporarily unavailable. Continue locally or try again later.';
  return 'The production asset could not be generated. Try another frame or continue locally.';
}

function logProviderDiagnostic(label, diagnostic) {
  console.error(label, safeJson({
    http_status: diagnostic?.http_status,
    openrouter_code: diagnostic?.openrouter_code,
    message: diagnostic?.message,
    category: diagnostic?.category,
    retryable: diagnostic?.retryable,
    provider: diagnostic?.provider,
    request_id: diagnostic?.request_id,
    generation_id: diagnostic?.generation_id,
    processing_began: diagnostic?.processing_began,
    metadata: diagnostic?.metadata,
    openrouter_metadata: diagnostic?.openrouter_metadata,
    request_reached_provider: diagnostic?.request_reached_provider,
    rejection_type: diagnostic?.rejection_type,
    payload_summary: diagnostic?.payload_summary,
    raw_response: diagnostic?.raw_response
  }));
}

async function openRouterFetch(path, apiKey, options = {}, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${OPENROUTER_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('APP_BASE_URL') || 'https://fleshlab.online',
        'X-Title': 'FLESHLAB AI Photographer',
        'X-OpenRouter-Metadata': 'enabled',
        'X-OpenRouter-Experimental-Metadata': 'enabled',
        ...(options.headers || {})
      }
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('timeout');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJsonResponse(res) {
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) { data = null; }
  return { text, data };
}

async function fetchCredits(apiKey) {
  const res = await openRouterFetch('/credits', apiKey, { method: 'GET' }, 30000);
  const { text, data } = await readJsonResponse(res);
  if (!res.ok) return { ok: false, diagnostic: parseOpenRouterError(res.status, text, res.headers) };
  const totalCredits = Number(data?.data?.total_credits ?? data?.total_credits ?? 0);
  const totalUsage = Number(data?.data?.total_usage ?? data?.total_usage ?? 0);
  const remaining = Number((totalCredits - totalUsage).toFixed(6));
  return { ok: true, total_credits: totalCredits, total_usage: totalUsage, remaining_credit: remaining, sufficient_credit: remaining > 0.01, low_credit_warning: remaining <= 2 };
}

async function fetchImageModelCatalog(apiKey) {
  const res = await openRouterFetch('/images/models', apiKey, { method: 'GET' }, 30000);
  const { text, data } = await readJsonResponse(res);
  if (!res.ok) throw new Error(safeJson(parseOpenRouterError(res.status, text, res.headers)));
  return Array.isArray(data?.data) ? data.data : [];
}

async function fetchImageModelEndpoints(apiKey, model) {
  const res = await openRouterFetch(`/images/models/${model}/endpoints`, apiKey, { method: 'GET' }, 30000);
  const { text, data } = await readJsonResponse(res);
  if (!res.ok) return { ok: false, model, diagnostic: parseOpenRouterError(res.status, text, res.headers) };
  return { ok: true, model, endpoints: Array.isArray(data?.endpoints) ? data.endpoints : [] };
}

function descriptorAllows(descriptor, desired) {
  if (!descriptor) return false;
  if (descriptor.type === 'enum') return Array.isArray(descriptor.values) && descriptor.values.includes(desired);
  return true;
}

function endpointSupports(endpoint, key) {
  return Boolean(endpoint?.supported_parameters?.[key]);
}

function endpointIdentity(endpoint) {
  return String(endpoint?.provider_slug || endpoint?.provider_tag || endpoint?.provider_name || 'default_endpoint').toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
}

function routeCapabilityKey(route) {
  return `${route?.id || 'unknown'}::${route?.route_capability?.endpoint || route?.compatible_endpoints?.[0]?.provider_slug || 'default_endpoint'}`;
}

function estimateEndpointCost(endpoint) {
  const lines = Array.isArray(endpoint?.pricing) ? endpoint.pricing : [];
  const output = lines.find(line => line.billable === 'output_image') || lines[0];
  return output ? Number(output.cost_usd || 0) : null;
}

function buildRouteCapabilityProfile(modelRecord, endpoint) {
  const input = Array.isArray(modelRecord?.architecture?.input_modalities) ? modelRecord.architecture.input_modalities : [];
  const output = Array.isArray(modelRecord?.architecture?.output_modalities) ? modelRecord.architecture.output_modalities : [];
  const endpointParams = endpoint?.supported_parameters || {};
  const modelParams = modelRecord?.supported_parameters || {};
  const endpointProvesImageReference = Boolean(endpointParams.input_references);
  const modelMentionsImageReference = Boolean(modelParams.input_references);
  const supportsImageOutput = output.includes('image');
  const supportsTextToImage = input.includes('text') && supportsImageOutput;
  const supportsImageReference = endpointProvesImageReference;
  const aspect = endpointParams.aspect_ratio || modelParams.aspect_ratio;
  const format = endpointParams.output_format || modelParams.output_format;
  const providerSlug = endpointIdentity(endpoint);
  const capabilitySource = endpointProvesImageReference ? 'live_endpoint_metadata' : modelMentionsImageReference ? 'documented_metadata' : 'documented_metadata';
  const knownUnsupportedFields = [];
  if (!endpointParams.input_references) knownUnsupportedFields.push('input_references');
  if (!endpointParams.n) knownUnsupportedFields.push('n');
  return {
    adapter: 'openrouter',
    providerFamily: providerFamilyForRoute({ id: modelRecord.id, compatible_endpoints: [endpoint] }),
    model: modelRecord.id,
    endpoint: `POST /api/v1/images:${providerSlug}`,
    supportsTextToImage,
    supportsImageReference,
    supportsImageToImage: supportsImageReference,
    supportsImageEditing: supportsImageReference,
    supportsIdentityReference: supportsImageReference,
    supportsImageOutput,
    acceptedImageInputShape: supportsImageReference ? ['input_references[].image_url.url'] : [],
    supportedAspectRatios: descriptorAllows(aspect, '16:9') ? ['16:9'] : [],
    policyCompatibility: 'unknown_until_policy_gate',
    capabilitySource,
    capabilityConfidence: endpointProvesImageReference ? 0.95 : modelMentionsImageReference ? 0.45 : 0.2,
    inputModalities: input,
    outputModalities: output,
    synchronousBehavior: 'synchronous_http_response_or_provider_error',
    responseShape: 'data[0].b64_json image payload',
    knownUnsupportedFields
  };
}

function buildRequiredOperation(aspectRatio = '16:9') {
  return {
    operation: REQUIRED_IMAGE_REFERENCE_OPERATION,
    sourceImageRequired: true,
    imageOutputRequired: true,
    identityReferenceRequired: true,
    aspectRatio: aspectRatio || '16:9'
  };
}

function buildTechnicalRule(name, passed, result, reason, actual, expected = null) {
  return { rule: name, passed, result, reason, actual, expected };
}

function aspectRatioModeForRoute(capability) {
  const ratios = Array.isArray(capability?.supportedAspectRatios) ? capability.supportedAspectRatios : [];
  return ratios.length ? 'ENUMERATED' : 'UNSPECIFIED';
}

function routeDiagnosticBase(route, contentClassification = null) {
  const capability = route.route_capability || {};
  return {
    model: route.id,
    endpoint: capability.endpoint || 'POST /api/v1/images',
    providerFamily: capability.providerFamily || providerFamilyForRoute(route),
    supportsImageReference: Boolean(capability.supportsImageReference),
    supportsImageOutput: Boolean(capability.supportsImageOutput),
    supportsIdentityReference: Boolean(capability.supportsIdentityReference),
    supportedAspectRatios: Array.isArray(capability.supportedAspectRatios) ? capability.supportedAspectRatios : [],
    aspectRatioMode: aspectRatioModeForRoute(capability),
    rawCategory: contentClassification?.rawCategory || null,
    canonicalCategory: contentClassification?.canonicalCategory || null,
    capability
  };
}

function evaluateRouteTechnicalEligibility(route, requiredOperation, contentClassification = null) {
  const capability = route.route_capability || {};
  const ratios = Array.isArray(capability.supportedAspectRatios) ? capability.supportedAspectRatios : [];
  const aspectRatioMode = aspectRatioModeForRoute(capability);
  const technicalRules = [
    buildTechnicalRule('IMAGE_OUTPUT', !(requiredOperation.imageOutputRequired && !capability.supportsImageOutput), capability.supportsImageOutput ? 'PASS' : 'FAIL', capability.supportsImageOutput ? null : 'IMAGE_OUTPUT_NOT_SUPPORTED', capability.supportsImageOutput, true),
    buildTechnicalRule('IMAGE_REFERENCE', !(requiredOperation.sourceImageRequired && !capability.supportsImageReference), capability.supportsImageReference ? 'PASS' : 'FAIL', capability.supportsImageReference ? null : (capability.inputModalities?.includes('image') ? 'UNVERIFIED_IMAGE_INPUT' : 'IMAGE_REFERENCE_NOT_SUPPORTED'), capability.supportsImageReference, true),
    buildTechnicalRule('IDENTITY_REFERENCE', !(requiredOperation.identityReferenceRequired && !capability.supportsIdentityReference), capability.supportsIdentityReference ? 'PASS' : 'FAIL', capability.supportsIdentityReference ? null : 'IDENTITY_REFERENCE_NOT_SUPPORTED', capability.supportsIdentityReference, true),
    aspectRatioMode === 'UNSPECIFIED'
      ? buildTechnicalRule('ASPECT_RATIO', true, 'UNVERIFIED', 'ROUTE_METADATA_DOES_NOT_ENUMERATE_RATIOS', ratios, requiredOperation.aspectRatio)
      : buildTechnicalRule('ASPECT_RATIO', ratios.includes(requiredOperation.aspectRatio), ratios.includes(requiredOperation.aspectRatio) ? 'PASS' : 'FAIL', ratios.includes(requiredOperation.aspectRatio) ? null : 'ASPECT_RATIO_NOT_SUPPORTED', ratios, requiredOperation.aspectRatio)
  ];
  const failed = technicalRules.find(rule => rule.passed === false);
  const rejectionReason = failed?.reason || null;
  console.assert(!(aspectRatioMode === 'UNSPECIFIED' && rejectionReason === 'ASPECT_RATIO_NOT_SUPPORTED'), 'Empty aspect-ratio metadata must not reject as ASPECT_RATIO_NOT_SUPPORTED');
  return {
    ...route,
    eligible: !failed,
    technicalCompatibility: failed ? 0 : 1,
    rejection_reason: rejectionReason,
    aspectRatioMode,
    technicalRules,
    diagnostic: { ...routeDiagnosticBase(route, contentClassification), technicalRules, policyRules: [] }
  };
}

function evaluateRoutesForOperation(routes, requiredOperation, contentClassification = null) {
  const evaluated = routes.map(route => evaluateRouteTechnicalEligibility(route, requiredOperation, contentClassification));
  return {
    eligibleRoutes: evaluated.filter(route => route.eligible),
    rejectedRoutes: evaluated.filter(route => !route.eligible).map(route => ({
      ...route.diagnostic,
      reason: route.rejection_reason,
      technicalCompatibility: route.technicalCompatibility,
      eligible: false
    }))
  };
}

async function discoverCompatibleImageRoutes(apiKey) {
  const catalog = await fetchImageModelCatalog(apiKey);
  const imageModels = catalog.filter(model => {
    const output = model?.architecture?.output_modalities || [];
    return output.includes('image');
  });
  const sorted = imageModels.sort((a, b) => {
    const ai = PREFERRED_IMAGE_MODELS.indexOf(a.id);
    const bi = PREFERRED_IMAGE_MODELS.indexOf(b.id);
    const ar = ai === -1 ? 999 : ai;
    const br = bi === -1 ? 999 : bi;
    return ar - br || String(a.id).localeCompare(String(b.id));
  });
  const limited = sorted.slice(0, 12);
  const concreteRoutes = [];
  for (const model of limited) {
    const endpointResult = await fetchImageModelEndpoints(apiKey, model.id);
    const endpoints = endpointResult.ok ? endpointResult.endpoints : [];
    for (const endpoint of endpoints) {
      const endpointSummary = {
        provider_name: endpoint.provider_name || endpoint.provider_slug || endpoint.provider_tag,
        provider_slug: endpoint.provider_slug || endpoint.provider_tag || endpointIdentity(endpoint),
        provider_tag: endpoint.provider_tag || endpoint.provider_slug || endpointIdentity(endpoint),
        pricing: endpoint.pricing || [],
        supported_parameters: endpoint.supported_parameters || {},
        estimated_cost_usd: estimateEndpointCost(endpoint)
      };
      const capability = buildRouteCapabilityProfile(model, endpointSummary);
      concreteRoutes.push({
        id: model.id,
        route_key: `${model.id}::${endpointSummary.provider_slug}`,
        name: model.name || model.id,
        description: model.description || '',
        architecture: model.architecture || {},
        supported_parameters: model.supported_parameters || {},
        endpoint_count: endpoints.length,
        compatible_endpoint_count: capability.supportsImageReference && capability.supportsImageOutput ? 1 : 0,
        compatible_endpoints: [endpointSummary],
        route_capability: capability
      });
    }
  }
  return concreteRoutes;
}

function buildPhotographicBrief(metadata = {}) {
  const engine = metadata.heroPhotographyEngine || {};
  const plan = metadata.heroPhotographyPlan || engine.hero_photography_plan || {};
  const understanding = metadata.sourceFrameUnderstanding || engine.source_frame_understanding || {};
  const story = plan.Story || metadata.videoTitle || metadata.title || '';
  const emotionalHook = plan.Emotional_Hook || metadata.optionalSubtitle || metadata.subtitle || '';
  const lighting = plan.Lighting || {};
  const brief = plan.Hero_Rendering_Brief || 'Create the hero photograph that would have been captured by a top commercial photographer and advertising art director on a planned shoot.';
  return [
    'HERO PHOTOGRAPHY PLAN',
    'Input: video frame as scouting/reference image.',
    'Output: professional hero photograph.',
    'Never output: enhanced screenshot.',
    '',
    'STEP 1 — UNDERSTAND THE FRAME',
    `Emotional moment: ${understanding.emotional_moment || emotionalHook}`,
    `Visual story: ${understanding.visual_story || story}`,
    `Strongest subject: ${understanding.strongest_subject || 'protected apparent person / subject hierarchy from Blueprint'}`,
    `Weakest visual elements: ${understanding.weakest_visual_elements || 'accidental screenshot limitations'}`,
    `Distractions: ${understanding.distractions || 'compression, clutter, amateur framing, unused canvas'}`,
    `Opportunities: ${understanding.opportunities || 'commercial production design, lighting, depth, atmosphere'}`,
    `Emotional hook: ${understanding.emotional_hook || emotionalHook}`,
    '',
    'STEP 2 — DESIGN THE HERO PHOTO',
    `Camera: ${plan.Camera || 'planned commercial campaign camera, not screenshot perspective'}`,
    `Lens: ${plan.Lens || 'cinematic editorial lens with controlled perspective and premium subject separation'}`,
    `Lighting setup: key=${lighting.key_light || 'large soft directional key'}; fill=${lighting.fill_light || 'controlled low fill'}; rim=${lighting.rim_light || 'subtle separation rim'}; practicals=${lighting.practical_lights || 'motivated cinematic practicals'}`,
    `Negative space and composition: ${plan.Composition || 'intentional typography space away from face, emotional focal point, and storytelling element'}`,
    `Luxury level: ${plan.Luxury_Level || 'Netflix Key Art / Amazon Originals / HBO Campaign / luxury fashion editorial / premium magazine cover'}`,
    `Editorial style: ${plan.Editorial_Style || metadata.campaignName || 'premium commercial editorial'}`,
    '',
    'STEP 3 — REBUILD THE SCENE',
    `Background: ${plan.Background || 'redesigned commercial background that preserves story logic'}`,
    `Environment: ${plan.Environment || 'redesign atmosphere, depth, reflections, texture and production design while preserving identity and emotional intent'}`,
    '',
    'STEP 4 — HERO RENDERING BRIEF',
    brief,
    '',
    'REPORT REQUIREMENT',
    'The generated hero photograph must differ from the original frame through creative reconstruction: planned camera, lens, lighting, production design, environment, background, atmosphere, depth, texture, color contrast and intentional typography space — not simple enhancement.'
  ].filter(Boolean).join('\n');
}

function buildKeyArtPrompt(metadata = {}) {
  const referenceMode = metadata.identityReferenceProvided
    ? 'Reference order: image 1 is IDENTITY ONLY; image 2 is STORY/MOMENT ONLY. Preserve identity from image 1 and story from image 2 where technically possible.'
    : 'Only a Story Reference was supplied. Preserve scene, action, emotion, and visual context.';
  const loopNote = metadata.regenerationDirective ? `\n\nPrevious creative review directive to fix:\n${metadata.regenerationDirective}` : '';
  return `${KEY_ART_DIRECTOR_PROMPT}\n\n${referenceMode}\n\n${buildPhotographicBrief(metadata)}${loopNote}`;
}

function chooseResolution(route, params) {
  if (String(route?.id || '').includes('seedream') && descriptorAllows(params.resolution, '4K')) return '4K';
  if (descriptorAllows(params.resolution, '2K')) return '2K';
  if (descriptorAllows(params.resolution, '1K')) return '1K';
  return null;
}

function buildImagePayload(route, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata, generationJobId) {
  const refs = identityReferenceDataUrl
    ? [
      { type: 'image_url', image_url: { url: identityReferenceDataUrl } },
      { type: 'image_url', image_url: { url: storyReferenceDataUrl } }
    ]
    : [{ type: 'image_url', image_url: { url: storyReferenceDataUrl } }];
  const endpoint = route.compatible_endpoints[0] || {};
  const params = endpoint.supported_parameters || route.supported_parameters || {};
  const providerOrder = route.compatible_endpoints.map(item => item.provider_tag || item.provider_slug).filter(Boolean);
  const payload = {
    model: route.id,
    prompt: buildKeyArtPrompt({ ...metadata, identityReferenceProvided: Boolean(identityReferenceDataUrl) }),
    input_references: refs,
    provider: {
      order: [...new Set(providerOrder)],
      allow_fallbacks: true
    },
    metadata: {
      generation_job_id: generationJobId,
      app: 'fleshlab_ai_photographer'
    }
  };
  const resolution = chooseResolution(route, params);
  if (descriptorAllows(params.aspect_ratio, aspectRatio || '16:9')) payload.aspect_ratio = aspectRatio || '16:9';
  if (descriptorAllows(params.output_format, 'png')) payload.output_format = 'png';
  if (resolution) payload.resolution = resolution;
  if (endpointSupports({ supported_parameters: params }, 'n')) payload.n = 1;
  if (!payload.provider.order.length) delete payload.provider.order;
  return { payload, reference_count: refs.length };
}

function buildPayloadSummary(route, payload, storyReferenceDataUrl, identityReferenceDataUrl) {
  return {
    endpoint: '/api/v1/images',
    model: route.id,
    provider_order: payload.provider?.order || [],
    aspect_ratio: payload.aspect_ratio || 'provider-default',
    resolution: payload.resolution || 'provider-default',
    output_format: payload.output_format || 'provider-default',
    reference_count: payload.input_references.length,
    story_reference_bytes_estimate: estimateBytesFromDataUrl(storyReferenceDataUrl),
    identity_reference_bytes_estimate: identityReferenceDataUrl ? estimateBytesFromDataUrl(identityReferenceDataUrl) : 0
  };
}

async function fetchGenerationMetadata(apiKey, generationId) {
  if (!generationId) return null;
  const res = await openRouterFetch(`/generation?id=${encodeURIComponent(generationId)}`, apiKey, { method: 'GET' }, 30000);
  const { data } = await readJsonResponse(res);
  return res.ok ? data?.data || null : null;
}

async function saveGenerationLog(base44, record) {
  try {
    await base44.asServiceRole.entities.OpenRouterImageGenerationLog.create(record);
  } catch (error) {
    console.warn('OpenRouter generation log save failed', error.message);
  }
}

async function saveRoutingAudit(base44, record) {
  try {
    await base44.asServiceRole.entities.AdultImageRoutingAudit.create({ ...record, created_at: new Date().toISOString() });
  } catch (error) {
    console.warn('Adult image routing audit save failed', error.message);
  }
}

async function saveRenderingAttempt(base44, record) {
  try {
    await base44.asServiceRole.entities.RenderingAttempt.create({ timestamp: new Date().toISOString(), ...record });
  } catch (error) {
    console.warn('Rendering attempt save failed', error.message);
  }
}

function normalizeClassificationCategory(value) {
  const raw = String(value || '').trim();
  const upper = raw.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  if (RENDERING_CLASSIFICATIONS.includes(upper)) return upper;
  if (upper === 'ADULT_COMMERCIAL') return 'ADULT_MARKETING';
  if (upper === 'EDITORIAL_COVER') return 'SAFE_EDITORIAL';
  if (upper === 'COMMERCIAL_PORTRAIT') return 'SAFE_PORTRAIT';
  if (upper === 'ART_DIRECTION') return 'SAFE_BRAND';
  if (upper === 'PRODUCT') return 'SAFE_PRODUCT';
  if (upper === 'FASHION') return 'SAFE_EDITORIAL';
  return '';
}

function deriveFallbackClassification(metadata = {}) {
  const direct = normalizeClassificationCategory(metadata.renderingClassification || metadata.contentClassification);
  if (direct) return direct;
  const legacy = String(metadata.referenceContentClass || '').toUpperCase();
  if (legacy === 'SAFE_MARKETING') return 'SAFE_BRAND';
  if (legacy === 'SUGGESTIVE_ADULT') return 'ADULT_MARKETING';
  if (legacy === 'EXPLICIT_VERIFIED_ADULT') return 'EXPLICIT';
  if (legacy === 'BLOCKED_OR_UNVERIFIED') return 'UNSUPPORTED';
  const contentType = `${metadata.contentType || ''} ${metadata.campaignName || ''} ${metadata.videoTitle || ''}`.toLowerCase();
  if (contentType.includes('explicit') || contentType.includes('hardcore')) return 'EXPLICIT';
  if (contentType.includes('adult') || contentType.includes('sexual')) return 'ADULT_MARKETING';
  if (contentType.includes('fitness')) return 'FITNESS';
  if (contentType.includes('swim')) return 'SWIMWEAR';
  if (contentType.includes('underwear')) return 'UNDERWEAR';
  if (contentType.includes('portrait')) return 'SAFE_PORTRAIT';
  if (contentType.includes('product')) return 'SAFE_PRODUCT';
  if (contentType.includes('lifestyle')) return 'LIFESTYLE';
  return 'SAFE_EDITORIAL';
}

function canonicalCategoryToken(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function normalizeContentClassification(input) {
  const inputObject = input && typeof input === 'object' ? input : null;
  const rawCategory = String(inputObject?.rawCategory || inputObject?.canonicalCategory || inputObject?.category || input || '').trim();
  const token = canonicalCategoryToken(rawCategory);
  const canonicalMap = {
    EXPLICIT: 'EXPLICIT_ADULT',
    EXPLICIT_ADULT: 'EXPLICIT_ADULT',
    EXPLICIT_VERIFIED_ADULT: 'EXPLICIT_ADULT',
    ADULT_COMMERCIAL: 'ADULT_COMMERCIAL',
    ADULT_MARKETING: 'ADULT_COMMERCIAL',
    SAFE_EDITORIAL: 'SAFE_EDITORIAL',
    COMMERCIAL_PORTRAIT: 'SAFE_EDITORIAL',
    EDITORIAL_COVER: 'SAFE_EDITORIAL',
    FASHION: 'SAFE_EDITORIAL',
    FITNESS: 'SAFE_EDITORIAL',
    TRAVEL: 'SAFE_EDITORIAL',
    PRODUCT: 'SAFE_EDITORIAL',
    SAFE_PRODUCT: 'SAFE_EDITORIAL',
    ART_DIRECTION: 'SAFE_EDITORIAL',
    SAFE_BRAND: 'SAFE_EDITORIAL',
    SAFE_PORTRAIT: 'SAFE_EDITORIAL',
    LIFESTYLE: 'SAFE_EDITORIAL',
    SWIMWEAR: 'SAFE_EDITORIAL',
    UNDERWEAR: 'SAFE_EDITORIAL',
    UNSUPPORTED: 'UNSUPPORTED'
  };
  const canonicalCategory = canonicalMap[token] || 'SAFE_EDITORIAL';
  const policyRisk = ['EXPLICIT_ADULT', 'ADULT_COMMERCIAL'].includes(canonicalCategory) ? 'restricted' : canonicalCategory === 'UNSUPPORTED' ? 'blocked' : 'standard';
  const normalized = {
    ...(inputObject || {}),
    rawCategory,
    canonicalCategory,
    category: canonicalCategory,
    source: inputObject?.source || 'backend_classification_normalizer',
    confidence: Number(inputObject?.confidence ?? 0.45),
    policyRisk,
    technicalIntent: inputObject?.technicalIntent || REQUIRED_IMAGE_REFERENCE_OPERATION,
    version: 'provider-intelligence-v3'
  };
  console.assert(!(canonicalCategoryToken(rawCategory) === 'EXPLICIT' && normalized.canonicalCategory !== 'EXPLICIT_ADULT'), 'Raw EXPLICIT must normalize to EXPLICIT_ADULT');
  return normalized;
}

function getCanonicalContentClassification(metadata = {}) {
  const supplied = metadata.providerIntelligence?.contentClassification;
  if (supplied && typeof supplied === 'object') {
    return normalizeContentClassification({ ...supplied, rawCategory: supplied.rawCategory || supplied.category || supplied.canonicalCategory || '', source: supplied.source || 'frontend_provider_intelligence' });
  }
  const suppliedString = supplied || metadata.providerIntelligence?.contentClassificationCategory;
  if (suppliedString) {
    return normalizeContentClassification({ rawCategory: suppliedString, source: 'frontend_provider_intelligence_legacy', confidence: 0.65 });
  }
  const fallback = deriveFallbackClassification(metadata);
  return normalizeContentClassification({ rawCategory: fallback, source: 'backend_fallback_metadata', confidence: 0.45 });
}

function standardVerificationComplete(metadata = {}) {
  const verification = metadata.adultVerification || {};
  return Boolean(verification.allPeopleVerified18Plus && verification.performerConsentConfirmed && verification.mediaRightsConfirmed && verification.platformSourceConfirmed && String(verification.verificationReference || '').trim());
}

function safeUrlHost(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try { return new URL(raw).host.toLowerCase(); } catch (_) { return raw.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase(); }
}

function sanitizeEnvironmentValue(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, '_').slice(0, 80);
}

function collectRuntimeEnvironment(req) {
  const requestUrl = (() => {
    try { return new URL(req?.url || 'http://127.0.0.1'); } catch (_) { return new URL('http://127.0.0.1'); }
  })();
  const headers = req?.headers;
  const originHeader = headers?.get('origin') || '';
  const refererHeader = headers?.get('referer') || '';
  const forwardedHost = headers?.get('x-forwarded-host') || '';
  const forwardedProto = headers?.get('x-forwarded-proto') || '';
  const hostHeader = headers?.get('host') || '';
  const runtimeModeHeader = headers?.get('x-base44-runtime-mode') || headers?.get('x-base44-deployment-mode') || headers?.get('x-base44-environment') || '';
  const deploymentMode = sanitizeEnvironmentValue(runtimeModeHeader);
  const appBaseHost = safeUrlHost(Deno.env.get('APP_BASE_URL'));
  const requestHostname = safeUrlHost(requestUrl.host);
  const hosts = [safeUrlHost(originHeader), safeUrlHost(refererHeader), safeUrlHost(forwardedHost), safeUrlHost(hostHeader), requestHostname, appBaseHost].filter(Boolean);
  const hostText = hosts.join(' ');
  const modeText = `${sanitizeEnvironmentValue(runtimeModeHeader)} ${deploymentMode}`.trim();
  const base44Context = Boolean(Deno.env.get('BASE44_APP_ID')) || hostText.includes('base44') || hostText.includes('builder') || modeText.includes('preview') || modeText.includes('development') || modeText.includes('dev');
  const previewContext = hostText.includes('preview') || modeText.includes('preview') || modeText.includes('development') || modeText.includes('dev') || hostText.includes('localhost') || hostText.includes('127.0.0.1');
  const explicitProduction = modeText.includes('production') || modeText === 'prod' || runtimeModeHeader.toLowerCase() === 'public_production';
  const explicitPrivate = modeText.includes('private_development') || modeText.includes('preview') || modeText.includes('development') || modeText.includes('dev');
  return {
    requestHostname,
    originHost: safeUrlHost(originHeader),
    refererHost: safeUrlHost(refererHeader),
    forwardedHost: safeUrlHost(forwardedHost),
    forwardedProto: sanitizeEnvironmentValue(forwardedProto),
    hostHeader: safeUrlHost(hostHeader),
    appBaseHost,
    runtimeModeHeader: sanitizeEnvironmentValue(runtimeModeHeader),
    deploymentMode,
    base44AppIdPresent: Boolean(Deno.env.get('BASE44_APP_ID')),
    base44Context,
    previewContext,
    explicitPrivate,
    explicitProduction,
    applicationUrlCategory: appBaseHost.includes('fleshlab.online') ? 'configured_public_app_url' : appBaseHost ? 'configured_non_public_app_url' : 'not_configured'
  };
}

function resolveRuntimeMode(runtime) {
  if (runtime.explicitPrivate) return { mode: 'PRIVATE_DEVELOPMENT', reason: 'BASE44_PRIVATE_DEVELOPMENT_RUNTIME' };
  if (runtime.base44Context || runtime.previewContext) return { mode: 'PRIVATE_DEVELOPMENT', reason: 'BASE44_PRIVATE_DEVELOPMENT_RUNTIME' };
  if (runtime.explicitProduction && !runtime.base44Context && !runtime.previewContext) return { mode: 'PUBLIC_PRODUCTION', reason: 'EXPLICIT_PUBLIC_PRODUCTION_RUNTIME' };
  return { mode: 'PRIVATE_DEVELOPMENT', reason: 'BASE44_PRIVATE_DEVELOPMENT_RUNTIME', unknownFallback: true };
}

function privateDevelopmentStatus(req) {
  const runtime = collectRuntimeEnvironment(req);
  const resolved = resolveRuntimeMode(runtime);
  const active = resolved.mode === 'PRIVATE_DEVELOPMENT';
  return {
    active,
    runtime_mode: resolved.mode,
    publicProductionHost: resolved.mode === 'PUBLIC_PRODUCTION',
    platform_source: active ? 'PRIVATE_DEVELOPMENT_SOURCE' : 'PUBLIC_OR_PRODUCTION_SOURCE',
    reason: active ? 'BASE44_PRIVATE_DEVELOPMENT_RUNTIME' : 'STANDARD_VERIFICATION_REQUIRED',
    environment_diagnostics: {
      request_hostname: runtime.requestHostname,
      origin_host: runtime.originHost,
      referer_host: runtime.refererHost,
      forwarded_host: runtime.forwardedHost,
      forwarded_proto: runtime.forwardedProto,
      host_header: runtime.hostHeader,
      base44_app_id_present: runtime.base44AppIdPresent,
      base44_context: runtime.base44Context,
      preview_context: runtime.previewContext,
      runtime_mode_header: runtime.runtimeModeHeader,
      deployment_mode: runtime.deploymentMode,
      application_url_category: runtime.applicationUrlCategory,
      classification_basis: resolved.reason,
      unknown_fallback_to_private_development: Boolean(resolved.unknownFallback)
    }
  };
}

function buildPrivateDevelopmentAttestation(status, timestamp) {
  if (!status?.active) return null;
  return {
    verification_mode: 'PRIVATE_DEVELOPMENT',
    development_attestation: true,
    platform_source: 'PRIVATE_DEVELOPMENT_SOURCE',
    evidence_reference: 'PRIVATE_DEVELOPMENT_SESSION',
    attested_at: timestamp.toISOString()
  };
}

function privateDevelopmentAttestationIsValid(attestation) {
  return Boolean(attestation && attestation.verification_mode === 'PRIVATE_DEVELOPMENT' && attestation.development_attestation === true && attestation.platform_source === 'PRIVATE_DEVELOPMENT_SOURCE' && attestation.evidence_reference === 'PRIVATE_DEVELOPMENT_SESSION' && attestation.attested_at);
}

function verificationPassed(metadata = {}, privateDevelopmentAttestation = null) {
  return standardVerificationComplete(metadata) || privateDevelopmentAttestationIsValid(privateDevelopmentAttestation);
}

function hashAuditPayload(payload) {
  const text = safeJson(payload || {});
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function getRouteProviderKey(route) {
  return String(route?.route_key || route?.id || '').trim();
}

function providerFamilyForRoute(route) {
  const id = String(route?.id || '').toLowerCase();
  const providerText = `${route?.compatible_endpoints?.[0]?.provider_name || ''} ${route?.compatible_endpoints?.[0]?.provider_slug || ''} ${route?.compatible_endpoints?.[0]?.provider_tag || ''}`.toLowerCase();
  if (id.includes('gemini') || providerText.includes('google')) return 'google_gemini';
  if (id.includes('seedream') || providerText.includes('bytedance')) return 'bytedance_seed';
  if (id.includes('gpt-image') || providerText.includes('openai')) return 'openai_image';
  if (id.includes('flux') || providerText.includes('black') || providerText.includes('bfl')) return 'black_forest_labs';
  return String(route?.compatible_endpoints?.[0]?.provider_name || route?.id || 'unknown_provider_family').toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function requestSignature({ storyInfo, identityInfo, contentClassification, aspectRatio, metadata }) {
  const basis = safeJson({
    story_bytes: storyInfo?.byte_length || 0,
    identity_bytes: identityInfo?.byte_length || 0,
    contentClassification,
    aspectRatio,
    campaignName: metadata?.campaignName || '',
    contentType: metadata?.contentType || '',
    title: metadata?.videoTitle || ''
  });
  let hash = 2166136261;
  for (let i = 0; i < basis.length; i += 1) {
    hash ^= basis.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function getRememberedFailure(signature, family) {
  const key = `${signature}:${family}`;
  const item = PROVIDER_FAILURE_MEMORY.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > FAILURE_MEMORY_TTL_MS) {
    PROVIDER_FAILURE_MEMORY.delete(key);
    return null;
  }
  return item;
}

function rememberFailure(signature, family, diagnostic) {
  if (!signature || !family || !diagnostic) return;
  PROVIDER_FAILURE_MEMORY.set(`${signature}:${family}`, {
    category: diagnostic.category,
    retryable: Boolean(diagnostic.retryable),
    first_status: diagnostic.http_status || null,
    message: diagnostic.message || '',
    timestamp: Date.now(),
    ttl_ms: FAILURE_MEMORY_TTL_MS
  });
}

function getRememberedRouteCapabilityMismatch(route, unsupportedOperation = REQUIRED_IMAGE_REFERENCE_OPERATION) {
  const key = `${routeCapabilityKey(route)}::${unsupportedOperation}`;
  const item = ROUTE_CAPABILITY_MEMORY.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > ROUTE_CAPABILITY_MEMORY_TTL_MS) {
    ROUTE_CAPABILITY_MEMORY.delete(key);
    return null;
  }
  return { ...item, ttl_remaining_ms: ROUTE_CAPABILITY_MEMORY_TTL_MS - (Date.now() - item.timestamp) };
}

function rememberRouteCapabilityMismatch(route, unsupportedOperation = REQUIRED_IMAGE_REFERENCE_OPERATION) {
  if (!route) return;
  ROUTE_CAPABILITY_MEMORY.set(`${routeCapabilityKey(route)}::${unsupportedOperation}`, {
    model: route.id,
    endpoint: route.route_capability?.endpoint || 'POST /api/v1/images',
    providerFamily: providerFamilyForRoute(route),
    unsupportedOperation,
    timestamp: Date.now(),
    ttl: ROUTE_CAPABILITY_MEMORY_TTL_MS
  });
}

function applyRouteCapabilityMemory(routes, contentClassification = null) {
  const eligibleRoutes = [];
  const rejectedRoutes = [];
  for (const route of routes) {
    const remembered = getRememberedRouteCapabilityMismatch(route, REQUIRED_IMAGE_REFERENCE_OPERATION);
    if (remembered) {
      rejectedRoutes.push({
        ...routeDiagnosticBase(route, contentClassification),
        reason: 'IMAGE_REFERENCE_NOT_SUPPORTED',
        technicalCompatibility: 0,
        eligible: false,
        technicalRules: route.technicalRules || [],
        policyRules: [],
        capabilityMemory: remembered
      });
    } else {
      eligibleRoutes.push(route);
    }
  }
  return { eligibleRoutes, rejectedRoutes };
}

function routeProviderName(route) {
  return route?.name || route?.id || 'Rendering Pipeline';
}

function maxResolutionForRoute(route) {
  const endpoint = route?.compatible_endpoints?.[0] || {};
  const params = endpoint.supported_parameters || route?.supported_parameters || {};
  if (descriptorAllows(params.resolution, '4K')) return '4K';
  if (descriptorAllows(params.resolution, '2K')) return '2K';
  return '1K';
}

function inferRouteCategories(route) {
  const text = `${route?.id || ''} ${route?.name || ''} ${route?.description || ''}`.toLowerCase();
  const categories = new Set(DEFAULT_SAFE_CATEGORIES);
  if (text.includes('seedream')) categories.add('ADULT_MARKETING');
  if (text.includes('portrait')) categories.add('SAFE_PORTRAIT');
  if (text.includes('product')) categories.add('SAFE_PRODUCT');
  return Array.from(categories);
}

function recommendedUsageForRoute(route) {
  const categories = inferRouteCategories(route);
  return categories.includes('ADULT_MARKETING')
    ? 'High-priority production pipeline for verified adult marketing references when governance checks pass.'
    : 'General safe editorial production pipeline. Edit supported categories before routing adult marketing or explicit requests.';
}

async function ensureRenderingProviderRegistry(base44, routes) {
  const existing = await base44.asServiceRole.entities.RenderingProvider.list('priority', 500).catch(() => []);
  const existingById = new Map((existing || []).map(provider => [String(provider.provider_id || ''), provider]));
  const missing = routes.filter(route => !existingById.has(getRouteProviderKey(route))).slice(0, 12).map((route, index) => ({
    provider_name: routeProviderName(route),
    provider_id: getRouteProviderKey(route),
    supported_categories: inferRouteCategories(route),
    supportedCanonicalCategories: canonicalCategoriesFromLegacy(inferRouteCategories(route)),
    unsupportedCanonicalCategories: [],
    estimated_quality: Math.max(70, 92 - index * 2),
    estimated_cost: Number(route.compatible_endpoints?.[0]?.estimated_cost_usd || 0),
    average_runtime_ms: 0,
    historical_success_rate: 0,
    historical_policy_reject_rate: 0,
    maximum_resolution: maxResolutionForRoute(route),
    current_availability: 'available',
    priority: 50 + Math.max(0, 20 - index),
    enabled: true,
    recommended_usage: recommendedUsageForRoute(route)
  }));
  if (missing.length) await base44.asServiceRole.entities.RenderingProvider.bulkCreate(missing).catch(error => console.warn('Rendering provider registry seed failed', error.message));
  return await base44.asServiceRole.entities.RenderingProvider.list('priority', 500).catch(() => existing || []);
}

async function loadRenderingHistory(base44) {
  return await base44.asServiceRole.entities.RenderingAttempt.list('-created_date', 500).catch(() => []);
}

function canonicalCategoriesFromLegacy(categories = []) {
  return [...new Set((Array.isArray(categories) ? categories : []).map(category => normalizeContentClassification({ rawCategory: category, source: 'provider_registry' }).canonicalCategory))];
}

function providerSupportsClassification(provider, classification) {
  const canonicalCategory = typeof classification === 'object' ? classification.canonicalCategory : normalizeContentClassification(classification).canonicalCategory;
  const supportedCanonicalCategories = Array.isArray(provider?.supportedCanonicalCategories) && provider.supportedCanonicalCategories.length
    ? provider.supportedCanonicalCategories
    : canonicalCategoriesFromLegacy(provider?.supported_categories || []);
  const unsupportedCanonicalCategories = Array.isArray(provider?.unsupportedCanonicalCategories) ? provider.unsupportedCanonicalCategories : [];
  const baseRules = [
    { rule: 'PROVIDER_EXISTS', result: provider ? 'PASS' : 'FAIL', reason: provider ? null : 'PROVIDER_REGISTRY_ENTRY_MISSING' },
    { rule: 'PROVIDER_ENABLED', result: provider?.enabled ? 'PASS' : 'FAIL', reason: provider?.enabled ? null : 'PROVIDER_DISABLED' },
    { rule: 'PROVIDER_AVAILABLE', result: provider?.current_availability !== 'unavailable' ? 'PASS' : 'FAIL', reason: provider?.current_availability !== 'unavailable' ? null : 'PROVIDER_UNAVAILABLE' }
  ];
  const unsupportedMatch = unsupportedCanonicalCategories.includes(canonicalCategory);
  const supportedMatch = supportedCanonicalCategories.includes(canonicalCategory);
  const categoryRule = unsupportedMatch
    ? { rule: 'CANONICAL_CATEGORY_POLICY', result: 'FAIL', reason: 'CATEGORY_EXPLICITLY_UNSUPPORTED', canonicalCategory, supportedCanonicalCategories, unsupportedCanonicalCategories }
    : supportedMatch
      ? { rule: 'CANONICAL_CATEGORY_POLICY', result: 'PASS', reason: null, canonicalCategory, supportedCanonicalCategories, unsupportedCanonicalCategories }
      : { rule: 'CANONICAL_CATEGORY_POLICY', result: 'POLICY_COMPATIBILITY_UNKNOWN', reason: 'CATEGORY_NOT_SUPPORTED', canonicalCategory, supportedCanonicalCategories, unsupportedCanonicalCategories };
  const rules = [...baseRules, categoryRule];
  const pass = Boolean(provider && provider.enabled && provider.current_availability !== 'unavailable' && categoryRule.result === 'PASS');
  return { pass, result: categoryRule.result, reason: pass ? null : (rules.find(rule => rule.result === 'FAIL')?.reason || categoryRule.reason), supportedCanonicalCategories, unsupportedCanonicalCategories, policyRules: rules };
}

function historyStats(attempts, providerId, classification) {
  const rows = attempts.filter(row => row.provider_id === providerId && row.classification === classification);
  if (!rows.length) return null;
  const total = rows.length;
  const success = rows.filter(row => row.result === 'success').length;
  const policyReject = rows.filter(row => row.result === 'policy_reject').length;
  const runtimeRows = rows.filter(row => Number(row.runtime_ms || 0) > 0);
  const costRows = rows.filter(row => Number(row.cost || 0) > 0);
  return {
    total,
    successRate: (success / total) * 100,
    policyRejectRate: (policyReject / total) * 100,
    averageRuntimeMs: runtimeRows.length ? runtimeRows.reduce((sum, row) => sum + Number(row.runtime_ms || 0), 0) / runtimeRows.length : 0,
    averageCost: costRows.length ? costRows.reduce((sum, row) => sum + Number(row.cost || 0), 0) / costRows.length : 0
  };
}

function scoreRenderingRoute(route, provider, stats) {
  const predictedSuccess = stats ? stats.successRate : Number(provider.historical_success_rate || 72);
  const quality = Number(provider.estimated_quality || 70);
  const reliability = Math.max(0, 100 - (stats ? stats.policyRejectRate : Number(provider.historical_policy_reject_rate || 20)));
  const runtimeMs = stats?.averageRuntimeMs || Number(provider.average_runtime_ms || 60000);
  const runtimeScore = Math.max(0, 100 - Math.min(100, runtimeMs / 1800));
  const cost = stats?.averageCost || Number(provider.estimated_cost || route.compatible_endpoints?.[0]?.estimated_cost_usd || 0);
  const costScore = Math.max(0, 100 - Math.min(100, cost * 1000));
  const priority = Math.min(10, Math.max(0, Number(provider.priority || 50) / 10));
  return Number((predictedSuccess * ROUTING_WEIGHTS.policy + quality * ROUTING_WEIGHTS.quality + reliability * ROUTING_WEIGHTS.reliability + runtimeScore * ROUTING_WEIGHTS.runtime + costScore * ROUTING_WEIGHTS.cost + priority).toFixed(3));
}

async function rankRenderingRoutes(base44, routes, classification, contentClassification = null) {
  const providers = await ensureRenderingProviderRegistry(base44, routes);
  const providerMap = new Map(providers.map(provider => [String(provider.provider_id || ''), provider]));
  const attempts = await loadRenderingHistory(base44);
  const rejectedRoutes = [];
  const ranked = routes.map(route => {
    const provider = providerMap.get(getRouteProviderKey(route));
    const policyEvaluation = providerSupportsClassification(provider, classification);
    if (!policyEvaluation.pass) {
      rejectedRoutes.push({
        ...routeDiagnosticBase(route, contentClassification),
        reason: policyEvaluation.reason || 'CATEGORY_NOT_SUPPORTED',
        technicalCompatibility: route.technicalCompatibility ?? 1,
        eligible: false,
        policyCompatibility: policyEvaluation.result,
        technicalRules: route.technicalRules || [],
        policyRules: policyEvaluation.policyRules,
        supportedCanonicalCategories: policyEvaluation.supportedCanonicalCategories,
        unsupportedCanonicalCategories: policyEvaluation.unsupportedCanonicalCategories
      });
      return null;
    }
    const stats = historyStats(attempts, provider.provider_id, classification);
    return { route, provider, stats, routing_score: scoreRenderingRoute(route, provider, stats), policyRules: policyEvaluation.policyRules };
  }).filter(Boolean).sort((a, b) => b.routing_score - a.routing_score || Number(b.provider.priority || 0) - Number(a.provider.priority || 0));
  return { routes: ranked.map(item => item.route), ranked, rejectedRoutes };
}

async function filterRoutesForPolicy(base44, routes, classification, generationJobId, metadata, verificationContext = {}) {
  const privateDevelopmentAttestation = verificationContext.privateDevelopmentAttestation || null;
  if (classification === 'UNSUPPORTED') {
    return { ok: false, status: 409, code: 'VERIFICATION_REQUIRED', routes: [], policyCompatible: 'no', reason: 'Selected frame is blocked or unverified. No external production request was sent.', verificationMode: privateDevelopmentAttestation ? 'PRIVATE_DEVELOPMENT' : 'STANDARD' };
  }
  if (['ADULT_COMMERCIAL', 'EXPLICIT_ADULT'].includes(classification) && !verificationPassed(metadata, privateDevelopmentAttestation)) {
    return { ok: false, status: 409, code: 'VERIFICATION_REQUIRED', routes: [], policyCompatible: 'no', reason: 'Verified adult, consent, media-rights, platform-source, and evidence reference are required before external production.', verificationMode: 'STANDARD' };
  }
  return { ok: true, routes, policyCompatible: ['ADULT_COMMERCIAL', 'EXPLICIT_ADULT'].includes(classification) ? 'restricted' : 'yes', reason: 'Rendering Intelligence will rank enabled compatible production pipelines before sending a request.', verificationMode: privateDevelopmentAttestation ? 'PRIVATE_DEVELOPMENT' : standardVerificationComplete(metadata) ? 'STANDARD' : 'NOT_REQUIRED' };
}

async function callOpenRouterImage(apiKey, route, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata, generationJobId) {
  const startedAt = Date.now();
  const { payload } = buildImagePayload(route, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata, generationJobId);
  const payloadSummary = buildPayloadSummary(route, payload, storyReferenceDataUrl, identityReferenceDataUrl);
  let res;
  try {
    res = await openRouterFetch('/images', apiKey, {
      method: 'POST',
      headers: { 'Idempotency-Key': generationJobId },
      body: JSON.stringify(payload)
    }, 180000);
  } catch (error) {
    const diagnostic = {
      http_status: null,
      openrouter_code: error.message === 'timeout' ? 'timeout' : 'request_failed',
      message: error.message,
      category: error.message === 'timeout' ? 'TIMEOUT' : 'PROVIDER_FAILURE',
      retryable: true,
      provider: null,
      request_id: null,
      generation_id: null,
      processing_began: false,
      payload_summary: payloadSummary,
      runtime_ms: Date.now() - startedAt
    };
    throw new Error(safeJson(diagnostic));
  }
  const { text, data } = await readJsonResponse(res);
  if (!res.ok) {
    const diagnostic = parseOpenRouterError(res.status, text, res.headers, payloadSummary);
    diagnostic.runtime_ms = Date.now() - startedAt;
    throw new Error(safeJson(diagnostic));
  }
  const first = data?.data?.[0];
  if (!first?.b64_json) {
    const diagnostic = {
      http_status: res.status,
      openrouter_code: 'malformed_image_response',
      message: 'OpenRouter returned no image data.',
      category: 'PROVIDER_FAILURE',
      retryable: true,
      provider: data?.openrouter_metadata?.provider_name || null,
      request_id: res.headers.get('x-request-id') || res.headers.get('x-openrouter-request-id') || data?.openrouter_metadata?.request_id || null,
      generation_id: data?.id || data?.generation_id || null,
      processing_began: true,
      raw_response: text.slice(0, 6000),
      payload_summary: payloadSummary,
      runtime_ms: Date.now() - startedAt
    };
    throw new Error(safeJson(diagnostic));
  }
  const mediaType = first.media_type || 'image/png';
  const generationId = data?.id || data?.generation_id || data?.data?.id || null;
  const requestId = res.headers.get('x-request-id') || res.headers.get('x-openrouter-request-id') || data?.openrouter_metadata?.request_id || null;
  const generationMetadata = await fetchGenerationMetadata(apiKey, generationId).catch(() => null);
  return {
    image_data_url: `data:${mediaType};base64,${first.b64_json}`,
    media_type: mediaType,
    usage: data?.usage || null,
    cost: Number(data?.usage?.cost ?? generationMetadata?.total_cost ?? generationMetadata?.usage ?? 0),
    request_id: requestId || generationMetadata?.request_id || null,
    generation_id: generationId || generationMetadata?.id || null,
    resolved_provider: generationMetadata?.provider_name || data?.openrouter_metadata?.provider_name || route.compatible_endpoints[0]?.provider_name || null,
    generation_metadata: generationMetadata,
    payload_summary: payloadSummary,
    runtime_ms: Date.now() - startedAt,
    raw_response_summary: {
      created: data?.created || null,
      data_count: Array.isArray(data?.data) ? data.data.length : 0,
      usage: data?.usage || null,
      openrouter_metadata: data?.openrouter_metadata || null
    }
  };
}

async function getMonthlyOpenRouterSpend(base44) {
  const month = new Date().toISOString().slice(0, 7);
  try {
    const records = await base44.asServiceRole.entities.OpenRouterImageGenerationLog.filter({ month, status: 'succeeded' }, '-created_date', 500);
    return Number(records.reduce((sum, record) => sum + Number(record.cost_usd || 0), 0).toFixed(6));
  } catch (_) {
    return null;
  }
}

async function auditOpenRouter(base44, apiKey) {
  const [credits, routes, monthlySpend] = await Promise.all([
    fetchCredits(apiKey).catch(error => ({ ok: false, diagnostic: { message: error.message } })),
    discoverCompatibleImageRoutes(apiKey).catch(error => {
      let diagnostic;
      try { diagnostic = JSON.parse(error.message); } catch (_) { diagnostic = { message: error.message }; }
      return { error: diagnostic };
    }),
    getMonthlyOpenRouterSpend(base44)
  ]);
  const discoveredRoutes = Array.isArray(routes) ? routes : [];
  const routeEvaluation = evaluateRoutesForOperation(discoveredRoutes, buildRequiredOperation('16:9'));
  const compatibleRoutes = routeEvaluation.eligibleRoutes;
  if (compatibleRoutes.length) await ensureRenderingProviderRegistry(base44, compatibleRoutes);
  const preferred = compatibleRoutes[0] || null;
  const estimatedCost = preferred?.compatible_endpoints?.[0]?.estimated_cost_usd ?? null;
  return {
    ok: true,
    openrouter_connected: Boolean(credits.ok),
    paid_credits_available: Boolean(credits.ok && credits.sufficient_credit),
    image_generation_available: compatibleRoutes.length > 0,
    credits: credits.ok ? {
      remaining_credit: credits.remaining_credit,
      sufficient_credit: credits.sufficient_credit,
      low_credit_warning: credits.low_credit_warning
    } : { sufficient_credit: false },
    rendering_intelligence_ready: compatibleRoutes.length > 0,
    compatible_pipeline_count: compatibleRoutes.length,
    discovered_route_count: discoveredRoutes.length,
    rejected_route_count: routeEvaluation.rejectedRoutes.length,
    provider_registry_populated: compatibleRoutes.length > 0,
    estimated_generation_cost: estimatedCost,
    monthly_openrouter_spend_usd: monthlySpend
  };
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function runProductionQA(base44, payload) {
  try {
    const response = await base44.functions.invoke('productionQAEngine', payload);
    return response.data;
  } catch (error) {
    console.warn('Production QA handoff failed', error.message);
    return {
      ok: false,
      final_decision: 'REVISION REQUIRED',
      production_approved: false,
      publishing_gate_pass: false,
      public_summary: {
        status: 'Revision Required',
        message: 'Production QA could not complete automatically. Publishing blocked until review.'
      }
    };
  }
}

async function runOpenRouterSelfTest(base44, apiKey, user, req) {
  const testImageUrl = 'https://picsum.photos/seed/fleshlab-openrouter-pipeline/1280/720.jpg';
  const imageRes = await fetch(testImageUrl);
  if (!imageRes.ok) return json({ ok: false, error: 'Could not fetch the self-test reference image.', status: imageRes.status }, 502);
  const buffer = await imageRes.arrayBuffer();
  const dataUrl = `data:image/jpeg;base64,${arrayBufferToBase64(buffer)}`;
  return await generateCover(base44, apiKey, {
    action: 'generate',
    consent: true,
    generation_job_id: `self-test-${crypto.randomUUID()}`,
    story_reference_data_url: dataUrl,
    aspect_ratio: '16:9',
    metadata: {
      videoTitle: 'OpenRouter paid pipeline self-test',
      optionalSubtitle: 'Server-side JPEG reference validation',
      performerName: 'studio subject',
      contentType: 'professional promotional still',
      campaignName: 'technical pipeline validation'
    }
  }, user, req);
}

async function generateCover(base44, apiKey, body, user, req) {
  const generationJobId = body?.generation_job_id || crypto.randomUUID();
  const { frame_data_url, story_reference_data_url, identity_reference_data_url, consent, aspect_ratio = '16:9', metadata = {} } = body || {};
  const storyReferenceDataUrl = story_reference_data_url || frame_data_url;
  const identityReferenceDataUrl = identity_reference_data_url || null;
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const storyInfo = parseDataUrlInfo(storyReferenceDataUrl);
  const identityInfo = identityReferenceDataUrl ? parseDataUrlInfo(identityReferenceDataUrl) : { ok: true, byte_length: 0 };
  const contentClassification = getCanonicalContentClassification(metadata);
  const classificationCategory = contentClassification.canonicalCategory;
  console.assert(!(contentClassification.rawCategory === 'EXPLICIT' && classificationCategory !== 'EXPLICIT_ADULT'), 'Raw EXPLICIT must reach the route path as EXPLICIT_ADULT');
  const requiredOperation = buildRequiredOperation(aspect_ratio);
  const privateDevelopment = privateDevelopmentStatus(req);
  const privateDevelopmentAttestation = buildPrivateDevelopmentAttestation(privateDevelopment, now);
  const blueprintExecutionHash = metadata.blueprintExecutionHash || hashAuditPayload({ productionBlueprint: metadata.productionBlueprint || null, heroPhotographyPlan: metadata.heroPhotographyPlan || metadata.heroPhotographyEngine?.hero_photography_plan || null, contentClassification });
  if (!consent) return json({ ok: false, error: 'The professional hero photograph could not be produced yet.', code: 'consent_required' }, 400);
  if (!storyInfo.ok || storyInfo.byte_length <= 0) return json({ ok: false, error: 'Story frame encoding failed. Choose another frame and try again.', code: 'invalid_story_frame', diagnostics: { category: 'INVALID_PAYLOAD', message: 'Story reference is not a valid base64 image data URL or has zero bytes.' } }, 400);
  if (storyInfo.byte_length > MAX_REFERENCE_BYTES || String(storyReferenceDataUrl).length > MAX_DATA_URL_CHARS) return json({ ok: false, error: 'Choose a smaller story frame before producing the professional hero photograph.', code: 'image_too_large' }, 413);
  if (!identityInfo.ok || identityInfo.byte_length > MAX_REFERENCE_BYTES) return json({ ok: false, error: 'Choose a different identity reference before producing the professional hero photograph.', code: 'identity_image_invalid' }, 413);

  const credits = await fetchCredits(apiKey);
  if (!credits.ok || !credits.sufficient_credit) {
    const diagnostic = credits.diagnostic || { category: 'NO_CREDITS', message: 'OpenRouter credits are unavailable.', retryable: false };
    logProviderDiagnostic('OpenRouter health check failed before generation', diagnostic);
    return json({ ok: false, error: publicFailureMessage(diagnostic), code: 'openrouter_health_check_failed', diagnostics: diagnostic }, 402);
  }

  const discoveredRoutes = await discoverCompatibleImageRoutes(apiKey);
  const technicalEvaluation = evaluateRoutesForOperation(discoveredRoutes, requiredOperation, contentClassification);
  const memoryEvaluation = applyRouteCapabilityMemory(technicalEvaluation.eligibleRoutes, contentClassification);
  const capabilityRejectedRoutes = [...technicalEvaluation.rejectedRoutes, ...memoryEvaluation.rejectedRoutes];
  if (!memoryEvaluation.eligibleRoutes.length) {
    const diagnostic = { category: 'NO_COMPATIBLE_PROVIDER_AVAILABLE', message: 'No concrete OpenRouter route proves support for the required image-reference operation.', retryable: false };
    logProviderDiagnostic('OpenRouter route capability discovery failed', diagnostic);
    return json({
      ok: false,
      error: publicFailureMessage(diagnostic),
      code: 'NO_COMPATIBLE_PROVIDER_AVAILABLE',
      stage: 'Provider Intelligence',
      requiredOperation,
      contentClassification,
      content_classification: classificationCategory,
      eligibleRoutes: 0,
      rejectedRoutes: capabilityRejectedRoutes,
      requestSent: false,
      request_sent: false,
      output_received: false,
      diagnostics: diagnostic,
      provider_intelligence: { stage: 'Provider Intelligence', contentClassification, requiredOperation, routeCapabilities: discoveredRoutes.map(route => route.route_capability), rejectedRoutes: capabilityRejectedRoutes },
      verification_mode: privateDevelopmentAttestation ? 'PRIVATE_DEVELOPMENT' : 'STANDARD',
      private_development_mode: privateDevelopment,
      development_attestation: privateDevelopmentAttestation
    }, 409);
  }

  const policyRouting = await filterRoutesForPolicy(base44, memoryEvaluation.eligibleRoutes, classificationCategory, generationJobId, metadata, { privateDevelopmentAttestation });
  if (!policyRouting.ok) {
    return json({
      ok: false,
      error: policyRouting.reason,
      code: policyRouting.code,
      generation_job_id: generationJobId,
      contentClassification,
      content_classification: classificationCategory,
      policy_compatible: policyRouting.policyCompatible,
      verification_mode: policyRouting.verificationMode,
      private_development_mode: privateDevelopment,
      development_attestation: privateDevelopmentAttestation,
      request_sent: false,
      output_received: false,
      diagnostics: {
        category: policyRouting.code,
        http_status: null,
        openrouter_code: null,
        openrouter_error_message: policyRouting.reason,
        message: policyRouting.reason,
        model: null,
        provider: null,
        request_reached_provider: false,
        rejection_type: 'verification_or_policy_gate',
        policy_compatible: policyRouting.policyCompatible,
        retryable: false
      },
      photographer_attempts: [],
      attempt_diagnostics: [],
      stage_trace: { frame_extracted: true, image_encoded: true, payload_created: false, request_sent: false, response_received: false, hero_image_decoded: false, preview_rendered: false }
    }, policyRouting.status);
  }

  const routingPlan = await rankRenderingRoutes(base44, policyRouting.routes, classificationCategory, contentClassification);
  const allRejectedRoutes = [...capabilityRejectedRoutes, ...routingPlan.rejectedRoutes];
  if (!routingPlan.routes.length) {
    const diagnostic = { category: 'NO_COMPATIBLE_PROVIDER_AVAILABLE', reason: 'CATEGORY_NOT_SUPPORTED', message: 'No approved route explicitly supports the canonical content category.', retryable: false };
    await saveRoutingAudit(base44, {
      generation_job_id: generationJobId,
      content_classification: classificationCategory,
      verification_status: ['ADULT_COMMERCIAL', 'EXPLICIT_ADULT'].includes(classificationCategory) ? 'passed' : 'not_required',
      verification_reference: metadata.adultVerification?.verificationReference || '',
      routing_decision: 'NO_COMPATIBLE_RENDERING_PIPELINE',
      policy_compatible: 'no',
      request_sent: false,
      output_received: false,
      reason: diagnostic.message
    });
    return json({ ok: false, error: publicFailureMessage(diagnostic), code: 'NO_COMPATIBLE_PROVIDER_AVAILABLE', stage: 'Provider Intelligence', generation_job_id: generationJobId, requiredOperation, contentClassification, content_classification: classificationCategory, eligibleRoutes: 0, rejectedRoutes: allRejectedRoutes, requestSent: false, request_sent: false, output_received: false, diagnostics: diagnostic, verification_mode: privateDevelopmentAttestation ? 'PRIVATE_DEVELOPMENT' : 'STANDARD', private_development_mode: privateDevelopment, development_attestation: privateDevelopmentAttestation, provider_intelligence: { stage: 'Provider Intelligence', contentClassification, requiredOperation, routeCapabilities: discoveredRoutes.map(route => route.route_capability), rejectedRoutes: allRejectedRoutes }, photographer_attempts: [], attempt_diagnostics: [], stage_trace: { frame_extracted: true, image_encoded: true, payload_created: false, request_sent: false, response_received: false, hero_image_decoded: false, preview_rendered: false } }, 409);
  }

  await saveRoutingAudit(base44, {
    generation_job_id: generationJobId,
    content_classification: classificationCategory,
    verification_status: ['ADULT_COMMERCIAL', 'EXPLICIT_ADULT'].includes(classificationCategory) ? 'passed' : 'not_required',
    verification_reference: metadata.adultVerification?.verificationReference || '',
    routing_decision: 'RANKED_PRODUCTION_PIPELINE',
    policy_compatible: policyRouting.policyCompatible,
    request_sent: true,
    output_received: false,
    reason: policyRouting.reason,
    attempts_json: safeJson(routingPlan.ranked.map(item => ({ provider_id: item.provider.provider_id, score: item.routing_score, predicted_success: item.stats?.successRate ?? item.provider.historical_success_rate ?? 72 })))
  });

  const attempts = [];
  const attemptDiagnostics = [];
  const skippedRoutes = [];
  const failedPolicyFamilies = new Set();
  const requestFingerprint = requestSignature({ storyInfo, identityInfo, contentClassification: classificationCategory, aspectRatio: aspect_ratio, metadata });
  let executedAttempts = 0;
  let finalDiagnostic = null;
  for (const route of routingPlan.routes) {
    const providerFamily = providerFamilyForRoute(route);
    const rememberedFailure = getRememberedFailure(requestFingerprint, providerFamily);
    if (rememberedFailure && rememberedFailure.category === 'CONTENT_POLICY' && rememberedFailure.retryable === false) {
      skippedRoutes.push({ model: route.id, provider_family: providerFamily, reason: 'remembered non-retryable provider-family policy failure', category: rememberedFailure.category, failure_memory_fingerprint: requestFingerprint, ttl_remaining_ms: FAILURE_MEMORY_TTL_MS - (Date.now() - rememberedFailure.timestamp) });
      continue;
    }
    if (failedPolicyFamilies.has(providerFamily)) {
      skippedRoutes.push({ model: route.id, provider_family: providerFamily, reason: 'equivalent provider family with identical non-retryable policy failure', category: 'CONTENT_POLICY', failure_memory_fingerprint: requestFingerprint, ttl_remaining_ms: FAILURE_MEMORY_TTL_MS });
      continue;
    }
    if (executedAttempts >= MAX_AUTOMATIC_ATTEMPTS) {
      skippedRoutes.push({ model: route.id, provider_family: providerFamily, reason: 'maximum non-equivalent provider attempts reached' });
      continue;
    }
    executedAttempts += 1;
    try {
      const result = await callOpenRouterImage(apiKey, route, storyReferenceDataUrl, identityReferenceDataUrl, aspect_ratio, metadata, generationJobId);
      await saveGenerationLog(base44, {
        generation_job_id: generationJobId,
        openrouter_request_id: result.request_id || '',
        openrouter_generation_id: result.generation_id || '',
        model: route.id,
        provider: result.resolved_provider || '',
        status: 'succeeded',
        http_status: 200,
        processing_began: true,
        cost_usd: result.cost || 0,
        usage_json: safeJson(result.usage),
        diagnostic_json: safeJson(result.raw_response_summary),
        payload_summary_json: safeJson(result.payload_summary),
        month
      });
      await saveRenderingAttempt(base44, {
        generation_job_id: generationJobId,
        campaign: metadata.campaignName || metadata.videoTitle || '',
        frame_id: metadata.frameId || '',
        classification: classificationCategory,
        provider: routeProviderName(route),
        provider_id: getRouteProviderKey(route),
        result: 'success',
        success: true,
        runtime_ms: Number(result.runtime_ms || 0),
        cost: Number(result.cost || 0),
        quality_score: 0,
        manual_rating: 0,
        diagnostic_json: safeJson({ fallback_used: attempts.length > 0 })
      });
      console.info('OpenRouter AI Photographer success', safeJson({
        endpoint: 'POST /api/v1/images',
        model: route.id,
        provider: result.resolved_provider,
        request_id: result.request_id,
        generation_id: result.generation_id,
        cost_usd: result.cost,
        payload_summary: result.payload_summary
      }));
      await saveRoutingAudit(base44, {
        generation_job_id: generationJobId,
        content_classification: classificationCategory,
        verification_status: ['ADULT_COMMERCIAL', 'EXPLICIT_ADULT'].includes(classificationCategory) ? 'passed' : 'not_required',
        verification_reference: metadata.adultVerification?.verificationReference || '',
        routing_decision: 'OUTPUT_RECEIVED',
        selected_provider: result.resolved_provider || '',
        selected_model: route.id,
        policy_compatible: policyRouting.policyCompatible,
        request_sent: true,
        output_received: true,
        reason: 'Generated hero photograph returned successfully.',
        attempts_json: safeJson([...attemptDiagnostics, { model: route.id, provider: result.resolved_provider, http_status: 200, output_received: true }])
      });
      const productionQA = await runProductionQA(base44, {
        action: 'evaluate',
        asset_id: generationJobId,
        generation_job_id: generationJobId,
        campaign: metadata.campaignName || metadata.videoTitle || '',
        creative_brief: buildPhotographicBrief(metadata),
        reference_frame_data_url: identityReferenceDataUrl || storyReferenceDataUrl,
        generated_asset_data_url: result.image_data_url,
        rendering_specification: {
          aspect_ratio,
          content_classification: classificationCategory,
          campaign: metadata.campaignName || '',
          hero_photography_plan: metadata.heroPhotographyPlan || metadata.heroPhotographyEngine?.hero_photography_plan || null,
          reconstruction_required: true,
          forbidden_output: 'enhanced screenshot',
          creative_approval_pass: Boolean(metadata.creativeApprovalPass || metadata.creative_approval_pass),
          executive_approval_pass: Boolean(metadata.executiveApprovalPass || metadata.executive_approval_pass),
          governance_valid: policyRouting.policyCompatible !== 'no'
        },
        creative_approval_pass: Boolean(metadata.creativeApprovalPass || metadata.creative_approval_pass),
        executive_approval_pass: Boolean(metadata.executiveApprovalPass || metadata.executive_approval_pass),
        governance_valid: policyRouting.policyCompatible !== 'no',
        provider_id: getRouteProviderKey(route)
      });
      return json({
        ok: true,
        generated_image_data_url: result.image_data_url,
        media_type: result.media_type,
        generation_job_id: generationJobId,
        model: route.id,
        selected_model: route.id,
        provider_family: providerFamilyForRoute(route),
        route_capability: route.route_capability || null,
        private_development_mode: privateDevelopment,
        development_attestation: privateDevelopmentAttestation,
        verification_mode: policyRouting.verificationMode,
        cost_reported: result.cost,
        routing_pipeline: 'best_production_pipeline_selected',
        production_memory_recorded: true,
        production_qa: productionQA,
        publishing_gate_pass: Boolean(productionQA?.publishing_gate_pass),
        fallback_used: attempts.length > 0,
        photographer_attempts: [...attempts.map(item => ({ status: item.status, category: item.category || null, retryable: Boolean(item.retryable) })), { status: 'accepted' }],
        attempt_diagnostics: [...attemptDiagnostics.map(item => ({ category: item.category || null, provider_family: item.provider_family || null, retryable: Boolean(item.retryable), output_received: Boolean(item.output_received) })), {
          category: null,
          provider_family: providerFamilyForRoute(route),
          policy_compatible: policyRouting.policyCompatible,
          retryable: false,
          cost: result.cost || 0,
          output_received: true
        }],
        provider_intelligence: {
          stage: 'Provider Intelligence',
          selectedProvider: result.resolved_provider || routeProviderName(route),
          providerFamily: providerFamilyForRoute(route),
          attemptedModels: [...attempts.map(item => item.model), route.id],
          firstFailure: attemptDiagnostics[0] ? { category: attemptDiagnostics[0].category, retryable: Boolean(attemptDiagnostics[0].retryable), http_status: attemptDiagnostics[0].http_status } : null,
          routingDecision: {
            additionalRoutesSkipped: skippedRoutes.length > 0,
            reason: skippedRoutes.length ? 'Equivalent provider-family routes were skipped after non-retryable policy memory.' : 'Selected route produced output.',
            skippedRoutes
          },
          failureMemory: { requestFingerprint, ttl_ms: FAILURE_MEMORY_TTL_MS },
          contentClassification,
          requiredOperation,
          routeCapabilities: discoveredRoutes.map(item => item.route_capability),
          rejectedRoutes: allRejectedRoutes
        },
        contentClassification,
        content_classification: classificationCategory,
        policy_compatible: policyRouting.policyCompatible,
        stage_trace: {
          frame_extracted: true,
          image_encoded: true,
          payload_created: true,
          request_sent: true,
          response_received: true,
          hero_image_decoded: true,
          preview_rendered: false
        },
        creative_brief: buildPhotographicBrief(metadata),
        hero_photography_plan: metadata.heroPhotographyPlan || metadata.heroPhotographyEngine?.hero_photography_plan || null,
        source_frame_understanding: metadata.sourceFrameUnderstanding || metadata.heroPhotographyEngine?.source_frame_understanding || null,
        reconstruction_report: 'The generated hero photograph must differ from the original video frame through creative reconstruction: planned camera, lens, lighting, background, environment, atmosphere, depth, texture, color contrast, subject separation, and intentional typography space — not enhancement.',
        pipeline: ['Video Frame Reference', 'Frame Understanding', 'Hero Photography Plan', 'Rendering Intelligence', 'Best Production Pipeline Selected', 'Professional Hero Photograph', 'Local Art Direction', 'Typography', 'Export'],
        privacy: {
          original_video_transmitted: false,
          story_reference_transmitted: true,
          identity_reference_transmitted: Boolean(identityReferenceDataUrl),
          generated_image_received_from_provider: true,
          api_key_exposed_to_client: false,
          final_branding_and_typography_added_locally_after_hero_approval: true
        }
      });
    } catch (error) {
      let diagnostic;
      try { diagnostic = JSON.parse(error.message); } catch (_) { diagnostic = { message: error.message, category: 'PROVIDER_FAILURE', retryable: true }; }
      diagnostic.model = route.id;
      diagnostic.provider = diagnostic.provider || route.compatible_endpoints?.[0]?.provider_name || null;
      diagnostic.provider_family = providerFamilyForRoute(route);
      diagnostic.endpoint = route.route_capability?.endpoint || 'POST /api/v1/images';
      diagnostic.policy_compatible = policyRouting.policyCompatible;
      if (diagnostic.category === 'CONTENT_POLICY' && diagnostic.retryable === false) {
        failedPolicyFamilies.add(diagnostic.provider_family);
        rememberFailure(requestFingerprint, diagnostic.provider_family, diagnostic);
      }
      if (diagnostic.category === 'UNSUPPORTED_IMAGE_INPUT' && diagnostic.retryable === false) {
        rememberRouteCapabilityMismatch(route, REQUIRED_IMAGE_REFERENCE_OPERATION);
      }
      finalDiagnostic = diagnostic;
      const attemptDetail = {
        model: route.id,
        provider: diagnostic.provider,
        provider_family: diagnostic.provider_family,
        endpoint: diagnostic.endpoint,
        http_status: diagnostic.http_status,
        openrouter_code: diagnostic.openrouter_code,
        openrouter_error_message: diagnostic.openrouter_error_message || diagnostic.message,
        raw_response: diagnostic.raw_response,
        request_reached_provider: Boolean(diagnostic.request_reached_provider),
        rejection_type: diagnostic.rejection_type || 'unknown',
        category: diagnostic.category,
        policy_compatible: diagnostic.policy_compatible,
        retryable: Boolean(diagnostic.retryable),
        cost: 0,
        output_received: false
      };
      attempts.push({ model: route.id, provider: diagnostic.provider, status: 'failed', category: diagnostic.category, retryable: diagnostic.retryable });
      attemptDiagnostics.push(attemptDetail);
      logProviderDiagnostic('OpenRouter AI Photographer failed route', diagnostic);
      await saveGenerationLog(base44, {
        generation_job_id: generationJobId,
        openrouter_request_id: diagnostic.request_id || '',
        openrouter_generation_id: diagnostic.generation_id || '',
        model: route.id,
        provider: diagnostic.provider || '',
        status: 'failed',
        http_status: Number(diagnostic.http_status || 0),
        error_code: String(diagnostic.openrouter_code || ''),
        error_message: diagnostic.message || '',
        error_category: diagnostic.category || '',
        retryable: Boolean(diagnostic.retryable),
        processing_began: Boolean(diagnostic.processing_began),
        cost_usd: 0,
        diagnostic_json: safeJson(diagnostic),
        payload_summary_json: safeJson(diagnostic.payload_summary),
        month
      });
      await saveRenderingAttempt(base44, {
        generation_job_id: generationJobId,
        campaign: metadata.campaignName || metadata.videoTitle || '',
        frame_id: metadata.frameId || '',
        classification: classificationCategory,
        provider: routeProviderName(route),
        provider_id: getRouteProviderKey(route),
        result: diagnostic.category === 'CONTENT_POLICY' ? 'policy_reject' : diagnostic.category === 'TIMEOUT' ? 'timeout' : 'failed',
        success: false,
        runtime_ms: Number(diagnostic.runtime_ms || 0),
        cost: 0,
        quality_score: 0,
        manual_rating: 0,
        error_category: diagnostic.category || '',
        diagnostic_json: safeJson({ category: diagnostic.category, retryable: diagnostic.retryable, request_reached_provider: diagnostic.request_reached_provider })
      });
      if (['NO_CREDITS', 'AUTH_ERROR'].includes(diagnostic.category)) break;
    }
  }

  const noCompatibleAfterAttempts = Boolean(finalDiagnostic && ['CONTENT_POLICY', 'UNSUPPORTED_IMAGE_INPUT'].includes(finalDiagnostic.category) && !attemptDiagnostics.some(item => item.retryable));
  const finalCode = noCompatibleAfterAttempts ? 'NO_COMPATIBLE_PROVIDER_AVAILABLE' : 'all_openrouter_routes_failed';
  const finalCategory = noCompatibleAfterAttempts ? 'NO_COMPATIBLE_PROVIDER_AVAILABLE' : finalDiagnostic?.category;
  const finalStatus = noCompatibleAfterAttempts ? 409 : 502;
  const responseDiagnostic = finalDiagnostic ? { ...finalDiagnostic, category: finalCategory } : { category: finalCategory, retryable: false };

  return json({
    ok: false,
    error: publicFailureMessage(responseDiagnostic),
    code: finalCode,
    stage: noCompatibleAfterAttempts ? 'Provider Intelligence' : undefined,
    private_development_mode: privateDevelopment,
    development_attestation: privateDevelopmentAttestation,
    verification_mode: policyRouting.verificationMode,
    generation_job_id: generationJobId,
    requiredOperation,
    eligibleRoutes: 0,
    rejectedRoutes: allRejectedRoutes,
    diagnostics: responseDiagnostic ? { category: responseDiagnostic.category, reason: responseDiagnostic.reason || null, retryable: Boolean(responseDiagnostic.retryable), request_sent: Boolean(responseDiagnostic.payload_summary), output_received: false, provider_family: responseDiagnostic.provider_family || null } : null,
    provider_intelligence: {
      stage: 'Provider Intelligence',
      selectedProvider: finalDiagnostic?.provider || attempts[0]?.provider || null,
      providerFamily: finalDiagnostic?.provider_family || null,
      attemptedModels: attempts.map(item => item.model),
      firstFailure: attemptDiagnostics[0] ? { category: attemptDiagnostics[0].category, retryable: Boolean(attemptDiagnostics[0].retryable), http_status: attemptDiagnostics[0].http_status } : null,
      routingDecision: {
        additionalRoutesSkipped: skippedRoutes.length > 0,
        reason: skippedRoutes.length ? 'Equivalent provider family with identical non-retryable policy failure or request fingerprint memory.' : 'No equivalent provider-family routes skipped.',
        skippedRoutes
      },
      failureMemory: { requestFingerprint, ttl_ms: FAILURE_MEMORY_TTL_MS },
      contentClassification,
      requiredOperation,
      routeCapabilities: discoveredRoutes.map(item => item.route_capability),
      rejectedRoutes: allRejectedRoutes
    },
    contentClassification,
    content_classification: classificationCategory,
    policy_compatible: policyRouting.policyCompatible,
    request_sent: attempts.length > 0,
    output_received: false,
    photographer_attempts: attempts.map(item => ({ status: item.status, category: item.category || null, retryable: Boolean(item.retryable) })),
    attempt_diagnostics: attemptDiagnostics.map(item => ({ category: item.category || null, provider_family: item.provider_family || null, retryable: Boolean(item.retryable), output_received: Boolean(item.output_received) })),
    stage_trace: {
      frame_extracted: true,
      image_encoded: true,
      payload_created: Boolean(finalDiagnostic?.payload_summary),
      request_sent: Boolean(finalDiagnostic?.payload_summary),
      response_received: Boolean(finalDiagnostic?.http_status),
      hero_image_decoded: false,
      preview_rendered: false
    }
  }, finalStatus);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAllowedStaff(user)) return json({ ok: false, error: 'Unauthorized: staff access required' }, 403);

    const apiKey = Deno.env.get(SECRET_NAME);
    if (!apiKey) return json({ ok: false, error: 'OpenRouter is not configured.', code: 'missing_secret' }, 500);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'audit';
    if (action === 'development_mode_status') {
      const status = privateDevelopmentStatus(req);
      return json({ ok: true, verification_mode: status.active ? 'PRIVATE_DEVELOPMENT' : 'STANDARD', private_development_mode: status, development_attestation: buildPrivateDevelopmentAttestation(status, new Date()) });
    }
    if (action === 'audit' || action === 'health') return json({ ...(await auditOpenRouter(base44, apiKey)), private_development_mode: privateDevelopmentStatus(req) });
    if (action === 'route_capabilities') return json({ ok: true, requiredOperation: buildRequiredOperation(body.aspect_ratio || '16:9'), routes: await discoverCompatibleImageRoutes(apiKey), private_development_mode: privateDevelopmentStatus(req) });
    if (action === 'self_test') return await runOpenRouterSelfTest(base44, apiKey, user, req);
    if (action === 'generate') return await generateCover(base44, apiKey, body, user, req);
    return json({ ok: false, error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('Rendering Intelligence error:', error.message);
    return json({ ok: false, error: 'Rendering Intelligence failed before the request could complete.', code: error.message === 'timeout' ? 'timeout' : 'server_error' }, 500);
  }
});