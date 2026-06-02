# FLESHLAB STUDIO TUBE — HOMEPAGE SPECIFICATION
## Modern Tube UX for Premium Asian Gay Studio

**Status:** DESIGN SPECIFICATION (NO IMPLEMENTATION)
**Date:** 2026-06-02
**Version:** 1.0

---

## EXECUTIVE SUMMARY

**Concept:** FLESHLAB Studio Tube  
**Visual Direction:** Modern dark tube platform, NOT Pornhub clone  
**Brand Positioning:** Premium Asian gay studio with trailer-first discovery, fanclub/PPV unlocks  
**User Journey:** Search → Browse Categories → Preview Videos → Join Fanclub  
**Content Strategy:** Real videos visible immediately, search-first, category-first, dense and commercial

**Visual Inspiration (Direction, NOT Copy):**
- Modern tube platform UX principles
- Content-heavy homepage
- Strong thumbnail presentation
- Eye-catching promotional banners
- Fast, clickable, dense interface
- Commercial conversion focus
- NOT Pornhub orange/logo/exact layout
- NOT generic landing page

---

## PART 1: DESKTOP WIREFRAME (1920px width)

### Full Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          HEADER (sticky, dark, 80px height)                                 │
│  [FLESHLAB logo]  [Search Bar (prominent, center)]  [Account] [Join] [Menu]                │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Home │ Videos │ Categories ▼ │ Performers │ Fanclub │ News │ Become Performer             │
│ (main navigation row, dark, sticky)                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Latest ◆ Asian Twinks ◆ Filipino/Pinoy ◆ Solo ◆ Outdoor ◆ Shower ◆ Studio Originals ◆ ... │
│ (category/tag chips, horizontal, scrollable on mobile)                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  ┌────────────────────────────────────────┐  ┌──────────────────────┐                     │
│  │                                        │  │                      │                     │
│  │     FEATURED STUDIO BANNER (70%)       │  │  FANCLUB UNLOCK      │                     │
│  │     [Large thumbnail/still]            │  │  (30% right sidebar) │                     │
│  │                                        │  │  [Promo image]       │                     │
│  │     "Studio Original Trailer"          │  │                      │                     │
│  │     [Watch Preview] [Join Fanclub]     │  │  "Unlock Full Scene" │                     │
│  │                                        │  │  [Join Fanclub CTA]  │                     │
│  │                                        │  │                      │                     │
│  └────────────────────────────────────────┘  └──────────────────────┘                     │
│                                                                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  VIDEO GRID (4 columns, cards below)                                                        │
│                                                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                                          │
│  │ [thumb] │ │ [thumb] │ │ [thumb] │ │ [thumb] │                                          │
│  │ [title] │ │ [title] │ │ [title] │ │ [title] │                                          │
│  │ duration│ │ duration│ │ duration│ │ duration│                                          │
│  │ access  │ │ access  │ │ access  │ │ access  │                                          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                                          │
│                                                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                                          │
│  │ [thumb] │ │ [thumb] │ │ [thumb] │ │ [thumb] │                                          │
│  │ [title] │ │ [title] │ │ [title] │ │ [title] │                                          │
│  │ ...     │ │ ...     │ │ ...     │ │ ...     │                                          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                                          │
│                                                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                                          │
│  │ [thumb] │ │ [thumb] │ │ [thumb] │ │ [thumb] │                                          │
│  │ ...     │ │ ...     │ │ ...     │ │ ...     │                                          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                                          │
│                                                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                                          │
│  │ [thumb] │ │ [thumb] │ │ [thumb] │ │ [thumb] │                                          │
│  │ ...     │ │ ...     │ │ ...     │ │ ...     │                                          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                                          │
│  (24 total videos, 4 rows of 6, infinite scroll or pagination)                             │
│                                                                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  FANCLUB UNLOCK SECTION (integrated banner)                                                 │
│  "Unlock the Full FLESHLAB Archive"                                                         │
│  "Public trailers are free. Full scenes require Fanclub, PPV, or membership access."        │
│  [Join Fanclub] [Create Free Account] [Browse Previews]                                     │
│                                                                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  PERFORMER STRIP (horizontal carousel, tube-style)                                          │
│  "Featured Performers"                                                                       │
│                                                                                               │
│  [Perf 1] [Perf 2] [Perf 3] [Perf 4] [Perf 5] [Perf 6] [Perf 7] [Perf 8] [→ scroll]       │
│  [portrait] [portrait] [portrait] [portrait] [portrait] [portrait] [portrait] [portrait]    │
│  [name] [name] [name] [name] [name] [name] [name] [name]                                    │
│  [country] [country] [country] [country] [country] [country] [country] [country]           │
│  [View Perf] [View Perf] [View Perf] [View Perf] [View Perf] [View Perf] [View Perf] [...]  │
│                                                                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  STUDIO JOURNAL (compact news section)                                                      │
│  "Latest from the Studio"                                                                    │
│                                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                         │
│  │ [article thumb]  │  │ [article thumb]  │  │ [article thumb]  │                         │
│  │ Title Line 1     │  │ Title Line 1     │  │ Title Line 1     │                         │
│  │ Title Line 2     │  │ Title Line 2     │  │ Title Line 2     │                         │
│  │ Excerpt (2 ln)   │  │ Excerpt (2 ln)   │  │ Excerpt (2 ln)   │                         │
│  │ [Read More]      │  │ [Read More]      │  │ [Read More]      │                         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                         │
│                                                                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                          FOOTER (dark, multi-column)                                        │
│  [Links] [Links] [Links] [Social] [Compliance]                                             │
│  [18 USC 2257] [All performers verified 18+] [Copyright]                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 2: MOBILE WIREFRAME (375px width)

