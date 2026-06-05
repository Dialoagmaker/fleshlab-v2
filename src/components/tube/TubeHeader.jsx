import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, LogIn, Star, Globe, ChevronDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n.jsx";

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'tl', label: 'Tagalog', native: 'Tagalog' },
  { code: 'zh-TW', label: 'Traditional Chinese', native: '繁體中文' },
  { code: 'th', label: 'Thai', native: 'ไทย' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
];

export default function TubeHeader({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  const R2_BASE = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-f5c2ded46b174bbbb21e72a40c6b8022.r2.dev';
  const BANNER_URL = `${R2_BASE}/studios/6a1ca4cdc29d96ab4c624c98/banner/ChatGPT%20Image%205.%20Juni%202026%2C%2012_46_38.png`;
  const location = useLocation();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();
  const currentLang = languages.find(l => l.code === locale) || languages[0];

  const isActive = (href) => {
    return location.pathname === href || (href !== "/" && location.pathname.startsWith(href + "/"));
  };

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
      {/* Studio Banner */}
      {bannerVisible && (
        <div className="relative w-full overflow-hidden bg-black" style={{ maxHeight: '120px' }}>
          <img
            src={BANNER_URL}
            alt="Studio Banner"
            className="w-full h-full object-cover object-center"
            style={{ maxHeight: '120px' }}
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
          <button
            onClick={() => setBannerVisible(false)}
            className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Top Glow Line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-600/40 to-transparent" />
      
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <a href="/" className="flex-shrink-0 group">
            <div className="flex items-center gap-0.5">
              <span className="text-white font-extrabold text-2xl tracking-tight group-hover:text-rose-500 transition-colors">FLESH</span>
              <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-2xl px-3 py-1 rounded-md shadow-lg group-hover:shadow-rose-600/40 transition-shadow">LAB</span>
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

            <a href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-9 px-4 border border-white/10">
                <LogIn className="w-4 h-4 mr-2" />
                {t('nav.login')}
              </Button>
            </a>
            <a href="/register">
              <Button size="sm" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold h-9 px-4 shadow-lg shadow-rose-600/30">
                {t('nav.register')}
              </Button>
            </a>
            <a href="/fanclub" className="hidden lg:block">
              <Button size="sm" variant="outline" className="border-rose-600/50 text-rose-500 hover:bg-rose-600/10 hover:border-rose-600 h-9 px-4">
                <Star className="w-4 h-4 mr-2 fill-current" />
                {t('nav.fanclub')}
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white/80 hover:text-white h-9 w-9"
              onClick={onMenuToggle}
            >
              <Menu className="w-6 h-6" />
            </Button>
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
        <div className="md:hidden px-4 pb-3 border-t border-rose-600/10">
          <div className="relative pt-3">
            <Input
              type="text"
              placeholder={t('nav.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-[#121212] border border-rose-600/20 text-white placeholder:text-white/40 h-11 pl-5 pr-14 rounded-lg focus:outline-none focus:border-rose-600/50"
            />
            <button 
              onClick={handleSearchSubmit}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-gradient-to-r from-rose-600 to-rose-700 rounded-lg flex items-center justify-center text-white"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}