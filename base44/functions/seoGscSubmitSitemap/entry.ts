import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    const sitemapUrl = 'https://fleshlab.online/sitemap.xml';
    const encodedSite = encodeURIComponent(siteUrl);
    const encodedSitemap = encodeURIComponent(sitemapUrl);

    // PUT with empty body = submit/resubmit sitemap
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedSitemap}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // GSC returns 200 with empty body on success
    if (res.status === 200 || res.status === 204) {
      console.log(`[seoGscSubmitSitemap] Sitemap submitted successfully: ${sitemapUrl}`);
      return Response.json({
        success: true,
        sitemap_url: sitemapUrl,
        http_status: res.status,
        message: 'Sitemap submitted successfully. GSC will process it shortly.',
      });
    }

    const body = await res.json().catch(() => ({}));
    console.error(`[seoGscSubmitSitemap] Failed: ${res.status}`, body);
    return Response.json({
      success: false,
      sitemap_url: sitemapUrl,
      http_status: res.status,
      error: body?.error?.message || JSON.stringify(body),
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});