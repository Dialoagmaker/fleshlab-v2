import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function CreatorJourney({ performer }) {
  const image = buildPublicAssetUrl(performer?.cover_image_url || performer?.profile_image_url);

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32 lg:px-14">
      <div className="relative grid overflow-hidden rounded-[42px] border border-white/10 bg-[#0d0d0d] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[520px]"><MediaImage src={image} alt="FLESHLAB performer" className="absolute inset-0 h-full w-full object-cover object-[50%_18%] opacity-90 brightness-[0.78]" /><div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-black/78" /><div className="kraken-paint-stroke absolute left-8 top-8 h-4 w-56" /></div>
        <div className="relative flex flex-col justify-center p-8 md:p-12 lg:p-16">
          <p className="mb-5 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">Become a performer</p>
          <h2 className="text-5xl font-black uppercase leading-[0.86] tracking-[-0.055em] text-white md:text-7xl">WANT TO PERFORM?</h2>
          <p className="mt-7 max-w-xl text-xl font-black uppercase leading-tight tracking-[0.05em] text-white">
            NO EXPERIENCE NEEDED.<br />REAL STUDIO SUPPORT.<br />PRIVATE APPLICATION.
          </p>
          <a href="/become-performer" className="mt-9 inline-flex h-12 w-fit items-center justify-center rounded-full bg-[#E51D2A] px-8 text-xs font-black uppercase tracking-wide text-white transition duration-500 hover:bg-[#c91822]">APPLY NOW</a>
        </div>
      </div>
    </section>
  );
}