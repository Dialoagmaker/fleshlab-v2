# FLESHLAB V2 — IMPLEMENTATION ROADMAP
**Generated**: 2026-06-06 | **Based on**: FLESHLAB_V2_FULL_AUDIT_REPORT.md  
**Status**: PLAN ONLY — NO CODE CHANGED

---

## GUIDING PRINCIPLES

1. **Never break what works.** The_Fitmaster portal currently shows correct earnings. Do not touch that flow until a replacement is proven.
2. **No data migration without a dry-run first.** PerformerEarning, PerformerSession, and PerformerEarningLineItem are live production data.
3. **Every phase must be independently deployable.** If Phase 2 breaks something, Phase 1 must still be functional.
4. **Performer portal and admin must stay in sync.** Do not fix one side without verifying the other.
5. **No deletion of any function until zero callers confirmed** via search + runtime log check.

---

## PHASE 0 — SAFETY / BACKUP / NO-CODE PREPARATION
**Goal**: Establish a safety baseline. No code changes. Verify current state, document unknowns, set up rollback checkpoints.

### 0.1 Verify Live Data State (Admin Only)
| Action | What to check | Tool |
|--------|--------------|------|
| Check PerformerSession records | How many active? Any expired not cleaned up? | read_entities PerformerSession |
| Check PerformerEarning vs PerformerEarningLineItem | For every performer, do totals match? | read_entities both |
| Check Performer.user_id | How many performers have user_id null? | read_entities Performer |
| Check Contract.signed_at null | How many signed contracts have signed_at: null? | read_entities Contract {status:'signed'} |
| Check ComplianceDocument entity | Does it have any records? | read_entities ComplianceDocument |
| Check GeoAvailability / GeoPolicy records | Any data? | read_entities GeoAvailability |
| Check PerformerStat records | Any data? | read_entities PerformerStat |
| Check autoPublishVideo callers | Is it in any automation? | list_automations |
| Check checkStuckProcessingJobs | Is it scheduled? | list_automations |
| Check functions/utils/publishSafety | Is it actually imported by publishVideoToWebsite? | read_file functions/publishVideoToWebsite |

### 0.2 Document Current Correct Behavior
Before ANY code change, capture expected outputs:
- The_Fitmaster portal: earnings totals must show $81.74 gross / $32.70 performer / $49.04 studio
- MonthlyCloseout preview for 2026-06 must show correct performer splits
- Admin Performers page must load and paginate
- VideoEdit must load for a published video without errors
- Public homepage must load videos

### 0.3 Confirm Automation Inventory
Run `list_automations` to understand which functions are called on schedule. Critical unknowns:
- `autoPublishVideo` — may be automated
- `checkStuckProcessingJobs` / `markOldJobsAsTimeout` — should be scheduled

**Dependencies**: None  
**Risk**: Zero (read-only)  
**Must NOT touch**: Any code or data  
**Rollback**: N/A  

---

## PHASE 1 — SAFE FIXES (Low Risk, No Architecture Changes)
**Goal**: Fix clear bugs that have zero risk of breaking existing functionality. Each fix is isolated, reversible, and affects only one file.

### 1.1 Fix PlatformStatsTab Month Selector (CRITICAL UX BUG)
**File**: `components/performerDashboard/PlatformStatsTab.jsx`  
**Issue**: Uses `<option>` tags inside Radix `<SelectContent>` — dropdown doesn't render  
**Fix**: Replace `<option key={month} value={month}>` with `<SelectItem key={month} value={month}>`  
**Lines affected**: ~60-72  
**Risk**: Very Low — pure UI change, no data or logic  
**Test checklist**:
- [ ] Platform Stats tab dropdown opens
- [ ] Selecting a month refreshes the stats table
- [ ] No console errors

### 1.2 Fix VideoEdit German Text
**File**: `pages/admin/VideoEdit.jsx` (VideoRow component)  
**Issue**: Delete confirm says "Video löschen?" and button title is "Löschen"  
**Fix**: Replace with English  
**Lines affected**: ~85, ~88  
**Risk**: Very Low  
**Test checklist**:
- [ ] Delete button tooltip shows English
- [ ] Confirm dialog is in English

