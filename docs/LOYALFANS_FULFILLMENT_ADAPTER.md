# LoyalFans technical fulfillment adapter

The API registers `LoyalFansFulfillmentAdapter` with the existing generic provider-media runtime.
The internal handle is `loyalFansMediaFulfillment.reconcile(orderId)` or `submit(orderId, technicalCandidate)`.
The protected admin provider-media reconciliation route dispatches by the stored order provider.
Customer and LoyalFans admin reconciliation use that same runtime. There is no public transaction-proof or source-URL endpoint.

Each attempt reloads the verified buyer link, exact active content mapping and complete authenticated creator
transaction history using the already observed POST history operation. A candidate can select a transaction
ID only within that fresh authoritative response. Multiple matching purchases require an explicit stable ID
or an existing durable transaction binding. Names, slugs and descriptive content fields are not read.
Order timestamps must be present and valid. Sales before the order or after the server's current
verification time are rejected. Money and media metadata accept only numeric/string primitives;
malformed accounting rates retain FINALITY_UNKNOWN rather than being coerced into posting evidence.

An existing mapped private READY source is reused even if the upstream row has no media URL or MIME.
Otherwise the adapter hands the temporary HTTPS source to the generic ingestion runtime. That runtime
enforces approved hosts, rejects redirects, streams to private storage, validates checksum/container/duration/
dimensions, and enables the entitlement only after MEDIA_READY. Retries fetch fresh history. Concurrent
reconciliation uses the existing order, transaction and content locks and uniqueness constraints.

Temporary source URLs are non-enumerable in technical response/candidate objects, never sent to SQL and
never included in adapter errors. Technical media UID and transaction timestamp are durable provenance.

## Activation prerequisites

Defaults are disabled. No settings were enabled and no production migrations were applied.

| Setting | Required value or role |
| --- | --- |
| `PROVIDER_MEDIA_ENABLED` | Explicit `true` to enable the generic runtime |
| `LOYALFANS_MEDIA_FULFILLMENT_ENABLED` | Explicit `true` to enable this adapter |
| `LOYALFANS_PROVIDER_CLIENT_ENABLED` | Explicit `true` for the authenticated creator client |
| `PROVIDER_MEDIA_ALLOWED_HOSTS` | Comma-separated exact approved CDN hostnames; empty denies all new sources |
| `PROVIDER_MEDIA_ALLOWED_SUBDOMAIN_ROOTS` | Explicit approved subdomain roots, if needed; root itself is not included |
| `LOYALFANS_CREATOR_SETTLEMENT_CURRENCY` | Confirmed ledger currency when absent from individual rows; no implicit USD default |
| `LOYALFANS_CREATOR_LEDGER_POSTED_CONFIRMED` | Explicit `true` only after confirming that creator earnings ledger entries represent posted sales |

The existing server secret mechanism supplies `LOYALFANS_CREATOR_BEARER_TOKEN_FILE`,
`LOYALFANS_CREATOR_COOKIE_HEADER_FILE`, `LOYALFANS_XSRF_TOKEN_FILE` and
`LOYALFANS_CREATOR_USER_AGENT_FILE`. This is an authenticated creator web-session integration,
not OAuth or an official developer API. No credentials belong in source or frontend code.

POSTED requires authenticated ledger authority, confirmed posting semantics, stable sale identity, timestamp
and finite charge/payout/fee/rate evidence. Absent that attestation the result is FINALITY_UNKNOWN and cannot
fulfill. No upstream status field is invented. The generic REVERSED model requires authoritative original
transaction linkage. This adapter does not guess reversal linkage or infer it from amount/time/content.
Its reversal verifier is intentionally unavailable until an authoritative reversal linkage contract is confirmed.

Required database schema: existing bridge migrations through 0060, generic migration 0061, then additive
0062 for media UID and transaction timestamp. 0062 preserves audit fields during application rollback.
Public purchase readiness additionally requires the generic/media/creator switches, explicit settlement currency
and POSTED adoption; registering this adapter does not enable those flows automatically. Download permission is
read from the exact active mapped catalogue only after media readiness. Generic other providers retain no download permission.
