import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HeroVideoTeaser() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef(null);
  const previousIndexRef = useRef(-1);
  const currentIndexRef = useRef(0);

  // Fetch published videos with valid media URLs
  const { data: allVideos = [] } = useQuery({
    queryKey: ['public-videos-fn'],
    queryFn: async () => {
      const data = await callPublicFunction('getPublicVideos');
      return data?.videos || [];
    },
    retry: 0,
  });

  // Get media URL by priority (defined early so useMemo can use it)
  const getPriorityMediaUrl = (video) => {
    if (video.trailer_url?.trim()) return video.trailer_url;
    if (video.preview_video_url?.trim()) return video.preview_video_url;
    if (video.source_video_url?.trim()) return video.source_video_url;
    if (video.src_url?.trim()) return video.src_url;
    return null;
  };

  // Compute eligible videos from query data (no setState — avoids infinite loop)
  const videos = useMemo(() => {
    return (allVideos || []).filter(v => !!getPriorityMediaUrl(v)).slice(0, 12);
  }, [allVideos]);

  // Set random initial index once when videos first load
  useEffect(() => {
    if (videos.length === 0) return;
    const randomStart = Math.floor(Math.random() * videos.length);
    currentIndexRef.current = randomStart;
    setCurrentVideoIndex(randomStart);
    previousIndexRef.current = -1;
  }, [videos.length > 0]);

  // Random rotation every 8 seconds
  useEffect(() => {
    if (videos.length === 0) return;

    const rotateTeaser = () => {
      setIsTransitioning(true);
      
      // Fade out
      setTimeout(() => {
        // Pick random index (not same as previous)
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * videos.length);
        } while (nextIndex === previousIndexRef.current && videos.length > 1);
        
        previousIndexRef.current = currentIndexRef.current;
        currentIndexRef.current = nextIndex;
        setCurrentVideoIndex(nextIndex);
        
        // Fade in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 1000);
      }, 1000);
    };

    const interval = setInterval(rotateTeaser, 8000);
    return () => clearInterval(interval);
  }, [videos.length]);

  // Handle video errors - skip to next (memoized)
  const handleVideoError = useCallback(() => {
    console.warn('Video failed to load, skipping to next...');
    setIsTransitioning(true);
    setTimeout(() => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * videos.length);
      } while (nextIndex === previousIndexRef.current && videos.length > 1);
      
      previousIndexRef.current = currentIndexRef.current;
      currentIndexRef.current = nextIndex;
      setCurrentVideoIndex(nextIndex);
      setTimeout(() => setIsTransitioning(false), 1000);
    }, 500);
  }, [videos.length]);

  // No eligible videos - static fallback
  if (videos.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-background">
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <Play className="w-20 h-20 text-primary/40 mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Premium Asian Twink Content
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            Exclusive scenes, performer originals, and studio releases
          </p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];
  const videoUrl = getPriorityMediaUrl(currentVideo);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        key={currentVideo.id}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={handleVideoError}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
        style={{
          // Reduced zoom - show more of the scene
          objectFit: "cover",
          transform: "scale(1.0)"
        }}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      
      {/* Additional crimson gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <Play className="w-20 h-20 text-primary/80 mb-6 drop-shadow-2xl" />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          Premium Asian Twink Content
        </h1>
        <p className="text-lg text-white/80 max-w-xl drop-shadow-md">
          Exclusive scenes, performer originals, and studio releases
        </p>
      </div>

      {/* Smooth fade transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black/40 transition-opacity duration-1000" />
      )}
    </div>
  );
}