import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Search, Play } from "lucide-react";

const navLinks = [
  { href: "/videos", label: "Videos" },
  { href: "/performers", label: "Performers" },
  { href: "/become-performer", label: "Become a Performer" },
  { href: "/fanclub", label: "Fanclub" },
  { href: "/news", label: "News" },
];

const footerLinks = [
  ...navLinks,
  { href: "/guest-production", label: "Guest Production" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
];

export default function Layout() {
  console.log("PUBLIC_LAYOUT_RENDER_START", window.location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Play className="w-4 h-4 text-primary-foreground fill-current" />
              </div>
              <span className="text-lg font-black tracking-[0.2em] text-foreground uppercase">Fleshlab</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith(link.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/search" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Search className="w-5 h-5" />
              </Link>
              <button
                className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-primary-foreground fill-current" />
              </div>
              <span className="text-base font-black tracking-[0.2em] text-foreground uppercase">Fleshlab</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6">
              {footerLinks.map(link => (
                <Link key={link.href} to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="text-xs text-muted-foreground">© 2026 Fleshlab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}