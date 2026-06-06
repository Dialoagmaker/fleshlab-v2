import { Link } from "react-router-dom";
import { Film, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PerformerRecruitmentBanner() {
  return (
    <section className="py-12 px-4 bg-gradient-to-br from-[#100505] via-[#0d0505] to-[#0a0a0a] border-y border-rose-900/30">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

          {/* Left — copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/25 rounded-full px-3 py-1 mb-4">
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 text-xs font-bold uppercase tracking-widest">Now Recruiting</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              GET PRODUCED.<br className="hidden sm:block" /> GET PROMOTED.<br className="hidden sm:block" />{" "}
              <span className="text-rose-500">GET PAID.</span>
            </h2>
            <p className="text-white/55 text-base max-w-lg mb-6">
              FLESHLAB is looking for verified 18+ performers. Build your performer profile with studio support, distribution, fanclub tools and professional contracts.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-white/35 text-xs mb-6">
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-rose-500/60 shrink-0" />Verified 18+ only</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-rose-500/60 shrink-0" />Contracts included</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-rose-500/60 shrink-0" />Revenue sharing</span>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <Link to="/become-performer">
                <Button className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-7 py-3 rounded-xl h-auto shadow-lg shadow-rose-600/30 text-sm">
                  Apply as Performer
                </Button>
              </Link>
              <Link to="/become-performer#how-it-works">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/8 font-semibold px-6 py-3 rounded-xl h-auto text-sm">
                  See performer models
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — 40/70 split teaser */}
          <div className="flex gap-3 shrink-0">
            <div className="bg-[#111] border border-rose-600/25 rounded-2xl px-5 py-5 text-center w-36">
              <div className="text-4xl font-black text-rose-500 mb-1">40%</div>
              <div className="text-white/50 text-xs leading-snug">Managed<br />Performer share</div>
            </div>
            <div className="bg-[#111] border border-purple-600/25 rounded-2xl px-5 py-5 text-center w-36">
              <div className="text-4xl font-black text-purple-400 mb-1">70%</div>
              <div className="text-white/50 text-xs leading-snug">Network<br />Performer share</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}