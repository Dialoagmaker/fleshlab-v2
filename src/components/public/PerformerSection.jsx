import React from "react";
import { Link } from "react-router-dom";
import { Verified, Film, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerformerSection({ performer, videoCount = 0 }) {
  if (!performer) return null;

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6 border border-border">
      <div className="flex items-start gap-4">
        {/* Performer Image */}
        <Link to={`/performers/${performer.slug}`} className="shrink-0">
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg">
            {performer.profile_image_url ? (
              <img
                src={performer.profile_image_url}
                alt={performer.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            )}
          </div>
        </Link>

        {/* Performer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/performers/${performer.slug}`}
              className="text-lg font-bold text-foreground hover:text-primary transition-colors"
            >
              {performer.display_name}
            </Link>
            {performer.verified && (
              <Verified className="w-5 h-5 text-primary fill-current" />
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            {performer.nationality && (
              <span>{performer.nationality}</span>
            )}
            {videoCount > 0 && (
              <span className="flex items-center gap-1">
                <Film className="w-3 h-3" />
                {videoCount} {videoCount === 1 ? 'video' : 'videos'}
              </span>
            )}
          </div>

          <Link
            to={`/performers/${performer.slug}`}
            className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
          >
            View Profile
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}