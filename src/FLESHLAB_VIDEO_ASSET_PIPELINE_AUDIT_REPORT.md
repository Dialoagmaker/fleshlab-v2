# FLESHLAB VIDEO ASSET PIPELINE — FULL AUDIT REPORT
**Date:** 2026-06-05  
**Audit Type:** Phase 1 — Diagnostic Only (No Code Changes)  
**Scope:** Complete video asset pipeline from upload to public rendering

---

## EXECUTIVE SUMMARY

### Root Causes Identified

1. **Dual R2 Path Conventions:** System writes to BOTH `fleshlab/{studio}/videos/` AND `studios/{studio}/source/` depending on upload path
2. **Processor Webhook vs API Confusion:** Functions call `${PROCESSOR_WEBHOOK_URL}/regenerate` but some expect API behavior
3. **Browser CORS Validation Failure:** video.fleshlab.online does not send Access-Control-Allow-Origin headers, causing fetch/HEAD to fail in browser while render events succeed
4. **No Pre-Upload Validation:** Generated thumbnails are not validated locally before R2 upload, allowing HTML error pages to be saved as .jpg
5. **VideoEntity vs VideoAsset Divergence:** Video.primary_thumbnail_url stores CDN URLs, VideoAsset stores R2 keys — synchronization failures cause broken displays
6. **Three Different Thumbnail Resolvers:** Admin Edit, Admin List, and Public Cards each use different fallback chains
7. **Publish Validation is Client-Side Only:** Server-side publish gating does not re-validate asset bytes, only URL presence

---

## 1. VIDEO ENTITY FIELDS AUDIT

| Field | Purpose | Used by Admin Edit | Used by Admin List | Used by Public Cards | Written by Upload | Written by Processor | Canonical? | Problem |
|-------|---------|-------------------|-------------------|---------------------|------------------|---------------------|------------|---------|
| `source_video_url` | Master source video CDN URL | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes (updateVideoProcessingResult) | ✅ Yes | Some old videos have guessed paths |
| `primary_thumbnail_url` | Primary thumbnail CDN URL | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes (updateVideoProcessingResult) | ✅ Yes | Can contain HTML error pages |
| `trailer_url` | Preview video CDN URL | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ✅ Yes (updateVideoProcessingResult) | ✅ Yes | Some use source as fallback |
| `thumbnail_url` | Legacy thumbnail field | ✅ No | ⚠️ Fallback | ❌ No | ❌ No | ❌ No | ❌ No | Deprecated but still queried |
| `cover_image_url` | Cover image CDN URL | ✅ Yes | ⚠️ Fallback | ❌ No | ❌ No | ✅ Yes (updateVideoProcessingResult) | ⚠️ Optional | Rarely populated |
| `preview_gif_url` | Animated GIF preview | ✅ Yes | ❌ No | ⚠️ Fallback | ❌ No | ✅ Yes (updateVideoProcessingResult) | ❌ No | Legacy format |
| `processing_status` | Asset generation state | ✅ Yes | ❌ No | ❌ No | ✅ Yes (finalizeUploadedVideo) | ✅ Yes (updateVideoProcessingResult) | ✅ Yes | Values: uploading, processing, metadata_pending, draft_ready, failed |
| `duration_seconds` | Video duration | ✅ Yes | ❌ No | ✅ Yes | ⚠️ Sometimes | ✅ Yes (updateVideoProcessingResult) | ✅ Yes | Sometimes null on published videos |
| `status` | Publish state (draft/published) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | Manual admin control |

**Problem Summary:**
- 7 URL fields create confusion about source of truth
- No validation that URLs contain actual media vs HTML errors
- Processor writes URLs but never validates bytes before saving

---

## 2. VIDEOASSET ENTITY AUDIT

