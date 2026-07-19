import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import { AB_TESTING_ROADMAP, EXPERIMENT_MATRIX, MONTHLY_OPTIMIZATION_FRAMEWORK, QUALITY_METRICS, RECRUITMENT_ASSUMPTIONS, RECRUITMENT_FUNNEL_STAGES } from "@/lib/recruitmentOptimization";
import { AlertCircle, BarChart3, Clock3, Globe2, Loader2, Target, TrendingDown, Users } from "lucide-react";

const EVENT_BY_STAGE = {
  landing: "recruitment_landing_viewed",
  hero_interaction: "recruitment_hero_interaction",
  why_viewed: "recruitment_why_viewed",
  proof_viewed: "recruitment_proof_viewed",
  creator_path_selected: "recruitment_creator_path_selected",
  private_intake_started: "recruitment_private_intake_started",
  private_intake_completed: "recruitment_private_intake_completed",
  verification_started: "recruitment_verification_started",
  verification_completed: "recruitment_verification_completed",
  application_submitted: "recruitment_application_submitted",
};

function safeMeta(event) { try { return JSON.parse(event.metadata_json || "{}"); } catch { return {}; } }
function pct(value, total) { return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0.0%"; }
function countBy(items, getter) { return items.reduce((acc, item) => { const key = getter(item) || "Unknown"; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); }

function Card({ title, value, hint, Icon }) {
  return <div className="rounded-xl border border-border bg-card p-4"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-black text-foreground">{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>;
}

export default function RecruitmentIntelligence() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useQuery({
    queryKey: ["recruitment-intelligence", days],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - days * 86400000).toISOString();
      const [eventsRaw, applicationsRaw, performersRaw] = await Promise.all([
        base44.asServiceRole.entities.ConversionEvent.list("-created_date", 5000),
        base44.asServiceRole.entities.GuestProductionApplication.list("-created_date", 1000),
        base44.asServiceRole.entities.Performer.list("-created_date", 1000),
      ]);
      const events = eventsRaw.filter((e) => e.created_date >= cutoff && e.event_name?.startsWith("recruitment_"));
      const applications = applicationsRaw.filter((a) => a.created_date >= cutoff && (a.request_type === "performer_application" || String(a.source_page || "").includes("performer")));
      const performers = performersRaw.filter((p) => p.created_date >= cutoff);
      const byName = countBy(events, (e) => e.event_name);
      const stages = RECRUITMENT_FUNNEL_STAGES.map(([key, label]) => ({ key, label, count: byName[EVENT_BY_STAGE[key]] || (key === "approved" ? applications.filter(a => ["approved", "performer_created", "user_linked", "active"].includes(a.status)).length : key === "active_90d" ? performers.filter(p => p.status === "active").length : 0) }));
      let maxDrop = { index: null, value: 0 };
      for (let i = 1; i < stages.length; i++) { const loss = stages[i - 1].count - stages[i].count; if (loss > maxDrop.value) maxDrop = { index: i, value: loss }; }
      const completed = byName.recruitment_application_submitted || applications.length;
      const approved = applications.filter(a => ["approved", "performer_created", "user_linked", "active"].includes(a.status)).length;
      const reviewed = applications.filter(a => a.review_started_at || a.approved_at || a.rejected_at).length;
      const pathCounts = countBy(events.filter(e => e.event_name === "recruitment_creator_path_selected"), (e) => safeMeta(e).creator_path);
      const countryCounts = countBy(events, (e) => safeMeta(e).country || safeMeta(e).source_country);
      const sourceCounts = countBy(events, (e) => safeMeta(e).utm_source || safeMeta(e).referrer || "direct");
      const faqCounts = countBy(events.filter(e => e.event_name === "recruitment_credibility_faq_opened"), (e) => safeMeta(e).faq_topic);
      return { stages, maxDrop, events: events.length, completed, approved, reviewed, applications: applications.length, approvalRate: pct(approved, applications.length), reviewRate: pct(reviewed, applications.length), pathCounts, countryCounts, sourceCounts, faqCounts, dateRange: `${new Date(cutoff).toLocaleDateString()} → ${new Date().toLocaleDateString()}` };
    },
    refetchInterval: 60000,
  });

  return <><SEOMeta title="Recruitment Intelligence — FLESHLAB Admin" noIndex={true} /><div className="max-w-6xl space-y-6"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><BarChart3 className="h-6 w-6 text-primary" />Recruitment Intelligence</h1><p className="mt-1 text-sm text-muted-foreground">{data ? data.dateRange : "Measuring recruitment behaviour"}</p></div><div className="flex gap-2">{[7, 30, 90].map(d => <button key={d} onClick={() => setDays(d)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${days === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>{d}d</button>)}</div></div>{isLoading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}{error && <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive"><AlertCircle className="h-5 w-5" />{error.message}</div>}{data && <><div className="grid gap-3 md:grid-cols-4"><Card Icon={Users} title="Applications" value={data.applications} hint="Performer requests in range" /><Card Icon={Target} title="Approval rate" value={data.approvalRate} hint={`${data.approved} approved`} /><Card Icon={Clock3} title="Review coverage" value={data.reviewRate} hint={`${data.reviewed} reviewed or started`} /><Card Icon={Globe2} title="Tracked events" value={data.events} hint="Recruitment behaviour signals" /></div><div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-xl border border-border bg-card p-5"><h2 className="mb-5 font-bold text-foreground">Live recruitment funnel</h2><div className="space-y-4">{data.stages.map((stage, i) => <div key={stage.key} className={data.maxDrop.index === i ? "rounded-lg ring-2 ring-amber-500/30" : ""}><div className="mb-1 flex justify-between text-sm"><span className="font-medium text-foreground">{stage.label}</span><span className="font-mono text-muted-foreground">{stage.count} · {pct(stage.count, data.stages[0]?.count || 0)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: pct(stage.count, data.stages[0]?.count || 0) }} /></div>{data.maxDrop.index === i && <p className="mt-1 flex items-center gap-1 text-xs text-amber-400"><TrendingDown className="h-3 w-3" />Largest drop-off from previous stage</p>}</div>)}</div></div><div className="space-y-4"><Breakdown title="Creator path selection" items={data.pathCounts} /><Breakdown title="Country breakdown" items={data.countryCounts} /><Breakdown title="Traffic source quality" items={data.sourceCounts} /><Breakdown title="Most-opened objections" items={data.faqCounts} /></div></div><div className="grid gap-6 lg:grid-cols-2"><ListPanel title="Assumption Register" items={RECRUITMENT_ASSUMPTIONS.map(a => `${a.section}: ${a.assumption} — metric: ${a.success_metric}`)} /><ListPanel title="Experiment Matrix" items={EXPERIMENT_MATRIX.map(e => `${e.priority}: ${e.key} — ${e.metric}`)} /><ListPanel title="A/B Testing Roadmap" items={AB_TESTING_ROADMAP} /><ListPanel title="Quality Metrics" items={QUALITY_METRICS} /><ListPanel title="Monthly Optimization Framework" items={MONTHLY_OPTIMIZATION_FRAMEWORK} /><ListPanel title="Prioritized Backlog" items={["Persist all recruitment funnel events", "Connect application status changes to approval and rejection metrics", "Add first-production and first-publication events from creator ops", "Compare experiment variants against applicant quality", "Schedule monthly optimization review"]} /></div></>}</div></>;
}

function Breakdown({ title, items }) {
  const rows = Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return <div className="rounded-xl border border-border bg-card p-4"><h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>{rows.length ? rows.map(([label, value]) => <div key={label} className="mb-2 flex justify-between gap-3 text-xs"><span className="truncate text-muted-foreground">{label}</span><span className="font-mono text-foreground">{value}</span></div>) : <p className="text-xs text-muted-foreground">No data yet.</p>}</div>;
}

function ListPanel({ title, items }) {
  return <div className="rounded-xl border border-border bg-card p-5"><h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3><ul className="space-y-2">{items.map(item => <li key={item} className="text-xs leading-5 text-muted-foreground">• {item}</li>)}</ul></div>;
}