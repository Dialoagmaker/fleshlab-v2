import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProfileTab from "@/components/performer/tabs/ProfileTab";
import ProductionTab from "@/components/performer/tabs/ProductionTab";
import ComplianceTab from "@/components/performer/tabs/ComplianceTab";
import VideosTab from "@/components/performer/tabs/VideosTab";
import EarningsTab from "@/components/performer/tabs/EarningsTab";
import FanclubTab from "@/components/performer/tabs/FanclubTab";
import PerformerHeader from "@/components/performer/PerformerHeader";

export default function PerformerDetailWrapper({ activeTab = "profile" }) {
  const { id } = useParams();

  const { data: performer, isLoading, refetch } = useQuery({
    queryKey: ["performer", id],
    queryFn: () => base44.entities.Performer.get(id),
  });

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Loading performer…</div>;
  }

  if (!performer) {
    return <div className="text-center py-16 text-destructive">Performer not found</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab performer={performer} onRefresh={refetch} />;
      case "production":
        return <ProductionTab performer={performer} />;
      case "compliance":
        return <ComplianceTab performer={performer} />;
      case "videos":
        return <VideosTab performer={performer} />;
      case "earnings":
        return <EarningsTab performer={performer} />;
      case "fanclub":
        return <FanclubTab performer={performer} />;
      default:
        return <ProfileTab performer={performer} onRefresh={refetch} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Status Bar - always visible */}
      <PerformerHeader performer={performer} onRefresh={() => refetch()} />

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}