# FLESHLAB Public Approved Mockup Rollback

## Deployment

- Release: `/opt/fleshlab/releases/fleshlab-public-approved-mockup-20260925140959`
- Previous release: `/opt/fleshlab/releases/fleshlab-public-approved-mockup-20260925132456`
- Source revision: `eac0e16` (`Isolate public open call styles`)
- Packaged V3 visual artifact: `9a8b162`
- Target: `FLESHLAB-PROD / fleshlab-prod-vm`
- Scope: V3 public static bundle and `fleshlab-web-1` only
- No migration, DNS, Cloudflare, Caddy, API, worker, portal-auth or root/V2 change was made.
- The design references remain in `docs/design-reference/`.

## Rollback

From the VM, rebuild and restart the web container from the previous release:

```sh
cd /opt/fleshlab/releases/fleshlab-public-approved-mockup-20260925132456
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml -f docker-compose.portal.yml build web
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml -f docker-compose.portal.yml up -d --no-build --force-recreate web
```

This is a static-only rollback; no database restore is required. Do not change root-domain/V2 routing as part of rollback.

The release is static-only: the V3 public bundle changed, while the API, database,
worker, portals, DNS, Cloudflare and root/V2 route remained unchanged. The visual
deployment artifact branch is retained only to reproduce the uploaded bundle.

## Verification

After rollback, verify:

- `/v3/home`, `/v3/videos`, `/v3/performers` and performer detail return 200
- `/api/v3/public/homepage` remains JSON
- `fleshlab.online/`, `/Videos`, `/Login` and `/Admin` remain V2
- `admin.fleshlab.online`, `performer.fleshlab.online` and `earn.fleshlab.online` remain reachable
