# Public FLESHLAB logo asset — rollback

## Release

- Change: replace recreated public wordmarks with the approved FLESHLAB / AMATEUR WINS asset
- Scope: V3 public catalogue surfaces and Earn public/authenticated shell only
- Source commit: `Use approved FLESHLAB logo asset` (release manifest records the exact deployed revision)
- Production release: `/opt/fleshlab/releases/fleshlab-public-logo-final`
- Previous web release: `/opt/fleshlab/releases/fleshlab-public-logo`
- Database: no migration and no database backup required
- Unchanged: API, worker, PostgreSQL, Caddy, DNS, portal authorization, storage, and V2 root

## Rollback

On `fleshlab-prod-vm`, restore only the previous web image:

```sh
cd /opt/fleshlab/releases/fleshlab-public-logo
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml --env-file .env build web
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml --env-file .env up -d --no-build --no-deps web
```

This leaves the API, worker, database, edge proxy, DNS and all portal sessions untouched. Verify `/v3/`, `/v3/performers`, `earn.fleshlab.online/` and the V2 root after rollback.
