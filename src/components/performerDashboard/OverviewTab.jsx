import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActionRequiredCard from "./ActionRequiredCard";
import MonthlyCloseoutCard from "./MonthlyCloseoutCard";
import ProductionGoalCard from "./ProductionGoalCard";
import PayoutReadinessCard from "./PayoutReadinessCard";
import StudioAdvanceCard from "./StudioAdvanceCard";
import LatestVideosCard from "./LatestVideosCard";
import ComplianceSummaryCard from "./ComplianceSummaryCard";
import CareerStatisticsCard from "./CareerStatisticsCard";
import EarningsBreakdownTable from "./EarningsBreakdownTable";
import PayoutSummaryCard from "./PayoutSummaryCard";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function OverviewTab({ performer, career_stats, performerToken, isAdmin }) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Single data source for all earnings display on this tab
  const { data: earningsData } = useQuery({
    queryKey: ["performer-earnings-breakdown", performer.id, currentMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_earnings",
        performer_id: performer.id,
        performer_token: performerToken,
        period_month: currentMonth
      });
      return res.data;
    },
    enabled: !!performer.id && !!performerToken
  });

  // Admin diagnostic: fetch the PHP card data too (contains diagnostic rows)
  const { data: phpData } = useQuery({
    queryKey: ["performer-earnings-php-diag", performer.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_current_month_earnings_php",
        performer_id: performer.id,
        performer_token: performerToken
      });
      return res.data;
    },
    enabled: !!performer.id && !!performerToken && !!isAdmin
  });

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
      {/* Payout summary with available balance, paid, next payout */}
      <PayoutSummaryCard
        performerId={performer.id}
        performerToken={performerToken}
      />

      <ActionRequiredCard performer={performer} />
      <CareerStatisticsCard stats={career_stats} />

      {/* Revenue Model */}
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
        <MonthlyCloseoutCard performerId={performer.id} performerToken={performerToken} />
        <ProductionGoalCard performerId={performer.id} />
        <PayoutReadinessCard performer={performer} />
      </div>

      {/* Earnings Breakdown — same data source, same totals as the card above */}
      {earningsData?.earnings && earningsData.earnings.length > 0 && (
        <EarningsBreakdownTable
          earnings={earningsData.earnings}
          summary={earningsData.summary}
        />
      )}

      {/* Admin-only diagnostic panel */}
      {isAdmin && phpData?.diagnostic && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-500">Admin Diagnostic — Earnings Calculation</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-muted-foreground">Included Gross</p>
                <p className="font-semibold">${(phpData.gross_revenue_usd || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Performer Share</p>
                <p className="font-semibold text-green-500">${(phpData.performer_earnings_usd || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Studio Share</p>
                <p className="font-semibold text-blue-400">${(phpData.studio_earnings_usd || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Source Rows</p>
                <p className="font-semibold">{phpData.diagnostic.included_count} ({phpData.diagnostic.legacy_count} legacy / {phpData.diagnostic.line_item_count} line items / {phpData.diagnostic.stat_rows_count} stats)</p>
              </div>
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded p-2 space-y-1">
              {phpData.diagnostic.included_rows.map((row, i) => (
                <div key={i} className="flex justify-between gap-2 text-muted-foreground">
                  <span className="truncate">{row.source}</span>
                  <span className="shrink-0">Gross ${row.gross.toFixed(2)} → You ${row.performer.toFixed(2)} [{row.status}]</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StudioAdvanceCard performer={performer} />
        <LatestVideosCard performerId={performer.id} />
        <ComplianceSummaryCard performer={performer} />
      </div>
    </div>
  );
}