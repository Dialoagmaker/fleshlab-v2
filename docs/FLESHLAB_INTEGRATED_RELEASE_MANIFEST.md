# FLESHLAB Integrated Release Candidate

This release candidate combines the approved LoyalFans D1 promo-media hardening
with the technical SEO infrastructure. It has not been deployed and no
production data, secrets, or provider state were changed.

## Source lineage

- LoyalFans production foundation: `4468b02716b18678860d78b6635c9ca3bf05a92d`
- D1 hardening: `2b1e5a243d688bef154c737bc8dbaae82cb705cf`
- SEO infrastructure changes: `ff1bef79cbc76db32e699b788c03cdaec0f9e93d`
- Dynamic sitemap completion: `b351d480a3f6734a6fb066eedfe2d26b1e7e0ec4`

The SEO changes are integrated on the D1 line. The API image includes the
shared SEO route policy module required by the sitemap endpoint.

## Database

The foundation contains migrations 0059–0063. Migration
`0064_v3_loyalfans_catalogue_promo_media_status.sql` is the only new migration
in this release; SEO requires none. The normal runner sorts migrations by
filename and applies each in its own transaction. Production must be backed up
and migration 0064 applied through that runner before application cutover.
This candidate did not apply any production migration.

## Provider safety

The Compose defaults keep `LOYALFANS_PROVIDER_CLIENT_ENABLED`,
`LOYALFANS_MEDIA_FULFILLMENT_ENABLED`, `LOYALFANS_CREATOR_LEDGER_POSTED_CONFIRMED`,
`PROVIDER_MEDIA_ENABLED`, and `LOYALFANS_CATALOGUE_SYNC_ENABLED` false unless
explicitly configured. No credential or activation value is included here.
Retrying the completed D1 catalogue run uses a **new run** with
`dry_run: false` and `restart: false`.

## SEO and routing

- Public `/` continues to rewrite to `/v3/`; Performer remains isolated on its
  own host and Nginx server block.
- The sitemap API uses only published/visible records and canonical route
  identifiers. Static public routes are filtered through the shared indexation
  rules.
- The Caddyfile preserves the origin alias, TLS paths, security headers, and
  host routing. Deployment must recreate Edge from the new release directory
  so its Caddyfile bind mount points at this release.

## Validation

- Full server suite: 635 passed, 0 failed, 1 skipped.
- Targeted LoyalFans/catalogue/media/fulfillment tests: 161 passed.
- Isolated PostgreSQL/API-container ffprobe integration: 20 cases passed; the
  optional real-Azure case was skipped because no dedicated test Azure target
  was configured.
- SEO/public-route, portal, sitemap, and Nginx-policy tests: 49 passed.
- Root and V3 builds, API image build, Web/Nginx image build, changed-file
  ESLint, Nginx configuration test, Caddyfile adaptation, and `git diff
  --check` passed.
- API container startup and health-route smoke test passed against isolated
  PostgreSQL. No production or LoyalFans endpoint was contacted.

Pure Caddyfile adaptation passed with non-secret test host values. Final Caddy
validation remains a deployment preflight because the production Compose
environment and mounted TLS certificate files are not present in this local
release worktree.

## Deployment prerequisites

1. Keep the current production release and image tags available for rollback.
2. Create a restricted database backup, then apply only migration 0064 with
   the normal runner and verify its schema/index state.
3. Build the API and Web targets from a clean checkout of the final commit.
   Recreate services consuming the shared API image as required by Compose.
4. Validate the candidate Caddyfile against the production Compose environment
   and mounted certificate paths before recreating Edge.
5. Cut over using the existing release/current-symlink procedure, keeping all
   LoyalFans and provider-media activation flags disabled.
6. Verify API, Worker, Web, Edge, sitemap, robots, public/private robots
   behavior, and rollback image availability. Do not roll back the additive
   migration as part of an application rollback.
