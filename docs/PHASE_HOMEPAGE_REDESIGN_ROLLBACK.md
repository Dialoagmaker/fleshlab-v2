# FLESHLAB V3 Homepage Redesign Rollback

## Deployment

- Review release: `/opt/fleshlab/releases/fleshlab-homepage-redesign-review-20260925095050`
- Previous working release: `/opt/fleshlab/releases/fleshlab-worker-homepage-0467533`
- Database backup: `/opt/fleshlab/backups/phase-homepage-redesign-pre-20260925094736.sql.gz`
- Target: `FLESHLAB-PROD / fleshlab-prod-vm`
- Scope: `portal-static/v3` and the `fleshlab-web-1` container only
- No migration, DNS, Cloudflare, Caddy, API, worker or portal-auth change was made.

## Rollback

From the VM, rebuild and restart the web container from the previous release:

```sh
cd /opt/fleshlab/releases/fleshlab-worker-homepage-0467533
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml -f docker-compose.portal.yml build web
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml -f docker-compose.portal.yml up -d --no-build --force-recreate web
```

The database backup is retained for recovery only; it is not required for this static-only rollback. Do not change the root-domain/V2 routing as part of this rollback.

## Verification

After rollback, verify:

- direct V3 review route `/v3/home` serves the previous V3 bundle
- `/api/v3/public/homepage` remains JSON
- `fleshlab.online/`, `/Videos`, `/Login` and `/Admin` remain V2
- `admin.fleshlab.online`, `performer.fleshlab.online` and `earn.fleshlab.online` remain reachable
