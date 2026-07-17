import { Sparkles, ShieldCheck, Clapperboard } from "lucide-react";
import SectionHeader from "./SectionHeader";

export default function FanProductionFeature({ text }) {
  return (
    <section className="px-5 py-24 md:px-10 lg:px-14">
      <div className="mx-auto grid max-w-[1440px] gap-8 overflow-hidden rounded-[40px] border border-[#d97d52]/20 bg-[radial-gradient(circle_at_70%_20%,rgba(217,125,82,0.22),transparent_38%),#100d0b] p-8 md:p-12 lg:grid-cols-[0.95fr_1.05fr] lg:p-16">
        <SectionHeader eyebrow="Huge USP" title={text.fanTitle} text={text.fanText} />
        <div className="grid content-end gap-4 sm:grid-cols-3">
          {[ [Sparkles, "Your idea", "You imagine it."], [Clapperboard, "We produce", "The studio brings it to life."], [ShieldCheck, "Approved only", "Consent, contracts, verification."] ].map(([Icon, title, body]) => <div key={title} className="rounded-[28px] border border-white/10 bg-black/24 p-6"><Icon className="mb-12 h-8 w-8 text-[#d97d52]" /><h3 className="text-xl font-black uppercase text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{body}</p></div>)}
        </div>
      </div>
    </section>
  );
}