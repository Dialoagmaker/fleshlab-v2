import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProfileTab from "@/components/performer/tabs/ProfileTab";
import ProductionTab from "@/components/performer/tabs/ProductionTab";
import ComplianceTab from "@/components/performer/tabs/ComplianceTab";
import VideosTab from "@/components/performer/tabs/VideosTab";
import EarningsTab from "@/components/performer/tabs/EarningsTab";
import FanclubTab from "@/components/performer/tabs/FanclubTab";

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

  // Pass performer data to all tabs - parent layout controls which tab is visible
  return (
    <>
      <ProfileTab performer={performer} />
      <ProductionTab performer={performer} />
      <ComplianceTab performer={performer} />
      <VideosTab performer={performer} />
      <EarningsTab performer={performer} />
      <FanclubTab performer={performer} />
    </>
  );
}