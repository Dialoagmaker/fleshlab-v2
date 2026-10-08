import { Link } from "react-router-dom";
import VideoAssetImage from "@/components/video/VideoAssetImage";
import SectionHeader from "./SectionHeader";

function formatDuration(seconds) {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VideoCard({ video, brands = [] }) {
  const brand = brands.find((item) => item.id === video.brand_id);

  return (
    <Link to={`/videos/${video.slug}`} className="group shrink-0 basis-[72%] sm:basis-[31.5%] lg:basis-[18.9%] block">
      <div className="relative aspect-video rounded-[14px] overflow-hidden bg-[#151515] border border-white/10 transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-black/50">
        <VideoAssetImage video={video} alt={video.title} className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.03]" showLegacyBadge={false} />
        {video.duration_seconds ? (
          <span className="absolute right-2.5 bottom-2.5 rounded-md bg-black/85 px-2 py-1 text-xs font-bold text-white">{formatDuration(video.duration_seconds)}</span>
        ) : null}
      </div>
      <div className="pt-3 min-h-[76px]">
        <h3 className="text-white text-base md:text-[17px] font-bold line-clamp-2 leading-tight min-h-[40px]">{video.title}</h3>
        <p className="text-[#828282] text-sm mt-1 line-clamp-1">{brand?.name || video.performers?.[0]?.display_name || "FLESHLAB Studios"}</p>
      </div>
    </Link>
  );
}

export default function VideoRail({ eyebrow, title, text, videos = [], brands = [], loading }) {
  return (
    <section className="bg-[#050505] px-5 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} text={text} link="/videos" linkLabel="View All" />
        {loading ? (
          <div className="flex gap-5 overflow-hidden">
            {[...Array(5)].map((_, index) => <div key={index} className="shrink-0 basis-[72%] sm:basis-[31.5%] lg:basis-[18.9%] aspect-video rounded-[14px] bg-[#151515] border border-white/10 animate-pulse" />)}
          </div>
        ) : videos.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none;}`}</style>
            {videos.map((video) => <VideoCard key={video.id} video={video} brands={brands} />)}
          </div>
        ) : (
          <div className="rounded-[14px] border border-white/10 bg-[#151515] p-8 text-[#B7B7B7] text-base">No videos available yet.</div>
        )}
      </div>
    </section>
  );
}