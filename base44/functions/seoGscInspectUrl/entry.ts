import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// NOTE: This function uses the URL Inspection API to READ index status only.
// It does NOT request indexing. Indexing requests require Google Search Console UI.
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

    const body = await req.json().catch(() => ({}));
    const inspectUrl = body.url || 'https://fleshlab.online/';

    const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionUrl: inspectUrl,
        siteUrl: siteUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({
        success: false,
        inspected_url: inspectUrl,
        http_status: res.status,
        error: data?.error?.message || JSON.stringify(data),
        note: 'This function reads index status only. It does NOT request indexing.',
      });
    }

    const result = data.inspectionResult || {};
    const indexStatus = result.indexStatusResult || {};
    const mobileUsability = result.mobileUsabilityResult || null;
    const richResults = result.richResultsResult || null;

    return Response.json({
      success: true,
      inspected_url: inspectUrl,
      note: 'READ-ONLY inspection. Does NOT request indexing.',
      index_status: {
        verdict: indexStatus.verdict || null,
        coverage_state: indexStatus.coverageState || null,
        robots_txt_state: indexStatus.robotsTxtState || null,
        indexing_state: indexStatus.indexingState || null,
        last_crawl_time: indexStatus.lastCrawlTime || null,
        page_fetch_state: indexStatus.pageFetchState || null,
        google_canonical: indexStatus.googleCanonical || null,
        user_canonical: indexStatus.userCanonical || null,
        sitemap: indexStatus.sitemap || [],
        referring_urls: indexStatus.referringUrls || [],
        crawled_as: indexStatus.crawledAs || null,
      },
      mobile_usability: mobileUsability ? {
        verdict: mobileUsability.verdict || null,
        issues: (mobileUsability.issues || []).map(i => ({ type: i.issueType, severity: i.severity })),
      } : null,
      rich_results: richResults ? {
        verdict: richResults.verdict || null,
        detected_items: (richResults.detectedItems || []).map(i => ({
          rich_result_type: i.richResultType,
          items: i.items || [],
        })),
      } : null,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});