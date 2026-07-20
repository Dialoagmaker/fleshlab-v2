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

const KEY_ART_DIRECTOR_PROMPT = `You are the FLESHLAB AI Photographer Engine.

Core principle: FLESHLAB covers are not layouts. They are professional advertising photographs with branding applied afterwards.

Internal role:
"Imagine I am a senior commercial photographer hired to capture this exact scene for a premium streaming service."

Use two separate visual references when provided:
- Identity Reference: preserve the same performer, face, body, tattoos, hairstyle, proportions, and recognisable appearance.
- Story Reference: preserve the same action, location, room, emotional tone, scene logic, and visual story.

AI Photographer instructions:
- do NOT create fantasy art
- do NOT stylize, cartoonize, paint, posterize, or illustrate
- do NOT invent a different story, different clothing, another performer, or unrelated environment
- do NOT add typography, logo, watermark, captions, UI, or poster text
- do NOT decorate the smartphone frame
- the smartphone frame is reference material only, never the finished artwork
- do NOT crop a portrait or smartphone frame into a landscape image
- re-photograph the scene as a new 16:9 advertising still that naturally expands the environment beyond the original crop
- the editorial title must influence composition, mood, negative space, and where the title should naturally live later

Maintain:
- same performer where technically possible
- same body and proportions where visible
- same tattoos and hairstyle when visible
- same room/location
- same action and emotional tone
- same story

Improve photography only:
- professional cinema camera
- professional lighting
- premium commercial composition
- professional color science
- cinematic lenses and depth
- controlled contrast
- natural skin and realistic environment
- premium 16:9 framing
- useful negative space for later typography

Output ONLY the professional 16:9 hero photograph. Branding and typography will be applied locally after this image is approved.`;

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
  if (!diagnostic) return 'TEMPORARY_PROVIDER_FAILURE: The professional hero photograph could not be generated. Try another frame or retry later.';
  if (diagnostic.category === 'NO_CREDITS') return 'NO_APPROVED_ADULT_PROVIDER: OpenRouter credits are not available for this application key.';
  if (diagnostic.category === 'VERIFICATION_REQUIRED') return 'VERIFICATION_REQUIRED: Verified adult, consent, rights, and source checks are required before external processing.';
  if (diagnostic.category === 'NO_APPROVED_ADULT_PROVIDER') return 'NO_APPROVED_ADULT_PROVIDER: No enabled provider is documented as permitting lawful explicit adult reference-image editing.';
  if (diagnostic.category === 'UNSUPPORTED_REFERENCE_IMAGE' || diagnostic.category === 'UNSUPPORTED_IMAGE_INPUT') return 'UNSUPPORTED_REFERENCE_IMAGE: This model did not accept the reference-image request.';
  if (diagnostic.category === 'INVALID_PAYLOAD') return 'INVALID_IMAGE: The reference-image payload was not accepted. Technical Details show the exact response.';
  if (diagnostic.category === 'CONTENT_POLICY') return 'PROVIDER_POLICY_RESTRICTION: The provider rejected this request under its content policy.';
  if (diagnostic.category === 'RATE_LIMIT' || diagnostic.category === 'TIMEOUT' || diagnostic.category === 'PROVIDER_FAILURE') return 'TEMPORARY_PROVIDER_FAILURE: The provider route failed temporarily.';
  return 'TEMPORARY_PROVIDER_FAILURE: The selected route failed. Try another frame or continue locally.';
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

function estimateEndpointCost(endpoint) {
  const lines = Array.isArray(endpoint?.pricing) ? endpoint.pricing : [];
  const output = lines.find(line => line.billable === 'output_image') || lines[0];
  return output ? Number(output.cost_usd || 0) : null;
}

function isReferenceCompatible(modelRecord, endpoint) {
  const input = modelRecord?.architecture?.input_modalities || [];
  const output = modelRecord?.architecture?.output_modalities || [];
  const modelAcceptsImage = input.includes('image') || endpointSupports(endpoint, 'input_references');
  const modelOutputsImage = output.includes('image');
  const aspect = endpoint?.supported_parameters?.aspect_ratio || modelRecord?.supported_parameters?.aspect_ratio;
  const format = endpoint?.supported_parameters?.output_format || modelRecord?.supported_parameters?.output_format;
  return modelAcceptsImage && modelOutputsImage && descriptorAllows(aspect, '16:9') && (!format || descriptorAllows(format, 'png'));
}

