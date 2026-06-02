import { Link } from "react-router-dom";

const footerLinks = {
  explore: [
    { label: "Videos", href: "/videos" },
    { label: "Performers", href: "/performers" },
    { label: "Categories", href: "/videos" },
    { label: "Fanclub", href: "/fanclub" },
    { label: "News", href: "/news" },
  ],
  community: [
    { label: "Become a Performer", href: "/become-performer" },
    { label: "Guest Production", href: "/guest-production" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "FAQ", href: "/faq" },
  ],
  legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "DMCA", href: "#" },
    { label: "2257 Compliance", href: "#" },
  ],
};

export default function TubeFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#070707] border-t border-white/8">
      <div className="max-w-[1280px] mx-auto px-4 py-12">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-3">
              <div className="flex items-center gap-0.5">
                <span className="text-white font-extrabold text-lg md:text-xl tracking-tight">FLESH</span>
                <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-lg md:text-xl px-2.5 py-1 rounded-md shadow-lg shadow-rose-600/30">LAB</span>
              </div>
            </Link>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed">
              Premium Asian gay adult studio featuring verified performers and exclusive productions.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">Explore</h4>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs md:text-sm text-white/60 hover:text-rose-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance */}
        <div className="border-t border-white/8 pt-8">
          <div className="text-center">
            <p className="text-xs text-white/50 leading-relaxed mb-2">
              <strong className="text-white/70">18 U.S.C. 2257 Compliance Notice:</strong> All performers depicted on this website were at least 18 years of age at the time of production.
            </p>
            <p className="text-xs text-white/40">
              © {currentYear} FLESHLAB Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}