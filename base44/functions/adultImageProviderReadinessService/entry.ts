import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const SECRET_NAME = 'KIMI_API_KEY';
const POLICY_REVIEW_DATE = '2026-07-20';

function json(data, status = 200) { return Response.json(data, { status }); }
function safeJson(value) { try { return JSON.stringify(value || null); } catch (_) { return '{}'; } }
function isAdmin(user) { return user && ['admin', 'super_admin'].includes(user.role); }

const SEED_PROVIDERS = [
  {
    provider_name: 'Google AI Studio', openrouter_provider_slug: 'google-ai-studio', model_id: 'google/gemini-2.5-flash-image', endpoint_id: 'openrouter:google-ai-studio',
    text_to_image_support: true, image_to_image_support: true, multi_reference_support: true, maximum_input_resolution: 'provider endpoint default', supports_16_9: true,
    documented_adult_content_policy: 'Production observation: Google AI Studio returned "Gemini blocked the request (PROHIBITED_CONTENT)" for an explicit verified-adult reference frame. Do not route explicit adult frames here.',
    explicit_adult_image_processing_permitted: 'no', verified_adults_only_requirement: 'Not applicable; explicit adult reference-image processing is not approved.',
    prohibited_categories: 'Provider/content policy restriction for prohibited explicit content; never use for explicit adult reference frames.',
    policy_source_url: 'https://policies.google.com/terms/generative-ai/use-policy', policy_last_verified_date: POLICY_REVIEW_DATE, enabled: false, priority: 900, cost: 0.00003, zero_data_retention_status: 'unknown', technical_status: 'compatible'
  },
  {
    provider_name: 'NovitaAI', openrouter_provider_slug: 'novita', model_id: 'black-forest-labs/flux.2-pro', endpoint_id: 'openrouter:novita',
    text_to_image_support: false, image_to_image_support: false, multi_reference_support: false, maximum_input_resolution: 'unknown', supports_16_9: false,
    documented_adult_content_policy: 'Novita terms list pornography or graphic adult content/images/products among unauthorized marketplace offerings. This is not approved for explicit adult image processing.',
    explicit_adult_image_processing_permitted: 'no', verified_adults_only_requirement: 'Not applicable; explicit adult reference-image processing is not approved.',
    prohibited_categories: 'Pornography or graphic adult content/images/products per terms; illegal or unauthorized content.',
    policy_source_url: 'https://novita.ai/legal/terms-of-service', policy_last_verified_date: POLICY_REVIEW_DATE, enabled: false, priority: 900, cost: 0, zero_data_retention_status: 'unknown', technical_status: 'unknown'
  },
  {
    provider_name: 'Together AI', openrouter_provider_slug: 'together', model_id: 'black-forest-labs/flux.2-pro', endpoint_id: 'openrouter:together',
    text_to_image_support: false, image_to_image_support: false, multi_reference_support: false, maximum_input_resolution: 'unknown', supports_16_9: false,
    documented_adult_content_policy: 'Together terms prohibit using services to communicate material that is obscene or constitutes pornography. This is not approved for explicit adult image processing.',
    explicit_adult_image_processing_permitted: 'no', verified_adults_only_requirement: 'Not applicable; explicit adult reference-image processing is not approved.',
    prohibited_categories: 'Pornography, obscene material, harmful-to-minors material, unlawful content.',
    policy_source_url: 'https://www.together.ai/terms-of-service', policy_last_verified_date: POLICY_REVIEW_DATE, enabled: false, priority: 900, cost: 0, zero_data_retention_status: 'configurable', technical_status: 'unknown'
  },
  {
    provider_name: 'Venice', openrouter_provider_slug: 'venice', model_id: 'black-forest-labs/flux.2-pro', endpoint_id: 'openrouter:venice',
    text_to_image_support: false, image_to_image_support: false, multi_reference_support: false, maximum_input_resolution: 'unknown', supports_16_9: false,
    documented_adult_content_policy: 'Public terms require lawful use and prohibit unlawful/harmful/obscene content. No current written confirmation found in this review that OpenRouter-hosted Venice endpoints permit lawful explicit adult reference-image editing.',
    explicit_adult_image_processing_permitted: 'unknown', verified_adults_only_requirement: 'Written provider confirmation required before enabling explicit adult routing.',
    prohibited_categories: 'Illegal, harmful, defamatory, obscene, rights-violating content; third-party provider terms may apply.',
    policy_source_url: 'https://venice.ai/legal/tos', policy_last_verified_date: POLICY_REVIEW_DATE, enabled: false, priority: 500, cost: 0, zero_data_retention_status: 'unknown', technical_status: 'unknown'
  },
  {
    provider_name: 'DeepInfra', openrouter_provider_slug: 'deepinfra', model_id: 'black-forest-labs/flux.2-pro', endpoint_id: 'openrouter:deepinfra',
    text_to_image_support: false, image_to_image_support: false, multi_reference_support: false, maximum_input_resolution: 'unknown', supports_16_9: false,
    documented_adult_content_policy: 'Terms allow legal commercial purposes unless prohibited and defer to model terms; no current explicit written approval found for lawful explicit adult reference-image editing via OpenRouter.',
    explicit_adult_image_processing_permitted: 'unknown', verified_adults_only_requirement: 'Written provider confirmation required before enabling explicit adult routing.',
    prohibited_categories: 'Illegal activity, unlawful/fraudulent/deceptive conduct, third-party model restrictions.',
    policy_source_url: 'https://deepinfra.com/terms', policy_last_verified_date: POLICY_REVIEW_DATE, enabled: false, priority: 500, cost: 0, zero_data_retention_status: 'unknown', technical_status: 'unknown'
  },
  {
    provider_name: 'Nebius', openrouter_provider_slug: 'nebius', model_id: 'black-forest-labs/flux.2-pro', endpoint_id: 'openrouter:nebius',
    text_to_image_support: false, image_to_image_support: false, multi_reference_support: false, maximum_input_resolution: 'unknown', supports_16_9: false,
    documented_adult_content_policy: 'AUP prohibits child or illegal pornography, bestiality, and non-consensual sex acts. No current explicit written approval found for lawful explicit adult reference-image editing via OpenRouter.',
    explicit_adult_image_processing_permitted: 'unknown', verified_adults_only_requirement: 'Written provider confirmation required before enabling explicit adult routing.',
    prohibited_categories: 'Child/illegal pornography, bestiality, non-consensual sex acts, unlawful content.',
    policy_source_url: 'https://docs.nebius.com/legal/aup', policy_last_verified_date: POLICY_REVIEW_DATE, enabled: false, priority: 500, cost: 0, zero_data_retention_status: 'unknown', technical_status: 'unknown'
  },
  {
    provider_name: 'Fireworks', openrouter_provider_slug: 'fireworks', model_id: 'black-forest-labs/flux.2-pro', endpoint_id: 'openrouter:fireworks',
    text_to_image_support: false, image_to_image_support: false, multi_reference_support: false, maximum_input_resolution: 'unknown', supports_16_9: false,
    documented_adult_content_policy: 'Docs state model safety behaviors vary and are inherited from model creators; no current explicit written approval found for lawful explicit adult reference-image editing via OpenRouter.',
    explicit_adult_image_processing_permitted: 'unknown', verified_adults_only_requirement: 'Written provider confirmation required before enabling explicit adult routing.',
    prohibited_categories: 'Model-specific restrictions; written provider confirmation required.',
    policy_source_url: 'https://docs.fireworks.ai/faq/models/inference/limitations-controls', policy_last_verified_date: POLICY_REVIEW_DATE, enabled: false, priority: 500, cost: 0, zero_data_retention_status: 'unknown', technical_status: 'unknown'
  },
  {
    provider_name: 'Private ComfyUI Worker', openrouter_provider_slug: 'private-comfyui-worker', model_id: 'private/flux-or-sdxl-adult-approved', endpoint_id: 'private:comfyui',
    text_to_image_support: true, image_to_image_support: true, multi_reference_support: true, maximum_input_resolution: 'configurable', supports_16_9: true,
    documented_adult_content_policy: 'Private worker route prepared but not operational. May only be enabled after infrastructure confirms verified-adult-only lawful processing, no training, private transport, retention controls, and deletion after completion.',
    explicit_adult_image_processing_permitted: 'unknown', verified_adults_only_requirement: 'Mandatory: all depicted people verified 18+, consent and rights confirmed, source belongs to platform, audit evidence stored.',
    prohibited_categories: 'Minors or age-ambiguous people, coercion, non-consensual content, hidden-camera material, exploitation, incest, bestiality, sexual violence, illegal content.',
    policy_source_url: 'internal-private-worker-policy-required', policy_last_verified_date: POLICY_REVIEW_DATE, enabled: false, priority: 100, cost: 0, zero_data_retention_status: 'configurable', technical_status: 'unknown'
  }
];

