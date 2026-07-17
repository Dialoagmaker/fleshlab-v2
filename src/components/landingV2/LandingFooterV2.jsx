import BrandLogo from "@/components/BrandLogo";

const columns = [
  ["Partners", ["xHamster", "FapHouse", "Clip4Sale", "LoyalFans", "ManyVids"]],
  ["Blog", ["Creator stories", "Production notes", "Platform updates", "Earnings guides"]],
  ["Languages", ["English", "简体中文", "ไทย", "Tagalog", "Tiếng Việt"]],
  ["Social", ["Instagram", "X", "Telegram", "TikTok"]],
  ["Legal", ["Terms", "Privacy", "DMCA", "2257", "Cookie Policy"]],
];

export default function LandingFooterV2({ text }) {
  return (
    <footer id="partners" className="border-t border-white/10 bg-[#070706] px-5 py-16 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 flex flex-col gap-8 border-b border-white/10 pb-12 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-[#d97d52]">{text.partnerTitle}</p><div className="flex flex-wrap gap-6 text-lg font-black text-white/45"><span>xHamster</span><span>FapHouse</span><span>Clip4Sale</span><span>LoyalFans</span><span>ManyVids</span></div></div><a href="/become-performer" className="w-fit rounded-full border border-[#d97d52]/40 px-6 py-3 text-xs font-black uppercase text-[#d97d52]">Join FLESHLAB</a></div>
        <div className="grid gap-10 lg:grid-cols-[1fr_2.4fr]"><div><BrandLogo className="w-40" /><p className="mt-6 max-w-sm text-sm leading-6 text-white/50">Modern creator ecosystem for verified amateur performers, fans and production partners.</p></div><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">{columns.map(([title, links]) => <div key={title}><h4 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-white">{title}</h4><div className="space-y-3">{links.map(link => <a key={link} href="#" className="block text-sm text-white/45 transition hover:text-white">{link}</a>)}</div></div>)}</div></div>
      </div>
    </footer>
  );
}