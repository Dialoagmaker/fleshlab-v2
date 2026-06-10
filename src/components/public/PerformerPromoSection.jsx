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
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <a
        href={promo.ctaHref}
        aria-label={`${promo.name} ${promo.promoTitle} — watch now`}
        className="block group"
      >
        <div
          className="relative overflow-hidden rounded-[24px] border border-rose-600/20 shadow-2xl shadow-rose-900/20 hover:shadow-rose-900/30 hover:border-rose-600/35 transition-all duration-300"
          style={{ height: 'clamp(240px, 26vw, 400px)' }}
        >
          {/* Background image */}
          <img
            src={promo.imageUrl}
            alt={promo.imageAlt}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover ${promo.imageFocal || 'object-center'} group-hover:scale-[1.02] transition-transform duration-500`}
          />

          {/* Dark gradient — left to center */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060606] via-[#0a0a0af0] via-45% to-transparent" />

          {/* Ambient red glow behind text */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-64 bg-rose-700/20 rounded-full blur-[90px] pointer-events-none" />

          {/* Text overlay — left aligned */}
          <div className="absolute inset-0 flex items-center px-8 sm:px-14">
            <div className="max-w-[52%] sm:max-w-[42%] space-y-2 sm:space-y-3">
              {/* Eyebrow */}
              <p className="text-rose-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em]">
                {promo.eyebrow}
              </p>

              {/* Performer name */}
              <h2
                className="text-white font-black uppercase leading-none"
                style={{ fontSize: 'clamp(1.4rem, 3.2vw, 2.7rem)' }}
              >
                {promo.name}
              </h2>

              {/* Promo title */}
              <p
                className="font-extrabold uppercase leading-tight text-rose-400"
                style={{ fontSize: 'clamp(1rem, 2.2vw, 1.85rem)' }}
              >
                {promo.promoTitle}
              </p>

              {/* Divider */}
              <div className="w-10 h-0.5 bg-gradient-to-r from-rose-600 to-rose-400 rounded-full" />

              {/* CTA button */}
              <div className="pt-1">
                <span className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-sm sm:text-base font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/35 transition-colors">
                  <Play className="w-4 h-4 fill-current" />
                  {promo.ctaLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </a>
    </section>
  );
}