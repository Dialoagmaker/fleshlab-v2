import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Route classification matching App.jsx
const ROUTE_CATEGORIES = {
  public_current: ['/', '/videos', '/performers', '/news', '/become-performer', '/fanclub', '/guest-production', '/fan-productions', '/gay-performer-recruitment-philippines', '/gay-twink-performer-recruitment', '/chaturbate-model-join-studio', '/gay-onlyfans-alternative', '/live', '/live/fitmaster', '/how-it-works', '/faq', '/terms', '/privacy', '/dmca', '/2257', '/compliance', '/imprint', '/cookie-policy', '/brands'],
  public_prefixes: ['/videos/', '/performers/', '/brands/', '/news/', '/fanclub/', '/watch/collections/'],
  legacy_routes: ['/VideoDetail', '/ArticleReader', '/ActorDetail', '/Videos', '/Actors', '/News', '/NewsCenter', '/Brands', '/BecomePerformer', '/HowItWorks', '/Home', '/Imprint', '/guest-productions'],
  auth_protected: ['/login', '/register', '/forgot-password', '/reset-password', '/account', '/wallet', '/client/dashboard', '/performer/login', '/performerlogin', '/performer/dashboard'],
};

function classifyPath(path) {
  if (path === '/' || ROUTE_CATEGORIES.public_current.includes(path)) return 'public_current';
  if (ROUTE_CATEGORIES.public_prefixes.some(p => path.startsWith(p))) return 'public_current';
  if (ROUTE_CATEGORIES.legacy_routes.includes(path)) return 'legacy_redirect';
  if (ROUTE_CATEGORIES.auth_protected.includes(path)) return 'auth_protected';
  if (path.startsWith('/admin')) return 'admin';
  if (/^\/[A-Z]/.test(path)) return 'likely_legacy_v1';
  return 'unknown';
}

async function runReport(accessToken, propertyId, startDate, endDate, dimensions, metrics, limit = 100, dimensionFilter = undefined) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
        orderBys: metrics.length > 0 ? [{ metric: { metricName: metrics[0] }, desc: true }] : [],
        limit,
        dimensionFilter,
      }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || JSON.stringify(body));
  return body.rows || [];
}

async function runEventReport(accessToken, propertyId, startDate, endDate, eventName = null, limit = 100) {
  const dimensions = ['eventName', 'pagePath'];
  if (eventName) {
    dimensions.push('eventName');
  }
  
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }, { name: 'pagePath' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        dimensionFilter: eventName ? {
          filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: eventName } }
        } : undefined,
        limit,
      }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || JSON.stringify(body));
  return body.rows || [];
}

