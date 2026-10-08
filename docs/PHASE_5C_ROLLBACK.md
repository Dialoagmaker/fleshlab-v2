# Phase 5C rollback record

## Release

- New release: `/opt/fleshlab/releases/fleshlab-5c-0028`
- Previous release: `/opt/fleshlab/releases/fleshlab-5b-0027`
- Migration: `0028_v3_commerce_operations.sql`
- Database backup: `/opt/fleshlab/backups/phase5c-pre-0028-20260923142305.sql.gz`
- Execution flag: `v3_commerce_execution=disabled`
- Payment integration: `not_configured`

## Rollback

1. Keep the PostgreSQL volume and all financial rows intact.
2. Stop the Phase 5C application containers with the normal Compose project command.
3. Point the Compose deployment back to `/opt/fleshlab/releases/fleshlab-5b-0027` and recreate only the application, worker and web containers.
4. Do not delete or recreate `fleshlab_postgres-data`.
5. The migration is additive. The Phase 5B release can continue to read the existing schema while the Phase 5C tables/columns remain in place.
6. Restore the database backup only if a separately approved database recovery is required; no automatic restore is part of this record.

## Verification

After rollback, verify `/healthz`, `/v3/`, the public V3 catalogue, the V2 public news endpoint, and PostgreSQL health. Confirm `v3_commerce_execution` remains disabled and inspect audit/migration status before any later re-deploy.
