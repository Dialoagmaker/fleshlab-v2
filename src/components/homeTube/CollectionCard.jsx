import { ArrowUpRight } from "lucide-react";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function CollectionCard({ title, count, video }) {
  return (
    <a href={`/videos?search=${encodeURIComponent(title)}`} className="group relative block min-h-[220px] overflow-hidden rounded-[30px] bg-[#101010] shadow-xl shadow-black/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
      <MediaImage src={getVideoThumbnailUrl(video)} alt={title} className="absolute inset-0 h-full w-full opacity-70 transition-transform duration-500 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/62 to-black/10" />
      <div className="absolute inset-0 flex flex-col justify-end p-7">
        {count > 0 && <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#E51D2A]">{count} {count === 1 ? "Video" : "Videos"}</p>}
        <div className="flex items-end justify-between gap-4">
          <h3 className="max-w-[260px] text-3xl font-black uppercase leading-none tracking-[-0.04em] text-white">{title}</h3>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors group-hover:bg-[#E51D2A]"><ArrowUpRight className="h-5 w-5" /></span>
        </div>
      </div>
    </a>
  );
}