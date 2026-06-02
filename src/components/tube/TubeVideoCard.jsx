import { Link } from "react-router-dom";
import { Play } from "lucide-react";

export default function TubeVideoCard({ video, brands = [] }) {
  const brand = brands.find(b => b.id === video.brand_id);
  
  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Access tier badge
  const getAccessBadge = (tier) => {
    switch (tier) {
      case "fanclub":
        return { label: "Fanclub", color: "bg-rose-600" };
      case "ppv":
        return { label: "PPV", color: "bg-yellow-600" };
      case "exclusive":
        return { label: "Exclusive", color: "bg-purple-600" };
      default:
        return { label: "Preview", color: "bg-green-600" };
    }
  };

  const accessBadge = getAccessBadge(video.access_tier);

  return (
    <Link to={`/videos/${video.slug}`} className="group block">
      {/* Thumbnail Container */}
      <div className="relative mb-2 overflow-hidden rounded-lg bg-[#1a1a1a] border border-white/5 group-hover:border-rose-600/50 transition-colors">
        <div className="aspect-video relative">
          {/* Image */}
          {video.primary_thumbnail_url ? (
            <img
              src={video.primary_thumbnail_url}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-900/60 to-[#1a1a1a]" />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          
          {/* Duration Badge - Bottom Right */}
          {video.duration_seconds && (
            <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs font-bold px-1.5 py-0.5 rounded">
              {formatDuration(video.duration_seconds)}
            </div>
          )}

          {/* Access Tier Badge - Top Right */}
          <div className={`absolute top-2 right-2 ${accessBadge.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-lg`}>
            {accessBadge.label}
          </div>

          {/* Play Button Overlay (on hover) */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-xl">
              <Play className="w-7 h-7 text-white fill-current ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="space-y-1.5">
        {/* Title */}
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight group-hover:text-rose-500 transition-colors">
          {video.title}
        </h3>
        
        {/* Brand/Studio */}
        {brand && (
          <p className="text-xs text-white/50 line-clamp-1">
            {brand.name}
          </p>
        )}
        
        {/* Metadata Row */}
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          {video.view_count !== undefined && video.view_count > 0 && (
            <>
              <span>
                {video.view_count >= 1000 
                  ? `${(video.view_count / 1000).toFixed(1)}K`
                  : video.view_count
                }
              </span>
              {video.published_at && <span>•</span>}
            </>
          )}
          {video.published_at && (
            <span>
              {new Date(video.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}