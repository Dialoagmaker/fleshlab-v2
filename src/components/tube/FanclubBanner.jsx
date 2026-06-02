import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Star, Flame } from "lucide-react";

export default function FanclubBanner() {
  return (
    <section className="py-8 bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border-y border-rose-600/10">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-900/50 via-[#0a0a0a] to-rose-900/50 border border-rose-600/30 p-8 md:p-10">
          {/* Decorative Background - Summer Banner Match */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-rose-600/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-rose-600/20 to-transparent rounded-full blur-3xl" />
          
          {/* Palm Silhouette Decorations */}
          <div className="absolute top-4 right-8 opacity-20">
            <svg viewBox="0 0 100 150" className="w-32 h-48">
              <path d="M50 150 Q50 100 50 50 M50 80 Q30 60 20 40 M50 80 Q70 60 80 40 M50 110 Q30 90 20 70 M50 110 Q70 90 80 70" stroke="#000" strokeWidth="2" fill="none" />
            </svg>
          </div>
          
          <div className="relative z-10 text-center">
            {/* Icon + Title - Banner Style */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 flex items-center justify-center shadow-xl shadow-rose-600/50 border-2 border-white/20">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-2xl">
                Unlock the <span className="text-rose-500">Full Archive</span>
              </h2>
            </div>
            
            {/* Description */}
            <p className="text-white/80 mb-8 max-w-2xl mx-auto text-lg font-medium">
              Watch public previews free. Full scenes require Fanclub, PPV, or membership access.
            </p>
            
            {/* CTA Buttons - Enhanced */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 px-2 sm:px-0">
              <Link to="/fanclub" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base h-auto shadow-xl shadow-rose-600/50 border-2 border-white/20 transition-all hover:scale-105">
                  <Star className="w-4 sm:w-5 h-4 sm:h-5 mr-2 fill-current" />
                  Join Fanclub
                </Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-2 border-white/40 text-white hover:bg-white/15 font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base h-auto backdrop-blur-sm transition-all hover:scale-105">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/videos" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full text-rose-500 hover:text-rose-400 font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base h-auto transition-all hover:scale-105 hover:bg-rose-600/10">
                  Browse Previews
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 justify-center text-white/70 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500 fill-current" />
                <span>Exclusive Content</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-rose-500 fill-current" />
                <span>Premium Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}