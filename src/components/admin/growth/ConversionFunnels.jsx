import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, ShoppingCart, UserPlus, Video, Zap, MessageCircle } from "lucide-react";

function fmt(n) {
  if (n === undefined || n === null) return "—";
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function fmtPct(n) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function getEventCount(events, eventName) {
  if (!events) return 0;
  const event = events.find(e => e.event_name === eventName);
  return event?.event_count || 0;
}

export function FanConversionFunnel({ events, pageViews }) {
  const fanclubClicks = getEventCount(events, 'fanclub_cta_click');
  const checkoutStarted = getEventCount(events, 'checkout_started');
  const registrationStarted = getEventCount(events, 'registration_started');
  const totalPageViews = pageViews?.reduce((sum, p) => sum + (p.page_views || 0), 0) || 0;

  const pvToCtaRate = totalPageViews > 0 ? (fanclubClicks / totalPageViews) * 100 : 0;
  const ctaToCheckoutRate = fanclubClicks > 0 ? (checkoutStarted / fanclubClicks) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          Fan Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fanclub CTA Clicks</span>
          <Badge variant={fanclubClicks > 0 ? "default" : "secondary"}>{fmt(fanclubClicks)}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Checkout Started</span>
          <Badge variant={checkoutStarted > 0 ? "default" : "secondary"}>{fmt(checkoutStarted)}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Registration Started</span>
          <Badge variant={registrationStarted > 0 ? "default" : "secondary"}>{fmt(registrationStarted)}</Badge>
        </div>
        <div className="pt-2 border-t space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">PV → CTA Rate</span>
            <span className="font-medium">{fmtPct(pvToCtaRate)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">CTA → Checkout Rate</span>
            <span className="font-medium">{fmtPct(ctaToCheckoutRate)}</span>
          </div>
        </div>
        {fanclubClicks === 0 && checkoutStarted === 0 && registrationStarted === 0 && (
          <p className="text-xs text-yellow-500 flex items-center gap-1 mt-2">
            No event data yet — tracking just installed
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function PerformerAcquisitionFunnel({ events }) {
  const becomePerformerClicks = getEventCount(events, 'performer_apply_click');
  const whatsappClicks = getEventCount(events, 'recruitment_whatsapp_click');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Performer Acquisition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Performer Apply Clicks</span>
          <Badge variant={becomePerformerClicks > 0 ? "default" : "secondary"}>{fmt(becomePerformerClicks)}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">WhatsApp Clicks</span>
          <Badge variant={whatsappClicks > 0 ? "default" : "secondary"}>{fmt(whatsappClicks)}</Badge>
        </div>
        {becomePerformerClicks === 0 && whatsappClicks === 0 && (
          <p className="text-xs text-yellow-500 flex items-center gap-1 mt-2">
            No event data yet — tracking just installed
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function GuestProductionFunnel({ events }) {
  const gpPageViews = getEventCount(events, 'guest_production_page_view');
  const gpClicks = getEventCount(events, 'guest_production_cta_click');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          Guest Production Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">GP Page Views</span>
          <Badge variant={gpPageViews > 0 ? "default" : "secondary"}>{fmt(gpPageViews)}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">GP CTA Clicks</span>
          <Badge variant={gpClicks > 0 ? "default" : "secondary"}>{fmt(gpClicks)}</Badge>
        </div>
        {gpPageViews === 0 && gpClicks === 0 && (
          <p className="text-xs text-yellow-500 flex items-center gap-1 mt-2">
            No event data yet — tracking just installed
          </p>
        )}
      </CardContent>
    </Card>
  );
}