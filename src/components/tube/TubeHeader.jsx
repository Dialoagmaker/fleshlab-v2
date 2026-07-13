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
    <a href={href} onClick={onClick} className={`relative flex h-12 items-center px-1 text-[10px] font-black uppercase tracking-[0.16em] transition-colors after:absolute after:bottom-1 after:left-0 after:h-[2px] after:bg-[#E51D2A] after:transition-all after:duration-300 ${active ? "text-white after:w-full" : "text-white/62 hover:text-white after:w-0 hover:after:w-full"}`}>{label}</a>
  );
}

export default function TubeHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);

  const isActive = (href) => {
    const clean = href.split("?")[0];
    return clean === "/" ? location.pathname === "/" : location.pathname === clean || location.pathname.startsWith(`${clean}/`);
  };
  const submitSearch = () => {
    const clean = query.trim();
    if (clean) navigate(`/videos?search=${encodeURIComponent(clean)}`);
  };

  return (
    <header className={`sticky top-0 z-[100] border-b transition-all duration-300 ${scrolled ? "border-white/10 bg-[#050505]/82 shadow-2xl shadow-black/40 backdrop-blur-xl" : "border-white/[0.06] bg-[#050505]/58 backdrop-blur-md"}`}>
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-5 md:px-10 lg:px-14">
        <a href="/" className="shrink-0 leading-none" aria-label="FLESHLAB home">
          <span className="block text-[24px] font-black tracking-[0.28em] text-white md:text-[29px]">FLESHL<span className="text-[#E51D2A]">A</span>B</span>
          <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.74em] text-[#E51D2A] md:text-[9px]">Amateur Wins.</span>
        </a>
        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">{navLinks.map((link) => <NavItem key={link.label} {...link} active={isActive(link.href)} />)}</nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 xl:flex">
            <Search className="h-4 w-4 text-white/70" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }} placeholder="Search" className="w-20 bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/50 focus:w-32" />
          </div>
          {isAuthenticated ? <Link to={getDashboardPath(user)} className="hidden h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-[10px] font-black uppercase text-white transition-all hover:bg-white/10 sm:inline-flex"><UserCircle className="h-3.5 w-3.5" /> Account</Link> : <><a href="/login" className="hidden h-10 items-center rounded-full border border-white/15 bg-white/[0.04] px-5 text-[10px] font-black uppercase text-white transition-all hover:bg-white/10 sm:inline-flex">Login</a><a href="/register" className="hidden h-10 items-center rounded-full bg-[#E51D2A] px-5 text-[10px] font-black uppercase text-white shadow-[0_12px_30px_rgba(229,29,42,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#c91822] sm:inline-flex">Join Now</a></>}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white lg:hidden">{mobileOpen ? <X /> : <Menu />}</button>
        </div>
      </div>
      {mobileOpen && <div className="fixed inset-x-0 top-[72px] z-50 border-t border-white/10 bg-[#050505]/96 px-5 py-6 backdrop-blur-xl lg:hidden"><div className="mb-5 flex items-center gap-2 rounded-full border border-white/15 bg-[#111] px-4"><Search className="h-4 w-4 text-white/60" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }} placeholder="Search" className="h-12 flex-1 bg-transparent text-sm text-white outline-none" /></div><nav className="flex flex-col gap-1">{navLinks.map((link) => <NavItem key={link.label} {...link} active={isActive(link.href)} onClick={() => setMobileOpen(false)} />)}<a href="/login" className="mt-5 h-12 rounded-full border border-white/20 px-4 text-center text-xs font-black uppercase leading-12 text-white">Login</a><a href="/register" className="h-12 rounded-full bg-[#E51D2A] px-4 text-center text-xs font-black uppercase leading-12 text-white">Join Now</a></nav></div>}
    </header>
  );
}