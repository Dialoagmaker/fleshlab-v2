import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

const STATUS_COLORS = {
  completed:         "bg-green-500/10 text-green-400 border-green-500/20",
  pending:           "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  failed:            "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled:         "bg-muted text-muted-foreground border-border",
  refunded:          "bg-blue-500/10 text-blue-400 border-blue-500/20",
  underpaid:         "bg-orange-500/10 text-orange-400 border-orange-500/20",
  currency_mismatch: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  payment_review:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
}

function PaymentRow({ record }) {
  const [expanded, setExpanded] = useState(false);
  const isIntent = record.record_type === 'payment_intent';
  const date = record.completed_at || record.failed_at || record.cancelled_at || record.created_date;
  const amount = isIntent ? record.amount : record.amount_usd;

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/10 transition-colors">
        <td className="px-4 py-3">
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-medium ${isIntent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {isIntent ? 'Intent' : 'Payment'}
          </span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={record.status} />
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
          {(isIntent ? record.payment_type : record.payment_type)?.replace(/_/g, ' ') || '—'}
          {record.plan_label && <span className="block text-foreground font-medium">{record.plan_label}</span>}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {isIntent ? (record.provider || '—') : '—'}
        </td>
        <td className="px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            {isIntent && record.provider_session_id ? record.provider_session_id.slice(0, 20) + '…' : '—'}
          </span>
        </td>
        <td className="px-4 py-3 text-right font-semibold text-foreground text-sm">
          {amount != null ? `$${Number(amount).toFixed(2)}` : '—'}
          <span className="text-xs text-muted-foreground font-normal ml-1">{record.currency || record.currency_code || 'USD'}</span>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {date ? new Date(date).toLocaleDateString() : '—'}
        </td>
        <td className="px-4 py-3">
          {record.related_video && (
            <Link to={`/videos/${record.related_video.slug}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
              {record.related_video.title?.slice(0, 20)}… <ExternalLink className="w-3 h-3" />
            </Link>
          )}
          {record.related_application && (
            <span className="text-xs text-muted-foreground">Guest App: {record.related_application.id?.slice(0, 8)}…</span>
          )}
          {isIntent && record.status === 'pending' && record.checkout_url && (
            <a href={record.checkout_url} target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-400 hover:underline flex items-center gap-1">
              Checkout <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </td>
        <td className="px-4 py-3">
          {(record.metadata || record.error_message) && (
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {expanded ? 'Hide' : 'Details'}
            </button>
          )}
        </td>
      </tr>
      {expanded && (record.metadata || record.error_message) && (
        <tr className="border-b border-border bg-muted/5">
          <td colSpan={9} className="px-4 py-3">
            {record.error_message && (
              <p className="text-xs text-red-400 mb-2"><strong>Error:</strong> {record.error_message}</p>
            )}
            {record.metadata && (
              <pre className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 overflow-auto max-h-32">
                {JSON.stringify(JSON.parse(record.metadata), null, 2)}
              </pre>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function PaymentsTab({ userId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-payments", userId],
    queryFn: () => base44.functions.invoke("adminUserService", { action: "get_user_payments", userId }).then(r => r.data),
  });

  const intents = data?.intents || [];
  const payments = data?.payments || [];

  // Separate sections: attempts (intents) and confirmed payments
  const intentRecords = [...intents].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const paymentRecords = [...payments].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const allRecords = [...intentRecords, ...paymentRecords];

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="flex items-center gap-2 p-4 text-destructive text-sm"><AlertCircle className="w-4 h-4" />{error.message}</div>;
  if (allRecords.length === 0) return (
    <div className="py-16 text-center text-muted-foreground text-sm">No payment records found for this user.</div>
  );

  const TABLE_HEADERS = ["Type", "Status", "Payment For", "Provider", "Invoice ID", "Amount", "Date", "Related", ""];

  return (
    <div className="space-y-8">
      {/* Completed Payments / Entitlements */}
      {paymentRecords.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Completed Payments / Entitlements
            <span className="ml-2 normal-case font-normal text-foreground/60">({paymentRecords.length})</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {TABLE_HEADERS.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paymentRecords.map(r => <PaymentRow key={`payment-${r.id}`} record={r} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Attempts */}
      {intentRecords.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Payment Attempts
            <span className="ml-2 normal-case font-normal text-foreground/60">({intentRecords.length})</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {TABLE_HEADERS.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {intentRecords.map(r => <PaymentRow key={`intent-${r.id}`} record={r} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}