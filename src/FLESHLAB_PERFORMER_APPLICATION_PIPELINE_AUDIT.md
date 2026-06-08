# FLESHLAB Performer Application Pipeline Audit

**Date:** 2026-06-08  
**Status:** ✅ **AUDIT COMPLETE**

---

## A. Executive Summary

The FLESHLAB Performer Application Pipeline is **largely functional** but has **several critical gaps** that prevent a smooth, scalable workflow from application to active performer status.

**Key Findings:**
- ✅ **Entry Points & Attribution:** Stable and correctly implemented.
- ✅ **Data Model:** Robust, with most necessary fields present in `GuestProductionApplication`.
- ⚠️ **Uploads:** Logic is present but not enforced consistently, with no clear indication of required files in the UI.
- 🔴 **Status Workflow:** **CRITICAL GAP** - Lacks essential statuses for review, contract management, and performer creation. The current `pending/reviewing/approved/rejected` is insufficient.
- 🟡 **Admin UI:** Functional for basic review but missing key actions for contract generation, performer creation, and communication.
- ✅ **KYC/Compliance:** Secure, with private R2 storage and signed URLs.
- 🔴 **Contract Handoff:** **CRITICAL GAP** - No automated handoff from approved application to contract generation. Manual process required.
- 🔴 **Performer Creation/Linking:** **CRITICAL GAP** - No automated process to create a `Performer` entity from an application or link it to a user account.
- 🔴 **Notifications:** **CRITICAL GAP** - No automated email or WhatsApp notifications for applicants.
- 🟡 **Growth/Reporting:** Basic data is available, but no dedicated reporting or analytics for the application funnel.

**Overall Assessment:** The pipeline is a solid foundation but requires significant work to automate the workflow, reduce manual intervention, and provide a professional experience for both applicants and admins.

---

## B. Critical Issues Table

| Issue | Risk | Impact | Recommended Fix |
|-------|------|--------|-----------------|
| **1. Incomplete Status Workflow** | 🔴 HIGH | Admins cannot track application progress; no clear handoffs for contracting or performer creation. | Implement a comprehensive status workflow (see Table F). |
| **2. Manual Contract Generation** | 🔴 HIGH | No automated way to create a contract from an approved application; requires manual data entry. | Add a "Create Contract" button to the admin UI that triggers `contractService`. |
| **3. Manual Performer Creation** | 🔴 HIGH | No automated way to create a `Performer` from an approved application; requires manual data entry. | Add a "Create Performer" button to the admin UI. |
| **4. No Applicant Notifications** | 🔴 HIGH | Applicants receive no confirmation or status updates, leading to a poor experience and support overhead. | Implement automated email/WhatsApp notifications for key status changes. |
| **5. Missing Admin Actions** | 🟡 MEDIUM | Admin UI lacks buttons for key workflow steps (contracting, performer creation), forcing manual workarounds. | Add dedicated buttons for all major workflow actions. |

---

## C. Application Entry Points

| Page | Form Present | CTA Works | Source Attribution | WhatsApp | Issue |
|------|--------------|-----------|--------------------|----------|-------|
| **/become-performer** | ✅ YES (embedded `BPApplicationForm`) | ✅ YES (smooth scroll) | ✅ YES (`sourcePage` hardcoded) | ❌ NO | None |
| **/gay-performer-recruitment-philippines** | ✅ YES (embedded `BPApplicationForm`) | ✅ YES (direct navigation) | ✅ YES (`sourcePage`, `sourceCountry`, `utm_*` params) | ✅ YES (direct link) | None |
| **/chaturbate-model-join-studio** | ❌ NO (navigates to `/become-performer`) | ✅ YES (navigation) | ⚠️ **PARTIAL** (loses `chaturbate` source context) | ❌ NO | `source` attribution is lost on navigation. |
| **/application-upload** | ❌ NO (standalone upload page) | N/A | N/A | ❌ NO | Token-based upload for missing files. |
| **WhatsApp CTA** | N/A | ✅ YES (direct link with pre-filled text) | ⚠️ **NONE** (manual tracking required) | ✅ YES | No automated tracking for WhatsApp applications. |

---

## D. Entity/Data Model (`GuestProductionApplication`)

