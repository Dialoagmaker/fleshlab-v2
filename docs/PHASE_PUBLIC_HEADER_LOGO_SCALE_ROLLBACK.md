# Public header logo scale — rollback

- Scope: `v3/src/public.css` public header sizing only
- Production release: `/opt/fleshlab/releases/fleshlab-public-logo-scale`
- Previous web release: `/opt/fleshlab/releases/fleshlab-public-logo-final`
- No database migration, API, worker, Caddy, DNS, portal, auth, storage, or V2 changes

To roll back on `fleshlab-prod-vm`, restore only the previous web image:

```sh
cd /opt/fleshlab/releases/fleshlab-public-logo-final
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml --env-file .env build web
COMPOSE_PROJECT_NAME=fleshlab docker compose -f docker-compose.yml --env-file .env up -d --no-build --no-deps web
```

Verify `/v3/`, `/v3/performers`, `earn.fleshlab.online/` and the V2 root after rollback.
