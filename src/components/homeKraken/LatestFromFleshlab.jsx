import { Play } from "lucide-react";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";
import KrakenSectionTitle from "./KrakenSectionTitle";

function formatDuration(seconds) {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

export default function LatestFromFleshlab({ videos = [] }) {
  const latest = videos.slice(0, 8);
  if (!latest.length) return null;

  return (
    <section className="border-y border-white/10 bg-[#080808] px-5 py-20 text-white md:px-10 md:py-28 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <KrakenSectionTitle eyebrow="Latest videos" title="Watch now." copy="Real titles, real releases and clear paths into the catalog." />
        <div className="grid grid-flow-col auto-cols-[84%] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[46%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
          {latest.map((video, index) => (
            <a key={video.id || index} href={video.slug ? `/videos/${video.slug}` : "/videos"} className="group overflow-hidden rounded-[26px] border border-white/10 bg-[#101010] transition duration-500 hover:-translate-y-1 hover:border-[#E51D2A]/50">
              <div className="relative aspect-[16/10] overflow-hidden"><MediaImage src={getVideoThumbnailUrl(video)} alt={video.title} className="h-full w-full transition duration-700 group-hover:scale-[1.06]" /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" /><span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold text-white">{formatDuration(video.duration_seconds)}</span><span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/16 opacity-0 backdrop-blur transition group-hover:opacity-100"><Play className="ml-1 h-4 w-4 fill-white" /></span></div>
              <div className="p-5"><h3 className="line-clamp-2 min-h-[2.6em] text-lg font-black uppercase leading-tight tracking-[-0.03em]">{video.title}</h3><div className="mt-4 flex flex-wrap gap-2">{video.categories?.slice(0, 2).map((cat) => <span key={cat} className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase text-white/56">{cat}</span>)}</div></div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}