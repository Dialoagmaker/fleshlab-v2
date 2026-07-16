import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function DocumentaryHero({ video }) {
  const image = getVideoThumbnailUrl(video);
  const loop = video?.trailer_url;
  const heroEndTime = 15;
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {image && <MediaImage src={image} alt="TheFitmaster Hotel Sessions opening scene" className="absolute inset-0 h-full w-full opacity-75 brightness-[0.62] contrast-[1.08] saturate-[0.82]" />}
      {loop && (
        <video
          src={loop}
          poster={image}
          autoPlay
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover opacity-75 brightness-[0.62] contrast-[1.08] saturate-[0.82]"
          onLoadedMetadata={(event) => { event.currentTarget.currentTime = 0; }}
          onTimeUpdate={(event) => {
            if (event.currentTarget.currentTime >= heroEndTime) event.currentTarget.currentTime = 0;
          }}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.88)_34%,rgba(5,5,5,0.24)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/50" />
      <div className="relative mx-auto flex min-h-screen max-w-[1440px] items-end px-5 pb-14 pt-36 md:px-10 lg:px-14 lg:pb-20">
        <div className="max-w-5xl">
          <p className="mb-5 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">FLESHLAB ORIGINALS</p>
          <h1 className="text-7xl font-black uppercase leading-[0.78] tracking-[-0.085em] text-white md:text-9xl lg:text-[11rem]">HE SAID YES.</h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-white/68 md:text-2xl">
            His first hotel.<br />His first scene.<br />His first step into the FLESHLAB world.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href={video?.slug ? `/videos/${video.slug}` : "/videos"} className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#E51D2A] px-8 text-sm font-black uppercase tracking-wide text-white transition duration-500 hover:scale-[1.02] hover:bg-[#c91822]"><span aria-hidden="true">▶</span> Watch Now</a>
            <a href="/become-performer" className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 px-8 text-sm font-black uppercase tracking-wide text-white/82 transition duration-500 hover:border-white/35 hover:text-white">Become a Creator</a>
          </div>
          <a href={video?.slug ? `/videos/${video.slug}` : "/videos"} className="mt-14 block max-w-xl border-t border-white/10 pt-6 transition duration-500 hover:border-[#E51D2A]/50">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">TheFitmaster: Hotel Sessions</p>
            <h2 className="line-clamp-2 text-3xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-4xl">Opening sequence</h2>
          </a>
        </div>
      </div>
    </section>
  );
}