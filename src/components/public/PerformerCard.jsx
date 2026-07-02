import React from "react";
import { CheckCircle2, MapPin, Film, ArrowRight, Star } from "lucide-react";

export default function PerformerCard({ performer, brands = [], videoCount = 0, featured = false }) {
  // date_of_birth is not included in the public API response (PII)
  const age = null;
  const isComingSoon = videoCount === 0;

  // Find performer's primary brand/studio
  const brand = performer.brand_id ? brands.find(b => b.id === performer.brand_id) : null;

  return (
    <a
      href={`/performers/${performer.slug}`}
      onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
      className={`group block ${isComingSoon ? 'cursor-default' : ''}`}
    >
      <div className={`rounded-xl overflow-hidden bg-[#111] border transition-all duration-300 ${isComingSoon ? 'opacity-50 grayscale' : 'hover:-translate-y-1'} ${
        featured 
          ? 'border-white/[0.15] hover:border-primary/50 hover:shadow-[0_16px_50px_rgba(180,30,50,0.3)]' 
          : 'border-white/[0.07] hover:border-primary/40 hover:shadow-[0_12px_40px_rgba(180,30,50,0.2)]'
      }`}>

        {/* Portrait image */}
        <div className={`relative overflow-hidden bg-[#0a0a0a] ${featured ? 'aspect-[3/4]' : 'aspect-[3/4]'}`}>
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

          {/* Stronger gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          {/* Coming Soon overlay - visually distinguishes inactive profiles */}
          {isComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/80 border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                Coming Soon
              </span>
            </div>
          )}

          {/* Fanclub badge - larger for featured */}
          {performer.fanclub_enabled && (
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg ${featured ? 'opacity-100' : 'opacity-95'}`}>
              <Star className="w-2.5 h-2.5 fill-current" /> FANCLUB
            </div>
          )}

          {/* Verified badge - larger for featured */}
          {performer.verified && (
            <div className={`absolute top-3 right-3 bg-gradient-to-br from-rose-500 to-rose-600 p-1.5 rounded-full shadow-lg ${featured ? 'opacity-100' : 'opacity-95'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 text-white ${featured ? 'w-4 h-4' : ''}`} />
            </div>
          )}

          {/* Name overlay at bottom - larger for featured */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 ${featured ? 'p-4' : ''}`}>
            <h3 className={`font-black text-white leading-tight group-hover:text-primary transition-colors line-clamp-1 ${featured ? 'text-lg' : 'text-sm'}`}>
              {performer.display_name}
            </h3>
            <div className={`flex flex-col gap-1 mt-1 ${featured ? 'text-sm' : 'text-[11px]'}`}>
              <div className="flex items-center gap-2 text-white/50 flex-wrap">
                {performer.nationality && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className={`w-2.5 h-2.5 flex-shrink-0 ${featured ? 'w-3 h-3' : ''}`} />
                    <span className="truncate">{performer.nationality}</span>
                  </span>
                )}
                {age && age >= 18 && (
                  <span className="text-white/40 flex-shrink-0">· {age}y</span>
                )}
              </div>
              {/* Studio/Brand pill - only show if available */}
              {brand && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium ${
                    featured 
                      ? 'bg-white/[0.08] text-white/70 text-xs' 
                      : 'bg-white/[0.06] text-white/60 text-[10px]'
                  }`}>
                    {brand.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card footer - more prominent for featured */}
        <div className={`px-3 py-2.5 flex items-center justify-between ${featured ? 'px-4 py-3' : ''}`}>
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Film className={`w-3 h-3 text-primary/60 ${featured ? 'w-4 h-4' : ''}`} />
            {videoCount > 0
              ? <span><span className="text-white/70 font-semibold">{videoCount}</span> video{videoCount !== 1 ? 's' : ''}</span>
              : <span className="italic">Coming soon</span>
            }
          </div>
          <span className={`group-hover:text-primary transition-colors flex items-center gap-0.5 font-semibold ${featured ? 'text-base' : 'text-[11px] text-primary/70'}`}>
            Profile <ArrowRight className={`w-2.5 h-2.5 ${featured ? 'w-3 h-3' : ''}`} />
          </span>
        </div>
      </div>
    </a>
  );
}