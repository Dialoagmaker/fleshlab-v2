import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const BASE_URL = 'https://fleshlab.online';
const RECRUITMENT_EVENTS = new Set(['recruitment_campaign_visit','performer_apply_click','application_start','application_complete','application_submit','whatsapp_click','whatsapp_recruitment_click','philippines_whatsapp_click']);

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `campaign-${Date.now()}`;
}

function clean(value) { return String(value || '').trim(); }
function now() { return new Date().toISOString(); }

function buildUrl(data) {
  const landing = clean(data.landing_page) || '/gay-performer-recruitment-philippines';
  const url = new URL(landing.startsWith('http') ? landing : `${BASE_URL}${landing.startsWith('/') ? landing : `/${landing}`}`);
  const params = {
    utm_source: data.source,
    utm_medium: data.medium,
    utm_campaign: data.campaign,
    utm_content: data.content,
    utm_term: data.term,
    market: data.country,
    ref: data.referral_code,
    campaign_id: data.slug,
  };
  Object.entries(params).forEach(([key, value]) => { if (clean(value)) url.searchParams.set(key, clean(value)); });
  return url.toString();
}

function parseMeta(row) {
  try { return JSON.parse(row.metadata_json || '{}') || {}; } catch { return {}; }
}

function attr(meta, row) {
  return {
    source: meta.utm_source || meta.source || '(direct)',
    medium: meta.utm_medium || meta.medium || '(none)',
    campaign: meta.utm_campaign || meta.campaign || '(not set)',
    country: meta.utm_market || meta.market || meta.country || '(unknown)',
    landing_page: meta.source_page || row.source_page || meta.page_path || '(unknown)',
    referral_code: meta.referral_code || meta.ref || '(none)',
    campaign_id: meta.campaign_id || meta.recruitment_campaign_id || null,
  };
}

function keyFor(row, dimension) {
  const meta = parseMeta(row);
  const a = attr(meta, row);
  return a[dimension] || '(not set)';
}

function emptyMetric(label) {
  return { label, visits: 0, apply_cta: 0, application_start: 0, application_complete: 0, whatsapp_click: 0, application_submit: 0 };
}

function addMetric(metric, eventName) {
  if (eventName === 'recruitment_campaign_visit') metric.visits += 1;
  if (eventName === 'performer_apply_click') metric.apply_cta += 1;
  if (eventName === 'application_start') metric.application_start += 1;
  if (eventName === 'application_complete') metric.application_complete += 1;
  if (eventName === 'application_submit') metric.application_submit += 1;
  if (eventName === 'whatsapp_click' || eventName === 'whatsapp_recruitment_click' || eventName === 'philippines_whatsapp_click') metric.whatsapp_click += 1;
}

function summarize(rows, dimension) {
  const map = new Map();
  rows.forEach(row => {
    const label = keyFor(row, dimension);
    if (!map.has(label)) map.set(label, emptyMetric(label));
    addMetric(map.get(label), row.event_name);
  });
  return Array.from(map.values()).sort((a, b) => (b.application_complete + b.application_start + b.apply_cta + b.visits) - (a.application_complete + a.application_start + a.apply_cta + a.visits));
}

function campaignReport(rows, campaigns) {
  const byCampaign = new Map();
  campaigns.forEach(c => byCampaign.set(c.slug, { ...emptyMetric(c.name), campaign: c, label: c.name }));
  rows.forEach(row => {
    const meta = parseMeta(row);
    const a = attr(meta, row);
    const matched = campaigns.find(c => c.slug === a.campaign_id || c.campaign === a.campaign || (c.referral_code && c.referral_code === a.referral_code));
    const id = matched?.slug || a.campaign || '(unattributed)';
    if (!byCampaign.has(id)) byCampaign.set(id, { ...emptyMetric(matched?.name || id), campaign: matched || null, label: matched?.name || id });
    addMetric(byCampaign.get(id), row.event_name);
  });
  return Array.from(byCampaign.values()).sort((a, b) => (b.application_complete + b.application_start + b.apply_cta + b.visits) - (a.application_complete + a.application_start + a.apply_cta + a.visits));
}

async function getReport(base44, campaigns) {
  const rows = (await base44.asServiceRole.entities.ConversionEvent.filter({})) || [];
  const recruitmentRows = rows.filter(row => RECRUITMENT_EVENTS.has(row.event_name));
  const dimensions = ['source','medium','campaign','country','landing_page','referral_code'];
  const by_dimension = {};
  dimensions.forEach(d => { by_dimension[d] = summarize(recruitmentRows, d).slice(0, 50); });
  return {
    total_events: recruitmentRows.length,
    summary: campaignReport(recruitmentRows, campaigns),
    by_dimension,
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'dashboard';

    if (action === 'create_campaign') {
      const data = body.campaign || {};
      const slug = slugify(data.slug || `${data.campaign}-${data.source}-${data.medium}`);
      const payload = {
        name: clean(data.name) || slug,
        slug,
        status: data.status || 'active',
        landing_page: clean(data.landing_page) || '/gay-performer-recruitment-philippines',
        source: clean(data.source),
        medium: clean(data.medium),
        campaign: clean(data.campaign) || slug,
        content: clean(data.content),
        term: clean(data.term),
        country: clean(data.country) || 'Philippines',
        channel: clean(data.channel) || clean(data.source) || 'outreach',
        referral_code: clean(data.referral_code),
        performer_referral_name: clean(data.performer_referral_name),
        template_id: clean(data.template_id),
        notes: clean(data.notes),
        created_at: now(),
      };
      payload.generated_url = buildUrl(payload);
      const created = await base44.asServiceRole.entities.RecruitmentCampaign.create(payload);
      return Response.json({ success: true, campaign: created });
    }

    if (action === 'update_campaign') {
      const id = body.id;
      const data = body.campaign || {};
      if (!id) return Response.json({ error: 'Missing campaign id' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.RecruitmentCampaign.get(id);
      const payload = { ...existing, ...data };
      payload.generated_url = buildUrl(payload);
      const updated = await base44.asServiceRole.entities.RecruitmentCampaign.update(id, payload);
      return Response.json({ success: true, campaign: updated });
    }

    const campaigns = (await base44.asServiceRole.entities.RecruitmentCampaign.filter({})) || [];
    const templates = (await base44.asServiceRole.entities.RecruitmentCampaignTemplate.filter({ is_active: true })) || [];
    const report = await getReport(base44, campaigns);
    return Response.json({ success: true, campaigns, templates, report });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}