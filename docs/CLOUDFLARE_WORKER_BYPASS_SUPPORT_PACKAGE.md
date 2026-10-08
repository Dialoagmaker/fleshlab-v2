# Cloudflare Support Package: FLESHLAB V3 Worker Route Bypass

**Prepared:** 2026-09-24 UTC  
**Scope:** Evidence-only investigation; no DNS, Worker, Render, routing, or Production changes were made.  
**Current state:** Rollback-stable production state preserved.

## Support request

Please investigate why the active Worker routes for the `fleshlab.online`
zone are registered on the correct active zone but public requests do not
execute the attached Worker. Public requests instead reach the existing
Render/Caddy origin directly.

The public hostname is unquestionably Cloudflare-served, but the V3 Worker
does not appear in the request path. Please check route-pattern matching and
edge dispatch for the two scheme-prefixed route patterns below.

## Zone and account

| Item | Value |
|---|---|
| Zone | `fleshlab.online` |
| Zone ID | `bbd914f59dc4b3ce2e61df679203e1b3` |
| Zone status | `active` |
| Plan | `Free Website` |
| Account ID | `aee5a2c1098dbb664c57f458dc7b99b3` |
| Authoritative nameservers | `rita.ns.cloudflare.com`, `weston.ns.cloudflare.com` |

## Exact Worker routes returned by the Cloudflare API

Read-only request: `GET /client/v4/zones/bbd914f59dc4b3ce2e61df679203e1b3/workers/routes`

| Route ID | Exact stored pattern | Attached script |
|---|---|---|
| `7a63d631623c44528738182f676fc1d6` | `fleshlab.online/api/*` | `fleshlab-api-gateway` |
| `db175eaa860b46279b92c48f479863d2` | `https://fleshlab.online/api/v3/*` | `fleshlab-v3-path-router` |
| `c580d637097a4932bba23132aab35c9c` | `https://fleshlab.online/v3/*` | `fleshlab-v3-path-router` |

The two V3 routes are in the same active zone and attached to the expected
Worker script. Their stored patterns are scheme-prefixed, unlike the active
legacy route.

## Public edge evidence

### `https://fleshlab.online/v3/`

Observed at 2026-09-24 17:10:24 UTC:

```text
HTTP/2 200
content-type: text/html; charset=utf-8
server: cloudflare
cf-cache-status: DYNAMIC
cf-ray: a40367032878e629-IAD
via: 1.1 Caddy
x-render-origin-server: uvicorn
alt-svc: h3=":443"; ma=86400
```

The response is V2/Render-origin HTML, not the V3 Worker response.

### `https://fleshlab.online/api/v3/public/homepage`

Observed at 2026-09-24 17:10:25 UTC:

```text
HTTP/2 200
content-type: text/html; charset=utf-8
server: cloudflare
cf-cache-status: DYNAMIC
cf-ray: a40367055f11e6f2-IAD
via: 1.1 Caddy
x-render-origin-server: uvicorn
alt-svc: h3=":443"; ma=86400
```

This endpoint should return V3 JSON but instead returns V2/Render-origin HTML.
The legacy `fleshlab.online/api/*` Worker route is therefore not the only
possible explanation; the more-specific V3 route is not dispatching either.

## `/cdn-cgi/trace`

Observed from the same public hostname:

```text
h=fleshlab.online
visit_scheme=https
colo=IAD
http=http/2
tls=TLSv1.3
warp=off
gateway=off
rbi=off
```

The trace confirms that the public hostname is being served by Cloudflare
edge. It does not show Worker execution, which is consistent with the origin
headers above.

## Wrangler tail evidence

A read-only tail attach was attempted for `fleshlab-v3-path-router` while
requesting both public paths:

```text
request: GET /v3/                         -> 200
request: GET /api/v3/public/homepage     -> 200
tail attach result: Cloudflare API code 10000, Authentication error
```

No Worker events were collected because the available Wrangler token did not
have permission to create a Worker tail session. No credential or token is
included in this package. This is an access limitation, not evidence that the
routes executed.

## Temporary probe-route result

The temporary probe route was not present in the final route table and was not
recreated for this package. The retained investigation result was:

- the probe response/marker was not observed on public V3 requests;
- public requests still returned the Render/Caddy signatures shown above;
- the public hostname and Cloudflare edge were reachable;
- no Production route or DNS change was left in place.

The historic probe request's exact Ray ID was not retained in the repository,
so it is intentionally not invented here. Cloudflare can correlate the
probe window using the zone logs and the route/script identifiers above.

## Interpretation

The evidence establishes all of the following:

1. `fleshlab.online` is active on the expected Cloudflare zone.
2. Both V3 Worker routes exist at zone level and point to
   `fleshlab-v3-path-router`.
3. The exact stored V3 patterns differ from the working legacy pattern by
   including `https://`.
4. Public V3 requests reach Cloudflare, but their responses come from the
   Render/Caddy origin and are not the intended V3 response.
5. The current evidence does not justify changing DNS, the apex origin, the
   legacy `/api/*` route, or the V3 routes without Cloudflare confirmation.

## Requested Cloudflare investigation

Please confirm:

- whether `https://fleshlab.online/v3/*` and
  `https://fleshlab.online/api/v3/*` are valid Worker Route patterns for this
  zone;
- whether scheme-prefixed patterns are normalized or ignored at dispatch;
- the route precedence result for these patterns against
  `fleshlab.online/api/*`;
- whether the route table shown by the API is the same table used by the
  public edge for this zone;
- whether any account/zone propagation or edge configuration issue prevents
  `fleshlab-v3-path-router` from receiving requests;
- the minimum permission needed to attach a Wrangler tail for definitive
  execution evidence.

## Production safety / rollback

No changes were made during this investigation. Keep the current rollback
target unchanged. Do not remove or alter the legacy `fleshlab.online/api/*`
route until its V2 dependency is separately preserved and Cloudflare confirms
the V3 dispatch issue.
