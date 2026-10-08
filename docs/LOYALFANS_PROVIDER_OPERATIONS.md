# LoyalFans creator provider deployment preparation

The FLESHLAB LoyalFans client sends the observed creator web API request. It is
an integration operated with a dedicated FLESHLAB-controlled creator account,
not OAuth or an official LoyalFans developer API. No buyer browser token is
accepted by FLESHLAB. Do not use a customer's browser session as the creator
credential. Credentials are read by the API server only and are never returned
by admin or customer responses.

## Server configuration

Set `LOYALFANS_PROVIDER_CLIENT_ENABLED=true` only after the dedicated creator
account has been configured and the deployment prerequisites below are met.
Use the [root-only Creator session import](LOYALFANS_CREATOR_SECRET_IMPORT.md)
on the VM. The prepared Docker Compose deployment passes mounted secret files
to the API; it does not pass token or cookie values as container environment
variables.
The existing `loadConfig` secret reader accepts a direct server environment
value or a mounted secret file for each sensitive value. Prefer the `_FILE`
form with readable access limited to the API process:

| Server setting | Meaning |
| --- | --- |
| `LOYALFANS_CREATOR_BEARER_TOKEN_FILE` | File containing the creator account Bearer token. Direct fallback: `LOYALFANS_CREATOR_BEARER_TOKEN`. |
| `LOYALFANS_CREATOR_COOKIE_HEADER_FILE` | File containing the creator account Cookie header. Direct fallback: `LOYALFANS_CREATOR_COOKIE_HEADER`. |
| `LOYALFANS_XSRF_TOKEN_FILE` | File containing the matching XSRF header value. Direct fallback: `LOYALFANS_XSRF_TOKEN`. |
| `LOYALFANS_CREATOR_USER_AGENT_FILE` | File containing the User-Agent from the same creator request. Direct server fallback: `LOYALFANS_CREATOR_USER_AGENT`. Required in production. |
| `LOYALFANS_CREATOR_COMMENTS_PATH_TEMPLATE` | Legacy GET path only. Leave unset for the observed normal POST /api/v1/comments flow; legacy paths never attest completeness. |
| `LOYALFANS_CREATOR_COMMENTS_REQUEST_CONTRACT_JSON` | Optional override of the built-in observed normal POST/terminal contract. Empty uses the observed contract when the legacy path is unset. Continuation remains unconfigured and fail-closed. See `LOYALFANS_REQUEST_CONTRACTS.md`. |
| `LOYALFANS_CREATOR_CATALOGUE_REQUEST_CONTRACT_JSON` | Optional explicit observed Store request contract. Empty by default; takes precedence over slug/limit and legacy path/page keys. For `/api/v2/videos-store`, requires POST, string `page` in the body, numeric `limit`, creator `slug` and `type: video`. |
| `LOYALFANS_CREATOR_CATALOGUE_SLUG` | Configured creator slug for the observed Store POST; observed account value `fleshlabstudios`. Empty by default; configuring it selects the observed POST contract. |
| `LOYALFANS_CREATOR_CATALOGUE_LIMIT` | Numeric Store request page size. Defaults to observed `36`; adjustable from 1–1000. Response `page_meta` remains authoritative. |
| `LOYALFANS_CREATOR_SETTLEMENT_CURRENCY` | Creator account settlement currency, for example `USD`. Required when transaction rows omit currency. An explicit row currency always takes precedence. |
| `LOYALFANS_CREATOR_CATALOGUE_PATH` | Legacy relative GET path only. Unused when slug/limit or explicit JSON selects the observed POST contract. |
| `LOYALFANS_CREATOR_CATALOGUE_PAGE_PARAMETER` | Legacy GET query pagination only. The observed POST uses string `page` in the JSON body instead. |
| `LOYALFANS_CREATOR_MEDIA_HOSTS` | Comma-separated HTTPS media-host allowlist used only for server-side poster/trailer copies. Media requests never receive Creator auth headers. |
| `LOYALFANS_CATALOGUE_SYNC_ENABLED` | Defaults to `false`; must remain false until migrations, exact mappings, path/pagination configuration, and media policy are ready. |
| `LOYALFANS_CATALOGUE_TRAILER_INGESTION_ENABLED` | Defaults to `false`; trailers are copied only when explicitly enabled and the URL host/MIME/size pass validation. |

