import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Star, Flame, PlayCircle } from "lucide-react";
import { trackFanclubCtaClick, trackEvent } from "@/lib/analytics";

export default function FanclubBanner() {
  const handleFanclubClick = () => {
    trackFanclubCtaClick('general', 'general', 'homepage_banner');
  };

  const handleRegisterClick = () => {
    trackEvent('registration_cta_click', { cta_location: 'homepage_banner' });
  };

  return (
    <section className="py-8 px-4 bg-[#070707]">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-rose-900/40 bg-gradient-to-br from-[#130608] via-[#0d0404] to-[#0a0a0a]">

          {/* Glow accents */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-rose-800/15 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-900/10 blur-[80px] rounded-full pointer-events-none" />

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-700/50 to-transparent" />

          <div className="relative z-10 px-8 py-10 md:px-12 md:py-12 text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-700/30 rounded-full px-4 py-1.5 mb-5">
              <Lock className="w-3 h-3 text-rose-400" />
              <span className="text-rose-300 text-[11px] font-black uppercase tracking-widest">Members-Only Access</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-3">
              Unlock the <span className="text-rose-500">Full Archive</span>
            </h2>

            {/* Value prop */}
            <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-8">
              Watch public previews free. Full scenes require Fanclub, PPV, or membership access.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7">
              <Link to="/fanclub" onClick={handleFanclubClick} className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-8 py-4 rounded-xl h-auto shadow-xl shadow-rose-700/30 text-sm uppercase tracking-wide">
                  <Star className="w-4 h-4 mr-1.5 fill-current" />
                  Join Fanclub
                </Button>
              </Link>
              <Link to="/register" onClick={handleRegisterClick} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-white/15 text-white hover:bg-white/6 font-semibold px-8 py-4 rounded-xl h-auto text-sm">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/videos" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-600/8 font-semibold px-7 py-4 rounded-xl h-auto text-sm">
                  <PlayCircle className="w-4 h-4 mr-1.5" />
                  Browse Previews
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-5 justify-center text-white/30 text-xs font-medium">
              <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-rose-600/70 fill-current" />Exclusive Content</span>
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-rose-600/70 fill-current" />Premium Quality</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-rose-600/70" />Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}