import test from 'node:test';
import assert from 'node:assert/strict';
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
