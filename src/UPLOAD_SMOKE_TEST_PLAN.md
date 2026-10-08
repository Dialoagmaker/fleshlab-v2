# UPLOAD PIPELINE SMOKE TEST PLAN

## Test Execution Instructions

**Important**: These tests require manual execution in the browser console with DevTools open (Network tab).

---

## Test A — Oversized File (>10GB)

**Purpose**: Verify client-side file size validation blocks oversized files before any backend call.

**Test File**: Use a mock file or modify file.size in browser console to simulate >10GB

**Steps**:
1. Navigate to `/admin/video-upload` or `/admin/draft-review`
2. Open Browser DevTools → Network tab
3. Filter: `createR2UploadUrl`
4. Select a video file OR simulate large file in console:
   ```javascript
   // In browser console, after file selection:
   file.size = 11 * 1024 * 1024 * 1024; // 11GB
   ```
5. Attempt upload

**Expected**:
- ❌ No `POST /functions/createR2UploadUrl` request
- ❌ No `POST /functions/createR2UploadUrl-1` request
- ❌ No Video entity created
- ✅ Toast error: "File too large. Maximum allowed size is 10 GB. Your file is X.XX GB."
- ✅ Network tab shows 0 requests to createR2UploadUrl

**Pass Criteria**:
- [ ] Zero backend calls made
- [ ] Clear error message shown
- [ ] No Video record created

---

## Test B — Valid File (<10GB)

**Purpose**: Verify complete upload flow works correctly

**Test File**: Small MP4 file (10-50MB recommended)

**Steps**:
1. Navigate to `/admin/video-upload`
2. Open Browser DevTools → Network tab
3. Fill in required fields (Title, Description, Access Tier)
4. Select small video file
5. Watch upload progress

**Expected Network Calls**:
```
POST /functions/createR2UploadUrl → 200 OK
PUT <R2 signed URL> → 200 OK
POST /functions/finalizeUploadedVideo → 200 OK
```

**Expected Behavior**:
- ✅ Only `createR2UploadUrl` called (NOT `createR2UploadUrl-1`)
- ✅ createR2UploadUrl returns 200 with:
  ```json
  {
    "video_id": "...",
    "asset_id": "...",
    "r2_key": "...",
    "upload_url": "https://...",
    "cdn_url": "https://...",
    "expires_in": 3600
  }
  ```
- ✅ R2 PUT upload succeeds
- ✅ finalizeUploadedVideo returns 200 with:
  ```json
  {
    "status": "queued",
    "job_id": "...",
    "message": "Upload verified. Processor job queued..."
  }
  ```
- ✅ Video.processing_status = "processing"
- ✅ Video.source_video_url = CDN URL (after processor callback)
- ✅ NO fake thumbnail/trailer URLs written before callback

**Pass Criteria**:
- [ ] No createR2UploadUrl-1 requests in Network tab
- [ ] createR2UploadUrl returns 200
- [ ] R2 upload succeeds
- [ ] finalizeUploadedVideo succeeds
- [ ] Video created with processing_status="processing"
- [ ] No fake URLs before processor callback

---

## Test C — Broken Draft Detection

**Purpose**: Verify broken drafts (no source video) show proper error UI

**Test Video**: Existing broken video with `source_video_url=null`

**Steps**:
1. Navigate to `/admin/videos/{broken_video_id}`
2. Observe page load

**Expected UI**:
- ✅ Red Alert banner at top:
  ```
  ⚠️ Upload Failed: This video has no source video URL. 
  Assets were not created.
  Error: {error_message from backend}
  [Retry Upload] [Delete Video]
  ```
- ✅ "Retrigger Assets" section visible but repair buttons may be disabled
- ✅ Publish button disabled OR shows "Cannot Publish (1 issues)"
- ✅ Publishing Checklist shows:
  - ❌ Source video URL missing
  - ❌ Thumbnail URL missing
  - ❌ Trailer URL missing

