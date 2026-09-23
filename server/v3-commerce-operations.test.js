import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('Phase 5C migration is additive, ledger-immutable and execution remains disabled', async () => {
  const sql = await fs.readFile(new URL('../migrations/0028_v3_commerce_operations.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS v3_commerce_plans/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS v3_payout_profiles/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS v3_commerce_reconciliation_records/);
  assert.match(sql, /v3_earnings_ledger_immutable/);
  assert.match(sql, /enabled=false/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/);
  assert.match(sql, /ON CONFLICT\(key,environment\) DO UPDATE SET enabled=false/);
});

test('commerce migration does not synthesize historical rows', async () => {
  const sql = await fs.readFile(new URL('../migrations/0028_v3_commerce_operations.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(sql, /INSERT INTO (v3_commerce_|v3_earnings_|v3_payout_|v3_compensation_settlements)/);
  assert.match(sql, /No historical financial rows are created/);
});
