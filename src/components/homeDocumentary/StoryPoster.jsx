import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function StoryPoster({ title, label, image, video, href = "/become-performer", tall = false, cta = "WATCH NOW" }) {
  const poster = image || getVideoThumbnailUrl(video);
  const loop = video?.trailer_url;
  return (
    <a href={href} className={`group relative block overflow-hidden rounded-[30px] bg-[#111] transition duration-700 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(0,0,0,0.72)] ${tall ? "min-h-[620px]" : "min-h-[430px]"}`}>
      {poster && <MediaImage src={poster} alt={title} className="absolute inset-0 h-full w-full object-cover object-[50%_18%] opacity-95 brightness-[0.82] contrast-[1.08] transition duration-1000 ease-out group-hover:scale-[1.05]" />}
      {loop && <video src={loop} muted loop playsInline className="absolute inset-0 h-full w-full object-cover object-[50%_18%] opacity-0 brightness-[0.82] transition duration-700 group-hover:opacity-90" onMouseEnter={(event) => event.currentTarget.play()} onMouseLeave={(event) => event.currentTarget.pause()} />}
      <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(0,0,0,0.62),rgba(0,0,0,0.06)_48%,rgba(229,29,42,0.16))]" />
      <div className="absolute -left-14 top-10 h-3 w-56 -rotate-12 bg-[#E51D2A] shadow-[0_0_26px_rgba(229,29,42,0.32)]" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/72 to-transparent p-6 pt-24 transition duration-700 ease-out group-hover:-translate-y-1">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.26em] text-[#E51D2A]">{label}</p>
        <h3 className="max-w-[13ch] text-3xl font-black uppercase leading-[0.9] tracking-[-0.045em] text-white transition duration-700 md:text-4xl">{title}</h3>
        {cta && <span className="mt-5 inline-flex h-10 items-center rounded-full bg-[#E51D2A] px-5 text-[10px] font-black uppercase tracking-wide text-white">{cta}</span>}
      </div>
    </a>
  );
}