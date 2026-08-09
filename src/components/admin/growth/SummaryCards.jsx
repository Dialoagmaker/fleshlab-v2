import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Eye, MousePointerClick, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function fmt(n) {
  if (n === undefined || n === null) return "—";
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function fmtPct(n) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export function SEOSummaryCard({ gscData }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          SEO (28d)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Clicks</p>
            <p className="text-xl font-bold">{fmt(gscData?.summary?.clicks || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Impressions</p>
            <p className="text-xl font-bold">{fmt(gscData?.summary?.impressions || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CTR</p>
            <p className="text-xl font-bold">{fmtPct(gscData?.summary?.ctr)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pos</p>
            <p className="text-xl font-bold">{fmt(gscData?.summary?.average_position)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PageViewsCard({ pages = [] }) {
  const total = pages.reduce((sum, p) => sum + (p.page_views || 0), 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Page Views
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{fmt(total)}</p>
        <p className="text-xs text-muted-foreground mt-1">Last {pages.length || 0} pages tracked</p>
      </CardContent>
    </Card>
  );
}

export function FanConversionCard({ events }) {
  const eventMap = {};
  (events || []).forEach(e => { eventMap[e.event_name] = e.event_count; });
  const clicks = eventMap['fanclub_cta_click'] || 0;
  const checkout = eventMap['checkout_start'] || eventMap['checkout_started'] || 0;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MousePointerClick className="w-4 h-4 text-primary" />
          Fan Conversion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">CTA Clicks</span>
          <Badge variant={clicks > 0 ? "default" : "secondary"}>{fmt(clicks)}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Checkout</span>
          <Badge variant={checkout > 0 ? "default" : "secondary"}>{fmt(checkout)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformerAcquisitionCard({ events }) {
  const eventMap = {};
  (events || []).forEach(e => { eventMap[e.event_name] = e.event_count; });
  const bpClicks = eventMap['become_performer_cta_click'] || 0;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Performer Acquisition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">BP CTA Clicks</span>
          <Badge variant={bpClicks > 0 ? "default" : "secondary"}>{fmt(bpClicks)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function GuestProductionCard({ events }) {
  const eventMap = {};
  (events || []).forEach(e => { eventMap[e.event_name] = e.event_count; });
  const gpClicks = eventMap['guest_production_cta_click'] || 0;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          Guest Production
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">GP CTA Clicks</span>
          <Badge variant={gpClicks > 0 ? "default" : "secondary"}>{fmt(gpClicks)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}