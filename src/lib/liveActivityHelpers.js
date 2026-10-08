// Shared helpers for the Live Activity admin dashboard.

export const SUPPORTED_EVENTS = [
  "registration_start", "registration_completed", "otp_verified",
  "login_success", "login_failed", "logout",
  "onboarding_viewed", "onboarding_completed",
  "performer_profile_view", "video_detail_view",
  "fanclub_cta_click", "checkout_start",
  "payment_success", "payment_failed", "subscription_activated",
];

export const ERROR_EVENTS = ["login_failed", "payment_failed", "provider_error"];

export const EVENT_LABELS = {
  registration_start: "Registration Start",
  registration_completed: "Registration Completed",
  otp_verified: "OTP Verified",
  login_success: "Login Success",
  login_failed: "Login Failed",
  logout: "Logout",
  onboarding_viewed: "Onboarding Viewed",
  onboarding_completed: "Onboarding Completed",
  performer_profile_view: "Performer Profile View",
  video_detail_view: "Video Detail View",
  fanclub_cta_click: "Fanclub CTA Click",
  checkout_start: "Checkout Start",
  payment_success: "Payment Success",
  payment_failed: "Payment Failed",
  subscription_activated: "Subscription Activated",
  provider_error: "Provider Error",
};

export function parseMetadata(metadataJson) {
  if (!metadataJson) return {};
  try {
    return JSON.parse(metadataJson) || {};
  } catch {
    return {};
  }
}

export function rangeStart(rangeKey) {
  const now = new Date();
  switch (rangeKey) {
    case "15m": return new Date(now.getTime() - 15 * 60 * 1000);
    case "1h": return new Date(now.getTime() - 60 * 60 * 1000);
    case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    default: return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}