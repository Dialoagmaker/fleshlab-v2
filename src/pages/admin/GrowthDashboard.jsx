import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, Users, Video, Eye, MousePointerClick, ShoppingCart,
  AlertCircle, CheckCircle2, ExternalLink, Search, Globe, RefreshCw, Zap
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function fmt(n) {
  if (n === undefined || n === null) return "—";
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function fmtPct(n) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export default function GrowthDashboard() {
  const [dateRange, setDateRange] = useState("28");
  const [refreshing, setRefreshing] = useState(false);

  const { data: ga4Data, isLoading: ga4Loading, refetch: refetchGa4 } = useQuery({
    queryKey: ['growth-analytics', dateRange],
    queryFn: async () => {
      const res = await base44.functions.invoke('growthAnalytics', { days: parseInt(dateRange) });
      console.log('[GrowthDashboard] GA4 Response:', JSON.stringify(res, null, 2));
      return res;
    },
    retry: 1,
  });

  const { data: gscData, isLoading: gscLoading } = useQuery({
    queryKey: ['gsc-analytics'],
    queryFn: async () => {
      const res = await base44.functions.invoke('seoGscSearchAnalytics', {});
      console.log('[GrowthDashboard] GSC Response:', JSON.stringify(res, null, 2));
      return res;
    },
    retry: 1,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchGa4()]);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = ga4Loading || gscLoading;
  
  // Correct data extraction based on actual API response structure
  const topPages = ga4Data?.top_pages || [];
  const trafficSources = ga4Data?.traffic_sources || [];
  const events = ga4Data?.events?.all_events || [];
  const pagesByCategory = ga4Data?.pages_by_category || {};
  
  // Debug: Log full data structure
  useEffect(() => {
    if (ga4Data && !ga4Loading) {
      console.log('[GrowthDashboard] FULL GA4 Response:', ga4Data);
      console.log('[GrowthDashboard] Parsed Data:', {
        ga4_property_id: ga4Data?.ga4_property_id,
        top_pages_count: topPages?.length,
        events_count: events?.length,
        traffic_sources_count: trafficSources?.length,
        total_page_views: topPages?.reduce((sum, p) => sum + (p.page_views || 0), 0),
      });
    }
    if (gscData && !gscLoading) {
      console.log('[GrowthDashboard] FULL GSC Response:', gscData);
      console.log('[GrowthDashboard] GSC Summary:', gscData?.summary);
    }
  }, [ga4Data, gscData, ga4Loading, gscLoading]);

  const eventMap = {};
  events.forEach(e => { eventMap[e.event_name] = e.event_count; });

  const fanclubClicks = eventMap['fanclub_cta_click'] || 0;
  const checkoutStarted = eventMap['checkout_started'] || 0;
  const registrationStarted = eventMap['registration_started'] || 0;
  const gpClicks = eventMap['guest_production_cta_click'] || 0;
  const bpClicks = eventMap['become_performer_cta_click'] || 0;
  const totalPageViews = topPages?.reduce((sum, p) => sum + (p.page_views || 0), 0) || 0;

  return (
    <>
      <SEOMeta title="Growth Dashboard — FLESHLAB Admin" description="FLESHLAB growth analytics." canonical="/admin/growth" noIndex={true} />
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Growth Command Center</h1>
            <p className="text-muted-foreground text-sm mt-1">SEO, traffic, and conversion analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="28">Last 28 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* DEBUG PANEL */}
            <Card className="border-red-500/50 bg-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-red-400">🐛 DEBUG INFO</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1 font-mono">
                <div>GA4 Property ID: <code className="bg-black/50 px-1 rounded">{ga4Data?.ga4_property_id || "MISSING"}</code></div>
                <div>GA4 Measurement ID: <code className="bg-black/50 px-1 rounded">G-3Z4DV3SVR8</code></div>
                <div>Top Pages Count: <code>{topPages?.length || 0}</code></div>
                <div>Events Count: <code>{events?.length || 0}</code></div>
                <div>Total Page Views: <code className="text-green-400">{totalPageViews.toLocaleString()}</code></div>
                <div>Fanclub CTA Clicks: <code>{fanclubClicks.toLocaleString()}</code></div>
                <div>GSC Clicks: <code className="text-green-400">{gscData?.summary?.clicks || 0}</code></div>
                <div>GSC Impressions: <code className="text-green-400">{gscData?.summary?.impressions || 0}</code></div>
                <div>Date Range: <code>Last {dateRange} days</code></div>
                <div>isLoading: <code>{isLoading ? 'true' : 'false'}</code></div>
                <div className="text-yellow-400">Check browser console (F12) for full data dump</div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />SEO (28d)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-muted-foreground">Clicks</p><p className="text-xl font-bold">{fmt(gscData?.summary?.clicks || 0)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Impressions</p><p className="text-xl font-bold">{fmt(gscData?.summary?.impressions || 0)}</p></div>
                    <div><p className="text-xs text-muted-foreground">CTR</p><p className="text-xl font-bold">{fmtPct(gscData?.summary?.ctr)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Pos</p><p className="text-xl font-bold">{fmt(gscData?.summary?.average_position)}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />Page Views</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{fmt(totalPageViews)}</p><p className="text-xs text-muted-foreground mt-1">Last {dateRange} days</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-primary" />Fanclub CTA</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{fmt(fanclubClicks)}</p><p className="text-xs text-muted-foreground mt-1">Last {dateRange} days</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Tracking Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">GA4 ID</span><code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{ga4Data?.ga4_property_id || "—"}</code></div>
                  <div className="flex flex-wrap gap-1">{['page_view', 'fanclub_cta_click', 'checkout_started'].map(event => (<Badge key={event} variant="outline" className="text-[10px]">{eventMap[event] > 0 ? '✓' : '○'} {event.split('_').pop()}</Badge>))}</div>
                  {events.length === 0 && <p className="text-[10px] text-yellow-500"><AlertCircle className="w-2.5 h-2.5 inline mr-0.5" />No events in response</p>}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" />Fan Conversion Funnel</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Page Views</span><span className="font-semibold">{fmt(totalPageViews)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Fanclub CTA</span><span className="font-semibold">{fmt(fanclubClicks)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Checkout</span><span className="font-semibold">{fmt(checkoutStarted)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Registration</span><span className="font-semibold">{fmt(registrationStarted)}</span></div>
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">PV → CTA</span><span className="font-medium">{fmtPct(totalPageViews > 0 ? (fanclubClicks / totalPageViews) * 100 : 0)}</span></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">CTA → Checkout</span><span className="font-medium">{fmtPct(fanclubClicks > 0 ? (checkoutStarted / fanclubClicks) * 100 : 0)}</span></div>
                  </div>
                  {(fanclubClicks === 0 && checkoutStarted === 0) && (<div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded"><p className="text-[10px] text-yellow-500 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" />No event data yet</p></div>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Performer Acquisition</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Become Performer CTA</span><span className="font-semibold">{fmt(bpClicks)}</span></div>
                  {(bpClicks === 0) && (<div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded"><p className="text-[10px] text-yellow-500 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" />No event data yet</p></div>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Video className="w-4 h-4 text-primary" />Guest Production</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">GP CTA Clicks</span><span className="font-semibold">{fmt(gpClicks)}</span></div>
                  {gpClicks === 0 && (<div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded"><p className="text-[10px] text-yellow-500 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" />No event data yet</p></div>)}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="seo" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="seo">SEO & Queries</TabsTrigger>
                <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
                <TabsTrigger value="pages">Top Pages</TabsTrigger>
                <TabsTrigger value="events">All Events</TabsTrigger>
              </TabsList>
              <TabsContent value="seo" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Search className="w-4 h-4 text-primary" />Top Search Queries</CardTitle></CardHeader>
                    <CardContent>
                      {gscData?.top_queries?.length ? (<Table><TableHeader><TableRow><TableHead>Query</TableHead><TableHead className="text-right">Clicks</TableHead><TableHead className="text-right">Pos</TableHead></TableRow></TableHeader><TableBody>{gscData.top_queries.slice(0, 15).map((q, i) => (<TableRow key={i}><TableCell className="font-medium text-xs truncate max-w-[200px]">{q.query}</TableCell><TableCell className="text-right">{fmt(q.clicks)}</TableCell><TableCell className="text-right">{fmt(q.position)}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-sm text-muted-foreground">No query data available</p>)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Top SEO Pages</CardTitle></CardHeader>
                    <CardContent>
                      {gscData?.top_pages?.length ? (<Table><TableHeader><TableRow><TableHead>Page</TableHead><TableHead className="text-right">Clicks</TableHead><TableHead className="text-right">CTR</TableHead></TableRow></TableHeader><TableBody>{gscData.top_pages.slice(0, 15).map((p, i) => (<TableRow key={i}><TableCell className="font-medium text-xs truncate max-w-[200px]">{p.page}</TableCell><TableCell className="text-right">{fmt(p.clicks)}</TableCell><TableCell className="text-right">{fmtPct(p.ctr)}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-sm text-muted-foreground">No page data available</p>)}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="traffic" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />All Traffic Sources</CardTitle></CardHeader>
                    <CardContent>
                      {trafficSources?.length ? (<Table><TableHeader><TableRow><TableHead>Channel</TableHead><TableHead>Source / Medium</TableHead><TableHead className="text-right">Sessions</TableHead></TableRow></TableHeader><TableBody>{trafficSources.slice(0, 20).map((t, i) => (<TableRow key={i}><TableCell className="font-medium text-xs"><Badge variant="outline" className="text-[10px]">{t.channel}</Badge></TableCell><TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{t.source} / {t.medium}</TableCell><TableCell className="text-right">{fmt(t.sessions)}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-sm text-muted-foreground">No traffic data available</p>)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ExternalLink className="w-4 h-4 text-primary" />External Platform Traffic</CardTitle></CardHeader>
                    <CardContent>
                      {(() => {
                        const externalSources = (trafficSources || []).filter(t => ['xhamster', 'pornhub', 'faphouse', 'twitter', 't.co', 'chaturbate'].some(s => t.source?.toLowerCase().includes(s)) || t.medium === 'referral');
                        return externalSources.length ? (<Table><TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Channel</TableHead><TableHead className="text-right">Sessions</TableHead></TableRow></TableHeader><TableBody>{externalSources.slice(0, 15).map((t, i) => (<TableRow key={i}><TableCell className="font-medium text-xs truncate max-w-[150px]">{t.source}</TableCell><TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{t.channel}</Badge></TableCell><TableCell className="text-right">{fmt(t.sessions)}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-sm text-muted-foreground">No external platform traffic detected yet</p>);
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="pages" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />Top Pages by Category</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs defaultValue="public_current">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="public_current">Public ({fmt(pagesByCategory?.public_current?.length || 0)})</TabsTrigger>
                        <TabsTrigger value="legacy_redirect">Legacy ({fmt(pagesByCategory?.legacy_redirect?.length || 0)})</TabsTrigger>
                        <TabsTrigger value="unknown">Other ({fmt(pagesByCategory?.unknown?.length || 0)})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="public_current" className="mt-4">
                        <Table><TableHeader><TableRow><TableHead>Page Path</TableHead><TableHead className="text-right">Views</TableHead><TableHead className="text-right">Users</TableHead></TableRow></TableHeader><TableBody>{(pagesByCategory?.public_current || []).slice(0, 20).map((p, i) => (<TableRow key={i}><TableCell className="font-medium text-xs truncate max-w-[300px]">{p.page_path}</TableCell><TableCell className="text-right">{fmt(p.page_views)}</TableCell><TableCell className="text-right">{fmt(p.active_users)}</TableCell></TableRow>))}</TableBody></Table>
                      </TabsContent>
                      <TabsContent value="legacy_redirect" className="mt-4">
                        <Table><TableHeader><TableRow><TableHead>Legacy Path</TableHead><TableHead className="text-right">Views</TableHead><TableHead className="text-right">Users</TableHead></TableRow></TableHeader><TableBody>{(pagesByCategory?.legacy_redirect || []).slice(0, 20).map((p, i) => (<TableRow key={i}><TableCell className="font-medium text-xs truncate max-w-[300px]">{p.page_path}</TableCell><TableCell className="text-right">{fmt(p.page_views)}</TableCell><TableCell className="text-right">{fmt(p.active_users)}</TableCell></TableRow>))}</TableBody></Table>
                        <p className="text-xs text-muted-foreground mt-3">Legacy routes still receiving traffic</p>
                      </TabsContent>
                      <TabsContent value="unknown" className="mt-4">
                        <Table><TableHeader><TableRow><TableHead>Page Path</TableHead><TableHead className="text-right">Views</TableHead><TableHead className="text-right">Users</TableHead></TableRow></TableHeader><TableBody>{(pagesByCategory?.unknown || []).slice(0, 20).map((p, i) => (<TableRow key={i}><TableCell className="font-medium text-xs truncate max-w-[300px]">{p.page_path}</TableCell><TableCell className="text-right">{fmt(p.page_views)}</TableCell><TableCell className="text-right">{fmt(p.active_users)}</TableCell></TableRow>))}</TableBody></Table>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />All Events (Last {dateRange} Days)</CardTitle></CardHeader>
                  <CardContent>
                    {events?.length ? (<Table><TableHeader><TableRow><TableHead>Event Name</TableHead><TableHead className="text-right">Count</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{events.slice(0, 30).map((e, i) => { const isKeyEvent = ['page_view', 'fanclub_cta_click', 'guest_production_cta_click', 'become_performer_cta_click', 'registration_started', 'checkout_started', 'video_detail_view'].includes(e.event_name); return (<TableRow key={i}><TableCell className="font-medium text-xs"><code className="bg-muted px-1.5 py-0.5 rounded">{e.event_name}</code></TableCell><TableCell className="text-right">{fmt(e.event_count)}</TableCell><TableCell>{e.event_count > 0 ? (<Badge variant="default" className="text-xs bg-green-500">Active</Badge>) : (<Badge variant="outline" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />No data</Badge>)}</TableCell></TableRow>); })}</TableBody></Table>) : (<p className="text-sm text-muted-foreground">No event data available</p>)}
                    <p className="text-xs text-yellow-500 mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Events just installed — historical data may be limited</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}