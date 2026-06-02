import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import SummerPromoBanner from "@/components/public/SummerPromoBanner";
import TubeVideoCard from "@/components/tube/TubeVideoCard";
import PerformerCarousel from "@/components/tube/PerformerCarousel";
import FanclubBanner from "@/components/tube/FanclubBanner";
import StudioJournal from "@/components/tube/StudioJournal";

export default function Home() {

  // Fetch videos
  const { data: videosData, isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ['public-videos-fn'],
    queryFn: () => callPublicFunction('getPublicVideos'),
    retry: 1,
    staleTime: 30000,
  });
  const videos = videosData?.videos || [];

  // Fetch performers
  const { data: performersData, isLoading: performersLoading } = useQuery({
    queryKey: ['public-performers-fn'],
    queryFn: () => callPublicFunction('getPublicPerformers'),
    retry: 0,
    staleTime: 30000,
  });
  const performers = performersData?.performers || [];

  // Fetch news
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['public-news-fn'],
    queryFn: () => callPublicFunction('getPublicNews'),
    retry: 0,
    staleTime: 30000,
  });
  const articles = newsData?.articles || [];

  return (
    <>
      <SEOMeta
        title="FLESHLAB — Premium Asian Gay Adult Studio"
        description="FLESHLAB is a premium gay adult studio featuring verified Asian performers, exclusive productions, and member-only content."
        canonical="/"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FLESHLAB",
          "url": "https://fleshlab.online",
          "description": "Premium gay adult studio featuring verified Asian performers, exclusive productions and member-only content."
        }}
      />

      {/* Summer Promo Banner */}
        <SummerPromoBanner />

        {/* Main Video Grid - Tight spacing below banner */}
        <section className="py-2">
          <div className="max-w-[1920px] mx-auto px-4">
            {/* Section Header with Banner-Matching Style - Tight spacing */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Red accent line before title */}
                <div className="w-1.5 h-8 bg-gradient-to-b from-rose-600 to-rose-700 rounded-full shadow-lg shadow-rose-600/40" />
                <h2 className="text-xl font-black text-white tracking-tight">
                  <span className="text-rose-500">LATEST</span> VIDEOS
                </h2>
                <div className="h-px w-32 bg-gradient-to-r from-rose-600/50 to-transparent" />
              </div>
              <a href="/videos" className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            </div>

            {videosLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="aspect-video bg-[#121212] rounded-xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : videosError ? (
              <div className="text-center py-8 text-white/60">
                <p>Error loading videos</p>
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {videos.slice(0, 36).map(video => (
                  <TubeVideoCard key={video.id} video={video} brands={videosData?.brands || []} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <p>No videos available</p>
              </div>
            )}
          </div>
        </section>

        {/* Performer Carousel - Tube Style */}
        <PerformerCarousel performers={performers} />

        {/* Fanclub Banner - Summer Match */}
        <FanclubBanner />

        {/* Studio Journal */}
        <StudioJournal articles={articles} />
    </>
  );
}