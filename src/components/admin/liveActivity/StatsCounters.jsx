const COUNTER_CONFIG = [
  { key: "registration_start", label: "Registrations" },
  { key: "otp_verified", label: "Verified" },
  { key: "login_success", label: "Logins" },
  { key: "login_failed", label: "Failed Logins" },
  { key: "onboarding_viewed", label: "Onboarding Views" },
  { key: "onboarding_completed", label: "Onboarding Completed" },
  { key: "performer_profile_view", label: "Performer Views" },
  { key: "video_detail_view", label: "Video Views" },
  { key: "fanclub_cta_click", label: "Fanclub Clicks" },
  { key: "checkout_start", label: "Checkout Starts" },
  { key: "payment_success", label: "Payments" },
  { key: "subscription_activated", label: "Subscriptions" },
];

export default function StatsCounters({ todayEvents }) {
  const counts = {};
  todayEvents.forEach(e => { counts[e.data.event_name] = (counts[e.data.event_name] || 0) + 1; });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Today</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {COUNTER_CONFIG.map(cfg => (
          <div key={cfg.key}>
            <p className="text-2xl font-bold text-foreground">{counts[cfg.key] || 0}</p>
            <p className="text-xs text-muted-foreground">{cfg.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}