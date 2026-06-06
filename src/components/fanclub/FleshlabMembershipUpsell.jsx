/**
 * FleshlabMembershipUpsell
 * Visual side-by-side comparison: Performer Fanclub vs FLESHLAB Membership.
 * Used on both coming-soon and active performer fanclub pages.
 */

import { Crown, Lock, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FANCLUB_POINTS = [
  "Exclusive content from this performer",
  "Performer-specific drops & updates",
  "Supports this performer directly",
];

const MEMBERSHIP_POINTS = [
  "Platform-wide FLESHLAB content",
  "Studio drops & archive selections",
  "Early releases across all performers",
  "Bonus clips & member-only extras",
];

export default function FleshlabMembershipUpsell({ performerName, isFanclubComingSoon = false }) {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-6 border-t border-white/6 bg-[#080808]">
      <div className="max-w-[860px] mx-auto">

        {/* Section label */}
        <div className="text-center mb-8">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Compare your options</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            ONE PERFORMER OR <span className="text-purple-400">THE WHOLE PLATFORM?</span>
          </h2>
        </div>

        {/* Two-card comparison */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* LEFT — Performer Fanclub */}
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              {/* Small performer avatar placeholder */}
              <div className="w-9 h-9 rounded-full bg-rose-600/15 border border-rose-600/30 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-rose-400/60" />
              </div>
              <div>
                <div className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest">Performer Fanclub</div>
                <div className="text-white font-black text-sm leading-tight">
                  {performerName ? `${performerName} Only` : "One Performer"}
                </div>
              </div>
            </div>

            {/* Points */}
            <div className="space-y-2.5 flex-1 mb-5">
              {FANCLUB_POINTS.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-rose-600/15 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-rose-400/70" />
                  </div>
                  <span className="text-white/50 text-sm">{p}</span>
                </div>
              ))}
            </div>

            {/* Status pill */}
            {isFanclubComingSoon ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <Lock className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="text-white/35 text-sm font-bold">Coming Soon</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-rose-600/10 border border-rose-600/25 rounded-xl px-4 py-3">
                <Crown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-rose-300 text-sm font-bold">Available Now</span>
              </div>
            )}
          </div>

          {/* RIGHT — FLESHLAB Membership (highlighted) */}
          <div className="relative bg-gradient-to-br from-[#13101f] to-[#0d0c14] border-2 border-purple-600/50 rounded-2xl p-6 flex flex-col shadow-[0_0_50px_rgba(147,51,234,0.12)]">

            {/* Recommended badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                Available Now
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-600/40 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] font-black text-purple-400/70 uppercase tracking-widest">FLESHLAB Membership</div>
                <div className="text-white font-black text-sm leading-tight">Platform-Wide Access</div>
              </div>
            </div>

            {/* Points */}
            <div className="space-y-2.5 flex-1 mb-5">
              {MEMBERSHIP_POINTS.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                  <span className="text-white/65 text-sm">{p}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={() => navigate('/fanclub')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl h-auto py-3.5 text-sm w-full"
            >
              <Crown className="w-4 h-4 mr-2" />
              Explore FLESHLAB Membership
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}