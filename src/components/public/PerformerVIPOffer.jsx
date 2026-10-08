/**
 * PerformerVIPOffer — dedicated VIP / Fanclub membership pitch block
 * Placed between Hero and Featured Scene on performer pages.
 * Shows only when fanclubOrExclusive === true.
 */
import React from "react";
import { Crown, Lock, Zap, Star, Check, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

const PERKS = [
  { icon: Lock,  headline: "Members-Only Scenes",   sub: "Content that never goes public" },
  { icon: Zap,   headline: "Early Drops",            sub: "Before general release" },
  { icon: Star,  headline: "Bonus Clips",            sub: "Behind the scenes & extras" },
  { icon: Crown, headline: "Fanclub Exclusives",     sub: "Dedicated fanclub releases" },
];

export default function PerformerVIPOffer({ performerName, isAuthenticated, onJoinFanclub, fanclubOrExclusive }) {
  if (!fanclubOrExclusive) return null;

  return (
    <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
      <div className="relative overflow-hidden rounded-[28px] border border-amber-700/25 bg-gradient-to-br from-[#0e0806] via-[#0c0606] to-[#090909] shadow-2xl shadow-amber-900/15">

        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-900/20 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-900/15 rounded-full blur-[100px]" />
          {/* Decorative top border glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
        </div>

        <div className="relative z-10 p-8 lg:p-12">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-center">

            {/* LEFT — offer copy */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 bg-amber-900/40 border border-amber-700/40 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 text-[11px] font-black uppercase tracking-[0.2em]">VIP Fanclub Access</span>
              </div>

              {/* Headline */}
              <h2 className="font-black text-white uppercase leading-[0.9] mb-4" style={{ fontSize: 'clamp(2rem,4vw,3.5rem)' }}>
                Unlock{" "}
                <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                  {performerName}
                </span>
                <br />VIP Access
              </h2>

              {/* Value proposition */}
              <p className="text-white/50 text-base leading-relaxed mb-7 max-w-md">
                Get access to exclusive member-only scenes, behind-the-scenes drops, early releases, and bonus content that never appears on the public side.
              </p>

              {/* Price & CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <Button
                  onClick={onJoinFanclub}
                  className="relative overflow-hidden bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 text-white h-14 px-8 text-sm font-black rounded-2xl shadow-2xl shadow-rose-800/40 gap-2.5 group"
                >
                  <Crown className="w-5 h-5" />
                  {isAuthenticated
                    ? `Join Fanclub — $${FANCLUB_PLANS.fanclub_monthly.promoPrice}/mo`
                    : 'Unlock VIP Access'}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Button>
                <div className="text-white/30 text-xs leading-relaxed">
                  Cancel anytime<br />No contracts
                </div>
              </div>

              {/* Trust line */}
              <div className="flex items-center gap-2 text-white/25 text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-500/70" />
                Supports {performerName} directly
              </div>
            </div>

            {/* RIGHT — perks grid */}
            <div className="grid grid-cols-2 gap-3">
              {PERKS.map(({ icon: Icon, headline, sub }, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-[18px] border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 p-5"
                >
                  {/* Glow on hover */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-700/0 group-hover:bg-rose-700/15 rounded-full blur-[30px] transition-all duration-500" />
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-900/60 to-amber-900/40 border border-rose-700/30 rounded-xl flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-white font-bold text-sm leading-tight mb-1">{headline}</div>
                    <div className="text-white/35 text-xs leading-relaxed">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}