# LoyalFans initial-rollout activation checklist

This is preparation only. Every production stage needs separate authorization. Do not use
infra/bootstrap-vm.sh: it combines image changes, database migration and container recreation.

## Deployment topology and protected configuration

Development/source: columbus-core-01, /home/columbusadmin/src/fleshlab-v2.
Runtime: fleshlab-prod-vm in resource group FLESHLAB-PROD, Compose project fleshlab,
API service/container api / fleshlab-api-1. The worker does not consume creator-session secrets.
Preserve the running API release's protected .env and existing PostgreSQL/session secret file paths.
Do not assume the current symlink identifies the API's Compose configuration; inspect each container label.

| Host secret file on production VM | API configuration | Container file |
| --- | --- | --- |
| /opt/fleshlab/secrets/loyalfans/bearer_token | LOYALFANS_CREATOR_BEARER_TOKEN_FILE | /run/secrets/loyalfans_creator_bearer_token |
| /opt/fleshlab/secrets/loyalfans/cookie_header | LOYALFANS_CREATOR_COOKIE_HEADER_FILE | /run/secrets/loyalfans_creator_cookie_header |
| /opt/fleshlab/secrets/loyalfans/xsrf_token | LOYALFANS_XSRF_TOKEN_FILE | /run/secrets/loyalfans_creator_xsrf_token |
| /opt/fleshlab/secrets/loyalfans/user_agent | LOYALFANS_CREATOR_USER_AGENT_FILE | /run/secrets/loyalfans_creator_user_agent |

The four values come from one authorized FLESHLAB-controlled creator-account web session;
this is neither OAuth nor an official developer API. Never use a customer session.
Use the existing interactive import script only after separate authorization. Directory mode 0700,
files mode 0600, root ownership. If the provider stays disabled during a container rollout, Compose
still needs all four mounted files to exist; empty restricted placeholders suffice. Creating placeholders
or installing the importer is an explicit deployment preparation action, not part of this local freeze.
The secret reader accepts direct server environment fallbacks, but deployment uses only the _FILE keys.
Clear any direct token/cookie/XSRF/User-Agent override; it takes precedence over the file reader.

## Non-secret server configuration

| Key | Required action / default |
| --- | --- |
| LOYALFANS_CREATOR_CATALOGUE_SLUG | Set the explicitly reviewed creator slug; no default. |
| LOYALFANS_CREATOR_CATALOGUE_LIMIT | Numeric 36 for the observed contract; adjustable. |
| LOYALFANS_CREATOR_COMMENTS_REQUEST_CONTRACT_JSON | Leave empty for built-in observed POST/terminal first-page contract, or use the equivalent validated JSON in LOYALFANS_REQUEST_CONTRACTS.md. |
| LOYALFANS_CREATOR_COMMENTS_PATH_TEMPLATE | Leave empty: legacy GET never attests completeness. |
| LOYALFANS_CREATOR_CATALOGUE_REQUEST_CONTRACT_JSON | Leave empty to use configured slug/limit and built-in observed POST, or supply the equivalent explicit validated JSON. JSON overrides slug/limit, so configure one source of truth. |
| LOYALFANS_CREATOR_CATALOGUE_PATH | Leave empty: legacy GET override is unnecessary. |
| LOYALFANS_CREATOR_CATALOGUE_PAGE_PARAMETER | Leave empty: observed page belongs in POST body as a string. |
| PROVIDER_MEDIA_ALLOWED_HOSTS | Explicit comma-separated approved exact CDN hostnames from authorized media response metadata; no guessed host defaults. |
| PROVIDER_MEDIA_ALLOWED_SUBDOMAIN_ROOTS | Empty unless explicit subdomain policies have been separately approved. Full video HTTPS only; redirects rejected. |
| LOYALFANS_CREATOR_MEDIA_HOSTS | Separately reviewed poster/trailer host list. This existing copier allows listed host and its subdomains; use the narrowest approved CDN hostnames. |
| LOYALFANS_CREATOR_SETTLEMENT_CURRENCY | Explicit validated three-letter accounting currency; no inferred default. Explicit transaction currency takes precedence. |
| LOYALFANS_CREATOR_LEDGER_POSTED_CONFIRMED | false until creator earnings-ledger posting semantics are explicitly adopted; then true. This is internal evidence, not an invented upstream status. |
| LOYALFANS_PROVIDER_CLIENT_ENABLED | false by default; enable only for separately authorized creator connection validation. |
| PROVIDER_MEDIA_ENABLED | false until schema/storage/policy/mappings/evidence checks pass. |
| LOYALFANS_MEDIA_FULFILLMENT_ENABLED | false until purchase fulfillment is explicitly authorized. |
| LOYALFANS_CATALOGUE_SYNC_ENABLED | false until catalogue writes are explicitly authorized; dry-run first. |
| LOYALFANS_CATALOGUE_TRAILER_INGESTION_ENABLED | false until permitted trailer ingestion is explicitly authorized. |
| AZURE_STORAGE_ACCOUNT_URL | Preserve the existing FLESHLAB Azure account URL and managed identity / DefaultAzureCredential access. |
| PRIVATE_UPLOAD_CONTAINER | Preserve existing private-uploads storage; no new storage system or account keys. |
| PROVIDER_MEDIA_MAX_BYTES | Default 21474836480, review operational capacity. |
| PROVIDER_MEDIA_TIMEOUT_MS | Default 1800000, review capacity and reverse-proxy timeout. |

