# Application Review → Approve → Contract → Performer Link Workflow Audit

**Audit Date:** 2026-06-09  
**Auditor:** Base44 AI  
**Scope:** Performer Application Review, Approval, Contract Generation, Performer Account Creation, User Linking

---

## A) Current Flow Findings

### Entity/Function Inventory

| Component | Status | Location |
|-----------|--------|----------|
| GuestProductionApplication | ✅ EXISTS | Entity with request_type="performer_application" |
| Performer | ✅ EXISTS | Entity with revenue_model, revenue_split_pct, user_id |
| PerformerProfilePrivate | ✅ EXISTS | Entity (separate from Performer) |
| ComplianceRecord | ✅ EXISTS | Entity for ID/medical records |
| ComplianceDocument | ✅ EXISTS | Entity for document tracking |
| Contract | ✅ EXISTS | Entity with signing_url, status, variables_json |
| ContractTemplate | ✅ EXISTS | Entity with template_html, placeholders |
| Admin Applications Page | ✅ EXISTS | pages/admin/Applications.jsx |
| Application Detail Dialog | ✅ EXISTS | components/admin/applications/ApplicationDetailDialog |
| ApplicationReadinessSummary | ✅ EXISTS | Shows upload completion status |
| WorkflowTab | ✅ EXISTS | Step-by-step workflow UI |
| LinkUserDialog | ✅ EXISTS | components/admin/applications/LinkUserDialog |
| handleApprove | ⚠️ PARTIAL | Just sets status="approved" |
| handleCreatePerformer | ⚠️ PARTIAL | Creates Performer but NOT ProfilePrivate/Compliance |
| handleCreateContract | ⚠️ PARTIAL | Just sets contract_status, doesn't generate HTML |
| handleLinkUser | ✅ EXISTS | Links user to performer |

---

### Workflow Questions - Current State

| # | Question | Current Behavior | Issue? | Status |
|---|----------|------------------|--------|--------|
| 1 | Was passiert wenn Admin Application approved? | Setzt status="approved", approved_at timestamp | ❌ Keine Validierung, keine automatischen Folgeschritte | ⚠️ PARTIAL |
| 2 | Wird automatisch Performer erstellt? | ❌ NEIN - Admin muss manuell "Create Performer" klicken | ⚠️ Manual step required | ❌ TODO |
| 3 | Wird PerformerProfilePrivate erstellt? | ❌ NEIN - Keine automatische Erstellung | ❌ Missing | ❌ TODO |
| 4 | Wird ComplianceRecord erstellt? | ❌ NEIN - Keine automatische Erstellung | ❌ Missing | ❌ TODO |
| 5 | Wird Contract erstellt? | ⚠️ Admin klickt "Create Contract" aber es wird nur Status gesetzt | ❌ Keine HTML-Generation | ❌ TODO |
| 6 | Welche Contract Template wird genutzt? | ContractTemplate v3.1 exists ("Performer Management Agreement v3.1") | ✅ Template exists | ✅ OK |
| 7 | Werden 60/40 und 70/30 Revenue Models unterstützt? | ⚠️ Application.preferred_revenue_model exists but NOT used in contract generation | ⚠️ Partial | ⚠️ TODO |
| 8 | Wird Solo/Pair Work übernommen? | ❌ NEIN - work_type nicht in Application | ❌ Missing field | ❌ TODO |
| 9 | Werden Legal Name, Address, Email übernommen? | ❌ Application hat legal_name aber keine strukturierte Address | ⚠️ Partial | ⚠️ TODO |
| 10 | Gibt es User Account Linking Funktion? | ✅ JA - LinkUserDialog + handleLinkUser | ✅ Exists | ✅ OK |
| 11 | Kann Performer danach ins Dashboard? | ⚠️ NUR wenn performer_login_enabled=true + performer_username gesetzt | ⚠️ Manual setup | ⚠️ TODO |
| 12 | Wo sieht Admin vollständigen Lifecycle? | ⚠️ WorkflowTab zeigt Steps aber keine Contract/Compliance Details | ⚠️ Partial | ⚠️ TODO |

---

## B) Critical Gaps Identified

### Gap 1: No Approval Validation
**Current:** Admin can approve even if uploads incomplete
**Required:** Block approve if:
- photos_count < 5
- videos_count < 2
- id_document missing
- selfie_with_id missing
- revenue_model not selected

