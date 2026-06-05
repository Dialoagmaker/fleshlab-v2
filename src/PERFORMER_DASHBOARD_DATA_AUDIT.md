# PERFORMER DASHBOARD DATA INTEGRATION AUDIT

**Audit Date**: 2026-06-05  
**Performer**: The_Fitmaster  
**Performer ID**: `6a1c2bfd19fe764298123091`  
**Performer Slug**: `the-fitmaster`  
**Status**: Active, KYC Approved  

---

## PHASE A — DATA SOURCE AUDIT

### Audit Table:

| Area | File/Function | Current Query | Identifier Used | Problem | Fix Needed |
|------|---------------|---------------|-----------------|---------|------------|
| **Overview / Career Stats** | `performerDashboardService.get_career_statistics` | VideoPerformer.filter({ performer_id }) | `performer_id` | ✅ WORKING - finds 3 videos | None |
| **My Videos Tab** | `performerDashboardService.get_videos` | VideoPerformer.filter({ performer_id }) → Video.get | `performer_id` | ⚠️ Returns videos but some are draft/null | Filter nulls, include all statuses |
| **Latest Videos** | `performerDashboardService.get_dashboard_summary` → latest_videos | VideoPerformer.filter({ performer_id }) | `performer_id` | ⚠️ Only 1 video returned (slice(0,5)) | Include all 3 videos |
| **Platform Stats** | `performerDashboardService.get_video_stats` | VideoStatSnapshot.filter({ video_id, period_month }) | `video_id` from VideoPerformer | ⚠️ Stats exist but for different video_ids | Stats exist for 2 of 3 performer videos |
| **Monthly Closeout** | `performerDashboardService.get_dashboard_summary` → earnings_summary | PerformerEarning.filter({ performer_id, period_month }) | `performer_id` | ❌ NO earnings records exist | Create earnings from stats |
| **Lifetime Revenue** | `performerDashboardService.get_career_statistics` → lifetime_revenue | PerformerEarning.filter({ performer_id }) | `performer_id` | ❌ NO earnings records exist | Calculate from VideoStatSnapshot |
| **Compliance Tab** | `performerDashboardService.get_compliance` | ComplianceRecord.filter({ performer_id }) | `performer_id` | ✅ WORKING - finds 3 records | None |
| **Contracts** | `performerDashboardService.get_compliance` | Contract.filter({ performer_id }) | `performer_id` | ✅ WORKING - finds 1 contract | None |
| **KYC Status** | Overview & Compliance | `Performer.kyc_status` | `performer_id` | ✅ CONSISTENT - both show "approved" | None |

---

## KEY IDENTIFIERS

### 1. What is the logged-in portal user ID?
**Answer**: Performer portal uses **performer session token**, not Base44 user ID.
- Session stored in `localStorage.getItem("performer_session_token")`
- Performer data stored in `localStorage.getItem("performer_data")`
- **Performer ID**: `6a1c2bfd19fe764298123091`

### 2. What is the Performer entity ID for The_Fitmaster?
**Answer**: `6a1c2bfd19fe764298123091`

### 3. What field links user to performer?
**Answer**: `Performer.user_id` (currently `NULL` for The_Fitmaster - performer uses separate login)

### 4. What field links videos to performer?
**Answer**: `VideoPerformer.performer_id` → `VideoPerformer.video_id` → `Video.id`

### 5. Why Career Statistics finds 3 videos but My Videos finds none?
**Answer**: **My Videos DOES find videos** - the backend returns them correctly. The issue is:
- Video `6a231adb60c0314bd765b684` has `status: "draft"` (broken upload we just fixed)
- Video `6a1ca6595423410fce57dc96` has `status: "published"` ✅
- Video `6a22c065f551f26a8ec7567c` status unknown (need to check)

**Root Cause**: My Videos shows "No videos found" when it should show 3 videos. The backend returns videos correctly, but the frontend might be filtering or the data isn't loading.

### 6. Which entity stores platform stats?
**Answer**: `VideoStatSnapshot`
- Fields: `video_id`, `platform`, `period_month`, `views`, `likes`, `favourites`, `revenue_usd`, `promotion_status`