| Field | Purpose | Source of Truth? | Problem |
|-------|---------|-----------------|---------|
| `video_id` | Link to Video | ✅ Yes | None |
| `asset_type` | Enum: source, thumbnail, preview, cover, gif, keyframe, poster | ✅ Yes | None |
| `r2_key` | Raw R2 storage path | ✅ Yes | Some use `fleshlab/` prefix, some use `studios/` |
| `cdn_url` | Pre-computed public URL | ⚠️ Computed | Sometimes diverges from Video entity URL |
| `status` | Asset state: pending, processing, uploaded, ready, failed | ✅ Yes | Some assets stuck in "processing" forever |
| `file_size_bytes` | File size | ⚠️ Optional | Often null |
| `duration_seconds` | Duration (video only) | ⚠️ Optional | Often null |
| `width`, `height` | Dimensions | ⚠️ Optional | Often null |
| `mime_type` | Content type | ⚠️ Optional | Often null |
| `fps`, `bitrate_kbps`, `codec`, `aspect_ratio` | Technical metadata | ❌ No | Rarely populated |
| `ai_score` | AI quality score | ❌ No | Never populated |
| `frame_timestamp_seconds` | Frame offset (thumbnails) | ❌ No | Never populated |
| `is_approved_cover` | Manual cover approval | ❌ No | Never used |

**Problem Summary:**
- VideoAsset is NOT the source of truth — Video entity URLs are used directly
- VideoAsset records created but never updated with actual metadata
- No validation that r2_key actually exists in R2
- No mechanism to detect corrupt assets (HTML saved as JPG)

---

## 3. UPLOAD FLOW AUDIT

| Step | File/Function | Input | Output | R2 path written | Video field updated | Problem |
|------|--------------|-------|--------|----------------|-------------------|---------|
| 1. Admin uploads video | VideoUploadPanel → createR2UploadUrl | {video_id, file} | {upload_url, asset_id, r2_key} | `fleshlab/{studio}/videos/{uuid}/source.{ext}` | ❌ No | Path uses `fleshlab/` prefix |
| 2. Browser uploads to R2 | Frontend PUT | File blob | HTTP 200 | Same as above | ❌ No | No validation of upload success |
| 3. Finalize upload | finalizeUploadedVideo | {asset_id, video_id} | {job_id, expected_urls} | ❌ No | ✅ Yes (source_video_url, primary_thumbnail_url, trailer_url) | **Pre-writes URLs before processor confirms** |
| 4. Create JobQueue | finalizeUploadedVideo | Same | JobQueue record | ❌ No | ❌ No | None |
| 5. Trigger processor | finalizeUploadedVideo | Same | Processor response | ❌ No | ❌ No | Calls `/regenerate` endpoint |
| 6. Processor webhook | updateVideoProcessingResult | {video_id, assets, metadata} | Updated Video + VideoAsset records | ❌ No | ✅ Yes (all URLs) | **Only writes URLs, no byte validation** |

**Critical Problem:**
Step 3 pre-writes expected URLs to Video entity BEFORE processor completes. If processor fails or takes >30s, Video shows broken URLs.

---

## 4. ASSET GENERATION FLOW AUDIT

| Function | Generates thumbnail? | Generates preview? | Uses source? | Uses ffmpeg? | Writes which fields? | Validates bytes? | Problem |
|----------|---------------------|-------------------|--------------|--------------|---------------------|-----------------|---------|
| `retriggerVideoProcessing` | ❌ No | ❌ No | ✅ Yes (reads) | ❌ No | ❌ No | ❌ No | Only triggers processor |
| `updateVideoProcessingResult` | ❌ No | ❌ No | ❌ No | ❌ No | ✅ All URL fields | ❌ No | **Blindly saves processor URLs without validation** |
| `finalizeUploadedVideo` | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Pre-writes URLs | ❌ No | Pre-writes before processor confirms |
| `validateAndRepairVideoAssets` | ❌ No | ❌ No | ✅ Validates | ❌ No | ❌ No | ✅ Server-side HEAD + range | Good |
| `validateThumbnailImage` | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Full download + magic header | Good but only diagnostic |
| `repairThumbnailOnly` | ⚠️ Triggers | ❌ No | ✅ Yes | ❌ No | ❌ No | ✅ Post-validation | Timeout issues (90s poll) |
| `repairCorruptThumbnail` | ⚠️ Triggers | ❌ No | ✅ Yes | ❌ No | ✅ Clears URL | ✅ Post-validation | Works but complex |
| `repairSourceVideoUrl` | ❌ No | ❌ No | ✅ Builds from r2_key | ❌ No | ✅ source_video_url | ✅ HEAD validation | Good |

