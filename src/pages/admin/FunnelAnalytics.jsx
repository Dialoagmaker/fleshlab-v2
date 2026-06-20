import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import { BarChart3, TrendingDown, Users, Loader2, AlertCircle } from "lucide-react";

function FunnelBar({ label, count, total, dropFromPrevious, dropPct, isLargestLeak }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
  const widthPct = total > 0 ? Math.max((count / total) * 100, 2) : 0;

  return (
    <div className={`relative ${isLargestLeak ? "ring-2 ring-amber-500/30 rounded-xl p-1" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">{label}</span>
          {isLargestLeak && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
              <TrendingDown className="w-3 h-3" />
              Biggest leak
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-mono font-bold">{count}</span>
          <span className="text-white/25 text-xs">({pct}%)</span>
        </div>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-rose-600 transition-all duration-500"
          style={{ width: `${widthPct}%` }}
        />
      </div>
      {dropFromPrevious > 0 && (
        <div className="flex items-center gap-1.5 mt-1 ml-1">
          <TrendingDown className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400/80 text-[11px] font-medium">
            −{dropFromPrevious} ({dropPct})
          </span>
        </div>
      )}
    </div>
  );
}

export default function FunnelAnalytics() {
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-funnel", days],
    queryFn: async () => {
      const now = new Date();
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all relevant data
      const [users, intents, payments, subs] = await Promise.all([
        base44.asServiceRole.entities.User.list('-created_date', 500),
        base44.asServiceRole.entities.PaymentIntent.list('-created_date', 1000),
        base44.asServiceRole.entities.Payment.list('-created_date', 1000),
        base44.asServiceRole.entities.Subscription.list('-created_date', 1000),
      ]);

      const recent = users.filter(u => u.created_date >= cutoff);

      let funnel = { registered: 0, verified: 0, onboardingViewed: 0, fanclubClicked: 0, checkoutStarted: 0, paymentPageReached: 0, paymentCompleted: 0, activeSubscribers: 0 };

      for (const u of recent) {
        funnel.registered++;
        if (!u.is_verified) continue;
        funnel.verified++;

        // Check onboarding
        if (u.onboarding_completed) funnel.onboardingViewed++;

        const ui = intents.filter(i => i.user_id === u.id);
        const up = payments.filter(p => p.user_id === u.id);
        const us = subs.filter(s => s.user_id === u.id);

        // Checkout started
        const fanclubIntents = ui.filter(i => i.payment_type === 'fanclub' || i.payment_type === 'ppv');
        if (fanclubIntents.length > 0 || up.length > 0) {
          funnel.checkoutStarted++;

          // Fanclub clicked
          if (fanclubIntents.length > 0) funnel.fanclubClicked++;

          // Payment page reached
          if (ui.some(i => i.checkout_url)) funnel.paymentPageReached++;

          // Payment completed
          const completed = ui.filter(i => i.status === 'completed').length + up.filter(p => p.status === 'completed').length;
          if (completed > 0) funnel.paymentCompleted++;
        }

        // Active subscription
        const now2 = new Date();
        const activeSubs = us.filter(s => s.status === 'active' && s.current_period_end && new Date(s.current_period_end) > now2);
        if (activeSubs.length > 0) funnel.activeSubscribers++;
      }

      const stages = [
        { key: "registered", label: "Registered", count: funnel.registered },
        { key: "verified", label: "Verified", count: funnel.verified },
        { key: "onboardingViewed", label: "Onboarding Viewed", count: funnel.onboardingViewed },
        { key: "fanclubClicked", label: "Fanclub Clicked", count: funnel.fanclubClicked },
        { key: "checkoutStarted", label: "Checkout Started", count: funnel.checkoutStarted },
        { key: "paymentPageReached", label: "Payment Page Reached", count: funnel.paymentPageReached },
        { key: "paymentCompleted", label: "Payment Completed", count: funnel.paymentCompleted },
        { key: "activeSubscribers", label: "Active Subscribers", count: funnel.activeSubscribers },
      ];

      // Find largest leak
      let maxLoss = 0;
      let maxLossStage = null;
      for (let i = 1; i < stages.length; i++) {
        const loss = stages[i - 1].count - stages[i].count;
        if (loss > maxLoss) {
          maxLoss = loss;
          maxLossStage = i;
        }
      }

      return {
        stages,
        maxLossStage,
        totalRegistered: funnel.registered,
        overallConversion: funnel.registered > 0 ? ((funnel.activeSubscribers / funnel.registered) * 100).toFixed(1) : "0.0",
        dateRange: `${new Date(cutoff).toLocaleDateString()} → ${new Date().toLocaleDateString()}`,
      };
    },
    refetchInterval: 60000,
  });

  return (
    <>
      <SEOMeta title="Funnel Analytics — FLESHLAB Admin" noIndex={true} />
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Conversion Funnel
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data ? data.dateRange : "Loading..."}
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  days === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Overall conversion rate */}
        {data && (
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Overall Conversion</p>
              <p className="text-foreground font-black text-xl">
                {data.overallConversion}%{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  ({data.stages.find(s => s.key === "activeSubscribers").count} / {data.stages.find(s => s.key === "registered").count})
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-6 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error.message || "Failed to load funnel data"}</span>
          </div>
        )}

        {/* Funnel */}
        {data && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              {data.totalRegistered} total users in range
            </h3>
            <div className="space-y-4">
              {data.stages.map((stage, i) => (
                <FunnelBar
                  key={stage.key}
                  label={stage.label}
                  count={stage.count}
                  total={data.totalRegistered}
                  dropFromPrevious={i > 0 ? data.stages[i - 1].count - stage.count : null}
                  dropPct={
                    i > 0
                      ? (((data.stages[i - 1].count - stage.count) / Math.max(data.stages[i - 1].count, 1)) * 100).toFixed(1) + "%"
                      : null
                  }
                  isLargestLeak={data.maxLossStage === i}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}