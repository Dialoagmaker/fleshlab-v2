import { parseMetadata } from "@/lib/liveActivityHelpers";

export default function RecentErrorsPanel({ errorEvents, userMap }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Recent Errors</h2>
      {errorEvents.length === 0 ? (
        <p className="text-xs text-muted-foreground">No errors recorded today.</p>
      ) : (
        <div className="space-y-2">
          {errorEvents.slice(0, 20).map(ev => {
            const meta = parseMetadata(ev.data.metadata_json);
            const user = userMap[ev.data.user_id];
            return (
              <div key={ev.id} className="flex items-center justify-between text-xs border-b border-border last:border-0 pb-2 last:pb-0">
                <div>
                  <p className="text-red-400 font-medium">{ev.data.event_name}</p>
                  <p className="text-muted-foreground">{user?.email || meta.email || "Anonymous"}</p>
                </div>
                <span className="text-muted-foreground">{new Date(ev.created_date).toLocaleTimeString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}