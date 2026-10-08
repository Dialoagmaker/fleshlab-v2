const TIER_COLORS = {
  "High Conversion": "text-green-400 border-green-500/30 bg-green-500/10",
  "Medium Conversion": "text-amber-400 border-amber-500/30 bg-amber-500/10",
  "Low Conversion": "text-orange-400 border-orange-500/30 bg-orange-500/10",
  "Dormant": "text-muted-foreground border-border bg-muted/30",
};

export default function HealthScoreCard({ health, probability }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Customer Health Score</p>
        <p className="text-3xl font-bold text-foreground">{health.score} <span className="text-base font-normal text-muted-foreground">/ 100</span></p>
        <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full border ${TIER_COLORS[health.tier]}`}>{health.tier}</span>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground mb-1">Purchase Probability</p>
        <p className="text-3xl font-bold text-foreground">{probability.pct}%</p>
        <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">{probability.tier}</span>
      </div>
    </div>
  );
}