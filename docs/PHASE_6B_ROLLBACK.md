# Phase 6B rollback

Release: `fleshlab-6b-42b04e3` (application commit `42b04e3`, worker runtime fix `84858d0`).

Pre-release database backup: `/opt/fleshlab/backups/phase6b-pre-0030-20260923-182819.sql.gz`.

Rollback release: `/opt/fleshlab/releases/fleshlab-6a-0c93e2f`.

Rollback is application-only: run the existing release with the `fleshlab` Compose project and the protected runtime environment used for deployment. Migration `0030_v3_creator_submissions.sql` is additive; do not restore or delete production data as part of a normal application rollback. Restore the recorded database backup only into an isolated recovery environment after an explicit incident decision.

The Azure Blob CORS rule is scoped only to `https://earn.fleshlab.online`; retaining it does not publish blobs or grant public access.
