import { Clock, Circle } from "lucide-react";

const EVENT_LABELS = {
  registration_start: "Registration Started",
  registration_completed: "Registered",
  otp_verified: "OTP Verified",
  login_success: "Logged In",
  login_failed: "Login Failed",
  logout: "Logged Out",
  onboarding_viewed: "Onboarding Viewed",
  onboarding_completed: "Onboarding Completed",
  performer_profile_view: "Viewed Performer",
  video_detail_view: "Viewed Video",
  fanclub_cta_click: "Fanclub Clicked",
  checkout_start: "Checkout Started",
  payment_success: "Payment Succeeded",
  payment_failed: "Payment Failed",
  subscription_activated: "Subscription Active",
};

export default function UserTimeline({ events = [], isLoading }) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading timeline…</p>;
  }

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
        No tracked events yet for this user.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={e.id || i} className="flex gap-3 pb-4 relative">
          {i < events.length - 1 && (
            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
          )}
          <Circle className="w-3.5 h-3.5 text-primary fill-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {EVENT_LABELS[e.event_name] || e.event_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {e.created_date ? new Date(e.created_date).toLocaleString() : "—"}
              {e.source_page ? ` · ${e.source_page}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}