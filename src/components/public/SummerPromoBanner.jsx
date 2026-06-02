import { Link } from "react-router-dom";

export default function SummerPromoBanner() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Banner Container - Full Width */}
      <div className="relative w-full" style={{ aspectRatio: "1920/320" }}>
        
        {/* User's Banner Image */}
        <img
          src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b873d4a1_image.png"
          alt="FLESHLAB Summer Promo - 50% OFF Fanclub Access"
          className="w-full h-full object-cover"
        />

        {/* Transparent CTA Overlay (optional - only if needed for clickability) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex">
            {/* Left CTA Zone - Live Cams */}
            <Link to="/fanclub" className="flex-1/3 h-full cursor-pointer" />
            
            {/* Center CTA Zone - Main Buttons */}
            <div className="flex-1 h-full flex items-center justify-center gap-4">
              <Link to="/fanclub" className="h-12 w-40 cursor-pointer" />
              <Link to="/videos" className="h-12 w-48 cursor-pointer" />
            </div>
            
            {/* Right CTA Zone - Premium Videos */}
            <Link to="/videos" className="flex-1/3 h-full cursor-pointer" />
          </div>
        </div>
      </div>
    </section>
  );
}