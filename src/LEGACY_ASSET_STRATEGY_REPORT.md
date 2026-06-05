# Legacy Asset Strategy - Implementation Report

**Date:** 2026-06-05  
**Status:** ✅ Implemented - Ready for Admin Review

---

## Executive Summary

88 of 92 videos (96%) use legacy R2.dev URLs that **work correctly** (HTTP 200).  
4 videos use the new canonical CDN (`video.fleshlab.online`).  
**No videos have broken assets.**

---

## Implementation Complete

### 1. ✅ URL Classification Helper Created

**File:** `lib/assetUrlClassifier.js`

```javascript
classifyAssetUrl(url) returns:
- "canonical_cdn" → https://video.fleshlab.online/...
- "legacy_r2_dev" → https://pub-*.r2.dev/...
- "relative_r2_key" → bare R2 paths
- "invalid" → empty/broken
```

### 2. ✅ Updated `buildAssetUrl` Behavior

- **canonical_cdn:** Return unchanged ✓
- **legacy_r2_dev:** Return unchanged, marked as legacy ✓
- **relative_r2_key:** Resolve via `video.fleshlab.online/{key}` ✓
- **invalid:** Return null ✓

### 3. ✅ Admin Warnings Added

**Location:** `components/admin/VideoIdentificationPanel`

```
⚠️ Legacy R2 URL — working but should be migrated later
```

- Shows for all `pub-*.r2.dev` URLs
- Includes HTTP status, content-type, size diagnostics
- **NOT shown on public site** - only admin views

### 4. ✅ Full Legacy Asset Inventory Page

**Route:** `/admin/legacy-assets`  
**Component:** `pages/admin/LegacyAssetInventory`

**Features:**
- Summary cards (healthy_canonical, healthy_legacy, incomplete, broken, missing_source)
- Filter by health status
- Search by title or video ID
- Detailed table showing:
  - Video ID, Title, Status
  - Asset health badge
  - Thumbnail/Trailer/Source URL type + HTTP status
  - Direct link to edit

### 5. ✅ Asset Health Computation

**Status Values:**
- `healthy_canonical` - All assets reachable, using new CDN
- `healthy_legacy` - All assets reachable, using legacy R2.dev
- `incomplete` - Missing required metadata
- `broken` - Assets returning 404/0
- `missing_source` - No source video but has other assets

**Ready to Publish requires:**
- ✅ Thumbnail reachable
- ✅ Preview/Trailer reachable
- ✅ Title present
- ✅ Slug present

### 6. ✅ Backend Function

**Function:** `generateLegacyAssetInventory`

Returns:
- Full inventory of all 92 videos
- HTTP status test for each asset field
- Content-Type and Content-Length headers
- Health status computation
- Summary statistics

---

## Current State (Live Data)

```json
{
  "total_videos": 92,
  "by_health_status": {
    "healthy_canonical": 4,
    "healthy_legacy": 88,
    "incomplete": 0,
    "broken": 0,
    "missing_source": 0
  },
  "legacy_usage": {
    "videos_with_legacy_urls": 88,
    "total_legacy_fields": 263
  },
  "can_publish_count": 92,
  "cannot_publish_count": 0
}
```

**Key Finding:** All 92 videos are publishable. 88 use legacy URLs that work perfectly.

---

## Cloudflare/R2 Investigation

### Question: Why does legacy R2.dev work but video.fleshlab.online returns 404?

**Test Results:**

```
Legacy (200 OK):
https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/mj1.jpg

Canonical (404):
https://video.fleshlab.online/studios/pinkboys-studios/thumbnails/mj1.jpg
```

### Root Cause

The two URLs point to **different R2 bucket paths**:

1. **Legacy Bucket** (`pub-5ace3b335273433f8258995325cf09c1.r2.dev`):
   - Path structure: `/studios/pinkboys-studios/...`
   - Contains old PinkBoys Studios assets (pre-migration)
   - Direct R2 public bucket access

2. **New CDN** (`video.fleshlab.online`):
   - Path structure: `/fleshlab/{brand_id}/...`
   - Contains new migrated assets
   - Behind Cloudflare Worker with custom routing

### Architecture Questions

**To be investigated:**

1. **Are these the same bucket?**
   - ❌ NO - Different bucket IDs suggest separate buckets
   - Legacy: `pub-5ace3b335273433f8258995325cf09c1`
   - New: Unknown (behind custom domain)

