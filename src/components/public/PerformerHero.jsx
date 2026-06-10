import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Film, Verified, Crown, Play, Star, Lock, Zap, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PerformerBadges from "@/components/public/PerformerBadges";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

export default function PerformerHero({
  performer,
  performerVideos,
  performerBrand,
  isAuthenticated,
  hasExclusiveVideos,
  fanclubOrExclusive,
  identityLine,
  seoIntro,
  onWatchVideos,
  onJoinFanclub,
}) {
  const navigate = useNavigate();

  const latestVideo = [...performerVideos].sort(
    (a, b) => new Date(b.release_date || b.created_date || 0) - new Date(a.release_date || a.created_date || 0)
  )[0];

  const totalRuntime = performerVideos.reduce((acc, v) => acc + (v.duration_seconds || 0), 0);
  const totalMins = totalRuntime > 0 ? Math.round(totalRuntime / 60) : null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#080808] via-[#0a0a0a] to-background border-b border-rose-600/15">
      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[15%] w-[600px] h-[600px] bg-rose-700/8 rounded-full blur-[150px]" />
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-orange-700/6 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMTUiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxIiBoZWlnaHQ9IjYwIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12">
        {/* Back nav */}
        <button
          onClick={() => navigate('/performers')}
          className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors mb-8 text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          All Performers
        </button>

        {/* Main hero grid */}
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 xl:gap-16 items-stretch">

          {/* LEFT — Identity & CTAs */}
          <div className="flex flex-col justify-center order-2 lg:order-1 space-y-5">
            {/* Top badges row */}
            <div className="flex flex-wrap gap-2">
              {performer.verified && (
                <span className="inline-flex items-center gap-1.5 bg-rose-600/15 text-rose-300 border border-rose-600/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  <Verified className="w-3.5 h-3.5" /> Verified 18+
                </span>
              )}
              {performer.status === 'active' && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-600/15 text-emerald-400 border border-emerald-600/30 px-3 py-1 rounded-full text-xs font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Active
                </span>
              )}
              {performer.fanclub_enabled && (
                <span className="inline-flex items-center gap-1.5 bg-purple-600/15 text-purple-300 border border-purple-600/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  <Crown className="w-3.5 h-3.5" /> Fanclub
                </span>
              )}
              {hasExclusiveVideos && (
                <span className="inline-flex items-center gap-1.5 bg-amber-600/15 text-amber-300 border border-amber-600/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  <Zap className="w-3.5 h-3.5" /> Exclusive Scenes
                </span>
              )}
            </div>

            {/* Name */}
            <div>
              <h1 className="text-[clamp(2.8rem,6vw,5.5rem)] font-black text-white leading-[0.92] tracking-tight mb-2">
                {performer.display_name}
              </h1>
              <p className="text-white/45 text-sm sm:text-base font-medium">{identityLine}</p>
            </div>

            {/* Tagline / SEO intro */}
            <p className="text-white/65 text-base sm:text-lg leading-relaxed max-w-xl line-clamp-3">
              {performer.bio ? performer.bio.split('.')[0] + '.' : seoIntro}
            </p>

            {/* Quick stats row */}
            {performerVideos.length > 0 && (
              <div className="flex flex-wrap gap-4 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-rose-600/20 rounded-lg flex items-center justify-center">
                    <Film className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg leading-none">{performerVideos.length}</div>
                    <div className="text-white/40 text-xs">Scenes</div>
                  </div>
                </div>
                {totalMins && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-600/20 rounded-lg flex items-center justify-center">
                      <Play className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg leading-none">{totalMins}m</div>
                      <div className="text-white/40 text-xs">Runtime</div>
                    </div>
                  </div>
                )}
                {latestVideo?.release_date && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-600/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm leading-none">
                        {new Date(latestVideo.release_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-white/40 text-xs">Latest Drop</div>
                    </div>
                  </div>
                )}
                {performerBrand && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-600/20 rounded-lg flex items-center justify-center">
                      <Crown className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm leading-none">{performerBrand.name}</div>
                      <div className="text-white/40 text-xs">Studio</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {performerVideos.length > 0 && (
                <Button
                  onClick={onWatchVideos}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white px-7 h-14 text-base font-bold shadow-xl shadow-rose-700/35 gap-2.5 rounded-xl flex-1 sm:flex-none"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {isAuthenticated ? 'Watch Scenes' : 'Create Account to Watch'}
                </Button>
              )}
              {fanclubOrExclusive && (
                <Button
                  onClick={onJoinFanclub}
                  className="bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 border border-purple-600/40 px-7 h-14 text-base font-bold gap-2.5 rounded-xl flex-1 sm:flex-none"
                  variant="outline"
                >
                  <Crown className="w-5 h-5" />
                  {isAuthenticated
                    ? `Join Fanclub — $${FANCLUB_PLANS.fanclub_monthly.promoPrice}/mo`
                    : 'View Fanclub Plans'}
                </Button>
              )}
            </div>

            {/* Unlock exclusive CTA */}
            {hasExclusiveVideos && performerVideos.length > 0 && (
              <Link to="/videos" className="self-start">
                <button className="flex items-center gap-2 text-amber-400/80 hover:text-amber-300 text-sm font-semibold transition-colors group">
                  <Lock className="w-4 h-4" />
                  Unlock Exclusive Scenes
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </Link>
            )}

            {/* Trust badges */}
            <div className="pt-1">
              <PerformerBadges performer={performer} />
            </div>
          </div>

          {/* RIGHT — Hero image */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative">
              {/* Glow border ring */}
              <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-br from-rose-600/50 via-orange-600/20 to-purple-600/20 blur-[1px]" />
              <div className="relative rounded-3xl overflow-hidden bg-[#0a0a0a] shadow-2xl shadow-rose-900/30">
                {/* Portrait image */}
                <div className="aspect-[3/4] lg:aspect-[4/5] xl:aspect-[3/4] relative group">
                  {performer.profile_image_url ? (
                    <img
                      src={performer.profile_image_url}
                      alt={performer.display_name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : performer.cover_image_url ? (
                    <img
                      src={performer.cover_image_url}
                      alt={performer.display_name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                      <Users className="w-24 h-24 text-white/10" />
                    </div>
                  )}

                  {/* Cinematic bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/70 via-transparent to-transparent" />

                  {/* Bottom info strip */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                    <div>
                      <div className="text-white font-black text-2xl leading-none">{performer.display_name}</div>
                      {performer.nationality && (
                        <div className="text-white/50 text-xs mt-1">{performer.nationality.split(',')[0].trim()}</div>
                      )}
                    </div>
                    {performerVideos.length > 0 && (
                      <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2 text-center">
                        <div className="text-white font-black text-xl leading-none">{performerVideos.length}</div>
                        <div className="text-white/50 text-[10px] uppercase tracking-wide mt-0.5">Scenes</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}