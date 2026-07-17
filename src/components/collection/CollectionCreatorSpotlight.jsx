import { ArrowRight, BadgeCheck, MapPin, Video } from "lucide-react";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

const worlds = ["Hotel Sessions", "Beach Escape", "Gym", "Massage", "Home Made", "Student Life"];
function worldFor(creator) {
  const key = String(creator.slug || creator.display_name || "");
  const sum = key.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return worlds[sum % worlds.length];
}

export default function CollectionCreatorSpotlight({ creator }) {
  if (!creator) return null;
  const image = buildPublicAssetUrl(creator.cover_image_url || creator.profile_image_url);

  return (
    <section className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b0e] lg:grid-cols-[0.95fr_1.05fr]">
      <div className="relative min-h-[460px] bg-black">
        {image ? <img src={image} alt={creator.display_name} className="absolute inset-0 h-full w-full object-cover object-[center_30%]" loading="lazy" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#181818] to-black" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
      </div>
      <div className="flex flex-col justify-center p-7 md:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">Featured Creator</p>
        <h2 className="fl-condensed mt-3 text-[66px] uppercase leading-none tracking-[-0.02em] text-white">{creator.display_name}</h2>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide text-white/62">
          {creator.verified && <span className="inline-flex items-center gap-1 rounded-full border border-white/12 px-3 py-1.5"><BadgeCheck className="h-3.5 w-3.5 text-[#f0183d]" />Verified</span>}
          {creator.nationality && <span className="inline-flex items-center gap-1 rounded-full border border-white/12 px-3 py-1.5"><MapPin className="h-3.5 w-3.5" />{creator.nationality}</span>}
          <span className="inline-flex items-center gap-1 rounded-full border border-[#f0183d]/35 bg-[#12060a] px-3 py-1.5 text-[#f0183d]"><Video className="h-3.5 w-3.5" />{creator.video_count || 0} videos</span>
        </div>
        <p className="mt-6 max-w-lg text-base leading-7 text-white/58">Step inside {creator.display_name}'s {worldFor(creator)} world: personality, releases and the creator energy behind the collection.</p>
        <a href={`/performers/${creator.slug}`} className="mt-8 inline-flex w-fit items-center gap-3 rounded bg-[#f0183d] px-7 py-3 text-[10px] font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#ff3152]">View Profile <ArrowRight className="h-4 w-4" /></a>
      </div>
    </section>
  );
}