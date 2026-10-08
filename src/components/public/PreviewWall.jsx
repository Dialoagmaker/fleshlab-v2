import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { isPublicImageUrl, isPublicPreviewUrl } from "@/lib/seoValidation";

/**
 * PreviewWall - Horizontal scroll rail of video thumbnails
 * Shows 8-10 videos with validated trailers
 */
export default function PreviewWall({ videos = [] }) {
  // Take up to 10 videos
  const previewVideos = videos.slice(0, 10);

  if (previewVideos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-[#0F0F0F] border-y border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Preview Wall</h2>
          <p className="text-[#F5F5F5]/60">Scroll the vault</p>
        </div>

        {/* Horizontal scroll container */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
            {previewVideos.map((video, idx) => (
              <PreviewThumbnail
                key={video.id}
                video={video}
                priority={idx < 3}
              />
            ))}
          </div>

          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0F0F0F] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0F0F0F] to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

function PreviewThumbnail({ video, priority = false }) {
  const hasValidThumbnail = isPublicImageUrl(video.primary_thumbnail_url);
  const hasTrailer = isPublicPreviewUrl(video.trailer_url);

  return (
    <Link
      to={`/videos/${video.slug}`}
      className="group relative flex-shrink-0 w-64 sm:w-80 aspect-video rounded-lg overflow-hidden bg-[#0A0A0A] border border-white/[0.05] hover:border-rose-600/30 transition-all"
    >
      {/* Thumbnail */}
      {hasValidThumbnail ? (
        <img
          src={video.primary_thumbnail_url}
          alt={video.title}
          loading={priority ? "eager" : "lazy"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
      )}

      {/* Overlay (hover) */}
      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="text-center px-4">
          <Play className="w-12 h-12 text-rose-500 mx-auto mb-2" fill="currentColor" />
          <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">
            {video.title}
          </h3>
          {video.duration_seconds && (
            <span className="text-xs text-[#F5F5F5]/60 font-mono">
              {formatDuration(video.duration_seconds)}
            </span>
          )}
        </div>
      </div>

      {/* Duration badge (always visible) */}
      {video.duration_seconds && (
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-xs text-white font-mono">
          {formatDuration(video.duration_seconds)}
        </div>
      )}
    </Link>
  );
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}