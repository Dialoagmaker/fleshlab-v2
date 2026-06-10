/**
 * probeVideoDurations
 *
 * Probes MP4/MOV source video files via byte-range requests to extract
 * duration from the MP4 mvhd box. Handles both fast-start (moov at front)
 * and non-fast-start (moov at end) files.
 *
 * Admin-only endpoint.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const { video_ids, dry_run = true } = await req.json().catch(() => ({}));

  const allVideos = await base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-created_date', 200);
  const targets = allVideos.filter(v => {
    const missing = !v.duration_seconds || v.duration_seconds <= 0;
    if (video_ids && video_ids.length > 0) return missing && video_ids.includes(v.id);
    return missing;
  });

  const results = [];

  for (const video of targets) {
    const url = video.source_video_url;
    if (!url) {
      results.push({ id: video.id, slug: video.slug, title: video.title, status: 'skipped', reason: 'no_source_url' });
      continue;
    }

    const duration = await probeMp4Duration(url);

    if (duration && duration > 10) { // sanity: >10 seconds means it's not a preview artifact
      if (!dry_run) {
        await base44.asServiceRole.entities.Video.update(video.id, { duration_seconds: duration });
      }
      results.push({
        id: video.id,
        slug: video.slug,
        title: video.title,
        status: dry_run ? 'would_update' : 'updated',
        duration_seconds: duration,
      });
    } else {
      results.push({
        id: video.id,
        slug: video.slug,
        title: video.title,
        status: 'no_duration_found',
        reason: duration ? `suspicious_value_${duration}s` : 'could_not_parse_mp4_header',
      });
    }
  }

  return Response.json({
    dry_run,
    total_targets: targets.length,
    results,
    summary: {
      recoverable: results.filter(r => r.status === 'would_update' || r.status === 'updated').length,
      not_recoverable: results.filter(r => r.status === 'skipped' || r.status === 'no_duration_found').length,
    }
  });
});

/**
 * Probe an MP4/MOV file URL to extract duration.
 *
 * Strategy:
 * 1. Fetch first 512 bytes to read top-level box layout (ftyp, free, mdat sizes)
 * 2. Calculate moov offset by summing preceding box sizes
 * 3. If moov not in first 512 bytes, fetch 128KB starting at the calculated offset
 * 4. Parse mvhd from that chunk
 */
async function probeMp4Duration(url) {
  // Step 1: fetch first 512 bytes to determine box layout
  const headChunk = await fetchRange(url, 0, 511);
  if (!headChunk || headChunk.length < 8) return null;

  // Check if moov starts within first 512 bytes (fast-start)
  const fastDuration = parseMvhdDuration(headChunk);
  if (fastDuration) return fastDuration;

  // Step 2: Walk top-level boxes to find moov offset
  let offset = 0;
  let moovOffset = null;
  while (offset + 8 <= headChunk.length) {
    const boxSize = readUint32(headChunk, offset);
    const boxType = String.fromCharCode(headChunk[offset+4], headChunk[offset+5], headChunk[offset+6], headChunk[offset+7]);
    if (boxSize === 0) break; // box extends to EOF
    if (boxType === 'moov') { moovOffset = offset; break; }
    offset += boxSize;
  }

  // If we didn't find moov offset in first 512 bytes, it must be after mdat
  if (moovOffset === null) {
    // The offset we stopped at is where moov should start (after mdat)
    moovOffset = offset;
  }

  // Step 3: Fetch 128KB at moov offset to parse mvhd
  if (moovOffset > 0) {
    const moovChunk = await fetchRange(url, moovOffset, moovOffset + 131071);
    if (moovChunk) {
      const dur = parseMvhdDuration(moovChunk);
      if (dur) return dur;
    }
  }

  return null;
}

async function fetchRange(url, start, end) {
  const res = await fetch(url, { headers: { 'Range': `bytes=${start}-${end}` } }).catch(() => null);
  if (!res || (res.status !== 200 && res.status !== 206)) return null;
  const ab = await res.arrayBuffer().catch(() => null);
  if (!ab || ab.byteLength === 0) return null;
  return new Uint8Array(ab);
}

/**
 * Scan a buffer for 'mvhd' and parse duration.
 */
function parseMvhdDuration(buf) {
  const m = 0x6D, v = 0x76, h = 0x68, d = 0x64;
  for (let i = 0; i < buf.length - 24; i++) {
    if (buf[i] === m && buf[i+1] === v && buf[i+2] === h && buf[i+3] === d) {
      const version = buf[i + 4];
      let timescale, duration;
      if (version === 1) {
        timescale = readUint32(buf, i + 4 + 1 + 3 + 16);
        const hi = readUint32(buf, i + 4 + 1 + 3 + 16 + 4);
        const lo = readUint32(buf, i + 4 + 1 + 3 + 16 + 8);
        duration = hi * 4294967296 + lo;
      } else {
        timescale = readUint32(buf, i + 4 + 1 + 3 + 8);
        duration = readUint32(buf, i + 4 + 1 + 3 + 8 + 4);
      }
      if (timescale > 0 && duration > 0) {
        return Math.round(duration / timescale);
      }
    }
  }
  return null;
}

function readUint32(buf, offset) {
  return ((buf[offset] << 24) | (buf[offset+1] << 16) | (buf[offset+2] << 8) | buf[offset+3]) >>> 0;
}