# LoyalFans initial-rollout implementation audit

This current audit supersedes the earlier exploratory assessment. Historical public-client comparisons
are contextual evidence only. They do not define today's FLESHLAB request or fulfillment contract.

## Confirmed contracts

- Store: POST /api/v2/videos-store?ngsw-bypass=true, body slug (configured string), page (String(page)),
  limit (configured number, default 36), type video. Confirmed page-2 page_meta: total 116, per_page 36,
  current_page 2, last_page 4, from 36, to 72. Production traversal consumes actual page_meta, never these constants.
- Comments: POST /api/v1/comments?ngsw-bypass=true, normal body uid only. Completeness requires all four
  top-level markers absent/null. Any non-null marker requires continuation. Exact parent UID and user UID
  are mandatory for distinct challenge-token proof; surrounding ordinary text is allowed.
  Targeted uid_comment lookup is separate and never proves a complete list. Multi-page comments fail closed.
- Creator history: authenticated POST /api/v2/funds/transactions-history/list?ngsw-bypass=true.
  Stable transaction ID, member UID, clip_store, charge, timestamp and attached content/media identities are observed.
  Full-video video_url is observed in attached_to.video_object and handed transiently to generic private ingestion.

## Audit outcomes

- Catalogue identity and fulfillment matching use exact immutable UIDs; no automatic fuzzy title/slug matching.
- Catalogue sync creates no entitlement and no FLESHLAB master; it records commercial metadata, prices and media.
- Production customer/admin reconciliation dispatches to the same generic fulfillment runtime as the internal
  provider-media path. Legacy status-field verification is restricted to non-production compatibility fixtures.
- The old catalogue-specific worker completion hook is unregistered; the generic runtime owns new media jobs,
  master reuse, ingestion, readiness and entitlement activation. Initial recovery uses reconciliation retries.
- Temporary source URLs are non-enumerable in adapter projections and never passed to repository SQL.
  Generic source-host validation requires HTTPS, approved exact hosts/explicit subdomain roots, DNS checks and
  rejects redirects. Media errors use technical codes; upstream diagnostic URLs are redacted.
- No creator credentials are exposed in public projections, React configuration, admin status or logs.
  Config/secret files remain server-only; all activation switches default false and CDN allowlists default empty.
- Financial/provenance uniqueness and foreign keys protect transaction/order/content/job identity.
  Entitlement completion checks media READY, exact buyer/content/amount/currency, publication and reversal guards.
- Migration 0059/0060/0061/0062 dependency order is reviewed and verified locally in isolated PostgreSQL.
  0060 widens the existing fulfillment-status constraint; it does not drop tables or historical data.
  0061/0062 are ledger-run once, not standalone repeatedly executable SQL scripts.

## Initial-rollout limitations and operational requirements

Creator credentials are not yet populated. Exact production mappings for both captured test purchase post UIDs
are required. Settlement currency and POSTED ledger semantics must be explicitly configured. Live credential,
page-1/terminal Store and transaction/comment probes await separate authorization. Original-linked reversal
verification is not implemented; unresolved reimbursements/chargebacks require manual review.
No live upstream request, purchase, production write, migration or deployment occurs in this audit.

## Post-probe compatibility patch

A later separately authorized read-only production probe confirmed creator authentication, dynamic
116-item/36-limit/four-page traversal, both captured transactions and the exact full-video CDN host.
The historical prerequisites above describe the original freeze. The narrow follow-up patch handles
observed timezone-bearing timestamp objects, optional top-level comment continuation markers and
distinct challenge tokens within ordinary surrounding text. Neutral local regressions and isolated
PostgreSQL validate the change; no upstream request, production write, migration or deployment is made
during patch preparation. Full live revalidation awaits authorized deployment of the patch.
