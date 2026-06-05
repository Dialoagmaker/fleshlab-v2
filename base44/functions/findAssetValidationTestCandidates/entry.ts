/**
 * findAssetValidationTestCandidates - Read-Only Test Candidate Discovery (Memory-Optimized)
 * 
 * Scans Video entities to find candidates for Phase 2B validation testing.
 * Returns structured results for four candidate types with detailed validation data.
 * 
 * CRITICAL: This function is READ-ONLY. No data modifications.
 * Optimized to avoid memory limits by processing videos in batches.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user (admin-only)
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        ok: false, 
        error: 'Unauthorized',
        step: 'auth'
      }, { status: 403 });
    }

    const { limit = 50 } = await req.json();
    console.log(`🔍 Scanning up to ${limit} videos for test candidates...`);

    // Load videos in batches to avoid memory limits
    const allVideos = [];
    const batchSize = 20;
    let skip = 0;
    
    while (skip < limit) {
      const batch = await base44.entities.Video.filter({}, Math.min(batchSize, limit - skip));
      if (!batch || batch.length === 0) break;
      allVideos.push(...batch);
      skip += batchSize;
      console.log(`📊 Loaded ${allVideos.length} videos so far...`);
    }

    console.log(`📊 Total videos loaded: ${allVideos.length}`);

    const candidates = {
      valid_canonical: [],
      legacy_r2: [],
      corrupt_thumbnail: [],
      broken_assets: []
    };

    // Scan each video
    for (const video of allVideos) {
      if (video.is_deleted) continue;

      // Classify URL types
      const sourceType = classifyUrl(video.source_video_url);
      const thumbnailType = classifyUrl(video.primary_thumbnail_url);
      const previewType = classifyUrl(video.trailer_url || video.source_video_url);

      // Check for legacy R2 URLs
      const hasLegacyUrl = [sourceType, thumbnailType, previewType].some(t => 
        t === 'legacy_r2_dev' || t === 'relative_key'
      );

      if (hasLegacyUrl) {
        candidates.legacy_r2.push({
          video_id: video.id,
          title: video.title,
          source_url: video.source_video_url,
          source_type: sourceType,
          thumbnail_url: video.primary_thumbnail_url,
          thumbnail_type: thumbnailType,
          preview_url: video.trailer_url || video.source_video_url,
          preview_type: previewType
        });
      }

      // Quick validation
      const validation = await quickValidateAssets(video);
      
      // Categorize
      const allValid = validation.source.valid && validation.thumbnail.valid && validation.preview.valid;
      const hasCorrupt = validation.thumbnail.corrupt;
      const hasBroken = !validation.source.valid || !validation.thumbnail.valid || !validation.preview.valid;

      if (allValid && sourceType === 'canonical_cdn' && thumbnailType === 'canonical_cdn') {
        candidates.valid_canonical.push({
          video_id: video.id,
          title: video.title,
          validation
        });
      }

      if (hasCorrupt) {
        candidates.corrupt_thumbnail.push({
          video_id: video.id,
          title: video.title,
          thumbnail_url: video.primary_thumbnail_url,
          thumbnail_magic: validation.thumbnail.magicHeader,
          thumbnail_status: validation.thumbnail.status,
          reason: validation.thumbnail.reason
        });
      }

      if (hasBroken && !allValid) {
        candidates.broken_assets.push({
          video_id: video.id,
          title: video.title,
          source_valid: validation.source.valid,
          source_reason: validation.source.reason,
          thumbnail_valid: validation.thumbnail.valid,
          thumbnail_reason: validation.thumbnail.reason,
          preview_valid: validation.preview.valid,
          preview_reason: validation.preview.reason,
          blockingReasons: validation.blockingReasons
        });
      }
    }

    // Build summary with explanations
    const summary = {
      total_videos_scanned: allVideos.length,
      valid_canonical_count: candidates.valid_canonical.length,
      legacy_r2_count: candidates.legacy_r2.length,
      corrupt_thumbnail_count: candidates.corrupt_thumbnail.length,
      broken_assets_count: candidates.broken_assets.length,
      no_valid_canonical: candidates.valid_canonical.length === 0,
      no_legacy_r2: candidates.legacy_r2.length === 0,
      no_corrupt_thumbnail: candidates.corrupt_thumbnail.length === 0,
      explanations: {
        no_valid_canonical_reason: candidates.valid_canonical.length === 0 ? 
          'No fully valid canonical video currently exists - all videos have at least one invalid or missing asset' : null,
        no_corrupt_thumbnail_reason: candidates.corrupt_thumbnail.length === 0 ?
          'No corrupt thumbnail candidate currently exists because corrupt URLs were cleared or regenerated' : null,
        no_legacy_r2_reason: candidates.legacy_r2.length === 0 ? 
          `Possible causes: (1) Scan limit ${limit} may be too low, (2) Legacy URLs may have been migrated, (3) Archived/deleted videos excluded, (4) Legacy URLs stored in different fields` : null
      }
    };

    return Response.json({
      ok: true,
      summary,
      candidates
    });

  } catch (error) {
    console.error('findAssetValidationTestCandidates error:', error);
    return Response.json({
      ok: false,
      step: 'server_error',
      error: error.message || 'Discovery failed'
    }, { status: 500 });
  }
});

/**
 * Quick validation - optimized to avoid memory limits
 */
