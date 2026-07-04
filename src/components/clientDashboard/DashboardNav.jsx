import { Film, Video, Star, CreditCard, Wallet, MessageCircle, User, Shield, Lock, LayoutDashboard, LogOut } from "lucide-react";

export const TABS = [
  { id: "overview",       label: "Overview",          icon: LayoutDashboard },
  { id: "fan-productions",label: "Fan Productions",   icon: Film },
  { id: "videos",         label: "My Videos",         icon: Video },
  { id: "fanclub",        label: "Fanclub",           icon: Star },
  { id: "payments",       label: "Payments",          icon: CreditCard },
  { id: "wallet",         label: "FlashPay Wallet",  icon: Wallet },
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

      {/* Desktop underlined tab row */}
      <nav className="hidden lg:flex items-center gap-6 border-b border-white/12 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 pb-3 pt-1 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                isActive
                  ? "text-rose-500 border-rose-500"
                  : "text-white/40 border-transparent hover:text-white/70"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <button
          onClick={() => onLogout?.()}
          className="shrink-0 pb-3 pt-1 text-xs font-bold uppercase tracking-wider text-white/40 border-b-2 border-transparent hover:text-red-400 ml-auto"
        >
          Logout
        </button>
      </nav>
    </>
  );
}