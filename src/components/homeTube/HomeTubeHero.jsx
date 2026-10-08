import { Play, UserRound, Video } from "lucide-react";
import { getVideoPreviewUrl, getVideoSourceUrl, getVideoThumbnailUrl } from "@/lib/videoAssetResolver";

export default function HomeTubeHero({ video, videoCount, performerCount }) {
  const image = getVideoThumbnailUrl(video);
  const backgroundVideo = getVideoPreviewUrl(video) || getVideoSourceUrl(video);
  const href = video?.slug ? `/videos/${video.slug}` : "/videos";
  const stats = [
    videoCount > 0 ? { icon: Video, value: String(videoCount), label: videoCount === 1 ? "Published Video" : "Published Videos" } : null,
    performerCount > 0 ? { icon: UserRound, value: String(performerCount), label: performerCount === 1 ? "Verified Performer" : "Verified Performers" } : null,
  ].filter(Boolean);

  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-[#050505]">
      {backgroundVideo ? (
        <video className="absolute inset-0 h-full w-full object-cover opacity-55" src={backgroundVideo} poster={image || undefined} autoPlay muted loop playsInline />
      ) : (
        <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: image ? `url(${image})` : undefined }} />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_30%,rgba(229,29,42,0.18),transparent_32%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.84)_37%,rgba(5,5,5,0.42)_63%,#050505_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent" />

      <div className={`relative mx-auto grid min-h-[680px] max-w-[1440px] items-center gap-10 px-5 pb-16 pt-20 md:px-10 lg:px-14 ${stats.length ? "md:grid-cols-[1fr_380px]" : ""}`}>
        <div className="max-w-[720px]">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] font-black uppercase tracking-[0.32em] text-[#E51D2A] backdrop-blur">FLESHLAB Amateur Studio</p>
          <h1 className="text-[54px] font-black uppercase leading-[0.84] tracking-[-0.07em] text-white sm:text-[72px] lg:text-[96px]">
            Amateur<br /><span className="text-[#E51D2A]">Wins.</span>
          </h1>
          <p className="mt-7 max-w-[560px] text-lg leading-relaxed text-white/78 md:text-xl">Real people. Real chemistry. Premium productions. No fake stories.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a href={href} className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#E51D2A] px-8 text-sm font-black uppercase tracking-wide text-white shadow-[0_18px_44px_rgba(229,29,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#c91822]"><Play className="h-4 w-4 fill-white" /> Watch Now</a>
            <a href="/become-performer" className="inline-flex h-14 items-center rounded-full border border-white/20 bg-white/[0.06] px-8 text-sm font-black uppercase tracking-wide text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/12">Become Performer</a>
          </div>
        </div>

        {stats.length > 0 && <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
          {stats.map((item) => (
            <div key={item.label} className="group rounded-[28px] border border-white/10 bg-[#111]/58 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#E51D2A]/40 hover:bg-[#181818]/70">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E51D2A]/12 text-[#E51D2A]"><item.icon className="h-6 w-6" /></span>
                <div>
                  <p className="text-[22px] font-black uppercase leading-none text-white sm:text-3xl">{item.value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/50 sm:text-[11px]">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>

      <a href={href} className="absolute left-1/2 top-[47%] z-10 hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 text-white lg:flex">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-black/30 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-[#E51D2A]"><Play className="ml-1 h-8 w-8 fill-white" /></span>
        <span className="text-[11px] font-black uppercase tracking-[0.24em]">Play Trailer</span>
      </a>
    </section>
  );
}