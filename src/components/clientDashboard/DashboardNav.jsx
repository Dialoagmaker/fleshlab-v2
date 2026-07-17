import { Bookmark, Compass, Home, Layers3, Newspaper, Radio, User, Users, LogOut } from "lucide-react";

export const TABS = [
  { id: "overview", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass, href: "/videos" },
  { id: "creators", label: "Creators", icon: Users, href: "/performers" },
  { id: "collections", label: "Collections", icon: Layers3, href: "/brands" },
  { id: "live", label: "Live", icon: Radio, href: "/live" },
  { id: "videos", label: "Watchlist", icon: Bookmark },
  { id: "news", label: "News", icon: Newspaper, href: "/news" },
  { id: "profile", label: "Account", icon: User },
];

function handleNav(tab, setActiveTab) {
  if (tab.href) window.location.href = tab.href;
  else setActiveTab(tab.id);
}

export default function DashboardNav({ activeTab, setActiveTab, onLogout }) {
  return (
    <>
      <div className="lg:hidden mb-4 -mx-4 px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button key={tab.id} onClick={() => handleNav(tab, setActiveTab)} className={`flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${isActive ? "border-[#f0183d] bg-[#f0183d] text-white shadow-lg shadow-[#f0183d]/20" : "border-white/10 bg-[#101216] text-white/62 hover:border-white/20 hover:text-white"}`}>
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-white/42"}`} />
                {tab.label}
              </button>
            );
          })}
          <button onClick={() => onLogout?.()} className="flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[#101216] px-4 py-2.5 text-sm font-semibold text-red-400/80">
            <LogOut className="h-4 w-4 shrink-0" /> Log Out
          </button>
        </div>
      </div>
    </>
  );
}