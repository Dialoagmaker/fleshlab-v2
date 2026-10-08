import { useMemo, useState } from "react";
import SectionHeader from "./SectionHeader";

const multipliers = { homemade: [70, 145], studio: [180, 380], live: [320, 760] };
const labels = { homemade: "Homemade", studio: "Studio", live: "Live cam" };

export default function EarningsSimulator({ text }) {
  const [monthlyVideos, setMonthlyVideos] = useState(6);
  const [type, setType] = useState("homemade");
  const range = useMemo(() => {
    const [low, high] = multipliers[type];
    return [monthlyVideos * low, monthlyVideos * high];
  }, [monthlyVideos, type]);

  return (
    <section className="px-5 py-10 md:px-10 lg:px-14">
      <div className="mx-auto grid max-w-[1440px] gap-8 rounded-[38px] border border-white/10 bg-[#0f0f0d] p-6 md:p-10 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeader eyebrow="Interactive" title={text.simulatorTitle} text="Adjust monthly output and production style to see realistic monthly ranges. Actual results depend on consistency, audience demand and approval quality." />
        <div className="rounded-[30px] bg-[#080807] p-6 md:p-8">
          <div className="mb-8 flex items-end justify-between"><span className="text-sm font-bold text-white/60">Videos per month</span><strong className="text-5xl font-black text-white">{monthlyVideos}</strong></div>
          <input type="range" min="1" max="20" value={monthlyVideos} onChange={(e) => setMonthlyVideos(Number(e.target.value))} className="w-full accent-[#d97d52]" />
          <div className="mt-8 grid grid-cols-3 gap-3">{Object.keys(labels).map(key => <button key={key} onClick={() => setType(key)} className={`rounded-2xl border px-4 py-4 text-xs font-black uppercase tracking-wide transition ${type === key ? "border-[#d97d52] bg-[#d97d52] text-white" : "border-white/10 bg-white/5 text-white/62 hover:text-white"}`}>{labels[key]}</button>)}</div>
          <div className="mt-10 rounded-[28px] border border-[#d97d52]/25 bg-[#d97d52]/10 p-7"><p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d97d52]">Estimated monthly earnings</p><p className="mt-3 text-5xl font-black tracking-[-0.06em] text-white md:text-7xl">${range[0].toLocaleString()}–${range[1].toLocaleString()}</p></div>
        </div>
      </div>
    </section>
  );
}