### Full Page Layout

```
┌─────────────────────────────────────┐
│  HEADER (sticky, 64px)              │
│  [Menu] [FLESHLAB] [Account]        │
├─────────────────────────────────────┤
│  [Search Bar (full width)]          │
├─────────────────────────────────────┤
│  Home | Videos | Categories | ...   │
│  (horizontal scroll, main nav)      │
├─────────────────────────────────────┤
│  Latest ◆ Asian Twinks ◆ ... ◆      │
│  (category chips, horizontal scroll)│
├─────────────────────────────────────┤
│                                     │
│  FEATURED BANNER (full width)       │
│  [Large thumbnail]                  │
│  "Studio Original Trailer"          │
│  [Watch Preview]                    │
│  [Join Fanclub]                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  VIDEO GRID (2 columns)             │
│                                     │
│  ┌──────┐ ┌──────┐                 │
│  │thumb │ │thumb │                 │
│  │title │ │title │                 │
│  │info  │ │info  │                 │
│  └──────┘ └──────┘                 │
│                                     │
│  ┌──────┐ ┌──────┐                 │
│  │thumb │ │thumb │                 │
│  │...   │ │...   │                 │
│  └──────┘ └──────┘                 │
│  (repeats, 12 visible per scroll)   │
│                                     │
├─────────────────────────────────────┤
│ FANCLUB UNLOCK BANNER (full width)  │
│ "Unlock the Full Archive"           │
│ [Join Fanclub] [Learn More]         │
├─────────────────────────────────────┤
│                                     │
│  PERFORMER STRIP (horizontal scroll)│
│                                     │
│  [perf] [perf] [perf] [→]          │
│  (3 visible, scroll for more)       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  STUDIO JOURNAL (stacked)           │
│                                     │
│  [Article 1]                        │
│  [Article 2]                        │
│  [Article 3]                        │
│  [View All Articles]                │
│                                     │
├─────────────────────────────────────┤
│  FOOTER (stacked)                   │
│  [Links]                            │
│  [Links]                            │
│  [Links]                            │
│  [Social]                           │
│  [Compliance]                       │
└─────────────────────────────────────┘
```

---

## PART 3: COMPONENT SPECIFICATIONS

### A. HEADER (Sticky, Dark, 80px Desktop / 64px Mobile)

