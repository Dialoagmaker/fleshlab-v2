import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationReviewStates, applicationTransitions, assertCreatorOwner, creatorDocumentStates, creatorLifecycle, creatorOnboardingStates, publicDocument, V3CreatorService } from './v3-creators.js';

test('V3 creator states are finite and cannot include legacy free-form review values', () => {
  assert.equal(applicationReviewStates.has('approved'), true);
  assert.equal(applicationReviewStates.has('signed'), false);
  assert.equal(creatorLifecycle.has('active'), true);
  assert.equal(creatorLifecycle.has('published'), false);
  assert.equal(creatorOnboardingStates.has('needs_review'), true);
  assert.equal(creatorDocumentStates.has('accepted'), true);
});

test('V3 creator endpoint refuses a non-performer before reading a creator record', async () => {
  const service = new V3CreatorService({ query: async () => { throw new Error('database should not be called'); } });
  await assert.rejects(() => service.creatorForUser({ id: 'customer', role: 'customer' }), { code: 'FORBIDDEN' });
});

test('two creator identities remain isolated in the ownership guard', () => {
  const creatorA = { id: 'creator-a', role: 'performer' };
  const creatorB = { id: 'creator-b', role: 'performer' };
  const recordA = { user_id: creatorA.id };
  assert.doesNotThrow(() => assertCreatorOwner(creatorA, recordA));
  assert.throws(() => assertCreatorOwner(creatorB, recordA), { code: 'FORBIDDEN' });
});

test('V3 creator document projection never returns storage capabilities', async () => {
  const row = { object_key: 'applications/private/secret', upload_session_hash: 'secret', etag: 'secret', file_name: 'id.pdf' };
  const result = publicDocument(row);
  assert.deepEqual(result, { file_name: 'id.pdf' });
});

test('application lifecycle exposes explicit safe transitions', () => {
  assert.equal(applicationReviewStates.has('needs_information'), true);
  assert.equal(applicationReviewStates.has('withdrawn'), true);
  assert.equal(applicationTransitions.submitted.has('approved'), false);
  assert.equal(applicationTransitions.under_review.has('approved'), true);
  assert.equal(applicationTransitions.withdrawn.size, 0);
});

test('creator document upload remains unavailable rather than exposing storage internals', async () => {
  const service = new V3CreatorService({ query: async () => ({ rows: [], rowCount: 0 }) });
  await assert.rejects(() => service.issueDocumentUpload('creator-a', { name: 'id.pdf', content_type: 'application/pdf', byte_size: 100 }, { id: 'user-a', role: 'performer' }), { code: 'CREATOR_NOT_FOUND' });
});

test('creator profile input accepts only structured private fields', () => {
  assert.equal(publicDocument({ file_name: 'id.pdf', storage_reference: 'secret' }).storage_reference, undefined);
});

test('creator actions project open notifications and preserve state fields', async () => {
  const statements = [];
  const db = { query: async (sql) => {
    statements.push(sql);
    if (sql.includes('FROM v3_creator_records')) return { rowCount: 1, rows: [{ id: 'creator-a', application_id: 'application-a', user_id: 'user-a', lifecycle: 'active', private_profile: {}, full_name: 'Ada', country: 'DE', application_status: 'approved' }] };
    if (sql.includes('v3_creator_notifications')) return { rowCount: 2, rows: [
      { id: 'open', kind: 'document_review', title: 'Review document', body: 'Review', action_path: '/v3/creator/documents', action_state: 'open', completed_at: null },
      { id: 'done', kind: 'profile', title: 'Profile complete', body: 'Done', action_path: null, action_state: 'completed', completed_at: new Date().toISOString() }
    ] };
    return { rowCount: 0, rows: [] };
  } };
  const result = await new V3CreatorService(db).creator('creator-a', { actor: { id: 'user-a', role: 'performer' }, self: true });
  assert.deepEqual(result.actions.map(item => item.id), ['open']);
  assert.match(statements.find(sql => sql.includes('v3_creator_notifications')), /action_state/);
});
