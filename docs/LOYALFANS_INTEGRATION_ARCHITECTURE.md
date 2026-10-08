# FLESHLAB / LoyalFans initial-rollout architecture

This release implements a controlled server-side integration with the observed LoyalFans web API and
FLESHLAB-controlled creator-session credentials. It is not OAuth or an official developer API.
All activation switches default to false. Credentials remain in root-owned files on fleshlab-prod-vm.

## Catalogue

The observed/validated Store operation is POST /api/v2/videos-store?ngsw-bypass=true with configured
creator slug, string page, numeric limit (observed default 36) and type video. Actual response page_meta
controls traversal. The captured 116 total / 36 per page / 4 last page are evidence, never traversal constants.
Durable sync uses exact post/media UIDs, resumable page/item checkpoints, metadata/price snapshots,
price history and existing Azure poster/trailer ingestion. It creates no entitlement or duplicate master.
Unmapped and ambiguous items require explicit admin selection of an existing FLESHLAB video.

## Buyer identity

POST /api/v1/comments?ngsw-bypass=true sends only the stored challenge post UID in the normal list body.
A terminal first page requires all four top-level continuation fields present and null. Comment-level
page_token is ignored for list completeness. Exact challenge, exact parent.uid and user.uid bind the
FLESHLAB customer to the immutable external buyer UID. Challenges remain time-limited, single-use,
and protected by buyer/comment uniqueness. Multi-page comments fail closed until continuation is observed.

## One fulfillment runtime

Customer order reconciliation, LoyalFans admin batch reconciliation and the internal provider-media
route dispatch to LoyalFansFulfillmentAdapter through the existing generic provider runtime.
Legacy status-based commerce verification is unavailable in production; the old worker completion
hook is not registered. Non-production fixtures keep compatibility coverage of the historic verifier.

Authenticated creator transaction-history ledger
-> stable transaction.id + member.uid + clip_store + attached_to.uid + charge + timestamp
-> exact verified buyer link + exact unique content mapping + amount/currency/POSTED checks
-> reuse existing READY private FLESHLAB master, or immediate temporary video_url handoff
-> one idempotent generic media job/private Azure asset
-> validate checksum/MIME/container/duration/dimensions with API ffprobe
-> MEDIA_READY -> purchase entitlement -> protected FLESHLAB library/playback

Full-video URLs come from attached_to.video_object.video_url in authoritative creator history.
They exist in memory for ingestion only. Durable identity is the FLESHLAB asset/object key and technical
provenance, never a signed upstream URL. Existing masters are reused without another download.
Failure/retry fetches fresh authoritative history and respects durable idempotency and concurrency locks.
Reconciliation is request-driven; admin batch retry is the supported recovery path for the initial rollout.
Download permission is derived from the exact active mapped catalogue downloadable flag; generic other
providers retain a false default. Unpublished videos cannot complete entitlement fulfillment.

## Evidence and reversals

POSTED requires explicit adoption of creator earnings-ledger posting semantics, authenticated authority,
stable IDs, timestamp and valid charge/payout/fee/rate evidence. Currency is explicit row evidence or
configured settlement currency; no implicit USD default. Unknown finality never fulfills.
Reimbursement/chargeback entries remain observations. Automatic revocation requires authoritative exact
original-transaction linkage; the LoyalFans reversal verifier is unavailable until that contract is proven.

## Release and operations

Required additive sequence after verified production 0058: 0059 -> 0060 -> 0061 -> 0062.
See LOYALFANS_REQUEST_CONTRACTS.md, LOYALFANS_FULFILLMENT_ADAPTER.md,
LOYALFANS_PROVIDER_OPERATIONS.md and LOYALFANS_RELEASE_CANDIDATE_MANIFEST.md.
No deploy, production migration, credential import, activation or purchase is part of release preparation.