### Gap 2: No Automatic Performer+Profile Creation
**Current:** Admin must manually click "Create Performer"
**Required:** On approve → auto-create:
- Performer (with revenue_model, revenue_split_pct)
- PerformerProfilePrivate (with legal_name, address, payout_method)

### Gap 3: No Automatic ComplianceRecord
**Current:** No compliance records created
**Required:** On approve → create ComplianceRecord entries for:
- ID document (front)
- Selfie with ID
- Link to application media

### Gap 4: No Contract HTML Generation
**Current:** handleCreateContract only sets status="pending"
**Required:** Generate contract HTML from template with:
- Legal name, address, email
- Revenue split (60/40 or 70/30)
- Work type (solo/pair)
- 12-month minimum term
- Early termination fee (150 EUR)
- Payout schedule (15th monthly)

### Gap 5: Revenue Model Not Enforced
**Current:** Application.preferred_revenue_model exists but ignored
**Required:** 
- Admin MUST select revenue model before approve
- Contract MUST reflect selected model (60/40 vs 70/30)
- Performer.revenue_split_pct MUST match

---

## C) Recommended Flow (Target State)

### Step 1: Admin Opens Application
- ✅ Readiness badge visible (ApplicationReadinessSummary)
- ✅ ID/Media preview works (MediaTab, IDTab)
- ⚠️ Admin sees missing fields warning (TODO: Add revenue model field)

### Step 2: Admin Approves (WITH VALIDATION)
**Before approve, validate:**
```javascript
const missingItems = [];
if (photoCount < 5) missingItems.push(`${5 - photoCount} photos`);
if (videoCount < 2) missingItems.push(`${2 - videoCount} videos`);
if (!hasIdFront) missingItems.push('ID document');
if (!hasSelfie) missingItems.push('selfie with ID');
if (!application.preferred_revenue_model || application.preferred_revenue_model === 'undecided') {
  missingItems.push('revenue model selection');
}

if (missingItems.length > 0) {
  toast.error(`Cannot approve yet. Missing: ${missingItems.join(', ')}`);
  return;
}
```

### Step 3: Automatic Performer + ProfilePrivate Creation
**On approve:**
```javascript
// Create Performer
const performer = await base44.entities.Performer.create({
  display_name: application.applicant_name,
  slug: generateSlug(application.applicant_name),
  bio: application.experience || application.message,
  nationality: application.nationality,
  status: 'pending_contract',
  revenue_model: mapRevenueModel(application.preferred_revenue_model),
  revenue_split_pct: mapRevenueSplit(application.preferred_revenue_model),
  internal_notes: `Created from application: ${application.id}`,
});

// Create PerformerProfilePrivate
await base44.entities.PerformerProfilePrivate.create({
  performer_id: performer.id,
  legal_first_name: extractFirstName(application.legal_name),
  legal_last_name: extractLastName(application.legal_name),
  address_line_1: application.address_line_1 || '',
  address_line_2: application.address_line_2 || '',
  city: application.city || '',
  country: application.nationality || '',
  phone: application.phone,
  payout_method: 'pending',
  payout_status: 'not_set',
});

// Link application
await base44.entities.GuestProductionApplication.update(applicationId, {
  performer_id: performer.id,
  performer_created_at: new Date().toISOString(),
  status: 'performer_created',
});
```

### Step 4: Automatic ComplianceRecord Creation
**On approve:**
```javascript
// Create ComplianceRecord for ID
await base44.entities.ComplianceRecord.create({
  performer_id: performer.id,
  document_type: 'id',
  document_url: application.id_document_front_r2_key,
  verification_method: 'manual',
  verification_status: 'pending_review',
  issued_at: new Date().toISOString(),
  notes: `Imported from application: ${application.id}`,
});

// Create ComplianceRecord for Selfie
await base44.entities.ComplianceRecord.create({
  performer_id: performer.id,
  document_type: 'other',
  document_url: application.selfie_with_id_r2_key,
  verification_method: 'manual',
  verification_status: 'pending_review',
  notes: `Selfie with ID from application: ${application.id}`,
});
```