### 7. Which entity stores revenue?
**Answer**: 
- **Gross platform revenue**: `VideoStatSnapshot.revenue_usd`
- **Performer earnings**: `PerformerEarning.net_amount_usd` (currently NO records exist)

### 8. Which entity stores monthly closeout?
**Answer**: `PerformerEarning` with `period_month` field (NO records exist for this performer)

### 9. Which entity stores contracts?
**Answer**: `Contract` entity
- Fields: `performer_id`, `contract_type`, `status`, `signed_at`, `document_url`

### 10. Which entity stores KYC/compliance records?
**Answer**: 
- **KYC status**: `Performer.kyc_status` (field on Performer entity)
- **Compliance documents**: `ComplianceRecord` entity
  - Fields: `performer_id`, `document_type`, `status`, `document_url`, `expires_at`

### 11. Why Overview says KYC approved but Compliance tab says KYC required?
**Answer**: **INCONSISTENCY IDENTIFIED**:
- **Overview/ComplianceSummaryCard**: Shows `performer.kyc_status = "approved"` ✅
- **ActionRequiredCard**: May show "KYC verification required" if checking different field

**Fix**: Ensure all components use `Performer.kyc_status` consistently.

### 12. Are tabs using different IDs or inconsistent filters?
**Answer**: **All tabs use the same `performer_id`** (`6a1c2bfd19fe764298123091`) - ID resolution is correct.

**Real Issues**:
1. **No PerformerEarning records** → Revenue shows $0
2. **VideoStatSnapshot exists** but not linked to earnings calculation
3. **My Videos** may have frontend rendering issue (shows empty when backend returns data)

---

## PHASE B — PERFORMER ID RESOLUTION

### Current State:

**Performer Data**:
```javascript
{
  id: "6a1c2bfd19fe764298123091",
  display_name: "The_Fitmaster",
  slug: "the-fitmaster",
  account_status: "active",
  kyc_status: "approved",
  compliance_locked: false,
  revenue_split_pct: 70.0, // ⚠️ Should be 40% per business rule
  user_id: null // Uses separate performer login
}
```

### VideoPerformer Records (3 found):

| VideoPerformer ID | Video ID | Performer ID | Lead Performer | Role |
|-------------------|----------|--------------|----------------|------|
| `6a231ea21bed03b44561c93e` | `6a231adb60c0314bd765b684` | `6a1c2bfd19fe764298123091` | ✅ YES | NULL |
| `6a22b201a9ad2cc97048970` | `6a22c065f551f26a8ec7567c` | `6a1c2bfd19fe764298123091` | ✅ YES | NULL |
| `6a1d2231398a853041db40d6` | `6a1ca6595423410fce57dc96` | `6a1c2bfd19fe764298123091` | ❌ NO | NULL |

### Videos Linked:

| Video ID | Title | Status | Published At | Duration |
|----------|-------|--------|--------------|----------|
| `6a231adb60c0314bd765b684` | Filipino Twink's Huge Cock... | `draft` | NULL | 1216s (20:16) |
| `6a22c065f551f26a8ec7567c` | (need to fetch) | Unknown | Unknown | Unknown |
| `6a1ca6595423410fce57dc96` | Heartbroken Filipino Twink... | `published` | NULL | 6s |

**Issue**: Only 1 video is published, 1 is draft, 1 status unknown.

---

## PHASE C — MY VIDEOS / LATEST VIDEOS

### Current Query (CORRECT):
```javascript
// performerDashboardService.get_videos
const videoPerformers = await VideoPerformer.filter({ performer_id });
const videos = await Promise.all(videoPerformers.map(vp => Video.get(vp.video_id)));
```

### Expected vs Actual:

**Expected**: 3 videos returned  
**Actual**: Backend returns 3 videos, but frontend may show "No videos found"

**Root Cause Investigation**:
1. Backend function returns videos correctly ✅
2. Frontend MyVideosTab calls `get_videos` action ✅
3. Frontend checks `!videos || videos.length === 0` ⚠️
4. **Possible issue**: Videos with `status: "draft"` might be filtered or not rendered

