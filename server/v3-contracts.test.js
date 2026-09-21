import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contractInstanceStates, contractSigningEnabled, contractTemplateStates, renderPdf } from './v3-contracts.js';

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
