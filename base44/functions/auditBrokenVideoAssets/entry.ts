/**
 * auditBrokenVideoAssets - PHASE 2C.3A
 * 
 * Scans all videos and classifies asset health without modifying any data.
 * Returns comprehensive audit report with repair recommendations.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check - admin only
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Parse request
    const { limit = 500, includePublished = true, includeDraft = true } = await req.json().catch(() => ({}));

    console.log('[auditBrokenVideoAssets] Starting audit...', { limit, includePublished, includeDraft });

    // Build query filter
    const statusFilter = [];
    if (includePublished) statusFilter.push('published');
    if (includeDraft) statusFilter.push('draft');
    if (statusFilter.length === 0) {
      return Response.json({ 
        scanned: 0, healthy: 0, broken: 0, results: [], summary: {},
        message: 'No statuses selected' 
      });
    }

    // Fetch videos
    const videos = await base44.entities.Video.filter(
      { status: { $in: statusFilter } },
      'created_date',
      limit
    );

    console.log(`[auditBrokenVideoAssets] Found ${videos.length} videos to audit`);

    const results = [];
    const brokenVideos = [];
    const summary = {
      healthy: 0,
      legacy_healthy: 0,
      canonical_healthy: 0,
      true_broken: 0,
      repairable: 0,
      non_repairable: 0,
      test_dummy_videos: 0,
      thumbnail_only: 0,
      preview_only: 0,
      full_assets: 0,
      source_required_error: 0,
      thumbnail_missing: 0,
      thumbnail_corrupt: 0,
      thumbnail_404: 0,
      preview_missing: 0,
      preview_404: 0,
      preview_invalid: 0,
      source_missing: 0,
      source_404: 0,
      source_invalid: 0,
    };

    // Audit each video
    for (const video of videos) {
      const audit = await auditVideo(video);
      results.push(audit);
      
      // Classify as healthy or broken
      if (audit.overallHealth === 'healthy') {
        summary.healthy++;
        if (audit.legacyUrlDetected) {
          summary.legacy_healthy++;
        } else {
          summary.canonical_healthy++;
        }
      } else {
        summary.true_broken++;
        brokenVideos.push(audit);
        
        // Count by repair mode
        if (audit.recommendedMode === 'thumbnail_only') summary.thumbnail_only++;
        if (audit.recommendedMode === 'preview_only') summary.preview_only++;
        if (audit.recommendedMode === 'full_assets') summary.full_assets++;
        if (audit.recommendedMode === 'source_required_error') {
          summary.source_required_error++;
          summary.non_repairable++;
        }
        
        // Count specific issues
        if (audit.thumbnailHealth === 'thumbnail_corrupt') summary.thumbnail_corrupt++;
        if (audit.thumbnailHealth === 'thumbnail_missing') summary.thumbnail_missing++;
        if (audit.thumbnailHealth === 'thumbnail_404') summary.thumbnail_404++;
        if (audit.previewHealth === 'preview_missing') summary.preview_missing++;
        if (audit.previewHealth === 'preview_404' || audit.previewHealth === 'preview_invalid') summary.preview_invalid++;
        if (audit.sourceHealth === 'source_missing' || audit.sourceHealth === 'source_404' || audit.sourceHealth === 'source_invalid') summary.source_invalid++;
        
        // Detect test/dummy videos
        if (video.title.toLowerCase().includes('test') || video.title.toLowerCase().includes('dummy')) {
          summary.test_dummy_videos++;
        }
      }
      
      // Count repairable (broken but can repair)
      if (audit.overallHealth === 'broken' && audit.canRepair) {
        summary.repairable++;
      }
    }

    console.log('[auditBrokenVideoAssets] Audit complete', {
      scanned: results.length,
      healthy: summary.healthy,
      true_broken: summary.true_broken,
      repairable: summary.repairable,
      non_repairable: summary.non_repairable,
    });

    return Response.json({
      scanned: results.length,
      healthy: summary.healthy,
      true_broken: summary.true_broken,
      repairable: summary.repairable,
      non_repairable: summary.non_repairable,
      summary,
      brokenVideos,
    });

  } catch (error) {
    console.error('[auditBrokenVideoAssets] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function auditVideo(video) {
  const audit = {
    video_id: video.id,
    title: video.title,
    status: video.status,
    sourceHealth: 'unknown',
    thumbnailHealth: 'unknown',
    previewHealth: 'unknown',
    overallHealth: 'unknown',
    canRepair: false,
    recommendedMode: 'no_action',
    blockingReason: null,
    legacyUrlDetected: false,
  };

  // Classify URLs
  const sourceClass = classifyAssetUrl(video.source_video_url);
  const thumbClass = classifyAssetUrl(video.primary_thumbnail_url);
  const previewClass = classifyAssetUrl(video.trailer_url);

  audit.legacyUrlDetected = sourceClass.isLegacy || thumbClass.isLegacy || previewClass.isLegacy;

  // Validate each asset
  const sourceValidation = await validateAssetUrl(video.source_video_url, 'video');
  const thumbValidation = await validateAssetUrl(video.primary_thumbnail_url, 'image');
  const previewValidation = await validateAssetUrl(video.trailer_url, 'video');

  // Determine health status
  audit.sourceHealth = getAssetHealth(sourceValidation, sourceClass, 'source');
  audit.thumbnailHealth = getAssetHealth(thumbValidation, thumbClass, 'thumbnail');
  audit.previewHealth = getAssetHealth(previewValidation, previewClass, 'preview');

  // Determine overall health
  const hasCriticalIssue = (
    audit.sourceHealth.includes('missing') || audit.sourceHealth.includes('invalid') ||
    audit.thumbnailHealth.includes('missing') || audit.thumbnailHealth.includes('corrupt') ||
    audit.previewHealth.includes('missing') || audit.previewHealth.includes('invalid')
  );

  audit.overallHealth = hasCriticalIssue ? 'broken' : 'healthy';

  // Determine repair mode
  const repairAnalysis = analyzeRepairNeeds(audit);
  audit.canRepair = repairAnalysis.canRepair;
  audit.recommendedMode = repairAnalysis.mode;
  audit.blockingReason = repairAnalysis.blockingReason;

  return audit;
}

function classifyAssetUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'missing', isLegacy: false };
  }
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { type: 'relative_r2_key', isLegacy: false };
  }
  if (/pub-[a-f0-9]+\.r2\.dev/i.test(trimmed)) {
    return { type: 'legacy_r2_dev', isLegacy: true };
  }
  if (trimmed.startsWith('https://video.fleshlab.online/')) {
    return { type: 'canonical_cdn', isLegacy: false };
  }
  return { type: 'external', isLegacy: false };
}

async function validateAssetUrl(url, expectedType) {
  if (!url || !url.trim()) {
    return { status: 'missing', ok: false };
  }

  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const httpStatus = response.status;
    const contentType = response.headers.get('content-type') || '';

    if (httpStatus === 404) {
      return { status: '404', ok: false, http_status: httpStatus };
    }

    if (![200, 206, 304].includes(httpStatus)) {
      return { status: 'error', ok: false, http_status: httpStatus };
    }

    // Check for HTML trap (corrupt thumbnail)
    if (expectedType === 'image' && !contentType.startsWith('image/')) {
      const textCheck = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-512' } });
      const text = await textCheck.text();
      if (text.toLowerCase().includes('<!doctype html') || text.toLowerCase().includes('<?xml')) {
        return { status: 'corrupt', ok: false, reason: 'HTML/XML content, not image' };
      }
      return { status: 'invalid_content_type', ok: false, content_type: contentType };
    }

    if (expectedType === 'video' && !contentType.startsWith('video/') && !contentType.includes('mp4')) {
      return { status: 'invalid_content_type', ok: false, content_type: contentType };
    }

    return { status: 'valid', ok: true, http_status: httpStatus, content_type: contentType };

  } catch (error) {
    return { status: 'error', ok: false, reason: error.message };
  }
}

function getAssetHealth(validation, classification, assetType) {
  if (!validation || validation.status === 'missing') return `${assetType}_missing`;
  if (validation.status === '404') return `${assetType}_404`;
  if (validation.status === 'corrupt') return `${assetType}_corrupt`;
  if (!validation.ok) return `${assetType}_invalid`;
  if (classification.isLegacy) return 'legacy_healthy';
  if (classification.type === 'canonical_cdn') return 'canonical_healthy';
  return 'valid';
}

function analyzeRepairNeeds(audit) {
  const { sourceHealth, thumbnailHealth, previewHealth } = audit;

  // Source is critical
  if (sourceHealth.includes('missing') || sourceHealth.includes('invalid') || sourceHealth.includes('404')) {
    return { canRepair: false, mode: 'source_required_error', blockingReason: 'Source video missing/invalid' };
  }

  const needsThumbnail = thumbnailHealth.includes('missing') || thumbnailHealth.includes('corrupt') || thumbnailHealth.includes('404');
  const needsPreview = previewHealth.includes('missing') || previewHealth.includes('invalid') || previewHealth.includes('404');

  if (!needsThumbnail && !needsPreview) {
    return { canRepair: true, mode: 'no_action', blockingReason: null };
  }
  if (needsThumbnail && !needsPreview) {
    return { canRepair: true, mode: 'thumbnail_only', blockingReason: null };
  }
  if (!needsThumbnail && needsPreview) {
    return { canRepair: true, mode: 'preview_only', blockingReason: null };
  }
  if (needsThumbnail && needsPreview) {
    return { canRepair: true, mode: 'full_assets', blockingReason: null };
  }

  return { canRepair: false, mode: 'no_action', blockingReason: 'Unknown' };
}