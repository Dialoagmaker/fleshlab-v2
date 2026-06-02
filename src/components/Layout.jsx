import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Search, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function Layout() {
  console.log('PUBLIC_LAYOUT_RENDER_START', window.location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Premium Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[68px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-lg shadow-primary/40">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-xl font-black tracking-[0.18em] text-white uppercase">
                Fleshlab
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => {
                const active = location.pathname === link.href || location.pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      active
                        ? "text-white bg-primary/15 border border-primary/30"
                        : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/search"
                className="p-2 text-white/50 hover:text-white transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </Link>
              <Link
                to="/fanclub"
                className="hidden sm:inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-primary/25"
              >
                Join Fanclub
              </Link>
              <button
                className="lg:hidden p-2 text-white/60 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/[0.06] bg-black/95 px-4 py-4 space-y-1">
            {navLinks.map(link => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active ? "text-white bg-primary/15" : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2">
              <Link
                to="/fanclub"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-3 rounded-lg transition-colors"
              >
                Join Fanclub
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
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
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  {link.label}
                </Link>
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