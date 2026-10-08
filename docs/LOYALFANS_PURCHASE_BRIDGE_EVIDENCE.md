> Historical evidence record. Implementation conclusions below describe an earlier stage and are superseded
> by LOYALFANS_INTEGRATION_AUDIT.md and LOYALFANS_REQUEST_CONTRACTS.md. Current creator history has stable
> transaction IDs and full-video sources; terminal first-page comments and Store pagination are implemented.

# LoyalFans purchase bridge: evidence and controlled experiment

## Evidence provenance

This investigation inspected current research documents, fixtures, client,
parser, mapping repository, probe and neutral reconciliation. The original HAR
was inspected outside the repository in the prior research. No raw buyer
checkout HAR or provider contract exists here. Documentation's “confirmed”
findings are sanitized transcriptions of that earlier observation; fixtures
prove software behavior, not current provider behavior. No network request,
purchase, credentials, migration or deployment was performed in this task.

## Capability classification

| Capability | Evidence | Classification |
|---|---|---|
| Exact product landing | Recorded tinylf short link redirect to creator/video URL | Previously observed public navigation |
| UID to product URL | Catalogue record contains uid and short_url; transaction contains attached_to.uid and short_url | Observed field relationship, requires same-record verification for chosen mapping |
| UID to internal video | Repository lookup on provider + external_content_uid | Implemented and tested |
| Direct purchase/checkout URL | None captured | Missing |
| Construct purchase URL from UID | No documented or captured template | Missing; do not synthesize |
| clip_store purchase relationship | id, member.uid, attached_to.uid, charge, payout, fee, rate, created_at | Observed private creator response |
| Currency/finality | Currency and status optional in parser; transaction fixture has no currency/status | Missing for observed sale |
| Pagination/date filters | POST page/limit/date_from/date_to/withCalendarAddons and page_meta | Observed private API; no proven durable incremental cursor |
| Transaction lookup by ID | Local search within fetched records | No provider ID lookup demonstrated |
| Automatic return/callback/webhook | No request/response or redirect chain | Missing |
| Buyer OAuth/account linking | No exchange or signed assertion | Missing |
| Buyer Like reaction evidence | Controlled buyer Like succeeded; creator received matching reaction notification | CAPTURED / SERVER-PROVEN structure; automated retrieval authorization unresolved |
| Creator authentication | Bearer JWT, cookies, XSRF, API version 3.4.4 | Observed private browser auth, no production authorization |
| Purchaser authentication | No buyer network exchange | Missing |
| Refund/dispute lifecycle | No example, event, status contract or ordering | Missing |
| Reports | video_store, post_uid, sales/revenue/downloadability | Observed analytics; no proof of buyer identity or download rights |

Known short link: https://tinylf.com/6vwI0vC7CJrlsP
Recorded resolved landing:
https://www.loyalfans.com/fleshlabstudios/video/tattooed-pinoy-twink-strokes-his-thick-hairy-cock-1652151793727
These identify a recorded product landing, not a checkout. The path's title and
numeric suffix are not an authoritative UID construction algorithm. Store the
captured public URL paired with its exact UID using existing mappings; never
reconstruct it from a title/slug or assume it belongs to any arbitrary video.
The generic repository already stores public_url; no duplicate table is needed.

## Correlation reliability, strongest first

1. Provider-signed checkout/order correlation or server-created session with a
   verifiable buyer assertion: strongest; no evidence exists here.
2. Provider-approved OAuth/account assertion proving control of member UID:
   strong; no evidence exists here. Purchase still needs verified final state.
3. Short-lived FLESHLAB challenge against an exclusively reserved verification
   post, followed by an exact Like notification observed by the creator. The
   immutable actor UID is taken from matching `from_user.uid` and
   `object.user.uid`; the target and timestamp must match the challenge window.
   Captured structure proves a viable identity method, while supported
   production notification retrieval remains unresolved. It proves identity
   only, not payment status.
4. Submitted transaction ID: useful lookup locator only. Obtain authoritative
   provider data and verified member binding before accepting it.
5. Timestamp + amount + content: candidate filtering only; buyer collisions and
   old purchases prevent secure identity/order binding. Referrer, ordinary state
   query parameters and success=true are navigation hints only.

A verified member-to-user link plus an authoritative transaction ID/content UID
could support an imported purchase grant without provider order metadata. That
would require an explicit policy for claiming an existing sale once, not
pretending the sale originated from the pending checkout. The current neutral
service requires a verified order correlation; it must not be filled with an
invented value. A future supported adapter may establish an explicit verified
claim correlation under a reviewed contract. No such adapter is enabled.