async function discoverCompatibleImageRoutes(apiKey) {
  const catalog = await fetchImageModelCatalog(apiKey);
  const imageModels = catalog.filter(model => {
    const input = model?.architecture?.input_modalities || [];
    const output = model?.architecture?.output_modalities || [];
    return output.includes('image') && (input.includes('image') || model?.supported_parameters?.input_references);
  });
  const sorted = imageModels.sort((a, b) => {
    const ai = PREFERRED_IMAGE_MODELS.indexOf(a.id);
    const bi = PREFERRED_IMAGE_MODELS.indexOf(b.id);
    const ar = ai === -1 ? 999 : ai;
    const br = bi === -1 ? 999 : bi;
    return ar - br || String(a.id).localeCompare(String(b.id));
  });
  const limited = sorted.slice(0, 12);
  const inspected = [];
  for (const model of limited) {
    const endpointResult = await fetchImageModelEndpoints(apiKey, model.id);
    const endpoints = endpointResult.ok ? endpointResult.endpoints : [];
    const compatibleEndpoints = endpoints.filter(endpoint => isReferenceCompatible(model, endpoint));
    inspected.push({
      id: model.id,
      name: model.name || model.id,
      description: model.description || '',
      architecture: model.architecture || {},
      supported_parameters: model.supported_parameters || {},
      endpoint_count: endpoints.length,
      compatible_endpoint_count: compatibleEndpoints.length,
      compatible_endpoints: compatibleEndpoints.map(endpoint => ({
        provider_name: endpoint.provider_name || endpoint.provider_slug || endpoint.provider_tag,
        provider_slug: endpoint.provider_slug || endpoint.provider_tag,
        provider_tag: endpoint.provider_tag || endpoint.provider_slug,
        pricing: endpoint.pricing || [],
        supported_parameters: endpoint.supported_parameters || {},
        estimated_cost_usd: estimateEndpointCost(endpoint)
      }))
    });
  }
  return inspected.filter(model => model.compatible_endpoint_count > 0);
}

