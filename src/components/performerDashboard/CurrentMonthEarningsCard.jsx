import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Info } from "lucide-react";

export default function CurrentMonthEarningsCard({ performerId, performerToken }) {
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
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const formatPHP = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getMonthDisplay = () => {
    if (!data) return '';
    return `${data.month} ${data.year}`;
  };

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
          <p className="text-sm text-muted-foreground text-center">
            Unable to load earnings data
          </p>
        </CardContent>
      </Card>
    );
  }

  const earnings = data?.performer_earnings_php || 0;
  const isZero = earnings === 0;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Your actual earnings in {getMonthDisplay()}:
            </p>
            <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {formatPHP(earnings)}
            </p>
          </div>
          <div className="bg-primary/10 rounded-full p-2">
            <Info className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3" />
          <span>
            Based on recorded revenue for this month. Final payout may change after monthly closeout.
          </span>
        </div>
        
        {data && (
          <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Gross Revenue (USD)</p>
              <p className="font-semibold text-foreground">
                ${(data.gross_revenue_base || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Share</p>
              <p className="font-semibold text-green-500">
                {data.performer_share_percentage || 40}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Exchange Rate</p>
              <p className="font-semibold text-foreground">
                1 USD = {data.exchange_rate_to_php?.toFixed(2) || '57.50'} PHP
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Earnings (USD)</p>
              <p className="font-semibold text-foreground">
                ${(data.performer_earnings_base || 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {isZero && (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground">
              No revenue recorded yet for {getMonthDisplay()}. Earnings will appear here once your videos generate revenue or manual entries are added.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}