import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, ExternalLink, CheckCircle2 } from "lucide-react";

export default function PurchasesTab({ userId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-purchases", userId],
    queryFn: () => base44.functions.invoke("adminUserService", { action: "get_user_purchases", userId }).then(r => r.data),
  });

  const purchases = data?.purchases || [];

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="flex items-center gap-2 p-4 text-destructive text-sm"><AlertCircle className="w-4 h-4" />{error.message}</div>;
  if (purchases.length === 0) return (
    <div className="py-16 text-center text-muted-foreground text-sm">No PPV purchases found for this user.</div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Video", "Amount", "Status", "Access", "Purchase Date", ""].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {purchases.map(p => (
            <tr key={p.payment_id} className="hover:bg-muted/10 transition-colors">
              <td className="px-4 py-3">
                {p.video_title
                  ? <span className="font-medium text-foreground">{p.video_title}</span>
                  : <span className="text-muted-foreground text-xs font-mono">{p.video_id?.slice(0, 12)}…</span>
                }
              </td>
              <td className="px-4 py-3 font-semibold text-foreground">
                ${p.amount_usd?.toFixed(2) ?? '—'}
                <span className="text-xs text-muted-foreground font-normal ml-1">{p.currency?.toUpperCase()}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${
                  p.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : p.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-muted text-muted-foreground border-border'
                }`}>{p.status}</span>
              </td>
              <td className="px-4 py-3">
                {p.access_active
                  ? <span className="inline-flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3 h-3" />Active</span>
                  : <span className="text-xs text-muted-foreground">—</span>
                }
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {p.created_date ? new Date(p.created_date).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">
                {p.video_slug && (
                  <Link to={`/videos/${p.video_slug}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}