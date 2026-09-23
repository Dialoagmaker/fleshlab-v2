import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPermission, hasPermission, permissionsFor, roleDefinitions, V3SystemService } from './v3-system.js';

test('canonical roles preserve admin/staff boundaries and deny creator/customer system access', () => {
  assert.equal(hasPermission({ role: 'admin' }, 'system.users'), true);
  assert.equal(hasPermission({ role: 'staff' }, 'system.users'), false);
  assert.equal(hasPermission({ role: 'staff' }, 'system.audit'), true);
  assert.equal(hasPermission({ role: 'performer' }, 'system.read'), false);
  assert.deepEqual(permissionsFor({ role: 'customer' }), []);
  assert.throws(() => assertPermission({ role: 'performer' }, 'system.read'), { code: 'FORBIDDEN' });
  assert.equal(roleDefinitions().find(role => role.role === 'admin').permissions.includes('commerce.execute'), true);
});

test('system audit projection redacts secret-shaped metadata', async () => {
  const db = { query: async () => ({ rows: [{ id: 'event-1', actor_id: 'user-1', actor_email: 'admin@example.test', action: 'user.updated', domain: 'system', entity_type: 'user', entity_id: 'user-2', result: 'success', before_summary: { password_hash: 'hidden' }, after_summary: { role: 'staff' }, metadata: { session_token: 'hidden', safe: true }, created_at: new Date().toISOString() }] }) };
  const result = await new V3SystemService(db, {}).auditLog({ limit: 1 });
  assert.equal(result.records[0].before_summary.password_hash, '[REDACTED]');
  assert.equal(result.records[0].metadata.session_token, '[REDACTED]');
  assert.equal(result.records[0].metadata.safe, true);
});

test('migration status reports legacy applied rows and pending migrations without claiming checksum verification', async () => {
  const db = { query: async sql => sql.includes('FROM schema_migrations') ? { rows: [{ version: '0025_phase4_production_integrity.sql', applied_at: '2026-09-23T09:25:00Z', checksum: null }] } : { rows: [] } };
  const service = new V3SystemService(db, {}, null, new URL('../migrations/', import.meta.url).pathname);
  const result = await service.migrations();
  const phase4 = result.records.find(item => item.version === '0025_phase4_production_integrity.sql');
  assert.equal(phase4.status, 'applied_legacy');
  assert.equal(result.records.some(item => item.version === '0026_v3_system_administration.sql' && item.status === 'pending'), true);
});

test('system settings never writes sensitive or read-only catalog entries', async () => {
  const db = { query: async sql => {
    if (sql.startsWith('SELECT key,value')) return { rows: [] };
    return { rows: [{ key: 'public_support_email', value: 'ops@example.test', updated_at: new Date().toISOString() }] };
  } };
  const service = new V3SystemService(db, {});
  await assert.rejects(() => service.updateSetting('storage_reference', { value: 'secret' }, { id: 'admin', role: 'admin' }), { code: 'SETTING_NOT_WRITABLE' });
  const result = await service.updateSetting('public_support_email', { value: 'ops@example.test' }, { id: 'admin', role: 'admin' });
  assert.equal(result.value, 'ops@example.test');
});

