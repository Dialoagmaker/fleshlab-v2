import { HttpError } from './errors.js';

const defs = {
  rendering: { table: 'admin_rendering_jobs', order: 'created_at DESC' },
  qa: { table: 'admin_qa_records', order: 'created_at DESC' },
  audit: { table: 'admin_studio_audits', order: 'created_at DESC' },
  certification: { table: 'admin_certifications', order: 'created_at DESC' },
  readiness: { table: 'admin_provider_readiness', order: 'created_at DESC' },
  automation: { table: 'admin_automations', order: 'created_at DESC' },
  settings: { table: 'admin_settings', order: 'key ASC' }
};
const columns = {
  rendering: ['asset_id','provider_id','status','output_reference','metadata'],
  qa: ['asset_id','performer_id','video_id','severity','status','decision','reviewer_notes','metadata'],
  audit: ['scope','status','severity','findings','notes'],
  certification: ['asset_id','performer_id','video_id','status','evidence','review_due_at','reviewer_notes'],
  readiness: ['provider_name','status','requirements','notes'],
  automation: ['name','enabled','trigger_config','conditions','actions'],
  settings: ['key','value']
};
function def(kind) { const value = defs[kind]; if (!value) throw new HttpError(404, 'NOT_FOUND', 'Admin operation module was not found.'); return value; }
function clean(kind, input = {}) { const allowed = columns[kind]; return Object.fromEntries(allowed.filter(k => Object.prototype.hasOwnProperty.call(input, k)).map(k => [k, input[k]])); }
function values(data) { return Object.entries(data).map(([key, value]) => ['metadata','findings','evidence','requirements','trigger_config','conditions','actions','value'].includes(key) ? JSON.stringify(value ?? (key === 'value' ? {} : [])) : value); }
export class AdminOperationsService {
  constructor(db) { this.db = db; }
  async list(kind) { const d = def(kind); return (await this.db.query(`SELECT * FROM ${d.table} ORDER BY ${d.order}`)).rows; }
  async save(kind, id, input, user) {
    const d = def(kind); const data = clean(kind, input); if (!Object.keys(data).length) throw new HttpError(422, 'INVALID_INPUT', 'At least one field is required.');
    if (kind === 'settings') {
      const args = values(data); const result = await this.db.query(`INSERT INTO admin_settings(key,value,updated_by) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *`, [data.key, args[1] ?? '{}', user.id]);
      return result.rows[0];
    }
    if (id) {
      const keys = Object.keys(data); const sets = keys.map((k,i) => `${k}=$${i+1}`).join(',');
      const args = values(data); args.push(id); const result = await this.db.query(`UPDATE ${d.table} SET ${sets},updated_at=now() WHERE id=$${args.length} RETURNING *`, args);
      if (!result.rowCount) throw new HttpError(404, 'NOT_FOUND', 'Record was not found.'); return result.rows[0];
    }
    const keys = Object.keys(data); const args = values(data); const result = await this.db.query(`INSERT INTO ${d.table}(${keys.join(',')},created_by) VALUES(${keys.map((_,i)=>`$${i+1}`).join(',')},$${args.length+1}) RETURNING *`, [...args, user.id]); return result.rows[0];
  }
  async remove(kind, id) { const d = def(kind); const result = kind === 'settings' ? await this.db.query(`DELETE FROM ${d.table} WHERE key=$1 RETURNING key`, [id]) : await this.db.query(`DELETE FROM ${d.table} WHERE id=$1 RETURNING id`, [id]); if (!result.rowCount) throw new HttpError(404, 'NOT_FOUND', 'Record was not found.'); return { deleted: true }; }
}
