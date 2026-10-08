/**
 * Shared publish safety validation logic
 * Used by both validatePublishSafety.js and publishVideoToWebsite.js
 * 
 * Import as: import { validatePublishSafety } from './utils/publishSafety.js';
 */

export async function validatePublishSafety(video_id, base44) {
  const errors = [];
  const warnings = [];

  // Fetch video
  const video = await base44.entities.Video.get(video_id);
  if (!video) {
    return {
      can_publish: false,
      errors: ['Video not found'],
      warnings: [],
      validation_summary: null,
    };
  }

  // Fetch performer assignments
  const performerAssignments = await base44.entities.VideoPerformer.filter({
    video_id: video_id,
  });
  const performerCount = performerAssignments?.length || 0;

  // === BLOCKING CHECKS ===

  // 1. Source video URL must exist
  if (!video.source_video_url || video.source_video_url.trim() === '') {
    errors.push('Source video URL is missing');
  }

  // 2. Primary thumbnail URL must exist
  if (!video.primary_thumbnail_url || video.primary_thumbnail_url.trim() === '') {
    errors.push('Primary thumbnail URL is missing');
  }

  // 3. Trailer URL must exist
  if (!video.trailer_url || video.trailer_url.trim() === '') {
    errors.push('Trailer URL is missing');
  }

  // 4. Title must exist and have at least 3 characters
  if (!video.title || video.title.trim().length < 3) {
    errors.push('Video title must be at least 3 characters long');
  }

  // 5. Access tier must be set
  if (!video.access_tier || !['free', 'fanclub', 'ppv'].includes(video.access_tier)) {
    errors.push('Access tier must be set (free, fanclub, or ppv)');
  }

  // 6. Status must be "draft"
  if (video.status !== 'draft') {
    errors.push('Video must be in draft status to publish');
  }

  // 7. Processing status must be "draft_ready"
  if (video.processing_status !== 'draft_ready') {
    errors.push('Video processing must be complete before publishing (status must be \'draft_ready\')');
  }

  // 8. At least one performer must be assigned
  if (performerCount === 0) {
    errors.push('At least one performer must be assigned before publishing');
  }

  // === WARNING CHECKS (non-blocking) ===

  // 1. Description too short
  if (!video.description || video.description.length < 50) {
    warnings.push('Video description is shorter than 50 characters');
  }

  // 2. No AI metadata draft
  if (!video.ai_metadata_draft) {
    warnings.push('No AI metadata draft generated');
  }

  // 3. No promo kit generated
  if (!video.promo_kit_generated_at) {
    warnings.push('No promo kit generated yet');
  }

  // 4. Asset health warnings (optional checks)
  const assets = await base44.entities.VideoAsset.filter({ video_id });
  const sourceAsset = assets?.find(a => a.asset_type === 'source');
  const thumbnailAsset = assets?.find(a => a.asset_type === 'thumbnail');
  const previewAsset = assets?.find(a => a.asset_type === 'preview');
  const coverAsset = assets?.find(a => a.asset_type === 'cover');

  if (!sourceAsset || sourceAsset.status !== 'ready') {
    warnings.push('Source asset not marked as ready');
  }
  if (!thumbnailAsset || thumbnailAsset.status !== 'ready') {
    warnings.push('Thumbnail asset not marked as ready');
  }
  if (!previewAsset || previewAsset.status !== 'ready') {
    warnings.push('Preview asset not marked as ready');
  }
  if (!coverAsset || !coverAsset.is_approved_cover) {
    warnings.push('Cover asset not approved');
  }

  const can_publish = errors.length === 0;

  return {
    can_publish,
    errors,
    warnings,
    validation_summary: {
      error_count: errors.length,
      warning_count: warnings.length,
      video_id: video_id,
      video_title: video.title,
      processing_status: video.processing_status,
      status: video.status,
      performer_count: performerCount,
    },
  };
}