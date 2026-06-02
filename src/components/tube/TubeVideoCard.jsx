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

  // Access tier badge - Banner-matching colors
  const getAccessBadge = (tier) => {
    switch (tier) {
      case "fanclub":
        return { label: "Fanclub", color: "bg-gradient-to-r from-rose-600 to-rose-700", shadow: "shadow-rose-600/50" };
      case "ppv":
        return { label: "PPV", color: "bg-gradient-to-r from-yellow-600 to-yellow-700", shadow: "shadow-yellow-600/50" };
      case "exclusive":
        return { label: "Exclusive", color: "bg-gradient-to-r from-purple-600 to-purple-700", shadow: "shadow-purple-600/50" };
      default:
        return { label: "Preview", color: "bg-gradient-to-r from-green-600 to-green-700", shadow: "shadow-green-600/50" };
    }
  };

  const accessBadge = getAccessBadge(video.access_tier);

  return (
    <Link to={`/videos/${video.slug}`} className="group block">
      {/* Thumbnail Container - Darker base, stronger border */}
      <div className="relative mb-2.5 overflow-hidden rounded-xl bg-[#0f0f0f] border border-white/10 group-hover:border-rose-600/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-rose-600/20">
        <div className="aspect-video relative">
          {/* Image */}
          {video.primary_thumbnail_url ? (
            <img
              src={video.primary_thumbnail_url}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-900/60 to-[#0f0f0f]" />
          )}
          
          {/* Gradient Overlay - Stronger contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />
          
          {/* Duration Badge - Bottom Right, Cleaner */}
          {video.duration_seconds && video.duration_seconds > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/95 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/20 shadow-lg">
              {formatDuration(video.duration_seconds)}
            </div>
          )}

          {/* Access Tier Badge - Top Right, Gradient */}
          <div className={`absolute top-2 right-2 ${accessBadge.color} text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-lg ${accessBadge.shadow}`}>
            {accessBadge.label}
          </div>

          {/* Play Button Overlay - Stronger on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-2xl shadow-rose-600/50 border-2 border-white/30">
              <Play className="w-8 h-8 text-white fill-current ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Section - Compact, Stronger Typography */}
      <div className="space-y-1.5">
        {/* Title - Banner-matching hover */}
        <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-rose-500 transition-colors duration-300">
          {video.title}
        </h3>
        
        {/* Brand/Studio */}
        {brand && (
          <p className="text-xs text-white/60 font-medium line-clamp-1">
            {brand.name}
          </p>
        )}
        
        {/* Metadata Row - Only show real data */}
        <div className="flex items-center gap-2 text-xs text-white/50 font-medium">
          {video.view_count && video.view_count > 0 ? (
            <>
              <span className="text-white/60">
                {video.view_count >= 1000 
                  ? `${(video.view_count / 1000).toFixed(1)}K`
                  : video.view_count
                } views
              </span>
              {video.published_at && <span className="text-rose-600/60">•</span>}
            </>
          ) : null}
          {video.published_at && (
            <span className="text-white/60">
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