import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full h-[320px] md:h-[340px] lg:h-[360px] overflow-hidden">
      {/* Background Image - Fixed, Do Not Change */}
      <div className="absolute inset-0">
        <img
          src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/e9aeecccb_ChatGPTImageJun3202602_34_57AM.png"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: "50% 35%" }}
        />
        {/* Enhance saturation and warmth */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600/10 via-transparent to-purple-600/10 mix-blend-overlay" />
      </div>
      
      {/* Gradient Overlay - Lighter on sides (models visible), darker in center (text readable) */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              90deg,
              rgba(0,0,0,0.18) 0%,
              rgba(0,0,0,0.45) 35%,
              rgba(0,0,0,0.58) 50%,
              rgba(0,0,0,0.45) 65%,
              rgba(0,0,0,0.18) 100%
            )
          `
        }}
      />
      
      {/* Subtle bottom fade for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Content Layer - All Sharp HTML/CSS */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <div className="max-w-5xl w-full text-center">
          
          {/* Top Badges Row - Fixed Position Corners */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            {/* Left Badge */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg shadow-rose-600/60 uppercase tracking-wider whitespace-nowrap">
              🔴 LIVE CAMS
            </div>
            
            {/* Right Badge */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg shadow-purple-600/60 uppercase tracking-wider whitespace-nowrap">
              ⭐ PREMIUM VIDEOS
            </div>
          </div>
          
          {/* Live-Chat Panel - Connected Module */}
          <div className="hidden lg:block absolute left-[4.5%] top-[40%] z-15 flex flex-col gap-[6px] p-[8px] rounded-[16px] bg-[rgba(0,0,0,0.52)] backdrop-blur-md border border-[rgba(236,18,86,0.35)] shadow-[0_0_22px_rgba(236,18,86,0.22)]">
            <div className="px-[10px] py-[6px] rounded-[999px] bg-[rgba(0,0,0,0.55)]">
              <p className="text-white text-[12px] font-bold leading-[1.1] whitespace-nowrap">
                🔥 I'm always in cam mode
              </p>
            </div>
            <div className="px-[10px] py-[6px] rounded-[999px] bg-[rgba(0,0,0,0.55)]">
              <p className="text-white text-[12px] font-bold leading-[1.1] whitespace-nowrap">
                😍 You look amazing
              </p>
            </div>
            <div className="px-[10px] py-[6px] rounded-[999px] bg-[rgba(0,0,0,0.55)]">
              <p className="text-white text-[12px] font-bold leading-[1.1] whitespace-nowrap">
                💬 Say hi to me
              </p>
            </div>
          </div>
          
          {/* Main Offer - Dominant Typography */}
          <div className="mb-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white drop-shadow-2xl leading-tight">
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
                50% OFF
              </span>
            </h1>
          </div>
          
          {/* Subheadline */}
          <div className="mb-4">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-xl">
              FANCLUB ACCESS
            </p>
          </div>
          
          {/* Summer Special Badge */}
          <div className="mb-6">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-sm md:text-base font-black px-5 py-2 rounded-full shadow-lg uppercase tracking-widest">
              Summer Studio Special
            </span>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            <Link 
              to="/register" 
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-lg px-8 py-4 rounded-xl shadow-2xl shadow-rose-600/60 transform hover:scale-105 transition-all border-2 border-rose-500/50"
            >
              JOIN NOW →
            </Link>
            <Link 
              to="/videos" 
              className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white font-bold text-lg px-8 py-4 rounded-xl border-2 border-rose-600/60 hover:border-rose-500 transform hover:scale-105 transition-all"
            >
              BROWSE PREVIEWS
            </Link>
          </div>
          
          {/* Trust Row */}
          <div className="flex items-center justify-center gap-4 text-xs md:text-sm text-white/80 font-medium">
            <span>✓ Instant Access</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">✓ Premium Quality</span>
            <span className="hidden sm:inline">•</span>
            <span>✓ Secure Payment</span>
          </div>
          
        </div>
      </div>
    </section>
  );
}