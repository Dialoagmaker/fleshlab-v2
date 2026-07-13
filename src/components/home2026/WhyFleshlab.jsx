import { Camera, ShieldCheck, Users, CalendarDays } from "lucide-react";
import SectionHeader from "./SectionHeader";

const items = [
  { title: "100% Amateur", text: "Real people, verified 18+, shot with a clean studio standard.", Icon: Users },
  { title: "Real Homemade", text: "Candid, intimate productions with authentic amateur energy.", Icon: Camera },
  { title: "Safe Studio", text: "Consent, privacy and compliance are handled with care.", Icon: ShieldCheck },
  { title: "Weekly Updates", text: "Fresh releases and performer-led moments added regularly.", Icon: CalendarDays },
];

export default function WhyFleshlab() {
  return (
    <section className="bg-[#070707] px-6 md:px-10 lg:px-16 py-24 md:py-32">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeader eyebrow="Why" title="Why FLESHLAB" text="Premium production values without losing the feeling of real homemade content." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {items.map(({ title, text, Icon }) => (
            <div key={title} className="rounded-[22px] bg-[#121212] border border-white/[0.08] p-7 md:p-8 transition-all duration-300 hover:bg-[#1A1A1A] hover:-translate-y-1">
              <Icon className="w-8 h-8 text-[#D81F26] mb-8" strokeWidth={1.8} />
              <h3 className="text-white text-[22px] font-black uppercase tracking-tight mb-4">{title}</h3>
              <p className="text-[#B0B0B0] text-base leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}