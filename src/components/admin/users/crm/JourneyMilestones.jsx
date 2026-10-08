import { CheckCircle2, Circle } from "lucide-react";

export default function JourneyMilestones({ milestones }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Customer Journey Milestones</h3>
      <div className="space-y-0">
        {milestones.map((m, i) => (
          <div key={m.label} className="flex items-center gap-3 relative pb-3">
            {i < milestones.length - 1 && <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />}
            {m.done
              ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              : <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />}
            <span className={`text-sm ${m.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}