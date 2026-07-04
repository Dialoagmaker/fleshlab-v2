import { LogOut } from "lucide-react";
import { TABS } from "@/components/clientDashboard/DashboardNav";

export default function ClientDashboardSidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-[#0a0a0a] border-r border-white/10">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10 shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-rose-500 fill-current shrink-0"><path d="M12 2C9 2 7 4 7 7c0 2 1 3 1 5-2 0-3 1-3 3 0 3 3 5 7 5s7-2 7-5c0-2-1-3-3-3 0-2 1-3 1-5 0-3-2-5-5-5z"/></svg>
        <div className="leading-none">
          <div className="text-white font-black text-sm tracking-wide">FLESHLAB</div>
          <div className="text-white/40 text-[9px] tracking-widest uppercase">Account</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                isActive
                  ? "bg-rose-600 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-white/40"}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={() => onLogout?.()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
}