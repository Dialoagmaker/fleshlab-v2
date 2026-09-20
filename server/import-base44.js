/*
 * Controlled catalogue import. Input is a local, audited Base44 export:
 *   manifest.json, Brand.json, Performer.json, Video.json, VideoPerformer.json
 * Every JSON file is an array of records with Base44's original `id`.
 *
 * This program never calls Base44, never follows media URLs and never accepts
 * credentials. `--dry-run` is the default. Use --execute only against a
 * reviewed snapshot and a database covered by a backup/rollback plan.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

const entityNames = ['Brand', 'Performer', 'Video', 'VideoPerformer'];
const arg = (name) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const dryRun = !process.argv.includes('--execute');

function fail(message) { const error = new Error(message); error.code = 'IMPORT_INVALID'; throw error; }
function asArray(value, name) { if (!Array.isArray(value)) fail(`${name} must be a JSON array.`); return value; }
function text(value, field) { const result = String(value || '').trim(); if (!result) fail(`${field} is required.`); return result; }
function safeSlug(value, field) { const slug = text(value, field); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) fail(`${field} must be a URL-safe slug.`); return slug.toLowerCase(); }
function boolean(value) { return value === true; }

async function readSnapshot(inputDirectory) {
  const manifestPath = path.join(inputDirectory, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (!manifest?.source || !manifest?.exported_at) fail('manifest.json requires source and exported_at.');
  const entities = {};
  for (const name of entityNames) {
    const file = path.join(inputDirectory, `${name}.json`);
    entities[name] = asArray(JSON.parse(await fs.readFile(file, 'utf8')), name);
  }
  const digest = crypto.createHash('sha256').update(JSON.stringify({ manifest, entities })).digest('hex');
  return { manifest, entities, digest };
}

function validate(snapshot) {
  const brands = new Map(); const performers = new Map(); const videos = new Map();
  for (const record of snapshot.entities.Brand) {
    const id = text(record.id, 'Brand.id'); if (brands.has(id)) fail(`Duplicate Brand id ${id}.`);
    brands.set(id, { id, name: text(record.name, 'Brand.name'), slug: safeSlug(record.slug, 'Brand.slug'), record });
  }
  for (const record of snapshot.entities.Performer) {
    const id = text(record.id, 'Performer.id'); if (performers.has(id)) fail(`Duplicate Performer id ${id}.`);
    performers.set(id, { id, display_name: text(record.display_name, 'Performer.display_name'), slug: safeSlug(record.slug, 'Performer.slug'), record });
  }
  for (const record of snapshot.entities.Video) {
    const id = text(record.id, 'Video.id'); if (videos.has(id)) fail(`Duplicate Video id ${id}.`);
    if (record.brand_id && !brands.has(record.brand_id)) fail(`Video ${id} references unknown Brand ${record.brand_id}.`);
    videos.set(id, { id, title: text(record.title, 'Video.title'), slug: safeSlug(record.slug, 'Video.slug'), record });
  }
  for (const record of snapshot.entities.VideoPerformer) {
    if (!videos.has(text(record.video_id, 'VideoPerformer.video_id'))) fail('VideoPerformer references an unknown video.');
    if (!performers.has(text(record.performer_id, 'VideoPerformer.performer_id'))) fail('VideoPerformer references an unknown performer.');
  }
  return { brands, performers, videos };
}

async function upsert(client, snapshot, maps) {
  for (const item of maps.brands.values()) {
    const r = item.record;
    await client.query(`INSERT INTO catalog_brands(legacy_id,name,slug,description,logo_url,cover_image_url,status,source_payload)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(legacy_id) DO UPDATE SET name=EXCLUDED.name,slug=EXCLUDED.slug,description=EXCLUDED.description,logo_url=EXCLUDED.logo_url,cover_image_url=EXCLUDED.cover_image_url,status=EXCLUDED.status,source_payload=EXCLUDED.source_payload,imported_at=now()`,
      [item.id,item.name,item.slug,r.description || null,r.logo_url || null,r.cover_image_url || null,r.status === 'active' ? 'active' : 'inactive',r]);
  }
  for (const item of maps.performers.values()) {
    const r = item.record;
    await client.query(`INSERT INTO catalog_performers(legacy_id,display_name,slug,bio,nationality,profile_image_url,cover_image_url,status,featured,verified,source_payload)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(legacy_id) DO UPDATE SET display_name=EXCLUDED.display_name,slug=EXCLUDED.slug,bio=EXCLUDED.bio,nationality=EXCLUDED.nationality,profile_image_url=EXCLUDED.profile_image_url,cover_image_url=EXCLUDED.cover_image_url,status=EXCLUDED.status,featured=EXCLUDED.featured,verified=EXCLUDED.verified,source_payload=EXCLUDED.source_payload,imported_at=now()`,
      [item.id,item.display_name,item.slug,r.bio || null,r.nationality || null,r.profile_image_url || null,r.cover_image_url || null,['active','inactive','pending'].includes(r.status) ? r.status : 'inactive',boolean(r.featured),boolean(r.verified),r]);
  }
  for (const item of maps.videos.values()) {
    const r = item.record;
    await client.query(`INSERT INTO catalog_videos(legacy_id,title,slug,description,short_summary,brand_legacy_id,status,access_tier,release_date,duration_seconds,thumbnail_url,trailer_url,source_media_url,source_payload)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT(legacy_id) DO UPDATE SET title=EXCLUDED.title,slug=EXCLUDED.slug,description=EXCLUDED.description,short_summary=EXCLUDED.short_summary,brand_legacy_id=EXCLUDED.brand_legacy_id,status=EXCLUDED.status,access_tier=EXCLUDED.access_tier,release_date=EXCLUDED.release_date,duration_seconds=EXCLUDED.duration_seconds,thumbnail_url=EXCLUDED.thumbnail_url,trailer_url=EXCLUDED.trailer_url,source_media_url=EXCLUDED.source_media_url,source_payload=EXCLUDED.source_payload,imported_at=now()`,
      [item.id,item.title,item.slug,r.description || null,r.short_summary || null,r.brand_id || null,['draft','published','unlisted','archived'].includes(r.status) ? r.status : 'draft',['free','fanclub','ppv'].includes(r.access_tier) ? r.access_tier : 'free',r.release_date || null,Number.isInteger(r.duration_seconds) ? r.duration_seconds : null,r.primary_thumbnail_url || r.thumbnail || null,r.trailer_url || r.teaser || null,r.source_video_url || null,r]);
  }
  for (const row of snapshot.entities.VideoPerformer) {
    await client.query(`INSERT INTO catalog_video_performers(video_legacy_id,performer_legacy_id,role_name,display_order,featured,lead_performer) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(video_legacy_id,performer_legacy_id) DO UPDATE SET role_name=EXCLUDED.role_name,display_order=EXCLUDED.display_order,featured=EXCLUDED.featured,lead_performer=EXCLUDED.lead_performer`, [row.video_id,row.performer_id,row.role || null,Number.isInteger(row.order) ? row.order : 0,boolean(row.featured),boolean(row.lead_performer)]);
  }
}

export async function importSnapshot({ inputDirectory, execute = false, databaseUrl = process.env.DATABASE_URL }) {
  if (!inputDirectory) fail('--input=/absolute/export-directory is required.');
  if (!databaseUrl) fail('DATABASE_URL is required.');
  const snapshot = await readSnapshot(inputDirectory); const maps = validate(snapshot);
  const summary = { brands: maps.brands.size, performers: maps.performers.size, videos: maps.videos.size, credits: snapshot.entities.VideoPerformer.length, source_sha256: snapshot.digest, dry_run: !execute };
  if (!execute) return summary;
  const pool = new Pool({ connectionString: databaseUrl }); const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await upsert(client, snapshot, maps);
    await client.query(`INSERT INTO import_runs(source_name,source_sha256,dry_run,summary) VALUES($1,$2,false,$3) ON CONFLICT(source_name,source_sha256) DO UPDATE SET summary=EXCLUDED.summary`, [snapshot.manifest.source,snapshot.digest,summary]);
    await client.query('COMMIT'); return summary;
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); await pool.end(); }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  importSnapshot({ inputDirectory: arg('input'), execute: !dryRun }).then((summary) => console.log(JSON.stringify(summary))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