Observed Store: POST /api/v2/videos-store?ngsw-bypass=true,
body {slug: configured string, page: String(page), limit: configured number, type: "video"}.
Observed total=116, per_page=36, last_page=4 are capture metadata only. Traverse actual page_meta.
Observed comments: POST /api/v1/comments?ngsw-bypass=true, body {uid: exact post UID} only.
Completeness requires each top-level page_token, page_token_newer, token_id and token_newer_id to be
absent or null. Any non-null value requires continuation and fails closed. Comment-local markers do not
matter. The exact challenge token may be surrounded by ordinary text; exact post/buyer UID checks remain.

## Exact content mappings

| External post UID | Captured creator transaction ID |
| --- | --- |
| tWrelA-2Beh7bnE5wDeOPQ1I2P-2B-2Fpb-2Fu56RI2htrTcsqo | 6ac4b8e661353658a7d80631 |
| 0Qkybb8-2B8wc9XznSwOkJbvq8Ikn3xYgOheGGEnVczDg | 6ac4b5ea3436647836d8058e |

For each exact post UID: review authoritative owner/media UID; choose the exact existing FLESHLAB
video_legacy_id explicitly; verify one active external mapping and no second post assigned to that
master; verify its public LoyalFans post URL; verify published catalogue state and expected price/currency.
No FLESHLAB video IDs are supplied by this release preparation. No title/slug/fuzzy matching.
Missing or ambiguous mappings remain blocked. Prefer existing READY private primary source assets.
Where no master exists, the verified creator sale's fresh video URL goes to one generic private ingestion
job. Do not duplicate existing assets. Grant access only after validation, MEDIA_READY and publication.
Create/verify the FLESHLAB user to immutable external buyer UID link using a fresh one-time challenge;
do not replay the already captured test challenge. Captured transactions prove contract shape, not a new order.

## Staged activation (not executed)

A. Verify the detached release manifest commit/archive SHA-256, target-directory absence and disk capacity.
   Preserve API .env (0600) and rollback image tags before building. Transfer/stage the immutable source;
   build/tag api, worker and web. No migrations, symlink update, container recreation or provider activation.
B. Create and verify a restricted PostgreSQL backup (pg_dump exit 0, nonempty dump, 0600). Re-read migration
   status with candidate server/migration-status.js against the existing DB. Pending must be exactly 0059,
   0060, 0061, 0062; existing records through 0058 must remain applied. Stop on any drift/checksum mismatch.
   Separately authorized explicit candidate node server/migrate.js runs sorted filenames, each transactionally.
   Verify all four ledger records and expected schema; no creator credentials or provider activation yet.
   Execute migration in a one-off candidate image using preserved database/session configuration, not a cached
   running image. Do not depend on the old bootstrap script's combined rollout.
   After separate release-switch authorization, atomically switch current and recreate api/worker/web from
   the new candidate Compose configuration/images; verify container working_dir/config_files labels,
   immutable image IDs and health. Updating current alone never changes running containers.
