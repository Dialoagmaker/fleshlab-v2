# V3 P0 Block 1 rollback

This release adds the standalone V3 Performer Operations domain and migration
`0031_v3_performer_operations.sql`.  It also prepares the Azure V3 ingress to
accept both `fleshlab.online` and `earn.fleshlab.online` as explicit allowed
origins; only the `/v3/` and `/api/v3/` main-domain paths are intended for the
separate, reversible edge-routing change.  The root `fleshlab.online/` route
remains on V2.

## Normal application rollback

1. Keep the pre-Block-1 release directory active as the rollback target.
2. Re-run its existing Compose deployment with its recorded non-secret runtime
   environment.
3. Restore the edge route to its previous origin or disable only the two
   main-domain V3 path rules.  Do not change the root-domain V2 route and do
   not alter `earn.fleshlab.online`.

Migration 0031 is additive.  A normal application rollback must **not** delete
performers, user links, audit records, or production data.  Use the recorded
pre-deployment database backup only for an isolated recovery exercise after an
explicit incident decision.

## Final release record

- Application commit: `05c39d2` (`Add V3 performer operations domain`)
- Azure production release: `/opt/fleshlab/releases/fleshlab-p0-block1-05c39d2`
- Application rollback release: `/opt/fleshlab/releases/fleshlab-earn-848aa0a`
- Pre-deployment backup:
  `/opt/fleshlab/backups/p0-block1-pre-0031-20260924-101605.sql.gz`
- Applied migration: `0031_v3_performer_operations.sql`
- Edge routing artifact: commit `93e1721`,
  `infra/cloudflare-v3-path-router.js`.

The worker must be attached only to `fleshlab.online/v3*` and
`fleshlab.online/api/v3/*`. Its route identifiers are recorded after the
authenticated Cloudflare deployment; it has no root-domain route by design.
