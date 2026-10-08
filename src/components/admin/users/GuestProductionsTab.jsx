import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";

const APP_STATUS_COLORS = {
  pending:       "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  media_pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  reviewing:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved:      "bg-green-500/10 text-green-400 border-green-500/20",
  rejected:      "bg-red-500/10 text-red-400 border-red-500/20",
};

const PACKAGE_LABELS = {
  short_799:    'Short — $799',
  full_1499:    'Full — $1,499',
  premium_2499: 'Premium — $2,499',
  custom_quote: 'Custom Quote',
};

export default function GuestProductionsTab({ userId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-guest-productions", userId],
    queryFn: () => base44.functions.invoke("adminUserService", { action: "get_user_guest_productions", userId }).then(r => r.data),
  });

  const apps = data?.guest_productions || [];

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="flex items-center gap-2 p-4 text-destructive text-sm"><AlertCircle className="w-4 h-4" />{error.message}</div>;
  if (apps.length === 0) return (
    <div className="py-16 text-center text-muted-foreground text-sm">No guest production applications found for this user.</div>
  );

  return (
    <div className="space-y-3">
      {apps.map(a => {
        const statusCls = APP_STATUS_COLORS[a.status] || "bg-muted text-muted-foreground border-border";
        const paymentStatusCls = a.payment_status === 'completed'
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : a.payment_status === 'pending'
          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          : a.payment_status
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-muted text-muted-foreground border-border";

        return (
          <div key={a.application_id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {a.request_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Application'}
                </p>
                <p className="text-xs text-muted-foreground">{PACKAGE_LABELS[a.production_package] || a.production_package || 'No package selected'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${statusCls}`}>
                    {a.status?.replace(/_/g, ' ')}
                  </span>
                  {a.payment_status && (
                    <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${paymentStatusCls}`}>
                      Payment: {a.payment_status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                {a.payment_amount != null && (
                  <>
                    <p className="font-bold text-foreground text-lg">${Number(a.payment_amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Deposit</p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex gap-6">
                <div>
                  <p className="font-medium text-foreground mb-0.5">Submitted</p>
                  <p>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—'}</p>
                </div>
                {a.payment_provider && (
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Payment Provider</p>
                    <p className="capitalize">{a.payment_provider}</p>
                  </div>
                )}
                {a.payment_session_id && (
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Invoice ID</p>
                    <p className="font-mono">{a.payment_session_id?.slice(0, 16)}…</p>
                  </div>
                )}
              </div>
              <Link
                to={`/admin/applications`}
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                View Application <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}