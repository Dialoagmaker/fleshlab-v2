import BrandLogo from "@/components/BrandLogo";

const columns = [
  { title: "Site", links: [{ href: "/", label: "Home" }, { href: "/videos", label: "Videos" }, { href: "/performers", label: "Models" }, { href: "/videos", label: "Collections" }, { href: "/news", label: "Blog" }] },
  { title: "Support", links: [{ href: "/faq", label: "FAQ" }, { href: "/terms", label: "Terms of Use" }, { href: "/privacy", label: "Privacy Policy" }, { href: "/dmca", label: "DMCA" }, { href: "/2257", label: "2257" }] },
  { title: "Work With Us", links: [{ href: "/become-performer", label: "Become a Performer" }, { href: "/guest-production", label: "Guest Production" }, { href: "/fan-productions", label: "Fan Productions" }] },
  { title: "Community", links: [{ href: "/fanclub", label: "Fanclub" }, { href: "/news", label: "Blog" }, { href: "/live", label: "Live" }] },
];

export default function TubeFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] px-5 py-5 md:px-10 lg:px-14">
      <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-[280px_1fr_280px]">
        <div>
          <a href="/" aria-label="FLESHLAB home"><BrandLogo className="w-[230px] h-[58px]" /></a>
          <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-white/55">FLESHLAB is an amateur studio based in Asia. We produce raw, authentic and high quality content with real people.</p>
          <p className="mt-5 text-[10px] text-white/40">© 2026 FLESHLAB. All Rights Reserved.</p>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-2 text-[11px] font-black uppercase text-white">{column.title}</h4>
              {column.links.map((link) => <a key={link.label} href={link.href} className="block py-0.5 text-[10px] text-white/55 hover:text-white">{link.label}</a>)}
            </div>
          ))}
        </div>

        <div>
          <h4 className="mb-2 text-[11px] font-black uppercase text-white">Stay Updated</h4>
          <p className="mb-3 text-[10px] text-white/55">Get our latest videos and news.</p>
          <div className="flex rounded border border-white/10 bg-[#111] p-1">
            <input placeholder="Your email address" className="min-w-0 flex-1 bg-transparent px-3 text-[11px] text-white outline-none" />
            <button className="bg-[#E51D2A] px-4 text-[10px] font-black uppercase text-white">Subscribe</button>
          </div>
          <p className="mt-4 text-[10px] text-white/40">18+ · Secure payments</p>
        </div>
      </div>
    </footer>
  );
}