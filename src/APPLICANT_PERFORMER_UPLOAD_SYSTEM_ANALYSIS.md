# Applicant / Performer Upload System - Analyse & Implementierungsplan

## 📊 Current State Analysis

### Existing Entities

| Entity | Status | Upload Fields | Notes |
|--------|--------|---------------|-------|
| **GuestProductionApplication** | ✅ Active | `profile_photo_r2_keys[]`, `intro_video_r2_key`, `hardcore_video_r2_key`, `id_document_r2_key`, `id_document_back_r2_key`, `selfie_with_id_r2_key`, `media_upload_status`, `compliance_upload_status` | Main application entity with all required upload fields |
| **Performer** | ✅ Active | `profile_image_url`, `cover_image_url` | Public performer profile images only |
| **PerformerProfilePrivate** | ✅ Active | `payout_details_encrypted`, legal name, address | Private performer data (KYC) |
| **ComplianceRecord** | ✅ Active | `document_url`, `document_type`, `status` | Compliance documents for existing performers |
| **ApplicationUpload** | ❌ Not Found | - | Entity doesn't exist - uploads stored directly in GuestProductionApplication |
| **ContentSubmission** | ✅ Exists | `r2_object_key`, `file_type`, `upload_status` | For existing performers to submit content |

### Existing Upload Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `createApplicationUploadUrl` | Generate pre-signed R2 PUT URL | ✅ Exists |
| `uploadFileViaToken` | Validate token & upload to R2 | ✅ Exists |
| `finalizeTokenUpload` | Update application with r2_key | ✅ Exists |
| `getApplicationFileSignedUrl` | Generate signed download URL | ✅ Exists |
| `createApplicationUploadToken` | Generate secure upload token | ✅ Exists |

### Existing Frontend

| Page/Component | Purpose | Status |
|---------------|---------|--------|
| `pages/ApplicationUpload` | Token-based upload page | ✅ Exists - supports photos, videos, ID docs |
| `components/admin/applications/ApplicationDetailDialog` | Admin review dialog | ✅ Exists with 6 tabs |
| `components/admin/applications/tabs/MediaTab` | Show uploaded media | ⚠️ Basic - shows count only |
| `components/admin/applications/tabs/IDTab` | Show ID documents | ⚠️ Basic - shows count only |
| `components/admin/applications/tabs/WorkflowTab` | Status workflow | ✅ Exists |

---

## 🔍 Gap Analysis

### 1. Upload Fields Status

**Required Uploads (A):**
- ✅ ID document (front/back or single) - `id_document_front_r2_key`, `id_document_back_r2_key`
- ✅ Selfie with ID - `selfie_with_id_r2_key`
- ✅ 5 performer photos - `profile_photo_r2_keys[]` (array)
- ✅ 2 application videos - `intro_video_r2_key`, `hardcore_video_r2_key`

**Optional Uploads (B):**
- ❌ Health test document - NOT IMPLEMENTED
- ❌ HIV test document - NOT IMPLEMENTED
- ❌ Syphilis test document - NOT IMPLEMENTED
- ❌ PrEP confirmation - NOT IMPLEMENTED
- ❌ Additional performer photos - NOT IMPLEMENTED
- ❌ Additional intro video - NOT IMPLEMENTED

### 2. Dashboard Requirements

**Applicant/Performer Dashboard:**
- ❌ No dedicated applicant dashboard exists
- ✅ `pages/ApplicationUpload` exists but requires token
- ❌ No "Verification & Media Uploads" section with status cards
- ❌ No upload counts (e.g., "3 of 5 uploaded")
- ❌ No status display (missing, uploaded, under review, approved, rejected)
- ❌ No admin feedback/rejection reason display

**Admin Applications Detail:**
- ⚠️ MediaTab shows only counts, no preview/download
- ⚠️ IDTab shows only counts, no preview/download
- ❌ No signed URL preview for admin
- ❌ No approve/reject/request replacement for individual files
- ❌ No rejection reason per file

**Admin Performer Detail:**
- ❌ No upload status overview
- ❌ No compliance/media complete indicator
- ❌ No missing requirements display
- ❌ No latest upload activity

### 3. Security & Privacy

**Private Files (need signed URLs):**
- ✅ ID documents stored in `applications/private/.../id_docs/`
- ✅ Selfie with ID stored in `applications/private/.../id_docs/`
- ✅ Health documents (when implemented) should be private
- ⚠️ `getApplicationFileSignedUrl` exists but not used in Admin UI

**Public/Media Files:**
- ⚠️ Photos stored in `applications/private/.../photos/` - should these be public after approval?
- ⚠️ Videos stored in `applications/private/.../videos/` - should these be public after approval?
- ❌ No clear separation between private compliance and public media

### 4. Status Logic

**Application Status Values:**
```
pending → media_pending → reviewing → contacted → more_info_requested → approved → rejected
                                         ↓
                                    contract_pending → contract_sent → contract_signed → performer_created → user_linked → active
```

**Missing Status:**
- ❌ `id_pending` - ID or selfie missing
- ❌ `review_ready` - all required files uploaded
- ❌ No automatic calculation based on upload completeness

