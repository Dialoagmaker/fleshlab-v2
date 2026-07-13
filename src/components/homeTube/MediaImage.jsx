import { ImageOff } from "lucide-react";

export default function MediaImage({ src, alt, className = "" }) {
  if (!src) {
    return (
      <div className={`bg-[#141414] border border-white/10 flex items-center justify-center ${className}`}>
        <ImageOff className="w-7 h-7 text-white/25" />
      </div>
    );
  }

  return <img src={src} alt={alt || "FLESHLAB media"} loading="lazy" className={`object-cover ${className}`} />;
}