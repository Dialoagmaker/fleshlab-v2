# UPLOAD FINALIZATION FIX - LIVE TEST RESULTS

**Test Date**: 2026-06-05  
**Video ID**: `6a231adb60c0314bd765b684`  
**Fix Applied**: Added `callback_url` to processor webhook payload  

---

## ✅ FIX VERIFICATION

### Before Fix:

| Metric | Value |
|--------|-------|
| Processor Response | ❌ 400 Bad Request |
| Error Message | `{"error":"callback_url required"}` |
| Job Status | `failed` |
| source_video_url | ❌ NULL |
| processing_status | ❌ NULL |
| Thumbnail URL | ❌ NULL |
| Preview URL | ❌ NULL |

### After Fix:

| Metric | Value |
|--------|-------|
| Processor Response | ✅ 202 Accepted |
| Error Message | ✅ NULL (no error) |
| Job Status | ✅ `running` |
| source_video_url | ✅ `https://video.fleshlab.online/.../source.mp4` |
| processing_status | ✅ `processing` |
| Thumbnail URL | ⏳ Pending (processor callback) |
| Preview URL | ⏳ Pending (processor callback) |

---

## 🔧 CODE CHANGES

### File: `functions/finalizeUploadedVideo`

#### Change 1: Added callback_url to Processor Payload

**Lines 119-133**:

```javascript
// Build callback URL with processor key for authentication
const callbackUrl = `${Deno.env.get('APP_BASE_URL')}/functions/updateVideoProcessingResult?processor_key=${encodeURIComponent(processorSecret)}`;

// Trigger processor
const processorPayload = {
  secret: processorSecret,
  studio,
  file,
  src_url: sourceSignedUrl,
  video_id,
  source_asset_id: asset_id,
  job_id: job.id,
  callback_url: callbackUrl,        // ✅ ADDED
  regenerate_only: "full",          // ✅ ADDED
};
```

#### Change 2: Set source_video_url After Upload

**Lines 165-170**:

```javascript
// Update video processing_status and set source_video_url from the uploaded asset
// This ensures the Video entity has the source URL even before processor callback
await base44.entities.Video.update(video_id, {
  processing_status: 'processing',
  source_video_url: asset.cdn_url || `https://${Deno.env.get('R2_PUBLIC_BUCKET_URL')}/${asset.r2_key}`,
});
```

---

## 📊 LIVE TEST RESULTS

### Test Execution:

```
19:04:51.121 — JobQueue created (status: queued)
19:04:51.727 — Processor accepted job (HTTP 202)
19:04:51.727 — Job status updated to 'running'
19:04:51.687 — Video.source_video_url set
19:04:51.687 — Video.processing_status set to 'processing'
```

### Current State (Post-Fix):

**Video Entity**:
```json
{
  "id": "6a231adb60c0314bd765b684",
  "title": "Filipino Twink's Huge Cock Gets Sucked Hard by Slim Asian Boy",
  "source_video_url": "https://video.fleshlab.online/fleshlab/6a1ca4cdc29d96ab4c624c98/videos/910b6a4b-0f91-4c97-b499-c4b49b717951/source.mp4",
  "processing_status": "processing",
  "status": "draft",
  "primary_thumbnail_url": null,  // ⏳ Will be set by processor callback
  "trailer_url": null             // ⏳ Will be set by processor callback
}
```

**JobQueue Entity**:
```json
{
  "id": "6a231dd3fae8177948b5b175",
  "job_type": "process_video",
  "status": "running",
  "entity_id": "6a231adb60c0314bd765b684",
  "started_at": "2026-06-05T19:04:51.727Z",
  "error_message": null
}
```

**VideoAsset Entities**:
```json
[
  {
    "id": "6a231adce61822e275da3d88",
    "video_id": "6a231adb60c0314bd765b684",
    "asset_type": "source",
    "r2_key": "fleshlab/6a1ca4cdc29d96ab4c624c98/videos/910b6a4b-0f91-4c97-b499-c4b49b717951/source.mp4",
    "cdn_url": "https://video.fleshlab.online/.../source.mp4",
    "status": "uploaded",
    "file_size_bytes": 1651393344
  }
]
```

---

## ✅ ACCEPTANCE CRITERIA

| Criterion | Status | Evidence |
|-----------|--------|----------|
| finalizeUploadedVideo includes callback_url | ✅ PASS | Lines 119-133 |
| No processor 400 "callback_url required" | ✅ PASS | Processor returned HTTP 202 |
| source_video_url is set after finalization | ✅ PASS | Video.source_video_url populated |
| Broken upload draft can be repaired | ✅ PASS | Job status: running |
| Processor callback reaches updateVideoProcessingResult | ⏳ PENDING | Callback expected within 30-300s |
| primary_thumbnail_url written after validation | ⏳ PENDING | Will be set by callback |
| trailer_url written after validation | ⏳ PENDING | Will be set by callback |
| No duplicate source asset created | ✅ PASS | Only 1 source VideoAsset exists |
| No R2 files deleted | ✅ PASS | Source file still exists |

---

## 📋 COMPARISON TABLE

### Before vs After Fix:

| Video ID | Source VideoAsset Exists | source_video_url Restored | Processor Job ID | Callback URL | Processor Response | Job Status | Thumbnail URL | Preview URL | Result |
|----------|-------------------------|---------------------------|------------------|--------------|-------------------|------------|---------------|-------------|--------|
| 6a231adb60c0314bd765b684 | ✅ YES | ✅ YES | 6a231dd3fae8177948b5b175 | ✅ YES | ✅ 202 Accepted | ✅ running | ⏳ pending | ⏳ pending | ✅ FIX SUCCESSFUL |

### Previous Failed Attempt (Before Fix):

| Video ID | Source VideoAsset Exists | source_video_url | Processor Job ID | Callback URL | Processor Response | Job Status | Result |
|----------|-------------------------|------------------|------------------|--------------|-------------------|------------|--------|
| 6a231adb60c0314bd765b684 | ✅ YES | ❌ NULL | 6a231be904ba6ccf75dac931 | ❌ NO | ❌ 400 Bad Request | ❌ failed | ❌ FAILED |

---

## 🎯 NEXT STEPS

### Immediate (Automated):

1. **Processor generates thumbnail** (expected: 30-60 seconds)
2. **Processor generates preview** (expected: 60-180 seconds)
3. **Processor validates assets** (expected: 10-30 seconds)
4. **Processor calls callback URL** with results
5. **updateVideoProcessingResult writes URLs** to Video entity
6. **JobQueue status updated** to `completed`

### Manual Verification (After Callback):

```javascript
// Check Video entity
const video = await base44.entities.Video.get('6a231adb60c0314bd765b684');
console.log({
  source_video_url: video.source_video_url,        // Should be set
  primary_thumbnail_url: video.primary_thumbnail_url, // Should be set by callback
  trailer_url: video.trailer_url,                     // Should be set by callback
  processing_status: video.processing_status,         // Should be 'metadata_pending' or 'draft_ready'
});

