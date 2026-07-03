import { Lightbulb } from "lucide-react";

export default function RecommendationsCard({ recommendations }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">Admin Recommendations</h3>
      <ul className="space-y-2">
        {recommendations.map(r => (
          <li key={r} className="flex items-center gap-2 text-sm text-foreground">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            {r}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground mt-3">Suggestions only — no automatic actions are taken.</p>
    </div>
  );
}