## Validated Store pagination

The observed request is `POST /api/v2/videos-store?ngsw-bypass=true`, with JSON
`{"slug":"fleshlabstudios","page":"2","limit":36,"type":"video"}` for page 2.
The builder uses the configured creator slug, `String(pageNumber)`, configured numeric limit
(default `36`) and string type `video`. Credentials remain in the existing server-only secret files.
Changing the slug/limit configuration does not enable the provider or catalogue writes.

The authenticated page-2 response validated exact metadata
`{"total":116,"per_page":36,"current_page":2,"last_page":4,"from":36,"to":72}`.
This is captured evidence, not a hardcoded total, page count or response page size. Full traversal
starts at page 1 and stops at the actual response `current_page === last_page`. It uses the response's
page size even if it differs from the requested limit. Different limits work across scans; a changing
total, per-page size or last page during one resumable scan fails safely.
No independent `ceil(total/per_page)` calculation replaces authoritative `last_page`.

Safe-integer metadata, contiguous `[from,to)` ranges, exact requested/returned page agreement and
UID uniqueness are enforced. Repeated/regressing pages, missing or malformed `page_meta`, impossible
last pages, unexpected duplicate UIDs, HTTP/provider errors and configured bounds fail closed.
The local service bounds default to 100 pages and 10,000 items; explicit JSON can supply smaller bounds.
These are safety limits, never upstream response assumptions. Live page-1 and terminal response validation
still requires a separately authorized read-only run; this update made no upstream request.
See `LOYALFANS_REQUEST_CONTRACTS.md` for the complete JSON schema and neutral captured-metadata fixture.

The admin-only `POST /api/v3/admin/commerce/loyalfans/catalogue-sync` endpoint
uses `dry_run: true` unless explicitly told otherwise. It follows every
`page_meta.current_page` through `last_page`, checks the observed zero-based,
end-exclusive `from`/`to` range, and keeps request-page construction inside the
provider client. Persistent sync checkpoints completed pages and items so a
failed run can resume; send `restart: true` only to abandon that checkpoint and
start a fresh scan. `GET /api/v3/admin/commerce/loyalfans/catalogue-status`
returns upstream totals and mapped/ingested/missing/conflicted counts, plus
metadata-synced, promo-complete/partial and per-asset failure counts.
`GET /api/v3/admin/commerce/loyalfans/catalogue-unresolved` lists exact UIDs
that need review. Money → LoyalFans catalogue shows upstream totals, exact
mapping counts, full-video readiness, poster gaps, conflicts and the last
successful sync. Resolve an item only by explicitly mapping its exact post UID
to one existing FLESHLAB video. The source `short_url` is shown as an editable
candidate; the mapping endpoint validates the final URL. No title or slug
matching is performed.

Persistent synchronization requires migrations `0059`, `0060` and `0064`. It persists
every valid upstream item even before it has a FLESHLAB master mapping; such
rows remain `unmapped` and are not exposed in public catalogue or checkout.
After an administrator explicitly maps the exact post UID to an existing
FLESHLAB video, the next sync attaches the commercial record and its copied
media. It does not create video masters, offers, orders, or entitlements.
Current/old price and discount snapshots are audited idempotently;
synchronized prices do not silently alter separately managed payment plans.

Poster bytes are copied into the existing Azure Blob container and served via
FLESHLAB's public-media endpoint. The blob itself remains private; the matching
media record is public/approved because it is a poster from the public Creator
Store response. New source revisions use versioned object keys, then switch the
catalogue reference after upload. Trailer copying remains separately gated;
copied trailers stay private and pending review until explicitly approved.
Signed source URLs are used transiently for copying and are never stored in
catalogue rows, media records, provenance, or public API responses. `is_bought`
is ignored.