**Desktop (1920px):**
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [FLESHLAB]        [Search Bar (500px, prominent)]        [Account] [Join] [Menu Icon]  │
│  logo left        centered search with icon               actions right                 │
│  24px from edge   text input, magnifying glass icon      gap 16px between              │
│                   placeholder: "Search videos..."         menu icon: hamburger         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Visual:**
- Background: #1a1a1a (charcoal, not pure black)
- Logo: White text "FLESHLAB" (no icon box), 140px wide
- Search bar: 500px wide, dark background (#2a2a2a), white text, rose icon
- Account button: Ghost style, white text, 12px font
- Join button: Solid rose button, white text
- Hover: Links become rose/red
- Border bottom: 1px white/10% (subtle divider)

**Mobile (375px):**
```
┌───────────────────────────────────┐
│ [≡] [FLESHLAB] [👤]              │
│  menu  logo     account/profile    │
└───────────────────────────────────┘
```

**Below Header (Mobile Only):**
```
┌───────────────────────────────────┐
│ [Search Bar (full width)]          │
│  "Search videos..."               │
└───────────────────────────────────┘
```

---

### B. MAIN NAVIGATION ROW (Sticky Below Header)

**Desktop:**
```
Home │ Videos │ Categories ▼ │ Performers │ Fanclub │ News │ Become a Performer
```

**Visual:**
- Background: #0a0a0a (darker than header)
- Text: 14px, white/80, medium weight
- Active state: Rose underline (3px), text becomes white
- Hover: White text, underline appears
- Gap between items: 24px
- Height: 48px
- Padding: 12px vertical, 24px horizontal

**Mobile:**
```
Home │ Videos │ Categories │ Performers │ ... (horizontal scroll)
```

---

### C. CATEGORY / TAG BAR (Scrollable Chips)

**Desktop:**
```
Latest ◆ Asian Twinks ◆ Filipino/Pinoy ◆ Solo ◆ Outdoor ◆ Shower ◆ Studio Originals ◆ 
Fanclub Exclusives ◆ New Performers ◆ Trending ◆ (→ scroll for more)
```

**Visual:**
- Background: #0a0a0a
- Chips: 12px font, white/70 text, 8px border-radius
- Chip background: transparent
- Chip border: 1px white/20
- Hover: Background becomes white/10, text becomes white
- Active chip: Border white/60, background white/5
- Gap between chips: 8px
- Height: 40px with padding
- Scroll: Horizontal scroll on desktop/tablet, auto-scroll on mobile
- Padding: 12px left/right

**Mobile:**
- Chips narrower
- Truncate long names
- Tap to select
- Shows 3-4 chips before scroll indicator

---

### D. FEATURED BANNER (Promo Section)

**Desktop (70% left + 30% right sidebar):**
```
┌────────────────────────────────────┬──────────────────┐
│                                    │                  │
│  [LARGE THUMBNAIL/STILL (16:9)]    │ [PERFORMER/      │
│  "Studio Original: Twink Tales"    │  FANCLUB PROMO]  │
│  "Featuring Marcus & Leo"          │ [Portrait photo] │
│  (2 lines, white text overlay)     │ "Unlock Full     │
│  [Play Preview] [Join Fanclub]     │  Scenes"         │
│  (2 buttons, white text, rose bg)  │ [Join Fanclub]   │
│                                    │                  │
└────────────────────────────────────┴──────────────────┘
```

**Visual:**
- Left side: 70% width
  - Image: Full-bleed thumbnail (16:9 aspect), high contrast
  - Overlay gradient: Dark (bottom 40%), transparent (top)
  - Title: 32px, white, bold, max 2 lines
  - Subtitle: 16px, white/80, 1 line (performers/studio)
  - Buttons: 14px, rose background, white text, 6px border-radius, gap 12px
  
- Right side: 30% width, dark background (#1a1a1a)
  - Portrait image: High quality, full-bleed
  - Text: 18px white, bold (2 lines max)
  - Button: Full width, rose background, white text
  - Padding: 16px

- Hover: Image scales 1.03 on hover
- Border: None (flat design)

**Mobile:**
```
[BANNER - FULL WIDTH, STACKED LAYOUT]
[Thumbnail]
"Studio Original Trailer"
[Play Preview]
[Join Fanclub]
"Unlock Full Scenes"
```

---

### E. VIDEO CARD (Grid Item)

**Desktop (4-column grid, 280px card width):**
```
┌────────────────┐
│                │
│  [THUMBNAIL]   │  ← 16:9 aspect
│  (hover:       │
│   play icon)   │
│                │
├────────────────┤
│ Title Line 1   │  ← 2 lines max, 14px
│ Title Line 2   │
├────────────────┤
│ [▶︎ 12:34]  ◆  │  ← duration badge, access icon
│ "Preview"      │
│ 2.3K views     │  ← optional metadata
│ Jun 2, 2026    │  ← optional date
│                │
│ [Watch Preview]│  ← button appears on hover
│ or             │
│ [Unlock Scene] │
└────────────────┘
```

**Visual:**
- Card background: Transparent
- Thumbnail: 16:9 aspect, 280px width desktop
- Border: None by default, 1px white/20 on hover
- Title: 14px, white, medium, 2 lines (text-overflow: ellipsis)
- Duration badge: 12px, white text, dark background, top-right corner
- Access icon/label: "Preview" (green), "Fanclub" (rose), "PPV" (yellow), "Exclusive" (gold)
- Metadata: 12px, white/60, optional (views, date)
- Button: Appears on hover, white text, rose background, 12px font
- Hover: Border appears, image scales 1.03, button fades in
- Transition: 300ms ease

**Mobile (2-column grid, 170px card width):**
- Same layout, proportionally smaller
- Thumbnail: 16:9 aspect
- Title: 12px font
- No button on hover (tap to navigate instead)

---

### F. PERFORMER STRIP (Carousel)

**Desktop:**
```
FEATURED PERFORMERS (section header)

[PERFORMER 1]  [PERFORMER 2]  [PERFORMER 3]  ... [→ scroll]

[Portrait]     [Portrait]     [Portrait]
[Name]         [Name]         [Name]
[Country]      [Country]      [Country]
[12 Videos]    [8 Videos]     [15 Videos]
[♡ Fanclub]    [♡ Fanclub]    [♡ Fanclub]
[View Profile] [View Profile] [View Profile]
```

**Visual:**
- Container: Full width, background #0a0a0a
- Section title: 20px, white, bold
- Card width: 160px desktop, aspect varies
- Portrait image: Full-bleed, object-cover
- Name: 16px, white, bold, centered
- Country: 12px, white/70, centered
- Video count: 12px, white/70, centered
- Fanclub badge: 12px, rose/white, centered
- Button: "View Profile", 12px, rose outline, white text, 4px border-radius
- Hover: Button background becomes rose
- Scroll: Horizontal scroll, drag-enabled, snap-to-card
- Show: 8 performers on desktop, scroll for more

**Mobile:**
- Card width: 120px
- Show: 3 performers visible, scroll for more
- Aspect: 3:4 (portrait)

---

### G. FANCLUB UNLOCK BANNER (Integrated Section)

**Desktop:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  Unlock the Full FLESHLAB Archive                                           │
│  Public trailers are free. Full scenes require Fanclub, PPV, or membership  │
│  access.                                                                     │
│                                                                               │
│  [Join Fanclub]  [Create Free Account]  [Browse Previews]                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Visual:**
- Background: Gradient (rose-950/20 fade), or solid #1a1a1a
- Padding: 40px vertical, 24px horizontal
- Heading: 24px, white, bold, centered
- Subtitle: 16px, white/70, centered, max 60 chars
- Buttons: 3 buttons, centered, gap 12px
  - Primary: Solid rose, white text
  - Secondary: Rose outline, white text
  - Tertiary: Ghost/text, rose text
- Hover: Button background/border changes on hover

**Mobile:**
```
[Banner, stacked vertically]
Heading (20px)
Subtitle (14px, 2 lines)
[Button 1] (full width)
[Button 2] (full width)
[Button 3] (full width or text link)
```

---

### H. STUDIO JOURNAL (News Section)

**Desktop (3-column grid):**
```
Latest from the Studio (section header)

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ [thumbnail]  │  │ [thumbnail]  │  │ [thumbnail]  │
│ (4:3 aspect) │  │ (4:3 aspect) │  │ (4:3 aspect) │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ Title Line 1 │  │ Title Line 1 │  │ Title Line 1 │
│ Title Line 2 │  │ Title Line 2 │  │ Title Line 2 │
│              │  │              │  │              │
│ Excerpt      │  │ Excerpt      │  │ Excerpt      │
│ (2 lines)    │  │ (2 lines)    │  │ (2 lines)    │
│              │  │              │  │              │
│ [Read More]  │  │ [Read More]  │  │ [Read More]  │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Visual:**
- Container: Full width, background #0a0a0a
- Section title: 20px, white, bold
- Card: 280px width, background #1a1a1a
- Thumbnail: 4:3 aspect, full-bleed, 280px width
- Border: 1px white/20
- Title: 16px, white, bold, 2 lines, padding 12px
- Excerpt: 13px, white/70, 2 lines, padding 0 12px
- Button: "Read More", 12px, rose text, ghost style, padding 12px
- Hover: Border becomes white/40, text becomes rose
- Transition: 300ms ease

**Mobile:**
- Stacked vertically, 1 column
- Full width cards
- Show all 3 articles, or scroll horizontally

---

## PART 4: DATA SOURCE PLAN

### Videos Section

**Data Source:** `getPublicVideos()`

**Request:**
```javascript
// No auth required
// Returns: { videos: [...], brands: [...], has_more: boolean }
const response = await callPublicFunction('getPublicVideos', {
  page: 1,
  limit: 24,
  sort: '-published_at' // Latest first
});
```

**Fields Used:**
- `id` (internal, not exposed)
- `title` (display in card)
- `slug` (for /videos/:slug link)
- `primary_thumbnail_url` (validated with isPublicImageUrl)
- `duration_seconds` (formatted as MM:SS badge)
- `access_tier` ("free", "fanclub", "ppv")
- `published_at` (optional, for date display)
- `view_count` (optional, for views)

**Never Use:**
- `source_video_url` (full video, private)
- `trailer_url` (only preview, no full video)
- `r2_key` (private storage key)
- Signed URLs
- Download URLs

**Fallback:**
- If <4 videos: Show available videos (no "Coming soon")
- If 0 videos: Hide grid, show fallback message ("New content coming soon")
- If API fails: Show cached data from sessionStorage (60s TTL)

---

### Featured Banner

**Data Source:** First video from `getPublicVideos()`

**Display:**
- Thumbnail: `primary_thumbnail_url` or `cover_image_url`
- Title: `title`
- Subtitle: Performer names (join with " & ")
- Buttons: "Watch Preview" (links to /videos/:slug) + "Join Fanclub"

**Fallback:**
- If no video: Show curated "Studio Original" banner (static image + text)
- Never show empty hero

---

### Performers Strip

**Data Source:** `getPublicPerformers()`

**Request:**
```javascript
const response = await callPublicFunction('getPublicPerformers', {
  limit: 20
});
```

**Fields Used:**
- `id`
- `display_name` (centered text)
- `slug` (for /performers/:slug link)
- `cover_image_url` or `profile_image_url` (portrait image)
- `nationality` (optional, for country display)
- `video_count` (optional, "12 Videos" display)
- `fanclub_enabled` (boolean, for fanclub badge)

**Never Use:**
- `user_id` (internal linking, private)
- Private compliance data
- Internal notes

**Fallback:**
- If <8 performers: Show available performers (shorter carousel)
- If 0 performers: Hide section (adjust spacing)

---

### Studio Journal

**Data Source:** `getPublicNews()`

**Request:**
```javascript
const response = await callPublicFunction('getPublicNews', {
  page: 1,
  limit: 3
});
```

**Fields Used:**
- `id`
- `title` (2-line text)
- `slug` (for /news/:slug link)
- `excerpt` (2-line text)
- `cover_image_url` (validated with isPublicImageUrl)

**Never Use:**
- Full article body
- Private editor notes

**Fallback:**
- If <3 articles: Show available articles
- If 0 articles: Hide section entirely

---

### Fanclub / Membership Data

**Source:** Static content (no data dependency)

**Messaging:**
- "Unlock the Full FLESHLAB Archive"
- "Public trailers are free. Full scenes require Fanclub, PPV, or membership access."
- Button links: `/register` (Create Free Account), `/fanclub` (Join Fanclub), `/videos` (Browse Previews)

---

## PART 5: TECHNICAL REQUIREMENTS

### Performance

- **First Contentful Paint:** <2.5 seconds
- **Largest Contentful Paint:** <3.0 seconds
- **Time to Interactive:** <4.0 seconds
- **Total Page Weight:** <3MB (including images)
- **Video Background:** Optional, <5MB if included

### Lazy Loading

- **First row of videos (4 cards):** Eager load (preload images)
- **Remaining videos:** Lazy load (intersection observer)
- **Performer strip images:** Lazy load
- **Article thumbnails:** Lazy load
- **Featured banner:** Eager load (first impression)

### Caching

**sessionStorage:**
- `publicVideos_page_1`: 60s TTL
- `publicPerformers`: 60s TTL
- `publicNews_page_1`: 60s TTL

**React Query:**
- staleTime: 30s
- cacheTime: 5min
- retry: 0 (fail fast)

### No Black Screen

- Page structure renders immediately
- Skeleton loaders during data fetch
- Content fades in as it loads
- Featured banner shows immediately (or fallback)

---

## PART 6: QA CHECKLIST

### Visual Quality

- [ ] Header is dark, modern, non-template
- [ ] Search bar is prominent and centered
- [ ] Logo is clear and visible
- [ ] Navigation row is compact and readable
- [ ] Category chips are scrollable and interactive
- [ ] Featured banner has high-contrast imagery
- [ ] Video cards have clear thumbnails and titles
- [ ] Performer strip is smooth and scrollable
- [ ] Fanclub banner is eye-catching
- [ ] Footer is organized and compliant
- [ ] No old landing page structure
- [ ] No template-based design elements
- [ ] No empty sections with "No content"

### Functionality

- [ ] Search bar focuses and accepts input
- [ ] Navigation links work (no 404s)
- [ ] Category chips filter videos (if implemented)
- [ ] Video cards are clickable (/videos/:slug)
- [ ] Featured banner buttons work (preview, join)
- [ ] Performer cards are clickable (/performers/:slug)
- [ ] Fanclub banner buttons work (/register, /fanclub, /videos)
- [ ] News cards are clickable (/news/:slug)
- [ ] All images load and display correctly
- [ ] Responsive design works on mobile
- [ ] Performance is acceptable (<3s load)

### Data & Safety

- [ ] Videos load from getPublicVideos (no direct entity calls)
- [ ] Performers load from getPublicPerformers
- [ ] News loads from getPublicNews
- [ ] All image URLs are validated with isPublicImageUrl
- [ ] No source_video_url exposed
- [ ] No R2 keys exposed
- [ ] No signed URLs exposed
- [ ] No User.me() dependency on public page
- [ ] No private data visible
- [ ] Console is clean (no errors/warnings)

### Accessibility

- [ ] Contrast ratio >= 7:1 for all text
- [ ] Images have alt text
- [ ] Links are keyboard navigable (tab)
- [ ] Buttons have clear focus states
- [ ] Color is not the only way to indicate information
- [ ] Video duration badges are readable
- [ ] Access tier badges are clear (not color-only)

### Compliance

- [ ] 18+ verification visible (18 U.S.C. 2257)
- [ ] All performers verified 18+ (footer)
- [ ] Copyright notice present
- [ ] Terms/Privacy links present
- [ ] DMCA/2257 links present
- [ ] No explicit content on homepage (teasers only)
- [ ] No autoplay video/audio

### Production Readiness

- [ ] No black screen on load
- [ ] No empty "No content available" messages
- [ ] Fallback for missing images (gradient placeholder)
- [ ] Fallback for missing videos (hide or curated)
- [ ] Fallback for missing performers (hide or curated)
- [ ] Fallback for missing news (hide or curated)
- [ ] Graceful handling of API failures
- [ ] Mobile responsive (320px to 1920px)
- [ ] Works on modern browsers (Chrome, Safari, Firefox, Edge)

---

## PART 7: DESIGN DIRECTION SUMMARY

### What This Is

✅ Modern tube platform UX  
✅ Content-first, search-first homepage  
✅ Real videos visible immediately  
✅ Strong promo banners (eye-catching)  
✅ Dense, commercial layout  
✅ Fast, clickable, responsive  
✅ Premium Asian gay studio brand  
✅ Trailer-first video discovery  
✅ Fanclub/PPV unlock conversion  
✅ Category/tag browsing  

### What This Is NOT

❌ Pornhub clone  
❌ Exact Pornhub layout copy  
❌ Orange color scheme  
❌ Pornhub logo or branding  
❌ Empty landing page  
❌ Vault/premium museum aesthetic  
❌ Stacked sections grid  
❌ Base44 template design  
❌ Hero + Latest + Grid + CTA rhythm  

---

## APPROVAL CHECKLIST

**Before implementation, approve:**

- [ ] Studio Tube direction is correct (not Vault, not template)
- [ ] Desktop wireframe layout is acceptable
- [ ] Mobile wireframe layout is acceptable
- [ ] Component specifications are clear (header, banner, cards, etc.)
- [ ] Data strategy matches existing functions (no new functions needed)
- [ ] Fallback logic is acceptable (hide vs. show "coming soon")
- [ ] Performance requirements are achievable
- [ ] QA checklist covers all cases
- [ ] Ready to implement Phase 1: Foundation (components)

---

**END OF SPECIFICATION DOCUMENT**

**Status:** PENDING APPROVAL - NO IMPLEMENTATION STARTED

**Next Step:** Review wireframes and specifications, then approve to proceed with implementation.