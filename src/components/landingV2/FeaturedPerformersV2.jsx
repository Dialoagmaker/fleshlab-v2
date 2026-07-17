import SectionHeader from "./SectionHeader";
import MediaImage from "@/components/homeTube/MediaImage";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

export default function FeaturedPerformersV2({ performers = [], text }) {
  const featured = performers.slice(0, 3);
  if (!featured.length) return null;
  return (
    <section className="px-5 py-20 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader eyebrow="Creators" title={text.performersTitle} text="A small selection of verified performers building real catalogues, fan bases and long-term platform value." />
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((performer) => <a key={performer.id || performer.slug} href={performer.slug ? `/performers/${performer.slug}` : "/performers"} className="group overflow-hidden rounded-[32px] border border-white/10 bg-[#11100e]"><div className="relative aspect-[4/5]"><MediaImage src={buildPublicAssetUrl(performer.cover_image_url || performer.profile_image_url)} alt={performer.display_name} className="h-full w-full object-cover object-[50%_20%] transition duration-700 group-hover:scale-105" /></div><div className="p-6"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d97d52]">Verified creator</p><h3 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white">{performer.display_name}</h3></div></a>)}
        </div>
      </div>
    </section>
  );
}