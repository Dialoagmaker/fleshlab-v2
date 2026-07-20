import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const SECRET_NAME = 'KIMI_API_KEY';
const EXISTING_TEXT_MODEL_SECRET = 'KIMI_MODEL';
const PRIMARY_MODEL = 'black-forest-labs/flux.2-pro';
const QUALITY_MODEL = 'black-forest-labs/flux.2-max';
const AI_PHOTOGRAPHER_PROVIDERS = [
  {
    id: 'openrouter_flux',
    type: 'openrouter',
    label: 'AI Photographer',
    secret_name: SECRET_NAME,
    candidates: [
      { model: QUALITY_MODEL, role: 'premium commercial detail pass' },
      { model: PRIMARY_MODEL, role: 'fast photoreal campaign pass' }
    ]
  }
];
const AI_PHOTOGRAPHER_CANDIDATES = AI_PHOTOGRAPHER_PROVIDERS.flatMap(provider => provider.candidates.map(candidate => ({ ...candidate, provider_id: provider.id })));

function getConfiguredPhotographerProviders(apiKey) {
  return AI_PHOTOGRAPHER_PROVIDERS
    .map(provider => provider.type === 'openrouter' ? { ...provider, apiKey } : provider)
    .filter(provider => provider.type !== 'openrouter' || Boolean(provider.apiKey));
}
const MAX_DATA_URL_CHARS = 12_000_000;

const KEY_ART_DIRECTOR_PROMPT = `You are the FLESHLAB AI Photographer Engine.

Core principle: FLESHLAB covers are not layouts. They are professional advertising photographs with branding applied afterwards.

Internal role:
"Imagine I am a senior commercial photographer hired to capture this exact scene for a premium streaming service."

Use two separate visual references when provided:
- Identity Reference: preserve the same performer, face, body, tattoos, hairstyle, proportions, and recognisable appearance.
- Story Reference: preserve the same action, location, room, emotional tone, scene logic, and visual story.

Creative Director analysis to perform before generation:
- what is happening
- why this moment matters
- who is the hero
- what emotion sells the video
- what visual story should be communicated
- what should dominate
- what should disappear

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
- same performer
- same body and proportions
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

Acceptance standard:
The output must plausibly look like a professionally photographed promotional still that could sit beside Netflix artwork, Prime Video artwork, AAA game key art, premium entertainment marketing, and approved FLESHLAB covers.

Output ONLY the professional 16:9 hero photograph. Branding and typography will be applied locally after this image is approved.`;

function json(data, status = 200) {
  return Response.json(data, { status });
}

function isAllowedStaff(user) {
  return user && ['admin', 'super_admin', 'manager', 'staff', 'employee'].includes(user.role);
}

function estimateBytesFromDataUrl(dataUrl) {
  const base64 = String(dataUrl || '').split(',')[1] || '';
  return Math.floor(base64.length * 0.75);
}

