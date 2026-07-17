import { ArrowRight, BadgeCheck, Flame, MapPin, Radio, Sparkles, Video } from "lucide-react";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

const worlds = ["Hotel Sessions", "Beach Escape", "Gym", "Massage", "Home Made", "Student Life"];
const objectPositions = ["object-[center_24%]", "object-[center_34%]", "object-[46%_28%]", "object-[56%_32%]", "object-[center_42%]"];

function hashKey(value = "") {
  return String(value).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getProductionWorld(performer) {
  const text = `${performer.display_name || ""} ${performer.bio || ""}`.toLowerCase();
  if (text.includes("hotel")) return "Hotel Sessions";
  if (text.includes("beach") || text.includes("travel")) return "Beach Escape";
  if (text.includes("gym") || text.includes("fit")) return "Gym";
  if (text.includes("massage")) return "Massage";
  if (text.includes("student")) return "Student Life";
  if (text.includes("home")) return "Home Made";
  return worlds[hashKey(performer.slug || performer.display_name) % worlds.length];
}

function isNewCreator(performer) {
  if (!performer.created_date) return false;
  const created = new Date(performer.created_date).getTime();
  return Number.isFinite(created) && Date.now() - created < 1000 * 60 * 60 * 24 * 90;
}

export default function StoryPerformerCard({ performer, badge, featured = false, imageVariant = 0 }) {
  const videoCount = performer.video_count || 0;
  const comingSoon = videoCount === 0;
  const image = buildPublicAssetUrl(imageVariant % 2 === 0 ? performer.cover_image_url || performer.profile_image_url : performer.profile_image_url || performer.cover_image_url);
  const position = objectPositions[hashKey(performer.slug || performer.display_name) % objectPositions.length];
  const live = performer.is_live || performer.live_status === "live";
  const world = getProductionWorld(performer);
  const showNew = badge === "new" || isNewCreator(performer);
  const showTrending = badge === "trending";

  return (
    <a href={`/performers/${performer.slug}`} onClick={comingSoon ? (e) => e.preventDefault() : undefined} className={`group block ${comingSoon ? "cursor-default" : ""}`}>
      <article className={`relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black transition duration-500 ${featured ? "min-h-[560px]" : "min-h-[430px]"} ${comingSoon ? "opacity-60 grayscale" : "hover:-translate-y-1 hover:border-[#f0183d]/55 hover:shadow-[0_26px_90px_rgba(240,24,61,0.18)]"}`}>
        {image ? <img src={image} alt={performer.display_name} className={`absolute inset-0 h-full w-full object-cover ${position} transition duration-[1200ms] group-hover:scale-105 group-hover:saturate-110`} loading="lazy" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#171717] to-black" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/24 to-black/8" />
        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
          {live && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0183d] px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-white"><Radio className="h-3 w-3" /> Live</span>}
          {showTrending && <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-white"><Flame className="h-3 w-3" /> Trending</span>}
          {showNew && <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-3 py-1.5 text-[9px] font-black uppercase tracking-wide"><Sparkles className="h-3 w-3" /> New Creator</span>}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-white/62">
            {performer.verified && <BadgeCheck className="h-4 w-4 text-[#f0183d]" />}
            {performer.nationality && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{performer.nationality}</span>}
          </div>
          <h3 className={`${featured ? "text-[64px]" : "text-[42px]"} fl-condensed uppercase leading-none tracking-[-0.02em] text-white`}>{performer.display_name}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#f0183d]/35 bg-[#12060a]/82 px-3 py-1.5 text-[10px] font-black uppercase text-[#f0183d]">{world}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-black/42 px-3 py-1.5 text-[10px] font-black uppercase text-white/72"><Video className="h-3.5 w-3.5" />{videoCount > 0 ? `${videoCount} videos` : "Coming soon"}</span>
          </div>
          <div className="mt-5 flex translate-y-2 items-center justify-between gap-4 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-sm leading-5 text-white/62">Discover the creator, releases and production world.</p>
            <span className="shrink-0 rounded-full bg-[#f0183d] px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white">View Profile <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></span>
          </div>
        </div>
      </article>
    </a>
  );
}