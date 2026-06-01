import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ComplianceSummaryCard from "../compliance/ComplianceSummaryCard";
import KycSection from "../compliance/KycSection";
import ContractsSection from "../compliance/ContractsSection";
import ComplianceRecordsSection from "../compliance/ComplianceRecordsSection";
import AccountControlsSection from "../compliance/AccountControlsSection";
import GeoBlockingPlaceholder from "../compliance/GeoBlockingPlaceholder";
import ComplianceActionsCard from "../compliance/ComplianceActionsCard";

export default function ComplianceTab({ performer }) {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  // Hooks must be called unconditionally - use optional chaining for performer.id
  const { data: contracts, isLoading: contractsLoading, error: contractsError } = useQuery({
    queryKey: ["contracts", performer?.id, refreshKey],
    queryFn: () => base44.entities.Contract.filter({ performer_id: performer.id }, "-created_date"),
    enabled: !!performer?.id,
  });

  const { data: records, isLoading: recordsLoading, error: recordsError } = useQuery({
    queryKey: ["complianceRecords", performer?.id, refreshKey],
    queryFn: () => base44.entities.ComplianceRecord.filter({ performer_id: performer.id }, "-created_date"),
    enabled: !!performer?.id,
  });

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Refreshed");
  };

  // Defensive check - performer must exist
  if (!performer || !performer.id) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
        <p className="text-destructive font-medium">Performer data not available</p>
        <p className="text-sm text-muted-foreground mt-2">Please refresh the page or try again</p>
      </div>
    );
  }

  // Show loading state
  if (contractsLoading || recordsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">Loading compliance data...</div>
      </div>
    );
  }

  // Show error state
  if (contractsError || recordsError) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
          <p className="text-destructive font-medium">Error loading compliance data</p>
          <p className="text-sm text-muted-foreground mt-2">
            {contractsError?.message || recordsError?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ComplianceSummaryCard performer={performer} contracts={contracts || []} records={records || []} />
      <KycSection performer={performer} />
      <ContractsSection performer={performer} contracts={contracts || []} onRefresh={handleRefresh} />
      <ComplianceRecordsSection performer={performer} records={records || []} onRefresh={handleRefresh} />
      <AccountControlsSection performer={performer} />
      <GeoBlockingPlaceholder />
      <ComplianceActionsCard performer={performer} onRefresh={handleRefresh} />
    </div>
  );
}