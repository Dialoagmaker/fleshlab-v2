import React from "react";
import { Link } from "react-router-dom";
import { Verified, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerformerCard({ performer, brands = [] }) {
  const brand = brands.find(b => b.id === performer.brand_id);
  
  // Calculate age from date_of_birth if available
  const age = performer.date_of_birth ? 
    Math.floor((new Date() - new Date(performer.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25)) : null;

  return (
    <Link to={`/performers/${performer.slug}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
        {/* Profile Image */}
        <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
          {performer.profile_image_url ? (
            <img
              src={performer.profile_image_url}
              alt={performer.display_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-muted">
              <span className="text-6xl opacity-50">👤</span>
            </div>
          )}
          
          {/* Verified badge */}
          {performer.verified && (
            <div className="absolute top-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg">
              <Verified className="w-4 h-4" />
            </div>
          )}
          
          {/* Status badge */}
          {performer.status === 'active' && (
            <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded">
              ACTIVE
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Name */}
          <h3 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
            {performer.display_name}
          </h3>

          {/* Details */}
          <div className="space-y-1.5">
            {/* Nationality / Location */}
            {performer.nationality && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{performer.nationality}</span>
              </div>
            )}
            
            {/* Age */}
            {age && age >= 18 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{age} years old</span>
              </div>
            )}
            
            {/* Brand */}
            {brand && (
              <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                {brand.name}
              </span>
            )}
          </div>

          {/* Video count */}
          {performer.video_count !== undefined && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{performer.video_count}</span> videos
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}