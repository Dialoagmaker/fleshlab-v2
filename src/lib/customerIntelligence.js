import { parseMetadata } from "@/lib/timelineGrouping";

const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_GAP_MS = 30 * 60 * 1000;

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS);
}

function count(events, name) {
  return events.filter(e => e.event_name === name).length;
}

// ── Sessions (grouped by 30-minute inactivity gaps) ────────────────────────────
export function computeSessions(events) {
  if (events.length === 0) return [];
  const sorted = events.slice().sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const sessions = [];
  let current = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const gap = new Date(sorted[i].created_date) - new Date(sorted[i - 1].created_date);
    if (gap > SESSION_GAP_MS) {
      sessions.push(current);
      current = [];
    }
    current.push(sorted[i]);
  }
  sessions.push(current);

  return sessions.map(s => ({
    start: s[0].created_date,
    end: s[s.length - 1].created_date,
    durationMin: Math.round((new Date(s[s.length - 1].created_date) - new Date(s[0].created_date)) / 60000),
    eventCount: s.length,
  }));
}

export function computeSessionAnalytics(events) {
  const sessions = computeSessions(events);
  if (sessions.length === 0) {
    return { totalSessions: 0, avgSessionLength: "—", longestSession: "—", lastSession: "—", currentSession: "—", timeSinceLastVisit: "—", avgTimeBetweenVisits: "—" };
  }
  const durations = sessions.map(s => s.durationMin);
  const avgLen = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const longest = Math.max(...durations);
  const last = sessions[sessions.length - 1];
  const isOngoing = Date.now() - new Date(last.end).getTime() < SESSION_GAP_MS;

  let avgGapMin = "—";
  if (sessions.length > 1) {
    const gaps = [];
    for (let i = 1; i < sessions.length; i++) {
      gaps.push((new Date(sessions[i].start) - new Date(sessions[i - 1].end)) / (60000 * 60));
    }
    avgGapMin = `${(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1)}h`;
  }

  return {
    totalSessions: sessions.length,
    avgSessionLength: `${avgLen}m`,
    longestSession: `${longest}m`,
    lastSession: new Date(last.end).toLocaleString(),
    currentSession: isOngoing ? "Active now" : "Ended",
    timeSinceLastVisit: `${daysSince(last.end) ?? 0}d ago`,
    avgTimeBetweenVisits: avgGapMin,
  };
}

// ── Health score ────────────────────────────────────────────────────────────────
export function computeHealthScore(events, summary, financials) {
  const sessions = computeSessions(events).length;
  const videoViews = count(events, "video_detail_view");
  const performerViews = count(events, "performer_profile_view");
  const lastActivity = events.length ? events[events.length - 1].created_date : null;
  const daysInactive = daysSince(lastActivity);

  let score = 0;
  if (events.some(e => e.event_name === "registration_completed")) score += 10;
  if (events.some(e => e.event_name === "otp_verified")) score += 10;
  score += Math.min(sessions, 5) * 4;
  score += Math.min(videoViews, 10) * 2;
  score += Math.min(performerViews, 10) * 1.5;
  if (events.some(e => e.event_name === "fanclub_page_visited")) score += 5;
  if (events.some(e => e.event_name === "checkout_start")) score += 5;
  if (financials?.flashpay?.wallet_exists) score += 5;
  if ((financials?.flashpay?.topup_count || 0) > 0) score += 5;
  if ((summary?.ppv_purchase_count || 0) > 0) score += 10;
  if ((summary?.active_subscription_count || 0) > 0) score += 10;
  if (sessions > 1) score += 5;
  if (daysInactive !== null && daysInactive <= 7) score += 5;

  score = Math.min(100, Math.round(score));

  let tier = "Dormant";
  if (daysInactive !== null && daysInactive > 30) tier = "Dormant";
  else if (score >= 80) tier = "High Conversion";
  else if (score >= 50) tier = "Medium Conversion";
  else if (score >= 20) tier = "Low Conversion";

  return { score, tier };
}

