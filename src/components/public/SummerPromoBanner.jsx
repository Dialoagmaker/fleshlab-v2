import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Banner Container - Full Width, Optimized Height */}
      <div className="relative w-full" style={{ height: "400px" }}>
        
        {/* Banner Image - Positioned to show TOP content (badge, headline) */}
        <img
          src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b873d4a1_image.png"
          alt="FLESHLAB Summer Studio Special - 50% OFF Fanclub Access"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 25%" }}
        />

        {/* Invisible Click Zones for CTAs - Positioned in lower third */}
        <div className="absolute inset-0 flex items-end pb-20">
          {/* Left Zone - Live Cams → Fanclub */}
          <Link to="/fanclub" className="flex-1 h-16 cursor-pointer" aria-label="Live Cams" />
          
          {/* Center Zone - Main CTAs */}
          <div className="flex-1 h-16 flex items-center justify-center gap-6">
            <Link to="/fanclub" className="h-12 w-40 cursor-pointer" aria-label="Join Now - 50% OFF" />
            <Link to="/videos" className="h-12 w-48 cursor-pointer" aria-label="Browse Premium Videos" />
          </div>
          
          {/* Right Zone - Premium Videos */}
          <Link to="/videos" className="flex-1 h-16 cursor-pointer" aria-label="Premium Videos" />
        </div>

        {/* Bottom Gradient Fade into Video Grid - Smooth transition */}
        <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent pointer-events-none" />
      </div>
    </section>
  );
}