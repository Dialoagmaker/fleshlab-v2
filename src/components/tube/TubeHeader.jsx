import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, UserCircle, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getDashboardPath } from "@/lib/roleResolver";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/videos", label: "Videos" },
  { href: "/performers", label: "Models" },
  { href: "/videos?category=collections", label: "Collections" },
  { href: "/videos?search=photos", label: "Photos" },
  { href: "/news", label: "Blog" },
  { href: "/fanclub", label: "Community" },
  { href: "/become-performer", label: "Become a Performer" },
];

function NavItem({ href, label, active, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`relative flex h-10 items-center px-1 text-[10px] font-black uppercase tracking-[0.12em] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-[#E51D2A] after:transition-all ${
        active ? "text-white after:w-full" : "text-white/75 hover:text-white after:w-0"
      }`}
    >
      {label}
    </a>
  );
}

export default function TubeHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (href) => {
    const clean = href.split("?")[0];
    return clean === "/" ? location.pathname === "/" : location.pathname === clean || location.pathname.startsWith(`${clean}/`);
  };

  const submitSearch = () => {
    const clean = query.trim();
    if (clean) navigate(`/videos?search=${encodeURIComponent(clean)}`);
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#050505]/95 backdrop-blur">
      <div className="mx-auto flex h-[58px] max-w-[1440px] items-center gap-5 px-5 md:px-10 lg:px-10">
        <a href="/" className="shrink-0 leading-none" aria-label="FLESHLAB home">
          <span className="block text-[24px] font-black tracking-[0.28em] text-white md:text-[29px]">FLESHL<span className="text-[#E51D2A]">A</span>B</span>
          <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.74em] text-[#E51D2A] md:text-[9px]">Amateur Wins.</span>
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {navLinks.map((link) => <NavItem key={link.label} {...link} active={isActive(link.href)} />)}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 xl:flex">
            <Search className="w-4 h-4 text-white/80" />
            <button onClick={submitSearch} className="text-[11px] font-black uppercase tracking-[0.1em] text-white/85 hover:text-white">Search</button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }}
              className="w-0 border-0 bg-transparent p-0 text-xs text-white outline-none focus:w-28"
              aria-label="Search videos"
            />
          </div>

          {isAuthenticated ? (
            <Link to={getDashboardPath(user)} className="hidden h-8 items-center gap-2 border border-white/30 px-4 text-[10px] font-black uppercase text-white hover:bg-white/10 sm:inline-flex">
              <UserCircle className="w-3.5 h-3.5" /> Account
            </Link>
          ) : (
            <>
              <a href="/login" className="hidden h-8 items-center border border-white/30 px-5 text-[10px] font-black uppercase text-white hover:bg-white/10 sm:inline-flex">Login</a>
              <a href="/register" className="hidden h-8 items-center bg-[#E51D2A] px-5 text-[10px] font-black uppercase text-white hover:bg-[#c91822] sm:inline-flex">Join Now</a>
            </>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="inline-flex h-10 w-10 items-center justify-center text-white lg:hidden">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[58px] z-50 border-t border-white/10 bg-[#050505] px-5 py-5 lg:hidden">
          <div className="mb-5 flex items-center gap-2 rounded border border-white/15 bg-[#111] px-3">
            <Search className="w-4 h-4 text-white/60" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }}
              placeholder="Search"
              className="h-11 flex-1 bg-transparent text-sm text-white outline-none"
            />
          </div>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => <NavItem key={link.label} {...link} active={isActive(link.href)} onClick={() => setMobileOpen(false)} />)}
            <a href="/login" className="mt-4 h-10 border border-white/25 px-4 text-center text-xs font-black uppercase leading-10 text-white">Login</a>
            <a href="/register" className="h-10 bg-[#E51D2A] px-4 text-center text-xs font-black uppercase leading-10 text-white">Join Now</a>
          </nav>
        </div>
      )}
    </header>
  );
}