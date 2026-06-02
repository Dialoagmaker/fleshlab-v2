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
    <footer className="bg-[#050505] border-t border-white/10 py-12">
      <div className="max-w-[1920px] mx-auto px-4">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <div className="flex items-center gap-1">
                <span className="text-white font-bold text-xl tracking-tight">FLESH</span>
                <span className="bg-rose-600 text-white font-bold text-xl px-2 py-0.5 rounded">LAB</span>
              </div>
            </Link>
            <p className="text-sm text-white/60 mb-4">
              Premium Asian gay adult studio featuring verified performers and exclusive productions.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Explore</h4>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance */}
        <div className="border-t border-white/10 pt-8">
          <div className="text-center mb-4">
            <p className="text-sm text-white/60 mb-2">
              <strong className="text-white">18 U.S.C. 2257 Compliance Notice:</strong> All performers depicted in this website were at least 18 years of age at the time of production.
            </p>
            <p className="text-sm text-white/60">
              All performers verified 18+ • © {currentYear} FLESHLAB Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}