import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { isPublicImageUrl } from "@/lib/seoValidation";

/**
 * StudioDropsRail - Editorial tile grid (3 featured videos)
 * Layout: 2 square tiles + 1 wide tile
 */
export default function StudioDropsRail({ videos = [] }) {
  // Take first 3 videos (or fewer if not available)
  const featuredVideos = videos.slice(0, 3);

  if (featuredVideos.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Studio Drops</h2>
          <p className="text-[#F5F5F5]/60 mb-8">Latest from the archive</p>
          <div className="text-center py-20 bg-[#0F0F0F] rounded-xl border border-white/[0.05]">
            <p className="text-[#F5F5F5]/40">No drops available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Studio Drops</h2>
          <p className="text-[#F5F5F5]/60">Latest from the archive</p>
        </div>

        {/* Desktop: 2+1 layout */}
        <div className="hidden md:grid grid-cols-2 gap-6">
          {/* First two tiles (square) */}
          {featuredVideos.slice(0, 2).map((video, idx) => (
            <EditorialTile
              key={video.id}
              video={video}
              variant="square"
              priority={idx === 0}
            />
          ))}

          {/* Third tile (wide, full-width) */}
          {featuredVideos[2] && (
            <div className="col-span-2">
              <EditorialTile
                video={featuredVideos[2]}
                variant="wide"
                priority={false}
              />
            </div>
          )}
        </div>

        {/* Mobile: Stacked */}
        <div className="md:hidden space-y-6">
          {featuredVideos.map((video, idx) => (
            <EditorialTile
              key={video.id}
              video={video}
              variant={idx === 2 ? "wide" : "square"}
              priority={idx === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorialTile({ video, variant = "square", priority = false }) {
  const hasValidThumbnail = isPublicImageUrl(video.primary_thumbnail_url);

  return (
    <Link
      to={`/videos/${video.slug}`}
      className={`group block relative overflow-hidden rounded-lg bg-[#0F0F0F] border border-white/[0.05] hover:border-rose-600/30 transition-all ${
        variant === "wide" ? "aspect-[21/9]" : "aspect-[3/4]"
      }`}
    >
      {/* Image */}
      {hasValidThumbnail ? (
        <img
          src={video.primary_thumbnail_url}
          alt={video.title}
          loading={priority ? "eager" : "lazy"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-rose-500 transition-colors line-clamp-2">
          {video.title}
        </h3>

        {/* Tags */}
        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {video.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs text-[#F5F5F5]/60 bg-white/[0.05] px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-[#F5F5F5]/60">
          {/* Duration */}
          {video.duration_seconds && (
            <span className="font-mono">
              {formatDuration(video.duration_seconds)}
            </span>
          )}

          {/* Access tier */}
          {video.access_tier && (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                video.access_tier === "free"
                  ? "bg-green-600/90 text-white"
                  : video.access_tier === "fanclub"
                  ? "bg-rose-600/90 text-white"
                  : "bg-amber-600/90 text-white"
              }`}
            >
              {video.access_tier === "free"
                ? "Free"
                : video.access_tier === "fanclub"
                ? "Fanclub"
                : "PPV"}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-2 text-rose-500 font-medium group-hover:text-rose-400 transition-colors">
          <Play className="w-4 h-4" />
          <span>Preview Scene</span>
        </div>
      </div>
    </Link>
  );
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}