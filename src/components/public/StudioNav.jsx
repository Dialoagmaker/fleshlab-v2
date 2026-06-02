import { Link, useLocation } from "react-router-dom";
import { Film, Users, Newspaper, Heart } from "lucide-react";

/**
 * StudioNav - Secondary navigation bar
 */
export default function StudioNav() {
  const location = useLocation();
  
  const navItems = [
    {
      label: "Latest Productions",
      href: "/videos",
      icon: Film,
      active: location.pathname.startsWith('/videos')
    },
    {
      label: "Featured Artists",
      href: "/performers",
      icon: Users,
      active: location.pathname.startsWith('/performers')
    },
    {
      label: "Studio Journal",
      href: "/news",
      icon: Newspaper,
      active: location.pathname.startsWith('/news')
    },
    {
      label: "Fanclub",
      href: "/fanclub",
      icon: Heart,
      active: location.pathname.startsWith('/fanclub'),
      featured: true
    }
  ];
  
  return (
    <div className="bg-[#0F0F0F] border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  item.featured
                    ? 'text-rose-500 hover:text-rose-400'
                    : item.active
                    ? 'text-white bg-white/[0.05]'
                    : 'text-[#F5F5F5]/60 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}