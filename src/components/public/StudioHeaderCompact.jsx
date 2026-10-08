import { Link } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

/**
 * StudioHeaderCompact - Minimal compact header (after gate entry)
 * Shows F monogram + hamburger menu
 */
export default function StudioHeaderCompact({ scrolled, onMenuToggle }) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.05]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-24 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center py-4" aria-label="FLESHLAB home">
            <BrandLogo className="h-[78px] w-[258px]" />
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search (disabled for now) */}
            <Button
              variant="ghost"
              size="icon"
              className="text-[#F5F5F5]/60 hover:text-white"
              disabled
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Hamburger menu */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="text-[#F5F5F5]/60 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}