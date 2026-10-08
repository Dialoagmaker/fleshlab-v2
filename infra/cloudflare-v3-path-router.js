// Cloudflare Worker for the two V3 paths only.  Attach it to
// `fleshlab.online/v3*` and `fleshlab.online/api/v3/*`; do not attach it to
// the root route.  The origin hostname deliberately remains the already-live
// Azure V3 host, so a rollback is simply removal of these two path routes.
const V3_ORIGIN = 'https://earn.fleshlab.online';

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const target = new URL(request.url);
    target.protocol = 'https:';
    target.hostname = new URL(V3_ORIGIN).hostname;
    target.port = '';

    // The client still sees fleshlab.online. Cookies returned by this response
    // therefore remain host-only for the main domain; no broad Domain cookie
    // is introduced. The V3 API explicitly accepts that exact origin.
    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-Host', incoming.hostname);
    headers.set('X-Forwarded-Proto', incoming.protocol.replace(':', ''));
    return fetch(new Request(target, { method: request.method, headers, body: request.body, redirect: request.redirect }));
  }
};
