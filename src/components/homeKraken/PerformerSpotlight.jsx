import { ArrowUpRight } from "lucide-react";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";
import KrakenSectionTitle from "./KrakenSectionTitle";

function descriptor(performer) {
  if (performer?.bio) return performer.bio.split(".")[0];
  if (performer?.nationality) return `${performer.nationality} amateur performer`;
  return "FLESHLAB performer";
}

export default function PerformerSpotlight({ performers = [], heroPerformer }) {
  const list = [heroPerformer, ...performers.filter((p) => p?.id !== heroPerformer?.id)].filter(Boolean).slice(0, 5);
  if (!list.length) return null;
  const lead = list[0];

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 text-white md:px-10 md:py-28 lg:px-14">
      <KrakenSectionTitle eyebrow="Performer spotlight" title="The guys of FLESHLAB." copy="Real amateurs. Distinct personalities. Their own fantasies." />
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <a href={lead.slug ? `/performers/${lead.slug}` : "/performers"} className="group relative min-h-[640px] overflow-hidden rounded-[34px] border border-white/10 bg-[#111]">
          <MediaImage src={buildPublicAssetUrl(lead.cover_image_url || lead.profile_image_url)} alt={lead.display_name} className="absolute inset-0 h-full w-full opacity-85 transition duration-1000 group-hover:scale-[1.05]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-7 md:p-10">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Featured performer</p>
            <h3 className="kraken-distressed mt-2 text-7xl font-black uppercase leading-[0.76] tracking-[-0.09em] md:text-9xl">{lead.display_name}</h3>
            <p className="mt-5 max-w-lg text-lg font-semibold uppercase leading-relaxed text-white/66">{descriptor(lead)}</p>
            <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase text-black">View Profile <ArrowUpRight className="h-4 w-4" /></span>
          </div>
        </a>
        <div className="grid gap-6 sm:grid-cols-2">
          {list.slice(1).map((performer) => (
            <a key={performer.id || performer.slug} href={performer.slug ? `/performers/${performer.slug}` : "/performers"} className="group relative min-h-[307px] overflow-hidden rounded-[28px] border border-white/10 bg-[#101010]">
              <MediaImage src={buildPublicAssetUrl(performer.profile_image_url || performer.cover_image_url)} alt={performer.display_name} className="absolute inset-0 h-full w-full opacity-80 transition duration-700 group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="absolute bottom-0 p-5"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#E51D2A]">{performer.nationality || "FLESHLAB"}</p><h4 className="mt-1 text-3xl font-black uppercase leading-none tracking-[-0.05em]">{performer.display_name}</h4><p className="mt-2 line-clamp-2 text-xs font-semibold uppercase tracking-[0.06em] text-white/58">{descriptor(performer)}</p></div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}