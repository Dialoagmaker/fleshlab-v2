import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

function fmt(n) {
  if (n === undefined || n === null) return "—";
  return typeof n === 'number' ? n.toLocaleString() : n;
}

export function EventsTable({ events = [] }) {
  if (!events?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            All Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No event data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          All Events (Sorted by Count)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.slice(0, 20).map((event, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="outline" className="text-xs font-mono">
                  {event.event_name}
                </Badge>
              </div>
              <span className="font-medium text-muted-foreground">{fmt(event.event_count)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-yellow-500 flex items-center gap-1 mt-3">
          Some events may show 0 if tracking was just installed
        </p>
      </CardContent>
    </Card>
  );
}

export function TrackingHealthCard({ trackingHealth }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-green-500" />
          Tracking Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">GA4 Property ID</span>
          <code className="text-xs bg-muted px-2 py-0.5 rounded">{trackingHealth?.ga4_property_id || "—"}</code>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last GA4 Pull</span>
          <span className="text-muted-foreground">
            {trackingHealth?.last_pull ? new Date(trackingHealth.last_pull).toLocaleString() : "—"}
          </span>
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Key Events Tracked:</p>
          <div className="flex flex-wrap gap-1.5">
            {['page_view', 'fanclub_cta_click', 'guest_production_cta_click', 'performer_apply_click', 'recruitment_landing_view', 'application_start', 'application_submit', 'application_complete', 'recruitment_whatsapp_click', 'registration_start', 'checkout_start', 'video_detail_view'].map(event => (
              <Badge key={event} variant="outline" className="text-xs">
                {event}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-yellow-500 mt-2">
            Events just installed — historical data may be limited
          </p>
        </div>
      </CardContent>
    </Card>
  );
}