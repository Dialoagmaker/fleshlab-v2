import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";
import RecruitmentSection from "./RecruitmentSection";

function CreatorPortrait({ performer, fallbackVideo, index }) {
  const image = performer?.profile_image_url || performer?.cover_image_url || getVideoThumbnailUrl(fallbackVideo);
  return (
    <a href={performer?.slug ? `/performers/${performer.slug}` : "/performers"} className="group relative min-h-[440px] overflow-hidden rounded-[34px] bg-[#111]">
      <MediaImage src={image} alt={performer?.display_name || "FLESHLAB creator"} className="absolute inset-0 h-full w-full opacity-82 transition duration-500 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-7">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#E51D2A]">Creator {String(index + 1).padStart(2, "0")}</p>
        <h3 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-white">{performer?.display_name || "Real creator"}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/62">Everybody starts with one decision: try, ask questions, and see what is possible.</p>
      </div>
    </a>
  );
}

export default function CreatorProof({ performers = [], videos = [] }) {
  const visible = performers.slice(0, 3);
  return (
    <RecruitmentSection eyebrow="Who already joined?" title="Real creators. Real first steps." intro="The brand is not built around fantasy celebrities. It is built around people who started nervous, curious and unsure — then learned how to perform with confidence.">
      <div className="grid gap-5 lg:grid-cols-3">
        {(visible.length ? visible : [null, null, null]).map((performer, index) => <CreatorPortrait key={performer?.id || index} performer={performer} fallbackVideo={videos[index]} index={index} />)}
      </div>
    </RecruitmentSection>
  );
}