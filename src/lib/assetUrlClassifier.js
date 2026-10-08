/**
 * Asset URL Classification Helper
 * 
 * Classifies asset URLs into categories for proper handling and migration tracking.
 * 
 * @param {string} url - The asset URL to classify
 * @returns {{ type: string, isLegacy: boolean, isReachable: boolean, recommendation: string }}
 */
export function classifyAssetUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'invalid', isLegacy: false, isReachable: false, recommendation: 'Add asset URL' };
  }

  const trimmed = url.trim();

  // Check if it's a valid HTTP(S) URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    // It's a relative R2 key
    return {
      type: 'relative_r2_key',
      isLegacy: false,
      isReachable: false,
      recommendation: 'Will be resolved via video.fleshlab.online',
      resolvedUrl: `https://video.fleshlab.online/${trimmed.replace(/^\/+/, '')}`
    };
  }

  // Check for legacy R2.dev URLs
  if (/pub-[a-f0-9]+\.r2\.dev/i.test(trimmed)) {
    return {
      type: 'legacy_r2_dev',
      isLegacy: true,
      isReachable: true, // Assume reachable if it's a legacy URL (will be validated separately)
      recommendation: 'Working but should be migrated to canonical CDN later',
      resolvedUrl: trimmed
    };
  }

  // Check for canonical CDN URLs
  if (trimmed.startsWith('https://video.fleshlab.online/')) {
    return {
      type: 'canonical_cdn',
      isLegacy: false,
      isReachable: true,
      recommendation: 'Optimal - using canonical CDN',
      resolvedUrl: trimmed
    };
  }

  // Other external URLs (third-party, etc.)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return {
      type: 'external',
      isLegacy: false,
      isReachable: true,
      recommendation: 'External URL - verify CORS and longevity',
      resolvedUrl: trimmed
    };
  }

  return {
    type: 'invalid',
    isLegacy: false,
    isReachable: false,
    recommendation: 'Invalid or unsupported URL format'
  };
}

/**
 * Build asset URL from value (URL or R2 key)
 * Preserves legacy R2.dev URLs, builds CDN URL for bare paths
 * 
 * @param {string} value - The asset URL or R2 key
 * @returns {string|null}
 */
export function buildAssetUrl(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  
  // Keep existing HTTPS URLs as-is (including legacy R2.dev)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Build CDN URL for R2 keys (paths without protocol)
  return `https://video.fleshlab.online/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Check if URL is legacy R2.dev URL
 * 
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
export function isLegacyR2Url(url) {
  if (!url) return false;
  return /r2\.dev/i.test(String(url));
}

/**
 * Compute asset health status for a video
 * 
 * @param {Object} video - Video entity
 * @param {Object} urlValidationResults - Results from URL validation (thumbnail, preview, source status)
 * @returns {{ status: string, details: Object, canPublish: boolean, missingItems: string[] }}
 */
export function computeAssetHealth(video, urlValidationResults = {}) {
  const checks = {
    thumbnail: {
      exists: !!video.primary_thumbnail_url,
      reachable: urlValidationResults.thumbnail?.status === 'valid' || urlValidationResults.thumbnail?.accessible,
      isLegacy: isLegacyR2Url(video.primary_thumbnail_url),
      url: video.primary_thumbnail_url
    },
    trailer: {
      exists: !!video.trailer_url,
      reachable: urlValidationResults.trailer?.status === 'valid' || urlValidationResults.trailer?.accessible,
      isLegacy: isLegacyR2Url(video.trailer_url),
      url: video.trailer_url
    },
    source: {
      exists: !!video.source_video_url,
      reachable: urlValidationResults.source?.status === 'valid' || urlValidationResults.source?.accessible,
      isLegacy: isLegacyR2Url(video.source_video_url),
      url: video.source_video_url
    },
    cover: {
      exists: !!video.cover_image_url,
      reachable: urlValidationResults.cover?.status === 'valid' || urlValidationResults.cover?.accessible,
      isLegacy: isLegacyR2Url(video.cover_image_url),
      url: video.cover_image_url
    }
  };

  const hasValidThumbnail = checks.thumbnail.exists && checks.thumbnail.reachable;
  const hasValidPreview = (checks.trailer.exists && checks.trailer.reachable) || (checks.source.exists && checks.source.reachable);
  const hasValidSource = checks.source.exists && checks.source.reachable;

  const missingItems = [];
  if (!hasValidThumbnail) missingItems.push('Thumbnail not accessible');
  if (!hasValidPreview) missingItems.push('Preview/Trailer not accessible');
  if (!hasValidSource) missingItems.push('Source video not accessible');
  if (!video.title?.trim()) missingItems.push('Title missing');
  if (!video.slug?.trim()) missingItems.push('Slug missing');

  // Determine overall health status
  let status;
  if (hasValidThumbnail && hasValidPreview && hasValidSource) {
    const hasLegacy = Object.values(checks).some(c => c.exists && c.isLegacy);
    status = hasLegacy ? 'healthy_legacy' : 'healthy_canonical';
  } else if (missingItems.length === 0 && !hasValidPreview) {
    status = 'incomplete';
  } else if (missingItems.length > 0) {
    status = 'broken';
  } else {
    status = 'missing_source';
  }

  return {
    status,
    details: checks,
    canPublish: hasValidThumbnail && hasValidPreview && video.title?.trim() && video.slug?.trim(),
    missingItems,
    hasLegacyUrls: Object.values(checks).some(c => c.exists && c.isLegacy),
    legacyUrlCount: Object.values(checks).filter(c => c.exists && c.isLegacy).length
  };
}