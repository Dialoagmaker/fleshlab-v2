import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function StoryPoster({ title, label, image, video, href = "/become-performer", tall = false }) {
  const poster = image || getVideoThumbnailUrl(video);
  const loop = video?.trailer_url;
  return (
    <a href={href} className={`group relative block overflow-hidden rounded-[30px] bg-[#111] transition duration-700 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(0,0,0,0.72)] ${tall ? "min-h-[620px]" : "min-h-[430px]"}`}>
      {poster && <MediaImage src={poster} alt={title} className="absolute inset-0 h-full w-full opacity-82 transition duration-1000 ease-out group-hover:scale-[1.07] group-hover:opacity-62" />}
      {loop && <video src={loop} muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-78" onMouseEnter={(event) => event.currentTarget.play()} onMouseLeave={(event) => event.currentTarget.pause()} />}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-7 transition duration-700 ease-out group-hover:-translate-y-2">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">{label}</p>
        <h3 className="max-w-[11ch] text-5xl font-black uppercase leading-[0.82] tracking-[-0.07em] text-white transition duration-700 md:text-6xl">{title}</h3>
      </div>
    </a>
  );
}