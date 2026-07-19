import { Activity, AlertTriangle, BarChart3 } from "lucide-react";

export default function PipelineHealth({ workspace }) {
  const { metrics, breakdowns, bottlenecks } = workspace;
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><h2 className="font-black text-foreground">Pipeline health</h2></div><div className="grid gap-3 sm:grid-cols-2"><Metric label="Approval rate" value={`${metrics.approvalRate}%`} /><Metric label="Waiting too long" value={metrics.waitingTooLong} /><Metric label="Ready verification" value={metrics.readyForVerification} /><Metric label="Ready production" value={metrics.readyForProduction} /><Metric label="Avg review age" value={`${metrics.avgReviewAge}d`} /><Metric label="Behaviour signals" value={metrics.eventSignals} /></div></div>
      <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" /><h2 className="font-black text-foreground">Operational bottlenecks</h2></div><div className="space-y-3">{bottlenecks.map(item => <div key={item.title} className="rounded-xl border border-border bg-background/35 p-4"><h3 className="text-sm font-bold text-foreground">{item.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p><p className="mt-2 text-xs font-bold text-primary">{item.action}</p></div>)}</div></div>
      <Breakdown title="Country performance" items={breakdowns.byCountry} />
      <Breakdown title="Creator path performance" items={breakdowns.byPath} />
      <Breakdown title="Traffic source quality" items={breakdowns.bySource} />
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-border bg-background/35 p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black text-foreground">{value}</p></div>;
}

function Breakdown({ title, items }) {
  const rows = Object.entries(items || {}).sort((a,b) => b[1] - a[1]).slice(0, 6);
  return <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="font-black text-foreground">{title}</h2></div>{rows.length ? rows.map(([label, count]) => <div key={label} className="mb-2 flex justify-between gap-3 text-sm"><span className="truncate text-muted-foreground">{label}</span><span className="font-mono text-foreground">{count}</span></div>) : <p className="text-sm text-muted-foreground">No data yet.</p>}</div>;
}