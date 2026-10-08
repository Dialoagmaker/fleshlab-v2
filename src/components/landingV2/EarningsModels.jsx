import { Smartphone, Hotel, Webcam } from "lucide-react";
import SectionHeader from "./SectionHeader";

const models = [
  { title: "Homemade productions", icon: Smartphone, points: ["Performer + smartphone", "4K smartphone videos", "Fast dashboard uploads"] },
  { title: "Studio productions", icon: Hotel, points: ["Collaborations and hotel shoots", "Professional support", "Travel support when applicable"] },
  { title: "Live cam", icon: Webcam, points: ["Highest income potential", "Laptop or desktop", "Good webcam and lighting"] },
];

export default function EarningsModels({ text }) {
  return (
    <section id="earn" className="px-5 py-24 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader eyebrow="Earn money" title={text.earnTitle} text={text.earnSub} align="center" />
        <div className="grid gap-5 lg:grid-cols-3">
          {models.map(({ title, points, icon: Icon }) => <div key={title} className="rounded-[34px] border border-white/10 bg-[#11100e] p-8"><Icon className="mb-12 h-10 w-10 text-[#d97d52]" /><h3 className="text-3xl font-black uppercase leading-tight tracking-[-0.045em] text-white">{title}</h3><ul className="mt-8 space-y-4">{points.map(point => <li key={point} className="flex gap-3 text-sm text-white/62"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d97d52]" />{point}</li>)}</ul></div>)}
        </div>
      </div>
    </section>
  );
}