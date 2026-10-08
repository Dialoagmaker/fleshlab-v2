import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function classifyQueryPrimary(query) {
  const text = String(query || '').toLowerCase();
  if (/flesh\s*lab|fleshlab/.test(text)) return 'brand';
  if (/philippines|philippine|filipino|pinoy|manila|cebu|davao|\bph\b/.test(text)) return 'philippines_local';
  if (/performer|recruit|casting|model|actor|porn star|adult performer|join studio|studio/.test(text)) return 'performer_recruitment';
  if (/creator|content creator|onlyfans|fansly|cam|chaturbate|fanclub/.test(text)) return 'creator_content_creator';
  return 'other';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const siteUrl = Deno.env.get('GSC_SITE_URL');
    if (!siteUrl) return Response.json({ error: 'GSC_SITE_URL secret not set' }, { status: 500 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    const encodedSite = encodeURIComponent(siteUrl);
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Fetch top pages
    const pagesRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['page'],
          rowLimit: 20,
          orderBy: [{ field: 'CLICKS', sortOrder: 'DESCENDING' }],
        }),
      }
    );

    // Fetch top queries
    const queriesRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['query'],
          rowLimit: 20,
          orderBy: [{ field: 'CLICKS', sortOrder: 'DESCENDING' }],
        }),
      }
    );

    // Fetch overall summary (no dimensions)
    const summaryRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, dimensions: [] }),
      }
    );

    const [pagesBody, queriesBody, summaryBody] = await Promise.all([
      pagesRes.json(), queriesRes.json(), summaryRes.json(),
    ]);

    // Summary totals
    const summaryRow = summaryBody.rows?.[0] || null;
    const summary = summaryRow ? {
      clicks: summaryRow.clicks,
      impressions: summaryRow.impressions,
      ctr: parseFloat((summaryRow.ctr * 100).toFixed(2)),
      average_position: parseFloat(summaryRow.position.toFixed(1)),
    } : { clicks: 0, impressions: 0, ctr: 0, average_position: 0 };

    const topPages = (pagesBody.rows || []).map(r => ({
      page: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: parseFloat((r.ctr * 100).toFixed(2)),
      position: parseFloat(r.position.toFixed(1)),
    }));

    const bucketSummary = { brand:{ clicks:0, impressions:0, queries:0 }, performer_recruitment:{ clicks:0, impressions:0, queries:0 }, creator_content_creator:{ clicks:0, impressions:0, queries:0 }, philippines_local:{ clicks:0, impressions:0, queries:0 }, other:{ clicks:0, impressions:0, queries:0 } };
    const topQueries = (queriesBody.rows || []).map(r => {
      const primary_bucket = classifyQueryPrimary(r.keys[0]);
      bucketSummary[primary_bucket].clicks += r.clicks || 0;
      bucketSummary[primary_bucket].impressions += r.impressions || 0;
      bucketSummary[primary_bucket].queries += 1;
      return {
        query: r.keys[0],
        primary_bucket,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: parseFloat((r.ctr * 100).toFixed(2)),
        position: parseFloat(r.position.toFixed(1)),
      };
    });

    return Response.json({
      success: true,
      date_range: { start: startDate, end: endDate, days: 28 },
      summary,
      top_pages: topPages,
      top_queries: topQueries,
      query_bucket_summary: bucketSummary,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});