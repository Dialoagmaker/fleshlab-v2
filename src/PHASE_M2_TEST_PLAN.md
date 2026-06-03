# Phase M2: Auth Redirect / Intent Preservation - Test Plan

## Overview
This document outlines the test cases for verifying that auth intent preservation works correctly across all monetization CTAs.

---

## Test Cases

### A. Fanclub Page Tests

#### Test A1: Fanclub Monthly Plan
**Steps:**
1. Navigate to `/fanclub` while logged out
2. Click "Monthly" plan button ($12.99)
3. Complete Google signup or email registration
4. Verify OTP (if email registration)

**Expected Result:**
- Redirect to `/fanclub?plan=fanclub_monthly`
- NOT homepage (`/`)
- Intent preserved in localStorage before redirect
- Intent cleared after successful auth

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test A2: Fanclub 6 Months Plan
**Steps:**
1. Navigate to `/fanclub` while logged out
2. Click "6 Months" plan button ($59.99)
3. Complete Google signup or email registration
4. Verify OTP (if email registration)

**Expected Result:**
- Redirect to `/fanclub?plan=fanclub_6mo`
- NOT homepage

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test A3: Fanclub Annual Plan
**Steps:**
1. Navigate to `/fanclub` while logged out
2. Click "12 Months" plan button ($99.99)
3. Complete Google signup or email registration
4. Verify OTP (if email registration)

**Expected Result:**
- Redirect to `/fanclub?plan=fanclub_annual`
- NOT homepage

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

### B. Performer Detail Tests

#### Test B1: Performer Fanclub CTA
**Steps:**
1. Navigate to `/performers/jameson` while logged out
2. Click "Join Fanclub" button
3. Complete registration/login
4. Verify OTP (if email registration)

**Expected Result:**
- Redirect to `/fanclub?plan=fanclub_monthly`
- NOT homepage

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test B2: Performer Watch Videos CTA
**Steps:**
1. Navigate to `/performers/jameson` while logged out
2. Click "Watch Videos" button
3. Complete registration/login
4. Verify OTP

**Expected Result:**
- Redirect to `/videos`
- NOT homepage

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

### C. Video Detail Tests (PPV)

#### Test C1: PPV Unlock CTA
**Steps:**
1. Navigate to a PPV video page (e.g., `/videos/test-ppv-video`) while logged out
2. Click "Unlock Full Scene" or "Create Account to Unlock" button
3. Complete registration/login
4. Verify OTP

**Expected Result:**
- Redirect to `/videos/test-ppv-video?unlock=true`
- NOT homepage
- Video page shows unlock intent

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test C2: Fanclub Video CTA
**Steps:**
1. Navigate to a fanclub-only video page while logged out
2. Click "Join Fanclub" button
3. Complete registration/login
4. Verify OTP

**Expected Result:**
- Redirect to `/fanclub?plan=fanclub_monthly`
- NOT homepage

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

### D. Guest Production Tests

#### Test D1: Guest Production Apply CTA
**Steps:**
1. Navigate to `/guest-production` while logged out
2. Click "Apply Now" or "Create Account to Apply" button
3. Complete registration/login
4. Verify OTP

**Expected Result:**
- Redirect to `/guest-production?apply=true`
- NOT homepage
- Application form visible (if implemented)

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

### E. Security Tests

#### Test E1: External URL Blocked
**Steps:**
1. Manually set localStorage: `localStorage.setItem('fleshlab_auth_intent', JSON.stringify({actionType: 'general', nextUrl: 'https://evil.com', timestamp: Date.now()}))`
2. Navigate to `/login`
3. Complete login

**Expected Result:**
- Redirect to `/` (homepage)
- NOT `https://evil.com`
- Console warning: `[AuthRedirect] Blocked external HTTP/HTTPS URL`

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test E2: Protocol-Relative URL Blocked
**Steps:**
1. Manually set localStorage with `nextUrl: '//evil.com'`
2. Navigate to `/login`
3. Complete login

**Expected Result:**
- Redirect to `/`
- NOT `//evil.com`
- Console warning: `[AuthRedirect] Blocked protocol-relative URL`

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test E3: JavaScript URL Blocked
**Steps:**
1. Manually set localStorage with `nextUrl: 'javascript:alert(1)'`
2. Navigate to `/login`
3. Complete login