// ── Purchase probability ─────────────────────────────────────────────────────────
export function computePurchaseProbability(events, summary, financials) {
  const sessions = computeSessions(events).length;
  const totalMinutes = computeSessions(events).reduce((s, x) => s + x.durationMin, 0);
  const checkoutAttempts = count(events, "checkout_start");
  const videoViews = count(events, "video_detail_view");
  const fanclubViews = count(events, "fanclub_page_visited") + count(events, "fanclub_cta_click");
  const walletUsage = (financials?.flashpay?.topup_count || 0) + (financials?.flashpay?.spend_count || 0);
  const hasPurchased = (summary?.ppv_purchase_count || 0) > 0 || (summary?.active_subscription_count || 0) > 0;

  let pct = 0;
  pct += Math.min(sessions, 8) * 4;
  pct += Math.min(Math.round(totalMinutes / 10), 15);
  pct += Math.min(checkoutAttempts, 3) * 10;
  pct += Math.min(videoViews, 10) * 2;
  pct += Math.min(fanclubViews, 3) * 5;
  pct += Math.min(walletUsage, 3) * 5;
  if (hasPurchased) pct += 20;
  pct = Math.min(100, Math.round(pct));

  let tier = "Low";
  if (pct >= 75) tier = "Very High";
  else if (pct >= 50) tier = "High";
  else if (pct >= 25) tier = "Medium";

  return { pct, tier };
}

// ── Status badges ────────────────────────────────────────────────────────────────
export function computeStatusBadges(events, summary, user, financials) {
  const sessions = computeSessions(events).length;
  const daysRegistered = daysSince(user?.created_date);
  const lastActivity = events.length ? events[events.length - 1].created_date : user?.last_activity;
  const daysInactive = daysSince(lastActivity);
  const lifetimeSpend = summary?.lifetime_spend_usd || 0;
  const totalPurchases = financials?.revenue?.total_purchases || 0;
  const hasCheckout = events.some(e => e.event_name === "checkout_start");
  const hasPurchase = totalPurchases > 0;

  const badges = [];
  if (daysRegistered !== null && daysRegistered <= 7 && sessions <= 1) badges.push("New User");
  if (sessions >= 2) badges.push("Returning User");
  if (financials?.flashpay?.wallet_exists) badges.push("Wallet User");
  if ((summary?.active_subscription_count || 0) > 0) { badges.push("Fanclub Member"); badges.push("Subscriber"); }
  if (lifetimeSpend >= 100) badges.push("High Value");
  if (lifetimeSpend >= 300) badges.push("VIP");
  if (lifetimeSpend >= 1000) badges.push("Whale");
  if (hasCheckout && !hasPurchase) badges.push("Potential Buyer");
  if (daysInactive !== null && daysInactive > 30) badges.push("Dormant");
  if (totalPurchases >= 2) badges.push("Repeat Customer");

  return [...new Set(badges)];
}

