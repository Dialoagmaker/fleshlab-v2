# FLESHLAB Publishing Workflow
## Quick Reference Checklist

---

## Validation Rules (validatePublishSafety)

### ❌ BLOCKING ERRORS (8 checks)
1. Source video URL missing
2. Thumbnail URL missing
3. Preview/trailer URL missing
4. Title missing or < 3 chars
5. Access tier not set (free/fanclub/ppv)
6. Status ≠ "draft"
7. **Processing status ≠ "draft_ready"**
8. **No performers assigned**

### ⚠️ WARNINGS (5 checks)
1. Description < 50 chars
2. No AI metadata draft
3. No promo kit generated
4. Source asset not processed
5. Thumbnail/preview/cover asset not processed

---

## Function Calls

### Preview Validation
```javascript
const res = await base44.functions.invoke('validatePublishSafety', { video_id });
// Returns: { can_publish, errors[], warnings[], validation_summary }
```

### Publish to Website
```javascript
const res = await base44.functions.invoke('publishVideoToWebsite', { video_id });
// Returns: { status: 'ok', video_id, published_at, website_published_at }
// Blocks if validation fails
```

### Generate Promo Kit
```javascript
const res = await base44.functions.invoke('generatePromoKit', { video_id, kit_type: 'full' });
// Returns: { status: 'ok', promo_kit_id, kit: {...} }
```

### Mark External Posted
```javascript
const res = await base44.functions.invoke('markExternalPosted', { 
  video_id, 
  platform: 'xhamster' // or 'twitter', 'reddit', 'telegram'
});
// Returns: { status: 'ok', platform, posted_at, promotion_status }
```

---

## Entity Fields

### Video (promotion tracking)
- `promotion_status` - none | planned | active | ended
- `website_published_at` - datetime
- `xhamster_posted_at` - datetime
- `twitter_posted_at` - datetime
- `reddit_posted_at` - datetime
- `telegram_posted_at` - datetime
- `promo_kit_generated_at` - datetime
- `needs_fix` - boolean
- `fix_notes` - textarea

### VideoPromoKit (19 fields)
- `video_id`, `kit_type`
- `xhamster_title`, `xhamster_description`, `xhamster_tags`
- `social_short_caption`, `social_long_caption`
- `twitter_caption`, `reddit_caption`, `telegram_caption`
- `hashtags`, `cta_text`
- `cover_url`, `thumbnail_url`, `preview_url`
- `generated_at`, `generated_by`

---

## AuditLog Actions

| Action | Entity Type | Function |
|--------|-------------|----------|
| `promo_kit_generated` | VideoPromoKit | generatePromoKit |
| `publish` | Video | publishVideoToWebsite |
| `external_platform_posted` | Video | markExternalPosted |
| `create` | VideoPromoKit | generatePromoKit |

---

## Production Testing Steps

### 1. Test Validation
```
1. Create video with all required fields
2. Add at least 1 performer
3. Set processing_status = "draft_ready"
4. Call validatePublishSafety
   → Should return can_publish: true
5. Remove performer
6. Call validatePublishSafety
   → Should return error: "At least one performer must be assigned"
```

### 2. Test Publishing
```
1. Use valid video from step 1
2. Call publishVideoToWebsite
   → Should succeed, create SEOPage, create AuditLog
3. Call again (republish)
   → Should update SEOPage (not duplicate)
```

### 3. Test Promo Kit
```
1. Call generatePromoKit
   → Should create VideoPromoKit, update Video.promo_kit_generated_at
2. Check AuditLog for entry
```

### 4. Test External Posting
```
1. Call markExternalPosted with platform='xhamster'
   → Should set xhamster_posted_at
2. Check promotion_status changed to 'active'
3. Check AuditLog for entry
```

---

## Files Changed

### Functions (4)
- `functions/validatePublishSafety.js` - NEW
- `functions/publishVideoToWebsite.js` - NEW
- `functions/generatePromoKit.js` - NEW
- `functions/markExternalPosted.js` - UPDATED

### Entities (2)
- `entities/Video.json` - 13 new fields
- `entities/VideoPromoKit.json` - NEW

### Admin Pages (2)
- `pages/admin/ContentReview.jsx` - NEW
- `pages/admin/PromoKitDetail.jsx` - NEW

### Router
- `App.jsx` - Added 2 routes

---

## Critical Fixes Applied

✅ Performer assignment now BLOCKS publishing  
✅ Processing status must be exactly "draft_ready"  
✅ Single source of truth for validation  
✅ SEOPage creation is idempotent  
✅ All actions create AuditLog entries  

---

**Audit Status:** ✅ COMPLETE  
**Production Ready:** ✅ YES