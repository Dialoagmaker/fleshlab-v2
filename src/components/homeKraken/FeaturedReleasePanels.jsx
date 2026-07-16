import { ArrowUpRight, Play } from "lucide-react";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";
import KrakenSectionTitle from "./KrakenSectionTitle";

function runtime(seconds) {
  if (!seconds) return "Release";
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

export default function FeaturedReleasePanels({ videos = [], heroVideo, heroPerformer }) {
  const releases = [heroVideo, ...videos.filter((video) => video?.id !== heroVideo?.id)].filter(Boolean).slice(0, 2);
  if (!releases.length) return null;

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#080808] px-5 py-20 text-white md:px-10 md:py-28 lg:px-14">
      <div className="kraken-grain" />
      <div className="relative mx-auto max-w-[1440px]">
        <KrakenSectionTitle eyebrow="Featured release campaigns" title="Studio premieres." copy="Real amateur footage presented like major FLESHLAB releases." />
        <div className="grid gap-6 lg:grid-cols-2">
          {releases.map((video, index) => {
            const isHero = video.id === heroVideo?.id;
            const performerName = isHero ? heroPerformer?.display_name || "THEFITMASTER" : "FLESHLAB";
            const title = isHero ? "HOTEL SESSIONS" : video.title;
            return (
              <a key={video.id || index} href={video.slug ? `/videos/${video.slug}` : "/videos"} className="group relative min-h-[560px] overflow-hidden rounded-[34px] border border-white/10 bg-black shadow-[0_38px_110px_rgba(0,0,0,0.65)]">
                <MediaImage src={getVideoThumbnailUrl(video)} alt={title} className="absolute inset-0 h-full w-full opacity-75 transition duration-1000 group-hover:scale-[1.06] group-hover:opacity-90" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,5,5,0.95)_0%,rgba(5,5,5,0.54)_45%,rgba(229,29,42,0.2)_100%)]" />
                <div className="absolute left-6 top-6 rounded-full bg-[#E51D2A] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em]">{video.is_exclusive ? "Exclusive" : "FLESHLAB Original"}</div>
                <div className="kraken-paint-stroke absolute left-6 top-24 h-3 w-44" />
                <div className="absolute inset-x-0 bottom-0 p-7 md:p-10">
                  <p className="text-3xl font-black uppercase leading-none tracking-[-0.06em] text-white/72 md:text-5xl">{performerName}</p>
                  <h3 className="kraken-distressed mt-2 max-w-[10ch] text-6xl font-black uppercase leading-[0.76] tracking-[-0.09em] text-white md:text-8xl">{title}</h3>
                  <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/70"><span>{runtime(video.duration_seconds)}</span><span>Real amateur</span></div>
                  <div className="mt-7 flex flex-wrap gap-3"><span className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-xs font-black uppercase text-black"><Play className="h-4 w-4 fill-black" /> Watch Now</span><span className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-xs font-black uppercase text-white">View Release <ArrowUpRight className="h-4 w-4" /></span></div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}