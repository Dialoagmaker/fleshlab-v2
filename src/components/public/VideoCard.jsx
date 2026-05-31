import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VideoCard({ video, brands = [] }) {
  const brand = brands.find(b => b.id === video.brand_id);

  return (
    <Link to={`/videos/${video.slug}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-secondary overflow-hidden">
          {video.primary_thumbnail_url ? (
            <img
              src={video.primary_thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">🎬</span>
            </div>
          )}
          
          {/* Duration badge */}
          {video.duration_seconds && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              <Clock className="w-3 h-3 inline mr-1" />
              {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>

          {/* Short summary */}
          {video.short_summary && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {video.short_summary}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {brand && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                {brand.name}
              </span>
            )}
            {video.release_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(video.release_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short'
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}