> Historical implementation notes below are superseded for the LoyalFans initial rollout.
> Current production code registers the LoyalFans creator-session adapter with the generic fulfillment
> runtime, supports observed terminal first-page comments, and ingests authoritative creator-ledger
> private media after transaction verification. It remains disabled until explicit configuration/activation.
> See LOYALFANS_INTEGRATION_ARCHITECTURE.md and LOYALFANS_RELEASE_ACTIVATION.md for the current contract.

# FLESHLAB commerce and access implementation

The customer contract is FLESHLAB product → FLESHLAB checkout → FLESHLAB
order → verified payment → purchase grant → FLESHLAB library → private playback.
Provider identifiers and URLs are internal only. There is no production-ready
invisible payment capability established for either installed adapter.

## Existing models and extraction

Reuse catalog_videos, commerce plans/offers, v3_commerce_orders and
v3_commerce_content_entitlements. V3AccessService now owns active customer,
purchase/subscription access and private Azure delivery. V3Chain2PayService
retains its provider-specific administrative and callback implementation and
 delegates playback to that service. The existing media worker is unchanged;
no LoyalFans session refresh, browser endpoint or authenticated job is wired.

Migration 0054 removes user/video grant uniqueness while preserving order
uniqueness, allowing independent purchase provenance. Existing rows remain;
downloads default false. Grants reference orders, which record the processor,
and new provider transactions reference both order and immutable external
transaction/content/buyer identity. No automatic migration or rollback runs.
Rollback of user/video uniqueness needs explicit review of multiple purchases.
Legacy grants may have lost historical provenance under the previous upsert;
that history cannot be reconstructed by this migration.

## Provider and identity boundary

CommerceProviderRegistry installs Chain2PayCommerceAdapter and
LoyalFansCommerceAdapter. Both decline embedded checkout and payment
verification. LoyalFans now declares captured/server-proven structural Like
identity evidence and creator reaction notification evidence, while supported
automated notification retrieval remains unresolved and disabled.
The Chain2Pay hosted payment API does not establish invisible payment support.
The LoyalFans browser-session experiment is separate and never imported.
No fake production provider or frontend provider selector exists.

V3StoreCommerceService obtains transaction evidence only by calling an
internal registered adapter. Public buyer-link start/verify routes cannot
write an identity directly; only a normalized observation from the registered
adapter can do that. Purchase evidence must include verified payment and buyer, exact server-created
order correlation, previously verified order buyer identity, content UID,
amount/currency, authoritative status and monotonically ordered revision.
Correlation and verified_buyer_uid columns have no public setter. Their secure
issuance/verification remains blocked until a supported provider contract
exists. Boolean flags in the internal adapter result are an adapter contract,
not proof that an external API provides these guarantees.

## Reconciliation and access lifecycle

Reconciliation locks the order and takes a transaction-scoped advisory lock on
provider/transaction identity. Exact provider/content UID mapping must resolve
one video; missing/ambiguous mappings fail closed. Transaction uniqueness and
order uniqueness prevent cross-order reuse. Buyer/user/content conflicts fail.
Transaction and grant/order changes commit atomically; failure rolls back.
Repeated revisions are duplicates; old revisions cannot restore revoked access.
Paid grants are independent per order. Failed/refunded/chargeback/reversed
payments revoke only that order's grant. A terminal payment cannot return to
paid without explicit authoritative restoration evidence. Pending cannot
replace settled payment state. No subscription row is revoked by PPV refund.

Access checks active status, revoked_at, starts_at and ends_at; subscriptions
also require current period start/end and qualifying active offer. Downloads
are separate: a purchase grant must explicitly allow them; subscriptions alone
do not grant download. No public download permission mutation exists. Private
media streams server-side; the browser receives no Azure credentials or
provider media URLs. Revocation denies subsequent requests; an existing stream
is not forcibly terminated. Library lists active purchased titles, not the
subscription catalogue. Frontend checkout and confirmation use only FLESHLAB
endpoints; no provider redirect is performed.

## Routes in source, not deployed

- POST /api/v3/commerce/checkout: authenticated, same-origin; returns 503 before
  creating orders or requesting payment because supported capabilities are absent.
- GET /api/v3/commerce/orders/:id: authenticated owner-only safe projection.
- GET /api/v3/commerce/library: active purchased titles and local media routes.
- POST /api/v3/commerce/buyer-links/loyalfans/start: customer-only, creates or
  reuses a short-lived challenge against an exclusively reserved target pool.
