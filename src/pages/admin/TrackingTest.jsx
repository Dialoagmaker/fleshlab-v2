import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Loader2 } from "lucide-react";

const TEST_EVENTS = [
  { name: "login_success", label: "Login Success" },
  { name: "onboarding_viewed", label: "Onboarding Viewed" },
  { name: "onboarding_completed", label: "Onboarding Completed" },
  { name: "performer_profile_view", label: "Performer Profile View" },
  { name: "video_detail_view", label: "Video Detail View" },
  { name: "fanclub_cta_click", label: "Fanclub CTA Click" },
  { name: "checkout_start", label: "Checkout Start" },
];

export default function TrackingTest() {
  const [results, setResults] = useState({});
  const [loadingEvent, setLoadingEvent] = useState(null);

  const fireEvent = async (eventName) => {
    setLoadingEvent(eventName);
    const timestamp = new Date().toISOString();
    try {
      const res = await base44.functions.invoke("logEvent", {
        event_name: eventName,
        source_page: "/admin/tracking-test",
        metadata: { test: true },
      });
      setResults((prev) => ({
        ...prev,
        [eventName]: {
          status: res.status,
          success: res.data?.success,
          conversionEventId: res.data?.id || null,
          error: res.data?.error || null,
          timestamp,
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [eventName]: {
          status: err.response?.status || "error",
          success: false,
          conversionEventId: null,
          error: err.message,
          timestamp,
        },
      }));
    }
    setLoadingEvent(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Tracking Test</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Fires real events through the production <code>logEvent</code> function to confirm the frontend can write <code>ConversionEvent</code> records. Admin only.
      </p>

      <div className="space-y-3">
        {TEST_EVENTS.map((evt) => {
          const result = results[evt.name];
          return (
            <div key={evt.name} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div>
                  <p className="font-semibold text-foreground text-sm">{evt.label}</p>
                  <p className="text-xs text-muted-foreground">{evt.name}</p>
                </div>
                <button
                  onClick={() => fireEvent(evt.name)}
                  disabled={loadingEvent === evt.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                >
                  {loadingEvent === evt.name && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Fire Event
                </button>
              </div>

              {result && (
                <div className="mt-2 pt-2 border-t border-border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response status:</span>
                    <span className={result.success ? "text-green-500" : "text-red-500"}>{result.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ConversionEvent id:</span>
                    <span className="text-foreground font-mono">{result.conversionEventId || "—"}</span>
                  </div>
                  {result.error && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Error:</span>
                      <span className="text-red-500">{result.error}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="text-foreground">{result.timestamp}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}