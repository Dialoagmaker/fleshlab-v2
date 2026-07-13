import { Play } from "lucide-react";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

function formatDuration(seconds) {
  if (!seconds) return "18:27";
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

export default function VideoTile({ video, label = "NEW" }) {
  const href = video?.slug ? `/videos/${video.slug}` : "/videos";
  return (
    <a href={href} className="group block min-w-[168px] overflow-hidden rounded border border-white/10 bg-[#111] hover:border-[#E51D2A]/70 transition-colors">
      <div className="relative h-[94px] overflow-hidden">
        <MediaImage src={getVideoThumbnailUrl(video)} alt={video?.title} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
        <span className="absolute left-2 top-2 bg-[#E51D2A] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">{label}</span>
        <span className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-sm bg-black/75 text-white"><Play className="w-3 h-3 fill-white" /></span>
        <span className="absolute bottom-1.5 right-1.5 rounded-sm bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white">{formatDuration(video?.duration_seconds)}</span>
      </div>
      <div className="px-2 py-2">
        <h3 className="line-clamp-2 text-[11px] font-black leading-tight text-white">{video?.title || "FLESHLAB Production"}</h3>
        <p className="mt-1 text-[9px] text-white/50">Asia · Amateur</p>
      </div>
    </a>
  );
}