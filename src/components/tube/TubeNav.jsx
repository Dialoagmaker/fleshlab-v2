import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Videos", href: "/videos" },
  { label: "Categories", href: "/videos", dropdown: true },
  { label: "Performers", href: "/performers" },
  { label: "Fanclub", href: "/fanclub" },
  { label: "Fan Productions", href: "/fan-productions" },
  { label: "News", href: "/news" },
  { label: "Become a Performer", href: "/become-performer", highlight: true },
];

export default function TubeNav() {
  const location = useLocation();

  return (
    <nav className="sticky top-16 z-40 bg-[#0a0a0a] border-b border-white/10">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                item.highlight
                  ? location.pathname === item.href
                    ? "text-rose-400 border border-rose-500/60 bg-rose-600/15"
                    : "text-rose-300 border border-rose-600/40 bg-rose-600/10 hover:bg-rose-600/20 hover:text-rose-200"
                  : location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
                  ? "text-rose-500"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
              {item.dropdown && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}