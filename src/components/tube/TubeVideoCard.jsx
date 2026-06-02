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
      <div className="relative mb-2">
        {/* Thumbnail */}
        <div className="aspect-video relative overflow-hidden rounded bg-[#1a1a1a]">
          {video.primary_thumbnail_url ? (
            <img
              src={video.primary_thumbnail_url}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-900/40 to-[#1a1a1a]" />
          )}
          
          {/* Duration Badge */}
          {video.duration_seconds && (
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {formatDuration(video.duration_seconds)}
            </div>
          )}

          {/* Access Tier Badge */}
          <div className={`absolute top-2 left-2 ${accessBadge.color} text-white text-xs px-2 py-0.5 rounded font-medium`}>
            {accessBadge.label}
          </div>

          {/* Play Overlay (on hover) */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-rose-500 transition-colors">
          {video.title}
        </h3>
        
        {brand && (
          <p className="text-xs text-white/60 line-clamp-1">
            {brand.name}
          </p>
        )}
        
        <div className="flex items-center gap-2 text-xs text-white/50">
          {video.view_count !== undefined && (
            <span>
              {video.view_count >= 1000 
                ? `${(video.view_count / 1000).toFixed(1)}K views`
                : `${video.view_count} views`
              }
            </span>
          )}
          {video.published_at && (
            <span>•</span>
          )}
          {video.published_at && (
            <span>
              {new Date(video.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}