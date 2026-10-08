# V1 → V2 Backoffice Migration Audit Report

**Audit Date:** 2026-05-31  
**Audit Scope:** V1 Backoffice Entities → V2 Studio Management  
**Status:** CONDITIONAL GO ✅

---

## Executive Summary

V2 platform is **operational for public content** with successful migration of:
- ✅ **17 Performers** (100% from V1)
- ✅ **88 Videos** (100% assigned, 0 unassigned)
- ✅ **4 Brands** (100% from V1)
- ✅ **21 News Articles** (100% from V1)

**Backoffice migration** requires manual V1 data export (API not available) and creation of ComplianceRecord entity.

**Risk Level:** MEDIUM  
**Estimated Time:** 30-60 minutes

---

## V2 Current State

| Entity | Count | With V1 ID | Migration Status |
|--------|-------|------------|------------------|
| Performer | 17 | 17 (100%) | ✅ Complete |
| Video | 88 | 88 (100%) | ✅ Complete |
| Brand | 4 | 4 (100%) | ✅ Complete |
| NewsArticle | 21 | 21 (100%) | ✅ Complete |
| Contract | 0 | 0 | ⏳ Pending |
| GuestProductionApplication | 0 | 0 | ⏳ Pending |
| ComplianceRecord | 0 | 0 | ⏳ Entity Created |
| Fanclub | 0 | 0 | ⏳ Post-launch |

---

## V1 Backoffice Entities Analysis

### CRITICAL PRIORITY (Required for V2 Launch)

#### 1. PerformerApplication → GuestProductionApplication
- **Estimated Count:** 19+ (based on performer count)
- **Fields:** applicant_name, email, phone, nationality, message, package_interest, id_document_url, status, submitted_at
- **Relationship:** 1:1 → Performer (application becomes performer)
- **File Fields:** id_document_url (private R2)
- **Sensitive:** email, phone, ID documents
- **V2 Mapping:** GuestProductionApplication (entity exists ✅)
- **Migration:** Requires V1 data export (JSON/CSV)

#### 2. PerformerContract → Contract
- **Estimated Count:** 17+ (active performers)
- **Fields:** performer_id, contract_type, title, status, signed_at, expires_at, document_url
- **Relationship:** 1:1 or 1:many → Performer
- **File Fields:** document_url (private R2)
- **Sensitive:** payment terms, bank details, tax ID
- **V2 Mapping:** Contract entity (exists ✅, contract_type="performer")
- **Migration:** Merge ContractSignature data into signed_at, document_url

#### 3. PartnerComplianceDocument → ComplianceRecord
- **Estimated Count:** 17+ (active performers)
- **Fields:** performer_id, document_type, document_url, issued_at, expires_at, status
- **Relationship:** 1:many → Performer (multiple docs over time)
- **File Fields:** document_url, id_scan_url, test_results_url (private R2)
- **Sensitive:** medical test results, government ID numbers
- **V2 Mapping:** ComplianceRecord (entity created ✅)
- **Migration:** **REQUIRES MANUAL V1 EXPORT**

#### 4. GuestProductionApplication → GuestProductionApplication
- **Estimated Count:** Unknown (matches applications)
- **Fields:** applicant_name, email, phone, nationality, message, package_interest, id_document_url, status
- **V2 Mapping:** GuestProductionApplication (exists ✅)
- **Migration:** Merge with PerformerApplication data

#### 5. GuestProductionApplicantMedia → Merge into Applications
- **Estimated Count:** Unknown
- **Fields:** application_id, media_type, media_url, document_type
- **V2 Mapping:** Merge into GuestProductionApplication.id_document_url
- **Migration:** Attach media URLs to applications

---

### POST-LAUNCH ONLY (Not Required for Launch)

| Entity | Estimated Count | V2 Mapping | Priority |
|--------|----------------|------------|----------|
| PartnerProductionCompliance | Unknown | Extend ComplianceRecord | LOW |
| ProductionCompatibilityProfile | Unknown | Performer.bio extension | LOW |
| PerformerEarnings | Unknown | Payment entity | LOW |
| PerformerPayoutBatch | Unknown | Payment entity (batch) | LOW |
| PerformerRevenue | Unknown | Aggregate from Payment | LOW |
| PerformerGuestProductionMedia | Unknown | VideoAsset or Portfolio | LOW |
| GuestProductionPackage | 3-10 | Application metadata | LOW |
| ContractTemplate | 3-5 | Static document storage | LOW |
| GuestProductionReleaseTemplate | 1-3 | Static document storage | LOW |

---

## DO NOT MIGRATE

**Fields to Exclude:**
- ❌ Password hashes (re-authenticate in V2)
- ❌ Internal admin notes (re-create in V2)
- ❌ Legacy IDs (use v1_id field for mapping)
- ❌ Internal accounting codes (use V2 system)
- ❌ Audit trail metadata (start fresh)
- ❌ IP addresses / user agents (privacy)

---

## Sensitive Data Handling

| Data Type | Storage | Access | Encryption | Retention |
|-----------|---------|--------|------------|-----------|
| ID Documents | Private R2 bucket | Admin-only, signed URLs | Encrypt at rest | 7 years min |
| Medical Records | Separate private bucket | Admin + compliance officer | Encrypt at rest + transit | Per regulations |
| Bank Details | **DO NOT MIGRATE** | Re-collect in V2 | N/A | N/A |
| Tax Information | Encrypted fields | Admin-only, access logging | Encrypt at rest | 7 years |
| Signatures | Image URLs with access control | Admin-only | Standard | Contract term + 7 years |

