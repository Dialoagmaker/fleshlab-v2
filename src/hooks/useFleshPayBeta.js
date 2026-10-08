import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useFleshPayBeta — Hook
 *
 * Returns { enabled, loading, reason } based on the getFleshPayBetaStatus
 * backend function. FleshPay UI should only render when enabled=true.
 *
 * If the user is not authenticated, the hook will return enabled=false
 * without making an API call.
 */
export function useFleshPayBeta(isAuthenticated) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setEnabled(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const res = await base44.functions.invoke("getFleshPayBetaStatus", {});
        if (!cancelled) {
          setEnabled(res.data?.enabled === true);
          setReason(res.data?.reason || "");
        }
      } catch {
        if (!cancelled) setEnabled(false);
      }
      if (!cancelled) setLoading(false);
    };

    check();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  return { enabled, loading, reason };
}