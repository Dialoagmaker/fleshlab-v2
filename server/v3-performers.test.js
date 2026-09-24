import test from 'node:test';
import assert from 'node:assert/strict';
import { performerOperationalStates, V3PerformerService } from './v3-performers.js';
import { hasPermission } from './v3-system.js';

test('performer operations use controlled independent operational states and permissions', () => {
  assert.deepEqual([...performerOperationalStates].sort(), ['active', 'archived', 'inactive']);
  assert.equal(hasPermission({ role: 'admin' }, 'performer.create'), true);
  assert.equal(hasPermission({ role: 'staff' }, 'performer.read'), true);
  assert.equal(hasPermission({ role: 'staff' }, 'performer.update'), false);
  assert.equal(hasPermission({ role: 'performer' }, 'performer.read'), false);
});

test('manual performer creation rejects malformed profile input before persistence', async () => {
  const service = new V3PerformerService({ query: async () => { throw new Error('database should not be called'); } });
  await assert.rejects(() => service.create({ display_name: '', slug: '' }, { id: 'admin' }), { code: 'INVALID_PERFORMER' });
});

test('performer operations migration is additive and preserves separate public, operational and account state', async () => {
  const fs = await import('node:fs/promises');
  const sql = await fs.readFile(new URL('../migrations/0031_v3_performer_operations.sql', import.meta.url), 'utf8');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS operational_status/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS public_visibility/);
  assert.match(sql, /v3_performer_user_links/);
  assert.doesNotMatch(sql, /DROP TABLE|DELETE FROM/i);
});
