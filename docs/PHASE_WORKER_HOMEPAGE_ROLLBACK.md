# Worker hardening and V3 homepage rollback

Deployment: 2026-09-25

- Release: `/opt/fleshlab/releases/fleshlab-worker-homepage-0467533`
- Source commits: `0467533`, `de3d5c5`, `a7501ab`
- Migration: `0032_creator_submission_probe_hardening.sql`
- Backup: `/opt/fleshlab/backups/phase-worker-homepage-pre-0032-20260925081351.sql.gz`
- Immediate application rollback: `/opt/fleshlab/releases/fleshlab-portal-separation-f68f3a1`

## Scope

This release changes only the V3 API/worker, V3 static review build and additive probe-job schema. It does not change DNS, Cloudflare, Caddy, the apex root route, portal hostnames, or V2 data/volumes.

## Application rollback

1. Preserve current API/worker logs and take a fresh database backup.
2. Change to `/opt/fleshlab/releases/fleshlab-portal-separation-f68f3a1`.
3. Run `COMPOSE_PROJECT_NAME=fleshlab docker compose build api worker web`.
4. Run `COMPOSE_PROJECT_NAME=fleshlab docker compose up -d --no-build --remove-orphans --force-recreate api worker web`.
5. Do not restore PostgreSQL for an application-only rollback. Migration 0032 is additive and can remain in place.
6. Verify `/healthz`, Earn health/auth, admin/performer host isolation, `/v3/home` on the Azure V3 review origin, `/api/v3/public/homepage`, and V2 `/`, `/Videos`, `/Login`, `/Admin`.

The previous release remains available for immediate rollback. No storage object or production volume is deleted by this procedure.
