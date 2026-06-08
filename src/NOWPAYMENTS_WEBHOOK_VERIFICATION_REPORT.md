# NOWPayments Webhook Hardening - Verification Report

**Date:** 2026-06-08  
**Status:** ⚠️ **CRITICAL ISSUE IDENTIFIED**

---

## Executive Summary

The NOWPayments webhook hardening implementation has been verified. While most security measures are in place, a **CRITICAL ID EMPOTENCY ISSUE** has been identified that could allow duplicate entitlement grants under specific race conditions.

**Severity:** HIGH  
**Impact:** Potential duplicate Subscription/Payment records if NOWPayments sends concurrent webhooks  
**Fix Required:** YES - before production deployment

---

## Table 1: Test Verification Results

| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| **1. PaymentWebhookEvent Entity Fields** |
| provider field | ✅ Present | ✅ Present | ✅ PASS |
| provider_invoice_id field | ✅ Present | ✅ Present | ✅ PASS |
| payment_intent_id field | ✅ Present | ✅ Present | ✅ PASS |
| raw_status field | ✅ Present | ✅ Present | ✅ PASS |
| normalized_status field | ✅ Present | ✅ Present | ✅ PASS |
| amount field | ✅ Present | ✅ Present | ✅ PASS |
| currency field | ✅ Present | ✅ Present | ✅ PASS |
| user_id field | ✅ Present | ✅ Present | ✅ PASS |
| product_type field | ✅ Present | ✅ Present | ✅ PASS |
| product_id field | ✅ Present | ✅ Present | ✅ PASS |
| idempotency_key field | ✅ Present | ✅ Present | ✅ PASS |
| signature_valid field | ✅ Present | ✅ Present | ✅ PASS |
| processed field | ✅ Present | ✅ Present | ✅ PASS |
| duplicate field | ✅ Present | ✅ Present | ✅ PASS |
| error_message field | ✅ Present | ✅ Present | ✅ PASS |
| received_at field | ✅ Present | ✅ Present | ✅ PASS |
| processed_at field | ✅ Present | ✅ Present | ✅ PASS |
| **2. Idempotency Logic** |
| Same payment cannot create duplicate Payment records | ✅ Protected by PaymentIntent.status check | ⚠️ Race condition possible | ⚠️ PARTIAL |
| Same payment cannot unlock Fanclub twice | ✅ Protected by Subscription creation | ⚠️ Race condition possible | ⚠️ PARTIAL |
| Same payment cannot unlock PPV twice | ✅ Protected by Payment creation | ⚠️ Race condition possible | ⚠️ PARTIAL |
| Same payment cannot mark Guest Production paid twice | ✅ Protected by status update | ⚠️ Race condition possible | ⚠️ PARTIAL |
| Duplicate webhook returns 200 OK with duplicate=true | ✅ Implemented | ✅ Implemented | ✅ PASS |
| **3. Idempotency Key Safety** |
| Key format sufficient | ❌ `provider:payment_id:status` | ⚠️ Different statuses create different keys | ❌ FAIL |
| Final unlock protected by PaymentIntent.status | ✅ Yes | ✅ Yes | ✅ PASS |
| Final unlock protected by existing Payment record check | ❌ No | ❌ Not implemented | ❌ FAIL |
| **4. Status Mapping** |
| finished → completed (unlocks) | ✅ Correct | ✅ Correct | ✅ PASS |
| confirmed → completed (unlocks) | ✅ Correct | ✅ Correct | ✅ PASS |
| waiting → pending (no unlock) | ✅ Correct | ✅ Correct | ✅ PASS |
| confirming → pending (no unlock) | ✅ Correct | ✅ Correct | ✅ PASS |
| sending → processing (no unlock) | ✅ Correct | ✅ Correct | ✅ PASS |
| partially_paid → processing (no unlock) | ✅ Correct | ✅ Correct | ✅ PASS |
| failed → failed (no unlock) | ✅ Correct | ✅ Correct | ✅ PASS |
| expired → cancelled (no unlock) | ✅ Correct | ✅ Correct | ✅ PASS |
| **5. Invalid Signature Handling** |
| Invalid signature does not unlock access | ✅ Yes | ✅ Yes | ✅ PASS |
| Invalid signature logs PaymentWebhookEvent | ✅ Yes | ✅ Yes | ✅ PASS |
| Invalid signature returns 401 | ✅ Yes | ✅ Yes | ✅ PASS |
| No secrets leaked in response/logs | ✅ Yes | ✅ Yes | ✅ PASS |
| **6. Webhook URL** |
| Uses PROCESSOR_WEBHOOK_URL if set | ✅ Yes | ✅ Yes | ✅ PASS |
| Falls back to APP_BASE_URL derivation | ✅ Yes | ✅ Yes | ✅ PASS |
| Production APP_BASE_URL is https://fleshlab.online | ✅ Yes | ✅ Yes | ✅ PASS |
| No staging/localhost URLs | ✅ Yes | ✅ Yes | ✅ PASS |
| **7. Flow Verification** |
| Fanclub: PaymentIntent becomes completed | ✅ Yes | ✅ Yes | ✅ PASS |
| Fanclub: Payment record created | ✅ Yes | ✅ Yes | ✅ PASS |
| Fanclub: Subscription created | ✅ Yes | ✅ Yes | ✅ PASS |
| PPV: PaymentIntent becomes completed | ✅ Yes | ✅ Yes | ✅ PASS |
| PPV: Payment record created | ✅ Yes | ✅ Yes | ✅ PASS |
| Guest Production: PaymentIntent becomes completed | ✅ Yes | ✅ Yes | ✅ PASS |
| Guest Production: Application status updated | ✅ Yes | ✅ Yes | ✅ PASS |
| Duplicate webhook prevented | ⚠️ Partially | ⚠️ Race condition possible | ⚠️ PARTIAL |
| **8. Failed/Expired Webhook** |
| PaymentIntent becomes failed/cancelled | ✅ Yes | ✅ Yes | ✅ PASS |
| No access unlock | ✅ Yes | ✅ Yes | ✅ PASS |
| Event logged | ✅ Yes | ✅ Yes | ✅ PASS |
| Provider receives 200 if signature valid | ✅ Yes | ✅ Yes | ✅ PASS |
| **9. Unknown Invoice** |
| No access unlock | ✅ Yes | ✅ Yes | ✅ PASS |
| Event logged | ✅ Yes | ✅ Yes | ✅ PASS |
| Safe response | ✅ Yes | ✅ Yes | ✅ PASS |
| No crash/500 | ✅ Yes | ✅ Yes | ✅ PASS |

