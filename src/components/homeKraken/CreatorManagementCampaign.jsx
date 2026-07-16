import { ArrowUpRight } from "lucide-react";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

const steps = ["Apply", "Private review", "Verification", "First production", "Management & release"];

export default function CreatorManagementCampaign({ performer }) {
  const image = buildPublicAssetUrl(performer?.cover_image_url || performer?.profile_image_url);
  return (
    <section className="relative overflow-hidden px-5 py-20 text-white md:px-10 md:py-28 lg:px-14">
      <div className="kraken-grain" />
      <div className="relative mx-auto grid max-w-[1440px] overflow-hidden rounded-[40px] border border-white/10 bg-[#090909] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[520px]"><MediaImage src={image} alt="FLESHLAB creator management" className="absolute inset-0 h-full w-full opacity-80 brightness-[0.72]" /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" /><div className="kraken-paint-stroke absolute left-8 top-8 h-4 w-56" /></div>
        <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
          <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">Creator management</p>
          <h2 className="kraken-distressed mt-4 text-6xl font-black uppercase leading-[0.78] tracking-[-0.085em] md:text-8xl">You could be next.</h2>
          <p className="mt-7 max-w-2xl text-xl font-semibold leading-relaxed text-white/66">No professional experience required. Real people. Professional studio support. Private application. Human review. Verified adults only.</p>
          <div className="mt-9 grid gap-3 sm:grid-cols-5">{steps.map((step, index) => <div key={step} className="rounded-2xl border border-white/10 bg-black/35 p-4"><p className="text-[10px] font-black text-[#E51D2A]">0{index + 1}</p><p className="mt-2 text-xs font-black uppercase leading-tight text-white/78">{step}</p></div>)}</div>
          <div className="mt-9 flex flex-wrap gap-3"><a href="/become-performer" className="inline-flex h-12 items-center rounded-full bg-[#E51D2A] px-7 text-xs font-black uppercase tracking-wide text-white">Become a Performer</a><a href="/how-it-works" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-7 text-xs font-black uppercase tracking-wide text-white">How It Works <ArrowUpRight className="h-4 w-4" /></a></div>
        </div>
      </div>
    </section>
  );
}