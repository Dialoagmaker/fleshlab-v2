import BrandLogo from "@/components/BrandLogo";

const columns = [
  { title: "Explore", links: [{ href: "/videos", label: "Videos" }, { href: "/performers", label: "Models" }, { href: "/videos", label: "Collections" }, { href: "/news", label: "Journal" }] },
  { title: "Studio", links: [{ href: "/become-performer", label: "Become Performer" }, { href: "/guest-production", label: "Guest Production" }, { href: "/fan-productions", label: "Fan Productions" }, { href: "/live", label: "Live" }] },
  { title: "Support", links: [{ href: "/faq", label: "FAQ" }, { href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }, { href: "/dmca", label: "DMCA" }, { href: "/2257", label: "2257" }] },
];

export default function TubeFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] px-5 py-16 md:px-10 lg:px-14 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <a href="/" aria-label="FLESHLAB home" className="inline-flex py-2"><BrandLogo className="h-[84px] w-[318px]" /></a>
            <p className="mt-7 text-sm font-black uppercase tracking-[0.32em] text-[#E51D2A]">AMATEUR WINS.</p>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/58">An amateur studio built around real people, real chemistry and premium Asian creator productions.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {columns.map((column) => <div key={column.title}><h4 className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-white">{column.title}</h4>{column.links.map((link) => <a key={link.label} href={link.href} className="block py-1.5 text-sm text-white/50 transition-colors hover:text-white">{link.label}</a>)}</div>)}
          </div>
        </div>
        <div className="mt-14 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-[1fr_360px] md:items-center">
          <p className="text-xs leading-relaxed text-white/36">18 U.S.C. 2257: All performers depicted on this website were 18 years of age or older at the time of production. © 2026 FLESHLAB. All Rights Reserved.</p>
          <div className="flex overflow-hidden rounded-full border border-white/10 bg-white/[0.04] p-1"><input placeholder="Your email address" className="min-w-0 flex-1 bg-transparent px-5 text-sm text-white outline-none placeholder:text-white/35" /><button className="rounded-full bg-[#E51D2A] px-6 py-3 text-xs font-black uppercase tracking-wide text-white">Subscribe</button></div>
        </div>
      </div>
    </footer>
  );
}