### Promotional media isolation and retries

Catalogue metadata and price snapshots are committed even when poster or
enabled trailer retrieval fails. Each product records `metadata_sync_state`,
`promo_media_state`, `poster_ingest_state` / `poster_error_code`, and
`trailer_ingest_state` / `trailer_error_code`. Asset errors are isolated per
product and per asset. A failed refresh leaves the current local media
reference and its successful source fingerprint unchanged, so the next sync
can retry that exact source revision. Promo failures do not fail a sync item or
block the rest of the catalogue.

Media content type is selected from bounded byte/container-signature sniffing,
not trusted from the upstream `Content-Type` header. JPEG, PNG, WebP and
validated AVIF `ftyp` brands are accepted for posters; validated MP4, WebM
EBML `DocType`, and QuickTime `ftyp` brands are accepted for trailers. Generic,
missing or mislabelled headers are tolerated only when the bytes identify one
of those formats. Unsupported bytes fail that asset closed. HTTPS, the
configured hostname allowlist, redirect rejection and per-kind size bounds
remain enforced. The AVIF storefront path is supported by the existing image
resolver and public-media response, which serves the stored media MIME type.

Failure diagnostics are structured and limited to asset type, normalized
hostname, HTTP status, declared content type, detected MIME type, content
length and error code. Signed URL query strings and request credentials are
not logged or stored. These changes affect promotional assets only; purchased
full-video ingestion continues through the generic provider media runtime.

Retrying a completed catalogue sync uses the normal write action with
`restart: false` (the default). Completed runs are not selected for resume, so
this creates a new run and safely re-evaluates the catalogue using exact UIDs
and idempotent upserts. `restart: true` is for abandoning an active/failed
checkpoint and starting a fresh scan; it is not needed for the completed
116-item run `fddee4e8-8316-4039-97c0-440817f9c017`. Do not manually edit its
run or item rows. Migration `0064_v3_loyalfans_catalogue_promo_media_status.sql`
must be applied through the normal release migration process before deploying
this patch.

When the controlled Creator web session expires, import the new values through
the root-only VM procedure, restart the API process in a separately approved
deployment operation, then use Admin → Commerce → Integrations → **Test connection**.
This is the controlled re-auth path. It does not copy a customer browser
credential, expose a public proxy, or require source edits. A successful probe
returns `CONNECTED`; 401, 403, or 419 returns `AUTH_EXPIRED`; a malformed
successful response returns `AUTH_FAILED`; missing configuration returns
`NOT_CONFIGURED`; network, timeout, or other HTTP failures return
`UPSTREAM_ERROR`. Before the first probe, configured credentials display
`UPSTREAM_ERROR` because connectivity has not been established in this process.
No credential values are included in these states.

## Purchase reconciliation

The creator transaction-history operation uses
`POST /api/v2/funds/transactions-history/list?ngsw-bypass=true`, the observed
request body and headers, and a bounded scan of every reported page. The
admin-only reconciliation action can be repeated. The database transaction
uniqueness constraints on provider transaction ID and order ID prevent replay
grants. Fulfillment requires a comment-challenge verified member UID, exact
post UID and active catalogue mapping, `clip_store`, one transaction ID,
expected charge and matching configured/explicit currency. Production reconciliation dispatches to
LoyalFansFulfillmentAdapter and the generic provider runtime. POSTED is an internal evidence classification:
authenticated creator earnings-ledger authority, stable IDs, timestamp, valid charge/payout/fee/rate, and
explicit LOYALFANS_CREATOR_LEDGER_POSTED_CONFIRMED=true. It does not require or invent an upstream status field.
FINALITY_UNKNOWN never grants access. See LOYALFANS_FULFILLMENT_ADAPTER.md for all activation flags.

