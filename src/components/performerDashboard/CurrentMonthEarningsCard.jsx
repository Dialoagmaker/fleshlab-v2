import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function CurrentMonthEarningsCard({ performerId, performerToken }) {
  const [showDetail, setShowDetail] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["performer-current-month-earnings-php", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_current_month_earnings_php",
        performer_id: performerId,
        performer_token: performerToken
      });
      return res.data;
    },
    enabled: !!performerId && !!performerToken,
    refetchInterval: 300000
  });

  const formatPHP = (amount) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount || 0);

  const formatUSD = (amount) =>
    `$${(amount || 0).toFixed(2)}`;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">Unable to load earnings data</p>
        </CardContent>
      </Card>
    );
  }

  const performerEarnings = data?.performer_earnings_usd || data?.performer_earnings_base || 0;
  const grossRevenue = data?.gross_revenue_usd || data?.gross_revenue_base || 0;
  const studioEarnings = data?.studio_earnings_usd || (grossRevenue - performerEarnings);
  const phpAmount = data?.performer_earnings_php || 0;
  const isZero = phpAmount === 0;
  const groups = data?.source_groups || {};

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Estimated earnings — {data?.month} {data?.year}
            </p>
            <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {formatPHP(phpAmount)}
            </p>
          </div>
          <div className="bg-primary/10 rounded-full p-2">
            <Info className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3 shrink-0" />
          <span>Estimated — final amount confirmed after monthly closeout approval.</span>
        </div>

        {/* Main 4-stat grid */}
        {data && (
          <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Attributed Gross Revenue</p>
              <p className="font-semibold text-foreground">{formatUSD(grossRevenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Share ({data.performer_share_percentage || 40}%)</p>
              <p className="font-semibold text-green-500">{formatUSD(performerEarnings)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Studio Share</p>
              <p className="font-semibold text-blue-400">{formatUSD(studioEarnings)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rate: 1 USD = {(data.exchange_rate_to_php || 57.5).toFixed(2)} PHP</p>
              <p className="font-semibold text-foreground">{formatUSD(performerEarnings)} → {formatPHP(phpAmount)}</p>
            </div>
          </div>
        )}

        {/* Source grouping (always shown if data exists) */}
        {data && (groups.livecam || groups.video_platform || groups.other) && (
          <div className="pt-2 border-t border-border/50">
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              onClick={() => setShowDetail(v => !v)}
            >
              {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Source breakdown
            </button>
            {showDetail && (
              <div className="space-y-1 text-xs">
                {groups.video_platform?.gross > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Video Platform Revenue</span>
                    <span>Gross {formatUSD(groups.video_platform.gross)} → You {formatUSD(groups.video_platform.performer)}</span>
                  </div>
                )}
                {groups.livecam?.gross > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livecam Revenue</span>
                    <span>Gross {formatUSD(groups.livecam.gross)} → You {formatUSD(groups.livecam.performer)}</span>
                  </div>
                )}
                {groups.other?.gross > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Revenue</span>
                    <span>Gross {formatUSD(groups.other.gross)} → You {formatUSD(groups.other.performer)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isZero && (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground">
              No revenue recorded yet for {data?.month} {data?.year}. Earnings appear once revenue or manual entries are added.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}