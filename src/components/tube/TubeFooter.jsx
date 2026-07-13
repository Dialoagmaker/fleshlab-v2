const columns = [
  {
    title: "COMPANY",
    links: [
      { href: "/performers", label: "Performers" },
      { href: "/become-performer", label: "Become Performer" },
      { href: "/news", label: "Blog" },
      { href: "/how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "CATEGORIES",
    links: [
      { href: "/videos", label: "Videos" },
      { href: "/videos?category=solo", label: "Solo" },
      { href: "/videos?category=couples", label: "Couples" },
      { href: "/videos?category=homemade", label: "Homemade" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/dmca", label: "DMCA" },
      { href: "/2257", label: "2257" },
    ],
  },
];

export default function TubeFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] border-t border-white/10 px-5 md:px-8 lg:px-12">
      <div className="max-w-[1440px] mx-auto py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-9">
          <div>
            <a href="/" className="inline-block text-white text-2xl font-black uppercase tracking-[-0.04em] mb-4 hover:text-[#E51D2A] transition-colors duration-150">FLESHLAB</a>
            <p className="text-[#B7B7B7] text-sm leading-relaxed max-w-sm">
              Authentic amateur productions with verified real people and a clean studio standard.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-white text-sm font-black uppercase tracking-[0.18em] mb-4">{column.title}</h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[#B7B7B7] text-sm hover:text-white transition-colors duration-150">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-[#828282] text-xs leading-relaxed max-w-3xl">
            18 U.S.C. 2257: All performers depicted on this website were 18 years of age or older at the time of production.
          </p>
          <p className="text-[#828282] text-xs whitespace-nowrap">© {currentYear} FLESHLAB Studios</p>
        </div>
      </div>
    </footer>
  );
}