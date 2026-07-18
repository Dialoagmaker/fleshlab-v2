import { ArrowLeft, BadgeDollarSign, Bell, BookOpen, CalendarDays, Clock, Heart, Settings, Share2, Target, UserRound, Video } from "lucide-react";

const list = (items = []) => items?.length ? <ul>{items.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul> : <p>No data available yet.</p>;
const money = (n) => `$${Math.round(Number(n || 0)).toLocaleString()}`;

function MissionSection({ mission, onMissionAction }) {
  const canStart = mission && ["active", "accepted", "paused"].includes(mission.status || "active");
  const canPause = mission?.status === "in_progress";
  const canResume = mission?.status === "paused";
  const canComplete = mission && ["in_progress", "paused"].includes(mission.status);
  return <div className="flos-detail-grid"><article><h3><Target /> Mission status</h3><p>{mission?.title || "No mission available yet. Creator OS will generate one from the next briefing."}</p><small>{mission?.status || "pending"}</small><div className="flos-detail-actions"><button disabled={!canStart} onClick={() => onMissionAction("start")}>Begin</button><button disabled={!canPause} onClick={() => onMissionAction("pause")}>Pause</button><button disabled={!canResume} onClick={() => onMissionAction("resume")}>Resume</button><button disabled={!canComplete} onClick={() => onMissionAction("complete")}>Complete</button></div></article><article><h3><Video /> Mission steps</h3>{list(mission?.steps)}</article><article><h3><Clock /> Equipment and duration</h3>{list(mission?.equipment)}<small>{mission?.minutes ? `${mission.minutes} minutes estimated` : "No duration yet"}</small></article><article><h3><BookOpen /> Content goal</h3><p>{mission?.contentGoal || "No content goal available yet."}</p><h3>AI guidance</h3><p>{mission?.aiGuidance || "AI guidance appears after the mission is generated."}</p></article></div>;
}

function LibrarySection({ live, onNavigate }) {
  return <div className="flos-detail-grid"><article><h3><BookOpen /> Library signals</h3>{live.library?.length ? live.library.map(x => <p key={x.label}><b>{x.label}</b>: {x.value}</p>) : <p>No library signals yet. Publish or analyze more content, then refresh Creator OS.</p>}</article><article><h3>Series</h3>{live.series?.length ? live.series.map(s => <button key={s.name} onClick={() => onNavigate("library", s)}>{s.name} — {s.progress}%</button>) : <p>No recurring series detected yet.</p>}</article></div>;
}

function FansSection({ live, evidence, onNavigate }) {
  const activity = evidence?.activity || {};
  const performance = evidence?.performance || {};
  return <div className="flos-detail-grid"><article><h3><Heart /> Fan activity</h3><p>Requests total: {activity.fan_requests_total || 0}</p><p>Requests this week: {activity.fan_requests_7d || 0}</p><p>Likes: {performance.likes || 0}</p><p>Favourites: {performance.favourites || 0}</p></article><article><h3>Trending content</h3>{live.trends?.length ? live.trends.map(t => <button key={t.title} onClick={() => onNavigate("fans", t)}>{t.title} — {t.metric}</button>) : <p>No fan trend has enough evidence yet.</p>}</article></div>;
}

function MoneySection({ revenue = {} }) {
  const details = revenue.details || { sourcePeriod: "No active period", realRevenue: 0, confidence: "Insufficient data", forecastLogic: "Creator OS needs earnings, purchases, or stat snapshots before it can forecast revenue.", assumptions: [], supportingContent: [] };
  return <div className="flos-detail-grid"><article><h3><BadgeDollarSign /> Revenue details</h3><p>Source period: {details.sourcePeriod}</p><p>Real revenue: {money(details.realRevenue)}</p><p>Confidence: {details.confidence}</p><p>{details.forecastLogic}</p></article><article><h3>Assumptions</h3>{list(details.assumptions)}<h3>Supporting content</h3>{details.supportingContent?.length ? details.supportingContent.map(v => <p key={v.id || v.title}>{v.title} — {money(v.revenue_usd)}</p>) : <p>No supporting revenue content yet.</p>}</article></div>;
}

function AISection({ live, onRecommendationAction }) {
  return <div className="flos-detail-grid"><article><h3>AI workspace</h3><p>Use the AI Producer panel to ask questions. It receives performer, mission, briefing, recommendation, revenue, library and fan context.</p></article><article><h3>Recommendations</h3>{live.recommendations?.length ? live.recommendations.map(rec => <div key={rec.id} className="flos-rec-row"><b>{rec.title}</b><small>{rec.status || "active"}</small><button onClick={() => onRecommendationAction("convert_to_mission", rec)}>Convert to mission</button><button onClick={() => onRecommendationAction("complete", rec)}>Mark acted upon</button></div>) : <p>No active recommendations.</p>}</article></div>;
}

export default function CreatorOSDetailWorkspace({ space, detail, live = {}, performer, onNavigate, onMissionAction, onRecommendationAction }) {
  const mission = live.mission;
  const evidence = live.evidence || {};
  const titleMap = { create: "Production Mission", library: "Library Intelligence", fans: "Fan Intelligence", money: "Revenue Planner", ai: "AI Producer Workspace", calendar: "Production Calendar", me: "Creator Profile", settings: "Creator Settings", notifications: "Notifications", share: "Share Profile" };
  if (space === "today") return null;
  return <section className="flos-workspace-detail"><button type="button" className="flos-back" onClick={() => onNavigate("today")}><ArrowLeft /> Back to Today</button><h2>{titleMap[space] || "Creator OS Detail"}</h2>{space === "create" && <MissionSection mission={mission} onMissionAction={onMissionAction} />}{space === "library" && <LibrarySection live={live} onNavigate={onNavigate} />}{space === "fans" && <FansSection live={live} evidence={evidence} onNavigate={onNavigate} />}{space === "money" && <MoneySection revenue={live.revenue} />}{space === "ai" && <AISection live={live} onRecommendationAction={onRecommendationAction} />}{space === "calendar" && <div className="flos-detail-grid"><article><h3><CalendarDays /> Today</h3>{live.plan?.length ? live.plan.map(item => <p key={item.id}>{item.time} — {item.label} ({item.status})</p>) : <p>No scheduled plan items yet.</p>}</article></div>}{space === "me" && <div className="flos-detail-grid"><article><h3><UserRound /> Profile state</h3><p>{performer?.display_name || "Creator"}</p><p>Status: {performer?.account_status || performer?.status || "active"}</p><p>KYC: {performer?.kyc_status || "not available"}</p></article></div>}{space === "settings" && <div className="flos-detail-grid"><article><h3><Settings /> Settings</h3><p>Creator settings are available from this workspace. No separate settings form is configured yet.</p></article></div>}{space === "notifications" && <div className="flos-detail-grid"><article><h3><Bell /> Notifications</h3><p>No unread Creator OS notifications in this session.</p></article></div>}{space === "share" && <div className="flos-detail-grid"><article><h3><Share2 /> Share profile</h3><p>Profile sharing tools open here when a public creator profile is available.</p></article></div>}{detail && <aside className="flos-detail-side"><h3>Selected evidence</h3><pre>{JSON.stringify(detail, null, 2)}</pre></aside>}</section>;
}