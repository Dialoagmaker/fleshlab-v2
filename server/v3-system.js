import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from './errors.js';

export const SYSTEM_PERMISSIONS = [
  'catalogue.read', 'catalogue.write', 'catalogue.publish',
  'creator.read', 'creator.review', 'creator.write',
  'contracts.read', 'contracts.admin',
  'production.read', 'production.write', 'production.qa', 'production.render',
  'system.read', 'system.users', 'system.roles', 'system.sessions',
  'system.settings', 'system.flags', 'system.integrations', 'system.audit',
  'system.diagnostics', 'system.backups',
  'growth.read', 'growth.write', 'growth.campaigns', 'growth.assets', 'growth.publish',
  'commerce.read', 'commerce.pricing', 'commerce.payments', 'commerce.settlements',
  'commerce.payouts.review', 'commerce.payouts.approve', 'commerce.payouts.execute',
  'commerce.providers', 'commerce.reconcile', 'commerce.execute'
];

const STAFF_PERMISSIONS = new Set([
  'catalogue.read', 'creator.read', 'creator.review', 'contracts.read',
  'production.read', 'production.qa', 'system.read', 'system.roles',
  'system.audit', 'system.diagnostics', 'system.integrations',
  'growth.read', 'commerce.read', 'commerce.settlements', 'commerce.payouts.review', 'commerce.reconcile'
]);
const ROLE_PERMISSIONS = Object.freeze({
  admin: new Set(SYSTEM_PERMISSIONS),
  staff: STAFF_PERMISSIONS,
  performer: new Set(),
  customer: new Set()
});
const SENSITIVE_KEYS = /password|passwd|hash|secret|token|cookie|authorization|private.?key|credential|sas|storage.?key/i;
const ADMIN_SETTINGS = Object.freeze([
  { key: 'public_application_name', category: 'public', description: 'Public application display name.', environment: 'all', sensitive: false, read_only: false },
  { key: 'public_support_email', category: 'public', description: 'Public support contact address.', environment: 'all', sensitive: false, read_only: false },
  { key: 'job_stale_after_minutes', category: 'threshold', description: 'Minutes before an active job is reported as potentially stuck.', environment: 'all', sensitive: false, read_only: false },
  { key: 'admin_session_max_age_days', category: 'threshold', description: 'Reference threshold for administrative session review.', environment: 'all', sensitive: false, read_only: true },
  { key: 'email_delivery_reference', category: 'integration_reference', description: 'Safe reference describing the configured email delivery endpoint.', environment: 'all', sensitive: true, read_only: true },
  { key: 'storage_reference', category: 'integration_reference', description: 'Safe reference describing configured private storage.', environment: 'all', sensitive: true, read_only: true }
]);
const INTEGRATION_DEFINITIONS = Object.freeze([
  ['azure_storage', 'Azure Storage', 'storage'],
  ['email_delivery', 'Email delivery', 'communications'],
  ['analytics', 'Analytics provider', 'analytics'],
  ['payments', 'Payment providers', 'commerce'],
  ['external_media', 'External media services', 'media'],
  ['rendering', 'Rendering service', 'production']
]);

export function permissionsFor(user = {}) { return [...(ROLE_PERMISSIONS[user.role] || [])].sort(); }
export function hasPermission(user, permission) { return ROLE_PERMISSIONS[user?.role]?.has(permission) === true; }
export function assertPermission(user, permission) {
  if (!hasPermission(user, permission)) throw new HttpError(403, 'FORBIDDEN', `Permission required: ${permission}.`);
  return user;
}
export function roleDefinitions() {
  return Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({ role, permissions: [...permissions].sort() }));
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, SENSITIVE_KEYS.test(key) ? '[REDACTED]' : redact(child)]));
}
function safeText(value, maximum = 500) { return value == null ? null : String(value).slice(0, maximum); }
function idOrNull(value) { return value ? String(value) : null; }

