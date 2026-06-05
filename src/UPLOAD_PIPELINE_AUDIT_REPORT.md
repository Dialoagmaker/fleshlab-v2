# UPLOAD PIPELINE AUDIT REPORT

## PHASE A — AUDIT FINDINGS

### Area | File/Function | Current Logic | Problem | Fix Needed

**1. Upload URL Function** | `functions/createR2UploadUrl` | Creates Video + VideoAsset BEFORE R2 upload succeeds | ✅ EXISTS and works | None - function is correct

**2. Function Naming** | Frontend calls `createR2UploadUrl` | Console shows `createR2UploadUrl-1` also being called | ❌ Base44 auto-creates `-1` suffix when duplicate deployment detected | Investigate duplicate deployments

**3. File Size Validation** | Backend validates 10GB limit | No CLIENT-SIDE validation | ❌ Files >10GB reach backend, return generic 400 | Add client-side file size check in VideoUploadPanel

**4. Video Creation Timing** | `createR2UploadUrl` line 70 | Creates Video entity BEFORE R2 upload | ⚠️ BY DESIGN (needed for tracking) | Add error handling to mark failed uploads

**5. Finalization** | `functions/finalizeUploadedVideo` | Only runs after successful R2 upload | ✅ CORRECT | None

**6. Failed Upload Cleanup** | No cleanup logic | Failed uploads leave Video with status='draft', no source_video_url | ❌ Broken drafts remain | Add upload_failed status handling

**7. Missing Function** | `getR2BucketName` | Referenced in VideoUploadTest.jsx but doesn't exist | ❌ 404 error in console | Remove or create function

---

## ROOT CAUSE ANALYSIS

### Why `createR2UploadUrl-1` exists:
Base44 automatically appends `-1`, `-2`, etc. when:
1. Same function name is deployed multiple times
2. There's a deployment race condition
3. Function cache wasn't cleared

**Solution**: The `-1` suffix is a RED HERRING. It's just Base44's deployment versioning. The frontend is correctly calling `createR2UploadUrl`.

### Why 404 errors occur:
1. **`getR2BucketName` function doesn't exist** - VideoUploadTest.jsx line 32 tries to call it
2. **R2 upload fails** - Browser CORS or expired signed URL
3. **Finalization fails** - Processor webhook unreachable (502)

### Why broken drafts exist:
Current flow:
1. `createR2UploadUrl` creates Video + VideoAsset immediately
2. Browser uploads to R2 (may fail)
3. If R2 upload fails → Video remains with `status='draft'`, `source_video_url=null`
4. Admin sees "broken video" with no assets

**Preferred fix**: Don't create Video until R2 upload succeeds (requires architecture change)
**Interim fix**: Mark failed uploads with `processing_status='upload_failed'`

---

## PHASE B — CANONICAL FUNCTION

✅ **Canonical function**: `createR2UploadUrl`
❌ **Do NOT use**: `createR2UploadUrl-1` (auto-generated suffix by Base44)

**Frontend is correct** - calls `createR2UploadUrl` (line 142 in VideoUploadPanel.jsx)
The `-1` suffix in console is Base44's internal deployment tracking, not a separate function.

---

## PHASE C — FILE SIZE VALIDATION

### Current State:
- Backend validates: ✅ (line 24-27 in createR2UploadUrl)
- Client-side validation: ❌ MISSING

### Fix Required:
Add to VideoUploadPanel.jsx before calling `createR2UploadUrl`:

```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB

const handleFileSelect = async (selectedFiles) => {
  // Validate file sizes BEFORE backend call
  for (const file of selectedFiles) {
    if (file.size > MAX_FILE_SIZE) {
      const sizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
      toast.error(`File too large. Maximum allowed size is 10 GB. Your file is ${sizeGB} GB.`);
      return; // Block upload
    }
  }
  // ... rest of logic
};
```

---

## PHASE D — BROKEN DRAFTS PREVENTION

### Current Architecture Issue:
Video entity created BEFORE R2 upload succeeds (line 70 in createR2UploadUrl)

