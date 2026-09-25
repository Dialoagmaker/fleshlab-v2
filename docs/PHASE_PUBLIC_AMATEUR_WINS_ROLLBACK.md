# FLESHLAB Public `AMATEUR WINS.` Rollback

## Deployment

- Review release: `/opt/fleshlab/releases/fleshlab-public-amateur-wins-20260925122306b`
- Previous working release: `/opt/fleshlab/releases/fleshlab-homepage-streaming-reset-20260925102852`
- Database backup: `/opt/fleshlab/backups/phase-public-amateur-wins-pre-20260925122306.sql.gz`
- Target: `FLESHLAB-PROD / fleshlab-prod-vm`
- Scope: V3 public static bundle and `fleshlab-web-1` only
- No migration, DNS, Cloudflare, Caddy, API, worker, portal-auth or root/V2 change was made.

## Rollback

From the VM, rebuild and restart the web container from the previous release:

```sh
cd /opt/fleshlab/releases/fleshlab-homepage-streaming-reset-20260925102852
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml -f docker-compose.portal.yml build web
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml -f docker-compose.portal.yml up -d --no-build --force-recreate web
```

The backup is retained for recovery only; it is not required for this static-only rollback. Do not change root-domain/V2 routing as part of rollback.

## Verification

After rollback, verify:

- `/v3/home`, `/v3/videos`, `/v3/performers` and performer detail return 200
- `/api/v3/public/homepage` remains JSON
- `fleshlab.online/`, `/Videos`, `/Login` and `/Admin` remain V2
- `admin.fleshlab.online`, `performer.fleshlab.online` and `earn.fleshlab.online` remain reachable
