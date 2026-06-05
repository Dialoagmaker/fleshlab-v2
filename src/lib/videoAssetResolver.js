/**
 * Video Asset Resolver — Single Source of Truth
 * 
 * Centralized URL resolution and classification for all video assets.
 * Used by: Admin Edit, Admin List, Public Cards, Server Validation
 * 
 * Rules:
 * - Full HTTP/HTTPS URLs returned unchanged
 * - Relative R2 keys resolved to https://video.fleshlab.online/{key}
 * - Legacy R2.dev URLs preserved but marked
 * - Never return blob: or data: URLs
 * - Never double-prefix
 */

const CDN_BASE = 'https://video.fleshlab.online';
const LEGACY_R2_PATTERN = /pub-[a-f0-9]+\.r2\.dev/i;

/**
 * Classify asset URL into categories
 * @param {string} url - URL or R2 key to classify
 * @returns {{ type: 'canonical_cdn' | 'legacy_r2_dev' | 'relative_r2_key' | 'invalid' | 'external', isLegacy: boolean, resolvedUrl: string|null }}
 */
export function classifyAssetUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'invalid', isLegacy: false, resolvedUrl: null };
  }

  const trimmed = url.trim();

  // Reject blob: and data: URLs
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return { type: 'invalid', isLegacy: false, resolvedUrl: null };
  }

  // Full HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Legacy R2.dev
    if (LEGACY_R2_PATTERN.test(trimmed)) {
      return { type: 'legacy_r2_dev', isLegacy: true, resolvedUrl: trimmed };
    }
    // Canonical CDN
    if (trimmed.startsWith(CDN_BASE)) {
      return { type: 'canonical_cdn', isLegacy: false, resolvedUrl: trimmed };
    }
    // External URL
    return { type: 'external', isLegacy: false, resolvedUrl: trimmed };
  }

  // Relative R2 key (no protocol)
  return {
    type: 'relative_r2_key',
    isLegacy: false,
    resolvedUrl: `${CDN_BASE}/${trimmed.replace(/^\/+/, '')}`
  };
}

/**
 * Build public CDN URL from value (URL or R2 key)
 * @param {string} value - URL or R2 key
 * @returns {string|null} - Public URL or null if invalid
 */
export function buildPublicAssetUrl(value) {
  if (!value) return null;
  
  const clean = String(value).trim();
  if (!clean) return null;
  
  // Reject blob: and data:
  if (clean.startsWith('blob:') || clean.startsWith('data:')) {
    console.warn('buildPublicAssetUrl: rejected blob/data URL', clean.substring(0, 50));
    return null;
  }

  // Keep existing HTTPS URLs as-is (including legacy R2.dev)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Build CDN URL for R2 keys
  return `${CDN_BASE}/${clean.replace(/^\/+/, '')}`;
}

/**
 * Get thumbnail URL with fallback chain
 * @param {Object} video - Video entity
 * @returns {string|null} - Thumbnail URL or null
 */
export function getVideoThumbnailUrl(video) {
  if (!video) return null;

  // Priority 1: primary_thumbnail_url
  const primary = buildPublicAssetUrl(video.primary_thumbnail_url);
  if (primary) return primary;

  // Priority 2: thumbnail_url (legacy field)
  const legacy = buildPublicAssetUrl(video.thumbnail_url);
  if (legacy) return legacy;

  // Priority 3: cover_image_url
  const cover = buildPublicAssetUrl(video.cover_image_url);
  if (cover) return cover;

  return null;
}

/**
 * Get preview URL with fallback chain
 * @param {Object} video - Video entity
 * @returns {string|null} - Preview URL or null
 */
export function getVideoPreviewUrl(video) {
  if (!video) return null;

  // Priority 1: trailer_url
  const trailer = buildPublicAssetUrl(video.trailer_url);
  if (trailer) return trailer;

  // Priority 2: preview_gif_url (legacy, but still usable)
  const gif = buildPublicAssetUrl(video.preview_gif_url);
  if (gif) return gif;

  return null;
}

/**
 * Get source URL
 * @param {Object} video - Video entity
 * @returns {string|null} - Source URL or null
 */
export function getVideoSourceUrl(video) {
  if (!video) return null;

  return buildPublicAssetUrl(video.source_video_url);
}

/**
 * Check if URL is legacy R2.dev
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isLegacyR2Url(url) {
  if (!url) return false;
  return LEGACY_R2_PATTERN.test(String(url));
}

/**
 * Check if URL is canonical CDN
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isCanonicalCdnUrl(url) {
  if (!url) return false;
  return String(url).startsWith(CDN_BASE);
}

/**
 * Get asset health status for UI display
 * @param {Object} video - Video entity
 * @param {Object} validation - Optional server validation results
 * @returns {{ status: 'healthy_canonical' | 'healthy_legacy' | 'missing' | 'corrupt' | 'validation_required', details: Object }}
 */
export function getAssetHealthStatus(video, validation = null) {
  const thumbnailUrl = getVideoThumbnailUrl(video);
  const previewUrl = getVideoPreviewUrl(video);
  const sourceUrl = getVideoSourceUrl(video);

  const thumbnailClass = thumbnailUrl ? classifyAssetUrl(thumbnailUrl) : { type: 'invalid' };
  const previewClass = previewUrl ? classifyAssetUrl(previewUrl) : { type: 'invalid' };
  const sourceClass = sourceUrl ? classifyAssetUrl(sourceUrl) : { type: 'invalid' };

  // Check for corrupt validation
  if (validation?.thumbnail?.corrupt) {
    return {
      status: 'corrupt',
      details: {
        thumbnail: validation.thumbnail,
        message: 'Thumbnail corrupt (HTML saved as JPG)'
      }
    };
  }

  // Check for missing assets
  if (!thumbnailUrl || !sourceUrl) {
    return {
      status: 'missing',
      details: {
        missingThumbnail: !thumbnailUrl,
        missingSource: !sourceUrl,
        missingPreview: !previewUrl
      }
    };
  }

  // Check for legacy URLs
  const hasLegacy = thumbnailClass.isLegacy || previewClass?.isLegacy || sourceClass.isLegacy;

  if (hasLegacy) {
    return {
      status: 'healthy_legacy',
      details: {
        thumbnailType: thumbnailClass.type,
        previewType: previewClass?.type,
        sourceType: sourceClass.type
      }
    };
  }

  // All canonical
  return {
    status: 'healthy_canonical',
    details: {
      thumbnailType: thumbnailClass.type,
      previewType: previewClass?.type,
      sourceType: sourceClass.type
    }
  };
}