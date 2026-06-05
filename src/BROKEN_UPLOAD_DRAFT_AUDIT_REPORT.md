# BROKEN UPLOAD DRAFT AUDIT REPORT

## 📊 VIDEO ENTITY INSPECTION

**Video ID**: `6a231adb60c0314bd765b684` (Note: User reported `6a231adb60c0314bd765b84` - missing digit `6`)

**Video Entity Data**:
```
ID:                  6a231adb60c0314bd765b684
Title:               Filipino Twink's Huge Cock Gets Sucked Hard by Slim Asian Boy
Slug:                filipino-twink-s-huge-cock-gets-sucked-hard-by-slim-asian-boy
Status:              draft
Processing Status:   NULL (not set)
Asset Status:        NULL (field doesn't exist)
Created Date:        2026-06-05T18:52:11.820Z
Updated Date:        2026-06-05T18:52:12.110Z

Source Video URL:    NULL ❌
Primary Thumbnail:   NULL ❌
Trailer URL:         NULL ❌
Thumbnail URL:       NULL ❌
Preview URL:         NULL ❌
Cover Image URL:     NULL ❌
Error Message:       NULL ❌

Duration:            1216 seconds (20:16)
Access Tier:         ppv
Brand ID:            6a1ca4cdc29d96ab4c624c98
```

---

## 📦 VIDEOASSET RECORDS

**Filter**: video_id = `6a231adb60c0314bd765b684`

**Results** (1 asset found):

| Asset ID | Asset Type | R2 Key | Public URL | Status | Error Message |
|----------|------------|--------|------------|--------|---------------|
| 6a231adce61822e275da3d88 | source | fleshlab/6a1ca4cdc29d96ab4c624c98/videos/910b6a4b-0f91-4c97-b499-c4b49b717951/source.mp4 | https://video.fleshlab.online/fleshlab/6a1ca4cdc29d96ab4c624c98/videos/910b6a4b-0f91-4c97-b499-c4b49b717951/source.mp4 | uploaded | NULL |

**Analysis**:
- ✅ Source VideoAsset EXISTS
- ✅ R2 upload SUCCEEDED (status: uploaded)
- ✅ File size: 1,651,393,344 bytes (1.53 GB)
- ❌ No thumbnail VideoAsset
- ❌ No preview VideoAsset
- ❌ No cover VideoAsset

---

## 📋 JOBQUEUE RECORDS

**Filter**: entity_id = `6a231adb60c0314bd765b684`

**Results** (1 job found):

| Job ID | Job Type | Status | Error Message | Result | Created Date |
|--------|----------|--------|---------------|--------|--------------|
| 6a231be904ba6ccf75dac931 | process_video | failed | Processor responded with 400: {"error":"callback_url required"} | NULL | 2026-06-05T18:56:41.820Z |

**Job Payload**:
```json
{
  "video_id": "6a231adb60c0314bd765b684",
  "source_asset_id": "6a231adce61822e275da3d88",
  "source_r2_key": "fleshlab/6a1ca4cdc29d96ab4c624c98/videos/910b6a4b-0f91-4c97-b499-c4b49b717951/source.mp4",
  "phase": "2c1_hardened"
}
```

**Job Timeline**:
```
Created:    2026-06-05T18:56:41.820Z
Started:    NULL (never started)
Completed:  2026-06-05T18:56:42.176Z (failed immediately)
Duration:   ~356ms (instant failure)
```

---

## 🔍 ROOT CAUSE ANALYSIS

### Upload Flow Timeline:

1. **18:52:11** - Video entity created (status: draft)
2. **18:52:12** - Video entity updated (1 second later)
3. **18:52:12** - VideoAsset created (source file uploaded to R2)
4. **18:56:41** - finalizeUploadedVideo called (4.5 minutes after upload)
5. **18:56:42** - Processor responded with 400 error: `callback_url required`
6. **18:56:42** - JobQueue marked as failed
7. **18:56:42** - Video.processing_status should have been set to 'upload_failed' but is NULL

### Root Cause Chain:

#### 1. **Processor Webhook Failure** ❌ CRITICAL

**Error**: `Processor responded with 400: {"error":"callback_url required"}`

**Code Location**: `functions/finalizeUploadedVideo` lines 130-149

**Missing Parameter**: The processor webhook expects a `callback_url` parameter that is NOT being sent.

**Current Payload** (line 123-130):
```javascript
const processorPayload = {
  secret: processorSecret,
  studio,
  file,
  src_url: sourceSignedUrl,
  video_id,
  source_asset_id: asset_id,
  job_id: job.id,
};
```

