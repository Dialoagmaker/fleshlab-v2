import { useState } from "react";
import { Clock, Crown, Eye, Flame, Play, Star, Zap } from "lucide-react";
import VideoAssetImage from "@/components/video/VideoAssetImage";
import VideoPreviewPlayer from "@/components/video/VideoPreviewPlayer";

function accessBadges(video) {
  const badges = [];
  if (video.is_exclusive) badges.push(["Exclusive", "bg-purple-600 text-white", Zap]);
  if (video.access_tier === "fanclub") badges.push(["FanClub", "bg-violet-600 text-white", Crown]);
  if (video.access_tier === "ppv") badges.push(["Premium", "bg-[#f0183d] text-white", Star]);
  if (video.access_tier === "free") badges.push(["Free", "bg-emerald-500 text-black", Flame]);
  if (video.trailer_url || video.preview_gif_url) badges.push(["Preview", "bg-white text-black", Eye]);
  return badges.slice(0, 3);
}

export default function CollectionVideoCard({ video, large = false }) {
  const [hovered, setHovered] = useState(false);
  const hasDuration = video.duration_seconds && video.duration_seconds > 0;
  const duration = hasDuration ? `${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, "0")}` : null;

  return (
    <a href={`/videos/${video.slug}`} className={`group block shrink-0 ${large ? "w-[82vw] md:w-[520px]" : "w-[76vw] sm:w-[360px]"}`}>
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-black transition duration-500 hover:-translate-y-1 hover:border-[#f0183d]/55 hover:shadow-[0_26px_90px_rgba(240,24,61,0.16)]">
        <div className="relative aspect-video overflow-hidden bg-[#090909]" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <VideoAssetImage video={video} alt={video.title} className="transition duration-[900ms] group-hover:scale-105" />
          {hovered && <VideoPreviewPlayer video={video} autoPlay loop showControls={false} className="absolute inset-0" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/16 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {accessBadges(video).map(([label, className, Icon]) => <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide ${className}`}><Icon className="h-3 w-3" />{label}</span>)}
          </div>
          {duration && <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/82 px-3 py-1.5 text-[10px] font-bold text-white"><Clock className="h-3 w-3" />{duration}</span>}
          <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black opacity-0 transition duration-500 group-hover:opacity-100"><Play className="h-4 w-4 fill-current" /></div>
        </div>
        <div className="p-4">
          <h3 className={`${large ? "text-lg" : "text-sm"} font-black leading-tight text-white line-clamp-1`}>{video.title}</h3>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/38">FLESHLAB Collection</p>
        </div>
      </article>
    </a>
  );
}