import { ArrowRight, Play, Sparkles } from "lucide-react";
import VideoAssetImage from "@/components/video/VideoAssetImage";
import VideoPreviewPlayer from "@/components/video/VideoPreviewPlayer";

export default function CinematicFeaturedProduction({ video }) {
  if (!video) {
    return <div className="h-[520px] rounded-[2rem] border border-white/10 bg-white/[0.035] animate-pulse" />;
  }

  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
      <VideoAssetImage video={video} alt={video.title} className="absolute inset-0 h-full w-full object-cover opacity-82" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#040608_0%,rgba(4,6,8,0.9)_34%,rgba(4,6,8,0.22)_70%,rgba(4,6,8,0.72)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#040608] to-transparent" />
      {video.trailer_url && <VideoPreviewPlayer video={video} autoPlay loop showControls={false} className="absolute inset-y-0 right-0 hidden w-[58%] opacity-65 lg:block" />}
      <div className="relative z-10 flex min-h-[560px] max-w-[600px] flex-col justify-center px-6 py-14 md:px-10">
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#f0183d]/35 bg-[#12060a]/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#f0183d] backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Featured Production
        </div>
        <h1 className="fl-condensed text-[64px] uppercase leading-[0.88] tracking-[-0.025em] text-white md:text-[86px]">{video.title}</h1>
        <p className="mt-5 max-w-md text-base leading-7 text-white/68">{video.short_summary || video.description || "A curated FLESHLAB production built around real creators, atmosphere and story."}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`/videos/${video.slug}`} className="inline-flex items-center gap-3 rounded bg-[#f0183d] px-7 py-3 text-[10px] font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#ff3152]"><Play className="h-4 w-4 fill-current" /> Watch Now</a>
          <a href="#collections" className="inline-flex items-center gap-3 rounded border border-white/18 bg-black/30 px-7 py-3 text-[10px] font-black uppercase tracking-wide text-white/78 transition hover:border-[#f0183d] hover:text-white">Explore Worlds <ArrowRight className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}