import React from "react";
import { Play, Clock, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function VideoCard({ video, brands = [], performers = [] }) {
  const brand = brands.find(b => b.id === video.brand_id);
  const videoPerformers = performers.filter(p => p.id === video.performer_id);
  const performerNames = videoPerformers.map(p => p.display_name).join(", ");
  
  const mins = video.duration_seconds ? Math.floor(video.duration_seconds / 60) : null;
  const secs = video.duration_seconds ? String(video.duration_seconds % 60).padStart(2, '0') : null;

  return (
    <Link to={`/videos/${video.slug}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/15 transition-all duration-300 transform hover:-translate-y-1">
        {/* Thumbnail - Larger, more prominent */}
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
              <Play className="w-16 h-16 opacity-50" />
            </div>
          )}
          
          {/* Hover play overlay - Stronger, more prominent */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary/95 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-2xl">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
          
          {/* Duration badge - Bottom right, tube-style */}
          {mins !== null && (
            <div className="absolute bottom-2 right-2 bg-black/95 text-white text-xs font-bold px-2.5 py-1.5 rounded flex items-center gap-1.5 border border-white/20">
              <Clock className="w-3 h-3" />
              <span>{mins}:{secs}</span>
            </div>
          )}
          
          {/* Featured badge - Top left */}
          {video.featured && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1.5 rounded flex items-center gap-1 shadow-lg">
              <Crown className="w-3 h-3" />
              FEATURED
            </div>
          )}
          
          {/* Exclusive badge - Top right, purple */}
          {video.is_exclusive && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2.5 py-1.5 rounded shadow-lg">
              EXCLUSIVE
            </div>
          )}
          
          {/* Access tier badge - Bottom left */}
          {video.access_tier && video.access_tier !== 'free' && (
            <div className={cn(
              "absolute bottom-2 left-2 text-xs font-bold px-2.5 py-1.5 rounded shadow-lg",
              video.access_tier === 'fanclub' ? 'bg-purple-600 text-white' : 'bg-red-600 text-white'
            )}>
              {video.access_tier.toUpperCase()}
            </div>
          )}
        </div>

        {/* Content - More compact, tube-style */}
        <div className="p-3.5 space-y-2">
          {/* Title - Bold, max 2 lines, explicit */}
          <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {video.title}
          </h3>

          {/* Performer names if available */}
          {performerNames && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {performerNames}
            </p>
          )}

          {/* Meta row - Brand and date */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {brand && (
              <span className="bg-primary/15 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                {brand.name}
              </span>
            )}
            {video.release_date && (
              <span className="text-xs text-muted-foreground shrink-0">
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