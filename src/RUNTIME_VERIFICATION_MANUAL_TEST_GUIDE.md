# UPLOAD PIPELINE RUNTIME VERIFICATION GUIDE

## YOU MUST PERFORM THESE TESTS MANUALLY IN YOUR BROWSER

**Your file**: IMG_2985.MOV (11.04 GB)

This cannot be automated - you must:
1. Open DevTools (F12)
2. Go to Network tab
3. Execute tests and report actual results

---

## TEST A: OVERSIZED FILE (11.04 GB)

### Setup:
1. Navigate to `/admin/video-upload` in your browser
2. Open **DevTools** → **Network** tab
3. Add filter: `createR2UploadUrl`
4. Fill required fields:
   - Title: "Test Video"
   - Description: "Testing oversized file"
   - Access Tier: "free"

### Execute:
**Option 1 - Real File Upload (if you have IMG_2985.MOV)**
1. Click "Drag and Drop" area
2. Select IMG_2985.MOV file
3. Watch Network tab and Console

**Option 2 - Browser Console Simulation**
If file is not available, simulate in console:
```javascript
// In DevTools Console, execute:
const event = new DragEvent('drop', {
  dataTransfer: {
    files: [
      new File(
        [new ArrayBuffer(11.04 * 1024 * 1024 * 1024)],
        'IMG_2985.MOV',
        { type: 'video/quicktime' }
      )
    ]
  }
});

// Check what should happen (file size validation will trigger)
console.log('File size:', 11.04 * 1024 * 1024 * 1024, 'bytes');
```

### Expected Results:

**Network Tab Should Show:**
```
✅ createR2UploadUrl                  | SHOULD NOT APPEAR
✅ createR2UploadUrl-1                | SHOULD NOT APPEAR
✅ finalizeUploadedVideo              | SHOULD NOT APPEAR
✅ /entities/Video (POST)             | SHOULD NOT APPEAR
```

**Console Should Show:**
```
✅ Toast notification (bottom right):
   "File too large. Maximum allowed size is 10 GB. Your file is 11.04 GB."
```

**UI Should Show:**
```
✅ Error message visible
✅ File NOT added to upload list
✅ Upload progress bar NOT created
```

**Database Should Show:**
```
✅ No new Video record created
```

---

## TEST B: VALID FILE (under 10 GB)

### Setup:
1. Clear Network tab (Ctrl+L or click trash icon)
2. Add filter: `createR2UploadUrl`
3. Same required fields as Test A
4. Have a valid video file ready (<10GB, e.g., 500MB-2GB)

### Execute:
1. Click "Drag and Drop" area
2. Select your valid video file
3. Watch Network tab for all requests

### Expected Network Flow:

```
REQUEST 1: POST /functions/createR2UploadUrl
Status:    ✅ 200 OK
Response:  {
  "video_id": "vid_...",
  "asset_id": "asset_...",
  "r2_key": "uploads/...",
  "upload_url": "https://...(signed R2 URL)",
  "cdn_url": "https://...",
  "expires_in": 3600
}

REQUEST 2: PUT (R2 signed URL)
Status:    ✅ 200 OK
Body:      Binary video file data
Purpose:   Direct upload to Cloudflare R2

REQUEST 3: POST /functions/finalizeUploadedVideo
Status:    ✅ 200 OK
Response:  {
  "status": "queued",
  "job_id": "job_...",
  "message": "Upload verified. Processor job queued..."
}

REQUEST 4 (Async): Processor callback
Status:    ✅ 200 OK
When:      After 30-300 seconds
Effect:    Updates Video with source_video_url, thumbnail_url, processing_status
```

### What Should NOT Appear:
```
❌ createR2UploadUrl-1 (wrong function name)
❌ Any 400/404 for createR2UploadUrl
❌ Any error responses
```

### Console Should Show:
```
✅ "Upload complete! Processing started..." (green toast)
✅ Video ID displayed: vid_...
✅ Asset ID displayed: asset_...
✅ R2 Key displayed: uploads/...
```

### UI Progress:
```
Timeline:
0s   → "Preparing upload..."
5s   → "Uploading: 25%" → "Uploading: 50%" → ... → "Uploading: 100%"
15s  → "Upload complete" 
20s  → "Processing: 1/5" → "Processing: 2/5" ... → "Processing complete"
```

---

## TEST C: BROKEN DRAFT DETECTION

### Setup:
1. You should have a video from a previous failed upload (or create one manually)
2. Requirements:
   - `source_video_url` = null or empty
   - `status` = "draft"
   - `primary_thumbnail_url` = null
   - `trailer_url` = null

### Execute:
1. Navigate to `/admin/videos/{video_id}`
2. Observe page on load (no Network requests needed)
3. Look for red alert box at top

### Expected UI:

```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Upload Failed                                    │
│                                                     │
│ This video has no source video URL. Assets were    │
│ not created.                                        │
│                                                     │
│ Error: {error message from backend}                │
│                                                     │
│ [Retry Upload]  [Delete Video]                     │
└─────────────────────────────────────────────────────┘
```

### Expected Behavior:
```
✅ Red alert appears immediately
✅ Error message visible
✅ "Retry Upload" button present
✅ "Delete Video" button present
✅ Publishing checklist shows ❌ for:
   - Source video URL missing
   - Thumbnail URL missing  
   - Trailer URL missing
✅ "Publish Video" button disabled
✅ Publishing blockers shown: "Cannot Publish (3 issues)"
```

---

## NETWORK TAB REFERENCE

### How to Find Details:

1. **Open DevTools** → **Network** tab
2. **Filter by function name**: `createR2UploadUrl`
3. **Click each request** to see:
   - **Headers tab**: Request headers, Authorization
   - **Request tab**: JSON payload sent
   - **Response tab**: JSON response received
   - **Status**: HTTP status code (200, 404, 400, 502, etc.)
   - **Timing**: How long request took

