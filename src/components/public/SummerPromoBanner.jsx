import { Play, Star, Zap, ArrowRight, Lock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Main Banner Container */}
      <div className="relative h-[280px] md:h-[320px] bg-gradient-to-r from-red-950 via-red-900 to-orange-900">
        
        {/* Unified Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/c1fef556e_generated_image.png"
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Palm shadows left */}
          <div className="absolute -left-20 top-0 w-64 h-64 bg-black/20 rounded-full blur-3xl" />
          {/* Palm shadows right */}
          <div className="absolute -right-20 top-0 w-64 h-64 bg-black/20 rounded-full blur-3xl" />
          {/* Neon glow accents */}
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl" />
          <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-orange-500/15 rounded-full blur-2xl" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-[1920px] mx-auto px-4 h-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 w-full items-center">
            
            {/* Left Panel - LIVE CAMS */}
            <div className="hidden lg:flex relative group cursor-pointer overflow-hidden h-[260px] border-r border-white/10">
              {/* Model Image */}
              <div className="absolute inset-0">
                <img
                  src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3d6db323e_generated_image.png"
                  alt="Live Cams Creator"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
              </div>

              {/* LIVE Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-red-600/50 animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                LIVE CAMS
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white/80 text-xs mb-3 uppercase tracking-wider">Interactive shows daily</p>
                <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs font-semibold h-9 px-4 backdrop-blur-sm transition-all">
                  Watch Now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              {/* Neon accent */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Center Panel - Main Campaign */}
            <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
              {/* Campaign Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 text-white px-5 py-2 rounded-full text-sm font-bold mb-4 shadow-xl shadow-rose-600/40 border border-white/20">
                <Flame className="w-4 h-4 fill-current animate-pulse" />
                SUMMER STUDIO SPECIAL
                <Flame className="w-4 h-4 fill-current animate-pulse" />
              </div>

              {/* Main Offer */}
              <div className="mb-3">
                <div className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl leading-none">
                  50% <span className="text-rose-500">OFF</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white/90 mt-1 tracking-wide">
                  FANCLUB ACCESS
                </div>
              </div>

              {/* Subline */}
              <p className="text-white/85 text-sm md:text-base mb-6 max-w-md font-medium">
                Watch public previews. Unlock full studio scenes.
              </p>

              {/* CTA Buttons */}
              <div className="flex gap-3 justify-center flex-wrap mb-5">
                <Link to="/fanclub">
                  <Button className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold px-8 py-3 rounded-full text-sm md:text-base h-auto shadow-xl shadow-rose-600/40 border-2 border-white/20 transition-all hover:scale-105">
                    <Lock className="w-4 h-4 mr-2 fill-current" />
                    JOIN NOW
                  </Button>
                </Link>
                <Link to="/videos">
                  <Button variant="outline" className="border-2 border-white/60 text-white hover:bg-white/15 font-bold px-8 py-3 rounded-full text-sm md:text-base h-auto backdrop-blur-sm transition-all hover:scale-105">
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    BROWSE PREVIEWS
                  </Button>
                </Link>
              </div>

              {/* Trust Row */}
              <div className="flex gap-5 justify-center text-white/70 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-500" />
                  <span>Instant Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-rose-500 fill-current" />
                  <span>Premium Quality</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Secure Payment</span>
                </div>
              </div>
            </div>

            {/* Right Panel - PREMIUM VIDEOS */}
            <div className="hidden lg:flex relative group cursor-pointer overflow-hidden h-[260px] border-l border-white/10">
              {/* Model Image */}
              <div className="absolute inset-0">
                <img
                  src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/c3ed5ac5c_generated_image.png"
                  alt="Premium Videos Creator"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
              </div>

              {/* Premium Badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-purple-600/50">
                PREMIUM VIDEOS
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white/80 text-xs mb-3 uppercase tracking-wider">Exclusive studio productions</p>
                <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs font-semibold h-9 px-4 backdrop-blur-sm transition-all">
                  Explore <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              {/* Neon accent */}
              <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-rose-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Top glow line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600/50 to-transparent" />
        
        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600/50 to-transparent" />
      </div>
    </section>
  );
}