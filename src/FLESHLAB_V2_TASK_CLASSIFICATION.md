# FLESHLAB V2 — STRICT TASK CLASSIFICATION
**Generated**: 2026-06-06 | **Based on**: Code review of actual files + audit report  
**Status**: PLAN ONLY — NO CODE CHANGED

## Category Definitions
| Code | Meaning |
|------|---------|
| **A** | Truly safe, single-file UI/text fix — zero side effects |
| **B** | Safe but requires visual/test verification before closing |
| **C** | Data-shape / API risk — field mapping, response shape, or API contract change |
| **D** | Auth/session risk — changes who can call what, or how identity is validated |
| **E** | Earnings/accounting risk — affects numbers, calculations, or financial records |
| **F** | Public/security risk — affects what is visible to unauthenticated users |
| **G** | Must not be done without explicit written approval from project owner |

Multiple codes may apply. Listed in order of priority.

---

## PHASE 1 TASK RECLASSIFICATIONS

---

### Task 1.1 — Fix PlatformStatsTab Month Selector

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `components/performerDashboard/PlatformStatsTab.jsx` |
| **Original classification** | Very Low — pure UI change |
| **Corrected classification** | **B** |
| **Why** | Verified from source: Radix `<SelectContent>` does already import `SelectItem` at line 5. The current code uses raw `<option>` tags inside `<SelectContent>`, which Radix ignores — the dropdown renders empty. This IS a Radix Select requirement: children of `<SelectContent>` must be `<SelectItem>` components. The fix is replacing `<option key={month} value={month}>` with `<SelectItem key={month} value={month}>`. One component, no data or logic change. HOWEVER: the available periods list is derived from `statsData?.stats` — which is an array of video stats from the service. If no stats exist for a period, that period won't appear in the dropdown at all (it falls back to a 12-month generated list). After the fix, the SELECT will fire `onValueChange(setSelectedMonth)` which triggers a new API call. Must verify the API call is actually triggered on selection change. |
| **Possible side effects** | Selection now fires `onValueChange` → triggers React Query refetch with new `selectedMonth`. Previously selections were silent (no handler ever called). This is the intended behavior but first time it will actually fire. |
| **Required test** | Open Platform Stats tab. Confirm dropdown is populated. Select a different month. Confirm stats table refreshes. Confirm no console error. |
| **Rollback** | Single `find_replace` reverting `<SelectItem>` back to `<option>`. |

---

### Task 1.2 — Fix VideoEdit German Text

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `pages/admin/VideoEdit.jsx` |
| **Original classification** | Very Low |
| **Corrected classification** | **A** |
| **Why** | Confirmed in audit report. Text-only change — `"Video löschen?"` → English equivalent, `title="Löschen"` → English. No logic, no data, no API. Pure string replacement. Admin-only page. |
| **Possible side effects** | None. |
| **Required test** | Open VideoEdit for any video. Hover delete button to see tooltip text. Trigger delete dialog (do not confirm) to see dialog text. Verify English. |
| **Rollback** | Single `find_replace` restoring German strings. |

---

### Task 1.3 — Fix PerformerDetail — Filter Videos by Published Status

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `pages/PerformerDetail.jsx` |
| **Original classification** | Low |
| **Corrected classification** | **B + F** |
| **Why** | Verified from source: line 55 — `base44.entities.Video.list()` — fetches ALL videos with no filter, no status check, no limit. This includes draft, archived, and unlisted videos. These are then filtered client-side for the performer's videos (line 78: `videos.filter(v => assignedVideoIds.includes(v.id))`). If a draft video is in VideoPerformer, it WILL appear on the public performer page. This is an active public-facing security issue. Fix is simple: change `.list()` to `.filter({status: 'published'})`. ALSO NOTE: line 50 — `base44.entities.Performer.list()` — fetches ALL performers with no status filter, including inactive/pending performers. Both should be filtered. Additionally: the `base44.entities.VideoPerformer.list()` at line 65 still fetches ALL VideoPerformer records globally (not filtered by performer) — this is a performance issue but not a security issue since the client-side filter at line 74 is correct. Recommend fixing Video and Performer filters but leaving VideoPerformer for a separate performance pass. |
| **Possible side effects** | After the fix: draft videos will no longer appear on public performer pages. If admin is using this page to preview a draft performer profile, it will no longer show drafts. This is correct behavior. |
| **Required test** | (1) Verify a published video appears on its performer's page. (2) Verify a draft video does NOT appear. (3) Verify inactive performers (status != active) are not accidentally shown if navigated to directly. (4) Check `performerVideos.length` count is correct. |
| **Rollback** | Single `find_replace` restoring `.list()`. |

