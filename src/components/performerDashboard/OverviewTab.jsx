import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      
      {/* Revenue Share Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Model</p>
              <p className="text-sm font-semibold mt-1">{performer.revenue_model || 'Managed Performer'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Your Share</p>
              <p className="text-lg font-bold text-green-500 mt-1">{performer.revenue_share_pct || 40}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Studio Share</p>
              <p className="text-lg font-bold text-blue-500 mt-1">{performer.studio_share_pct || 60}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
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