### What to Check:

For **createR2UploadUrl**:
- [ ] Status code is 200 (not 404, 400, 502)
- [ ] Response contains: video_id, asset_id, r2_key, upload_url
- [ ] Response is valid JSON (not HTML error page)

For **R2 PUT request** (upload_url):
- [ ] Hostname contains: r2.cloudflarestorage.com or similar
- [ ] Status: 200 (not 403 Forbidden)
- [ ] Request body is binary (shows as "Binary" in DevTools)

For **finalizeUploadedVideo**:
- [ ] Status: 200 (not 502 Bad Gateway)
- [ ] Response contains: job_id, status: "queued"

---

## PASS/FAIL CRITERIA

### Test A (Oversized - 11.04 GB):

| Check | Expected | Actual | Pass/Fail |
|-------|----------|--------|-----------|
| createR2UploadUrl appears in Network | NO | ___ | ___ |
| createR2UploadUrl-1 appears | NO | ___ | ___ |
| finalizeUploadedVideo appears | NO | ___ | ___ |
| Video record created | NO | ___ | ___ |
| Toast error message | YES | ___ | ___ |
| Error text contains "11.04 GB" | YES | ___ | ___ |
| File added to upload list | NO | ___ | ___ |
| **TEST A RESULT** | | | **[  ]** |

### Test B (Valid File <10GB):

| Check | Expected | Actual | Pass/Fail |
|-------|----------|--------|-----------|
| createR2UploadUrl appears | YES (200) | ___ | ___ |
| createR2UploadUrl-1 appears | NO | ___ | ___ |
| createR2UploadUrl status | 200 OK | ___ | ___ |
| R2 PUT upload | YES (200) | ___ | ___ |
| finalizeUploadedVideo appears | YES (200) | ___ | ___ |
| Video ID displayed | YES | ___ | ___ |
| Processing starts | YES | ___ | ___ |
| No error toasts | YES | ___ | ___ |
| Processing completes | YES | ___ | ___ |
| **TEST B RESULT** | | | **[  ]** |

### Test C (Broken Draft):

| Check | Expected | Actual | Pass/Fail |
|-------|----------|--------|-----------|
| Upload Failed alert appears | YES | ___ | ___ |
| Error message shown | YES | ___ | ___ |
| Retry button visible | YES | ___ | ___ |
| Delete button visible | YES | ___ | ___ |
| Publish button disabled | YES | ___ | ___ |
| Blocking reasons shown | YES | ___ | ___ |
| **TEST C RESULT** | | | **[  ]** |

---

## CONSOLE OUTPUT REFERENCE

### Expected Console Logs (Test B):

Open DevTools → Console tab and look for:

```javascript
// You should see NO errors, only info/success messages:

// During upload preparation:
[INFO] Preparing upload... (status: preparing)

// During file upload to R2:
[INFO] Upload progress: 25%
[INFO] Upload progress: 50%
[INFO] Upload progress: 100%
[INFO] Upload complete (status: uploaded)

// During finalization:
[INFO] Finalizing... (status: finalizing)
[SUCCESS] Upload complete! Processing started... (green toast)

// During processing (async, can take 30-300 seconds):
[INFO] Processing: 1/5
[INFO] Processing: 2/5
[INFO] Processing: 3/5
...
[INFO] Processing complete (green toast)
```

### Errors to WATCH FOR (should NOT appear):

```javascript
❌ Error: Failed to invoke 'createR2UploadUrl'
❌ Error: 404 createR2UploadUrl
❌ Error: 400 Bad Request
❌ Error: File too large (during valid file upload)
❌ Network error in finalizeUploadedVideo
```

---

## QUICK CHECKLIST FOR YOU

Before running tests:
- [ ] Browser DevTools open (F12)
- [ ] Network tab visible
- [ ] Console tab ready to watch
- [ ] File IMG_2985.MOV available (or ready to simulate)
- [ ] Valid test file available (<10GB)
- [ ] Admin logged in

During tests:
- [ ] Watch Network tab requests
- [ ] Note exact status codes
- [ ] Check Console for errors
- [ ] Record exact error messages
- [ ] Take screenshots if needed

After tests:
- [ ] Fill in the tables above with actual results
- [ ] Report any unexpected Network requests
- [ ] Paste console errors if any

---

## REPORT BACK WITH:

```
TEST A (OVERSIZED FILE):
Network Requests Observed:
- createR2UploadUrl: [APPEARED/DID NOT APPEAR] Status: [___]
- createR2UploadUrl-1: [APPEARED/DID NOT APPEAR]
- finalizeUploadedVideo: [APPEARED/DID NOT APPEAR]
- Video created: [YES/NO]
Console Errors: [NONE / list any]
UI Message: [exact text shown]
Result: [PASS/FAIL]

TEST B (VALID FILE):
Network Requests Observed:
- createR2UploadUrl: [Status code: ___]
- R2 upload: [Status code: ___]
- finalizeUploadedVideo: [Status code: ___]
- createR2UploadUrl-1: [APPEARED/DID NOT APPEAR]
Console Errors: [NONE / list any]
Video ID: [shown/not shown]
Processing Status: [started/failed]
Result: [PASS/FAIL]

TEST C (BROKEN DRAFT):
Upload Failed Alert: [VISIBLE/NOT VISIBLE]
Error Message: [text shown]
Buttons Present: [Retry/Delete]
Publish Blocked: [YES/NO]
Result: [PASS/FAIL]
```

---

**⚠️ CRITICAL**: Do not report PASS without verifying in actual browser.
Base44 Network tab does not lie. Exact status codes matter.