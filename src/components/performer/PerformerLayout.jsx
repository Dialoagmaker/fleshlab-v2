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
import PerformerDetailWrapper from "@/pages/admin/PerformerDetailWrapper";

// Tab configuration - Phase 1 approved structure
const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "production", label: "Production", icon: Calendar },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "videos", label: "Videos", icon: Video },
  { id: "earnings", label: "Earnings", icon: CreditCard },
  { id: "fanclub", label: "Fanclub", icon: Users },
];

export default function PerformerLayout() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-3">
        <a href="/admin/performers" className="text-muted-foreground hover:text-foreground transition-colors">
          <span className="text-sm">← Back to Performers</span>
        </a>
      </div>

      {/* Tabs — internal UI state only, NO route changes */}
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
      <div role="tabpanel" className="pt-4">
        <PerformerDetailWrapper />
      </div>
    </div>
  );
}