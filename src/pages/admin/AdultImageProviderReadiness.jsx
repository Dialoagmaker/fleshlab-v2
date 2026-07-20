import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";

const permissionVariant = value => value === "yes" ? "outline" : value === "no" ? "destructive" : "secondary";

function SummaryCard({ title, value, icon: Icon }) {
  return <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p></div><Icon className="h-5 w-5 text-primary" /></CardContent></Card>;
}

function ProviderEditor({ provider, onSave }) {
  const [priority, setPriority] = useState(provider.priority || 100);
  const [notes, setNotes] = useState(provider.admin_notes || "");
  return (
    <div className="space-y-2">
      <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} className="h-8 w-24" />
      <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Admin notes / written confirmation reference" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onSave(provider.id, { enabled: !provider.enabled })}>{provider.enabled ? "Disable" : "Enable"}</Button>
        <Button size="sm" variant="outline" onClick={() => onSave(provider.id, { priority, admin_notes: notes })}>Save</Button>
      </div>
    </div>
  );
}

export default function AdultImageProviderReadiness() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("adultImageProviderReadinessService", { action: "list" });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const providers = data?.providers || [];
    return {
      approved: providers.filter(p => p.explicit_adult_image_processing_permitted === "yes" && p.enabled).length,
      unknown: providers.filter(p => p.explicit_adult_image_processing_permitted === "unknown").length,
      rejected: providers.filter(p => p.explicit_adult_image_processing_permitted === "no").length,
      compatible: providers.filter(p => p.technical_status === "compatible").length,
    };
  }, [data]);

  const saveProvider = async (id, patch) => {
    await base44.functions.invoke("adultImageProviderReadinessService", { action: "update_provider", id, patch });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Adult Image Provider Readiness</h1>
          <p className="text-sm text-muted-foreground">Separates technical OpenRouter image capability from documented adult-content policy approval.</p>
        </div>
        <Button onClick={load} disabled={loading} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard title="Policy-approved enabled" value={stats.approved} icon={CheckCircle2} />
        <SummaryCard title="Policy unknown" value={stats.unknown} icon={AlertTriangle} />
        <SummaryCard title="Rejected / prohibited" value={stats.rejected} icon={ShieldAlert} />
        <SummaryCard title="Technically compatible" value={stats.compatible} icon={RefreshCw} />
      </div>

      <Card>
        <CardHeader><CardTitle>Provider Qualification Table</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Model</TableHead><TableHead>Capability</TableHead><TableHead>Adult policy</TableHead><TableHead>Evidence</TableHead><TableHead>Admin</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data?.providers || []).map(provider => (
                <TableRow key={provider.id}>
                  <TableCell className="min-w-44"><div className="font-semibold">{provider.provider_name}</div><div className="text-xs text-muted-foreground">{provider.openrouter_provider_slug}</div><Badge variant={provider.enabled ? "outline" : "secondary"}>{provider.enabled ? "enabled" : "disabled"}</Badge></TableCell>
                  <TableCell className="min-w-64"><div className="text-xs font-mono">{provider.model_id}</div><div className="text-xs text-muted-foreground">{provider.endpoint_id}</div><div className="text-xs">Cost: ${Number(provider.cost || 0).toFixed(5)}</div></TableCell>
                  <TableCell className="min-w-52 text-xs"><div>Text→Image: {provider.text_to_image_support ? "yes" : "no"}</div><div>Image→Image: {provider.image_to_image_support ? "yes" : "no"}</div><div>Multi-ref: {provider.multi_reference_support ? "yes" : "no"}</div><div>16:9: {provider.supports_16_9 ? "yes" : "no"}</div><div>ZDR: {provider.zero_data_retention_status}</div></TableCell>
                  <TableCell className="min-w-72"><Badge variant={permissionVariant(provider.explicit_adult_image_processing_permitted)}>explicit adult: {provider.explicit_adult_image_processing_permitted}</Badge><p className="mt-2 max-w-md text-xs text-muted-foreground">{provider.documented_adult_content_policy}</p><p className="mt-2 text-xs"><b>Prohibited:</b> {provider.prohibited_categories}</p></TableCell>
                  <TableCell className="min-w-56 text-xs"><a className="text-primary underline" href={provider.policy_source_url?.startsWith("http") ? provider.policy_source_url : undefined} target="_blank" rel="noreferrer">{provider.policy_source_url}</a><div>Reviewed: {provider.policy_last_verified_date || "—"}</div><div>Production test: {provider.successful_production_test_date || "none"}</div></TableCell>
                  <TableCell className="min-w-72"><ProviderEditor provider={provider} onSave={saveProvider} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>OpenRouter Technical Discovery</CardTitle></CardHeader>
        <CardContent>
          {data?.discovery?.error ? <p className="text-sm text-destructive">{data.discovery.error}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Model</TableHead><TableHead>Reference Support</TableHead><TableHead>16:9</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
              <TableBody>{(Array.isArray(data?.discovery) ? data.discovery : []).slice(0, 50).map((row, i) => <TableRow key={`${row.provider_slug}-${row.model_id}-${i}`}><TableCell>{row.provider_name}<div className="text-xs text-muted-foreground">{row.provider_slug}</div></TableCell><TableCell className="font-mono text-xs">{row.model_id}</TableCell><TableCell>{row.image_to_image_support ? "image input" : "no"}{row.multi_reference_support ? " + multi-ref" : ""}</TableCell><TableCell>{row.supports_16_9 ? "yes" : "no"}</TableCell><TableCell>${Number(row.estimated_cost_usd || 0).toFixed(5)}</TableCell></TableRow>)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Production Attempts</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Provider / Model</TableHead><TableHead>HTTP</TableHead><TableHead>Exact Reason</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
            <TableBody>{(data?.logs || []).slice(0, 20).map(log => <TableRow key={log.id}><TableCell><Badge variant={log.status === "succeeded" ? "outline" : "destructive"}>{log.status}</Badge></TableCell><TableCell><div>{log.provider || "—"}</div><div className="font-mono text-xs text-muted-foreground">{log.model}</div></TableCell><TableCell>{log.http_status || "—"}</TableCell><TableCell className="max-w-xl text-xs">{log.error_message || log.error_category || "Output received"}</TableCell><TableCell>${Number(log.cost_usd || 0).toFixed(5)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}