---

## 📋 Implementation Plan

### Phase 1: Admin Upload Review (Priority 1)

**Goal:** Admin can view/download all uploaded files via signed URLs

#### 1.1 Update MediaTab Component
- [ ] Add signed URL preview for each photo
- [ ] Add signed URL preview for each video
- [ ] Show upload date/timestamp
- [ ] Add download button
- [ ] Add file size display

#### 1.2 Update IDTab Component
- [ ] Add signed URL preview for ID front
- [ ] Add signed URL preview for ID back
- [ ] Add signed URL preview for selfie with ID
- [ ] Show upload date
- [ ] Add download button
- [ ] Add approve/reject per document
- [ ] Add rejection reason field

#### 1.3 Create Helper Function
- [ ] `getAdminFileViewUrl` already exists - use it!
- [ ] Ensure it works for application files (not just performer files)

### Phase 2: Applicant Dashboard (Priority 2)

**Goal:** Applicants can see upload status and re-upload missing files

#### 2.1 Create Applicant Dashboard Page
- [ ] `pages/ApplicantDashboard` or extend `ApplicationUpload`
- [ ] Token-based access (no login required)
- [ ] Show application status
- [ ] Show upload progress for each category

#### 2.2 Upload Status Cards
```jsx
<UploadStatusCard
  category="ID Verification"
  required={true}
  uploaded={application.id_document_front_r2_key && application.selfie_with_id_r2_key}
  status={application.compliance_upload_status}
  rejectionReason={application.id_rejection_reason}
/>

<UploadStatusCard
  category="Profile Photos"
  required={true}
  uploaded={application.profile_photo_r2_keys?.length || 0}
  total={5}
  status={getPhotoStatus()}
  rejectionReason={application.photo_rejection_reason}
/>

<UploadStatusCard
  category="Application Videos"
  required={true}
  uploaded={[application.intro_video_r2_key, application.hardcore_video_r2_key].filter(Boolean).length}
  total={2}
  status={getVideoStatus()}
  rejectionReason={application.video_rejection_reason}
/>
```

#### 2.3 Backend Enhancements
- [ ] Add `application_upload_token` and `application_upload_token_expires_at` to GuestProductionApplication (if not exists)
- [ ] Add rejection reason fields per category
- [ ] Add reviewed_at, reviewed_by per category
- [ ] Calculate `review_ready` status automatically

### Phase 3: Health Documents (Optional)

**Goal:** Allow performers to upload health tests later

#### 3.1 Entity Extension
Option A: Add to GuestProductionApplication
```json
{
  "health_test_document_r2_key": string,
  "hiv_test_document_r2_key": string,
  "syphilis_test_document_r2_key": string,
  "prep_confirmation_r2_key": string,
  "health_docs_status": "not_uploaded" | "uploaded" | "verified" | "expired" | "rejected",
  "health_docs_reviewed_at": datetime,
  "health_docs_reviewed_by": string,
  "health_docs_rejection_reason": string
}
```

Option B: Use ComplianceRecord entity (recommended for performers)
- Already has `document_type`, `document_url`, `status`
- Link to `performer_id` instead of `application_id`

#### 3.2 Performer Dashboard Integration
- [ ] Add "Health Documents" tab to performer dashboard
- [ ] Allow upload of health tests
- [ ] Show expiry dates
- [ ] Show verification status

### Phase 4: Admin Performer Detail (Priority 3)

**Goal:** Admin can see upload/compliance status in performer detail

#### 4.1 Add Compliance Summary Card
- [ ] Show ID verification status
- [ ] Show media completeness
- [ ] Show health docs status (if implemented)
- [ ] Show latest upload activity
- [ ] Quick link to missing requirements

---

## 🔐 Security Considerations

### File Storage Structure
```
applications/private/{application_id}/
  ├── photos/
  │   ├── {timestamp}_photo_0.jpg
  │   ├── {timestamp}_photo_1.jpg
  │   └── ...
  ├── videos/
  │   ├── {timestamp}_intro_video.mp4
  │   └── {timestamp}_hardcore_video.mp4
  └── id_docs/
      ├── {timestamp}_id_document_front.jpg
      ├── {timestamp}_id_document_back.jpg
      └── {timestamp}_selfie_with_id.jpg

performers/{performer_id}/
  ├── compliance/
  │   └── {document_type}_{timestamp}.{ext}
  └── media/
      └── {photo|video}_{timestamp}.{ext}
```

### Access Control
- **Application files:** Token-based (no login) OR admin-only
- **Performer files:** Performer session token OR admin-only
- **Signed URLs:** 5-15 minute expiry for admin preview
- **Public files:** Separate `public/` prefix, only after approval

### Private File Access
```javascript
// Admin preview
const { signed_url } = await base44.functions.invoke("getApplicationFileSignedUrl", {
  application_id,
  r2_key
});

// Performer preview (own files only)
const { signed_url } = await base44.functions.invoke("getPerformerFileSignedUrl", {
  performer_id,
  r2_key
});
```

---

