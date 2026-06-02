import { Play, Star, Zap, Lock, Flame, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Main Banner Container */}
      <div className="relative w-full bg-gradient-to-r from-red-950 via-red-900 to-orange-900 overflow-hidden" style={{ aspectRatio: "1920/320" }}>
        
        {/* Unified Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/c1fef556e_generated_image.png"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlays for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        </div>

        {/* Neon Glow Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left neon flamingo/glow */}
          <div className="absolute left-8 top-1/4 w-48 h-48 bg-pink-500/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "3s" }} />
          {/* Right neon glow */}
          <div className="absolute right-8 top-1/3 w-56 h-56 bg-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
          {/* Center accent */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-rose-600/20 to-transparent blur-3xl" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex items-center px-4 md:px-8">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            
            {/* LEFT PANEL - LIVE CAMS with Chat */}
            <div className="hidden md:flex flex-col h-full justify-between py-6">
              {/* LIVE Badge */}
              <div className="flex items-center gap-2 w-fit">
                <div className="relative flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-red-600/60 border border-red-400/50">
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                  LIVE CAMS
                </div>
              </div>

              {/* "LIVE & HORNY" Neon Text */}
              <div className="text-left mb-6">
                <div 
                  className="text-3xl font-black text-pink-500 italic drop-shadow-lg"
                  style={{
                    textShadow: "0 0 10px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.5)",
                    fontStyle: "italic",
                    letterSpacing: "0.05em"
                  }}
                >
                  LIVE &<br />HORNY
                </div>
              </div>

              {/* Mini Chat Bubble (decorative) */}
              <div className="bg-black/60 border border-white/20 rounded-lg p-3 backdrop-blur-sm space-y-2 text-xs text-white/80">
                <div className="text-white/60 text-[10px]">💬 your smile brightens</div>
                <div className="text-white/60 text-[10px]">💬 can you say hi? 🥺</div>
                <div className="text-white/60 text-[10px]">👍 you're so hot 🔥🔥</div>
                <div className="text-white/60 text-[10px]">👍 where are you from?</div>
                <div className="text-white/60 text-[10px]">👍 show us more 🍆</div>
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="Type a message..." className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-rose-600/50" />
                  <button className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded transition-colors">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* CENTER PANEL - MAIN CAMPAIGN */}
            <div className="flex flex-col items-center justify-center px-4 md:px-6 text-center">
              {/* Campaign Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 text-white px-6 py-2.5 rounded-full text-sm font-bold mb-6 shadow-xl shadow-rose-600/50 border-2 border-white/30">
                <Flame className="w-4 h-4 fill-current" />
                SUMMER STUDIO SPECIAL
                <Flame className="w-4 h-4 fill-current" />
              </div>

              {/* Main Offer - HUGE */}
              <div className="mb-4 leading-none">
                <div className="text-6xl md:text-7xl font-black text-white drop-shadow-2xl" style={{ textShadow: "0 0 20px rgba(0,0,0,0.8)" }}>
                  50%
                </div>
                <div className="text-5xl md:text-6xl font-black text-rose-500 -mt-2 drop-shadow-2xl" style={{ textShadow: "0 0 15px rgba(236, 72, 153, 0.6)" }}>
                  OFF
                </div>
              </div>

              {/* Subheading */}
              <div className="text-2xl md:text-3xl font-bold text-white/95 mb-2 tracking-wide drop-shadow-lg">
                FANCLUB ACCESS
              </div>

              {/* Description */}
              <p className="text-white/85 text-sm md:text-base mb-6 max-w-md font-medium drop-shadow">
                Watch public previews. Unlock full studio scenes.
              </p>

              {/* CTA Buttons */}
              <div className="flex gap-3 justify-center flex-wrap mb-6">
                <Link to="/fanclub">
                  <Button className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold px-8 py-3 rounded-full text-sm md:text-base h-auto shadow-xl shadow-rose-600/50 border-2 border-white/30 transition-all hover:scale-110 hover:shadow-rose-600/70">
                    <Lock className="w-4 h-4 mr-2 fill-current" />
                    JOIN NOW
                  </Button>
                </Link>
                <Link to="/videos">
                  <Button className="border-2 border-white/60 text-white hover:bg-white/20 font-bold px-8 py-3 rounded-full text-sm md:text-base h-auto backdrop-blur-sm transition-all hover:scale-110 hover:border-white/80 hover:shadow-lg hover:shadow-white/20">
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    BROWSE PREVIEWS
                  </Button>
                </Link>
              </div>

              {/* Trust Row */}
              <div className="flex gap-6 justify-center text-white/80 text-xs font-semibold flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>Instant Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>Premium Quality</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>Secure Payments</span>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL - PREMIUM VIDEOS */}
            <div className="hidden md:flex flex-col h-full justify-between py-6 items-end">
              {/* PREMIUM Badge */}
              <div className="flex items-center gap-2 w-fit">
                <div className="relative flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-purple-600/60 border border-purple-400/50">
                  PREMIUM VIDEOS
                </div>
              </div>

              {/* Neon decoration on right */}
              <div className="text-right mb-6">
                <div 
                  className="text-3xl font-black text-orange-400 drop-shadow-lg"
                  style={{
                    textShadow: "0 0 10px rgba(251, 146, 60, 0.8), 0 0 20px rgba(251, 146, 60, 0.5)",
                    letterSpacing: "0.05em"
                  }}
                >
                  HOT<br />STUDIO
                </div>
              </div>

              {/* Premium Info */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-white/20 rounded-lg p-4 backdrop-blur-sm text-right space-y-3">
                <p className="text-white/90 text-xs font-semibold uppercase tracking-wide">Exclusive Studio Productions</p>
                <Link to="/videos">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm py-2.5 rounded-lg shadow-lg shadow-purple-600/40 border border-white/20 transition-all hover:scale-105">
                    Explore <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Glow lines top and bottom */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-60" />
      </div>
    </section>
  );
}

// Import ArrowRight if not imported above
import { ArrowRight } from "lucide-react";