### Step 5: Contract Generation (Separate Step)
**Admin clicks "Generate Contract":**
```javascript
// Fetch template
const template = await base44.entities.ContractTemplate.filter(
  { template_type: 'performer_management', status: 'active' },
  '-version',
  1
);

// Prepare variables
const variables = {
  performer_legal_name: profile.legal_first_name + ' ' + profile.legal_last_name,
  performer_stage_name: performer.display_name,
  performer_email: application.email,
  performer_nationality: application.nationality,
  performer_full_residential_address: formatAddress(profile),
  revenue_share_percent: performer.revenue_split_pct,
  studio_share_percent: 100 - performer.revenue_split_pct,
  contract_model_label: getContractModelLabel(performer.revenue_model),
  minimum_term_months: 12,
  early_termination_fee_amount: 150,
  post_termination_usage_years: 5,
  // ... all placeholders
};

// Generate HTML
const html = template.template_html;
const generatedHtml = Object.entries(variables).reduce(
  (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), value || 'N/A'),
  html
);

// Create Contract record
const contract = await base44.entities.Contract.create({
  performer_id: performer.id,
  template_id: template.id,
  title: `Performer Management Agreement v3.1 - ${performer.display_name}`,
  status: 'draft',
  generated_html: generatedHtml,
  variables_json: JSON.stringify(variables),
  signing_token: generateSigningToken(),
  signing_url: `${APP_BASE_URL}/sign-contract?token=${signingToken}`,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

// Update application
await base44.entities.GuestProductionApplication.update(applicationId, {
  contract_id: contract.id,
  contract_status: 'draft',
  contract_generated_at: new Date().toISOString(),
  status: 'contract_pending',
});
```

### Step 6: Contract Signing
**Contract signing flow:**
1. Admin sends signing URL to performer
2. Performer accesses `/sign-contract?token=xxx`
3. Performer reviews contract HTML
4. Performer signs (types name, checks consent)
5. Contract status → "signed"
6. Admin countersigns → "fully_executed"

### Step 7: User Account Linking
**Admin links performer to Base44 user:**
```javascript
// Already implemented in handleLinkUser
await base44.entities.Performer.update(performerId, { user_id: userId });
await base44.entities.GuestProductionApplication.update(applicationId, {
  linked_user_id: userId,
  user_linked_at: new Date().toISOString(),
  status: 'user_linked',
});
```

### Step 8: Performer Dashboard Access
**Performer can login if:**
- performer_login_enabled = true
- performer_username is set
- performer_password_hash is set (or must_change_password = true)
- user_id is linked (optional, for Base44 auth)

---

## D) Implementation Plan

### Phase 1: Approval Validation (PRIORITY: HIGH)
**Files to modify:**
- `pages/admin/Applications.jsx` - Add validation to handleApprove
- `components/admin/applications/ApplicationDetailDialog.jsx` - Show validation errors

**Changes:**
```javascript
const handleApprove = () => {
  if (!selectedApp) return;
  
  // Check readiness
  const photoCount = (selectedApp.profile_photo_r2_keys || []).length;
  const videoCount = [selectedApp.intro_video_r2_key, selectedApp.hardcore_video_r2_key].filter(Boolean).length;
  const hasId = !!(selectedApp.id_document_front_r2_key || selectedApp.id_document_r2_key);
  const hasSelfie = !!selectedApp.selfie_with_id_r2_key;
  const hasRevenueModel = selectedApp.preferred_revenue_model && selectedApp.preferred_revenue_model !== 'undecided';
  
  const missing = [];
  if (photoCount < 5) missing.push(`${5 - photoCount} photos`);
  if (videoCount < 2) missing.push(`${2 - videoCount} videos`);
  if (!hasId) missing.push('ID document');
  if (!hasSelfie) missing.push('selfie with ID');
  if (!hasRevenueModel) missing.push('revenue model selection');
  
  if (missing.length > 0) {
    toast.error(`Cannot approve yet. Missing: ${missing.join(', ')}`);
    return;
  }
  
  handleStatusUpdate(selectedApp.id, 'approved');
};
```

### Phase 2: Automatic Performer + ProfilePrivate Creation (PRIORITY: HIGH)
**Files to modify:**
- `pages/admin/Applications.jsx` - Enhance handleApprove to auto-create