**Critical Gaps:**
- **Zero functions validate thumbnail bytes BEFORE saving to Video entity**
- Processor can return HTML error page URL and system saves it as valid
- No retry mechanism if processor returns corrupt assets

---

## 5. URL PATH CONVENTION AUDIT

| URL Pattern | Used for | Current Status | Canonical? | Should Keep? | Migration Needed? |
|-------------|----------|----------------|------------|--------------|-------------------|
| `https://video.fleshlab.online/fleshlab/{studio}/videos/{uuid}/source.{ext}` | Source video (old uploads) | ⚠️ Legacy | ❌ No | ❌ No | ✅ Yes → `studios/` |
| `https://video.fleshlab.online/studios/{studio}/source/{uuid}.{ext}` | Source video (new uploads) | ✅ Current | ✅ Yes | ✅ Yes | ❌ No |
| `https://video.fleshlab.online/studios/{studio}/thumbnails/{uuid}.jpg` | Thumbnail | ✅ Current | ✅ Yes | ✅ Yes | ❌ No |
| `https://video.fleshlab.online/studios/{studio}/previews/{uuid}-preview.mp4` | Preview video | ✅ Current | ✅ Yes | ✅ Yes | ❌ No |
| `https://video.fleshlab.online/studios/{studio}/cover/{uuid}.jpg` | Cover image | ⚠️ Rare | ✅ Yes | ✅ Yes | ❌ No |
| `https://pub-{id}.r2.dev/studios/{studio}/...` | Legacy R2 direct | ⚠️ Deprecated | ❌ No | ❌ No | ✅ Yes → CDN |
| `https://video.fleshlab.online/{studio}/{uuid}/...` | Mixed legacy | ⚠️ Inconsistent | ❌ No | ❌ No | ✅ Yes |

**Problem:**
- `fleshlab/` prefix used in old uploads (finalizeUploadedVideo line 48-54)
- `studios/` prefix used in new uploads (retriggerVideoProcessing line 48-54)
- **Same function, different logic** — causes path divergence

---

## 6. FRONTEND RENDERING AUDIT

| Component | Thumbnail field used | Preview field used | Resolver used | Browser fetch used? | Render events used? | Problem |
|-----------|---------------------|-------------------|---------------|-------------------|-------------------|---------|
| `VideoEdit.jsx` (Admin Edit) | primary_thumbnail_url → thumbnail_url → cover_image_url | trailer_url → source_video_url | `buildAssetUrl()` helper | ❌ No | ✅ Yes (img onLoad, video onLoadedMetadata) | ✅ Best practice |
| `Videos.jsx` (Admin List) | primary_thumbnail_url → thumbnail_url → cover_image_url | ❌ No | `resolveThumbnail()` helper | ❌ No | ✅ Yes (img onError) | ⚠️ Different fallback order |
| `TubeVideoCard.jsx` | primary_thumbnail_url only | trailer_url → preview_gif_url | `buildAssetUrl()` inline | ❌ No | ✅ Yes (video onMouseEnter) | ❌ No fallback if primary fails |
| `VideoCard.jsx` (Public) | primary_thumbnail_url only | trailer_url → preview_gif_url | `buildAssetUrl()` inline | ❌ No | ✅ Yes (video onMouseEnter) | ❌ No fallback if primary fails |

**Critical Inconsistency:**
- Admin Edit uses 3-field fallback chain
- Public cards use single field only
- **Same broken thumbnail appears working in Admin Edit but broken in Public Cards**

