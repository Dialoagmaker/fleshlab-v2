import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, Shield } from "lucide-react";

function parseJson(value, fallback = []) {
  try { return JSON.parse(value || ""); } catch (_) { return fallback; }
}

function Stat({ label, value, icon: Icon, tone = "text-foreground" }) {
  return <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p></div><Icon className="h-7 w-7 text-primary" /></div></CardContent></Card>;
}

export default function StudioAudit() {
  const [audits, setAudits] = useState([]);
  const [running, setRunning] = useState(false);

  const load = async () => {
    const rows = await base44.entities.StudioAuditResult.list("-audit_timestamp", 100);
    setAudits(rows || []);
  };

  const runAudit = async () => {
    setRunning(true);
    await base44.functions.invoke("studioAuditSystem", { action: "run", trigger: "admin_dashboard" });
    await load();
    setRunning(false);
  };

  useEffect(() => { load(); }, []);

  const latest = audits[0];
  const reports = useMemo(() => parseJson(latest?.category_reports_json, []), [latest]);
  const warnings = useMemo(() => parseJson(latest?.warnings_json, []), [latest]);
  const critical = useMemo(() => parseJson(latest?.critical_issues_json, []), [latest]);
  const recommendations = useMemo(() => parseJson(latest?.recommendations_json, []), [latest]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">Studio Audit</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">Operational Health Authority</h1>
          <p className="mt-1 text-muted-foreground">Independent Studio QA for platform health, governance, memory, rendering, publishing and readiness.</p>
        </div>
        <Button onClick={runAudit} disabled={running}><RefreshCw className="h-4 w-4" />{running ? "Running Audit" : "Run Studio Audit"}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Studio Health" value={latest ? `${Math.round(latest.overall_health_score)}/100` : "—"} icon={Shield} tone="text-primary" />
        <Stat label="Readiness" value={latest?.production_readiness || "No Audit"} icon={CheckCircle2} />
        <Stat label="Critical" value={critical.length} icon={AlertTriangle} tone={critical.length ? "text-destructive" : "text-foreground"} />
        <Stat label="Warnings" value={warnings.length} icon={Activity} />
        <Stat label="Duration" value={latest ? `${Math.round(latest.duration_ms || 0)}ms` : "—"} icon={Clock} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Subsystem Health</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="py-3 pr-4">Subsystem</th><th className="py-3 pr-4">Health</th><th className="py-3 pr-4">Risk</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Last Validation</th></tr></thead>
              <tbody>
                {reports.map(item => <tr key={item.category} className="border-b border-border/60"><td className="py-3 pr-4 font-semibold text-foreground">{item.category}</td><td className="py-3 pr-4 font-bold">{Math.round(item.health)}/100</td><td className="py-3 pr-4"><Badge variant={item.risk_level === "critical" || item.risk_level === "high" ? "destructive" : "secondary"}>{item.risk_level}</Badge></td><td className="py-3 pr-4 text-muted-foreground">{item.status}</td><td className="py-3 pr-4 text-xs text-muted-foreground">{item.last_successful_validation ? new Date(item.last_successful_validation).toLocaleString() : "—"}</td></tr>)}
                {!reports.length && <tr><td colSpan="5" className="py-8 text-center text-muted-foreground">Run the first Studio Audit to populate subsystem health.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Critical Failures</CardTitle></CardHeader><CardContent className="space-y-2">{critical.map((item, index) => <div key={index} className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm"><b>{item.category}</b><p>{item.message}</p></div>)}{!critical.length && <p className="text-sm text-muted-foreground">No critical failures in the latest audit.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Recommended Actions</CardTitle></CardHeader><CardContent className="space-y-2">{recommendations.slice(0, 8).map((item, index) => <div key={index} className="rounded-lg border border-border bg-secondary/30 p-3 text-sm"><b>{item.category}</b><p className="text-muted-foreground">{item.message}</p></div>)}{!recommendations.length && <p className="text-sm text-muted-foreground">No recommendations yet.</p>}</CardContent></Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Trend History</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-5">
          {audits.slice(0, 10).map(audit => <div key={audit.id} className="rounded-lg border border-border bg-card p-3"><p className="text-lg font-black text-foreground">{Math.round(audit.overall_health_score)}/100</p><p className="text-xs text-muted-foreground">{audit.production_readiness}</p><p className="mt-2 text-[10px] text-muted-foreground">{new Date(audit.audit_timestamp).toLocaleString()}</p></div>)}
        </CardContent>
      </Card>
    </div>
  );
}