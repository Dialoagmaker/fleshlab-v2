import React from "react";
import { Link } from "react-router-dom";
import { Film, ArrowRight } from "lucide-react";

/**
 * Studio Videos Mini List
 * Shows 3-4 videos from the same studio/brand
 */
export default function StudioVideosMiniList({ brand, videos, performers }) {
  if (!brand || !videos || videos.length === 0) return null;

  const displayVideos = videos.slice(0, 4);

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-foreground">More from {brand.name}</h3>
        <Link
          to={`/brands/${brand.slug}`}
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {displayVideos.map((video) => (
          <Link
            key={video.id}
            to={`/videos/${video.slug}`}
            className="flex gap-3 group hover:bg-secondary/50 rounded-lg p-2 -mx-2 transition-colors"
          >
            {/* Thumbnail */}
            <div className="w-20 aspect-video rounded-md overflow-hidden bg-secondary shrink-0">
              {video.primary_thumbnail_url ? (
                <img
                  src={video.primary_thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-10"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Film className="w-4 h-4 opacity-50" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {video.title}
              </h4>
              {video.duration_seconds && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}