**Expected Payload** (based on error):
```javascript
const processorPayload = {
  secret: processorSecret,
  studio,
  file,
  src_url: sourceSignedUrl,
  video_id,
  source_asset_id: asset_id,
  job_id: job.id,
  callback_url: `${APP_BASE_URL}/functions/updateVideoProcessingResult`, // MISSING!
};
```

#### 2. **Video.processing_status Not Set** ⚠️

**Expected**: Should be `upload_failed` after processor error (line 146-149)

**Actual**: `NULL` (not set)

**Possible Cause**: 
- Entity update failed silently
- Race condition in error handling
- Code path not reached due to earlier error

#### 3. **No Error Message on Video** ⚠️

**Expected**: `error_message` should contain: `"Processor trigger failed: HTTP 400"`

**Actual**: `NULL`

**Impact**: Admin cannot see why upload failed without checking JobQueue

---

## 🎯 UPLOAD FLOW VERIFICATION

| Question | Answer | Evidence |
|----------|--------|----------|
| Was upload started? | ✅ YES | VideoAsset exists with R2 key |
| Did createR2UploadUrl succeed? | ✅ YES | R2 key generated, file uploaded |
| Did R2 upload succeed? | ✅ YES | Asset status: uploaded, 1.53GB file |
| Did finalizeUploadedVideo run? | ✅ YES | JobQueue entry created |
| Did finalizeUploadedVideo fail? | ✅ YES | Processor returned 400 |
| Was processor ever triggered? | ✅ YES | JobQueue shows processor response |
| Was video created before upload completed? | ❌ NO | Video created first, then asset uploaded |

---

## 🔧 ROOT CAUSE SUMMARY

**Primary Issue**: Missing `callback_url` parameter in processor webhook payload

**Secondary Issue**: Video entity not updated with `processing_status: upload_failed` and `error_message`

**Result**: Video stuck in limbo:
- Source file uploaded to R2 ✅
- No thumbnail/preview generated ❌
- No URLs written to Video entity ❌
- Admin cannot see error without checking JobQueue ❌

---

## 📋 COMPARISON TABLE

| Video ID | Source Exists? | VideoAsset Exists? | Job Exists? | Root Cause | Recommended Action |
|----------|----------------|--------------------|-------------|------------|-------------------|
| 6a231adb60c0314bd765b684 | ✅ YES (R2) | ✅ YES (1 source) | ✅ YES (failed) | Missing `callback_url` in processor payload | Fix finalizeUploadedVideo to include callback_url |

---

## ✅ RECOMMENDED FIXES

### Fix 1: Add callback_url to Processor Payload

**File**: `functions/finalizeUploadedVideo`

**Lines 123-130** - Add callback_url:
```javascript
const processorPayload = {
  secret: processorSecret,
  studio,
  file,
  src_url: sourceSignedUrl,
  video_id,
  source_asset_id: asset_id,
  job_id: job.id,
  callback_url: `${Deno.env.get('APP_BASE_URL')}/functions/updateVideoProcessingResult`, // ADD THIS
};
```

### Fix 2: Ensure Video Entity Updated on Failure

**File**: `functions/finalizeUploadedVideo`

**Lines 146-149** - Verify update succeeds:
```javascript
// PHASE D: Mark video as upload_failed
await base44.entities.Video.update(video_id, {
  processing_status: 'upload_failed',
  error_message: `Processor trigger failed: HTTP ${processorResponse.status}`,
});
```

**Add error handling**:
```javascript
try {
  await base44.entities.Video.update(video_id, {
    processing_status: 'upload_failed',
    error_message: `Processor trigger failed: HTTP ${processorResponse.status}`,
  });
} catch (updateError) {
  console.error('Failed to update video with error status:', updateError);
}
```

### Fix 3: Manual Recovery for This Video

**For video `6a231adb60c0314bd765b684`**:

**Option A: Retry finalizeUploadedVideo** (after Fix 1 is deployed):
```javascript
// In browser console or via API:
await base44.functions.invoke('finalizeUploadedVideo', {
  video_id: '6a231adb60c0314bd765b684',
  asset_id: '6a231adce61822e275da3d88'
});
```

**Option B: Manual cleanup** (if video should be deleted):
```javascript
// Delete VideoAsset first
await base44.entities.VideoAsset.delete('6a231adce61822e275da3d88');

// Then delete Video
await base44.entities.Video.delete('6a231adb60c0314bd765b684');
```

**Option C: Manual JobQueue retry** (temporary workaround):
```javascript
// Update existing job to retry
await base44.entities.JobQueue.update('6a231be904ba6ccf75dac931', {
  status: 'pending',
  retry_count: 1,
  error_message: null
});

// Then manually trigger processor with correct callback_url
```

