import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Route classification based on App.jsx analysis
const ROUTE_MAP = {
  // Current public routes (indexable, canonical V2 URLs)
  public_current: [
    '/', '/videos', '/performers', '/news', '/become-performer',
    '/fanclub', '/guest-production', '/how-it-works', '/faq',
    '/terms', '/privacy', '/dmca', '/2257', '/brands',
  ],
  // Dynamic public route prefixes
  public_current_prefixes: ['/videos/', '/performers/', '/brands/', '/news/', '/fanclub/'],

  // V1 legacy paths — still exist as routes but are query-param redirectors or static redirects
  // These serve real traffic but redirect to V2 canonical URLs. NOT indexable targets.
  legacy_routes: [
    '/VideoDetail',   // LegacyVideoRedirect — reads ?id=, redirects to /videos/:slug
    '/ArticleReader', // LegacyArticleRedirect — reads ?id=, redirects to /news/:slug
    '/ActorDetail',   // LegacyActorRedirect — reads ?id=, redirects to /performers/:slug
    '/Videos',        // Static redirect → /videos
    '/Actors',        // Static redirect → /performers
    '/News',          // Static redirect → /news
    '/NewsCenter',    // Static redirect → /news
    '/Brands',        // Static redirect → /brands
    '/BecomePerformer', '/HowItWorks', '/Home',
  ],

  // Auth / protected — should never be indexed
  auth_protected: [
    '/login', '/register', '/forgot-password', '/reset-password',
    '/account', '/performer/login', '/performerlogin',
    '/performer/dashboard',
  ],

  // Admin — gated by admin role, should never be indexed
  admin_routes_prefix: '/admin',
};

function classifyPath(path) {
  if (path === '/' || ROUTE_MAP.public_current.includes(path)) return 'public_current';
  if (ROUTE_MAP.public_current_prefixes.some(p => path.startsWith(p))) return 'public_current';
  if (ROUTE_MAP.legacy_routes.includes(path)) return 'legacy_redirect';
  if (ROUTE_MAP.auth_protected.includes(path)) return 'auth_protected';
  if (path.startsWith(ROUTE_MAP.admin_routes_prefix)) return 'admin';
  // Capitalized single-segment paths not already listed = likely V1 legacy component names
  if (/^\/[A-Z]/.test(path)) return 'likely_legacy_v1';
  return 'unknown';
}

function classifyAll(rows) {
  const groups = {
    public_current: [],
    legacy_redirect: [],
    auth_protected: [],
    admin: [],
    likely_legacy_v1: [],
    unknown: [],
  };
  for (const row of rows) {
    const cat = classifyPath(row.page_path);
    groups[cat].push(row);
  }
  return groups;
}

async function runReport(accessToken, propertyId, startDate, endDate, limit = 25) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit,
      }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || JSON.stringify(body));
  return {
    row_count: body.rowCount || 0,
    rows: (body.rows || []).map(r => ({
      page_path: r.dimensionValues[0].value,
      page_views: parseInt(r.metricValues[0].value || '0', 10),
    })),
  };
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

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const ago7 = new Date(now - 7 * 86400000).toISOString().slice(0, 10);
    const ago28 = new Date(now - 28 * 86400000).toISOString().slice(0, 10);

    const [report7, report28] = await Promise.all([
      runReport(accessToken, ga4PropertyId, ago7, today),
      runReport(accessToken, ga4PropertyId, ago28, today),
    ]);

    // Specific path investigation for the 4 flagged paths
    const flaggedPaths = ['/VideoDetail', '/ArticleReader', '/AdminSmartThumbnails', '/Videos'];
    const investigation = flaggedPaths.map(p => {
      const cat = classifyPath(p);
      const r7 = report7.rows.find(r => r.page_path === p);
      const r28 = report28.rows.find(r => r.page_path === p);
      const notes = {
        '/VideoDetail': 'V1 legacy redirect. Route EXISTS in App.jsx as LegacyVideoRedirect. Reads ?id= param and 301-redirects to /videos/:slug. PUBLIC but not indexable target. Should be noindex.',
        '/ArticleReader': 'V1 legacy redirect. Route EXISTS in App.jsx as LegacyArticleRedirect. Reads ?id= param and 301-redirects to /news/:slug. PUBLIC but not indexable target. Should be noindex.',
        '/AdminSmartThumbnails': 'NOT a current route in App.jsx. Falls through to /:slug wildcard → LegacyPerformerSlug handler. Likely old V1 admin tool page that was publicly tracked. Receives real traffic but is a ghost route. INVESTIGATE: should 404 or redirect.',
        '/Videos': 'V1 static redirect. Route EXISTS in App.jsx as <Navigate to="/videos" replace />. Capital-V legacy path. Not a canonical URL. Should be noindex or canonicalized.',
      };
      return {
        path: p,
        classification: cat,
        views_last_7_days: r7?.page_views || 0,
        views_last_28_days: r28?.page_views || 0,
        exists_in_app_jsx: ['/VideoDetail', '/ArticleReader', '/Videos'].includes(p),
        is_public: p !== '/AdminSmartThumbnails',
        is_canonical_seo_target: false,
        recommendation: notes[p] || 'Unknown — investigate manually.',
      };
    });

    return Response.json({
      success: true,
      ga4_property_id: ga4PropertyId,
      last_7_days: {
        date_range: { start: ago7, end: today },
        total_rows: report7.row_count,
        top_pages: report7.rows,
        by_category: classifyAll(report7.rows),
      },
      last_28_days: {
        date_range: { start: ago28, end: today },
        total_rows: report28.row_count,
        top_pages: report28.rows,
        by_category: classifyAll(report28.rows),
      },
      flagged_path_investigation: investigation,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});