function normalizeError(status, bodyText) {
  const lower = String(bodyText || '').toLowerCase();
  const raw = String(bodyText || '').slice(0, 1200);
  if (status === 401 || status === 403) return { code: 'api_authentication_failure', message: 'OpenRouter API authentication failed.', raw };
  if (status === 402 || lower.includes('credit') || lower.includes('insufficient')) return { code: 'credit_exhausted', message: 'OpenRouter credit is exhausted or insufficient.', raw };
  if (status === 404 || lower.includes('not found') || lower.includes('unsupported')) return { code: 'unsupported_model', message: 'The requested OpenRouter image model is unavailable or unsupported.', raw };
  if (status === 422 && (lower.includes('invalid') || lower.includes('corrupted image'))) return { code: 'invalid_reference_image', message: 'The AI Photographer rejected the reference image as invalid or corrupted.', raw };
  if (status === 429) return { code: 'rate_limit', message: 'OpenRouter rate limit reached.', raw };
  if (lower.includes('refus') || lower.includes('policy') || lower.includes('moderation')) return { code: 'provider_refusal', message: 'The provider refused this image request.', raw };
  if (lower.includes('image') && lower.includes('unavailable')) return { code: 'image_generation_unavailable', message: 'OpenRouter image generation is unavailable for this model/provider.', raw };
  return { code: 'openrouter_error', message: `OpenRouter request failed with status ${status}.`, raw };
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
        'X-Title': 'FLESHLAB AI Media Studio',
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

async function fetchCredits(apiKey) {
  const res = await openRouterFetch('/credits', apiKey, { method: 'GET' }, 30000);
  const text = await res.text();
  if (!res.ok) return { ok: false, error: normalizeError(res.status, text), raw_status: res.status };
  const data = JSON.parse(text);
  const totalCredits = Number(data?.data?.total_credits ?? data?.total_credits ?? 0);
  const totalUsage = Number(data?.data?.total_usage ?? data?.total_usage ?? 0);
  const remaining = Number((totalCredits - totalUsage).toFixed(6));
  return { ok: true, total_credits: totalCredits, total_usage: totalUsage, remaining_credit: remaining, sufficient_credit: remaining > 0 };
}

async function fetchImageModelSupport(apiKey, model) {
  const res = await openRouterFetch(`/images/models/${model}/endpoints`, apiKey, { method: 'GET' }, 30000);
  const text = await res.text();
  if (!res.ok) return { ok: false, model, error: normalizeError(res.status, text), raw_status: res.status };
  const data = JSON.parse(text);
  const endpoints = data?.endpoints || [];
  return {
    ok: true,
    model,
    endpoint: '/api/v1/images',
    endpoint_count: endpoints.length,
    supports_image_generation: endpoints.length > 0,
    supports_image_reference: true,
    pricing: endpoints[0]?.pricing || []
  };
}

async function getAvailablePhotographersForProvider(provider) {
  if (provider.type !== 'openrouter') return [];
  const checked = await Promise.all(provider.candidates.map(candidate =>
    fetchImageModelSupport(provider.apiKey, candidate.model)
      .then(support => ({ ...candidate, provider_id: provider.id, support }))
      .catch(error => ({ ...candidate, provider_id: provider.id, support: { ok: false, model: candidate.model, error: { code: error.message === 'timeout' ? 'timeout' : 'model_check_failed', message: error.message } } }))
  ));
  const available = checked.filter(item => item.support?.supports_image_generation);
  return available.length ? available : checked;
}

async function getAvailablePhotographers(apiKey) {
  const providers = getConfiguredPhotographerProviders(apiKey);
  const providerPhotographers = await Promise.all(providers.map(provider => getAvailablePhotographersForProvider(provider)));
  return providerPhotographers.flat();
}

async function auditOpenRouter(apiKey) {
  const [credits, photographers] = await Promise.all([
    fetchCredits(apiKey).catch(error => ({ ok: false, error: { code: error.message === 'timeout' ? 'timeout' : 'credit_check_failed', message: error.message } })),
    getAvailablePhotographers(apiKey)
  ]);

  return {
    ok: true,
    secret_name_used: SECRET_NAME,
    model_secret_name: EXISTING_TEXT_MODEL_SECRET,
    existing_openrouter_functions: [
      { name: 'generateVideoTextFromIdea', endpoint: '/api/v1/chat/completions', purpose: 'Kimi/OpenRouter adult SEO metadata text generation' }
    ],
    current_openrouter_endpoint_used: 'https://openrouter.ai/api/v1/images',
    image_generation_endpoint_to_use: 'https://openrouter.ai/api/v1/images',
    credits,
    image_generation_support: photographers.reduce((map, item) => ({ ...map, [item.model]: item.support }), {}),
    ai_photographer_router: photographers.map(item => ({ model: item.model, role: item.role, available: Boolean(item.support?.supports_image_generation) })),
    current_integration_supports_image_generation: false,
    note: 'OpenRouter is used as the FLESHLAB AI Photographer: selected frames are reference material only, a professional hero photograph is generated first, and final typography/branding are added locally after approval.'
  };
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
    'Same performer, same action, same room/location, same story, same emotional tone.',
    'Improve only camera, lighting, lens, depth, color science, contrast, composition, and cinematic realism.',
  ].filter(Boolean).join('\n');
}

function buildKeyArtPrompt(metadata = {}) {
  const referenceMode = metadata.identityReferenceProvided
    ? 'Reference order: image 1 is IDENTITY ONLY; image 2 is STORY/MOMENT ONLY. Preserve identity from image 1 and story from image 2.'
    : 'Only a Story Reference was supplied. Generate anyway, but identity preservation may be weaker.';
  const loopNote = metadata.regenerationDirective ? `\n\nPrevious creative review directive to fix:\n${metadata.regenerationDirective}` : '';
  return `${KEY_ART_DIRECTOR_PROMPT}\n\n${referenceMode}\n\n${buildPhotographicBrief(metadata)}${loopNote}`;
}

