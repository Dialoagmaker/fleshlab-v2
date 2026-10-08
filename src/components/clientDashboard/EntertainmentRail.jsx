import { Link } from "react-router-dom";
import { Play, Radio } from "lucide-react";

function imageFor(item) {
  return item.primary_thumbnail_url || item.cover_image_url || item.profile_image_url || "";
}

export default function EntertainmentRail({ title, subtitle, items = [], type = "video", emptyLabel }) {
  if (!items.length) {
    if (!emptyLabel) return null;
    return <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-white/45">{emptyLabel}</section>;
  }

  const hrefFor = (item) => {
    if (type === "creator") return `/performers/${item.slug}`;
    if (type === "news") return `/news/${item.slug}`;
    if (type === "collection") return item.href || "/videos";
    if (type === "live") return item.href || "/live";
    return `/videos/${item.slug}`;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.035em] text-white md:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-white/42">{subtitle}</p>}
        </div>
        <Link to={type === "news" ? "/news" : type === "creator" ? "/performers" : type === "live" ? "/live" : "/videos"} className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-[#f0183d] hover:text-white">View all</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <Link key={item.id || item.title || index} to={hrefFor(item)} className="group relative block w-[260px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d10] transition duration-500 hover:-translate-y-1 hover:border-[#f0183d]/55 hover:shadow-2xl hover:shadow-[#f0183d]/10 md:w-[320px]">
            <div className="relative aspect-video overflow-hidden bg-[#101216]">
              {imageFor(item) ? <img src={imageFor(item)} alt={item.title || item.display_name} className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-110 group-hover:opacity-100" loading="lazy" /> : <div className="h-full w-full bg-gradient-to-br from-[#1a1115] to-[#050608]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white/80 backdrop-blur">
                {type === "live" ? <Radio className="h-3.5 w-3.5 text-[#f0183d]" /> : <Play className="h-3.5 w-3.5 text-[#f0183d]" />}
                {type === "creator" ? "Creator" : type === "news" ? "News" : type === "live" ? "Live" : "Watch"}
              </div>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 text-base font-black text-white">{item.title || item.display_name}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/45">{item.excerpt || item.short_summary || item.bio || item.description || item.label || "Curated for your next FLESHLAB session."}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}