function buildPhotographicBrief(metadata = {}) {
  const title = metadata.videoTitle || metadata.title || 'Untitled FLESHLAB scene';
  const performer = metadata.performerName || metadata.performer || 'the selected performer';
  const subtitle = metadata.optionalSubtitle || metadata.subtitle || '';
  const contentType = metadata.contentType || 'premium entertainment scene';
  const campaign = metadata.campaignName || '';
  return [
    'CREATIVE DIRECTOR BRIEF',
    `Story: ${title}`,
    `Hero: ${performer}`,
    subtitle ? `Secondary story: ${subtitle}` : '',
    `Emotion to sell: ${campaign || contentType}`,
    'Dominant read: performer and emotional action, not graphic decoration.',
    'Must disappear: smartphone framing, ugly compression, accidental clutter, amateur lighting, unused canvas.',
    '',
    'PHOTOGRAPHIC BRIEF',
    'Create the exact scene as a professional promotional still, not as cover art.',
    'Same performer where technically possible, same action, same room/location, same story, same emotional tone.',
    'Improve only camera, lighting, lens, depth, color science, contrast, composition, and cinematic realism.'
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

function getContentClassification(metadata = {}) {
  return ['SAFE_MARKETING', 'SUGGESTIVE_ADULT', 'EXPLICIT_VERIFIED_ADULT', 'BLOCKED_OR_UNVERIFIED'].includes(metadata.referenceContentClass)
    ? metadata.referenceContentClass
    : 'BLOCKED_OR_UNVERIFIED';
}

function verificationPassed(metadata = {}) {
  const verification = metadata.adultVerification || {};
  return Boolean(verification.allPeopleVerified18Plus && verification.performerConsentConfirmed && verification.mediaRightsConfirmed && verification.platformSourceConfirmed && String(verification.verificationReference || '').trim());
}

async function getApprovedAdultProviders(base44) {
  try {
    const providers = await base44.asServiceRole.entities.AdultImageProviderRegistry.filter({ enabled: true, explicit_adult_image_processing_permitted: 'yes' }, 'priority', 100);
    return providers || [];
  } catch (_) {
    return [];
  }
}

function routeMatchesApprovedProvider(route, approvedProviders) {
  return route.compatible_endpoints.some(endpoint => approvedProviders.some(provider => {
    const slugs = [endpoint.provider_slug, endpoint.provider_tag, endpoint.provider_name].filter(Boolean).map(value => String(value).toLowerCase());
    const registrySlug = String(provider.openrouter_provider_slug || '').toLowerCase();
    const modelMatches = !provider.model_id || provider.model_id === route.id || provider.model_id === '*';
    return modelMatches && slugs.some(value => value.includes(registrySlug));
  }));
}

async function filterRoutesForPolicy(base44, routes, classification, generationJobId, metadata) {
  if (classification === 'BLOCKED_OR_UNVERIFIED') {
    return { ok: false, status: 409, code: 'VERIFICATION_REQUIRED', routes: [], policyCompatible: 'no', reason: 'Selected frame is blocked or unverified. No external provider request was sent.' };
  }
  if (['SUGGESTIVE_ADULT', 'EXPLICIT_VERIFIED_ADULT'].includes(classification) && !verificationPassed(metadata)) {
    return { ok: false, status: 409, code: 'VERIFICATION_REQUIRED', routes: [], policyCompatible: 'no', reason: 'Verified adult, consent, media-rights, platform-source, and evidence reference are required before external adult image routing.' };
  }
  if (classification === 'SAFE_MARKETING') return { ok: true, routes, policyCompatible: 'unknown', reason: 'Safe marketing route; mainstream technical providers may be used.' };
  const approvedProviders = await getApprovedAdultProviders(base44);
  const approvedRoutes = routes.filter(route => routeMatchesApprovedProvider(route, approvedProviders));
  if (!approvedRoutes.length) {
    await saveRoutingAudit(base44, {
      generation_job_id: generationJobId,
      content_classification: classification,
      verification_status: 'passed',
      verification_reference: metadata.adultVerification?.verificationReference || '',
      routing_decision: 'NO_APPROVED_ADULT_PROVIDER',
      policy_compatible: 'no',
      request_sent: false,
      output_received: false,
      reason: 'No enabled provider has documented YES permission for lawful explicit adult reference-image processing.'
    });
    return { ok: false, status: 409, code: 'NO_APPROVED_ADULT_PROVIDER', routes: [], policyCompatible: 'no', reason: 'No enabled provider is documented as permitting lawful explicit adult reference-image editing. External request was not sent.' };
  }
  return { ok: true, routes: approvedRoutes, policyCompatible: 'yes', reason: 'Adult route restricted to enabled providers with documented YES permission.' };
}

async function callOpenRouterImage(apiKey, route, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata, generationJobId) {
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
      payload_summary: payloadSummary
    };
    throw new Error(safeJson(diagnostic));
  }
  const { text, data } = await readJsonResponse(res);
  if (!res.ok) {
    const diagnostic = parseOpenRouterError(res.status, text, res.headers, payloadSummary);
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
      payload_summary: payloadSummary
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
  const compatibleRoutes = Array.isArray(routes) ? routes : [];
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
    selected_model: preferred ? preferred.id : null,
    selected_model_capability: preferred ? {
      id: preferred.id,
      name: preferred.name,
      input_modalities: preferred.architecture?.input_modalities || [],
      output_modalities: preferred.architecture?.output_modalities || [],
      compatible_provider_count: preferred.compatible_endpoint_count,
      providers: preferred.compatible_endpoints.map(item => ({
        provider_name: item.provider_name,
        provider_slug: item.provider_slug,
        provider_tag: item.provider_tag,
        estimated_cost_usd: item.estimated_cost_usd,
        pricing: item.pricing
      }))
    } : null,
    compatible_models: compatibleRoutes.slice(0, 8).map(route => ({
      id: route.id,
      name: route.name,
      compatible_provider_count: route.compatible_endpoint_count,
      providers: route.compatible_endpoints.map(item => item.provider_name).filter(Boolean),
      estimated_cost_usd: route.compatible_endpoints[0]?.estimated_cost_usd ?? null
    })),
    estimated_generation_cost: estimatedCost,
    monthly_openrouter_spend_usd: monthlySpend,
    endpoint_used: 'https://openrouter.ai/api/v1/images',
    catalog_endpoint_used: 'https://openrouter.ai/api/v1/images/models',
    endpoint_capability_source: '/api/v1/images/models/{model}/endpoints',
    secret_name_used: SECRET_NAME,
    model_secret_name: EXISTING_TEXT_MODEL_SECRET
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

async function runOpenRouterSelfTest(base44, apiKey, user) {
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
  }, user);
}

