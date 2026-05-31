import React from "react";
import { Link } from "react-router-dom";
import { Verified, MapPin, Calendar, Film, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerformerCard({ performer, brands = [], videoCount = 0 }) {
  const brand = brands.find(b => b.id === performer.brand_id);
  
  // Calculate age from date_of_birth if available
  const age = performer.date_of_birth ? 
    Math.floor((new Date() - new Date(performer.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25)) : null;

  return (
    <Link to={`/performers/${performer.slug}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/15 transition-all duration-300 transform hover:-translate-y-1">
        {/* Profile Image - Large, prominent */}
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
          
          {/* Verified badge - Top right, prominent */}
          {performer.verified && (
            <div className="absolute top-3 right-3 bg-primary text-white p-2.5 rounded-full shadow-lg">
              <Verified className="w-4 h-4" />
            </div>
          )}
          
          {/* Status badge - Top left */}
          {performer.status === 'active' && (
            <div className="absolute top-3 left-3 bg-green-500/95 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              ACTIVE
            </div>
          )}
          
          {/* Fanclub badge - Bottom left */}
          {performer.fanclub_enabled && (
            <div className="absolute bottom-3 left-3 bg-purple-600/95 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current" />
              FANCLUB
            </div>
          )}
        </div>

        {/* Content - Performer profile style */}
        <div className="p-4 space-y-3">
          {/* Name - Bold, prominent */}
          <h3 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
            {performer.display_name}
          </h3>

          {/* Details - Location, age, role */}
          <div className="space-y-2">
            {/* Nationality / Location */}
            {performer.nationality && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="font-medium">{performer.nationality}</span>
              </div>
            )}
            
            {/* Age */}
            {age && age >= 18 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 text-primary" />
                <span className="font-medium">{age} years old</span>
              </div>
            )}
            
            {/* Brand affiliation */}
            {brand && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="bg-primary/15 text-primary font-semibold px-2.5 py-1 rounded-full">
                  {brand.name}
                </span>
              </div>
            )}
          </div>

          {/* Video count - Use VideoPerformer as source of truth */}
          <div className="pt-3 border-t border-border">
            {videoCount > 0 ? (
              <div className="flex items-center gap-1.5 text-xs">
                <Film className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground">{videoCount}</span> {videoCount === 1 ? 'video' : 'videos'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Videos coming soon
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}