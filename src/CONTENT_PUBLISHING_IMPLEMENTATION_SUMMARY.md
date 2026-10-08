# FLESHLAB Content Publishing & Promotion Workflow
## Implementation Summary

**Date:** 2026-06-01  
**Status:** ✅ IMPLEMENTED

---

## Files Changed / Created

### Entity Schemas (2 files)
1. **entities/Video.json** - Enhanced with 13 new promotion tracking fields
2. **entities/VideoPromoKit.json** - NEW entity for storing promo kits

### Backend Functions (4 files)
1. **functions/generatePromoKit.js** - NEW - Generates platform-specific promo content using AI
2. **functions/validatePublishSafety.js** - NEW - Validates video ready for publishing
3. **functions/publishVideoToWebsite.js** - NEW - Publishes video to website with safety checks
4. **functions/markExternalPosted.js** - NEW - Marks external platforms as posted

### Admin Pages (2 files)
1. **pages/admin/ContentReview.jsx** - NEW - Unified content review queue (replaces DraftReview)
2. **pages/admin/PromoKitDetail.jsx** - NEW - Promo kit management page

### Admin Components (1 file)
1. **components/admin/ContentReviewCard.jsx** - NEW - Content review card component

### Router Updates
1. **App.jsx** - Added routes for `/admin/content-review` and `/admin/promo-kit/:videoId`

### Enhanced Existing Pages
1. **pages/admin/Videos.jsx** - Added promotion status columns and external platform indicators

---

## New Entity Fields

### Video Entity (13 new fields)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `promotion_status` | enum | `none` | none \| planned \| active \| ended |
| `promotion_note` | textarea | - | Admin notes about promotion strategy |
| `website_published_at` | datetime | - | When published to FLESHLAB website |
| `xhamster_posted_at` | datetime | - | When posted to xHamster |
| `twitter_posted_at` | datetime | - | When posted to Twitter/X |
| `reddit_posted_at` | datetime | - | When posted to Reddit |
| `telegram_posted_at` | datetime | - | When posted to Telegram |
| `promo_kit_generated_at` | datetime | - | When promo kit was generated |
| `needs_fix` | boolean | false | Flag for review issues |
| `fix_notes` | textarea | - | Admin notes about required fixes |

### VideoPromoKit Entity (19 fields)

| Field | Type | Description |
|-------|------|-------------|
| `video_id` | string | Reference to Video |
| `kit_type` | enum | xhamster \| social \| full |
| `xhamster_title` | string | SEO-optimized title for xHamster |
| `xhamster_description` | textarea | Description for xHamster |
| `xhamster_tags` | array | Tags for xHamster |
| `xhamster_upload_notes` | textarea | Upload notes/warnings |
| `social_short_caption` | textarea | Short caption for X/Twitter |
| `social_long_caption` | textarea | Long caption for Reddit/Telegram |
| `twitter_caption` | textarea | Twitter-specific caption |
| `reddit_caption` | textarea | Reddit-specific caption |
| `telegram_caption` | textarea | Telegram-specific caption |
| `hashtags` | array | Suggested hashtags |
| `cta_text` | string | Call-to-action text |
| `cover_url` | string | Cover image URL |
| `thumbnail_url` | string | Thumbnail URL |
| `preview_url` | string | Preview video URL |
| `generated_at` | datetime | Generation timestamp |
| `generated_by` | string | User ID who generated |

---

## Backend Functions

### 1. generatePromoKit

**Input:**
```json
{
  "video_id": "string",
  "kit_type": "xhamster | social | full"
}
```

**Process:**
- Loads video, performers, brand, assets
- Uses LLM to generate platform-specific content
- Stores result in VideoPromoKit entity
- Updates Video.promo_kit_generated_at

**Output:**
```json
{
  "status": "ok",
  "promo_kit_id": "string",
  "kit": { /* generated content */ }
}
```

---

### 2. validatePublishSafety

**Input:**
```json
{ "video_id": "string" }
```

**Validation Rules:**

