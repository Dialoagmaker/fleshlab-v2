import React from "react";
import { Play, Flame } from "lucide-react";

/**
 * Performer-specific promo banner section.
 * Add new performer banners to the PROMO_BANNERS map below.
 * Returns null cleanly if no banner exists for the performer.
 */

const PROMO_BANNERS = {
  'the-fitmaster': {
    imageUrl: "https://video.fleshlab.online/banner%20and%20logos/ChatGPT%20Image%2010.%20Juni%202026%2C%2019_11_31.png",
    imageAlt: "The_Fitmaster Summer Special promo banner",
    eyebrow: "Exclusive · FLESHLAB Studios",
    name: "The_Fitmaster",
    promoTitle: "Summer Special",
    ctaLabel: "Watch Now",
    ctaHref: "#videos",
    imageFocal: "object-right-top",
  },
  // Add more performers here:
  // 'jameson': { imageUrl: '...', ... },
};

export default function PerformerPromoSection({ slug }) {
  const promo = PROMO_BANNERS[slug];
  if (!promo) return null;

  return (
    <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-4">
      {/* Campaign label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/6 to-transparent" />
        <div className="flex items-center gap-2 bg-[#0f0808] border border-amber-700/30 rounded-full px-4 py-1.5">
          <Flame className="w-3 h-3 text-amber-500" />
          <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Active Campaign</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/6 to-transparent" />
      </div>

      {/* Campaign card — premium cinematic style */}
      <div className="relative overflow-hidden rounded-[24px] border border-amber-700/20 bg-[#0a0605] shadow-2xl shadow-amber-950/30">
        {/* Glows */}
        <div className="absolute top-0 left-0 w-80 h-full bg-rose-950/60 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/35 to-transparent" />

        <div className="relative z-10 grid md:grid-cols-[1fr_1.2fr] items-stretch">
          {/* LEFT: copy + CTA */}
          <div className="flex flex-col justify-center px-8 sm:px-12 py-10 lg:py-14">
            {/* Campaign eyebrow */}
            <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-700/35 rounded-full px-3.5 py-1.5 mb-5 self-start">
              <Flame className="w-3 h-3 text-amber-400" />
              <span className="text-amber-300 text-[10px] font-black uppercase tracking-[0.18em]">{promo.eyebrow}</span>
            </div>
            {/* Name */}
            <h2 className="text-white font-black uppercase leading-[0.88] mb-1.5" style={{ fontSize: 'clamp(2rem,4vw,3.5rem)' }}>
              {promo.name}
            </h2>
            {/* Campaign title */}
            <p className="font-black uppercase text-rose-400 leading-tight mb-6" style={{ fontSize: 'clamp(1.1rem,2.2vw,1.9rem)' }}>
              {promo.promoTitle}
            </p>
            <div className="w-12 h-[2px] bg-gradient-to-r from-amber-500 to-rose-600 rounded-full mb-6" />
            {/* CTA */}
            <a href={promo.ctaHref}>
              <span className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 text-white font-black px-8 py-4 rounded-xl shadow-2xl shadow-rose-900/50 transition-all text-base">
                <Play className="w-5 h-5 fill-current" />
                {promo.ctaLabel}
              </span>
            </a>
          </div>

          {/* RIGHT: performer image */}
          <div className="relative h-[280px] md:h-auto overflow-hidden">
            <img
              src={promo.imageUrl}
              alt={promo.imageAlt}
              loading="lazy"
              className={`w-full h-full object-cover ${promo.imageFocal || 'object-top'} transition-transform duration-700 hover:scale-[1.03]`}
            />
            {/* Left feather */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0605] to-transparent hidden md:block" />
            {/* Bottom feather */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0605] to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}