import { BadgeCheck, Radio, Users } from "lucide-react";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

export default function CreatorHeroRail({ performers = [] }) {
  const creators = performers.filter((p) => p.video_count > 0).slice(0, 8);
  if (!creators.length) return null;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#070b0e] p-5 md:p-7">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">Creator Stories</p>
          <h2 className="fl-condensed mt-2 text-[48px] uppercase leading-none tracking-[-0.02em] text-white">Real people lead the platform.</h2>
        </div>
        <Users className="hidden h-9 w-9 text-[#f0183d] md:block" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {creators.slice(0, 4).map((creator, index) => {
          const image = buildPublicAssetUrl(creator.profile_image_url || creator.cover_image_url);
          return (
            <a key={creator.id} href={`/performers/${creator.slug}`} className="group relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black">
              {image ? <img src={image} alt={creator.display_name} className="absolute inset-0 h-full w-full object-cover object-[center_28%] transition duration-700 group-hover:scale-105" loading="lazy" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#151515] to-black" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/28 to-transparent" />
              {index === 0 && <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[#f0183d]/40 bg-black/50 px-3 py-1.5 text-[9px] font-black uppercase text-[#f0183d] backdrop-blur"><Radio className="h-3 w-3" /> Upcoming Live</div>}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-white/58">{creator.verified && <BadgeCheck className="h-4 w-4 text-[#f0183d]" />}{creator.nationality || "FLESHLAB Creator"}</div>
                <h3 className="fl-condensed text-[42px] uppercase leading-none text-white">{creator.display_name}</h3>
                <p className="mt-2 text-sm leading-5 text-white/62">{creator.video_count} productions · creator journey</p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}