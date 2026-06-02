import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ActionRequiredCard from "./ActionRequiredCard";
import MonthlyCloseoutCard from "./MonthlyCloseoutCard";
import ProductionGoalCard from "./ProductionGoalCard";
import PayoutReadinessCard from "./PayoutReadinessCard";
import StudioAdvanceCard from "./StudioAdvanceCard";
import LatestVideosCard from "./LatestVideosCard";
import ComplianceSummaryCard from "./ComplianceSummaryCard";
import CareerStatisticsCard from "./CareerStatisticsCard";

export default function OverviewTab({ performer, career_stats }) {
  if (!performer) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Your performer profile is not fully connected yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Please contact studio management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ActionRequiredCard performer={performer} />
      <CareerStatisticsCard stats={career_stats} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MonthlyCloseoutCard performerId={performer.id} />
        <ProductionGoalCard performerId={performer.id} />
        <PayoutReadinessCard performer={performer} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StudioAdvanceCard performer={performer} />
        <LatestVideosCard performerId={performer.id} />
        <ComplianceSummaryCard performer={performer} />
      </div>
    </div>
  );
}