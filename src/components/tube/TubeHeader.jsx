import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, LogIn, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TubeHeader({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-white/10">
      {/* Top Row: Logo + Search + Actions */}
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <div className="flex items-center gap-0.5">
              <span className="text-white font-extrabold text-2xl tracking-tight group-hover:text-rose-500 transition-colors">FLESH</span>
              <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-2xl px-3 py-1 rounded-md shadow-lg group-hover:shadow-rose-600/30 transition-shadow">LAB</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-3xl mx-4">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search videos, performers, scenes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/15 text-white placeholder:text-white/40 h-11 pl-5 pr-14 rounded-lg focus:outline-none focus:border-rose-600/50 focus:ring-2 focus:ring-rose-600/20 transition-all"
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-rose-600 hover:bg-rose-700 rounded-md flex items-center justify-center text-white transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-9 px-4">
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold h-9 px-4">
                Sign Up
              </Button>
            </Link>
            <Link to="/fanclub" className="hidden lg:block">
              <Button size="sm" variant="outline" className="border-rose-600/50 text-rose-500 hover:bg-rose-600/10 h-9 px-4">
                <Star className="w-4 h-4 mr-2" />
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

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
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