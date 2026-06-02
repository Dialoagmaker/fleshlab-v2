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
          
          {/* Mouth Anchor Points (Debug - hidden in production) */}
          <div className="mouth-anchor hidden absolute w-[8px] h-[8px] rounded-full bg-lime-500 z-20 pointer-events-none" style={{ left: "14.5%", top: "35%", transform: "translate(-50%, -50%)" }} />
          <div className="mouth-anchor hidden absolute w-[8px] h-[8px] rounded-full bg-lime-500 z-20 pointer-events-none" style={{ left: "82.5%", top: "31%", transform: "translate(-50%, -50%)" }} />
          
          {/* SVG Connector Lines */}
          <svg className="hidden lg:block absolute inset-0 w-full h-full z-14 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Left connector: from bubble (17%, 38%) to mouth (14.5%, 35%) */}
            <line
              x1="17"
              y1="38"
              x2="14.5"
              y2="35"
              stroke="rgba(236,18,86,0.75)"
              strokeWidth="0.22"
              style={{ filter: "drop-shadow(0 0 4px rgba(236,18,86,0.7))" }}
            />
            {/* Right connector: from bubble (70%, 33%) to mouth (82.5%, 31%) */}
            <line
              x1="70"
              y1="33"
              x2="82.5"
              y2="31"
              stroke="rgba(236,18,86,0.75)"
              strokeWidth="0.22"
              style={{ filter: "drop-shadow(0 0 4px rgba(236,18,86,0.7))" }}
            />
          </svg>
          
          {/* Left Speech Bubble - Live Cam Creator (mouth-aligned) */}
          <div className="hidden lg:block absolute left-[17%] top-[38%] max-w-[220px] translate-y-[-50%] z-15">
            <div className="relative bg-[rgba(0,0,0,0.72)] backdrop-blur-md border border-[rgba(236,18,86,0.65)] rounded-[14px] px-[14px] py-[10px] shadow-[0_0_22px_rgba(236,18,86,0.35)]">
              <p className="text-white text-[13px] font-bold leading-[1.15] whitespace-nowrap">
                I'm always in cam mode 🔴
              </p>
            </div>
          </div>
          
          {/* Right Speech Bubble - Premium Creator (mouth-aligned) */}
          <div className="hidden lg:block absolute left-[70%] top-[33%] max-w-[220px] translate-y-[-50%] z-15">
            <div className="relative bg-[rgba(0,0,0,0.72)] backdrop-blur-md border border-[rgba(236,18,86,0.65)] rounded-[14px] px-[14px] py-[10px] shadow-[0_0_22px_rgba(236,18,86,0.35)]">
              <p className="text-white text-[13px] font-bold leading-[1.15] whitespace-nowrap">
                Guest productions available
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