import { useEffect, useState } from "react";
import { fleshlabRequest } from "@/api/fleshlabClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const config = {
  rendering: ["Rendering Intelligence", "Render job metadata, provider selection, status and output references."],
  qa: ["Production QA", "Persisted QA findings, severity, review notes and decisions."],
  audit: ["Studio Audit", "Local audit records, findings, severity and review history."],
  certification: ["Certification", "Certification records, evidence, review status and expiry metadata."],
  readiness: ["Adult Provider Readiness", "Provider readiness requirements and documented status. External execution is separate."],
  automation: ["Automation", "Stored automation definitions and safe local configuration. Execution is disabled by default."],
  settings: ["Settings", "Persisted non-secret operational settings for the self-hosted Admin surface."]
};

export default function AdminOperations({ kind }) {
  const [rows, setRows] = useState([]); const [error, setError] = useState(""); const [payload, setPayload] = useState("{}");
  const [title, description] = config[kind] || [kind, "Self-hosted administration"];
  const load = async () => { try { setRows((await fleshlabRequest(`/admin/operations/${kind}`)).records || []); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, [kind]);
  const create = async () => { try { await fleshlabRequest(`/admin/operations/${kind}`, { method: "POST", body: payload }); setPayload("{}"); await load(); } catch (e) { setError(e.message); } };
  const remove = async id => { try { await fleshlabRequest(`/admin/operations/${kind}/${id}`, { method: "DELETE", body: "{}" }); await load(); } catch (e) { setError(e.message); } };
  return <div className="space-y-6"><div><p className="text-xs font-black uppercase tracking-[.25em] text-primary">Self-hosted Admin</p><h1 className="mt-2 text-3xl font-black">{title}</h1><p className="mt-2 text-muted-foreground">{description}</p></div>{error && <p className="rounded border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}<Card><CardHeader><CardTitle>New local record</CardTitle></CardHeader><CardContent className="space-y-3"><textarea value={payload} onChange={e => setPayload(e.target.value)} className="min-h-28 w-full rounded border bg-background p-3 font-mono text-sm" aria-label="JSON record" /><Button onClick={create}>Save record</Button></CardContent></Card><Card><CardHeader><CardTitle>Persisted records ({rows.length})</CardTitle></CardHeader><CardContent className="space-y-2">{rows.map(row => <div key={row.id || row.key} className="flex items-start justify-between gap-3 rounded border p-3"><pre className="max-w-full overflow-auto text-xs">{JSON.stringify(row, null, 2)}</pre>{row.id && <Button variant="outline" size="sm" onClick={() => remove(row.id)}>Delete</Button>}</div>)}{!rows.length && <p className="text-sm text-muted-foreground">No records exist. No synthetic data is inserted.</p>}</CardContent></Card></div>;
}