### Fix Required:

**My Videos** should show ALL videos regardless of status:
- Published videos ✅
- Draft videos ⚠️ (currently may be hidden)
- Include status badge

**Latest Videos** on Overview:
- Currently shows `latestVideos` from `get_dashboard_summary`
- Only fetches first 5 videos: `videoPerformers.slice(0, 5)`
- Should filter by `status === "published"` for "Latest" but show count for all

---

## PHASE D — PLATFORM STATS

### Current State:

**VideoStatSnapshot Records for 2026-06** (4 found):

| Snapshot ID | Video ID | Platform | Views | Revenue USD | Performer Video? |
|-------------|----------|----------|-------|-------------|------------------|
| `6a231ef7a915b5bd5f2ffcf4` | `6a231adb60c0314bd765b684` | xhamster | 1204 | $4.03 | ✅ YES (performer credited) |
| `6a230abbcde29960b6cad9db` | `6a22c065f551f26a8ec7567c` | xhamster | 601 | $0.06 | ✅ YES (performer credited) |
| `6a22b57130b5575fb9efecfb` | `6a22ae6fc793e2843243f212` | xhamster | 9125 | $0.78 | ❌ NO (not performer's video) |
| `6a229dffd930ec3905469ef2` | `6a229cf27b857678b2691799` | xhamster | 0 | $0.00 | ❌ NO (not performer's video) |

### Platform Stats Query (CORRECT):
```javascript
// performerDashboardService.get_video_stats
const videoPerformers = await VideoPerformer.filter({ performer_id });
const videoIds = [...new Set(videoPerformers.map(vp => vp.video_id))];
const snapshotSets = await Promise.all(
  videoIds.map(videoId => VideoStatSnapshot.filter({ video_id: videoId, period_month }))
);
```

### Issue:

**Platform Stats tab shows "No platform stats found"** but stats DO exist for 2 of performer's videos.

**Root Cause**: 
- Stats exist for `6a231adb60c0314bd765b684` ($4.03) and `6a22c065f551f26a8ec7567c` ($0.06)
- Total performer revenue: $4.09
- Tab might be filtering by video status or not finding video titles

### Fix Required:

1. **Include stats for ALL videos** regardless of status (draft/published)
2. **Show available periods** dynamically from stats records
3. **Calculate performer share**: $4.09 × 40% = $1.64 (not gross $4.09)

---

## PHASE E — EARNINGS / MONTHLY CLOSEOUT

### Current State:

**PerformerEarning Records**: **ZERO** ❌

```javascript
const earnings = await PerformerEarning.filter({ performer_id: "6a1c2bfd19fe764298123091" });
// Returns: []
```

### Business Rule:

**Performer payout share**: 40% of gross platform revenue  
**Studio share**: 60%

**Current Performer.revenue_split_pct**: 70% ⚠️ (INCORRECT - should be 40%)

### Expected Calculation:

For 2026-06:
- **Gross platform revenue**: $4.09 (from VideoStatSnapshot)
- **Performer share (40%)**: $1.64
- **Studio share (60%)**: $2.45

### Issue:

**No PerformerEarning records exist** → Dashboard shows $0.00 lifetime revenue

**Root Cause**: 
- Earnings are not automatically calculated from VideoStatSnapshot
- Manual entry or automated job required to create PerformerEarning records

### Fix Required:

1. **Calculate earnings from VideoStatSnapshot**:
   ```javascript
   const grossRevenue = snapshots.reduce((sum, s) => sum + (s.revenue_usd || 0), 0);
   const performerShare = grossRevenue * 0.40;
   ```

2. **Create PerformerEarning records** OR **calculate on-the-fly** from stats

3. **Display clearly**:
   - "Gross Platform Revenue: $4.09"
   - "Your Share (40%): $1.64"
   - "Studio Share (60%): $2.45"

---

## PHASE F — CONTRACTS

### Current State:

**Contract Records** (1 found):

| Contract ID | Performer ID | Type | Status | Signed At | Document URL |
|-------------|--------------|------|--------|-----------|--------------|
| `6a1ddfd537da420aab35f30b` | `6a1c2bfd19fe764298123091` | performer | `signed` | NULL | `admin/contracts/.../jay.pdf` |

### Issue:

**Compliance tab shows "No contracts on file"** but contract EXISTS.

**Root Cause**: 
- Contract exists but `signed_at` is NULL
- Frontend might be filtering by `status === "signed"` AND `signed_at !== NULL`
- Contract `verified: true` but not properly linked

### Fix Required:

1. **Show contract if status = "signed"** regardless of signed_at
2. **Display revenue split**: 60% Studio / 40% Performer
3. **Provide download link** via signed URL

---

## PHASE G — COMPLIANCE / KYC INCONSISTENCY

### Current State:

**Performer Entity**:
```javascript
{
  kyc_status: "approved",
  account_status: "active",
  compliance_locked: false
}
```

**ComplianceRecord Records** (3 found):

| Record ID | Document Type | Status | Expires At | Verification Status |
|-----------|---------------|--------|------------|---------------------|
| `6a1dde4b097bcd6e54212313` | other | valid | NULL | not_started |
| `6a1dda04afda9c058b9cf1f7` | id | valid | NULL | not_started |
| `6a1dd6c3f0f033d32881b5d9` | id | valid | 2034-09-09 | not_started |

### Issue:

**Overview says**: "KYC approved, Account active" ✅  
**Compliance tab says**: "KYC verification required" ❌

**Root Cause**:
- **ComplianceSummaryCard** uses `Performer.kyc_status` ✅
- **ComplianceTab** component might check `ComplianceRecord.verification_status` instead
- ComplianceRecords show `verification_status: "not_started"` but this is for individual documents, not overall KYC

### Fix Required:

1. **Use `Performer.kyc_status` as source of truth** for overall KYC status
2. **ComplianceRecords** are supporting documents, not the KYC status itself
3. **Show both**:
   - "KYC Status: Approved" (from Performer.kyc_status)
   - "Documents on file: 3" (from ComplianceRecord count)

---

## PHASE H — DASHBOARD CARDS

### Overview Cards Current State:

| Card | Data Source | Current Value | Expected Value | Issue |
|------|-------------|---------------|----------------|-------|
| **Career Statistics** | VideoPerformer + Video | 3 total, 3 published, 41 min | 3 total, 1 published, 1 draft | ⚠️ Counts draft as published |
| **Latest Videos** | Video (latest 3) | Shows 1 video | Should show 3 (or 1 published) | ⚠️ Only shows published |
| **Monthly Closeout** | PerformerEarning | "No earnings recorded" | Should show estimated $1.64 | ❌ No earnings records |
| **Production Goal** | Video count by month | 0 delivered | Should show 1 (June) | ⚠️ Not counting correctly |
| **Payout Readiness** | Performer fields | Eligible | Eligible (KYC approved, contract signed) | ✅ Correct |
| **Lifetime Revenue** | PerformerEarning sum | $0.00 | Should show $1.64 (40% of $4.09) | ❌ No earnings records |
| **Compliance Summary** | Performer.kyc_status | KYC approved | KYC approved | ✅ Correct |

### Fixes Required:

1. **Career Statistics**:
   - Count `status === "published"` separately from `status === "draft"`
   - Current: 3 total, 3 published ❌
   - Expected: 3 total, 1 published, 1 draft, 1 unknown ✅

2. **Monthly Closeout**:
   - Calculate from VideoStatSnapshot if no PerformerEarning exists
   - Show "Estimated earnings: $1.64 (40% of $4.09)"

3. **Lifetime Revenue**:
   - Calculate from VideoStatSnapshot: sum(revenue_usd) × 0.40
   - Label clearly: "Estimated lifetime earnings (40% share)"

4. **Production Goal**:
   - Count videos with `published_at` in current month
   - Current month (2026-06): 0 videos (none have published_at set)

---

## PHASE I — ADMIN DEBUG PANEL

### Recommended Admin Debug Panel:

**Location**: Only visible to admin users on performer dashboard

**Display**:
```javascript
{
  logged_in_user_id: "service_...",
  resolved_performer_id: "6a1c2bfd19fe764298123091",
  performer_name: "The_Fitmaster",
  performer_email: null, // No email - uses performer login
  video_performer_records: 3,
  videos_found: [
    { id: "6a231adb60c0314bd765b684", status: "draft", title: "..." },
    { id: "6a22c065f551f26a8ec7567c", status: "unknown", title: "..." },
    { id: "6a1ca6595423410fce57dc96", status: "published", title: "..." }
  ],
  stats_records_found: 2, // For performer's videos
  stats_revenue_gross: 4.09,
  performer_revenue_share_pct: 40,
  estimated_performer_earnings: 1.64,
  contracts_found: 1,
  compliance_records_found: 3,
  kyc_status: "approved",
  payout_readiness: "Eligible"
}
```

---

## PHASE J — TEST RESULTS FOR THE_FITMASTER

### Final Test Table:

| Section | Expected Data | Actual After Fix | Pass/Fail |
|---------|---------------|------------------|-----------|
| **Overview Career Stats** | 3 total, 1 published, 1 draft | 3 total, 3 published ❌ | ❌ FAIL |
| **My Videos** | 3 videos listed | Shows "No videos found" ❌ | ❌ FAIL |
| **Latest Videos** | 1-3 latest published | Shows 1 video ⚠️ | ⚠️ PARTIAL |
| **Platform Stats** | 2 stats records, $4.09 gross | Shows "No stats found" ❌ | ❌ FAIL |
| **Monthly Closeout** | Estimated $1.64 (40%) | Shows "$0.00" ❌ | ❌ FAIL |
| **Lifetime Earnings** | $1.64 (40% of $4.09) | Shows "$0.00" ❌ | ❌ FAIL |
| **Contracts** | 1 signed contract | Shows "No contracts" ❌ | ❌ FAIL |
| **KYC/Compliance** | KYC approved, 3 documents | Overview: approved ✅, Tab: varies ⚠️ | ⚠️ PARTIAL |
| **Payout Readiness** | Eligible | Shows "Eligible" ✅ | ✅ PASS |

---

## ACCEPTANCE CRITERIA STATUS:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | My Videos shows same 3 videos as Career Statistics | ❌ FAIL |
| 2 | Latest Videos not empty if published videos exist | ⚠️ PARTIAL (shows 1) |
| 3 | Platform Stats pulls stats from credited videos | ❌ FAIL |
| 4 | Earnings calculated at 40% performer share | ❌ FAIL |
| 5 | Gross platform revenue labeled separately | ⚠️ PARTIAL (labeled but shows $0) |
| 6 | Monthly Closeout shows estimated current earnings | ❌ FAIL |
| 7 | Contracts linked or missing contract flagged | ❌ FAIL |
| 8 | Compliance tab matches Overview KYC status | ⚠️ PARTIAL |
| 9 | All tabs use same resolved performer_id | ✅ PASS |
| 10 | No tab silently shows empty because of wrong ID | ❌ FAIL |

---

## RECOMMENDED FIXES PRIORITY:

### CRITICAL (Fix First):
1. **My Videos not showing videos** - Frontend rendering issue
2. **Platform Stats not finding stats** - Query or filtering issue
3. **Earnings calculation** - Calculate from VideoStatSnapshot
4. **Contract display** - Show existing contract

### HIGH (Fix Second):
5. **Career Statistics accuracy** - Count draft vs published correctly
6. **Monthly Closeout** - Show estimated earnings
7. **KYC consistency** - Use Performer.kyc_status everywhere

### MEDIUM (Fix Third):
8. **Revenue split** - Update Performer.revenue_split_pct to 40%
9. **Admin debug panel** - Add for troubleshooting
10. **Production Goal** - Fix counting logic

---

**Audit Completed**: 2026-06-05  
**Performer**: The_Fitmaster (`6a1c2bfd19fe764298123091`)  
**Status**: Multiple data integration issues identified  
**Next Step**: Implement fixes in priority order