### 1.3 Fix PerformerDetail — Filter Videos by Published Status
**File**: `pages/PerformerDetail.jsx`  
**Issue**: `base44.entities.Video.list()` returns ALL videos including drafts  
**Fix**: Change to `base44.entities.Video.filter({status: 'published'})`  
**Lines affected**: ~55  
**Risk**: Low — can only reduce displayed content, never expose new content  
**Dependencies**: None  
**Test checklist**:
- [ ] Performer page still shows correct published video count
- [ ] Draft videos are NOT shown on public performer page
- [ ] Page load time may improve

### 1.4 Remove date_of_birth from Public Performers API
**File**: `functions/getPublicPerformers.js`  
**Issue**: `date_of_birth` included in sanitized performer response — PII leak  
**Fix**: Remove `date_of_birth: p.date_of_birth` from the sanitized output object  
**Risk**: Low — only remove a field; no frontend currently displays date_of_birth from this API  
**Test checklist**:
- [ ] getPublicPerformers response no longer includes date_of_birth
- [ ] Public performers page still loads correctly
- [ ] No frontend component breaks (check PerformerCard, PerformerDetail)

### 1.5 Fix Admin Earnings Page Default Split %
**File**: `pages/admin/Earnings.jsx`  
**Issue**: New line item modal defaults `performer_share_percent: 70` — wrong for managed performers  
**Fix**: Change default to read from selected performer's `revenue_split_pct` when performer is selected, fallback to `40` not `70`  
**Lines affected**: ~20-27 (initial state), ~161-172 (handleAddLineItem)  
**Risk**: Low — only affects new line item creation defaults; admin can always override  
**Test checklist**:
- [ ] Select The_Fitmaster (40%) → default shows 40%
- [ ] Select a 70% performer → default shows 70%
- [ ] Saving a line item still works

### 1.6 Fix EarningsTab (Performer Portal) Field Mapping
**File**: `components/performerDashboard/EarningsTab.jsx`  
**Issue**: Uses `earning.earning_type` which doesn't exist on new-style line items → crashes on `.replace()`  
**Fix**: Use `earning.source_type || earning.earning_type || 'income'` with safe fallback  
**Lines affected**: ~78-80  
**Risk**: Low — defensive fallback; won't break legacy records  
**Note**: This tab is NOT rendered in PerformerDashboardTabs (not in tab list) but should be fixed in case it gets wired up  
**Test checklist**:
- [ ] Verify EarningsTab is not currently rendered anywhere (search imports)
- [ ] If wired up, earnings display without crash

### 1.7 Fix EarningsBreakdownTable Date Column
**File**: `components/performerDashboard/EarningsBreakdownTable.jsx`  
**Issue**: Date column shows `formatDate(earning.paid_at)` which is null for pending items → "N/A" is confusing  
**Fix**: Change date column to show `earning.period_month` as the primary value, with paid_at as secondary only when present  
**Lines affected**: ~56-58  
**Risk**: Very Low — display only  
**Test checklist**:
- [ ] Pending earnings show period month (e.g., "2026-06")
- [ ] Paid earnings show paid date

### 1.8 Fix DetailedVideoCard Hardcoded Compliance
**File**: `components/performerDashboard/DetailedVideoCard.jsx`  
**Issue**: `compliance_status` hardcoded as "compliant" in the backend service, not real data  
**Fix**: The backend `performerDashboardService:get_videos` sets `compliance_status: 'compliant'` unconditionally. Remove display of this field from DetailedVideoCard, or change label to "Released" based on video status instead  
**Risk**: Low — display only  
**Test checklist**:
- [ ] VideoCard in My Videos no longer shows misleading compliance status