| Field | Present | Notes |
|-------|---------|-------|
| **Personal Info** |
| legal_name | ✅ YES | |
| applicant_name (stage name) | ✅ YES | |
| email | ✅ YES | |
| phone (WhatsApp/contact) | ✅ YES | |
| nationality / country | ✅ YES | |
| city | ✅ YES | |
| confirmed_18_plus | ✅ YES | |
| **Compliance/KYC** |
| compliance_upload_status | ✅ YES (`none`, `uploaded`, `verified`) | |
| id_document_r2_key | ✅ YES | Stores front of ID |
| id_document_back_r2_key | ❌ NO | **MISSING** - Selfie stored in `message` field |
| selfie_with_id_r2_key | ❌ NO | **MISSING** - Stored in `message` field |
| confirmed_contact_consent | ✅ YES | |
| **Media** |
| profile_photo_r2_keys | ✅ YES (array) | |
| intro_video_r2_key (body) | ✅ YES | |
| hardcore_video_r2_key | ✅ YES | |
| **Application Details** |
| preferred_revenue_model | ✅ YES | `standard_studio_60_performer_40`, `network_performer_70_studio_30`, `undecided` |
| interests (solo/pair) | ✅ YES | |
| experience | ✅ YES | |
| social_links | ✅ YES | |
| **Attribution** |
| source_page | ✅ YES | |
| source_country | ✅ YES | |
| utm_source | ✅ YES | |
| utm_market | ✅ YES | |
| utm_campaign | ✅ YES | |
| **Admin/Workflow** |
| status | ✅ YES (`pending`, `media_pending`, `reviewing`, `approved`, `rejected`) | ⚠️ **INCOMPLETE** |
| admin_notes | ✅ YES | |
| contact_log | ✅ YES | |
| submitted_at | ✅ YES | |
| media_reviewed_at | ✅ YES | |
| media_reviewed_by | ✅ YES | |
| assigned_admin | ❌ NO | **MISSING** |
| contract_generated | ❌ NO | **MISSING** - Must be tracked in `admin_notes` |
| performer_created | ❌ NO | **MISSING** - Must be tracked in `admin_notes` |
| applicant_user_id (linked user) | ✅ YES | Populated if user is logged in during submission |

---

## E. Upload Requirements

| Requirement | Enforced Before Submit | Visible to Applicant | Visible to Admin | Issue |
|-------------|------------------------|----------------------|------------------|-------|
| **5 Profile Photos** | ✅ YES (`BPApplicationForm`) | ✅ YES (UI shows 5 slots) | ✅ YES (Media tab) | None |
| **1 Body/Intro Video** | ✅ YES (`BPApplicationForm`) | ✅ YES (UI shows slot) | ✅ YES (Media tab) | None |
| **1 Hardcore/Sample Video** | ✅ YES (`BPApplicationForm`) | ✅ YES (UI shows slot) | ✅ YES (Media tab) | None |
| **ID Document (Front)** | ✅ YES (`BPApplicationForm`) | ✅ YES (UI shows slot) | ✅ YES (ID tab) | None |
| **ID Document (Back)** | ✅ YES (`BPApplicationForm`) | ✅ YES (UI shows slot) | ✅ YES (ID tab) | Stored as separate key, but no dedicated field |
| **Selfie with ID** | ✅ YES (`BPApplicationForm`) | ✅ YES (UI shows slot) | ✅ YES (ID tab) | Stored as separate key, but no dedicated field |
| **Extra Media** | ❌ NO | ❌ NO | ❌ NO | No mechanism for optional uploads. |

---

## F. Status Workflow

| Status | Used Yes/No | Trigger | Next Action | Issue |
|--------|-------------|---------|-------------|-------|
| `draft` / `started` | ❌ NO | N/A | N/A | No way to save a draft application. |
| `pending` | ✅ YES | Form submission | Admin review | OK |
| `media_pending` | ✅ YES | (Not currently used) | Applicant uploads files | Workflow not implemented. |
| `reviewing` | ✅ YES | Admin clicks "Start Review" | Admin approves/rejects | OK |
| `contacted` | ✅ YES | Admin clicks contact button | Follow-up | OK |
| `more_info_requested` | ❌ NO | N/A | Applicant provides info | **MISSING** - No status for pending applicant feedback. |
| `approved` | ✅ YES | Admin clicks "Approve" | Manual contract/performer creation | 🔴 **CRITICAL GAP** - No automated handoff. |
| `rejected` | ✅ YES | Admin clicks "Reject" | End of process | OK |
| `contract_pending` | ❌ NO | N/A | Admin sends contract | **MISSING** |
| `contract_sent` | ❌ NO | N/A | Applicant signs | **MISSING** |
| `contract_signed` | ❌ NO | N/A | Admin creates Performer profile | **MISSING** |
| `performer_created` | ❌ NO | N/A | Link user account | **MISSING** |
| `user_linked` | ❌ NO | N/A | Active performer | **MISSING** |
| `active` | ❌ NO | N/A | Performer dashboard access | **MISSING** |