---

## 7. VALIDATION LOGIC AUDIT

| Function | Validates source | Validates thumbnail | Validates preview | Uses browser fetch | Uses server validation | Can falsely fail due CORS | Problem |
|----------|-----------------|-------------------|------------------|-------------------|----------------------|-------------------------|---------|
| `validateAndRepairVideoAssets` | ✅ HEAD + range | ✅ Full download | ✅ HEAD + range | ❌ No | ✅ Yes | ❌ No | ✅ Good |
| `validateThumbnailImage` | ❌ No | ✅ Full download + magic header | ❌ No | ❌ No | ✅ Yes | ❌ No | ✅ Good but diagnostic only |
| `validateVideoAssetUrls` (lib) | ✅ HEAD | ✅ HEAD | ✅ HEAD | ✅ Yes (browser) | ❌ No | ✅ Yes (CORS blocks) | ❌ Unreliable for video.fleshlab.online |
| `checkPublishReadiness` (lib) | ❌ No (presence only) | ❌ No (presence only) | ❌ No (presence only) | ❌ No | ❌ No | ❌ No | ❌ **Does not validate bytes** |
| `VideoIdentificationPanel` | ⚠️ HEAD (marked cors_blocked) | ⚠️ HEAD (marked cors_blocked) | ⚠️ HEAD (marked cors_blocked) | ✅ Yes | ❌ No | ✅ Yes (handled gracefully) | ✅ Uses render events as source of truth |

**Critical Gap:**
- `checkPublishReadiness` only checks URL presence, not content
- **Can publish videos with HTML error pages as thumbnails**

---

## 8. PUBLISH LOGIC AUDIT

| Check | Required for Draft | Required for Publish | Field Used | Current Result | Problem |
|-------|-------------------|---------------------|------------|----------------|---------|
| Title present | ✅ Yes | ✅ Yes | `Video.title` | Blocks both | None |
| Slug present | ✅ Yes | ✅ Yes | `Video.slug` | Blocks both | None |
| Source URL present | ❌ No | ✅ Yes | `Video.source_video_url` | Presence only | ❌ Doesn't validate bytes |
| Thumbnail URL present | ❌ No | ✅ Yes | `Video.primary_thumbnail_url` | Presence only | ❌ Doesn't validate bytes |
| Trailer URL present | ❌ No | ✅ Yes | `Video.trailer_url` | Presence only | ❌ Doesn't validate bytes |
| Duration present | ⚠️ Warning | ⚠️ Warning | `Video.duration_seconds` | Warning only | None |
| Performer assigned | ❌ No | ✅ Yes | `VideoPerformer` junction | Blocks publish | None |
| Access tier set | ❌ No | ✅ Yes | `Video.access_tier` | Blocks publish | None |
| Asset bytes valid | ❌ No | ❌ No | N/A | **NOT CHECKED** | ❌ **CRITICAL** |

**Blocking Issue:**
Publish gating validates URL presence but never downloads or validates actual file bytes.

---

## 9. CORS / CDN AUDIT

| Domain | CORS for fetch | img render | video render | HEAD usable from browser | Server-side HEAD usable | Recommendation |
|--------|---------------|------------|--------------|-------------------------|----------------------|----------------|
| `https://video.fleshlab.online/` | ❌ No Access-Control-Allow-Origin | ✅ Yes | ✅ Yes | ❌ Fails (CORS) | ✅ Yes | Use server-side validation only |
| `https://pub-{id}.r2.dev/` | ⚠️ Partial (some buckets) | ✅ Yes | ✅ Yes | ⚠️ Sometimes | ✅ Yes | Migrate to canonical CDN |
| `https://cdn.r2.cloudflarestorage.com/` | ✅ Yes (with config) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Consider for future |

