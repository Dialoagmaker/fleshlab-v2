import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contractInstanceStates, contractSigningEnabled, contractTemplateStates, renderPdf, V3ContractService } from './v3-contracts.js';
import { publishingReadiness, rightsReadiness } from './v3-consent.js';
import { allocatePerformerPool, applyCarryForward, calculateRevenueShare, settlementPolicy } from './v3-compensation.js';

test('contract templates start behind legal review and signing is disabled', () => {
  assert.equal(contractTemplateStates.has('legal_review_required'), true);
  assert.equal(contractInstanceStates.has('legacy_imported'), true);
  assert.equal(contractSigningEnabled, false);
});

test('rendered contract PDF embeds the official logo and formats the legal document shell deterministically', () => {
  const details = { contract_number:'FLS-COM-2026-7FCEFD', version:'2.0', creator_legal_name:'Elmer JR Arandela', performer_name:'Elias Santos Jr', effective_date:'2026-09-28', title:'Compensation Schedule' };
  const first = renderPdf('1. PURPOSE\nThe terms remain in this immutable snapshot.\n\nSIGNATURE PAGE', details);
  const second = renderPdf('1. PURPOSE\nThe terms remain in this immutable snapshot.\n\nSIGNATURE PAGE', details);
  assert.equal(first.toString('binary'), second.toString('binary'));
  assert.match(first.toString('ascii'), /^%PDF-1\.4/);
  assert.match(first.toString('latin1'), /1 1 1 rg 0 0 595 842 re f/);
  assert.match(first.toString('latin1'), /\/Subtype \/Image/);
  assert.match(first.toString('latin1'), /28 September 2026/);
  assert.match(first.toString('latin1'), /DRAFT - NOT YET EXECUTED/);
  assert.match(first.toString('latin1'), /CONTRACTING PERFORMER/);
  assert.doesNotMatch(first.toString('latin1'), /GMT\+0000/);
});

test('contract center does not expose signing through a feature flag', () => {
  assert.equal(contractSigningEnabled, false);
});

test('electronic signing requires acknowledgement before any database work', async () => {
  const service = new V3ContractService({ connect: async () => { throw new Error('database must not be reached'); } });
  await assert.rejects(() => service.sign('contract-1', { id: 'user-1' }, { legal_name: 'Elmer JR Arandela' }), error => error.code === 'SIGNATURE_DECLARATIONS_REQUIRED');
});

test('electronic-signature implementation binds canonical identity, performer link, version and hash', () => {
  const source = fs.readFileSync(new URL('./v3-contracts.js', import.meta.url), 'utf8');
  assert.match(source, /JOIN v3_creator_performer_links l ON l\.creator_id=c\.id AND l\.performer_legacy_id=i\.performer_legacy_id/);
  assert.match(source, /canonicalName\(input\.legal_name\)!==canonicalName\(contract\.canonical_legal_name\)/);
  assert.match(source, /input\.contract_version/);
  assert.match(source, /input\.document_hash/);
  assert.match(source, /signature_method/);
  assert.match(source, /FOR UPDATE/);
});

test('signed PDF shows electronic evidence rather than contract placeholders', () => {
  const pdf = renderPdf('1. PURPOSE\nTerms.\n\nSIGNATURE PAGE', { contract_number:'FLS-1', version:'2.0', creator_legal_name:'Elmer JR Arandela', performer_name:'Elias Santos Jr', status:'signed', signature_representation:'Elmer JR Arandela', creator_signed_at:'2026-09-29T12:00:00.000Z', snapshot_hash:'a'.repeat(64) }).toString('latin1');
  assert.match(pdf, /Electronically Signed/);
  assert.match(pdf, /Legal Name:/);
  assert.doesNotMatch(pdf, /\{\{creator_signature\}\}/);
});

