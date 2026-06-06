import { CreditCard, Receipt } from "lucide-react";

const STATUS_BADGE = {
  completed: "text-emerald-400 bg-emerald-600/10 border-emerald-600/20",
  pending:   "text-amber-400 bg-amber-600/10 border-amber-600/20",
  failed:    "text-red-400 bg-red-600/10 border-red-600/20",
  refunded:  "text-blue-400 bg-blue-600/10 border-blue-600/20",
  cancelled: "text-white/35 bg-white/5 border-white/10",
};

const TYPE_LABEL = {
  subscription:                "Fanclub subscription",
  ppv:                         "PPV purchase",
  tip:                         "Tip",
  fanclub:                     "Fanclub",
  guest_production_deposit:    "Fan Production reservation",
  fan_production_deposit:      "Fan Production reservation",
  other:                       "Payment",
};

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PaymentsTab({ payments, loading }) {
  return (
    <div className="space-y-5">
      <h2 className="font-black text-white text-base flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-rose-400" />
        Payment History
      </h2>

      {loading ? (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
          <div className="w-6 h-6 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
          <Receipt className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <h3 className="text-white/60 font-semibold mb-1">No payments yet</h3>
          <p className="text-white/30 text-sm max-w-xs mx-auto">Your payment history will appear here after your first purchase.</p>
        </div>
      ) : (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-3 border-b border-white/6 text-xs font-bold text-white/25 uppercase tracking-wider">
            <span>Date</span>
            <span>Item</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {payments.map((p, i) => (
            <div key={p.id || i} className="px-5 py-4 border-b border-white/5 last:border-0">
              {/* Mobile layout */}
              <div className="sm:hidden space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{TYPE_LABEL[p.payment_type] || TYPE_LABEL.other}</span>
                  <div className={`text-xs px-2 py-0.5 rounded-full border font-bold ${STATUS_BADGE[p.status] || STATUS_BADGE.pending}`}>
                    {p.status}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/35 text-xs">{formatDate(p.created_date)}</span>
                  <span className="text-white/70 font-bold">${p.amount_usd?.toFixed(2) || "—"}</span>
                </div>
              </div>
              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-4 gap-4 items-center text-sm">
                <span className="text-white/45">{formatDate(p.created_date)}</span>
                <span className="text-white/70">{TYPE_LABEL[p.payment_type] || TYPE_LABEL.other}</span>
                <span className="text-white font-bold">${p.amount_usd?.toFixed(2) || "—"} <span className="text-white/30 font-normal text-xs uppercase">{p.currency || "USD"}</span></span>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold w-fit ${STATUS_BADGE[p.status] || STATUS_BADGE.pending}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  {p.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white/3 border border-white/6 rounded-xl p-4 text-white/25 text-xs leading-relaxed">
        Payment receipts and invoices are processed through FLESHLAB's secure payment providers.
        For payment disputes or refund requests, contact FLESHLAB Management via WhatsApp.
      </div>
    </div>
  );
}