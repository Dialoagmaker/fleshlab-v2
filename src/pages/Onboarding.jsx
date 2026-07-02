import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { callPublicFunction } from "@/lib/publicApi";
import { trackEvent, trackOnboardingViewed } from "@/lib/analytics";
import SEOMeta from "@/components/SEOMeta";
import VideoCard from "@/components/public/VideoCard";
import PerformerCard from "@/components/public/PerformerCard";
import OnboardingFanclubBenefits from "@/components/onboarding/OnboardingFanclubBenefits";
import VideoRowSection from "@/components/onboarding/VideoRowSection";
import { Play, Users } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();

  useEffect(() => {
    trackOnboardingViewed();
  }, []);

  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['public-videos-fn'],
    queryFn: () => callPublicFunction('getPublicVideos'),
    retry: 1,
    staleTime: 30000,
  });
  const videos = videosData?.videos || [];
  const brands = videosData?.brands || [];

  const { data: performersData, isLoading: performersLoading } = useQuery({
    queryKey: ['public-performers-fn'],
    queryFn: () => callPublicFunction('getPublicPerformers'),
    retry: 0,
    staleTime: 30000,
  });
  const performers = performersData?.performers || [];

  // Dedupe videos across sections — earlier sections win, priority order below.
  const { recommended, newestReleases, trending, recentlyAdded } = useMemo(() => {
    const renderedVideoIds = new Set();
    const uniqueVideos = (list, count) => {
      const result = [];
      for (const v of list) {
        if (renderedVideoIds.has(v.id)) continue;
        renderedVideoIds.add(v.id);
        result.push(v);
        if (count && result.length >= count) break;
      }
      return result;
    };

    const recommended = uniqueVideos(videos, 3);
    const newestReleases = uniqueVideos(videos, 6);
    const trendingCandidates = videos.filter(v => v.featured || v.is_exclusive);
    const trending = uniqueVideos(trendingCandidates.length ? trendingCandidates : videos, 6);
    const recentlyAdded = uniqueVideos(videos, 6);

    return { recommended, newestReleases, trending, recentlyAdded };
  }, [videos]);

  const handleNav = (path, eventName) => {
    trackEvent(eventName, { source: 'onboarding' });
    trackEvent('onboarding_completed', { action: path });
    base44.auth.updateMe({ onboarding_completed: true }).catch(() => {});
    window.location.href = path;
  };

  if (!user) return null;

  const firstName = user.full_name ? user.full_name.split(' ')[0] : null;

  return (
    <>
      <SEOMeta title="Welcome to FLESHLAB" noIndex={true} />
      <div className="min-h-screen bg-[#080808] px-4 py-10 md:py-14">
        <div className="max-w-[1200px] mx-auto">

          {/* ── Welcome Hero — compact ───────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1.5">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-white/45 text-sm max-w-md mb-4">
              Start exploring today's newest scenes.
            </p>

            {/* Primary / Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <button
                onClick={() => handleNav("/videos", "onboarding_videos_clicked")}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-rose-600/25 transition-all"
              >
                <Play className="w-4 h-4" /> Browse Videos
              </button>
              <button
                onClick={() => handleNav("/performers", "onboarding_performers_clicked")}
                className="flex-1 flex items-center justify-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all"
              >
                <Users className="w-4 h-4" /> Explore Performers
              </button>
            </div>
          </div>

          {/* ── Recommended Videos — fewer, larger cards ─────────────── */}
          <section className="mb-8">
            <h2 className="text-lg font-black text-white mb-3 uppercase tracking-tight">Recommended For You</h2>
            {videosLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-video bg-[#121212] rounded-2xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommended.map(video => (
                  <VideoCard key={video.id} video={video} brands={brands} performers={performers} />
                ))}
              </div>
            )}
          </section>

          {/* ── Newest Releases ──────────────────────────────────────── */}
          <VideoRowSection title="Newest Releases" videos={newestReleases} brands={brands} performers={performers} loading={videosLoading} />

          {/* ── Trending ─────────────────────────────────────────────── */}
          <VideoRowSection title="Trending" videos={trending} brands={brands} performers={performers} loading={videosLoading} />

          {/* ── Featured Performers ──────────────────────────────────── */}
          <section className="mb-8">
            <h2 className="text-lg font-black text-white mb-3 uppercase tracking-tight">Popular Performers</h2>
            {performersLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-[#121212] rounded-xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {performers.slice(0, 3).map(performer => (
                  <PerformerCard key={performer.id} performer={performer} brands={brands} videoCount={performer.video_count || 0} />
                ))}
              </div>
            )}
          </section>

          {/* ── Fanclub Benefits (secondary, below discovery) ───────── */}
          <div className="mb-8">
            <OnboardingFanclubBenefits />
          </div>

          {/* ── Recently Added — delays reaching the footer ──────────── */}
          <VideoRowSection title="Recently Added" videos={recentlyAdded} brands={brands} performers={performers} loading={videosLoading} />

        </div>
      </div>
    </>
  );
}