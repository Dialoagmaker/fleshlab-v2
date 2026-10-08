/**
 * PerformerFanclubBenefits
 * "What you unlock tonight" — locked preview grid + benefit cards.
 * Only uses the featured performer's image. No other performers.
 */

import { Lock, Eye } from "lucide-react";

const UNLOCK_ITEMS = [
  {
    title: "Member-only scenes",
    desc: "Selected scenes that do not appear on the public page.",
    label: "Members Only",
  },
  {
    title: "Raw extras",
    desc: "Less polished, more personal drops from the studio side.",
    label: "Raw",
  },
  {
    title: "Private updates",
    desc: "Short updates, clips and fanclub posts directly from the performer.",
    label: "Private",
  },
  {
    title: "Early drops",
    desc: "See selected releases before public visitors.",
    label: "Early Access",
  },
];

const LOCKED_CARDS = [
  { title: "Private bathroom drop" },
  { title: "Raw solo extra" },
  { title: "Behind the shoot" },
  { title: "Fanclub update" },
  { title: "Studio session" },
  { title: "Member drop" },
];

export default function PerformerFanclubBenefits({ performer, ctaSlot }) {
  const name = performer.display_name;
  const img = performer.profile_image_url || performer.cover_image_url;

  return (
    <>
      {/* ── What you unlock tonight ───────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#060404] border-t border-white/5">
        <div className="max-w-[1100px] mx-auto">

          <div className="mb-10">
            <p className="text-rose-400/50 text-xs font-black uppercase tracking-widest mb-3">What you unlock tonight</p>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              One performer.<br />
              <span className="text-rose-500">More access.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {UNLOCK_ITEMS.map(({ title, desc, label }, i) => (
              <div
                key={i}
                className="relative bg-[#0e0a0a] border border-white/8 rounded-2xl overflow-hidden group hover:border-rose-600/35 transition-colors duration-200"
              >
                {/* Performer image behind, very dark */}
                {img && (
                  <div className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.13] transition-opacity duration-300 pointer-events-none">
                    <img src={img} alt="" className="w-full h-full object-cover object-top" />
                  </div>
                )}
                <div className="relative z-10 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-rose-600/15 border border-rose-600/20 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <span className="text-rose-300/60 text-[10px] font-black uppercase tracking-widest">{label}</span>
                  </div>
                  <h3 className="text-white font-black text-base leading-snug mb-2">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why fans follow {name} ─────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#060404] border-t border-white/5">
        <div className="max-w-[1100px] mx-auto grid lg:grid-cols-2 gap-12 items-center">

          {/* Performer image panel */}
          <div className="relative rounded-3xl overflow-hidden aspect-[3/4] max-w-xs mx-auto lg:mx-0">
            {img ? (
              <>
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover object-top"
                  style={{ filter: "brightness(0.7) contrast(1.05)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060404]/90 via-transparent to-transparent" />
                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-[2px]">
                  <Lock className="w-10 h-10 text-rose-400 mb-2" />
                  <span className="text-white font-black text-sm uppercase tracking-wide">Members Only</span>
                </div>
                <div className="absolute bottom-5 left-5">
                  <span className="bg-rose-600/80 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {name}
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-900/30 to-[#0d0505] flex items-center justify-center">
                <Lock className="w-12 h-12 text-rose-400/30" />
              </div>
            )}
          </div>

          {/* Copy */}
          <div>
            <p className="text-rose-400/50 text-xs font-black uppercase tracking-widest mb-4">Why fans follow {name}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
              Filipino performer.<br />
              <span className="text-rose-500">Amateur energy.</span><br />
              Studio drops.
            </h2>
            <div className="space-y-4 mb-8">
              {[
                "Solo scenes, studio drops and fanclub updates — his content stays personal.",
                "His public FLESHLAB page is the preview. The member side is where it gets more private.",
                "Support {name} directly and unlock the member-only side of his FLESHLAB profile.",
              ].map((line, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-rose-500 mt-2.5 shrink-0" />
                  <p className="text-white/50 text-base leading-relaxed">
                    {line.replace('{name}', name)}
                  </p>
                </div>
              ))}
            </div>
            <div className="w-full sm:max-w-sm">
              {ctaSlot}
            </div>
          </div>
        </div>
      </section>

      {/* ── Locked preview grid ───────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#080505] border-t border-white/5">
        <div className="max-w-[1100px] mx-auto">

          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-white/25 text-xs font-black uppercase tracking-widest mb-2">
                <Eye className="w-3 h-3 inline mr-1" />Preview — members only
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                See what's waiting<br />
                <span className="text-rose-500">behind the lock.</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
            {LOCKED_CARDS.map(({ title }, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/8 group"
              >
                {/* Blurred performer image */}
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover object-top"
                    style={{ filter: "blur(12px) brightness(0.35) contrast(1.1)", transform: "scale(1.1)" }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a0808] to-[#0d0404]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Lock icon center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-rose-600/30 flex items-center justify-center group-hover:border-rose-500/60 transition-colors">
                    <Lock className="w-4 h-4 text-rose-400/70" />
                  </div>
                </div>

                {/* Bottom label */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-3">
                  <p className="text-white/70 text-xs font-bold truncate">{title}</p>
                  <span className="text-rose-300/50 text-[10px] font-black uppercase tracking-widest">Members only</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA after grid */}
          <div className="text-center">
            <p className="text-white/35 text-base mb-5 font-medium">
              Ready to unlock {name}'s private side?
            </p>
            <div className="w-full sm:w-auto sm:max-w-sm mx-auto">
              {ctaSlot}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}