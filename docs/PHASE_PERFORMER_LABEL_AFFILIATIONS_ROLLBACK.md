# FLESHLAB Performer Label Affiliations Rollback

## Deployment record

- Target: `FLESHLAB-PROD / fleshlab-prod-vm`
- Application commit: `ffccc43` (`Add performer label affiliations and public terminology`)
- Release: `/opt/fleshlab/releases/fleshlab-performer-labels-ffccc43`
- Applied migration: `0033_v3_performer_label_affiliations.sql`
- Pre-deployment database backup: `/opt/fleshlab/backups/phase-performer-labels-pre-0033-20260925152608.sql.gz`
- Previous API/worker release: `/opt/fleshlab/releases/fleshlab-worker-homepage-0467533`
- Previous approved public web release: `/opt/fleshlab/releases/fleshlab-public-approved-mockup-20260925140959`
- Scope: V3 public performer projections, performer label affiliation administration, public terminology, and the additive affiliation schema.
- No DNS, Cloudflare, Caddy, root/V2 routing, portal host, storage, Commerce provider, or Columbus change.

## Normal application rollback

Migration `0033_v3_performer_label_affiliations.sql` is additive. Do not drop
the affiliation table or restore PostgreSQL during a normal application
rollback. The previous application can run while the additional table and
relations remain in place.

From the VM, preserve logs and recreate the prior API/worker and approved web
containers from their recorded releases:

```sh
COMPOSE_PROJECT_NAME=fleshlab docker compose \
  -f /opt/fleshlab/releases/fleshlab-worker-homepage-0467533/docker-compose.yml \
  -f /opt/fleshlab/releases/fleshlab-worker-homepage-0467533/docker-compose.portal.yml \
  build api worker
COMPOSE_PROJECT_NAME=fleshlab docker compose \
  -f /opt/fleshlab/releases/fleshlab-worker-homepage-0467533/docker-compose.yml \
  -f /opt/fleshlab/releases/fleshlab-worker-homepage-0467533/docker-compose.portal.yml \
  up -d --no-build --no-deps api worker

COMPOSE_PROJECT_NAME=fleshlab docker compose \
  -f /opt/fleshlab/releases/fleshlab-public-approved-mockup-20260925140959/docker-compose.yml \
  -f /opt/fleshlab/releases/fleshlab-public-approved-mockup-20260925140959/docker-compose.portal.yml \
  build web
COMPOSE_PROJECT_NAME=fleshlab docker compose \
  -f /opt/fleshlab/releases/fleshlab-public-approved-mockup-20260925140959/docker-compose.yml \
  -f /opt/fleshlab/releases/fleshlab-public-approved-mockup-20260925140959/docker-compose.portal.yml \
  up -d --no-build --no-deps web
```

Verify `/healthz`, the public performer API, `/v3/home`, `/v3/performers`,
V2 `/`, `/Videos`, `/Login`, `/Admin`, all three portal hosts, and Earn health.

## Database recovery

The backup is retained for an isolated recovery exercise. Restoring it over
Production would remove subsequent data and is not part of an application
rollback. It requires a separate incident decision and an isolated restore
first.
