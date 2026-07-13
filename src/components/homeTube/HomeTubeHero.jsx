import { Camera, Play, Star, UserRound, Video } from "lucide-react";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";

export default function HomeTubeHero({ video, videoCount, performerCount }) {
  const image = getVideoThumbnailUrl(video);
  const href = video?.slug ? `/videos/${video.slug}` : "/videos";
  const stats = [
    { icon: Video, value: `${Math.max(videoCount || 0, 300)}+`, label: "Videos" },
    { icon: UserRound, value: `${Math.max(performerCount || 0, 150)}+`, label: "Models" },
    { icon: Camera, value: "1000+", label: "Photos" },
    { icon: Star, value: "Amateur Only", label: "No fake. No actors." },
  ];

  return (
    <section className="relative border-b border-white/10 bg-[#050505]">
      <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: image ? `url(${image})` : undefined }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-[#050505]/95" />
      <a href={href} className="absolute left-[52%] top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-white md:flex">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-black/35 transition-colors hover:bg-[#E51D2A]"><Play className="ml-1 h-7 w-7 fill-white" /></span>
        <span className="text-[10px] font-black uppercase tracking-wide">Play Trailer</span>
      </a>
      <div className="relative mx-auto grid max-w-[1440px] gap-6 px-5 py-8 md:grid-cols-[1fr_270px] md:px-10 lg:px-14">
        <div className="min-h-[210px] flex items-center">
          <div>
            <h1 className="max-w-[520px] text-[38px] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white md:text-[48px]">
              Real Sex.<br />Real People.<br /><span className="text-[#E51D2A]">Amateur Wins.</span>
            </h1>
            <p className="mt-4 max-w-[430px] text-sm font-bold leading-snug text-white/85">Authentic. Raw. Unfiltered.<br />The hottest amateur content from Asia.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={href} className="inline-flex h-10 items-center gap-2 rounded-sm bg-[#E51D2A] px-8 text-[11px] font-black uppercase text-white hover:bg-[#c91822]"><Play className="w-3 h-3 fill-white" /> Watch Now</a>
              <a href="/register" className="inline-flex h-10 items-center rounded-sm border border-white/40 px-10 text-[11px] font-black uppercase text-white hover:bg-white/10">Join Now</a>
            </div>
          </div>
        </div>
        <aside className="hidden border-l border-white/30 pl-8 md:flex md:flex-col md:justify-center md:gap-5">
          {stats.map((item) => <div key={item.label} className="flex items-center gap-4"><item.icon className="w-8 h-8 text-[#E51D2A]" /><div><p className="text-2xl font-black uppercase leading-none text-white">{item.value}</p><p className="mt-1 text-[10px] font-black uppercase text-white/70">{item.label}</p></div></div>)}
        </aside>
      </div>
    </section>
  );
}