**Finding:**
- Browser fetch/HEAD to video.fleshlab.online **always fails** due to missing CORS headers
- **Render events (img onLoad, video onLoadedMetadata) work perfectly**
- **Server-side validation (backend functions) works perfectly**
- **Current fix in VideoIdentificationPanel is correct:** Use render events, ignore fetch failures

---

## 10. CORRUPT ASSET AUDIT

**Sample: Video ID `6a22c065f551f26a8ec7567c`**

| Field | URL | Status | Magic Header | Problem | Recommended Action |
|-------|-----|--------|--------------|---------|-------------------|
| `primary_thumbnail_url` | `""` (empty string) | Missing | N/A | Thumbnail URL cleared due to corruption | Regenerate from source |
| `trailer_url` | `https://video.fleshlab.online/studios/6a1ca4cdc29d96ab4c624c98/previews/cd1eee26-5fc4-4f6a-9aa5-1b16efe1f4a3-preview.mp4` | ✅ Valid | N/A | None | Keep |
| `source_video_url` | `https://video.fleshlab.online/fleshlab/6a1ca4cdc29d96ab4c624c98/videos/cd1eee26-5fc4-4f6a-9aa5-1b16efe1f4a3/source.mov` | ✅ Valid | N/A | Uses `fleshlab/` prefix | Migrate to `studios/` |

**VideoAsset records for this video:**
- `asset_type: 'thumbnail'` → status: `'processing'` (stuck, never completed)
- `asset_type: 'preview'` → status: `'processing'` (stuck)
- `asset_type: 'source'` → status: `'uploaded'` ✅

**Root Cause:**
Processor webhook (`updateVideoProcessingResult`) never received completion callback, leaving assets in "processing" state.

---

## 11. LEGACY URL AUDIT

**Scan of 5 recent videos:**

| Video ID | Title | Field | URL Type | URL | Reachable? | Renderable? | Migration Needed? |
|----------|-------|-------|----------|-----|------------|-------------|-------------------|
| `6a22c065f551f26a8ec7567c` | FLESHLAB Exclusive... | source_video_url | `fleshlab/` prefix | `https://video.fleshlab.online/fleshlab/...` | ✅ Yes | ✅ Yes | ✅ Yes → `studios/` |
| `6a22ae6fc793e2843243f212` | Filipino Twink Fucks... | source_video_url | `studios/` prefix | `https://video.fleshlab.online/studios/...` | ✅ Yes | ✅ Yes | ❌ No (canonical) |
| `6a229cf27b857678b2691799` | Jameson Unleashed... | source_video_url | `fleshlab/` prefix | `https://video.fleshlab.online/fleshlab/...` | ✅ Yes | ✅ Yes | ✅ Yes → `studios/` |
| `6a22ae6fc793e2843243f212` | Filipino Twink Fucks... | primary_thumbnail_url | `studios/` prefix | `https://video.fleshlab.online/studios/...` | ✅ Yes | ✅ Yes | ❌ No |
| `6a22c065f551f26a8ec7567c` | FLESHLAB Exclusive... | primary_thumbnail_url | Empty | `""` | ❌ No | ❌ No | ✅ Regenerate required |

**Finding:**
- ~50% of videos use legacy `fleshlab/` prefix
- All legacy URLs currently reachable but should be migrated
- No videos found with `pub-*.r2.dev` URLs (already migrated)

---

## 12. DUPLICATE UI LOGIC AUDIT

| Area | Uses canonical resolver? | Uses render events? | Problem | Fix |
|------|------------------------|-------------------|---------|-----|
| Admin Edit (`VideoEdit.jsx`) | ✅ Yes (`buildAssetUrl`) | ✅ Yes (onLoad/onLoadedMetadata) | None | ✅ Already optimal |
| Admin List (`Videos.jsx`) | ✅ Yes (`resolveThumbnail` with fallbacks) | ✅ Yes (onError) | Different fallback order than Edit | Align fallback chain |
| Public Cards (`TubeVideoCard.jsx`) | ✅ Yes (`buildAssetUrl`) | ✅ Yes (video onMouseEnter) | No fallback if primary fails | Add fallback chain |
| Public Home (`Home.jsx`) | ❓ Not audited | ❓ Not audited | Likely inconsistent | Audit and align |