async function quickValidateAssets(video) {
  const sourceValidation = await validateSourceVideo(video.source_video_url);
  const thumbnailValidation = await validateThumbnailQuick(video.primary_thumbnail_url);
  const previewValidation = await validatePreview(video.trailer_url || video.source_video_url);

  const blockingReasons = [];
  
  if (!sourceValidation.valid) {
    blockingReasons.push(`Source: ${sourceValidation.reason}`);
  }
  if (!thumbnailValidation.valid) {
    blockingReasons.push(`Thumbnail: ${thumbnailValidation.reason}`);
  }
  if (!previewValidation.valid) {
    blockingReasons.push(`Preview: ${previewValidation.reason}`);
  }

  return {
    source: sourceValidation,
    thumbnail: thumbnailValidation,
    preview: previewValidation,
    blockingReasons
  };
}

async function validateSourceVideo(url) {
  const result = { url, urlType: classifyUrl(url), status: null, contentType: null, contentLength: 0, magicHeader: null, valid: false, reason: null };

  if (!url) { result.reason = 'Missing'; return result; }

  try {
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': 'FLESHLAB-Validator/1.0' } });
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    if (result.status !== 200 && result.status !== 206 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    const isVideoType = result.contentType && result.contentType.startsWith('video/');
    if (!isVideoType && result.contentType !== 'application/octet-stream') {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    if (result.contentLength === 0) {
      result.reason = 'Empty file';
      return result;
    }

    // Small range request for magic header
    const rangeResponse = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-64', 'User-Agent': 'FLESHLAB-Validator/1.0' } });
    if (!rangeResponse.ok) {
      result.reason = `Range failed: HTTP ${rangeResponse.status}`;
      return result;
    }

    const arrayBuffer = await rangeResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const magicHeader = Array.from(uint8Array.slice(0, 8)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    result.magicHeader = magicHeader;

    const hasFtyp = new TextDecoder().decode(uint8Array.slice(4, 8)) === 'ftyp';
    if (!hasFtyp && !magicHeader.startsWith('1A 45 DF A3')) {
      result.reason = `Invalid magic: ${magicHeader}`;
      return result;
    }

    result.valid = true;
    return result;
  } catch (error) {
    result.reason = error.message;
    return result;
  }
}

async function validateThumbnailQuick(url) {
  const result = { url, urlType: classifyUrl(url), status: null, contentType: null, contentLength: 0, magicHeader: null, valid: false, corrupt: false, reason: null };

  if (!url) { result.reason = 'Missing'; return result; }

  try {
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': 'FLESHLAB-Validator/1.0' } });
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    if (result.status !== 200) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    if (!result.contentType.startsWith('image/')) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    if (result.contentLength === 0) {
      result.reason = 'Empty file';
      return result;
    }

    // Download only first 4KB for magic header check
    const getResponse = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-4095', 'User-Agent': 'FLESHLAB-Validator/1.0' } });
    if (!getResponse.ok) {
      result.reason = `GET failed: HTTP ${getResponse.status}`;
      return result;
    }

    const arrayBuffer = await getResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const magicHeader = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    result.magicHeader = magicHeader;

    // Check for HTML corruption
    const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 100)).toLowerCase();
    if (firstBytes.includes('<!doctype') || firstBytes.includes('<html') || firstBytes.includes('<?xml') || firstBytes.includes('accessdenied') || firstBytes.includes('error')) {
      result.corrupt = true;
      result.reason = 'HTML/XML error page (corrupt)';
      return result;
    }

    const isJpeg = magicHeader.startsWith('FF D8');
    const isPng = magicHeader.startsWith('89 50 4E 47');
    const isWebp = magicHeader.startsWith('52 49 46 46') && new TextDecoder().decode(uint8Array.slice(8, 12)) === 'WEBP';
    
    if (!isJpeg && !isPng && !isWebp) {
      result.corrupt = true;
      result.reason = `Invalid magic: ${magicHeader}`;
      return result;
    }

    result.valid = true;
    return result;
  } catch (error) {
    result.reason = error.message;
    return result;
  }
}

async function validatePreview(url) {
  const result = { url, urlType: classifyUrl(url), status: null, contentType: null, contentLength: 0, magicHeader: null, valid: false, reason: null };

  if (!url) { result.reason = 'Missing'; return result; }

  try {
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': 'FLESHLAB-Validator/1.0' } });
    result.status = headResponse.status;
    result.contentType = headResponse.headers.get('content-type');
    result.contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);

    if (result.status !== 200 && result.status !== 206 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    const isVideoType = result.contentType && result.contentType.startsWith('video/');
    if (!isVideoType && result.contentType !== 'application/octet-stream') {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    if (result.contentLength === 0) {
      result.reason = 'Empty file';
      return result;
    }

    result.valid = true;
    return result;
  } catch (error) {
    result.reason = error.message;
    return result;
  }
}

function classifyUrl(url) {
  if (!url || typeof url !== 'string') return 'missing';
  const trimmed = url.trim();
  if (!trimmed) return 'missing';
  if (trimmed.includes('video.fleshlab.online')) return 'canonical_cdn';
  if (/pub-[a-f0-9]+\.r2\.dev/i.test(trimmed)) return 'legacy_r2_dev';
  if (trimmed.startsWith('http')) return 'external';
  return 'relative_key';
}