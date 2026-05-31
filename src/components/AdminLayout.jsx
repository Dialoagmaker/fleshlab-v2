import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Video, Users, Tag, Newspaper,
  Link2, Database, Menu, Play, ChevronRight, Globe
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/video-performer-match", label: "Quick Match", icon: Link2 },
  { href: "/admin/performers", label: "Performers", icon: Users },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/seo", label: "SEO", icon: Link2 },
  { href: "/admin/migration", label: "Migration", icon: Database },
];

function SidebarContent({ onNavClick }) {
  const location = useLocation();

  const isActive = (item) =>
    item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="w-7 h-7 bg-primary rounded flex items-center justify-center flex-shrink-0">
          <Play className="w-3.5 h-3.5 text-primary-foreground fill-current" />
        </div>
        <div>
          <p className="text-xs font-black tracking-[0.2em] text-foreground uppercase leading-none">Fleshlab</p>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Admin</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>View Site</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 flex-shrink-0 flex-col">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-56 flex-shrink-0">
            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <Play className="w-2.5 h-2.5 text-primary-foreground fill-current" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase text-foreground">Fleshlab Admin</span>
          </div>
        </div>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}