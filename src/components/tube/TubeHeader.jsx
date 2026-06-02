import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, LogIn, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Videos", href: "/videos" },
  { label: "Performers", href: "/performers" },
  { label: "Fanclub", href: "/fanclub" },
  { label: "News", href: "/news" },
  { label: "Become a Performer", href: "/become-performer" },
];

// Summer header background images
const SUMMER_BG = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/20d5a4901_generated_image.png";
const PERFORMER_LEFT = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a0eee0b31_generated_image.png";
const PERFORMER_RIGHT = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a4e9ed257_generated_image.png";

export default function TubeHeader({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const isActive = (href) => {
    return location.pathname === href || (href !== "/" && location.pathname.startsWith(href + "/"));
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Summer Banner Background */}
      <div className="relative h-20 bg-gradient-to-r from-orange-900/40 via-rose-900/30 to-orange-900/40 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${SUMMER_BG})` }}
        />
        
        {/* Left Performer Image - Fade in from edge */}
        <div className="absolute left-0 top-0 h-full w-32 md:w-48 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent z-10" />
          <img 
            src={PERFORMER_LEFT} 
            alt="" 
            className="h-full w-full object-cover object-left"
          />
        </div>

        {/* Right Performer Image - Fade in from edge */}
        <div className="absolute right-0 top-0 h-full w-32 md:w-48 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0a] via-transparent to-transparent z-10" />
          <img 
            src={PERFORMER_RIGHT} 
            alt="" 
            className="h-full w-full object-cover object-right"
          />
        </div>

        {/* Partner Logos */}
        <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20">
          <div className="text-white/90 font-bold text-lg md:text-xl tracking-tight drop-shadow-lg">
            <span className="text-orange-400">Chatur</span>bate
          </div>
        </div>

        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20">
          <div className="text-white/90 font-bold text-lg md:text-xl tracking-tight drop-shadow-lg text-right">
            <span className="text-orange-500">XHamster</span>
            <span className="text-white/60 text-sm block font-normal">Faphouse</span>
          </div>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <Link to="/" className="group">
            <div className="flex items-center gap-0.5">
              <span className="text-white font-extrabold text-2xl md:text-3xl tracking-tight drop-shadow-lg group-hover:text-rose-400 transition-colors">FLESH</span>
              <span className="bg-gradient-to-r from-rose-500 to-rose-600 text-white font-extrabold text-2xl md:text-3xl px-3 py-1 rounded-md shadow-xl group-hover:shadow-rose-500/40 transition-shadow">LAB</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-[#0a0a0a] border-b border-white/10">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            {/* Nav Items - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-rose-500 bg-rose-500/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search videos, performers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder:text-white/40 h-9 pl-4 pr-12 rounded-md focus:outline-none focus:border-rose-600/50"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-rose-600 hover:bg-rose-700 rounded flex items-center justify-center text-white transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-3 text-xs">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold h-8 px-3 text-xs">
                  Sign Up
                </Button>
              </Link>
              <Link to="/fanclub" className="hidden lg:block">
                <Button size="sm" variant="outline" className="border-rose-600/50 text-rose-500 hover:bg-rose-600/10 h-8 px-3 text-xs">
                  <Star className="w-3.5 h-3.5 mr-1.5" />
                  Fanclub
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white/80 hover:text-white h-8 w-8"
                onClick={onMenuToggle}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3 bg-[#0a0a0a] border-b border-white/10">
        <div className="relative pt-3">
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/15 text-white placeholder:text-white/40 h-11 pl-5 pr-14 rounded-lg focus:outline-none focus:border-rose-600/50"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-rose-600 hover:bg-rose-700 rounded-md flex items-center justify-center text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}