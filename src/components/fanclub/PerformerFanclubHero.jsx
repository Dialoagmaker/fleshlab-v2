/**
 * PerformerFanclubHero
 * Strong conversion hero for /fanclub?performer=<slug>
 * Cinematic, performer-first, above-the-fold offer.
 */

import { Crown, Lock, Shield, Zap, Check, Tag } from "lucide-react";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

export default function PerformerFanclubHero({ performer, ctaSlot, onExploreMembership }) {
  const plan = FANCLUB_PLANS.fanclub_monthly;
  const name = performer.display_name;
  const bg = performer.cover_image_url || performer.profile_image_url;

  return (
    <div className="relative min-h-[100vh] flex items-end overflow-hidden">

      {/* Full-bleed background */}
      {bg ? (
        <div className="absolute inset-0 z-0">
          <img
            src={bg}
            alt={name}
            className="w-full h-full object-cover object-top scale-105"
            style={{ filter: "brightness(0.45)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-[#080808]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/90 via-[#080808]/40 to-transparent" />
          {/* Red glow */}
          <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-rose-700/20 rounded-full blur-[120px] pointer-events-none" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[#080808]">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-900/25 via-transparent to-purple-900/10" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-rose-700/20 rounded-full blur-[120px]" />
        </div>
      )}

      {/* Bottom edge fade */}
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[#080808] to-transparent z-10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 pb-20 pt-36 lg:pb-24">
        <div className="max-w-2xl">

          {/* Performer identity */}
          <div className="flex items-center gap-3 mb-7">
            {performer.profile_image_url && (
              <div className="relative flex-shrink-0">
                <img
                  src={performer.profile_image_url}
                  alt={name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-rose-500/70 shadow-2xl shadow-rose-900/50"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center border-2 border-[#080808]">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <div className="inline-flex items-center gap-1.5 bg-rose-600/20 border border-rose-500/40 rounded-full px-3 py-1 w-fit">
                <Lock className="w-3 h-3 text-rose-400" />
                <span className="text-rose-300 text-[11px] font-black uppercase tracking-widest">Members Only</span>
              </div>
              <span className="text-white/40 text-xs font-medium">FLESHLAB Performer Fanclub</span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight mb-4">
            <span className="text-white">{name}</span>
            <br />
            <span className="text-rose-500">Fanclub</span>
          </h1>

          {/* Subheadline */}
          <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-3 max-w-xl font-medium">
            The public page is only the preview.
          </p>
          <p className="text-white/50 text-base leading-relaxed mb-8 max-w-lg">
            Private drops, member-only scenes and behind-the-scenes updates from {name}. Get closer to {name}'s private side — and support him directly.
          </p>

          {/* Summer promo badge */}
          {plan?.promoEligible && (
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 text-sm font-bold">Summer Studio Special — 50% off for the first 3 months</span>
            </div>
          )}

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-start gap-3 mb-4">
            <div className="w-full sm:w-auto sm:min-w-[280px]">
              {ctaSlot}
            </div>
          </div>

          {/* Price clarity */}
          <p className="text-white/25 text-xs mb-7">
            $9.99/month for the first 3 months, then $19.99/month unless cancelled. Cancel anytime.
          </p>

          {/* Trust row */}
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