/**
 * PerformerFanclubComingSoon
 *
 * Shown when a performer exists but fanclub_enabled is false.
 * Offers FLESHLAB Membership as an alternative.
 */

import { Crown, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PerformerFanclubComingSoon({ performer }) {
  const navigate = useNavigate();
  const name = performer.display_name;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        {/* Performer avatar */}
        {performer.profile_image_url && (
          <img
            src={performer.profile_image_url}
            alt={name}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/20 mx-auto mb-6"
          />
        )}

        <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 rounded-full px-4 py-1.5 mb-5">
          <Clock className="w-4 h-4 text-white/50" />
          <span className="text-white/60 text-sm font-bold tracking-wide">Coming Soon</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
          {name.toUpperCase()} FANCLUB<br />
          <span className="text-white/40">IS COMING SOON</span>
        </h1>

        <p className="text-white/50 text-base leading-relaxed mb-8">
          {name}'s dedicated fanclub is not yet available. In the meantime, explore FLESHLAB Membership for platform-wide access to FLESHLAB Membership content.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => navigate('/fanclub')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold px-8 py-4 rounded-xl h-auto"
          >
            <Crown className="w-4 h-4 mr-2" />
            Explore FLESHLAB Membership
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            onClick={() => navigate(`/performers/${performer.slug}`)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/8 px-8 py-4 rounded-xl h-auto"
          >
            View {name}'s Profile
          </Button>
        </div>
      </div>
    </div>
  );
}