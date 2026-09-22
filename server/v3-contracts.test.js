import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contractInstanceStates, contractSigningEnabled, contractTemplateStates, renderPdf } from './v3-contracts.js';
import { publishingReadiness, rightsReadiness } from './v3-consent.js';
import { allocatePerformerPool, applyCarryForward, calculateRevenueShare, settlementPolicy } from './v3-compensation.js';

test('contract templates start behind legal review and signing is disabled', () => {
  assert.equal(contractTemplateStates.has('legal_review_required'), true);
  assert.equal(contractInstanceStates.has('legacy_imported'), true);
  assert.equal(contractSigningEnabled, false);
});

test('rendered contract PDF is deterministic for an immutable snapshot', () => {
  const first = renderPdf('FLESHLAB STUDIOS\nContract FL-1\nVersion 1.0');
  const second = renderPdf('FLESHLAB STUDIOS\nContract FL-1\nVersion 1.0');
  assert.equal(first.toString('binary'), second.toString('binary'));
  assert.match(first.toString('ascii'), /^%PDF-1\.4/);
});

test('contract center does not expose signing through a feature flag', () => {
  assert.equal(contractSigningEnabled, false);
});

test('contract creation remains a draft operation before legal approval', () => {
  assert.equal(contractInstanceStates.has('signed'), true);
  assert.equal(contractSigningEnabled, false);
});

test('Performer Services Agreement v2 migration contains the complete reviewable section set', () => {
  const migration = fs.readFileSync(new URL('../migrations/0015_performer_services_agreement_v2.sql', import.meta.url), 'utf8');
  for (const heading of Array.from({ length: 30 }, (_, index) => `${index + 1}. `)) assert.equal(migration.includes(heading), true, `missing section ${heading}`);
  assert.match(migration, /SIGNATURE PAGE/);
  assert.match(migration, /DOCUMENT VERIFICATION/);
  assert.match(migration, /LEGAL_REVIEW_REQUIRED/);
  assert.match(migration, /ON CONFLICT\(template_id,version\) DO NOTHING/);
});

test('Content Rights release migration preserves the separate rights instrument and five-year review terms', () => {
  const migration = fs.readFileSync(new URL('../migrations/0016_content_rights_release_v2.sql', import.meta.url), 'utf8');
  assert.match(migration, /template_key='content_rights_release'/);
  assert.match(migration, /five years after termination/);
  assert.match(migration, /30% revenue share/);
  assert.match(migration, /copyright, performer rights, publicity rights and exploitation rights/);
  assert.match(migration, /ON CONFLICT\(template_id,version\) DO NOTHING/);
  assert.match(migration, /LEGAL_REVIEW_REQUIRED/);
});

test('Optional Management Agreement remains separate and authority-limited', () => {
  const migration = fs.readFileSync(new URL('../migrations/0017_optional_management_agreement_v2.sql', import.meta.url), 'utf8');
  assert.match(migration, /template_key='management_optional'/);
  assert.match(migration, /Management Commission: 0%/);
  assert.match(migration, /Sign a new third-party contract without Performer approval: NOT ALLOWED/);
  assert.match(migration, /This Agreement is optional and is never automatically assigned/);
  assert.match(migration, /LEGAL_REVIEW_REQUIRED/);
  assert.match(migration, /ON CONFLICT\(template_id,version\) DO NOTHING/);
});

test('Consent and Production Standards installs an immutable legal-review draft and consent model', () => {
  const migration = fs.readFileSync(new URL('../migrations/0018_consent_production_standards_v2.sql', import.meta.url), 'utf8');
  assert.match(migration, /template_key='consent_standards'/);
  assert.match(migration, /Withdrawal Before Activity/);
  assert.match(migration, /v3_production_consent_records/);
  assert.match(migration, /v3_production_participants/);
  assert.match(migration, /v3_participant_releases/);
  assert.match(migration, /Publishing Restrictions/);
  assert.match(migration, /LEGAL_REVIEW_REQUIRED/);
  assert.match(migration, /ON CONFLICT\(template_id,version\) DO NOTHING/);
});

test('publishing readiness exposes every consent and participant blocker', () => {
  const blocked = publishingReadiness({ consent_status: 'draft', participants: [{ age_verified: false, identity_verified: false, release_status: 'missing' }], primary_performer_verified: false, required_rights_available: false, prohibited_content_flag: true });
  assert.equal(blocked.publishable, false);
  for (const blocker of ['primary_performer_unverified','co_performer_age_unverified','co_performer_identity_missing','participant_release_missing','production_consent_incomplete','prohibited_content_flag','required_rights_missing']) assert.ok(blocked.blockers.includes(blocker));
  assert.equal(publishingReadiness({ consent_status: 'acknowledged', participants: [], primary_performer_verified: true, rights: { rights_status: 'active', commercial_exploitation_allowed: true } }).publishable, true);
  assert.ok(publishingReadiness({ consent_status: 'acknowledged', participants: [], primary_performer_verified: true, rights: { rights_status: 'expired' } }).blockers.includes('rights_expired'));
  assert.ok(rightsReadiness({ rights_status: 'legacy_unknown' }).blockers.includes('legacy_rights_status_unknown'));
  assert.equal(rightsReadiness({ rights_status: 'legacy_unknown' }).ready, false);
});

test('Content Rights readiness migration preserves legacy uncertainty and independent rights state', () => {
  const migration = fs.readFileSync(new URL('../migrations/0019_content_rights_readiness_v3.sql', import.meta.url), 'utf8');
  assert.match(migration, /v3_content_rights_records/);
  assert.match(migration, /legacy_unknown/);
  assert.match(migration, /commercial_exploitation_allowed/);
  assert.match(migration, /five years after termination/);
  assert.match(migration, /ON CONFLICT\(template_id,version\) DO NOTHING/);
  assert.match(migration, /LEGAL_REVIEW_REQUIRED/);
});

test('Compensation Schedule installs an immutable 30/70 plan and auditable ledger schema', () => {
  const migration = fs.readFileSync(new URL('../migrations/0020_compensation_schedule_v2.sql', import.meta.url), 'utf8');
  assert.match(migration, /template_key='compensation_schedule'/);
  assert.match(migration, /'2\.0'/);
  assert.match(migration, /v3_compensation_plans/);
  assert.match(migration, /v3_earnings_ledger/);
  assert.match(migration, /v3_compensation_settlements/);
  assert.match(migration, /30% Performer/);
  assert.match(migration, /LEGAL_REVIEW_REQUIRED/);
  assert.match(migration, /ON CONFLICT\(template_id,version\) DO NOTHING/);
});

test('Compensation engine uses Revenue Share Base without hidden Studio deductions', () => {
  const result = calculateRevenueShare({ eligibleRevenueMinor: 10000, adjustmentsMinor: 0 });
  assert.deepEqual(result, { eligible_revenue_minor: 10000, adjustments_minor: 0, revenue_share_base_minor: 10000, performer_share_percentage: 30, studio_share_percentage: 70, performer_amount_minor: 3000, studio_amount_minor: 7000 });
  assert.deepEqual(allocatePerformerPool(3000, [{ performer_legacy_id: 'a', percentage: 60 }, { performer_legacy_id: 'b', percentage: 40 }]).map(item => item.amount_minor), [1800, 1200]);
  assert.deepEqual(applyCarryForward(4900), { payable_amount_minor: 0, carry_forward_minor: 4900 });
  assert.deepEqual(applyCarryForward(100), { payable_amount_minor: 0, carry_forward_minor: 100 });
  assert.deepEqual(settlementPolicy('live_cam'), { frequency: '14_days', payout_days: [5, 20] });
});
