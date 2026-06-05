import React, { useState, useRef } from "react";
import { Play, Clock, Crown, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Build asset URL (same as admin panel)
function buildAssetUrl(value) {
  if (!value) return null;
  const clean = String(value).trim();
  if (!clean) return null;
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `https://video.fleshlab.online/${clean.replace(/^\/+/, "")}`;
}

export default function VideoCard({ video, brands = [], performers = [] }) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);
  const brand = brands.find(b => b.id === video.brand_id);
  const primaryPerformer = performers.find(p => p.id === video.performer_id);
  const hasValidDuration = video.duration_seconds && video.duration_seconds > 0;
  const mins = hasValidDuration ? Math.floor(video.duration_seconds / 60) : null;
  const secs = hasValidDuration ? String(video.duration_seconds % 60).padStart(2, '0') : null;
  
  // Preview URL - trailer_url is canonical
  const rawPreviewUrl = video.trailer_url || video.preview_gif_url || null;
  const previewUrl = buildAssetUrl(rawPreviewUrl);
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <a href={`/videos/${video.slug}`} className="group block">
      <div className="rounded-2xl overflow-hidden bg-[#111] border border-white/[0.08] hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(225,29,72,0.25)]">

        {/* Thumbnail with Hover Preview */}
        <div 
          className="relative aspect-video overflow-hidden bg-[#0a0a0a]"
          onMouseEnter={() => !isMobile && setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
          }}
        >
          {/* Thumbnail Image */}
          <img
            src={`${video.primary_thumbnail_url}${video.primary_thumbnail_url.includes('?') ? '&' : '?'}v=${video.updated_date ? new Date(video.updated_date).getTime() : Date.now()}`}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-105' : 'scale-110'}`}
            loading="lazy"
            decoding="async"
            width="640"
            height="360"
          />
          
          {/* Preview Video on Hover (Desktop only) */}
          {isHovered && previewUrl && !isMobile && (
            <video
              ref={videoRef}
              src={previewUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
              onMouseEnter={(e) => {
                e.currentTarget.play().catch(err => console.warn('Preview playback blocked:', err));
              }}
            />
          )}

          {/* Cinematic gradient overlay - enhanced (hide during preview) */}
          {!isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          )}

          {/* Enhanced hover play button with glow (hide if has preview) */}
          {!previewUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "w-16 h-16 bg-gradient-to-br from-rose-600 to-rose-700 rounded-full flex items-center justify-center shadow-2xl shadow-rose-600/50",
                "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300",
                "hover:shadow-[0_0_40px_rgba(225,29,72,0.6)]"
              )}>
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}

          {/* Top-left badges - enhanced hierarchy */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {video.featured && (
              <span className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg shadow-amber-600/30">
                <Crown className="w-3 h-3" /> FEATURED
              </span>
            )}
            {video.is_exclusive && (
              <span className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg shadow-purple-600/30">
                <Zap className="w-3 h-3" /> EXCLUSIVE
              </span>
            )}
          </div>

          {/* Access tier — top right - enhanced */}
          {video.access_tier && video.access_tier !== 'free' && (
            <div className={cn(
              "absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg backdrop-blur-sm",
              video.access_tier === 'fanclub' ? 'bg-purple-600/90 text-white shadow-purple-600/30' : 'bg-red-600/90 text-white shadow-red-600/30'
            )}>
              {video.access_tier === 'fanclub' ? (
                <span className="flex items-center gap-1"><Crown className="w-2.5 h-2.5" /> FANCLUB</span>
              ) : (
                <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5" /> PPV</span>
              )}
            </div>
          )}

          {/* Duration — bottom right - enhanced visibility */}
          {hasValidDuration && (
            <div className="absolute bottom-2 right-2 bg-black/95 backdrop-blur-sm text-white text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-white/15 shadow-lg">
              <Clock className="w-3 h-3" />{mins}:{secs}
            </div>
          )}
        </div>

        {/* Card body - improved spacing */}
        <div className="p-3.5 space-y-2.5">
          <h3 className="font-bold text-white/95 text-sm leading-snug line-clamp-2 group-hover:text-rose-500 transition-colors duration-300 min-h-[2.5rem]">
            {video.title}
          </h3>

          <div className="flex items-center justify-between gap-2 text-[11px] text-white/40">
            {brand ? (
              <span className="bg-white/[0.08] text-white/60 font-semibold px-2.5 py-1 rounded-md border border-white/10">
                {brand.name}
              </span>
            ) : <span />}
            {video.release_date && (
              <span className="text-white/30">
                {new Date(video.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}