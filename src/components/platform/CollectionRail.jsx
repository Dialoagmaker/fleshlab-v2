import { ArrowRight } from "lucide-react";
import VideoAssetImage from "@/components/video/VideoAssetImage";

export default function CollectionRail({ title, subtitle, videos = [] }) {
  if (!videos.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="fl-condensed text-[42px] uppercase leading-none tracking-[-0.02em] text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-white/45">{subtitle}</p>}
        </div>
        <span className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-wide text-[#f0183d] md:flex">Series Rail <ArrowRight className="h-4 w-4" /></span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.slice(0, 10).map((video) => (
          <a key={video.id} href={`/videos/${video.slug}`} className="group w-[78vw] shrink-0 sm:w-[390px]">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_70px_rgba(0,0,0,0.35)] transition duration-500 group-hover:-translate-y-1 group-hover:border-[#f0183d]/50">
              <VideoAssetImage video={video} alt={video.title} className="transition duration-700 group-hover:scale-105 group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-black leading-tight text-white line-clamp-2">{video.title}</h3>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#f0183d]">FLESHLAB Original</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}