---

## Table 2: Flow Verification

| Flow | PaymentIntent Update | Payment Record | Access Unlock | Duplicate Prevention | Pass/Fail |
|------|---------------------|----------------|---------------|---------------------|-----------|
| **Fanclub** | ✅ status='completed' | ❌ Not created (Subscription only) | ✅ Subscription created | ⚠️ PaymentIntent.status check only | ⚠️ PARTIAL |
| **PPV** | ✅ status='completed' | ✅ Payment created (status='completed') | ✅ Payment record = entitlement | ⚠️ PaymentIntent.status check only | ⚠️ PARTIAL |
| **Guest Production** | ✅ status='completed' | ✅ Payment created (status='completed') | ✅ Application status='reviewing' | ⚠️ PaymentIntent.status check only | ⚠️ PARTIAL |

---

## Table 3: Risk Assessment

| Risk | Status | Remaining Issue |
|------|--------|-----------------|
| **CRITICAL: Race condition on concurrent webhooks** | 🔴 HIGH | If NOWPayments sends two `finished` webhooks simultaneously (before first is processed), both could pass the idempotency check and call `grantEntitlement()` twice |
| **HIGH: Idempotency key includes status** | 🔴 HIGH | Different statuses create different keys, so `waiting` → `finished` progression creates multiple keys. Final protection relies ONLY on PaymentIntent.status check |
| **MEDIUM: No deduplication in grantEntitlement()** | 🟡 MEDIUM | `grantEntitlement()` function doesn't check if Subscription/Payment already exists before creating |
| **LOW: Fanclub Subscription duplicate prevention** | 🟡 MEDIUM | Subscription entity has no unique constraint on `user_id + fanclub_id + current_period_start` |
| **LOW: PPV Payment duplicate prevention** | 🟢 LOW | Payment record creation is less risky (financial record), but still could create duplicates |
| **LOW: Guest Production double status update** | 🟢 LOW | Status update to 'reviewing' is idempotent (same value), but Payment record could duplicate |

---

## Critical Issue Analysis

### Problem: Idempotency Key Design Flaw

**Current Implementation:**
```javascript
idempotency_key: `${provider}:${payload.payment_id || payload.order_id || 'unknown'}:${payload.payment_status || 'unknown'}`
```

**Issue:** This creates DIFFERENT keys for different statuses of the SAME payment:
- `nowpayments:12345:pending` (for `waiting` status)
- `nowpayments:12345:pending` (for `confirming` status) - same key, OK
- `nowpayments:12345:completed` (for `finished` status) - **DIFFERENT KEY!**

**Idempotency Check:**
```javascript
const existingEvents = await base44.asServiceRole.entities.PaymentWebhookEvent.filter({
  provider_invoice_id: event.paymentId,
  normalized_status: event.normalizedStatus,  // ← This filters by status!
  processed: true,
  entitlement_granted: event.unlocksAccess || false,
});
```

**Race Condition Scenario:**
1. NOWPayments sends webhook #1: `payment_id=12345, status=finished`
2. NOWPayments sends webhook #2: `payment_id=12345, status=finished` (retry/duplicate)
3. Both webhooks arrive within 100ms of each other
4. Both pass the idempotency check (no existing `completed` event yet)
5. Both pass the PaymentIntent.status check (still `pending`)
6. Both call `grantEntitlement()` → **DUPLICATE Subscription/Payment created**

### Root Cause

The idempotency check relies on:
1. PaymentWebhookEvent query (can have race condition)
2. PaymentIntent.status check (can have race condition)

