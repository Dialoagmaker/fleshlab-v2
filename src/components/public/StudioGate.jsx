import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * StudioGate - Fullscreen cinematic entry experience
 * Shows on first visit, skips on return (sessionStorage)
 */
export default function StudioGate({ onEnter }) {
  const [visible, setVisible] = useState(true);
  const [entering, setEntering] = useState(false);

  const handleEnter = () => {
    setEntering(true);
    // Smooth fade-out animation
    setTimeout(() => {
      setVisible(false);
      // Persist gate entry
      sessionStorage.setItem('vaultEntered', 'true');
      // Callback to parent
      if (onEnter) onEnter();
    }, 800);
  };

  // Check if already entered (return visit)
  useEffect(() => {
    const hasEntered = sessionStorage.getItem('vaultEntered');
    if (hasEntered) {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-all duration-800 ease-in-out ${
        entering ? 'opacity-0 translate-y-[-50px]' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#0A0A0A]">
        {/* Cinematic background (still image for performance) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: 'url(https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg)'
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/60 to-[#0A0A0A]" />
      </div>

      {/* Content */}
      <div className="relative h-screen flex flex-col items-center justify-center text-center px-4">
        {/* Wordmark */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 tracking-wider font-serif">
          F L E S H L A B
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-[#F5F5F5]/80 mb-2 font-light">
          PRIVATE STUDIO ARCHIVE
        </p>

        {/* Compliance notice */}
        <p className="text-sm text-[#F5F5F5]/60 mb-8 max-w-md">
          All performers verified 18+ • Members only
        </p>

        {/* Enter button */}
        <Button
          onClick={handleEnter}
          className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-6 text-lg font-medium rounded-lg transition-all hover:scale-105"
        >
          ENTER THE VAULT
        </Button>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-[#F5F5F5]/60" />
        </div>
      </div>
    </div>
  );
}