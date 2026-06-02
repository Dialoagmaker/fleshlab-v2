import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TubeHeader({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-white/10">
      {/* Main Header */}
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center gap-0.5">
              <span className="text-white font-extrabold text-2xl tracking-tight">FLESH</span>
              <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-2xl px-2.5 py-1 rounded-md shadow-lg">LAB</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-white/10 text-white placeholder:text-white/40 h-10 pl-4 pr-12 rounded focus:outline-none focus:border-rose-600/50"
              />
              <button className="absolute right-0 top-0 h-full px-4 text-white/60 hover:text-rose-500 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                Sign Up
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white/80 hover:text-white"
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
            className="w-full bg-[#2a2a2a] border border-white/10 text-white placeholder:text-white/40 h-10 pl-4 pr-12 rounded focus:outline-none focus:border-rose-600/50"
          />
          <button className="absolute right-0 top-0 h-full px-4 text-white/60 hover:text-rose-500 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}