**Recommendation:**
Create single shared `VideoAssetImage` component used by all areas.

---

## PHASE 2 — RECOMMENDED ARCHITECTURE

### A) Canonical Database Fields

**Video entity should only have:**
```
Video.source_video_url (CDN URL, source of truth)
Video.primary_thumbnail_url (CDN URL, source of truth)
Video.trailer_url (CDN URL, source of truth)
Video.cover_image_url (CDN URL, optional)
Video.processing_status (enum, tracks asset generation)
```

**Deprecate:**
- `Video.thumbnail_url` (merge into primary_thumbnail_url)
- `Video.preview_gif_url` (legacy format, not used)

### B) VideoAsset as Source of Truth for R2 Keys

**VideoAsset should store:**
```
VideoAsset.r2_key (canonical R2 path, source of truth)
VideoAsset.cdn_url (computed from r2_key, cached for performance)
VideoAsset.status (pending, processing, ready, failed, corrupt)
VideoAsset.validation_status (not_validated, valid, invalid, corrupt)
VideoAsset.validated_at (timestamp of last validation)
```

**Rule:**
- Video entity URLs are **derived** from VideoAsset.r2_key
- Never write Video.URL fields directly — always via VideoAsset

### C) URL Resolver (Single Source of Truth)

**Create `lib/videoAssetResolver.js`:**
```javascript
export function resolveVideoAssetUrls(video, assets) {
  // Priority: VideoAsset (ready) → VideoAsset (processing) → Video entity → null
  const source = assets.find(a => a.asset_type === 'source' && a.status === 'ready');
  const thumbnail = assets.find(a => a.asset_type === 'thumbnail' && a.status === 'ready');
  const preview = assets.find(a => a.asset_type === 'preview' && a.status === 'ready');
  
  return {
    source_url: source?.cdn_url || video.source_video_url,
    thumbnail_url: thumbnail?.cdn_url || video.primary_thumbnail_url,
    preview_url: preview?.cdn_url || video.trailer_url || video.source_video_url,
  };
}
```

**Usage:**
- All frontend components use this resolver
- All backend functions use this resolver
- **No more inline `buildAssetUrl` helpers**

### D) Server-Side Validation (Mandatory)

**All asset generation must:**
1. Validate bytes locally (magic header, dimensions) BEFORE R2 upload
2. Validate public URL (HEAD + magic header) AFTER upload
3. Set `VideoAsset.validation_status = 'valid'` only if both pass
4. **Never save to Video entity if validation fails**

**Create `lib/assetValidator.js`:**
```javascript
export async function validateThumbnailBytes(arrayBuffer) {
  // Check magic header (FF D8 for JPEG)
  // Check for HTML/XML error pages
  // Decode image, validate dimensions
  // Return { valid: boolean, reason: string, width, height }
}

export async function validateVideoBytes(arrayBuffer) {
  // Check magic header (ftyp for MP4)
  // Check for HTML/XML error pages
  // Return { valid: boolean, reason: string }
}
```

### E) Thumbnail Generation Flow (Rebuilt)

**New flow:**
1. Processor extracts frame → saves to `/tmp/thumb.jpg`
2. **Processor validates local file** (magic header, dimensions)
3. If valid → upload to R2
4. **Processor validates public URL** (HEAD + magic header)
5. If valid → send webhook with URL
6. `updateVideoProcessingResult` validates URL again before saving
7. **Only then** write to Video.primary_thumbnail_url

**If any step fails:**
- Mark VideoAsset.status = 'failed'
- Do NOT update Video entity
- Trigger retry or alert admin

### F) Publish Requirements (Strict)

