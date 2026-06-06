import { Link } from "react-router-dom";
import { Film, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BG_IMAGE = "https://video.fleshlab.online/applications/private/ChatGPT%20Image%206.%20Juni%202026%2C%2021_16_49.png";

export default function PerformerRecruitmentBanner() {
  return (
    <section className="relative overflow-hidden min-h-[420px] md:min-h-[460px] flex items-center">

      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
        }}
        aria-hidden="true"
      />

      {/* Overlays — left-heavy gradient so text stays readable, image visible right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/30" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" aria-hidden="true" />

      {/* Subtle rose glow bottom-left */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[250px] bg-rose-900/25 blur-[90px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative w-full max-w-[1280px] mx-auto px-6 py-12 md:py-14">
        <div className="max-w-[620px]">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-rose-600/20 border border-rose-600/35 rounded-full px-4 py-1.5 mb-6">
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-300 text-xs font-black uppercase tracking-widest">Now Recruiting — 18+ Verified Performers</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-black text-white leading-[0.92] tracking-tight mb-5">
            GET PRODUCED.<br />
            GET PROMOTED.<br />
            <span className="text-rose-500">GET PAID.</span>
          </h2>

          {/* Body */}
          <p className="text-white/60 text-base md:text-lg leading-relaxed mb-3 max-w-[500px]">
            FLESHLAB is looking for verified 18+ performers. Build your performer profile with studio support, distribution, fanclub tools and professional contracts.
          </p>
          <p className="text-white/35 text-sm leading-relaxed mb-7 max-w-[460px]">
            From your first published scene you can start earning through views, fanclub subscriptions, PPV sales and livecam shows.
          </p>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/40 text-xs mb-8">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-rose-500/70 shrink-0" />Verified 18+ only</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-rose-500/70 shrink-0" />Contracts included</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-rose-500/70 shrink-0" />Revenue sharing</span>
          </div>

          {/* CTAs + revenue stats row */}
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/become-performer">
              <Button className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-8 py-4 rounded-xl h-auto shadow-xl shadow-rose-700/40 text-sm uppercase tracking-wide">
                Apply as Performer
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/become-performer#how-it-works">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/8 font-semibold px-6 py-4 rounded-xl h-auto text-sm">
                See performer models
              </Button>
            </Link>

            {/* Revenue split badges — inline on desktop, wraps on mobile */}
            <div className="flex gap-2 ml-0 md:ml-2">
              <div className="bg-black/50 backdrop-blur-sm border border-rose-600/30 rounded-xl px-4 py-2.5 text-center">
                <div className="text-2xl font-black text-rose-500 leading-none">40%</div>
                <div className="text-white/40 text-[10px] mt-0.5 leading-tight">Managed share</div>
              </div>
              <div className="bg-black/50 backdrop-blur-sm border border-purple-600/30 rounded-xl px-4 py-2.5 text-center">
                <div className="text-2xl font-black text-purple-400 leading-none">70%</div>
                <div className="text-white/40 text-[10px] mt-0.5 leading-tight">Network share</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}