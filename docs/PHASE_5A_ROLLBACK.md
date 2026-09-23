# Phase 5A rollback record

Deployment: `3ba0ab9` (Phase 5A system administration with migration-ledger checksum fix)

Production host: `fleshlab-prod-vm` in resource group `fleshlab-prod`

Live release directory: `/opt/fleshlab/releases/fleshlab-3ba0ab9`

Previous release directory: `/opt/fleshlab/releases/fleshlab-067f43b`

Database backup created before migration:

`/opt/fleshlab/backups/phase5a-pre-0026-20260923-095718.sql.gz`

The backup gzip integrity was verified. Restore readiness is intentionally recorded as `NOT_RESTORE_TESTED`; no restore was attempted.

Rollback procedure:

1. Change to `/opt/fleshlab/releases/fleshlab-118acb1` and export the same compose environment values used by the live release.
2. Run `docker compose up -d --no-build --remove-orphans --force-recreate` with `COMPOSE_PROJECT_NAME=fleshlab`.
3. Verify `/healthz`, protected V3 authorization responses, public V3 catalogue, and V2 auth smoke routes.
4. Do not restore the database for application rollback. Migration `0026_v3_system_administration.sql` is additive and the previous release can run against the extended schema. Restore the recorded backup only if database rollback is explicitly required.

No production volume was deleted, recreated, or detached. The PostgreSQL volume remains the existing `fleshlab_postgres-data` volume.
