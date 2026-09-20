import test from 'node:test';
import assert from 'node:assert/strict';
import { isComplete, reviewStatuses, uploadTypes, validateApplication, validateDraft } from './recruiting.js';

test('recruiting requires age and consent rather than accepting a bare email', () => {
  assert.throws(() => validateApplication({ full_name: 'Synthetic Applicant', email: 'test@example.test', country: 'DE' }), { code: 'CONSENT_REQUIRED' });
});
test('recruiting completeness requires a durable confirmed upload', () => {
  const application = { full_name: 'Synthetic Applicant', email: 'test@example.test', country: 'DE', age_confirmed: true, consent_confirmed: true };
  assert.equal(isComplete(application, [{ status: 'issued' }]), false);
  assert.equal(isComplete(application, [{ status: 'confirmed' }]), true);
});

test('a private-upload draft requires age confirmation but not final consent', () => {
  assert.doesNotThrow(() => validateDraft({ full_name: 'Synthetic Applicant', email: 'test@example.test', country: 'DE', age_confirmed: true }));
  assert.throws(() => validateDraft({ full_name: 'Synthetic Applicant', email: 'test@example.test', country: 'DE', age_confirmed: false }), { code: 'AGE_CONFIRMATION_REQUIRED' });
  assert.throws(() => validateApplication({ full_name: 'Synthetic Applicant', email: 'test@example.test', country: 'DE', age_confirmed: true, consent_confirmed: false }), { code: 'CONSENT_REQUIRED' });
});

test('private-upload types are explicitly allowlisted', () => {
  assert.deepEqual(uploadTypes.photo, ['image/jpeg', 'image/png', 'image/webp']);
  assert.equal(uploadTypes.intro_video.includes('video/mp4'), true);
  assert.equal(uploadTypes.id_document_front.includes('application/pdf'), true);
  assert.equal(uploadTypes.photo.includes('application/pdf'), false);
});

test('review status cannot silently approve an application', () => {
  assert.equal(reviewStatuses.has('under_review'), true);
  assert.equal(reviewStatuses.has('rejected'), true);
  assert.equal(reviewStatuses.has('approved'), false);
});
