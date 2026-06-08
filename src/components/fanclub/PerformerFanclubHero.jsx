/**
 * PerformerFanclubHero
 * Split-image hero: performer image on the right, CTA copy on the left.
 * Performer image is visually dominant. CTA above the fold.
 */

import { Lock, Shield, Tag } from "lucide-react";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

export default function PerformerFanclubHero({ performer, ctaSlot }) {
  // Pricing displayed directly - no promo logic
  const name = performer.display_name;
  const img = performer.profile_image_url || performer.cover_image_url;

  return (
    <section className="relative min-h-screen bg-[#060404] overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-rose-900/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 min-h-screen grid lg:grid-cols-2 gap-0 items-stretch">

        {/* LEFT — copy + CTA */}
        <div className="flex flex-col justify-center py-24 lg:py-0 lg:pr-16">

          {/* Label */}
          <div className="flex items-center gap-2 mb-8">
            <div className="inline-flex items-center gap-1.5 bg-rose-600/20 border border-rose-500/40 rounded-full px-3 py-1">
              <Lock className="w-3 h-3 text-rose-400" />
              <span className="text-rose-300 text-[11px] font-black uppercase tracking-widest">Members Only</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">FLESHLAB Fanclub</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[0.92] tracking-tight mb-5">
            <span className="text-white/55 text-3xl md:text-4xl xl:text-5xl block mb-2 font-black leading-tight">
              The public preview<br />is only the beginning.
            </span>
            <span className="text-white">Unlock {name}'s</span>
            <br />
            <span className="text-rose-500">full fanclub.</span>
          </h1>

          {/* Sub */}
          <p className="text-white/55 text-base md:text-lg leading-relaxed mb-8 max-w-md">
            Get exclusive member-only scenes, behind-the-scenes content, performer updates and early access to selected releases from {name}.
          </p>

          {/* Primary CTA */}
          <div className="mb-3 w-full sm:max-w-sm">
            {ctaSlot}
          </div>

          {/* Price line */}
          <p className="text-white/20 text-xs mb-8">
            $14.99/month unless cancelled. Cancel anytime.
          </p>

          {/* Trust */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-white/25 text-xs">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-rose-500/40 shrink-0" />Verified 18+ performer</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-rose-500/40 shrink-0" />Secure checkout</span>
            <span className="flex items-center gap-1.5">· Instant access after payment</span>
          </div>
        </div>

        {/* RIGHT — performer image, full height */}
        <div className="hidden lg:block relative">
          {img ? (
            <>
              <img
                src={img}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{ filter: "brightness(0.75) contrast(1.1)" }}
              />
              {/* Left fade into dark background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#060404] via-transparent to-transparent" style={{ width: '45%' }} />
              <div className="absolute inset-0 bg-gradient-to-r from-[#060404]/80 to-transparent" />
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#060404] to-transparent" />
              {/* Top fade */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#060404] to-transparent" />

              {/* Floating name badge */}
              <div className="absolute bottom-12 left-8 z-20">
                <div className="bg-black/70 backdrop-blur-md border border-rose-600/30 rounded-2xl px-5 py-3">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">FLESHLAB Performer</p>
                  <p className="text-white font-black text-xl leading-tight">{name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-rose-300/70 text-xs font-bold">Fanclub Active</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-rose-900/20 to-[#060404]" />
          )}
        </div>

      </div>

      {/* Mobile: performer image as background */}
      {img && (
        <div className="absolute inset-0 z-0 lg:hidden">
          <img
            src={img}
            alt={name}
            className="w-full h-full object-cover object-top"
            style={{ filter: "brightness(0.3)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060404] via-[#060404]/80 to-[#060404]/50" />
        </div>
      )}
    </section>
  );
}