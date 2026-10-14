# FLESHLAB Distribution OS

**Implementation snapshot:** 2026-10-14

**Application:** `fleshlab-v2` (Base44)

**Admin route:** `/admin/distribution`

## Scope

This release adds an internal distribution operations workspace to the existing FLESHLAB application. It connects distribution planning to the existing video, performer, compliance, contract, production QA, and audit records. It does not publish to external platforms or claim that any external account is connected.

The workspace supports a researched platform register, non-binding application drafts, video-and-performer-specific rights review, fail-closed readiness checks, metadata-only operator packages, manual publication records, revenue CSV imports, and draft partner agreements. External platform uploads, account authentication, automated reporting, and production deployment remain gated on verified partner access and infrastructure evidence.

## Platform and integration matrix

The research state below is based on official public materials reviewed on 2026-10-14. `RESEARCHED` means a public source was reviewed; it does not mean the platform accepted FLESHLAB, that an account is connected, or that an automated integration is authorized. All distribution destinations are currently operator-assisted.

| Destination | Priority | Research state | Verified public fact | Current integration state and next gate |
| --- | --- | --- | --- | --- |
| FLESHLAB website | Existing | Existing workflow | Existing website publishing and safety functions are present in the repository. | Existing in-app workflow; no change to website publishing in this release. |
| LoyalFans | P0 | Researched | Creator supplement states a 20% platform fee on Fan Payments and creator account use. | No FLESHLAB studio acceptance, delegated access, API, bulk feed, or report export verified. Confirm account structure and access with the platform. ([official creator supplement](https://www.loyalfans.com/legal/creator-supplement)) |
| FapHouse | P0 | Researched | Only verified Registered Studio Operators can upload; legal entities undergo company verification and KYC. | Account approval, commercial split, API, bulk upload, and reports remain unverified. Confirm studio status and current terms. ([official Trust & Safety](https://faphouse2.com/pages/trust-and-safety)) |
| xHamster | P0 | Researched | Current terms require creator-program acceptance and a separate Ad Revenue Agreement where monetization applies. | No FLESHLAB studio acceptance, API, bulk feed, or report export verified. Confirm account and terms. ([official terms](https://xhamster.com/info/terms)) |
| Pornhub | P1 | Researched | Official help describes partner application and review; selected scenes may require performer records and production evidence. | Accepted upload method, studio commercial terms, API, bulk upload, and reports remain unverified. Apply manually through the official partner channel. ([official application help](https://help.pornhub.lifestyle/hc/en-us/articles/4419872356243-How-do-I-join)) |
| Clips4Sale | P1 | Researched | Official creator guidance describes approved creators/authorized resellers, site uploads, stated clip and tip shares, and producer record requirements. | Reseller approval, payout eligibility, API/bulk upload, and report export remain unverified. ([creator information](https://clips4salecreator.freshdesk.com/en/support/solutions/articles/151000157732-learn-about-what-c4s-offers-you-), [producer requirements](https://clips4salecreator.freshdesk.com/en/support/solutions/articles/151000157688-as-a-content-producer-creator-what-documents-do-i-need-to-get-from-my-performers-)) |
| Fansly | P1 | Researched | Official help provides an agency/producer path and describes creator revenue and co-performer workflows. | FLESHLAB approval, Taiwan payout availability, API/bulk upload, and report export remain unverified. ([agency/producer application](https://help.fansly.com/en/articles/12315622-applying-as-an-agency-producer-or-other), [creator onboarding](https://help.fansly.com/en/articles/12315241-getting-started-on-fansly)) |
| XVideos | P2 | Not researched | No current studio acceptance, commercial terms, or API verified. | Verify through current official sources before any application or distribution. |
| XNXX | P2 | Not researched | No current studio acceptance, commercial terms, or API verified. | Research separately from XVideos; do not infer shared publishing rights. |
| ManyVids | P2 | Not researched | No current studio onboarding or producer commercial terms verified. | Confirm studio eligibility, payout, rights, and approved upload/reporting methods. |
| FanCentro | P2 | Not researched | No current agency onboarding or delegated-account terms verified. | Confirm eligibility, payout territories, commissions, and approved methods. |
| PaidPerView | P2 | Blocked / unavailable | The official homepage states that the program is closed. | Distribution remains blocked until the operator verifies a reopening. ([official site](https://www.paidperview.com/)) |
| YouPorn | P2 | Not researched | Studio onboarding and partner-network publication rights not verified. | Research as a separate destination and confirm any network rights in the signed agreement. |
| RedTube | P2 | Not researched | Studio onboarding and partner-network publication rights not verified. | Research as a separate destination and confirm any network rights in the signed agreement. |
| Tube8 | P2 | Not researched | Studio onboarding and partner-network publication rights not verified. | Research as a separate destination and confirm any network rights in the signed agreement. |

## Implementation map

| Area | Implementation |
| --- | --- |
| Admin UI | `src/pages/admin/DistributionOS.jsx`, routed in `src/App.jsx` and linked from `src/components/AdminLayout.jsx`. |
| Service | `base44/functions/distributionOSService/entry.ts`; admin-only POST endpoint, no-store responses, no external upload calls. |
| Shared policy | `base44/functions/shared/distributionPolicy.js`; metadata, technical, rights, age-at-production, QA, and revenue checks. |
| Platform records | `DistributionPlatform` and `DistributionApplication` entities. |
| Rights and queue | `DistributionRightsGrant` and `DistributionJob` entities. |
| Revenue and partners | `DistributionRevenueImport`, `DistributionRevenueLine`, and `DistributionPartnerAgreement` entities. |
| Source validation fields | `VideoAsset` now includes checksum, audio-stream, and technical-validation fields. Existing assets are not silently treated as validated. |
| Tests | `npm run test:distribution` runs the policy unit tests. |

## Readiness and release status

- Code-level validation on this branch: build, backend bundle, distribution policy tests, and entity schema parsing pass.
- Repository-wide lint and typecheck have existing baseline failures. The targeted Distribution OS lint check passes; `src/App.jsx` is not covered by the repository's current ESLint configuration.
- No production login, Base44 publish session, Azure CLI, or external platform credentials were available in the execution environment. No production preflight, backup, deployment, or rollback drill was performed.
- The current source-asset processing path does not yet populate the new checksum/audio/validation fields. As a result, the distribution gate blocks existing assets until a verified technical-validation path is implemented and exercised.
- Do not mark a platform `CONNECTED` or record a publication until the applicable partner access and evidence are verified by an operator.

For operation steps see [Operator Guide](./OPERATOR_GUIDE.md). For deployment and rollback constraints see [Security and Rollback](./SECURITY_AND_ROLLBACK.md).
