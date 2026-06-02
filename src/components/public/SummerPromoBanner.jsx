import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Banner Container - Full Width, Proper Height */}
      <div className="relative w-full" style={{ height: "320px" }}>
        
        {/* User's Banner Image - Object Fit Cover */}
        <img
          src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b873d4a1_image.png"
          alt="FLESHLAB Summer Promo - 50% OFF Fanclub Access"
          className="w-full h-full object-cover"
        />

        {/* Invisible Click Zones for CTAs */}
        <div className="absolute inset-0 flex">
          {/* Left Zone - Live Cams → Fanclub */}
          <Link to="/fanclub" className="flex-1 h-full cursor-pointer" aria-label="Live Cams" />
          
          {/* Center Zone - Main CTAs */}
          <div className="flex-1 h-full flex items-center justify-center gap-4">
            <Link to="/fanclub" className="h-14 w-44 cursor-pointer" aria-label="Join Now" />
            <Link to="/videos" className="h-14 w-52 cursor-pointer" aria-label="Browse Previews" />
          </div>
          
          {/* Right Zone - Premium Videos */}
          <Link to="/videos" className="flex-1 h-full cursor-pointer" aria-label="Premium Videos" />
        </div>

        {/* Bottom Gradient Fade into Video Grid */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}