The authoritative creator transaction record contains attached_to.video_object.video_url. The adapter
uses it transiently for immediate private Azure ingestion after exact transaction verification; the URL
is never stored as a durable playback source. One generic media job is reused by content identity and
transaction identity. Existing READY private masters are reused. Successful validation moves the order
through MEDIA_PENDING / MEDIA_INGESTING / MEDIA_READY / FULFILLED; publication is also required.
Playback and downloads use the protected FLESHLAB Azure path. Download permission comes only from the
exact mapped active catalogue downloadable flag. Catalogue synchronization grants no entitlement.

Failures require another reconciliation with fresh creator history/source URL; admin batch reconciliation
includes pending and paid orders. The old catalogue-specific worker completion hook is not registered.
The legacy standalone retrieveOwnedOriginal lookup has no observed endpoint and is not the production
full-video ingestion path. Reimbursement/chargeback rows remain observations; unproven original-sale
linkage cannot revoke another purchase. LoyalFans automatic reversal remains unavailable/manual review.

An administrator with `commerce.providers` can register an exact post mapping
through `POST /api/v3/admin/commerce/loyalfans/mappings` with
`video_legacy_id`, `external_content_uid`, and the verified public `public_url`.
`GET /api/v3/admin/commerce/loyalfans/mappings?video_id=...` reviews the
current mapping. The database permits only one row per provider/post UID;
checkout requires exactly one active LoyalFans mapping for the video. Do not
register the Joe post until the matching FLESHLAB video ID and public URL are
reviewed. This work created no mapping row.

Known captured creator-ledger transactions include stable IDs
6ac4b8e661353658a7d80631 and 6ac4b5ea3436647836d8058e. They identify the exact buyer/content; they are
not substitutes for fresh authenticated history, a current order, verified buyer link and exact mapping.
No production mapping or entitlement is created by this preparation.

## Remaining activation prerequisites

Populate creator-session secret files locally on the production VM through the controlled import procedure;
never paste credentials into chat. Configure the creator slug, limit, exact CDN hosts, settlement currency
and explicit POSTED adoption. The production database already has migrations 0059 through 0064; this D2
release adds only migration 0065, which must be applied later through the normal release process after a
restricted verified backup. Keep provider/media/catalogue/trailer/full-video switches false until separate
activation is authorized. Terminal first-page comment verification is implemented using the observed
POST and absent-or-null values for all four top-level continuation markers. Any non-null marker requires
a continuation capture and fails closed. Exact challenge tokens allow surrounding ordinary text while
rejecting prefix/suffix/partial spoofing; exact parent/buyer UIDs and one-time consumption remain mandatory.
See the release manifest for exact mapping/configuration, rollback and staged activation prerequisites.
No credentials, migrations, provider settings or production data were changed during release preparation.

### Compatibility patch: observed wire values

The later read-only production probe succeeded using the controlled creator session. It confirmed the
Store traversal, both known creator transactions and `cdn2.loyalfans.com`; no provider activation or
customer fulfillment occurred. The preparation prerequisites above are retained as the original rollout
checklist, not a claim that the successful probe or applied migrations must be repeated.

Timestamp parsing now shares a strict timezone-aware helper for catalogue, comments and transactions.
ISO strings and observed `{date, timezone_type, timezone}` objects normalize to UTC ISO milliseconds.
Malformed required timestamps remain invalid evidence. Optional missing catalogue timestamps stay null.
Initial comments may omit any of the four top-level markers: only absent/null values attest terminal
completeness. No continuation request has been inferred. The patch needs no schema/config change;
all activation switches remain false. Production retesting waits for separately authorized patch deployment.

### D2 private full-video master ingestion

D2 adds a durable private master pointer to each exact provider catalogue product; it does not require
`video_legacy_id`, create a content mapping, or create commerce state. Migration
`0065_v3_loyalfans_catalogue_full_video_master.sql` adds the per-product ingestion state, private asset
reference, safe error code and existing-master-reuse flag. The generic provider job remains authoritative
for bytes, SHA-256, ffprobe result and private Azure object identity. The catalogue row stores only the
resulting internal asset ID. No signed source URL is stored or returned.

