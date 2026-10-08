import { Link } from "react-router-dom";
import { Play, Lock, Star } from "lucide-react";
import { useState, useRef } from "react";
import { isPublicImageUrl } from "@/lib/seoValidation";
import { getVideoPreviewUrl } from "@/lib/videoAssetResolver";

/**
 * CinematicVideoCard - Premium video card for studio portal design
 * Variants: standard, featured, horizontal
 */
export default function CinematicVideoCard({ video, variant = "standard", brands = [] }) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);
  const brand = brands?.find(b => b.id === video.brand_id);
  const hasValidThumbnail = isPublicImageUrl(video.primary_thumbnail_url);
  const trailerUrl = getVideoPreviewUrl(video);
  const rawTrailerUrl = trailerUrl;
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Access tier badges
  const accessBadges = {
    free: { label: "Free", color: "bg-green-600/90" },
    fanclub: { label: "Fanclub", color: "bg-rose-600/90" },
    ppv: { label: "PPV", color: "bg-amber-600/90" }
  };
  
  const badge = accessBadges[video.access_tier] || accessBadges.free;
  
  // Duration formatter
  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Link
      to={`/videos/${video.slug}`}
      className={`group block bg-[#0A0A0A] rounded-xl overflow-hidden border border-white/[0.05] hover:border-rose-600/30 transition-all duration-300 ${
        variant === "featured" ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      {/* Thumbnail with Hover Preview */}
      <div 
        className="relative aspect-video overflow-hidden"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
      >
        {hasValidThumbnail ? (
          <img
            src={video.primary_thumbnail_url}
            alt={video.title}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-105'}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
        )}
        
        {/* Preview Video on Hover (Desktop only) */}
        {isHovered && trailerUrl && !isMobile && (
          <video
            ref={videoRef}
            src={trailerUrl}
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
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {/* Access tier badge */}
          {video.access_tier !== "free" && (
            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${badge.color}`}>
              {badge.label}
            </span>
          )}
          
          {/* Featured badge */}
          {video.featured && (
            <span className="px-2 py-1 rounded text-xs font-medium text-white bg-amber-600/90 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Featured
            </span>
          )}
          
          {/* Exclusive badge */}
          {video.is_exclusive && (
            <span className="px-2 py-1 rounded text-xs font-medium text-white bg-rose-600/90">
              Exclusive
            </span>
          )}
        </div>
        
        {/* Duration */}
        {video.duration_seconds && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/80 text-xs text-white font-mono">
            {formatDuration(video.duration_seconds)}
          </div>
        )}
        
        {/* Play icon (hover) - hide if has trailer preview */}
        {!trailerUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 rounded-full bg-rose-600/90 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>
          </div>
        )}
        
        {/* Locked overlay - only if no trailer AND premium content */}
        {!rawTrailerUrl && video.access_tier !== "free" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Lock className="w-12 h-12 text-rose-500 mx-auto mb-2" />
              <p className="text-sm text-white font-medium">Members Only</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Metadata */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-rose-500 transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-[#F5F5F5]/60">
          {/* Brand */}
          {brand && (
            <span className="flex items-center gap-1">
              <span className="text-rose-500">{brand.name}</span>
            </span>
          )}
          
          {/* Release date */}
          {video.release_date && (
            <span>
              {new Date(video.release_date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              })}
            </span>
          )}
        </div>
        
        {/* Performer avatars (if available) */}
        {video.performers?.length > 0 && (
          <div className="flex items-center gap-1 mt-3 -space-x-2">
            {video.performers.slice(0, 3).map((performer, idx) => (
              <div
                key={performer.id}
                className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-white/[0.1] flex items-center justify-center text-[10px] text-white"
                title={performer.display_name}
              >
                {performer.display_name.charAt(0)}
              </div>
            ))}
            {video.performers.length > 3 && (
              <span className="text-[10px] text-[#F5F5F5]/60 pl-4">
                +{video.performers.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}