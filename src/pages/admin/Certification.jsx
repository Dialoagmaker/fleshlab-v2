import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, BarChart3, CheckCircle2, Clock, RefreshCw, ShieldAlert, XCircle } from "lucide-react";

function parseJson(value, fallback = []) { try { return JSON.parse(value || ""); } catch (_) { return fallback; } }

function Stat({ label, value, icon: Icon, tone = "text-foreground" }) {
  return <Card><CardContent className="p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p></div><Icon className="h-7 w-7 text-primary" /></div></CardContent></Card>;
}

export default function Certification() {
  const [history, setHistory] = useState([]);
  const [config, setConfig] = useState(null);
  const [running, setRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(5);

  const load = async () => {
    const [certs, configs] = await Promise.all([
      base44.entities.StudioCertificationResult.list("-timestamp", 100),
      base44.entities.StudioCertificationConfig.list("-created_date", 1).catch(() => [])
    ]);
    setHistory(certs || []);
    setConfig(configs?.[0] || null);
  };

  const runCertification = async () => {
    setRunning(true);
    await base44.functions.invoke("certificationSuite", { action: "run", trigger: "admin_dashboard", stress_batch_size: batchSize });
    await load();
    setRunning(false);
  };

  const toggleGate = async () => {
    const next = !config?.release_gate_required;
    if (config?.id) {
      await base44.entities.StudioCertificationConfig.update(config.id, { release_gate_required: next, last_updated_at: new Date().toISOString() });
    } else {
      await base44.entities.StudioCertificationConfig.create({ config_key: "release_gate", release_gate_required: next, required_status: "CERTIFIED", minimum_score: 90, last_updated_at: new Date().toISOString() });
    }
    await load();
  };

  useEffect(() => { load(); }, []);

  const latest = history[0];
  const subsystemScores = useMemo(() => parseJson(latest?.subsystem_scores_json, {}), [latest]);
  const failed = useMemo(() => parseJson(latest?.failed_tests_json, []), [latest]);
  const passed = useMemo(() => parseJson(latest?.passed_tests_json, []), [latest]);
  const warnings = useMemo(() => parseJson(latest?.warnings_json, []), [latest]);
  const stress = useMemo(() => parseJson(latest?.stress_metrics_json, {}), [latest]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">Certification Suite</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">Final Production-Readiness Validation</h1>
          <p className="mt-1 text-muted-foreground">End-to-end certification across creative, governance, rendering, QA, publishing, memory, audit, analytics and registry systems.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stress batch <input type="number" min="1" max="50" value={batchSize} onChange={e => setBatchSize(e.target.value)} className="ml-2 w-20 rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground" /></label>
          <Button onClick={runCertification} disabled={running}><RefreshCw className="h-4 w-4" />{running ? "Certifying" : "Run Certification"}</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Overall Certification" value={latest?.certification_status || "No Certification"} icon={Award} tone={latest?.certification_status === "NOT CERTIFIED" ? "text-destructive" : "text-primary"} />
        <Stat label="Score" value={latest ? `${Math.round(latest.overall_certification_score)}/100` : "—"} icon={BarChart3} />
        <Stat label="Passed Tests" value={passed.length} icon={CheckCircle2} />
        <Stat label="Failed Tests" value={failed.length} icon={XCircle} tone={failed.length ? "text-destructive" : "text-foreground"} />
        <Stat label="Execution" value={latest ? `${Math.round(latest.execution_time_ms || 0)}ms` : "—"} icon={Clock} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div><p className="font-bold text-foreground">Release Gate</p><p className="text-sm text-muted-foreground">Require a successful certification before major platform updates.</p></div>
          <div className="flex items-center gap-3"><Badge variant={config?.release_gate_required ? "default" : "secondary"}>{config?.release_gate_required ? "Required" : "Not Required"}</Badge><Button variant="outline" onClick={toggleGate}>{config?.release_gate_required ? "Disable Gate" : "Require Certification"}</Button></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Subsystem Results</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{Object.entries(subsystemScores).map(([name, score]) => <div key={name} className="rounded-lg border border-border bg-card p-3"><p className="text-sm font-semibold text-foreground">{name}</p><p className="mt-2 text-2xl font-black text-primary">{Math.round(score)}/100</p></div>)}{!Object.keys(subsystemScores).length && <p className="text-sm text-muted-foreground">Run certification to populate subsystem results.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Stress Metrics</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{Object.entries(stress).map(([key, value]) => <div key={key} className="flex justify-between gap-3 border-b border-border/50 py-2"><span className="text-muted-foreground">{key.replaceAll("_", " ")}</span><b>{String(value)}</b></div>)}</CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Failed Tests</CardTitle></CardHeader><CardContent className="space-y-2">{failed.map((test, index) => <div key={index} className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm"><div className="flex items-center justify-between gap-3"><b>{test.domain} · {test.name}</b><Badge variant={test.severity === "critical" ? "destructive" : "secondary"}>{test.severity}</Badge></div><p className="mt-1 text-muted-foreground">{test.message}</p>{test.recommendation && <p className="mt-2 text-foreground">Action: {test.recommendation}</p>}</div>)}{!failed.length && <p className="text-sm text-muted-foreground">No failed tests in the latest certification.</p>}</CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Warnings</CardTitle></CardHeader><CardContent className="space-y-2">{warnings.map((item, index) => <div key={index} className="rounded-lg border border-border bg-secondary/30 p-3 text-sm"><ShieldAlert className="mb-2 h-4 w-4 text-primary" /><b>{item.domain}</b><p className="text-muted-foreground">{item.message}</p></div>)}{!warnings.length && <p className="text-sm text-muted-foreground">No warnings in the latest certification.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Certification History</CardTitle></CardHeader><CardContent className="grid gap-2 md:grid-cols-2">{history.slice(0, 10).map(item => <div key={item.id} className="rounded-lg border border-border bg-card p-3"><p className="font-black text-foreground">{item.certification_status}</p><p className="text-sm text-primary">{Math.round(item.overall_certification_score)}/100</p><p className="mt-2 text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p></div>)}</CardContent></Card>
      </div>
    </div>
  );
}