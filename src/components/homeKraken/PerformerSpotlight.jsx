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
      <KrakenSectionTitle eyebrow="Performer spotlight" title="The guys of FLESHLAB." copy="Real amateurs. Strong images. Click into the performer world." />
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <a href={lead.slug ? `/performers/${lead.slug}` : "/performers"} className="group relative min-h-[640px] overflow-hidden rounded-[34px] border border-white/10 bg-[#111]">
          <MediaImage src={buildPublicAssetUrl(lead.cover_image_url || lead.profile_image_url)} alt={lead.display_name} className="absolute inset-0 h-full w-full object-cover object-[50%_18%] opacity-95 brightness-[0.82] transition duration-1000 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
          <div className="absolute -left-12 top-10 h-3 w-64 -rotate-12 bg-[#E51D2A]" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/75 to-transparent p-7 pt-28 md:p-9 md:pt-32">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#E51D2A]">Featured performer</p>
            <h3 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.05em] md:text-6xl">{lead.display_name}</h3>
            <p className="mt-4 max-w-lg text-sm font-semibold uppercase leading-relaxed tracking-[0.04em] text-white/68">{descriptor(lead)}</p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#E51D2A] px-6 py-3 text-xs font-black uppercase text-white">View Profile <ArrowUpRight className="h-4 w-4" /></span>
          </div>
        </a>
        <div className="grid gap-6 sm:grid-cols-2">
          {list.slice(1).map((performer) => (
            <a key={performer.id || performer.slug} href={performer.slug ? `/performers/${performer.slug}` : "/performers"} className="group relative min-h-[307px] overflow-hidden rounded-[28px] border border-white/10 bg-[#101010]">
              <MediaImage src={buildPublicAssetUrl(performer.profile_image_url || performer.cover_image_url)} alt={performer.display_name} className="absolute inset-0 h-full w-full object-cover object-[50%_18%] opacity-95 brightness-[0.84] transition duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/76 to-transparent p-5 pt-20"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#E51D2A]">{performer.nationality || "FLESHLAB"}</p><h4 className="mt-1 text-2xl font-black uppercase leading-none tracking-[-0.04em]">{performer.display_name}</h4></div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}