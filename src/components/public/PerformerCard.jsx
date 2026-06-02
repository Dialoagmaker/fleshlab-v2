import React from "react";
import { CheckCircle2, MapPin, Film, ArrowRight, Star } from "lucide-react";

export default function PerformerCard({ performer, brands = [], videoCount = 0 }) {
  const age = performer.date_of_birth
    ? Math.floor((new Date() - new Date(performer.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <a href={`/performers/${performer.slug}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-[#111] border border-white/[0.07] hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(180,30,50,0.2)]">

        {/* Portrait image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a]">
          {performer.profile_image_url ? (
            <img
              src={performer.profile_image_url}
              alt={performer.display_name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
              <span className="text-5xl opacity-20">👤</span>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

          {/* Fanclub badge */}
          {performer.fanclub_enabled && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-purple-700/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
              <Star className="w-2.5 h-2.5 fill-current" /> FANCLUB
            </div>
          )}

          {/* Verified badge */}
          {performer.verified && (
            <div className="absolute top-3 right-3 bg-primary/90 p-1.5 rounded-full shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          {/* Name overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-black text-white text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {performer.display_name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-white/50">
              {performer.nationality && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />{performer.nationality}
                </span>
              )}
              {age && age >= 18 && (
                <span className="text-white/40">· {age}y</span>
              )}
            </div>
          </div>
        </div>

        {/* Card footer */}
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Film className="w-3 h-3 text-primary/60" />
            {videoCount > 0
              ? <span><span className="text-white/70 font-semibold">{videoCount}</span> video{videoCount !== 1 ? 's' : ''}</span>
              : <span className="italic">Coming soon</span>
            }
          </div>
          <span className="text-[11px] text-primary/70 group-hover:text-primary transition-colors flex items-center gap-0.5 font-semibold">
            Profile <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </a>
  );
}