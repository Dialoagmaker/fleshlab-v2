import { ArrowRight, Play, Sparkles } from "lucide-react";
import VideoAssetImage from "@/components/video/VideoAssetImage";

export default function CollectionHero({ brand, heroVideo, count = 0 }) {
  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
      {brand.cover_image_url ? <img src={brand.cover_image_url} alt={brand.name} className="absolute inset-0 h-full w-full object-cover opacity-82" /> : heroVideo && <VideoAssetImage video={heroVideo} alt={brand.name} className="absolute inset-0 h-full w-full object-cover opacity-82" />}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#040608_0%,rgba(4,6,8,0.92)_35%,rgba(4,6,8,0.25)_72%,rgba(4,6,8,0.78)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#040608] to-transparent" />
      <div className="relative z-10 flex min-h-[560px] max-w-[620px] flex-col justify-center px-6 py-14 md:px-10">
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#f0183d]/35 bg-[#12060a]/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#f0183d] backdrop-blur"><Sparkles className="h-3.5 w-3.5" /> Curated Collection</div>
        <h1 className="fl-condensed text-[70px] uppercase leading-[0.88] tracking-[-0.025em] text-white md:text-[96px]">{brand.name}</h1>
        {brand.description && <p className="mt-5 max-w-md text-base leading-7 text-white/68">{brand.description}</p>}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/14 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white/72">{count} productions</span>
          {heroVideo && <a href={`/videos/${heroVideo.slug}`} className="inline-flex items-center gap-3 rounded bg-[#f0183d] px-7 py-3 text-[10px] font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#ff3152]"><Play className="h-4 w-4 fill-current" /> Watch Collection</a>}
          <a href="#latest-releases" className="inline-flex items-center gap-3 rounded border border-white/18 bg-black/30 px-7 py-3 text-[10px] font-black uppercase tracking-wide text-white/78 transition hover:border-[#f0183d] hover:text-white">Explore <ArrowRight className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}