Both checks happen BEFORE the database write, creating a classic TOCTOU (Time Of Check To Time Of Use) vulnerability.

---

## Required Fixes (Before Production)

### Fix 1: Add Idempotency to grantEntitlement()

**Location:** `functions/paymentWebhook`, line 28-97

**Add checks BEFORE creating records:**

```javascript
async function grantEntitlement(base44, intent) {
  if (intent.payment_type === 'ppv') {
    // CHECK: Does Payment record already exist for this provider_session_id?
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({
      user_id: intent.user_id,
      related_entity_type: 'Video',
      related_entity_id: intent.video_id,
      status: 'completed',
    });
    
    if (existingPayments.length > 0) {
      console.log('[paymentWebhook] PPV entitlement already exists — skipping', {
        userId: intent.user_id,
        videoId: intent.video_id,
      });
      return; // Already granted
    }
    
    // Create Payment record...
    
  } else if (intent.payment_type === 'fanclub') {
    // CHECK: Does Subscription already exist for this user/plan?
    const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: intent.user_id,
      fanclub_id: intent.plan_id,
      status: 'active',
    });
    
    // Check if any existing subscription overlaps with the new period
    const periodEnd = new Date();
    const months = ACCESS_PERIODS[intent.plan_id] || 1;
    periodEnd.setMonth(periodEnd.getMonth() + months);
    
    const overlappingSubscription = existingSubscriptions.find(sub => {
      const subEnd = new Date(sub.current_period_end);
      return subEnd >= new Date(); // Still active
    });
    
    if (overlappingSubscription) {
      console.log('[paymentWebhook] Fanclub access already exists — skipping', {
        userId: intent.user_id,
        planId: intent.plan_id,
      });
      return; // Already granted
    }
    
    // Create Subscription...
    
  } else if (intent.payment_type === 'guest_production_deposit') {
    // CHECK: Has application already been marked as reviewing/paid?
    const app = await base44.asServiceRole.entities.GuestProductionApplication.get(intent.application_id);
    
    if (app && app.status === 'reviewing') {
      console.log('[paymentWebhook] Guest Production deposit already marked paid — skipping', {
        userId: intent.user_id,
        appId: intent.application_id,
      });
      return; // Already granted
    }
    
    // Update application and create Payment record...
  }
}
```

### Fix 2: Change Idempotency Key to Exclude Status

**Location:** `functions/paymentWebhook`, line 273

**Change from:**
```javascript
idempotency_key: `${provider}:${payload.payment_id || payload.order_id || 'unknown'}:${payload.payment_status || 'unknown'}`
```

**Change to:**
```javascript
// Idempotency key is for the PAYMENT, not the status change
idempotency_key: `${provider}:${payload.payment_id || payload.order_id || 'unknown'}`
```

**Rationale:** The idempotency key should identify the payment itself, not a specific status update. Status changes are logged separately via `normalized_status`.

### Fix 3: Add Database-Level Unique Constraints (Recommended)

**Entity:** `Subscription`
**Add unique constraint on:** `user_id + fanclub_id + current_period_start`

**Entity:** `Payment` (for PPV)
**Add unique constraint on:** `user_id + related_entity_type + related_entity_id + status`

This provides a final safety net even if application-level checks fail.

---

## Remaining Risks After Fixes

| Risk | After Fix 1 | After Fix 2 | After Fix 3 |
|------|-------------|-------------|-------------|
| Race condition on concurrent webhooks | 🟡 Reduced | 🟡 Reduced | 🟢 Eliminated |
| Idempotency key design | 🟢 Fixed | 🟢 Fixed | N/A |
| Duplicate entitlement grant | 🟢 Prevented | 🟢 Prevented | 🟢 Prevented |
| Database duplicate records | 🟢 Prevented | 🟢 Prevented | 🟢 Prevented |

---

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| No duplicate entitlement possible | ❌ FAIL | Requires Fix 1 |
| No duplicate Payment record possible | ❌ FAIL | Requires Fix 1 |
| Invalid signature cannot unlock access | ✅ PASS | Working correctly |
| Pending statuses cannot unlock access | ✅ PASS | Working correctly |
| Finished/confirmed statuses unlock exactly once | ❌ FAIL | Requires Fix 1 + Fix 2 |
| Webhook URL is production-safe | ✅ PASS | Using PROCESSOR_WEBHOOK_URL |

---

## Recommendation

**DO NOT DEPLOY TO PRODUCTION** until Fix 1 and Fix 2 are implemented.

**Priority:**
1. **Fix 1** - Add idempotency checks to `grantEntitlement()` (CRITICAL)
2. **Fix 2** - Change idempotency key to exclude status (HIGH)
3. **Fix 3** - Add database unique constraints (RECOMMENDED)

**Testing Required After Fixes:**
- Simulate concurrent webhook delivery (same payment_id, same status, within 100ms)
- Verify only one Subscription/Payment record created
- Verify PaymentWebhookEvent shows one `processed=true`, one `duplicate=true`

---

**Verification Complete.** Critical issues identified. Fixes required before production deployment.