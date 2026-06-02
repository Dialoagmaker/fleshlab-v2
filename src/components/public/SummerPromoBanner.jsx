import { Play, Star, Zap, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-r from-red-950 via-red-900 to-red-950 py-8 md:py-12">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/5bea3e4ca_generated_image.png"
          alt=""
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
      </div>

      {/* Palm Silhouettes (decorative) */}
      <div className="absolute left-0 top-0 h-full w-32 md:w-64 z-10 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent" />
      </div>
      <div className="absolute right-0 top-0 h-full w-32 md:w-64 z-10 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-l from-black to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-[1920px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Left: LIVE CAMS */}
          <div className="hidden lg:block relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="aspect-[4/3] relative">
              <img
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=400&fit=crop"
                alt="Live Cams Model"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* LIVE Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                LIVE
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">LIVE CAMS</h3>
                <p className="text-white/80 text-xs mb-3">Interactive shows daily</p>
                <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs h-8 px-4 backdrop-blur-sm">
                  Watch Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Center: Main Promo */}
          <div className="text-center px-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4 shadow-lg shadow-rose-600/30">
              <Star className="w-4 h-4 fill-current" />
              SUMMER STUDIO SPECIAL
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg leading-tight">
              50% OFF
              <br />
              <span className="text-rose-500">FANCLUB ACCESS</span>
            </h2>

            {/* Supporting Text */}
            <p className="text-white/90 text-sm md:text-base mb-6 max-w-md mx-auto">
              Watch public previews. Unlock full studio scenes.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/fanclub">
                <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3 rounded-full text-sm md:text-base h-auto shadow-lg shadow-rose-600/30">
                  <Lock className="w-4 h-4 mr-2" />
                  JOIN NOW
                </Button>
              </Link>
              <Link to="/videos">
                <Button variant="outline" className="border-white/60 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-full text-sm md:text-base h-auto backdrop-blur-sm">
                  <Play className="w-4 h-4 mr-2" />
                  BROWSE PREVIEWS
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex gap-4 justify-center mt-6 text-white/60 text-xs">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>Premium Quality</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Secure Payment</span>
              </div>
            </div>
          </div>

          {/* Right: PREMIUM VIDEOS */}
          <div className="hidden lg:block relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="aspect-[4/3] relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop"
                alt="Premium Videos Model"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* Premium Badge */}
              <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                PREMIUM
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">PREMIUM VIDEOS</h3>
                <p className="text-white/80 text-xs mb-3">Exclusive studio productions</p>
                <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs h-8 px-4 backdrop-blur-sm">
                  Explore <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}