| Field | Required | Error Message |
|-------|----------|---------------|
| source_video_url | ✓ | "Source video URL is missing" |
| primary_thumbnail_url | ✓ | "Thumbnail URL is missing" |
| trailer_url | ✓ | "Preview/trailer URL is missing" |
| title | ✓ (min 3 chars) | "Title is required" |
| description | ⚠ (min 50 chars) | "Description is short" (warning) |
| access_tier | ✓ | "Access tier must be set" |
| VideoPerformer count | ⚠ | "No performers assigned" (warning) |
| status | ✓ (must be draft) | "Video must be in draft status" |
| processing_status | ✓ (not failed) | "Video processing failed" |

**Output:**
```json
{
  "can_publish": boolean,
  "errors": [ /* validation errors */ ],
  "warnings": [ /* warnings */ ],
  "validation_summary": { /* summary stats */ }
}
```

---

### 3. publishVideoToWebsite

**Input:**
```json
{ "video_id": "string" }
```

**Process:**
1. Runs validatePublishSafety
2. If validation passes:
   - Sets Video.status = 'published'
   - Sets Video.website_published_at = now
   - Creates/updates SEOPage record
   - Creates AuditLog entry
   - Sets promotion_status = 'planned' (if was 'none')

**Output:**
```json
{
  "status": "ok",
  "video_id": "string",
  "published_at": "datetime"
}
```

**Error Response (400):**
```json
{
  "error": "Publish validation failed",
  "details": [ /* validation errors */ ]
}
```

---

### 4. markExternalPosted

**Input:**
```json
{
  "video_id": "string",
  "platform": "xhamster | twitter | reddit | telegram"
}
```

**Process:**
- Updates platform timestamp (e.g., xhamster_posted_at)
- If any platform posted, sets promotion_status = 'active'

**Output:**
```json
{
  "status": "ok",
  "platform": "string",
  "posted_at": "datetime",
  "promotion_status": "active"
}
```

---

## Admin UI Features

### /admin/content-review (Content Review Page)

**Shows:**
- Videos with processing_status = 'draft_ready'
- Asset health indicators (source, thumbnail, preview, cover)
- AI metadata preview (current vs draft comparison)
- Promo kit status badge

**Actions:**
- Apply AI Draft
- Regenerate AI Metadata
- Generate Promo Kit
- Manage Promo Kit (link to detail page)
- Publish to Website (with validation)
- Delete Video

---

### /admin/promo-kit/:videoId (Promo Kit Detail Page)

**Sections:**
1. **Website Publishing Data**
   - Title, description, access tier, published date
   - Copy buttons for each field

2. **xHamster Publishing Data**
   - xHamster title, description, tags, upload notes
   - Copy buttons for each field

3. **Social Media Captions**
   - Short caption (X/Twitter)
   - Long caption (Reddit/Telegram)
   - Hashtags
   - CTA text
   - Copy buttons for each field

4. **Asset Links**
   - Cover image URL
   - Thumbnail URL
   - Preview video URL
   - External links to open in new tab

5. **Mark as Posted Actions**
   - Buttons for xHamster, Twitter, Reddit, Telegram
   - Visual indicators when posted

**Actions:**
- Regenerate Promo Kit
- Copy any text field to clipboard
- Mark external platforms as posted

---

### /admin/videos (Enhanced Video List)

**New Columns:**
- **Promotion** column:
  - Promotion status badge
  - Promo kit ready indicator
  - Needs fix warning
- **External** column:
  - Platform icons (xHamster, Twitter, Reddit, Telegram)
  - "Not posted" indicator if none posted

---

## Validation Logic Summary

### Publish Safety Validation

**Required (blocks publishing):**
1. source_video_url exists
2. primary_thumbnail_url exists
3. trailer_url exists
4. title exists (min 3 chars)
5. access_tier is set (free/fanclub/ppv)
6. status is 'draft'
7. processing_status is not 'failed'

**Warnings (allow publishing but notify):**
1. description < 50 chars
2. No performers assigned
3. No AI metadata draft
4. No promo kit generated
5. Asset not ready (source/thumbnail/preview/cover)

---

## Workflow

### Complete Publishing Workflow

