import { ArrowUpRight } from "lucide-react";
import KrakenSectionTitle from "./KrakenSectionTitle";

const services = [
  ["Fan Productions", "Your fantasy, professionally managed.", "/fan-productions"],
  ["Guest Productions", "Apply for a real FLESHLAB shoot.", "/guest-production"],
  ["Live", "Creator services and live concepts.", "/live"],
];

export default function StudioServicesStrip() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 text-white md:px-10 md:py-28 lg:px-14">
      <KrakenSectionTitle eyebrow="Studio services" title="Your fantasy. Our production." copy="FLESHLAB turns authentic concepts into professionally managed amateur productions." />
      <div className="grid gap-5 md:grid-cols-3">
        {services.map(([title, copy, href]) => (
          <a key={title} href={href} className="group rounded-[30px] border border-white/10 bg-[#0d0d0d] p-7 transition duration-500 hover:-translate-y-1 hover:border-[#E51D2A]/50">
            <div className="kraken-paint-stroke mb-8 h-3 w-32" />
            <h3 className="kraken-distressed text-5xl font-black uppercase leading-[0.78] tracking-[-0.08em]">{title}</h3>
            <p className="mt-6 min-h-[3em] text-sm font-semibold uppercase leading-relaxed tracking-[0.06em] text-white/58">{copy}</p>
            <span className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#E51D2A]">Open <ArrowUpRight className="h-4 w-4" /></span>
          </a>
        ))}
      </div>
    </section>
  );
}