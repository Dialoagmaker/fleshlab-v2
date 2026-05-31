import React from "react";
import { Link } from "react-router-dom";
import { Verified, MapPin, Film } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Featured Performer Block
 * Shows a performer profile with link to their page
 * Used as fallback when no direct performer match exists
 */
export default function FeaturedPerformerBlock({ performer, videoCount = 0, isFallback = false }) {
  if (!performer) return null;

  return (
    <div className={cn(
      "bg-card rounded-xl p-5 border",
      isFallback ? "border-primary/30 bg-primary/5" : "border-border"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
          {isFallback ? "Featured Performer" : "Performer"}
        </h3>
        {performer.verified && (
          <Verified className="w-4 h-4 text-primary" />
        )}
      </div>
      
      <Link to={`/performers/${performer.slug}`} className="block group">
        {/* Profile Image */}
        <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-secondary">
          {performer.profile_image_url ? (
            <img
              src={performer.profile_image_url}
              alt={performer.display_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl opacity-50">👤</span>
            </div>
          )}
        </div>
        
        {/* Name */}
        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {performer.display_name}
        </p>
        
        {/* Nationality */}
        {performer.nationality && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary" />
            <span>{performer.nationality}</span>
          </div>
        )}
        
        {/* Video Count */}
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <Film className="w-3 h-3 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-bold text-foreground">{videoCount}</span> videos
          </span>
        </div>
        
        {/* View Profile Link */}
        <div className="mt-3 text-xs text-primary font-medium group-hover:underline">
          View Profile →
        </div>
      </Link>
      
      {isFallback && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          Performer data coming soon. Explore other content below.
        </p>
      )}
    </div>
  );
}