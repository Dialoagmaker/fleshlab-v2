import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, PutObjectCommand, HeadObjectCommand } from 'npm:@aws-sdk/client-s3@3.1057.0';

const R2_PUBLIC_BASE = 'https://video.fleshlab.online';
const STABLE_CDN_PREFIXES = [
  'https://video.fleshlab.online/',
  'https://cdn.fleshlab.online/',
  'https://assets.fleshlab.online/',
];

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
    },
  });
}

function getExtFromContentType(ct) {
  if (!ct) return 'jpg';
  if (ct.includes('png')) return 'png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  return 'jpg';
}

function isStableUrl(url) {
  if (!url) return false;
  return STABLE_CDN_PREFIXES.some(prefix => url.startsWith(prefix));
}

async function fetchImageBuffer(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'FLESHLAB-Migration/1.0' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching source image`);
  const ct = res.headers.get('content-type') || '';
  const buffer = await res.arrayBuffer();
  return { buffer, content_type: ct };
}

async function r2KeyExists(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (e) {
    if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}

async function uploadToR2(s3, bucket, key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: new Uint8Array(buffer),
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
    Metadata: {
      'migration-source': 'base44-performer-profile',
      'migrated-at': new Date().toISOString(),
    },
  }));
}

async function validateCdnUrl(cdnUrl, expectedContentType) {
  try {
    const res = await fetch(cdnUrl, {
      method: 'GET',
      headers: { 'Range': 'bytes=0-511', 'User-Agent': 'FLESHLAB-Migration/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const ok = res.ok || res.status === 206;
    const ct = res.headers.get('content-type') || '';
    const ctMatch = ct.includes('image/') || ct.includes(expectedContentType.split('/')[1] || '');
    return { ok, status: res.status, content_type: ct, ct_match: ctMatch };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dry_run = body.dry_run !== false; // default true
    const overwrite = body.overwrite === true;
    const performer_slug = body.performer_slug || null; // optional: migrate single performer

    const bucket = Deno.env.get('R2_BUCKET_NAME');
    const s3 = dry_run ? null : getS3Client();

    // Fetch all active performers
    const allPerformers = await base44.asServiceRole.entities.Performer.filter(
      { status: 'active' },
      'display_name',
      500
    );

    // Filter to those needing migration
    const toMigrate = allPerformers.filter(p => {
      if (performer_slug && p.slug !== performer_slug) return false;
      const url = p.profile_image_url;
      if (!url) return false; // no image — skip
      if (isStableUrl(url)) return false; // already on CDN — skip
      return true;
    });

    const alreadyStable = allPerformers.filter(p => {
      if (performer_slug && p.slug !== performer_slug) return false;
      return isStableUrl(p.profile_image_url);
    });

    const noImage = allPerformers.filter(p => {
      if (performer_slug && p.slug !== performer_slug) return false;
      return !p.profile_image_url;
    });

    const results = [];

    for (const performer of toMigrate) {
      const result = {
        performer_id: performer.id,
        display_name: performer.display_name,
        slug: performer.slug,
        old_url: performer.profile_image_url,
        r2_key: null,
        new_cdn_url: null,
        upload_status: null,
        db_update_status: null,
        validation_status: null,
        skipped_reason: null,
        error: null,
      };

      try {
        // Step 1: Fetch source image to detect content-type and extension
        let fetchResult;
        if (!dry_run) {
          fetchResult = await fetchImageBuffer(performer.profile_image_url);
        } else {
          // In dry-run: just probe headers, don't load full buffer
          const probeRes = await fetch(performer.profile_image_url, {
            method: 'GET',
            headers: { 'Range': 'bytes=0-511', 'User-Agent': 'FLESHLAB-Migration/1.0' },
            signal: AbortSignal.timeout(8000),
          });
          if (!probeRes.ok && probeRes.status !== 206) {
            throw new Error(`Probe failed: HTTP ${probeRes.status}`);
          }
          const ct = probeRes.headers.get('content-type') || 'image/jpeg';
          fetchResult = { buffer: null, content_type: ct };
        }

        const ext = getExtFromContentType(fetchResult.content_type);
        const r2Key = `performers/${performer.slug}/profile.${ext}`;
        const cdnUrl = `${R2_PUBLIC_BASE}/performers/${performer.slug}/profile.${ext}`;

        result.r2_key = r2Key;
        result.new_cdn_url = cdnUrl;

        if (dry_run) {
          result.upload_status = 'would_upload';
          result.db_update_status = 'would_update';
          result.validation_status = 'skipped_dry_run';
          result.content_type = fetchResult.content_type;
          result.ext = ext;
          results.push(result);
          continue;
        }

        // Step 2: Check if R2 key already exists
        const exists = await r2KeyExists(s3, bucket, r2Key);
        if (exists && !overwrite) {
          result.upload_status = 'skipped_already_exists';
          result.skipped_reason = 'R2 key already exists. Pass overwrite=true to force.';
          // Still update DB if CDN URL is different from current
          if (performer.profile_image_url !== cdnUrl) {
            await base44.asServiceRole.entities.Performer.update(performer.id, {
              profile_image_url: cdnUrl,
            });
            result.db_update_status = 'updated_to_existing_cdn_url';
          } else {
            result.db_update_status = 'already_correct';
          }
          result.validation_status = 'skipped';
          results.push(result);
          continue;
        }

        // Step 3: Upload to R2
        await uploadToR2(s3, bucket, r2Key, fetchResult.buffer, fetchResult.content_type);
        result.upload_status = 'uploaded';

        // Step 4: Validate CDN URL
        const validation = await validateCdnUrl(cdnUrl, fetchResult.content_type);
        if (!validation.ok) {
          result.validation_status = 'failed';
          result.error = `CDN validation failed: HTTP ${validation.status} — ${validation.error || ''}`;
          // Don't update DB if CDN isn't serving the image yet
          result.db_update_status = 'skipped_due_to_validation_failure';
          results.push(result);
          continue;
        }
        result.validation_status = 'ok';
        result.validation_details = {
          status: validation.status,
          content_type: validation.content_type,
        };

        // Step 5: Update DB
        await base44.asServiceRole.entities.Performer.update(performer.id, {
          profile_image_url: cdnUrl,
        });
        result.db_update_status = 'updated';

      } catch (e) {
        result.upload_status = result.upload_status || 'error';
        result.db_update_status = result.db_update_status || 'not_attempted';
        result.validation_status = result.validation_status || 'not_attempted';
        result.error = e.message?.substring(0, 300);
      }

      results.push(result);
    }

    const summary = {
      dry_run,
      overwrite,
      performer_slug_filter: performer_slug,
      total_active_performers: allPerformers.length,
      total_needing_migration: toMigrate.length,
      already_stable_cdn: alreadyStable.length,
      no_image: noImage.length,
      processed: results.length,
      uploaded: results.filter(r => r.upload_status === 'uploaded').length,
      would_upload: results.filter(r => r.upload_status === 'would_upload').length,
      db_updated: results.filter(r => r.db_update_status === 'updated' || r.db_update_status === 'updated_to_existing_cdn_url').length,
      skipped: results.filter(r => r.upload_status?.startsWith('skipped')).length,
      errors: results.filter(r => r.error).length,
      validation_ok: results.filter(r => r.validation_status === 'ok').length,
      validation_failed: results.filter(r => r.validation_status === 'failed').length,
    };

    return Response.json({ summary, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});