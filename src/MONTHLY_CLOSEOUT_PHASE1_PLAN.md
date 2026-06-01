# Monthly Closeout Phase 1 — Implementation Plan

## Revenue Split Logic (Confirmed)

### Performer Split Models at FLESHLAB

**Model 40/60:**
- Performer receives 40% of their gross share
- Studio keeps 60%

**Model 70/30:**
- Performer receives 70% of their gross share
- Studio keeps 30%

**Key Principle:**
`Performer.revenue_split_pct` = performer's percentage of **their assigned gross share**, NOT the full video revenue.

---

### Single-Performer Video

```javascript
performer_net = video_revenue_usd × (performer.revenue_split_pct / 100)
```

**Example:**
```
Video Revenue: $100
Performer Split: 70%

Performer Net: $100 × 70% = $70
Studio Keeps:  $100 - $70 = $30
```

---

### Multi-Performer Video (Equal Gross Split)

**Phase 1 Rule:**
1. Divide video revenue equally among all credited performers (gross share)
2. Apply each performer's individual `revenue_split_pct` to their gross share

```javascript
// Step 1: Calculate gross share per performer
const performerCount = videoPerformers.length;
const grossSharePerPerformer = video_revenue_usd / performerCount;

// Step 2: Apply individual split %
performer_net = grossSharePerPerformer × (performer.revenue_split_pct / 100);
```

**Example (Confirmed):**
```
Video Revenue: $100
Performers: 2 (Alice 40%, Bob 70%)

Gross Share: $100 / 2 = $50 each

Alice Net: $50 × 40% = $20
Bob Net:   $50 × 70% = $35

Studio Keeps: $100 - $20 - $35 = $45
```

**⚠️ IMPORTANT:**
Do NOT calculate as:
- Alice: $100 × 40% = $40 ❌
- Bob: $100 × 70% = $70 ❌
- Total Payout: $110 (platform loses $10) ❌

---

## Implementation Plan

### Phase 1A: Backend Service (`functions/monthlyCloseoutService.js`)

**Actions:**

#### 1. `get_closeout_preview`
**Purpose:** Calculate draft earnings without creating records

**Input:**
```javascript
{
  period_month: "2026-06",
  platform: "xhamster", // or "faphouse", "internal", "all"
  performer_id: "..." // optional filter
}
```

**Logic:**
1. Query VideoStatSnapshots for period + platform
2. For each snapshot, get VideoPerformer records
3. For each VideoPerformer, get Performer data (revenue_split_pct)
4. Calculate gross_share and net_amount per performer
5. Check for existing PerformerEarning records (duplicate detection)
6. Return preview data with "exists" flag for duplicates

**Output:**
```javascript
{
  success: true,
  summary: {
    total_snapshots: 10,
    total_revenue_usd: 1250.50,
    estimated_performer_payout: 875.35,
    studio_share: 375.15,
    duplicate_count: 2,
    new_earnings_to_create: 8
  },
  preview: [
    {
      snapshot_id: "...",
      video_id: "...",
      video_title: "...",
      performer_id: "...",
      performer_name: "...",
      video_revenue: 100.00,
      performer_count: 2,
      gross_share: 50.00,
      split_pct: 40,
      net_amount: 20.00,
      exists: false // true if duplicate
    },
    // ...
  ]
}
```

---

#### 2. `generate_draft_earnings`
**Purpose:** Create pending earnings with duplicate prevention

**Input:**
```javascript
{
  period_month: "2026-06",
  platform: "xhamster",
  performer_id: "..." // optional
}
```

**Logic:**
1. Re-run preview calculation
2. For each preview item where `exists === false`:
   - Create PerformerEarning record:
     ```javascript
     {
       performer_id: "...",
       video_id: "...",
       earning_type: "xhamster_share", // platform-specific
       gross_amount_usd: gross_share,
       split_pct: performer.revenue_split_pct,
       net_amount_usd: net_amount,
       period_month: "2026-06",
       status: "pending",
       source_ref_type: "VideoStatSnapshot",
       source_ref_id: snapshot.id,
       notes: "Auto-generated via Monthly Closeout"
     }
     ```
3. Create AuditLog entries for batch creation
4. Return list of created earning_ids

**Duplicate Prevention:**
```javascript
const existing = await base44.entities.PerformerEarning.filter({
  source_ref_type: "VideoStatSnapshot",
  source_ref_id: snapshot.id,
  performer_id: performer_id,
  period_month: period_month
});

if (existing.length > 0) {
  // Skip this record, mark as "exists"
}
```

**Output:**
```javascript
{
  success: true,
  created_count: 8,
  skipped_count: 2,
  earning_ids: ["...", "..."],
  skipped: [
    { snapshot_id: "...", performer_id: "...", reason: "Already exists" }
  ]
}
```

---

#### 3. `batch_update_status`
**Purpose:** Approve/hold multiple earnings at once

**Input:**
```javascript
{
  earning_ids: ["...", "..."],
  new_status: "approved", // or "held", "disputed"
  reason: "..." // required for held/disputed
}
```

**Logic:**
1. Validate admin access
2. Validate reason for held/disputed status
3. Update each earning record
4. Create individual AuditLog entries
5. Return updated count

**Output:**
```javascript
{
  success: true,
  updated_count: 8,
  status: "approved"
}
```

---

### Phase 1B: Entity Updates (Future-Proofing)

**VideoPerformer Entity** — Add optional fields (nullable, NOT required for Phase 1):

