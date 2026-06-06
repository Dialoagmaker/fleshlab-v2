/**
 * PerformerFanclubComingSoon
 * Cinematic coming-soon state for performers with fanclub_enabled=false.
 * Still performer-first — hero bg, locked preview strip, upsell below.
 */

import { Crown, Lock, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LOCKED_TEASER_LABELS = [
  { label: "Private Updates",         icon: Lock },
  { label: "Member Drops",            icon: Lock },
  { label: "Behind the Scenes",       icon: Lock },
  { label: "Selected Fanclub Scenes", icon: Lock },
];

export default function PerformerFanclubComingSoon({ performer, relatedVideos = [] }) {
  const navigate = useNavigate();
  const name = performer.display_name;
  const bg = performer.cover_image_url || performer.profile_image_url;

  // Use video thumbs or performer image as teaser card backgrounds
  const teaserImages = [
    relatedVideos[0]?.primary_thumbnail_url || relatedVideos[0]?.cover_image_url,
    relatedVideos[1]?.primary_thumbnail_url || relatedVideos[1]?.cover_image_url,
    performer.profile_image_url,
    relatedVideos[2]?.primary_thumbnail_url || relatedVideos[2]?.cover_image_url,
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── HERO ── */}
      <div className="relative min-h-[80vh] flex items-end overflow-hidden">

        {/* Full-bleed background */}
        {bg ? (
          <div className="absolute inset-0 z-0">
            <img src={bg} alt={name} className="w-full h-full object-cover object-top scale-105" style={{ filter: "brightness(0.45)" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#150808] to-[#080808]" />
        )}

        {/* Vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#080808] to-transparent z-10 pointer-events-none" />

        {/* Content */}
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 pb-16 pt-32">
          <div className="max-w-2xl">

            {/* Performer identity */}
            <div className="flex items-center gap-3 mb-6">
              {performer.profile_image_url && (
                <img
                  src={performer.profile_image_url}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-xl"
                />
              )}
              <div className="flex flex-col gap-1">
                <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 w-fit">
                  <Crown className="w-3 h-3 text-white/50" />
                  <span className="text-white/60 text-[11px] font-black uppercase tracking-widest">Performer Fanclub</span>
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight mb-5">
              <span className="text-white">{name}</span>
              <br />
              <span className="text-white/30">Fanclub</span>
            </h1>

            {/* Coming soon tag */}
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 rounded-full px-4 py-1.5 mb-5">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white/50 text-sm font-bold tracking-wide uppercase">Coming Soon</span>
            </div>

            <p className="text-white/55 text-xl leading-relaxed mb-2 max-w-lg">
              His fanclub is being prepared.
            </p>
            <p className="text-white/35 text-base leading-relaxed mb-8 max-w-lg">
              Be ready when {name} opens his private member area. Until then, explore FLESHLAB Membership for platform-wide access.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Button
                onClick={() => navigate('/fanclub')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold px-8 py-4 rounded-xl h-auto text-base shadow-xl shadow-purple-600/25"
              >
                <Crown className="w-4 h-4 mr-2" />
                Explore FLESHLAB Membership
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => navigate(`/performers/${performer.slug}`)}
                variant="outline"
                className="border-white/20 text-white/70 hover:bg-white/8 hover:text-white px-8 py-4 rounded-xl h-auto font-semibold text-base"
              >
                Back to {name}'s Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── LOCKED PREVIEW STRIP ── */}
      <section className="py-12 px-6">
        <div className="max-w-[1400px] mx-auto">

          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-4 h-4 text-white/25" />
            <span className="text-white/30 text-sm font-bold uppercase tracking-widest">What opens when {name}'s fanclub launches</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LOCKED_TEASER_LABELS.map(({ label }, i) => {
              const img = teaserImages[i];
              return (
                <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/8 group">
                  {img ? (
                    <img src={img} alt={label} className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent" />
                  )}
                  {/* Heavy blur/lock overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-black/50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Lock badge */}
                  <div className="absolute top-3 right-3">
                    <div className="w-7 h-7 rounded-full bg-black/70 border border-white/20 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-white/50" />
                    </div>
                  </div>

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-white/40 text-xs font-black uppercase tracking-wide">{label}</div>
                    <div className="text-white/20 text-[10px] mt-0.5">Members only</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}