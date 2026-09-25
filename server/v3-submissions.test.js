import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { payoutMinorForRuntime, probeDecision } from './v3-submissions.js';

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
  assert.match(api, /auth\.requireCreatorSubmissionAccess\(req\)/);
});

test('creator upload transport disables proxy buffering and reuses an unfinished matching upload', () => {
  const nginx = fs.readFileSync(new URL('../infra/nginx.conf', import.meta.url), 'utf8');
  assert.match(nginx, /client_max_body_size 20g/);
  assert.match(nginx, /proxy_request_buffering off/);
  assert.match(source, /submission\.video_upload_reused/);
  assert.match(source, /a\.expected_byte_size=\$4/);
});

test('server-side probe accepts exactly 180 seconds and rejects shorter media as a business outcome', () => {
  const video = { codec_type: 'video', codec_name: 'h264', width: 1280, height: 720, avg_frame_rate: '30/1' };
  assert.equal(probeDecision({ format: { duration: '180.9' }, streams: [video] }).status, 'ready');
  assert.equal(probeDecision({ format: { duration: '180' }, streams: [video] }).status, 'ready');
  assert.equal(probeDecision({ format: { duration: '179.99' }, streams: [video] }).code, 'VIDEO_TOO_SHORT');
  assert.equal(probeDecision({ format: { duration: '0' }, streams: [video] }).code, 'INVALID_MEDIA');
});

test('probe hardening uses private SDK download, persisted leases and bounded terminal failures', async () => {
  const migration = fs.readFileSync(new URL('../migrations/0032_creator_submission_probe_hardening.sql', import.meta.url), 'utf8');
  const worker = fs.readFileSync(new URL('./worker.js', import.meta.url), 'utf8');
  assert.match(migration, /v3_creator_submission_processing_jobs/);
  assert.match(migration, /retryable_failure/);
  assert.match(migration, /ON CONFLICT \(submission_id\) DO NOTHING/);
  assert.match(worker, /downloadStream\(objectKey\)/);
  assert.match(worker, /ffprobe', \['-v', 'error'/);
  assert.doesNotMatch(worker, /issueReadUrl\(/);
  assert.match(source, /PROBE_MAX_ATTEMPTS/);
  assert.match(source, /lease_expires_at<now\(\)/);
  assert.match(source, /submission\.processing_retried/);
});
