import { Star, X } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { Link } from "react-router-dom";

export default function NonSubscriberCta({ hasActiveSub, user, compact = false }) {
  const [dismissed, setDismissed] = useState(false);

  if (!user || hasActiveSub || dismissed) return null;

  const isAdmin = user.role === "admin";

  if (isAdmin) return null;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-rose-950/40 to-rose-900/20 border border-rose-700/25 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/30 flex items-center justify-center">
            <Star className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">Unlock all Fanclub content</p>
            <p className="text-white/40 text-xs">Only $12.99/month</p>
          </div>
        </div>
        <Link
          to="/fanclub"
          onClick={() => trackEvent("fanclub_cta_clicked", { cta_location: "compact_banner" })}
          className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
        >
          Join Fanclub
        </Link>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r from-rose-950/40 via-[#0f0f0f] to-rose-950/40 border border-rose-700/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-white/20 hover:text-white/60 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-600/30 flex items-center justify-center">
          <Star className="w-5 h-5 text-rose-400 fill-rose-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">Unlock all Fanclub content</h3>
          <p className="text-white/40 text-sm">Only $12.99/month</p>
        </div>
      </div>
      <Link
        to="/fanclub"
        onClick={() => trackEvent("fanclub_cta_clicked", { cta_location: "full_banner" })}
        className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5"
      >
        <Star className="w-4 h-4 fill-white" />
        Join Fanclub
      </Link>
    </div>
  );
}