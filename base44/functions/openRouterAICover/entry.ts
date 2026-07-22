import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { S3Client, PutObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1057.0';

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
const MAX_AUTOMATIC_ATTEMPTS = 8;
const REFERENCE_ADAPTER_VERSION = 'reference-url-v2';
const CANONICAL_CONTENT_TAXONOMY = {
  SAFE_EDITORIAL: {
    semanticMeaning: 'Non-explicit editorial, commercial, portrait, fitness, fashion, product, lifestyle, swimwear, and underwear creative.',
    policyRisk: 'standard',
    providerCompatibility: 'Allowed when provider supports general safe image-reference generation.',
    externalProviderMapping: { openrouter: 'standard image policy', google_gemini: 'safe editorial image generation', openai_image: 'standard image generation', black_forest_labs: 'general image generation', bytedance_seed: 'general image generation' }
  },
  ADULT_COMMERCIAL: {
    semanticMeaning: 'Adult-oriented commercial or suggestive marketing that is not explicit sexual content.',
    policyRisk: 'restricted',
    providerCompatibility: 'Allowed only when provider explicitly supports adult commercial imagery after governance checks.',
    externalProviderMapping: { openrouter: 'provider-specific adult-commercial policy', google_gemini: 'not assumed', openai_image: 'not assumed', black_forest_labs: 'not assumed', bytedance_seed: 'adult-commercial support must be explicit' }
  },
  EXPLICIT_ADULT: {
    semanticMeaning: 'Explicit adult sexual content or verified explicit adult production material.',
    policyRisk: 'restricted_explicit',
    providerCompatibility: 'Allowed only when provider explicitly supports explicit adult generation; ADULT_COMMERCIAL is incompatible unless explicitly upgraded.',
    externalProviderMapping: { openrouter: 'explicit provider support required', google_gemini: 'not supported unless provider says explicit', openai_image: 'not supported unless provider says explicit', black_forest_labs: 'not supported unless provider says explicit', bytedance_seed: 'not supported unless provider says explicit' }
  },
  UNSUPPORTED: {
    semanticMeaning: 'Blocked, unverified, unknown, or unsupported content category.',
    policyRisk: 'blocked',
    providerCompatibility: 'Never route externally.',
    externalProviderMapping: { openrouter: 'blocked', google_gemini: 'blocked', openai_image: 'blocked', black_forest_labs: 'blocked', bytedance_seed: 'blocked' }
  }
};
const CANONICAL_CATEGORY_ALIASES = {
  SAFE_EDITORIAL: 'SAFE_EDITORIAL', COMMERCIAL_PORTRAIT: 'SAFE_EDITORIAL', EDITORIAL_COVER: 'SAFE_EDITORIAL', FASHION: 'SAFE_EDITORIAL', FITNESS: 'SAFE_EDITORIAL', TRAVEL: 'SAFE_EDITORIAL', PRODUCT: 'SAFE_EDITORIAL', SAFE_PRODUCT: 'SAFE_EDITORIAL', ART_DIRECTION: 'SAFE_EDITORIAL', SAFE_BRAND: 'SAFE_EDITORIAL', SAFE_PORTRAIT: 'SAFE_EDITORIAL', LIFESTYLE: 'SAFE_EDITORIAL', SWIMWEAR: 'SAFE_EDITORIAL', UNDERWEAR: 'SAFE_EDITORIAL',
  ADULT_COMMERCIAL: 'ADULT_COMMERCIAL', ADULT_MARKETING: 'ADULT_COMMERCIAL', SUGGESTIVE_ADULT: 'ADULT_COMMERCIAL',
  EXPLICIT: 'EXPLICIT_ADULT', EXPLICIT_ADULT: 'EXPLICIT_ADULT', EXPLICIT_VERIFIED_ADULT: 'EXPLICIT_ADULT',
  UNSUPPORTED: 'UNSUPPORTED', BLOCKED_OR_UNVERIFIED: 'UNSUPPORTED'
};
const RENDERING_CLASSIFICATIONS = Object.keys(CANONICAL_CONTENT_TAXONOMY);
const DEFAULT_SAFE_CATEGORIES = ['SAFE_EDITORIAL'];
const ROUTING_WEIGHTS = { policy: 0.40, quality: 0.25, reliability: 0.15, runtime: 0.10, cost: 0.10 };
const PROVIDER_FAILURE_MEMORY = new Map();
const FAILURE_MEMORY_TTL_MS = 10 * 60 * 1000;
const ROUTE_CAPABILITY_MEMORY = new Map();
const ROUTE_CAPABILITY_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
const REQUIRED_IMAGE_REFERENCE_OPERATION = 'IMAGE_REFERENCE_GENERATION';
const STABLE_SAFE_EDITORIAL_ROUTE_KEY = 'google/gemini-2.5-flash-image::google-vertex/global';

const KEY_ART_DIRECTOR_PROMPT = `You are the FLESHLAB Hero Photography Director.

Core principle:
The input video frame is only a scouting/reference image. The output must be the professional hero photograph that would have been captured if this scene had been planned as a premium commercial photo shoot.

Never output an enhanced screenshot.
Never merely upscale, sharpen, denoise, relight, beautify, or crop the source frame.
Reconstruct the scene as world-class commercial photography and advertising art direction.

Use the reference image as the primary visual source for scene-detail continuity.
Preserve as many visible production details as possible: environment layout, camera angle, lighting direction, color palette, materials, props, surfaces, reflections, atmosphere, background geometry, wardrobe/accessories, composition balance, subject placement, mood, and visual story.

Use two separate visual references when provided:
- Identity Reference: use only for broad character continuity and recognizable styling; do not overfit facial, body, or anatomical details.
- Story Reference: preserve emotional moment, visual story, action logic, subject placement, mood, and visible scene context.

You may improve:
- cinematic lighting, sharpness, contrast, texture, depth, color grade, atmosphere, production polish, and commercial photography quality.

You may NOT invent:
- unrelated locations, unrelated props, a different camera angle, a different visual story, or unnecessary scene redesigns that ignore the reference.

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
    response_headers: headers ? {
      'x-request-id': headers.get('x-request-id'),
      'x-openrouter-request-id': headers.get('x-openrouter-request-id'),
      'cf-ray': headers.get('cf-ray'),
      'content-type': headers.get('content-type')
    } : null,
    invalid_parameter: metadata?.invalid_parameter || metadata?.param || metadata?.parameter || null,
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
  if (lower.includes('prohibited') || lower.includes('blocked') || lower.includes('moderation') || lower.includes('policy') || lower.includes('guardrail') || lower.includes('flagged') || lower.includes('safety system') || lower.includes('safety_violations') || lower.includes('sexual') || lower.includes('sensitive information')) return 'content';
  if (lower.includes('image') || lower.includes('input_reference') || lower.includes('input reference') || lower.includes('base64') || lower.includes('parse')) return 'reference_image';
  if (lower.includes('payload') || lower.includes('parameter')) return 'payload';
  return 'unknown';
}

function categorizeOpenRouterError(status, code, message, metadata) {
  const lower = String(message || '').toLowerCase();
  const errorType = String(metadata?.error_type || metadata?.provider_code || '').toLowerCase();
  if (lower.includes('prohibited') || lower.includes('blocked') || lower.includes('moderation') || lower.includes('policy') || lower.includes('guardrail') || lower.includes('flagged') || lower.includes('safety system') || lower.includes('safety_violations') || lower.includes('sexual') || lower.includes('sensitive information')) return 'CONTENT_POLICY';
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
  if (diagnostic.category === 'EXPLICIT_REFERENCE_GENERATION_UNSUPPORTED') return 'Explicit adult image-reference generation is not supported by any approved provider policy. This workflow can only route verified adult commercial key-art requests when the output is promotional, not explicit scene generation.';
  if (diagnostic.category === 'NO_PROVIDER_POLICY_SUPPORT') return 'No configured provider policy explicitly supports this canonical content category.';
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
  return `${REFERENCE_ADAPTER_VERSION}::${route?.id || 'unknown'}::${route?.route_capability?.endpoint || route?.compatible_endpoints?.[0]?.provider_slug || 'default_endpoint'}`;
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
    'Visible detail continuity: retain reference-specific environment layout, camera direction, lighting direction, color palette, surfaces, materials, props, wardrobe/accessories, background geometry, subject placement, mood, and visual story wherever visible.',
    `Camera: ${plan.Camera || 'commercial campaign camera that keeps the reference viewpoint and composition logic'}`,
    `Lens: ${plan.Lens || 'cinematic editorial lens with controlled perspective and premium subject separation'}`,
    `Lighting setup: key=${lighting.key_light || 'large soft directional key based on the reference lighting direction'}; fill=${lighting.fill_light || 'controlled low fill'}; rim=${lighting.rim_light || 'subtle separation rim'}; practicals=${lighting.practical_lights || 'motivated cinematic practicals from the visible scene context'}`,
    `Negative space and composition: ${plan.Composition || 'intentional typography space while keeping the reference composition balance and subject placement'}`,
    `Luxury level: ${plan.Luxury_Level || 'Netflix Key Art / Amazon Originals / HBO Campaign / luxury fashion editorial / premium magazine cover'}`,
    `Editorial style: ${plan.Editorial_Style || metadata.campaignName || 'premium commercial editorial'}`,
    '',
    'STEP 3 — POLISH THE SAME VISUAL WORLD',
    `Background: ${plan.Background || 'production-polished background that retains visible reference details and story logic'}`,
    `Environment: ${plan.Environment || 'improve atmosphere, depth, reflections, texture and production design while retaining visible reference-specific details'}`,
    '',
    'STEP 4 — HERO RENDERING BRIEF',
    brief,
    '',
    'REPORT REQUIREMENT',
    'The generated hero photograph should feel like the same visual world elevated into premium commercial photography: keep visible reference details, scene logic, subject placement, mood, props, materials, lighting direction and composition balance while improving production quality.'
  ].filter(Boolean).join('\n');
}

function buildKeyArtPrompt(metadata = {}) {
  const referenceMode = metadata.identityReferenceProvided
    ? 'Reference order: image 1 is broad character/style continuity only; image 2 is STORY/MOMENT and scene-detail reference. Preserve visible scene details from image 2 wherever possible.'
    : 'Only a Story Reference was supplied. Preserve as many visible scene details as possible: environment, props, materials, lighting direction, camera viewpoint, subject placement, action, emotion, mood, and visual context.';
  const loopNote = metadata.regenerationDirective ? `\n\nPrevious creative review directive to fix:\n${metadata.regenerationDirective}` : '';
  return `${KEY_ART_DIRECTOR_PROMPT}\n\n${referenceMode}\n\n${buildPhotographicBrief(metadata)}${loopNote}`;
}

function chooseResolution(route, params) {
  if (String(route?.id || '').includes('seedream') && descriptorAllows(params.resolution, '4K')) return '4K';
  if (descriptorAllows(params.resolution, '2K')) return '2K';
  if (descriptorAllows(params.resolution, '1K')) return '1K';
  return null;
}

async function buildImagePayload(route, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata, generationJobId) {
  const storyReference = await buildRouteReference(route, storyReferenceDataUrl, generationJobId, 'story');
  const identityReference = identityReferenceDataUrl ? await buildRouteReference(route, identityReferenceDataUrl, generationJobId, 'identity') : null;
  const refs = identityReference
    ? [identityReference.reference, storyReference.reference]
    : [storyReference.reference];
  const referenceReports = identityReference ? [identityReference.report, storyReference.report] : [storyReference.report];
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
  return { payload, reference_count: refs.length, referenceReports };
}

function buildPayloadSummary(route, payload, storyReferenceDataUrl, identityReferenceDataUrl, referenceReports = []) {
  return {
    endpoint: '/api/v1/images',
    transport_endpoint: 'https://openrouter.ai/api/v1/images',
    method: 'POST',
    content_type: 'application/json',
    headers_redacted: ['Authorization: Bearer [REDACTED]', 'Content-Type: application/json', 'HTTP-Referer', 'X-Title', 'Idempotency-Key'],
    top_level_fields: Object.keys(payload),
    model: route.id,
    prompt_field: 'prompt',
    prompt_chars: String(payload.prompt || '').length,
    aspect_ratio_field: Object.prototype.hasOwnProperty.call(payload, 'aspect_ratio') ? 'aspect_ratio' : null,
    image_reference_field: 'input_references',
    image_reference_object_shape: payload.input_references.map(item => ({ type: item.type, image_url: { url_mode: String(item.image_url?.url || '').startsWith('data:') ? 'data_url' : 'https_url' } })),
    provider_order: payload.provider?.order || [],
    aspect_ratio: payload.aspect_ratio || 'provider-default',
    resolution: payload.resolution || 'provider-default',
    output_format: payload.output_format || 'provider-default',
    reference_count: payload.input_references.length,
    story_reference_bytes_estimate: estimateBytesFromDataUrl(storyReferenceDataUrl),
    identity_reference_bytes_estimate: identityReferenceDataUrl ? estimateBytesFromDataUrl(identityReferenceDataUrl) : 0,
    reference_transport: referenceReports
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
  if (/\b(explicit adult|explicit sex|sexual act|hardcore|porn|visible genitals|visible nipples|nude|naked)\b/.test(contentType)) return 'EXPLICIT';
  if (/\b(explicit|adult|sexual|suggestive|onlyfans)\b/.test(contentType)) return 'ADULT_MARKETING';
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

function normalizeCanonicalCategory(value, fallback = 'UNSUPPORTED') {
  return CANONICAL_CATEGORY_ALIASES[canonicalCategoryToken(value)] || fallback;
}

function categoryPolicyRisk(value) {
  return CANONICAL_CONTENT_TAXONOMY[normalizeCanonicalCategory(value)]?.policyRisk || 'blocked';
}

function canonicalTaxonomyRegistry() {
  return Object.entries(CANONICAL_CONTENT_TAXONOMY).map(([canonicalCategory, definition]) => ({ canonicalCategory, ...definition }));
}

function summarizePolicyEvidenceAudit(audit = null) {
  const evidence = Array.isArray(audit?.evidence) ? audit.evidence : [];
  const weightedPath = Array.isArray(audit?.decisionTrace?.weightedPath) ? audit.decisionTrace.weightedPath : evidence.map(item => ({ signal: item.signal, type: item.type, category: item.category, weight: item.weight, diagnosticOnly: Boolean(item.diagnosticOnly), ignoredReason: item.ignoredReason || null }));
  const explicitPromoters = weightedPath.filter(item => item.category === 'EXPLICIT_ADULT' && Number(item.weight || 0) > 0 && !item.diagnosticOnly);
  return { classification: audit?.classification || null, confidence: audit?.confidence || null, margin: audit?.decisionTrace?.margin ?? null, totals: audit?.decisionTrace?.total || audit?.alternativeClassifications || null, weightedPath, explicitPromoters };
}

function hasAffirmativeExplicitEvidence(metadata = {}) {
  const audit = metadata.policyEvidenceAudit || metadata.providerIntelligence?.policyEvidenceAudit || null;
  const chain = summarizePolicyEvidenceAudit(audit);
  if (chain.explicitPromoters.length) return true;
  const text = `${metadata.contentType || ''} ${metadata.campaignName || ''} ${metadata.videoTitle || ''}`.toLowerCase();
  return /\b(explicit adult|explicit sex|sexual act|hardcore|porn|visible genitals|visible nipples|nude|naked)\b/.test(text);
}

function isCommercialKeyArtWorkflow(metadata = {}) {
  const text = `${metadata.contentType || ''} ${metadata.campaignName || ''} ${metadata.videoTitle || ''} ${metadata.title || ''} ${metadata.renderingIntent || ''} ${metadata.heroPhotographyPlan?.Editorial_Style || ''}`.toLowerCase();
  return /\b(key art|hero photography|campaign|commercial|marketing|promotional|poster|cover|reference fidelity|retouch)\b/.test(text);
}

function normalizeContentClassification(input) {
  const inputObject = input && typeof input === 'object' ? input : null;
  const rawCategory = String(inputObject?.rawCategory || inputObject?.canonicalCategory || inputObject?.category || input || '').trim();
  const canonicalCategory = normalizeCanonicalCategory(rawCategory, 'SAFE_EDITORIAL');
  const policyRisk = categoryPolicyRisk(canonicalCategory);
  const normalized = {
    ...(inputObject || {}),
    rawCategory,
    canonicalCategory,
    category: canonicalCategory,
    source: inputObject?.source || 'backend_classification_normalizer',
    confidence: Number(inputObject?.confidence ?? 0.45),
    policyRisk,
    technicalIntent: inputObject?.technicalIntent || REQUIRED_IMAGE_REFERENCE_OPERATION,
    evidenceChain: inputObject?.evidenceChain || null,
    version: 'provider-intelligence-v3'
  };
  console.assert(!(canonicalCategoryToken(rawCategory) === 'EXPLICIT' && normalized.canonicalCategory !== 'EXPLICIT_ADULT'), 'Raw EXPLICIT must normalize to EXPLICIT_ADULT');
  return normalized;
}

function getCanonicalContentClassification(metadata = {}) {
  const supplied = metadata.providerIntelligence?.contentClassification || metadata.contentClassification || metadata.policyClassification;
  const evidenceChain = summarizePolicyEvidenceAudit(metadata.policyEvidenceAudit || metadata.providerIntelligence?.policyEvidenceAudit || null);
  const normalizeWithGuard = (classification) => {
    const normalized = normalizeContentClassification({ ...classification, evidenceChain });
    if (normalized.canonicalCategory === 'EXPLICIT_ADULT' && isCommercialKeyArtWorkflow(metadata)) {
      return normalizeContentClassification({ rawCategory: 'ADULT_MARKETING', source: 'backend_adult_commercial_key_art_routing', confidence: Math.min(Number(normalized.confidence || 0.45), 0.8), evidenceChain: { ...evidenceChain, guard: 'Commercial key-art/reference workflow routed as ADULT_COMMERCIAL; explicit source material does not authorize explicit-scene generation.' } });
    }
    if (normalized.canonicalCategory === 'EXPLICIT_ADULT' && !hasAffirmativeExplicitEvidence(metadata)) {
      const fallback = deriveFallbackClassification(metadata);
      const guardedFallback = fallback === 'EXPLICIT' ? 'ADULT_MARKETING' : fallback;
      return normalizeContentClassification({ rawCategory: guardedFallback, source: 'backend_explicit_promotion_guard', confidence: Math.min(Number(normalized.confidence || 0.45), 0.62), evidenceChain: { ...evidenceChain, guard: 'EXPLICIT_ADULT removed because no affirmative explicit-adult evidence item was present.' } });
    }
    return normalized;
  };
  if (supplied && typeof supplied === 'object') {
    return normalizeWithGuard({ ...supplied, rawCategory: supplied.rawCategory || supplied.category || supplied.canonicalCategory || '', source: supplied.source || 'frontend_provider_intelligence' });
  }
  const suppliedString = supplied || metadata.providerIntelligence?.contentClassificationCategory;
  if (suppliedString) {
    return normalizeWithGuard({ rawCategory: suppliedString, source: 'frontend_provider_intelligence_legacy', confidence: 0.65 });
  }
  const fallback = deriveFallbackClassification(metadata);
  return normalizeWithGuard({ rawCategory: fallback, source: 'backend_fallback_metadata', confidence: 0.45 });
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

function providerReallyRejectedImageReference(diagnostic) {
  const lower = String(diagnostic?.message || diagnostic?.raw_response || '').toLowerCase();
  return lower.includes('input_references') && (lower.includes('not supported') || lower.includes('unsupported') || lower.includes('unknown parameter') || lower.includes('invalid parameter'));
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
  const providerFamily = providerFamilyForRoute(route);
  if (text.includes('seedream') || providerFamily === 'bytedance_seed') categories.add('ADULT_MARKETING');
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
  const updates = routes.map(route => {
    const provider = existingById.get(getRouteProviderKey(route));
    if (!provider) return null;
    const inferredLegacy = inferRouteCategories(route);
    const inferredCanonical = canonicalCategoriesFromLegacy(inferredLegacy);
    const unsupported = canonicalCategoriesFromLegacy(provider.unsupportedCanonicalCategories || []);
    const currentLegacy = Array.isArray(provider.supported_categories) ? provider.supported_categories : [];
    const currentCanonical = canonicalCategoriesFromLegacy(provider.supportedCanonicalCategories?.length ? provider.supportedCanonicalCategories : currentLegacy);
    const mergedCanonical = [...new Set([...currentCanonical, ...inferredCanonical].filter(category => !unsupported.includes(category)))];
    const mergedLegacy = [...new Set([...currentLegacy, ...inferredLegacy])];
    if (safeJson(mergedCanonical) === safeJson(currentCanonical) && safeJson(mergedLegacy) === safeJson(currentLegacy)) return null;
    return { id: provider.id, supported_categories: mergedLegacy, supportedCanonicalCategories: mergedCanonical };
  }).filter(Boolean);
  if (missing.length) await base44.asServiceRole.entities.RenderingProvider.bulkCreate(missing).catch(error => console.warn('Rendering provider registry seed failed', error.message));
  if (updates.length) await base44.asServiceRole.entities.RenderingProvider.bulkUpdate(updates).catch(error => console.warn('Rendering provider registry sync failed', error.message));
  return await base44.asServiceRole.entities.RenderingProvider.list('priority', 500).catch(() => existing || []);
}

async function auditAndRepairCanonicalPolicyRegistry(base44, requestedCategory = null) {
  const providers = await base44.asServiceRole.entities.RenderingProvider.list('priority', 500).catch(() => []);
  const canonicalCategories = Object.keys(CANONICAL_CONTENT_TAXONOMY);
  const updates = [];
  const diff = [];
  const auditedProviders = providers.map(provider => {
    const before = {
      supportedCanonicalCategories: Array.isArray(provider.supportedCanonicalCategories) ? provider.supportedCanonicalCategories : [],
      unsupportedCanonicalCategories: Array.isArray(provider.unsupportedCanonicalCategories) ? provider.unsupportedCanonicalCategories : []
    };
    const legacySource = [...(provider.supported_categories || []), ...before.supportedCanonicalCategories];
    const supportedCanonicalCategories = [...new Set(legacySource.map(category => normalizeCanonicalCategory(category)).filter(category => category !== 'UNSUPPORTED'))];
    const unsupportedCanonicalCategories = [...new Set(before.unsupportedCanonicalCategories.map(category => normalizeCanonicalCategory(category)).filter(category => canonicalCategories.includes(category)))];
    const after = { supportedCanonicalCategories, unsupportedCanonicalCategories };
    if (safeJson(before) !== safeJson(after)) {
      updates.push({ id: provider.id, ...after });
      diff.push({ provider_id: provider.provider_id, provider_name: provider.provider_name, before, after });
    }
    const compatibilityMatrix = canonicalCategories.map(category => {
      const relations = supportedCanonicalCategories.map(supported => categoryCompatibility(supported, category));
      const allowed = relations.some(item => item.routeAllowed) && !unsupportedCanonicalCategories.includes(category);
      const strongestRelation = allowed ? 'equivalent' : relations.find(item => item.relation === 'partially_compatible')?.relation || relations[0]?.relation || 'incompatible';
      return { requestedCategory: category, supported: allowed, relation: unsupportedCanonicalCategories.includes(category) ? 'incompatible' : strongestRelation, relations };
    });
    return { provider_id: provider.provider_id, provider_name: provider.provider_name, enabled: provider.enabled, availability: provider.current_availability, supportedCanonicalCategories, unsupportedCanonicalCategories, compatibilityMatrix };
  });
  if (updates.length) await base44.asServiceRole.entities.RenderingProvider.bulkUpdate(updates);
  const requestedCanonicalCategory = requestedCategory ? normalizeCanonicalCategory(requestedCategory) : null;
  const supportingProviders = requestedCanonicalCategory ? auditedProviders.filter(provider => provider.enabled && provider.availability !== 'unavailable' && provider.compatibilityMatrix.find(item => item.requestedCategory === requestedCanonicalCategory)?.supported) : [];
  return {
    ok: true,
    taxonomy: canonicalTaxonomyRegistry(),
    auditedProviderCount: auditedProviders.length,
    repairedProviderCount: updates.length,
    diff,
    requestedCategory: requestedCanonicalCategory,
    requestedCategorySupport: requestedCanonicalCategory ? {
      code: supportingProviders.length ? 'PROVIDER_POLICY_SUPPORT_FOUND' : 'NO_PROVIDER_POLICY_SUPPORT',
      providerCount: supportingProviders.length,
      providers: supportingProviders.map(provider => ({ provider_id: provider.provider_id, provider_name: provider.provider_name, supportedCanonicalCategories: provider.supportedCanonicalCategories }))
    } : null,
    providers: auditedProviders
  };
}

async function loadRenderingHistory(base44) {
  return await base44.asServiceRole.entities.RenderingAttempt.list('-created_date', 500).catch(() => []);
}

function canonicalCategoriesFromLegacy(categories = []) {
  return [...new Set((Array.isArray(categories) ? categories : []).map(category => normalizeCanonicalCategory(category)).filter(category => CANONICAL_CONTENT_TAXONOMY[category]))];
}

function categoryCompatibility(providerCategory, requestedCategory) {
  const providerCanonical = normalizeCanonicalCategory(providerCategory);
  const requestedCanonical = normalizeCanonicalCategory(requestedCategory);
  if (providerCanonical === requestedCanonical && providerCanonical !== 'UNSUPPORTED') return { providerCanonical, requestedCanonical, relation: 'equivalent', routeAllowed: true, reason: 'CANONICAL_CATEGORY_EXACT_MATCH' };
  if (providerCanonical === 'ADULT_COMMERCIAL' && requestedCanonical === 'EXPLICIT_ADULT') return { providerCanonical, requestedCanonical, relation: 'incompatible', routeAllowed: false, reason: 'ADULT_COMMERCIAL_DOES_NOT_AUTHORIZE_EXPLICIT_ADULT' };
  if (providerCanonical === 'EXPLICIT_ADULT' && requestedCanonical === 'ADULT_COMMERCIAL') return { providerCanonical, requestedCanonical, relation: 'partially_compatible', routeAllowed: false, reason: 'EXPLICIT_SUPPORT_IS_STRONGER_BUT_NOT_ASSUMED_FOR_ADULT_COMMERCIAL_WITHOUT_PROVIDER_POLICY' };
  if (providerCanonical === 'UNSUPPORTED' || requestedCanonical === 'UNSUPPORTED') return { providerCanonical, requestedCanonical, relation: 'incompatible', routeAllowed: false, reason: 'UNSUPPORTED_CATEGORY_NEVER_ROUTES' };
  return { providerCanonical, requestedCanonical, relation: 'incompatible', routeAllowed: false, reason: 'CANONICAL_SEMANTICS_DO_NOT_MATCH' };
}

function providerSupportsClassification(provider, classification) {
  const canonicalCategory = typeof classification === 'object' ? normalizeCanonicalCategory(classification.canonicalCategory || classification.category) : normalizeCanonicalCategory(classification);
  const supportedCanonicalCategories = Array.isArray(provider?.supportedCanonicalCategories) && provider.supportedCanonicalCategories.length
    ? canonicalCategoriesFromLegacy(provider.supportedCanonicalCategories)
    : canonicalCategoriesFromLegacy(provider?.supported_categories || []);
  const unsupportedCanonicalCategories = Array.isArray(provider?.unsupportedCanonicalCategories) ? canonicalCategoriesFromLegacy(provider.unsupportedCanonicalCategories) : [];
  const compatibilityRelations = supportedCanonicalCategories.map(category => categoryCompatibility(category, canonicalCategory));
  const baseRules = [
    { rule: 'PROVIDER_EXISTS', result: provider ? 'PASS' : 'FAIL', reason: provider ? null : 'PROVIDER_REGISTRY_ENTRY_MISSING' },
    { rule: 'PROVIDER_ENABLED', result: provider?.enabled ? 'PASS' : 'FAIL', reason: provider?.enabled ? null : 'PROVIDER_DISABLED' },
    { rule: 'PROVIDER_AVAILABLE', result: provider?.current_availability !== 'unavailable' ? 'PASS' : 'FAIL', reason: provider?.current_availability !== 'unavailable' ? null : 'PROVIDER_UNAVAILABLE' }
  ];
  const unsupportedMatch = unsupportedCanonicalCategories.includes(canonicalCategory);
  const allowedMatch = compatibilityRelations.find(item => item.routeAllowed);
  const partialMatch = compatibilityRelations.find(item => item.relation === 'partially_compatible');
  const categoryRule = unsupportedMatch
    ? { rule: 'CANONICAL_CATEGORY_POLICY', result: 'FAIL', reason: 'CATEGORY_EXPLICITLY_UNSUPPORTED', canonicalCategory, supportedCanonicalCategories, unsupportedCanonicalCategories, compatibilityRelations }
    : allowedMatch
      ? { rule: 'CANONICAL_CATEGORY_POLICY', result: 'PASS', reason: null, canonicalCategory, supportedCanonicalCategories, unsupportedCanonicalCategories, compatibilityRelations }
      : partialMatch
        ? { rule: 'CANONICAL_CATEGORY_POLICY', result: 'PARTIAL_COMPATIBILITY_NOT_ALLOWED', reason: partialMatch.reason, canonicalCategory, supportedCanonicalCategories, unsupportedCanonicalCategories, compatibilityRelations }
        : { rule: 'CANONICAL_CATEGORY_POLICY', result: 'NO_PROVIDER_POLICY_SUPPORT', reason: 'CATEGORY_NOT_SUPPORTED', canonicalCategory, supportedCanonicalCategories, unsupportedCanonicalCategories, compatibilityRelations };
  const rules = [...baseRules, categoryRule];
  const pass = Boolean(provider && provider.enabled && provider.current_availability !== 'unavailable' && categoryRule.result === 'PASS');
  return { pass, result: categoryRule.result, reason: pass ? null : (rules.find(rule => rule.result === 'FAIL')?.reason || categoryRule.reason), supportedCanonicalCategories, unsupportedCanonicalCategories, compatibilityRelations, policyRules: rules };
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
        compatibilityRelations: policyEvaluation.compatibilityRelations,
        supportedCanonicalCategories: policyEvaluation.supportedCanonicalCategories,
        unsupportedCanonicalCategories: policyEvaluation.unsupportedCanonicalCategories
      });
      return null;
    }
    const stats = historyStats(attempts, provider.provider_id, classification);
    return { route, provider, stats, routing_score: scoreRenderingRoute(route, provider, stats), policyRules: policyEvaluation.policyRules };
  }).filter(Boolean).sort((a, b) => b.routing_score - a.routing_score || Number(b.provider.priority || 0) - Number(a.provider.priority || 0));
  if (classification === 'SAFE_EDITORIAL') {
    ranked.sort((a, b) => (getRouteProviderKey(b.route) === STABLE_SAFE_EDITORIAL_ROUTE_KEY ? 1 : 0) - (getRouteProviderKey(a.route) === STABLE_SAFE_EDITORIAL_ROUTE_KEY ? 1 : 0));
  }
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
  const { payload, referenceReports } = await buildImagePayload(route, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata, generationJobId);
  const payloadSummary = buildPayloadSummary(route, payload, storyReferenceDataUrl, identityReferenceDataUrl, referenceReports);
  const seedreamValidation = validateSeedDreamPayload(route, payload, referenceReports);
  if (!seedreamValidation.ok) {
    throw new Error(safeJson({
      http_status: null,
      openrouter_code: 'local_seedream_payload_validation_failed',
      message: seedreamValidation.reason,
      category: 'INVALID_PAYLOAD',
      retryable: false,
      provider: route.compatible_endpoints?.[0]?.provider_name || null,
      request_reached_provider: false,
      rejection_type: 'payload',
      invalid_parameter: seedreamValidation.invalid_parameter,
      expected_parameter: seedreamValidation.expected_parameter,
      payload_summary: payloadSummary,
      runtime_ms: Date.now() - startedAt
    }));
  }
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
  const outputBytes = Math.floor(String(first.b64_json || '').length * 0.75);
  const outputDimensions = readImageDimensionsFromDataUrl(`data:${mediaType};base64,${first.b64_json}`);
  const generationId = data?.id || data?.generation_id || data?.data?.id || null;
  const requestId = res.headers.get('x-request-id') || res.headers.get('x-openrouter-request-id') || data?.openrouter_metadata?.request_id || null;
  const generationMetadata = await fetchGenerationMetadata(apiKey, generationId).catch(() => null);
  return {
    image_data_url: `data:${mediaType};base64,${first.b64_json}`,
    media_type: mediaType,
    output_byte_size: outputBytes,
    output_dimensions: outputDimensions,
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

function decodeImageDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return { ok: false, mime_type: null, bytes: new Uint8Array(), byte_length: 0 };
  const mimeType = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  const binary = atob(match[3]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { ok: true, mime_type: mimeType, bytes, byte_length: bytes.byteLength };
}

function readJpegDimensions(bytes) {
  for (let i = 2; i < bytes.length - 9;) {
    if (bytes[i] !== 0xff) { i += 1; continue; }
    const marker = bytes[i + 1];
    const length = (bytes[i + 2] << 8) + bytes[i + 3];
    if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker)) return { width: (bytes[i + 7] << 8) + bytes[i + 8], height: (bytes[i + 5] << 8) + bytes[i + 6] };
    i += Math.max(2, length + 2);
  }
  return null;
}

function readImageDimensionsFromBytes(bytes, mimeType) {
  if (mimeType === 'image/png' && bytes.length > 24) return { width: (bytes[16] << 24) + (bytes[17] << 16) + (bytes[18] << 8) + bytes[19], height: (bytes[20] << 24) + (bytes[21] << 16) + (bytes[22] << 8) + bytes[23] };
  if (mimeType === 'image/jpeg') return readJpegDimensions(bytes);
  return null;
}

function readImageDimensionsFromDataUrl(dataUrl) {
  const decoded = decodeImageDataUrl(dataUrl);
  return decoded.ok ? readImageDimensionsFromBytes(decoded.bytes, decoded.mime_type) : null;
}

function isSeedDreamRoute(route) {
  return String(route?.id || '').includes('seedream') || providerFamilyForRoute(route) === 'bytedance_seed';
}

function r2Config() {
  return {
    accountId: Deno.env.get('R2_ACCOUNT_ID'),
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
    bucket: Deno.env.get('R2_BUCKET_NAME')
  };
}

function extensionForMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

async function uploadSeedDreamReference(dataUrl, generationJobId, kind) {
  const decoded = decodeImageDataUrl(dataUrl);
  if (!decoded.ok) throw new Error('SeedDream reference image must be a valid PNG, JPEG, or WEBP data URL before upload.');
  const config = r2Config();
  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucket) throw new Error('SeedDream reference upload storage is not configured.');
  const client = new S3Client({ region: 'auto', endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
  const key = `openrouter/seedream-references/${String(generationJobId).replace(/[^a-zA-Z0-9_-]/g, '_')}/${kind}.${extensionForMime(decoded.mime_type)}`;
  await client.send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: decoded.bytes, ContentType: decoded.mime_type }));
  const signedUrl = await getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: key }), { expiresIn: 900 });
  const fetchRes = await fetch(signedUrl, { method: 'GET' });
  const fetched = fetchRes.ok ? new Uint8Array(await fetchRes.arrayBuffer()) : new Uint8Array();
  return {
    signedUrl,
    report: {
      kind,
      original_mode: 'data_url',
      submitted_mode: 'public_https_signed_url',
      source_field: `${kind}_reference_data_url`,
      mime_type: decoded.mime_type,
      byte_size: decoded.byte_length,
      dimensions: readImageDimensionsFromBytes(decoded.bytes, decoded.mime_type),
      source_image_accessibility_status: {
        external_fetch_status: fetchRes.status,
        externally_reachable: fetchRes.ok,
        requires_session_cookies: false,
        is_blob_url: false,
        is_localhost: false,
        is_private_preview_url: false,
        content_type: fetchRes.headers.get('content-type'),
        fetched_byte_size: fetched.byteLength,
        contains_image_bytes: fetched.byteLength > 0
      }
    }
  };
}

async function buildRouteReference(route, dataUrl, generationJobId, kind) {
  if (!isSeedDreamRoute(route)) return { reference: { type: 'image_url', image_url: { url: dataUrl } }, report: { kind, original_mode: 'data_url', submitted_mode: 'data_url', source_field: `${kind}_reference_data_url`, mime_type: parseDataUrlInfo(dataUrl).mime_type, byte_size: estimateBytesFromDataUrl(dataUrl), dimensions: readImageDimensionsFromDataUrl(dataUrl) } };
  const uploaded = await uploadSeedDreamReference(dataUrl, generationJobId, kind);
  return { reference: { type: 'image_url', image_url: { url: uploaded.signedUrl } }, report: uploaded.report };
}

async function loadStoredSeedDreamReferenceDataUrl(generationJobId, kind = 'story') {
  const config = r2Config();
  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucket) throw new Error('Reference storage is not configured.');
  const client = new S3Client({ region: 'auto', endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
  const key = `openrouter/seedream-references/${String(generationJobId).replace(/[^a-zA-Z0-9_-]/g, '_')}/${kind}.png`;
  const signedUrl = await getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: key }), { expiresIn: 300 });
  const res = await fetch(signedUrl);
  if (!res.ok) throw new Error(`Stored reference fetch failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return `data:${res.headers.get('content-type') || 'image/png'};base64,${arrayBufferToBase64(buffer)}`;
}