async function runTrafficSourceReport(accessToken, propertyId, startDate, endDate, limit = 50) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }, { name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit,
      }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || JSON.stringify(body));
  return body.rows || [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const ga4PropertyId = Deno.env.get('GA4_PROPERTY_ID');
    if (!ga4PropertyId) return Response.json({ error: 'GA4_PROPERTY_ID secret not set' }, { status: 500 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // Parse date range from function payload first; SDK invoke sends JSON body, not query params.
    let payload = {};
    try { payload = await req.json(); } catch (_) { payload = {}; }
    const url = new URL(req.url);
    const daysParam = payload.days || url.searchParams.get('days') || '28';
    const days = parseInt(daysParam, 10);
    
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const startDate = new Date(now - days * 86400000).toISOString().slice(0, 10);

    const excludePathPrefixes = ['/admin', '/login', '/register', '/forgot-password', '/reset-password', '/account', '/client/dashboard', '/performer/dashboard', '/performerlogin', '/performer/login', '/sign-contract', '/application-upload', '/wallet'];
    const productionHostFilter = { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'fleshlab.online' } } };
    const publicTrafficFilter = {
      andGroup: {
        expressions: [
          productionHostFilter,
          ...excludePathPrefixes.map(prefix => ({ notExpression: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: prefix } } } }))
        ]
      }
    };
    const previewHostFilter = { filter: { fieldName: 'hostName', stringFilter: { matchType: 'CONTAINS', value: 'base44.app' } } };
    const publicLandingFilter = {
      andGroup: {
        expressions: [
          productionHostFilter,
          { notExpression: { filter: { fieldName: 'landingPagePlusQueryString', stringFilter: { matchType: 'EXACT', value: '(not set)' } } } },
          { notExpression: { filter: { fieldName: 'landingPagePlusQueryString', stringFilter: { matchType: 'EXACT', value: '' } } } },
          ...excludePathPrefixes.map(prefix => ({ notExpression: { filter: { fieldName: 'landingPagePlusQueryString', stringFilter: { matchType: 'BEGINS_WITH', value: prefix } } } }))
        ]
      }
    };

    // Run multiple reports in parallel
    const [
      overviewRows,
      topPagesRows,
      eventRows,
      trafficSourceRows,
      landingPageRows,
      countryRows,
      hostnameRows,
      publicOverviewRows,
      previewOverviewRows,
      publicTrafficSourceRows,
      publicLandingPageRows,
      publicCountryRows,
    ] = await Promise.all([
      runReport(accessToken, ga4PropertyId, startDate, today, [], ['screenPageViews', 'activeUsers', 'totalUsers', 'sessions', 'engagedSessions', 'engagementRate', 'screenPageViewsPerUser', 'userEngagementDuration'], 1),
      runReport(accessToken, ga4PropertyId, startDate, today, ['pagePath'], ['screenPageViews', 'activeUsers'], 50),
      runEventReport(accessToken, ga4PropertyId, startDate, today, null, 200),
      runTrafficSourceReport(accessToken, ga4PropertyId, startDate, today, 50),
      runReport(accessToken, ga4PropertyId, startDate, today, ['landingPagePlusQueryString'], ['sessions', 'activeUsers', 'engagedSessions', 'screenPageViews'], 50),
      runReport(accessToken, ga4PropertyId, startDate, today, ['country'], ['sessions', 'activeUsers', 'screenPageViews'], 50),
      runReport(accessToken, ga4PropertyId, startDate, today, ['hostName'], ['sessions', 'activeUsers', 'screenPageViews'], 20),
      runReport(accessToken, ga4PropertyId, startDate, today, [], ['screenPageViews', 'activeUsers', 'totalUsers', 'sessions', 'engagedSessions', 'engagementRate', 'screenPageViewsPerUser', 'userEngagementDuration'], 1, publicTrafficFilter),
      runReport(accessToken, ga4PropertyId, startDate, today, [], ['screenPageViews', 'activeUsers', 'totalUsers', 'sessions', 'engagedSessions', 'engagementRate', 'screenPageViewsPerUser', 'userEngagementDuration'], 1, previewHostFilter),
      runReport(accessToken, ga4PropertyId, startDate, today, ['sessionDefaultChannelGrouping', 'sessionSource', 'sessionMedium'], ['sessions', 'activeUsers', 'screenPageViews', 'engagedSessions'], 50, publicTrafficFilter),
      runReport(accessToken, ga4PropertyId, startDate, today, ['landingPagePlusQueryString'], ['sessions', 'activeUsers', 'engagedSessions', 'screenPageViews', 'userEngagementDuration'], 50, publicLandingFilter),
      runReport(accessToken, ga4PropertyId, startDate, today, ['country'], ['sessions', 'activeUsers', 'screenPageViews', 'engagedSessions'], 50, publicTrafficFilter),
    ]);

    // Process overview metrics
    const overviewMetrics = overviewRows[0]?.metricValues || [];
    const overview = {
      page_views: parseInt(overviewMetrics[0]?.value || '0', 10),
      active_users: parseInt(overviewMetrics[1]?.value || '0', 10),
      total_users: parseInt(overviewMetrics[2]?.value || '0', 10),
      sessions: parseInt(overviewMetrics[3]?.value || '0', 10),
      engaged_sessions: parseInt(overviewMetrics[4]?.value || '0', 10),
      engagement_rate: Number(overviewMetrics[5]?.value || 0) * 100,
      views_per_user: Number(overviewMetrics[6]?.value || 0),
      average_engagement_time_seconds: overviewMetrics[1]?.value ? Math.round(Number(overviewMetrics[7]?.value || 0) / Math.max(1, Number(overviewMetrics[1]?.value || 1))) : 0,
    };

    function parseOverview(rows) {
      const values = rows[0]?.metricValues || [];
      const activeUsers = Number(values[1]?.value || 0);
      return {
        page_views: parseInt(values[0]?.value || '0', 10),
        active_users: parseInt(values[1]?.value || '0', 10),
        total_users: parseInt(values[2]?.value || '0', 10),
        sessions: parseInt(values[3]?.value || '0', 10),
        engaged_sessions: parseInt(values[4]?.value || '0', 10),
        engagement_rate: Number(values[5]?.value || 0) * 100,
        views_per_user: Number(values[6]?.value || 0),
        average_engagement_time_seconds: activeUsers ? Math.round(Number(values[7]?.value || 0) / activeUsers) : 0,
      };
    }

    const publicMetrics = parseOverview(publicOverviewRows);
    const previewMetrics = parseOverview(previewOverviewRows);
    const excludedInternalMetrics = {
      page_views: Math.max(0, overview.page_views - publicMetrics.page_views),
      active_users: Math.max(0, overview.active_users - publicMetrics.active_users),
      total_users: Math.max(0, overview.total_users - publicMetrics.total_users),
      sessions: Math.max(0, overview.sessions - publicMetrics.sessions),
      engaged_sessions: Math.max(0, overview.engaged_sessions - publicMetrics.engaged_sessions),
      preview_page_views: previewMetrics.page_views,
      preview_sessions: previewMetrics.sessions,
    };

    // Process top pages
    const topPages = topPagesRows.map(r => ({
      page_path: r.dimensionValues[0].value,
      page_views: parseInt(r.metricValues[0].value || '0', 10),
      active_users: parseInt(r.metricValues[1].value || '0', 10),
      category: classifyPath(r.dimensionValues[0].value),
    }));

    // Process events
    const eventCounts = {};
    const eventByPage = {};
    eventRows.forEach(r => {
      const eventName = r.dimensionValues[0].value;
      const pagePath = r.dimensionValues[1].value;
      const count = parseInt(r.metricValues[0].value || '0', 10);
      
      eventCounts[eventName] = (eventCounts[eventName] || 0) + count;
      
      if (!eventByPage[eventName]) eventByPage[eventName] = [];
      eventByPage[eventName].push({ page_path: pagePath, event_count: count });
    });

    // Combine duplicate event names (canonical naming)
    // checkout_start + checkout_started → checkout_start
    // registration_start + registration_started → registration_start
    const combinedCounts = {};
    Object.entries(eventCounts).forEach(([name, count]) => {
      if (name === 'checkout_started') {
        combinedCounts['checkout_start'] = (combinedCounts['checkout_start'] || 0) + count;
      } else if (name === 'registration_started') {
        combinedCounts['registration_start'] = (combinedCounts['registration_start'] || 0) + count;
      } else {
        combinedCounts[name] = (combinedCounts[name] || 0) + count;
      }
    });
    
    // Sort events by count
    const sortedEvents = Object.entries(combinedCounts)
      .map(([event_name, event_count]) => ({ event_name, event_count }))
      .sort((a, b) => b.event_count - a.event_count);

    // Process traffic sources
    const trafficSources = trafficSourceRows.map(r => ({
      channel: r.dimensionValues[0].value,
      source: r.dimensionValues[1].value,
      medium: r.dimensionValues[2].value,
      sessions: parseInt(r.metricValues[0].value || '0', 10),
      active_users: parseInt(r.metricValues[1].value || '0', 10),
      page_views: parseInt(r.metricValues[2].value || '0', 10),
    }));

    const landingPages = landingPageRows.map(r => ({
      landing_page: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value || '0', 10),
      active_users: parseInt(r.metricValues[1].value || '0', 10),
      engaged_sessions: parseInt(r.metricValues[2].value || '0', 10),
      page_views: parseInt(r.metricValues[3].value || '0', 10),
    }));

    const countries = countryRows.map(r => ({
      country: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value || '0', 10),
      active_users: parseInt(r.metricValues[1].value || '0', 10),
      page_views: parseInt(r.metricValues[2].value || '0', 10),
    }));

    const hostnames = hostnameRows.map(r => ({
      hostname: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value || '0', 10),
      active_users: parseInt(r.metricValues[1].value || '0', 10),
      page_views: parseInt(r.metricValues[2].value || '0', 10),
    }));

    const publicTrafficSources = publicTrafficSourceRows.map(r => ({
      channel: r.dimensionValues[0].value,
      source: r.dimensionValues[1].value,
      medium: r.dimensionValues[2].value,
      sessions: parseInt(r.metricValues[0].value || '0', 10),
      active_users: parseInt(r.metricValues[1].value || '0', 10),
      page_views: parseInt(r.metricValues[2].value || '0', 10),
      engaged_sessions: parseInt(r.metricValues[3].value || '0', 10),
    }));

    const publicLandingPages = publicLandingPageRows.map(r => {
      const activeUsers = Number(r.metricValues[1].value || 0);
      return {
        landing_page: r.dimensionValues[0].value,
        sessions: parseInt(r.metricValues[0].value || '0', 10),
        active_users: parseInt(r.metricValues[1].value || '0', 10),
        engaged_sessions: parseInt(r.metricValues[2].value || '0', 10),
        page_views: parseInt(r.metricValues[3].value || '0', 10),
        average_engagement_time_seconds: activeUsers ? Math.round(Number(r.metricValues[4].value || 0) / activeUsers) : 0,
      };
    });

    const publicCountries = publicCountryRows.map(r => ({
      country: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value || '0', 10),
      active_users: parseInt(r.metricValues[1].value || '0', 10),
      page_views: parseInt(r.metricValues[2].value || '0', 10),
      engaged_sessions: parseInt(r.metricValues[3].value || '0', 10),
    }));

    // Categorize pages
    const pagesByCategory = {
      public_current: [],
      legacy_redirect: [],
      auth_protected: [],
      admin: [],
      likely_legacy_v1: [],
      unknown: [],
    };
    topPages.forEach(page => {
      pagesByCategory[page.category].push(page);
    });

    return Response.json({
      success: true,
      date_range: { start: startDate, end: today, days },
      ga4_property_id: ga4PropertyId,
      overview,
      public_metrics: publicMetrics,
      excluded_internal_metrics: excludedInternalMetrics,
      total_page_views: overview.page_views,
      public_page_views: publicMetrics.page_views,
      top_pages: topPages,
      pages_by_category: pagesByCategory,
      events: {
        all_events: sortedEvents,
        by_page: eventByPage,
      },
      traffic_sources: trafficSources,
      landing_pages: landingPages,
      public_landing_pages: publicLandingPages,
      countries,
      public_countries: publicCountries,
      hostnames,
      public_traffic_sources: publicTrafficSources,
      tracking_health: {
        ga4_connected: true,
        last_pull: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});