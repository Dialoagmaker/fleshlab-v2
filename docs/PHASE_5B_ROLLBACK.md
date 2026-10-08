# Phase 5B rollback record

Deployment: `fleshlab-5b-0027` (Growth domain completion)

Production host: `fleshlab-prod-vm` in resource group `fleshlab-prod`

Live release directory: `/opt/fleshlab/releases/fleshlab-5b-0027`

Previous release directory: `/opt/fleshlab/releases/fleshlab-3ba0ab9`

Database migration: `0027_v3_growth_domain.sql`

Database backup created before migration:

`/opt/fleshlab/backups/phase5b-pre-0027-20260923-110239.sql.gz`

The backup gzip integrity was verified. Restore readiness remains `NOT_RESTORE_TESTED`; no restore was attempted.

Rollback procedure:

1. Export the same compose environment values used by the live release and change directory to `/opt/fleshlab/releases/fleshlab-3ba0ab9`.
2. Run `docker compose up -d --no-build --remove-orphans --force-recreate` with `COMPOSE_PROJECT_NAME=fleshlab`.
3. Verify `/healthz`, public V3 catalogue, protected Growth authorization responses and V2 public/auth smoke routes.
4. Do not restore the database for application rollback. Migration `0027_v3_growth_domain.sql` is additive and the previous release can run against the extended schema. Restore the recorded backup only if database rollback is explicitly required.

No production volume was deleted, recreated or detached. The existing `fleshlab_postgres-data` volume remains in use.