async function openRouterFetch(path, apiKey) {
  const res = await fetch(`${OPENROUTER_BASE}${path}`, { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) { data = null; }
  if (!res.ok) throw new Error(text || `OpenRouter ${res.status}`);
  return data;
}

async function seedProviders(base44) {
  const existing = await base44.asServiceRole.entities.AdultImageProviderRegistry.list('-created_date', 500);
  const existingKeys = new Set(existing.map(item => `${item.openrouter_provider_slug}:${item.model_id}`));
  const missing = SEED_PROVIDERS.filter(item => !existingKeys.has(`${item.openrouter_provider_slug}:${item.model_id}`));
  if (missing.length) await base44.asServiceRole.entities.AdultImageProviderRegistry.bulkCreate(missing);
  return { created: missing.length };
}

function endpointSupports(endpoint, key) { return Boolean(endpoint?.supported_parameters?.[key]); }
function descriptorAllows(descriptor, desired) {
  if (!descriptor) return false;
  if (descriptor.type === 'enum') return Array.isArray(descriptor.values) && descriptor.values.includes(desired);
  return true;
}
function estimateEndpointCost(endpoint) {
  const lines = Array.isArray(endpoint?.pricing) ? endpoint.pricing : [];
  const output = lines.find(line => line.billable === 'output_image') || lines[0];
  return output ? Number(output.cost_usd || 0) : 0;
}

async function discoverOpenRouter(apiKey) {
  const catalog = await openRouterFetch('/images/models', apiKey);
  const models = Array.isArray(catalog?.data) ? catalog.data : [];
  const imageModels = models.filter(model => {
    const input = model?.architecture?.input_modalities || [];
    const output = model?.architecture?.output_modalities || [];
    return output.includes('image') && (input.includes('image') || model?.supported_parameters?.input_references);
  }).slice(0, 20);
  const rows = [];
  for (const model of imageModels) {
    const endpointsData = await openRouterFetch(`/images/models/${model.id}/endpoints`, apiKey).catch(() => ({ endpoints: [] }));
    const endpoints = Array.isArray(endpointsData?.endpoints) ? endpointsData.endpoints : [];
    endpoints.forEach(endpoint => {
      const params = endpoint.supported_parameters || model.supported_parameters || {};
      rows.push({
        provider_name: endpoint.provider_name || endpoint.provider_slug || endpoint.provider_tag,
        provider_slug: endpoint.provider_slug || endpoint.provider_tag || '',
        provider_tag: endpoint.provider_tag || endpoint.provider_slug || '',
        model_id: model.id,
        model_name: model.name || model.id,
        input_modalities: model?.architecture?.input_modalities || [],
        output_modalities: model?.architecture?.output_modalities || [],
        text_to_image_support: (model?.architecture?.input_modalities || []).includes('text'),
        image_to_image_support: (model?.architecture?.input_modalities || []).includes('image') || endpointSupports(endpoint, 'input_references'),
        multi_reference_support: endpointSupports(endpoint, 'input_references'),
        supports_16_9: descriptorAllows(params.aspect_ratio, '16:9'),
        max_resolution: params.resolution?.values?.join(', ') || 'provider default',
        pricing: endpoint.pricing || [],
        estimated_cost_usd: estimateEndpointCost(endpoint),
        supported_parameters: params
      });
    });
  }
  return rows;
}

async function listReadiness(base44, apiKey) {
  await seedProviders(base44);
  const [providers, logs, audits, discovery] = await Promise.all([
    base44.asServiceRole.entities.AdultImageProviderRegistry.list('priority', 500),
    base44.asServiceRole.entities.OpenRouterImageGenerationLog.list('-created_date', 100),
    base44.asServiceRole.entities.AdultImageRoutingAudit.list('-created_date', 100),
    apiKey ? discoverOpenRouter(apiKey).catch(error => ({ error: error.message })) : Promise.resolve({ error: 'OpenRouter key missing' })
  ]);
  return { ok: true, providers, logs, audits, discovery };
}

async function updateProvider(base44, body) {
  const { id, patch } = body || {};
  if (!id || !patch) return json({ ok: false, error: 'Provider id and patch are required.' }, 400);
  const allowed = ['enabled', 'priority', 'explicit_adult_image_processing_permitted', 'documented_adult_content_policy', 'policy_source_url', 'policy_last_verified_date', 'successful_production_test_date', 'cost', 'zero_data_retention_status', 'admin_notes'];
  const data = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(patch, key)) data[key] = patch[key];
  if (data.explicit_adult_image_processing_permitted === 'yes' && !String(data.policy_source_url || patch.policy_source_url || '').startsWith('http') && String(data.policy_source_url || patch.policy_source_url || '') !== 'internal-private-worker-policy-required') {
    return json({ ok: false, error: 'Policy source evidence is required before marking explicit adult processing as permitted.' }, 400);
  }
  const updated = await base44.asServiceRole.entities.AdultImageProviderRegistry.update(id, data);
  return json({ ok: true, provider: updated });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) return json({ ok: false, error: 'Unauthorized: admin access required' }, 403);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';
    const apiKey = Deno.env.get(SECRET_NAME);
    if (action === 'list') return json(await listReadiness(base44, apiKey));
    if (action === 'seed') return json({ ok: true, ...(await seedProviders(base44)) });
    if (action === 'update_provider') return await updateProvider(base44, body);
    return json({ ok: false, error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('adultImageProviderReadinessService error', error.message);
    return json({ ok: false, error: error.message }, 500);
  }
});