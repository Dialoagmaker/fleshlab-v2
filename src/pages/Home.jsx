import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { callPublicFunction } from "@/lib/publicApi";
import { Play, ArrowRight, Film, Users, Camera, CheckCircle2 } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import VideoCard from "@/components/public/VideoCard";
import PerformerCard from "@/components/public/PerformerCard";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
import StudioTrustBlock from "@/components/public/StudioTrustBlock";
import SectionHeader from "@/components/public/SectionHeader";
import VideoRail from "@/components/public/VideoRail";
import FeaturedRelease from "@/components/public/FeaturedRelease";
import NewsCard from "@/components/public/NewsCard";

const TRUST_BADGES = [
  "Original Studio Content",
  "Verified 18+ Performers",
  "New Releases Weekly",
];

export default function Home() {
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['public-videos-fn'],
    queryFn: () => callPublicFunction('getPublicVideos'),
    retry: 0,
  });
  const allVideos   = videosData?.videos || [];
  const brands      = videosData?.brands || [];
  const latestVideos   = allVideos.slice(0, 12);
  const featuredVideos = allVideos.filter(v => v.featured).slice(0, 8);
  const featuredRelease = featuredVideos[0] || latestVideos[0] || null;

  const { data: performersData } = useQuery({
    queryKey: ['public-performers-fn'],
    queryFn: () => callPublicFunction('getPublicPerformers'),
    retry: 0,
  });
  const allPerformers      = performersData?.performers || [];
  const featuredPerformers = allPerformers.filter(p => p.featured).slice(0, 8);
  const activePerformers   = allPerformers.slice(0, 12);

  const { data: newsData } = useQuery({
    queryKey: ['public-news-fn'],
    queryFn: () => callPublicFunction('getPublicNews'),
    retry: 0,
  });
  const latestNews = (newsData?.articles || []).slice(0, 3);

  // Hero background from the most compelling available image
  const heroBg =
    featuredRelease?.cover_image_url ||
    featuredRelease?.primary_thumbnail_url ||
    null;

  return (
    <>
      <SEOMeta
        title="FLESHLAB — Premium Gay Studio | Asian Twink Videos"
        description="FLESHLAB is a premium gay adult studio featuring verified Asian twink performers, exclusive studio videos, fanclub content and more."
        canonical="/"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FLESHLAB",
          "url": "https://fleshlab.online",
          "description": "Premium gay adult studio featuring verified Asian twink performers, exclusive studio videos and fanclub content."
        }}
      />
      <div className="min-h-screen bg-background">

      {/* ─────────────────────────────────────────────────────────
          1. CINEMATIC HERO
      ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-[75vh] lg:min-h-[82vh] flex items-end overflow-hidden">
        {/* Background image */}
        {heroBg ? (
          <img
            src={heroBg}
            alt="FLESHLAB"
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
            style={{ filter: 'brightness(0.45)' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0a] via-[#0d0d0d] to-black" />
        )}

        {/* Gradient overlays for cinematic feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-32">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-12 bg-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-[0.2em]">
                Premium Studio Content
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none mb-5 tracking-tight">
              FLESHLAB<br />
              <span className="text-primary">Asia</span> Originals
            </h1>

            {/* Subheadline */}
            <p className="text-white/65 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
              Exclusive Asian twink scenes, performer originals, and studio releases.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/videos"
                className="inline-flex items-center gap-2.5 bg-primary hover:bg-primary/90 text-white font-bold px-7 py-3.5 rounded-lg transition-all duration-200 shadow-xl shadow-primary/30 text-base"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Latest Videos
              </Link>
              <Link
                to="/become-performer"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 bg-white/[0.05] hover:bg-white/[0.08] text-white font-semibold px-7 py-3.5 rounded-lg transition-all duration-200 text-base"
              >
                Become a Performer
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-5">
              {TRUST_BADGES.map(badge => (
                <div key={badge} className="flex items-center gap-2 text-white/50 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary/70 shrink-0" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          2. FEATURED RELEASE
      ───────────────────────────────────────────────────────── */}
      {featuredRelease && (
        <div className="border-b border-white/[0.06]">
          <FeaturedRelease video={featuredRelease} brands={brands} />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          3. LATEST VIDEOS
      ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <SectionHeader
          title="Latest Releases"
          subtitle="Fresh from the studio — new scenes every week"
          viewAllLink="/videos"
          viewAllText="View All Videos"
          accent="New This Week"
        />

        {videosLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl bg-[#111] border border-white/[0.05] overflow-hidden animate-pulse">
                <div className="aspect-video bg-white/[0.04]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : latestVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {latestVideos.map(video => (
              <VideoCard key={video.id} video={video} brands={brands} performers={allPerformers} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-white/10 rounded-2xl py-20 text-center">
            <Film className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/30 text-sm">Videos coming soon</p>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────
          4. FLESHLAB ASIA ORIGINALS
      ───────────────────────────────────────────────────────── */}
      {featuredVideos.length > 0 && (
        <section className="bg-[#0b0b0b] border-y border-white/[0.05] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="FLESHLAB Asia Originals"
              subtitle="Our most exclusive studio productions."
              viewAllLink="/videos"
              viewAllText="View All Originals"
              accent="Studio Exclusives"
            />
            <VideoRail
              videos={featuredVideos}
              brands={brands}
              performers={allPerformers}
            />
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────
          5. FANCLUB CTA
      ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <PremiumTeaserBlock title="Unlock the Full FLESHLAB Experience" />
      </section>

      {/* ─────────────────────────────────────────────────────────
          6. FEATURED PERFORMERS
      ───────────────────────────────────────────────────────── */}
      {featuredPerformers.length > 0 && (
        <section className="bg-[#0b0b0b] border-y border-white/[0.05] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Featured Performers"
              subtitle="The hottest Asian twinks in the industry"
              viewAllLink="/performers"
              viewAllText="All Performers"
              accent="Talent Roster"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {featuredPerformers.map(performer => (
                <PerformerCard
                  key={performer.id}
                  performer={performer}
                  brands={brands}
                  videoCount={performer.video_count || 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Active performers if no featured */}
      {featuredPerformers.length === 0 && activePerformers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <SectionHeader
            title="Our Performers"
            subtitle={`${activePerformers.length} active performers`}
            viewAllLink="/performers"
            accent="Talent Roster"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activePerformers.map(performer => (
              <PerformerCard key={performer.id} performer={performer} brands={brands} videoCount={performer.video_count || 0} />
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────
          7. WHY FLESHLAB
      ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Why FLESHLAB Asia</span>
          </div>
          <h2 className="text-3xl font-black text-white">Built for the most discerning fans</h2>
        </div>
        <StudioTrustBlock />
      </section>

      {/* ─────────────────────────────────────────────────────────
          8. STUDIO NEWS
      ───────────────────────────────────────────────────────── */}
      {latestNews.length > 0 && (
        <section className="bg-[#0b0b0b] border-t border-white/[0.05] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Studio News"
              subtitle="Updates, announcements, and behind-the-scenes"
              viewAllLink="/news"
              viewAllText="All News"
              accent="Behind the Scenes"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {latestNews.map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────
          9. BECOME A PERFORMER CTA
      ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 border-t border-white/[0.05]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Camera className="w-16 h-16 text-primary mx-auto mb-6 opacity-80" />
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Want to Be a FLESHLAB Performer?
          </h2>
          <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto leading-relaxed">
            Gay / bi / queer guys wanted. Create content. Build fans. Earn with FLESHLAB.
            Apply in 3 minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/become-performer"
              className="inline-flex items-center gap-2.5 bg-primary hover:bg-primary/90 text-white font-bold px-10 py-4 rounded-lg transition-all duration-200 shadow-xl shadow-primary/30 text-lg"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-white/60 hover:text-white font-semibold px-10 py-4 rounded-lg transition-all duration-200 text-lg"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}