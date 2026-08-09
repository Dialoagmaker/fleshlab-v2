import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Link2, Plus, RefreshCw, Target, Users } from "lucide-react";

const blankCampaign = {
  name: "Philippines Creator Outreach",
  landing_page: "/gay-performer-recruitment-philippines",
  source: "xhamster",
  medium: "partner_profile",
  campaign: "ph_creator_recruitment",
  content: "profile_link",
  term: "",
  country: "Philippines",
  channel: "xHamster",
  referral_code: "",
  performer_referral_name: "",
  notes: "",
};

const fmt = (n) => Number(n || 0).toLocaleString();
const rate = (a, b) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—";

function MetricTable({ rows }) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Segment</TableHead><TableHead className="text-right">Visits</TableHead><TableHead className="text-right">Apply</TableHead><TableHead className="text-right">Start</TableHead><TableHead className="text-right">Complete</TableHead><TableHead className="text-right">WhatsApp</TableHead><TableHead className="text-right">Visit → Complete</TableHead></TableRow></TableHeader>
      <TableBody>{(rows || []).map((row, i) => <TableRow key={`${row.label}-${i}`}><TableCell className="max-w-[240px] truncate font-medium text-xs">{row.label}</TableCell><TableCell className="text-right">{fmt(row.visits)}</TableCell><TableCell className="text-right">{fmt(row.apply_cta)}</TableCell><TableCell className="text-right">{fmt(row.application_start)}</TableCell><TableCell className="text-right">{fmt(row.application_complete)}</TableCell><TableCell className="text-right">{fmt(row.whatsapp_click)}</TableCell><TableCell className="text-right text-muted-foreground">{rate(row.application_complete, row.visits)}</TableCell></TableRow>)}</TableBody>
    </Table>
  );
}

