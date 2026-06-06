/**
 * PerformerFanclubBenefits
 * "What you unlock" section for the active performer fanclub page.
 * Shows 4 strong benefit cards — performer-specific, no other performers.
 */

import { Lock, Film, Bell, Camera, ArrowRight } from "lucide-react";

const BENEFITS = [
  {
    icon: Film,
    badge: "Members Only",
    title: "Member-only scenes",
    desc: "Full scenes that do not appear on the public side of FLESHLAB.",
  },
  {
    icon: Bell,
    badge: "Private Updates",
    title: "Performer updates",
    desc: "Direct updates, raw extras and moments that never go public.",
  },
  {
    icon: ArrowRight,
    badge: "Early Access",
    title: "Early drops",
    desc: "New content lands in the fanclub before it reaches public visitors.",
  },
  {
    icon: Camera,
    badge: "Behind the Scenes",
    title: "Behind the scenes",
    desc: "The making-of, the real moments and what happens off-camera.",
  },
];

export default function PerformerFanclubBenefits({ performer, ctaSlot }) {
  const name = performer.display_name;
  // Use performer profile image as visual anchor — no other performers
  const performerImg = performer.profile_image_url;

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-[#080808] to-[#0d0606] border-t border-white/5">
      <div className="max-w-[1100px] mx-auto">

        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-rose-400/60 text-xs font-black uppercase tracking-widest mb-2">What opens inside</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            UNLOCK THE PRIVATE SIDE<br />
            <span className="text-rose-500">OF {name.toUpperCase()}</span>
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto">
            Fanclub members get exclusive content, updates and drops that never reach the public page.
          </p>
        </div>

        {/* 4 benefit cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {BENEFITS.map(({ icon: Icon, badge, title, desc }, i) => (
            <div
              key={i}
              className="relative bg-[#111] border border-white/8 rounded-2xl p-6 flex flex-col gap-3 overflow-hidden group hover:border-rose-600/30 transition-colors duration-200"
            >
              {/* Background performer image, very dark */}
              {performerImg && (
                <div className="absolute inset-0 z-0 opacity-[0.06] group-hover:opacity-[0.09] transition-opacity duration-300">
                  <img src={performerImg} alt="" className="w-full h-full object-cover object-top" />
                </div>
              )}
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/15 border border-rose-600/25 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-rose-400" />
                </div>
                <div className="inline-flex items-center gap-1.5 bg-rose-600/10 border border-rose-600/20 rounded-full px-2 py-0.5 w-fit">
                  <Lock className="w-2.5 h-2.5 text-rose-400/70" />
                  <span className="text-rose-300/70 text-[10px] font-black uppercase tracking-wide">{badge}</span>
                </div>
                <h3 className="text-white font-black text-base leading-tight">{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Inline CTA repeat */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-white/35 text-sm">
            Unlock selected member-only scenes, raw extras and updates. Support {name} directly.
          </p>
          <div className="w-full sm:w-auto sm:min-w-[280px]">
            {ctaSlot}
          </div>
        </div>

      </div>
    </section>
  );
}