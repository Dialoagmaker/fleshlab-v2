import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function CollectionCard({ title, count, video }) {
  return (
    <a href={`/videos?search=${encodeURIComponent(title)}`} className="group relative min-w-[188px] overflow-hidden rounded border border-white/10 bg-[#111] hover:border-[#E51D2A]/70 transition-colors">
      <MediaImage src={getVideoThumbnailUrl(video)} alt={title} className="h-[58px] w-full opacity-75 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-3">
        <h3 className="text-[14px] font-black uppercase text-white">{title}</h3>
        <p className="mt-1 text-[9px] font-black uppercase text-[#E51D2A]">{count} Videos</p>
      </div>
    </a>
  );
}