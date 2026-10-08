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

test('creator submission uploads use the authenticated private stream and ownership-scoped completion', () => {
  assert.match(source, /upload_transport:'authenticated_stream'/);
  assert.match(source, /\/api\/v3\/creator\/submissions\/\$\{submission_id\}\/upload/);
  assert.match(source, /async completeVideoBlockUpload\(user, id, input, request\)/);
  assert.match(source, /commitBlockList/);
  assert.match(source, /async streamVideoUpload\(user, id, request\)/);
  assert.match(source, /expected_byte_size/);
  assert.match(api, /streamVideoUpload/);
  assert.match(api, /completeVideoBlockUpload/);
  assert.match(api, /auth\.requireCreatorSubmissionAccess\(req\)/);
});

test('performer identity and photo uploads initialize private records and use authenticated streams', () => {
  const creators = fs.readFileSync(new URL('./v3-creators.js', import.meta.url), 'utf8');
  const reviewMigration = fs.readFileSync(new URL('../migrations/0040_creator_media_review.sql', import.meta.url), 'utf8');
  const linkageMigration = fs.readFileSync(new URL('../migrations/0041_backfill_creator_submission_media.sql', import.meta.url), 'utf8');
  assert.match(source, /INSERT INTO v3_creator_identity_verifications\(creator_id,status\)/);
  assert.match(creators, /upload_transport: 'authenticated_stream'/);
  assert.match(creators, /async streamCreatorMediaUpload\(user, assetId, request\)/);
  assert.match(creators, /Keep the asset issued until the follow-up confirmation/);
  assert.match(creators, /review_status/);
  assert.match(creators, /publishProfileMedia/);
  assert.match(creators, /performer_legacy_id: current\.performers\[0\]\.performer_legacy_id/);
  assert.match(creators, /Photos must have a JPG, PNG or WEBP extension/);
  assert.match(creators, /VALUES\(\$1,\$2,\$3,\$4,\$5,'pending','private',\$6,\$7,'issued','pending_review'\)/);
  assert.doesNotMatch(creators, /\$8,'issued','pending_review'/);
  assert.match(creators, /v3_creator_submission_assets sa/);
  assert.match(reviewMigration, /v3_media_assets_review_status_check/);
  assert.match(linkageMigration, /UPDATE v3_media_assets a/);
  assert.match(linkageMigration, /s\.creator_id/);
  assert.match(api, /streamCreatorMediaUpload/);
  assert.match(api, /publish-profile/);
});

test('performer upload copy does not promise a non-contract per-minute rate', () => {
  const performer = fs.readFileSync(new URL('../v3/src/performer.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(performer, /\$1 \/ approved minute/);
  assert.match(performer, /Compensation is governed by the applicable contract/);
});

test('admin media review keeps private originals behind short-lived authenticated views', () => {
  const creators = fs.readFileSync(new URL('./v3-creators.js', import.meta.url), 'utf8');
  assert.match(creators, /mediaViewToken/);
  assert.match(creators, /streamAdminMediaRead/);
  assert.match(creators, /CONTRACT_SIGNATURE_REQUIRED/);
  assert.match(api, /streamAdminMediaRead/);
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
