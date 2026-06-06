/**
 * FleshlabMembershipUpsell
 *
 * Shown below the performer fanclub hero on /fanclub?performer=<slug> pages.
 * Explains FLESHLAB Membership as a distinct higher-tier platform-wide product.
 * Phase A only — no checkout wiring for fleshlab_membership product type yet.
 */

import { Crown, Check, ArrowRight, Film, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

const MEMBERSHIP_BENEFITS = [
  { icon: Film,  text: "All FLESHLAB Membership content — not just one performer" },
  { icon: Star,  text: "Studio drops, archive selections, early releases" },
  { icon: Crown, text: "Platform-wide access across the FLESHLAB catalog" },
  { icon: Zap,   text: "Bonus clips and studio-produced member content" },
  { icon: Check, text: "Supports the studio and all its performers" },
];

export default function FleshlabMembershipUpsell({ performerName }) {
  const navigate = useNavigate();
  // Phase A: premium_monthly is the closest existing plan until fleshlab_membership is wired
  const plan = FANCLUB_PLANS.premium_monthly;

  return (
    <section className="py-16 px-6 border-t border-white/6 bg-gradient-to-b from-[#0d0d0d] to-[#080808]">
      <div className="max-w-[900px] mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-600/15 border border-purple-600/30 rounded-full px-4 py-1.5 mb-5">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-bold tracking-widest uppercase">FLESHLAB Membership</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            WANT ACCESS{" "}
            <span className="text-purple-400">BEYOND ONE PERFORMER?</span>
          </h2>
          <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed">
            {performerName
              ? `${performerName} Fanclub gives you that performer's exclusive content. FLESHLAB Membership is different — it's platform-wide access to all FLESHLAB Membership content.`
              : "FLESHLAB Membership is platform-wide access to all FLESHLAB Membership content — not tied to any one performer."}
          </p>
        </div>

        {/* Comparison card */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">

          {/* Performer Fanclub — summary */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-rose-600/15 flex items-center justify-center">
                <Crown className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-rose-400/70 uppercase tracking-widest">Performer Fanclub</div>
                <div className="text-white font-bold text-sm">{performerName ? `${performerName} Only` : "One Performer"}</div>
              </div>
            </div>
            <p className="text-white/45 text-sm leading-relaxed">
              Exclusive content from this performer specifically. Revenue goes to support {performerName || "this performer"} directly.
            </p>
            <div className="text-white/30 text-xs mt-auto pt-2 border-t border-white/6">
              Does not include other performers' fanclub content or FLESHLAB Membership content unless marked included.
            </div>
          </div>

          {/* FLESHLAB Membership — upsell */}
          <div className="bg-gradient-to-br from-[#12101c] to-[#0d0d12] border-2 border-purple-600/40 rounded-2xl p-6 flex flex-col gap-3 shadow-[0_0_40px_rgba(147,51,234,0.10)]">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-purple-400/70 uppercase tracking-widest">FLESHLAB Membership</div>
                <div className="text-white font-bold text-sm">Platform-Wide Access</div>
              </div>
            </div>

            <div className="space-y-2">
              {MEMBERSHIP_BENEFITS.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                  <span className="text-white/60 text-xs leading-relaxed">{text}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-white">${plan.promoPrice}</span>
              <span className="text-white/40 text-sm">/month</span>
              <span className="line-through text-white/25 text-sm ml-1">${plan.regularPrice}</span>
            </div>

            <Button
              onClick={() => navigate('/fanclub')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl h-auto py-3 text-sm w-full"
            >
              <Crown className="w-4 h-4 mr-2" />
              Explore FLESHLAB Membership
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-white/20 text-[10px] text-center leading-relaxed">
              FLESHLAB Membership includes FLESHLAB Membership content only — not every video, PPV item or private performer fanclub content unless marked as included.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}