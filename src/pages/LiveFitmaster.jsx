import { Link } from "react-router-dom";
import SEOMeta from "@/components/SEOMeta";
import { LIVE_LINKS, AFFILIATE_REL } from "@/lib/liveLinks";
import { Radio, Star, AlertTriangle, ChevronLeft, Users, Shield } from "lucide-react";

export default function LiveFitmaster() {
  return (
    <>
      <SEOMeta
        title="FitMaster Live — FleshLab Live Performer"
        description="Watch FitMaster live. Athletic male performer. Official FleshLab Live performer network."
        canonical="/live/fitmaster"
      />

      {/* 18+ Notice */}
      <div className="bg-amber-900/30 border-b border-amber-600/30 py-2 px-4 text-center">
        <span className="text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          18+ ONLY — Adult live content. Verify your age before proceeding.
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link to="/live" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          FleshLab Live
        </Link>

        {/* Hero area */}
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden mb-6">
          {/* Large image placeholder */}
          <div className="aspect-[16/7] bg-gradient-to-br from-rose-950/60 via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-rose-600/10 rounded-full blur-3xl" />
            </div>
            <div className="z-10 flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full bg-rose-600/20 border-2 border-rose-600/40 flex items-center justify-center">
                <Users className="w-14 h-14 text-rose-400" />
              </div>
              <div className="flex items-center gap-2 bg-rose-600/90 rounded-full px-4 py-1.5">
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span className="text-white text-xs font-bold uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">FitMaster</h1>
            </div>
          </div>

          {/* Profile info */}
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="inline-flex items-center gap-1.5 bg-rose-600/15 border border-rose-600/30 rounded-full px-3 py-1">
                <Star className="w-3 h-3 text-rose-500 fill-current" />
                <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">Official FleshLab Performer</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Shield className="w-3 h-3 text-white/50" />
                <span className="text-white/50 text-xs font-semibold">Verified 18+</span>
              </div>
            </div>

            <p className="text-white/60 text-base leading-relaxed mb-8 max-w-2xl">
              FitMaster is part of the FleshLab Live performer network. Watch live shows through our official partner access.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={LIVE_LINKS.fitmaster}
                target="_blank"
                rel={AFFILIATE_REL}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-base px-8 py-4 rounded-xl shadow-2xl shadow-rose-600/40 transition-all"
              >
                <Radio className="w-5 h-5" />
                Watch FitMaster Live
              </a>
              <Link
                to="/live"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 hover:border-white/25 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all"
              >
                Browse FleshLab Live
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-white/25 text-xs">
          By clicking Watch FitMaster Live you confirm you are 18 years of age or older and consent to viewing adult content.
          You will be redirected to our official partner network.
        </p>
      </div>
    </>
  );
}