**Expected Result:**
- Redirect to `/`
- No alert popup
- Console warning: `[AuthRedirect] Blocked dangerous protocol`

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test E4: Malformed Path Blocked
**Steps:**
1. Manually set localStorage with `nextUrl: '/<script>alert(1)</script>'`
2. Navigate to `/login`
3. Complete login

**Expected Result:**
- Redirect to `/`
- No XSS execution
- Console warning: `[AuthRedirect] Blocked malformed URL`

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test E5: Non-Relative URL Blocked
**Steps:**
1. Manually set localStorage with `nextUrl: 'evil.com/path'`
2. Navigate to `/login`
3. Complete login

**Expected Result:**
- Redirect to `/`
- Console warning: `[AuthRedirect] Blocked non-relative URL`

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

### F. Intent Expiration Tests

#### Test F1: Expired Intent
**Steps:**
1. Manually set localStorage with expired timestamp: `timestamp: Date.now() - 20 * 60 * 1000` (20 minutes ago)
2. Navigate to `/login`
3. Complete login

**Expected Result:**
- Redirect to `/` (not the expired intent URL)
- Intent cleared from localStorage

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

### G. Regression Tests

#### Test G1: Normal Login Still Works
**Steps:**
1. Navigate to `/login` directly (no intent)
2. Complete email/password login

**Expected Result:**
- Redirect to role-based default (admin → `/admin/dashboard`, user → `/`)
- No errors

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test G2: Normal Registration Still Works
**Steps:**
1. Navigate to `/register` directly (no intent)
2. Complete email registration + OTP

**Expected Result:**
- Redirect to `/`
- User authenticated successfully

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test G3: Google OAuth Still Works
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google"
3. Complete OAuth flow

**Expected Result:**
- Redirect to `/` (or intent if stored)
- User authenticated successfully

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test G4: PerformerDetail Still Loads
**Steps:**
1. Navigate to `/performers/jameson`
2. Verify page loads without crash
3. Verify no null nationality error

**Expected Result:**
- Page loads successfully
- No console errors about null properties

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

#### Test G5: VideoDetail Still Works
**Steps:**
1. Navigate to a video page
2. Verify page loads
3. Verify no source_video_url exposed publicly

**Expected Result:**
- Page loads successfully
- source_video_url only returned to entitled users

**Actual Result:** ⬜ PASS / ⬜ FAIL

---

## Test Execution Summary

| Test Category | Total Tests | Passed | Failed | Blocked |
|---------------|-------------|--------|--------|---------|
| Fanclub Page | 3 | ⬜ | ⬜ | ⬜ |
| Performer Detail | 2 | ⬜ | ⬜ | ⬜ |
| Video Detail (PPV) | 2 | ⬜ | ⬜ | ⬜ |
| Guest Production | 1 | ⬜ | ⬜ | ⬜ |
| Security | 5 | ⬜ | ⬜ | ⬜ |
| Intent Expiration | 1 | ⬜ | ⬜ | ⬜ |
| Regression | 5 | ⬜ | ⬜ | ⬜ |
| **TOTAL** | **19** | **⬜** | **⬜** | **⬜** |

---

## Sign-Off Criteria

**M2 is COMPLETE when:**
- ✅ All 19 test cases pass
- ✅ No security vulnerabilities (all external URLs blocked)
- ✅ Google signup/login preserves intent
- ✅ Email signup/login preserves intent
- ✅ No regression in existing auth flows
- ✅ PerformerDetail loads without null errors
- ✅ VideoDetail does not expose source_video_url publicly

**Tested By:** ________________  
**Date:** ________________  
**Sign-Off:** ⬜ APPROVED / ⬜ REJECTED

---

## Known Limitations

1. **Base44 Google OAuth `fromUrl` parameter** - Base44's `loginWithProvider` may not respect the `fromUrl` parameter. Intent preservation via localStorage is used as a workaround.

2. **Browser localStorage restrictions** - Some browsers may clear localStorage on navigation or in incognito mode. Intent has 15-minute timeout as fallback.

3. **Multiple tabs** - If user opens multiple tabs with different intents, only the last stored intent will be used.

4. **No checkout implementation yet** - Intent preservation only redirects to the correct page. Actual checkout/payment flow not implemented in M2.

---

## Next Steps (Phase M3)

After M2 sign-off, proceed to:
1. Stripe integration setup
2. Checkout session creation functions
3. Webhook handlers
4. Entitlement persistence

---

**END OF TEST PLAN**