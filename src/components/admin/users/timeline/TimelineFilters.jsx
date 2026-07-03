import { FILTERS } from "@/lib/timelineEventConfig";

export default function TimelineFilters({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            active === f
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}