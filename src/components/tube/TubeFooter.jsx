import { Instagram, Twitter, Mail } from "lucide-react";

const columns = [
  {
    title: "Company",
    links: [
      { href: "/", label: "Home" },
      { href: "/performers", label: "Performers" },
      { href: "/become-performer", label: "Become Performer" },
      { href: "/news", label: "Blog" },
    ],
  },
  {
    title: "Categories",
    links: [
      { href: "/videos", label: "Videos" },
      { href: "/videos?category=solo", label: "Solo" },
      { href: "/videos?category=couples", label: "Couples" },
      { href: "/videos?category=homemade", label: "Homemade" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/how-it-works", label: "How It Works" },
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
    <footer className="bg-[#070707] border-t border-white/[0.08] px-6 md:px-10 lg:px-16">
      <div className="max-w-[1600px] mx-auto py-16 md:py-20">
        <div className="grid md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10 md:gap-12">
          <div>
            <a href="/" className="inline-block text-white text-2xl font-black uppercase tracking-[-0.04em] mb-5 hover:text-[#D81F26] transition-colors duration-150">FLESHLAB</a>
            <p className="text-[#B0B0B0] text-base leading-relaxed max-w-md">
              Premium authentic amateur productions with verified real people, homemade moments and a clean studio standard.
            </p>
            <div className="flex items-center gap-4 mt-7">
              <a href="https://twitter.com/fleshlabasia" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors duration-150"><Twitter className="w-5 h-5" /></a>
              <a href="https://instagram.com/fleshlabasia" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors duration-150"><Instagram className="w-5 h-5" /></a>
              <a href="mailto:studiosupport@fleshlab.online" className="w-11 h-11 rounded-full border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors duration-150"><Mail className="w-5 h-5" /></a>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-white text-sm font-black uppercase tracking-[0.18em] mb-5">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[#B0B0B0] text-base hover:text-white transition-colors duration-150">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.08] grid md:grid-cols-[1fr_auto] gap-6 items-end">
          <div className="text-[#B0B0B0] text-xs leading-relaxed max-w-4xl space-y-3">
            <p><strong className="text-white/80">18 U.S.C. 2257:</strong> All performers depicted on this website were 18 years of age or older at the time of the creation of the depictions. Records are maintained as required by applicable law.</p>
            <p>FLESHLAB Studios · A division of Dialogmakers International Ltd. · Taoyuan City, Taiwan</p>
          </div>
          <p className="text-[#B0B0B0] text-xs">© {currentYear} FLESHLAB Studios</p>
        </div>
      </div>
    </footer>
  );
}