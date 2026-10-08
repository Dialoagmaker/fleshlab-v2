import { CheckCircle2, XCircle } from "lucide-react";

export const FUNNEL_STEPS = [
  { key: "registration", label: "Registration", test: (has) => has("registration_completed") },
  { key: "otp", label: "OTP Verified", test: (has) => has("otp_verified") },
  { key: "first_video", label: "Watched First Video", test: (has) => has("video_detail_view") },
  { key: "performer", label: "Visited Performer", test: (has) => has("performer_profile_view") },
  { key: "fanclub", label: "Opened Fanclub", test: (has) => has("fanclub_page_visited") || has("fanclub_cta_click") },
  { key: "checkout", label: "Started Checkout", test: (has) => has("checkout_start") },
  { key: "payment", label: "Payment", test: (has, summary) => has("payment_success") || (summary?.payment_count > 0) },
  { key: "wallet_topup", label: "Wallet Top-up", test: (has) => has("wallet_topup_completed") },
  { key: "ppv", label: "PPV Purchase", test: (has, summary) => has("ppv_purchased") || (summary?.ppv_purchase_count > 0) },
  { key: "fanclub_purchase", label: "Fanclub Purchase", test: (has, summary) => has("fanclub_purchased") || has("subscription_activated") || (summary?.active_subscription_count > 0) },
];

export function computeFunnel(events, summary) {
  const names = new Set(events.map(e => e.event_name));
  const has = (n) => names.has(n);
  return FUNNEL_STEPS.map(step => ({ ...step, done: step.test(has, summary) }));
}

export default function ConversionFunnel({ events, summary }) {
  const steps = computeFunnel(events, summary);
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Conversion Funnel</h3>
        <span className="text-xs text-muted-foreground">{doneCount}/{steps.length} steps</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {steps.map(s => (
          <div key={s.key} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs border ${s.done ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-border bg-muted/30 text-muted-foreground"}`}>
            {s.done ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}