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
      const response = await base44.functions.invoke('growthAnalytics', { days: parseInt(dateRange) });
      // base44.functions.invoke returns Axios response: {data, status, headers, ...}
      // Backend returns JSON via Response.json(), so actual payload is in response.data
      const payload = response?.data || response;
      console.log('🔍 [GrowthDashboard] GA4 RAW RESPONSE KEYS:', Object.keys(response || {}));
      console.log('🔍 [GrowthDashboard] GA4 PAYLOAD KEYS:', Object.keys(payload || {}));
      console.log('🔍 [GrowthDashboard] GA4 Property ID:', payload?.ga4_property_id);
      console.log('🔍 [GrowthDashboard] GA4 Top Pages:', payload?.top_pages?.length);
      return payload;
    },
    retry: 1,
    staleTime: 0,
  });

  const { data: gscData, isLoading: gscLoading } = useQuery({
    queryKey: ['gsc-analytics'],
    queryFn: async () => {
      const response = await base44.functions.invoke('seoGscSearchAnalytics', {});
      const payload = response?.data || response;
      console.log('🔍 [GrowthDashboard] GSC RAW RESPONSE KEYS:', Object.keys(response || {}));
      console.log('🔍 [GrowthDashboard] GSC PAYLOAD KEYS:', Object.keys(payload || {}));
      console.log('🔍 [GrowthDashboard] GSC Summary:', payload?.summary);
      console.log('🔍 [GrowthDashboard] GSC Top Pages:', payload?.top_pages?.length);
      return payload;
    },
    retry: 1,
    staleTime: 0,
  });

  // Applications attribution data
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['applications-attribution', dateRange],
    queryFn: async () => {
      const response = await base44.entities.GuestProductionApplication.list();
      const all = response || [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
      const performerApplications = all.filter(app => app.request_type === 'performer_application' || /performer|recruitment|onlyfans|chaturbate/i.test(String(app.source_page || '')));
      const filtered = performerApplications.filter(app => {
        const submittedAt = app.submitted_at || app.created_date;
        if (!submittedAt) return false;
        return new Date(submittedAt) >= cutoff;
      });
      const phApps = filtered.filter(app => app.utm_market === 'philippines' || app.source_country === 'Philippines' || app.country === 'Philippines' || app.recruitment_page === '/gay-performer-recruitment-philippines');
      const phSourceApps = filtered.filter(app => app.utm_source === 'philippines-recruitment' || app.source === 'philippines-recruitment');
      const phCampaignApps = filtered.filter(app => app.utm_campaign === 'pinoy_recruitment' || app.campaign === 'pinoy_recruitment');
      return {
        application_records: filtered.length,
        successfully_persisted_performer_applications: filtered.length,
        philippines_total: phApps.length,
        philippines_source: phSourceApps.length,
        philippines_campaign: phCampaignApps.length,
        all_apps: filtered,
      };
    },
    retry: 1,
    staleTime: 0,
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
  
  // Defensive data mapping with fallback for multiple naming conventions
  const ga4PropertyId = ga4Data?.ga4_property_id || ga4Data?.ga4PropertyId || ga4Data?.property_id || 'MISSING';
  const topPages = ga4Data?.top_pages || ga4Data?.topPages || [];
  const trafficSources = ga4Data?.traffic_sources || ga4Data?.trafficSources || [];
  const events = ga4Data?.events?.all_events || ga4Data?.events || ga4Data?.eventRows || [];
  const pagesByCategory = ga4Data?.pages_by_category || ga4Data?.pagesByCategory || {};
  const totalPageViewsBackend = ga4Data?.total_page_views || ga4Data?.totalPageViews || 0;
  const overview = ga4Data?.overview || {};
  const publicMetrics = ga4Data?.public_metrics || overview;
  const excludedMetrics = ga4Data?.excluded_internal_metrics || {};
  const landingPages = ga4Data?.public_landing_pages || ga4Data?.landing_pages || [];
  const countries = ga4Data?.public_countries || ga4Data?.countries || [];
  const hostnames = ga4Data?.hostnames || [];
  const publicTrafficSources = ga4Data?.public_traffic_sources || ga4Data?.traffic_sources || [];
  const recruitmentAcquisition = ga4Data?.recruitment_acquisition || {};
  const recruitmentSummary = recruitmentAcquisition.summary || {};
  const recruitmentPhilippines = recruitmentAcquisition.philippines || {};
  const recruitmentNonPhilippines = recruitmentAcquisition.non_philippines || {};
  const recruitmentEvents = recruitmentAcquisition.events || [];
  const recruitmentLandingBreakdown = recruitmentAcquisition.all_landing_breakdown || [];
  const recruitmentOrganicBreakdown = recruitmentAcquisition.organic_breakdown || [];
  const recruitmentPagePaths = recruitmentAcquisition.pages || ['/become-performer', '/gay-performer-recruitment-philippines', '/gay-twink-performer-recruitment', '/chaturbate-model-join-studio', '/gay-onlyfans-alternative'];
  const recruitmentGscPages = (gscData?.top_pages || []).filter((p) => recruitmentPagePaths.some((path) => String(p.page || '').includes(path)));
  const recruitmentGscClicks = recruitmentGscPages.reduce((sum, p) => sum + (Number(p.clicks) || 0), 0);
  const recruitmentGscImpressions = recruitmentGscPages.reduce((sum, p) => sum + (Number(p.impressions) || 0), 0);
  const recruitmentGscCtr = recruitmentGscImpressions > 0 ? (recruitmentGscClicks / recruitmentGscImpressions) * 100 : 0;
  const recruitmentGscPosition = recruitmentGscImpressions > 0 ? recruitmentGscPages.reduce((sum, p) => sum + ((Number(p.position ?? p.average_position) || 0) * (Number(p.impressions) || 0)), 0) / recruitmentGscImpressions : 0;
  const funnelRate = (to, from) => from > 0 ? (to / from) * 100 : 0;

  // Derive all data BEFORE useEffect references it
  const eventMap = {};
  events.forEach(e => { eventMap[e.event_name] = e.event_count; });

  const fanclubClicks = eventMap['fanclub_cta_click'] || 0;
  const checkoutStarted = eventMap['checkout_start'] || eventMap['checkout_started'] || 0;
  const registrationStarted = eventMap['registration_start'] || eventMap['registration_started'] || 0;
  const gpClicks = eventMap['guest_production_cta_click'] || 0;
  const bpClicks = eventMap['performer_apply_click'] || 0;
  // Philippines-specific events
  const phPageViews = topPages.find((p) => p.page_path === '/gay-performer-recruitment-philippines')?.page_views || 0;
  const phCtaClicks = eventMap['performer_apply_click'] || 0;
  const phWhatsappClicks = eventMap['recruitment_whatsapp_click'] || 0;
  // Use exact GA4 overview page views; fall back to visible top pages only if unavailable.
  const totalPageViews = publicMetrics.page_views || overview.page_views || topPages?.reduce((sum, p) => sum + (parseInt(p.page_views, 10) || 0), 0) || 0;
  
  // Debug: Log full data structure
  useEffect(() => {
    if (ga4Data && !ga4Loading) {
      console.log('='.repeat(80));
      console.log('[GrowthDashboard] 📊 GA4 BACKEND RESPONSE - FULL DEBUG');
      console.log('='.repeat(80));
      console.log('✅ Property ID:', ga4PropertyId);
      console.log('✅ Date Range:', ga4Data?.date_range);
      console.log('✅ Top Pages Count:', topPages?.length);
      console.log('✅ Top Pages Sample:', topPages?.slice(0, 3));
      console.log('✅ Events Count:', events?.length);
      console.log('✅ Events Sample:', events?.slice(0, 5));
      console.log('✅ Traffic Sources Count:', trafficSources?.length);
      console.log('✅ Total Page Views (backend):', totalPageViewsBackend);
      console.log('✅ Total Page Views (calculated):', totalPageViews);
      console.log('✅ Pages by Category:', Object.keys(pagesByCategory || {}));
      console.log('='.repeat(80));
    }
    if (gscData && !gscLoading) {
      console.log('='.repeat(80));
      console.log('[GrowthDashboard] 🔍 GSC BACKEND RESPONSE - FULL DEBUG');
      console.log('='.repeat(80));
      console.log('✅ Site URL:', gscData?.site_url);
      console.log('✅ Date Range:', gscData?.date_range);
      console.log('✅ Summary:', gscData?.summary);
      console.log('✅ Top Queries Count:', gscData?.top_queries?.length);
      console.log('✅ Top Pages Count:', gscData?.top_pages?.length);
      console.log('='.repeat(80));
    }
  }, [ga4Data, gscData, ga4Loading, gscLoading, ga4PropertyId, topPages, events, trafficSources, totalPageViewsBackend, totalPageViews, fanclubClicks, checkoutStarted, registrationStarted, gpClicks, bpClicks]);

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
            <Card className="border-green-500/50 bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-green-400">✅ GA4 BACKEND STATUS</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1 font-mono">
                <div className="flex items-center gap-2">
                  <span>GA4 Property ID (Backend):</span>
                  <code className="bg-black/50 px-2 py-0.5 rounded text-green-400 font-bold">{ga4PropertyId}</code>
                  {ga4PropertyId !== 'MISSING' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <span>GA4 Measurement ID (Frontend):</span>
                  <code className="bg-black/50 px-2 py-0.5 rounded text-blue-400">G-3Z4DV3SVR8</code>
                </div>
                <div className="pt-2 border-t border-green-500/20">
                  <div className="text-green-300 font-semibold mb-1">GSC Status:</div>
                  <div>Clicks (28d): <code className="text-green-400 font-bold">{gscData?.summary?.clicks ?? 0}</code></div>
                  <div>Impressions (28d): <code className="text-green-400 font-bold">{gscData?.summary?.impressions ?? 0}</code></div>
                  <div>CTR: <code className="text-green-400">{fmtPct(gscData?.summary?.ctr)}</code></div>
                  <div>Site URL: <code className="text-blue-400">{gscData?.site_url || 'https://fleshlab.online/'}</code></div>
                </div>
                <div className="pt-2 border-t border-green-500/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>Public users: <code className="text-green-400">{fmt(publicMetrics.total_users)}</code></div>
                    <div>Public sessions: <code className="text-green-400">{fmt(publicMetrics.sessions)}</code></div>
                    <div>Public engaged: <code className="text-green-400">{fmt(publicMetrics.engaged_sessions)}</code></div>
                    <div>Public engagement: <code className="text-green-400">{fmtPct(publicMetrics.engagement_rate)}</code></div>
                    <div>Public views/user: <code className="text-green-400">{publicMetrics.views_per_user?.toFixed ? publicMetrics.views_per_user.toFixed(2) : '—'}</code></div>
                    <div>Avg engagement: <code className="text-green-400">{fmt(publicMetrics.average_engagement_time_seconds)}s</code></div>
                    <div>Excluded views: <code className="text-yellow-400">{fmt(excludedMetrics.page_views)}</code></div>
                    <div>Preview views: <code className="text-yellow-400">{fmt(excludedMetrics.preview_page_views)}</code></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-green-500/20">
                  <div className="text-xs text-green-300/80">
                    <strong>Note:</strong> Property ID (537674804) ≠ Measurement ID (G-3Z4DV3SVR8).<br/>
                    Backend uses Property ID for GA4 Data API. Frontend uses Measurement ID for gtag tracking.
                  </div>
                </div>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />Public Page Views</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{totalPageViews.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Last {dateRange} days, excluding admin/preview</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-primary" />Fanclub CTA</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{fmt(fanclubClicks)}</p><p className="text-xs text-muted-foreground mt-1">Last {dateRange} days</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Tracking Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">GA4 ID</span><code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{ga4PropertyId}</code></div>
                  <div className="flex flex-wrap gap-1">{['page_view', 'fanclub_cta_click', 'checkout_start'].map(event => (<Badge key={event} variant="outline" className="text-[10px]">{eventMap[event] > 0 ? '✓' : '○'} {event.split('_').pop()}</Badge>))}</div>
                  {events.length === 0 && <p className="text-[10px] text-yellow-500"><AlertCircle className="w-2.5 h-2.5 inline mr-0.5" />No events in response</p>}
                </CardContent>
              </Card>
            </div>

            <Card className="border-rose-500/35 bg-rose-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Users className="w-5 h-5 text-rose-400" />PERFORMER ACQUISITION SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">Organic recruitment sessions</p><p className="text-2xl font-bold">{fmt(recruitmentSummary.organic_recruitment_sessions || 0)}</p></div>
                  <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">Recruitment impressions</p><p className="text-2xl font-bold">{fmt(recruitmentGscImpressions)}</p></div>
                  <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">Recruitment clicks</p><p className="text-2xl font-bold">{fmt(recruitmentGscClicks)}</p></div>
                  <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">Recruitment CTR</p><p className="text-2xl font-bold">{fmtPct(recruitmentGscCtr)}</p></div>
                  <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">Avg recruitment position</p><p className="text-2xl font-bold">{recruitmentGscPosition ? recruitmentGscPosition.toFixed(1) : '—'}</p></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
                  <div className="rounded-xl border bg-card p-4">
                    <p className="mb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Funnel</p>
                    <div className="grid gap-3 md:grid-cols-4">
                      <div><p className="text-xs text-muted-foreground">Organic Recruitment Visit</p><p className="text-xl font-bold">{fmt(recruitmentSummary.organic_recruitment_sessions || 0)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Apply CTA</p><p className="text-xl font-bold">{fmt(recruitmentSummary.performer_apply_click || 0)}</p><p className="text-[10px] text-muted-foreground">{fmtPct(funnelRate(recruitmentSummary.performer_apply_click || 0, recruitmentSummary.organic_recruitment_sessions || 0))}</p></div>
                      <div><p className="text-xs text-muted-foreground">GA4 Application Start</p><p className="text-xl font-bold">{fmt(recruitmentSummary.application_start || 0)}</p><p className="text-[10px] text-muted-foreground">{fmtPct(funnelRate(recruitmentSummary.application_start || 0, recruitmentSummary.performer_apply_click || 0))}</p></div>
                      <div><p className="text-xs text-muted-foreground">GA4 Application Complete</p><p className="text-xl font-bold">{fmt(recruitmentSummary.application_complete || 0)}</p><p className="text-[10px] text-muted-foreground">{fmtPct(funnelRate(recruitmentSummary.application_complete || 0, recruitmentSummary.application_start || 0))}</p></div>
                    </div>
                    <div className="mt-4 grid gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm md:grid-cols-3"><div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">GA4 submits</span><span className="font-semibold">{fmt(recruitmentSummary.application_submit || 0)}</span></div><div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Application records</span><span className="font-semibold">{fmt(applicationsData?.application_records || 0)}</span></div><div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">WhatsApp clicks</span><span className="font-semibold">{fmt(recruitmentSummary.recruitment_whatsapp_click || recruitmentSummary.whatsapp_click || 0)}</span></div></div>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="mb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Philippines vs Non-Philippines</p>
                    <Table><TableHeader><TableRow><TableHead>Segment</TableHead><TableHead className="text-right">Organic</TableHead><TableHead className="text-right">Apply</TableHead><TableHead className="text-right">Start</TableHead><TableHead className="text-right">Complete</TableHead></TableRow></TableHeader><TableBody>{[
                      ['Philippines', recruitmentPhilippines],
                      ['Non-Philippines', recruitmentNonPhilippines],
                    ].map(([label, row]) => (<TableRow key={label}><TableCell className="font-medium text-xs">{label}</TableCell><TableCell className="text-right">{fmt(row.organic_recruitment_sessions || 0)}</TableCell><TableCell className="text-right">{fmt(row.performer_apply_click || 0)}</TableCell><TableCell className="text-right">{fmt(row.application_start || 0)}</TableCell><TableCell className="text-right">{fmt(row.application_complete || 0)}</TableCell></TableRow>))}</TableBody></Table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border bg-card p-4 lg:col-span-2">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Conversions by landing page / country / source</p>
                    <Table><TableHeader><TableRow><TableHead>Landing Page</TableHead><TableHead>Country</TableHead><TableHead>Source / Medium</TableHead><TableHead className="text-right">Sessions</TableHead></TableRow></TableHeader><TableBody>{recruitmentLandingBreakdown.slice(0, 10).map((row, i) => (<TableRow key={i}><TableCell className="text-xs font-medium truncate max-w-[220px]">{row.landing_page}</TableCell><TableCell className="text-xs">{row.country}</TableCell><TableCell className="text-xs text-muted-foreground">{row.source} / {row.medium}</TableCell><TableCell className="text-right">{fmt(row.sessions)}</TableCell></TableRow>))}</TableBody></Table>
                    {recruitmentLandingBreakdown.length === 0 && <p className="text-sm text-muted-foreground">No recruitment landing sessions yet.</p>}
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Recruitment events</p>
                    <Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader><TableBody>{recruitmentEvents.slice(0, 8).map((row, i) => (<TableRow key={i}><TableCell className="text-xs"><code>{row.event_name}</code><div className="text-[10px] text-muted-foreground">{row.country}</div></TableCell><TableCell className="text-right">{fmt(row.event_count)}</TableCell></TableRow>))}</TableBody></Table>
                    {recruitmentEvents.length === 0 && <p className="text-sm text-muted-foreground">No recruitment events yet.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" />Fan Conversion Funnel</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Page Views</span><span className="font-semibold">{totalPageViews.toLocaleString()}</span></div>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><span className="text-xl">🇵🇭</span> Philippines Recruitment</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Page Views</span><span className="font-semibold">{fmt(phPageViews)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">CTA Clicks</span><span className="font-semibold">{fmt(phCtaClicks)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">WhatsApp Clicks</span><span className="font-semibold">{fmt(phWhatsappClicks)}</span></div>
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Page → CTA</span><span className="font-medium">{fmtPct(phPageViews > 0 ? (phCtaClicks / phPageViews) * 100 : 0)}</span></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">CTA → WhatsApp</span><span className="font-medium">{fmtPct(phCtaClicks > 0 ? (phWhatsappClicks / phCtaClicks) * 100 : 0)}</span></div>
                  </div>
                  <div className="pt-2 border-t border-green-500/20">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Application records (PH)</span><span className="font-semibold">{fmt(applicationsData?.philippines_total || 0)}</span></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Source: philippines-recruitment</span><span className="font-medium">{fmt(applicationsData?.philippines_source || 0)}</span></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Campaign: pinoy_recruitment</span><span className="font-medium">{fmt(applicationsData?.philippines_campaign || 0)}</span></div>
                  </div>
                  {(phPageViews === 0 && phCtaClicks === 0 && (!applicationsData || applicationsData.philippines_total === 0)) && (<div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded"><p className="text-[10px] text-yellow-500 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" />No Philippines recruitment data yet</p></div>)}
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
                      {publicTrafficSources?.length ? (<Table><TableHeader><TableRow><TableHead>Channel</TableHead><TableHead>Source / Medium</TableHead><TableHead className="text-right">Sessions</TableHead></TableRow></TableHeader><TableBody>{publicTrafficSources.slice(0, 20).map((t, i) => (<TableRow key={i}><TableCell className="font-medium text-xs"><Badge variant="outline" className="text-[10px]">{t.channel}</Badge></TableCell><TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{t.source} / {t.medium}</TableCell><TableCell className="text-right">{fmt(t.sessions)}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-sm text-muted-foreground">No traffic data available</p>)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ExternalLink className="w-4 h-4 text-primary" />External Platform Traffic</CardTitle></CardHeader>
                    <CardContent>
                      {(() => {
                        const externalSources = (publicTrafficSources || []).filter(t => ['xhamster', 'pornhub', 'faphouse', 'twitter', 't.co', 'chaturbate'].some(s => t.source?.toLowerCase().includes(s)) || t.medium === 'referral');
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
                  <CardContent className="space-y-4">
                    {/* Key CTA Events Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg border bg-card"><p className="text-xs text-muted-foreground">Fanclub CTA</p><p className="text-lg font-bold">{fmt(fanclubClicks)}</p></div>
                      <div className="p-3 rounded-lg border bg-card"><p className="text-xs text-muted-foreground">Performer Apply</p><p className="text-lg font-bold">{fmt(bpClicks)}</p></div>
                      <div className="p-3 rounded-lg border bg-card"><p className="text-xs text-muted-foreground">Guest Production</p><p className="text-lg font-bold">{fmt(gpClicks)}</p></div>
                      <div className="p-3 rounded-lg border bg-card"><p className="text-xs text-muted-foreground">Checkout Started</p><p className="text-lg font-bold">{fmt(checkoutStarted)}</p></div>
                    </div>
                    {/* Full Events Table */}
                    {events?.length ? (<Table><TableHeader><TableRow><TableHead>Event Name</TableHead><TableHead className="text-right">Count</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{events.slice(0, 50).map((e, i) => { const isKeyEvent = ['page_view', 'fanclub_cta_click', 'guest_production_cta_click', 'performer_apply_click', 'recruitment_landing_view', 'application_start', 'application_submit', 'application_complete', 'recruitment_whatsapp_click', 'registration_start', 'checkout_start', 'video_detail_view', 'performer_profile_view'].includes(e.event_name); return (<TableRow key={i} className={isKeyEvent ? 'bg-primary/5' : ''}><TableCell className="font-medium text-xs"><code className="bg-muted px-1.5 py-0.5 rounded">{e.event_name}</code></TableCell><TableCell className="text-right">{fmt(e.event_count)}</TableCell><TableCell>{e.event_count > 0 ? (<Badge variant="default" className="text-xs bg-green-500">Active</Badge>) : (<Badge variant="outline" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />No data</Badge>)}</TableCell></TableRow>); })}</TableBody></Table>) : (<p className="text-sm text-muted-foreground">No event data available</p>)}
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs text-yellow-500 flex items-center gap-1 mb-1"><AlertCircle className="w-3 h-3" />Event tracking recently installed</p>
                      <p className="text-xs text-yellow-500/80">Historical data may be limited. Events will accumulate going forward.</p>
                    </div>
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