function validateSeedDreamPayload(route, payload, referenceReports) {
  if (!isSeedDreamRoute(route)) return { ok: true };
  if (!Array.isArray(payload.input_references) || !payload.input_references.length) return { ok: false, reason: 'SeedDream requires input_references with at least one externally reachable image URL.', invalid_parameter: 'input_references', expected_parameter: 'input_references[].image_url.url' };
  const invalid = payload.input_references.find(item => !String(item?.image_url?.url || '').startsWith('https://'));
  if (invalid) return { ok: false, reason: 'SeedDream reference image URL must be an externally reachable HTTPS URL; inline data URLs are rejected before transport.', invalid_parameter: 'input_references[].image_url.url', expected_parameter: 'HTTPS URL' };
  const inaccessible = referenceReports.find(report => report.source_image_accessibility_status && !report.source_image_accessibility_status.externally_reachable);
  if (inaccessible) return { ok: false, reason: 'SeedDream reference image could not be fetched externally before transport.', invalid_parameter: inaccessible.source_field, expected_parameter: 'externally reachable HTTPS image URL' };
  return { ok: true };
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

async function runControlledSuccessfulEnvelopeRerun(base44, apiKey, user, req, body = {}) {
  const sourceGenerationJobId = body.source_generation_job_id || '25c61478-1f0a-4a51-9dee-71e5ff0c5626';
  let dataUrl;
  try {
    dataUrl = await loadStoredSeedDreamReferenceDataUrl(sourceGenerationJobId, 'story');
  } catch (error) {
    return json({ ok: false, code: 'stored_reference_load_failed', error: error.message, source_generation_job_id: sourceGenerationJobId }, 500);
  }
  return await generateCover(base44, apiKey, {
    action: 'generate',
    consent: true,
    generation_job_id: `controlled-success-envelope-${crypto.randomUUID()}`,
    story_reference_data_url: dataUrl,
    aspect_ratio: '16:9',
    metadata: {
      videoTitle: body.videoTitle || 'KRAKEN',
      optionalSubtitle: body.optionalSubtitle || '',
      campaignName: 'KRAKEN',
      contentType: 'reference frame for professional hero photograph',
      contentClassification: { rawCategory: 'SAFE_EDITORIAL', category: 'SAFE_EDITORIAL', canonicalCategory: 'SAFE_EDITORIAL', source: 'controlled_success_envelope_rerun', confidence: 0.95 }
    }
  }, user, req);
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

async function runAdultCommercialRouteRegression(base44, apiKey, user, req) {
  const testImageUrl = 'https://picsum.photos/seed/fleshlab-adult-commercial-route/1280/720.jpg';
  const imageRes = await fetch(testImageUrl);
  if (!imageRes.ok) return json({ ok: false, error: 'Could not fetch route regression reference image.', status: imageRes.status }, 502);
  const buffer = await imageRes.arrayBuffer();
  const dataUrl = `data:image/jpeg;base64,${arrayBufferToBase64(buffer)}`;
  return await generateCover(base44, apiKey, {
    action: 'generate',
    consent: true,
    generation_job_id: `adult-commercial-route-${crypto.randomUUID()}`,
    story_reference_data_url: dataUrl,
    aspect_ratio: '16:9',
    metadata: {
      videoTitle: 'Adult commercial key art route regression',
      contentType: 'explicit adult source material for commercial key-art reference generation',
      campaignName: 'commercial key art routing regression',
      renderingIntent: 'commercial key art reference fidelity retouch',
      contentClassification: { rawCategory: 'EXPLICIT_ADULT', category: 'EXPLICIT_ADULT', canonicalCategory: 'EXPLICIT_ADULT', source: 'regression_test', confidence: 0.9 },
      adultVerification: { allPeopleVerified18Plus: true, performerConsentConfirmed: true, mediaRightsConfirmed: true, platformSourceConfirmed: true, verificationReference: 'ROUTE_REGRESSION_PRIVATE_DEVELOPMENT' }
    }
  }, user, req);
}

async function runSeedDreamAdapterRegression(apiKey, options = {}) {
  const testImageUrl = 'https://picsum.photos/seed/fleshlab-seedream-regression/1280/720.jpg';
  const imageRes = await fetch(testImageUrl);
  if (!imageRes.ok) return json({ ok: false, error: 'Could not fetch regression reference image.', status: imageRes.status }, 502);
  const buffer = await imageRes.arrayBuffer();
  const dataUrl = `data:image/jpeg;base64,${arrayBufferToBase64(buffer)}`;
  const route = {
    id: 'bytedance-seed/seedream-4.5',
    compatible_endpoints: [{ provider_name: 'Seed', provider_slug: 'seed', provider_tag: 'seed', supported_parameters: { resolution: { type: 'enum', values: ['1K', '2K', '4K'] }, aspect_ratio: { type: 'enum', values: ['16:9'] } } }],
    supported_parameters: {}
  };
  const result = await callOpenRouterImage(apiKey, route, dataUrl, null, '16:9', { videoTitle: 'SeedDream adapter regression', contentType: 'safe editorial image reference test', campaignName: 'technical regression' }, `seedream-regression-${crypto.randomUUID()}`);
  const responseEvidence = { http_status: 200, model: route.id, provider_request_id: result.request_id, output_mime_type: result.media_type, output_byte_size: result.output_byte_size, output_dimensions: result.output_dimensions, has_browser_displayable_data_url: String(result.image_data_url || '').startsWith('data:image/') };
  if (options.compact) return json({ ok: true, regression: 'seedream_image_reference_generation', response: responseEvidence, request_shape: { endpoint: result.payload_summary.endpoint, transport_endpoint: result.payload_summary.transport_endpoint, content_type: result.payload_summary.content_type, top_level_fields: result.payload_summary.top_level_fields, model: result.payload_summary.model, prompt_field: result.payload_summary.prompt_field, prompt_chars: result.payload_summary.prompt_chars, aspect_ratio_field: result.payload_summary.aspect_ratio_field, image_reference_field: result.payload_summary.image_reference_field, image_reference_object_shape: result.payload_summary.image_reference_object_shape, provider_order: result.payload_summary.provider_order, aspect_ratio: result.payload_summary.aspect_ratio, resolution: result.payload_summary.resolution, reference_transport: result.payload_summary.reference_transport } });
  return json({ ok: true, regression: 'seedream_image_reference_generation', request_shape: result.payload_summary, response: responseEvidence });
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
    if (classificationCategory === 'EXPLICIT_ADULT') {
      const diagnostic = { category: 'EXPLICIT_REFERENCE_GENERATION_UNSUPPORTED', reason: 'EXPLICIT_ADULT_IMAGE_REFERENCE_POLICY_UNSUPPORTED', message: 'Explicit adult image-reference generation is intentionally unsupported until a provider policy explicitly approves it. Commercial key-art workflows should route as ADULT_COMMERCIAL when the requested output is promotional rather than explicit scene generation.', retryable: false };
      await saveRoutingAudit(base44, {
        generation_job_id: generationJobId,
        content_classification: classificationCategory,
        verification_status: 'passed',
        verification_reference: metadata.adultVerification?.verificationReference || '',
        routing_decision: 'EXPLICIT_REFERENCE_GENERATION_UNSUPPORTED',
        policy_compatible: 'no',
        request_sent: false,
        output_received: false,
        reason: diagnostic.message
      });
      return json({ ok: false, error: publicFailureMessage(diagnostic), code: 'EXPLICIT_REFERENCE_GENERATION_UNSUPPORTED', stage: 'Provider Intelligence', generation_job_id: generationJobId, requiredOperation, contentClassification, content_classification: classificationCategory, suggested_classification: 'ADULT_COMMERCIAL', eligibleRoutes: 0, rejectedRoutes: allRejectedRoutes, requestSent: false, request_sent: false, output_received: false, diagnostics: diagnostic, verification_mode: privateDevelopmentAttestation ? 'PRIVATE_DEVELOPMENT' : 'STANDARD', private_development_mode: privateDevelopment, development_attestation: privateDevelopmentAttestation, provider_intelligence: { stage: 'Provider Intelligence', contentClassification, requiredOperation, routeCapabilities: discoveredRoutes.map(route => route.route_capability), rejectedRoutes: allRejectedRoutes }, photographer_attempts: [], attempt_diagnostics: [], stage_trace: { frame_extracted: true, image_encoded: true, payload_created: false, request_sent: false, response_received: false, hero_image_decoded: false, preview_rendered: false } }, 409);
    }
    const diagnostic = { category: 'NO_PROVIDER_POLICY_SUPPORT', reason: 'CATEGORY_NOT_SUPPORTED', message: 'No approved route explicitly supports the canonical content category.', retryable: false };
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
    return json({ ok: false, error: publicFailureMessage(diagnostic), code: 'NO_PROVIDER_POLICY_SUPPORT', stage: 'Provider Intelligence', generation_job_id: generationJobId, requiredOperation, contentClassification, content_classification: classificationCategory, eligibleRoutes: 0, rejectedRoutes: allRejectedRoutes, requestSent: false, request_sent: false, output_received: false, diagnostics: diagnostic, verification_mode: privateDevelopmentAttestation ? 'PRIVATE_DEVELOPMENT' : 'STANDARD', private_development_mode: privateDevelopment, development_attestation: privateDevelopmentAttestation, provider_intelligence: { stage: 'Provider Intelligence', contentClassification, requiredOperation, routeCapabilities: discoveredRoutes.map(route => route.route_capability), rejectedRoutes: allRejectedRoutes }, photographer_attempts: [], attempt_diagnostics: [], stage_trace: { frame_extracted: true, image_encoded: true, payload_created: false, request_sent: false, response_received: false, hero_image_decoded: false, preview_rendered: false } }, 409);
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
    if (classificationCategory !== 'SAFE_EDITORIAL' && rememberedFailure && rememberedFailure.category === 'CONTENT_POLICY' && rememberedFailure.retryable === false) {
      skippedRoutes.push({ model: route.id, provider_family: providerFamily, reason: 'remembered non-retryable provider-family policy failure', category: rememberedFailure.category, failure_memory_fingerprint: requestFingerprint, ttl_remaining_ms: FAILURE_MEMORY_TTL_MS - (Date.now() - rememberedFailure.timestamp) });
      continue;
    }
    if (classificationCategory !== 'SAFE_EDITORIAL' && failedPolicyFamilies.has(providerFamily)) {
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
        output_byte_size: result.output_byte_size,
        output_dimensions: result.output_dimensions,
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
          reconstruction_required: false,
          reference_fidelity_required: true,
          minimum_structural_similarity: 0.95,
          forbidden_output: 'different generated scene or changed reference composition',
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
        output_byte_size: result.output_byte_size,
        output_dimensions: result.output_dimensions,
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
        reconstruction_report: 'Reference Fidelity Mode: accepted output must preserve the original frame identity, pose, composition, camera angle, bathroom layout, object positions and scene geometry while improving only photographic production quality.',
        pipeline: ['Uploaded Frame Ground Truth', 'Reference Fidelity Brief', 'Retouch Instructions', 'Rendering Intelligence', 'Best Fidelity Pipeline Selected', 'Reference-Faithful Enhancement', 'Local Art Direction', 'Typography', 'Export'],
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
      if (classificationCategory !== 'SAFE_EDITORIAL' && diagnostic.category === 'CONTENT_POLICY' && diagnostic.retryable === false) {
        failedPolicyFamilies.add(diagnostic.provider_family);
        rememberFailure(requestFingerprint, diagnostic.provider_family, diagnostic);
      }
      if (diagnostic.category === 'UNSUPPORTED_IMAGE_INPUT' && diagnostic.retryable === false && providerReallyRejectedImageReference(diagnostic)) {
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
    if (action === 'canonical_policy_audit') return json(await auditAndRepairCanonicalPolicyRegistry(base44, body.requested_category || body.requestedCategory || null));
    if (action === 'route_capabilities') return json({ ok: true, requiredOperation: buildRequiredOperation(body.aspect_ratio || '16:9'), routes: await discoverCompatibleImageRoutes(apiKey), private_development_mode: privateDevelopmentStatus(req) });
    if (action === 'self_test') return await runOpenRouterSelfTest(base44, apiKey, user, req);
    if (action === 'controlled_success_envelope_rerun') return await runControlledSuccessfulEnvelopeRerun(base44, apiKey, user, req, body);
    if (action === 'adult_commercial_route_regression') return await runAdultCommercialRouteRegression(base44, apiKey, user, req);
    if (action === 'seedream_adapter_regression') return await runSeedDreamAdapterRegression(apiKey, body);
    if (action === 'generate') return await generateCover(base44, apiKey, body, user, req);
    return json({ ok: false, error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('Rendering Intelligence error:', error.message);
    return json({ ok: false, error: 'Rendering Intelligence failed before the request could complete.', code: error.message === 'timeout' ? 'timeout' : 'server_error' }, 500);
  }
});