```
1. Upload Video
   ↓
2. Processor generates assets
   ↓
3. AI metadata generated (processing_status = draft_ready)
   ↓
4. Content Review Queue
   ↓
5. Apply AI Draft (optional)
   ↓
6. Generate Promo Kit
   ↓
7. Validate for Publish
   ↓
8. Publish to Website
   ↓
9. Mark External Platforms Posted
```

### Fast Track (Minimum Clicks)

```
draft_ready → Generate Promo Kit → Publish → Done (3 clicks)
```

---

## Testing Checklist

### Entity Schema Tests
- [ ] Video entity accepts all 13 new fields
- [ ] VideoPromoKit entity created successfully
- [ ] Default values work correctly
- [ ] Enum values validated

### Backend Function Tests

#### generatePromoKit
- [ ] Generates full kit successfully
- [ ] Generates xhamster-only kit
- [ ] Generates social-only kit
- [ ] Stores in VideoPromoKit entity
- [ ] Updates Video.promo_kit_generated_at
- [ ] Returns generated kit in response

#### validatePublishSafety
- [ ] Returns can_publish=true when all requirements met
- [ ] Returns errors when required fields missing
- [ ] Returns warnings for non-critical issues
- [ ] Checks asset health
- [ ] Checks performer assignment

#### publishVideoToWebsite
- [ ] Publishes video when validation passes
- [ ] Sets website_published_at timestamp
- [ ] Creates SEOPage record
- [ ] Creates AuditLog entry
- [ ] Updates promotion_status to 'planned'
- [ ] Blocks publish when validation fails

#### markExternalPosted
- [ ] Updates platform timestamp
- [ ] Sets promotion_status to 'active' if first platform
- [ ] Works for all 4 platforms
- [ ] Returns updated video data

### Admin UI Tests

#### Content Review Page
- [ ] Shows videos with draft_ready status
- [ ] Displays asset health indicators
- [ ] Shows AI metadata preview
- [ ] Generate Promo Kit button works
- [ ] Publish button validates before publishing
- [ ] Links to video edit page
- [ ] Links to promo kit detail page

#### Promo Kit Detail Page
- [ ] Shows latest promo kit
- [ ] All copy buttons work
- [ ] Regenerate kit button works
- [ ] Mark as posted buttons work
- [ ] Asset links open in new tab
- [ ] Shows video information
- [ ] Handles missing kit gracefully

#### Video List Page
- [ ] Shows promotion status column
- [ ] Shows external platform icons
- [ ] Platform icons display correctly
- [ ] Promo kit indicator shows
- [ ] Needs fix warning shows

### Integration Tests
- [ ] Full workflow from upload to publish
- [ ] Promo kit generation after publish
- [ ] External posting after publish
- [ ] Validation blocks incomplete videos
- [ ] SEOPage created on publish
- [ ] AuditLog created on publish

---

## Future Extensions (Backlog)

### Phase 2: Auto-Posting
- [ ] xHamster API integration (if available)
- [ ] Twitter/X API integration
- [ ] Reddit API integration
- [ ] Telegram bot integration

### Phase 3: Scheduling
- [ ] Social media scheduling calendar
- [ ] Bulk promo kit generation
- [ ] Promo kit templates
- [ ] A/B testing for captions

### Phase 4: Analytics
- [ ] Track external platform performance
- [ ] Click-through rates from social
- [ ] xHamster view tracking
- [ ] ROI analysis per video

---

## Notes

### Design Decisions

1. **No Auto-Posting (Phase 1)**: Manual control ensures quality and compliance
2. **Promo Kit as Separate Entity**: Allows multiple kits per video, versioning
3. **Validation Before Publish**: Prevents incomplete videos going live
4. **Copy Buttons**: Fast workflow for manual posting
5. **Platform Timestamps**: Track promotion progress without API integration

### Security

- All functions require admin role
- AuditLog tracks publish actions
- No external API calls (Phase 1)
- Validation prevents accidental publish

### Performance

- LLM calls use gemini_3_flash for speed
- Promo kit generation is async
- Validation is fast (entity queries only)
- No blocking operations on list pages

---

**Implementation Complete.** Ready for testing.