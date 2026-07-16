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
        <KrakenSectionTitle eyebrow="Featured releases" title="Featured releases." copy="Real FLESHLAB productions presented as adult-film campaign banners." />
        <div className="grid gap-6 lg:grid-cols-2">
          {releases.map((video, index) => {
            const isHero = video.id === heroVideo?.id;
            const performerName = isHero ? heroPerformer?.display_name || "THEFITMASTER" : "FLESHLAB";
            const title = isHero ? "HOTEL SESSIONS" : video.title;
            return (
              <a key={video.id || index} href={video.slug ? `/videos/${video.slug}` : "/videos"} className="group relative min-h-[520px] overflow-hidden rounded-[34px] border border-white/10 bg-black shadow-[0_38px_110px_rgba(0,0,0,0.65)]">
                <MediaImage src={getVideoThumbnailUrl(video)} alt={title} className="absolute inset-0 h-full w-full object-cover object-[56%_center] opacity-95 brightness-[0.78] contrast-[1.12] saturate-[0.9] transition duration-1000 group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.26)_42%,rgba(0,0,0,0.02)_68%,rgba(0,0,0,0.62)_100%)]" />
                <div className="absolute -left-16 top-16 h-4 w-72 -rotate-12 bg-[#E51D2A] shadow-[0_0_30px_rgba(229,29,42,0.34)]" />
                <div className="absolute right-[-70px] top-[-40px] h-[115%] w-40 rotate-12 bg-[#E51D2A]/24" />
                <div className="absolute bottom-0 left-0 max-w-[70%] p-7 md:p-9">
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#E51D2A]">{performerName}</p>
                  <h3 className="kraken-distressed mt-2 text-4xl font-black uppercase leading-[0.84] tracking-[-0.065em] text-white md:text-6xl">{title}</h3>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/70"><span>{runtime(video.duration_seconds)}</span><span>FLESHLAB</span></div>
                  <span className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#E51D2A] px-6 text-xs font-black uppercase text-white"><Play className="h-4 w-4 fill-white" /> WATCH NOW</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}