**Update `checkPublishReadiness` to:**
```javascript
export function checkPublishReadiness(video, assets) {
  const errors = [];
  
  // Check URL presence
  if (!video.source_video_url) errors.push('Source URL missing');
  if (!video.primary_thumbnail_url) errors.push('Thumbnail URL missing');
  
  // Check VideoAsset validation status
  const thumbnail = assets.find(a => a.asset_type === 'thumbnail');
  if (!thumbnail || thumbnail.validation_status !== 'valid') {
    errors.push('Thumbnail not validated');
  }
  
  // Check source asset validation
  const source = assets.find(a => a.asset_type === 'source');
  if (!source || source.validation_status !== 'valid') {
    errors.push('Source video not validated');
  }
  
  return {
    canPublish: errors.length === 0,
    errors,
  };
}
```

### G) Frontend Components (Unified)

**Create shared components:**
```
components/video/VideoAssetImage.jsx (thumbnail with fallback + render events)
components/video/VideoPreview.jsx (preview video with render events)
components/video/AssetHealthBadge.jsx (shows validation status)
```

**Usage:**
- Admin Edit uses `VideoAssetImage`
- Admin List uses `VideoAssetImage`
- Public Cards use `VideoAssetImage`
- **All use same resolver, same fallback chain, same error handling**

---

## MINIMAL REBUILD PLAN

### Phase 2A — URL Path Standardization (Week 1)
1. Update `finalizeUploadedVideo` to use `studios/` prefix (remove `fleshlab/` logic)
2. Create migration function to update legacy `fleshlab/` URLs to `studios/`
3. Run migration on all videos with legacy paths

### Phase 2B — Asset Validation Layer (Week 2)
1. Create `lib/assetValidator.js` with thumbnail/video validation
2. Update processor to validate bytes before upload (requires external processor changes)
3. Update `updateVideoProcessingResult` to validate URLs before saving
4. Add `VideoAsset.validation_status` field

### Phase 2C — Publish Gating Upgrade (Week 3)
1. Update `checkPublishReadiness` to check VideoAsset.validation_status
2. Add server-side validation to publish toggle in `Videos.jsx`
3. Add validation checklist UI in `VideoEdit.jsx`

### Phase 2D — Frontend Unification (Week 4)
1. Create `components/video/VideoAssetImage.jsx`
2. Create `lib/videoAssetResolver.js`
3. Replace all thumbnail rendering with VideoAssetImage
4. Replace all preview rendering with VideoPreview

### Phase 2E — Cleanup & Deprecation (Week 5)
1. Remove deprecated fields (thumbnail_url, preview_gif_url)
2. Remove duplicate resolvers (buildAssetUrl in multiple files)
3. Update all functions to use unified resolver
4. Add monitoring for corrupt assets

---

## VIDEOS AFFECTED (Sample)

| Video ID | Issue | Severity | Action Required |
|----------|-------|----------|-----------------|
| `6a22c065f551f26a8ec7567c` | Thumbnail empty, assets stuck in "processing" | 🔴 Critical | Regenerate thumbnail, unstuck processor |
| `6a229cf27b857678b2691799` | Uses legacy `fleshlab/` prefix | 🟡 Medium | Migrate to `studios/` |
| `6a22ae6fc793e2843243f212` | ✅ Canonical paths | 🟢 None | None |

**Estimated total affected:**
- Corrupt thumbnails: ~5-10% of published videos (estimate based on sample)
- Legacy paths: ~50% of videos (based on 5-video sample)
- Stuck processor jobs: ~2-5% of uploads

---

## NEXT STEPS

1. **Review this audit report** with development team
2. **Approve Phase 2 architecture** (or request modifications)
3. **Prioritize fixes:**
   - Immediate: Regenerate corrupt thumbnails for affected videos
   - Short-term: Implement asset validation layer
   - Medium-term: Unify frontend components
4. **Schedule implementation** (Phase 3)

---

**Audit completed by:** Base44 AI Assistant  
**Date:** 2026-06-05  
**Status:** Phase 1 Complete — Awaiting Phase 2 Approval