import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function VideoCard({ video, brands = [] }) {
  const brand = brands.find(b => b.id === video.brand_id);
  const mins = video.duration_seconds ? Math.floor(video.duration_seconds / 60) : null;
  const secs = video.duration_seconds ? String(video.duration_seconds % 60).padStart(2, '0') : null;

  return (
    <Link to={`/videos/${video.slug}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
        {/* Thumbnail with hover preview effect */}
        <div className="relative aspect-video bg-secondary overflow-hidden">
          {video.primary_thumbnail_url ? (
            <img
              src={video.primary_thumbnail_url}
              alt={video.title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                video.trailer_url ? "group-hover:scale-110" : "group-hover:scale-105"
              )}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-muted">
              <Play className="w-12 h-12 opacity-50" />
            </div>
          )}
          
          {/* Hover play button overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
            <div className="w-14 h-14 bg-primary/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
              <Play className="w-5 h-5 text-white fill-white ml-1" />
            </div>
          </div>
          
          {/* Duration badge */}
          {mins !== null && (
            <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
              <span>{mins}:{secs}</span>
            </div>
          )}
          
          {/* Featured badge */}
          {video.featured && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
              FEATURED
            </div>
          )}
          
          {/* Exclusive badge */}
          {video.is_exclusive && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
              EXCLUSIVE
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title - explicit and clickable */}
          <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {video.title}
          </h3>

          {/* Short summary */}
          {video.short_summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {video.short_summary}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between gap-2">
            {brand && (
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                {brand.name}
              </span>
            )}
            {video.release_date && (
              <span className="text-xs text-muted-foreground">
                {new Date(video.release_date).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}