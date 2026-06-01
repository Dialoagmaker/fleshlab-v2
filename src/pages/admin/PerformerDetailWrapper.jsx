import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import OverviewTab from "@/components/performer/tabs/OverviewTab";
import EarningsTab from "@/components/performer/tabs/EarningsTab";
import ComplianceTab from "@/components/performer/tabs/ComplianceTab";
import FanclubTab from "@/components/performer/tabs/FanclubTab";
import ProductionTab from "@/components/performer/tabs/ProductionTab";
import SettingsTab from "@/components/performer/tabs/SettingsTab";

export default function PerformerDetailWrapper() {
  const { id } = useParams();

  const { data: performer, isLoading } = useQuery({
    queryKey: ["performer", id],
    queryFn: () => base44.entities.Performer.get(id),
  });

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Loading performer…</div>;
  }

  if (!performer) {
    return <div className="text-center py-16 text-destructive">Performer not found</div>;
  }

  // Tab routing based on URL path
  const path = window.location.pathname;
  if (path.includes("/earnings")) return <EarningsTab performer={performer} />;
  if (path.includes("/compliance")) return <ComplianceTab performer={performer} />;
  if (path.includes("/fanclub")) return <FanclubTab performer={performer} />;
  if (path.includes("/production")) return <ProductionTab performer={performer} />;
  if (path.includes("/settings")) return <SettingsTab performer={performer} />;
  
  return <OverviewTab performer={performer} />;
}