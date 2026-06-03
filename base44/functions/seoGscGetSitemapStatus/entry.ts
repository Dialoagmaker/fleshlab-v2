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

    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedSitemap}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const body = await res.json();

    if (!res.ok) {
      return Response.json({
        success: false,
        sitemap_url: sitemapUrl,
        http_status: res.status,
        error: body?.error?.message || JSON.stringify(body),
      });
    }

    return Response.json({
      success: true,
      sitemap_url: sitemapUrl,
      type: body.type,
      path: body.path,
      last_submitted: body.lastSubmitted || null,
      last_downloaded: body.lastDownloaded || null,
      is_pending: body.isPending || false,
      is_sitemaps_index: body.isSitemapsIndex || false,
      warnings: body.warnings || 0,
      errors: body.errors || 0,
      contents: body.contents || [],
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});