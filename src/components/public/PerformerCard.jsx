import React from "react";
import { Link } from "react-router-dom";
import { Verified } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerformerCard({ performer, brands = [] }) {
  const brand = brands.find(b => b.id === performer.brand_id);

  return (
    <Link to={`/performers/${performer.slug}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300">
        {/* Profile Image */}
        <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
          {performer.profile_image_url ? (
            <img
              src={performer.profile_image_url}
              alt={performer.display_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-6xl">👤</span>
            </div>
          )}
          
          {/* Verified badge */}
          {performer.verified && (
            <div className="absolute top-2 right-2 bg-primary text-white p-1.5 rounded-full">
              <Verified className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Name */}
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {performer.display_name}
          </h3>

          {/* Nationality */}
          {performer.nationality && (
            <p className="text-sm text-muted-foreground">
              {performer.nationality}
            </p>
          )}

          {/* Brand */}
          {brand && (
            <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              {brand.name}
            </span>
          )}

          {/* Video count */}
          {performer.video_count !== undefined && performer.video_count > 0 && (
            <p className="text-xs text-muted-foreground">
              {performer.video_count} {performer.video_count === 1 ? 'video' : 'videos'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}