async function callImageGeneration(apiKey, model, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata = {}) {
  const inputReferences = identityReferenceDataUrl
    ? [
      { type: 'image_url', image_url: { url: identityReferenceDataUrl } },
      { type: 'image_url', image_url: { url: storyReferenceDataUrl } }
    ]
    : [{ type: 'image_url', image_url: { url: storyReferenceDataUrl } }];
  const payload = {
    model,
    prompt: buildKeyArtPrompt({ ...metadata, identityReferenceProvided: Boolean(identityReferenceDataUrl) }),
    input_references: inputReferences,
    aspect_ratio: aspectRatio || '16:9',
    resolution: '1K',
    output_format: 'png',
    n: 1,
    provider: { allow_fallbacks: false }
  };
  const payloadSummary = {
    model,
    endpoint: '/api/v1/images',
    aspect_ratio: payload.aspect_ratio,
    resolution: payload.resolution,
    output_format: payload.output_format,
    reference_count: inputReferences.length,
    story_reference_bytes_estimate: estimateBytesFromDataUrl(storyReferenceDataUrl),
    identity_reference_bytes_estimate: identityReferenceDataUrl ? estimateBytesFromDataUrl(identityReferenceDataUrl) : 0
  };

  let res;
  try {
    res = await openRouterFetch('/images', apiKey, { method: 'POST', body: JSON.stringify(payload) }, 180000);
  } catch (error) {
    throw new Error(JSON.stringify({ code: error.message === 'timeout' ? 'timeout' : 'request_failed', message: error.message, failed_stage: 'request_sent', payload_summary: payloadSummary }));
  }
  const text = await res.text();
  if (!res.ok) {
    const normalized = normalizeError(res.status, text);
    throw new Error(JSON.stringify({ ...normalized, status: res.status, failed_stage: 'response_received', payload_summary: payloadSummary }));
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error(JSON.stringify({ code: 'malformed_json_response', message: 'OpenRouter response was not valid JSON.', failed_stage: 'response_received', payload_summary: payloadSummary, raw: text.slice(0, 1200) }));
  }
  const first = data?.data?.[0];
  if (!first?.b64_json) throw new Error(JSON.stringify({ code: 'malformed_image_response', message: 'OpenRouter returned no image data.', failed_stage: 'response_received', payload_summary: payloadSummary, raw: JSON.stringify(data).slice(0, 1200) }));
  const mediaType = first.media_type || 'image/png';
  return { image_data_url: `data:${mediaType};base64,${first.b64_json}`, media_type: mediaType, usage: data?.usage || null, payload_summary: payloadSummary };
}

async function runPhotographerProvider(provider, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata) {
  if (provider.type !== 'openrouter') throw new Error(JSON.stringify({ code: 'unsupported_provider', message: 'Provider is not compatible with reference-image promotional still generation.' }));
  const photographers = await getAvailablePhotographersForProvider(provider);
  const models = photographers.map(item => item.model);
  const errors = [];
  const photographerAttempts = [];

  for (const model of models) {
    try {
      const result = await callImageGeneration(provider.apiKey, model, storyReferenceDataUrl, identityReferenceDataUrl, aspectRatio, metadata);
      photographerAttempts.push({ provider_id: provider.id, model, status: 'accepted' });
      return { provider, model, result, photographers, photographerAttempts };
    } catch (error) {
      let parsed;
      try { parsed = JSON.parse(error.message); } catch (_) { parsed = { code: error.message === 'timeout' ? 'timeout' : 'provider_error', message: error.message, failed_stage: 'request_sent' }; }
      errors.push({ provider_id: provider.id, model, ...parsed });
      photographerAttempts.push({ provider_id: provider.id, model, status: 'failed', code: parsed.code });
      if (parsed.code === 'api_authentication_failure' || parsed.code === 'credit_exhausted' || parsed.code === 'rate_limit' || parsed.code === 'invalid_reference_image') break;
    }
  }

  throw new Error(JSON.stringify({ code: 'provider_declined', message: 'Provider could not produce the promotional still.', provider_id: provider.id, errors, photographerAttempts }));
}