export class V3SystemService {
  constructor(db, config, blob, migrationDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')) {
    this.db = db; this.config = config; this.blob = blob; this.migrationDirectory = migrationDirectory;
  }

  async audit(actor, action, entityType, entityId, before = null, after = null, request = null, result = 'success', domain = 'system') {
    await this.db.query(
      `INSERT INTO v3_audit_events(actor_id,action,entity_type,entity_id,before_summary,after_summary,domain,result,metadata,ip_address)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [actor?.id || null, action, entityType, String(entityId), redact(before), redact(after), domain, result, redact({ request_id: request?.headers?.['x-request-id'] || null, user_agent: safeText(request?.headers?.['user-agent'], 200) }), request?.socket?.remoteAddress || null]
    );
  }

  async users({ query = '', role = '', status = '', limit = 50, offset = 0 } = {}) {
    const boundedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const boundedOffset = Math.max(Number(offset) || 0, 0);
    const values = [`%${String(query).trim()}%`];
    const conditions = [`(u.email ILIKE $1 OR u.id::text ILIKE $1)`];
    if (['admin', 'staff', 'performer', 'customer'].includes(role)) { values.push(role); conditions.push(`u.role=$${values.length}`); }
    if (['active', 'disabled', 'pending_reset'].includes(status)) { values.push(status); conditions.push(`u.account_status=$${values.length}`); }
    values.push(boundedLimit, boundedOffset);
    const result = await this.db.query(`
      SELECT u.id,u.email,u.role,u.account_status,u.created_at,u.updated_at,
        max(s.created_at) AS last_login,
        count(s.id) FILTER (WHERE s.revoked_at IS NULL AND s.expires_at > now())::int AS active_sessions,
        c.id AS creator_id,c.lifecycle AS creator_lifecycle,
        coalesce(jsonb_agg(DISTINCT jsonb_build_object('legacy_id',p.legacy_id,'display_name',p.display_name)) FILTER (WHERE p.legacy_id IS NOT NULL),'[]'::jsonb) AS linked_performers
      FROM app_users u
      LEFT JOIN web_sessions s ON s.user_id=u.id
      LEFT JOIN v3_creator_records c ON c.user_id=u.id
      LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id
      LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY u.id,c.id
      ORDER BY u.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { records: result.rows.map(row => ({ ...row, permissions: permissionsFor(row), linked_performers: row.linked_performers || [] })), limit: boundedLimit, offset: boundedOffset };
  }

  async user(id) {
    const result = await this.db.query(`
      SELECT u.id,u.email,u.role,u.account_status,u.created_at,u.updated_at,
        max(s.created_at) AS last_login,
        count(s.id) FILTER (WHERE s.revoked_at IS NULL AND s.expires_at > now())::int AS active_sessions,
        c.id AS creator_id,c.lifecycle AS creator_lifecycle,
        coalesce(jsonb_agg(DISTINCT jsonb_build_object('legacy_id',p.legacy_id,'display_name',p.display_name)) FILTER (WHERE p.legacy_id IS NOT NULL),'[]'::jsonb) AS linked_performers
      FROM app_users u
      LEFT JOIN web_sessions s ON s.user_id=u.id
      LEFT JOIN v3_creator_records c ON c.user_id=u.id
      LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id
      LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id
      WHERE u.id=$1 GROUP BY u.id,c.id`, [id]);
    if (!result.rowCount) throw new HttpError(404, 'USER_NOT_FOUND', 'User was not found.');
    const sessions = await this.sessions({ userId: id });
    const row = result.rows[0];
    return { ...row, permissions: permissionsFor(row), linked_performers: row.linked_performers || [], sessions: sessions.records };
  }

  async updateUser(id, input, actor, request) {
    const allowedRoles = new Set(['admin', 'staff', 'performer', 'customer']);
    const allowedStatuses = new Set(['active', 'disabled', 'pending_reset']);
    const role = input.role == null ? null : String(input.role);
    const accountStatus = input.account_status == null ? null : String(input.account_status);
    if (role && !allowedRoles.has(role)) throw new HttpError(422, 'INVALID_ROLE', 'Role is not assignable.');
    if (accountStatus && !allowedStatuses.has(accountStatus)) throw new HttpError(422, 'INVALID_ACCOUNT_STATUS', 'Account status is not assignable.');
    if (!role && !accountStatus) throw new HttpError(422, 'NO_USER_CHANGE', 'A role or account status change is required.');
    const current = await this.db.query('SELECT id,email,role,account_status FROM app_users WHERE id=$1', [id]);
    if (!current.rowCount) throw new HttpError(404, 'USER_NOT_FOUND', 'User was not found.');
    const before = current.rows[0];
    if (String(actor.id) === String(id) && ((role && role !== 'admin') || (accountStatus && accountStatus !== 'active'))) throw new HttpError(409, 'SELF_LOCKOUT_PREVENTED', 'An administrator cannot remove their own active administrator access.');
    if (before.role === 'admin' && (role && role !== 'admin' || accountStatus === 'disabled')) {
      const count = await this.db.query(`SELECT count(*)::int AS count FROM app_users WHERE role='admin' AND account_status='active'`);
      if (Number(count.rows[0].count) <= 1) throw new HttpError(409, 'LAST_ADMIN_PROTECTED', 'The last active administrator cannot be disabled or demoted.');
    }
    const result = await this.db.query(`UPDATE app_users SET role=coalesce($2,role),account_status=coalesce($3,account_status),updated_at=now() WHERE id=$1 RETURNING id,email,role,account_status,created_at,updated_at`, [id, role, accountStatus]);
    const after = result.rows[0];
    await this.audit(actor, 'user.updated', 'user', id, before, after, request);
    return { ...after, permissions: permissionsFor(after) };
  }

  async sessions({ userId = null, includeExpired = false } = {}) {
    const values = []; const where = [];
    if (userId) { values.push(userId); where.push(`s.user_id=$${values.length}`); }
    if (!includeExpired) where.push(`s.expires_at > now()`);
    const result = await this.db.query(`SELECT s.id,s.user_id,u.email,u.role,s.created_at,s.expires_at,s.revoked_at,s.user_agent,s.ip_address,
      (s.revoked_at IS NULL AND s.expires_at > now()) AS active
      FROM web_sessions s JOIN app_users u ON u.id=s.user_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY s.created_at DESC LIMIT 200`, values);
    return { records: result.rows.map(({ token_hash, ...safe }) => safe) };
  }

  async revokeSession(id, actor, request) {
    const current = await this.db.query('SELECT id,user_id,revoked_at FROM web_sessions WHERE id=$1', [id]);
    if (!current.rowCount) throw new HttpError(404, 'SESSION_NOT_FOUND', 'Session was not found.');
    await this.db.query('UPDATE web_sessions SET revoked_at=coalesce(revoked_at,now()) WHERE id=$1', [id]);
    await this.audit(actor, 'session.revoked', 'session', id, { user_id: current.rows[0].user_id, revoked_at: current.rows[0].revoked_at }, { revoked: true }, request);
    return { id, revoked: true };
  }

  async settings() {
    const result = await this.db.query('SELECT key,value,category,description,environment,sensitive,read_only,updated_by,updated_at FROM admin_settings ORDER BY key');
    const stored = new Map(result.rows.map(row => [row.key, row]));
    return ADMIN_SETTINGS.map(def => {
      const row = stored.get(def.key);
      return { ...def, value: def.sensitive ? (row ? '[CONFIGURED]' : null) : (row?.value ?? null), configured: Boolean(row), updated_by: row?.updated_by || null, updated_at: row?.updated_at || null };
    });
  }

  async updateSetting(key, input, actor, request) {
    const definition = ADMIN_SETTINGS.find(item => item.key === key);
    if (!definition || definition.read_only || definition.sensitive) throw new HttpError(422, 'SETTING_NOT_WRITABLE', 'This setting is not writable through the system UI.');
    if (!Object.prototype.hasOwnProperty.call(input, 'value')) throw new HttpError(422, 'SETTING_VALUE_REQUIRED', 'A setting value is required.');
    if (key.includes('email') && input.value && !/^\S+@\S+\.\S+$/.test(String(input.value))) throw new HttpError(422, 'SETTING_INVALID', 'A valid email address is required.');
    const previous = await this.db.query('SELECT key,value FROM admin_settings WHERE key=$1', [key]);
    const result = await this.db.query(`INSERT INTO admin_settings(key,value,updated_by,category,description,environment,sensitive,read_only)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=now(),category=EXCLUDED.category,description=EXCLUDED.description,environment=EXCLUDED.environment,sensitive=EXCLUDED.sensitive,read_only=EXCLUDED.read_only
      RETURNING key,value,updated_at`, [key, input.value, actor.id, definition.category, definition.description, definition.environment, definition.sensitive, definition.read_only]);
    await this.audit(actor, 'setting.updated', 'setting', key, previous.rows[0] || null, { key, value: '[SAFE_SETTING_VALUE]' }, request);
    return { ...result.rows[0], value: definition.sensitive ? '[CONFIGURED]' : result.rows[0].value };
  }

  async flags(environment = 'all') {
    const result = await this.db.query(`SELECT id,key,environment,enabled,description,risk_level,updated_by,created_at,updated_at FROM v3_feature_flags WHERE environment=$1 OR environment='all' ORDER BY key`, [environment]);
    return { records: result.rows };
  }

  async updateFlag(key, input, actor, request) {
    if (typeof input.enabled !== 'boolean') throw new HttpError(422, 'FLAG_VALUE_REQUIRED', 'enabled must be boolean.');
    const environment = String(input.environment || 'all');
    const existing = await this.db.query('SELECT * FROM v3_feature_flags WHERE key=$1 AND environment=$2', [key, environment]);
    if (!existing.rowCount) throw new HttpError(404, 'FLAG_NOT_FOUND', 'Feature flag is not registered.');
    if (existing.rows[0].risk_level === 'high' && input.enabled && actor.role !== 'admin') throw new HttpError(403, 'HIGH_RISK_FLAG_ADMIN_ONLY', 'High-risk flags require an administrator.');
    const result = await this.db.query('UPDATE v3_feature_flags SET enabled=$3,updated_by=$4,updated_at=now() WHERE key=$1 AND environment=$2 RETURNING id,key,environment,enabled,description,risk_level,updated_by,created_at,updated_at', [key, environment, input.enabled, actor.id]);
    await this.audit(actor, 'feature_flag.updated', 'feature_flag', key, { enabled: existing.rows[0].enabled, environment }, { enabled: input.enabled, environment }, request);
    return result.rows[0];
  }

  async integrations() {
    const stored = await this.db.query('SELECT key,label,category,configured,status,safe_metadata,last_checked_at,last_success_at,updated_by,updated_at FROM v3_integration_status ORDER BY key');
    const values = new Map(stored.rows.map(row => [row.key, row]));
    const output = [];
    for (const [key, label, category] of INTEGRATION_DEFINITIONS) {
      const row = values.get(key) || { key, label, category, configured: false, status: 'unknown', safe_metadata: {} };
      const checked = await this.checkIntegration(key, { persist: false });
      output.push({ ...row, ...checked, safe_metadata: redact({ ...(row.safe_metadata || {}), ...(checked.safe_metadata || {}) }) });
    }
    return { records: output };
  }

  async checkIntegration(key, { persist = true, actor = null, request = null } = {}) {
    const definition = INTEGRATION_DEFINITIONS.find(item => item[0] === key);
    if (!definition) throw new HttpError(404, 'INTEGRATION_NOT_FOUND', 'Integration is not registered.');
    let configured = false; let status = 'not_configured'; let safeMetadata = {};
    if (key === 'azure_storage') {
      configured = Boolean(this.config.storageAccountUrl && this.blob);
      safeMetadata = { account_host: this.config.storageAccountUrl ? new URL(this.config.storageAccountUrl).host : null, container: this.config.uploadContainer };
      if (configured) {
        try { status = this.blob.health ? (await this.blob.health()).healthy ? 'healthy' : 'degraded' : 'unknown'; }
        catch { status = 'unavailable'; }
      }
    } else if (key === 'email_delivery') {
      configured = Boolean(this.config.emailDeliveryUrl);
      safeMetadata = { endpoint_configured: configured, queued_failures: Number((await this.db.query("SELECT count(*)::int AS count FROM outbound_email_queue WHERE status='failed'")).rows[0].count) };
      status = configured ? 'healthy' : 'not_configured';
    } else if (key === 'rendering') {
      const jobs = await this.db.query("SELECT count(*) FILTER (WHERE status IN ('queued','running'))::int AS active,count(*) FILTER (WHERE status='failed')::int AS failed FROM v3_production_render_jobs");
      safeMetadata = jobs.rows[0]; configured = true; status = Number(safeMetadata.failed) ? 'degraded' : 'healthy';
    } else if (key === 'payments') {
      const flags = await this.db.query("SELECT bool_or(enabled) AS enabled FROM v3_feature_flags WHERE key='v3_commerce_execution'");
      configured = false; safeMetadata = { execution_enabled: Boolean(flags.rows[0].enabled) }; status = 'not_configured';
    } else if (key === 'analytics') {
      configured = false; safeMetadata = { external_metrics_exposed: false }; status = 'not_configured';
    } else if (key === 'external_media') {
      configured = Boolean(this.config.storageAccountUrl); safeMetadata = { media_migration_enabled: this.config.mediaMigrationEnabled }; status = configured ? 'healthy' : 'not_configured';
    }
    const checkedAt = new Date().toISOString();
    if (persist) {
      await this.db.query(`INSERT INTO v3_integration_status(key,label,category,configured,status,safe_metadata,last_checked_at,last_success_at,updated_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,CASE WHEN $5='healthy' THEN $7 ELSE NULL END,$8)
        ON CONFLICT(key) DO UPDATE SET configured=EXCLUDED.configured,status=EXCLUDED.status,safe_metadata=EXCLUDED.safe_metadata,last_checked_at=EXCLUDED.last_checked_at,last_success_at=CASE WHEN EXCLUDED.status='healthy' THEN EXCLUDED.last_checked_at ELSE v3_integration_status.last_success_at END,updated_by=EXCLUDED.updated_by,updated_at=now()`, [key, definition[1], definition[2], configured, status, redact(safeMetadata), checkedAt, actor?.id || null]);
      if (actor) await this.audit(actor, 'integration.checked', 'integration', key, null, { configured, status, safe_metadata: safeMetadata }, request);
    }
    return { configured, status, safe_metadata: safeMetadata, last_checked_at: checkedAt, ...(status === 'healthy' ? { last_success_at: checkedAt } : {}) };
  }

  async migrations() {
    const files = (await fs.readdir(this.migrationDirectory)).filter(name => name.endsWith('.sql')).sort();
    const applied = (await this.db.query('SELECT version,applied_at,checksum FROM schema_migrations ORDER BY version')).rows;
    const appliedByVersion = new Map(applied.map(row => [row.version, row]));
    const records = [];
    for (const file of files) {
      const content = await fs.readFile(path.join(this.migrationDirectory, file));
      const checksum = crypto.createHash('sha256').update(content).digest('hex');
      const row = appliedByVersion.get(file);
      records.push({ version: file, checksum, applied_checksum: row?.checksum || null, applied_at: row?.applied_at || null, status: row ? (row.checksum && row.checksum !== checksum ? 'checksum_mismatch' : row.checksum ? 'applied' : 'LEGACY_APPLIED_CHECKSUM_UNAVAILABLE') : 'pending' });
    }
    return { records, applied: records.filter(row => row.status === 'applied' || row.status === 'LEGACY_APPLIED_CHECKSUM_UNAVAILABLE').length, pending: records.filter(row => row.status === 'pending').length, mismatched: records.filter(row => row.status === 'checksum_mismatch').length, latest: records.at(-1) || null };
  }

  async health() {
    const checks = [];
    try { await this.db.query('SELECT 1'); checks.push({ key: 'postgresql', label: 'PostgreSQL', state: 'healthy', detail: 'Database query succeeded.' }); }
    catch (error) { checks.push({ key: 'postgresql', label: 'PostgreSQL', state: 'unavailable', detail: safeText(error.message) }); }
    const migration = await this.migrations();
    checks.push({ key: 'migrations', label: 'Migrations', state: migration.pending || migration.mismatched ? 'degraded' : 'healthy', detail: `${migration.applied} applied, ${migration.pending} pending, ${migration.mismatched} checksum mismatches.` });
    const integrations = await this.integrations();
    const storage = integrations.records.find(item => item.key === 'azure_storage');
    checks.push({ key: 'storage', label: 'Private storage', state: storage.status, detail: storage.configured ? 'Configured storage readiness was checked without exposing credentials.' : 'Private storage is not configured.' });
    const jobs = await this.db.query(`SELECT
      (SELECT count(*)::int FROM v3_production_render_jobs WHERE status IN ('queued','running')) AS render_active,
      (SELECT count(*)::int FROM v3_production_render_jobs WHERE status IN ('queued','running') AND updated_at < now() - interval '1 hour') AS render_stale,
      (SELECT count(*)::int FROM v3_production_render_jobs WHERE status='failed') AS render_failed,
      (SELECT count(*)::int FROM outbound_email_queue WHERE status='failed') AS email_failed`);
    const jobCounts = jobs.rows[0];
    const jobDegraded = Number(jobCounts.render_failed || 0) || Number(jobCounts.email_failed || 0) || Number(jobCounts.render_stale || 0);
    checks.push({ key: 'background_jobs', label: 'Background jobs', state: jobDegraded ? 'degraded' : 'healthy', detail: `${jobCounts.render_active} rendering jobs active; ${jobCounts.render_stale} stale rendering jobs; ${jobCounts.render_failed} rendering failures; ${jobCounts.email_failed} email failures.` });
    checks.push({ key: 'rendering', label: 'Rendering readiness', state: integrations.records.find(item => item.key === 'rendering')?.status || 'unknown', detail: 'Production render-job state is read from PostgreSQL.' });
    const publicData = await this.db.query("SELECT count(*)::int AS published FROM catalog_videos WHERE status='published' AND v3_lifecycle='published'");
    checks.push({ key: 'public_v3', label: 'Public V3', state: 'healthy', detail: `${publicData.rows[0].published} published V3 catalogue records are queryable.` });
    const docs = await this.db.query('SELECT count(*)::int AS count FROM v3_creator_documents');
    checks.push({ key: 'creator_documents', label: 'Creator document storage', state: storage.status, detail: `${docs.rows[0].count} creator document records are indexed; storage readiness follows private storage.` });
    return { checks, healthy: checks.every(check => !['unavailable', 'degraded'].includes(check.state)) };
  }

  async auditLog(filters = {}) {
    const values = []; const where = [];
    const add = (sql, value) => { values.push(value); where.push(sql.replace('?', `$${values.length}`)); };
    if (filters.action) add('e.action ILIKE ?', `%${String(filters.action).slice(0, 100)}%`);
    if (filters.domain) add('e.domain=$?', String(filters.domain));
    if (filters.entity_type) add('e.entity_type=$?', String(filters.entity_type));
    if (filters.entity_id) add('e.entity_id=$?', String(filters.entity_id));
    if (filters.actor) { const value = `%${String(filters.actor).slice(0, 100)}%`; values.push(value, value); where.push(`(u.email ILIKE $${values.length - 1} OR e.actor_id::text ILIKE $${values.length})`); }
    const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200); values.push(limit);
    const result = await this.db.query(`SELECT e.id,e.actor_id,u.email AS actor_email,e.action,e.domain,e.entity_type,e.entity_id,e.result,e.before_summary,e.after_summary,e.metadata,e.ip_address,e.created_at FROM v3_audit_events e LEFT JOIN app_users u ON u.id=e.actor_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY e.created_at DESC LIMIT $${values.length}`, values);
    return { records: result.rows.map(row => ({ ...row, before_summary: redact(row.before_summary), after_summary: redact(row.after_summary), metadata: redact(row.metadata) })) };
  }

