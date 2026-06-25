import { Link } from "react-router-dom";
import SEOMeta from "@/components/SEOMeta";
import { LIVE_LINKS, AFFILIATE_REL } from "@/lib/liveLinks";
import { Radio, Users, Star, AlertTriangle } from "lucide-react";

export default function Live() {
  return (
    <>
      <SEOMeta
        title="FleshLab Live — Selected Male Performers Live"
        description="Watch selected male performers live through our official partner network. FleshLab Live — real performers, real shows."
        canonical="/live"
      />

      {/* 18+ Notice */}
      <div className="bg-amber-900/30 border-b border-amber-600/30 py-2 px-4 text-center">
        <span className="text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          18+ ONLY — Adult live content. Verify your age before proceeding.
        </span>
      </div>

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5 mb-6">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">Live Now</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4">
            FLESHLAB <span className="text-rose-500">LIVE</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            Selected male performers. Live shows. Official partner access.
          </p>
          <a
            href={LIVE_LINKS.live}
            target="_blank"
            rel={AFFILIATE_REL}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-lg px-10 py-4 rounded-xl shadow-2xl shadow-rose-600/40 transition-all"
          >
            <Radio className="w-5 h-5" />
            Watch Live Cams
          </a>
        </div>
      </section>

      {/* Featured Performers */}
      <section className="py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-gradient-to-b from-rose-600 to-rose-700 rounded-full shadow-lg shadow-rose-600/40" />
            <h2 className="text-xl font-black text-white tracking-tight">
              <span className="text-rose-500">FEATURED</span> PERFORMERS
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* FitMaster Card */}
            <div className="group bg-[#111] border border-white/8 rounded-2xl overflow-hidden hover:border-rose-600/40 transition-all">
              <div className="aspect-[4/3] bg-gradient-to-br from-rose-950/50 via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="w-24 h-24 rounded-full bg-rose-600/20 border-2 border-rose-600/30 flex items-center justify-center z-10">
                  <Users className="w-10 h-10 text-rose-400" />
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-rose-600/90 rounded-full px-2.5 py-1 z-10">
                  <Radio className="w-3 h-3 text-white animate-pulse" />
                  <span className="text-white text-[10px] font-bold uppercase">Live</span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 border border-rose-600/30 rounded-full px-2.5 py-1 z-10">
                  <Star className="w-3 h-3 text-rose-500 fill-current" />
                  <span className="text-white text-[10px] font-bold">Official</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-white font-black text-lg mb-1">FitMaster</h3>
                <p className="text-white/50 text-sm mb-4">Athletic male performer. Official FleshLab performer.</p>
                <Link
                  to="/live/fitmaster"
                  className="w-full flex items-center justify-center gap-2 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-600/30 hover:border-rose-600/60 text-rose-400 hover:text-rose-300 font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
                >
                  View FitMaster
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Live Rooms */}
      <section className="py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-gradient-to-b from-rose-600 to-rose-700 rounded-full shadow-lg shadow-rose-600/40" />
            <h2 className="text-xl font-black text-white tracking-tight">
              <span className="text-rose-500">LATEST</span> LIVE ROOMS / MALE CAMS
            </h2>
          </div>
          <div className="bg-[#111] border border-white/8 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white font-bold text-lg mb-2">Explore active male cam rooms</p>
              <p className="text-white/50 text-sm max-w-lg">
                Explore active male cam rooms through our official partner network.
              </p>
            </div>
            <a
              href={LIVE_LINKS.live}
              target="_blank"
              rel={AFFILIATE_REL}
              className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-rose-600/30 transition-all whitespace-nowrap"
            >
              <Radio className="w-4 h-4" />
              Browse Live Cams
            </a>
          </div>
        </div>
      </section>

      {/* Become a Performer */}
      <section className="py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-rose-950/40 via-[#111] to-rose-950/40 border border-rose-600/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-rose-600/15 border border-rose-600/30 rounded-full px-3 py-1 mb-3">
                <Star className="w-3 h-3 text-rose-500" />
                <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">Performer Network</span>
              </div>
              <h3 className="text-white font-black text-xl mb-2">Become a Performer</h3>
              <p className="text-white/50 text-sm max-w-lg">
                Broadcast with FleshLab and join our performer network.
              </p>
            </div>
            <a
              href={LIVE_LINKS.performerSignup}
              target="_blank"
              rel={AFFILIATE_REL}
              className="shrink-0 inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-rose-600/50 text-white font-bold px-8 py-3 rounded-xl transition-all whitespace-nowrap"
            >
              Apply Now
            </a>
          </div>
        </div>
      </section>
    </>
  );
}