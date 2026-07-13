import { ArrowUpRight } from "lucide-react";
import MediaImage from "@/components/homeTube/MediaImage";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

export default function PerformerPill({ performer }) {
  const href = performer?.slug ? `/performers/${performer.slug}` : "/performers";
  const image = buildPublicAssetUrl(performer?.profile_image_url || performer?.cover_image_url);
  return (
    <a href={href} className="group relative block min-h-[360px] overflow-hidden rounded-[28px] bg-[#111] shadow-xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(0,0,0,0.7)]">
      <MediaImage src={image} alt={performer?.display_name} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.05]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E51D2A]">{performer?.nationality || "Asia"}</p>
        <h3 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{performer?.display_name || "FLESHLAB Model"}</h3>
        <p className="mt-2 text-sm text-white/65">Real chemistry. Verified creator.</p>
        <span className="mt-5 inline-flex translate-y-2 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">View Profile <ArrowUpRight className="h-3.5 w-3.5" /></span>
      </div>
    </a>
  );
}