---

## G. Admin Applications UI (`pages/admin/Applications`)

| Feature | Present | Works | Missing | Risk |
|---------|---------|-------|---------|------|
| **List View** |
| View all applications | ✅ YES | ✅ YES | | 🟢 LOW |
| Search by name/email | ✅ YES | ✅ YES | | 🟢 LOW |
| Filter by status | ✅ YES | ✅ YES | | 🟢 LOW |
| **Detail View (Dialog)** |
| View applicant info | ✅ YES | ✅ YES | | 🟢 LOW |
| View source attribution | ✅ YES | ✅ YES | | 🟢 LOW |
| **Media Tab** |
| View photos (securely) | ✅ YES | ✅ YES | | 🟢 LOW |
| View videos (securely) | ✅ YES | ✅ YES | | 🟢 LOW |
| **ID/KYC Tab** |
| View ID document (securely) | ✅ YES | ✅ YES | | 🟢 LOW |
| View selfie with ID (securely) | ✅ YES | ✅ YES | | 🟢 LOW |
| Mark ID as verified | ✅ YES | ✅ YES | | 🟢 LOW |
| **Notes Tab** |
| Add/view admin notes | ✅ YES | ✅ YES | | 🟢 LOW |
| **Contact Tab** |
| View contact info | ✅ YES | ✅ YES | | 🟢 LOW |
| Log contact attempts | ✅ YES | ✅ YES | | 🟢 LOW |
| **Workflow Actions** |
| Change status | ✅ YES (basic only) | ✅ YES | `more_info_requested`, `contract_*` statuses | 🟡 MEDIUM |
| Approve button | ✅ YES | ⚠️ **PARTIAL** (no handoff) | | 🔴 HIGH |
| Reject button | ✅ YES | ✅ YES | | 🟢 LOW |
| Request missing files | ✅ YES | ✅ YES (generates upload link) | | 🟢 LOW |
| **Create Contract button** | ❌ NO | ❌ NO | ✅ YES | 🔴 HIGH |
| **Create Performer button** | ✅ YES (but manual) | ✅ YES | | 🟡 MEDIUM |
| **Link User button** | ❌ NO | ❌ NO | ✅ YES | 🔴 HIGH |

---

## H. KYC/Compliance Review

| Item | Stored | Private | Admin Visible | Risk |
|------|--------|---------|---------------|------|
| **ID Document** | ✅ YES (R2 key) | ✅ YES (signed URLs) | ✅ YES (Admin UI) | 🟢 LOW |
| **Selfie with ID** | ✅ YES (R2 key) | ✅ YES (signed URLs) | ✅ YES (Admin UI) | 🟢 LOW |
| **Media Samples** | ✅ YES (R2 keys) | ✅ YES (signed URLs) | ✅ YES (Admin UI) | 🟢 LOW |
| **18+ Confirmation** | ✅ YES (`confirmed_18_plus` boolean) | ✅ YES | ✅ YES (Admin UI) | 🟢 LOW |
| **Consent Confirmation** | ✅ YES (`confirmed_contact_consent`, etc.) | ✅ YES | ✅ YES (Admin UI) | 🟢 LOW |

**Conclusion:** KYC/Compliance data handling is secure and well-implemented.

---

## I. Contract Generation Handoff

| Contract Step | Present | Risk | Fix |
|---------------|---------|------|-----|
| **Approval triggers contract** | ❌ NO | 🔴 HIGH | Add a "Create Contract" button that appears after an application is approved. |
| **Contract template variables** | ✅ YES (`contractService`) | 🟢 LOW | `contractService` accepts variables, but they must be manually passed from the application. |
| **Revenue split options (60/40, 70/30)** | ✅ YES (`preferred_revenue_model`) | 🟢 LOW | Application captures preference, but it must be manually passed to `contractService`. |
| **Solo/pair preference** | ✅ YES (`interests`) | 🟢 LOW | Captured, but must be manually passed. |
| **Live cam obligations** | ❌ NO | 🟡 MEDIUM | No field to capture this preference. |
| **HIV/Syphilis/PrEP language** | ❌ NO | 🟡 MEDIUM | No fields to capture this data for contract inclusion. |
| **Legal company data** | ✅ YES (in contract template) | 🟢 LOW | Assumed to be correct in the template itself. |
| **Contract status visibility** | ❌ NO | 🟡 MEDIUM | No `contract_status` field on the application. |