  async diagnostics() {
    const [renders, emails, stale, rights] = await Promise.all([
      this.db.query("SELECT id,production_id,status,failure_reason,updated_at FROM v3_production_render_jobs WHERE status='failed' ORDER BY updated_at DESC LIMIT 25"),
      this.db.query("SELECT id,recipient_email,template,status,last_error,created_at FROM outbound_email_queue WHERE status='failed' ORDER BY created_at DESC LIMIT 25"),
      this.db.query("SELECT count(*)::int AS count FROM v3_production_render_jobs WHERE status IN ('queued','running') AND updated_at < now() - interval '1 hour'"),
      this.db.query("SELECT count(*)::int AS count FROM v3_production_participant_assignments WHERE consent_record_id IS NULL OR participation_status NOT IN ('confirmed','completed')")
    ]);
    return { failed_jobs: renders.rows, integration_failures: emails.rows.map(row => ({ ...row, recipient_email: row.recipient_email ? `${row.recipient_email.slice(0, 2)}…` : null })), stuck_workflows: { rendering_jobs: stale.rows[0].count, participant_assignments_needing_action: rights.rows[0].count }, recent_errors: [...renders.rows, ...emails.rows].slice(0, 50) };
  }

  async backups() {
    const records = (await this.db.query(`SELECT id,backup_type,status,completed_at,location_reference,restore_tested,notes,created_at FROM v3_backup_records ORDER BY completed_at DESC NULLS LAST,created_at DESC LIMIT 50`)).rows;
    const latest = records[0] || null;
    return { records: records.map(row => ({ ...row, readiness: row.status === 'completed' && row.restore_tested ? 'RESTORE_TESTED' : row.status === 'completed' ? 'NOT_RESTORE_TESTED' : 'NOT_READY' })), latest, readiness: latest ? (latest.status === 'completed' && latest.restore_tested ? 'RESTORE_TESTED' : latest.status === 'completed' ? 'NOT_RESTORE_TESTED' : 'NOT_READY') : 'NOT_OBSERVED' };
  }

  async overview() {
    const [users, flags, integrations, health, migration, audit, diagnostics, backups] = await Promise.all([
      this.users({ limit: 1 }), this.flags(), this.integrations(), this.health(), this.migrations(), this.auditLog({ limit: 10 }), this.diagnostics(), this.backups()
    ]);
    const counts = (await this.db.query(`SELECT
      (SELECT count(*)::int FROM app_users) users,
      (SELECT count(*)::int FROM app_users WHERE role='admin' AND account_status='active') admins,
      (SELECT count(*)::int FROM web_sessions WHERE revoked_at IS NULL AND expires_at > now()) active_sessions,
      (SELECT count(*)::int FROM admin_settings) settings,
      (SELECT count(*)::int FROM v3_feature_flags WHERE enabled) enabled_flags,
      (SELECT count(*)::int FROM v3_audit_events) audit_events`)).rows[0];
    return { counts, permissions: SYSTEM_PERMISSIONS, roles: roleDefinitions(), users: users.records, flags: flags.records, integrations: integrations.records, health, migrations: migration, recent_audit: audit.records, diagnostics: { failed_jobs: diagnostics.failed_jobs.length, stuck_workflows: diagnostics.stuck_workflows }, backups };
  }
}
