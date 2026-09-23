# Phase 4 rollback record

Deployment: `118acb1` (`Complete Phase 4 production operations`)

Production host: `fleshlab-prod-vm` in resource group `fleshlab-prod`

Live release directory: `/opt/fleshlab/releases/fleshlab-118acb1`

Previous release directory: `/opt/fleshlab/releases/fleshlab-20260922183505-v3-production-fix`

Database backup created before migration:

`/opt/fleshlab/backups/phase4-pre-0025-20260923-0925.sql.gz`

Rollback procedure:

1. Export the same compose environment values used by the live release and change directory to the previous release directory.
2. Run `docker compose up -d --no-build --remove-orphans --force-recreate`.
3. Verify `/healthz`, protected V3 authorization responses, and the V2 smoke routes.
4. Restore the backup only if database rollback is explicitly required; the Phase 4 migration is additive and does not require data removal for application rollback.

No production volume was deleted or recreated. The PostgreSQL volume remains `postgres-data` under the existing `fleshlab` compose project.
