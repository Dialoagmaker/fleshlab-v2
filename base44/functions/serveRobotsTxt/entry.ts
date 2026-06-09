/**
 * serveRobotsTxt - Override platform auto-generated robots.txt
 * 
 * This function serves a custom robots.txt with the correct sitemap URL.
 * 
 * IMPORTANT: To activate this override, you must add a route in App.jsx
 * that intercepts /robots.txt requests and calls this function.
 * 
 * Alternatively, contact Base44 support to disable auto-generated robots.txt:
 * Email: support@base44.com
 * Subject: Disable auto-generated robots.txt - fleshlab.online
 * 
 * Message:
 * "Hello Base44 Team,
 * 
 * Please disable the auto-generated robots.txt for my app fleshlab.online (App ID: 69512bea20e7e5b8a6186fd5).
 * 
 * I have deployed a custom public/robots.txt file with the correct sitemap URL, but the platform's 
 * auto-generated robots.txt is overriding it. There is no 'Generate robots.txt' toggle visible in 
 * my SEO & GEO dashboard (German UI shows only: Meta-Tag-Einbindung, Strukturierte Daten, Indexierung).
 * 
 * I need the custom robots.txt at /robots.txt to be served instead of the auto-generated one.
 * 
 * App URL: https://fleshlab.online
 * App ID: 69512bea20e7e5b8a6186fd5
 * 
 * Thank you!"
 */

const ROBOTS_TXT = `# robots.txt for FLESHLAB Studios
# Updated: 2026-06-09

User-agent: *

# --- Block private/admin/system routes ---
Disallow: /admin/
Disallow: /performer/
Disallow: /account
Disallow: /client/
Disallow: /sign-contract
Disallow: /application-upload
Disallow: /fan-productions/request
Disallow: /checkout/
Disallow: /payment/
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /performerlogin

# --- Explicitly allow all public SEO routes ---
Allow: /$
Allow: /videos$
Allow: /videos/
Allow: /performers$
Allow: /performers/
Allow: /news$
Allow: /news/
Allow: /brands$
Allow: /brands/
Allow: /fanclub$
Allow: /fan-productions$
Allow: /guest-production$
Allow: /become-performer$
Allow: /gay-performer-recruitment-philippines$
Allow: /chaturbate-model-join-studio$
Allow: /gay-onlyfans-alternative$
Allow: /how-it-works$
Allow: /faq$
Allow: /terms$
Allow: /privacy$
Allow: /dmca$
Allow: /2257$
Allow: /imprint$
Allow: /cookie-policy$

# Sitemap
Sitemap: https://fleshlab.online/api/functions/sitemapXml
`;

Deno.serve(async (req) => {
  try {
    return new Response(ROBOTS_TXT, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
        'X-Robots-Tag': 'all',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});