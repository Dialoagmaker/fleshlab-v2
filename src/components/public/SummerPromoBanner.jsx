import { Play, Lock, Zap, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Banner Container */}
      <div className="relative w-full bg-gradient-to-r from-red-950 via-red-900 to-orange-900" style={{ aspectRatio: "1920/320" }}>
        
        {/* Background Image - Tropical Sunset Nightlife */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/80 via-red-900/60 to-orange-900/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(236,72,153,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_40%,rgba(251,146,60,0.15),transparent_50%)]" />
          
          {/* Palm silhouettes - left */}
          <svg className="absolute left-0 top-0 w-1/3 h-full opacity-40" viewBox="0 0 200 400" preserveAspectRatio="none">
            <path d="M50 400 Q30 300 40 200 Q45 150 50 100 M50 150 Q20 130 10 100 M50 150 Q80 130 90 100 M50 200 Q30 180 20 150 M50 200 Q80 180 90 150" stroke="#000" strokeWidth="2" fill="none" opacity="0.4" />
            <path d="M150 400 Q130 280 145 180 Q150 120 155 80 M155 140 Q120 115 105 80 M155 140 Q190 115 205 80 M155 200 Q130 175 115 140 M155 200 Q190 175 205 140" stroke="#000" strokeWidth="2" fill="none" opacity="0.3" />
          </svg>

          {/* Palm silhouettes - right */}
          <svg className="absolute right-0 top-0 w-1/3 h-full opacity-40" viewBox="0 0 200 400" preserveAspectRatio="none">
            <path d="M150 400 Q170 300 160 200 Q155 150 150 100 M150 150 Q180 130 190 100 M150 150 Q120 130 110 100 M150 200 Q170 180 180 150 M150 200 Q120 180 110 150" stroke="#000" strokeWidth="2" fill="none" opacity="0.4" />
            <path d="M50 400 Q70 280 55 180 Q50 120 45 80 M45 140 Q80 115 95 80 M45 140 Q10 115 -5 80 M45 200 Q70 175 85 140 M45 200 Q10 175 -5 140" stroke="#000" strokeWidth="2" fill="none" opacity="0.3" />
          </svg>

          {/* Neon Flamingo - left side */}
          <div className="absolute left-12 top-1/2 -translate-y-1/2 w-32 h-32">
            <div className="relative w-full h-full">
              {/* Flamingo outline with neon glow */}
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
                <path d="M50 10 Q65 25 70 45 Q72 55 70 65 L30 65 Q28 55 33 45 Q35 25 50 10 M35 65 Q32 75 40 85 Q50 90 60 85 Q68 75 65 65" stroke="#ff1493" strokeWidth="2" fill="none" opacity="0.9" />
              </svg>
              <style>{`
                @keyframes neon-pulse {
                  0%, 100% { filter: drop-shadow(0 0 15px rgba(236,72,153,0.8)); }
                  50% { filter: drop-shadow(0 0 25px rgba(236,72,153,1)); }
                }
              `}</style>
            </div>
          </div>

          {/* Neon lights/lanterns - center top */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-96 h-24">
            <div className="flex justify-around items-end gap-4 h-full px-8">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-3 h-12 rounded-full"
                  style={{
                    background: i % 2 === 0 ? "#ff6b35" : "#ffb700",
                    boxShadow: i % 2 === 0 ? "0 0 15px #ff6b35" : "0 0 15px #ffb700",
                    animation: `pulse ${2 + i * 0.3}s ease-in-out infinite`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right side lights */}
          <div className="absolute top-16 right-12 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-8 rounded-full ml-auto"
                style={{
                  background: "#ff1493",
                  boxShadow: "0 0 10px #ff1493",
                  animation: `pulse ${1.5 + i * 0.2}s ease-in-out infinite`
                }}
              />
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="relative z-20 w-full h-full flex items-center px-4 md:px-8">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* LEFT PANEL - LIVE CAMS */}
            <div className="hidden md:flex flex-col justify-between h-full py-6">
              {/* LIVE CAMS Badge */}
              <div className="flex items-center gap-2 w-fit">
                <div className="relative flex items-center gap-2.5 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-red-600/70 border border-red-400/60">
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                  LIVE CAMS
                </div>
              </div>

              {/* Model Image Left */}
              <div className="relative h-48 -mx-4 overflow-hidden rounded-r-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/40" />
              </div>

              {/* LIVE & HORNY Neon Text */}
              <div className="italic">
                <div 
                  className="text-4xl font-black leading-tight drop-shadow-2xl"
                  style={{
                    color: "#ff1493",
                    textShadow: "0 0 10px rgba(255,20,147,0.8), 0 0 20px rgba(255,20,147,0.5), 2px 2px 4px rgba(0,0,0,0.8)",
                    fontStyle: "italic",
                    letterSpacing: "0.02em"
                  }}
                >
                  LIVE &<br />HORNY
                </div>
              </div>

              {/* Chat Bubble Mini */}
              <div className="bg-black/70 border border-white/20 rounded-lg p-3 backdrop-blur-sm space-y-1.5 text-xs text-white/75">
                <div className="text-white/60 text-[11px]">💬 your smile brightens</div>
                <div className="text-white/60 text-[11px]">💬 can you say hi? 🥺</div>
                <div className="text-white/60 text-[11px]">👍 you're so hot 🔥🔥</div>
                <div className="text-white/60 text-[11px]">👍 where are you from?</div>
                <div className="text-white/60 text-[11px]">👍 show us more 🍆</div>
                <div className="flex gap-2 mt-2.5">
                  <input type="text" placeholder="Type a message..." className="flex-1 bg-white/10 border border-white/20 rounded px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-rose-600/50" />
                  <button className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded transition-colors">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* CENTER PANEL - MAIN CAMPAIGN */}
            <div className="flex flex-col items-center justify-center text-center">
              {/* Campaign Badge */}
              <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 text-white px-6 py-2.5 rounded-full text-sm font-bold mb-8 shadow-xl shadow-rose-600/60 border-2 border-white/40">
                <span>✨</span>
                SUMMER STUDIO SPECIAL
                <span>✨</span>
              </div>

              {/* Main Offer */}
              <div className="mb-4 leading-none">
                <div className="text-7xl md:text-8xl font-black text-white drop-shadow-2xl tracking-tighter">
                  50%
                </div>
                <div className="text-6xl md:text-7xl font-black text-rose-500 -mt-3 drop-shadow-2xl" style={{ textShadow: "0 0 15px rgba(236,72,153,0.7)" }}>
                  OFF
                </div>
              </div>

              {/* Subheading */}
              <div className="text-2xl md:text-3xl font-bold text-white/95 mb-3 tracking-wide drop-shadow-xl">
                FANCLUB ACCESS
              </div>

              {/* Description */}
              <p className="text-white/85 text-sm md:text-base mb-8 max-w-lg font-medium drop-shadow-lg">
                Watch public previews. Unlock full studio scenes.
              </p>

              {/* CTA Buttons */}
              <div className="flex gap-4 justify-center mb-8 flex-wrap">
                <Link to="/fanclub">
                  <Button className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold px-8 py-3 rounded-full text-base h-auto shadow-xl shadow-rose-600/60 border-2 border-white/40 transition-all hover:scale-110 hover:shadow-rose-600/80">
                    <Lock className="w-4 h-4 mr-2 fill-current" />
                    JOIN NOW
                  </Button>
                </Link>
                <Link to="/videos">
                  <Button className="border-2 border-white/60 text-white hover:bg-white/15 font-bold px-8 py-3 rounded-full text-base h-auto backdrop-blur-sm transition-all hover:scale-110 hover:border-white/80">
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    BROWSE PREVIEWS
                  </Button>
                </Link>
              </div>

              {/* Trust Row */}
              <div className="flex gap-8 justify-center text-white/80 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>Instant Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>Premium Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>Secure Payments</span>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL - PREMIUM VIDEOS */}
            <div className="hidden md:flex flex-col justify-between items-end h-full py-6">
              {/* PREMIUM VIDEOS Badge */}
              <div className="flex items-center gap-2 w-fit">
                <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-purple-600/70 border border-purple-400/60">
                  PREMIUM VIDEOS
                </div>
              </div>

              {/* Model Image Right */}
              <div className="relative h-48 -mx-4 overflow-hidden rounded-l-lg">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black/40" />
              </div>

              {/* Hot Studio Neon */}
              <div className="text-right">
                <div 
                  className="text-4xl font-black leading-tight drop-shadow-2xl"
                  style={{
                    color: "#ffb700",
                    textShadow: "0 0 10px rgba(255,183,0,0.8), 0 0 20px rgba(255,183,0,0.5), 2px 2px 4px rgba(0,0,0,0.8)",
                    letterSpacing: "0.02em"
                  }}
                >
                  HOT<br />STUDIO
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-black/70 border border-white/20 rounded-lg p-4 backdrop-blur-sm text-right space-y-3 w-full">
                <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">Exclusive Studio Productions</p>
                <Link to="/videos">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm py-2.5 rounded-lg shadow-lg shadow-purple-600/50 border border-white/30 transition-all hover:scale-105">
                    Explore →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Top glow line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600/80 to-transparent" />
        
        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600/80 to-transparent" />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}