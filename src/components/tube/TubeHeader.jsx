import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, X, LogIn, Globe, ChevronDown, Check, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n.jsx";
import { useAuth } from "@/lib/AuthContext";
import { getDashboardPath } from "@/lib/roleResolver";

const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "tl", label: "Tagalog", native: "Tagalog" },
  { code: "zh-TW", label: "Traditional Chinese", native: "繁體中文" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
];

const navLinks = [
  { href: "/videos", label: "Videos" },
  { href: "/performers", label: "Performers" },
  { href: "/videos?category=all", label: "Categories" },
  { href: "/videos?search=photos", label: "Photos" },
  { href: "/news", label: "Blog" },
  { href: "/become-performer", label: "Become Performer" },
];

function NavLink({ href, label, active, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`relative py-2 text-sm font-black uppercase tracking-[0.08em] transition-colors duration-150 after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-[#E51D2A] after:transition-all after:duration-150 ${
        active ? "text-white after:w-full" : "text-white/70 hover:text-white after:w-0 hover:after:w-full"
      }`}
    >
      {label}
    </a>
  );
}

export default function TubeHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();
  const { isAuthenticated, user, logout } = useAuth();
  const currentLang = languages.find((lang) => lang.code === locale) || languages[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (href) => {
    const clean = href.split("?")[0];
    return location.pathname === clean || (clean !== "/" && location.pathname.startsWith(clean + "/"));
  };

  const submitSearch = () => {
    const query = searchQuery.trim();
    if (query) navigate(`/videos?search=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    logout(true);
    setUserMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-[100] bg-[#050505] transition-colors duration-200 ${scrolled ? "border-b border-white/10" : "border-b border-transparent"}`}>
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="h-16 md:h-[72px] flex items-center justify-between gap-5">
          <a href="/" className="text-white text-xl md:text-2xl font-black tracking-[-0.04em] uppercase hover:text-[#E51D2A] transition-colors duration-150">
            FLESHLAB
          </a>

          <nav className="hidden lg:flex items-center justify-center gap-8">
            {navLinks.map((link) => <NavLink key={link.label} {...link} active={isActive(link.href)} />)}
          </nav>

          <div className="flex items-center justify-end gap-2 md:gap-3">
            <div className="hidden md:block relative">
              {searchOpen ? (
                <div className="relative w-64">
                  <Input
                    autoFocus
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }}
                    placeholder={t("nav.search")}
                    className="h-11 rounded-[14px] bg-[#121212] border-white/[0.08] text-white placeholder:text-[#B0B0B0] pr-11"
                  />
                  <button onClick={submitSearch} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="h-11 px-3 rounded-[14px] text-white/75 hover:text-white hover:bg-white/10 transition-colors duration-150 inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                  <Search className="w-4 h-4" /> Search
                </button>
              )}
            </div>

            <div className="relative hidden sm:block">
              <button onClick={() => setLangOpen(!langOpen)} className="h-11 px-3 rounded-[14px] text-white/75 hover:text-white hover:bg-white/10 transition-colors duration-150 inline-flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden xl:inline text-sm font-black">{currentLang.native}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-[#121212] border border-white/[0.08] rounded-[18px] shadow-2xl shadow-black/70 z-50 overflow-hidden">
                    {languages.map((lang) => (
                      <button key={lang.code} onClick={() => { setLocale(lang.code); setLangOpen(false); }} className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between">
                        <span className="text-sm font-black text-white">{lang.native}</span>
                        {locale === lang.code && <Check className="w-4 h-4 text-[#E51D2A]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="h-11 px-4 rounded-[14px] border border-white/[0.08] text-white hover:bg-white/10 transition-colors duration-150 inline-flex items-center gap-2 text-sm font-black">
                  <UserCircle className="w-4 h-4" /> Account
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-[#121212] border border-white/[0.08] rounded-[18px] shadow-2xl shadow-black/70 z-50 overflow-hidden">
                      <Link to={getDashboardPath(user)} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-white/75 hover:text-white hover:bg-white/10 transition-colors">
                        <UserCircle className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-white/75 hover:text-white hover:bg-white/10 transition-colors">
                        <UserCircle className="w-4 h-4" /> Account Settings
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/75 hover:text-white hover:bg-white/10 transition-colors border-t border-white/[0.08]">
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <a href="/login" className="hidden sm:inline-flex h-11 px-4 rounded-[14px] text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150 items-center gap-2 text-sm font-black uppercase tracking-wide">
                  <LogIn className="w-4 h-4" /> Login
                </a>
                <a href="/register" className="hidden sm:inline-flex h-11 px-5 rounded-[14px] bg-[#E51D2A] hover:bg-[#b91b21] text-white transition-colors duration-150 items-center text-sm font-black uppercase tracking-wide">
                  Join
                </a>
              </>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden h-11 w-11 rounded-[14px] text-white hover:bg-white/10 inline-flex items-center justify-center transition-colors duration-150">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-[#050505] border-t border-white/10 px-5 py-7">
          <div className="relative mb-8">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }}
              placeholder={t("nav.search")}
              className="h-12 rounded-[14px] bg-[#121212] border-white/[0.08] text-white placeholder:text-[#B0B0B0] pr-12"
            />
            <button onClick={submitSearch} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[#E51D2A] flex items-center justify-center text-white">
              <Search className="w-4 h-4" />
            </button>
          </div>
          <nav className="flex flex-col gap-5">
            {navLinks.map((link) => <NavLink key={link.label} {...link} active={isActive(link.href)} onClick={() => setMobileOpen(false)} />)}
            <a href="/login" className="pt-6 text-white text-lg font-black uppercase tracking-wide">Login</a>
            <a href="/register" className="h-[52px] px-6 rounded-[14px] bg-[#E51D2A] text-white text-lg font-black inline-flex items-center justify-center w-full max-w-xs">Join</a>
          </nav>
        </div>
      )}
    </header>
  );
}