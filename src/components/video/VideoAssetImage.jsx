import React, { useState } from "react";
import { getVideoThumbnailUrl, classifyAssetUrl } from "@/lib/videoAssetResolver";
import { ImageOff } from "lucide-react";

/**
 * VideoAssetImage — Unified thumbnail component
 * 
 * Rules:
 * - Uses getVideoThumbnailUrl(video) for URL resolution
 * - Renders img directly with onLoad/onError for render state
 * - Does NOT use browser HEAD/fetch (CORS causes false failures)
 * - Does NOT set crossOrigin (blocks R2 URLs)
 * - Shows dark placeholder if missing or fails
 * - Supports canonical CDN and legacy r2.dev URLs
 * 
 * @param {Object} video - Video entity
 * @param {string} alt - Alt text (default: video.title)
 * @param {string} className - Additional CSS classes
 * @param {boolean} showLegacyBadge - Show legacy URL indicator (admin-only)
 * @param {Function} onError - Custom error handler
 * @param {Function} onLoad - Custom load handler
 */
export default function VideoAssetImage({ 
  video, 
  alt, 
  className = "", 
  showLegacyBadge = false,
  onError,
  onLoad 
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const thumbnailUrl = getVideoThumbnailUrl(video);
  const urlClassification = thumbnailUrl ? classifyAssetUrl(thumbnailUrl) : { type: 'invalid' };
  const isLegacy = urlClassification.isLegacy;

  const handleLoad = (e) => {
    setImgLoaded(true);
    setImgError(false);
    if (onLoad) onLoad(e);
    
    if (isLegacy && showLegacyBadge) {
      console.log('🖼️ VideoAssetImage - Legacy URL working:', {
        video_id: video?.id,
        url: thumbnailUrl,
        classification: urlClassification.type
      });
    }
  };

  const handleError = (e) => {
    console.warn('🖼️ VideoAssetImage - Image failed to render:', {
      video_id: video?.id,
      url: thumbnailUrl,
      classification: urlClassification.type,
      is_legacy: isLegacy,
      naturalWidth: e.target.naturalWidth,
      naturalHeight: e.target.naturalHeight
    });
    setImgLoaded(false);
    setImgError(true);
    if (onError) onError(e);
  };

  // No video or no thumbnail URL
  if (!video || !thumbnailUrl) {
    return (
      <div className={`w-full h-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <ImageOff className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/40">No thumbnail</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl}
      alt={alt || video.title || 'Video thumbnail'}
      loading="lazy"
      className={`w-full h-full object-cover ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      // CRITICAL: Do NOT set crossOrigin - blocks R2 URLs
    />
  );
}