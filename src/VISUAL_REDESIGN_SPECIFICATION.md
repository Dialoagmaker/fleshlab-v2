# FLESHLAB VISUAL REDESIGN SPECIFICATION
## Phase 1B - Premium Private Studio Experience

**Document Version:** 2.0 (Conceptual Redesign)
**Date:** 2026-06-02
**Status:** PENDING APPROVAL - NO IMPLEMENTATION

---

## EXECUTIVE SUMMARY

This specification defines a complete visual redesign of the FLESHLAB homepage to transform it from a standard dark template into a premium, cinematic private studio experience. The goal is to make the site feel like a completely different product designed by a senior web designer with expertise in luxury digital experiences.

**Key Principle:** This is not a rename of existing sections. This is a fundamental reimagining of the visual language, interaction model, and atmospheric experience.

---

## A. VISUAL MOODBOARD DESCRIPTION

### What the Page Should Feel Like

**Primary Adjectives:**
- Cinematic
- Exclusive
- Intimate
- Sophisticated
- Mysterious
- Premium
- Curated

**Reference Style Words:**
- "Private screening room"
- "Art gallery opening"
- "Luxury hotel lobby"
- "Film festival VIP lounge"
- "High-end fashion editorial"
- "Boutique cinema"

**Emotional Journey:**
1. **Anticipation** (entry experience)
2. **Discovery** (browsing content)
3. **Intrigue** (wanting more)
4. **Belonging** (membership aspiration)

### What It Must NOT Look Like

- ❌ Standard dark mode SaaS template
- ❌ Grid of boxes stacked vertically
- ❌ Generic streaming service layout (Netflix, Hulu clone)
- ❌ Overused "cyberpunk" neon aesthetic
- ❌ Cluttered navigation with too many CTAs
- ❌ Placeholder empty states with "No content available"
- ❌ Base44 default component styling
- ❌ Template-based hero sections with stock photos

### Visual References (Conceptual)

**Not literal copies, but directional inspiration:**
- A24 Films website (cinematic, editorial)
- The Criterion Collection (curated, premium)
- High-end fashion brand sites (minimal, bold imagery)
- Private club membership sites (exclusive, gated)
- Art house cinema websites (atmospheric, moody)

---

## B. NEW LAYOUT CONCEPT

### Fundamental Shift: From "Website" to "Experience"

**Current Problem:** The site feels like a standard content grid with navigation.

**New Concept:** The site feels like entering a private archive or exclusive club.

### Structural Changes

#### 1. Single Continuous Narrative Flow
- **Not:** Hero → Section 1 → Section 2 → Section 3 → Footer
- **Instead:** Entry → Reveal → Journey → Destination

#### 2. Asymmetric Editorial Layout
- **Not:** Uniform grid cards in rows
- **Instead:** Varied tile sizes, overlapping elements, magazine-style composition

#### 3. Depth Through Layers
- **Not:** Flat cards on solid background
- **Instead:** Parallax scrolling, layered gradients, depth-of-field blur effects

#### 4. Horizontal + Vertical Movement
- **Not:** Only vertical scroll
- **Instead:** Horizontal rails, scroll-triggered reveals, staggered animations

### Above-the-Fold Redefinition

**Current:** Header + Nav + Hero Image + Text + 2 Buttons

**New:** 
- Full viewport height immersive background
- Minimal wordmark (top-left or centered)
- Single primary CTA ("Enter" or "Explore")
- Hidden navigation (revealed on interaction)
- No secondary nav bar
- No visible footer content

---

## C. CONCRETE VISUAL SYSTEM

### 1. Logo / Wordmark Direction

**Current:** Red square with "F" + "FLESHLAB" text

**New Direction:**
- **Option A:** Minimal wordmark only (no icon) - thin, elegant sans-serif
- **Option B:** Monogram seal (circular or shield) - embossed effect
- **Option C:** Abstract symbol (geometric, not literal)

