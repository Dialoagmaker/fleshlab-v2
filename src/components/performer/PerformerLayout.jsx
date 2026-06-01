import { useParams } from "react-router-dom";
import { useState } from "react";
import { User, Calendar, Shield, Video, CreditCard, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileTab from "@/components/performer/tabs/ProfileTab";
import ProductionTab from "@/components/performer/tabs/ProductionTab";
import ComplianceTab from "@/components/performer/tabs/ComplianceTab";
import VideosTab from "@/components/performer/tabs/VideosTab";
import EarningsTab from "@/components/performer/tabs/EarningsTab";
import FanclubTab from "@/components/performer/tabs/FanclubTab";

// Tab configuration - Phase 1 approved structure
const TABS = [
  { id: "profile", label: "Profile", icon: User, component: ProfileTab },
  { id: "production", label: "Production", icon: Calendar, component: ProductionTab },
  { id: "compliance", label: "Compliance", icon: Shield, component: ComplianceTab },
  { id: "videos", label: "Videos", icon: Video, component: VideosTab },
  { id: "earnings", label: "Earnings", icon: CreditCard, component: EarningsTab },
  { id: "fanclub", label: "Fanclub", icon: Users, component: FanclubTab },
];

export default function PerformerLayout({ children }) {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("profile");

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component || ProfileTab;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/admin/performers" className="text-muted-foreground hover:text-foreground transition-colors">
          <span className="text-sm">← Back to Performers</span>
        </a>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6" role="tablist">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        <ActiveComponent />
      </div>
    </div>
  );
}