async function generateCover(base44, apiKey, body, user) {
  const generationJobId = body?.generation_job_id || crypto.randomUUID();
  const { frame_data_url, story_reference_data_url, identity_reference_data_url, consent, aspect_ratio = '16:9', metadata = {} } = body || {};
  const storyReferenceDataUrl = story_reference_data_url || frame_data_url;
  const identityReferenceDataUrl = identity_reference_data_url || null;
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const storyInfo = parseDataUrlInfo(storyReferenceDataUrl);
  const identityInfo = identityReferenceDataUrl ? parseDataUrlInfo(identityReferenceDataUrl) : { ok: true, byte_length: 0 };
  const contentClassification = getContentClassification(metadata);
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

  const compatibleRoutes = await discoverCompatibleImageRoutes(apiKey);
  if (!compatibleRoutes.length) {
    const diagnostic = { category: 'UNSUPPORTED_REFERENCE_IMAGE', message: 'No discovered OpenRouter image model currently accepts image input, image output, and 16:9 generation.', retryable: false };
    logProviderDiagnostic('OpenRouter model discovery failed', diagnostic);
    return json({ ok: false, error: publicFailureMessage(diagnostic), code: 'UNSUPPORTED_REFERENCE_IMAGE', diagnostics: diagnostic }, 503);
  }

  const policyRouting = await filterRoutesForPolicy(base44, compatibleRoutes, contentClassification, generationJobId, metadata);
  if (!policyRouting.ok) {
    return json({
      ok: false,
      error: policyRouting.reason,
      code: policyRouting.code,
      generation_job_id: generationJobId,
      content_classification: contentClassification,
      policy_compatible: policyRouting.policyCompatible,
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

  await saveRoutingAudit(base44, {
    generation_job_id: generationJobId,
    content_classification: contentClassification,
    verification_status: contentClassification === 'SAFE_MARKETING' ? 'not_required' : 'passed',
    verification_reference: metadata.adultVerification?.verificationReference || '',
    routing_decision: policyRouting.reason,
    policy_compatible: policyRouting.policyCompatible,
    request_sent: true,
    output_received: false,
    reason: policyRouting.reason
  });

  const attempts = [];
  const attemptDiagnostics = [];
  let finalDiagnostic = null;
  for (const route of compatibleRoutes.slice(0, MAX_AUTOMATIC_ATTEMPTS)) {
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
        content_classification: contentClassification,
        verification_status: contentClassification === 'SAFE_MARKETING' ? 'not_required' : 'passed',
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
      return json({
        ok: true,
        generated_image_data_url: result.image_data_url,
        media_type: result.media_type,
        provider_used: result.resolved_provider,
        model_used: route.id,
        openrouter_request_id: result.request_id,
        openrouter_generation_id: result.generation_id,
        generation_job_id: generationJobId,
        cost_reported: result.cost,
        usage: result.usage,
        fallback_used: attempts.length > 0,
        photographer_attempts: [...attempts, { model: route.id, provider: result.resolved_provider, status: 'accepted' }],
        attempt_diagnostics: [...attemptDiagnostics, {
          model: route.id,
          provider: result.resolved_provider,
          endpoint: 'POST /api/v1/images',
          http_status: 200,
          openrouter_code: null,
          openrouter_error_message: null,
          request_reached_provider: true,
          rejection_type: null,
          policy_compatible: policyRouting.policyCompatible,
          retryable: false,
          cost: result.cost || 0,
          output_received: true
        }],
        content_classification: contentClassification,
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
        selected_model_capability: {
          id: route.id,
          providers: route.compatible_endpoints.map(item => item.provider_name).filter(Boolean),
          estimated_cost_usd: route.compatible_endpoints[0]?.estimated_cost_usd ?? null
        },
        creative_brief: buildPhotographicBrief(metadata),
        pipeline: ['Video', 'Story Frame', 'Base64 Reference Image', 'OpenRouter Image API', 'Professional Hero Photograph', 'Local Art Direction', 'Typography', 'Export'],
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
      diagnostic.endpoint = 'POST /api/v1/images';
      diagnostic.policy_compatible = policyRouting.policyCompatible;
      finalDiagnostic = diagnostic;
      const attemptDetail = {
        model: route.id,
        provider: diagnostic.provider,
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
      if (['NO_CREDITS', 'AUTH_ERROR'].includes(diagnostic.category)) break;
    }
  }

  return json({
    ok: false,
    error: publicFailureMessage(finalDiagnostic),
    code: 'all_openrouter_routes_failed',
    generation_job_id: generationJobId,
    diagnostics: finalDiagnostic,
    content_classification: contentClassification,
    policy_compatible: policyRouting.policyCompatible,
    request_sent: attempts.length > 0,
    output_received: false,
    photographer_attempts: attempts,
    attempt_diagnostics: attemptDiagnostics,
    stage_trace: {
      frame_extracted: true,
      image_encoded: true,
      payload_created: Boolean(finalDiagnostic?.payload_summary),
      request_sent: Boolean(finalDiagnostic?.payload_summary),
      response_received: Boolean(finalDiagnostic?.http_status),
      hero_image_decoded: false,
      preview_rendered: false
    }
  }, 502);
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
    if (action === 'audit' || action === 'health') return json(await auditOpenRouter(base44, apiKey));
    if (action === 'self_test') return await runOpenRouterSelfTest(base44, apiKey, user);
    if (action === 'generate') return await generateCover(base44, apiKey, body, user);
    return json({ ok: false, error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('openRouterAICover error:', error.message);
    return json({ ok: false, error: 'The OpenRouter AI Photographer service failed before the request could complete.', code: error.message === 'timeout' ? 'timeout' : 'server_error' }, 500);
  }
});