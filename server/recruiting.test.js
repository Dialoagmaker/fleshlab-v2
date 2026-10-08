import test from 'node:test';
import assert from 'node:assert/strict';
import { isComplete, normalizePublicApplication, publicApplicationReference, RecruitingService, reviewStatuses, uploadTypes, validateApplication, validateDraft } from './recruiting.js';

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

test('public performer application validates the first-contact fields without requiring private uploads', () => {
  const value = normalizePublicApplication({
    full_name: 'Synthetic Applicant', age: 26, country: 'TW', city: 'Taipei', email: 'test@example.test',
    experience_level: 'new', interests: ['own_content'], preferred_contact: 'email',
    age_confirmed: true, adult_work_confirmed: true, privacy_confirmed: true
  });
  assert.equal(value.city, 'Taipei');
  assert.equal(value.age, 26);
  assert.deepEqual(value.attribution, { landing_page: '', utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', referrer: '' });
  assert.throws(() => normalizePublicApplication({ ...value, age: 17 }), { code: 'AGE_REQUIRED' });
  assert.throws(() => normalizePublicApplication({ ...value, preferred_contact: 'whatsapp', whatsapp_number: '' }), { code: 'WHATSAPP_REQUIRED' });
});

test('WhatsApp numbers accept common international formatting and persist in compact E.164 form', () => {
  const value = normalizePublicApplication({
    full_name: 'Synthetic Applicant', age: 26, country: 'PH', city: 'Manila', email: 'test@example.test',
    experience_level: 'new', interests: ['own_content'], preferred_contact: 'whatsapp', whatsapp_number: '+63 962 193 0722',
    age_confirmed: true, adult_work_confirmed: true, privacy_confirmed: true
  });
  assert.equal(value.whatsapp_number, '+639621930722');
});

test('public application attribution is bounded and stored only as application context', () => {
  const value = normalizePublicApplication({
    full_name: 'Synthetic Applicant', age: 26, country: 'TW', city: 'Taipei', email: 'test@example.test', experience_level: 'content', interests: ['own_content'], preferred_contact: 'email', age_confirmed: true, adult_work_confirmed: true, privacy_confirmed: true,
    attribution: { landing_page: '/v3/become-a-creator/new-creators', utm_source: 'search', utm_medium: 'organic', utm_campaign: 'creator-global', referrer: 'https://example.test/path' }
  });
  assert.equal(value.attribution.landing_page, '/v3/become-a-creator/new-creators');
  assert.equal(value.attribution.utm_campaign, 'creator-global');
  assert.equal(value.attribution.referrer, 'https://example.test/path');
});

test('application references are stable presentation identifiers, not access tokens', () => {
  assert.equal(publicApplicationReference('123e4567-e89b-12d3-a456-426614174000'), 'FLA-123E4567E89B');
  assert.notEqual(publicApplicationReference('123e4567-e89b-12d3-a456-426614174000'), '123e4567-e89b-12d3-a456-426614174000');
});

test('public application is saved once and creates a separate WhatsApp notification record', async () => {
  const calls = [];
  const client = {
    query: async (sql, values) => {
      calls.push(sql);
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('SELECT * FROM performer_applications')) return { rowCount: 0, rows: [] };
      if (sql.includes('INSERT INTO performer_applications')) return { rowCount: 1, rows: [{ id: '123e4567-e89b-12d3-a456-426614174000', status: 'submitted', created_at: '2026-09-26T00:00:00Z' }] };
      if (sql.includes('INSERT INTO v3_recruiting_notifications')) return { rowCount: 1, rows: [{ status: 'not_configured' }] };
      return { rowCount: 0, rows: [] };
    },
    release() {}
  };
  const service = new RecruitingService({ connect: async () => client }, {}, { adminOrigin: 'https://admin.fleshlab.online', recruitingWhatsappRecipient: '886958679186' });
  const result = await service.createPublicApplication({ full_name: 'Synthetic Applicant', age: 26, country: 'TW', city: 'Taipei', email: 'test@example.test', experience_level: 'new', interests: ['own_content'], preferred_contact: 'email', age_confirmed: true, adult_work_confirmed: true, privacy_confirmed: true }, 'idempotency-key-123456');
  assert.equal(result.public_reference, 'FLA-123E4567E89B');
  assert.equal(result.notification.status, 'not_configured');
  assert.match(result.contact.whatsapp_url, /wa\.me\/886958679186/);
  assert.equal(calls.includes('BEGIN'), true);
  assert.equal(calls.includes('COMMIT'), true);
});

test('assignable performer accounts are restricted to active, unlinked performer users', async () => {
  let statement = '';
  const service = new RecruitingService({
    query: async (sql) => {
      statement = sql;
      return { rows: [{ id: '00000000-0000-0000-0000-000000000002', email: 'performer@example.test' }] };
    }
  }, {});
  const result = await service.listAssignablePerformerAccounts();
  assert.deepEqual(result.accounts, [{ id: '00000000-0000-0000-0000-000000000002', email: 'performer@example.test' }]);
  assert.match(statement, /u\.role='performer'/);
  assert.match(statement, /u\.account_status='active'/);
  assert.match(statement, /NOT EXISTS/);
});
