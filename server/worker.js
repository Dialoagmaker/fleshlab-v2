import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { loadConfig } from './config.js';
import { createAzureBlob } from './blob.js';
import { V3SubmissionService } from './v3-submissions.js';

const exec = promisify(execFile);
const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl || undefined });
const submissions = new V3SubmissionService(pool, createAzureBlob(config), config);
let busy = false;

async function work() {
  if (busy) return;
  busy = true;
  try {
    const id = await submissions.processOne();
    if (!id) return;
    const asset = await pool.query(`SELECT object_key FROM v3_creator_submission_assets WHERE submission_id=$1 AND asset_type='original_video'`, [id]);
    if (!asset.rowCount) return;
    const signedUrl = await submissions.blob.issueReadUrl(asset.rows[0].object_key, { expiresInSeconds: 900 });
    const result = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate', '-of', 'json', signedUrl], { timeout: 120_000, maxBuffer: 1024 * 1024 });
    await submissions.applyProbe(id, JSON.parse(result.stdout));
    console.log(JSON.stringify({ service: 'fleshlab-worker', job: 'creator_submission_probe', submission_id: id, status: 'complete' }));
  } catch (error) {
    console.error(JSON.stringify({ service: 'fleshlab-worker', job: 'creator_submission_probe', status: 'failed', message: String(error?.message || error).slice(0, 300) }));
  } finally { busy = false; }
}
console.log(JSON.stringify({ service: 'fleshlab-worker', status: 'ready', queues: ['creator_submission_probe'] }));
setInterval(work, 10_000);
work();
