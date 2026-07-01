import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { trackEvent, trackOnboardingViewed } from "@/lib/analytics";
import SEOMeta from "@/components/SEOMeta";
import { Play, Star, Users, ChevronRight, Sparkles } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    trackOnboardingViewed();
  }, []);

  const handleChoice = async (path, eventName) => {
    setSelected(path);
    setLoading(true);
    trackEvent(eventName, { source: 'onboarding' });
    trackEvent('onboarding_completed', { action: path });
    try {
      await base44.auth.updateMe({ onboarding_completed: true });
    } catch {}
    setTimeout(() => {
      window.location.href = path;
    }, 400);
  };

  if (!user) return null;

  return (
    <>
      <SEOMeta title="Welcome to FLESHLAB" noIndex={true} />
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-16">
        {/* Decorative top */}
        <div className="mb-8 relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-600/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-3">
          Welcome to FLESHLAB
        </h1>
        <p className="text-white/45 text-base md:text-lg text-center max-w-md mb-10 leading-relaxed">
          Choose what you want to explore first.
        </p>

        {/* CTA Cards */}
        <div className="grid gap-4 w-full max-w-xs md:max-w-lg md:grid-cols-3">
          {/* Fanclub — Primary */}
          <button
            onClick={() => handleChoice("/fanclub", "onboarding_fanclub_clicked")}
            disabled={loading}
            className="group relative bg-gradient-to-br from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 rounded-2xl p-6 text-left transition-all duration-300 shadow-lg shadow-rose-700/20 hover:shadow-rose-600/30 disabled:opacity-60 md:col-span-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider mb-3">
                  <Star className="w-3 h-3 fill-white" />
                  Recommended
                </div>
                <h3 className="text-xl font-black text-white mb-1">Join Fanclub</h3>
                <p className="text-rose-200/80 text-sm">Unlimited exclusive content from $12.99/month</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </button>

          {/* Watch Videos — Secondary */}
          <button
            onClick={() => handleChoice("/videos", "onboarding_videos_clicked")}
            disabled={loading}
            className="group bg-[#111] hover:bg-[#1a1a1a] border border-white/8 hover:border-white/15 rounded-2xl p-5 text-left transition-all duration-300 disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center mb-3">
              <Play className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Watch Videos</h3>
            <p className="text-white/35 text-xs group-hover:text-white/50 transition-colors">Browse our library of exclusive content</p>
          </button>

          {/* Explore Performers — Secondary */}
          <button
            onClick={() => handleChoice("/performers", "onboarding_performers_clicked")}
            disabled={loading}
            className="group bg-[#111] hover:bg-[#1a1a1a] border border-white/8 hover:border-white/15 rounded-2xl p-5 text-left transition-all duration-300 disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Explore Performers</h3>
            <p className="text-white/35 text-xs group-hover:text-white/50 transition-colors">Meet the talent behind the content</p>
          </button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="mt-6 flex items-center gap-2 text-white/40 text-sm">
            <div className="w-4 h-4 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
            Taking you there...
          </div>
        )}
      </div>
    </>
  );
}