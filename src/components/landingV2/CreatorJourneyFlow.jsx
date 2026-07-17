import { UserPlus, BadgeCheck, CloudUpload, ClipboardCheck, Radio, CircleDollarSign } from "lucide-react";
import SectionHeader from "./SectionHeader";

const steps = [
  ["Join", "Create your account", UserPlus],
  ["Verify", "ID, legality and safety", BadgeCheck],
  ["Upload", "Dashboard → Cloudflare R2", CloudUpload],
  ["Review", "FLESHLAB approval", ClipboardCheck],
  ["Published", "Your content goes live", Radio],
  ["Earn", "Monthly transparent payouts", CircleDollarSign],
];

export default function CreatorJourneyFlow({ text }) {
  return (
    <section id="journey" className="px-5 py-24 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader eyebrow="Creator journey" title={text.journeyTitle} text={text.journeySub} />
        <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[#0f0f0d] p-6 md:p-10">
          <div className="absolute left-10 right-10 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-[#d97d52]/50 to-transparent lg:block" />
          <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {steps.map(([title, desc, Icon], index) => <div key={title} className="rounded-[26px] border border-white/10 bg-[#080807] p-6 transition duration-500 hover:-translate-y-1 hover:border-[#d97d52]/40"><div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#d97d52]/12 text-[#d97d52] ring-1 ring-[#d97d52]/25"><Icon className="h-6 w-6" /></div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/36">0{index + 1}</p><h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">{title}</h3><p className="mt-3 text-sm leading-5 text-white/55">{desc}</p></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}