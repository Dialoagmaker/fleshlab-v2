Generic server-side media ingestion
==================================

`SignedSourceMediaIngestionService` accepts only technical identities, an
ephemeral HTTPS source, expected MIME, and optional duration/byte/checksum
expectations. Wire it with `PostgresProviderMediaRepository`, the existing
`createAzureBlob(config)` instance, the existing private upload container, and
an explicit list of exact upstream media hostnames or explicit subdomain roots. No wildcard hosts,
redirects, IP URLs, private DNS addresses, or upstream authorization headers
are accepted. DNS resolution is pinned to the validated address.

The Azure container must report no anonymous Blob access. A streamed upload
computes SHA-256; Azure properties and a second private read verify its size
and checksum. The private read uses a restricted temporary local file for
ffprobe. No upstream URL reaches ffprobe, SQL, result objects, or logs. The
temporary local file is removed. Invalid uploads are deleted; cleanup errors
are explicit failures. Duration, dimensions, MIME, byte count and SHA-256 are
durable provenance.
If a database READY commit has an unknown outcome, the validated private
object is preserved and a retry inspects durable state; a potentially READY
asset is never deleted because the database connection was interrupted.

PostgreSQL session locks serialize provider transaction and content identity
across upload/validation. A transaction cannot refer to a second content UID;
multiple transactions for one content share one job/asset. Exact existing
mapped READY private masters are reused before any source retrieval. An
interrupted job can be retried with a newly retrieved signed URL; failed jobs
have a 30-second cooldown and retryable flag. The service never persists a
source for a background retry. The caller must provide a fresh source.

`ProviderTransactionFulfillmentService` uses a trusted, injected server-side
verification operation and `PostgresProviderFulfillmentRepository`. It has
no HTTP proxy or client evidence endpoint. Verification must attest buyer
identity, transaction identity/type, exact content, amount and currency.
Fulfillment transitions are VERIFICATION_PENDING -> MEDIA_PENDING ->
MEDIA_INGESTING -> MEDIA_READY -> FULFILLED, with FAILED and re-verification
on retry. Only MEDIA_READY can become FULFILLED. SQL rechecks verified buyer,
exact mapping, private source readiness, published catalogue lifecycle,
transaction amounts, and linked reversals before activating an entitlement.
Download permission defaults to false; a generic sale cannot infer it.

POSTED is an internal classification of authoritative ledger evidence with
confirmed posting semantics, timestamp, charge, payout, fee and rate. It
does not mean an irrevocable settlement or fabricate an upstream status.
The caller must explicitly configure `acceptPosted: true`; the default blocks
fulfillment. Otherwise evidence is FINALITY_UNKNOWN. Only an authoritative
reversal with the exact original transaction identity is REVERSED. Unlinked
reimbursement/chargeback observations are preserved without revocation.

Migration 0061 is additive after 0060. It has been tested only in isolated
PostgreSQL; no production migration is applied. Its constraints bind each
transaction to the exact job/provider/content tuple and disallow READY without
an asset or retryable non-failed jobs. Rollback requires pausing writers and
preserving transaction, reversal, and media audit records; no automatic
destructive down migration is supplied.

The server exports `providerMediaRuntime`, created from `server/index.js`,
using separate order/media PostgreSQL pools and the existing private Blob
adapter. Future adapters call `registerAdapter(provider, adapter)` with
`verifyTransaction(order, candidate)`, the expected `transactionType`, and
optional `verifyReversal(id)`. The generic core hardcodes no provider sale type.
Registration returns `submit(orderId, input)`, `reconcile(orderId)`, and
`observeReversal(id)` functions. A candidate submission is never itself proof:
the registered server verifier must supply authoritative attestation.

The neutral input contract is provider, provider_transaction_id,
external_buyer_uid, external_content_uid, transaction_type, amount_minor
(integer minor units), currency, finality_evidence, temporary_media_url,
mime_type, optional duration_seconds/byte_size/checksum_sha256. Signed sources
remain only in memory. Future providers are not auto-registered or activated.

The same `SignedSourceMediaIngestionService` also supports an internal
content-only path for catalogue D2. It requires provider plus exact external
content UID and deliberately creates no transaction row or transaction
identity. Its unique provider/content job and private asset are shared with
JIT fulfillment. The caller must reacquire a fresh approved source; this path
never stores a source for background retry. The D2 caller maintains its own
per-catalogue-product state and points to the same READY private asset. This
is not a second storage or ingestion pipeline.

The permission-protected status route is GET
`/api/v3/admin/commerce/provider-media/status`. POST to the corresponding
`reconcile` route accepts only `order_id`; raw transaction proof and media
URLs cannot be submitted over HTTP. `commerce.reconcile` permission and
same-origin validation are required. Database/provider errors are sanitized.

Configuration: PROVIDER_MEDIA_ENABLED (default false),
PROVIDER_MEDIA_ALLOWED_HOSTS (comma-separated exact names),
PROVIDER_MEDIA_ALLOWED_SUBDOMAIN_ROOTS (explicit descendants only, excluding
the root unless also listed as an exact name), PROVIDER_MEDIA_MAX_BYTES,
PROVIDER_MEDIA_TIMEOUT_MS. Storage uses existing AZURE_STORAGE_ACCOUNT_URL
and PRIVATE_UPLOAD_CONTAINER with DefaultAzureCredential. No credential is
needed by the signed media copier itself. POSTED requires an adapter's
explicit `acceptPosted: true`, never an untrusted input flag.

Build the existing API target with
`docker build --target api -t fleshlab-api:provider-media-core-test .` and run
`bash scripts/run-provider-media-integration.sh`. The runner creates and
removes a dedicated PostgreSQL container/database, an Azurite Blob emulator,
an isolated network, and a synthetic black MP4. The test applies exact
dependency SQL and 0061 in a unique test schema, drives real repositories and
Azure SDK storage, and invokes real ffprobe in the API image. The API image
includes ffmpeg; no host ffprobe is required. Azurite verification is distinct
from a cloud Azure account/RBAC integration test.

Cloud testing requires an explicitly non-production
PROVIDER_MEDIA_TEST_AZURE_STORAGE_ACCOUNT_URL and
PROVIDER_MEDIA_TEST_PRIVATE_CONTAINER plus DefaultAzureCredential access.
Set PROVIDER_MEDIA_AZURE_INTEGRATION_ENABLED=true only for that dedicated
test target. The test writes/deletes only uniquely generated fixture objects.
No production account is inferred from ordinary application configuration.