- POST /api/v3/commerce/buyer-links/loyalfans/verify: customer-only; ignores
  browser identity claims and checks creator observations through the adapter.
  It remains pending/unavailable until supported retrieval is connected.
- GET /api/v3/commerce/videos/:id/download: explicit purchase download capability.
- Existing /api/v3/public/videos/:id/playback delegates to neutral access.
- Legacy public /api/v3/payments/checkout and /payments/:id/status use the same
  neutral checkout/owner-only order boundary; old hosted redirects are removed.
- Existing Chain2Pay callback/admin routes remain for existing orders. Their
  verification is not the new provider-neutral reconciliation path.

## Exact production blockers

1. Supported invisible/embedded payment capability and lawful delivery contract.
2. Supported production retrieval and authorization for creator reaction
   notifications. Captured Like evidence establishes the identity design, but
   no production service-to-service notification reader is available.
3. Verified buyer/order correlation and merchant order correlation. No member
   UID supplied by a browser or purchase transaction is accepted as identity
   binding.
4. Real adapter status/amount/currency verification, refund events and ordered
   revision/restoration semantics. No private browser API is a substitute.
5. Implement persisted checkout creation/idempotency and actual embedded fields
   only against that verified contract. Current checkout intentionally stops.
6. Add authenticated provider event delivery and retry jobs once its contract
   exists; the internal reconciliation method is not scheduled or public.
7. Explicit schema application and PostgreSQL integration/concurrency testing.
8. Verify media coverage, permitted downloads, operational reconciliation and
   one authorized real acceptance purchase/refund in a later approved phase.

A real customer cannot currently complete the target flow. Safe architecture
and simulated fulfillment tests do not establish real provider readiness.

## Validation and changed files

Added v3-store-commerce.test.js covers validated fulfillment, duplicates,
simulated concurrent serialization, wrong buyer/order, missing verification,
unknown/ambiguous mapping, amount/currency, pending/failed/refund/chargeback,
restoration, old revisions, partial rollback/retry, provider outage/timeout,
access time bounds, anonymous/unauthorized playback, subscription independence,
download permission, public projection and blocked adapters.
Tests simulate a transactional database; they do not prove PostgreSQL locks,
real provider timeouts or a real purchase. The existing LoyalFans ambiguity
matcher test is retained. No real credentials or authenticated requests used.

Changed/added source: server/v3-access.js, commerce-providers.js,
v3-store-commerce.js, v3-store-commerce.test.js, v3-chain2pay.js,
v3-external-content-mappings.js, index.js, chain2pay.test.js;
v3/src/public-payment.jsx, public.jsx, purchase-library.jsx;
migrations/0054_v3_commerce_verified_transactions.sql; this document and the
LoyalFans architecture/audit notices. V3 build regenerated dist-v3/index.html
and ignored compiled assets. Existing unrelated user edits were preserved.

Validation: seven selected node test suites pass; V3 build passes; server syntax
and git diff whitespace checks pass. Migration 0054 was NOT applied. No deploy,
production data changes or real purchases occurred.

## Hosted pending bridge continuation

The current product requirement permits an external purchase window. The
LoyalFans adapter now declares hosted product navigation, but no authoritative
verification, buyer identity, refund feed or automatic return. Checkout creates
only a pending order using an active PPV offer and exactly one active provider
mapping. Existing mapping public_url is validated as an exact safe product
landing; no mapping is seeded for the newly observed UID because its URL pairing
is not established. FLESHLAB price/currency are expected order values, not a
claim that the private pre-check verified currency.

Migration 0055 adds order content/destination/verification state, buyer-link
states and non-authoritative observation storage. It is created and NOT applied;
0054 also remains unapplied. Both are required before exercising these routes.
Checkout serializes idempotency keys; mismatching owner/product/provider fails.
State is unpredictable and internal. Public output contains a local launch URL.
GET /api/v3/commerce/orders/:id/purchase authenticates owner and redirects to a
validated destination; the frontend opens it in a new tab using noreferrer and
noopener. It is a product landing, not a proven direct payment checkout.
POST /api/v3/commerce/orders/:id/reconcile checks owner before adapter work.
Missing capabilities return verification-pending and no grant. Matching
observations can be persisted, never treated as paid or buyer verification.

Buyer links use a pending/verified/expired/revoked lifecycle. Reaction Like
evidence requires exact target UID, matching `from_user.uid` and
`object.user.uid`, a provider timestamp inside the challenge window, unconsumed
evidence, and a globally unique LoyalFans member UID. Verified links are
compared exactly with creator transaction `member.uid` during LoyalFans
reconciliation. A link alone cannot fill order correlation, payment finality,
currency, or refund fields.

