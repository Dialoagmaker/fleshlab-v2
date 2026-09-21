import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { LayoutDashboard, Menu, Play, ChevronRight, ChevronDown, Globe, LogOut, X, Search, Upload, FolderOpen, Users, BarChart3, ShieldCheck, Settings, WalletCards, Database, Newspaper, Compass, Bot, Palette, WandSparkles, Gauge, BadgeCheck, Workflow } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV_GROUPS = [
  {
    label: "SELF-HOSTED HQ",
    items: [
      { href: "/admin/dashboard", label: "HQ", icon: LayoutDashboard, exact: true },
      { href: "/admin/creator", label: "Creator", icon: Users },
      { href: "/admin/library", label: "Library", icon: FolderOpen },
      { href: "/admin/collections", label: "Collections", icon: FolderOpen },
      { href: "/admin/applications", label: "Recruitment", icon: Search },
      { href: "/admin/catalogue-import", label: "Catalogue import", icon: Upload },
      { href: "/admin/data-export", label: "Data Export", icon: Database },
      { href: "/admin/news", label: "News", icon: Newspaper },
      { href: "/admin/discovery", label: "Discovery", icon: Compass },
      { href: "/admin/campaigns", label: "Campaigns", icon: BarChart3 },
    ],
  },
  {
    label: "MIGRATION PENDING · NO SELF-HOSTED DATA SOURCE",
    items: [
      { label: "Marketing", icon: BarChart3, unavailable: true },
      { label: "Business", icon: WalletCards, unavailable: true },
      { label: "AI", icon: Bot, unavailable: true },
      { label: "Cover Designer", icon: Palette, unavailable: true },
      { label: "Creative Brain", icon: WandSparkles, unavailable: true },
      { label: "Rendering Intelligence", icon: Gauge, unavailable: true },
      { label: "Production QA", icon: ShieldCheck, unavailable: true },
      { label: "Studio Audit", icon: ShieldCheck, unavailable: true },
      { label: "Certification", icon: BadgeCheck, unavailable: true },
      { label: "Adult Provider Readiness", icon: ShieldCheck, unavailable: true },
      { label: "Automation", icon: Workflow, unavailable: true },
      { label: "Settings", icon: Settings, unavailable: true },
    ],
  },
];

function DesktopSidebar() {
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
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">HQ</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = item.unavailable ? false : isActive(item);
                if (item.unavailable) return (
                  <div key={item.label} title="This Base44 module has not yet been migrated to the self-hosted backend." className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/55 cursor-not-allowed">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span><span className="ml-auto text-[9px] font-semibold uppercase tracking-wide">Pending</span>
                  </div>
                );
                return (
                  <Link
                    key={item.href}
                    to={item.href}
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
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>View Site</span>
        </Link>
        <button
          onClick={() => base44.auth.logout("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function MobileDrawer({ onClose }) {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const activeGroupLabel = NAV_GROUPS.find(g =>
    g.items.some(item => item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href))
  )?.label;
  const [openGroup, setOpenGroup] = useState(activeGroupLabel || NAV_GROUPS[0].label);

  const isActive = (item) =>
    item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href);

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return NAV_GROUPS;
    const q = query.trim().toLowerCase();
    return NAV_GROUPS
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.label.toLowerCase().includes(q)),
      }))
      .filter(group => group.items.length > 0);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-card md:hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="w-7 h-7 bg-primary rounded flex items-center justify-center flex-shrink-0">
          <Play className="w-3.5 h-3.5 text-primary-foreground fill-current" />
        </div>
        <span className="text-sm font-bold tracking-widest uppercase text-foreground flex-1">Fleshlab HQ</span>
        <button
          onClick={onClose}
          className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin pages..."
            className="w-full h-11 pl-10 pr-3 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {filteredGroups.map(group => {
          const expanded = query.trim() ? true : openGroup === group.label;
          return (
            <div key={group.label} className="rounded-xl overflow-hidden border border-border">
              <button
                onClick={() => setOpenGroup(expanded ? null : group.label)}
                className="w-full flex items-center justify-between px-4 py-3.5 min-h-[48px] bg-muted/40 text-left"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  {group.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <div className="p-1.5 space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = item.unavailable ? false : isActive(item);
                if (item.unavailable) return (
                  <div key={item.label} className="flex items-center gap-3 px-3.5 py-3 min-h-[48px] rounded-lg text-sm text-muted-foreground/55">
                    <Icon className="w-4 h-4 flex-shrink-0" /><span>{item.label}</span><span className="ml-auto text-[9px] uppercase">Pending</span>
                  </div>
                );
                return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3.5 py-3 min-h-[48px] rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/80 hover:bg-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filteredGroups.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No pages match "{query}"</p>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-1">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3.5 py-3 min-h-[48px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>View Site</span>
        </Link>
        <button
          onClick={() => base44.auth.logout("/")}
          className="w-full flex items-center gap-3 px-3.5 py-3 min-h-[48px] rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
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
        <DesktopSidebar />
      </div>

      {/* Mobile full-screen drawer */}
      {sidebarOpen && <MobileDrawer onClose={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-10 w-10 -ml-1.5 flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <Play className="w-2.5 h-2.5 text-primary-foreground fill-current" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase text-foreground">Fleshlab HQ</span>
          </div>
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
