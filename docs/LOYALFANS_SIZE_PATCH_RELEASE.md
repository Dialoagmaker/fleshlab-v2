# LoyalFans catalogue file-size compatibility patch

Base production release: `fa406e9778e116a312a775b3571ee85a6e72fb22`.
Resolve the patch commit with `git rev-parse HEAD` in this release. The detached
`LOYALFANS_SIZE_PATCH_MANIFEST.md` records the resulting commit, archive checksum and local image identities.

## Scope

The catalogue parser now treats downloadable display file sizes independently of actual video dimensions.
It preserves original MB/GB strings in `downloadable_size_display` and leaves exact bytes null when
unknown. Positive numeric byte metadata remains supported. Width and height validation is unchanged.
The catalogue upsert persists the new text field and still uses exact immutable UID identity/idempotency.
No transaction/buyer/media/entitlement/price/storage/activation logic changes.

## Migration and rollback prerequisite

`0063_v3_loyalfans_catalogue_display_size.sql` adds one nullable text column, length 1–128 when supplied.
No backfill, inferred byte counts, indexes, identity constraints or existing data are changed. The migration
is tested twice in isolated PostgreSQL. It remains unapplied to production. Preserve normal backup and
migration-status gates before any separately authorized migration. Durable sync must wait for this column.
Old application rollback can retain the additive column; no automatic DROP or database restore is required.

## Validation and boundaries

Neutral observed-shape fixtures cover all four captured labels, missing/null optional size/metadata,
numeric bytes, positive dimensions, malformed dimension rejection and unchanged other normalized fields.
The 116-item fixture traverses four pages at limit 36 dynamically and produces 116 valid records,
zero conflicts/failures/writes/media fetches. No raw production content or signed URL is persisted.
PostgreSQL tests verify display/byte persistence, updates, idempotency, constraints and no new grants/jobs.
Complete server/provider/buyer-link/media regressions, Docker API/Web builds, changed-file ESLint and
whitespace validation are recorded in the detached manifest.

## Future activation (not executed)

Verify detached archive hash/commit and preserve deployed release/images/configuration for rollback.
Separately authorize/review migration 0063, then the application patch deployment. All existing provider,
media, catalogue and fulfillment flags remain disabled. No credential import, purchase, full media ingest,
publication or entitlement creation is authorized. After deployment separately authorize a bounded
read-only Store traversal and database-write-blocked dry-run to verify the actual 116 current items.
The current preparation uses neutral fixtures only and makes no upstream or production request.
Multi-page comment continuation remains fail-closed; existing reversal/finality/currency rules are unchanged.
