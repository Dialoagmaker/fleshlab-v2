import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ComplianceSummaryCard from "../compliance/ComplianceSummaryCard";
import KycSection from "../compliance/KycSection";
import ContractsSection from "../compliance/ContractsSection";
import ComplianceRecordsSection from "../compliance/ComplianceRecordsSection";
import AccountControlsSection from "../compliance/AccountControlsSection";
import GeoBlockingPlaceholder from "../compliance/GeoBlockingPlaceholder";
import ComplianceActionsCard from "../compliance/ComplianceActionsCard";
import IdentityVerificationSection from "../compliance/IdentityVerificationSection";

// Simple ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ComplianceTab Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
          <p className="text-destructive font-medium">Error loading compliance data</p>
          <p className="text-sm text-muted-foreground mt-2">{this.state.error?.message}</p>
          <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false })} className="mt-3">
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // Safe array defaults - prevent .map() on undefined
  const safeContracts = Array.isArray(contracts) ? contracts : [];
  const safeRecords = Array.isArray(records) ? records : [];

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
      <ComplianceSummaryCard performer={performer} contracts={safeContracts} records={safeRecords} />
      <ErrorBoundary>
        <KycSection performer={performer} />
      </ErrorBoundary>
      <ErrorBoundary>
        <ContractsSection performer={performer} contracts={safeContracts} onRefresh={handleRefresh} />
      </ErrorBoundary>
      <ErrorBoundary>
        <ComplianceRecordsSection performer={performer} onRefresh={handleRefresh} />
      </ErrorBoundary>
      <ErrorBoundary>
        <AccountControlsSection performer={performer} />
      </ErrorBoundary>
      <ErrorBoundary>
        <GeoBlockingPlaceholder />
      </ErrorBoundary>
      <ErrorBoundary>
        <IdentityVerificationSection performer={performer} />
      </ErrorBoundary>
      <ErrorBoundary>
        <ComplianceActionsCard performer={performer} onRefresh={handleRefresh} />
      </ErrorBoundary>
    </div>
  );
}