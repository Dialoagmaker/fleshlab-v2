/**
 * backfillDurationStep1
 *
 * Safe pre-payment pricing cleanup — Step 1 only.
 *
 * Targets exactly the 9 videos from the reclassification plan that have
 * missing duration_seconds. Extracts duration from R2 source/trailer asset
 * bytes (mvhd atom). Updates ONLY duration_seconds. No access_tier, no
 * is_exclusive, no ppv_enabled, no pricing changes.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { S3Client, GetObjectCommand, HeadObjectCommand } from 'npm:@aws-sdk/client-s3';

// Exact titles from the reclassification plan — matched case-insensitively
const TARGET_TITLES = [
  "Fit Filipino Twink Tortures Nipples With Clamps While Edging",
  "Heartbroken Filipino Twink Takes Raw Rebound Cock From Muscle Lad",
  "Wet Filipino Twink Josh Jerks Thick Hard Cock in Shower",
  "Filipino Twink Kenji Fox Strokes Hard Cock In Shadows",
  "Asian Twink Yero Fingers Tight Pink Filipino Hole Solo",
  "Filipino Twink Yero Jerks Uncut Cock and Eats Massive Load",
  "Smooth Asian Twink Josh Jerks for Huge Messy Cumshot",
  "Young Filipino Twink Jameson Strips and Plays Solo in Bed",
  "Josh Wet Filipino Twink Solo Shower Masturbation and Cumshot",
];

const TARGET_TITLES_LOWER = TARGET_TITLES.map(t => t.toLowerCase());

/**
 * Extract R2 key from a CDN/public URL.
 * Strips protocol + domain, returns the path-only portion.
 */
function urlToR2Key(url) {
  try {
    const u = new URL(url);
    // Path starts with '/' — strip leading slash
    return u.pathname.replace(/^\//, '');
  } catch {
    // Fallback for non-absolute URLs
    return url.replace(/^https?:\/\/[^/]+\//, '');
  }
}

/**
 * Extract duration (seconds) from an MP4/MOV container buffer.
 * Reads the mvhd atom inside moov.
 */
function extractMp4Duration(buffer) {
  try {
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);
    let offset = 0;

    while (offset < buffer.byteLength - 8) {
      const atomSize = view.getUint32(offset);
      const atomType = String.fromCharCode(
        uint8[offset + 4], uint8[offset + 5],
        uint8[offset + 6], uint8[offset + 7]
      );

      if (atomSize <= 0 || atomSize > buffer.byteLength) break;

      if (atomType === 'moov') {
        const moovEnd = offset + atomSize;
        let mo = offset + 8;

        while (mo < moovEnd - 8) {
          const subSize = view.getUint32(mo);
          const subType = String.fromCharCode(
            uint8[mo + 4], uint8[mo + 5],
            uint8[mo + 6], uint8[mo + 7]
          );
          if (subSize <= 0) break;

          if (subType === 'mvhd') {
            const version = uint8[mo + 8];
            if (version === 0) {
              const timescale = view.getUint32(mo + 20);
              const duration  = view.getUint32(mo + 24);
              if (timescale > 0 && duration > 0) return Math.round(duration / timescale);
            } else if (version === 1) {
              const timescale = view.getUint32(mo + 28);
              const duration  = Number(view.getBigUint64(mo + 32));
              if (timescale > 0 && duration > 0) return Math.round(duration / timescale);
            }
          }
          mo += subSize;
        }
      }

      offset += atomSize;
    }
    return null;
  } catch (err) {
    console.error('extractMp4Duration error:', err.message);
    return null;
  }
}

/**
 * Try to extract duration from an R2 object.
 * Downloads first 2MB (covers most mvhd atom positions).
 * Returns { duration_seconds } on success, { error } on failure.
 */
async function extractDurationFromR2(r2Client, bucketName, key) {
  // HEAD check first
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return { error: `File not found in R2: ${key}` };
    }
    return { error: `R2 HEAD failed: ${err.message}` };
  }

  // Fetch first 2MB
  let blob;
  try {
    const resp = await r2Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      Range: 'bytes=0-2097151',
    }));
    blob = await resp.Body.transformToByteArray();
  } catch (err) {
    return { error: `R2 GET failed: ${err.message}` };
  }

  const ab = blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength);
  const dur = extractMp4Duration(ab);

  if (!dur || dur <= 0) {
    return { error: 'mvhd atom not found in first 2MB — file may be fragmented, too large, or unsupported format' };
  }
  return { duration_seconds: dur };
}

/**
 * Format seconds as Xm Ys
 */
