import { getEventConfig } from "@/lib/timelineEventConfig";

export default function TimelineEventGroup({ item, isLast }) {
  const config = getEventConfig(item.event_name);
  const Icon = config.icon;

  const timeLabel = item.type === "group"
    ? `${new Date(item.first_time).toLocaleTimeString()} – ${new Date(item.last_time).toLocaleTimeString()}`
    : new Date(item.event.created_date).toLocaleString();

  return (
    <div className="flex gap-3 pb-4 relative">
      {!isLast && <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />}
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {config.label}
          {item.type === "group" && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {item.rapid ? `(${item.count}x)` : `${item.count} events`}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{timeLabel}</p>
        {item.type === "group" && item.breakdown.length > 0 && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Most visited:</span>
            <ul className="mt-0.5 space-y-0.5">
              {item.breakdown.slice(0, 5).map(b => (
                <li key={b.label}>• {b.label} ({b.count})</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}