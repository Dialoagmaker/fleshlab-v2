import test from 'node:test';
import assert from 'node:assert/strict';
import { V3OperationsService } from './v3-operations.js';

test('V3 operations reports readiness from persisted counts rather than invented metrics', async () => {
  const db = { query: async () => ({ rows: [{ rendering_jobs: 0, rendering_active: 0, qa_open: 0, audits_open: 0, certifications_open: 0, published_videos: 8, unpublished_videos: 3 }] }) };
  const snapshot = await new V3OperationsService(db).production();
  assert.equal(snapshot.lifecycle.published, 8);
  assert.equal(snapshot.workstreams[0].empty, 'No self-hosted render jobs have been recorded.');
});

test('V3 system projection never returns configuration secrets', async () => {
  const db = { query: async () => ({ rows: [{ migration_count: 10, admins: 1, staff: 0, automations: 0, automations_enabled: 0, settings: 0, audit_events: 0 }] }) };
  const snapshot = await new V3OperationsService(db).system();
  assert.equal(JSON.stringify(snapshot).includes('SESSION_SECRET='), false);
  assert.equal(JSON.stringify(snapshot).includes('POSTGRES_PASSWORD='), false);
  assert.equal(snapshot.services.find(item => item.key === 'integrations').state, 'NOT_CONFIGURED');
});
