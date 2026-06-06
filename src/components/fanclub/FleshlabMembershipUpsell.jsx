/**
 * FleshlabMembershipUpsell
 * Secondary upsell — clearly positioned below the performer fanclub.
 * FLESHLAB Membership is the "also available" option, not the primary action.
 */

import { ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function FleshlabMembershipUpsell({ performerName, isFanclubComingSoon = false, ctaSlot }) {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-6 border-t border-white/5 bg-[#060404]">
      <div className="max-w-[800px] mx-auto">

        {/* Section hook */}
        <div className="text-center mb-10">
          <p className="text-white/20 text-xs font-black uppercase tracking-widest mb-3">Also available</p>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
            Want more than one performer?
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto">
            {performerName
              ? `${performerName} Fanclub is focused on him. FLESHLAB Membership is platform-wide FLESHLAB member content — not performer-specific.`
              : "FLESHLAB Membership gives platform-wide access. Performer Fanclubs are focused on one performer."}
          </p>
        </div>

        {/* Single FLESHLAB membership card — secondary styling */}
        <div className="relative bg-[#0e0c14] border border-purple-600/25 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-purple-600/15 border border-purple-600/30 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-purple-400/70" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-purple-400/60 text-[10px] font-black uppercase tracking-widest mb-1">FLESHLAB Membership</p>
            <h3 className="text-white font-black text-lg mb-1">Platform-Wide Access</h3>
            <p className="text-white/35 text-sm">Studio drops, archive selections and early releases across all FLESHLAB performers.</p>
          </div>
          <Button
            onClick={() => navigate('/fanclub')}
            variant="outline"
            className="shrink-0 border-purple-600/25 text-white/50 hover:bg-white/5 hover:text-white font-semibold rounded-xl h-auto py-3 px-6 text-sm"
          >
            Explore Membership
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <p className="text-center text-white/15 text-xs mt-5">
          {performerName
            ? `${performerName} Fanclub and FLESHLAB Membership are separate products.`
            : "Fanclubs and FLESHLAB Membership are separate products."}
        </p>
      </div>
    </section>
  );
}