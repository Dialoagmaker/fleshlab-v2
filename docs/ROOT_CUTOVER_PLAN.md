# FLESHLAB V3 root cutover plan

Status: planning only. No root-domain cutover is executed by the worker/homepage release.

## Current routing

- `https://fleshlab.online/` remains the V2 public application.
- `https://admin.fleshlab.online/` serves the V3 Admin portal.
- `https://performer.fleshlab.online/` serves the contracted Performer portal.
- `https://earn.fleshlab.online/` serves external Creator submission and earnings.
- The V3 public review route is `/v3/home` on the existing V3 public path; it does not change `/`.
- V3 public APIs remain under `/api/v3/public/*`; protected APIs remain host- and permission-scoped.

## Proposed future routing

1. Keep all portal hostnames and host-only cookies unchanged.
2. Route only the apex public `/` and approved public catalogue paths to the V3 brand homepage/catalogue origin.
3. Keep V2 on a preserved fallback hostname/origin during the observation window.
4. Keep `/api/v3/*` on the V3 API origin and retain any V2 `/api/*` behavior until dependency inventory and smoke tests prove it can be retired.
5. Add permanent redirects only after public URL inventory, canonical tags, and SEO monitoring are complete.

## Cutover checklist

- Snapshot Cloudflare DNS, Worker routes, Caddy config, active release, and database backup.
- Confirm TLS certificates cover the public hostname and that Cloudflare is Full (strict).
- Verify homepage, catalogue, video detail, performer, brand, collection, auth, media privacy, portals, and V2 fallback in a controlled host-resolution test.
- Confirm `X-Forwarded-Host`, secure cookies, CSRF origins, redirect targets, and cache headers for both V2 and V3.
- Switch routing only; do not delete V2 data, images, volumes, or the previous release.
- Run public desktop/mobile smoke tests and monitor 4xx/5xx, redirects, cache, and origin health.

## Rollback

Restore the previous apex route/origin and Caddy/Worker snapshots. Leave the V3 release and database backup intact. Re-run `/`, `/Videos`, `/Login`, `/Admin`, `/v3/home`, `/api/v3/public/homepage`, portal auth, and Earn health checks. No destructive rollback operation is required.

Expected downtime: zero for a routing-only change; treat the change as failed and roll back immediately if a P0 public, auth, media privacy, or portal regression appears.