### 1.9 Add ComplianceTab PerformerToken
**File**: `components/performerDashboard/ComplianceTab.jsx`  
**Issue**: Calls `performerDashboardService:get_compliance` WITHOUT passing `performer_token` — will 401  
**Fix**: Add `performer_token: performerToken` to the invoke call. The component needs to receive `performerToken` as a prop from `PerformerDashboardTabs`.  
**Files affected**: `ComplianceTab.jsx` (add prop), `PerformerDashboardTabs.jsx` (pass prop)  
**Risk**: Low — this currently fails; fix makes it work  
**Test checklist**:
- [ ] Compliance tab loads without 401 error
- [ ] KYC status shown correctly
- [ ] Contracts list shown

**Phase 1 Total**: 9 isolated fixes, all low-risk  
**Rollback**: Each fix is a single `find_replace`. Revert individually.  
**Must NOT touch**: Any backend function logic, any entity, any earnings data  

---

## PHASE 2 — MEDIUM-RISK CONSOLIDATION
**Goal**: Fix architectural inconsistencies that require careful coordination between frontend and backend but do not require data migration.

**Prerequisites**: Phase 0 and Phase 1 complete and verified.

### 2.1 Fix Performer Portal Support Tab Auth (IMPORTANT)
**Root cause**: `performerSupportService` uses `base44.auth.me()` to find Performer via `user_id`. The_Fitmaster has `user_id: null` → 403.

**Two options** (choose one, confirm with user first):

**Option A — Quick fix**: Link The_Fitmaster's Performer record to a Base44 user account via `performerAdminService:link_user`. No code change needed.
- Action: Admin runs `link_user` for The_Fitmaster
- Risk: Very Low (data only)
- Downside: Every future performer must also be linked

**Option B — Proper fix**: Add `performer_token` as an alternative auth path to `performerSupportService` (alongside `base44.auth.me()`)
- Files: `functions/performerSupportService.js`
- Risk: Medium — changes auth logic in backend function
- Upside: Works for ALL performers regardless of user_id

**Recommended**: Do Option A immediately (admin data fix), plan Option B for Phase 3.

**Test checklist** (Option A):
- [ ] Support tab loads for The_Fitmaster
- [ ] Can submit a new support request
- [ ] Admin can see and respond to it

### 2.2 Fix DashboardHeader Redundant Auth Call
**File**: `components/performerDashboard/DashboardHeader.jsx`  
**Issue**: Calls `getPerformerProfilePrivate` on mount (uses Base44 user auth). If user_id is null, this fails silently (header shows generic name). Performer data is already available from the parent page.

**Fix**: Remove the `getPerformerProfilePrivate` call from DashboardHeader. Pass `performer` object directly as a prop from `PerformerDashboard.jsx` (it already has it from `performerDashboardService:get_dashboard_summary`).

**Files affected**:
- `components/performerDashboard/DashboardHeader.jsx` — remove loadProfile(), use prop
- `pages/performer/PerformerDashboard.jsx` — pass performer data as prop

**Risk**: Medium — changes prop interface for DashboardHeader  
**Dependencies**: performer data already loaded in parent  
**Test checklist**:
- [ ] Dashboard header shows correct display name
- [ ] Dashboard header shows correct status badge
- [ ] Profile image loads correctly
- [ ] Logout button still works

### 2.3 Fix ProfileAndPayoutTab Redundant Auth Call
**File**: `components/performerDashboard/ProfileAndPayoutTab.jsx`  
**Issue**: Calls `getPerformerProfilePrivate` which requires user_id. Should use session token or receive data from parent.

**Fix**: Pass performer data (already available) from parent. Change `getPerformerProfilePrivate` call to `performerDashboardService:get_compliance` or similar session-authenticated call for private profile data.

**Files affected**: `ProfileAndPayoutTab.jsx`  
**Risk**: Medium  
**Dependencies**: 2.2 completed (establishes pattern)  
**Test checklist**:
- [ ] Profile tab shows correct performer info
- [ ] Payout method form loads correctly
- [ ] Payout requests section loads

