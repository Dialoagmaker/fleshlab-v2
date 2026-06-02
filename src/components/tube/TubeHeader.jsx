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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 gap-2">
          {/* Live Badge & Tagline */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              LIVE
            </div>
            <div className="text-white text-xl md:text-2xl font-bold">Summer Heat</div>
          </div>

          <p className="text-white/90 text-sm md:text-base font-semibold">Premium Gay Content 🔥</p>

          {/* CTA Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-full text-sm md:text-base h-auto">
              <Zap className="w-4 h-4 mr-2" />
              Let's Play Now
            </Button>
            <Button variant="outline" className="border-white/60 text-white hover:bg-white/10 font-semibold px-6 py-2 rounded-full text-sm md:text-base h-auto">
              Join Fanclub
            </Button>
          </div>

          {/* Discount Badge */}
          <div className="absolute top-4 right-4 md:right-8 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-sm">
            50% OFF
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