## Least disruptive viable fallback, conditional

FLESHLAB login/detail/price → pending internal attempt → exact LoyalFans product
in a new tab → buyer completes purchase → buyer returns to the original tab →
FLESHLAB verifies the linked member's exact sale → atomic grant → library.
Keeping the original tab is feasible navigation, but automatic return from the
provider is unproven. A “Return to FLESHLAB / Check purchase” control can provide
manual continuation; it cannot authorize access. Browser visibility/focus can
refresh local order status, not verify a provider purchase.

Today's installed adapters block checkout. We can show catalogue/previews and
existing entitled library/playback, and investigate the provider landing
manually. The fallback above cannot yet securely complete automatic fulfillment.
No polling job or pending-order creation is enabled merely to wait on an
unavailable buyer/verifier boundary. Hosted checkout permission in the product
requirement no longer makes embedded checkout a mandatory future capability;
the external contract still determines which adapter flow can be implemented.

## One-video, one-buyer controlled experiment

Use one controlled buyer account that does not already own the selected clip;
keep it separate from the creator account. The operator performs the purchase,
not an automated agent. Agree the real charge and refund availability first.

1. Open the exact short link above in the buyer browser. Enable DevTools Network,
   Preserve log, and record initial URL, every HTTP Location hop and final URL.
   Do not append speculative return/state/checkout parameters.
2. Inspect the product response. Extract uid/post_uid/product ID, its exact
   public short_url/url, creator ID, displayed gross price/currency, tax/fees,
   availability and permitted download setting. Confirm that exact content UID
   equals the chosen external mapping, using an actual same-product response.
3. In the authenticated buyer browser capture the existing current-user/profile
   request initiated by the UI. Record path/method and sanitized JSON shape,
   authenticated member UID and any provider-signed identity capability. This
   comparison proves the test account's UID, not arbitrary users' identity.
4. Click the normal purchase control once. Record requests initiated by the UI:
   exact path/method, product UID, session/payment ID, amount/currency, reference,
   metadata, return/cancel URLs and state fields if present. Note where each
   value originates and whether the provider accepts or signs it. Do not probe
   invented endpoints or alter payment payloads.
5. Complete the purchase manually. Record all redirect destinations, completion
   request/response fields, transaction/session/order ID and final purchase
   state. Determine whether normal UI returns to the product, receipt or an
   external merchant URL, and whether an approved return mechanism exists.
