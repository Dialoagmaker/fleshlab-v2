# FLESHLAB — PHASE 1B VISUAL REDESIGN SPECIFICATION
## Complete Homepage Reimagining (Design Only — No Implementation)

**Status:** PENDING APPROVAL
**Date:** 2026-06-02
**Version:** 3.0 — Conceptual Reset

---

## EXECUTIVE DIRECTIVE

**This document is a VISUAL DESIGN SPECIFICATION ONLY.**

**NO CODE WILL BE WRITTEN UNTIL THIS SPECIFICATION IS APPROVED.**

**Current homepage direction is REJECTED.** It maintains the same fundamental structure:
- Header + Hero + Grid + Grid + Grid + CTA + Footer
- Standard card layouts
- Stacked section rhythm
- Template-based dark theme

**Required:** A homepage that looks like a completely different senior web designer created it from zero.

---

## PART 1: WHAT IS REJECTED

### Structural Rejection

The following structures are **NOT ACCEPTABLE**:

❌ **Standard Hero Section**
- Full-width background image with centered text overlay
- Two CTA buttons below headline
- 70-80vh height

❌ **Stacked Section Rhythm**
- Section 1: Latest Videos (grid of 8 cards)
- Section 2: Featured Performers (grid of 8 cards)
- Section 3: News (grid of 3 cards)
- Section 4: Membership CTA (centered text + buttons)

❌ **Standard Card Grids**
- Uniform rectangular cards in rows
- Thumbnail + title + metadata
- Hover effects with scale/border

❌ **Standard Navigation**
- Sticky header with logo left, nav right
- Secondary nav bar below
- Hamburger menu on mobile

❌ **Standard Footer**
- Multi-column links
- Social icons
- Copyright bar

### Visual Rejection

The following visual treatments are **NOT ACCEPTABLE**:

❌ Black background (#0A0A0A) with rose accent (#E11D48) only
❌ Generic sans-serif typography (Inter, system fonts)
❌ Standard border-radius (4-8px on all cards)
❌ Uniform spacing (py-20, px-4 everywhere)
❌ Template-style gradients (top-to-bottom fade)
❌ Stock photo hero images

### Conceptual Rejection

The following concepts are **NOT ACCEPTABLE**:

❌ "Landing page" feel
❌ "Streaming service" layout (Netflix, Hulu clone)
❌ "E-commerce grid" (products in rows)
❌ "Blog homepage" (articles in cards)
❌ "Template-based" aesthetic

---

## PART 2: WHAT IS REQUIRED

### Fundamental Shift

**From:** Website homepage with sections
**To:** Immersive experience with journey

**From:** Content grid for browsing
**To:** Curated archive for discovery

**From:** Public landing page
**To:** Private studio entrance

### Design Principles

1. **Cinematic** — Feels like entering a film archive or private screening room
2. **Exclusive** — Gated, members-only atmosphere (even for public visitors)
3. **Editorial** — Magazine-quality layout, not template grid
4. **Asymmetric** — Varied compositions, not uniform rows
5. **Layered** — Depth through parallax, blur, overlap (not flat cards)
6. **Minimal** — Fewer elements, more impact (not cluttered)
7. **Intentional** — Every element has purpose (no decoration)

---

## PART 3: SELECTED DIRECTION — STUDIO VAULT INTERFACE

**Chosen Concept:** Option A (Studio Vault Interface)

**Rationale:**
- Most differentiated from current site
- Strongest emotional hook (exclusivity, mystery)
- Best alignment with brand positioning (private studio, not public tube site)
- clearest visual metaphor (vault = archive = premium content)

---

## PART 4: VISUAL SPECIFICATION

### A. ABOVE-THE-FOLD LAYOUT (Desktop)

**Viewport Composition:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  [Wordmark]                                                  │
│  (top-left, minimal)                                         │
│                                                               │
│                                                               │
│           [FULLSCREEN CINEMATIC BACKGROUND]                   │
│           (video loop or hero image)                          │
│           with dark overlay (60% opacity)                     │
│                                                               │
│                                                               │
│              ENTER THE VAULT                                  │
│              [Primary CTA Button]                             │
│              (centered, minimal)                              │
│                                                               │
│                                                               │
│                                          [Menu Icon]          │
│                                          (top-right)          │
│                                                               │
│              [Subtle scroll indicator]                        │
│              (bottom-center, animated)                        │
│                                                               │
└─────────────────────────────────────────────────────────────┐
```

**Key Differences from Current:**

| Current | New (Vault) |
|---------|-------------|
| Header bar with logo + nav | No header bar, logo alone |
| Hero section (70vh) | Full viewport (100vh) |
| Two CTA buttons | Single CTA ("Enter") |
| Visible navigation | Hidden behind menu icon |
| Content visible immediately | Content revealed after entry |
| Standard background image | Cinematic video loop |

### B. ABOVE-THE-FOLD LAYOUT (Mobile)

```
┌─────────────────────┐
│                     │
│  [Wordmark]         │
│                     │
│                     │
│   [CINEMATIC        │
│    BACKGROUND]      │
│                     │
│                     │
│   ENTER THE         │
│   VAULT             │
│   [CTA Button]      │
│                     │
│            [Menu]   │
│                     │
│        [▼]          │
│                     │
└─────────────────────┘
```

**Mobile Adaptations:**
- Wordmark: 100px width (vs 140px desktop)
- CTA: Full width with padding
- Menu: Hamburger icon (same)
- Background: Still fills viewport
- Text: Slightly smaller (responsive)

### C. LOGO / WORDMARK DIRECTION

**Current Logo:**
- Red square with white "F"
- "FLESHLAB" text next to it
- Bold, blocky appearance

**New Wordmark Direction:**

**Option 1: Minimal Wordmark (Recommended)**
```
FLESHLAB
```
- Font: Thin or Light weight sans-serif
- Color: Pure white (#FFFFFF)
- Size: 140px width, 24px height (desktop)
- Letter spacing: +50 tracking (elegant, spread)
- No icon, no background box
- Position: Top-left, 40px from edges

**Option 2: Monogram Seal**
```
   ┌─────┐
   │  F  │
   └─────┘
   FLESHLAB
```
- Circular or shield emblem
- Embossed/debossed effect
- Metallic finish (subtle gradient)
- Wordmark below (smaller)
- Position: Top-center or top-left

**Option 3: Abstract Symbol**
```
   ◆  FLESHLAB
```
- Geometric shape (not literal)
- Minimal line art
- Rose accent color (only use of color in entry)
- Wordmark to the right

**Recommended:** Option 1 (Minimal Wordmark)
- Most premium feel
- Least "template" appearance
- Easiest to implement cleanly
- Most differentiated from current

### D. HEADER BEHAVIOR

**Current:**
- Sticky header bar (64px height)
- Logo left, nav links center, CTA right
- Becomes solid on scroll
- Always visible

**New (Vault):**

**State 1: Entry Screen (Before Scroll)**
```
- No header bar
- Wordmark alone (top-left)
- Menu icon (top-right, hamburger)
- No background color
- Transparent, blends with background
```

**State 2: After Entry (On Scroll)**
```
- Minimal header appears (48px height)
- Wordmark remains (smaller: 100px width)
- Progress indicator (thin line, shows scroll position)
- Backdrop blur (glassmorphism, subtle)
- Border appears (1px, white/5%)
```

**State 3: Mobile Menu (On Click)**
```
- Full-screen overlay (not dropdown)
- Dark background (#0A0A0A, 98% opacity)
- Large navigation links (48px height each)
- Generous spacing (24px between links)
- Close icon (top-right, X)
- Fade-in animation (300ms)
```

**Menu Links:**
```
VIDEOS
PERFORMERS
STUDIO JOURNAL
BECOME A PERFORMER
FANCLUB
─────
LOGIN
CREATE ACCOUNT
```

### E. BACKGROUND VISUAL TREATMENT

**Entry Screen Background:**

**Option A: Video Loop (Recommended)**
- 15-30 second loop
- Abstract studio aesthetic (not explicit)
- Slow motion, cinematic movement
- Examples:
  - Light playing on textured surface
  - Fabric or curtain movement
  - Smoke or fog drift
  - Water ripples
  - Film grain overlay
- Treatment:
  - Dark overlay (#0A0A0A, 60% opacity)
  - Slight blur (for text readability)
  - Muted saturation (not vibrant)
  - Loop seamlessly (no jarring cuts)

**Option B: Hero Image**
- Single cinematic photograph
- Abstract or atmospheric (not literal)
- Examples:
  - Studio interior (moody lighting)
  - Architectural detail
  - Textured surface (concrete, fabric)
  - Shadow play
- Treatment:
  - Dark gradient overlay (top to bottom)
  - Vignette (edges darker)
  - Film grain (subtle)
  - No faces or identifiable people (avoids dating)

**Recommended:** Option A (Video Loop)
- More immersive
- More premium feel
- More differentiated from current
- Better engagement (movement draws eye)

**Technical Requirements:**
- Format: MP4 (H.264 codec)
- Resolution: 1920x1080 (desktop), 720x1280 (mobile)
- File size: <5MB (optimized for web)
- Autoplay: Muted, loop, playsinline
- Fallback: Static image if video fails

### F. CONTENT REVEAL (After Entry)

**Entry Interaction:**
1. User clicks "ENTER THE VAULT"
2. Wordmark and CTA fade out (300ms)
3. Background transitions (500ms)
4. Content sections fade in sequentially (staggered 100ms delay)
5. Menu icon remains (now opens navigation)

**Post-Entry Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Wordmark]                                    [Menu Icon]  │
│  ─────────────────────────────────────────────────────────  │
│  (thin progress line shows scroll position)                 │
│                                                               │
│  ════════════════════════════════════════════════════════   │
│  STUDIO DROPS                                                 │
│  (horizontal scroll rail, not vertical grid)                  │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│  ════════════════════════════════════════════════════════   │
│  PREVIEW WALL                                                 │
│  (thumbnail strip, image-only, hover reveals title)           │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│  ════════════════════════════════════════════════════════   │
│  PERFORMER WORLDS                                             │
│  (2x2 immersive panels, full-bleed images)                    │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│  ════════════════════════════════════════════════════════   │
│  STUDIO JOURNAL                                               │
│  (editorial layout: 1 large + 2 small articles)               │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│  ════════════════════════════════════════════════════════   │
│  MEMBERSHIP                                                   │
│  (centered, minimal, gradient background)                     │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│  ─────────────────────────────────────────────────────────    │
│  FOOTER (minimal: logo, copyright, legal, social)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### G. STUDIO DROPS SECTION (Horizontal Rail)

**Current:** Vertical grid of 8 video cards

**New:** Horizontal scroll rail with varied tile sizes

**Layout:**
```
STUDIO DROPS                              [→ Scroll →]

┌──────────┐  ┌──────────┐  ┌──────────────────────┐
│          │  │          │  │                      │
│          │  │          │  │                      │
│          │  │          │  │                      │
│  Square  │  │  Square  │  │       Wide           │
│  Tile 1  │  │  Tile 2  │  │       Tile 3         │
│          │  │          │  │                      │
│          │  │          │  │                      │
│          │  │          │  │                      │
└──────────┘  └──────────┘  └──────────────────────┘

┌──────────┐  ┌──────────┐  ┌──────────────────────┐
│  Square  │  │  Square  │  │       Wide           │
│  Tile 4  │  │  Tile 5  │  │       Tile 6         │
└──────────┘  └──────────┘  └──────────────────────┘
```

**Tile Composition:**

**Square Tile (1:1 aspect):**
- Full-bleed image (thumbnail)
- Gradient overlay (bottom 30%)
- Title (white, bottom-left, 2 lines max)
- Duration badge (top-right, minimal)
- Access tier icon (bottom-right, subtle)
- No visible border (border appears on hover)

**Wide Tile (2:1 aspect):**
- Full-bleed image (thumbnail)
- Gradient overlay (bottom 40%)
- Title (white, larger, bottom-left)
- Duration badge (top-right)
- "Featured" badge (top-left, rose accent)
- Description (1 line, below title, smaller)
- CTA link ("Watch" → appears on hover)

**Interaction:**
- Drag to scroll (mouse or touch)
- Arrow buttons on hover (desktop only)
- Snap to tile (not free scroll)
- Infinite loop (optional, or show end indicator)
- Hover: Scale 1.03, border appears (rose-500/30)

**Data Strategy:**
- Source: `getPublicVideos()` first 6 videos
- Prioritize: Featured videos first
- Fallback: If <6 videos, show available + curated "Coming Soon" tiles
- Never: Show "No drops available" empty state

### H. PREVIEW WALL SECTION (Thumbnail Strip)

**Current:** Not present (part of video grid)

**New:** Single row of 10 minimal thumbnails

**Layout:**
```
PREVIEW WALL

[thumb] [thumb] [thumb] [thumb] [thumb]
[thumb] [thumb] [thumb] [thumb] [thumb]

(Hover reveals: title + duration)
```

**Tile Composition:**
- Aspect ratio: 16:9
- Size: 200px width (desktop), 120px (mobile)
- Gap: 8px between tiles
- Image: Thumbnail (lazy loaded)
- Default state: Image only (no text)
- Hover state:
  - Overlay appears (dark gradient)
  - Title fades in (white, 1 line)
  - Duration badge appears (bottom-right)
  - Scale: 1.05

**Data Strategy:**
- Source: `getPublicVideos()` videos 7-16
- Purpose: Quick visual browsing (not detailed info)
- Fallback: Hide section entirely if <10 videos total
- Never: Show empty rail with placeholders

### I. PERFORMER WORLDS SECTION (Immersive Panels)

**Current:** Grid of 8 performer cards (uniform, 3:4 aspect)

**New:** 2x2 grid of full-bleed immersive panels

**Layout:**
```
PERFORMER WORLDS

┌──────────────────────┬──────────────────────┐
│                      │                      │
│                      │                      │
│   Performer 1        │   Performer 2        │
│   (full image)       │   (full image)       │
│   overlay text       │   overlay text       │
│                      │                      │
├──────────────────────┼──────────────────────┤
│                      │                      │
│                      │                      │
│   Performer 3        │   Performer 4        │
│   (full image)       │   (full image)       │
│   overlay text       │   overlay text       │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

**Panel Composition:**
- Full viewport width (no side margins)
- Height: 60vh per panel (desktop), 50vh (mobile)
- Image: Performer cover image (full bleed, object-cover)
- Overlay: Gradient (bottom 50%, dark to transparent)
- Text:
  - Name (large, white, bottom-left)
  - Video count (smaller, below name)
  - "Explore" CTA (rose accent, appears on hover)
  - Fanclub badge (top-right, if enabled)

**Interaction:**
- Hover: Image scales 1.05, text becomes more visible
- Click: Navigate to `/performers/:slug`
- Mobile: Tap to navigate (no hover state)

**Data Strategy:**
- Source: `getPublicPerformers()` first 4 featured performers
- Fallback: If <4 featured, use any performers
- Fallback 2: If no performers, hide section entirely
- Never: Show empty panels with "No performers" text

### J. STUDIO JOURNAL SECTION (Editorial Layout)

**Current:** Grid of 3 news cards (uniform)

**New:** Asymmetric editorial layout (1 large + 2 small)

**Layout:**
```
STUDIO JOURNAL                              View All →

┌────────────────────────┬──────────┬──────────┐
│                        │          │          │
│                        │  Article │  Article │
│                        │    2     │    3     │
│    Lead Article        │          │          │
│    (large)             │          │          │
│                        │          │          │
│                        │          │          │
│                        │          │          │
└────────────────────────┴──────────┴──────────┘
```

**Lead Article (50% width):**
- Full-bleed cover image
- Gradient overlay (bottom 40%)
- Title (large, white, 3 lines max)
- Excerpt (smaller, 2 lines, below title)
- Date (small, top-left)
- Category badge (top-right, e.g., "News", "Behind-the-Scenes")
- "Read Story" CTA (appears on hover)

**Secondary Articles (25% width each):**
- Cover image (smaller)
- Gradient overlay (bottom 30%)
- Title (2 lines max)
- Date (small, top-left)
- No excerpt (title only)

**Data Strategy:**
- Source: `getPublicNews()` first 3 articles
- Fallback: Hide section if no articles
- Never: Show empty cards or "No stories" placeholders

### K. MEMBERSHIP SECTION (Conversion)

**Current:** Centered text + two buttons (standard CTA box)

**New:** Minimal, gradient background, value-focused

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                    JOIN THE VAULT                             │
│                                                               │
│              ─────────────────────────                        │
│                                                               │
│         ✓  Full archive access                               │
│         ✓  Exclusive behind-the-scenes                        │
│         ✓  Early release notifications                        │
│         ✓  Direct performer support                           │
│                                                               │
│              [CREATE FREE ACCOUNT]                            │
│                                                               │
│              Already a member? Sign in →                      │
│                                                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Visual Treatment:**
- Background: Gradient (rose-950/20 at center, fade to #0A0A0A at edges)
- Title: 48px, white, bold
- Divider: Thin line (rose-500/30, 200px width)
- Value props: 18px, white/80, checkmark icons (rose)
- CTA: Solid rose button (48px height, 320px width)
- Secondary link: Text-only (white/60, hover: white)

**Data Strategy:**
- No data dependency (static content)
- Always visible (no fallback needed)

### L. FOOTER (Minimal)

**Current:** Multi-column links, social icons, copyright

**New:** Minimal, compliance-focused

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  FLESHLAB                                                     │
│                                                               │
│  © 2026 FLESHLAB Studio. All rights reserved.                │
│                                                               │
│  18+ Only. All performers verified.                           │
│                                                               │
│  [Terms]  [Privacy]  [2257]  [Contact]                        │
│                                                               │
│  [Twitter]  [Instagram]  [Email]                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Visual Treatment:**
- Background: #050505 (darker than page)
- Padding: 64px vertical (generous)
- Wordmark: White, 120px width
- Text: 14px, white/40
- Links: 14px, white/60 (hover: white)
- Social icons: Minimal line icons (white/60)

---

## PART 5: ANIMATION & INTERACTION SPECIFICATION

### Entry Animation Sequence

**Timeline:**
```
0ms:    User clicks "ENTER THE VAULT"
100ms:  Wordmark starts fade out
200ms:  CTA button starts fade out
300ms:  Wordmark and CTA fully faded
400ms:  Background transition starts
500ms:  Header appears (minimal state)
600ms:  Studio Drops section fades in
700ms:  Preview Wall section fades in
800ms:  Performer Worlds section fades in
900ms:  Studio Journal section fades in
1000ms: Membership section fades in
1100ms: Animation complete
```

**Easing:**
- Fade out: `cubic-bezier(0.4, 0, 1, 1)` (ease-out)
- Fade in: `cubic-bezier(0, 0, 0.2, 1)` (ease-in)
- Background transition: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)

### Scroll Animations

**Section Reveals:**
- Trigger: Section enters viewport (20% visible)
- Animation: Fade up (20px → 0px, opacity 0 → 1)
- Duration: 500ms
- Easing: `cubic-bezier(0, 0, 0.2, 1)`

**Parallax Effects:**
- Background images: Move at 50% scroll speed
- Text overlays: Move at 80% scroll speed
- Foreground elements: Normal scroll (100%)

### Hover Animations

**Cards/Panels:**
- Scale: 1.00 → 1.03 (3% increase)
- Duration: 500ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Border: opacity 0 → 1 (rose-500/30)

**Buttons:**
- Background: rose-600 → rose-700
- Duration: 200ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

**Links:**
- Color: white/60 → white
- Underline: none → 1px solid
- Duration: 200ms

---

## PART 6: DATA STRATEGY & FALLBACK LOGIC

### Critical Requirement: NO EMPTY STATES

**Problem to Solve:**
Current implementation shows "No drops available" on homepage even when videos exist in database.

**Root Cause:**
- Data fetching returns empty array
- No fallback logic to use available videos
- Placeholder UI is ugly (gray boxes with text)

**Solution:**
Every section must have robust fallback logic that:
1. Uses available data from public functions
2. Shows curated content (not empty placeholders)
3. Hides gracefully if truly no content (adjusts spacing)
4. Never shows "No content available" messages on homepage

### Data Sources (All Existing Functions)

| Section | Data Source | Fields Used |
|---------|-------------|-------------|
| Studio Drops | `getPublicVideos()` | videos[0-6], cover_image_url, title, duration |
| Preview Wall | `getPublicVideos()` | videos[7-16], primary_thumbnail_url, title |
| Performer Worlds | `getPublicPerformers()` | performers[0-4], cover_image_url, display_name |
| Studio Journal | `getPublicNews()` | articles[0-3], cover_image_url, title, excerpt |
| Membership | Static (no data) | N/A |

### Fallback Logic (By Section)

#### Studio Drops
```javascript
const videos = data?.videos || [];

if (videos.length >= 6) {
  // Show first 6 videos (prioritize featured)
  const featured = videos.filter(v => v.featured);
  const drops = featured.length >= 6 ? featured.slice(0, 6) : videos.slice(0, 6);
  return <StudioDropsRail videos={drops} />;
} else if (videos.length > 0) {
  // Show available videos + curated "Coming Soon" tiles
  return <StudioDropsRail videos={videos} showComingSoon={true} />;
} else {
  // Hide section entirely (do NOT show empty state)
  return null;
}
```

#### Preview Wall
```javascript
const videos = data?.videos || [];

if (videos.length >= 10) {
  // Show videos 7-16 (after Studio Drops)
  return <PreviewWall videos={videos.slice(6, 16)} />;
} else if (videos.length > 6) {
  // Show remaining videos (fewer than 10)
  return <PreviewWall videos={videos.slice(6)} />;
} else {
  // Hide section entirely (do NOT show empty rail)
  return null;
}
```

#### Performer Worlds
```javascript
const performers = data?.performers || [];

if (performers.length >= 4) {
  // Show first 4 featured performers
  const featured = performers.filter(p => p.featured);
  const worlds = featured.length >= 4 ? featured.slice(0, 4) : performers.slice(0, 4);
  return <PerformerWorldsGrid performers={worlds} />;
} else if (performers.length > 0) {
  // Show available performers (fewer than 4)
  return <PerformerWorldsGrid performers={performers} />;
} else {
  // Hide section entirely (do NOT show empty panels)
  return null;
}
```

#### Studio Journal
```javascript
const articles = data?.articles || [];

if (articles.length >= 3) {
  // Show first 3 articles
  return <StudioJournalPreview articles={articles.slice(0, 3)} />;
} else if (articles.length > 0) {
  // Show available articles (fewer than 3)
  return <StudioJournalPreview articles={articles} />;
} else {
  // Hide section entirely (do NOT show empty cards)
  return null;
}
```

### URL Validation (Critical for Production Safety)

**Before rendering any image URL:**
```javascript
import { isPublicImageUrl } from '@/lib/seoValidation';

// For each image
const imageUrl = video.cover_image_url;
const isValid = isPublicImageUrl(imageUrl);

if (isValid) {
  return <img src={imageUrl} alt="..." />;
} else {
  // Fallback: gradient placeholder (NOT gray box)
  return <div className="bg-gradient-to-br from-rose-900/20 to-[#111]" />;
}
```

**Never Expose:**
- `source_video_url` (full video)
- R2 private bucket keys
- Internal CDN paths
- Unvalidated external URLs

### Caching Strategy

**sessionStorage:**
```javascript
// Cache key format
const cacheKey = `publicVideos_page_1_limit_24`;
const cacheTTL = 60 * 1000; // 60 seconds

// Check cache before fetching
const cached = sessionStorage.getItem(cacheKey);
if (cached) {
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < cacheTTL) {
    return data; // Use cached data
  }
}

// Fetch and cache
const data = await fetchPublicVideos();
sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
```

**React Query:**
```javascript
{
  queryKey: ['public-videos-fn'],
  queryFn: () => callPublicFunction('getPublicVideos'),
  retry: 0, // Fail fast, use fallback
  staleTime: 30000, // 30 seconds
  cacheTime: 300000, // 5 minutes
}
```

---

## PART 7: PRODUCTION SAFETY REQUIREMENTS

### Absolute Requirements (Non-Negotiable)

#### 1. No Black Screen on Load
- Page structure renders immediately
- Skeleton loaders during data fetch
- Content fades in as it loads
- Never wait for all data to show page

#### 2. No Empty Homepage Sections
- Every section has fallback logic (see Part 6)
- Fallbacks are visually designed (gradient placeholders, not gray boxes)
- Sections hide gracefully if no content (adjust spacing)
- Never show "No content available" or "Coming soon" on homepage

#### 3. No Broken Logo/Wordmark
- Wordmark always visible (never transparent by accident)
- Test on light and dark backgrounds
- SVG or text (not image that can 404)
- Minimum contrast ratio: 7:1 (WCAG AAA)

#### 4. No Direct Entity Calls
- All data through public functions ONLY
- `getPublicVideos()`, `getPublicPerformers()`, `getPublicNews()`
- No `base44.entities.Video.list()` from frontend
- No `await base44.auth.me()` on public pages

#### 5. No Private Data Exposure
- Only use: `trailer_url`, `preview_gif_url`, `primary_thumbnail_url`, `cover_image_url`
- Never use: `source_video_url`, `r2_key`, private CDN paths
- Validate all URLs with `isPublicImageUrl()` before rendering

#### 6. No Broken Routes
- Test all navigation links:
  - `/videos` → Working
  - `/performers` → Working
  - `/news` → Working
  - `/become-performer` → Working
  - `/fanclub` → Working (or hidden if not ready)
- 404 page styled consistently (not browser default)

#### 7. No Console Errors
- All promise rejections handled
- Optional chaining for nested data (`data?.videos`)
- Validate data before accessing properties
- Graceful degradation on API failures

#### 8. Performance Budget
- First Contentful Paint: <2.5s
- Largest Contentful Paint: <3.0s
- Time to Interactive: <4.0s
- Total page weight: <3MB
- Video background: <5MB (optimized)

### Rollback Plan

**If Phase 1B Fails:**

1. **Revert Files:**
   - `pages/Home.jsx` → Previous stable version
   - Remove new components (or keep isolated in `/components/vault/`)

2. **Keep:**
   - Phase 1A SEO system (all files)
   - `seoValidation.js`, `seoKeywords.js`, `seoTemplates.js`
   - `SEOMeta.jsx` component
   - Backend functions (unchanged)
   - Other public pages (`/videos`, `/news`, `/performers`)

3. **Test:**
   - Homepage loads with data
   - All navigation works
   - No console errors
   - Mobile responsive

---

## PART 8: ACCEPTANCE CRITERIA

### Visual Quality (Must Pass All)

- [ ] First screen looks completely different from current site
- [ ] Logo/wordmark does not resemble current logo
- [ ] No standard hero section (full viewport cinematic entry)
- [ ] No stacked grid sections (horizontal rails, immersive panels)
- [ ] No uniform card layouts (varied tile sizes, asymmetric)
- [ ] No template-based dark theme (custom color treatment)
- [ ] Looks like premium, custom-designed site (not Base44 template)
- [ ] Professional, production-ready polish

### Technical Quality (Must Pass All)

- [ ] Zero console errors
- [ ] All data loads correctly (or hides gracefully)
- [ ] Fallbacks work as designed (no empty states)
- [ ] Performance meets budget (<3s load time)
- [ ] Mobile responsive (tested on iPhone, Android)
- [ ] All navigation links work
- [ ] No broken images or URLs

### User Experience (Must Pass All)

- [ ] Clear entry point ("Enter the Vault")
- [ ] Intuitive navigation (menu icon obvious)
- [ ] Compelling visual storytelling (cinematic background)
- [ ] Strong conversion path (membership section)
- [ ] No confusion about what site is or offers
- [ ] Fast, smooth interactions (no lag)

### Production Safety (Must Pass All)

- [ ] No black screen on load
- [ ] No empty sections with "No content"
- [ ] No broken logo/wordmark
- [ ] No direct entity calls
- [ ] No User.me() dependency
- [ ] No private video URLs exposed
- [ ] No broken public routes
- [ ] Rollback plan tested and ready

---

## PART 9: IMPLEMENTATION CHECKLIST

### Pre-Implementation (Before Any Code)

- [ ] This visual specification approved
- [ ] Moodboard references confirmed (cinematic, editorial, exclusive)
- [ ] Color palette finalized (beyond black + rose)
- [ ] Typography choices confirmed (fonts selected)
- [ ] Layout wireframes approved (desktop + mobile)
- [ ] Animation timing approved (entry sequence, hover effects)
- [ ] Fallback content written (for all sections)
- [ ] Data strategy validated (against existing functions)
- [ ] Video background asset created or sourced
- [ ] Wordmark designed (SVG or text treatment)

### Implementation Phase 1: Foundation

- [ ] Create wordmark component (minimal, elegant)
- [ ] Create menu overlay component (full-screen, minimal)
- [ ] Create entry screen component (fullscreen, cinematic)
- [ ] Create progress indicator component (scroll tracking)
- [ ] Set up animation framework (Framer Motion or CSS)

### Implementation Phase 2: Content Sections

- [ ] Studio Drops (horizontal rail, varied tiles)
- [ ] Preview Wall (thumbnail strip, hover reveals)
- [ ] Performer Worlds (2x2 immersive panels)
- [ ] Studio Journal (editorial layout, asymmetric)
- [ ] Membership (minimal, gradient, value-focused)
- [ ] Footer (compliance-focused, minimal)

### Implementation Phase 3: Data Integration

- [ ] Integrate `getPublicVideos()` with fallbacks
- [ ] Integrate `getPublicPerformers()` with fallbacks
- [ ] Integrate `getPublicNews()` with fallbacks
- [ ] Implement URL validation (all images)
- [ ] Implement caching (sessionStorage + React Query)
- [ ] Test all fallback scenarios

### Implementation Phase 4: Polish & Testing

- [ ] Animation timing refinement
- [ ] Mobile responsive testing (all sections)
- [ ] Performance optimization (lazy loading, image compression)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Accessibility audit (contrast, keyboard nav, screen reader)
- [ ] Production safety checklist (all items pass)

### Pre-Deployment

- [ ] Homepage loads with data (or graceful fallbacks)
- [ ] All navigation links tested
- [ ] Wordmark visible on all backgrounds
- [ ] No empty "No content" placeholders
- [ ] SEO meta tags present and correct
- [ ] Analytics tracking functional
- [ ] Rollback plan tested (revert and redeploy)

---

## PART 10: QUESTIONS FOR APPROVAL

**Before implementation begins, please confirm:**

1. **Visual Direction:** Is the Studio Vault Interface concept aligned with the premium studio brand positioning?

2. **Entry Experience:** Is the fullscreen cinematic entry with "Enter the Vault" CTA the right emotional hook?

3. **Content Layout:** Are the horizontal rail (Studio Drops), thumbnail strip (Preview Wall), and immersive panels (Performer Worlds) sufficiently different from current grid layouts?

4. **Logo/Wordmark:** Is the minimal wordmark direction (Option 1) preferred over monogram seal or abstract symbol?

5. **Video Background:** Is the abstract video loop (non-explicit, atmospheric) the right choice for the entry screen?

6. **Fallback Logic:** Is hiding sections (when no data) preferred over showing "Coming soon" placeholders?

7. **Animation Style:** Is the slow, cinematic animation timing (500-1000ms) appropriate, or should it be faster?

8. **Production Safety:** Are all production safety requirements clear and acceptable?

9. **Rollback Plan:** Is the rollback plan (revert to stable homepage) acceptable if this direction fails?

10. **Approval to Proceed:** Upon approval of this specification, may implementation begin?

---

**END OF VISUAL DESIGN SPECIFICATION**

**Document Status:** PENDING APPROVAL
**Next Step:** User review and approval of visual direction
**After Approval:** Implementation begins (Phase 2: Foundation)