**Why this exists**: Need Video ID to track upload progress

**Problem**: Failed uploads leave orphaned Video records

### Solution A (Preferred - requires refactor):
1. Create Video AFTER R2 upload succeeds
2. Use temporary session ID for tracking
3. Create Video + VideoAsset in finalize step

### Solution B (Interim - implement now):
1. Keep current Video creation timing
2. If R2 upload fails → update Video with:
   - `processing_status = 'upload_failed'`
   - `error_message = 'R2 upload failed: [reason]'`
3. UI shows "Upload failed" badge

**Implementing Solution B** (minimal changes)

---

## PHASE E — FINALIZATION RULES

✅ `finalizeUploadedVideo` is CORRECT:
- Verifies R2 file exists (line 57-70)
- Creates JobQueue entry (line 79-92)
- Triggers processor (line 115-130)
- Sets `processing_status = 'processing'` (line 148)
- Does NOT pre-write fake URLs

✅ No changes needed

---

## PHASE F — UI ERROR HANDLING

### Current State:
Generic errors: "Request failed with status 400"

### Fix Required:
Replace with structured messages:

```javascript
// In VideoUploadPanel.jsx createUploadMutation.onError:
onError: (error, variables) => {
  let message = 'Upload failed';
  
  if (error.message?.includes('FILE_TOO_LARGE')) {
    message = 'File too large. Maximum 10 GB allowed.';
  } else if (error.message?.includes('MIME type')) {
    message = 'Invalid video format. Use MP4, MOV, WebM, or MKV.';
  } else if (error.message?.includes('Unauthorized')) {
    message = 'Please log in as admin to upload videos.';
  } else if (error.message?.includes('R2')) {
    message = 'Storage service unavailable. Try again.';
  }
  
  updateFileStatus(variables.id, {
    status: UPLOAD_STATUS.FAILED,
    error: message,
  });
  toast.error(message);
};
```

---

## PHASE G — BROKEN DRAFT CLEANUP

For currently broken video (no source/thumbnail/preview):

### Admin UI should show:
```
Status: Upload Failed ❌
Error: No source video URL
Assets: 0/4 created
Actions: [Delete Video] [Retry Upload]
```

### Implementation:
Add to VideoEdit.jsx:
```javascript
if (video.processing_status === 'upload_failed' || 
    (!video.source_video_url && video.status === 'draft')) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        <strong>Upload Failed:</strong> This video has no source video.
        Assets were not created. Safe to delete or retry upload.
      </AlertDescription>
    </Alert>
  );
}
```

---

## PHASE H — TEST PLAN

### Test 1: File over 10 GB
**Expected**: Blocked client-side, no backend call
**Status**: ❌ NOT IMPLEMENTED (will fix)

### Test 2: Valid file under limit
**Expected**: 
- createR2UploadUrl returns 200
- R2 upload succeeds
- finalizeUploadedVideo creates Video + VideoAsset
- source_video_url set after processor callback
**Status**: ✅ WORKING (when R2/processor available)

### Test 3: Simulate finalize failure
**Expected**: Structured error, no fake assets
**Status**: ✅ WORKING (finalizeUploadedVideo returns error correctly)

---

## RECOMMENDED FIXES (PRIORITY ORDER)

1. **Add client-side file size validation** (VideoUploadPanel.jsx)
2. **Remove getR2BucketName call** (VideoUploadTest.jsx - doesn't exist)
3. **Add upload_failed status handling** (createR2UploadUrl + VideoUploadPanel)
4. **Improve error messages** (VideoUploadPanel.jsx)
5. **Add broken draft detection** (VideoEdit.jsx)

---

## ACCEPTANCE CRITERIA CHECKLIST

- [ ] No call to createR2UploadUrl-1 (console shows clean function name)
- [ ] createR2UploadUrl route works (200 response)
- [ ] Oversized files blocked before backend call (>10GB)
- [ ] Failed uploads do not create broken publishable videos
- [ ] No fake thumbnail/preview URLs saved
- [ ] Missing source video disables repair buttons
- [ ] UI shows exact upload failure reason