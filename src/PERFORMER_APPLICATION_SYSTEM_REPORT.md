# V2 Performer Application System - Implementation Report

**Date:** 2026-05-31  
**Status:** ✅ COMPLETE

---

## Overview

Implemented a complete performer recruitment funnel with public application form and admin inbox management system. System is designed for V1 backoffice migration compatibility.

---

## Pages Created

### 1. Public Recruitment Page
**Route:** `/become-performer`  
**File:** `pages/BecomePerformer.jsx`

**Features:**
- 3-step application form
- Hero section with conversion-focused copy
- File upload (photos + optional video)
- Consent and privacy checkboxes
- Mobile-responsive design

**Copy Direction:**
- "Not perfect. Just real."
- "Gay / bi / queer guys wanted"
- "Create content. Build fans. Earn with FLESHLAB"
- "Apply in 3 minutes"

### 2. Admin Application Inbox
**Route:** `/admin/applications`  
**File:** `pages/admin/Applications.jsx`

**Features:**
- Application list with filters (new, reviewing, approved, rejected)
- Search by name/email
- Status statistics dashboard
- Detail view with full application data
- Admin notes system
- Status update workflow
- **Create Performer from approved application**
- Media preview (photos/videos)

---

## Entities Used

### Primary Entity: `GuestProductionApplication`
**Existing entity reused** - no duplicate created

**Fields Used:**
- `applicant_name` - Stage name
- `email` - Contact email
- `phone` - Phone/messaging contact
- `nationality` - Country/location
- `message` - Application message (includes experience, social links, legal name)
- `package_interest` - Preferred path
- `id_document_url` - Uploaded profile photo
- `status` - pending, reviewing, approved, rejected
- `admin_notes` - Internal review notes
- `submitted_at` - Submission timestamp

**V1 Compatibility Fields:**
- ✅ `v1_id` field available for migration
- ✅ `admin_notes` stores source metadata
- ✅ Status enum compatible with V1

---

## Backend Functions Created

### 1. `submitPerformerApplication`
**Purpose:** Process public form submissions  
**Input:** applicant_name, email, phone, nationality, message, package_interest, id_document_url  
**Output:** application_id, success message

**V1 Compatibility:**
- Stores source metadata in admin_notes
- Uses standard status enum
- Compatible with future V1 import

---

## Upload Handling

**File Upload Method:**
- Uses `base44.integrations.Core.UploadFile` integration
- Photos stored as array (multiple uploads)
- Video stored as single URL
- Files uploaded before form submission
- URLs stored in entity records

**Supported Formats:**
- Images: PNG, JPG (up to 10MB each)
- Video: MP4, MOV (up to 100MB)

**Note:** ID/compliance documents NOT required at application stage. Upload happens post-approval.

---

## Admin Workflow

### Application Review Flow:
1. **New** → Application submitted (status: pending)
2. **Reviewing** → Admin reviewing (status: reviewing)
3. **Decision:**
   - **Approved** → Can create performer profile
   - **Rejected** → Application declined
   - **Needs Info** → Mark as reviewing + add notes

### Create Performer from Application:
- One-click performer profile creation
- Auto-populates:
  - display_name (from applicant_name)
  - nationality
  - profile_image_url (from uploaded photo)
  - bio (from application message)
- Sets status: "pending"
- Links application record
- Redirects to performer edit page

---

## V1 Migration Compatibility

### Design Decisions:

1. **Single Entity for All Applications**
   - `GuestProductionApplication` stores both V2 and (future) V1 applications
   - No duplicate entities
   - Distinguished by `admin_notes` source field

2. **Source Tracking**
   ```
   V2 applications: admin_notes = "Source: become_performer\nPreferred Path: ..."
   V1 imports: admin_notes = "Source: v1_import\nV1 ID: ..."
   ```

3. **Status Enum Compatibility**
   - V2: pending, reviewing, approved, rejected
   - V1: Same enum values
   - No migration mapping required

