import { Banknote, PlayCircle, Clapperboard, Handshake } from "lucide-react";
import SectionHeader from "./SectionHeader";

const choices = [
  { title: "Earn money", text: "Smartphone, studio and live-cam paths with clear review and payout flow.", href: "/become-performer", icon: Banknote },
  { title: "Watch videos", text: "Hotel Sessions, Beach Escape, Student Life, Massage, Gym and Home worlds.", href: "/videos", icon: PlayCircle },
  { title: "Fan production", text: "Apply to join a real production with your favourite performer.", href: "/fan-productions", icon: Clapperboard },
  { title: "Partner", text: "Distribution, creator sourcing, compliance-aware production and brand partnerships.", href: "#partners", icon: Handshake },
];

export default function JourneyChoices({ text }) {
  return (
    <section className="px-5 py-24 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader eyebrow="Start here" title={text.choicesTitle} text={text.choicesSub} align="center" />
        <div className="grid gap-5 lg:grid-cols-4">
          {choices.map(({ title, text, href, icon: Icon }) => <a key={title} href={href} className="group min-h-[340px] rounded-[32px] border border-white/10 bg-[#11100e] p-7 transition duration-500 hover:-translate-y-2 hover:border-[#d97d52]/50 hover:bg-[#171410]"><Icon className="mb-20 h-10 w-10 text-[#d97d52] transition group-hover:scale-110" /><h3 className="text-4xl font-black uppercase leading-none tracking-[-0.05em] text-white">{title}</h3><p className="mt-5 text-sm leading-6 text-white/58">{text}</p><span className="mt-8 inline-block text-xl text-[#d97d52] transition group-hover:translate-x-2">→</span></a>)}
        </div>
      </div>
    </section>
  );
}