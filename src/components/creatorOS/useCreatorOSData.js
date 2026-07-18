import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const parseJson = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n || 0))));
const money = (n) => Number.isFinite(Number(n)) && Number(n) > 0 ? Number(n) : null;

function evidenceFrom(os) {
  return parseJson(os?.briefing?.evidence_json, null) || parseJson(os?.mission?.evidence_json, null) || parseJson(os?.library?.evidence_json, null) || parseJson(os?.recommendations?.[0]?.source_data_json, null) || null;
}

function buildMission(os, evidence) {
  const m = os?.mission;
  if (!m) return null;
  const minutes = m.production_time_hours ? Math.round(Number(m.production_time_hours) * 60) : null;
  const related = evidence?.performance?.top_video_cards?.find(v => v.thumbnail_url) || evidence?.recent_videos?.find(v => v.thumbnail_url);
  return { title: m.title, type: m.mission_type, description: m.description, reason: m.reason, difficulty: m.difficulty, priority: m.priority, revenue: money(m.expected_revenue_usd), minutes, mediaUrl: related?.thumbnail_url || null, sourceTitle: related?.title || null };
}

function buildMomentum(evidence) {
  if (!evidence) return [];
  const library = evidence.library || {};
  const performance = evidence.performance || {};
  const activity = evidence.activity || {};
  return [
    { label: "Production", value: library.video_count ? clamp((library.upload_count_30d || 0) / 8 * 100) : null, reason: "upload consistency" },
    { label: "Fans", value: activity.fan_requests_total || performance.likes || performance.favourites ? clamp((activity.fan_requests_7d || 0) * 18 + (performance.likes || 0) / 50) : null, reason: "fan behaviour" },
    { label: "Revenue", value: performance.gross_revenue_usd ? clamp((performance.revenue_last_7d_usd || 0) / Math.max(performance.gross_revenue_usd, 1) * 180) : null, reason: "earnings velocity" },
    { label: "Consistency", value: library.video_count ? clamp((library.upload_count_30d || 0) / 4 * 100) : null, reason: "creator habits" }
  ];
}

function buildPlan(os) {
  const tasks = parseJson(os?.briefing?.open_tasks_json, []);
  if (tasks?.length) return tasks.slice(0,4).map((task, i) => ({ time: ["09:00","11:30","14:00","18:00"][i], label: task, done: i === 0 }));
  if (!os?.mission) return [];
  return ["Prepare: " + os.mission.title, "Produce mission", "Upload draft", "Review AI recommendation"].map((label, i) => ({ time: ["09:00","11:30","14:00","18:00"][i], label, done: false }));
}

function buildTrends(evidence) {
  const cards = evidence?.performance?.top_video_cards || [];
  return cards.slice(0,3).map((v, i) => ({ rank: i + 1, title: v.title, mediaUrl: v.thumbnail_url, metric: v.sales_count ? `${v.sales_count} purchases` : v.views ? `${v.views} views` : v.revenue_usd ? `$${Math.round(v.revenue_usd)} revenue` : "Performance signal" }));
}

function buildSeries(os, evidence) {
  const series = parseJson(os?.library?.series_json, evidence?.taxonomy?.series || []);
  return (series || []).slice(0,3).map(s => ({ name: s.name, episodes: s.episodes_detected || 0, missing: s.missing_next_episode || null, progress: s.missing_next_episode ? clamp((s.episodes_detected || 0) / Math.max(s.missing_next_episode, 1) * 100) : 100 }));
}

function buildLibrary(os) {
  const lib = os?.library;
  if (!lib) return [];
  return [
    { label: "Missing", value: parseJson(lib.missing_categories_json, []).slice(0,2).join(", ") },
    { label: "Balance", value: lib.genre_balance },
    { label: "Freshness", value: lib.library_freshness }
  ].filter(x => x.value);
}

export function normalizeCreatorOS(raw, payout) {
  const os = raw || {};
  const evidence = evidenceFrom(os);
  return {
    briefing: os.briefing || null,
    mission: buildMission(os, evidence),
    momentum: buildMomentum(evidence),
    plan: buildPlan(os),
    trends: buildTrends(evidence),
    series: buildSeries(os, evidence),
    library: buildLibrary(os),
    recommendations: os.recommendations || [],
    revenue: { value: money(os?.briefing?.revenue_last_7d_usd) || money(evidence?.performance?.revenue_last_7d_usd) || money(payout?.summary?.current_month_earned_usd), potential: money(os?.briefing?.revenue_potential_usd), hasData: !!(money(os?.briefing?.revenue_last_7d_usd) || money(evidence?.performance?.gross_revenue_usd) || money(payout?.summary?.current_month_earned_usd)) }
  };
}

export function useCreatorOSData(performerId, performerToken) {
  return useQuery({
    queryKey: ["creator-os-live", performerId],
    enabled: !!performerId && !!performerToken,
    queryFn: async () => {
      const [os, payout] = await Promise.all([
        base44.functions.invoke("creatorOSService", { action: "get_creator_os", performer_id: performerId, performer_token: performerToken, auto_generate: true }),
        base44.functions.invoke("performerDashboardService", { action: "get_payout_summary", performer_id: performerId, performer_token: performerToken })
      ]);
      return { raw: os.data || {}, payout: payout.data || {}, live: normalizeCreatorOS(os.data || {}, payout.data || {}) };
    }
  });
}