test('countersignature migration is additive, preserves existing studio evidence, and introduces only the required execution states', () => {
  const migration = fs.readFileSync(new URL('../migrations/0047_contract_authorized_signatories.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS v3_contract_authorized_signatories/);
  assert.match(migration, /WHERE revoked_at IS NULL/);
  assert.match(migration, /'performer_signed','awaiting_company_signature','fully_executed'/);
  assert.match(migration, /signer_role IN \('creator','studio','company'\)/);
  assert.match(migration, /performer_signed_pdf/);
  assert.match(migration, /final_executed_pdf/);
  assert.doesNotMatch(migration, /DELETE FROM/);
});

test('company countersignature implementation enforces explicit active signatory, performer-first order, immutable hash/version, and idempotency', () => {
  const source = fs.readFileSync(new URL('./v3-contracts.js', import.meta.url), 'utf8');
  assert.match(source, /async countersign\(id,user,input=\{\},request=null\)/);
  assert.match(source, /v3_contract_authorized_signatories/);
  assert.match(source, /s\.revoked_at IS NULL/);
  assert.match(source, /COMPANY_SIGNATORY_REQUIRED/);
  assert.match(source, /PERFORMER_SIGNATURE_REQUIRED/);
  assert.match(source, /input\.contract_version/);
  assert.match(source, /input\.document_hash/);
  assert.match(source, /status='fully_executed'/);
  assert.match(source, /COMPANY_SIGNATURE_ALREADY_RECORDED/);
  assert.match(source, /contract\.company_countersigned/);
});

test('dual-signature executed PDF contains performer and company evidence', () => {
  const pdf = renderPdf('1. PURPOSE\nTerms.\n\nSIGNATURE PAGE', { contract_number:'FLS-2', version:'2.1', creator_legal_name:'Elmer JR Arandela', performer_name:'Elias Santos Jr', status:'fully_executed', signature_representation:'Elmer JR Arandela', creator_signed_at:'2026-09-29T12:00:00.000Z', studio_signature:'Eric Roennau', studio_signer_title:'Chief Executive Officer', studio_signed_at:'2026-09-29T12:15:00.000Z', snapshot_hash:'b'.repeat(64) }).toString('latin1');
  assert.match(pdf, /PERFORMER/);
  assert.match(pdf, /Elmer JR Arandela/);
  assert.match(pdf, /FOR FLESHLAB STUDIOS/);
  assert.match(pdf, /Dialogmakers International Ltd\./);
  assert.match(pdf, /Eric Roennau/);
  assert.match(pdf, /Chief Executive Officer/);
  assert.match(pdf, /EXECUTED/);
});

test('contract creation remains a draft operation before legal approval', () => {
  assert.equal(contractInstanceStates.has('signed'), true);
  assert.equal(contractSigningEnabled, false);
});

test('contract creator administration reads canonical application and profile fields', async () => {
  let statement = '';
  const db = { query: async sql => { statement = sql; return { rowCount: 0, rows: [] }; } };
  await new V3ContractService(db).creators('Ada');
  assert.match(statement, /JOIN performer_applications a ON a\.id=c\.application_id/);
  assert.match(statement, /LEFT JOIN v3_creator_profiles cp ON cp\.creator_id=c\.id/);
  assert.match(statement, /a\.full_name/);
  assert.doesNotMatch(statement, /c\.full_name/);
  assert.doesNotMatch(statement, /c\.country/);
});

test('contract template selector accepts both UUID and template key without a UUID/text operator error', async () => {
  const statements = [];
  const db = { query: async sql => { statements.push(sql); return statements.length === 1 ? { rowCount: 1, rows: [{ id: 'template-id', template_key: 'content_rights_release' }] } : { rowCount: 0, rows: [] }; } };
  await new V3ContractService(db).template('content_rights_release');
  assert.match(statements[0], /id::text=\$1 OR template_key=\$1/);
});

test('contract view audit uses the canonical template id foreign key', async () => {
  const calls = [];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    if (sql.startsWith('SELECT i.*')) return { rowCount: 1, rows: [{ id: 'contract-1', template_id: 'template-1', template_version_id: 'version-1', viewed_at: null, rendered_snapshot: 'draft' }] };
    return { rowCount: 1, rows: [] };
  } };
  await new V3ContractService(db).instance('contract-1', { id: 'admin-1' }, { admin: true });
  const event = calls.find(call => call.sql.includes('INSERT INTO v3_contract_events'));
  assert.equal(event.values[1], 'template-1');
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