function fmtDur(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return sec > 0 ? `${m}m${sec}s` : `${m}m`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true; // Pass { dry_run: true } to preview without writing

    // --- 1. Fetch all published videos and find the 9 targets ---
    const allVideos = await base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-created_date', 500);

    const targets = allVideos.filter(v =>
      TARGET_TITLES_LOWER.includes((v.title || '').toLowerCase())
    );

    const foundTitles = new Set(targets.map(v => v.title.toLowerCase()));
    const notFound = TARGET_TITLES.filter(t => !foundTitles.has(t.toLowerCase()));

    // Separate already-resolved from genuinely missing
    const alreadyHasDuration = targets.filter(v => v.duration_seconds && v.duration_seconds > 0);
    const needsDuration = targets.filter(v => !v.duration_seconds || v.duration_seconds <= 0);

    // --- 2. Init R2 client ---
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
      },
    });
    const bucketName = Deno.env.get('R2_BUCKET_NAME');

    // --- 3. Process each video needing duration ---
    const updated = [];
    const skipped = [];

    for (const video of needsDuration) {
      // Build candidate asset URLs to try: source first, then trailer
      const candidates = [];

      if (video.source_video_url) {
        candidates.push({ label: 'source_video_url', url: video.source_video_url });
      }
      if (video.trailer_url) {
        candidates.push({ label: 'trailer_url', url: video.trailer_url });
      }

      // Also check VideoAsset records for this video
      const assets = await base44.asServiceRole.entities.VideoAsset.filter({ video_id: video.id });
      const sourceAsset = assets.find(a => a.asset_type === 'source' && a.cdn_url && a.status === 'ready');
      const trailerAsset = assets.find(a => a.asset_type === 'trailer' && a.cdn_url && a.status === 'ready');
      if (sourceAsset && !candidates.some(c => c.url === sourceAsset.cdn_url)) {
        candidates.push({ label: 'VideoAsset[source]', url: sourceAsset.cdn_url });
      }
      if (trailerAsset && !candidates.some(c => c.url === trailerAsset.cdn_url)) {
        candidates.push({ label: 'VideoAsset[trailer]', url: trailerAsset.cdn_url });
      }

      if (candidates.length === 0) {
        skipped.push({
          title: video.title,
          slug: video.slug,
          video_id: video.id,
          reason: 'No source_video_url, trailer_url, or ready VideoAsset records found — manual duration entry required',
          admin_url: `/admin/videos/${video.id}`,
        });
        continue;
      }

      // Try each candidate in order
      let extracted = null;
      let triedLabel = null;
      let lastError = null;

      for (const cand of candidates) {
        const key = urlToR2Key(cand.url);
        console.log(`[${video.title}] Trying ${cand.label} → key: ${key}`);
        const result = await extractDurationFromR2(r2Client, bucketName, key);
        if (result.duration_seconds) {
          extracted = result.duration_seconds;
          triedLabel = cand.label;
          break;
        }
        lastError = `${cand.label}: ${result.error}`;
        console.warn(`[${video.title}] ${lastError}`);
      }

      if (!extracted) {
        skipped.push({
          title: video.title,
          slug: video.slug,
          video_id: video.id,
          assets_tried: candidates.map(c => c.label),
          reason: lastError || 'Could not extract duration from any available asset',
          admin_url: `/admin/videos/${video.id}`,
        });
        continue;
      }

      // Write update (unless dry run)
      if (!dryRun) {
        await base44.asServiceRole.entities.Video.update(video.id, {
          duration_seconds: extracted,
        });
      }

      updated.push({
        title: video.title,
        slug: video.slug,
        video_id: video.id,
        asset_used: triedLabel,
        duration_seconds: extracted,
        duration_formatted: fmtDur(extracted),
        dry_run: dryRun,
        admin_url: `/admin/videos/${video.id}`,
      });
    }

    // --- 4. Build report ---
    const remainingManualReview = [
      ...notFound.map(t => ({ title: t, reason: 'Video not found in published library — check status or title spelling' })),
      ...skipped,
    ];

    return Response.json({
      dry_run: dryRun,
      scope: 'duration_seconds only — no access_tier, is_exclusive, ppv_enabled, or pricing changes',

      A_videos_processed: targets.length + notFound.length,
      B_duration_extracted: updated.length,
      C_duration_updated: dryRun ? 0 : updated.length,
      D_videos_skipped: skipped.length + notFound.length + alreadyHasDuration.length,
      E_skip_reasons: {
        not_found_in_library: notFound,
        already_had_duration: alreadyHasDuration.map(v => ({
          title: v.title,
          slug: v.slug,
          existing_duration_seconds: v.duration_seconds,
          duration_formatted: fmtDur(v.duration_seconds),
          note: 'Already populated — no change needed',
        })),
        could_not_extract: skipped,
      },
      F_updated_detail: updated,
      F_remaining_manual_review: remainingManualReview,
      G_final_verdict: remainingManualReview.length === 0
        ? 'All 9 target videos now have verified duration_seconds. Step 1 complete.'
        : `Step 1 partial: ${updated.length} durations extracted and written. ${remainingManualReview.length} video(s) still require manual duration entry in Admin → Videos.`,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});