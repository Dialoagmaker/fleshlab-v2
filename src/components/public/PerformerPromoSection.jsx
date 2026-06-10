import React from "react";
import { Play } from "lucide-react";

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
      {/* Two-column card: text left, image right */}
      <div className="relative overflow-hidden rounded-[22px] border border-rose-600/25 shadow-2xl shadow-rose-900/25 bg-gradient-to-br from-[#100606] via-[#0d0505] to-[#0a0a0a]">
        {/* Ambient glow */}
        <div className="absolute top-0 left-0 w-64 h-full bg-rose-700/12 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1.3fr] items-stretch">
          {/* LEFT: text + CTA */}
          <div className="flex flex-col justify-center px-8 sm:px-12 py-10 lg:py-12">
            {/* Eyebrow */}
            <p className="text-rose-500 text-[10px] font-bold uppercase tracking-[0.22em] mb-3">
              {promo.eyebrow}
            </p>
            {/* Name + title stacked */}
            <h2
              className="text-white font-black uppercase leading-[0.9] mb-1"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)' }}
            >
              {promo.name}
            </h2>
            <p
              className="font-extrabold uppercase text-rose-400 leading-tight mb-5"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.7rem)' }}
            >
              {promo.promoTitle}
            </p>
            <div className="w-10 h-0.5 bg-gradient-to-r from-rose-600 to-rose-400 rounded-full mb-5" />
            {/* CTA */}
            <a href={promo.ctaHref}>
              <span className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-rose-600/40 transition-colors text-base">
                <Play className="w-5 h-5 fill-current" />
                {promo.ctaLabel}
              </span>
            </a>
          </div>

          {/* RIGHT: performer image — object-top so face always shows */}
          <div className="relative h-[260px] md:h-auto overflow-hidden">
            <img
              src={promo.imageUrl}
              alt={promo.imageAlt}
              loading="lazy"
              className={`w-full h-full object-cover ${promo.imageFocal || 'object-top'} transition-transform duration-500 hover:scale-[1.02]`}
            />
            {/* Feather left edge into card bg */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#100606] to-transparent hidden md:block" />
          </div>
        </div>
      </div>
    </section>
  );
}