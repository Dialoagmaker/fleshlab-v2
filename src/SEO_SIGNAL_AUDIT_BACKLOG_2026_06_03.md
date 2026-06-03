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
**File:** `App.jsx` (line ~258)

**Paths to add:**
```javascript
const GHOST_PATHS = [
  '/AdminSmartThumbnails',
  '/AuthGateway',
  '/PerformerVideoStats',
  '/SEOAuditPhase1Report',
  '/AdminSEOReport',
  // ...existing paths
];
```

**Priority:** 🔴 **Blocker** — Should be fixed before indexing request

#### B. Verify Admin Route Protection
**Check:** All `/admin/*` routes must have:
- `<ProtectedRoute>` wrapper
- `<AdminGuard>` wrapper
- Return 403 for non-admin users

**Files to verify:**
- `App.jsx` — admin route definitions
- `components/AdminGuard.jsx` — role check logic
- `components/ProtectedRoute.jsx` — auth check logic

**Priority:** 🔴 **Blocker** — Security risk if admin pages are publicly accessible

#### C. GSC Index Inspection
**Use function:** `seoGscInspectUrl`

**URLs to inspect:**
1. `https://fleshlab.online/AdminSmartThumbnails`
2. `https://fleshlab.online/AuthGateway`
3. `https://fleshlab.online/PerformerVideoStats`

**Action:** If any return `indexed: true`, request removal via GSC Removal Tool

**Priority:** 🔴 **Blocker** — Must deindex before public launch

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
| `/VideoDetail` | 179 | V1 redirect with query param | ✅ Already redirects |
| `/ArticleReader` | 97 | V1 redirect | ✅ Already redirects |
| `/ActorDetail` | 41 | V1 redirect | ✅ Already redirects |
| `/Videos` (capital V) | 94 | V1 static redirect | ✅ Already redirects |
| `/Actors` | 27 | V1 static redirect | ✅ Already redirects |
| `/NewsCenter` | 38 | V1 static redirect | ✅ Already redirects |
| `/BecomePerformer` | 24 | V1 camelCase | ✅ Already redirects |

**Action:** These are handled by App.jsx redirects — ensure they receive:
- `rel="canonical"` to V2 URLs
- `noindex` meta tags (via GhostRoute or SEOMeta)

**Priority:** 🟡 **Important** — Prevents duplicate content issues

---

## 3. RECOMMENDED FUTURE ARTICLES

### Priority 1: Filipino/SEA Performer Content
**Title:** "5 Rising Filipino Gay Performers Changing Asian Adult Entertainment"  
**Target Keywords:** "filipino gay performer", "pinoy twink", "asian gay talent"  
**Internal Links:** 5 performer pages, `/performers`, `/fanclub`  
**Why:** `/Filipino-Male-Performers` getting 10 views/week — expand into full article  
**Status:** 📝 Backlog

### Priority 2: Recruitment/Guest Production
**Title:** "How to Become a Gay Adult Performer in the Philippines: Complete Guide"  
**Target Keywords:** "gay performer recruitment", "filipino adult creator"  
**Internal Links:** `/guest-production`, `/become-performer`, `/faq`  
**Why:** "gay performer recruitment" ranking 8.6 — opportunity to improve  
**Status:** 📝 Backlog

### Priority 3: Asian Gay Content Authority
**Title:** "Why Asian Gay Content is Dominating: 2026 Studio Trends"  
**Target Keywords:** "asian gay content", "asian adult studio"  
**Internal Links:** `/videos`, `/how-it-works`, `/news`  
**Why:** `/asian-gay-twink` ranking 5.2 — build topical authority  
**Status:** 📝 Backlog

### Priority 4: Performer Spotlight (SEO Asset)
**Title:** "Jameson: From First Scene to Studio Regular — Performer Journey"  
**Target Keywords:** "jameson performer", "fleshlab jameson"  
**Internal Links:** `/performers/jameson-official`, 3 video pages  
**Why:** `/jameson-official` getting 17 views/week — capitalize on interest  
**Status:** 📝 Backlog

### Priority 5: Fanclub/Monetization
**Title:** "Gay Fanclub Guide: How Fans Support Asian Adult Creators Directly"  
**Target Keywords:** "gay fanclub", "creator subscription"  
**Internal Links:** `/fanclub`, 3 performer pages, `/videos`  
**Why:** Existing article getting 10 views — update/expand with fresh angle  
**Status:** 📝 Backlog

---

## 4. LATER ANALYTICS IMPROVEMENT

### 4.1 GA4 Geo Data Enhancement

**Current Limitation:** `seoGa4TopPages` function only returns page paths, not country/city breakdown.

**Proposed Enhancement:**
```javascript
dimensions: [
  { name: 'pagePath' },
  { name: 'country' },
  { name: 'city' }
]
```

**Goal:** Track SEA/Philippines/Singapore/Hong Kong/Malaysia/Taiwan traffic better

**Use Cases:**
- Identify top-performing content by geo
- Tailor content strategy to regional demand
- Measure recruitment campaign effectiveness by country

**Priority:** 🟢 **Nice to have** — Post-launch analytics enhancement

### 4.2 GSC Performance Tracking

**Current:** 28-day rolling window  
**Proposed:** Add custom date range selection  
**Use Case:** Compare pre/post-launch performance

**Priority:** 🟢 **Nice to have**

---

## 5. DO NOT IMPLEMENT YET

### 5.1 Article Creation
- ❌ Do NOT create any of the 5 recommended articles yet
- ❌ Do NOT start content production workflow
- **Reason:** Awaiting Base44 cache/pre-render issue resolution

### 5.2 /videos/:slug Pages
- ❌ Do NOT touch video detail pages
- ❌ Do NOT optimize video SEO
- **Reason:** Base44 cache/pre-render issue unresolved — risk of serving stale/wrong content

### 5.3 Indexing Requests
- ❌ Do NOT request indexing via Google Indexing API
- ❌ Do NOT submit sitemap to GSC automatically
- **Reason:** Technical fixes (ghost routes, admin protection) must be completed first

---

## 6. LAUNCH READINESS CHECKLIST

### Must Complete Before Indexing Request:
- [ ] Add 5 ghost paths to `GHOST_PATHS` array in `App.jsx`
- [ ] Verify all `/admin/*` routes use `ProtectedRoute` + `AdminGuard`
- [ ] Inspect 3 high-risk URLs via `seoGscInspectUrl`
- [ ] Request GSC removal for any indexed admin/ghost pages
- [ ] Confirm `noindex` on all legacy V1 redirect paths
- [ ] Complete full rubric audit (15 rubrics total)

### Optional (Post-Launch):
- [ ] Create 5 recommended SEO articles
- [ ] Enhance GA4 function with geo dimensions
- [ ] Add "Featured Brands" section to homepage
- [ ] Add "Guest Production" teaser to homepage
- [ ] Wire up search bar functionality

---

## 7. NEXT STEPS

1. **Continue rubric audits** (2-15) — identify all technical issues before indexing
2. **Fix ghost routes** — immediate security/SEO priority
3. **Resolve Base44 cache issue** — unblocks video page optimization
4. **Request indexing** — only after all technical fixes complete
5. **Create content** — after indexing request approved

---

**Document Status:** ✅ Created  
**Last Updated:** 2026-06-03  
**Owner:** SEO/Development Team  
**Review Cadence:** Weekly until launch