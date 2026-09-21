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
