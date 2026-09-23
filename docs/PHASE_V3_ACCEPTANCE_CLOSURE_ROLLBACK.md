# V3 Acceptance Closure Rollback

Release deployed for acceptance closure:

- `/opt/fleshlab/releases/fleshlab-v3-primary-ready-d92eb5c`
- commit `d92eb5c64080b0c7f363a27c37a10f68b75325f1`
- pre-deployment backup: `/opt/fleshlab/backups/phase-v3-primary-ready-pre-20260923165704.sql.gz`

Rollback target:

- `/opt/fleshlab/releases/fleshlab-5c-0028`
- prior Commerce release based on commit `c799dc1`
- prior recorded rollback chain: `docs/PHASE_5C_ROLLBACK.md`

Rollback procedure on the Production VM:

1. Preserve current service logs and create a fresh PostgreSQL dump before changing the release.
2. Set `PUBLIC_HOST`, `PUBLIC_ORIGIN`, `AZURE_STORAGE_ACCOUNT_URL`, `POSTGRES_PASSWORD_FILE`, `SESSION_SECRET_FILE`, and `COMPOSE_PROJECT_NAME=fleshlab` as in `infra/bootstrap-vm.sh`.
3. Change directory to the rollback target and run `docker compose build api worker web`.
4. Run `docker compose run --rm api node server/migrate.js`; this is additive/idempotent and does not roll back schema.
5. Run `docker compose up -d --no-build --remove-orphans --force-recreate`.
6. Verify `/healthz`, authenticated V3 health, public catalogue, and V2 smoke routes.

The rollback is application/image rollback only. It does not delete volumes, restore over Production, or reverse migrations. If data rollback is ever required, use the isolated restore procedure first and obtain an explicit destructive-change decision.

Commerce provider execution remains disabled throughout rollback and recovery.
