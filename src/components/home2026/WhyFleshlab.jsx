import { CalendarDays, Camera, ShieldCheck, Users } from "lucide-react";
import SectionHeader from "./SectionHeader";

const items = [
  { title: "100% AMATEUR", text: "Real people and verified performers, produced with a cleaner studio standard.", Icon: Users },
  { title: "REAL HOMEMADE", text: "Authentic scenes that keep the direct feeling of amateur production.", Icon: Camera },
  { title: "SAFE STUDIO", text: "Consent, privacy and agreements are handled with care.", Icon: ShieldCheck },
  { title: "REGULAR RELEASES", text: "New productions and performer updates continue to arrive.", Icon: CalendarDays },
];

export default function WhyFleshlab() {
  return (
    <section className="bg-[#050505] px-5 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeader title="WHY FLESHLAB" text="Premium production values without losing the feeling of real homemade content." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(({ title, text, Icon }) => (
            <div key={title} className="min-h-[190px] rounded-[18px] bg-[#151515] border border-white/10 p-7 transition-colors duration-200 hover:bg-[#1B1B1B]">
              <Icon className="w-8 h-8 text-[#E51D2A] mb-7" strokeWidth={1.8} />
              <h3 className="text-white text-xl font-extrabold uppercase tracking-tight mb-3">{title}</h3>
              <p className="text-[#B7B7B7] text-sm md:text-base leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}