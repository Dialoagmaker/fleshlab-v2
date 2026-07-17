import React from "react";
import { ArrowRight, Rss } from "lucide-react";

const nav = [["Videos", "/videos"], ["Performers", "/performers"], ["Fan Productions", "/fan-productions"], ["News", "/news"]];
const legal = [["Terms", "/terms"], ["Privacy", "/privacy"], ["DMCA", "/dmca"], ["2257", "/2257"], ["Imprint", "/imprint"]];

export default function NewsFooter({ rssBase }) {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#030506] px-4 py-14 text-white md:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(240,24,61,0.18),transparent_28%),radial-gradient(circle_at_78%_80%,rgba(255,255,255,0.07),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="text-6xl font-black tracking-[-0.075em] md:text-8xl">FLESH<span className="text-[#f0183d]">LAB</span></div>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.55em] text-white/78">AMATEUR WINS.</p>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62">A premium editorial world for real creators, original productions, platform updates and the business behind modern amateur content.</p>
            <a href="/become-performer" className="mt-8 inline-flex items-center gap-5 rounded bg-[#f0183d] px-8 py-3 text-[10px] font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#ff3152]">Become Performer <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div><p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#f0183d]">Navigate</p>{nav.map(([label, href]) => <a key={label} href={href} className="block py-1.5 text-sm text-white/54 hover:text-white">{label}</a>)}</div>
            <div><p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#f0183d]">Legal</p>{legal.map(([label, href]) => <a key={label} href={href} className="block py-1.5 text-sm text-white/54 hover:text-white">{label}</a>)}</div>
            <div><p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-[#f0183d]">Social</p>{["X", "Facebook", "Telegram"].map((label) => <a key={label} href="#" className="block py-1.5 text-sm text-white/54 hover:text-white">{label}</a>)}<a href={rssBase} className="mt-3 inline-flex items-center gap-2 text-sm text-white/54 hover:text-[#f0183d]"><Rss className="h-4 w-4" /> RSS</a></div>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.22em] text-white/32 md:flex-row md:items-center md:justify-between"><span>© 2026 FLESHLAB Studios</span><span>Official editorial dispatches from the creator network.</span></div>
      </div>
    </footer>
  );
}