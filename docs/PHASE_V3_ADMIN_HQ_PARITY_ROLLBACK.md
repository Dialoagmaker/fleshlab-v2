# FLESHLAB V3 Admin HQ parity block

## Deployment

- Target: `FLESHLAB-PROD / fleshlab-prod-vm`
- New release: `/opt/fleshlab/releases/fleshlab-admin-overview-20260925202919`
- Previous release: `/opt/fleshlab/releases/fleshlab-label-brand-9acc093`
- Scope: Admin V3 Overview only; no database migration
- Unchanged: API, worker, PostgreSQL, Caddy, DNS, Cloudflare, V2 root, portal hosts, portal authorization and storage

The new Overview aggregates existing protected V3 projections for catalogue,
creators, production, growth, commerce, contracts, system health/audit and
creator submissions. It shows only values returned by PostgreSQL-backed APIs;
unavailable or non-migrated values remain `—` or an explicit empty state.

## Normal rollback

From `fleshlab-prod-vm`, recreate only the web container from the previous
release. Do not roll back PostgreSQL or remove any data:

```sh
COMPOSE_PROJECT_NAME=fleshlab docker compose \
  -f /opt/fleshlab/releases/fleshlab-label-brand-9acc093/docker-compose.yml \
  build web
COMPOSE_PROJECT_NAME=fleshlab docker compose \
  -f /opt/fleshlab/releases/fleshlab-label-brand-9acc093/docker-compose.yml \
  up -d --no-build --no-deps web
```

After rollback, verify the Admin login, the protected system overview,
`fleshlab.online/`, `fleshlab.online/Videos`, `performer.fleshlab.online/`,
and `earn.fleshlab.online/healthz`.

## Verification recorded

- Local `npx eslint v3/src/main.jsx --quiet`: passed
- Local `npm run build:v3`: passed
- Production canonical Docker web build: passed
- Admin page: HTTP 200 and deployed bundle contains the new HQ overview
- Admin login: HTTP 200
- Authenticated `/api/v3/admin/system/overview`: HTTP 200
- Unauthenticated protected admin API: HTTP 401
- V2 root, `/Videos`, `/Login`, `/Admin`: HTTP 200
- Performer portal: HTTP 200
- Earn portal and health endpoint: HTTP 200

No migration or backup was required because this release changes only the
compiled web application and existing API reads.
