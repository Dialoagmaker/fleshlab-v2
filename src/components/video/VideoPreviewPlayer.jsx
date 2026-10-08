import React, { useRef, useState } from "react";
import { getVideoPreviewUrl } from "@/lib/videoAssetResolver";
import { Play, Loader2 } from "lucide-react";

/**
 * VideoPreviewPlayer — Unified preview video component
 * 
 * Rules:
 * - Uses getVideoPreviewUrl(video) for URL resolution
 * - Muted, playsInline, preload="metadata"
 * - Uses onLoadedMetadata/onCanPlay for render state
 * - Does NOT use browser HEAD/fetch (CORS causes false failures)
 * - Does NOT set crossOrigin (blocks R2 URLs)
 * - Supports canonical CDN and legacy r2.dev URLs
 * - Optional autoPlay on mount
 * 
 * @param {Object} video - Video entity
 * @param {boolean} autoPlay - Auto-play on mount (default: false)
 * @param {boolean} loop - Loop playback (default: true)
 * @param {boolean} showControls - Show video controls (default: false)
 * @param {string} className - Additional CSS classes
 * @param {Function} onLoadedMetadata - Custom metadata loaded handler
 * @param {Function} onError - Custom error handler
 */
export default function VideoPreviewPlayer({
  video,
  autoPlay = false,
  loop = true,
  showControls = false,
  className = "",
  onLoadedMetadata,
  onError
}) {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  const previewUrl = getVideoPreviewUrl(video);

  const handleLoadedMetadata = (e) => {
    console.log('🎬 VideoPreviewPlayer - Metadata loaded:', {
      video_id: video?.id,
      url: previewUrl,
      duration: e.target.duration,
      readyState: e.target.readyState
    });
    setIsLoading(false);
    setCanPlay(true);
    if (onLoadedMetadata) onLoadedMetadata(e);
  };

  const handleCanPlay = (e) => {
    console.log('🎬 VideoPreviewPlayer - Can play:', {
      video_id: video?.id,
      url: previewUrl
    });
    setCanPlay(true);
    setIsLoading(false);
    
    // Auto-play if requested
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn('🎬 VideoPreviewPlayer - Auto-play blocked:', err);
      });
    }
  };

  const handleError = (e) => {
    const videoEl = e.target;
    console.warn('🎬 VideoPreviewPlayer - Video failed to render:', {
      video_id: video?.id,
      url: previewUrl,
      error_code: videoEl.error?.code,
      error_message: videoEl.error?.message,
      networkState: videoEl.networkState,
      readyState: videoEl.readyState
    });
    setIsLoading(false);
    setCanPlay(false);
    setHasError(true);
    if (onError) onError(e);
  };

  // No video or no preview URL
  if (!video || !previewUrl) {
    return null; // Don't render anything if no preview available
  }

  return (
    <>
      <video
        ref={videoRef}
        src={previewUrl}
        muted
        loop={loop}
        playsInline
        preload="metadata"
        controls={showControls}
        className={`w-full h-full object-cover ${className}`}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onError={handleError}
      >
        Your browser does not support the video tag.
      </video>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white opacity-50" />
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center text-destructive text-xs p-4 text-center">
          <div>
            <Play className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Preview failed to load</p>
          </div>
        </div>
      )}
    </>
  );
}