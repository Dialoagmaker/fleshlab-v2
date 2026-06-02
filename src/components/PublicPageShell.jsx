// TODO: PublicPageShell uses normal anchors while manual public route dispatch is active. Restore React Router NavLink after router rebuild.
import { useState } from "react";
import { Menu, X, Search, Play } from "lucide-react";

const navLinks = [
  { href: "/videos",           label: "Videos" },
  { href: "/performers",       label: "Performers" },
  { href: "/become-performer", label: "Become a Performer" },
  { href: "/fanclub",          label: "Fanclub" },
  { href: "/news",             label: "News" },
];

const footerLinks = [
  ...navLinks,
  { href: "/guest-production", label: "Guest Production" },
  { href: "/how-it-works",     label: "How It Works" },
  { href: "/faq",              label: "FAQ" },
];

export default function PublicPageShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Helper to check if a link is active based on current pathname
  const isActive = (href) => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-black mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span className="text-lg font-black tracking-[0.18em] text-white uppercase">Fleshlab</span>
              </div>
              <p className="text-xs text-white/30 max-w-xs leading-relaxed">
                Premium Asian twink studio content. Original productions, verified performers, exclusive releases.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/25">© 2026 Fleshlab. All rights reserved.</p>
            <p className="text-xs text-white/25">All content features verified 18+ performers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}