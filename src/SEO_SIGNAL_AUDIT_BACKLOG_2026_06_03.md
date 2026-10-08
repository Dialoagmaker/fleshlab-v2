# SEO Signal Audit Backlog
**Audit Date:** 2026-06-03  
**Data Sources:** GA4 (Property ID: `GA4_PROPERTY_ID`), GSC (Site: `GSC_SITE_URL`)  
**Audit Period:** Last 28 days (2026-05-06 to 2026-06-03)  
**Status:** Backlog — No implementation yet

---

## 1. IMMEDIATE TECHNICAL FIXES

### 1.1 Ghost/Admin/Protected Routes Receiving GA4 Traffic

**Problem:** Admin-only and ghost routes are appearing in GA4 reports, indicating they may be indexed or publicly accessible.

| Path | GA4 Views (7d) | Classification | Risk Level |
|---|---|---|---|
| `/AdminSmartThumbnails` | 118 | Ghost Route | 🔴 HIGH |
| `/AuthGateway` | 83 | Auth/Protected | 🔴 HIGH |
| `/PerformerVideoStats` | 78 | Legacy/Protected | 🔴 HIGH |
| `/AdminVideos` | 44 | Admin Route | 🔴 HIGH |
| `/AdminApplications` | 36 | Admin Route | 🔴 HIGH |
| `/AdminPerformers` | 30 | Admin Route | 🔴 HIGH |
| `/SEOAuditPhase1Report` | 28 | Ghost Route | 🔴 HIGH |
| `/AdminSEOReport` | 14 | Admin Route | 🔴 HIGH |

### 1.2 Required Actions

#### A. Add to GhostRoute GHOST_PATHS Array
**File:** `App.jsx` (line ~298)

**Status:** ✅ **DONE** — Added `/AdminSEOReport` and `/AdminPerformers` to GHOST_PATHS array

**Paths now blocked:**
```javascript
const GHOST_PATHS = [
  '/AdminSmartThumbnails',
  '/AuthGateway',
  '/PerformerVideoStats',
  '/AdminVideos',
  '/AdminApplications',
  '/PerformerDashboard',
  '/SEOAuditPhase1Report',
  '/AdminSEOReport',
  '/AdminPerformers',
];
```

**Priority:** 🔴 **Blocker** — Should be fixed before indexing request

#### B. Verify Admin Route Protection
**Status:** ✅ **VERIFIED** — All `/admin/*` routes have:
- `<ProtectedRoute>` wrapper (line 124-162)
- `<AdminGuard>` wrapper (line 125)
- Return 403 for non-admin users (AdminGuard checks `user.role === "admin"`)

**Files verified:**
- `App.jsx` — admin route definitions (lines 124-162)
- `components/AdminGuard.jsx` — role check logic (line 14)
- `components/ProtectedRoute.jsx` — auth check logic (lines 27-32)

**Priority:** ✅ **Complete** — No action needed

#### C. GSC Index Inspection
**Use function:** `seoGscInspectUrl`

**URLs to inspect:**
1. `https://fleshlab.online/AdminSmartThumbnails`
2. `https://fleshlab.online/AuthGateway`
3. `https://fleshlab.online/PerformerVideoStats`
4. `https://fleshlab.online/AdminSEOReport`
5. `https://fleshlab.online/AdminPerformers`

**Action:** If any return `indexed: true`, request removal via GSC Removal Tool

**Priority:** 🔴 **Blocker** — Must deindex before public launch

**Pending:** Manual GSC inspection required

---

## 2. SEO OPPORTUNITIES TO HANDLE LATER

### 2.1 High-Value Pages (Current Performance)

| Page | GA4 Views (7d) | GSC Clicks | GSC Position | Opportunity |
|---|---|---|---|---|
| `/` (Homepage) | 398 | 17 | 2.5 | ✅ Strong — maintain |
| `/asian-gay-twink` | 12 | 3 | 5.2 | 🎯 Optimize — page 2, could reach top 3 |
| `/jameson-official` | 17 | 2 | 3.5 | ✅ Good performer traction |
| `/Filipino-Male-Performers` | 10 | — | — | 🎯 Expand — SEA keyword demand |
| `/guest-productions` | — | 1 | 5.2 | 🎯 Build content — recruitment intent |
| `/BecomePerformer` | 24 | — | — | ✅ Strong recruitment funnel |

### 2.2 Keyword Opportunities (GSC Queries)

| Query | Clicks | Impressions | Position | Action |
|---|---|---|---|---|
| "asian gay twink" | 3 | 25 | 5.2 | Optimize `/asian-gay-twink` page |
| "gay performer recruitment" | 1 | 11 | 8.6 | Create recruitment content |
| "fleshlab" (branded) | 17 | 96 | 2.5 | Maintain homepage authority |
| "filipino gay performer" | — | — | — | Create targeted content |
| "asian gay studio" | — | — | — | Build topical authority |

