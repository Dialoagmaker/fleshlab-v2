import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const SECRET_NAME = 'KIMI_API_KEY';
const EXISTING_TEXT_MODEL_SECRET = 'KIMI_MODEL';
const PRIMARY_MODEL = 'black-forest-labs/flux.2-pro';
const QUALITY_MODEL = 'black-forest-labs/flux.2-max';
const MAX_DATA_URL_CHARS = 12_000_000;

const COVER_PROMPT = `Create a cinematic promotional cover using the supplied reference image.

Preserve the same adult performer:
- preserve face
- preserve hairstyle
- preserve tattoos
- preserve skin tone
- preserve body proportions
- preserve pose where possible
- do not replace the performer
- do not add extra people

Improve only:
- lighting
- depth
- atmosphere
- background composition
- cinematic framing
- background extension
- visual polish

Create dark negative space on the left for later typography.

Visual style:
- FLESHLAB cinematic branding
- black and deep red accents
- raw but premium
- modern movie-poster composition
- strong subject separation
- no generated text
- no generated logos
- no generated watermark

The final typography must be added locally after generation.`;

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
  if (status === 401 || status === 403) return { code: 'api_authentication_failure', message: 'OpenRouter API authentication failed.' };
  if (status === 402 || lower.includes('credit') || lower.includes('insufficient')) return { code: 'credit_exhausted', message: 'OpenRouter credit is exhausted or insufficient.' };
  if (status === 404 || lower.includes('not found') || lower.includes('unsupported')) return { code: 'unsupported_model', message: 'The requested OpenRouter image model is unavailable or unsupported.' };
  if (status === 429) return { code: 'rate_limit', message: 'OpenRouter rate limit reached.' };
  if (lower.includes('refus') || lower.includes('policy') || lower.includes('moderation')) return { code: 'provider_refusal', message: 'The provider refused this image request.' };
  if (lower.includes('image') && lower.includes('unavailable')) return { code: 'image_generation_unavailable', message: 'OpenRouter image generation is unavailable for this model/provider.' };
  return { code: 'openrouter_error', message: `OpenRouter request failed with status ${status}.` };
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

async function auditOpenRouter(apiKey) {
  const [credits, primarySupport, qualitySupport] = await Promise.all([
    fetchCredits(apiKey).catch(error => ({ ok: false, error: { code: error.message === 'timeout' ? 'timeout' : 'credit_check_failed', message: error.message } })),
    fetchImageModelSupport(apiKey, PRIMARY_MODEL).catch(error => ({ ok: false, model: PRIMARY_MODEL, error: { code: error.message === 'timeout' ? 'timeout' : 'model_check_failed', message: error.message } })),
    fetchImageModelSupport(apiKey, QUALITY_MODEL).catch(error => ({ ok: false, model: QUALITY_MODEL, error: { code: error.message === 'timeout' ? 'timeout' : 'model_check_failed', message: error.message } }))
  ]);

  return {
    ok: true,
    secret_name_used: SECRET_NAME,
    model_secret_name: EXISTING_TEXT_MODEL_SECRET,
    existing_openrouter_functions: [
      { name: 'generateVideoTextFromIdea', endpoint: '/api/v1/chat/completions', purpose: 'Kimi/OpenRouter adult SEO metadata text generation' }
    ],
    current_openrouter_endpoint_used: 'https://openrouter.ai/api/v1/chat/completions',
    image_generation_endpoint_to_use: 'https://openrouter.ai/api/v1/images',
    credits,
    image_generation_support: { primary: primarySupport, quality: qualitySupport },
    current_integration_supports_image_generation: false,
    note: 'Existing integration is text-only via chat completions; this function adds image generation through the dedicated OpenRouter Images API.'
  };
}

async function callImageGeneration(apiKey, model, frameDataUrl, aspectRatio) {
  const payload = {
    model,
    prompt: COVER_PROMPT,
    input_references: [{ type: 'image_url', image_url: { url: frameDataUrl } }],
    aspect_ratio: aspectRatio || '16:9',
    resolution: '1K',
    output_format: 'png',
    n: 1,
    provider: { allow_fallbacks: false }
  };

  const res = await openRouterFetch('/images', apiKey, { method: 'POST', body: JSON.stringify(payload) }, 180000);
  const text = await res.text();
  if (!res.ok) {
    const normalized = normalizeError(res.status, text);
    throw new Error(JSON.stringify({ ...normalized, status: res.status }));
  }
  const data = JSON.parse(text);
  const first = data?.data?.[0];
  if (!first?.b64_json) throw new Error(JSON.stringify({ code: 'malformed_image_response', message: 'OpenRouter returned no image data.' }));
  const mediaType = first.media_type || 'image/png';
  return { image_data_url: `data:${mediaType};base64,${first.b64_json}`, media_type: mediaType, usage: data?.usage || null };
}

async function generateCover(apiKey, body) {
  const { frame_data_url, consent, model_quality = 'pro', aspect_ratio = '16:9' } = body || {};
  if (!consent) return json({ ok: false, error: 'User confirmation is required before sending the selected still image to OpenRouter.', code: 'consent_required' }, 400);
  if (!frame_data_url || !String(frame_data_url).startsWith('data:image/')) return json({ ok: false, error: 'A selected still image data URL is required.', code: 'missing_frame' }, 400);
  if (String(frame_data_url).length > MAX_DATA_URL_CHARS || estimateBytesFromDataUrl(frame_data_url) > 9_000_000) return json({ ok: false, error: 'Selected still image is too large for OpenRouter upload.', code: 'image_too_large' }, 413);

  const models = model_quality === 'max' ? [QUALITY_MODEL] : [PRIMARY_MODEL, QUALITY_MODEL];
  const errors = [];
  for (const model of models) {
    try {
      const result = await callImageGeneration(apiKey, model, frame_data_url, aspect_ratio);
      return json({
        ok: true,
        generated_image_data_url: result.image_data_url,
        media_type: result.media_type,
        model_used: model,
        fallback_used: model !== models[0],
        usage: result.usage,
        cost_reported: result.usage?.cost ?? null,
        privacy: {
          original_video_transmitted: false,
          selected_approved_still_transmitted: true,
          generated_image_received_from_openrouter: true,
          final_typography_added_locally: true
        }
      });
    } catch (error) {
      let parsed;
      try { parsed = JSON.parse(error.message); } catch (_) { parsed = { code: error.message === 'timeout' ? 'timeout' : 'openrouter_error', message: error.message }; }
      errors.push({ model, ...parsed });
      if (parsed.code === 'api_authentication_failure' || parsed.code === 'credit_exhausted' || parsed.code === 'rate_limit') break;
    }
  }
  return json({ ok: false, error: errors[0]?.message || 'OpenRouter image generation failed.', errors }, 502);
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