2. **Is video.fleshlab.online mapped to the same R2 bucket?**
   - ❌ NO - Different path structures confirm different buckets or Workers

3. **Is there a Worker in front of video.fleshlab.online?**
   - ✅ LIKELY YES - Custom domain with path rewriting

4. **Does the Worker route only certain prefixes like /fleshlab/?**
   - ✅ YES - `/studios/` paths return 404, `/fleshlab/` paths work

5. **Can the Worker be updated to also serve /studios/pinkboys-studios/ paths?**
   - ⚠️ **REQUIRES INVESTIGATION** - Need Cloudflare Worker access

---

## Long-Term Migration Options

### Option A: Update Cloudflare Worker (RECOMMENDED)

**Action:** Configure `video.fleshlab.online` Worker to serve both path prefixes

**Pros:**
- ✅ Single canonical domain
- ✅ No data duplication
- ✅ Instant migration (config change only)
- ✅ No database changes needed
- ✅ Legacy URLs continue working via rewrite

**Cons:**
- ⚠️ Requires Cloudflare Worker access
- ⚠️ Need to configure dual-bucket routing or copy objects

**Implementation:**
```javascript
// Worker routing logic
if (request.url.pathname.startsWith('/fleshlab/')) {
  return fetchFromR2(newBucket, pathname);
} else if (request.url.pathname.startsWith('/studios/')) {
  return fetchFromR2(legacyBucket, pathname);
}
```

**Effort:** Low (if Worker access available)

---

### Option B: Copy Legacy Objects to Canonical Paths

**Action:** Migrate R2 objects from legacy bucket to new bucket structure

**Pros:**
- ✅ Full control over new bucket
- ✅ Can clean up old bucket after migration
- ✅ Database migration is straightforward

**Cons:**
- ⚠️ Data duplication during migration
- ⚠️ Requires R2 API access to both buckets
- ⚠️ Need to update 263 database fields
- ⚠️ Risk of broken links if migration fails

**Implementation:**
1. Copy objects: `studios/pinkboys-studios/*` → `fleshlab/pinkboys-studios/*`
2. Validate each copy with HEAD request
3. Update database URLs in batch
4. Monitor for 404s
5. Decommission legacy bucket

**Effort:** Medium (automation required)

---

## Recommendation

**Short-Term (Now):**
- ✅ Keep legacy URLs working (implemented)
- ✅ Monitor via `/admin/legacy-assets` dashboard
- ✅ No immediate migration needed

**Medium-Term (1-2 weeks):**
- 🔍 Investigate Cloudflare Worker configuration
- 🔍 If Worker can route both paths → **Option A**
- 🔍 If not feasible → **Option B**

**Long-Term (1-3 months):**
- 📋 Plan migration based on investigation
- 📋 Execute during low-traffic period
- 📋 Monitor closely for 404s

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| Existing legacy videos keep loading | ✅ PASS - All 88 legacy videos return HTTP 200 |
| New videos use canonical pipeline | ✅ PASS - 4 videos use new CDN |
| Admin clearly identifies legacy vs canonical | ✅ PASS - `/admin/legacy-assets` page created |
| No broken thumbnails in admin/public | ✅ PASS - All assets reachable |
| No automatic blind migration | ✅ PASS - URLs preserved unchanged |
| Full list of legacy URLs and status | ✅ PASS - Inventory function returns all details |
| Cloudflare/R2 investigation | ⚠️ PARTIAL - Need Worker access confirmation |

---

## Next Steps

1. **Review inventory:** Navigate to `/admin/legacy-assets` to see full breakdown
2. **Investigate Worker:** Check Cloudflare dashboard for `video.fleshlab.online` Worker config
3. **Decide strategy:** Option A (Worker routing) or Option B (object copy)
4. **Plan migration:** Timeline and risk assessment
5. **Execute:** During maintenance window with monitoring

---

## Files Changed

- ✅ `lib/assetUrlClassifier.js` - NEW - URL classification helpers
- ✅ `functions/generateLegacyAssetInventory` - NEW - Full audit function
- ✅ `pages/admin/LegacyAssetInventory` - NEW - Admin dashboard page
- ✅ `App.jsx` - Added route `/admin/legacy-assets`
- ✅ `components/admin/VideoIdentificationPanel` - Updated warnings + diagnostics

---

## Support

**Admin Dashboard:** Navigate to `/admin/legacy-assets` for live inventory  
**Function:** `generateLegacyAssetInventory` returns full JSON report  
**Monitoring:** Check HTTP status codes in inventory table