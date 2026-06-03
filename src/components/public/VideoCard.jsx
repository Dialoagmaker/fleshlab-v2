import React from "react";
import { Play, Clock, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VideoCard({ video, brands = [], performers = [] }) {
  const brand = brands.find(b => b.id === video.brand_id);
  const primaryPerformer = performers.find(p => p.id === video.performer_id);
  const hasValidDuration = video.duration_seconds && video.duration_seconds > 0;
  const mins = hasValidDuration ? Math.floor(video.duration_seconds / 60) : null;
  const secs = hasValidDuration ? String(video.duration_seconds % 60).padStart(2, '0') : null;

  return (
    <a href={`/videos/${video.slug}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-[#111] border border-white/[0.07] hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(180,30,50,0.2)]">

        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-[#0a0a0a]">
          {video.primary_thumbnail_url ? (
            <img
              src={video.primary_thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              decoding="async"
              width="640"
              height="360"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-12 h-12 text-white/20" />
            </div>
          )}

          {/* Cinematic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Hover play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/60",
              "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300"
            )}>
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Top-left badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {video.featured && (
              <span className="flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                <Crown className="w-2.5 h-2.5" /> FEATURED
              </span>
            )}
            {video.is_exclusive && (
              <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                EXCLUSIVE
              </span>
            )}
          </div>

          {/* Access tier — top right */}
          {video.access_tier && video.access_tier !== 'free' && (
            <div className={cn(
              "absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded shadow-lg",
              video.access_tier === 'fanclub' ? 'bg-purple-700 text-white' : 'bg-red-700 text-white'
            )}>
              {video.access_tier === 'fanclub' ? 'FANCLUB' : 'PPV'}
            </div>
          )}

          {/* Duration — bottom right */}
          {hasValidDuration && (
            <div className="absolute bottom-2 right-2 bg-black/90 text-white text-[11px] font-mono font-bold px-2 py-1 rounded flex items-center gap-1 border border-white/10">
              <Clock className="w-2.5 h-2.5" />{mins}:{secs}
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-3 space-y-2">
          <h3 className="font-bold text-white/90 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {video.title}
          </h3>

          <div className="flex items-center justify-between gap-2 text-[11px] text-white/35">
            {brand ? (
              <span className="bg-white/[0.06] text-white/50 font-semibold px-2 py-0.5 rounded">
                {brand.name}
              </span>
            ) : <span />}
            {video.release_date && (
              <span>
                {new Date(video.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}