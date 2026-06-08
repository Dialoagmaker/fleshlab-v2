import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Route classification matching App.jsx
const ROUTE_CATEGORIES = {
  public_current: ['/', '/videos', '/performers', '/news', '/become-performer', '/fanclub', '/guest-production', '/how-it-works', '/faq', '/terms', '/privacy', '/dmca', '/2257', '/brands'],
  public_prefixes: ['/videos/', '/performers/', '/brands/', '/news/', '/fanclub/'],
  legacy_routes: ['/VideoDetail', '/ArticleReader', '/ActorDetail', '/Videos', '/Actors', '/News', '/NewsCenter', '/Brands', '/BecomePerformer', '/HowItWorks', '/Home'],
  auth_protected: ['/login', '/register', '/forgot-password', '/reset-password', '/account', '/performer/login', '/performerlogin', '/performer/dashboard'],
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

async function runReport(accessToken, propertyId, startDate, endDate, dimensions, metrics, limit = 100) {
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

    // Parse date range from query params
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days') || '28';
    const days = parseInt(daysParam, 10);
    
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const startDate = new Date(now - days * 86400000).toISOString().slice(0, 10);

    // Run multiple reports in parallel
    const [
      topPagesRows,
      eventRows,
      trafficSourceRows,
    ] = await Promise.all([
      runReport(accessToken, ga4PropertyId, startDate, today, ['pagePath'], ['screenPageViews', 'activeUsers'], 50),
      runEventReport(accessToken, ga4PropertyId, startDate, today, null, 200),
      runTrafficSourceReport(accessToken, ga4PropertyId, startDate, today, 50),
    ]);

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
      top_pages: topPages,
      pages_by_category: pagesByCategory,
      events: {
        all_events: sortedEvents,
        by_page: eventByPage,
      },
      traffic_sources: trafficSources,
      tracking_health: {
        ga4_connected: true,
        last_pull: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});