### 2.4 Fix VideoDetail Page Data Fetching
**File**: `pages/VideoDetail.jsx`  
**Issue**: 
1. Fetches ALL published videos (100 limit) client-side, filters by slug
2. `base64.entities.VideoPerformer.list()` — fetches ALL VideoPerformer with no filter

**Fix**: Use `getPublicVideoDetail` backend function which already does this correctly and safely. The backend function exists and is properly secured — the frontend simply needs to call it.

**Files affected**: `pages/VideoDetail.jsx`  
**Risk**: Medium — significant refactor of data loading  
**Before**: entity SDK direct calls → all videos + all VideoPerformers in memory  
**After**: single `callPublicFunction('getPublicVideoDetail', {slug})` call  
**Dependencies**: Verify `getPublicVideoDetail` returns all required fields (compare safeVideo object in function vs what VideoDetail.jsx uses)  
**Must NOT break**: Legacy slug redirect logic (check `legacy_slugs` array handling)  
**Test checklist**:
- [ ] Video detail page loads for a known published video slug
- [ ] Trailer/preview plays
- [ ] Performer names/images shown
- [ ] Related videos shown
- [ ] Legacy slug still redirects
- [ ] Non-existent slug returns 404 page
- [ ] source_video_url NOT exposed in page source

### 2.5 Fix MonthlyCloseout Revenue Split Default
**File**: `functions/monthlyCloseoutService.js`  
**Issue**: Default `performer.revenue_split_pct || 70` — if a performer has `revenue_split_pct: 0` or null, generates wrong earnings  
**Fix**: Change fallback from `70` to `40` (the standard managed performer rate), OR better: reject generation if revenue_split_pct is null and require admin to set it first  
**Risk**: Medium — changes earnings generation logic  
**Important**: Does NOT change existing PerformerEarning records. Only affects future `generate_draft_earnings` runs.  
**Dependencies**: Confirm no performer currently has revenue_split_pct: null  
**Test checklist**:
- [ ] Preview closeout shows correct splits for The_Fitmaster (40%)
- [ ] Preview closeout shows 70% for any performer with that split
- [ ] No performer gets wrong default

