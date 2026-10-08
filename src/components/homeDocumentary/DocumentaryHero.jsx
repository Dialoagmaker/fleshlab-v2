import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function DocumentaryHero({ video }) {
  const image = getVideoThumbnailUrl(video);
  const loop = video?.trailer_url;
  const heroEndTime = 16;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {image && <MediaImage src={image} alt="THEFITMASTER — HOTEL SESSIONS" className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-95 brightness-[0.78] contrast-[1.12] saturate-[0.9]" />}
      {loop && (
        <video
          src={loop}
          poster={image}
          autoPlay
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-95 brightness-[0.78] contrast-[1.12] saturate-[0.9]"
          onLoadedMetadata={(event) => { event.currentTarget.currentTime = 0; }}
          onTimeUpdate={(event) => {
            if (event.currentTarget.currentTime >= heroEndTime) event.currentTarget.currentTime = 0;
          }}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,5,5,0.82)_0%,rgba(5,5,5,0.32)_30%,rgba(5,5,5,0.05)_58%,rgba(5,5,5,0.64)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />
      <div className="kraken-grain" />
      <div className="absolute -left-20 top-[18%] h-5 w-[44vw] -rotate-12 bg-[#E51D2A] shadow-[0_0_34px_rgba(229,29,42,0.36)]" />
      <div className="absolute right-[-8vw] top-[12%] h-[120vh] w-[22vw] rotate-12 bg-[#E51D2A]/18" />

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] items-end px-5 pb-12 pt-32 md:px-10 lg:px-14 lg:pb-16">
        <div className="max-w-[620px] border-l-4 border-[#E51D2A] bg-black/38 p-5 backdrop-blur-[2px] md:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#E51D2A]">FLESHLAB ORIGINAL</p>
          <h1 className="kraken-distressed mt-3 text-5xl font-black uppercase leading-[0.82] tracking-[-0.07em] text-white md:text-7xl">THEFITMASTER</h1>
          <h2 className="mt-1 text-3xl font-black uppercase leading-[0.86] tracking-[-0.055em] text-white md:text-5xl">HOTEL SESSIONS</h2>
          <p className="mt-5 text-lg font-black uppercase leading-tight tracking-[0.06em] text-white md:text-xl">
            REAL AMATEUR.<br />REAL HOTEL.<br />REAL SEX.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href={video?.slug ? `/videos/${video.slug}` : "/videos"} className="inline-flex h-12 items-center justify-center rounded-full bg-[#E51D2A] px-7 text-xs font-black uppercase tracking-wide text-white transition hover:bg-[#c91822]">WATCH NOW</a>
            <a href="/performers/the-fitmaster" className="inline-flex h-12 items-center justify-center rounded-full border border-white/35 bg-black/25 px-7 text-xs font-black uppercase tracking-wide text-white transition hover:border-[#E51D2A]">VIEW FITMASTER</a>
          </div>
        </div>
      </div>
    </section>
  );
}