/**
 * quickAssetValidation - Lightweight HTTP-only validation
 * 
 * Uses HEAD requests only (no downloads) for fast verification.
 * Designed for post-update checks, not full publish gating.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { video_id } = await req.json();
    
    if (!video_id) {
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Quick HEAD-only validation
    const sourceStatus = await quickHeadCheck(video.source_video_url, 'video');
    const thumbnailStatus = await quickHeadCheck(video.primary_thumbnail_url, 'image');
    const previewStatus = await quickHeadCheck(video.trailer_url, 'video');

    const canPublishAssets = sourceStatus.valid && thumbnailStatus.valid && 
                            (video.trailer_url ? previewStatus.valid : true);

    return Response.json({
      ok: canPublishAssets,
      video_id,
      title: video.title,
      source: sourceStatus,
      thumbnail: thumbnailStatus,
      preview: previewStatus,
      canPublishAssets,
      blockingReasons: canPublishAssets ? [] : [
        !sourceStatus.valid ? `Source: ${sourceStatus.reason}` : null,
        !thumbnailStatus.valid ? `Thumbnail: ${thumbnailStatus.reason}` : null,
        video.trailer_url && !previewStatus.valid ? `Preview: ${previewStatus.reason}` : null,
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('quickAssetValidation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function quickHeadCheck(url, expectedType) {
  const result = {
    url: url || null,
    urlType: classifyUrl(url),
    status: null,
    contentType: null,
    contentLength: 0,
    valid: false,
    reason: null
  };

  if (!url) {
    result.reason = 'Missing';
    return result;
  }

  try {
    const response = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'follow',
      headers: { 'User-Agent': 'FLESHLAB-Validator/1.0' }
    });
    
    result.status = response.status;
    result.contentType = response.headers.get('content-type');
    result.contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    if (result.status !== 200 && result.status !== 206 && result.status !== 304) {
      result.reason = `HTTP ${result.status}`;
      return result;
    }

    if (!result.contentType) {
      result.reason = 'No content-type';
      return result;
    }

    const isValidType = expectedType === 'video' 
      ? (result.contentType.startsWith('video/') || result.contentType.includes('mp4'))
      : result.contentType.startsWith('image/');

    if (!isValidType) {
      result.reason = `Invalid content-type: ${result.contentType}`;
      return result;
    }

    if (result.contentLength === 0) {
      result.reason = 'Empty file (0 bytes)';
      return result;
    }

    result.valid = true;
    return result;

  } catch (error) {
    result.reason = error.message || 'Network error';
    return result;
  }
}

function classifyUrl(url) {
  if (!url) return 'missing';
  if (url.includes('video.fleshlab.online')) return 'canonical_cdn';
  if (/pub-[a-f0-9]+\.r2\.dev/i.test(url)) return 'legacy_r2_dev';
  if (url.startsWith('http')) return 'external';
  return 'relative_key';
}