import { Link } from "react-router-dom";
import { Radio, Users, Star } from "lucide-react";
import { LIVE_LINKS, AFFILIATE_REL } from "@/lib/liveLinks";

const LIVE_CARDS = [
  {
    title: "FitMaster",
    text: "Athletic male performer",
    buttonLabel: "Watch Live",
    href: "/live/fitmaster",
    external: false,
    icon: Users,
  },
  {
    title: "Live Male Cams",
    text: "Explore active rooms",
    buttonLabel: "Browse Live Cams",
    href: LIVE_LINKS.liveHome,
    external: true,
    icon: Radio,
  },
  {
    title: "Become a Performer",
    text: "Broadcast with FleshLab",
    buttonLabel: "Apply Now",
    href: LIVE_LINKS.performerSignup,
    external: true,
    icon: Star,
  },
];

export default function FleshLabLiveSection() {
  return (
    <section className="py-10 border-t border-white/5 px-4">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gradient-to-b from-rose-600 to-rose-700 rounded-full shadow-lg shadow-rose-600/40" />
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="text-rose-500">FLESHLAB</span> LIVE
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            </h2>
          </div>
          <Link to="/live" className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
            See All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        <p className="text-white/40 text-sm mb-6 -mt-2">
          Watch selected performers live through our official partner network.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {LIVE_CARDS.map((card) => {
            const Icon = card.icon;
            const inner = (
              <div className="bg-[#111] border border-white/8 hover:border-rose-600/40 rounded-2xl p-6 flex flex-col gap-3 h-full transition-all group">
                <div className="w-10 h-10 rounded-xl bg-rose-600/15 border border-rose-600/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">{card.title}</h3>
                  <p className="text-white/40 text-sm">{card.text}</p>
                </div>
                <div className="mt-auto">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 text-sm font-bold group-hover:text-rose-300 transition-colors">
                    {card.buttonLabel}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </div>
            );

            return card.external ? (
              <a key={card.title} href={card.href} target="_blank" rel={AFFILIATE_REL}>
                {inner}
              </a>
            ) : (
              <Link key={card.title} to={card.href}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}