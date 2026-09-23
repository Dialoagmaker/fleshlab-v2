import { HttpError } from './errors.js';

const statuses = new Set(['planned','ready','shooting','post_production','qa','ready_to_publish','published','archived','cancelled']);
const shootStatuses = new Set(['planned','scheduled','active','completed','cancelled']);
const sceneStatuses = new Set(['planned','ready','shooting','shot','qa','complete','cancelled']);
const participantStatuses = new Set(['planned','confirmed','completed','withdrawn','blocked']);
const qaStatuses = new Set(['pending','passed','failed','needs_changes']);
const qaSeverities = new Set(['info','warning','critical']);
const assetRoles = new Set(['raw_source','still','thumbnail_candidate','trailer_candidate','edited_master','render_output','supporting']);
const renderStatuses = new Set(['queued','running','succeeded','failed','cancelled']);
const transitionMap = {
  planned: new Set(['ready','shooting','cancelled']), ready: new Set(['shooting','cancelled']), shooting: new Set(['post_production','cancelled']),
  post_production: new Set(['qa','cancelled']), qa: new Set(['ready_to_publish','post_production','cancelled']), ready_to_publish: new Set(['published','qa','archived']),
  published: new Set(['archived']), archived: new Set([]), cancelled: new Set(['planned'])
};
const page = v => Math.max(1, Number.parseInt(v, 10) || 1);
const limit = v => Math.min(100, Math.max(1, Number.parseInt(v, 10) || 24));
const text = v => String(v ?? '').trim();

export class V3ProductionService {
  constructor(db) { this.db = db; }

  async audit(actor, productionId, action, metadata = {}) {
    await this.db.query('INSERT INTO v3_production_events(production_id,actor_id,action,metadata) VALUES($1,$2,$3,$4)', [productionId, actor?.id || null, action, metadata]);
    await this.db.query('INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,after_summary) VALUES($1,$2,$3,$4,$5)', [actor?.id || null, `production.${action}`, 'production', String(productionId), metadata]);
  }