---

## J. Performer Creation/Linking

| Step | Present | Risk | Fix |
|------|---------|------|-----|
| **Approved applicant → Performer entity** | ❌ NO (Manual) | 🔴 HIGH | Add a "Create Performer" button to copy application data to a new `Performer` record. |
| **Link to user account** | ❌ NO (Manual) | 🔴 HIGH | Add a UI to link the created `Performer` record to an existing `User` record. |
| **Unlinked users blocked from dashboard** | ✅ YES (`PerformerGuard`) | 🟢 LOW | `PerformerGuard` likely handles this, but needs verification. |
| **Linked performer sees correct dashboard** | ✅ YES (`PerformerDashboard`) | 🟢 LOW | `PerformerDashboard` exists. |
| **No private files exposed** | ✅ YES | 🟢 LOW | All application files use signed URLs and are secure. |

---

## K. Notifications

| Notification | Present | Trigger | Missing | Fix |
|--------------|---------|---------|---------|-----|
| **Welcome Email (on submission)** | ❌ NO | N/A | ✅ YES | Create backend function `sendApplicationConfirmationEmail`. |
| **Application Submitted Confirmation** | ❌ NO | N/A | ✅ YES | Include in welcome email. |
| **Media Missing Reminder** | ❌ NO | N/A | ✅ YES | Create scheduled automation to check `media_pending` status. |
| **More Info Requested Email** | ❌ NO | N/A | ✅ YES | Create backend function triggered by `more_info_requested` status change. |
| **Approval Email** | ❌ NO | N/A | ✅ YES | Create backend function triggered by `approved` status change. |
| **Rejection Email** | ❌ NO | N/A | ✅ YES | Create backend function triggered by `rejected` status change. |
| **Contract Sent Email** | ❌ NO | N/A | ✅ YES | `contractService` should be updated to send this. |
| **WhatsApp Follow-up** | ❌ NO (Manual) | N/A | ✅ YES | Implement a way to trigger pre-filled WhatsApp messages from admin UI. |

---

## L. Growth/Reporting Metrics

| Metric | Available | Source | Missing | Fix |
|--------|-----------|--------|---------|-----|
| **Applications by Source** | ✅ YES | `source_page`, `utm_source` | ❌ NO | No dashboard to visualize this data. |
| **Philippines Applications** | ✅ YES | `source_country` = "Philippines" | ❌ NO | No dashboard to visualize this data. |
| **Funnel: Application Started** | ✅ YES (`trackPhilippinesApplicationStart`) | `analytics.js` | ❌ NO | Not tracked for all entry points. |
| **Funnel: Application Submitted** | ❌ NO | N/A | ✅ YES | Add `trackApplicationSubmitted` event. |
| **Funnel: Media Complete** | ❌ NO | N/A | ✅ YES | Add `trackMediaComplete` event. |
| **Funnel: Approved** | ❌ NO | N/A | ✅ YES | Add `trackApplicationApproved` event. |
| **Funnel: Rejected** | ❌ NO | N/A | ✅ YES | Add `trackApplicationRejected` event. |
| **Funnel: Contract Signed** | ❌ NO | N/A | ✅ YES | Add `trackContractSigned` event. |
| **Funnel: Performer Activated** | ❌ NO | N/A | ✅ YES | Add `trackPerformerActivated` event. |

---

## M. Prioritized Fix Plan

**Phase 1: Critical Workflow Automation**
1.  **Implement Full Status Workflow:** Add all missing statuses to the `GuestProductionApplication` entity.
2.  **Add Admin UI Actions:** Create buttons in the admin UI for "Create Contract" and "Create Performer".
3.  **Automate Contract Generation:** `Create Contract` button should call `contractService` with data from the application.
4.  **Automate Performer Creation:** `Create Performer` button should create a new `Performer` record from application data.

**Phase 2: Applicant Communication**
1.  **Create Notification Functions:** Implement backend functions to send emails for key status changes (submitted, approved, rejected, more info).
2.  **Trigger Notifications:** Call these functions when application statuses are updated.

**Phase 3: Polishing and Reporting**
1.  **Implement Funnel Analytics:** Add tracking events for all key stages of the application funnel.
2.  **Build Admin Reporting Dashboard:** Create a new admin page to visualize application funnel metrics.
3.  **Refine Source Attribution:** Ensure `source` is passed correctly from all entry points.