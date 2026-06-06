import { Film, Video, Star, CreditCard, Wallet, MessageCircle, User, Shield, Lock, LayoutDashboard, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

export const TABS = [
  { id: "overview",       label: "Overview",          icon: LayoutDashboard },
  { id: "fan-productions",label: "Fan Productions",   icon: Film },
  { id: "videos",         label: "My Videos",         icon: Video },
  { id: "fanclub",        label: "Fanclub",           icon: Star },
  { id: "payments",       label: "Payments",          icon: CreditCard },
  { id: "messages",       label: "Messages",          icon: MessageCircle },
  { id: "profile",        label: "Profile",           icon: User },
  { id: "verification",   label: "Verification",      icon: Shield },
  { id: "security",       label: "Security",          icon: Lock },
];

export default function DashboardNav({ activeTab, setActiveTab, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = TABS.find((t) => t.id === activeTab) || TABS[0];
  const ActiveIcon = active.icon;

  return (
    <>
      {/* Mobile dropdown */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border border-white/8 rounded-xl text-white"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <ActiveIcon className="w-4 h-4 text-rose-400" />
            {active.label}
          </span>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileOpen && (
          <div className="mt-1 bg-[#0f0f0f] border border-white/8 rounded-xl overflow-hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-0 ${
                    isActive ? "bg-rose-600/15 text-white font-bold" : "text-white/50 hover:text-white hover:bg-white/4"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-rose-400" : "text-white/30"}`} />
                  {tab.label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />}
                </button>
              );
            })}
            {/* Logout button - mobile */}
            <button
              onClick={() => { setMobileOpen(false); onLogout?.(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
            >
              <LogOut className="w-4 h-4 shrink-0 text-white/30" />
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex flex-col gap-0.5 w-48 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                isActive
                  ? "bg-rose-600/15 text-white font-bold border border-rose-600/20"
                  : "text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-rose-400" : "text-white/30"}`} />
              {tab.label}
            </button>
          );
        })}
        {/* Logout button - desktop */}
        <button
          onClick={() => onLogout?.()}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-colors text-left mt-2 border-t border-white/5 pt-3"
        >
          <LogOut className="w-4 h-4 shrink-0 text-white/30" />
          Log Out
        </button>
      </nav>
    </>
  );
}