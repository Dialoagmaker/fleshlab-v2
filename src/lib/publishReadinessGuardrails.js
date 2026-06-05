/**
 * Publish Readiness Guardrails - Phase 2D P0
 * 
 * Central validation utility for determining if a video is ready to be published publicly.
 * This is the single source of truth for publish readiness checks.
 * 
 * Used by:
 * - Admin save flows
 * - Quick publish toggle
 * - Import/migration
 * - Public filtering
 * - Sitemap generation
 */

// ============================================================================
// REQUIRED FIELDS FOR PUBLIC VISIBILITY
// ============================================================================

/**
 * Check if a video has all required fields for public visibility.
 * Returns { canPublish: boolean, errors: string[], warnings: string[] }
 */
export function checkPublishReadiness(video, options = {}) {
  const { checkAssets = false, videoPerformers = [] } = options;
  
  const errors = [];
  const warnings = [];
  
  // BLOCKING CHECKS - must pass to publish
  if (!video.source_video_url || video.source_video_url.trim() === '') {
    errors.push('Source video URL is missing');
  }
  
  if (!video.primary_thumbnail_url || video.primary_thumbnail_url.trim() === '') {
    errors.push('Primary thumbnail URL is missing');
  }
  
  if (!video.trailer_url || video.trailer_url.trim() === '') {
    // Allow source_video_url as fallback for trailer
    if (!video.source_video_url || video.source_video_url.trim() === '') {
      errors.push('Trailer URL is missing (and no source video URL available as fallback)');
    }
  }
  
  if (!video.title || video.title.trim().length < 3) {
    errors.push('Video title must be at least 3 characters long');
  }
  
  if (!video.access_tier || !['free', 'fanclub', 'ppv'].includes(video.access_tier)) {
    errors.push('Access tier must be set (free, fanclub, or ppv)');
  }
  
  if (!video.duration_seconds || video.duration_seconds <= 0) {
    warnings.push('Video duration not yet set (will be filled automatically after processing)');
  }
  
  // Check performer relations
  if (!videoPerformers || videoPerformers.length === 0) {
    errors.push('At least one performer must be assigned before publishing');
  }
  
  // Processing status check
  if (video.processing_status !== 'draft_ready' && video.processing_status !== 'published') {
    warnings.push(`Processing status is "${video.processing_status}" (expected "draft_ready" for new publishes)`);
  }
  
  // ASSET HEALTH CHECKS (optional - only when checkAssets is true)
  if (checkAssets && videoPerformers.length > 0) {
    // Would check VideoAsset records here if provided
    // For now, we rely on URL presence
  }
  
  // WARNING CHECKS - non-blocking but recommended
  if (!video.description || video.description.trim().length < 50) {
    warnings.push('Description is short (recommended: at least 50 characters)');
  }
  
  if (!video.short_summary || video.short_summary.trim().length < 10) {
    warnings.push('Short summary is missing or very short');
  }
  
  if (!video.categories || video.categories.length === 0) {
    warnings.push('No categories assigned (recommended for discoverability)');
  }
  
  if (!video.tags || video.tags.length === 0) {
    warnings.push('No tags assigned (recommended for search)');
  }
  
  if (!video.release_date) {
    warnings.push('Release date not set (will use creation date)');
  }
  
  if (!video.brand_id) {
    warnings.push('No brand assigned');
  }
  
  return {
    canPublish: errors.length === 0,
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      isReady: errors.length === 0,
    },
  };
}

/**
 * Filter videos by publish readiness - for public queries.
 * Returns only videos that are safe to show publicly.
 * 
 * Note: This is a client-side filter helper.
 * Backend functions should implement equivalent server-side filtering.
 */
export function filterPublicReadyVideos(videos, videoPerformersMap = {}) {
  return videos.filter(video => {
    // Must be published
    if (video.status !== 'published') return false;
    
    // Must have required fields
    if (!video.source_video_url || !video.primary_thumbnail_url) return false;
    if (!video.trailer_url && !video.source_video_url) return false;
    if (!video.duration_seconds || video.duration_seconds <= 0) return false;
    if (!video.access_tier || !['free', 'fanclub', 'ppv'].includes(video.access_tier)) return false;
    if (!video.title || video.title.trim().length < 3) return false;
    
    // Must have at least one performer
    const performers = videoPerformersMap[video.id] || [];
    if (performers.length === 0) return false;
    
    return true;
  });
}

/**
 * Get publish readiness summary for UI display.
 * Returns human-readable status and missing items.
 */
export function getPublishReadinessSummary(video, videoPerformers = []) {
  const { canPublish, errors, warnings } = checkPublishReadiness(video, { videoPerformers });
  
  const missingItems = [];
  
  if (!video.source_video_url) missingItems.push('source video');
  if (!video.primary_thumbnail_url) missingItems.push('thumbnail');
  if (!video.trailer_url) missingItems.push('trailer/preview');
  if (!video.duration_seconds || video.duration_seconds <= 0) missingItems.push('duration');
  if (!video.title || video.title.trim().length < 3) missingItems.push('title');
  if (!video.access_tier) missingItems.push('access tier');
  if (videoPerformers.length === 0) missingItems.push('performer assignment');
  
  return {
    isReady: canPublish,
    status: canPublish ? 'ready' : 'not_ready',
    missingItems,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    label: canPublish ? 'Ready to Publish' : `Missing: ${missingItems.join(', ')}`,
  };
}