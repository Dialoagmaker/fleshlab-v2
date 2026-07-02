import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { callPublicFunction } from "@/lib/publicApi";
import { trackEvent, trackOnboardingViewed } from "@/lib/analytics";
import SEOMeta from "@/components/SEOMeta";
import VideoCard from "@/components/public/VideoCard";
import PerformerCard from "@/components/public/PerformerCard";
import OnboardingFanclubBenefits from "@/components/onboarding/OnboardingFanclubBenefits";
import { Play, Users, Sparkles } from "lucide-react";

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

          {/* ── Welcome Hero ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-600/20 mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              Welcome to FLESHLAB{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-white/45 text-base max-w-md mb-7">
              You're in. Start exploring free previews right away — no payment needed to look around.
            </p>

            {/* Primary / Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <button
                onClick={() => handleNav("/videos", "onboarding_videos_clicked")}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 py-3.5 rounded-xl text-base shadow-lg shadow-rose-600/25 transition-all"
              >
                <Play className="w-4 h-4" /> Browse Videos
              </button>
              <button
                onClick={() => handleNav("/performers", "onboarding_performers_clicked")}
                className="flex-1 flex items-center justify-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-all"
              >
                <Users className="w-4 h-4" /> Explore Performers
              </button>
            </div>
          </div>

          {/* ── Recommended Videos ───────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-lg font-black text-white mb-3 uppercase tracking-tight">Recommended Videos</h2>
            {videosLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-video bg-[#121212] rounded-2xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {videos.slice(0, 4).map(video => (
                  <VideoCard key={video.id} video={video} brands={brands} performers={performers} />
                ))}
              </div>
            )}
          </section>

          {/* ── Featured Performers ──────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-lg font-black text-white mb-3 uppercase tracking-tight">Featured Performers</h2>
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
          <OnboardingFanclubBenefits />

        </div>
      </div>
    </>
  );
}