### 2.3 Legacy V1 Paths (Redirect Traffic)

| Path | GA4 Views (7d) | Issue | Status |
|---|---|---|---|
| `/VideoDetail` | 179 | V1 redirect with query param | ✅ Already redirects, add `noindex` |
| `/ArticleReader` | 97 | V1 redirect | ✅ Already redirects, add `noindex` |
| `/ActorDetail` | 41 | V1 redirect | ✅ Already redirects, add `noindex` |
| `/Videos` (capital V) | 94 | V1 static redirect | ✅ Already redirects, add canonical |
| `/Actors` | 27 | V1 static redirect | ✅ Already redirects, add canonical |
| `/NewsCenter` | 38 | V1 static redirect | ✅ Already redirects, add canonical |
| `/BecomePerformer` | 24 | V1 camelCase | ✅ Already redirects to `/become-performer` |
| `/HowItWorks` | — | V1 camelCase | ✅ Already redirects |

**Action:** These are handled by App.jsx redirects, but should receive:
- `rel="canonical"` to V2 URLs
- `noindex` meta tags (GhostRoute component)

---

## 3. RECOMMENDED FUTURE ARTICLES

**Priority 1: Filipino/SEA Performer Content**
1. **"5 Rising Filipino Gay Performers Changing Asian Adult Entertainment"**
   - Target Keywords: "filipino gay performer", "pinoy twink", "asian gay talent"
   - Internal Links: 5 performer pages, `/performers`, `/fanclub`
   - Why: `/Filipino-Male-Performers` getting 10 views/week — expand into full article

**Priority 2: Recruitment/Guest Production**
2. **"How to Become a Gay Adult Performer in the Philippines: Complete Guide"**
   - Target Keywords: "gay performer recruitment", "filipino adult creator"
   - Internal Links: `/guest-production`, `/become-performer`, `/faq`
   - Why: "gay performer recruitment" ranking 8.6 — opportunity to improve

**Priority 3: Asian Gay Content Authority**
3. **"Why Asian Gay Content is Dominating: 2026 Studio Trends"**
   - Target Keywords: "asian gay content", "asian adult studio"
   - Internal Links: `/videos`, `/how-it-works`, `/news` (related)
   - Why: `/asian-gay-twink` ranking 5.2 — build topical authority

**Priority 4: Performer Spotlight (SEO Asset)**
4. **"Jameson: From First Scene to Studio Regular — Performer Journey"**
   - Target Keywords: "jameson performer", "fleshlab jameson"
   - Internal Links: `/performers/jameson-official`, 3 video pages
   - Why: `/jameson-official` getting 17 views/week — capitalize on interest

**Priority 5: Fanclub/Monetization**
5. **"Gay Fanclub Guide: How Fans Support Asian Adult Creators Directly"**
   - Target Keywords: "gay fanclub", "creator subscription"
   - Internal Links: `/fanclub`, 3 performer pages, `/videos`
   - Why: Existing article getting 10 views — update/expand with fresh angle

**Status:** ⏸️ **DO NOT IMPLEMENT YET** — Content creation on hold

---

## 4. LATER ANALYTICS IMPROVEMENT

### 4.1 Extend seoGa4TopPages for Geo Data

**Current limitation:** Function only returns `pagePath` dimension, not country/city breakdown.

**Proposed enhancement:**
```javascript
dimensions: [
  { name: 'pagePath' },
  { name: 'country' },
  { name: 'city' }
]
```

**Target geo tracking:**
- Philippines (Manila, Cebu, Davao)
- Singapore
- Hong Kong
- Malaysia (Kuala Lumpur)
- Taiwan (Taipei)
- Thailand (Bangkok)
- Vietnam (Ho Chi Minh City, Hanoi)

**Benefits:**
- Better SEA traffic segmentation
- Identify high-value performer recruitment regions
- Optimize content for specific markets

**Status:** ⏸️ **Backlog** — Not blocking launch

---

## 5. DO NOT IMPLEMENT (Explicit Holds)

### 5.1 Article Creation
**Status:** ⏸️ **ON HOLD** — Do not create news articles yet

**Reason:** Awaiting Base44 cache/pre-render issue resolution on `/videos/:slug`

### 5.2 /videos/:slug Changes
**Status:** ⏸️ **FROZEN** — Do not touch video detail pages

**Reason:** Base44 cache/pre-render issue open — risk of breaking existing functionality

### 5.3 Automatic Indexing Requests
**Status:** ⏸️ **MANUAL ONLY** — Do not use Google Indexing API

**Reason:** Manual GSC submission required for quality control

---

## 6. COMPLETED ACTIONS

## 6. COMPLETED ACTIONS (2026-06-03)

### 6.1 Ghost Route Protection
**Date:** 2026-06-03  
**Action:** Added `/AdminSEOReport` and `/AdminPerformers` to GHOST_PATHS array + explicit Routes  
**Files Changed:** `App.jsx` (lines 298-302, 332-340)  
**Status:** ✅ **COMPLETE**

