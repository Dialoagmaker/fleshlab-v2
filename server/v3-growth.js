import { HttpError } from './errors.js';

const CAMPAIGN_TYPES = new Set(['recruitment', 'content_promotion', 'creator_promotion', 'collection_promotion', 'external_platform_promotion', 'editorial_news_promotion']);
const CAMPAIGN_STATUSES = new Set(['draft', 'scheduled', 'active', 'paused', 'completed', 'archived']);
const ASSET_KINDS = new Set(['image', 'banner', 'thumbnail', 'trailer', 'teaser', 'social_copy', 'landing_copy', 'platform_variant']);
const ASSET_STATUSES = new Set(['draft', 'approved', 'archived']);
const CHANNELS = new Set(['website', 'xhamster', 'faphouse', 'social', 'email', 'referral', 'direct', 'other']);
const DISTRIBUTION_STATUSES = new Set(['planned', 'published', 'paused', 'archived']);
const SENSITIVE = /password|hash|secret|token|cookie|authorization|private.?key|credential|sas|storage.?key/i;
const text = (value, limit = 4000) => String(value ?? '').trim().slice(0, limit);
const nullableText = (value, limit = 4000) => { const result = text(value, limit); return result || null; };
const list = (value, limit = 12) => Array.isArray(value) ? [...new Set(value.map(item => text(item, 80)).filter(Boolean))].slice(0, limit) : [];
const safeObject = (value) => {
  if (Array.isArray(value)) return value.map(safeObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, SENSITIVE.test(key) ? '[REDACTED]' : safeObject(child)]));
};
const integrationProjection = (row) => ({ ...row, status: row.configured ? row.status : 'not_configured', safe_metadata: safeObject(row.safe_metadata || {}) });
const pageArgs = (input = {}) => {
  const page = Math.max(Number(input.page) || 1, 1);
  const limit = Math.min(Math.max(Number(input.limit) || 25, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};
const safeUrl = (value, { allowRelative = true } = {}) => {
  const candidate = text(value, 1000);
  if (!candidate) return null;
  if (allowRelative && candidate.startsWith('/')) return candidate;
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported');
    return parsed.toString();
  } catch { throw new HttpError(422, 'INVALID_URL', 'Only an http, https or local destination URL is allowed.'); }
};

function campaignInput(input = {}, existing = {}) {
  const value = {
    name: text(input.name ?? existing.name, 240),
    internal_reference: text(input.internal_reference ?? existing.internal_reference ?? input.slug ?? input.name, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    campaign_type: text(input.campaign_type ?? existing.campaign_type, 60) || 'content_promotion',
    status: text(input.status ?? existing.status, 30) || 'draft',
    starts_at: input.starts_at ?? existing.starts_at ?? null,
    ends_at: input.ends_at ?? existing.ends_at ?? null,
    owner_user_id: input.owner_user_id ?? existing.owner_user_id ?? null,
    channels: list(input.channels ?? existing.channels),
    target_destination: safeUrl(input.target_destination ?? existing.target_destination),
    notes: nullableText(input.notes ?? existing.notes, 4000)
  };
  if (!value.name || !value.internal_reference) throw new HttpError(422, 'CAMPAIGN_INVALID', 'Campaign name and internal reference are required.');
  if (!CAMPAIGN_TYPES.has(value.campaign_type)) throw new HttpError(422, 'CAMPAIGN_INVALID', 'Campaign type is invalid.');
  if (!CAMPAIGN_STATUSES.has(value.status)) throw new HttpError(422, 'CAMPAIGN_INVALID', 'Campaign status is invalid.');
  if (value.starts_at && Number.isNaN(Date.parse(value.starts_at))) throw new HttpError(422, 'CAMPAIGN_INVALID', 'Campaign start date is invalid.');
  if (value.ends_at && Number.isNaN(Date.parse(value.ends_at))) throw new HttpError(422, 'CAMPAIGN_INVALID', 'Campaign end date is invalid.');
  if (value.starts_at && value.ends_at && Date.parse(value.ends_at) < Date.parse(value.starts_at)) throw new HttpError(422, 'CAMPAIGN_INVALID', 'Campaign end date must not precede its start date.');
  return value;
}

export class V3GrowthService {
  constructor(db, config = {}) { this.db = db; this.config = config; }

  async audit(actor, action, entityType, entityId, before = null, after = null, request = null, result = 'success') {
    await this.db.query(
      `INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,before_summary,after_summary,domain,result,metadata,ip_address)
       VALUES($1,$2,$3,$4,$5,$6,'growth',$7,$8,$9)`,
      [actor?.id || null, action, entityType, String(entityId), safeObject(before), safeObject(after), result, safeObject({ request_id: request?.headers?.['x-request-id'] || null }), request?.socket?.remoteAddress || null]
    );
  }

  async overview() {
    const [counts, integrations] = await Promise.all([
      this.db.query(`SELECT
        (SELECT count(*)::int FROM v3_growth_campaigns WHERE status <> 'archived') campaigns,
        (SELECT count(*)::int FROM v3_growth_campaigns WHERE status='active') active_campaigns,
        (SELECT count(*)::int FROM v3_growth_attribution) attribution_records,
        (SELECT count(*)::int FROM v3_growth_events WHERE event_type='landing_view') landing_activity,
        (SELECT count(*)::int FROM v3_growth_attribution WHERE application_id IS NOT NULL) attributed_applications,
        (SELECT count(*)::int FROM v3_growth_promo_assets WHERE status <> 'archived') promo_assets,
        (SELECT count(*)::int FROM v3_growth_distribution_records WHERE status='published') published_distributions,
        (SELECT count(*)::int FROM news_articles) news_articles,
        (SELECT count(*)::int FROM news_articles WHERE status='published' AND published_at<=now()) published_news`),
      this.db.query(`SELECT key,label,category,configured,status,safe_metadata,last_checked_at,last_success_at FROM v3_integration_status WHERE category='analytics' OR key IN ('azure_storage','email_delivery') ORDER BY label`)
    ]);
    return { counts: counts.rows[0], integrations: integrations.rows.map(integrationProjection), data_policy: 'Only captured attribution, application and event records are counted. Impressions, CTR, conversion and revenue are not inferred.' };
  }

  async campaigns(input = {}) {
    const { page, limit, offset } = pageArgs(input);
    const values = []; const where = [];
    const add = value => { values.push(value); return `$${values.length}`; };
    if (text(input.q)) { const q = add(`%${text(input.q, 120)}%`); where.push(`(c.name ILIKE ${q} OR c.internal_reference ILIKE ${q})`); }
    if (CAMPAIGN_STATUSES.has(input.status)) where.push(`c.status=${add(input.status)}`);
    if (CAMPAIGN_TYPES.has(input.campaign_type)) where.push(`c.campaign_type=${add(input.campaign_type)}`);
    if (input.from) where.push(`coalesce(c.ends_at,'infinity') >= ${add(input.from)}::timestamptz`);
    if (input.to) where.push(`coalesce(c.starts_at,'-infinity') <= ${add(input.to)}::timestamptz`);
    const filter = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await this.db.query(`SELECT c.*,count(a.id)::int AS attribution_count,count(*) OVER()::int AS total
      FROM v3_growth_campaigns c LEFT JOIN v3_growth_attribution a ON a.campaign_id=c.id ${filter}
      GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ${add(limit)} OFFSET ${add(offset)}`, values);
    const total = result.rows[0]?.total || 0;
    return { records: result.rows.map(({ total: _total, ...row }) => row), page, limit, total, pages: Math.ceil(total / limit) };
  }

  async campaign(id) {
    const record = await this.db.query('SELECT * FROM v3_growth_campaigns WHERE id=$1', [id]);
    if (!record.rowCount) throw new HttpError(404, 'NOT_FOUND', 'Campaign was not found.');
    const [assets, kits, distribution, attribution] = await Promise.all([
      this.db.query('SELECT * FROM v3_growth_promo_assets WHERE campaign_id=$1 ORDER BY updated_at DESC', [id]),
      this.db.query('SELECT * FROM v3_growth_promo_kits WHERE campaign_id=$1 ORDER BY updated_at DESC', [id]),
      this.db.query('SELECT * FROM v3_growth_distribution_records WHERE campaign_id=$1 ORDER BY published_at DESC NULLS LAST,updated_at DESC', [id]),
      this.db.query('SELECT * FROM v3_growth_attribution WHERE campaign_id=$1 ORDER BY created_at DESC LIMIT 100', [id])
    ]);
    return { record: record.rows[0], assets: assets.rows, kits: kits.rows, distribution: distribution.rows, attribution: attribution.rows };
  }

  async saveCampaign(id, input, actor, request = null) {
    let existing = {};
    if (id) { const found = await this.db.query('SELECT * FROM v3_growth_campaigns WHERE id=$1', [id]); if (!found.rowCount) throw new HttpError(404, 'NOT_FOUND', 'Campaign was not found.'); existing = found.rows[0]; }
    const value = campaignInput(input, existing);
    const fields = Object.keys(value);
    let result;
    if (id) {
      result = await this.db.query(`UPDATE v3_growth_campaigns SET ${fields.map((key, index) => `${key}=$${index + 1}`).join(',')},updated_by=$${fields.length + 1},updated_at=now() WHERE id=$${fields.length + 2} RETURNING *`, [...fields.map(key => value[key]), actor.id, id]);
    } else {
      result = await this.db.query(`INSERT INTO v3_growth_campaigns(${fields.join(',')},created_by,updated_by) VALUES(${fields.map((_, index) => `$${index + 1}`).join(',')},$${fields.length + 1},$${fields.length + 1}) RETURNING *`, [...fields.map(key => value[key]), actor.id]);
    }
    const saved = result.rows[0];
    await this.audit(actor, id ? 'growth.campaign.updated' : 'growth.campaign.created', 'campaign', saved.id, existing, saved, request);
    return saved;
  }

  async transitionCampaign(id, status, actor, request = null) {
    if (!CAMPAIGN_STATUSES.has(status)) throw new HttpError(422, 'CAMPAIGN_INVALID', 'Campaign status is invalid.');
    const current = await this.db.query('SELECT id,status FROM v3_growth_campaigns WHERE id=$1', [id]);
    if (!current.rowCount) throw new HttpError(404, 'NOT_FOUND', 'Campaign was not found.');
    const result = await this.db.query('UPDATE v3_growth_campaigns SET status=$2,updated_by=$3,updated_at=now() WHERE id=$1 RETURNING *', [id, status, actor.id]);
    await this.audit(actor, 'growth.campaign.status_changed', 'campaign', id, current.rows[0], result.rows[0], request);
    return result.rows[0];
  }

  async attribution(input = {}) {
    const { page, limit, offset } = pageArgs(input); const values = []; const where = []; const add = value => { values.push(value); return `$${values.length}`; };
    if (input.campaign_id) where.push(`a.campaign_id=${add(input.campaign_id)}`);
    if (text(input.source)) where.push(`a.source=${add(text(input.source, 100))}`);
    if (input.from) where.push(`a.created_at >= ${add(input.from)}::timestamptz`);
    if (input.to) where.push(`a.created_at < (${add(input.to)}::date + interval '1 day')`);
    const result = await this.db.query(`SELECT a.*,c.name AS campaign_title,c.internal_reference FROM v3_growth_attribution a LEFT JOIN v3_growth_campaigns c ON c.id=a.campaign_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY a.created_at DESC LIMIT ${add(limit)} OFFSET ${add(offset)}`, values);
    const total = result.rows.length < limit + offset ? offset + result.rows.length : (await this.db.query(`SELECT count(*)::int AS total FROM v3_growth_attribution a ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`, values.slice(0, -2))).rows[0].total;
    return { records: result.rows, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async generateUtm(input = {}, actor, request = null) {
    const campaign = input.campaign_id ? (await this.db.query('SELECT id,name,internal_reference FROM v3_growth_campaigns WHERE id=$1', [input.campaign_id])).rows[0] : null;
    if (input.campaign_id && !campaign) throw new HttpError(404, 'NOT_FOUND', 'Campaign was not found.');
    const destination = safeUrl(input.destination || input.target_destination || '/', { allowRelative: true });
    const params = new URLSearchParams();
    const source = text(input.utm_source || input.source, 120); const medium = text(input.utm_medium || input.medium, 120); const campaignName = text(input.utm_campaign || input.campaign || campaign?.internal_reference, 160);
    if (!source || !medium || !campaignName) throw new HttpError(422, 'UTM_INVALID', 'utm_source, utm_medium and utm_campaign are required.');
    params.set('utm_source', source); params.set('utm_medium', medium); params.set('utm_campaign', campaignName);
    for (const [key, value] of [['utm_content', input.utm_content || input.content], ['utm_term', input.utm_term || input.term]]) if (text(value, 160)) params.set(key, text(value, 160));
    const url = destination.startsWith('/') ? `${destination}${destination.includes('?') ? '&' : '?'}${params}` : (() => { const parsed = new URL(destination); for (const [key, value] of params) parsed.searchParams.set(key, value); return parsed.toString(); })();
    await this.audit(actor, 'growth.attribution.utm_generated', 'campaign', campaign?.id || 'unlinked', null, { destination, source, medium, campaign: campaignName }, request);
    return { url, campaign: campaign || null, parameters: Object.fromEntries(params) };
  }

  async promoAssets(input = {}) {
    const { page, limit, offset } = pageArgs(input); const values = []; const where = []; const add = value => { values.push(value); return `$${values.length}`; };
    if (text(input.q)) { const q = add(`%${text(input.q, 120)}%`); where.push(`(p.title ILIKE ${q} OR p.social_copy ILIKE ${q} OR p.landing_copy ILIKE ${q})`); }
    if (input.campaign_id) where.push(`p.campaign_id=${add(input.campaign_id)}`);
    if (ASSET_STATUSES.has(input.status)) where.push(`p.status=${add(input.status)}`);
    if (ASSET_KINDS.has(input.asset_kind)) where.push(`p.asset_kind=${add(input.asset_kind)}`);
    const result = await this.db.query(`SELECT p.*,m.asset_type,m.visibility,m.processing_state FROM v3_growth_promo_assets p LEFT JOIN v3_media_assets m ON m.id=p.media_asset_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.updated_at DESC LIMIT ${add(limit)} OFFSET ${add(offset)}`, values);
    const total = (await this.db.query(`SELECT count(*)::int AS total FROM v3_growth_promo_assets p ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`, values.slice(0, -2))).rows[0].total;
    return { records: result.rows, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async savePromoAsset(id, input, actor, request = null) {
    let existing = {};
    if (id) { const found = await this.db.query('SELECT * FROM v3_growth_promo_assets WHERE id=$1', [id]); if (!found.rowCount) throw new HttpError(404, 'NOT_FOUND', 'Promo asset was not found.'); existing = found.rows[0]; }
    const value = { media_asset_id: input.media_asset_id ?? existing.media_asset_id ?? null, campaign_id: input.campaign_id ?? existing.campaign_id ?? null, asset_kind: text(input.asset_kind ?? existing.asset_kind, 40) || 'social_copy', title: text(input.title ?? existing.title, 240), status: text(input.status ?? existing.status, 20) || 'draft', brand_legacy_id: input.brand_legacy_id ?? existing.brand_legacy_id ?? null, performer_legacy_id: input.performer_legacy_id ?? existing.performer_legacy_id ?? null, video_legacy_id: input.video_legacy_id ?? existing.video_legacy_id ?? null, collection_id: input.collection_id ?? existing.collection_id ?? null, social_copy: nullableText(input.social_copy ?? existing.social_copy, 4000), landing_copy: nullableText(input.landing_copy ?? existing.landing_copy, 4000), platform_variants: input.platform_variants ?? existing.platform_variants ?? {} };
    if (!value.title || !ASSET_KINDS.has(value.asset_kind) || !ASSET_STATUSES.has(value.status)) throw new HttpError(422, 'PROMO_ASSET_INVALID', 'Promo asset title, kind or status is invalid.');
    if (value.media_asset_id) { const media = await this.db.query('SELECT id FROM v3_media_assets WHERE id=$1', [value.media_asset_id]); if (!media.rowCount) throw new HttpError(422, 'PROMO_ASSET_INVALID', 'The referenced media asset does not exist.'); }
    const fields = Object.keys(value); let result;
    if (id) result = await this.db.query(`UPDATE v3_growth_promo_assets SET ${fields.map((key, index) => `${key}=$${index + 1}`).join(',')},updated_by=$${fields.length + 1},updated_at=now() WHERE id=$${fields.length + 2} RETURNING *`, [...fields.map(key => value[key]), actor.id, id]);
    else result = await this.db.query(`INSERT INTO v3_growth_promo_assets(${fields.join(',')},created_by,updated_by) VALUES(${fields.map((_, index) => `$${index + 1}`).join(',')},$${fields.length + 1},$${fields.length + 1}) RETURNING *`, [...fields.map(key => value[key]), actor.id]);
    await this.audit(actor, id ? 'growth.promo_asset.updated' : 'growth.promo_asset.created', 'promo_asset', result.rows[0].id, existing, result.rows[0], request);
    return result.rows[0];
  }

  async kits(input = {}) {
    const { page, limit, offset } = pageArgs(input); const values = []; const where = []; const add = value => { values.push(value); return `$${values.length}`; };
    if (text(input.q)) { const q = add(`%${text(input.q, 120)}%`); where.push(`k.name ILIKE ${q}`); }
    if (input.campaign_id) where.push(`k.campaign_id=${add(input.campaign_id)}`);
    const result = await this.db.query(`SELECT k,count(ka.id)::int AS asset_count FROM v3_growth_promo_kits k LEFT JOIN v3_growth_promo_kit_assets ka ON ka.kit_id=k.id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} GROUP BY k.id ORDER BY k.updated_at DESC LIMIT ${add(limit)} OFFSET ${add(offset)}`, values);
    const total = (await this.db.query(`SELECT count(*)::int AS total FROM v3_growth_promo_kits k ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`, values.slice(0, -2))).rows[0].total;
    return { records: result.rows, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async saveKit(id, input, actor, request = null) {
    let existing = {};
    if (id) { const found = await this.db.query('SELECT * FROM v3_growth_promo_kits WHERE id=$1', [id]); if (!found.rowCount) throw new HttpError(404, 'NOT_FOUND', 'Promo kit was not found.'); existing = found.rows[0]; }
    const value = { campaign_id: input.campaign_id ?? existing.campaign_id ?? null, name: text(input.name ?? existing.name, 240), status: text(input.status ?? existing.status, 20) || 'draft', cta: nullableText(input.cta ?? existing.cta, 500), destination_url: safeUrl(input.destination_url ?? existing.destination_url), platform_notes: nullableText(input.platform_notes ?? existing.platform_notes, 4000) };
    if (!value.name || !ASSET_STATUSES.has(value.status)) throw new HttpError(422, 'PROMO_KIT_INVALID', 'Promo kit name or status is invalid.');
    const fields = Object.keys(value); let result;
    if (id) result = await this.db.query(`UPDATE v3_growth_promo_kits SET ${fields.map((key, index) => `${key}=$${index + 1}`).join(',')},updated_by=$${fields.length + 1},updated_at=now() WHERE id=$${fields.length + 2} RETURNING *`, [...fields.map(key => value[key]), actor.id, id]);
    else result = await this.db.query(`INSERT INTO v3_growth_promo_kits(${fields.join(',')},created_by,updated_by) VALUES(${fields.map((_, index) => `$${index + 1}`).join(',')},$${fields.length + 1},$${fields.length + 1}) RETURNING *`, [...fields.map(key => value[key]), actor.id]);
    await this.audit(actor, id ? 'growth.promo_kit.updated' : 'growth.promo_kit.created', 'promo_kit', result.rows[0].id, existing, result.rows[0], request);
    return result.rows[0];
  }

  async addKitAsset(kitId, input, actor, request = null) { const assetId = text(input.promo_asset_id, 80); if (!assetId) throw new HttpError(422, 'PROMO_KIT_INVALID', 'A promo asset is required.'); const result = await this.db.query(`INSERT INTO v3_growth_promo_kit_assets(kit_id,promo_asset_id,usage_status) VALUES($1,$2,$3) ON CONFLICT(kit_id,promo_asset_id) DO UPDATE SET usage_status=EXCLUDED.usage_status RETURNING *`, [kitId, assetId, text(input.usage_status, 20) || 'selected']); await this.audit(actor, 'growth.promo_kit.asset_added', 'promo_kit', kitId, null, result.rows[0], request); return result.rows[0]; }
  async addKitCopy(kitId, input, actor, request = null) { const value = [kitId, text(input.channel, 80), text(input.variant_name, 120), text(input.copy_text, 4000), input.approved === true]; if (!value[1] || !value[2] || !value[3]) throw new HttpError(422, 'PROMO_KIT_INVALID', 'Channel, variant name and copy are required.'); const result = await this.db.query(`INSERT INTO v3_growth_promo_kit_copies(kit_id,channel,variant_name,copy_text,approved) VALUES($1,$2,$3,$4,$5) ON CONFLICT(kit_id,channel,variant_name) DO UPDATE SET copy_text=EXCLUDED.copy_text,approved=EXCLUDED.approved RETURNING *`, value); await this.audit(actor, 'growth.promo_kit.copy_updated', 'promo_kit', kitId, null, result.rows[0], request); return result.rows[0]; }

  async distribution(input = {}) {
    const { page, limit, offset } = pageArgs(input); const values = []; const where = []; const add = value => { values.push(value); return `$${values.length}`; };
    if (input.campaign_id) where.push(`d.campaign_id=${add(input.campaign_id)}`);
    if (CHANNELS.has(input.channel)) where.push(`d.channel=${add(input.channel)}`);
    if (DISTRIBUTION_STATUSES.has(input.status)) where.push(`d.status=${add(input.status)}`);
    const result = await this.db.query(`SELECT d,c.name AS campaign_name,p.title AS promo_asset_title FROM v3_growth_distribution_records d LEFT JOIN v3_growth_campaigns c ON c.id=d.campaign_id LEFT JOIN v3_growth_promo_assets p ON p.id=d.promo_asset_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY d.published_at DESC NULLS LAST,d.updated_at DESC LIMIT ${add(limit)} OFFSET ${add(offset)}`, values);
    const total = (await this.db.query(`SELECT count(*)::int AS total FROM v3_growth_distribution_records d ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`, values.slice(0, -2))).rows[0].total;
    return { records: result.rows.map(row => ({ ...row.d, campaign_name: row.campaign_name, promo_asset_title: row.promo_asset_title })), page, limit, total, pages: Math.ceil(total / limit) };
  }

  async saveDistribution(id, input, actor, request = null) {
    let existing = {};
    if (id) { const found = await this.db.query('SELECT * FROM v3_growth_distribution_records WHERE id=$1', [id]); if (!found.rowCount) throw new HttpError(404, 'NOT_FOUND', 'Distribution record was not found.'); existing = found.rows[0]; }
    const value = { campaign_id: input.campaign_id ?? existing.campaign_id ?? null, channel: text(input.channel ?? existing.channel, 40), platform: nullableText(input.platform ?? existing.platform, 120), promo_asset_id: input.promo_asset_id ?? existing.promo_asset_id ?? null, promo_kit_id: input.promo_kit_id ?? existing.promo_kit_id ?? null, destination_url: safeUrl(input.destination_url ?? existing.destination_url), published_at: input.published_at ?? existing.published_at ?? null, status: text(input.status ?? existing.status, 20) || 'planned', external_reference: nullableText(input.external_reference ?? existing.external_reference, 240), external_url: safeUrl(input.external_url ?? existing.external_url), notes: nullableText(input.notes ?? existing.notes, 4000) };
    if (!CHANNELS.has(value.channel) || !DISTRIBUTION_STATUSES.has(value.status)) throw new HttpError(422, 'DISTRIBUTION_INVALID', 'Distribution channel or status is invalid.');
    const fields = Object.keys(value); let result;
    if (id) result = await this.db.query(`UPDATE v3_growth_distribution_records SET ${fields.map((key, index) => `${key}=$${index + 1}`).join(',')},updated_by=$${fields.length + 1},updated_at=now() WHERE id=$${fields.length + 2} RETURNING *`, [...fields.map(key => value[key]), actor.id, id]);
    else result = await this.db.query(`INSERT INTO v3_growth_distribution_records(${fields.join(',')},created_by,updated_by) VALUES(${fields.map((_, index) => `$${index + 1}`).join(',')},$${fields.length + 1},$${fields.length + 1}) RETURNING *`, [...fields.map(key => value[key]), actor.id]);
    await this.audit(actor, id ? 'growth.distribution.updated' : 'growth.distribution.created', 'distribution', result.rows[0].id, existing, result.rows[0], request);
    return result.rows[0];
  }

  async news(input = {}) {
    const { page, limit, offset } = pageArgs(input); const values = []; const where = []; const add = value => { values.push(value); return `$${values.length}`; };
    if (text(input.q)) { const q = add(`%${text(input.q, 120)}%`); where.push(`(n.title ILIKE ${q} OR n.slug ILIKE ${q} OR n.excerpt ILIKE ${q})`); }
    if (['draft', 'review', 'published', 'archived'].includes(input.status)) where.push(`n.status=${add(input.status)}`);
    const result = await this.db.query(`SELECT n.*,c.name AS campaign_name FROM news_articles n LEFT JOIN v3_growth_campaigns c ON c.id=n.campaign_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY n.updated_at DESC LIMIT ${add(limit)} OFFSET ${add(offset)}`, values);
    const total = (await this.db.query(`SELECT count(*)::int AS total FROM news_articles n ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`, values.slice(0, -2))).rows[0].total;
    return { records: result.rows, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async saveNews(id, input, actor, request = null) {
    let existing = {};
    if (id) { const found = await this.db.query('SELECT * FROM news_articles WHERE id=$1', [id]); if (!found.rowCount) throw new HttpError(404, 'NOT_FOUND', 'News article was not found.'); existing = found.rows[0]; }
    const value = { title: text(input.title ?? existing.title, 240), slug: text(input.slug ?? existing.slug, 180).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''), category: text(input.category ?? existing.category, 80) || 'behindTheScenes', content: text(input.content ?? existing.content, 30000), excerpt: text(input.excerpt ?? existing.excerpt, 1000), cover_image_url: safeUrl(input.cover_image_url ?? existing.cover_image_url), status: text(input.status ?? existing.status, 20) || 'draft', published_at: input.published_at ?? existing.published_at ?? null, meta_title: nullableText(input.meta_title ?? existing.meta_title, 240), meta_description: nullableText(input.meta_description ?? existing.meta_description, 500), tags: Array.isArray(input.tags) ? list(input.tags, 30) : (existing.tags || []), campaign_id: input.campaign_id ?? existing.campaign_id ?? null };
    if (!value.title || !value.slug || !['draft', 'review', 'published', 'archived'].includes(value.status)) throw new HttpError(422, 'NEWS_INVALID', 'News title, slug or status is invalid.');
    if (value.status === 'published' && !value.published_at) value.published_at = new Date().toISOString();
    const fields = Object.keys(value); let result;
    if (id) result = await this.db.query(`UPDATE news_articles SET ${fields.map((key, index) => `${key}=$${index + 1}`).join(',')},updated_at=now() WHERE id=$${fields.length + 1} RETURNING *`, [...fields.map(key => value[key]), id]);
    else result = await this.db.query(`INSERT INTO news_articles(${fields.join(',')}) VALUES(${fields.map((_, index) => `$${index + 1}`).join(',')}) RETURNING *`, fields.map(key => value[key]));
    await this.audit(actor, id ? 'growth.news.updated' : 'growth.news.created', 'news_article', result.rows[0].id, existing, result.rows[0], request);
    return result.rows[0];
  }

  async publishNews(id, actor, request = null) {
    const current = await this.db.query('SELECT id,status FROM news_articles WHERE id=$1', [id]); if (!current.rowCount) throw new HttpError(404, 'NOT_FOUND', 'News article was not found.');
    const result = await this.db.query("UPDATE news_articles SET status='published',published_at=coalesce(published_at,now()),updated_at=now() WHERE id=$1 RETURNING *", [id]);
    await this.audit(actor, 'growth.news.published', 'news_article', id, current.rows[0], result.rows[0], request); return result.rows[0];
  }

  async analytics() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM v3_growth_campaigns WHERE status <> 'archived') AS campaigns,
      (SELECT count(*)::int FROM v3_growth_attribution) AS attribution_records,
      (SELECT count(*)::int FROM v3_growth_events WHERE event_type='landing_view') AS landing_activity,
      (SELECT count(*)::int FROM v3_growth_attribution WHERE application_id IS NOT NULL) AS application_attribution,
      (SELECT count(*)::int FROM v3_growth_events WHERE event_type='catalogue_view') AS catalogue_traffic,
      (SELECT count(*)::int FROM v3_growth_events WHERE event_type='content_detail') AS content_detail_traffic,
      (SELECT count(*)::int FROM v3_growth_distribution_records WHERE status='published') AS promo_asset_usage,
      (SELECT count(*)::int FROM news_articles WHERE status='published' AND published_at<=now()) AS news_publications`);
    const integrations = await this.db.query("SELECT key,label,configured,status,last_checked_at,last_success_at,safe_metadata FROM v3_integration_status WHERE category='analytics' OR key IN ('analytics','azure_storage') ORDER BY label");
    return { metrics: result.rows[0], integrations: integrations.rows.map(integrationProjection), unavailable_metrics: ['impressions', 'ctr', 'conversion_rate', 'revenue'], note: 'Metrics are reported only when corresponding self-hosted events or attribution records exist.' };
  }

  async funnels() {
    const definitions = (await this.db.query('SELECT * FROM v3_growth_funnels WHERE enabled ORDER BY name')).rows;
    const count = async (key) => {
      const queries = {
        campaign: 'SELECT count(*)::int AS count FROM v3_growth_campaigns WHERE status <> \'archived\'',
        landing: "SELECT count(*)::int AS count FROM v3_growth_events WHERE event_type='landing_view'",
        application: "SELECT count(*)::int AS count FROM v3_growth_attribution WHERE application_id IS NOT NULL",
        promotion: "SELECT count(*)::int AS count FROM v3_growth_distribution_records WHERE status='published'",
        catalogue_view: "SELECT count(*)::int AS count FROM v3_growth_events WHERE event_type='catalogue_view'",
        content_detail: "SELECT count(*)::int AS count FROM v3_growth_events WHERE event_type='content_detail'",
        approval: "SELECT count(*)::int FROM performer_applications WHERE status='approved' AND answers->>'recruitment_campaign_id' IS NOT NULL"
      };
      if (!queries[key]) return { state: 'UNKNOWN', count: null };
      const result = await this.db.query(queries[key]); const value = Number(result.rows[0]?.count || 0); return { state: value ? 'TRACKED' : 'UNKNOWN', count: value || null };
    };
    return { funnels: await Promise.all(definitions.map(async funnel => ({ ...funnel, steps: await Promise.all((funnel.steps || []).map(async step => ({ ...step, ...(await count(step.key)) }))) }))) };
  }

  async syncApplicationAttribution(applicationId) {
    if (!applicationId) return null;
    const application = await this.db.query("SELECT id,answers,created_at FROM performer_applications WHERE id=$1", [applicationId]);
    const campaignSlug = application.rows[0]?.answers?.recruitment_campaign_id;
    if (!campaignSlug) return null;
    const inserted = await this.db.query(`INSERT INTO v3_growth_attribution(campaign_id,source,medium,campaign_name,content,term,application_id,created_at)
      SELECT c.id,r.source,r.medium,r.campaign,r.content,r.term,$1,a.created_at
      FROM performer_applications a JOIN recruitment_campaigns r ON r.slug=$2
      JOIN v3_growth_campaigns c ON c.legacy_recruitment_campaign_id=r.id WHERE a.id=$1
      ON CONFLICT(application_id,campaign_id) DO NOTHING RETURNING *`, [applicationId, String(campaignSlug)]);
    if (!inserted.rowCount) return null;
    const event = await this.db.query(`INSERT INTO v3_growth_events(event_type,campaign_id,attribution_id,application_id,occurred_at) VALUES('application',$1,$2,$3,$4) ON CONFLICT(event_type,application_id) DO NOTHING RETURNING id`, [inserted.rows[0].campaign_id, inserted.rows[0].id, applicationId, inserted.rows[0].created_at]);
    return { attribution: inserted.rows[0], event: event.rows[0] || null };
  }

  async integrations() {
    const result = await this.db.query("SELECT key,label,category,configured,status,safe_metadata,last_checked_at,last_success_at FROM v3_integration_status WHERE category='analytics' OR key IN ('analytics','azure_storage','email_delivery') ORDER BY label");
    return { records: result.rows.map(integrationProjection) };
  }
}
