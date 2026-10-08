import { EVENT_LABELS, parseMetadata } from "@/lib/liveActivityHelpers";
import { Button } from "@/components/ui/button";

export default function ActivityFeedTable({ events, userMap, onLoadMore, canLoadMore }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5">Time</th>
              <th className="text-left px-4 py-2.5">User</th>
              <th className="text-left px-4 py-2.5">Event</th>
              <th className="text-left px-4 py-2.5">Page</th>
              <th className="text-left px-4 py-2.5">Device</th>
              <th className="text-left px-4 py-2.5">Browser</th>
              <th className="text-left px-4 py-2.5">Country</th>
              <th className="text-left px-4 py-2.5">Referrer</th>
              <th className="text-left px-4 py-2.5">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => {
              const meta = parseMetadata(ev.data.metadata_json);
              const user = userMap[ev.data.user_id];
              return (
                <tr key={ev.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground">
                    {new Date(ev.created_date).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5">
                    {user ? (
                      <div>
                        <p className="text-foreground font-medium">{user.full_name}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Anonymous</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{EVENT_LABELS[ev.data.event_name] || ev.data.event_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{ev.data.source_page || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground capitalize">{meta.device_type || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{meta.browser || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{meta.country || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[160px]">{meta.referrer || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[220px] truncate" title={ev.data.metadata_json}>
                    {ev.data.metadata_json || "—"}
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No events found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {canLoadMore && (
        <div className="p-3 border-t border-border text-center">
          <Button variant="outline" size="sm" onClick={onLoadMore}>Load More</Button>
        </div>
      )}
    </div>
  );
}