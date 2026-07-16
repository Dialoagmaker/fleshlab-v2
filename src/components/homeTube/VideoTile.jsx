import { Play } from "lucide-react";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

function formatDuration(seconds) {
  if (!seconds) return "18:27";
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

export default function VideoTile({ video, label = "Featured" }) {
  const href = video?.slug ? `/videos/${video.slug}` : "/videos";
  return (
    <a href={href} className="group block overflow-hidden rounded-[28px] bg-[#101010] shadow-xl shadow-black/25 transition-all duration-700 hover:-translate-y-1 hover:shadow-[0_32px_84px_rgba(0,0,0,0.74)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <MediaImage src={getVideoThumbnailUrl(video)} alt={video?.title} className="h-full w-full transition-transform duration-1000 ease-out group-hover:scale-[1.07]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-85" />
        <span className="absolute left-4 top-4 rounded-full bg-[#E51D2A] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">{label}</span>
        <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">{formatDuration(video?.duration_seconds)}</span>
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/14 text-white opacity-0 backdrop-blur transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"><Play className="ml-1 h-5 w-5 fill-white" /></span>
        <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
          <h3 className="line-clamp-2 text-lg font-black leading-tight text-white">{video?.title || "FLESHLAB Production"}</h3>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-white/50">Asia · Amateur Studio</p>
        </div>
      </div>
    </a>
  );
}