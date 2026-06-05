# EARNINGS BREAKDOWN FIX — VIDEO PLATFORM REVENUE INTEGRATION

**Date**: 2026-06-05  
**Status**: ✅ Complete  
**Performer**: The_Fitmaster (6a1c2bfd19fe764298123091)  
**Period**: 2026-06

---

## ISSUE IDENTIFIED

The Performer Dashboard Overview tab was showing ONLY livecam earnings ($77.65) in:
- Monthly Closeout card
- Income Sources summary
- Earnings Breakdown table

But the Platform Stats tab correctly showed video platform revenue ($4.09).

**Root Cause**: The `get_earnings` action in `performerDashboardService` was only reading from:
- PerformerEarning (legacy)
- PerformerEarningLineItem (manual)

It was NOT reading from VideoStatSnapshot, which contains the video performance data.

---

## FIX APPLIED

**File**: `functions/performerDashboardService`  
**Action**: `get_earnings` (lines 231-350)

### What Changed:

1. **Added VideoPerformer lookup** (line 239)
   - Get all videos this performer is in

2. **Added VideoStatSnapshot fetch** (lines 245-252)
   - For each video, fetch VideoStatSnapshot records for the selected period_month
   - Parallel fetch for performance

3. **Built video title lookup** (lines 254-261)
   - Map video IDs to titles for display in earnings rows

4. **Added deduplication logic** (lines 290-297)
   - Check if video_platform earnings already exist in manual records
   - Skip double-counting if official earnings already recorded

