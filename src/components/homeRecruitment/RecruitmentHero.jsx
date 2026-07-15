import { ArrowRight } from "lucide-react";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

export default function RecruitmentHero({ video, performerCount }) {
  const image = getVideoThumbnailUrl(video);
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-[#050505] pt-28 text-white">
      {image && <MediaImage src={image} alt="FLESHLAB creator story" className="absolute inset-y-0 right-0 h-full w-full opacity-55 md:w-[62%]" />}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,#050505_42%,rgba(5,5,5,0.76)_61%,rgba(5,5,5,0.18)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgba(229,29,42,0.22),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-[calc(92vh-7rem)] max-w-[1440px] items-center px-5 md:px-10 lg:px-14">
        <div className="max-w-3xl py-20">
          <p className="mb-5 text-[12px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">AMATEUR WINS.</p>
          <h1 className="text-6xl font-black uppercase leading-[0.84] tracking-[-0.075em] text-white md:text-8xl lg:text-9xl">Nobody starts famous.</h1>
          <p className="mt-7 max-w-2xl text-xl leading-relaxed text-white/72 md:text-2xl">FLESHLAB is built for real first-time creators who want confidence, income and a way forward without pretending to be someone else.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="/become-performer" className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#E51D2A] px-8 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#c91822]">Apply as a creator <ArrowRight className="h-4 w-4" /></a>
            <a href="#first-shoot" className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 px-8 text-sm font-black uppercase tracking-wide text-white/82 transition hover:border-white/35 hover:text-white">See how it works</a>
          </div>
          <p className="mt-8 max-w-xl text-sm leading-relaxed text-white/48">For verified 18+ adults only. No pressure, no promises, no fake lifestyle — just honest studio work, clear boundaries and real creator support.</p>
        </div>
      </div>
      <div className="absolute bottom-8 right-6 hidden max-w-xs border-l border-[#E51D2A] pl-5 text-sm leading-relaxed text-white/62 lg:block">{performerCount || "Real"} creators and growing — real people, real nerves, real first steps.</div>
    </section>
  );
}