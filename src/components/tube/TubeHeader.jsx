import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, X, LogIn, Star, Globe, ChevronDown, Check, Home, Film, Users, Crown, Newspaper, Camera, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n.jsx";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'tl', label: 'Tagalog', native: 'Tagalog' },
  { code: 'zh-TW', label: 'Traditional Chinese', native: '繁體中文' },
  { code: 'th', label: 'Thai', native: 'ไทย' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
];

const BASE_NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/videos", label: "Videos", icon: Film },
  { href: "/performers", label: "Performers", icon: Users },
  { href: "/fanclub", label: "Fanclub", icon: Crown },
  { href: "/fan-productions", label: "Fan Productions", icon: Camera },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/become-performer", label: "Become a Performer", icon: Star },
];

const AUTHENTICATED_NAV_LINKS = [
  ...BASE_NAV_LINKS,
  { href: "/client/dashboard", label: "Dashboard", icon: UserCircle },
];

export default function TubeHeader({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();
  const { isAuthenticated, user, logout } = useAuth();
  const currentLang = languages.find(l => l.code === locale) || languages[0];

  const handleLogout = () => {
    logout(true);
    setUserMenuOpen(false);
  };

  const isActive = (href) => {
    return location.pathname === href || (href !== "/" && location.pathname.startsWith(href + "/"));
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hide global search bar on /videos page to avoid duplicate search bars
  const isVideosPage = location.pathname === '/videos';

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/videos?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border-b border-rose-600/20">
      {/* Top Glow Line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-600/40 to-transparent" />
      
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16 gap-4">
          {/* Logo */}
          <a href="/" className="flex-shrink-0 group">
            <div className="flex items-center gap-0.5">
              <span className="text-white font-extrabold text-xl md:text-2xl tracking-tight group-hover:text-rose-500 transition-colors">FLESH</span>
              <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-xl md:text-2xl px-2.5 md:px-3 py-0.5 md:py-1 rounded-md shadow-lg group-hover:shadow-rose-600/40 transition-shadow">LAB</span>
            </div>
          </a>

          {/* Search Bar - Enhanced (hidden on /videos page) */}
          {!isVideosPage && (
            <div className="hidden md:flex flex-1 max-w-3xl mx-4">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder={t('nav.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full bg-[#121212] border border-rose-600/20 text-white placeholder:text-white/40 h-11 pl-5 pr-14 rounded-lg focus:outline-none focus:border-rose-600/50 focus:ring-2 focus:ring-rose-600/20 transition-all"
                />
                <button 
                  onClick={handleSearchSubmit}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-lg flex items-center justify-center text-white transition-all shadow-lg shadow-rose-600/30"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLangOpen(!langOpen)}
                className="gap-2 bg-transparent border-white/20 hover:bg-white/10 hover:border-rose-600/60 text-white h-9 px-3"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden lg:inline text-sm">{currentLang.native}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </Button>

              {langOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setLangOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLocale(lang.code);
                          setLangOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between group ${
                          locale === lang.code ? 'bg-rose-600/20' : ''
                        }`}
                      >
                        <div>
                          <div className={`text-sm font-semibold ${
                            locale === lang.code ? 'text-rose-500' : 'text-white'
                          }`}>
                            {lang.native}
                          </div>
                          {lang.label !== lang.native && (
                            <div className="text-xs text-white/50">{lang.label}</div>
                          )}
                        </div>
                        {locale === lang.code && (
                          <Check className="w-4 h-4 text-rose-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Authenticated User - Dashboard + User Menu */}
            {isAuthenticated ? (
              <>
                <Link to="/client/dashboard">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-9 px-4 border border-white/10 mr-2">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="gap-2 bg-transparent border-white/20 hover:bg-white/10 hover:border-rose-600/60 text-white h-9 px-3"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span className="hidden lg:inline text-sm max-w-[150px] truncate">
                      {user?.full_name || user?.email?.split('@')[0] || 'Account'}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-white/10">
                          <div className="text-sm font-semibold text-white">{user?.full_name || 'User'}</div>
                          <div className="text-xs text-white/50 truncate">{user?.email}</div>
                        </div>
                        {/* Menu items */}
                        <Link
                          to="/client/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <UserCircle className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          to="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <UserCircle className="w-4 h-4" />
                          Account Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border-t border-white/10"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <a href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-9 px-4 border border-white/10">
                    <LogIn className="w-4 h-4 mr-2" />
                    {t('nav.login')}
                  </Button>
                </a>
                <a href="/register" className="hidden sm:block">
                  <Button size="sm" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold h-9 px-4 shadow-lg shadow-rose-600/30">
                    {t('nav.register')}
                  </Button>
                </a>
              </>
            )}
            <a href="/fanclub" className="hidden lg:block">
              <Button size="sm" variant="outline" className="border-rose-600/50 text-rose-500 hover:bg-rose-600/10 hover:border-rose-600 h-9 px-4">
                <Star className="w-4 h-4 mr-2 fill-current" />
                {t('nav.fanclub')}
              </Button>
            </a>
            <button
              className="md:hidden text-white/80 hover:text-white h-10 w-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Enhanced */}
      <div className="hidden md:block bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border-t border-rose-600/10">
        <div className="max-w-[1920px] mx-auto px-4">
          <nav className="flex items-center gap-1 py-2.5 overflow-x-auto scrollbar-hide">
            <a
              href="/"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                isActive("/")
                  ? "text-rose-500 bg-rose-600/15 border border-rose-600/30 shadow-lg shadow-rose-600/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {t('nav.home')}
            </a>
            <a
              href="/videos"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                isActive("/videos")
                  ? "text-rose-500 bg-rose-600/15 border border-rose-600/30 shadow-lg shadow-rose-600/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {t('nav.videos')}
            </a>
            <a
              href="/performers"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                isActive("/performers")
                  ? "text-rose-500 bg-rose-600/15 border border-rose-600/30 shadow-lg shadow-rose-600/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {t('nav.performers')}
            </a>
            <a
              href="/fanclub"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                isActive("/fanclub")
                  ? "text-rose-500 bg-rose-600/15 border border-rose-600/30 shadow-lg shadow-rose-600/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {t('nav.fanclub')}
            </a>
            <a
              href="/news"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                isActive("/news")
                  ? "text-rose-500 bg-rose-600/15 border border-rose-600/30 shadow-lg shadow-rose-600/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {t('nav.news')}
            </a>
            <a
              href="/fan-productions"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                isActive("/fan-productions")
                  ? "text-rose-500 bg-rose-600/15 border border-rose-600/30 shadow-lg shadow-rose-600/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Fan Productions
            </a>
            <a
              href="/become-performer"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                isActive("/become-performer")
                  ? "text-rose-500 bg-rose-600/15 border border-rose-600/30 shadow-lg shadow-rose-600/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {t('nav.becomePerformer')}
            </a>
          </nav>
        </div>
      </div>

      {/* Mobile Search (hidden on /videos page) */}
      {!isVideosPage && (
        <div className="md:hidden px-3 py-1.5 border-t border-rose-600/10">
          <div className="relative">
            <Input
              type="text"
              placeholder={t('nav.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-[#121212] border border-rose-600/20 text-white placeholder:text-white/40 h-10 pl-4 pr-12 rounded-lg text-sm focus:outline-none focus:border-rose-600/50"
            />
            <button 
              onClick={handleSearchSubmit}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-gradient-to-r from-rose-600 to-rose-700 rounded-md flex items-center justify-center text-white"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed top-0 right-0 z-50 h-full w-[280px] max-w-[85vw] bg-[#0f0a0a] border-l border-rose-600/25 shadow-2xl shadow-rose-900/30 flex flex-col md:hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-rose-600/15">
              <span className="text-white font-black text-lg tracking-tight">
                FLESH<span className="bg-rose-600 px-2 rounded-md ml-0.5">LAB</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/60 hover:text-white h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {(isAuthenticated ? AUTHENTICATED_NAV_LINKS : BASE_NAV_LINKS).map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1 text-base font-semibold transition-colors min-h-[48px] ${
                    isActive(href)
                      ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                      : 'text-white/75 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </a>
              ))}
            </nav>

            {/* Bottom auth actions - Mobile */}
            {isAuthenticated ? (
              <div className="px-4 py-4 border-t border-white/8 space-y-2">
                <Link to="/client/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/15 text-white font-semibold text-sm hover:bg-white/8 transition-colors">
                  <UserCircle className="w-4 h-4" /> Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-red-600/20 border border-red-600/30 text-red-400 font-semibold text-sm hover:bg-red-600/30 transition-colors">
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            ) : (
              <div className="px-4 py-4 border-t border-white/8 space-y-2">
                <a href="/login" className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/15 text-white/80 font-semibold text-sm hover:bg-white/8 transition-colors" onClick={() => setMobileOpen(false)}>
                  <LogIn className="w-4 h-4" /> Log In
                </a>
                <a href="/register" className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-700/30 hover:from-rose-500 hover:to-rose-600 transition-all" onClick={() => setMobileOpen(false)}>
                  Sign Up
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}