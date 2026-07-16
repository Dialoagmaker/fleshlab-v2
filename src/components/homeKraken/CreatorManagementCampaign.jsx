import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function CreatorManagementCampaign({ performer }) {
  const image = buildPublicAssetUrl(performer?.cover_image_url || performer?.profile_image_url);

  return (
    <section className="relative overflow-hidden px-5 py-20 text-white md:px-10 md:py-28 lg:px-14">
      <div className="kraken-grain" />
      <div className="relative mx-auto grid max-w-[1440px] overflow-hidden rounded-[40px] border border-white/10 bg-[#090909] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[560px]"><MediaImage src={image} alt="FLESHLAB performer" className="absolute inset-0 h-full w-full object-cover object-[50%_18%] opacity-95 brightness-[0.78]" /><div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/12 to-black/78" /><div className="kraken-paint-stroke absolute left-8 top-8 h-4 w-56" /></div>
        <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
          <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">Become a performer</p>
          <h2 className="text-5xl font-black uppercase leading-[0.86] tracking-[-0.055em] md:text-7xl">WANT TO PERFORM?</h2>
          <p className="mt-7 max-w-xl text-xl font-black uppercase leading-tight tracking-[0.05em] text-white">
            NO EXPERIENCE NEEDED.<br />REAL STUDIO SUPPORT.<br />PRIVATE APPLICATION.
          </p>
          <a href="/become-performer" className="mt-9 inline-flex h-12 w-fit items-center rounded-full bg-[#E51D2A] px-8 text-xs font-black uppercase tracking-wide text-white transition hover:bg-[#c91822]">APPLY NOW</a>
        </div>
      </div>
    </section>
  );
}