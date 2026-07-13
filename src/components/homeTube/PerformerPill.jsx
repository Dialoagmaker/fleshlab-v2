import MediaImage from "@/components/homeTube/MediaImage";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

export default function PerformerPill({ performer }) {
  const href = performer?.slug ? `/performers/${performer.slug}` : "/performers";
  const image = buildPublicAssetUrl(performer?.profile_image_url || performer?.cover_image_url);
  return (
    <a href={href} className="flex min-w-[178px] items-center gap-3 rounded border border-white/10 bg-[#111] px-3 py-2 hover:border-[#E51D2A]/70 transition-colors">
      <MediaImage src={image} alt={performer?.display_name} className="h-10 w-10 rounded-full" />
      <div className="min-w-0">
        <p className="truncate text-[12px] font-black text-white">{performer?.display_name || "FLESHLAB Model"} <span className="text-[#E51D2A]">•</span></p>
        <p className="truncate text-[9px] text-white/50">{performer?.nationality || "Asia"}</p>
      </div>
    </a>
  );
}