import {
  UserPlus, Mail, CheckCircle2, LogIn, LogOut, Star, PlayCircle, Search,
  Globe, Flame, Tag, CreditCard, Wallet, ShoppingCart, XCircle, RefreshCcw,
  Download, MessageSquare, Clapperboard, AlertTriangle, Heart, Share2, Circle,
} from "lucide-react";

// section = CRM journey block, filter = filter-bar value
export const EVENT_CONFIG = {
  registration_start:        { label: "Registration Started", icon: UserPlus, section: "Registration", filter: "Registration" },
  registration_completed:    { label: "Registered", icon: UserPlus, section: "Registration", filter: "Registration" },
  otp_verified:              { label: "OTP Verified", icon: Mail, section: "Registration", filter: "Registration" },
  email_confirmed:           { label: "Email Confirmed", icon: Mail, section: "Registration", filter: "Registration" },
  onboarding_viewed:         { label: "Onboarding Viewed", icon: CheckCircle2, section: "Registration", filter: "Registration" },
  onboarding_completed:      { label: "Onboarding Completed", icon: CheckCircle2, section: "Registration", filter: "Registration" },
  login_success:             { label: "Logged In", icon: LogIn, section: "Security", filter: "Security" },
  login_failed:              { label: "Login Failed", icon: AlertTriangle, section: "Security", filter: "Security" },
  logout:                    { label: "Logged Out", icon: LogOut, section: "Security", filter: "Security" },
  performer_profile_view:    { label: "Viewed Performer", icon: Star, section: "Browsing", filter: "Performers" },
  video_detail_view:         { label: "Viewed Video", icon: PlayCircle, section: "Browsing", filter: "Videos" },
  search_used:               { label: "Used Search", icon: Search, section: "Browsing", filter: "Browsing" },
  language_changed:          { label: "Changed Language", icon: Globe, section: "Browsing", filter: "Browsing" },
  fanclub_page_visited:      { label: "Visited Fanclub Page", icon: Flame, section: "Browsing", filter: "Fanclub" },
  pricing_opened:            { label: "Opened Pricing", icon: Tag, section: "Browsing", filter: "Browsing" },
  fanclub_cta_click:         { label: "Fanclub Clicked", icon: Flame, section: "Payments", filter: "Fanclub" },
  checkout_start:            { label: "Opened Checkout", icon: ShoppingCart, section: "Payments", filter: "Payments" },
  payment_success:           { label: "Payment Succeeded", icon: CreditCard, section: "Payments", filter: "Payments" },
  payment_failed:            { label: "Payment Failed", icon: XCircle, section: "Errors", filter: "Errors" },
  subscription_activated:    { label: "Fanclub Purchased", icon: Flame, section: "Payments", filter: "Fanclub" },
  refund:                    { label: "Refund", icon: RefreshCcw, section: "Payments", filter: "Payments" },
  wallet_opened:             { label: "FlashPay Wallet Opened", icon: Wallet, section: "Payments", filter: "Wallet" },
  wallet_topup_started:      { label: "Wallet Top-up Started", icon: Wallet, section: "Payments", filter: "Wallet" },
  wallet_topup_completed:    { label: "Wallet Top-up Completed", icon: Wallet, section: "Payments", filter: "Wallet" },
  wallet_spend:              { label: "Wallet Spend", icon: Wallet, section: "Payments", filter: "Wallet" },
  wallet_refund:             { label: "Wallet Refund", icon: Wallet, section: "Payments", filter: "Wallet" },
  ppv_purchased:             { label: "PPV Purchased", icon: ShoppingCart, section: "Payments", filter: "PPV" },
  fanclub_purchased:         { label: "Fanclub Purchased", icon: Flame, section: "Payments", filter: "Fanclub" },
  fanclub_renewal:           { label: "Fanclub Renewal", icon: Flame, section: "Payments", filter: "Fanclub" },
  subscription_cancelled:    { label: "Subscription Cancelled", icon: XCircle, section: "Payments", filter: "Fanclub" },
  subscription_expired:      { label: "Subscription Expired", icon: XCircle, section: "Payments", filter: "Fanclub" },
  liked_performer:           { label: "Liked Performer", icon: Heart, section: "Engagement", filter: "Performers" },
  added_favorite:            { label: "Added Favorite", icon: Heart, section: "Engagement", filter: "Performers" },
  shared_link:               { label: "Shared Link", icon: Share2, section: "Engagement", filter: "Browsing" },
  video_watched_80:          { label: "Watched 80% of Video", icon: PlayCircle, section: "Engagement", filter: "Videos" },
  video_watched_complete:    { label: "Watched Complete Video", icon: PlayCircle, section: "Engagement", filter: "Videos" },
  downloaded_content:        { label: "Downloaded Content", icon: Download, section: "Engagement", filter: "Videos" },
  guest_production_request:  { label: "Guest Production Request", icon: Clapperboard, section: "Engagement", filter: "Guest Productions" },
  message_sent:              { label: "Message Sent", icon: MessageSquare, section: "Engagement", filter: "Messages" },
  coupon_used:                { label: "Coupon Used", icon: Tag, section: "Payments", filter: "Payments" },
  affiliate_referral:         { label: "Affiliate Referral", icon: Share2, section: "Browsing", filter: "Browsing" },
  campaign_source:            { label: "Campaign Source", icon: Tag, section: "Browsing", filter: "Browsing" },
};

export const SECTION_ORDER = ["Registration", "Browsing", "Payments", "Engagement", "Security", "Errors", "Other"];

export const FILTERS = [
  "All", "Registration", "Browsing", "Videos", "Performers", "Wallet",
  "Payments", "Fanclub", "PPV", "Guest Productions", "Messages", "Security", "Errors",
];

function humanize(name) {
  return (name || "Unknown Event").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function getEventConfig(eventName) {
  return EVENT_CONFIG[eventName] || { label: humanize(eventName), icon: Circle, section: "Other", filter: "All" };
}