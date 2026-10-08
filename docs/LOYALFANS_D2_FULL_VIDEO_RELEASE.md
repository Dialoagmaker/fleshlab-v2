# LoyalFans D2 full-video master release

## Release scope

This candidate is based directly on the integrated production release `2105d780c08440c625f1e146e5c3de13bdf6b76c`. It adds D2 private master ingestion to the already deployed 0064 catalogue/promo foundation. No deployment, migration, provider request, purchase, publication, or entitlement operation is part of this release preparation.

Migration `0065_v3_loyalfans_catalogue_full_video_master.sql` is additive and follows 0064. Production is currently through 0064; apply 0065 later through the normal release procedure after a fresh verified database backup. The application release must not run before the migration is recorded.

Each already-synced LoyalFans product owns full-video state by exact post UID, independent of `video_legacy_id`. The same generic `provider=loyalfans` plus exact external-content UID media job and private media asset are used by D2 and purchase-time JIT. D2 creates no transaction row. It never changes a content mapping, publication state, purchase, order, or entitlement.

## Production configuration prerequisite

Use the existing API-only credential files and `DefaultAzureCredential` identity. Do not put credential values in Compose, source, browser configuration, command arguments, or logs.

After a separate activation approval, the API requires all of the following for D2 source import:

- `LOYALFANS_PROVIDER_CLIENT_ENABLED=true`
- `PROVIDER_MEDIA_ENABLED=true`
- `LOYALFANS_CATALOGUE_FULL_VIDEO_INGESTION_ENABLED=true`
- `PROVIDER_MEDIA_ALLOWED_HOSTS` includes the exact approved host `cdn2.loyalfans.com`
- existing LoyalFans creator credential files are populated and readable by API only
- existing private Azure upload container and API managed identity are available

Preserve `LOYALFANS_MEDIA_FULFILLMENT_ENABLED=false`. Do not enable catalogue sync or trailer ingestion as part of D2. Provider client, generic media, and D2 switches all default to disabled in application configuration. D2 is an admin operation requiring same-origin validation and `commerce.providers` permission.

## Deferred canary procedure

Run only after release deployment, migration 0065, an approved activation window, and a read-only status check. Keep customer fulfillment disabled throughout both canaries.

### Canary 1: exact mapped product

1. From admin catalogue status/mappings, select one product with an active exact LoyalFans post UID to FLESHLAB video mapping. Record only the exact UIDs and local video ID for audit; do not use title/slug matching.
2. Read the product's current private source master state. If a validated exact private READY master exists, D2 should attach/reuse it without upstream media retrieval or another upload. Otherwise D2 fetches a fresh source and ingests it once.
3. Submit the selected UID to `POST /api/v3/admin/commerce/loyalfans/full-video-ingest`:

   ```json
   {"mode":"single","post_uid":"<exact mapped post UID>"}
   ```

4. Verify `full_video_state=ready`, its asset ID equals the generic job asset ID, and the asset is `source`, `private`, `ready`, with an internal non-URL storage reference, positive size, SHA-256, and ffprobe-validated media metadata. Verify no new asset/upload if it reused a READY master.

### Canary 2: exact unmapped product

1. Select one already-synced unmapped product by its exact post UID from admin status. Do not create a mapping.
2. Submit the same single-UID operation using that exact UID.
3. Verify its local catalogue identity remains unchanged, `video_legacy_id` stays null, no external mapping row is created, and its own `full_video_asset_id` points at a private READY generic media job/asset with SHA-256 and ffprobe metadata.

### Safety checks for each canary

Before and after each call, compare counts for provider transactions, commerce orders, purchases, entitlements, and media jobs. D2 may create or reuse one provider media job and one private asset; it must create no provider transaction row, order, purchase, entitlement, publication, or mapping. Confirm no signed source URL or query string is present in durable product/job/asset/provenance fields or API output. Confirm the source hostname is allowlisted and no LoyalFans mutation occurred. Stop on missing/ambiguous source, auth expiry, host-policy rejection, checksum/container/ffprobe failure, non-private storage, or inconsistent exact mapping.

Only after both canaries pass may operators process remaining products in bounded batches, for example:

```json
{"mode":"limited","limit":10}
```

or select all remaining non-READY products after review:

```json
{"mode":"remaining"}
```

Repeat the same selection to resume safely. Failed provider-media jobs require `{"retry_failed":true}` to start a retry, and retries reacquire a fresh source. The service caps concurrency and isolates failures. Do not retry the old D1 catalogue sync run; D2 is a separate operation.

## Rollback prerequisites

Retain the previous immutable release and API image before cutover. Rollback of application files/images does not require deleting D2 assets or manually editing product state. Migration 0065 is additive and has no automatic destructive down migration; after application rollback, leave the additive columns in place unless a separately reviewed database rollback is approved. Preserve the pre-migration backup and audit/provider media rows. No production action has been taken during preparation.

## Validation record

The candidate's final manifest/commit identifier is the Git commit containing this document. Local validation must include the isolated PostgreSQL/API-container ffprobe suite, the complete server test suite, builds, changed-file lint, and `git diff --check`. A cloud Azure integration run is optional and must use an explicitly designated non-production account/container and `DefaultAzureCredential`; never infer a test target from production settings.
