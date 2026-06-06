/**
 * PerformerFanclubHero
 *
 * Personalized hero section shown when visiting /fanclub?performer=<slug>.
 * Displays performer avatar, cover image, name, personalized headline, benefits and CTA.
 * Phase A only — CTA wires into existing FanclubCTA behavior, no performer_id passed to checkout yet.
 */

import { Crown, Check, Shield, Zap, Film, Star, Heart, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PerformerBadges from "@/components/public/PerformerBadges";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

const PERFORMER_BENEFITS = [
  { icon: Film,   text: "Exclusive performer content drops" },
  { icon: Star,   text: "Selected fanclub scenes" },
  { icon: Crown,  text: "Behind-the-scenes moments" },
  { icon: Zap,    text: "Early access where available" },
  { icon: Heart,  text: "Support this performer directly" },
  { icon: Check,  text: "Member-only updates from this performer" },
];

export default function PerformerFanclubHero({ performer, ctaSlot }) {
  const plan = FANCLUB_PLANS.fanclub_monthly;
  const name = performer.display_name;

  return (
    <div className="relative overflow-hidden">
      {/* Cover image background */}
      {performer.cover_image_url && (
        <div className="absolute inset-0 z-0">
          <img
            src={performer.cover_image_url}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#080808]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>
      )}
      {/* Ambient glow fallback if no cover */}
      {!performer.cover_image_url && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-rose-700/12 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-700/8 rounded-full blur-[100px]" />
        </div>
      )}

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — performer identity + offer */}
          <div>
            {/* Performer identity row */}
            <div className="flex items-center gap-5 mb-8">
              {performer.profile_image_url && (
                <div className="relative flex-shrink-0">
                  <img
                    src={performer.profile_image_url}
                    alt={name}
                    className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover border-2 border-rose-500/50 shadow-xl shadow-black/50"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-rose-600 rounded-full flex items-center justify-center border-2 border-[#080808]">
                    <Crown className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )}
              <div>
                <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
                  Performer Fanclub
                </div>
                <div className="text-white font-black text-2xl lg:text-3xl leading-tight">{name}</div>
                {performer.verified && (
                  <div className="text-rose-400 text-xs font-semibold mt-0.5">✓ Verified FLESHLAB Performer</div>
                )}
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight mb-4">
              JOIN{" "}
              <span className="text-rose-500">{name.toUpperCase()}</span>
              <br />
              <span className="text-white/70">FANCLUB</span>
            </h1>

            <p className="text-lg text-white/55 leading-relaxed mb-6 max-w-lg">
              Support {name} and unlock exclusive fanclub updates, drops and selected scenes. Direct access to {name}'s member-only content.
            </p>

            {/* Performer badges */}
            <div className="mb-7">
              <PerformerBadges performer={performer} />
            </div>

            {/* Promo price callout */}
            {plan.promoEligible && (
              <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-4 py-1.5 mb-5">
                <span className="text-amber-300 text-sm font-bold">
                  Summer Studio Special — 50% off for the first 3 months
                </span>
              </div>
            )}

            {/* CTA slot (injected from parent) */}
            <div className="mb-4">
              {ctaSlot}
            </div>

            <p className="text-white/30 text-xs">
              ${plan.promoPrice}/month for the first 3 months, then ${plan.regularPrice}/month unless cancelled.
            </p>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/35 text-sm mt-5">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Verified 18+ performer
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Secure crypto checkout
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Access after payment confirmation
              </span>
            </div>
          </div>

          {/* Right — offer card + benefits */}
          <div className="lg:max-w-md">
            <div className="bg-gradient-to-br from-[#1a0808]/90 via-[#120606]/90 to-[#0d0404]/90 backdrop-blur-sm border-2 border-rose-600/50 rounded-2xl p-7 shadow-[0_0_60px_rgba(220,38,38,0.2)]">
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs font-bold tracking-widest text-rose-500/70 uppercase mb-0.5">
                    Performer Fanclub
                  </div>
                  <div className="font-black text-white text-lg">{name} Fanclub</div>
                </div>
                <Badge className="bg-rose-600 text-white border-0 text-xs font-black px-3 py-1 uppercase tracking-wide">
                  Monthly
                </Badge>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black text-white">${plan.promoPrice}</span>
                <span className="text-white/45 text-base">/month</span>
              </div>
              <div className="flex items-center gap-2 mb-5">
                <span className="line-through text-white/30 text-sm">${plan.regularPrice}/month</span>
                <span className="bg-rose-600/20 text-rose-400 text-xs font-bold px-2 py-0.5 rounded">50% OFF</span>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                {PERFORMER_BENEFITS.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-600/20 flex items-center justify-center shrink-0">
                      <Icon className="w-3 h-3 text-rose-400" />
                    </div>
                    <span className="text-white/65 text-sm">{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA injected */}
              <div className="w-full">
                {ctaSlot}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}