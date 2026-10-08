import { Sparkles } from "lucide-react";

export default function InsightSummaryCard({ summary }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" /> Customer Insights
      </h3>
      <p className="text-sm text-foreground/90 leading-relaxed">{summary}</p>
    </div>
  );
}