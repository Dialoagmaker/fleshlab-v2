# Phase 6A public homepage rollback

Production release deployed for Phase 6A:

- `/opt/fleshlab/releases/fleshlab-6a-0c93e2f`
- commit `0c93e2f1ff057be062e6c5a685c9ffc8e6df02ff`
- migration `0029_v3_public_homepage.sql`
- pre-deployment backup `/opt/fleshlab/backups/phase6a-pre-0029-20260923-174535.sql.gz`

Immediate application rollback target:

- `/opt/fleshlab/releases/fleshlab-v3-primary-ready-d92eb5c`

`0029_v3_public_homepage.sql` is additive. It creates only the singleton
`v3_public_homepage_config` table and its default row. No production data,
volume, catalogue row or media object is deleted by application rollback.

## Procedure

1. Preserve current logs and take a fresh PostgreSQL backup.
2. Export the same runtime environment used by the production release:
   `PUBLIC_HOST`, `PUBLIC_ORIGIN`, `AZURE_STORAGE_ACCOUNT_URL`,
   `POSTGRES_PASSWORD_FILE`, `SESSION_SECRET_FILE`, and
   `COMPOSE_PROJECT_NAME=fleshlab`.
3. Change to `/opt/fleshlab/releases/fleshlab-v3-primary-ready-d92eb5c`.
4. Run `docker compose build api worker web`, then
   `docker compose up -d --no-build --remove-orphans --force-recreate`.
5. Do not restore PostgreSQL for an application-only rollback. Restore the
   recorded backup only after an explicit database recovery decision.
6. Verify `/healthz`, `/v3/`, `/api/v3/public/homepage`, `/v3/videos`, and
   the V2 public news endpoint. Confirm Commerce execution remains disabled.

The temporary firewall rule attempted during artifact upload was removed; the
storage account remains `Deny` by default. The deployed release was prepared
from the current production revision using a verified compressed Git diff when
the artifact store rejected the authenticated upload.