---

## Relationship Mapping

```
PerformerApplication (1) → (1) Performer
Performer (1) → (1 or many) Contract
Performer (1) → (many) ComplianceRecord
Contract (1) → (1) Signature [MERGED]
Application (1) → (many) ApplicantMedia
Performer (many) → (many) Video [via VideoPerformer]
Video (1) → (many) VideoAsset
```

---

## Migration Plan

### Prerequisites ✅
- [x] Performers migrated with v1_id mapping (17/17)
- [x] ComplianceRecord entity created
- [ ] V1 backoffice data exported (manual)
- [ ] Private R2 bucket configured
- [ ] Admin users configured in V2

### Stage 1: GuestProductionApplication Import
- **Source:** V1 PerformerApplication + GuestProductionApplication export
- **Transform:** Merge application data, map status values, attach media URLs
- **Function:** `importBackofficeFromV1` (applications_file_url)
- **Time:** ~5 minutes

### Stage 2: Contract Import
- **Source:** V1 PerformerContract + ContractSignature export
- **Transform:** Map contract_type="performer", merge signature data
- **Function:** `importBackofficeFromV1` (contracts_file_url)
- **Time:** ~5 minutes

### Stage 3: ComplianceRecord Import
- **Source:** V1 PartnerComplianceDocument export
- **Transform:** Map document_type, status, performer_id lookup
- **Function:** `importBackofficeFromV1` (compliance_file_url)
- **Time:** ~10 minutes

### Validation Steps
1. ✅ Verify all performer_id references resolve (v1_id mapping)
2. ⏳ Verify all file URLs are accessible (R2 migration if needed)
3. ⏳ Verify contract signed_at dates are valid ISO 8601
4. ⏳ Verify compliance documents have not expired
5. ⏳ Verify application status values match V2 enum

---

## Export Function Plan

**NOTE:** V1 API does not expose backoffice endpoints via REST. Manual export required.

**Required Files:**
1. `performer-applications.json` - V1 PerformerApplication records
2. `performer-contracts.json` - V1 PerformerContract + ContractSignature
3. `compliance-documents.json` - V1 PartnerComplianceDocument

**Export Instructions:**
1. Export V1 data from V1 admin panel or database dump
2. Format as JSON arrays with consistent field names
3. Upload files to V2 using UploadFile integration
4. Call `importBackofficeFromV1` with file URLs (dry_run=true first)
5. Review results, then run with dry_run=false

---

## GO / NO-GO Recommendation

### ✅ CONDITIONAL GO

**Conditions:**
- ✅ Core content migrated (Performers: 17, Videos: 88, Brands: 4)
- ⚠️ ComplianceRecord entity created (DONE ✅)
- ⚠️ V1 backoffice data must be exported manually (PENDING)
- ⚠️ Private R2 bucket must be configured for documents (PENDING)
- ⚠️ Admin users must be configured in V2 (PENDING)

**Risk Level:** MEDIUM

**Rationale:**
V2 is fully operational for public content (videos, performers, brands). Backoffice migration requires:
1. Manual V1 data export (API not available)
2. ComplianceRecord entity (created ✅)
3. Private R2 configuration
4. Admin workflow completion

No technical blockers exist. Migration can proceed once V1 data is exported.

**Estimated Migration Time:** 30-60 minutes (including data export, validation, and import)

**Post-Launch Items:**
- Payment/revenue tracking (PerformerEarnings, PerformerPayoutBatch)
- Production compliance (PartnerProductionCompliance)
- Performer preferences (ProductionCompatibilityProfile)
- Contract templates (static storage)

---

## Backend Functions Created

| Function | Purpose | Status |
|----------|---------|--------|
| `auditBackofficeMigration` | Analyze V1 entities, create migration plan | ✅ Ready |
| `generateBackofficeMigrationAudit` | Generate comprehensive audit report | ✅ Ready |
| `exportBackofficeForV2` | Prepare export instructions | ✅ Ready |
| `importBackofficeFromV1` | Import applications, contracts, compliance | ✅ Ready |

---

## Next Steps

1. **Export V1 Data** (Manual)
   - Export PerformerApplication, PerformerContract, PartnerComplianceDocument from V1
   - Format as JSON files

2. **Configure Private R2** (Admin)
   - Set up private bucket for sensitive documents
   - Migrate document URLs if needed

3. **Upload V1 Data Files** (Admin)
   - Upload JSON files to V2
   - Get file URLs

4. **Run Dry-Run Import** (Developer)
   ```
   POST /functions/importBackofficeFromV1
   {
     "applications_file_url": "...",
     "contracts_file_url": "...",
     "compliance_file_url": "...",
     "dry_run": true
   }
   ```

5. **Validate Results** (Admin)
   - Review dry-run output
   - Verify record counts
   - Check for errors

6. **Execute Live Import** (Developer)
   ```
   { "dry_run": false }
   ```

7. **Post-Migration Validation** (Admin)
   - Verify all contracts linked to performers
   - Verify compliance documents valid
   - Test admin workflows

---

**Audit Completed:** 2026-05-31T17:53:30Z  
**Prepared By:** Base44 Migration Audit System  
**Status:** READY FOR V1 DATA EXPORT