### 2.6 Separate PublishingDebugPanel from Production
**File**: `pages/admin/VideoEdit.jsx`  
**Issue**: `PublishingDebugPanel` is always rendered in production  
**Fix**: Wrap in a dev-mode check or remove it (it's a UI debug panel, not business logic)  
**Risk**: Low — display only  
**Test checklist**:
- [ ] VideoEdit still shows PublishReadinessChecklist
- [ ] Debug panel hidden or removed

**Phase 2 Total**: 6 fixes, medium complexity  
**Rollback**: Each fix is isolated. Phase 1 remains functional if Phase 2 is reverted.  
**Must NOT touch**: PerformerEarning records, performerDashboardService earnings logic, any compliance entity data  

---

## PHASE 3 — HIGH-RISK MIGRATIONS
**Goal**: Fix architectural root causes that require coordinated changes across multiple files/services. Each item requires explicit confirmation before execution.

**Prerequisites**: Phase 0, 1, 2 complete. All test checklists passing.

### 3.1 Performer Portal Auth: Add Session Token Path to Base44-Auth Functions
**Root cause**: Multiple backend functions require `base44.auth.me()` (Base44 user auth) but are called from performer portal which uses custom session tokens.

**Affected functions**:
- `performerSupportService` (create_request, list_my_requests)
- `createPerformerPayoutRequest`
- `getPerformerPayoutRequests`
- `updatePerformerContactInfo`
- `updatePerformerPayoutMethod`
- `getPerformerProfilePrivate`
- `identityVerificationService`

**Plan**: Add dual-auth path to each function:
```
1. Try base44.auth.me() — if found and has linked performer, use it
2. If no user, check body.performer_id + body.performer_token against PerformerSession
3. If session valid, proceed as performer
```

**Files affected**: All 7 functions listed above  
**Risk**: HIGH — changes auth logic in production backend functions  
**Dependencies**:
- Phase 2.1 Option A must be done (link user_id where possible as interim)
- Each function must be updated AND tested independently
- Do NOT update all 7 at once — one at a time with testing between each

**Rollback**: Each function is independent. Revert one at a time.  
**Must NOT touch**: performerDashboardService (already uses session token correctly)  
**Test checklist** (per function):
- [ ] Function works for performer WITH user_id (Base44 auth path)
- [ ] Function works for performer WITHOUT user_id (session token path)
- [ ] Function REJECTS invalid session token
- [ ] Function REJECTS cross-performer access (performer A cannot access performer B)

### 3.2 Unify Publish Validation Logic
**Root cause**: `validatePublishSafety.js` and `publishVideoToWebsite.js` have identical validation logic with a comment saying "must stay identical". They will drift.

**Plan**:
1. Verify `functions/utils/publishSafety.js` actually exists and contains the logic
2. If it does: update both functions to import from it
3. If it doesn't: create it, then update both functions

**Files affected**:
- `functions/validatePublishSafety.js`
- `functions/publishVideoToWebsite.js`
- `functions/utils/publishSafety.js` (verify/create)

**Risk**: HIGH — changes the publish pipeline  
**Dependencies**: Confirm `utils/publishSafety` is already a shared module pattern that works in this deployment  
**Rollback**: Revert both functions to inline copies (current state)  
**Test checklist**:
- [ ] validatePublishSafety returns same errors as before for a known incomplete video
- [ ] publishVideoToWebsite blocks publishing for same incomplete video
- [ ] A complete video can still be published via ContentReview

### 3.3 Fix VideoDetail to Use getPublicVideoDetail (Moved from Phase 2 if complexity warrants)
*See Phase 2.4 above — may be elevated to Phase 3 if legacy_slugs handling is complex.*

### 3.4 Performer Portal: Pass Token Consistently Through Tab Chain
**Root cause**: PerformerDashboardTabs reads `performerToken` from localStorage on each render. Individual tabs receive it as prop but handling is inconsistent.

**Plan**: Create a `usePerformerSession` hook:
```javascript
// hooks/usePerformerSession.js
export function usePerformerSession() {
  const [token, setToken] = useState(() => localStorage.getItem('performer_session_token'));
  const [performerData] = useState(() => {
    const d = localStorage.getItem('performer_data');
    return d ? JSON.parse(d) : null;
  });
  return { token, performerData, isValid: !!token && !!performerData };
}
```

**Files affected**:
- New: `hooks/usePerformerSession.js`
- `pages/performer/PerformerDashboard.jsx`
- `components/performerDashboard/PerformerDashboardTabs.jsx`
- All 8 tab components

**Risk**: Medium-High — refactor of the entire performer portal session management  
**Dependencies**: Phase 1.9 (ComplianceTab token fix) complete first  
**Rollback**: Remove hook, revert to localStorage calls  
**Must NOT touch**: performerDashboardService validation logic  
**Test checklist**:
- [ ] All 8 tabs load correctly for The_Fitmaster
- [ ] Session token is passed to all API calls
- [ ] Logout clears token correctly
- [ ] Expired session redirects to /performer/login

### 3.5 PerformerEarningLineItem as Single Earnings Truth (Long-term)
**Current state**: Two parallel systems — `PerformerEarning` (old, used by admin Earnings tab via performerFinanceService) and `PerformerEarningLineItem` (new, used by admin Earnings page via performerEarningLineItemService).

**Plan** (DO NOT execute until confirmed):
1. Audit how many performers have data in each entity
2. For performers with data ONLY in PerformerEarning — create migration script to convert to PerformerEarningLineItem (dry-run first)
3. Update performerDashboardService:get_earnings to read ONLY from PerformerEarningLineItem
4. Update admin EarningsTab to use performerEarningLineItemService exclusively
5. Keep PerformerEarning as read-only archive
6. Do NOT delete PerformerEarning entity until Step 5 is fully validated

**Files affected**:
- `functions/performerDashboardService.js` (get_earnings action)
- `components/performer/tabs/EarningsTab.jsx` (admin)
- `pages/admin/Earnings.jsx`
- Migration script (new, dry-run only)

**Risk**: VERY HIGH — touches live financial data  
**Dependencies**:
- Phase 0 data audit complete
- All existing PerformerEarning records mapped to PerformerEarningLineItem equivalents
- Confirmed sign-off from user
**Rollback**: Revert to reading both sources (current approach)  
**Do NOT delete**: `PerformerEarning` entity or `monthlyCloseoutService`  
**Test checklist**:
- [ ] The_Fitmaster 2026-06: $81.74 gross still shown
- [ ] All historical earnings accessible
- [ ] Admin can still add manual entries
- [ ] Monthly closeout still works

---

## PHASE 4 — CLEANUP CANDIDATES
**Goal**: Remove confirmed-dead code and entities after Phase 3 is stable and production-verified.

**Rule**: NOTHING in Phase 4 is removed until explicitly confirmed with evidence:
- Runtime logs showing zero calls in the past 30 days, OR
- Explicit "safe to delete" confirmation from user after reviewing audit evidence

### 4.1 Functions Pending Confirmation (DO NOT TOUCH YET)
| Function | Evidence needed before removal |
|----------|-------------------------------|
| `simulateProcessorCallback` | Zero callers confirmed via codebase search |
| `diagnoseCallbackPath` | Zero callers confirmed |
| `diagnoseVideoAssets` | Not called by VideoEdit currently — confirm |
| `testVideoUrls` | Zero callers confirmed |
| `quickAssetValidation` | Zero callers confirmed |
| `validateVideoAssetAccessibility` | Zero callers confirmed |
| `validateAndFixVideoAssets` | Confirm AssetRepairQueue uses only validateAndRepairVideoAssets |
| `autoPublishVideo` | Check automation list (Phase 0 task) |
| `generateMissingMetaSuggestions` | Zero callers confirmed |
| `analyzeVideoMetadata` | Zero callers confirmed |
| `checkAdminRole` | AdminGuard handles this — confirm function not called anywhere |
| `complianceDocumentService` | Confirm zero ComplianceDocument records |
| `findDuplicateVideos` | Decide: merge into analyzeVideoDuplicates or keep separate |
| `getVideoUploadStatus` | Confirm it's not called alongside getProcessingJobStatus |
| `getPublicVideoDetail` | After Phase 2.4, confirm VideoDetail no longer uses entity SDK |

### 4.2 Components Pending Confirmation
| Component | Evidence needed |
|-----------|----------------|
| `PublishingDebugPanel` | Remove after Phase 2.6 |
| `components/performerDashboard/EarningsTab.jsx` | Confirm not rendered anywhere (not in PerformerDashboardTabs) |

### 4.3 Entities Pending Confirmation
| Entity | Evidence needed before any action |
|--------|----------------------------------|
| `ComplianceDocument` | Zero records in DB (Phase 0 check) |
| `GeoAvailability`, `GeoPolicy`, `GeoRule`, `GeoAudit` | Zero records + no planned use |
| `FanclubContent` | Zero records + no planned use |
| `PerformerStat` | Zero records or confirm no automation writes to it |
| `PageView`, `VideoView` | Confirm not tracked by any analytics function |
| `NotificationLog` | Zero records + no sending function |
| `ExternalVideo` | Confirm no admin page uses it |

### 4.4 Dashboard V1 Migration Status
**File**: `pages/admin/Dashboard.jsx`  
**Action**: Replace hardcoded "Pending" migration items with real status or remove the widget  
**Risk**: Very Low — display only  
**Dependency**: Confirm V1 migration is actually complete or still in progress  

**Phase 4 Must NOT touch**:
- `PerformerEarning` entity (live data)
- `PerformerSession` entity (active sessions)
- `performerLogin` function (active auth system)
- `monthlyCloseoutService` (used by admin)
- `performerFinanceService` (used by admin)
- `migrateLegacyR2Urls` (destructive — confirm before ANY use)
- `deleteUnassignedVideos` (destructive)

---

## PHASE 5 — FINAL LAUNCH READINESS AUDIT
**Goal**: Full pre-launch verification sweep. No new features. All known bugs fixed. Performance baseline established.

### 5.1 Security Checklist
- [ ] Verify source_video_url never appears in public page HTML source
- [ ] Verify date_of_birth removed from getPublicPerformers (Phase 1.4)
- [ ] Verify admin routes return 403 for unauthenticated requests
- [ ] Verify performer session tokens cannot access other performers' data
- [ ] Verify R2 private files (compliance docs, contracts) require signed URLs
- [ ] Verify GuestProductionApplication media (ID docs) only accessible via signed URLs by admin

### 5.2 SEO / Compliance Checklist
- [ ] /2257 page exists and loads (adult content legal requirement)
- [ ] /privacy page exists and has current policy
- [ ] /terms page exists
- [ ] /dmca page exists
- [ ] All published videos have canonical URLs
- [ ] robots.txt blocks /admin/*
- [ ] sitemap.xml accessible and includes all published videos
- [ ] noindex on all /admin/* pages

### 5.3 Earnings Data Integrity Checklist
- [ ] For every performer with earnings, confirm performer_total + studio_total = gross_total
- [ ] Confirm no earnings have status='estimated' visible to performers (should be 'pending' minimum)
- [ ] Confirm monthly closeout for 2026-06 shows correct data for all performers
- [ ] Confirm The_Fitmaster: $81.74 / $32.70 / $49.04 still correct after all phases

### 5.4 Video Pipeline Checklist
- [ ] Upload a new video end-to-end: upload → processing → thumbnail → preview → publish
- [ ] Verify published video appears on public homepage
- [ ] Verify published video appears on performer's public page
- [ ] Verify trailer plays on video detail page
- [ ] Verify source video URL not accessible without authentication

### 5.5 Performer Portal Full Flow Checklist
- [ ] Performer can log in with username/password
- [ ] Overview tab loads with correct data
- [ ] My Videos tab shows all videos with stats
- [ ] Platform Stats tab shows correct revenue for the period
- [ ] Compliance tab shows KYC status, contracts, compliance records
- [ ] Content Upload tab allows file selection and upload
- [ ] My Submissions tab shows submitted content
- [ ] Support tab allows submitting a ticket (requires Phase 3.1)
- [ ] Profile & Payout tab shows profile info (requires Phase 2.3)
- [ ] Logout clears session correctly

### 5.6 Admin Full Flow Checklist
- [ ] Dashboard loads with stats
- [ ] Performers list paginates and searches
- [ ] Performer detail: all 7 tabs load without errors
- [ ] Video list loads, publish toggle works
- [ ] VideoEdit saves metadata, thumbnails show
- [ ] Monthly Closeout preview correct
- [ ] Admin Earnings — can add manual line item for a performer
- [ ] Applications list loads, can view application details
- [ ] Payout Requests loads

### 5.7 Performance Baseline
After Phase 2.4 (VideoDetail fix):
- [ ] Homepage load time < 3s
- [ ] Video detail page load time < 2s (single API call instead of multiple entity fetches)
- [ ] Performers page load time < 2s

### 5.8 Final Code Cleanup
Only after 5.1–5.7 are fully green:
- Remove any remaining console.log debug statements
- Remove `PublishingDebugPanel` (if not done in Phase 2.6)
- Remove hardcoded `console.log` in PlatformStatsTab (lines 16, 23, 39)
- Review all TODO/FIXME comments

---

## MASTER DEPENDENCY GRAPH

```
Phase 0 (Safety checks)
    ↓
Phase 1 (Safe fixes — all independent, can run in parallel)
    ├── 1.1 PlatformStatsTab (independent)
    ├── 1.2 German text (independent)
    ├── 1.3 PerformerDetail published filter (independent)
    ├── 1.4 Remove date_of_birth (independent)
    ├── 1.5 Earnings default split (independent)
    ├── 1.6 EarningsTab field mapping (independent)
    ├── 1.7 EarningsBreakdownTable date (independent)
    ├── 1.8 DetailedVideoCard compliance (independent)
    └── 1.9 ComplianceTab token (independent)
    ↓
Phase 2 (Medium-risk — sequential within phase)
    ├── 2.1 Support tab auth (Option A: data fix)
    ├── 2.2 DashboardHeader prop refactor
    ├── 2.3 ProfileAndPayoutTab (depends on 2.2 pattern)
    ├── 2.4 VideoDetail → getPublicVideoDetail
    ├── 2.5 MonthlyCloseout split default
    └── 2.6 Remove PublishingDebugPanel
    ↓
Phase 3 (High-risk — confirm with user before each)
    ├── 3.1 Dual auth in performer-facing functions (one at a time)
    ├── 3.2 Unify publish validation (confirm utils/publishSafety exists)
    ├── 3.4 usePerformerSession hook
    └── 3.5 PerformerEarningLineItem migration (LAST, requires explicit sign-off)
    ↓
Phase 4 (Cleanup — confirm before each deletion)
    ↓
Phase 5 (Final launch audit)
```

---

## RISK SUMMARY TABLE

| Phase | Item | Risk | Data Risk | Rollback |
|-------|------|------|-----------|---------|
| 1.1 | PlatformStatsTab dropdown | Very Low | None | Single find_replace |
| 1.2 | German text | Very Low | None | Single find_replace |
| 1.3 | PerformerDetail filter | Low | None | Single find_replace |
| 1.4 | Remove date_of_birth | Low | None | Single find_replace |
| 1.5 | Earnings default split | Low | None | Single find_replace |
| 1.6 | EarningsTab field | Low | None | Single find_replace |
| 1.7 | Date column | Very Low | None | Single find_replace |
| 1.8 | Hardcoded compliance | Very Low | None | Single find_replace |
| 1.9 | ComplianceTab token | Low | None | Single find_replace |
| 2.1 | Support auth (data fix) | Low | Very Low | Unlink user |
| 2.2 | DashboardHeader prop | Medium | None | Revert 2 files |
| 2.3 | ProfileAndPayoutTab | Medium | None | Revert 1 file |
| 2.4 | VideoDetail refactor | Medium | None | Revert 1 file |
| 2.5 | Closeout split default | Medium | None | Revert 1 function |
| 2.6 | Remove debug panel | Low | None | Revert 1 file |
| 3.1 | Dual auth functions | High | None | Revert each function |
| 3.2 | Publish validation unify | High | None | Restore inline copies |
| 3.4 | Session hook | Med-High | None | Remove hook |
| 3.5 | Earnings migration | Very High | **YES — live earnings** | Revert to dual-read |
| 4.x | Code/entity cleanup | Varies | Potential | Restore from audit |

---

## ITEMS EXPLICITLY NOT IN THIS ROADMAP
The following were identified in the audit but are deliberately excluded pending further discussion:

| Item | Reason not included |
|------|-------------------|
| Delete `performerLogin` + `PerformerSession` | Active production system with live sessions |
| Delete `PerformerEarning` entity | Contains live financial data |
| Delete `monthlyCloseoutService` | Active admin workflow |
| Delete `performerFinanceService` | Active admin workflow |
| Merge `EarningsTab` components | Need to confirm which is canonical first |
| Change `performerLogin` to use Base44 auth | Architecture decision, not a bug fix |
| Remove `VideosTab` admin stub | Should be implemented, not removed |
| Change `GuestProductionApplication.performer_id` storage | High migration risk |
| News/CMS admin page | Marked as "Coming Soon" — out of scope |
| Payment provider integration changes | Separate workstream |

---

*End of Implementation Roadmap*  
*This document is for planning purposes only. No code has been changed.*