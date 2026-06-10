import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Film, Crown, Play, Star, Lock, Zap, Sparkles, ShieldCheck, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

const BENEFIT_CHIPS = [
  { icon: Crown, label: "Exclusive Scenes" },
  { icon: Zap,   label: "Fanclub-Only Drops" },
  { icon: Star,  label: "Early Access" },
  { icon: Film,  label: "Bonus Content" },
];

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

  const totalRuntime = performerVideos.reduce((acc, v) => acc + (v.duration_seconds || 0), 0);
  const totalMins = totalRuntime > 0 ? Math.round(totalRuntime / 60) : null;
  const exclusiveCount = performerVideos.filter(v => v.is_exclusive || v.access_tier === 'fanclub').length;

  return (
    <div className="relative overflow-hidden bg-[#060606]">
      {/* Deep luxury background layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Crimson ambient glow — left */}
        <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-rose-900/25 rounded-full blur-[180px]" />
        {/* Gold accent glow — right */}
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-amber-900/15 rounded-full blur-[160px]" />
        {/* Center vignette depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(120,10,20,0.12)_0%,transparent_65%)]" />
        {/* Fine noise texture */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      {/* Top bar — back nav + studio tag */}
      <div className="relative z-10 max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 pb-0 flex items-center justify-between">
        <Link
          to="/performers"
          className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-xs font-medium group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          All Performers
        </Link>
        <div className="flex items-center gap-2">
          {performer.verified && (
            <span className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/40 text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Verified 18+
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-700/30 text-rose-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" /> FLESHLAB Studios
          </span>
        </div>
      </div>

      {/* Hero grid */}
      <div className="relative z-10 max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-0">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-0 lg:gap-12 items-center">

          {/* LEFT — VIP offer copy */}
          <div className="order-2 lg:order-1 pb-10 lg:pb-16 space-y-6">

            {/* VIP status strip */}
            {fanclubOrExclusive && (
              <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-950/70 to-rose-950/70 border border-amber-700/35 rounded-full px-4 py-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-xs font-black uppercase tracking-[0.18em]">VIP Fanclub Available</span>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              </div>
            )}

            {/* Main headline */}
            <div>
              <h1 className="font-black text-white uppercase leading-[0.88] tracking-[-0.01em] mb-3" style={{ fontSize: 'clamp(3rem,6.5vw,5.5rem)' }}>
                {performer.display_name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-rose-600" />
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">{identityLine}</p>
              </div>
            </div>

            {/* Premium pitch — 1-liner */}
            <p className="text-white/55 text-base sm:text-lg leading-relaxed max-w-lg font-light">
              {performer.bio
                ? performer.bio.split('.')[0] + '.'
                : seoIntro || `${performer.display_name} — exclusive premium scenes, fanclub drops, and member-only content you won't find anywhere else.`}
            </p>

            {/* Benefit chips */}
            <div className="flex flex-wrap gap-2">
              {BENEFIT_CHIPS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.09] text-white/55 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm"
                >
                  <Icon className="w-3 h-3 text-rose-400" />
                  {label}
                </span>
              ))}
            </div>

            {/* Stats strip */}
            {performerVideos.length > 0 && (
              <div className="flex items-center gap-6 border-l-2 border-rose-700/50 pl-5">
                <div>
                  <div className="text-white font-black text-3xl leading-none">{performerVideos.length}</div>
                  <div className="text-white/35 text-[11px] uppercase tracking-widest mt-1">Scenes</div>
                </div>
                {exclusiveCount > 0 && (
                  <div>
                    <div className="text-amber-400 font-black text-3xl leading-none">{exclusiveCount}</div>
                    <div className="text-white/35 text-[11px] uppercase tracking-widest mt-1">Exclusive</div>
                  </div>
                )}
                {totalMins && (
                  <div>
                    <div className="text-white font-black text-3xl leading-none">{totalMins}m</div>
                    <div className="text-white/35 text-[11px] uppercase tracking-widest mt-1">Runtime</div>
                  </div>
                )}
                {performerBrand && (
                  <div className="hidden sm:block">
                    <div className="text-white font-black text-sm leading-none">{performerBrand.name}</div>
                    <div className="text-white/35 text-[11px] uppercase tracking-widest mt-1">Studio</div>
                  </div>
                )}
              </div>
            )}

            {/* CTA hierarchy */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* PRIMARY: Fanclub / exclusive access */}
              {fanclubOrExclusive ? (
                <Button
                  onClick={onJoinFanclub}
                  className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700 hover:from-amber-500 hover:via-rose-500 hover:to-rose-600 text-white h-14 px-8 text-sm font-black shadow-2xl shadow-rose-700/40 gap-2.5 rounded-2xl group"
                >
                  <Crown className="w-5 h-5" />
                  {isAuthenticated
                    ? `Join VIP Fanclub — $${FANCLUB_PLANS.fanclub_monthly.promoPrice}/mo`
                    : 'Unlock VIP Fanclub Access'}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  {/* shimmer */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Button>
              ) : performerVideos.length > 0 ? (
                <Button
                  onClick={onWatchVideos}
                  className="relative overflow-hidden bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white h-14 px-8 text-sm font-black shadow-2xl shadow-rose-700/40 gap-2.5 rounded-2xl group"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {isAuthenticated ? 'Watch Exclusive Scenes' : 'Get Access — Free Account'}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Button>
              ) : null}

              {/* SECONDARY: Watch scenes */}
              {fanclubOrExclusive && performerVideos.length > 0 && (
                <Button
                  onClick={onWatchVideos}
                  variant="outline"
                  className="border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/[0.09] hover:text-white h-14 px-7 text-sm font-semibold gap-2 rounded-2xl"
                >
                  <Play className="w-4 h-4" />
                  Browse Scenes
                </Button>
              )}
            </div>

            {/* Locked exclusive teaser */}
            {hasExclusiveVideos && (
              <div className="flex items-center gap-2 text-amber-500/70 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>{exclusiveCount} exclusive scene{exclusiveCount !== 1 ? 's' : ''} locked behind fanclub access</span>
              </div>
            )}
          </div>

          {/* RIGHT — Performer portrait */}
          <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
            {/* Premium portrait frame */}
            <div className="relative w-full max-w-[420px] lg:max-w-none">
              {/* Gold/crimson glow ring */}
              <div className="absolute -inset-[3px] rounded-[28px] bg-gradient-to-br from-amber-600/60 via-rose-600/40 to-purple-700/30 blur-[2px]" />
              <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-amber-500/20 via-rose-600/15 to-transparent" />

              <div className="relative rounded-[26px] overflow-hidden bg-[#0c0808] shadow-[0_40px_80px_rgba(120,10,20,0.5)]">
                <div className="aspect-[3/4] relative">
                  {performer.profile_image_url || performer.cover_image_url ? (
                    <img
                      src={performer.profile_image_url || performer.cover_image_url}
                      alt={`${performer.display_name.replace(/_/g, ' ')} - ${performer.nationality ? performer.nationality.split(',')[0].trim().toLowerCase().replace(/philippines/i, 'Filipino') + ' ' : ''}gay performer - FLESHLAB Studios`}
                      className="w-full h-full object-cover object-top"
                      loading="eager"
                      fetchPriority="high"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a0808] to-[#0a0a0a]">
                      <Users className="w-24 h-24 text-white/8" />
                    </div>
                  )}

                  {/* Bottom cinematic gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080404]/85 via-[#080404]/20 to-transparent" />

                  {/* VIP crown badge — top right */}
                  {fanclubOrExclusive && (
                    <div className="absolute top-4 right-4 bg-gradient-to-br from-amber-500/90 to-amber-700/90 backdrop-blur-md rounded-xl p-2.5 shadow-xl shadow-amber-900/60 border border-amber-400/30">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* Bottom identity strip */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-white font-black text-2xl leading-none tracking-tight">{performer.display_name}</div>
                        {performer.nationality && (
                          <div className="text-white/45 text-xs mt-1 font-medium">{performer.nationality.split(',')[0].trim()}</div>
                        )}
                      </div>
                      {performerVideos.length > 0 && (
                        <div className="bg-rose-600/90 backdrop-blur-md rounded-xl px-3.5 py-2 text-center shadow-lg shadow-rose-900/60 border border-rose-500/30">
                          <div className="text-white font-black text-xl leading-none">{performerVideos.length}</div>
                          <div className="text-rose-200/70 text-[9px] uppercase tracking-widest mt-0.5">Scenes</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating exclusive scenes card */}
              {exclusiveCount > 0 && (
                <div className="absolute -bottom-4 -left-4 bg-[#0d0808] border border-amber-600/35 rounded-2xl px-4 py-3 shadow-2xl shadow-amber-900/30 backdrop-blur-sm hidden lg:flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-600/20 rounded-xl flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-white font-black text-sm leading-none">{exclusiveCount} Exclusive</div>
                    <div className="text-white/40 text-xs mt-0.5">Fanclub scenes</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}