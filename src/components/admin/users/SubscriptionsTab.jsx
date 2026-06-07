import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

const STATUS_COLORS = {
  active:     "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled:  "bg-muted text-muted-foreground border-border",
  past_due:   "bg-red-500/10 text-red-400 border-red-500/20",
  trialing:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  incomplete: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function SubscriptionsTab({ userId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-subscriptions", userId],
    queryFn: () => base44.functions.invoke("adminUserService", { action: "get_user_subscriptions", userId }).then(r => r.data),
  });

  const subs = data?.subscriptions || [];

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="flex items-center gap-2 p-4 text-destructive text-sm"><AlertCircle className="w-4 h-4" />{error.message}</div>;
  if (subs.length === 0) return (
    <div className="py-16 text-center text-muted-foreground text-sm">No subscriptions found for this user.</div>
  );

  return (
    <div className="space-y-3">
      {subs.map(s => {
        const statusCls = STATUS_COLORS[s.status] || "bg-muted text-muted-foreground border-border";
        return (
          <div key={s.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{s.plan_label}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${statusCls}`}>
                    {s.status?.replace(/_/g, ' ')}
                  </span>
                  {s.entitlement_active
                    ? <span className="inline-flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3 h-3" />Access Active</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="w-3 h-3" />Access Inactive</span>
                  }
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground text-lg">${s.amount_usd?.toFixed(2) ?? '—'}</p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-0.5">Period Start</p>
                <p>{s.current_period_start ? new Date(s.current_period_start).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-0.5">Period End</p>
                <p>{s.current_period_end ? new Date(s.current_period_end).toLocaleString() : '—'}</p>
              </div>
              {s.cancelled_at && (
                <div>
                  <p className="font-medium text-foreground mb-0.5">Cancelled At</p>
                  <p>{new Date(s.cancelled_at).toLocaleString()}</p>
                </div>
              )}
              {s.provider_session_ref && (
                <div>
                  <p className="font-medium text-foreground mb-0.5">Session Ref</p>
                  <p className="font-mono break-all">{s.provider_session_ref}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-foreground mb-0.5">Created</p>
                <p>{s.created_date ? new Date(s.created_date).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}