import { useParams, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { User, CreditCard, Shield, Users, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Tab configuration
const TABS = [
  { id: "overview", label: "Overview", icon: User, path: "" },
  { id: "earnings", label: "Earnings", icon: CreditCard, path: "earnings" },
  { id: "compliance", label: "Compliance", icon: Shield, path: "compliance" },
  { id: "fanclub", label: "Fanclub", icon: Users, path: "fanclub" },
  { id: "production", label: "Production", icon: Calendar, path: "production" },
  { id: "settings", label: "Settings", icon: Settings, path: "settings" },
];

export default function PerformerLayout({ children }) {
  const { id } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname.replace(`/admin/performers/${id}`, "");
    return path.replace("/", "") || "overview";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/performers" className="text-muted-foreground hover:text-foreground transition-colors">
          <span className="text-sm">← Back to Performers</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6" role="tablist">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={`/admin/performers/${id}${tab.path ? `/${tab.path}` : ""}`}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        {children}
      </div>
    </div>
  );
}