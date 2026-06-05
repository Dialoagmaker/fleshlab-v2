# PERFORMER PORTAL DEBUG TRACE — NO VIDEOS/STATS ISSUE

**Date**: 2026-06-05  
**Performer**: The_Fitmaster  
**Expected performer_id**: `6a1c2bfd19fe764298123091`

---

## DIAGNOSTIC FINDINGS

### 1. Performer Portal Data Flow

**Page**: `pages/performer/PerformerDashboard`  
**Tabs Component**: `components/performerDashboard/PerformerDashboardTabs`  
**My Videos Tab**: `components/performerDashboard/MyVideosTab`  
**Platform Stats Tab**: `components/performerDashboard/PlatformStatsTab`

### 2. Data Loading Chain

```
PerformerDashboard (page)
  ↓ localStorage: performer_session_token, performer_data
  ↓ performer.id from localStorage
  ↓ Calls: performerDashboardService.get_dashboard_summary
  ↓ Calls: performerDashboardService.get_career_statistics
  ↓ Passes: performer={performer, career_stats} to PerformerDashboardTabs

PerformerDashboardTabs
  ↓ Extracts: performerId = performer?.performer?.id
  ↓ Renders: MyVideosTab(performerId={performerId})
  ↓ Renders: PlatformStatsTab(performerId={performerId})

MyVideosTab
  ↓ Calls: performerDashboardService.get_videos(performer_id)
  ↓ Expects response: { success: true, videos: [...] }
  ↓ Returns: res.data.videos || []

PlatformStatsTab
  ↓ Calls: performerDashboardService.get_video_stats(performer_id, period_month)
  ↓ Expects response: { success: true, stats: [...], gross_revenue_total, ... }
  ↓ Returns: statsData?.stats || []
```

---

## POTENTIAL ROOT CAUSES

### Cause 1: Wrong performer_id in localStorage
**Symptom**: `performer?.performer?.id` is undefined or wrong value

**Check**:
```javascript
console.log('localStorage performer_data:', localStorage.getItem('performer_data'));
const performerData = JSON.parse(localStorage.getItem('performer_data'));
console.log('Performer ID:', performerData?.performer?.id);
```

**Expected**: `6a1c2bfd19fe764298123091`  
**If different**: Performer login session has wrong performer linked

---

### Cause 2: Backend get_videos returns empty array
**Symptom**: Backend returns `{ success: true, videos: [] }`

**Backend Logic** (`functions/performerDashboardService` lines 284-309):
```javascript
const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
  performer_id: myPerformer.id
});

const videos = await Promise.all(videoPerformers.map(async (vp) => {
  const video = await base44.asServiceRole.entities.Video.get(vp.video_id);
  if (!video) return null;
  return { ...video, role: vp.role };
}));

const filteredVideos = videos.filter(v => v !== null).slice(0, 50);
return Response.json({ success: true, videos: filteredVideos });
```

**Debug**:
1. Check if `VideoPerformer.filter({ performer_id: "6a1c2bfd19fe764298123091" })` returns records
2. Check if linked videos exist
3. Check if performer ID in backend matches frontend

---

### Cause 3: Backend get_video_stats filters by wrong period
**Symptom**: Stats exist but for different period_month

**Backend Logic** (lines 627-703):
```javascript
const { period_month } = body;

// Fetches VideoStatSnapshot with period_month filter
const query = { video_id: videoId };
if (period_month) query.period_month = period_month;
```

**Frontend Issue**:
```javascript
const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
// Hardcoded to current month (2026-06)
```

**Problem**: If stats exist for 2026-05 but not 2026-06, shows "No stats found"

**Fix**: Auto-select latest available period from stats

---

### Cause 4: Response shape mismatch
**Symptom**: Frontend expects array but gets object wrapper

**Expected Backend Response**:
```javascript
{
  success: true,
  videos: [{ id, title, status, ... }]
}
```

**Frontend Parsing**:
```javascript
return res.data.videos || [];
```

**Should be correct**, but adding defensive logging to verify

---

## DEBUG LOGGING ADDED

### MyVideosTab Console Logs:
```javascript
console.log('[MyVideosTab] Fetching videos for performer:', performerId);
console.log('[MyVideosTab] Raw response:', res.data);
console.log('[MyVideosTab] Normalized videos:', videosArray, 'Count:', videosArray.length);
console.log('[MyVideosTab] Render - performerId:', performerId, 'videos:', safeVideos, 'count:', safeVideos.length);
```

### Empty State Debug Info:
```jsx
<div className="text-xs text-muted-foreground space-y-1">
  <p>Performer ID: {performerId}</p>
  <p>Response keys: {videos ? Object.keys(videos).join(', ') : 'N/A'}</p>
  <p>Is Array: {Array.isArray(videos)}</p>
  <p>Error: {error?.message || 'none'}</p>
</div>
```