**Before:**
```javascript
const GHOST_PATHS = [
  '/AdminSmartThumbnails', '/AuthGateway', '/PerformerVideoStats',
  '/AdminVideos', '/AdminApplications', '/PerformerDashboard',
  '/SEOAuditPhase1Report',
];
```

**After:**
```javascript
const GHOST_PATHS = [
  '/AdminSmartThumbnails', '/AuthGateway', '/PerformerVideoStats',
  '/AdminVideos', '/AdminApplications', '/PerformerDashboard',
  '/SEOAuditPhase1Report', '/AdminSEOReport', '/AdminPerformers',
];
```

**Explicit Routes Added (lines 338-340):**
```javascript
<Route path="/AdminSEOReport" element={<GhostRoute />} />
<Route path="/AdminPerformers" element={<GhostRoute />} />
```

### 6.2 Admin Route Verification
**Date:** 2026-06-03  
**Action:** Verified all `/admin/*` routes use ProtectedRoute + AdminGuard  
**Files Verified:**
- `App.jsx` (lines 124-162) — ProtectedRoute + AdminGuard wrappers
- `components/AdminGuard.jsx` (line 14) — `user.role === "admin"` check
- `components/ProtectedRoute.jsx` (lines 27-32) — Auth check + redirect

**Status:** ✅ **COMPLETE** — No changes needed, already secure

### 6.3 GSC Index Inspection
**Date:** 2026-06-03  
**Action:** Inspected 5 ghost/admin paths via `seoGscInspectUrl`  
**URLs Inspected:**
1. `https://fleshlab.online/AdminSmartThumbnails` — ✅ **NOT INDEXED**
2. `https://fleshlab.online/AuthGateway` — ✅ **NOT INDEXED**
3. `https://fleshlab.online/PerformerVideoStats` — ✅ **NOT INDEXED**
4. `https://fleshlab.online/AdminSEOReport` — ✅ **NOT INDEXED**
5. `https://fleshlab.online/AdminPerformers` — ✅ **NOT INDEXED**

**Result:** All 5 paths show "URL is unknown to Google" — no GSC removal requests needed  
**Status:** ✅ **COMPLETE** — No action required

---

## 7. PENDING ACTIONS

### 7.1 Legacy Route Noindex
**Priority:** 🟡 **Important**  
**Action:** Add `noindex` meta tags to legacy redirect routes:
- `/VideoDetail` (LegacyVideoRedirect)
- `/ArticleReader` (LegacyArticleRedirect)
- `/ActorDetail` (LegacyActorRedirect)
- `/Videos` (static redirect)
- `/Actors` (static redirect)
- `/NewsCenter` (static redirect)

**Status:** ⏳ **PENDING** — Can be done post-launch

### 7.2 Legacy Route Noindex
**Priority:** 🟡 **Important**  
**Action:** Add `noindex` meta tags to:
- `/VideoDetail` (LegacyVideoRedirect)
- `/ArticleReader` (LegacyArticleRedirect)
- `/ActorDetail` (LegacyActorRedirect)
- `/Videos` (static redirect)
- `/Actors` (static redirect)
- `/NewsCenter` (static redirect)

**Status:** ⏳ **PENDING** — Can be done post-launch

---

## 8. LAUNCH READINESS STATUS

| Category | Status | Notes |
|---|---|---|
| Ghost route protection | ✅ **COMPLETE** | GHOST_PATHS updated + explicit routes added |
| Admin route security | ✅ **COMPLETE** | ProtectedRoute + AdminGuard verified |
| GSC deindexing | ✅ **COMPLETE** | All 5 paths inspected — NOT INDEXED |
| Content creation | ⏸️ **ON HOLD** | Awaiting cache fix |
| Video detail pages | ⏸️ **FROZEN** | Base44 cache issue |
| Legacy route cleanup | 🟡 **BACKLOG** | Post-launch optimization |

**Overall Status:** ✅ **TECHNICAL FIXES COMPLETE** — Content work on hold

---

## 9. NEXT STEPS

1. **Post-Launch (Week 1-2):**
   - [ ] Add `noindex` to legacy redirect routes (`/VideoDetail`, `/ArticleReader`, `/ActorDetail`, etc.)
   - [ ] Extend `seoGa4TopPages` with geo dimensions (country, city)
   - [ ] Monitor GSC for indexing issues
   - [ ] Monitor GA4 for ghost route traffic (should drop to zero)

2. **Content (Week 3-4):**
   - [ ] Create Filipino performer article (#1 priority)
   - [ ] Create recruitment guide (#2 priority)
   - [ ] Monitor GSC query performance

3. **Analytics Enhancement:**
   - [ ] Add country/city dimensions to GA4 reports
   - [ ] Track SEA geo performance (PH, SG, HK, MY, TW, TH, VN)

---

**Last Updated:** 2026-06-03  
**Next Review:** After GSC inspection completed