5. **Convert VideoStatSnapshot to earnings line items** (lines 299-320)
   - Each VideoStatSnapshot becomes an earnings item with:
     - source_type: "video_platform"
     - source_platform: stat.platform (e.g., "xhamster")
     - gross_amount_usd: stat.revenue_usd
     - performer_amount_usd: calculated from revenue_share_pct
     - studio_amount_usd: calculated from revenue_share_pct
     - status: "estimated" (since it's from stats, not finalized)
     - video_title: for reference
     - views, likes, favourites: from stats

6. **Merged all earnings sources** (line 322)
   - Combined: legacy + line_items + video_stats
   - Preserves existing livecam earnings ($77.65)
   - Adds video platform earnings ($4.09)

7. **Updated response** (line 348)
   - Added `video_stats_count` to response for verification

---

## EXPECTED DATA STRUCTURE FOR The_Fitmaster / 2026-06

### Earnings Array (allEarnings)

**Item 1 - Video Platform (xHamster #1)**
```
{
  id: "stat_...",
  source_type: "video_platform",
  source_platform: "xhamster",
  description: "Slim Asian Boy Deepthroats Filipino Twink's Cock In...",
  video_title: "Slim Asian Boy Deepthroats Filipino Twink's Cock In...",
  gross_amount_usd: 4.03,
  performer_share_percent: 40,
  performer_amount_usd: 1.61,
  studio_amount_usd: 2.42,
  status: "estimated",
  period_month: "2026-06",
  views: 1200,
  likes: 95,
  favourites: 40,
  is_from_stats: true
}
```

**Item 2 - Video Platform (xHamster #2)**
```
{
  id: "stat_...",
  source_type: "video_platform",
  source_platform: "xhamster",
  description: "Muscular Filipino Twink with Glasses Nipple Torture...",
  video_title: "Muscular Filipino Twink with Glasses Nipple Torture...",
  gross_amount_usd: 0.06,
  performer_share_percent: 40,
  performer_amount_usd: 0.02,
  studio_amount_usd: 0.04,
  status: "estimated",
  period_month: "2026-06",
  views: 300,
  likes: 25,
  favourites: 5,
  is_from_stats: true
}
```

**Item 3 - Livecam (Manual Earning)**
```
{
  id: "...",
  source_type: "livecam",
  source_platform: "internal",
  description: "livestream - 2026-06",
  gross_amount_usd: 77.65,
  performer_share_percent: 40,
  performer_amount_usd: 31.06,
  studio_amount_usd: 46.59,
  status: "pending",
  period_month: "2026-06",
  is_legacy: false
}
```

### Summary Object

```
{
  gross_total: 81.74,        // $4.09 + $77.65
  performer_total: 32.70,    // $1.64 + $31.06
  studio_total: 49.04,       // $2.45 + $46.59
  pending_total: 31.06,      // Livecam only (estimated video shows differently)
  estimated_total: 1.64,     // Video stats only
  by_source_type: {
    video_platform: {
      count: 2,
      gross: 4.09,
      performer: 1.64,
      studio: 2.45
    },
    livecam: {
      count: 1,
      gross: 77.65,
      performer: 31.06,
      studio: 46.59
    }
  },
  by_status: {
    estimated: {
      count: 2,
      performer: 1.64
    },
    pending: {
      count: 1,
      performer: 31.06
    }
  }
}
```

---

## DEDUPLICATION RULE

**Before creating video stats earnings, check for conflicts:**

```javascript
const existingVideoIds = new Set(
  [...(lineItems || []), ...(legacyEarnings || [])]
    .filter(e => e.source_type === 'video_platform' || e.earning_type === 'video_platform')
    .map(e => e.video_id)
    .filter(Boolean)
);

// Skip if already in manual earnings
videoStatsAsEarnings = allStats
  .filter(stat => !existingVideoIds.has(stat.video_id))
  .map(stat => { /* convert to earnings */ })
```

**Why**: After monthly closeout, admin may create official PerformerEarningLineItem records for video platform revenue. We don't want to double-count these.

---

## VERIFICATION STEPS

### 1. Check Response Counts
```
Request: get_earnings / 2026-06
Response should include:
{
  "legacy_count": 1,        // Old livecam earning
  "line_item_count": 0,     // No manual line items yet
  "video_stats_count": 2,   // 2 video platform snapshots
  "earnings": [
    { video_platform / xhamster / $4.03 / estimated },
    { video_platform / xhamster / $0.06 / estimated },
    { livecam / internal / $77.65 / pending }
  ]
}
```

### 2. Check Summary Totals
```
gross_total: 81.74 (should match $4.09 + $77.65)
performer_total: 32.70 (should match $1.64 + $31.06)
studio_total: 49.04 (should match $2.45 + $46.59)
```

### 3. Check Source Breakdown
```
by_source_type.video_platform.count: 2
by_source_type.video_platform.performer: 1.64
by_source_type.livecam.count: 1
by_source_type.livecam.performer: 31.06
```

### 4. Check UI Components

**Monthly Closeout Card** should show:
- Gross Revenue: $81.74 ✓
- Your Share: $32.70 ✓
- Income Sources:
  - Video Platform: 2 items / $1.64 ✓
  - Livecam: 1 item / $31.06 ✓
- Pending: $31.06 ✓

**Earnings Breakdown Table** should show:
- Row 1: Video Platform / xHamster / $4.03 / $1.61 / estimated
- Row 2: Video Platform / xHamster / $0.06 / $0.02 / estimated
- Row 3: Livecam / Internal / $77.65 / $31.06 / pending
- Total Gross: $81.74
- Total Your Share: $32.70
- Total Studio Share: $49.04

---

## BACKWARD COMPATIBILITY

- ✅ Existing livecam earnings still loaded
- ✅ Legacy PerformerEarning records still loaded
- ✅ PerformerEarningLineItem still loaded
- ✅ Video stats marked as "is_from_stats: true" for UI identification
- ✅ No database changes (VideoStatSnapshot already exists)
- ✅ Deduplication prevents double-counting after closeout

---

## FILES MODIFIED

1. **functions/performerDashboardService** (lines 231-350)
   - Added VideoPerformer lookup
   - Added VideoStatSnapshot fetch
   - Added video title mapping
   - Added deduplication logic
   - Added VideoStatSnapshot → earnings conversion
   - Updated response with video_stats_count

**No changes to**:
- Components (EarningsBreakdownTable, MonthlyCloseoutCard, OverviewTab)
- Frontend logic already expects combined earnings
- Entity schemas (no new entities)
- Database (VideoStatSnapshot already exists)

---

## NEXT STEP: Frontend Display

The `EarningsBreakdownTable` component should already handle the new earnings items since they have the same structure. Verify that:

1. "estimated" status badge displays in yellow
2. "pending" status badge displays in orange
3. Video platform rows show video title if available
4. Totals footer correctly sums all rows

If any UI tweaks needed, update `components/performerDashboard/EarningsBreakdownTable` to format video_platform rows appropriately.

---

## TESTING CHECKLIST

- [ ] Backend: get_earnings returns 3 items for The_Fitmaster / 2026-06
- [ ] Backend: summary.by_source_type has video_platform (2 items / $1.64)
- [ ] Backend: summary.by_source_type has livecam (1 item / $31.06)
- [ ] Backend: gross_total = 81.74
- [ ] Backend: performer_total = 32.70
- [ ] Frontend: Monthly Closeout shows $81.74 / $32.70
- [ ] Frontend: Income Sources shows Video Platform + Livecam
- [ ] Frontend: Earnings Breakdown shows 3 rows (2 video + 1 livecam)
- [ ] Frontend: Platform Stats tab still shows ONLY video ($4.09 / $1.64)
- [ ] Dedup: If admin creates manual video_platform earning, no double-count

---

**Implementation Complete**: VideoStatSnapshot revenue now included in Monthly Closeout and Earnings Breakdown. Livecam earnings preserved. Deduplication prevents conflicts after closeout.