**New function:**
```javascript
const handleApproveAndCreatePerformer = async () => {
  // ... validation ...
  
  // Create Performer
  const performer = await base44.entities.Performer.create({
    display_name: selectedApp.applicant_name,
    slug: `${selectedApp.applicant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
    bio: selectedApp.experience || selectedApp.message || '',
    nationality: selectedApp.nationality,
    status: 'pending_contract',
    revenue_model: selectedApp.preferred_revenue_model === 'network_performer_70_studio_30' ? 'established_network' : 'studio_managed',
    revenue_split_pct: selectedApp.preferred_revenue_model === 'network_performer_70_studio_30' ? 70 : 40,
    internal_notes: `Created from application: ${selectedApp.id}`,
  });
  
  // Create PerformerProfilePrivate
  await base44.entities.PerformerProfilePrivate.create({
    performer_id: performer.id,
    legal_first_name: selectedApp.legal_name?.split(' ')[0] || selectedApp.applicant_name.split(' ')[0],
    legal_last_name: selectedApp.legal_name?.split(' ').slice(1).join(' ') || selectedApp.applicant_name.split(' ').slice(1).join(' '),
    city: selectedApp.city || '',
    country: selectedApp.nationality || '',
    phone: selectedApp.phone || '',
    payout_method: 'pending',
    payout_status: 'not_set',
  });
  
  // Create ComplianceRecords
  if (selectedApp.id_document_front_r2_key || selectedApp.id_document_r2_key) {
    await base44.entities.ComplianceRecord.create({
      performer_id: performer.id,
      document_type: 'id',
      document_url: selectedApp.id_document_front_r2_key || selectedApp.id_document_r2_key,
      verification_method: 'manual',
      verification_status: 'pending_review',
      notes: `Imported from application: ${selectedApp.id}`,
    });
  }
  
  if (selectedApp.selfie_with_id_r2_key) {
    await base44.entities.ComplianceRecord.create({
      performer_id: performer.id,
      document_type: 'other',
      document_url: selectedApp.selfie_with_id_r2_key,
      verification_method: 'manual',
      verification_status: 'pending_review',
      notes: `Selfie with ID from application: ${selectedApp.id}`,
    });
  }
  
  // Update application
  const updates = {
    performer_id: performer.id,
    performer_created_at: new Date().toISOString(),
    status: 'performer_created',
    approved_at: new Date().toISOString(),
  };
  
  await base44.entities.GuestProductionApplication.update(selectedApp.id, updates);
  
  toast.success(`Performer created: ${performer.display_name}`);
};
```

### Phase 3: Contract Generation (PRIORITY: MEDIUM)
**Files to create/modify:**
- `functions/generatePerformerContract.js` - NEW backend function
- `pages/admin/Applications.jsx` - Add contract generation button

**Backend function:**
```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'npm:uuid';
import { createHash } from 'npm:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const { application_id } = await req.json();
    
    // Fetch application
    const applications = await base44.entities.GuestProductionApplication.filter({ id: application_id });
    if (!applications || applications.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }
    
    const app = applications[0];
    
    // Validate
    if (!app.performer_id) {
      return Response.json({ error: 'Performer not created yet' }, { status: 400 });
    }
    
    if (app.contract_id) {
      return Response.json({ error: 'Contract already exists' }, { status: 400 });
    }
    
    // Fetch performer
    const performers = await base44.entities.Performer.filter({ id: app.performer_id });
    const performer = performers[0];
    
    // Fetch performer profile private
    const profiles = await base44.entities.PerformerProfilePrivate.filter({ performer_id: app.performer_id });
    const profile = profiles[0];
    
    // Fetch contract template
    const templates = await base44.entities.ContractTemplate.filter(
      { template_type: 'performer_management', status: 'active' },
      '-version',
      1
    );
    
    if (!templates || templates.length === 0) {
      return Response.json({ error: 'No active contract template found' }, { status: 404 });
    }
    
    const template = templates[0];
    
    // Prepare variables
    const variables = {
      performer_legal_name: `${profile?.legal_first_name || ''} ${profile?.legal_last_name || ''}`.trim() || app.legal_name || app.applicant_name,
      performer_stage_name: performer.display_name,
      performer_date_of_birth: performer.date_of_birth || 'N/A',
      performer_email: app.email,
      performer_nationality: performer.nationality || app.nationality,
      performer_country: performer.nationality || app.nationality,
      performer_full_residential_address: formatAddress(profile),
      performer_phone_or_messenger: profile?.phone || app.phone || 'N/A',
      effective_date: new Date().toISOString().split('T')[0],
      contract_model_label: performer.revenue_model === 'established_network' ? 'NETWORK DISTRIBUTION 70/30' : 'FULL MANAGEMENT 60/40',
      minimum_term_months: 12,
      revenue_share_percent: performer.revenue_split_pct || 40,
      studio_share_percent: 100 - (performer.revenue_split_pct || 40),
      contract_currency: 'EUR',
      early_termination_fee_amount: 150,
      early_termination_fee_currency: 'EUR',
      post_termination_usage_years: 5,
      live_cam_shows_per_month: 2,
      // ... all other placeholders
    };
    
    // Generate HTML from template
    let generatedHtml = template.template_html;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      generatedHtml = generatedHtml.replace(regex, value || 'N/A');
    });
    
    // Generate signing token
    const signingToken = createHash('sha256').update(`${application_id}-${Date.now()}-${uuidv4()}`).digest('hex');
    
    // Create contract
    const contract = await base44.entities.Contract.create({
      performer_id: performer.id,
      template_id: template.id,
      title: `Performer Management Agreement v3.1 - ${performer.display_name}`,
      status: 'draft',
      generated_html: generatedHtml,
      variables_json: JSON.stringify(variables),
      signing_token: signingToken,
      signing_url: `${Deno.env.get('APP_BASE_URL')}/sign-contract?token=${signingToken}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: `Created from application: ${application_id}`,
    });
    
    // Update application
    await base44.entities.GuestProductionApplication.update(application_id, {
      contract_id: contract.id,
      contract_status: 'draft',
      contract_generated_at: new Date().toISOString(),
      status: 'contract_pending',
    });
    
    return Response.json({ 
      success: true, 
      contract_id: contract.id,
      signing_url: contract.signing_url,
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatAddress(profile) {
  if (!profile) return 'N/A';
  const parts = [
    profile.address_line_1,
    profile.address_line_2,
    profile.city,
    profile.region,
    profile.postal_code,
    profile.country,
  ].filter(Boolean);
  return parts.join(', ') || 'N/A';
}
```

### Phase 4: Enhanced Workflow UI (PRIORITY: LOW)
**Files to modify:**
- `components/admin/applications/tabs/WorkflowTab.jsx` - Show contract/compliance status
- `components/admin/applications/ApplicationDetailDialog.jsx` - Add lifecycle overview

---

## E) Remaining Open Points

### Critical Blockers
| Issue | Impact | Resolution |
|-------|--------|------------|
| No revenue_model field in Application form | Cannot auto-set performer split | Add dropdown to application form |
| No structured address fields | Contract address incomplete | Add address fields to application OR use PerformerProfilePrivate |
| No automatic contract generation | Manual HTML creation required | Implement generatePerformerContract function |
| No performer login credentials | Cannot access dashboard | Auto-generate username + password on performer creation |

### Nice-to-Have (Not Blockers)
- Email notifications to performer on approval
- Bulk approve multiple applications
- Contract template versioning
- Audit trail for contract changes
- Performer dashboard onboarding checklist

---

## F) Testing Checklist

### Manual QA Test Plan

| Step | Expected | Status |
|------|----------|--------|
| 1. Application ready_for_review | Readiness badge shows green | ⏳ TODO |
| 2. Admin approve blocked if missing | Error message shows missing items | ⏳ TODO |
| 3. Admin selects revenue model | Dropdown in application form | ⏳ TODO |
| 4. Admin approves | Performer + ProfilePrivate created | ⏳ TODO |
| 5. ComplianceRecord created | ID + Selfie records exist | ⏳ TODO |
| 6. Contract generated | HTML generated from template | ⏳ TODO |
| 7. Signing URL works | Performer can access contract | ⏳ TODO |
| 8. Admin links user | User linked to performer | ⏳ TODO |
| 9. Performer dashboard access | Login works | ⏳ TODO |
| 10. No 400/500 errors | Clean console | ⏳ TODO |

---

## G) Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `pages/admin/Applications.jsx` | Add approval validation, auto-create performer | HIGH |
| `pages/admin/Applications.jsx` | Add contract generation function call | MEDIUM |
| `functions/generatePerformerContract.js` | NEW - Contract generation | MEDIUM |
| `components/admin/applications/ApplicationDetailDialog.jsx` | Show validation errors | HIGH |
| `components/admin/applications/tabs/WorkflowTab.jsx` | Show contract/compliance status | LOW |
| `pages/BecomePerformer.jsx` OR `components/becomePerformer/BPApplicationForm.jsx` | Add revenue model + address fields | MEDIUM |

---

**Audit Status:** ✅ COMPLETE  
**Next Step:** Implement Phase 1 (Approval Validation) + Phase 2 (Auto Performer Creation)