```json
{
  "revenue_weight": {
    "type": "number",
    "title": "Revenue Weight",
    "description": "Optional weight for weighted revenue split (default: 1.0 = equal split)"
  },
  "revenue_share_pct": {
    "type": "number",
    "title": "Revenue Share %",
    "description": "Optional override for this specific video (uses performer.revenue_split_pct if null)"
  },
  "payout_role": {
    "type": "string",
    "enum": ["lead", "supporting", "extra", "featured"],
    "title": "Payout Role",
    "description": "Optional role-based payout tier (future use)"
  }
}
```

**Phase 1 Behavior:**
- If `revenue_weight` is absent → equal split
- If `revenue_share_pct` is absent → use `performer.revenue_split_pct`
- `payout_role` is informational only (no payout impact in Phase 1)

**Phase 2 (Future) Weighted Split Logic:**
```javascript
const hasWeights = performers.some(p => p.revenue_weight !== undefined && p.revenue_weight !== null);

if (hasWeights) {
  // Weighted split
  const totalWeight = performers.reduce((sum, p) => sum + (p.revenue_weight || 1), 0);
  performers.forEach(p => {
    const weight = p.revenue_weight || 1;
    const grossShare = video_revenue × (weight / totalWeight);
    const splitPct = p.revenue_share_pct || p.performer.revenue_split_pct;
    const netAmount = grossShare × (splitPct / 100);
  });
} else {
  // Equal split (Phase 1 default)
  const grossShare = video_revenue / performerCount;
  performers.forEach(p => {
    const splitPct = p.revenue_share_pct || p.performer.revenue_split_pct;
    const netAmount = grossShare × (splitPct / 100);
  });
}
```

---

### Phase 1C: Admin UI (`/admin/monthly-closeout`)

**Components:**

1. **CloseoutFilters**
   - Period Month (YYYY-MM picker)
   - Platform dropdown (xhamster, faphouse, internal, all)
   - Performer search (optional)
   - "Load Preview" button

2. **CloseoutSummary**
   - Total Snapshots: N
   - Total Platform Revenue: $X
   - Estimated Performer Payout: $Y
   - Studio Share: $Z
   - Duplicate Count: D
   - New Earnings to Create: N - D

3. **EarningsPreviewTable**
   - Performer Name
   - Video Title
   - Platform
   - Period
   - Video Revenue
   - Performer Count
   - Gross Share
   - Split %
   - Net Amount
   - Status Badge: "pending_draft" or "exists"

4. **Actions Bar**
   - "Generate Drafts" (creates pending earnings)
   - "Export CSV"
   - "Cancel"

5. **Pending Review Queue** (separate tab or section)
   - Filter by status: pending, approved, paid, held, disputed
   - Batch select checkboxes
   - "Approve Selected"
   - "Hold Selected" (with reason modal)
   - Individual row actions

---

### Phase 1D: Security & Audit

**Security:**
- All actions require admin role (403 for non-admin)
- Performer dashboard remains read-only (no changes)

**Audit Logging:**
```javascript
// Batch creation
await base44.asServiceRole.entities.AuditLog.create({
  entity_type: 'PerformerEarning',
  entity_id: earning_id,
  actor_id: user.id,
  actor_role: user.role,
  action: 'closeout_earning_created',
  changes_json: JSON.stringify({
    source_ref_type: 'VideoStatSnapshot',
    source_ref_id: snapshot.id,
    period_month,
    gross_amount_usd,
    split_pct,
    net_amount_usd
  }),
  notes: `Auto-generated via Monthly Closeout: ${period_month}`
});

// Status change
await base44.asServiceRole.entities.AuditLog.create({
  entity_type: 'PerformerEarning',
  entity_id: earning_id,
  actor_id: user.id,
  actor_role: user.role,
  action: 'earning_status_changed',
  changes_json: JSON.stringify({
    status: { before: oldStatus, after: newStatus },
    reason: reason || null
  }),
  notes: `Status changed via batch update: ${oldStatus} → ${newStatus}`
});
```

---

## Implementation Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1A | Create `monthlyCloseoutService.js` | 1 day |
| 1B | Add VideoPerformer optional fields | 0.5 day |
| 1C | Admin UI: Closeout page + components | 2 days |
| 1D | Testing + validation | 1 day |
| **Total** | | **4.5 days** |

---

## Testing Checklist

- [ ] Single-performer video: correct net calculation
- [ ] Multi-performer video (2 performers): equal gross split
- [ ] Multi-performer video (3+ performers): equal gross split
- [ ] Different split percentages (40% vs 70%): correct individual nets
- [ ] Duplicate prevention: same snapshot + performer + period
- [ ] Re-generation: skips existing, creates only new
- [ ] Status workflow: pending → approved → paid
- [ ] Hold reason validation: required for held/disputed
- [ ] AuditLog entries: created for all actions
- [ ] Performer dashboard: sees only own earnings (read-only)
- [ ] Admin-only access: non-admin gets 403

---

## Summary

**Phase 1 Confirmed:**
- ✅ Equal gross split between credited performers
- ✅ Individual `revenue_split_pct` applied after gross split
- ✅ Duplicate prevention via source_ref + performer + period
- ✅ Status = pending (admin review required)
- ✅ No auto-payout, no auto-paid
- ✅ Future-proof: VideoPerformer optional fields prepared
- ✅ Audit logging for all actions
- ✅ Admin-only access enforced

**Ready for implementation.**