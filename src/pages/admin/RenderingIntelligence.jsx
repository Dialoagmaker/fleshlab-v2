import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Activity, Brain, CheckCircle2, Gauge, ShieldAlert, Zap } from "lucide-react";

function pct(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function avg(items, field) {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + Number(item[field] || 0), 0) / items.length;
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p><p className="text-2xl font-black text-foreground">{value}</p></div>
      </CardContent>
    </Card>
  );
}

export default function RenderingIntelligence() {
  const [providers, setProviders] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [providerRows, attemptRows] = await Promise.all([
      base44.entities.RenderingProvider.list("priority", 100),
      base44.entities.RenderingAttempt.list("-created_date", 500),
    ]);
    setProviders(providerRows || []);
    setAttempts(attemptRows || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const providerStats = useMemo(() => providers.map(provider => {
    const rows = attempts.filter(attempt => attempt.provider_id === provider.provider_id);
    const successes = rows.filter(row => row.result === "success").length;
    const rejects = rows.filter(row => row.result === "policy_reject").length;
    const total = rows.length || 1;
    return {
      ...provider,
      total_attempts: rows.length,
      success_rate: rows.length ? (successes / total) * 100 : Number(provider.historical_success_rate || 0),
      reject_rate: rows.length ? (rejects / total) * 100 : Number(provider.historical_policy_reject_rate || 0),
      average_runtime: rows.length ? avg(rows, "runtime_ms") : Number(provider.average_runtime_ms || 0),
      average_cost: rows.length ? avg(rows, "cost") : Number(provider.estimated_cost || 0),
      average_quality: rows.length ? avg(rows, "quality_score") : Number(provider.estimated_quality || 0),
      average_rating: rows.length ? avg(rows, "manual_rating") : 0,
    };
  }), [providers, attempts]);

  const toggleProvider = async (provider) => {
    await base44.entities.RenderingProvider.update(provider.id, { enabled: !provider.enabled });
    await load();
  };

  const summary = {
    enabled: providers.filter(p => p.enabled).length,
    attempts: attempts.length,
    success: attempts.length ? Math.round((attempts.filter(a => a.success).length / attempts.length) * 100) : 0,
    reject: attempts.length ? Math.round((attempts.filter(a => a.result === "policy_reject").length / attempts.length) * 100) : 0,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">FLESHLAB AI Media Studio</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">Rendering Intelligence</h1>
        <p className="mt-2 max-w-4xl text-muted-foreground">Admin-only production routing dashboard for provider capability, failover performance, and routing memory.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Enabled Providers" value={summary.enabled} icon={Zap} />
        <StatCard label="Logged Attempts" value={summary.attempts} icon={Activity} />
        <StatCard label="Success Rate" value={`${summary.success}%`} icon={CheckCircle2} />
        <StatCard label="Policy Reject" value={`${summary.reject}%`} icon={ShieldAlert} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Provider Capability Registry</CardTitle>
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground"><th className="py-3">Provider</th><th>Status</th><th>Enabled</th><th>Historical Success</th><th>Policy Reject</th><th>Avg Runtime</th><th>Avg Cost</th><th>Avg Quality</th><th>Avg Rating</th><th>Current Availability</th><th>Recommended Usage</th></tr></thead>
            <tbody>
              {providerStats.map(provider => (
                <tr key={provider.id} className="border-b border-border/60 align-top">
                  <td className="py-3 font-semibold text-foreground">{provider.provider_name}<p className="text-xs text-muted-foreground">{provider.provider_id}</p></td>
                  <td><Badge variant={provider.current_availability === "available" ? "outline" : "secondary"}>{provider.current_availability}</Badge></td>
                  <td><Button size="sm" variant={provider.enabled ? "default" : "outline"} onClick={() => toggleProvider(provider)}>{provider.enabled ? "Enabled" : "Disabled"}</Button></td>
                  <td>{pct(provider.success_rate)}</td>
                  <td>{pct(provider.reject_rate)}</td>
                  <td>{Math.round(provider.average_runtime || 0)}ms</td>
                  <td>${Number(provider.average_cost || 0).toFixed(4)}</td>
                  <td><span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3 text-primary" />{Math.round(provider.average_quality || 0)}</span></td>
                  <td>{Number(provider.average_rating || 0).toFixed(1)}</td>
                  <td>{provider.current_availability}</td>
                  <td className="max-w-xs text-muted-foreground">{provider.recommended_usage || "No recommendation recorded yet."}</td>
                </tr>
              ))}
              {!providerStats.length && <tr><td colSpan="11" className="py-8 text-center text-muted-foreground">Provider registry will populate after the routing engine audits available production pipelines.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}