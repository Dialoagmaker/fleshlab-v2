import { Star, ChevronRight, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE = {
  active:         "bg-emerald-600/15 border-emerald-600/25 text-emerald-400",
  cancelled:      "bg-white/5 border-white/10 text-white/40",
  past_due:       "bg-amber-600/15 border-amber-600/25 text-amber-400",
  trialing:       "bg-blue-600/15 border-blue-600/25 text-blue-400",
  incomplete:     "bg-red-600/15 border-red-600/25 text-red-400",
};

export default function FanclubTab({ subscriptions, loading }) {
  const active = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  const past = subscriptions.filter((s) => !["active","trialing"].includes(s.status));

  return (
    <div className="space-y-5">
      <h2 className="font-black text-white text-base flex items-center gap-2">
        <Star className="w-4 h-4 text-rose-400" />
        Fanclub Subscriptions
      </h2>

      {loading ? (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
          <div className="w-6 h-6 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-rose-400/50" />
          </div>
          <h3 className="text-white font-black text-lg mb-2">No active Fanclub subscription</h3>
          <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            Join a Fanclub to get exclusive access to performer content, behind-the-scenes material and member benefits.
          </p>
          <Button
            onClick={() => window.location.href = "/fanclub"}
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-6 py-3 rounded-xl h-auto gap-2"
          >
            Join Fanclub
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <>
              <div className="text-xs font-bold text-white/25 uppercase tracking-wider">Active</div>
              {active.map((sub) => (
                <SubscriptionCard key={sub.id} sub={sub} />
              ))}
            </>
          )}
          {past.length > 0 && (
            <>
              <div className="text-xs font-bold text-white/25 uppercase tracking-wider mt-2">Past subscriptions</div>
              {past.map((sub) => (
                <SubscriptionCard key={sub.id} sub={sub} muted />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({ sub, muted }) {
  return (
    <div className={`bg-[#0f0f0f] border rounded-xl p-5 ${muted ? "border-white/6 opacity-60" : "border-white/8"}`}>
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="font-bold text-white text-sm">Fanclub Membership</div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${STATUS_BADGE[sub.status] || STATUS_BADGE.active}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current" />
          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1).replace("_", " ")}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {sub.amount_usd && (
          <div className="flex gap-2">
            <CreditCard className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
            <span className="text-white/55">${sub.amount_usd}/month</span>
          </div>
        )}
        {sub.current_period_start && (
          <div className="flex gap-2">
            <Calendar className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
            <span className="text-white/55">Since {new Date(sub.current_period_start).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
          </div>
        )}
        {sub.current_period_end && sub.status === "active" && (
          <div className="flex gap-2 col-span-2">
            <span className="text-white/25 text-xs">Renews</span>
            <span className="text-white/50 text-xs">{new Date(sub.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}