The D2 adapter reuses the existing generic provider-media job keyed by provider plus exact external post
UID. It does not create a fake transaction row. This is the same job JIT fulfillment uses, so a D2 master
is reused by later fulfillment and a JIT-created master is reflected on the catalogue product and reused by
later D2 runs. Only an active, exact mapped FLESHLAB video with a private READY primary source can be reused
as a pre-existing legacy master; unrelated historical media and title/slug matches are never candidates.
Unmapped products retain their own private master through `full_video_asset_id`.

For each already-synced product, D2 first requests a fresh full Store traversal and selects the exact post
UID and media UID. If that response has no full-video source, it can use a complete authenticated creator
ledger response for an exact `clip_store` row whose `attached_to.uid` and media UID both match. A source
must pass the generic HTTPS, exact-host, DNS/IP, redirect, size, byte-signature, private-storage and ffprobe
checks. If the source expires, D2 reacquires it through the provider client once; it never retries a stored
signed URL. Missing or ambiguous source evidence marks only that product failed. Some products may have no
source in either currently observed response, so source availability remains a canary-validated prerequisite
for bulk completion.

Status is available from admin-only `GET /api/v3/admin/commerce/loyalfans/full-video-status` and reports
`FULL_VIDEO_TOTAL`, `FULL_VIDEO_READY`, `FULL_VIDEO_PENDING`, `FULL_VIDEO_INGESTING`, `FULL_VIDEO_FAILED`,
`FULL_VIDEO_NOT_IMPORTED` and `FULL_VIDEO_EXISTING_MASTER_REUSED`. The protected
`POST /api/v3/admin/commerce/loyalfans/full-video-ingest` accepts only an exact selection, never a source
URL:

```json
{"mode":"single","post_uid":"<exact synced post UID>"}
```

Supported selections are `single` (one UID), `set` (up to 20 explicit UIDs), `limited` (1–25 products),
`remaining` (not READY products, capped at 1,000), and `all` (up to the configured server safety cap).
The service uses bounded concurrency (default two, maximum four), isolates failures per product, and can be
resumed by repeating the same selection. Failed items require explicit `retry_failed: true` to retry; they
then acquire a fresh source. Duplicate/concurrent requests serialize through the generic PostgreSQL
provider/content lock and cannot create duplicate jobs or blobs. Selection is limited to synced catalogue
identities. D2 never publishes products or creates purchases, orders, buyer links or entitlements.

The runtime switch `LOYALFANS_CATALOGUE_FULL_VIDEO_INGESTION_ENABLED` defaults to `false`. The endpoint is
operational only when the creator provider and generic media runtime are separately configured, and only
users with `commerce.providers` can run it. Keep customer fulfillment
`LOYALFANS_MEDIA_FULFILLMENT_ENABLED=false`; D2 does not require or enable customer checkout. The release
must first apply 0065 via the normal migration process after 0064. All switches remain disabled by default
and this implementation work has not run a D2 ingestion.

#### Deferred D2 production canaries

After a separately approved release and migration, keep customer fulfillment disabled and run these two
single-product checks before any batch:

1. Select one already-mapped product by its exact post UID. Confirm an existing exact READY master is
   reused, or confirm a fresh authorized source is streamed into the private Azure container and validates.
2. Select one already-synced unmapped product by its exact post UID. Confirm it receives a private READY
   master while `video_legacy_id` and the external mapping table remain unchanged.

For each check verify the private storage identity, SHA-256, ffprobe result and `full_video_state=ready`;
verify the database has no signed source URL, transaction row, purchase, order or entitlement attributable
to D2; and verify there was no upstream mutation or product publication. If either exact source is absent,
expired beyond bounded reacquisition, ambiguous, or fails validation, stop and use the safe per-item retry
after correcting the provider/media cause. Only after both canaries pass may operators select `remaining`
or `all` for the rest of the synced products. This document records a later procedure; no canary or bulk
import has been run.
