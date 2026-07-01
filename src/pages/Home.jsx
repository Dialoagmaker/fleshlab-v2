import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import { useI18n } from "@/i18n/i18n.jsx";
import SEOMeta from "@/components/SEOMeta";
import SummerPromoBanner from "@/components/public/SummerPromoBanner";
import TubeVideoCard from "@/components/tube/TubeVideoCard";
import PerformerCarousel from "@/components/tube/PerformerCarousel";
import FanclubBanner from "@/components/tube/FanclubBanner";
import StudioJournal from "@/components/tube/StudioJournal";
import PerformerRecruitmentBanner from "@/components/public/PerformerRecruitmentBanner";
import FleshLabLiveSection from "@/components/home/FleshLabLiveSection";

export default function Home() {
  const { t } = useI18n();

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

  // Fetch news (latest 6)
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['public-news-fn-home'],
    queryFn: () => callPublicFunction('getPublicNews', { page: 1, limit: 6 }),
    retry: 0,
    staleTime: 60000,
  });
  const articles = newsData?.articles || [];

  return (
    <>
      <SEOMeta
        title="FLESHLAB Studios – Homemade Asian Twink Gay Videos & Fanclub"
        description="Watch homemade Asian twink gay videos, Filipino performers, fanclub updates, amateur studio productions and verified 18+ creator content by FLESHLAB Studios."
        canonical="/"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FLESHLAB Studios",
          "url": "https://fleshlab.online",
          "description": "Homemade Asian twink gay videos, Filipino performers, fanclub updates and verified 18+ creator content by FLESHLAB Studios."
        }}
      />

      {/* 1. Main hero / fanclub promo — first visual impression */}
      <SummerPromoBanner />

      {/* 2. Latest Videos — prove the platform has real content */}
      <section className="py-2">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-rose-600 to-rose-700 rounded-full shadow-lg shadow-rose-600/40" />
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                {t('homepage.latestVideos')}
              </h2>
              <div className="h-px w-32 bg-gradient-to-r from-rose-600/50 to-transparent" />
            </div>
            <a href="/videos" className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
              {t('homepage.viewAll')} <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
              <p>{t('homepage.errorLoading')}</p>
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
              {videos.slice(0, 36).map(video => (
                <TubeVideoCard key={video.id} video={video} brands={videosData?.brands || []} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <p>{t('homepage.noVideos')}</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Verified Performers — real people behind the content */}
      <PerformerCarousel performers={performers} />

      {/* 4. FleshLab Live Section */}
      <FleshLabLiveSection />

      {/* 5. Performer Recruitment Banner — after performers for context */}
      <PerformerRecruitmentBanner />

      {/* 5. Fanclub / Full Archive CTA — logical after seeing content + performers */}
      <FanclubBanner />

      {/* 6. SEO Intro / About FLESHLAB — keyword content preserved but below conversion blocks */}
      <section className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Homemade Asian Twink Videos & Verified Filipino Performers</h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              FLESHLAB Studios produces homemade-style Asian twink gay videos featuring verified 18+ Filipino performers, amateur creator content, fanclub exclusives and independent studio productions.
              Our content spans amateur solo scenes, intimate couple shoots, raw homemade-style videos, full-length fanclub releases and behind-the-scenes footage from the Philippines and across Asia.
              Discover our roster of verified Filipino twink performers, explore our growing library of amateur-style gay adult videos, and access exclusive creator content through our gay fanclub membership.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Studio Journal / News — SEO trust and content depth */}
      <StudioJournal articles={articles} />
    </>
  );
}