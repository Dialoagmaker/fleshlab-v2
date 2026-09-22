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