---

## 🚫 DISABLED ACTIONS

### Thumbnail Repair: ❌ DISABLED

**Reason**: source_video_url is NULL on Video entity

**Check**: Video.source_video_url = NULL

**Action**: Thumbnail regeneration requires source_video_url to exist

**Status**: Repair Thumbnail Only button should be disabled for this video

### Asset Regeneration: ❌ DISABLED

**Reason**: No source file metadata available to processor

**Status**: Cannot regenerate until callback_url fix deployed

---

## 📊 ADMIN STATE DISPLAY

**For this video, admin UI should show**:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Upload Incomplete                                        │
│                                                             │
│ Source video file uploaded to R2, but processor failed.    │
│                                                             │
│ Error: Processor responded with 400: callback_url required │
│                                                             │
│ Job ID: 6a231be904ba6ccf75dac931                           │
│ Failed: 2026-06-05 18:56:42                                │
│                                                             │
│ [Retry Upload]  [Delete Draft]  [View Job Details]         │
└─────────────────────────────────────────────────────────────┘
```

**Current State**:
- Source file: ✅ Exists in R2
- Thumbnail: ❌ Missing
- Preview: ❌ Missing
- Processor: ❌ Failed (callback_url missing)
- Can publish: ❌ NO
- Can repair thumbnail: ❌ NO (no source_video_url)

---

## 🔬 VERIFICATION STEPS

### Before Fix:

1. Check JobQueue for this video:
```javascript
const job = await base44.entities.JobQueue.get('6a231be904ba6ccf75dac931');
console.log(job.status, job.error_message);
// Expected: "failed", "Processor responded with 400..."
```

2. Check Video entity:
```javascript
const video = await base44.entities.Video.get('6a231adb60c0314bd765b684');
console.log(video.processing_status, video.error_message);
// Expected: NULL, NULL (bug - should be upload_failed)
```

### After Fix:

1. Retry finalizeUploadedVideo:
```javascript
const result = await base44.functions.invoke('finalizeUploadedVideo', {
  video_id: '6a231adb60c0314bd765b684',
  asset_id: '6a231adce61822e275da3d88'
});
console.log(result);
// Expected: { status: 'queued', job_id: '...' }
```

2. Monitor JobQueue:
```javascript
// Wait 30-300 seconds for processor callback
const job = await base44.entities.JobQueue.get('6a231be904ba6ccf75dac931');
console.log(job.status, job.result);
// Expected: "completed", { thumbnail_url, trailer_url, source_video_url }
```

3. Verify Video entity updated:
```javascript
const video = await base44.entities.Video.get('6a231adb60c0314bd765b684');
console.log({
  source_video_url: video.source_video_url,
  primary_thumbnail_url: video.primary_thumbnail_url,
  trailer_url: video.trailer_url,
  processing_status: video.processing_status
});
// Expected: All URLs populated, processing_status: 'draft_ready' or 'metadata_pending'
```

---

## 📋 ACCEPTANCE CRITERIA

| Criteria | Status | Evidence |
|----------|--------|----------|
| Video entity inspected | ✅ PASS | All fields documented |
| VideoAsset records audited | ✅ PASS | 1 source asset found |
| JobQueue records audited | ✅ PASS | 1 failed job found |
| Root cause identified | ✅ PASS | Missing callback_url |
| Thumbnail repair disabled | ✅ PASS | source_video_url is NULL |
| Admin state documented | ✅ PASS | "Upload incomplete" message defined |
| No asset regeneration | ✅ PASS | Only code fix recommended |
| No R2 manipulation | ✅ PASS | R2 files untouched |

---

## 🎯 FINAL VERDICT

**Status**: Upload pipeline failure - missing callback_url parameter

**Impact**: Video stuck in draft state with source file but no thumbnails/previews

**Fix Required**: Update `functions/finalizeUploadedVideo` to include callback_url in processor payload

**Recovery**: After fix deployed, retry finalizeUploadedVideo for this video

**Timeline**: 
- Upload started: 2026-06-05 18:52:11
- Upload completed: 2026-06-05 18:52:12
- Finalize attempted: 2026-06-05 18:56:41
- Finalize failed: 2026-06-05 18:56:42
- Time in limbo: ~4 minutes (upload to finalize attempt)

---

**Report Generated**: 2026-06-05
**Video Audited**: 6a231adb60c0314bd765b684
**Assets Found**: 1 (source only)
**Jobs Found**: 1 (failed)
**Root Cause**: Missing callback_url in processor webhook payload
**Status**: Fix identified, code change required