## 📊 Status Calculation Logic

### Application Review Ready
```javascript
function isReviewReady(app) {
  const hasPhotos = (app.profile_photo_r2_keys?.length || 0) >= 5;
  const hasIntroVideo = !!app.intro_video_r2_key;
  const hasHardcoreVideo = !!app.hardcore_video_r2_key;
  const hasIdFront = !!app.id_document_front_r2_key;
  const hasSelfie = !!app.selfie_with_id_r2_key;
  
  return hasPhotos && hasIntroVideo && hasHardcoreVideo && hasIdFront && hasSelfie;
}

function getUploadStatus(app) {
  if (!isReviewReady(app)) {
    return 'media_pending';
  }
  if (app.status === 'pending') {
    return 'review_ready'; // Auto-update status
  }
  return app.status;
}
```

### Per-Category Status
```javascript
function getPhotoStatus(app) {
  const count = app.profile_photo_r2_keys?.length || 0;
  if (count === 0) return 'missing';
  if (count < 5) return 'partial';
  if (app.photo_rejection_reason) return 'rejected';
  if (app.media_reviewed_at) return 'approved';
  return 'uploaded';
}
```

---

## ✅ QA Test Plan

### Applicant Flow
1. [ ] Applicant receives upload link (email with token)
2. [ ] Opens `/application-upload?token=xxx`
3. [ ] Sees upload status for each category
4. [ ] Uploads 5 photos
5. [ ] Uploads 2 videos
6. [ ] Uploads ID front, back, selfie
7. [ ] Dashboard shows "All required files uploaded"
8. [ ] Application status auto-updates to `review_ready` or `media_pending` → `pending`

### Admin Review Flow
1. [ ] Admin opens Applications page
2. [ ] Sees application with status `pending` or `review_ready`
3. [ ] Opens Application Detail Dialog
4. [ ] Goes to Media tab
5. [ ] Sees all photos with preview buttons
6. [ ] Clicks preview → opens signed URL in new tab
7. [ ] Goes to ID Documents tab
8. [ ] Sees ID docs with preview buttons
9. [ ] Can approve/reject individual documents
10. [ ] Can add rejection reason
11. [ ] Status updates to `reviewing` → `approved` or `more_info_requested`

### Re-upload Flow
1. [ ] Admin rejects photo with reason "Photo too dark"
2. [ ] Applicant receives notification
3. [ ] Opens upload dashboard
4. [ ] Sees "Photo rejected - Photo too dark"
5. [ ] Can re-upload specific photo
6. [ ] Admin sees new upload with updated timestamp

---

## 📝 Open Questions

1. **Health Documents:**
   - Should health docs be part of application OR performer-only?
   - Recommendation: Performer-only (after application approved)

2. **Public vs Private Media:**
   - Should approved photos/videos become public?
   - Or stay private and only public performer profile images are separate?
   - Recommendation: Stay private, separate public performer images uploaded later

3. **Token Expiry:**
   - How long should upload tokens be valid?
   - Recommendation: 7 days for initial application, 30 days for re-uploads

4. **File Replacement:**
   - Should re-uploads replace old files or create new versions?
   - Recommendation: Create new versions, keep old files for audit

5. **Automatic Status Update:**
   - Should `review_ready` auto-update application status?
   - Or keep manual admin control?
   - Recommendation: Auto-update to `pending` (from `media_pending`), admin still controls review start

---

## 🎯 Next Steps

**Immediate (This Session):**
1. ✅ Fix IDTab to show signed URLs for admin preview
2. ✅ Fix MediaTab to show signed URLs for admin preview
3. ✅ Ensure `getApplicationFileSignedUrl` works for all file types

**Phase 1 (Admin Review):**
4. Add file preview with signed URLs to both tabs
5. Add download buttons
6. Add approve/reject per file
7. Add rejection reason fields

**Phase 2 (Applicant Dashboard):**
8. Create applicant dashboard page
9. Add upload status cards
10. Implement automatic `review_ready` calculation
11. Add re-upload functionality

**Phase 3 (Health Docs - Optional):**
12. Add health document fields to entity
13. Create upload UI in performer dashboard
14. Add expiry tracking

**Phase 4 (Admin Performer Detail):**
15. Add compliance summary card
16. Show upload status overview
17. Add quick links to missing requirements

---

## 📌 Summary

**Existing:** ✅
- GuestProductionApplication entity with all required upload fields
- Token-based upload system (createApplicationUploadToken, uploadFileViaToken, finalizeTokenUpload)
- ApplicationUpload page with photo/video/ID upload
- Admin Applications page with detail dialog
- Signed URL generation (getApplicationFileSignedUrl)

**Missing:** ❌
- Admin preview/download via signed URLs (tabs show only counts)
- Applicant dashboard with status overview
- Automatic review_ready calculation
- Rejection reasons per category
- Health documents (optional)
- Performer dashboard upload section (for existing performers)

**Recommendation:**
Focus on Phase 1 first (admin can actually view uploaded files), then Phase 2 (applicant dashboard for better UX). Health docs and performer uploads are lower priority.