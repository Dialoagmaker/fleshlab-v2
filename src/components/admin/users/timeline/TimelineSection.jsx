import TimelineEventGroup from "./TimelineEventGroup";

export default function TimelineSection({ title, items }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{title}</h4>
      <div>
        {items.map((item, i) => (
          <TimelineEventGroup key={i} item={item} isLast={i === items.length - 1} />
        ))}
      </div>
    </div>
  );
}