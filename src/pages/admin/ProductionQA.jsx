import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, TrendingUp, BarChart3, RefreshCw } from "lucide-react";

function score(value) {
  return typeof value === "number" ? value.toFixed(1) : "0.0";
}

function StatCard({ title, value, icon: Icon, tone = "text-foreground" }) {
  return <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p></div><Icon className="h-7 w-7 text-primary" /></div></CardContent></Card>;
}

export default function ProductionQA() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ProductionQAResult.list("-qa_timestamp", 200);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const avg = field => total ? rows.reduce((sum, row) => sum + Number(row[field] || 0), 0) / total : 0;
    const rejected = rows.filter(row => ["REJECTED", "REVISION REQUIRED"].includes(row.final_decision)).length;
    const failures = new Map();
    rows.forEach(row => (row.failure_patterns || []).forEach(code => failures.set(code, (failures.get(code) || 0) + 1)));
    return {
      total,
      overall: avg("overall_score"),
      identity: avg("identity_score"),
      technical: avg("technical_score"),
      brand: avg("brand_score"),
      rejectionRate: total ? (rejected / total) * 100 : 0,
      failures: Array.from(failures.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">Production QA</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">Quality Assurance Engine</h1>
          <p className="mt-1 text-muted-foreground">Independent verification for generated assets before publishing.</p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline"><RefreshCw className="h-4 w-4" />{loading ? "Refreshing" : "Refresh"}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard title="Overall QA" value={score(stats.overall)} icon={ShieldCheck} tone="text-primary" />
        <StatCard title="Identity" value={score(stats.identity)} icon={BarChart3} />
        <StatCard title="Technical" value={score(stats.technical)} icon={BarChart3} />
        <StatCard title="Brand" value={score(stats.brand)} icon={TrendingUp} />
        <StatCard title="Rejection Rate" value={`${score(stats.rejectionRate)}%`} icon={AlertTriangle} tone={stats.rejectionRate > 20 ? "text-destructive" : "text-foreground"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent QA Reports</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="py-3 pr-4">Campaign</th><th className="py-3 pr-4">Overall</th><th className="py-3 pr-4">Identity</th><th className="py-3 pr-4">Technical</th><th className="py-3 pr-4">Brand</th><th className="py-3 pr-4">Readiness</th></tr></thead>
              <tbody>
                {rows.map(row => <tr key={row.id} className="border-b border-border/60"><td className="py-3 pr-4"><p className="font-semibold text-foreground">{row.campaign || row.asset_id}</p><p className="text-xs text-muted-foreground">{row.public_message}</p></td><td className="py-3 pr-4 font-bold">{score(row.overall_score)}</td><td className="py-3 pr-4">{score(row.identity_score)}</td><td className="py-3 pr-4">{score(row.technical_score)}</td><td className="py-3 pr-4">{score(row.brand_score)}</td><td className="py-3 pr-4"><Badge variant={row.final_decision === "APPROVED" ? "default" : "secondary"}>{row.final_decision}</Badge></td></tr>)}
                {!rows.length && <tr><td className="py-8 text-center text-muted-foreground" colSpan="6">No Production QA reports yet.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Most Common Failures</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats.failures.map(([code, count]) => <div key={code} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"><span className="text-sm font-semibold text-foreground">{code.replaceAll("_", " ")}</span><Badge variant="outline">{count}</Badge></div>)}
            {!stats.failures.length && <p className="text-sm text-muted-foreground">No recurring failures recorded.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}