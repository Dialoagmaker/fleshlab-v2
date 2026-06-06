/**
 * PerformerFanclubHero
 * Cinematic, performer-first hero for /fanclub?performer=<slug>
 * Phase A — no checkout logic changes
 */

import { Crown, Lock, Shield, Zap, Check } from "lucide-react";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

export default function PerformerFanclubHero({ performer, ctaSlot }) {
  const plan = FANCLUB_PLANS.fanclub_monthly;
  const name = performer.display_name;
  const bg = performer.cover_image_url || performer.profile_image_url;

  return (
    <div className="relative min-h-[92vh] flex items-end overflow-hidden">

      {/* Full-bleed background */}
      {bg ? (
        <div className="absolute inset-0 z-0">
          <img src={bg} alt={name} className="w-full h-full object-cover object-top scale-105" style={{ filter: "brightness(0.55)" }} />
          {/* Cinematic gradient layers */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[#080808]">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-900/20 via-transparent to-purple-900/10" />
        </div>
      )}

      {/* Vignette bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#080808] to-transparent z-10 pointer-events-none" />

      {/* Content — sits at bottom of hero */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 pb-16 pt-32 lg:pb-20">
        <div className="max-w-2xl">

          {/* Performer badge row */}
          <div className="flex items-center gap-3 mb-6">
            {performer.profile_image_url && bg !== performer.profile_image_url && (
              <div className="relative flex-shrink-0">
                <img
                  src={performer.profile_image_url}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-rose-500/60 shadow-2xl"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center border-2 border-[#080808]">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5 bg-rose-600/20 border border-rose-500/40 rounded-full px-3 py-1 w-fit">
                <Crown className="w-3 h-3 text-rose-400" />
                <span className="text-rose-300 text-[11px] font-black uppercase tracking-widest">Performer Fanclub</span>
              </div>
              {performer.verified && (
                <span className="text-white/40 text-xs">✓ Verified FLESHLAB Performer</span>
              )}
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight mb-5">
            <span className="text-white">{name}</span>
            <br />
            <span className="text-rose-500">Fanclub</span>
          </h1>

          <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
            Exclusive updates, private drops and selected member-only scenes from {name}. This is the member side — not the public preview.
          </p>

          {/* Promo tag */}
          {plan.promoEligible && (
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="text-amber-300 text-sm font-bold">Summer Studio Special — 50% off for 3 months</span>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-start gap-3 mb-6">
            <div className="w-full sm:w-auto sm:min-w-[260px]">
              {ctaSlot}
            </div>
          </div>

          {/* Trust micro-row */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/30 text-xs">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-rose-500/50 shrink-0" />Verified 18+ performer
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-rose-500/50 shrink-0" />Secure crypto checkout
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-rose-500/50 shrink-0" />Access after payment confirmation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}