// ── Interest profile (from tracked metadata only) ─────────────────────────────
export function computeInterestProfile(events) {
  const performerCounts = {}, categoryCounts = {}, studioCounts = {}, tagCounts = {};

  for (const e of events) {
    if (!["performer_profile_view", "video_detail_view"].includes(e.event_name)) continue;
    const meta = parseMetadata(e.metadata_json);
    if (!meta) continue;
    const performer = meta.performer_name || meta.display_name;
    if (performer) performerCounts[performer] = (performerCounts[performer] || 0) + 1;
    if (meta.category) categoryCounts[meta.category] = (categoryCounts[meta.category] || 0) + 1;
    if (meta.studio || meta.brand) {
      const s = meta.studio || meta.brand;
      studioCounts[s] = (studioCounts[s] || 0) + 1;
    }
    if (Array.isArray(meta.tags)) {
      for (const t of meta.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }

  const top = (obj, n = 5) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  return {
    favouritePerformer: top(performerCounts, 1)[0] || "—",
    favouriteCategories: top(categoryCounts),
    favouriteStudio: top(studioCounts, 1)[0] || "—",
    favouriteTags: top(tagCounts),
    hasData: Object.keys(performerCounts).length + Object.keys(categoryCounts).length > 0,
  };
}

// ── Admin recommendations ─────────────────────────────────────────────────────
export function computeRecommendations(events, summary, financials, purchaseProbability) {
  const recs = [];
  const videoViews = count(events, "video_detail_view");
  const performerViews = count(events, "performer_profile_view");
  const fanclubViews = count(events, "fanclub_page_visited") + count(events, "fanclub_cta_click");
  const lastActivity = events.length ? events[events.length - 1].created_date : null;
  const daysInactive = daysSince(lastActivity);
  const hasPurchase = (financials?.revenue?.total_purchases || 0) > 0;

  if (!financials?.flashpay?.wallet_exists) recs.push("Recommend FlashPay Wallet");
  if (fanclubViews > 0 && (summary?.active_subscription_count || 0) === 0) recs.push("Offer Fanclub");
  if (videoViews > 3 && (summary?.ppv_purchase_count || 0) === 0) recs.push("Offer PPV");
  if (performerViews > 5 && (summary?.guest_production_count || 0) === 0) recs.push("Invite Guest Production");
  if (purchaseProbability?.tier === "High" || purchaseProbability?.tier === "Very High") {
    if (!hasPurchase) recs.push("High Conversion Candidate");
  }
  if (daysInactive !== null && daysInactive >= 30) recs.push("Inactive for 30 Days");
  else if (daysInactive !== null && daysInactive >= 7) recs.push("Needs Follow-up");
  if ((financials?.revenue?.total_purchases || 0) >= 2) recs.push("Repeat Customer");

  return recs.length ? recs : ["No action needed — monitor activity"];
}

// ── Activity heatmap ──────────────────────────────────────────────────────────
export function computeHeatmap(events) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const byDay = dayNames.map(name => ({ label: name, count: 0 }));
  const byHour = Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, "0")}:00`, count: 0 }));

  for (const e of events) {
    const d = new Date(e.created_date);
    byDay[d.getDay()].count++;
    byHour[d.getHours()].count++;
  }
  return { byDay, byHour };
}

// ── Marketing attribution (from first tracked event's metadata only) ──────────
export function computeAttribution(events) {
  const first = events.find(e => e.metadata_json) || events[0];
  const meta = first ? parseMetadata(first.metadata_json) : null;
  return {
    referrer: meta?.referrer || "—",
    landingPage: first?.source_page || "—",
    campaign: meta?.utm_campaign || "—",
    utmSource: meta?.utm_source || "—",
    utmMedium: meta?.utm_medium || "—",
    utmCampaign: meta?.utm_campaign || "—",
    channel: meta?.utm_source || meta?.referrer || "Direct / Organic",
  };
}

// ── Customer journey milestones ────────────────────────────────────────────────
export function computeJourneyMilestones(events, financials) {
  const has = (n) => events.some(e => e.event_name === n);
  const sessions = computeSessions(events).length;

  return [
    { label: "Registration", done: has("registration_completed") },
    { label: "OTP Verified", done: has("otp_verified") },
    { label: "First Session", done: sessions >= 1 },
    { label: "First Video", done: has("video_detail_view") },
    { label: "First Performer", done: has("performer_profile_view") },
    { label: "Second Session", done: sessions >= 2 },
    { label: "FlashPay Wallet Created", done: !!financials?.flashpay?.wallet_exists },
    { label: "First Wallet Topup", done: (financials?.flashpay?.topup_count || 0) > 0 },
    { label: "First Checkout", done: has("checkout_start") },
    { label: "First PPV", done: has("ppv_purchased") },
    { label: "Fanclub Purchase", done: has("fanclub_purchased") || has("subscription_activated") },
    { label: "Repeat Purchase", done: (financials?.revenue?.total_purchases || 0) >= 2 },
    { label: "VIP Customer", done: (financials?.revenue?.total_revenue || 0) >= 300 },
  ];
}

// ── Auto-generated insight summary (tracked data only, no AI) ─────────────────
export function computeInsightSummary(events, summary, financials, interest) {
  const sessions = computeSessions(events).length;
  const hasPurchase = (financials?.revenue?.total_purchases || 0) > 0;
  const parts = [];

  if (interest.hasData && interest.favouriteCategories.length > 0) {
    parts.push(`This customer frequently watches ${interest.favouriteCategories.slice(0, 2).join(" and ")} content.`);
  } else if (interest.favouritePerformer !== "—") {
    parts.push(`This customer's favourite performer is ${interest.favouritePerformer}.`);
  }

  if (sessions > 0) {
    parts.push(`They have returned ${sessions} time${sessions === 1 ? "" : "s"}${hasPurchase ? "." : " but have not yet completed a purchase."}`);
  }

  if (!hasPurchase && financials?.flashpay && !financials.flashpay.wallet_exists) {
    parts.push("A FlashPay top-up incentive or Fanclub discount is recommended.");
  } else if (!hasPurchase) {
    parts.push("Consider a targeted Fanclub or PPV offer to convert this customer.");
  }

  return parts.length ? parts.join(" ") : "Not enough tracked activity yet to generate insights.";
}