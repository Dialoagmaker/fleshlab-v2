import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ActionRequiredCard from "./ActionRequiredCard";
import MonthlyCloseoutCard from "./MonthlyCloseoutCard";
import ProductionGoalCard from "./ProductionGoalCard";
import PayoutReadinessCard from "./PayoutReadinessCard";
import StudioAdvanceCard from "./StudioAdvanceCard";
import LatestVideosCard from "./LatestVideosCard";
import ComplianceSummaryCard from "./ComplianceSummaryCard";

export default function OverviewTab({ data }) {
  const performer = data?.performer;

  if (!performer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No performer data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Required */}
      <ActionRequiredCard performer={performer} />

      {/* Top row - Monthly Closeout, Production Goal, Payout Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MonthlyCloseoutCard performerId={performer.id} />
        <ProductionGoalCard performerId={performer.id} />
        <PayoutReadinessCard performer={performer} />
      </div>

      {/* Second row - Studio Advance, Latest Videos, Compliance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StudioAdvanceCard performer={performer} />
        <LatestVideosCard performerId={performer.id} />
        <ComplianceSummaryCard performer={performer} />
      </div>
    </div>
  );
}