4. **v1_id Field**
   - Available on entity for V1 record linking
   - V2 applications: v1_id = null
   - V1 imports: v1_id = original V1 ID

5. **Coexistence Strategy**
   - V2 and V1 applications can coexist in same entity
   - Admin inbox shows all applications
   - Filterable by source if needed

---

## Language Support

**Current:** English only  
**Future-Ready Structure:**
- Copy stored in component (easy to extract)
- No hardcoded strings in logic
- Form labels use React Label component
- Ready for i18n library integration

**Languages to Add Later:**
- German
- Chinese (Traditional/Simplified)
- Tagalog
- Thai
- Vietnamese

---

## Remaining Gaps

### NOT Implemented (Per Requirements):
- ❌ Payment/checkout system
- ❌ Subscription management
- ❌ FanclubSubscription workflow
- ❌ Contract signing
- ❌ Full compliance workflow
- ❌ ID verification (post-approval placeholder only)
- ❌ GuestProductionApplication full workflow

### Post-Launch Items:
1. **Compliance Flow** (Post-Approval)
   - ID verification upload
   - Contract generation
   - Release form signing
   - Consent verification

2. **Email Notifications**
   - Application received confirmation
   - Status update notifications
   - Request for additional info

3. **Advanced Features**
   - Bulk status updates
   - Application export (CSV)
   - Analytics (conversion rates, sources)
   - Multi-language support
   - SMS verification
   - Scheduling integration (for approved performers)

---

## File Structure

```
pages/
  ├── BecomePerformer.jsx (public form)
  └── admin/
      └── Applications.jsx (admin inbox)

functions/
  └── submitPerformerApplication.js (form handler)

components/
  └── Layout.jsx (updated with footer link)

App.jsx (routes added)
```

---

## Routes Added

```jsx
// Public
<Route path="/become-performer" element={<BecomePerformer />} />

// Admin
<Route path="/admin/applications" element={<Applications />} />
```

---

## Navigation Links

**Footer:**
- "Become a Performer" link added to footer navigation

**Home Page:**
- Prominent CTA section added
- "Want to Be a FLESHLAB Performer?"
- "Apply Now" button

**Admin Dashboard:**
- Quick action card can be added to `/admin` dashboard

---

## Testing Checklist

- ✅ Application form submits successfully
- ✅ File uploads work (photos + video)
- ✅ Admin inbox displays applications
- ✅ Status filters work
- ✅ Search functionality works
- ✅ Admin notes can be added
- ✅ Status updates persist
- ✅ Create performer from approved application
- ✅ V1 compatibility fields available

---

## Migration Notes

### When V1 Backoffice Import Happens:

1. **V1 Data Will Include:**
   - Historical applications (PerformerApplication)
   - Contracts (PerformerContract)
   - Compliance docs (PartnerComplianceDocument)

2. **Import Function Requirements:**
   - Map V1 PerformerApplication → GuestProductionApplication
   - Set v1_id field
   - Set admin_notes with source metadata
   - Preserve submitted_at dates
   - Map status values

3. **No Conflicts Expected:**
   - V2 applications: v1_id = null
   - V1 applications: v1_id = "original_id"
   - Both coexist in same entity

---

## Summary

**Implemented:**
- ✅ Public recruitment page (/become-performer)
- ✅ 3-step application form
- ✅ File upload handling
- ✅ Admin inbox (/admin/applications)
- ✅ Application review workflow
- ✅ Create performer from approved application
- ✅ V1 migration compatibility
- ✅ Source tracking

**Not Implemented (Per Requirements):**
- ❌ Payment/checkout
- ❌ Contract signing
- ❌ Full compliance workflow
- ❌ GuestProductionApplication workflow

**Status:** READY FOR PRODUCTION

**Next Steps:**
1. Test with real applicants
2. Add email notifications (optional)
3. Implement post-approval compliance flow (when ready)
4. Import V1 backoffice data (when exported)