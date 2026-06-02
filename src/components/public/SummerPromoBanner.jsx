import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full bg-[#050505]">
      {/* Banner Container - No Crop, Natural Image Ratio */}
      <div className="relative w-full overflow-visible">
        
        {/* Banner Image - Full Width, Natural Height, No Cropping */}
        <img
          src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b873d4a1_image.png"
          alt="FLESHLAB Summer Studio Special - 50% OFF Fanclub Access"
          className="w-full h-auto block"
          style={{ maxHeight: "420px", objectFit: "contain" }}
        />

        {/* Invisible Click Zones for CTAs - Positioned over button areas */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Left Zone - Live Cams → Fanclub */}
          <Link to="/fanclub" className="flex-1 h-full cursor-pointer" aria-label="Live Cams" />
          
          {/* Center Zone - Main CTAs */}
          <div className="flex-1 h-full flex items-center justify-center gap-4">
            <Link to="/fanclub" className="h-14 w-44 cursor-pointer" aria-label="Join Now - 50% OFF" />
            <Link to="/videos" className="h-14 w-52 cursor-pointer" aria-label="Browse Premium Videos" />
          </div>
          
          {/* Right Zone - Premium Videos */}
          <Link to="/videos" className="flex-1 h-full cursor-pointer" aria-label="Premium Videos" />
        </div>

        {/* Subtle Bottom Fade - Only at very bottom, doesn't cover content */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" style={{ opacity: 0.6 }} />
      </div>
    </section>
  );
}