  async list({ q, status, page: rawPage, limit: rawLimit } = {}) {
    const values = []; const where = [];
    if (q) { values.push(`%${text(q)}%`); where.push(`(p.title ILIKE $${values.length} OR p.reference ILIKE $${values.length})`); }
    if (status && statuses.has(status)) { values.push(status); where.push(`p.status=$${values.length}`); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const p = page(rawPage); const l = limit(rawLimit); const count = await this.db.query(`SELECT count(*)::int AS total FROM v3_productions p ${clause}`, values);
    const args = [...values, l, (p - 1) * l];
    const rows = await this.db.query(`SELECT p.*,b.name AS brand_name,(SELECT count(*)::int FROM v3_production_shoots s WHERE s.production_id=p.id) AS shoots,(SELECT count(*)::int FROM v3_production_scenes s WHERE s.production_id=p.id) AS scenes,(SELECT count(*)::int FROM v3_production_participant_assignments a WHERE a.production_id=p.id) AS participants,(SELECT count(*)::int FROM v3_production_assets a WHERE a.production_id=p.id AND a.lifecycle='active') AS assets FROM v3_productions p LEFT JOIN catalog_brands b ON b.legacy_id=p.brand_legacy_id ${clause} ORDER BY p.updated_at DESC LIMIT $${args.length - 1} OFFSET $${args.length}`, args);
    return { records: rows.rows, page: p, limit: l, total: count.rows[0].total, pages: Math.max(1, Math.ceil(Number(count.rows[0].total) / l)) };
  }

  async create(input, actor) {
    const title = text(input.title); const reference = text(input.reference || input.slug);
    if (!title || !reference) throw new HttpError(422, 'PRODUCTION_REQUIRED', 'A title and unique production reference are required.');
    if (input.status && !statuses.has(input.status)) throw new HttpError(422, 'INVALID_PRODUCTION_STATUS', 'Invalid production status.');
    if (input.brand_legacy_id) { const b = await this.db.query("SELECT 1 FROM catalog_brands WHERE legacy_id=$1 AND status='active' AND v3_lifecycle='active'", [input.brand_legacy_id]); if (!b.rowCount) throw new HttpError(422, 'BRAND_NOT_ACTIVE', 'The selected brand is not active.'); }
    try {
      const r = await this.db.query(`INSERT INTO v3_productions(title,internal_title,reference,status,brand_legacy_id,production_type,owner_id,description,internal_notes,planned_date,location_metadata,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING *`, [title, text(input.internal_title) || null, reference, input.status || 'planned', input.brand_legacy_id || null, text(input.production_type) || 'recorded_content', input.owner_id || actor.id, text(input.description) || null, text(input.internal_notes) || null, input.planned_date || null, input.location_metadata || {}, actor.id]);
      await this.audit(actor, r.rows[0].id, 'created', { reference, status: r.rows[0].status }); return this.detail(r.rows[0].id);
    } catch (e) { if (e.code === '23505') throw new HttpError(409, 'PRODUCTION_REFERENCE_EXISTS', 'That production reference already exists.'); throw e; }
  }

  async detail(id) {
    const p = await this.db.query(`SELECT p.*,b.name AS brand_name,u.email AS owner_email FROM v3_productions p LEFT JOIN catalog_brands b ON b.legacy_id=p.brand_legacy_id LEFT JOIN app_users u ON u.id=p.owner_id WHERE p.id=$1`, [id]);
    if (!p.rowCount) throw new HttpError(404, 'PRODUCTION_NOT_FOUND', 'Production was not found.');
    const production = p.rows[0];
    const productionKeys = [String(production.id), production.reference];
    const [shoots, scenes, participants, assets, qa, renders, milestones, link, events, consent, rights, readiness] = await Promise.all([
      this.db.query('SELECT * FROM v3_production_shoots WHERE production_id=$1 ORDER BY scheduled_at NULLS LAST,created_at', [id]),
      this.db.query('SELECT * FROM v3_production_scenes WHERE production_id=$1 ORDER BY sort_order,scene_number', [id]),
      this.db.query(`SELECT a.*,p.display_name, c.lifecycle AS creator_lifecycle FROM v3_production_participant_assignments a LEFT JOIN catalog_performers p ON p.legacy_id=a.performer_legacy_id LEFT JOIN v3_creator_records c ON c.id=a.creator_id WHERE a.production_id=$1 ORDER BY a.created_at`, [id]),
      this.db.query(`SELECT pa.*,m.asset_type,m.processing_state,m.visibility,m.mime_type,m.byte_size,m.storage_reference FROM v3_production_assets pa JOIN v3_media_assets m ON m.id=pa.asset_id WHERE pa.production_id=$1 ORDER BY pa.created_at DESC`, [id]),
      this.db.query('SELECT * FROM v3_production_qa_checks WHERE production_id=$1 ORDER BY created_at DESC', [id]),
      this.db.query('SELECT * FROM v3_production_render_jobs WHERE production_id=$1 ORDER BY created_at DESC', [id]),
      this.db.query('SELECT * FROM v3_production_milestones WHERE production_id=$1 ORDER BY due_at NULLS LAST,created_at', [id]),
      this.db.query('SELECT * FROM v3_production_catalogue_links WHERE production_id=$1', [id]),
      this.db.query('SELECT id,actor_id,action,metadata,created_at FROM v3_production_events WHERE production_id=$1 ORDER BY created_at DESC LIMIT 100', [id]),
      this.db.query(`SELECT id,production_id,performer_legacy_id,creator_id,video_legacy_id,production_date,categories,approved_activities,excluded_activities,notes,status,acknowledged_at,withdrawn_at,created_at,updated_at FROM v3_production_consent_records WHERE production_id = ANY($1::text[]) ORDER BY created_at DESC`, [productionKeys]),
      this.db.query(`SELECT id,production_id,content_legacy_id,performer_legacy_id,creator_id,rights_source,rights_contract_instance_id,rights_status,exclusive,territory,rights_start_at,rights_end_at,post_termination_end_at,commercial_exploitation_allowed,marketing_allowed,editing_allowed,sublicensing_allowed,notes,created_at,updated_at FROM v3_content_rights_records WHERE production_id = ANY($1::text[]) ORDER BY created_at DESC`, [productionKeys]),
      this.readiness(id)
    ]);
    return { production, shoots: shoots.rows, scenes: scenes.rows, participants: participants.rows, assets: assets.rows.map(({ storage_reference, ...safe }) => safe), qa: qa.rows, renders: renders.rows.map(({ failure_reason, ...safe }) => safe), milestones: milestones.rows, catalogue: link.rows[0] || null, consent: consent.rows, rights: rights.rows, events: events.rows, readiness };
  }

  async update(id, input, actor) {
    const current = await this.exists(id); const fields = ['title','internal_title','description','internal_notes','planned_date','actual_shoot_date','production_type','owner_id','location_metadata','brand_legacy_id'];
    const sets = []; const values = [id];
    for (const field of fields) if (Object.hasOwn(input, field)) { if (field === 'brand_legacy_id' && input[field]) { const b = await this.db.query("SELECT 1 FROM catalog_brands WHERE legacy_id=$1 AND status='active' AND v3_lifecycle='active'", [input[field]]); if (!b.rowCount) throw new HttpError(422, 'BRAND_NOT_ACTIVE', 'The selected brand is not active.'); } values.push(input[field] === '' ? null : input[field]); sets.push(`${field}=$${values.length}`); }
    if (!sets.length) throw new HttpError(422, 'NO_CHANGES', 'No production fields were supplied.');
    values.push(actor.id); const r = await this.db.query(`UPDATE v3_productions SET ${sets.join(',')},updated_by=$${values.length},updated_at=now() WHERE id=$1 RETURNING *`, values); await this.audit(actor, id, 'updated', { fields: sets.map(s => s.split('=')[0]) }); return this.detail(r.rows[0].id);
  }

  async transition(id, next, actor) {
    if (!statuses.has(next)) throw new HttpError(422, 'INVALID_PRODUCTION_STATUS', 'Invalid production status.');
    const current = await this.exists(id); if (!transitionMap[current.status]?.has(next)) throw new HttpError(409, 'INVALID_PRODUCTION_TRANSITION', `Cannot move production from ${current.status} to ${next}.`);
    if (next === 'ready_to_publish') { const r = await this.readiness(id); if (!r.publishable) throw new HttpError(409, 'PRODUCTION_NOT_READY', 'Production publishing readiness has blockers.', { blockers: r.blockers }); }
    const result = await this.db.query('UPDATE v3_productions SET status=$2,updated_by=$3,updated_at=now() WHERE id=$1 RETURNING *', [id, next, actor.id]); await this.audit(actor, id, 'status_changed', { from: current.status, to: next }); return this.detail(result.rows[0].id);
  }

  async exists(id) { const r = await this.db.query('SELECT * FROM v3_productions WHERE id=$1', [id]); if (!r.rowCount) throw new HttpError(404, 'PRODUCTION_NOT_FOUND', 'Production was not found.'); return r.rows[0]; }
  async shoot(productionId, input, actor) {
    await this.exists(productionId);
    const r = await this.db.query(`INSERT INTO v3_production_shoots(production_id,scheduled_at,location_metadata,status,notes,responsible_staff_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [productionId, input.scheduled_at || null, input.location_metadata || {}, shootStatuses.has(input.status) ? input.status : 'planned', text(input.notes) || null, input.responsible_staff_id || null, actor.id]);
    await this.audit(actor, productionId, 'shoot_created', { shoot_id: r.rows[0].id });
    return r.rows[0];
  }

  async updateShoot(productionId, shootId, input, actor) {
    await this.exists(productionId);
    const allowed = ['scheduled_at', 'location_metadata', 'notes', 'responsible_staff_id', 'completed_at'];
    const values = [productionId, shootId]; const sets = [];
    for (const field of allowed) if (Object.hasOwn(input, field)) { values.push(input[field] === '' ? null : input[field]); sets.push(`${field}=$${values.length}`); }
    if (Object.hasOwn(input, 'status')) { if (!shootStatuses.has(input.status)) throw new HttpError(422, 'INVALID_SHOOT_STATUS', 'Invalid shoot status.'); values.push(input.status); sets.push(`status=$${values.length}`); }
    if (!sets.length) throw new HttpError(422, 'NO_CHANGES', 'No shoot fields were supplied.');
    const result = await this.db.query(`UPDATE v3_production_shoots SET ${sets.join(',')},updated_at=now() WHERE production_id=$1 AND id=$2 RETURNING *`, values);
    if (!result.rowCount) throw new HttpError(404, 'SHOOT_NOT_FOUND', 'Shoot was not found in this production.');
    await this.audit(actor, productionId, 'shoot_updated', { shoot_id: shootId, fields: sets.map(s => s.split('=')[0]) });
    return result.rows[0];
  }

  async scene(productionId, input, actor) {
    await this.exists(productionId);
    const number = Number(input.scene_number);
    if (!Number.isInteger(number) || number < 1 || !text(input.title)) throw new HttpError(422, 'SCENE_REQUIRED', 'Scene number and title are required.');
    if (input.shoot_id) { const shoot = await this.db.query('SELECT 1 FROM v3_production_shoots WHERE id=$1 AND production_id=$2', [input.shoot_id, productionId]); if (!shoot.rowCount) throw new HttpError(422, 'SHOOT_NOT_IN_PRODUCTION', 'Shoot does not belong to this production.'); }
    try {
      const r = await this.db.query(`INSERT INTO v3_production_scenes(production_id,shoot_id,scene_number,title,description,status,internal_notes,planned_duration_seconds,sort_order,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [productionId, input.shoot_id || null, number, text(input.title), text(input.description) || null, sceneStatuses.has(input.status) ? input.status : 'planned', text(input.internal_notes) || null, input.planned_duration_seconds || null, input.sort_order ?? number, actor.id]);
      await this.audit(actor, productionId, 'scene_created', { scene_id: r.rows[0].id, scene_number: number });
      return r.rows[0];
    } catch (e) { if (e.code === '23505') throw new HttpError(409, 'SCENE_NUMBER_EXISTS', 'That scene number already exists.'); throw e; }
  }

  async updateScene(productionId, sceneId, input, actor) {
    await this.exists(productionId);
    const allowed = ['title', 'description', 'internal_notes', 'planned_duration_seconds', 'actual_duration_seconds', 'sort_order', 'shoot_id'];
    const values = [productionId, sceneId]; const sets = [];
    for (const field of allowed) if (Object.hasOwn(input, field)) { if (field === 'shoot_id' && input[field]) { const shoot = await this.db.query('SELECT 1 FROM v3_production_shoots WHERE id=$1 AND production_id=$2', [input[field], productionId]); if (!shoot.rowCount) throw new HttpError(422, 'SHOOT_NOT_IN_PRODUCTION', 'Shoot does not belong to this production.'); } values.push(input[field] === '' ? null : input[field]); sets.push(`${field}=$${values.length}`); }
    if (Object.hasOwn(input, 'status')) { if (!sceneStatuses.has(input.status)) throw new HttpError(422, 'INVALID_SCENE_STATUS', 'Invalid scene status.'); values.push(input.status); sets.push(`status=$${values.length}`); }
    if (!sets.length) throw new HttpError(422, 'NO_CHANGES', 'No scene fields were supplied.');
    const result = await this.db.query(`UPDATE v3_production_scenes SET ${sets.join(',')},updated_at=now() WHERE production_id=$1 AND id=$2 RETURNING *`, values);
    if (!result.rowCount) throw new HttpError(404, 'SCENE_NOT_FOUND', 'Scene was not found in this production.');
    await this.audit(actor, productionId, 'scene_updated', { scene_id: sceneId, fields: sets.map(s => s.split('=')[0]) });
    return result.rows[0];
  }

  async participant(productionId, input, actor) {
    const production = await this.exists(productionId);
    if (!input.creator_id && !input.performer_legacy_id) throw new HttpError(422, 'PARTICIPANT_REQUIRED', 'A creator or performer is required.');
    if (input.creator_id) { const creator = await this.db.query("SELECT 1 FROM v3_creator_records WHERE id=$1 AND lifecycle NOT IN ('blocked','inactive')", [input.creator_id]); if (!creator.rowCount) throw new HttpError(422, 'CREATOR_NOT_ACTIVE', 'The creator is not active.'); }
    if (input.performer_legacy_id) { const p = await this.db.query("SELECT 1 FROM catalog_performers WHERE legacy_id=$1 AND status='active'", [input.performer_legacy_id]); if (!p.rowCount) throw new HttpError(422, 'PERFORMER_NOT_ACTIVE', 'The performer is not active.'); }
    if (input.scene_id) { const s = await this.db.query('SELECT 1 FROM v3_production_scenes WHERE id=$1 AND production_id=$2', [input.scene_id, productionId]); if (!s.rowCount) throw new HttpError(422, 'SCENE_NOT_IN_PRODUCTION', 'Scene does not belong to this production.'); }
    if (input.consent_record_id) { const c = await this.db.query('SELECT 1 FROM v3_production_consent_records WHERE id=$1 AND production_id = ANY($2::text[])', [input.consent_record_id, [String(production.id), production.reference]]); if (!c.rowCount) throw new HttpError(422, 'CONSENT_NOT_IN_PRODUCTION', 'Consent record does not belong to this production.'); }
    const r = await this.db.query(`INSERT INTO v3_production_participant_assignments(production_id,scene_id,creator_id,performer_legacy_id,role,participation_status,consent_record_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [productionId, input.scene_id || null, input.creator_id || null, input.performer_legacy_id || null, text(input.role) || 'performer', participantStatuses.has(input.participation_status) ? input.participation_status : 'planned', input.consent_record_id || null, actor.id]);
    await this.audit(actor, productionId, 'participant_assigned', { assignment_id: r.rows[0].id });
    return r.rows[0];
  }

  async asset(productionId, input, actor) {
    await this.exists(productionId);
    if (!assetRoles.has(input.asset_role)) throw new HttpError(422, 'INVALID_ASSET_ROLE', 'Invalid production asset role.');
    const a = await this.db.query('SELECT id,visibility,processing_state FROM v3_media_assets WHERE id=$1', [input.asset_id]);
    if (!a.rowCount) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Media asset was not found.');
    if (input.asset_role !== 'raw_source' && a.rows[0].visibility === 'private') throw new HttpError(422, 'PRIVATE_ASSET_NOT_PUBLIC_READY', 'Private/source assets cannot fill a public production role.');
    if (input.scene_id) { const s = await this.db.query('SELECT 1 FROM v3_production_scenes WHERE id=$1 AND production_id=$2', [input.scene_id, productionId]); if (!s.rowCount) throw new HttpError(422, 'SCENE_NOT_IN_PRODUCTION', 'Scene does not belong to this production.'); }
    if (input.source_asset_id) { const source = await this.db.query('SELECT 1 FROM v3_production_assets WHERE id=$1 AND production_id=$2', [input.source_asset_id, productionId]); if (!source.rowCount) throw new HttpError(422, 'SOURCE_ASSET_NOT_IN_PRODUCTION', 'Source asset does not belong to this production.'); }
    const version = Number(input.version || 1); if (!Number.isInteger(version) || version < 1) throw new HttpError(422, 'INVALID_ASSET_VERSION', 'Asset version must be a positive integer.');
    const r = await this.db.query(`INSERT INTO v3_production_assets(production_id,scene_id,asset_id,asset_role,source_asset_id,version,lifecycle,created_by) VALUES($1,$2,$3,$4,$5,$6,'active',$7) RETURNING *`, [productionId, input.scene_id || null, input.asset_id, input.asset_role, input.source_asset_id || null, version, actor.id]);
    await this.audit(actor, productionId, 'asset_linked', { production_asset_id: r.rows[0].id, asset_id: input.asset_id, asset_role: input.asset_role });
    return r.rows[0];
  }

  async qa(productionId, input, actor) {
    await this.exists(productionId);
    if (!qaStatuses.has(input.status) || !qaSeverities.has(input.severity || 'info')) throw new HttpError(422, 'INVALID_QA_STATE', 'Invalid QA status or severity.');
    if (input.scene_id) { const s = await this.db.query('SELECT 1 FROM v3_production_scenes WHERE id=$1 AND production_id=$2', [input.scene_id, productionId]); if (!s.rowCount) throw new HttpError(422, 'SCENE_NOT_IN_PRODUCTION', 'Scene does not belong to this production.'); }
    if (input.production_asset_id) { const a = await this.db.query('SELECT 1 FROM v3_production_assets WHERE id=$1 AND production_id=$2', [input.production_asset_id, productionId]); if (!a.rowCount) throw new HttpError(422, 'ASSET_NOT_IN_PRODUCTION', 'Asset does not belong to this production.'); }
    const r = await this.db.query(`INSERT INTO v3_production_qa_checks(production_id,scene_id,production_asset_id,status,issue_type,severity,notes,reviewer_id,reviewed_at,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,CASE WHEN $4 IN ('passed','failed','needs_changes') THEN now() ELSE NULL END,$8) RETURNING *`, [productionId, input.scene_id || null, input.production_asset_id || null, input.status, text(input.issue_type) || 'general', input.severity || 'info', text(input.notes) || null, actor.id]);
    await this.audit(actor, productionId, 'qa_recorded', { qa_id: r.rows[0].id, status: r.rows[0].status });
    return r.rows[0];
  }

  async render(productionId, input, actor) {
    await this.exists(productionId);
    const a = await this.db.query('SELECT id FROM v3_media_assets WHERE id=$1', [input.input_asset_id]); if (!a.rowCount) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Input asset was not found.');
    const preset = text(input.preset); if (!preset) throw new HttpError(422, 'RENDER_PRESET_REQUIRED', 'A render preset is required.');
    const r = await this.db.query(`INSERT INTO v3_production_render_jobs(production_id,input_asset_id,preset,status,created_by) VALUES($1,$2,$3,'queued',$4) RETURNING id,production_id,input_asset_id,preset,status,attempts,created_at`, [productionId, input.input_asset_id, preset, actor.id]);
    await this.audit(actor, productionId, 'render_job_created', { render_job_id: r.rows[0].id, preset });
    return r.rows[0];
  }

  async updateRender(productionId, renderId, input, actor) {
    await this.exists(productionId);
    if (!renderStatuses.has(input.status)) throw new HttpError(422, 'INVALID_RENDER_STATUS', 'Invalid render status.');
    if (input.status === 'succeeded' && !input.output_asset_id) throw new HttpError(422, 'RENDER_OUTPUT_REQUIRED', 'A successful render requires an output asset.');
    if (input.status === 'failed' && !text(input.failure_reason)) throw new HttpError(422, 'RENDER_FAILURE_REASON_REQUIRED', 'A failed render requires a failure reason.');
    if (input.output_asset_id) { const a = await this.db.query('SELECT 1 FROM v3_media_assets WHERE id=$1', [input.output_asset_id]); if (!a.rowCount) throw new HttpError(404, 'MEDIA_ASSET_NOT_FOUND', 'Render output asset was not found.'); }
    const result = await this.db.query(`UPDATE v3_production_render_jobs SET status=$3,output_asset_id=COALESCE($4,output_asset_id),failure_reason=$5,attempts=CASE WHEN $3 IN ('running','succeeded','failed') THEN attempts+1 ELSE attempts END,started_at=CASE WHEN $3='running' AND started_at IS NULL THEN now() ELSE started_at END,finished_at=CASE WHEN $3 IN ('succeeded','failed','cancelled') THEN now() ELSE finished_at END,updated_at=now() WHERE production_id=$1 AND id=$2 RETURNING id,production_id,input_asset_id,output_asset_id,preset,status,attempts,started_at,finished_at,created_at`, [productionId, renderId, input.status, input.output_asset_id || null, text(input.failure_reason) || null]);
    if (!result.rowCount) throw new HttpError(404, 'RENDER_JOB_NOT_FOUND', 'Render job was not found in this production.');
    await this.audit(actor, productionId, 'render_job_updated', { render_job_id: renderId, status: input.status });
    return result.rows[0];
  }

  async milestone(productionId, input, actor) {
    await this.exists(productionId); if (!text(input.name)) throw new HttpError(422, 'MILESTONE_REQUIRED', 'A milestone name is required.');
    const r = await this.db.query(`INSERT INTO v3_production_milestones(production_id,name,due_at,status,notes,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [productionId, text(input.name), input.due_at || null, ['planned','in_progress','complete','blocked','cancelled'].includes(input.status) ? input.status : 'planned', text(input.notes) || null, actor.id]);
    await this.audit(actor, productionId, 'milestone_created', { milestone_id: r.rows[0].id }); return r.rows[0];
  }

  async schedule({ from, to } = {}) {
    const values = []; const where = [];
    if (from) { values.push(from); where.push(`s.scheduled_at >= $${values.length}`); }
    if (to) { values.push(to); where.push(`s.scheduled_at < $${values.length}`); }
    const result = await this.db.query(`SELECT s.*,p.title AS production_title,p.reference FROM v3_production_shoots s JOIN v3_productions p ON p.id=s.production_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY s.scheduled_at NULLS LAST`, values);
    return { records: result.rows };
  }

  async readiness(id) {
    const p=await this.exists(id); const blockers=[]; const warnings=[]; const passed=[];
    if(!['qa','ready_to_publish','published'].includes(p.status)){blockers.push('production_not_in_qa');}else passed.push('production_status');
    const assignments=(await this.db.query('SELECT * FROM v3_production_participant_assignments WHERE production_id=$1 AND participation_status NOT IN (\'withdrawn\',\'blocked\')',[id])).rows;
    if(!assignments.length) blockers.push('participants_missing'); else passed.push('participants_recorded');
    const productionKeys = [String(p.id), p.reference];
    const consent=(await this.db.query('SELECT * FROM v3_production_consent_records WHERE production_id = ANY($1::text[]) ORDER BY created_at DESC LIMIT 1',[productionKeys])).rows[0];
    if(!consent || !['acknowledged','changed'].includes(consent.status)) blockers.push('production_consent_incomplete'); else passed.push('consent_acknowledged');
    const rights=(await this.db.query("SELECT * FROM v3_content_rights_records WHERE production_id = ANY($1::text[]) ORDER BY created_at DESC LIMIT 1",[productionKeys])).rows[0];
    if(!rights || rights.rights_status!=='active' || rights.commercial_exploitation_allowed!==true) blockers.push('commercial_rights_not_active'); else passed.push('commercial_rights_active');
    if(assignments.some(a=>a.creator_id)) { const ids=assignments.filter(a=>a.creator_id).map(a=>a.creator_id); const c=(await this.db.query(`SELECT count(*)::int n FROM v3_contract_instances WHERE creator_id=ANY($1::uuid[]) AND status IN ('assigned','viewed','signed')`,[ids])).rows[0].n; if(!c) blockers.push('participant_contracts_missing'); else passed.push('participant_contracts_present'); }
    const assets=(await this.db.query(`SELECT pa.asset_role,m.processing_state,m.visibility FROM v3_production_assets pa JOIN v3_media_assets m ON m.id=pa.asset_id WHERE pa.production_id=$1 AND pa.lifecycle='active'`,[id])).rows;
    const publicRoles=(role)=>assets.some(a=>a.asset_role===role&&a.processing_state==='ready'&&a.visibility==='public');
    if(!publicRoles('edited_master')&&!publicRoles('render_output')) blockers.push('public_playback_asset_missing'); else passed.push('public_playback_asset');
    if(!publicRoles('thumbnail_candidate')) blockers.push('public_thumbnail_missing'); else passed.push('public_thumbnail');
    const qa=(await this.db.query('SELECT * FROM v3_production_qa_checks WHERE production_id=$1',[id])).rows;
    if(qa.some(q=>q.status==='failed'||q.status==='needs_changes'||(q.severity==='critical'&&q.status!=='passed'))) blockers.push('qa_not_passed'); else if(!qa.some(q=>q.status==='passed')) blockers.push('qa_missing'); else passed.push('qa_passed');
    if(!p.brand_legacy_id) blockers.push('brand_missing'); else passed.push('brand_linked');
    const catalogue=(await this.db.query('SELECT 1 FROM v3_production_catalogue_links WHERE production_id=$1',[id])).rowCount; if(!catalogue) warnings.push('catalogue_not_linked'); else passed.push('catalogue_linked');
    return { production_id:id, publishable:!blockers.length, blockers:[...new Set(blockers)], warnings:[...new Set(warnings)], passed, checked_at:new Date().toISOString() };
  }

  async handoff(id,input,actor) { const p=await this.exists(id); const video=await this.db.query('SELECT legacy_id,title,description,slug,brand_legacy_id FROM catalog_videos WHERE legacy_id=$1',[input.video_legacy_id]); if(!video.rowCount)throw new HttpError(404,'VIDEO_NOT_FOUND','Catalogue video was not found.'); const readiness=await this.readiness(id); if(!readiness.publishable)throw new HttpError(409,'PRODUCTION_NOT_READY', 'Production is not ready for catalogue handoff.', {blockers:readiness.blockers}); const snapshot={title:p.title,description:p.description,brand_legacy_id:p.brand_legacy_id}; const handoffStatus=input.copy_metadata===true?'metadata_copied':'linked'; const r=await this.db.query(`INSERT INTO v3_production_catalogue_links(production_id,video_legacy_id,handoff_status,metadata_snapshot,linked_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT(production_id) DO UPDATE SET video_legacy_id=EXCLUDED.video_legacy_id,metadata_snapshot=EXCLUDED.metadata_snapshot,handoff_status=EXCLUDED.handoff_status,updated_at=now() RETURNING *`,[id,input.video_legacy_id,handoffStatus,snapshot,actor.id]); if(input.copy_metadata===true){await this.db.query('UPDATE catalog_videos SET title=$2,description=$3,brand_legacy_id=COALESCE($4,brand_legacy_id) WHERE legacy_id=$1',[input.video_legacy_id,p.title,p.description,p.brand_legacy_id||null]);} await this.audit(actor,id,'catalogue_handoff',{video_legacy_id:input.video_legacy_id,copy_metadata:input.copy_metadata===true}); return r.rows[0]; }

  async creatorProductions(user) { const r=await this.db.query(`SELECT DISTINCT p.id,p.title,p.reference,p.status,a.role,a.participation_status,s.title AS scene_title FROM v3_production_participant_assignments a JOIN v3_productions p ON p.id=a.production_id LEFT JOIN v3_production_scenes s ON s.id=a.scene_id JOIN v3_creator_records c ON c.user_id=$1 AND c.lifecycle NOT IN ('blocked','inactive') LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id WHERE (a.creator_id=c.id OR a.performer_legacy_id=l.performer_legacy_id) AND a.participation_status NOT IN ('withdrawn','blocked') ORDER BY p.updated_at DESC`,[user.id]); return {records:r.rows}; }
}

export { statuses as productionStatuses };
