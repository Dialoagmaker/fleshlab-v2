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
  return {
    id: m.id,
    title: m.title,
    type: m.mission_type,
    description: m.description,
    reason: m.reason,
    difficulty: m.difficulty,
    priority: m.priority,
    status: m.status || "active",
    started_at: m.started_at,
    completed_at: m.completed_at,
    revenue: money(m.expected_revenue_usd),
    minutes,
    steps: parseJson(m.steps_json, []),
    equipment: parseJson(m.equipment_json, []),
    contentGoal: m.content_goal || m.description,
    aiGuidance: m.ai_guidance || m.reason,
    mediaUrl: related?.thumbnail_url || null,
    sourceTitle: related?.title || null
  };
}

function buildMomentum(evidence, planItems = [], mission) {
  if (!evidence) return [];
  const library = evidence.library || {};
  const performance = evidence.performance || {};
  const activity = evidence.activity || {};
  const completedPlans = planItems.filter(i => i.status === "completed").length;
  return [
    { label: "Production", value: library.video_count ? clamp((library.upload_count_30d || 0) / 8 * 100 + (mission?.status === "completed" ? 10 : 0)) : null, reason: "upload frequency, completed missions and filming rhythm", breakdown: [`Videos in library: ${library.video_count || 0}`, `Uploads in 30 days: ${library.upload_count_30d || 0}`, `Mission state: ${mission?.status || "none"}`] },
    { label: "Fans", value: activity.fan_requests_total || performance.likes || performance.favourites ? clamp((activity.fan_requests_7d || 0) * 18 + (performance.likes || 0) / 50) : null, reason: "engagement, requests and fan activity", breakdown: [`Fan requests total: ${activity.fan_requests_total || 0}`, `Fan requests 7d: ${activity.fan_requests_7d || 0}`, `Likes: ${performance.likes || 0}`] },
    { label: "Revenue", value: performance.gross_revenue_usd ? clamp((performance.revenue_last_7d_usd || 0) / Math.max(performance.gross_revenue_usd, 1) * 180) : null, reason: "purchases, payout trend and conversion", breakdown: [`Gross revenue: $${Math.round(performance.gross_revenue_usd || 0)}`, `Revenue 7d: $${Math.round(performance.revenue_last_7d_usd || 0)}`, `Sales: ${performance.sales_count || 0}`] },
    { label: "Consistency", value: library.video_count ? clamp((library.upload_count_30d || 0) / 4 * 100 + completedPlans * 5) : null, reason: "scheduled actions, missed actions and streak", breakdown: [`Completed plan items today: ${completedPlans}`, `Scheduled plan items: ${planItems.length}`, `Uploads in 30 days: ${library.upload_count_30d || 0}`] }
  ];
}

function buildPlan(os) {
  return (os?.plan_items || []).map(item => ({ id: item.id, time: item.time, label: item.label, status: item.status || "open", done: item.status === "completed" }));
}

function buildTrends(evidence) {
  const cards = evidence?.performance?.top_video_cards || [];
  return cards.slice(0,3).map((v, i) => ({ rank: i + 1, title: v.title, mediaUrl: v.thumbnail_url, metric: v.sales_count ? `${v.sales_count} purchases` : v.views ? `${v.views} views` : v.revenue_usd ? `$${Math.round(v.revenue_usd)} revenue` : "Performance signal", evidence: [`Revenue: $${Math.round(v.revenue_usd || 0)}`, `Views: ${v.views || 0}`, `Purchases: ${v.sales_count || 0}`] }));
}

function buildSeries(os, evidence) {
  const series = parseJson(os?.library?.series_json, evidence?.taxonomy?.series || []);
  return (series || []).slice(0,3).map(s => ({ name: s.name, episodes: s.episodes_detected || 0, missing: s.missing_next_episode || null, progress: s.missing_next_episode ? clamp((s.episodes_detected || 0) / Math.max(s.missing_next_episode, 1) * 100) : 100, videoIds: s.video_ids || [] }));
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
  const plan = buildPlan(os);
  const mission = buildMission(os, evidence);
  return {
    briefing: os.briefing || null,
    mission,
    momentum: buildMomentum(evidence, plan, mission),
    plan,
    trends: buildTrends(evidence),
    series: buildSeries(os, evidence),
    library: buildLibrary(os),
    recommendations: os.recommendations || [],
    evidence,
    revenue: {
      value: money(os?.briefing?.revenue_last_7d_usd) || money(evidence?.performance?.revenue_last_7d_usd) || money(payout?.summary?.current_month_earned_usd),
      potential: money(os?.briefing?.revenue_potential_usd),
      hasData: !!(money(os?.briefing?.revenue_last_7d_usd) || money(evidence?.performance?.gross_revenue_usd) || money(payout?.summary?.current_month_earned_usd)),
      details: {
        sourcePeriod: "Last 7 days",
        realRevenue: money(os?.briefing?.revenue_last_7d_usd) || money(evidence?.performance?.revenue_last_7d_usd) || 0,
        forecastLogic: os?.briefing?.revenue_potential_usd ? "AI potential is generated from current mission, revenue velocity, sales and library evidence." : "No AI upside shown until a briefing contains enough revenue evidence.",
        confidence: os?.briefing?.revenue_potential_usd ? "Medium" : "Insufficient data",
        assumptions: ["Uses verified earnings, purchases and stat snapshots available to Creator OS", "Does not invent revenue when no records exist"],
        supportingContent: evidence?.performance?.top_video_cards?.slice(0,3) || []
      }
    }
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