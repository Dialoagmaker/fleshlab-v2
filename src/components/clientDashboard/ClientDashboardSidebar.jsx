import { LogOut, Sparkles } from "lucide-react";
import { TABS } from "@/components/clientDashboard/DashboardNav";

function handleNav(tab, setActiveTab) {
  if (tab.href) window.location.href = tab.href;
  else setActiveTab(tab.id);
}

export default function ClientDashboardSidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="hidden lg:flex h-screen w-72 shrink-0 sticky top-0 flex-col border-r border-white/10 bg-[#05070a]/95 backdrop-blur-xl">
      <div className="relative overflow-hidden border-b border-white/10 px-6 py-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,24,61,0.18),transparent_35%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0183d] shadow-lg shadow-[#f0183d]/25"><Sparkles className="h-5 w-5 text-white" /></div>
          <div className="leading-none">
            <div className="text-lg font-black tracking-[-0.055em] text-white">FLESH<span className="text-[#f0183d]">LAB</span></div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.36em] text-white/42">Home</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button key={tab.id} onClick={() => handleNav(tab, setActiveTab)} className={`group relative flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 ${isActive ? "bg-white text-black shadow-xl shadow-black/30" : "text-white/54 hover:bg-white/[0.06] hover:text-white"}`}>
              <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#f0183d]" : "text-white/36"}`} />
              <span>{tab.label}</span>
              {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-[#f0183d]" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button onClick={() => onLogout?.()} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-bold text-red-400/78 transition-all hover:bg-red-500/10 hover:text-red-300">
          <LogOut className="h-5 w-5 shrink-0" /> Log Out
        </button>
      </div>
    </aside>
  );
}