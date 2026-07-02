import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function fmt(n) {
  if (n === undefined || n === null) return "—";
  return typeof n === "number" ? n.toLocaleString() : n;
}
function fmtMoney(n) {
  if (n === undefined || n === null) return "$0";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtPct(n) {
  return n === null || n === undefined ? "—" : `${n}%`;
}

const KPI_ROWS = [
  ["Visitors", "visitors"], ["Registrations", "registrations"], ["Verified Users", "verified_users"],
  ["First Logins", "first_logins"], ["Returning Users", "returning_users"], ["Video Views", "video_views"],
  ["Performer Views", "performer_views"], ["Fanclub Page Views", "fanclub_page_views"],
  ["Checkout Starts", "checkout_starts"], ["Payment Success", "payment_success"],
  ["Payment Failed", "payment_failed"], ["Subscriptions", "subscriptions"], ["PPV Purchases", "ppv_purchases"],
];

const FUNNEL_STEPS = [
  ["Visitor → Registration", "visitor_to_registration"],
  ["Registration → Verification", "registration_to_verification"],
  ["Verification → First Login", "verification_to_first_login"],
  ["First Login → Performer View", "first_login_to_performer_view"],
  ["Performer View → Fanclub", "performer_view_to_fanclub"],
  ["Fanclub → Checkout", "fanclub_to_checkout"],
  ["Checkout → Payment", "checkout_to_payment"],
  ["Payment → Subscription", "payment_to_subscription"],
];

export default function KpiPeriodCard({ data }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">KPIs</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {KPI_ROWS.map(([label, key]) => (
              <div key={key}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{fmt(data[key])}</p>
              </div>
            ))}
            <div><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-bold">{fmtMoney(data.revenue_usd)}</p></div>
            <div><p className="text-xs text-muted-foreground">Avg Rev / User</p><p className="text-lg font-bold">{fmtMoney(data.arpu)}</p></div>
            <div><p className="text-xs text-muted-foreground">Avg Rev / Subscriber</p><p className="text-lg font-bold">{fmtMoney(data.arps)}</p></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Conversion Funnel</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {FUNNEL_STEPS.map(([label, key]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{fmtPct(data.conversion_rates?.[key])}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}