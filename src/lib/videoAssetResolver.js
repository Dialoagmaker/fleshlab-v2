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
const VIDEO_EXTENSIONS = ['mp4', 'm4v', 'webm', 'mov', 'ogv', 'ogg'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];

function stripSecretQuery(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return String(url).split('?')[0].split('#')[0];
  }
}

function getExtension(value) {
  const clean = stripSecretQuery(value) || '';
  const match = clean.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

function mimeFromExtension(ext) {
  const map = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    ogv: 'video/ogg',
    ogg: 'video/ogg',
    m3u8: 'application/vnd.apple.mpegurl'
  };
  return map[ext] || '';
}

function classifyAccess(url) {
  if (!url) return 'missing';
  if (String(url).startsWith('blob:')) return 'local';
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    const hasSignature = ['signature', 'sig', 'token', 'X-Amz-Signature', 'X-Amz-Credential', 'Expires', 'expires'].some(key => params.has(key));
    const expiryValue = params.get('Expires') || params.get('expires') || params.get('X-Amz-Date');
    if (expiryValue && /^\d+$/.test(expiryValue) && Number(expiryValue) * 1000 < Date.now()) return 'expired';
    if (hasSignature) return 'signed';
    if (/protected|private|token|signed/i.test(parsed.pathname)) return 'protected';
    return 'public';
  } catch {
    return 'unknown';
  }
}

function browserCanPlay(mimeType) {
  if (typeof document === 'undefined' || !mimeType) return '';
  const video = document.createElement('video');
  return video.canPlayType(mimeType) || '';
}

function isVideoCandidate(url) {
  const ext = getExtension(url);
  if (IMAGE_EXTENSIONS.includes(ext)) return false;
  return VIDEO_EXTENSIONS.includes(ext) || !ext;
}

function makeVideoSourceCandidate({ video, rawValue, sourceField, sourceKind, asset = null, basePriority = 50 }) {
  const url = buildPublicAssetUrl(rawValue);
  if (!url || !isVideoCandidate(url)) return null;
  const extension = getExtension(url);
  const mimeType = asset?.mime_type || mimeFromExtension(extension);
  const playability = browserCanPlay(mimeType);
  const mp4Bonus = extension === 'mp4' || extension === 'm4v' ? 30 : 0;
  const webmBonus = extension === 'webm' ? 20 : 0;
  const maybePenalty = !extension ? -8 : 0;
  const unsupportedPenalty = mimeType && playability === '' ? -20 : 0;

  return {
    videoId: video?.id || null,
    title: video?.title || video?.slug || 'Untitled Video',
    url,
    redactedUrl: stripSecretQuery(url),
    selectedSourceField: sourceField,
    sourceField,
    sourceType: sourceKind,
    extension: extension || 'unknown',
    mimeType,
    accessType: classifyAccess(url),
    browserCanPlay: playability || 'unknown',
    assetId: asset?.id || null,
    assetType: asset?.asset_type || null,
    priority: basePriority + mp4Bonus + webmBonus + maybePenalty + unsupportedPenalty,
  };
}

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
export function resolveAnalyzableVideoSource(video, assets = [], options = {}) {
  if (!video) return { status: 'NO_SOURCE', reason: 'No video record supplied', candidates: [] };
  const mode = options.mode || 'analysis';
  const relatedAssets = Array.isArray(assets) ? assets.filter(asset => {
    if (asset.video_id && asset.video_id !== video.id) return false;
    if (mode === 'preview') return ['trailer', 'preview'].includes(asset.asset_type || '');
    return true;
  }) : [];
  const candidates = [];
  const add = (rawValue, sourceField, sourceKind, basePriority, asset = null) => {
    const candidate = makeVideoSourceCandidate({ video, rawValue, sourceField, sourceKind, basePriority, asset });
    if (candidate) candidates.push(candidate);
  };

  if (mode === 'preview') {
    add(video.trailer_url, 'video.trailer_url', 'video_preview_trailer', 95);
    add(video.preview_video_url, 'video.preview_video_url', 'video_preview_mp4', 92);
    add(video.preview_url, 'video.preview_url', 'video_preview_url', 88);
  }

  if (mode !== 'preview') {
    add(video.transcoded_mp4_url, 'video.transcoded_mp4_url', 'transcoded_h264_mp4', 120);
    add(video.playable_url, 'video.playable_url', 'playable_video_url', 116);
    add(video.playback_url, 'video.playback_url', 'playback_video_url', 112);
    add(video.source_video_url, 'video.source_video_url', 'original_source_video', 108);
    add(video.original_video_url, 'video.original_video_url', 'original_video_url', 104);
    add(video.mp4_url, 'video.mp4_url', 'mp4_video_url', 102);
    add(video.storage_url, 'video.storage_url', 'storage_video_url', 96);
    add(video.video_url, 'video.video_url', 'generic_video_url', 92);
  }

  relatedAssets.forEach(asset => {
    const type = asset.asset_type || 'asset';
    if (['thumbnail', 'cover', 'poster', 'keyframe', 'gif', 'cover_candidate'].includes(type)) return;
    const typePriority = type === 'source' ? 114 : type === 'trailer' ? 98 : type === 'preview' ? 94 : 86;
    add(asset.cdn_url, `VideoAsset.${type}.cdn_url`, `video_asset_${type}_cdn_url`, typePriority, asset);
    add(asset.public_url, `VideoAsset.${type}.public_url`, `video_asset_${type}_public_url`, typePriority - 1, asset);
    add(asset.url, `VideoAsset.${type}.url`, `video_asset_${type}_url`, typePriority - 2, asset);
    add(asset.r2_key, `VideoAsset.${type}.r2_key`, `video_asset_${type}_r2_key`, typePriority - 4, asset);
  });

  if (mode !== 'analysis') {
    add(video.trailer_url, 'video.trailer_url', 'video_preview_trailer', 80);
    add(video.preview_video_url, 'video.preview_video_url', 'video_preview_mp4', 78);
    add(video.preview_url, 'video.preview_url', 'video_preview_url', 76);
  }

  const unique = Array.from(new Map(candidates.map(candidate => [candidate.url, candidate])).values());
  unique.sort((a, b) => b.priority - a.priority);
  return unique[0] ? { ...unique[0], status: 'SOURCE_SELECTED', candidates: unique } : { status: 'NO_SOURCE', reason: 'No browser-compatible video source fields found', candidates: unique };
}

export function getVideoPreviewUrl(video) {
  if (!video) return null;
  return resolveAnalyzableVideoSource(video, [], { mode: 'preview' }).url || null;
}

/**
 * Get source URL
 * @param {Object} video - Video entity
 * @returns {string|null} - Source URL or null
 */
export function getVideoSourceUrl(video, assets = []) {
  if (!video) return null;
  return resolveAnalyzableVideoSource(video, assets, { mode: 'analysis' }).url || null;
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