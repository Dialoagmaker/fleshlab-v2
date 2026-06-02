import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * StudioMobileMenu - Slide-out mobile navigation
 */
export default function StudioMobileMenu({ open, onClose }) {
  if (!open) return null;

  const navItems = [
    { label: "Videos", href: "/videos" },
    { label: "Performers", href: "/performers" },
    { label: "Studio Journal", href: "/news" },
    { label: "Fanclub", href: "/fanclub" }
  ];

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0A0A0A] border-l border-white/[0.1] p-6">
        <div className="flex items-center justify-between mb-8">
          <span className="text-lg font-bold text-white">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#F5F5F5]/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block text-lg text-[#F5F5F5]/80 hover:text-white py-2"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Link to="/login" onClick={onClose}>
            <Button className="w-full bg-rose-600 hover:bg-rose-700">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}