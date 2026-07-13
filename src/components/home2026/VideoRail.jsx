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
    <Link to={`/videos/${video.slug}`} className="group min-w-[calc(50%-12px)] sm:min-w-[calc(33.333%-16px)] lg:min-w-[calc(20%-20px)] block">
      <div className="relative aspect-video rounded-[18px] overflow-hidden bg-[#121212] border border-white/[0.08] transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-black/70">
        <VideoAssetImage video={video} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" showLegacyBadge={false} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-200" />
        {video.duration_seconds ? (
          <span className="absolute right-3 bottom-3 rounded-md bg-black/80 px-2 py-1 text-xs font-black text-white">{formatDuration(video.duration_seconds)}</span>
        ) : null}
        <div className="absolute left-4 right-4 bottom-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <p className="text-white text-sm font-black line-clamp-2">{video.title}</p>
        </div>
      </div>
      <div className="pt-4">
        <h3 className="text-white text-[17px] md:text-[18px] font-black line-clamp-2 leading-tight group-hover:text-[#D81F26] transition-colors duration-200">{video.title}</h3>
        <p className="text-[#B0B0B0] text-sm mt-1 line-clamp-1">{brand?.name || video.performers?.[0]?.display_name || "FLESHLAB Studios"}</p>
      </div>
    </Link>
  );
}

export default function VideoRail({ eyebrow, title, text, videos = [], brands = [], loading }) {
  return (
    <section className="bg-[#070707] px-6 md:px-10 lg:px-16 py-24 md:py-32">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} text={text} link="/videos" linkLabel="Explore Videos" />
        {loading ? (
          <div className="flex gap-6 overflow-hidden">
            {[...Array(5)].map((_, index) => <div key={index} className="min-w-[calc(50%-12px)] sm:min-w-[calc(33.333%-16px)] lg:min-w-[calc(20%-20px)] aspect-video rounded-[18px] bg-[#121212] border border-white/[0.08] animate-pulse" />)}
          </div>
        ) : videos.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-5 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none;}`}</style>
            {videos.map((video) => <div key={video.id} className="snap-start contents"><VideoCard video={video} brands={brands} /></div>)}
          </div>
        ) : (
          <div className="rounded-[18px] border border-white/[0.08] bg-[#121212] p-10 text-[#B0B0B0] text-lg">New releases are coming soon.</div>
        )}
      </div>
    </section>
  );
}