---

### Task 1.4 — Remove date_of_birth from Public Performers API

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `functions/getPublicPerformers.js` |
| **Original classification** | Low |
| **Corrected classification** | **B + F** |
| **Why** | Verified from source: line 62 — `date_of_birth: p.date_of_birth` is explicitly in the sanitized output object. This is real PII (a performer's birthdate) being exposed to all unauthenticated API callers. The field is labeled in the source comment as "Sanitize — only public-safe fields, never expose compliance/payout/internal data" — yet date_of_birth was inadvertently included. Fix: remove line 62. HOWEVER: must verify `date_of_birth` is not consumed anywhere in the frontend. From source review of `PerformerDetail.jsx`, the `date_of_birth` field is NOT rendered anywhere on the page. The `performerBadges` component must also be checked. The `FanclubSupportBlock`, `PerformerCard`, and `StudioHeader` components that receive performer data must be confirmed not to use this field for display. NOTE: `created_date` on line 63 is also borderline — it's not PII but it's operational metadata. Consider removing it too. |
| **Possible side effects** | Any frontend component reading `performer.date_of_birth` from the getPublicPerformers response will get `undefined`. Must do a full grep for `date_of_birth` usage in public-facing components before deploying. |
| **Required test** | (1) Call getPublicPerformers, confirm `date_of_birth` absent from response. (2) Public performers page loads correctly. (3) PerformerDetail page loads correctly. (4) No component displays a broken date field. |
| **Rollback** | Single `find_replace` restoring the line. |
| **Pre-condition** | Search all public-facing components for `date_of_birth` usage before making this change. |

---

### Task 1.5 — Fix Admin Earnings Page Default Split %

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `pages/admin/Earnings.jsx` |
| **Original classification** | Low — only affects new line item creation defaults |
| **Corrected classification** | **B + E** |
| **Why** | Verified from source: line 25 — `performer_share_percent: 70` is the hardcoded initial state for the Add Line Item modal. Line 80 — the reset after save also resets to `70`. Line 162-163 — `handleAddLineItem` computes `performerAmount = gross * (percent / 100)` and `studioAmount = gross - performerAmount`. The split percentage directly drives the actual financial amounts (`performer_amount_usd`, `studio_amount_usd`) that get SAVED to the database as PerformerEarningLineItem records. These are not just display defaults — they produce permanent financial records. An admin who doesn't manually correct the % before saving will create a record with 70% performer share for a 40%-model performer. This cannot be automatically fixed after the fact without also correcting the saved amounts. HOWEVER: the impact is limited to future manually-added line items only. Existing records are unaffected. The admin IS shown the % field and can change it before saving. Fix options: (a) Read `Performer.revenue_split_pct` when performer is selected and pre-populate the default — requires fetching performer data (already fetched, line 34: `performers`); (b) simply change hardcoded `70` to `0` to force admin to consciously enter a value; (c) change to `40` as the more common model. Option (a) is cleanest but adds logic. Option (b) is safest. |
| **Possible side effects** | If default changes to dynamically read performer.revenue_split_pct: the `newLineItem` state initialization must also update when `selectedPerformer` changes — requires a `useEffect`. If the performer record doesn't have `revenue_split_pct` set, fallback must be explicit. |
| **Required test** | (1) Select The_Fitmaster → default shows 40%. (2) Enter a gross amount → performer_amount and studio_amount shown in preview are correct. (3) Save → read back the PerformerEarningLineItem and confirm performer_share_percent=40, performer_amount=gross*0.4. (4) Change % to 50 → saved amounts recalculate correctly. |
| **Rollback** | Single `find_replace` restoring `70`. |
| **Critical note** | This fix MUST be classified as earnings risk. Admin must visually verify amounts before saving regardless of default. |

---

### Task 1.6 — Fix EarningsTab Field Mapping (earning.earning_type crash)

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `components/performerDashboard/EarningsTab.jsx` |
| **Original classification** | Low — defensive fallback |
| **Corrected classification** | **C + B** |
| **Why** | Verified from source: line 78 — `earning.earning_type.replace(/_/g, " ")`. The `.replace()` call is on `earning.earning_type` with NO null check. If `earning_type` is undefined (as it would be for new-style PerformerEarningLineItem records which use `source_type` not `earning_type`), this crashes with `TypeError: Cannot read properties of undefined (reading 'replace')`. HOWEVER: this component `EarningsTab.jsx` is NOT currently rendered anywhere in `PerformerDashboardTabs` — it's a disconnected component. It calls `get_earnings` without a `performer_token` param (line 16 — only `action`, `performer_id`, `period_month`), so it would also 401 even if wired up. The crash is real but the impact is currently zero because the component isn't rendered. The fix is strictly a data-shape issue: the component assumes legacy `earning_type` field but the API returns mixed records with either `earning_type` (PerformerEarning) or `source_type` (PerformerEarningLineItem) or neither. Fix: `(earning.source_type || earning.earning_type || 'income').replace(/_/g, " ")`. Also note: line 83 uses `earning.net_amount_usd` which exists on PerformerEarning but on PerformerEarningLineItem the field is `performer_amount_usd`. This is a second data-shape mismatch in the same component. |
| **Possible side effects** | If this component is later wired up without also fixing the token issue (see 1.9), it will still fail with 401. Both fixes (1.6 and 1.9) must be applied before this tab can be safely enabled. |
| **Required test** | Confirm EarningsTab is NOT currently imported in PerformerDashboardTabs (it should not be). If fixing, test with mock data containing both old and new-style earnings objects. |
| **Rollback** | Single `find_replace`. |
| **Important** | Also fix `earning.net_amount_usd` → `earning.net_amount_usd || earning.performer_amount_usd` in the same pass to avoid a second crash. |

---

### Task 1.7 — Fix EarningsBreakdownTable Date Column

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `components/performerDashboard/EarningsBreakdownTable.jsx` |
| **Original classification** | Very Low — display only |
| **Corrected classification** | **A** |
| **Why** | Display-only component. No data is written. Date column currently shows N/A for unpaid earnings because `paid_at` is null. Showing `period_month` as primary is strictly a UX improvement. No financial values are changed. This component is actively rendered in `OverviewTab` for The_Fitmaster. |
| **Possible side effects** | None. The period_month field is always populated (it's required on PerformerEarning). |
| **Required test** | Verify The_Fitmaster's OverviewTab shows "2026-06" in the date column for the pending livestream earning instead of "N/A". |
| **Rollback** | Single `find_replace`. |

---

### Task 1.8 — Fix DetailedVideoCard Hardcoded Compliance Status

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `components/performerDashboard/DetailedVideoCard.jsx` |
| **Original classification** | Low — display only |
| **Corrected classification** | **B + C** |
| **Why** | Verified from source: line 206-208 — `<p className="font-medium capitalize text-green-500">{video.compliance_status}</p>`. The `video.compliance_status` field is set by `performerDashboardService:get_videos` which hardcodes `compliance_status: 'compliant'` for every video regardless of actual compliance state. The display component itself simply renders what it receives — the hardcoding is in the service. The roadmap suggested "remove display of this field OR change label to Released based on video status." HOWEVER: removing or changing this display is NOT a simple find_replace — it requires understanding what the compliance_status field is supposed to mean in the performer-facing context (is it performer's release consent? asset compliance? age verification?). If we remove it, performers lose a compliance indicator they may be relying on. If we change it to show `video.status` instead, we're displaying publish status as "compliance" which is semantically wrong. **The correct fix is a display fix only: remove the "Compliance" row entirely from DetailedVideoCard's expanded section, since the data is fake.** This is safe. The `release_status` and `promo_status` rows directly below it are ALSO likely hardcoded in the service. They should also be verified before display. |
| **Possible side effects** | Performers currently see a green "compliant" badge on all their videos in the expanded detail view. Removing it removes the false assurance but also removes any compliance status visibility. This is acceptable since the current value is fabricated. |
| **Required test** | Open My Videos tab for The_Fitmaster. Expand a video card. Confirm compliance row is gone (or replaced with something real). Confirm other rows (asset status, revenue breakdown) still render. |
| **Rollback** | Single `find_replace` restoring the row. |
| **Explicit approval needed** | Confirm with project owner that removing compliance display from performer-facing video cards is acceptable. |

---

### Task 1.9 — Add ComplianceTab PerformerToken

| Field | Value |
|-------|-------|
| **Phase** | 1 |
| **Files affected** | `components/performerDashboard/ComplianceTab.jsx`, `components/performerDashboard/PerformerDashboardTabs.jsx` |
| **Original classification** | Low — single-file fix |
| **Corrected classification** | **D + B** |
| **Why** | Verified from source: `ComplianceTab.jsx` line 9 — `export default function ComplianceTab({ performerId })` — receives only `performerId`, no token. Line 13-16: the API call only sends `action`, `performer_id` — no `performer_token`. In `performerDashboardService`, the `get_compliance` action validates the session token. Without the token, the call goes to the server with no auth token in the body, and `performerDashboardService` will return a 401/403. The fix is two-file: (1) `ComplianceTab.jsx`: add `performerToken` to prop signature, add to invoke call; (2) `PerformerDashboardTabs.jsx`: pass `performerToken={performerToken}` to `ComplianceTab`. This is an auth/session change because it changes the authentication path for a backend call. It's low-risk (currently broken → working), but it is NOT a single-file change and it IS an auth flow change. The `create_document_signed_url` mutation at line 24-30 also does not pass `performer_token` — this would fail for document downloads too. Both calls need the token. |
| **Possible side effects** | ComplianceTab will now make authenticated calls. If a performer's token is expired, they will get a 401 instead of a silent empty state. This is correct behavior but the component must handle the error state gracefully (show "Session expired, please log in again" rather than a blank screen). |
| **Required test** | (1) Login as The_Fitmaster. Navigate to Compliance tab. Confirm KYC status "approved" is shown. Confirm 1 contract is listed. Confirm 3 compliance records (2 IDs + 1 selfie) are shown. (2) Try downloading a compliance record — confirm signed URL opens. |
| **Rollback** | Revert prop change in ComplianceTab.jsx + revert prop pass in PerformerDashboardTabs.jsx. Two files. |

---

## PHASE 2 TASK RECLASSIFICATIONS

---

### Task 2.1 — Fix Support Tab Auth / Link user_id (Option A: data fix)

| Field | Value |
|-------|-------|
| **Phase** | 2 |
| **Files affected** | Performer record (data only) — no code files |
| **Original classification** | Low — data only |
| **Corrected classification** | **D + G** |
| **Why** | Linking a Performer record to a Base44 User account via `performerAdminService:link_user` is NOT a trivial data fix. Once linked: (1) The performer can use Base44 user auth endpoints (support, payout, profile) as their permanent identity. (2) If the wrong user_id is linked, a different person can log in as Base44 user and access performer-private data including payout history, compliance docs, and support tickets. (3) The link is permanent — `unlink_user` exists but removing the link breaks all user-auth-dependent features again. For The_Fitmaster specifically: they log in via username/password (custom auth), not via Base44 user account. Linking requires creating a Base44 user account for them OR linking to an existing one. This must be confirmed: does The_Fitmaster HAVE a Base44 user account? If not, linking requires inviting them first. This is an identity binding decision and must be explicitly approved per performer. |
| **Possible side effects** | Linked performer can now log in via both custom auth AND Base44 email/password. If Base44 email is compromised, performer account is compromised. If the wrong Base44 user is linked, data privacy breach. |
| **Required test** | (1) Before linking: confirm which Base44 user email belongs to The_Fitmaster. (2) After linking: verify Support tab works. (3) Verify no other performer's data is accessible through the linked account. |
| **Rollback** | Call `performerAdminService:unlink_user`. |
| **Approval required** | YES — explicit confirmation of which user_id to link per performer, and confirmation that The_Fitmaster has or will create a Base44 account. |

---

### Task 2.2 — Fix DashboardHeader Redundant Auth Call

| Field | Value |
|-------|-------|
| **Phase** | 2 |
| **Files affected** | `components/performerDashboard/DashboardHeader.jsx`, `pages/performer/PerformerDashboard.jsx` |
| **Original classification** | Medium — prop interface change |
| **Corrected classification** | **D + B** |
| **Why** | DashboardHeader currently calls `getPerformerProfilePrivate` which requires Base44 user auth. For The_Fitmaster (user_id: null), this call silently fails and the header shows only what it receives from localStorage. The fix — removing the call and passing performer data as prop — is architecturally correct. HOWEVER: the fix requires understanding exactly what `getPerformerProfilePrivate` returns vs what `performerDashboardService:get_dashboard_summary` returns. The private profile may include fields the header displays that are NOT in the dashboard summary (e.g., private contact info, payout method preview). Must read DashboardHeader source to confirm what data it uses before removing the private profile call. If the header renders any field from getPerformerProfilePrivate that's absent from get_dashboard_summary, the header will silently show blank/undefined values. |
| **Possible side effects** | Header displays different data than before if private_profile had additional fields. Profile image may change if private_profile had a different/updated URL. |
| **Required test** | (1) Header shows correct display_name. (2) Profile image loads. (3) Status badge correct. (4) Logout button works. (5) Compare against pre-fix screenshot. |
| **Rollback** | Revert both files. |
| **Pre-condition** | Read DashboardHeader.jsx source to confirm all displayed fields are available in get_dashboard_summary before implementing. |

---

### Task 2.3 — Fix ProfileAndPayoutTab Redundant Auth Call

| Field | Value |
|-------|-------|
| **Phase** | 2 |
| **Files affected** | `components/performerDashboard/ProfileAndPayoutTab.jsx` |
| **Original classification** | Medium |
| **Corrected classification** | **D + C + B** |
| **Why** | ProfileAndPayoutTab calls `getPerformerProfilePrivate` which uses Base44 user auth AND returns private data (payout method, contact info). Simply passing performer data from parent would expose only what's in the Performer entity, which does NOT include payout method details (those are in PerformerProfilePrivate entity). The fix must either: (a) add `performer_token` auth path to `getPerformerProfilePrivate` (Phase 3 work), or (b) add a new action to `performerDashboardService` that returns private profile data using session token auth. Option (b) is safer and does not touch the existing function. This task depends on Phase 3.1 (dual auth) or requires creating a new service action — it is not a simple prop-passing fix as the roadmap implies. |
| **Possible side effects** | If payout method data is unavailable (because private profile can't be fetched), the payout form would render empty, potentially allowing a performer to submit a blank payout request. |
| **Required test** | (1) Payout method section shows existing payout details. (2) Profile info section shows correct data. (3) Contact info update form works. |
| **Rollback** | Revert single file. |
| **Dependency** | Should move to Phase 3 or be paired with Phase 3.1 (dual auth). Not safe in Phase 2 as currently described. |

---

### Task 2.4 — VideoDetail → Use getPublicVideoDetail

| Field | Value |
|-------|-------|
| **Phase** | 2 |
| **Files affected** | `pages/VideoDetail.jsx` |
| **Original classification** | Medium |
| **Corrected classification** | **B + C + F** |
| **Why** | This is the right fix but requires careful field mapping. The current VideoDetail.jsx fetches directly via entity SDK and has access to ALL video fields including those that may not be sanitized. The `getPublicVideoDetail` function returns a `safeVideo` object. Before implementing, must verify: (1) `safeVideo` includes all fields that VideoDetail.jsx currently renders (access_tier, trailer_url, categories, tags, short_summary, duration_seconds, primary_thumbnail_url, brand_id, etc.). (2) The `legacy_slugs` redirect logic — current code likely checks a `legacy_slugs` array; if getPublicVideoDetail doesn't return this field, redirect logic breaks. (3) The `Video.filter({status:'published'}, '-release_date', 100)` + client-side slug match is replaced by a backend slug lookup — 404 behavior must be identical. (4) Related videos (currently derived from the fetched video list) must still work. The function must be read in full before this task is started. |
| **Possible side effects** | (1) Any field that VideoDetail renders that's absent from safeVideo will show undefined/blank. (2) legacy_slugs redirect may break. (3) 404 handling may differ. (4) SEO structured data (jsonLd) uses video fields — must verify all fields available. |
| **Required test** | (1) Known published video loads correctly. (2) Trailer plays. (3) Performers shown with images. (4) Legacy slug redirects. (5) Non-existent slug returns proper 404. (6) source_video_url NOT in page HTML source. (7) All SEO meta tags present. |
| **Rollback** | Revert to entity SDK calls in VideoDetail.jsx. |
| **Pre-condition** | Read `functions/getPublicVideoDetail.js` in full and map every field used in VideoDetail.jsx against the safeVideo object before implementing. |

---

### Task 2.5 — Fix MonthlyCloseout Revenue Split Default

| Field | Value |
|-------|-------|
| **Phase** | 2 |
| **Files affected** | `functions/monthlyCloseoutService.js` |
| **Original classification** | Medium — only affects future runs |
| **Corrected classification** | **E + G** |
| **Why** | The roadmap correctly notes this only affects future `generate_draft_earnings` runs, not existing records. HOWEVER: the current code `performer.revenue_split_pct || 70` is actually correct behavior for the data as it exists — The_Fitmaster has `revenue_split_pct: 40` so `40 || 70` evaluates to `40` (correct). The fallback to `70` only fires if a performer has `revenue_split_pct: null` or `revenue_split_pct: 0`. Before changing the fallback from `70` to `40`: (1) Confirm whether any performer has `revenue_split_pct: null` (Phase 0 data check needed). (2) Understand why `70` was the original default — was it the intended standard for some performers? Changing to `40` would silently produce the wrong split for any performer whose model is 70/30. (3) A better fix is: if `revenue_split_pct` is null/0, HALT generation for that performer with an error, forcing admin to set it explicitly. This is safer than assuming a default. Changing any default in a financial calculation function without explicit written approval is an accounting risk. |
| **Possible side effects** | If default changes to `40`: any future performer added without setting revenue_split_pct will get 40% earnings generated instead of 70%. If their contract says 70%, this creates a financial discrepancy that requires manual correction. |
| **Required test** | (1) Dry-run closeout for The_Fitmaster (40%) — confirm correct. (2) Dry-run for any 70%-model performer — confirm correct. (3) Attempt dry-run for a performer with null revenue_split_pct — confirm it halts with error, not silently proceeds. |
| **Rollback** | Revert function. Any PerformerEarning records already generated from the wrong split must be manually corrected — this is the real risk. |
| **Approval required** | YES — explicit written approval confirming what the fallback behavior should be for performers with null revenue_split_pct. |

---

### Task 2.6 — Remove PublishingDebugPanel

| Field | Value |
|-------|-------|
| **Phase** | 2 |
| **Files affected** | `pages/admin/VideoEdit.jsx` |
| **Original classification** | Low — display only |
| **Corrected classification** | **B** |
| **Why** | The PublishingDebugPanel is admin-only (behind AdminGuard + ProtectedRoute — never visible to public). There is no security concern. The risk is operational: if any admin is currently using it to debug a stuck processing job or a failed publish, removing it eliminates a diagnostic tool. Must confirm: (1) Is there an active video processing issue being debugged right now? (2) Is the panel used as part of any documented admin workflow? If the answer is no to both, this is safe. |
| **Possible side effects** | Admin loses visibility into the raw publish check state for a specific video during debugging. |
| **Required test** | Confirm VideoEdit still loads. Confirm PublishReadinessChecklist still shows. Confirm publish/unpublish toggle still works. |
| **Rollback** | Revert the conditional/removal. |
| **Pre-condition** | Confirm with admin team that no active debugging relies on this panel. |

---

## PHASE 3 TASK RECLASSIFICATIONS

---

### Task 3.1 — Add Session Token Auth Path to Performer-Facing Functions

| Field | Value |
|-------|-------|
| **Phase** | 3 |
| **Files affected** | `performerSupportService`, `createPerformerPayoutRequest`, `getPerformerPayoutRequests`, `updatePerformerContactInfo`, `updatePerformerPayoutMethod`, `getPerformerProfilePrivate`, `identityVerificationService` |
| **Original classification** | High |
| **Corrected classification** | **D + G** (per function) |
| **Why** | Adding a dual-auth path to production backend functions changes the security boundary of each function. The risk is: if the session token validation has any flaw (e.g., cross-performer token reuse, expired token not checked, token brute-force possible), ALL 7 functions become accessible to any performer who can guess another's token. The session token is a UUID stored in PerformerSession with an `expires_at`. The validation in performerDashboardService (which correctly uses tokens) serves as the reference implementation. Each function must replicate this exact validation: query PerformerSession by token, check not revoked, check not expired, verify performer_id matches the token's performer_id. Must be done ONE function at a time with full testing between each. |
| **Possible side effects** | If token validation is subtly different across functions, some may be more permissive than others. Race condition possible if session is revoked between validation check and operation execution. |
| **Required test** | Per function: (a) valid token + correct performer_id → succeeds; (b) expired token → 401; (c) revoked session → 401; (d) valid token + wrong performer_id in body → 403 (cross-performer blocked); (e) no token + no Base44 auth → 401. |
| **Rollback** | Each function independently revertable. |
| **Approval required** | YES — written approval required before touching any production auth function. |

---

### Task 3.2 — Unify Publish Validation Logic

| Field | Value |
|-------|-------|
| **Phase** | 3 |
| **Files affected** | `functions/validatePublishSafety.js`, `functions/publishVideoToWebsite.js`, `functions/utils/publishSafety.js` |
| **Original classification** | High |
| **Corrected classification** | **B + G** |
| **Why** | The `utils/publishSafety.js` file exists (confirmed in function list) but per audit notes, there is a comment in the codebase saying "shared helpers not reliable in this deployment." If this is true, importing from `utils/publishSafety` in both functions may cause deployment failures (module not found at runtime in Deno). Must read the actual file and test whether the import works before refactoring both production functions. The publish pipeline is critical — a broken `publishVideoToWebsite` means videos cannot be published at all. |
| **Possible side effects** | If shared import fails, both `validatePublishSafety` AND `publishVideoToWebsite` crash on every call — publish pipeline fully broken. |
| **Required test** | (1) Read `functions/utils/publishSafety.js` to understand its current contents. (2) Deploy a test function that imports from it and call it — confirm no module error. (3) Only then refactor the two production functions. (4) After refactor: test validatePublishSafety on a known incomplete video. (5) Test publishVideoToWebsite on a known complete video. |
| **Rollback** | Restore both functions to their inline validation copies (the pre-refactor state). |
| **Approval required** | YES — must test shared import in isolation BEFORE touching the two production functions. |

---

### Task 3.4 — Performer Portal: Create usePerformerSession Hook

| Field | Value |
|-------|-------|
| **Phase** | 3 |
| **Files affected** | New: `hooks/usePerformerSession.js`, `pages/performer/PerformerDashboard.jsx`, `components/performerDashboard/PerformerDashboardTabs.jsx`, all 8 tab components |
| **Original classification** | Med-High |
| **Corrected classification** | **D + B** |
| **Why** | This is a refactor of how the session token flows through the performer portal. The hook itself is low-risk. The risk is in the refactor of 10+ files — if any tab component uses the old localStorage read pattern AND the hook simultaneously during a partial refactor, there may be inconsistencies. Also: the hook uses a `useState` initializer to read from localStorage once on mount — but if the token is refreshed (e.g., after a password change or re-login) without a page reload, the hook won't pick it up. This is acceptable for now but should be documented. The dependency on Phase 1.9 is correct — ComplianceTab token must be fixed first to establish the pattern. |
| **Possible side effects** | If any tab component has its own localStorage read that conflicts with the hook, double-reading may cause React state inconsistency. |
| **Required test** | All 8 tabs load. Token is consistent across tabs. Logout clears localStorage and hook state. Session expiry redirects to login. |
| **Rollback** | Remove hook file, revert all 10+ files. Higher rollback cost — do this phase in one coordinated commit. |

---

### Task 3.5 — PerformerEarningLineItem as Single Earnings Truth

| Field | Value |
|-------|-------|
| **Phase** | 3 |
| **Files affected** | `functions/performerDashboardService.js`, `components/performer/tabs/EarningsTab.jsx`, `pages/admin/Earnings.jsx`, new migration script |
| **Original classification** | Very High |
| **Corrected classification** | **E + G** |
| **Why** | This is a financial data migration. PerformerEarning currently holds The_Fitmaster's $77.65 livecam earning. If the migration script has any bug, this record could be lost, duplicated, or corrupted. The migration also changes the earnings display in the performer portal — if the new display shows different totals than the old one, the performer will notice and flag it. Must be done with a full dry-run, a before/after comparison, and explicit sign-off. The roadmap correctly says DO NOT execute until confirmed. |
| **Possible side effects** | Incorrect totals displayed to performers. Double-counting if migration creates PerformerEarningLineItem records without deactivating the source PerformerEarning records. |
| **Required test** | Full pre/post comparison for every performer with earnings data. |
| **Rollback** | Revert dashboard service to read both sources (current approach). |
| **Approval required** | YES — explicit written sign-off per the roadmap. |

---

## PHASE 4 TASK RECLASSIFICATIONS

---

### Task 4.4 — Dashboard V1 Migration Status Widget

| Field | Value |
|-------|-------|
| **Phase** | 4 |
| **Files affected** | `pages/admin/Dashboard.jsx` |
| **Original classification** | Very Low — display only |
| **Corrected classification** | **A** |
| **Why** | Admin-only page, display-only widget, hardcoded strings. Removing or updating the widget has no impact on any data or API. |
| **Required test** | Dashboard loads. Other stats widgets unaffected. |
| **Rollback** | Single revert. |
| **Pre-condition** | Confirm with admin whether V1 migration is complete or still in progress. |

---

## CONSOLIDATED RECLASSIFICATION TABLE

| Phase | Task | Name | Original Risk | Corrected Category | Safe to Implement Now? | Approval Required? |
|-------|------|------|--------------|-------------------|----------------------|-------------------|
| 1.1 | PlatformStatsTab dropdown | Month selector fix | Very Low | **B** | YES — with test | No |
| 1.2 | German text in VideoEdit | Text replacement | Very Low | **A** | YES | No |
| 1.3 | PerformerDetail video filter | Published status filter | Low | **B + F** | YES — with pre-check on VideoPerformer | No |
| 1.4 | date_of_birth in public API | PII removal from API | Low | **B + F** | YES — after grep for frontend usage | No |
| 1.5 | Admin earnings default split % | Form default change | Low | **B + E** | YES — but treat as earnings risk | No — but log the change |
| 1.6 | EarningsTab crash on earning_type | Null-safe field access | Low | **C + B** | YES — component is unused currently | No |
| 1.7 | EarningsBreakdownTable date column | Date display | Very Low | **A** | YES | No |
| 1.8 | DetailedVideoCard compliance status | Remove fake field | Low | **B + C** | YES — after confirming with owner | Yes — confirm removal acceptable |
| 1.9 | ComplianceTab missing token | Auth param fix | Low | **D + B** | YES — but two-file change | No |
| 2.1 | Support tab auth — link user_id | Identity binding | Low | **D + G** | NO — requires approval | YES |
| 2.2 | DashboardHeader prop refactor | Remove redundant API call | Medium | **D + B** | YES — after reading DashboardHeader source | No |
| 2.3 | ProfileAndPayoutTab auth | Remove Base44-auth call | Medium | **D + C + B** | NO — depends on Phase 3.1 or new service action | No — but defer to Phase 3 |
| 2.4 | VideoDetail → getPublicVideoDetail | Refactor data source | Medium | **B + C + F** | YES — after reading getPublicVideoDetail source | No |
| 2.5 | MonthlyCloseout split default | Change earnings fallback | Medium | **E + G** | NO — requires data audit + approval | YES |
| 2.6 | Remove PublishingDebugPanel | Remove debug UI | Low | **B** | YES — after confirming not actively used | No |
| 3.1 | Dual auth in performer functions | Auth path addition | High | **D + G** | NO — explicit approval per function | YES |
| 3.2 | Unify publish validation | Shared module refactor | High | **B + G** | NO — test shared import first | YES |
| 3.4 | usePerformerSession hook | Session refactor | Med-High | **D + B** | YES — after Phase 1.9 | No |
| 3.5 | PerformerEarningLineItem migration | Financial data migration | Very High | **E + G** | NO | YES |
| 4.4 | Dashboard V1 widget | Display update | Very Low | **A** | YES — after confirming V1 status | No |

---

## IMMEDIATELY SAFE TO IMPLEMENT (No Approval Needed, Low Side Effect Risk)

These can be implemented in a single session in any order:

1. **1.2** — German text fix (pure text, admin-only, `A`)
2. **1.7** — EarningsBreakdownTable date column (`A`)
3. **1.1** — PlatformStatsTab dropdown (verify Radix SelectItem, `B`)
4. **1.9** — ComplianceTab token (currently broken → working, `D+B`, two-file)
5. **1.6** — EarningsTab field mapping (unused component, `C+B`)
6. **2.6** — Remove PublishingDebugPanel (after confirming not in active use, `B`)

---

## REQUIRES PRE-CONDITION CHECK BEFORE IMPLEMENTATION

These can be implemented but need a read-file or data check first:

7. **1.3** — PerformerDetail video filter → first: verify VideoPerformer.list() doesn't need status filter too
8. **1.4** — Remove date_of_birth → first: grep all public components for `date_of_birth` usage
9. **1.5** — Earnings default split → first: read Earnings.jsx fully (done — safe to implement, but log the change)
10. **2.2** — DashboardHeader refactor → first: read DashboardHeader.jsx source fully
11. **2.4** — VideoDetail refactor → first: read `functions/getPublicVideoDetail.js` and map all fields

---

## REQUIRES EXPLICIT APPROVAL BEFORE ANY IMPLEMENTATION

These must NOT be touched without written confirmation:

12. **1.8** — DetailedVideoCard compliance removal → confirm with owner that removing compliance field is acceptable
13. **2.1** — Link user_id → confirm which Base44 user to link per performer, explicit approval per binding
14. **2.3** — ProfileAndPayoutTab → defer to Phase 3 (depends on dual auth or new service action)
15. **2.5** — MonthlyCloseout default → confirm what the correct fallback is for null revenue_split_pct
16. **3.1** — Dual auth functions → written approval required, one function at a time
17. **3.2** — Publish validation unify → must test shared import in isolation first, then explicit approval
18. **3.5** — Earnings migration → explicit sign-off + dry-run + before/after comparison

---

*End of Classification Report*  
*No code was changed in the production of this document.*