---

## REQUIRED VERIFICATION STEPS

### Step 1: Check localStorage performer data
Open browser console on performer portal and run:
```javascript
const performerData = JSON.parse(localStorage.getItem('performer_data'));
console.log('Performer ID:', performerData?.performer?.id);
console.log('Full performer data:', performerData);
```

**Expected**:
```javascript
{
  performer: {
    id: "6a1c2bfd19fe764298123091",
    display_name: "The_Fitmaster",
    ...
  }
}
```

**If wrong/missing**: Performer login session corrupted or not linked properly

---

### Step 2: Check backend VideoPerformer records
Run in backend/admin context:
```javascript
const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
  performer_id: "6a1c2bfd19fe764298123091"
});
console.log('VideoPerformer records:', videoPerformers);
```

**Expected**: 3 records with video_ids

**If empty**: VideoPerformer linking is broken — need to re-link videos to performer

---

### Step 3: Check VideoStatSnapshot records
```javascript
const videoIds = ["6a231adb60c0314bd765b684", "6a22c065f551f26a8ec7567c", "6a1ca6595423410fce57dc96"];
const stats = await Promise.all(
  videoIds.map(vid => 
    base44.asServiceRole.entities.VideoStatSnapshot.filter({ video_id: vid })
  )
);
console.log('Stats for all videos:', stats.flat());
```

**Expected**: Stats for at least some video_ids

**If empty**: No platform stats imported for this performer's videos

---

### Step 4: Check period_month values in stats
```javascript
const allStats = stats.flat();
const periods = [...new Set(allStats.map(s => s.period_month))].sort().reverse();
console.log('Available periods:', periods);
```

**Expected**: e.g., `["2026-06", "2026-05", "2026-04"]`

**If different from selectedMonth**: Frontend needs to auto-select latest available

---

## IMMEDIATE FIXES TO IMPLEMENT

### Fix 1: Auto-select latest available period in PlatformStatsTab

**Current**:
```javascript
const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
```

**Problem**: Hardcoded to current month (2026-06), but stats might exist for different months

**Fix**:
```javascript
const { data: statsData } = useQuery({...});
const availablePeriods = [...new Set((statsData?.stats || []).map(s => s.period_month).filter(Boolean))].sort().reverse();
const [selectedMonth, setSelectedMonth] = useState(availablePeriods[0] || new Date().toISOString().slice(0, 7));
```

---

### Fix 2: Ensure performer_id is correctly extracted

**Current**:
```javascript
const performerId = performer?.performer?.id;
```

**Check structure**:
```javascript
console.log('Performer prop:', performer);
// Could be:
// Option A: { performer: { id: "..." }, career_stats: {...} }
// Option B: { id: "...", career_stats: {...} }
```

**Defensive fix**:
```javascript
const performerId = performer?.performer?.id || performer?.id;
```

---

### Fix 3: Backend get_videos defensive logging

Add to backend function:
```javascript
console.log('[get_videos] performer_id:', myPerformer.id);
console.log('[get_videos] VideoPerformer records:', videoPerformers.length);
console.log('[get_videos] Video IDs:', videoPerformers.map(vp => vp.video_id));
```

---

## EXPECTED VS ACTIAL

### Expected (from Phase A audit):
- `VideoPerformer.filter({ performer_id: "6a1c2bfd19fe764298123091" })` → 3 records
- `get_videos` → 3 videos
- `get_video_stats` → 2 stats for June 2026
- Frontend displays: 3 videos, 2 stats

### Actual (from user report):
- My Videos tab: "No videos found"
- Platform Stats tab: "No platform stats found for 2026-06"

### Discrepancy:
Either:
1. Frontend using wrong performer_id
2. Backend returning empty arrays
3. Frontend not parsing response correctly
4. Data deleted/changed since Phase A audit

---

## NEXT STEPS

1. **Open browser console** on performer portal
2. **Check localStorage** performer data
3. **Check console logs** from MyVideosTab debug logging
4. **Verify performer_id** matches expected `6a1c2bfd19fe764298123091`
5. **If performer_id wrong**: Fix performer login/session
6. **If performer_id correct but videos empty**: Check VideoPerformer entity records
7. **If VideoPerformer empty**: Re-link videos to performer
8. **If stats exist for wrong period**: Implement auto-select latest period

---

## FILES CHANGED FOR DEBUGGING

1. **components/performerDashboard/MyVideosTab** — Added console logging and debug info display
2. **components/performerDashboard/PlatformStatsTab** — Will add period auto-selection

---

**Deliverable**: Console logs showing actual performer_id, response shapes, and array lengths to identify exact failure point in the data flow.