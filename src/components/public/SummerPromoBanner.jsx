import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="w-full bg-[#050505]" style={{ lineHeight: 0 }}>
      {/* Approved Banner Image - Full Width, Natural Height */}
      <img
        src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b873d4a1_image.png"
        alt="FLESHLAB Summer Studio Special - 50% OFF Fanclub Access"
        className="w-full h-auto block max-w-none"
        style={{ 
          objectFit: "unset",
          objectPosition: "unset"
        }}
      />

      {/* Invisible Click Zones for CTAs - Overlay on button areas */}
      <div className="relative -mt-[120px] h-[120px] flex items-center justify-center pointer-events-none">
        {/* Left Zone - Live Cams → Fanclub */}
        <Link to="/fanclub" className="flex-1 h-full cursor-pointer pointer-events-auto" aria-label="Live Cams" />
        
        {/* Center Zone - Main CTAs */}
        <div className="flex-1 h-full flex items-center justify-center gap-4 pointer-events-auto">
          <Link to="/fanclub" className="h-14 w-44 cursor-pointer" aria-label="Join Now - 50% OFF" />
          <Link to="/videos" className="h-14 w-52 cursor-pointer" aria-label="Browse Premium Videos" />
        </div>
        
        {/* Right Zone - Premium Videos */}
        <Link to="/videos" className="flex-1 h-full cursor-pointer pointer-events-auto" aria-label="Premium Videos" />
      </div>
    </section>
  );
}