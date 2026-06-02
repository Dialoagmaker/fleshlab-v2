import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="w-full bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] h-[320px] md:h-[340px] lg:h-[360px] overflow-hidden relative">
      {/* Background Image - Blurred for atmosphere */}
      <div className="absolute inset-0">
        <img
          src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/e9aeecccb_ChatGPTImageJun3202602_34_57AM.png"
          alt=""
          className="w-full h-full object-cover opacity-70"
          style={{ 
            objectPosition: "50% 35%"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      </div>
      
      {/* Content - Sharp HTML Text */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="max-w-4xl text-center">
          {/* Top Badge */}
          <div className="mb-3">
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
              Summer Studio Special
            </span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 drop-shadow-2xl">
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
              50% OFF
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-6 drop-shadow-xl">
            FANCLUB ACCESS
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Link to="/register" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg shadow-rose-600/50 transform hover:scale-105 transition-all text-sm md:text-base">
              JOIN NOW →
            </Link>
            <Link to="/videos" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold px-6 py-3 rounded-lg border border-white/30 transform hover:scale-105 transition-all text-sm md:text-base">
              BROWSE PREVIEWS
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}