// Check JobQueue
const job = await base44.entities.JobQueue.get('6a231dd3fae8177948b5b175');
console.log({
  status: job.status,              // Should be 'completed'
  callback_received_at: job.callback_received_at, // Should be set
  result: job.result,              // Should contain validation report
});

// Check VideoAssets (should have 3-4 now)
const assets = await base44.entities.VideoAsset.filter({ video_id: '6a231adb60c0314bd765b684' });
console.log(assets.map(a => ({ asset_type: a.asset_type, status: a.status })));
// Expected: source (uploaded), thumbnail (ready), preview (ready), cover (ready)
```

---

## 🚨 MONITORING

### Expected Callback Timeline:

```
T+0s:   Processor receives job (HTTP 202)
T+30s:  Thumbnail generated
T+60s:  Preview generated
T+90s:  Cover generated
T+120s: Assets validated
T+150s: Callback sent to updateVideoProcessingResult
T+151s: Video entity updated with URLs
T+152s: JobQueue marked as completed
```

### If Callback Fails:

1. **Check processor logs** for errors
2. **Check callback URL accessibility** (must be public)
3. **Verify PROCESSOR_API_KEY** matches in both places
4. **Check updateVideoProcessingResult** function logs
5. **Retry manually** if needed:
   ```javascript
   await base44.functions.invoke('finalizeUploadedVideo', {
     video_id: '6a231adb60c0314bd765b684',
     asset_id: '6a231adce61822e275da3d88'
   });
   ```

---

## 📝 SUMMARY

**Problem**: Processor webhook missing `callback_url` parameter, causing 400 error and leaving videos in broken state.

**Fix**: Added `callback_url` and `regenerate_only: "full"` to processor payload, plus set `source_video_url` immediately after upload.

**Result**: Broken upload draft successfully recovered, processor job now running, source URL restored.

**Status**: ✅ **FIX DEPLOYED AND VERIFIED** — Awaiting processor callback to complete thumbnail/preview generation.

---

**Report Generated**: 2026-06-05  
**Fix Applied**: functions/finalizeUploadedVideo  
**Test Video**: 6a231adb60c0314bd765b684  
**Status**: Running (callback pending)