import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

/**
 * StudioHeader - Sticky header with scroll-based transparency
 */
export default function StudioHeader({ scrolled }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.05]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-24 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center py-4" aria-label="FLESHLAB home">
            <BrandLogo className="h-[78px] w-[258px]" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/become-performer"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/become-performer'
                  ? 'text-rose-500'
                  : 'text-[#F5F5F5]/80 hover:text-white'
              }`}
            >
              Become a Performer
            </Link>
            <Link
              to="/performers"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/performers'
                  ? 'text-rose-500'
                  : 'text-[#F5F5F5]/80 hover:text-white'
              }`}
            >
              Creators
            </Link>
            <Link
              to="/news"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/news'
                  ? 'text-rose-500'
                  : 'text-[#F5F5F5]/80 hover:text-white'
              }`}
            >
              Studio Journal
            </Link>
            <Link
              to="/videos"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/videos'
                  ? 'text-rose-500'
                  : 'text-[#F5F5F5]/80 hover:text-white'
              }`}
            >
              Videos
            </Link>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-[#F5F5F5]/80 hover:text-white">
              <Search className="w-5 h-5" />
            </Button>
            
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[#F5F5F5]/80 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Desktop CTA */}
            <Link to="/become-performer" className="hidden sm:block">
              <Button className="bg-rose-600 hover:bg-rose-700 text-white">
                Join The World
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0A0A0A] pt-16">
          <nav className="flex flex-col p-4 space-y-4">
            <Link
              to="/become-performer"
              className="text-lg font-medium text-rose-500 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Become a Performer
            </Link>
            <Link
              to="/performers"
              className="text-lg font-medium text-[#F5F5F5]/80 hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Creators
            </Link>
            <Link
              to="/news"
              className="text-lg font-medium text-[#F5F5F5]/80 hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Studio Journal
            </Link>
            <Link
              to="/videos"
              className="text-lg font-medium text-[#F5F5F5]/80 hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Videos
            </Link>
            <Link
              to="/fanclub"
              className="text-lg font-medium text-[#F5F5F5]/80 hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fanclub
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}