**Expected Network Calls**:
- None on page load (diagnostic only, no auto-repair)

**Pass Criteria**:
- [ ] Upload Failed alert visible
- [ ] Error message from backend shown
- [ ] Retry/Delete buttons visible
- [ ] Video not publishable
- [ ] Repair buttons disabled if no source_video_url

---

## Code Verification

### Search Frontend Code

Run in terminal:
```bash
grep -r "createR2UploadUrl-1" src/
```

**Expected**: Zero results

### Check Function Invocation

Search for all function invocations:
```bash
grep -r "functions.invoke" src/components/admin/VideoUploadPanel.jsx
```

**Expected**:
```javascript
base44.functions.invoke('createR2UploadUrl', {...})
base44.functions.invoke('finalizeUploadedVideo', {...})
```

**NOT Expected**:
```javascript
base44.functions.invoke('createR2UploadUrl-1', {...}) // Should NOT exist
```

---

## Acceptance Criteria Checklist

### Code-Level:
- [ ] Zero references to `createR2UploadUrl-1` in frontend code
- [ ] File size validation exists in VideoUploadPanel.jsx (line 265-272)
- [ ] Structured error messages in onError handler (line 188-207)

### Runtime (Test A - Oversized):
- [ ] No createR2UploadUrl request in Network tab
- [ ] No createR2UploadUrl-1 request in Network tab
- [ ] Toast error: "File too large. Maximum allowed size is 10 GB..."
- [ ] No Video entity created in database

### Runtime (Test B - Valid):
- [ ] Only createR2UploadUrl called (no -1 suffix)
- [ ] createR2UploadUrl returns 200 OK
- [ ] R2 upload succeeds (PUT request → 200)
- [ ] finalizeUploadedVideo succeeds (200 OK)
- [ ] Video.processing_status = "processing"
- [ ] No fake thumbnail/trailer URLs before callback

### Runtime (Test C - Broken Draft):
- [ ] Upload Failed alert visible
- [ ] error_message from backend displayed
- [ ] Retry/Delete buttons functional
- [ ] Video not publishable
- [ ] Repair buttons disabled if no source_video_url

---

## Common Issues & Troubleshooting

### Issue: createR2UploadUrl-1 appears in console
**Cause**: Base44 deployment versioning (automatic suffix)
**Fix**: Ignore - this is Base44's internal deployment tracking, not a bug. The frontend calls `createR2UploadUrl` correctly.

### Issue: 404 on createR2UploadUrl
**Cause**: Function not deployed or renamed
**Fix**: Check functions/createR2UploadUrl exists and is deployed

### Issue: 400 on finalizeUploadedVideo
**Cause**: R2 file not found or processor unreachable
**Fix**: Check R2 credentials and PROCESSOR_WEBHOOK_URL secret

### Issue: Broken draft shows no alert
**Cause**: Video.processing_status not set to 'upload_failed'
**Fix**: Check finalizeUploadedVideo sets status on errors

---

## Test Results Template

```markdown
### Test A — Oversized File
- Expected: Blocked client-side, no backend calls
- Actual: [PASS/FAIL]
- Notes: ...

### Test B — Valid File
- Expected: Full flow succeeds
- Actual: [PASS/FAIL]
- Network calls observed:
  - createR2UploadUrl: [200/404/400]
  - createR2UploadUrl-1: [Not called/404]
  - R2 PUT: [200/403/404]
  - finalizeUploadedVideo: [200/502]
- Notes: ...

### Test C — Broken Draft
- Expected: Upload Failed alert visible
- Actual: [PASS/FAIL]
- UI elements visible: [Alert/Retry/Delete]
- Notes: ...

### Code Verification
- createR2UploadUrl-1 references: [0/FOUND]
- File size validation: [EXISTS/MISSING]
- Structured errors: [EXISTS/MISSING]
```

---

**Report Generated**: 2026-06-05
**Status**: Ready for manual execution
**Next Step**: Run tests in browser with DevTools open