A controlled non-production adapter may receive an explicitly injected existing
observation client. Default routes inject none; production rejects injection.
It reads only one page for observation, so it is not complete reconciliation or
an incremental/refund monitor. Safe pending UI keeps the original tab, offers
Check Purchase, and does not infer payment from return/window closure.

Changed files in this continuation: migrations/0055_v3_hosted_purchase_bridge.sql;
server/v3-buyer-links.js, loyalfans-purchase-evidence.js,
loyalfans-hosted-bridge.test.js, commerce-providers.js,
v3-external-content-mappings.js, v3-store-commerce.js, index.js;
v3/src/public-payment.jsx; this doc and purchase bridge evidence guide.
No deployment, authenticated request, purchase, data mutation or commit occurred.

Validation for this continuation: 121 tests passed, zero failed across eight
selected suites; V3 frontend build passed into /tmp (existing dist preserved);
server syntax and diff whitespace checks passed. Credential-pattern scan found
only pre-existing explicitly synthetic test strings; no captured credentials
were added. Tests use mocked databases/adapters and do not establish real
PostgreSQL concurrency or successful provider payment.

## CLIENT-PROVEN protocol representation

server/loyalfans-ppv-protocol.js exposes internal immutable descriptors, exact UID
payload builder, safe purchase/current-user parsers and exact verified buyer/
content comparison. Adapter retains authoritativeVerification false and exposes
no protocol metadata through public endpoints. No authenticated /buy proxy exists.
Check Purchase persists exact-content reimbursement/chargeback observations as
manual_verification without revoking grants; missing reversal fields stay null.
Migration 0056 adds observation_type; it was NOT applied. No earlier migration
was applied. No route was added or changed in this continuation.

Current-user schema knowledge does not establish an account-linking proof.
A successful controlled capture can validate purchase UID ↔ transaction content
UID and current-user UID ↔ buyer UID for that account, but does not establish
approved retrieval, arbitrary-user control proof, merchant correlation, finality
or refund linkage. Installed adapters cannot automatically fulfill purchases.

## Captured reaction buyer-link implementation

Controlled evidence establishes a buyer Like against exact target UID
`0Qkybb8-2B8wc9XznSwOkJbvq8Ikn3xYgOheGGEnVczDg`, server response
`success=true/httpCode=200`, and a creator `reaction`/`like` notification whose
target UID matched in `object.parent.uid` and `top_parent.uid`. The notification
contained the same immutable actor UID in `from_user.uid` and `object.user.uid`.
Names, display names and slugs are not used. The exact reaction endpoint was
not preserved and is not inferred.

Migration 0057 adds the reserved target pool, challenge and evidence tables,
expired state, verification method and safe evidence metadata. It is NOT
applied. The captured post UID is seeded exactly but disabled because a public
URL paired with that UID is not present in repository evidence. Operators
must pair and review exact public URLs; more than one dedicated target is
required for concurrent challenges. Target reservation, ten-minute expiry,
challenge-window timestamp filtering, exact UID comparison, duplicate-page
deduplication, evidence replay prevention, same-UID uniqueness and atomic link/
challenge/evidence writes fail closed. Multiple distinct actors in one window
are ambiguous. A pre-existing Like does not count without a fresh post-start
Like notification. Removing a Like later does not revoke a verified link; only
explicit FLESHLAB/user/admin policy may revoke it.

The production adapter has captured structural evidence flags but no automated
creator-notification retrieval capability. Start/verify routes and minimal
library UX are implemented; verification reports pending/unavailable until a
supported retrieval adapter and reviewed target URLs are configured. A
verified identity never grants access by itself. Automatic PPV fulfillment
still requires authoritative transaction ownership, exact order/content
correlation, amount/currency, paid finality, and ordered refund/chargeback
handling. A successful controlled PPV purchase remains required to validate
the real transaction relationship; refund/chargeback automation remains
unresolved absent a supported lifecycle feed and controlled evidence.

Protocol continuation changed: server/loyalfans-ppv-protocol.js and its test;
commerce-providers.js, v3-buyer-links.js, v3-store-commerce.js,
loyalfans-transactions.js, loyalfans-hosted-bridge.test.js;
migrations/0056_v3_reconciliation_observation_types.sql and the two evidence/
commerce documents. Validation: 133 tests passed, 0 failed across nine relevant
suites. Frontend build passed into /tmp; server syntax and whitespace checks
passed. Credential pattern scan found no captured JWT/payment secret patterns.
No purchase, authenticated provider call, deployment or production mutation.
