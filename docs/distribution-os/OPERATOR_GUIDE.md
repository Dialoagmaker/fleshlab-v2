# Distribution OS Operator Guide

This workspace is an internal checklist and record system. It prepares metadata and records human-reviewed actions; it does not upload media, submit applications, accept contracts, or connect platform accounts.

## 1. Initialize and review the platform register

1. Sign in with an administrator account and open `/admin/distribution`.
2. Select **Platforms** and initialize the register once. Existing records are preserved; missing seed entries are added.
3. Review each destination's public evidence, current eligibility, commercial terms, payout territory, permitted account delegation, and allowed upload/report methods.
4. Update a platform only after checking current official evidence. Keep `CONNECTED` unavailable until a real authorized adapter has passed a health check. Record the next operator action.

## 2. Prepare an application draft

1. Select **Applications**, choose a researched platform, and enter only verified studio/contact details.
2. Generate the draft and review every field, placeholder, legal-entity statement, and requested capability.
3. Submit through the platform's official channel outside this application. Do not enter passwords, identity documents, or payment credentials into the draft.
4. Record the submitted date and HTTPS evidence only after an operator has actually submitted the application. Record approval only after reviewing official evidence.

## 3. Review video-specific rights

1. Select **Rights**, choose a video and an assigned performer, and enter the verified production date.
2. Open the restricted existing compliance workflow to review the original government ID, age-at-filming evidence, consent/release, signed contract, and production records. This screen intentionally displays status and document type only; it does not expose document URLs or ID/selfie contents.
3. Select the platform, permitted distribution variants, authorized territories, and the release document that matches this production.
4. Complete each affirmative rights, identity, consent, coercion, recording, impairment, safety, and legal recordkeeping review only after personally checking the underlying evidence.
5. Record `APPROVED` only when all evidence and review checks pass. Use `UNDER_REVIEW`, `MISSING_DOCUMENTS`, `REJECTED`, `SUSPENDED`, or `LEGAL_HOLD` when appropriate. Add an expiry date when the authorization is time-limited.

The readiness check evaluates age on the production date, not the current date. It checks every assigned performer and requires a video-specific grant for the selected platform and variant.

## 4. Prepare a distribution package

1. Select **Queue**, choose a video, researched platform, and distribution variant, then review the platform-specific title and description.
2. Prepare the package. The service checks the current source master, checksum, audio, duration, resolution, MIME type, codec, poster/preview, performer records, production-specific rights, existing creative/QA/executive/governance approvals, and metadata constraints.
3. Resolve every reported gate before retrying. A blocked job is retained for review; it is not an upload attempt.
4. Download the metadata-only operator package if useful. Obtain media through the studio's approved secure workflow; the package contains no video file or source URL.
5. Upload through an officially permitted platform workflow outside this app. Record a publication only after the actual upload, matching official destination URL, external content ID, platform approval, and current rights checks.

The service creates a stable idempotency key per video, platform, and variant. Review an existing job instead of creating duplicate work.

## 5. Import revenue reports

Use the canonical CSV header:

```csv
period_start,period_end,external_content_id,video_id,revenue_type,currency,gross_sales,platform_deductions,refunds,chargebacks,views,units_sold,classification
```

- Dates use `YYYY-MM-DD`; currency uses a three-letter ISO code.
- `revenue_type` is one of `AD_REVENUE`, `PPV`, `SUBSCRIPTION`, `CLIP_SALES`, or `OTHER`.
- `classification` is `PLATFORM_REPORTED` or `ESTIMATE`; keep estimates clearly separate from platform statements.
- Monetary values are non-negative decimal amounts. Net distribution revenue is gross less platform deductions, refunds, and chargebacks.
- Maximum report size is 250 KB and 500 data rows. Reimporting the same report checksum does not create a second completed import.
- Review the platform statement and imported totals before accounting or payout decisions. This feature does not establish actual receipt of funds.

## 6. Record white-label partner terms

Create a draft for a partner with the proposed setup fee and creator/studio split. The seed defaults ($2,490 setup, 70/30 split) are editable proposal values, not approved pricing or legal terms. The split calculator is available only after an operator records signed-contract evidence and a signed date. Use net proceeds after explicitly recorded platform deductions, refunds, and chargebacks.

## 7. Operational limitations

- No platform API, upload adapter, OAuth token, password, or external account connection is implemented.
- Platform research can become stale; recheck official terms and current account-specific agreements before each onboarding or material change.
- Technical validation fields are present on `VideoAsset`, but the current processing pipeline must be extended to populate them from verified file inspection before assets can pass the gate.
- Publishing and recording are separate operator actions. The app never infers that a draft or approved account means a video was published.
