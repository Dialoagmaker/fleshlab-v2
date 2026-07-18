import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Check, Eye, RefreshCw, Target, TrendingUp } from "lucide-react";

const asList = (value) => { try { return value ? JSON.parse(value) : []; } catch { return []; } };
const money = (v) => `$${Number(v || 0).toFixed(0)}`;

function Recommendation({ item, onStatus }) {
  return <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div><Badge variant="outline" className="mb-2 capitalize">{item.priority}</Badge><h4 className="font-semibold">{item.title}</h4></div><span className="text-sm font-bold text-green-500">{item.revenue_impact_label || money(item.revenue_impact_usd)}</span></div><p className="text-sm text-muted-foreground">{item.recommendation}</p><p className="text-xs text-muted-foreground border-t border-border pt-3">Why: {item.reason}</p><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Confidence {Math.round(item.confidence || 0)}%</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onStatus(item.id, "ignored")}><Eye className="w-3 h-3 mr-1" />Ignore</Button><Button size="sm" onClick={() => onStatus(item.id, "accepted")}><Check className="w-3 h-3 mr-1" />Accept</Button></div></div></CardContent></Card>;
}

function Intelligence({ library }) {
  if (!library) return null;
  const missing = asList(library.missing_categories_json);
  const overused = asList(library.overused_locations_json);
  return <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Brain className="w-4 h-4 text-primary" />Library Intelligence</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 text-sm"><div><p className="text-muted-foreground">Diversity</p><p>{library.library_diversity}</p></div><div><p className="text-muted-foreground">Freshness</p><p>{library.library_freshness}</p></div><div><p className="text-muted-foreground">Genre Balance</p><p>{library.genre_balance}</p></div><div><p className="text-muted-foreground">Series Progress</p><p>{library.series_progress}</p></div>{missing.length > 0 && <div><p className="text-muted-foreground">Missing Categories</p><p>{missing.join(", ")}</p></div>}{overused.length > 0 && <div><p className="text-muted-foreground">Overused Locations</p><p>{overused.join(", ")}</p></div>}</CardContent></Card>;
}

export default function CreatorOSBriefing({ performerId, performerToken }) {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["creator-os", performerId], queryFn: async () => (await base44.functions.invoke("creatorOSService", { action: "get_creator_os", performer_id: performerId, performer_token: performerToken, auto_generate: true })).data, enabled: !!performerId && !!performerToken, staleTime: 5 * 60 * 1000 });
  const statusMutation = useMutation({ mutationFn: async ({ id, status }) => base44.functions.invoke("creatorOSService", { action: "set_recommendation_status", performer_id: performerId, performer_token: performerToken, recommendation_id: id, status }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creator-os", performerId] }) });
  const generate = async () => { setRunning(true); await base44.functions.invoke("creatorOSService", { action: "generate_for_performer", performer_id: performerId, performer_token: performerToken, reason: "performer_requested" }); await queryClient.invalidateQueries({ queryKey: ["creator-os", performerId] }); setRunning(false); };
  if (isLoading) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading Creator OS briefing...</CardContent></Card>;
  const briefing = data?.briefing;
  const mission = data?.mission;
  const trends = asList(briefing?.trends_json);
  return <div className="space-y-4"><Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card"><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="text-2xl">{briefing?.greeting || "Creator OS Briefing"}</CardTitle><p className="text-muted-foreground mt-2">{briefing?.headline || "No stored AI briefing has been generated yet."}</p></div><Button onClick={generate} disabled={running}><RefreshCw className={`w-4 h-4 mr-2 ${running ? "animate-spin" : ""}`} />{briefing ? "Refresh" : "Generate"}</Button></div></CardHeader>{briefing && <CardContent className="space-y-4"><p>{briefing.summary}</p><div className="grid gap-3 md:grid-cols-3"><div className="rounded-lg border border-border p-3"><Target className="w-4 h-4 text-primary mb-2" /><p className="text-xs text-muted-foreground">Today's Mission</p><p className="font-semibold">{mission?.title || briefing.today_mission}</p></div><div className="rounded-lg border border-border p-3"><TrendingUp className="w-4 h-4 text-green-500 mb-2" /><p className="text-xs text-muted-foreground">Revenue Potential</p><p className="font-semibold text-green-500">{money(briefing.revenue_potential_usd)}</p></div><div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Trends</p><p className="font-semibold">{trends.slice(0, 2).join(" • ") || "No trend signal stored"}</p></div></div></CardContent>}</Card><div className="grid gap-4 lg:grid-cols-2">{(data?.recommendations || []).map(item => <Recommendation key={item.id} item={item} onStatus={(id, status) => statusMutation.mutate({ id, status })} />)}</div><Intelligence library={data?.library} /></div>;
}