6. In a separate creator browser open Settings → Earnings → Statements
   (https://www.loyalfans.com/settings/earnings/statements). Capture the UI's
   transactions-history POST for a date range containing the experiment and
   inspect successive pages via UI pagination. Match id, member.uid,
   attached_to.uid, type=clip_store, gross charge, currency, created_at and
   explicit status. Confirm buyer UID equals step 3 and content UID equals step 2.
7. Record how updates appear: same transaction ID or separate reversal ID,
   updated timestamp/version, original reference, refunded amount/currency,
   chargeback/refund state. If a refund is available and authorized, have the
   operator use the ordinary supported process, then capture before/after
   transaction and buyer-access state. Otherwise mark refund evidence missing;
   do not create a dispute solely to test the bridge.
8. Optionally inspect existing first-party messaging UI without a purchase or
   login automation. Determine whether an authenticated message exposes an
   immutable sender UID and whether a challenge can be independently verified.
   This only informs an operator-assisted account-control proof.

Return a sanitized evidence table linking product UID → checkout/session ID →
transaction ID → buyer UID, including exact field paths and redacted requests.
Preserve consistent placeholders when redacting IDs so relationships remain
visible. A private operator record may retain real test IDs for cross-checking;
source control should use synthetic placeholders, never real buyer identifiers.

Redact Cookie/Set-Cookie VALUES, Authorization, JWTs, XSRF/CSRF tokens, session
credentials, card/bank fields, addresses, names/emails, signed media URLs and
secret callback tokens. Header names, cookie names/attributes, HTTP methods,
status codes and safe JSON field names are useful. Do not upload raw HARs,
Copy-as-cURL commands, browser profiles, local probe credential files, receipts
with personal data or payment tokens into source control. Inspect response bodies
and URL query strings as well as headers for credentials before sharing.

## Production requirements beyond one browser experiment

A capture can establish exact purchase mechanics and identity/status field
relationships. It does not authorize automated use of the private endpoint,
prove credential refresh/revocation or establish a refund feed contract.
Production still needs approved authoritative retrieval, buyer control proof,
finality/reversal semantics, secure order/claim correlation and media rights.
The observed API could identify purchased content and member UID; it cannot yet
meet the neutral adapter's verified currency, ordered revision/restoration and
correlation contract. Never map response.success=true to payment paid.

## This task's changes and validation

Added this evidence/experiment guide; linked it from architecture/audit docs.
Hardened transaction money conversion against unsafe integers and added a test.
No production adapter, payment activation, migration or provider request added.
Migration 0054 remains unapplied by this session; no database inspection made.

## Controlled pre-check and funding findings (current continuation)

PROVEN BY CAPTURE (operator-supplied sanitized evidence):
POST /api/v2/ecommerce-engine/buy-pre-check?ngsw-bypass=true accepts
uid b2owkEierVb0j94AjKFpJt6wZuI0Ag03-2F01f-2FlYPbzQ. Response returned
individual_price 2.99, subscription_price 7.99, can_buy false and
can_subscribe true. This UID is absent from prior repository fixtures; its
relationship to the older short link is not proved. Preserve its exact bytes;
'-2F' is not decoded, and no title/slug matching is permitted. The response
contains no currency or completed purchase proof. Zero balance was observed;
can_buy false is not classified as exclusively a balance failure.

OBSERVED PRIVATE API: the pre-check is a browser purchase precondition, not the
successful PPV charge. Funding reached an Epoch one-time-token/widget wrapper
loading pay.wnu.com resources but failed at packages with success false/400.
Triple-A initiation returned structural payment reference, USD funding amount,
expiry, hosted URL and temporary credential fields. No credential values are
retained. Funding a wallet is separate from buying a video and cannot grant a
video entitlement. No Epoch/Triple-A dependency is added.

UNKNOWN: successful PPV request/response, transaction finality/currency, buyer
control proof, automatic return and refund/reversal. One funded controlled buyer
purchase should capture exact uid in pre-check and completed purchase, session/
transaction ID, buyer current-user UID, matching creator attached_to.uid,
charge/currency/status and navigation. It can establish field relationships;
it does not authorize automated private API use or establish refund monitoring.

## Public production bundle reconstruction implemented

CLIENT-PROVEN from public bundles main-AMOMWZAO.js, chunk-DXrMamP8.js and
chunk-jTi7Nbf_.js (maps returned 404): video.uid → object_uid → POST
/api/v2/ecommerce-engine/buy-pre-check {uid} → priceData.can_buy → POST
/api/v2/ecommerce-engine/buy {uid} → response.success → response.post → dialog
close → parent video reload. UID is unchanged. Optional followOwner causes a
follow action first. Request contains no merchant order reference or buyer UID.
Single-video reload uses GET /api/v1/social/post/<slug>; slug is navigation,
never external identity. Dialog has no FLESHLAB return mechanism.

CLIENT-PROVEN user service chunk-BNSybmKm.js: GET /api/v1/auth/user/me →
response.response.user.uid; POST /api/v1/balance {} refreshes balance. Header
socket balance notifications update balance; emission on purchase is UNKNOWN.
CLIENT-PROVEN statements support type filters reimbursement and chargeback in
POST /api/v2/funds/transactions-history/list. Original purchase linkage remains
UNKNOWN. Balance charge is INFERRED, not SERVER-PROVEN.

The protocol module describes requests but never sends them. Purchase response
parser projects safe post identity/access hints, labels client-only evidence and
always returns paymentVerified false. Current-user parser does not prove control.
Pure comparison requires verified user-specific buyer binding. Reversals are
non-authoritative observations with no invented original transaction reference.
SERVER-PROVEN pre-check is limited to the supplied test observation; successful
buy, buyer schema, currency/finality and reversal linkage remain UNKNOWN.

## Captured Like-based buyer identity evidence

CAPTURED / SERVER-PROVEN from the controlled buyer and FLESHLAB Studios creator:

- An authenticated buyer successfully created a `like` reaction against target
  post UID `0Qkybb8-2B8wc9XznSwOkJbvq8Ikn3xYgOheGGEnVczDg`.
- The reaction request's semantic payload used that exact `uid` and
  `type: "like"`; the server returned `success: true` and `httpCode: 200`, and
  the LoyalFans UI showed the Like.
- The creator received a `reaction` notification in group `reactions`, with
  `object.reaction: "like"`, and the same target UID in
  `object.parent.uid` and `top_parent.uid`.
- The notification identified the actor as immutable UID candidate
  `lvDZ6Np0XdLpb3bTF9zD9dN5pKWL5ndCLJnpf1eY9JI`. Both
  `from_user.uid` and `object.user.uid` contained that exact value.
- The captured creator response included FLESHLAB Studios owner UID
  `OXxJqmSuOrPvWJPRe36TqF1bjqbU7cU6bX8b94cXvUw` in `top_parent.user_uid`.
- Display names, names and slugs are not identity evidence. The target UID is
  opaque and must remain byte-for-byte unchanged. The exact reaction endpoint
  is not preserved in repository evidence and is intentionally not inferred.

UNKNOWN / UNRESOLVED:

- Supported production service-to-service retrieval of creator notifications
  and authorization to automate that retrieval.
- Notification retention, pagination completeness, ordering and duplicate
  guarantees.
- Official stability or contract for the private LoyalFans reaction and
  notification APIs.
- A public post URL paired with the captured target UID. The migration records
  the exact UID as a disabled target until an operator supplies and reviews its
  exact public URL. Concurrent verification needs a pool of dedicated posts;
  one target is reserved to at most one live challenge.

The implemented state machine requires an authenticated FLESHLAB customer,
server-selected target, random challenge ID, ten-minute expiry, exact target and
reaction, matching actor UIDs, a server timestamp within the challenge window,
unconsumed evidence, and a unique provider UID binding. Existing Likes do not
satisfy a new challenge because their notification predates challenge creation;
a fresh Like event is required. Duplicate notification pages collapse to one
evidence fingerprint. Different actors in the same target window are
ambiguous and fail closed. Removing a Like later does not revoke a verified
buyer link; only explicit FLESHLAB/user/admin policy may do so.

The installed production adapter does not retrieve creator notifications, so
verification remains pending/unavailable until a supported retrieval boundary
is connected. Test-only controlled mocks exercise the normalized structure;
no provider request is made by the application in this implementation. A
verified buyer link can only establish buyer identity for future transaction
comparison (`provider_member_uid === transaction.member.uid`); it does not
establish a paid or final transaction or grant video access.

## Controlled Joe Test purchase and comment continuation

The authorized buyer test reported a 200 response from
`/api/v2/ecommerce-engine/buy` with `success:true`, `is_bought:true` and price
1.99. The authenticated comment response on the test post contained the
controlled challenge and the same immutable buyer UID in `user.uid`. The
display name and slug are navigation metadata only. This is evidence of a
successful buyer-side test and a possible account-control method. The creator
history also contains a `clip_store` sale with the same `member.uid`, charge
1.99 and `attached_to.uid` for the purchased post. The supplied Joe-specific
fields do not include that sale's transaction ID, currency, finality or
reversal state. There is no documented production comment retrieval path.
The historical challenge is not imported or replayed into application data.

Migration 0058 adds a short-lived comment challenge bound to a pending
FLESHLAB order and its exact `external_content_uid`. The comment parser accepts
only a trusted creator-side observation with exact challenge text, comment UID,
`user.uid` and timestamp. If the comment omits its post UID, the adapter must
attest the exact creator-authenticated post scope and complete result set.
The comment UID and provider member UID
are unique binding guards; verification grants no entitlement. The installed
production adapter has no comment lookup capability. The new routes therefore
remain unable to verify a live comment until an authorized server-side
retrieval implementation exists.

A later server-verified claim may fulfill an order only when its provider
transaction has a stable ID, exact post UID, linked member UID, amount,
currency, finality and revision. The transaction ID remains unique across
orders, and the entitlement is written atomically with that transaction. No
browser `success` response or challenge alone can set these flags. The current
LoyalFans adapter does not provide such a transaction; the bridge is **NOT
READY** for production fulfillment. A catalogue mapping from that exact post
UID to one FLESHLAB video and migrations 0053–0058 are required before this
schema can be used. None were applied during this continuation.

## Adapter readiness after the Joe Test evidence

The installed `LoyalFansCommerceAdapter` reports `NOT_READY`. Its comment
lookup is only a controlled non-production injection boundary. The isolated
`LoyalFansProviderClient` can send the observed transaction-history request in
a manually enabled non-production experiment, using a runtime browser session
bundle. It is not connected to the installed adapter or routes and does not
establish permission for durable server-side retrieval. Neither path is a
production authorization contract; no browser credentials are proxied.

The remaining blockers are: authorized and complete creator-side comment
retrieval; authorized and durable creator transaction-history retrieval; the
Joe sale's stable transaction ID and exact mapping of its `attached_to.uid` to
one FLESHLAB video; currency and final payment state; and a supported way to
associate later refund or chargeback records with the original sale. The
historical challenge cannot be substituted for a new challenge tied to an
authenticated FLESHLAB user and pending order. No entitlement or buyer link
was written for Joe Test in this task.
