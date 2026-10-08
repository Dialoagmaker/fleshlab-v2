import { createWriteStream } from 'node:fs';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { loadConfig } from './config.js';
import { createAzureBlob } from './blob.js';
import { probeDecision, V3SubmissionService } from './v3-submissions.js';

const exec = promisify(execFile);
const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl || undefined });
const submissions = new V3SubmissionService(pool, createAzureBlob(config), config);
let busy = false;

const probeError = (code, message, retryable = false) => Object.assign(new Error(message), { probeCode: code, retryable });

async function localProbeFile(objectKey) {
  const media = await submissions.blob.downloadStream(objectKey);
  if (!media?.stream) throw probeError('STORAGE_ACCESS_FAILED', 'Private media could not be opened.', true);
  const expected = Number(media.contentLength || 0);
  const stats = fs.statfsSync(os.tmpdir());
  const freeBytes = Number(stats.bavail) * Number(stats.bsize);
  if (expected > 0 && freeBytes < expected + 256 * 1024 * 1024) throw probeError('LOCAL_STORAGE_UNAVAILABLE', 'Worker temporary storage is unavailable.', true);
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), 'fleshlab-probe-'));
  const file = path.join(directory, 'submission-media');
  try {
    await pipeline(media.stream, createWriteStream(file, { flags: 'wx', mode: 0o600 }));
    const actual = (await fsp.stat(file)).size;
    if (!actual || (expected > 0 && actual !== expected)) throw probeError('BLOB_INCOMPLETE', 'Private media was incomplete during processing.', true);
    return { directory, file };
  } catch (error) {
    await fsp.rm(directory, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

async function ffprobe(file) {
  try {
    const result = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate', '-of', 'json', file], { timeout: 120_000, maxBuffer: 1024 * 1024 });
    const parsed = JSON.parse(result.stdout || '{}');
    const decision = probeDecision(parsed);
    if (!decision.valid) throw probeError(decision.code, 'The submitted file is not valid video media.');
    return parsed;
  } catch (error) {
    if (error.probeCode) throw error;
    if (error.name === 'SyntaxError' || error.code === 1) throw probeError('INVALID_MEDIA', 'The submitted file is not valid video media.');
    if (error.killed || error.signal === 'SIGTERM') throw probeError('MEDIA_PROBE_FAILED', 'Media verification timed out.', true);
    throw probeError('MEDIA_PROBE_FAILED', 'Media verification could not be completed.', true);
  }
}

function classify(error) {
  if (error?.probeCode) return { code: error.probeCode, message: error.message, retryable: error.retryable === true };
  if (error?.statusCode === 404 || error?.code === 'BlobNotFound') return { code: 'BLOB_NOT_FOUND', message: 'The private submission video was not found.', retryable: false };
  return { code: 'STORAGE_ACCESS_FAILED', message: 'Private submission storage could not be read.', retryable: true };
}

async function work() {
  if (busy) return;
  busy = true;
  let job = null;
  let temporary = null;
  try {
    job = await submissions.processOne();
    if (!job) return;
    const asset = await pool.query(`SELECT object_key FROM v3_creator_submission_assets WHERE submission_id=$1 AND asset_type='original_video' AND status IN ('uploaded','processing','ready')`, [job.submission_id]);
    if (!asset.rowCount) throw probeError('BLOB_NOT_FOUND', 'The private submission video was not found.', false);
    temporary = await localProbeFile(asset.rows[0].object_key);
    const probe = await ffprobe(temporary.file);
    const result = await submissions.applyProbe(job.submission_id, probe);
    await submissions.completeProbe(job);
    console.log(JSON.stringify({ service: 'fleshlab-worker', job: 'creator_submission_probe', submission_id: job.submission_id, attempt: job.attempts, status: 'succeeded', result: result.status, duration_seconds: result.duration }));
  } catch (error) {
    if (job) {
      const failure = classify(error);
      const result = await submissions.failProbe(job, failure.code, failure.message, failure.retryable).catch(() => ({ terminal: false, status: 'failure_recording_failed' }));
      console.error(JSON.stringify({ service: 'fleshlab-worker', job: 'creator_submission_probe', submission_id: job.submission_id, attempt: job.attempts, status: result.terminal ? 'permanent_failure' : 'retryable_failure', error_code: failure.code }));
    } else {
      console.error(JSON.stringify({ service: 'fleshlab-worker', job: 'creator_submission_probe', status: 'claim_failed', error_code: 'JOB_CLAIM_FAILED' }));
    }
  } finally {
    if (temporary?.directory) await fsp.rm(temporary.directory, { recursive: true, force: true }).catch(() => {});
    busy = false;
  }
}

console.log(JSON.stringify({ service: 'fleshlab-worker', status: 'ready', queues: ['creator_submission_probe'], probe_transport: 'azure-sdk-to-local-file' }));
setInterval(work, 10_000);
work();
