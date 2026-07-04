import React, { useState } from "react";
import { Play, Clock, Crown, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import VideoAssetImage from "@/components/video/VideoAssetImage";
import VideoPreviewPlayer from "@/components/video/VideoPreviewPlayer";
import { PRICING } from "@/lib/useAccessControl";

export default function VideoCard({ video, brands = [], performers = [] }) {
  const [isHovered, setIsHovered] = useState(false);
  const brand = brands.find(b => b.id === video.brand_id);
  const primaryPerformer = performers.find(p => p.id === video.performer_id);
  const hasValidDuration = video.duration_seconds && video.duration_seconds > 0;
  const mins = hasValidDuration ? Math.floor(video.duration_seconds / 60) : null;
  const secs = hasValidDuration ? String(video.duration_seconds % 60).padStart(2, '0') : null;
  
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <a href={`/videos/${video.slug}`} className="group block">
      <div className="rounded-2xl overflow-hidden bg-[#111] border border-white/[0.08] hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(225,29,72,0.25)]">

        {/* Thumbnail with Hover Preview */}
        <div 
          className="relative aspect-video overflow-hidden bg-[#0a0a0a]"
          onMouseEnter={() => !isMobile && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Thumbnail Image - Unified Component */}
          <VideoAssetImage
            video={video}
            alt={video.title}
            className={`transition-transform duration-700 ${isHovered ? 'scale-105' : 'scale-110'}`}
          />
          
          {/* Preview Video on Hover (Desktop only) - Unified Component */}
          {isHovered && !isMobile && (
            <VideoPreviewPlayer
              video={video}
              autoPlay={true}
              loop={true}
              showControls={false}
              className="absolute inset-0"
            />
          )}

          {/* Cinematic gradient overlay - enhanced (hide during preview) */}
          {!isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          )}

          {/* Top-left badge - single status badge max (exclusive takes priority over featured) */}
          <div className="absolute top-2 left-2">
            {video.is_exclusive ? (
              <span className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg shadow-purple-600/30">
                <Zap className="w-3 h-3" /> EXCLUSIVE
              </span>
            ) : video.featured && (
              <span className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg shadow-amber-600/30">
                <Crown className="w-3 h-3" /> FEATURED
              </span>
            )}
          </div>

          {/* Access tier — top right - always clear: Preview / PPV / Fanclub */}
          <div className={cn(
            "absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg backdrop-blur-sm",
            video.access_tier === 'fanclub' ? 'bg-purple-600/90 text-white shadow-purple-600/30'
              : video.access_tier === 'ppv' ? 'bg-red-600/90 text-white shadow-red-600/30'
              : 'bg-green-600/90 text-white shadow-green-600/30'
          )}>
            {video.access_tier === 'fanclub' ? (
              <span className="flex items-center gap-1"><Crown className="w-2.5 h-2.5" /> FANCLUB</span>
            ) : video.access_tier === 'ppv' ? (
              <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5" /> ${PRICING.ppv.standard.price}</span>
            ) : (
              <span>PREVIEW</span>
            )}
          </div>

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