export default function RecruitmentCampaignCenter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ campaigns: [], templates: [], report: {} });
  const [form, setForm] = useState(blankCampaign);
  const [copied, setCopied] = useState("");

  const previewUrl = useMemo(() => {
    const url = new URL(`https://fleshlab.online${form.landing_page || "/gay-performer-recruitment-philippines"}`);
    const params = { utm_source: form.source, utm_medium: form.medium, utm_campaign: form.campaign, utm_content: form.content, utm_term: form.term, market: form.country, ref: form.referral_code, campaign_id: (form.campaign || form.name || "campaign").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") };
    Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
    return url.toString();
  }, [form]);

  const load = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("recruitmentCampaignCenterService", { action: "dashboard" });
    setData(res.data || { campaigns: [], templates: [], report: {} });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createCampaign = async () => {
    setSaving(true);
    await base44.functions.invoke("recruitmentCampaignCenterService", { action: "create_campaign", campaign: form });
    setForm(blankCampaign);
    await load();
    setSaving(false);
  };

  const applyTemplate = (template) => {
    setForm({ ...blankCampaign, name: template.name, landing_page: template.landing_page, source: template.source, medium: template.medium, campaign: `${template.campaign_prefix}_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`, country: template.default_country || template.market, channel: template.channel, notes: template.notes || "" });
  };

  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 1600);
  };

  const summary = data.report?.summary || [];
  const dimensions = data.report?.by_dimension || {};

  return (
    <>
      <SEOMeta title="Recruitment Campaign Center — FLESHLAB HQ" description="Tracked performer recruitment campaign links and reporting." canonical="/admin/recruitment-campaigns" noIndex={true} />
      <div className="max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-black uppercase tracking-widest text-primary">FLESHLAB HQ</p><h1 className="text-2xl font-bold">Performer Recruitment Campaign Center</h1><p className="mt-1 text-sm text-muted-foreground">Create tracked links for X, xHamster, Facebook, Telegram, WhatsApp, partner sites and referral outreach.</p></div>
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {[
            ["Tracked campaigns", data.campaigns?.length || 0],
            ["Link visits", summary.reduce((s, r) => s + r.visits, 0)],
            ["Apply CTA", summary.reduce((s, r) => s + r.apply_cta, 0)],
            ["Application starts", summary.reduce((s, r) => s + r.application_start, 0)],
            ["Applications complete", summary.reduce((s, r) => s + r.application_complete, 0)],
          ].map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{fmt(value)}</p></CardContent></Card>)}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Create tracked campaign URL</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Landing page</Label><Input value={form.landing_page} onChange={e => setForm({ ...form, landing_page: e.target.value })} /></div>
                <div><Label>Source</Label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="xhamster, facebook, telegram" /></div>
                <div><Label>Medium</Label><Input value={form.medium} onChange={e => setForm({ ...form, medium: e.target.value })} placeholder="social, partner, dm" /></div>
                <div><Label>Campaign</Label><Input value={form.campaign} onChange={e => setForm({ ...form, campaign: e.target.value })} /></div>
                <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
                <div><Label>Channel</Label><Input value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} /></div>
                <div><Label>Referral code</Label><Input value={form.referral_code} onChange={e => setForm({ ...form, referral_code: e.target.value })} placeholder="optional performer/partner code" /></div>
                <div><Label>UTM content</Label><Input value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="bio_link, post_01" /></div>
                <div><Label>UTM term</Label><Input value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} placeholder="optional" /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="rounded-lg border bg-muted/30 p-3"><p className="mb-2 text-xs font-semibold text-muted-foreground">Preview URL</p><div className="flex gap-2"><Input value={previewUrl} readOnly className="font-mono text-xs" /><Button variant="outline" onClick={() => copy(previewUrl)}><Copy className="h-4 w-4" /></Button></div></div>
              <Button onClick={createCampaign} disabled={saving || !form.source || !form.medium || !form.campaign} className="w-full gap-2"><Link2 className="h-4 w-4" />{saving ? "Creating…" : "Create campaign URL"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Reusable outreach templates</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(data.templates || []).map(t => <div key={t.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.market} · {t.channel} · {t.source}/{t.medium}</p></div><Button size="sm" variant="outline" onClick={() => applyTemplate(t)}>Use</Button></div><p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{t.post_copy}</p>{t.whatsapp_copy && <p className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap">{t.whatsapp_copy}</p>}</div>)}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Campaign performance</CardTitle></CardHeader>
          <CardContent><MetricTable rows={summary} /></CardContent>
        </Card>

        <Tabs defaultValue="source" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6"><TabsTrigger value="source">Source</TabsTrigger><TabsTrigger value="medium">Medium</TabsTrigger><TabsTrigger value="campaign">Campaign</TabsTrigger><TabsTrigger value="country">Country</TabsTrigger><TabsTrigger value="landing_page">Landing</TabsTrigger><TabsTrigger value="referral_code">Referral</TabsTrigger></TabsList>
          {['source','medium','campaign','country','landing_page','referral_code'].map(dim => <TabsContent key={dim} value={dim}><Card><CardHeader><CardTitle className="capitalize">Performance by {dim.replace('_', ' ')}</CardTitle></CardHeader><CardContent><MetricTable rows={dimensions[dim] || []} /></CardContent></Card></TabsContent>)}
        </Tabs>

        <Card>
          <CardHeader><CardTitle>Campaign URLs</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Source</TableHead><TableHead>Country</TableHead><TableHead>Referral</TableHead><TableHead>URL</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>{(data.campaigns || []).map(c => <TableRow key={c.id}><TableCell><div className="font-medium">{c.name}</div><Badge variant="outline" className="mt-1 text-[10px]">{c.status}</Badge></TableCell><TableCell className="text-xs">{c.source} / {c.medium}<br/><span className="text-muted-foreground">{c.campaign}</span></TableCell><TableCell>{c.country}</TableCell><TableCell>{c.referral_code || '—'}</TableCell><TableCell className="max-w-[360px] truncate font-mono text-xs">{c.generated_url}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => copy(c.generated_url)}>{copied === c.generated_url ? "Copied" : "Copy"}</Button></TableCell></TableRow>)}</TableBody></Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}