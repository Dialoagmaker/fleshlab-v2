import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { payoutMinorForRuntime } from './v3-submissions.js';

const source = fs.readFileSync(new URL('./v3-submissions.js', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');

test('creator submission payouts use integer cents and the approved three-minute floor', () => {
  assert.equal(payoutMinorForRuntime(180), 300);
  assert.equal(payoutMinorForRuntime(768), 1280);
  assert.equal(payoutMinorForRuntime(1), 2);
});

test('creator submission uploads are authenticated API streams, not browser-accessible Blob URLs', () => {
  assert.match(source, /upload_url:`\/api\/v3\/creator\/submissions\/\$\{submission\.rows\[0\]\.id\}\/upload`/);
  assert.match(source, /async streamVideoUpload\(user, id, request\)/);
  assert.match(source, /expected_byte_size/);
  assert.match(api, /streamVideoUpload/);
  assert.match(api, /auth\.requireRole\(req,\['performer'\]\)/);
});
