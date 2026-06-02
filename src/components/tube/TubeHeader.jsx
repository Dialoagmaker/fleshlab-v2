import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, LogIn, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categories = [
  "New Videos", "Gay Porn", "Amateur", "Big Dick", "Twinks", "Creampie",
  "Anal", "Muscular", "Asian", "Shower", "Solo", "Cumshot", "Bareback",
  "Smooth", "College", "Public", "Party", "Straight"
];

export default function TubeHeader({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const isActive = (href) => {
    return location.pathname === href || (href !== "/" && location.pathname.startsWith(href + "/"));
  };

  return (
    <header className="sticky top-0 z-50 bg-black">
      {/* Top Navigation Bar */}
      <div className="bg-black border-b border-white/10">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-12 gap-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-1">
              <span className="text-white font-bold text-xl">FLESH</span>
              <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-sm">LAB</span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder:text-white/40 h-9 pl-4 pr-10 rounded text-sm focus:outline-none focus:border-rose-600/50"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-rose-600 hover:bg-rose-700 rounded flex items-center justify-center text-white transition-colors">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white h-8 px-3 text-xs">
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold h-8 px-4 text-xs">
                  Sign Up
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white/80 h-8 w-8"
                onClick={onMenuToggle}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Promotional Banner */}
      <div className="relative h-40 md:h-48 bg-gradient-to-r from-red-900 via-red-800 to-red-900 overflow-hidden">
        {/* Left Performer */}
        <div className="absolute left-0 top-0 h-full w-24 md:w-40 pointer-events-none">
          <div className="h-full w-full bg-gradient-to-r from-black via-transparent to-transparent absolute z-10" />
          <img 
            src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a0eee0b31_generated_image.png"
            alt="" 
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right Performer */}
        <div className="absolute right-0 top-0 h-full w-24 md:w-40 pointer-events-none">
          <div className="h-full w-full bg-gradient-to-l from-black via-transparent to-transparent absolute z-10" />
          <img 
            src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a4e9ed257_generated_image.png"
            alt="" 
            className="h-full w-full object-cover"
          />
        </div>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 gap-1.5">
          {/* Branding */}
          <div className="text-center">
            <div className="text-white/80 text-xs mb-0.5">无良夏日</div>
            <div className="text-white font-bold text-2xl">火辣激情</div>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <div className="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-0.5 rounded font-bold text-xs animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              LIVE
            </div>
            <div className="text-3xl">☀️</div>
            <div className="bg-yellow-500 text-black px-3 py-0.5 rounded font-bold text-xs">
              50% 折扣
            </div>
            <Button className="bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-0.5 rounded text-xs h-auto">
              一起来玩
            </Button>
          </div>
        </div>
      </div>

      {/* Branding Bar */}
      <div className="bg-black border-t border-white/10">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="h-10 flex items-center text-white/70 text-sm">
            <span className="font-semibold">Gay Porn Videos Internationally</span>
            <span className="ml-2 text-blue-400">✓</span>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-black border-t border-white/10">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                className="flex-shrink-0 px-3 py-1 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:bg-rose-600 transition-colors whitespace-nowrap border border-white/10"
              >
                {cat}
              </button>
            ))}
            <button className="flex-shrink-0 h-7 w-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center flex-shrink-0 ml-auto">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}