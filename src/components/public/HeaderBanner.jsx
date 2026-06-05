import { useState } from 'react';
import { X } from 'lucide-react';

export default function HeaderBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const bannerUrl = `${import.meta.env.VITE_R2_PUBLIC_URL || 'https://cdn.fleshlab.com'}/studios/6a1ca7cdc29d96ab4c62ac98/banner/ChatGPT Image 5. Juni 2026, 12.46_38.png`;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-black">
      <div className="relative w-full h-24 sm:h-32 overflow-hidden">
        <img
          src={bannerUrl}
          alt="Studio Banner"
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}