async function generateCover(apiKey, body) {
  const { frame_data_url, story_reference_data_url, identity_reference_data_url, consent, aspect_ratio = '16:9', metadata = {} } = body || {};
  const storyReferenceDataUrl = story_reference_data_url || frame_data_url;
  const identityReferenceDataUrl = identity_reference_data_url || null;
  if (!consent) return json({ ok: false, error: 'The promotional still could not be produced yet.', code: 'consent_required' }, 400);
  if (!storyReferenceDataUrl || !String(storyReferenceDataUrl).startsWith('data:image/')) return json({ ok: false, error: 'Choose a story frame before producing the promotional still.', code: 'missing_frame' }, 400);
  if (String(storyReferenceDataUrl).length > MAX_DATA_URL_CHARS || estimateBytesFromDataUrl(storyReferenceDataUrl) > 9_000_000) return json({ ok: false, error: 'Choose a smaller story frame before producing the promotional still.', code: 'image_too_large' }, 413);
  if (identityReferenceDataUrl && (!String(identityReferenceDataUrl).startsWith('data:image/') || String(identityReferenceDataUrl).length > MAX_DATA_URL_CHARS || estimateBytesFromDataUrl(identityReferenceDataUrl) > 9_000_000)) return json({ ok: false, error: 'Choose a different story frame before producing the promotional still.', code: 'identity_image_too_large' }, 413);

  const providers = getConfiguredPhotographerProviders(apiKey);
  const allErrors = [];
  const allAttempts = [];
  for (const provider of providers) {
    try {
      const { model, result, photographers, photographerAttempts } = await runPhotographerProvider(provider, storyReferenceDataUrl, identityReferenceDataUrl, aspect_ratio, metadata);
      return json({
        ok: true,
        generated_image_data_url: result.image_data_url,
        media_type: result.media_type,
        provider_used: provider.id,
        model_used: model,
        fallback_used: allErrors.length > 0 || model !== photographers[0]?.model,
        photographer_attempts: [...allAttempts, ...photographerAttempts],
        ai_photographer_router: photographers.map(item => ({ provider_id: provider.id, model: item.model, role: item.role })),
        usage: result.usage,
        cost_reported: result.usage?.cost ?? null,
        creative_brief: buildPhotographicBrief(metadata),
        pipeline: ['Video', 'Moment Selection', 'Creative Director', 'Photographic Brief', 'AI Photographer', 'Professional Hero Image', 'Art Director', 'Typography', 'Branding', 'Quality Review', 'Export'],
        privacy: {
          original_video_transmitted: false,
          story_reference_transmitted: true,
          identity_reference_transmitted: Boolean(identityReferenceDataUrl),
          generated_image_received_from_provider: true,
          ai_role: 'professional_promotional_photographer',
          ai_generates_cover_base_artwork: true,
          ai_generates_typography_or_logo: false,
          original_frame_is_reference_only: true,
          final_branding_and_typography_added_locally_after_hero_approval: true
        }
      });
    } catch (error) {
      let parsed;
      try { parsed = JSON.parse(error.message); } catch (_) { parsed = { code: 'provider_error', message: error.message, provider_id: provider.id }; }
      console.warn('AI Photographer provider failed', JSON.stringify(parsed));
      allErrors.push(parsed);
      allAttempts.push(...(parsed.photographerAttempts || []));
    }
  }
  console.error('AI Photographer all providers failed', JSON.stringify(allErrors));
  return json({ ok: false, error: 'The promotional still could not be produced with the configured photographers. Try another frame or adjust the editorial information.', code: 'all_photographer_providers_failed' }, 502);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAllowedStaff(user)) return json({ ok: false, error: 'Unauthorized: staff access required' }, 403);

    const apiKey = Deno.env.get(SECRET_NAME);
    if (!apiKey) return json({ ok: false, error: `${SECRET_NAME} is not configured`, code: 'missing_secret' }, 500);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'audit';
    if (action === 'audit') return json(await auditOpenRouter(apiKey));
    if (action === 'generate') return await generateCover(apiKey, body);
    return json({ ok: false, error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('openRouterAICover error:', error.message);
    return json({ ok: false, error: error.message === 'timeout' ? 'OpenRouter request timed out.' : error.message, code: error.message === 'timeout' ? 'timeout' : 'server_error' }, 500);
  }
});