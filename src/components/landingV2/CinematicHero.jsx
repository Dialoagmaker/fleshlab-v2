import { Camera, ShieldCheck, WalletCards } from "lucide-react";
import { getVideoPreviewUrl, getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

const HOTEL_FALLBACK = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80";

export default function CinematicHero({ video, text }) {
  const image = getVideoThumbnailUrl(video) || HOTEL_FALLBACK;
  const preview = getVideoPreviewUrl(video);
  const statsIcons = [ShieldCheck, WalletCards, Camera];
  return (
    <section id="who" className="relative min-h-screen overflow-hidden bg-[#080807] pt-20 text-white">
      <div className="absolute inset-0">
        {preview ? <video src={preview} poster={image} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover opacity-70 brightness-[0.72] saturate-[0.85]" /> : <MediaImage src={image} alt="FLESHLAB creator arriving at a hotel" className="h-full w-full object-cover opacity-70 brightness-[0.72] saturate-[0.85]" />}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,7,0.96)_0%,rgba(8,8,7,0.72)_38%,rgba(8,8,7,0.28)_68%,rgba(8,8,7,0.86)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#080807] to-transparent" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1440px] items-center px-5 py-16 md:px-10 lg:px-14">
        <div className="max-w-3xl">
          <p className="mb-5 text-[11px] font-black uppercase tracking-[0.35em] text-[#d97d52]">{text.heroKicker}</p>
          <h1 className="max-w-4xl text-6xl font-black uppercase leading-[0.9] tracking-[-0.065em] md:text-8xl lg:text-[7.6rem]">{text.heroTitle}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">{text.heroText}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="/become-performer" className="inline-flex h-13 items-center justify-center rounded-full bg-[#c95b38] px-8 py-4 text-xs font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#e0774d]">{text.become}</a>
            <a href="/videos" className="inline-flex h-13 items-center justify-center rounded-full border border-white/25 bg-white/8 px-8 py-4 text-xs font-black uppercase tracking-wide text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/14">{text.explore}</a>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {text.stats.map((stat, index) => { const Icon = statsIcons[index]; return <div key={stat} className="rounded-2xl border border-white/10 bg-black/26 p-4 backdrop-blur-md"><Icon className="mb-4 h-5 w-5 text-[#d97d52]" /><p className="text-sm font-bold leading-snug text-white/82">{stat}</p></div>; })}
          </div>
        </div>
      </div>
    </section>
  );
}