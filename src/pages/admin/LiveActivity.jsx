import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import StatsCounters from "@/components/admin/liveActivity/StatsCounters";
import ActivityFilters from "@/components/admin/liveActivity/ActivityFilters";
import ActivityFeedTable from "@/components/admin/liveActivity/ActivityFeedTable";
import TopListsPanel from "@/components/admin/liveActivity/TopListsPanel";
import RecentErrorsPanel from "@/components/admin/liveActivity/RecentErrorsPanel";
import { rangeStart, startOfToday, parseMetadata, ERROR_EVENTS, SUPPORTED_EVENTS } from "@/lib/liveActivityHelpers";

const REFRESH_MS = 10000;
const DEFAULT_LIMIT = 100;

export default function LiveActivity() {
  const [filters, setFilters] = useState({ range: "today", eventName: "", userId: "", browser: "", device: "", country: "" });
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  // Today's events — powers stats, top lists, and recent errors regardless of feed filter.
  const { data: todayEvents = [] } = useQuery({
    queryKey: ["live-activity-today"],
    queryFn: () => base44.entities.ConversionEvent.filter(
      { created_date: { $gte: startOfToday().toISOString() } }, "-created_date", 1000
    ),
    refetchInterval: REFRESH_MS,
  });

  // Feed events — respects the selected time range + server-side filters, capped and paginated.
  const feedQuery = useMemo(() => {
    let start;
    if (filters.range === "custom" && filters.customFrom) {
      start = new Date(filters.customFrom);
    } else {
      start = rangeStart(filters.range);
    }
    const query = { created_date: { $gte: start.toISOString() } };
    if (filters.customTo) query.created_date.$lte = new Date(filters.customTo).toISOString();
    if (filters.eventName) query.event_name = filters.eventName;
    if (filters.userId) query.user_id = filters.userId;
    return query;
  }, [filters]);

  const { data: feedEventsRaw = [] } = useQuery({
    queryKey: ["live-activity-feed", feedQuery, limit],
    queryFn: () => base44.entities.ConversionEvent.filter(feedQuery, "-created_date", limit),
    refetchInterval: REFRESH_MS,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["live-activity-users"],
    queryFn: () => base44.entities.User.list(),
    staleTime: 60000,
  });

  const { data: performers = [] } = useQuery({
    queryKey: ["live-activity-performers"],
    queryFn: () => base44.entities.Performer.list(),
    staleTime: 5 * 60000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["live-activity-videos"],
    queryFn: () => base44.entities.Video.list(),
    staleTime: 5 * 60000,
  });

  const userMap = useMemo(() => {
    const map = {};
    users.forEach(u => { map[u.id] = u; });
    return map;
  }, [users]);

  const performerSlugMap = useMemo(() => {
    const map = {};
    performers.forEach(p => { map[p.slug] = p.display_name; });
    return map;
  }, [performers]);

  const videoSlugMap = useMemo(() => {
    const map = {};
    videos.forEach(v => { map[v.slug] = v.title; });
    return map;
  }, [videos]);

  // Wrap raw records as { id, created_date, data } to match analytics-friendly access pattern.
  const todayWrapped = useMemo(() => todayEvents.map(e => ({ id: e.id, created_date: e.created_date, data: e })), [todayEvents]);
  const feedWrapped = useMemo(() => feedEventsRaw.map(e => ({ id: e.id, created_date: e.created_date, data: e })), [feedEventsRaw]);

  // Client-side filters that can't be expressed server-side (stored inside metadata_json).
  const filteredFeed = useMemo(() => {
    return feedWrapped.filter(ev => {
      const meta = parseMetadata(ev.data.metadata_json);
      if (filters.browser && meta.browser !== filters.browser) return false;
      if (filters.device && meta.device_type !== filters.device) return false;
      if (filters.country && meta.country !== filters.country) return false;
      return true;
    });
  }, [feedWrapped, filters.browser, filters.device, filters.country]);

  const browserOptions = useMemo(() => {
    const set = new Set();
    todayWrapped.forEach(ev => { const m = parseMetadata(ev.data.metadata_json); if (m.browser) set.add(m.browser); });
    return Array.from(set);
  }, [todayWrapped]);

  const deviceOptions = useMemo(() => {
    const set = new Set();
    todayWrapped.forEach(ev => { const m = parseMetadata(ev.data.metadata_json); if (m.device_type) set.add(m.device_type); });
    return Array.from(set);
  }, [todayWrapped]);

  const countryOptions = useMemo(() => {
    const set = new Set();
    todayWrapped.forEach(ev => { const m = parseMetadata(ev.data.metadata_json); if (m.country) set.add(m.country); });
    return Array.from(set);
  }, [todayWrapped]);

  const topPerformers = useMemo(() => {
    const counts = {};
    todayWrapped.filter(e => e.data.event_name === "performer_profile_view").forEach(e => {
      const slug = parseMetadata(e.data.metadata_json).performer_slug;
      if (!slug) return;
      const name = performerSlugMap[slug] || slug;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [todayWrapped, performerSlugMap]);

  const topVideos = useMemo(() => {
    const counts = {};
    todayWrapped.filter(e => e.data.event_name === "video_detail_view").forEach(e => {
      const slug = parseMetadata(e.data.metadata_json).video_slug;
      if (!slug) return;
      const name = videoSlugMap[slug] || slug;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [todayWrapped, videoSlugMap]);

  const topFanclubClicks = useMemo(() => {
    const counts = {};
    todayWrapped.filter(e => e.data.event_name === "fanclub_cta_click").forEach(e => {
      const slug = parseMetadata(e.data.metadata_json).performer_slug || "general";
      const name = performerSlugMap[slug] || slug;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [todayWrapped, performerSlugMap]);

  const errorEvents = useMemo(
    () => todayWrapped.filter(e => ERROR_EVENTS.includes(e.data.event_name)),
    [todayWrapped]
  );

  return (
    <>
      <SEOMeta title="Live Activity — FLESHLAB Admin" noIndex={true} />
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time conversion event monitoring. Auto-refreshes every 10 seconds.</p>
        </div>

        <StatsCounters todayEvents={todayWrapped} />

        <TopListsPanel topPerformers={topPerformers} topVideos={topVideos} topFanclubClicks={topFanclubClicks} />

        <RecentErrorsPanel errorEvents={errorEvents} userMap={userMap} />

        <ActivityFilters
          filters={filters}
          setFilters={setFilters}
          eventOptions={SUPPORTED_EVENTS}
          browserOptions={browserOptions}
          deviceOptions={deviceOptions}
          countryOptions={countryOptions}
          userOptions={users}
        />

        <ActivityFeedTable
          events={filteredFeed}
          userMap={userMap}
          onLoadMore={() => setLimit(l => l + 100)}
          canLoadMore={feedEventsRaw.length >= limit}
        />
      </div>
    </>
  );
}