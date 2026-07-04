import { Film, Video, Star, CreditCard, Wallet, MessageCircle, User, Shield, Lock, LayoutDashboard, LogOut } from "lucide-react";

export const TABS = [
  { id: "overview",       label: "Overview",          icon: LayoutDashboard },
  { id: "fan-productions",label: "Fan Productions",   icon: Film },
  { id: "videos",         label: "My Videos",         icon: Video },
  { id: "fanclub",        label: "Fanclub",           icon: Star },
  { id: "payments",       label: "Payments",          icon: CreditCard },
  { id: "wallet",         label: "FleshPay Wallet",  icon: Wallet },
  { id: "messages",       label: "Messages",          icon: MessageCircle },
  { id: "profile",        label: "Profile",           icon: User },
  { id: "verification",   label: "Verification",      icon: Shield },
  { id: "security",       label: "Security",          icon: Lock },
];

export default function DashboardNav({ activeTab, setActiveTab, onLogout }) {
  return (
    <>
      {/* Mobile horizontal scroll chips */}
      <div className="lg:hidden mb-4 -mx-4 px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 shrink-0 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-[#0f0f0f] text-white/60 border-white/10"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-white/40"}`} />
                {tab.label}
              </button>
            );
          })}
          <button
            onClick={() => onLogout?.()}
            className="flex items-center gap-2 shrink-0 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-semibold whitespace-nowrap bg-[#0f0f0f] text-red-400/80 border border-white/10"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out
          </button>
        </div>
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