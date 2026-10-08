import { CalendarDays, CheckCircle2, Gauge, Timer, TrendingUp, Users } from "lucide-react";

export default function ExecutiveRecruitmentOverview({ metrics }) {
  return (
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Card Icon={CalendarDays} label="Applications today" value={metrics.applicationsToday} />
      <Card Icon={Users} label="Qualified" value={metrics.qualified} />
      <Card Icon={CheckCircle2} label="Approval rate" value={`${metrics.approvalRate}%`} />
      <Card Icon={Timer} label="Avg review age" value={`${metrics.avgReviewAge}d`} />
      <Card Icon={Gauge} label="Active creators" value={metrics.activeCreators} />
      <Card Icon={TrendingUp} label="Forecast" value={metrics.qualified ? `${Math.ceil(metrics.qualified * 0.35)} likely` : "No signal"} />
    </section>
  );
}

function Card({ Icon, label, value }) {
  return <div className="rounded-xl border border-border bg-card p-4"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black text-foreground">{value}</p></div>;
}