# Contract Verification Audit + Fix Plan

**Date:** 2026-06-01
**Status:** 🔴 CRITICAL ISSUE FOUND

## Current State Analysis

### Contract Entity Schema
```json
{
  "performer_id": "string",
  "contract_type": "release|performer|guest|licensing",
  "title": "string",
  "status": "draft|sent|signed|expired|cancelled",
  "signed_at": "datetime",
  "expires_at": "datetime",
  "document_url": "string",
  "notes": "string"
}
```

**Missing Fields:**
- ❌ `verified` (boolean)
- ❌ `verified_at` (datetime)
- ❌ `verified_by` (string - user ID or email)

### Compliance Check Logic (performerComplianceService.js)

**Current Rule:**
```javascript
// Level 2 — Legal: Valid signed release contract
const contracts = await base44.asServiceRole.entities.Contract.filter({
  performer_id,
  contract_type: 'release',
  status: 'signed'
});

if (contracts && contracts.length > 0) {
  const hasValidContract = contracts.some(c => {
    if (!c.expires_at) return true;
    return new Date(c.expires_at) > new Date();
  });
  
  if (hasValidContract) {
    gates.release_contract_ok = true;
  }
}
```

**Current Behavior:**
- ✅ Contract status "signed" + not expired = PASS
- ❌ NO verification check required
- ❌ NO manual verification UI exists

### UI State (ContractsSection.jsx)

**Available Actions:**
- ✅ Status dropdown (draft/sent/signed/expired/cancelled)
- ✅ View button
- ✅ Download button
- ❌ **NO Verify button**

### The Problem

**Performer: Ze[D] (6a1c2bffe44f9fcdccacd242)**
- KYC: ✅ approved
- Account: ✅ active  
- Contract: ✅ signed (1 contract)
- Records: ✅ valid (3 records)
- **Compliance Locked: 🔴 TRUE**

**Why Locked?**
The performer has an `outstanding_balance_usd: 175.5` which creates a medium-severity issue but does NOT trigger lock.

The REAL issue: The compliance check is looking for `contract_type: 'release'` but the signed contract is `contract_type: 'performer'`.

**Contract in DB:**
```json
{
  "id": "6a1ddfd537da420aab35f30b",
  "performer_id": "6a1c2bfd19fe764298123091", // Different performer!
  "contract_type": "performer",  // ❌ Should be 'release'
  "status": "signed",
  "title": "jay.pdf"
}
```

**Test Contract (for correct performer):**
```json
{
  "id": "6a1d77b59b72632592c1772c",
  "performer_id": "6a1c2bffe44f9fcdccacd242", // ✅ Correct performer
  "contract_type": "release",  // ✅ Correct type
  "status": "signed"  // ✅ Signed
}
```

## Root Causes

1. **Wrong Contract Type**: The "jay.pdf" contract is for a DIFFERENT performer AND has wrong contract_type
2. **No Verification Flow**: Even if contract_type was correct, there's no verification UI
3. **Silent Failure**: Compliance check doesn't explain WHY it failed (no detailed output in UI)

## Required Fixes

### Phase 1: Add Contract Verification Fields (Schema Update)

**Update Contract Entity:**
```json
{
  "verified": {"type": "boolean", "default": false},
  "verified_at": {"type": "string", "format": "date-time"},
  "verified_by": {"type": "string", "description": "User ID who verified"}
}
```

### Phase 2: Add Verify Button to UI

**ContractsSection.jsx:**
- Add "Verify" button next to signed contracts that are not verified
- Show "Verified" badge when verified
- Add verification modal or inline confirmation

### Phase 3: Update Compliance Check Logic

**performerComplianceService.js:**
```javascript
// Option A: Require verification (preferred)
if (contracts && contracts.length > 0) {
  const hasValidContract = contracts.some(c => {
    if (!c.expires_at) return true;
    const notExpired = new Date(c.expires_at) > new Date();
    const verified = c.verified === true; // NEW CHECK
    return notExpired && verified;
  });
  
  gates.release_contract_ok = hasValidContract;
}

// Option B: Signed is enough (current behavior)
// Keep as-is, no verification required
```

### Phase 4: Add Verification Action

**contractService.js:**
```javascript
if (action === 'verify_contract') {
  await base44.asServiceRole.entities.Contract.update(contract_id, {
    verified: true,
    verified_at: new Date().toISOString(),
    verified_by: user.email
  });
  
  // Trigger compliance re-evaluation
  await base44.asServiceRole.functions.invoke('performerComplianceService', {
    action: 'lock_evaluation',
    performer_id: contract.performer_id
  });
}
```

### Phase 5: Improve Compliance Output UI

**ComplianceActionsCard.jsx:**
- Show detailed gate results
- Show which gates passed/failed
- Show exact reason for lock

## Implementation Priority

**IMMEDIATE (Today):**
1. ✅ Fix the test data - ensure correct performer has correct contract type
2. ✅ Add contract verification fields to Contract entity
3. ✅ Add Verify button to ContractsSection UI
4. ✅ Add verify_contract action to contractService
5. ✅ Update compliance check to require verification

**NEXT (Tomorrow):**
6. Add detailed compliance gate output to UI
7. Add verification history/audit trail
8. Add contract verification to ComplianceSummaryCard

## Decision Required

**Question:** Should contract verification be REQUIRED for compliance?

**Recommended:** YES
- Signed = performer signed it
- Verified = admin reviewed and confirmed it's valid
- Both states are important for legal compliance

**Alternative:** NO
- Signed = sufficient (trust that signed contracts are valid)
- Remove verification requirement entirely

**Preferred:** Option 1 (Require verification)
- More robust compliance
- Prevents fake/forged contracts
- Matches medical record verification pattern

## Test Plan

After implementation:
1. Create contract with type "release" for test performer
2. Set status to "signed"
3. Verify contract via UI
4. Run compliance check
5. Confirm performer unlocks
6. Verify audit log shows verification

---

**End of Audit**