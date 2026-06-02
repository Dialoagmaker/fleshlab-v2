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

export default function TubeHeader({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const isActive = (href) => {
    return location.pathname === href || (href !== "/" && location.pathname.startsWith(href + "/"));
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border-b border-rose-600/20">
      {/* Top Glow Line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-600/40 to-transparent" />
      
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <div className="flex items-center gap-0.5">
              <span className="text-white font-extrabold text-2xl tracking-tight group-hover:text-rose-500 transition-colors">FLESH</span>
              <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-2xl px-3 py-1 rounded-md shadow-lg group-hover:shadow-rose-600/40 transition-shadow">LAB</span>
            </div>
          </Link>

          {/* Search Bar - Enhanced */}
          <div className="hidden md:flex flex-1 max-w-3xl mx-4">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search videos, performers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] border border-rose-600/20 text-white placeholder:text-white/40 h-11 pl-5 pr-14 rounded-lg focus:outline-none focus:border-rose-600/50 focus:ring-2 focus:ring-rose-600/20 transition-all"
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-lg flex items-center justify-center text-white transition-all shadow-lg shadow-rose-600/30">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-9 px-4 border border-white/10">
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold h-9 px-4 shadow-lg shadow-rose-600/30">
                Sign Up
              </Button>
            </Link>
            <Link to="/fanclub" className="hidden lg:block">
              <Button size="sm" variant="outline" className="border-rose-600/50 text-rose-500 hover:bg-rose-600/10 hover:border-rose-600 h-9 px-4">
                <Star className="w-4 h-4 mr-2 fill-current" />
                Fanclub
              </Button>
            </Link>
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
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border-t border-rose-600/10">
        <div className="max-w-[1920px] mx-auto px-4">
          <nav className="flex items-center gap-1 py-2.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive(item.href)
                    ? "text-rose-500 bg-rose-600/15 border border-rose-600/30 shadow-lg shadow-rose-600/20"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3 border-t border-rose-600/10">
        <div className="relative pt-3">
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-rose-600/20 text-white placeholder:text-white/40 h-11 pl-5 pr-14 rounded-lg focus:outline-none focus:border-rose-600/50"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-gradient-to-r from-rose-600 to-rose-700 rounded-lg flex items-center justify-center text-white">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}