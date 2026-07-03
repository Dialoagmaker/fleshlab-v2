import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { getEventConfig, SECTION_ORDER } from "@/lib/timelineEventConfig";
import { groupConsecutiveEvents, parseMetadata } from "@/lib/timelineGrouping";
import CustomerSummaryCard from "./timeline/CustomerSummaryCard";
import ConversionFunnel from "./timeline/ConversionFunnel";
import TimelineAnalytics from "./timeline/TimelineAnalytics";
import TimelineFilters from "./timeline/TimelineFilters";
import TimelineSection from "./timeline/TimelineSection";

const PAGE_SIZE = 40;

function computeStats(events) {
  const videoViews = events.filter(e => e.event_name === "video_detail_view");
  const performerViews = events.filter(e => e.event_name === "performer_profile_view");
  const messages = events.filter(e => e.event_name === "message_sent");
  const logins = events.filter(e => e.event_name === "login_success");
  const today = new Date().toDateString();
  const todaySessions = logins.filter(e => new Date(e.created_date).toDateString() === today).length;

  const performerCounts = {};
  for (const e of performerViews) {
    const meta = parseMetadata(e.metadata_json);
    const label = meta?.performer_name || meta?.display_name;
    if (label) performerCounts[label] = (performerCounts[label] || 0) + 1;
  }
  const mostViewedPerformer = Object.entries(performerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const totalSteps = 10;
  const doneNames = new Set(events.map(e => e.event_name));
  const has = (n) => doneNames.has(n);
  const stepsDone = [
    has("registration_completed"), has("otp_verified"), has("video_detail_view"),
    has("performer_profile_view"), has("fanclub_page_visited") || has("fanclub_cta_click"),
    has("checkout_start"), has("payment_success"), has("wallet_topup_completed"),
    has("ppv_purchased"), has("fanclub_purchased") || has("subscription_activated"),
  ].filter(Boolean).length;

  return {
    videosViewed: videoViews.length,
    performersViewed: performerViews.length,
    messagesSent: messages.length,
    todaySessions,
    mostViewedPerformer,
    mostViewedCategory: "—",
    totalWatchTime: "—",
    avgWatchPct: "—",
    avgSessionLength: "—",
    numberOfVisits: logins.length,
    currentSessionMinutes: null,
    conversionScore: Math.round((stepsDone / totalSteps) * 100),
  };
}

export default function UserTimeline({ events = [], isLoading, user, summary }) {
  const [filter, setFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const stats = useMemo(() => computeStats(events), [events]);

  const filteredEvents = useMemo(() => {
    if (filter === "All") return events;
    return events.filter(e => getEventConfig(e.event_name).filter === filter);
  }, [events, filter]);

  const grouped = useMemo(() => groupConsecutiveEvents(filteredEvents), [filteredEvents]);
  const visibleGroups = grouped.slice(0, visibleCount);
  const hasMore = grouped.length > visibleCount;

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

  const sections = filter === "All"
    ? SECTION_ORDER.map(section => ({
        section,
        items: visibleGroups.filter(g => getEventConfig(g.event_name).section === section),
      }))
    : [{ section: filter, items: visibleGroups }];

  return (
    <div className="space-y-5">
      <CustomerSummaryCard user={user} summary={summary} stats={stats} />
      <ConversionFunnel events={events} summary={summary} />
      <TimelineAnalytics stats={stats} />

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-foreground">Customer Journey</h3>
          <TimelineFilters active={filter} onChange={(f) => { setFilter(f); setVisibleCount(PAGE_SIZE); }} />
        </div>

        {sections.map(s => <TimelineSection key={s.section} title={s.section} items={s.items} />)}

        {hasMore && (
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="w-full mt-2 py-2 text-xs font-medium text-primary hover:underline"
          >
            Load more events ({grouped.length - visibleCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
}