**Treatment:**
- Subtle animation on load (fade + slight scale)
- Becomes smaller on scroll but never disappears
- No red background box
- Color: White or very light grey (#F5F5F5)

**Typography for Wordmark:**
- Primary: Custom or premium sans-serif (e.g., Neue Haas Grotesk, GT America)
- Alternative: Elegant serif for contrast (e.g., Canela, Tiempos)
- Weight: Light or Regular (not Bold)
- Letter spacing: Slightly increased for luxury feel

### 2. Header Direction

**Current:** Sticky header with logo + nav links + search + CTA button

**New Direction:**
- **State 1 (Top):** Transparent, logo only, hamburger menu
- **State 2 (Scrolled):** Minimal, logo + subtle progress indicator
- **Navigation:** Full-screen overlay or slide-out drawer (not inline links)
- **Search:** Hidden behind icon, expands on click
- **CTA:** Contextual, not always visible

**Behavior:**
- No hard background color at top
- Backdrop blur on scroll (glassmorphism, subtle)
- Border appears only when scrolling
- Height: 80px at top, 64px when scrolled

### 3. Typography System

**Headlines:**
- H1: 64px desktop / 40px mobile (light weight, wide tracking)
- H2: 48px desktop / 32px mobile
- H3: 32px desktop / 24px mobile

**Body:**
- Large: 18px (leading 28px)
- Regular: 16px (leading 24px)
- Small: 14px (leading 20px)

**Hierarchy Rules:**
- Maximum 3 font weights (Light, Regular, Medium)
- No bold except for rare emphasis
- Increased letter-spacing on all caps
- Line height: 1.5-1.7 for readability

**Font Families:**
- Primary: Inter or system sans-serif (clean, neutral)
- Accent: Consider single serif for editorial moments
- Monospace: None (not technical aesthetic)

### 4. Spacing System

**Section Padding:**
- Desktop: 120px vertical between major sections
- Mobile: 64px vertical

**Internal Spacing:**
- Use 8px grid system
- Generous whitespace around content
- Cards breathe (padding: 24-32px)

**Container Width:**
- Max: 1440px (not full bleed always)
- Side padding: 32px desktop, 16px mobile

### 5. Image Treatment

**Thumbnails:**
- Aspect ratio: 16:9 (video), 4:5 (performers)
- Border radius: 4px (subtle, not fully rounded)
- Shadow: None (flat, layered with gradients)

**Hover Effects:**
- Scale: 1.03-1.05 (subtle, not dramatic)
- Duration: 500-700ms (slow, cinematic)
- Easing: ease-out (not linear)

**Overlays:**
- Gradient fade from bottom (not solid color)
- Text on images: Always with gradient scrim
- No hard borders

**Lazy Loading:**
- Blur-up placeholder (not gray box)
- Fade-in on load (300ms)

### 6. Interaction Style

**Buttons:**
- Primary: Solid fill, subtle hover (opacity or slight lift)
- Secondary: Outline or text-only
- No heavy shadows or 3D effects
- Border radius: 4-6px (not pill-shaped)

**Links:**
- Underline on hover (not always)
- Color shift (white → rose, not blue)
- Arrow icons for "continue" actions

**Cards:**
- No visible border by default
- Border appears on hover (1px, rose-500/30)
- Background: Slightly lighter than page bg
- No shadow (flat design with layering)

### 7. Animation Style

**Principles:**
- Slow and deliberate (not snappy)
- Purposeful (not decorative)
- Smooth (60fps, GPU-accelerated)

**Specific Animations:**
- Page load: Staggered fade-in (100ms delay between elements)
- Scroll reveals: Fade + slight upward movement (20px)
- Hover: Scale + border (not color shift only)
- Transitions: 300-500ms (not instant)

**Easing Curves:**
- Standard: cubic-bezier(0.4, 0, 0.2, 1)
- Entrance: cubic-bezier(0, 0, 0.2, 1)
- Exit: cubic-bezier(0.4, 0, 1, 1)

**What to Avoid:**
- Bounce or elastic effects
- Spinning or rotating elements
- Excessive motion (reduce for accessibility)
- Autoplay video backgrounds (user-triggered only)

### 8. Color System (Beyond Black + Red)

**Current:** Black (#0A0A0A) + Rose (#E11D48)

**Expanded Palette:**

**Neutrals:**
- Background: #0A0A0A (current)
- Surface: #0F0F0F (slightly lighter)
- Surface-2: #141414 (cards, elevated)
- Border: #FFFFFF08 (very subtle, 3% opacity)
- Text Primary: #F5F5F5 (96% white)
- Text Secondary: #F5F5F599 (60% opacity)
- Text Muted: #F5F5F566 (40% opacity)

**Accent (Rose):**
- Primary: #E11D48 (current rose-600)
- Hover: #DC2626 (slightly darker)
- Muted: #E11D4810 (1% opacity for backgrounds)
- Gradient: #E11D48 → #9F1239 (for special elements)

**New Accent (Optional):**
- Warm Gold: #D4AF37 (for premium/exclusive badges)
- Cool Blue: #3B82F6 (for informational elements)
- Use sparingly, max 5% of screen

**Gradients:**
- Background: Linear, top to bottom (dark to slightly darker)
- Overlays: Radial (center glow for focus)
- Text: Never gradient (always solid)

---

## D. HOMEPAGE COMPOSITION

### The Entry Experience (Above the Fold)

**What User Sees at First Load:**

1. **Full Viewport Background:**
   - Single cinematic image or slow-motion video loop
   - Subject: Abstract studio aesthetic (not explicit content)
   - Treatment: Dark overlay (60% opacity), subtle grain
   - Aspect: Fills entire viewport (no letterboxing)

2. **Wordmark:**
   - Position: Top-left (40px from top, 32px from left)
   - Size: 140px width (desktop), 100px (mobile)
   - Animation: Fade-in at 300ms (subtle)

3. **Primary CTA:**
   - Position: Centered vertically and horizontally
   - Text: "ENTER THE ARCHIVE" or "EXPLORE"
   - Style: Minimal button (outline or ghost)
   - Size: Large (48px height)
   - Icon: Arrow or chevron (right)

4. **Navigation:**
   - Hidden behind hamburger icon (top-right)
   - On click: Full-screen overlay (not dropdown)
   - Links: Large typography, generous spacing

5. **Secondary Indicator:**
   - Scroll prompt (subtle, bottom-center)
   - Animation: Gentle bounce (1px, 2s loop)
   - Text: None (icon only, chevron down)

**What User Does NOT See:**
- No secondary nav bar
- No multiple CTAs
- No content grid
- No visible footer
- No social icons
- No search bar (visible)

### The Journey (Below the Fold)

**Section 1: Studio Drops (Editorial Rail)**
- Trigger: After scrolling past entry section
- Layout: Horizontal scroll (not vertical grid)
- Content: 6-8 featured videos
- Card Style: Varied sizes (2 square + 1 wide pattern)
- Interaction: Drag to scroll or arrow navigation
- Background: Slightly lighter than entry (#0F0F0F)

**Section 2: Preview Wall (Thumbnail Strip)**
- Layout: Single row, 10 thumbnails
- Style: Minimal (image only, no text)
- Hover: Expands to show title + duration
- Background: Same as Section 1
- Purpose: Visual density, quick browsing

**Section 3: Performer Worlds (Immersive Panels)**
- Layout: 2x2 grid (4 performers max)
- Card Style: Full-bleed image, text overlay
- Content: Name, video count, "Explore" CTA
- Background: Gradient fade to darker
- Purpose: Human connection, artist focus

**Section 4: Studio Journal (Editorial)**
- Layout: 1 large + 2 small (asymmetric)
- Style: Magazine editorial (not blog grid)
- Content: Title, excerpt, "Read" link
- Background: Surface color (#141414)
- Purpose: Authority, behind-the-scenes

**Section 5: Membership (Conversion)**
- Layout: Centered, single column
- Content: Value props (4 bullets), CTA
- Style: Minimal, focused
- Background: Gradient to rose-950/20
- Purpose: Clear conversion path

**Footer:**
- Minimal (not full site map)
- Content: Logo, copyright, legal links, social
- Background: Darkest (#050505)
- Purpose: Compliance, not navigation

---

## E. DATA STRATEGY

### Critical Requirement: No Empty States

**Problem:** Current implementation shows "No drops available" even when videos exist.

**Solution:** Robust data fetching with fallbacks.

### Data Sources

**All data from existing public functions:**
- `getPublicVideos` → Videos + Brands
- `getPublicPerformers` → Performers
- `getPublicNews` → Articles

**No direct entity calls.**
**No User.me() dependency.**
**No private URLs exposed.**

### Fallback Logic

#### Studio Drops (Videos)
```
If videos exist:
  → Show first 6 videos (editorial layout)
Else:
  → Show curated "Coming Soon" message
  → CTA: "Browse All Productions" → /videos
  → Background: Abstract studio image (not empty gray box)
```

#### Preview Wall (Videos)
```
If videos exist:
  → Show 10 thumbnails (first 10 from getPublicVideos)
Else:
  → Hide section entirely (do not show empty rail)
  → Adjust spacing for next section
```

#### Performer Worlds (Performers)
```
If featured performers exist:
  → Show top 4 (2x2 grid)
Else if any performers exist:
  → Show first 4 performers (not featured)
Else:
  → Show "Meet Our Artists" placeholder
  → Use abstract artistic imagery (not empty boxes)
  → CTA: "View All Performers" → /performers
```

#### Studio Journal (Articles)
```
If articles exist:
  → Show first 3 (1 large + 2 small)
Else:
  → Hide section entirely
  → Adjust spacing for next section
```

### Data Validation

**Before rendering any URL:**
- Call `isPublicImageUrl()` for images
- Call `isPublicPreviewUrl()` for video previews
- Fallback to gradient placeholder if invalid

**Never expose:**
- Full video URLs (only preview/trailer)
- R2 private bucket keys
- Internal CDN paths

### Caching Strategy

**sessionStorage cache:**
- Key: `publicVideos_page_1`, `publicPerformers`, `publicNews_page_1`
- TTL: 60 seconds
- Purpose: Reduce API calls on re-renders

**React Query:**
- retry: 0 (fail fast, show fallback)
- staleTime: 30 seconds
- cacheTime: 5 minutes

---

## F. PRODUCTION SAFETY

### Absolute Requirements

#### 1. No Black Screen on Load
- Content must render immediately
- Use skeleton loaders during data fetch
- Never wait for data to show page structure

#### 2. No Empty Homepage Sections
- Every section has fallback content
- Fallbacks are visually designed (not error messages)
- Hide sections gracefully if no content (adjust spacing)

#### 3. No Broken Logo
- Logo always visible (never transparent by accident)
- Test on both light and dark backgrounds
- Provide SVG fallback for image logo

#### 4. No Direct Entity Calls
- All data through public functions only
- `getPublicVideos`, `getPublicPerformers`, `getPublicNews`
- No `base44.entities.Video.list()` from frontend

#### 5. No User.me() Dependency
- Public pages work without authentication
- No `await base44.auth.me()` on homepage
- User state optional, not required

#### 6. No Private Video URLs
- Only use `trailer_url`, `preview_gif_url`, `primary_thumbnail_url`
- Never expose `source_video_url`
- Validate all URLs with `isPublicImageUrl()`

#### 7. No Broken Public Routes
- Test all navigation links
- `/videos`, `/performers`, `/news`, `/become-performer`
- 404 page styled consistently

#### 8. No Console Errors
- Handle all promise rejections
- Validate data before accessing properties
- Use optional chaining (`?.`) for nested data

### Rollback Plan

**If Phase 1B fails:**
1. Revert `pages/Home.jsx` to previous stable version
2. Keep SEO files (Phase 1A) intact
3. Remove unused Studio components (or keep isolated)
4. Restore StudioLayout wrapper if needed

**Files that can be safely reverted:**
- `pages/Home.jsx` (only file that matters for homepage)

**Files that must NOT change:**
- `components/SEOMeta.jsx`
- `lib/seoConfig.js`
- `lib/seoValidation.js`
- `lib/seoTemplates.js`
- `lib/seoKeywords.js`
- All backend functions
- All other public pages (`/videos`, `/news`, `/performers`)

---

## G. IMPLEMENTATION CHECKLIST

### Before Any Code is Written

- [ ] Visual design specification approved
- [ ] Moodboard references confirmed
- [ ] Color palette finalized
- [ ] Typography choices confirmed
- [ ] Layout wireframes approved
- [ ] Animation timing approved
- [ ] Fallback content written
- [ ] Data strategy validated

### During Implementation

- [ ] All URLs validated before rendering
- [ ] All sections have fallback states
- [ ] No direct entity calls in frontend
- [ ] No User.me() on public pages
- [ ] Console shows zero errors
- [ ] Mobile responsive tested
- [ ] Performance budget met (<3s load time)

### Before Deployment

- [ ] Homepage loads with data (or graceful fallback)
- [ ] All navigation links work
- [ ] Logo visible on all backgrounds
- [ ] No empty "No content" placeholders
- [ ] SEO meta tags present
- [ ] Analytics tracking functional
- [ ] Rollback plan tested

---

## H. SUCCESS CRITERIA

### Visual Quality

**Pass:**
- Looks like a premium, custom-designed site
- No template or boilerplate feel
- Cohesive visual language throughout
- Professional, production-ready polish

**Fail:**
- Looks like a dark mode template
- Generic grid layouts
- Inconsistent spacing or typography
- Amateur or unfinished appearance

### Technical Quality

**Pass:**
- Zero console errors
- All data loads correctly
- Fallbacks work as designed
- Performance is excellent

**Fail:**
- Empty states with "No content"
- Broken images or URLs
- Slow load times
- JavaScript errors

### User Experience

**Pass:**
- Clear entry point and journey
- Intuitive navigation
- Compelling visual storytelling
- Strong conversion path to membership

**Fail:**
- Confusing layout
- Too many CTAs
- Unclear value proposition
- Weak membership messaging

---

## I. NEXT STEPS

**This document is a specification only. No implementation should begin until:**

1. ✅ Visual design specification is reviewed and approved
2. ✅ All questions about layout, typography, color are resolved
3. ✅ Fallback content is written and approved
4. ✅ Data strategy is validated against existing functions
5. ✅ Rollback plan is understood and accepted

**After approval, implementation will proceed in this order:**

1. Create visual components (logo, wordmark, buttons, cards)
2. Build homepage sections (one at a time)
3. Implement data fetching with fallbacks
4. Add animations and interactions
5. Test on mobile and desktop
6. Validate production safety checklist
7. Deploy with rollback ready

---

**END OF SPECIFICATION DOCUMENT**

**Questions for Approval:**
1. Is the visual direction aligned with the premium studio brand?
2. Are the fallback states acceptable (no empty placeholders)?
3. Is the data strategy sound (using existing public functions)?
4. Are the production safety requirements clear?
5. Should any section be added, removed, or modified?