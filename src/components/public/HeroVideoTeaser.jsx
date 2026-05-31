import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function HeroVideoTeaser({ onVideosLoaded }) {
  const [teaserVideos, setTeaserVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const videoRefs = useRef([]);

  useEffect(() => {
    const fetchTeaserVideos = async () => {
      try {
        // Get videos with valid trailer or source URLs, limit to 6
        const allVideos = await base44.entities.Video.filter(
          { status: "published" },
          "-release_date",
          50
        );

        // Filter for videos with valid URLs
        const validTeasers = allVideos.filter(
          v => (v.trailer_url || v.source_video_url) && v.primary_thumbnail_url
        ).slice(0, 6);

        setTeaserVideos(validTeasers);
        onVideosLoaded?.(validTeasers.length);
      } catch (error) {
        console.error("Failed to fetch teaser videos:", error);
        setHasError(true);
      }
    };

    fetchTeaserVideos();
  }, [onVideosLoaded]);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (teaserVideos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % teaserVideos.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [teaserVideos.length]);

  // Handle video load errors
  const handleVideoError = (index) => {
    console.error(`Video ${index} failed to load`);
    // Skip to next video after error
    if (index === currentIndex && teaserVideos.length > 1) {
      setCurrentIndex(prev => (prev + 1) % teaserVideos.length);
    }
  };

  // Mobile: disable auto-rotation, show static
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (hasError || teaserVideos.length === 0) {
    return null; // Parent will show static hero
  }

  const currentVideo = teaserVideos[currentIndex];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video layer */}
      {teaserVideos.map((video, index) => {
        const videoUrl = video.trailer_url || video.source_video_url;
        if (!videoUrl) return null;

        return (
          <video
            key={video.id}
            ref={el => videoRefs.current[index] = el}
            src={videoUrl}
            autoPlay={index === currentIndex && !isMobile}
            muted
            loop
            playsInline
            preload="metadata"
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
              index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onError={() => handleVideoError(index)}
          />
        );
      })}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
      
      {/* Crimson gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />

      {/* Content overlay */}
      <div className="relative h-full flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-xs font-bold tracking-[0.4em] text-primary uppercase">
              FLESHLAB Asia
            </p>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight uppercase leading-none mb-6 text-foreground drop-shadow-2xl">
            Premium Asian <span className="text-primary">Twink</span> Content
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed drop-shadow-lg">
            Exclusive studio productions featuring the hottest Filipino and Asian performers. 
            Professional quality, authentic performances, new releases weekly.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/videos"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3.5 rounded-lg transition-colors text-sm shadow-lg shadow-primary/20"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Videos
            </a>
            <a
              href="/performers"
              className="inline-flex items-center gap-2 bg-transparent border border-border hover:border-primary/50 text-foreground font-semibold px-8 py-3.5 rounded-lg transition-colors text-sm"
            >
              Meet Performers
            </a>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      {teaserVideos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {teaserVideos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex ? "bg-primary w-6" : "bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to teaser ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper for class merging (simplified cn)
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}