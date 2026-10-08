# Performer ↔ User Linking Migration Plan

## Overview
Migrate from insecure `created_by_id` workaround to proper `user_id` field for Performer ↔ User linking.

## Architecture Change

### Before (INSECURE):
```
User (auth)
  ↓
created_by_id (who created the performer record)
  ↓
Performer
```

**Problem:** `created_by_id` tracks WHO CREATED the record, not WHO OWNS it. If an admin created the performer profile, the performer cannot access their dashboard.

### After (SECURE):
```
User (auth)
  ↓
user_id (permanent ownership link)
  ↓
Performer
```

**Solution:** `user_id` explicitly links a performer profile to their authenticated user account.

---

## Migration Steps

### Phase 1: Schema Update ✅ COMPLETE
- [x] Add `user_id` field to Performer entity
- [x] Field type: `string`
- [x] Description: "Authenticated user account permanently linked to this performer profile"
- [x] Not required (allows existing performers to exist without linking during migration)

### Phase 2: Code Updates ✅ COMPLETE
- [x] Update `performerDashboardService.js` to use `user_id` instead of `created_by_id`
- [x] Remove workaround comments
- [x] Simplify lookup logic (direct filter instead of find)

### Phase 3: Data Migration (ADMIN REQUIRED)

#### Step 3.1: Identify Existing Performers
```sql
-- Query all performers with their creators
SELECT id, display_name, created_by_id, user_id 
FROM Performer 
WHERE user_id IS NULL;
```

#### Step 3.2: Identify Performer Users
```sql
-- Query users who should be linked to performers
SELECT id, email, full_name, role 
FROM User 
WHERE role = 'user' OR role = 'performer';
```

#### Step 3.3: Mapping Strategy

**Scenario A: Performer was created by themselves**
- `Performer.created_by_id === User.id`
- **Action:** Set `Performer.user_id = Performer.created_by_id`

**Scenario B: Performer was created by admin on behalf of performer**
- `Performer.created_by_id === Admin.id`
- Performer has their own User account (matched by email)
- **Action:** Set `Performer.user_id = PerformerUser.id`

**Scenario C: Performer has no User account yet**
- Performer exists but never registered
- **Action:** Leave `user_id` NULL until performer registers
- **Fallback:** Dashboard returns 404 with message "Please contact support to link your account"

#### Step 3.4: Migration Script (Manual Admin Process)

1. Export all performers with `created_by_id`
2. Match to User accounts by:
   - Direct match: `created_by_id` → `user_id`
   - Email match: Performer email (if stored) → User email
3. Update `Performer.user_id` via admin dashboard or direct database update
4. Verify mappings

### Phase 4: Verification

#### Test Cases:

| Test | Expected Result | Status |
|------|-----------------|--------|
| Performer with user_id set can access dashboard | ✅ Success | PENDING |
| Performer without user_id gets 404 | ✅ 404 with clear message | PENDING |
| Admin cannot access performer dashboard | ✅ 403 Forbidden | PENDING |
| Multi-performer user (rare) sees all their performers | ✅ All linked performers returned | PENDING |

#### Services Audit:

| Service | Uses created_by_id? | Uses user_id? | Status |
|---------|---------------------|---------------|--------|
| performerDashboardService | ❌ Removed | ✅ Updated | ✅ PASS |
| performerVideoStatsService | ✅ N/A (admin-only) | ✅ N/A | ✅ PASS |
| performerFinanceService | ✅ N/A (admin-only) | ✅ N/A | ✅ PASS |
| performerAdminService | ✅ N/A (admin-only) | ✅ N/A | ✅ PASS |
| performerComplianceService | ✅ N/A (admin-only) | ✅ N/A | ✅ PASS |

**Note:** All other performer services are ADMIN-ONLY and don't need user linking - they receive `performer_id` from frontend and verify admin role.

---

## Fallback Behavior

### During Migration (user_id NULL):
```javascript
// performerDashboardService.js
const performers = await base44.asServiceRole.entities.Performer.filter({
  user_id: user.id
});
const myPerformer = performers[0] || null;

if (!myPerformer) {
  return Response.json({ 
    error: 'No linked performer profile found. Please contact support to link your account.'
  }, { status: 404 });
}
```

**User Experience:**
- Performer logs in successfully
- Attempts to access `/performer/dashboard`
- Sees error: "No linked performer profile found. Please contact support to link your account."
- Admin manually links via database update or future admin UI

### After Migration (user_id SET):
- Performer logs in
- Dashboard loads normally
- All performer features work (earnings, compliance, videos, stats)

---

## Security Improvements

### Before:
- ❌ Performer could not access dashboard if admin created their profile
- ❌ No explicit ownership link
- ❌ Relied on incidental `created_by_id` field
- ❌ Potential for data leakage if multiple performers shared creator

### After:
- ✅ Explicit 1:1 ownership link
- ✅ Performer always owns their profile regardless of who created it
- ✅ Clear separation between "creator" (admin) and "owner" (performer)
- ✅ Secure filtering: `Performer.filter({ user_id: user.id })`
- ✅ Future-proof for multi-performer accounts (one user, multiple performers)

---

## Rollback Plan

If migration fails:
1. Keep `user_id` field (harmless if unused)
2. Revert `performerDashboardService.js` to use `created_by_id` (not recommended)
3. Better: Fix migration data issues and retry

**Recommendation:** Do not rollback. Fix forward by completing data migration.

---

## Next Steps

1. ✅ Schema updated
2. ✅ Code updated
3. ⏳ Admin runs data migration (Phase 3)
4. ⏳ Verify all test cases pass
5. ⏳ Monitor logs for 404 errors (unlinked performers)
6. ⏳ Optional: Build admin UI for linking performers to users

---

## Estimated Effort

- Schema update: ✅ DONE (5 min)
- Code update: ✅ DONE (10 min)
- Data migration: ⏳ 1-2 hours (depends on number of performers)
- Verification: ⏳ 30 min
- **Total:** 2-3 hours

---

## Contact

For questions about this migration, contact the development team.
**DO NOT DEPLOY** until Phase 3 (data migration) is complete for existing performers.