C. Separately authorized local production secret import/check. Configure explicit currency, approved CDN
   hosts, observed request contracts and creator slug/limit. Enable creator client only and recreate API
   with approved config. Run bounded read-only connection/comments/transaction-history probes, no purchase
   or media ingestion. Validate exact mapping and catalogue dry-run. Authorize mapping/catalogue writes
   separately. Enable POSTED/media/fulfillment only after all prerequisites pass; no automatic activation.

## Rollback prerequisites

Before A: retain previous current target, each API/worker/Web immutable image ID/tag, each original Compose
config path/project name, API .env and existing secret paths. Do not prune rollback images.
A rollback before switching: remove only the unused staged candidate if desired; serving processes unchanged.
B rollback: leave additive schema/audit columns in place and use compatible previous application images.
No automatic DROP/down migration. A database restore requires separate authorization, paused writers,
verified backup restore and explicit reconciliation of any post-backup financial/provenance changes.
Application switch rollback: restore previous symlink AND recreate each service with its recorded previous
Compose configuration/image. A symlink rollback alone does not restore API/Web container contents.
C rollback: disable creator/catalogue/media/fulfillment flags and recreate API with approved prior config.
Preserve entitlements, payment observations, private assets and audit/provenance. Stop ingestion writers;
rotate/revoke the creator session through the operator-controlled re-auth path if needed. Do not delete
production media or unrelated entitlements.

## Known initial limitations

Multi-page comments fail closed; original-linked reversals require authoritative linkage and unresolved
reimbursements/chargebacks remain manual review. Settlement currency and POSTED adoption are explicit.
Creator credentials are not yet populated or live-validated in this preparation. Both captured purchase
post UIDs require reviewed exact production mappings. Failed ingestion retries occur via customer/admin
reconciliation with fresh creator evidence/URL; no independent polling worker is introduced.

## Compatibility patch after the read-only production probe

Base production release: `9eea2d7e55501c4dfd7606ef905cdc1d9daf4ea9`. The subsequent authorized
read-only probe confirmed creator authentication, 116 unique Store records with current limit 36 and
last page 4, both captured transactions and full-video host `cdn2.loyalfans.com`. Those catalogue counts
remain observations, not traversal constants. Creator secrets were imported separately; this patch neither
reads nor imports them. Production catalogue identities for the two captured posts exist without masters.

The patch accepts observed timezone-bearing timestamp objects, absent/null initial-comment continuation
markers and distinct challenge tokens surrounded by ordinary text. No migration or new configuration key
is required. Existing request-contract JSON with the four top-level null predicates remains compatible.
The earlier stage checklists above describe the original release preparation; do not rerun already applied
0059–0062 or overwrite existing configuration/mappings as part of this patch.

Patch deployment requires separate authorization. Before switching, record the previous immutable images,
Compose paths, release symlink and protected API configuration. Preserve creator secret files and all
existing false activation flags. Stage/build the immutable patch archive, then cut over only the approved
application services using the established release mechanism. No migration, credential import, provider
activation, catalogue write, ingestion or entitlement creation is part of patch deployment.

After an authorized patch deployment, separately authorize bounded read-only probes: catalogue traversal
and non-mutating dry-run, then terminal first-page comments against the known test post. Report technical
counts/UIDs only; do not log credentials or signed URLs. The patch's local 116-item regression uses neutral
fixtures reconstructing the observed wire shape, not a fresh upstream request or archived raw live content.
Multi-page comments remain fail-closed. Customer onboarding still requires a fresh one-time challenge.
Rollback restores the prior application release/images and preserved configuration; database schema and
existing products remain untouched. See `LOYALFANS_COMPATIBILITY_PATCH_RELEASE.md`.
