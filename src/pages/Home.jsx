import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import TubeHeader from "@/components/tube/TubeHeader";
import TubeNav from "@/components/tube/TubeNav";
import CategoryChips from "@/components/tube/CategoryChips";
import PromoBanner from "@/components/tube/PromoBanner";
import TubeVideoCard from "@/components/tube/TubeVideoCard";
import PerformerStrip from "@/components/tube/PerformerStrip";
import FanclubBanner from "@/components/tube/FanclubBanner";
import StudioJournal from "@/components/tube/StudioJournal";
import TubeFooter from "@/components/tube/TubeFooter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch videos
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['public-videos-fn'],
    queryFn: () => callPublicFunction('getPublicVideos'),
    retry: 0,
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

  // Get featured video for banner (first video or featured)
  const featuredVideo = videos.find(v => v.featured) || videos[0];

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

      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header & Navigation */}
        <TubeHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <TubeNav />
        <CategoryChips />

        {/* Promo Banner */}
        <PromoBanner video={featuredVideo} />

        {/* Main Video Grid - Show videos immediately */}
        <section className="py-6">
          <div className="max-w-[1920px] mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Latest Videos</h2>
              <a href="/videos" className="text-sm text-rose-500 hover:text-rose-400 font-medium flex items-center gap-1">
                View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            </div>

            {videosLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="aspect-video bg-[#1a1a1a] rounded animate-pulse" />
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {videos.slice(0, 25).map(video => (
                  <TubeVideoCard key={video.id} video={video} brands={videosData?.brands || []} />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Performer Strip */}
        <PerformerStrip performers={performers} />

        {/* Fanclub Banner */}
        <FanclubBanner />

        {/* Studio Journal */}
        <StudioJournal articles={articles} />

        {/* Footer */}
        <TubeFooter />
      </div>
    </>
  );
}