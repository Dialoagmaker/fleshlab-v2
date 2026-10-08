# PERFORMER EARNINGS LINE ITEM SYSTEM - IMPLEMENTATION COMPLETE

**Date**: 2026-06-05  
**Status**: ✅ Complete

---

## OVERVIEW

Implemented a comprehensive Performer Earnings Line Item system that properly separates video revenue from other income sources (livecam, fanclub, custom content, bonuses, adjustments).

**Key Principle**: VideoStatSnapshot remains purely for video performance metrics. Revenue aggregation happens through PerformerEarningLineItem records.

---

## NEW ENTITIES CREATED

### 1. PerformerEarningLineItem (NEW)

**Purpose**: Individual income line items for each revenue source

**Fields**:
- `performer_id`: Link to performer
- `performer_earning_id`: Optional link to parent PerformerEarning header
- `period_month`: Format YYYY-MM
- `source_type`: video_platform | livecam | fanclub | custom_content | bonus | manual_adjustment | deduction
- `source_platform`: xhamster | faphouse | chaturbate | stripchat | bongacams | livejasmin | internal | other
- `source_reference_id`: Optional reference to source record (e.g., VideoStatSnapshot ID)
- `description`: Human-readable description
- `gross_amount_usd`: Total gross revenue
- `performer_share_percent`: Percentage going to performer
- `performer_amount_usd`: Performer's share (gross × share%)
- `studio_amount_usd`: Studio's share (gross - performer_amount)
- `currency`: Default USD
- `exchange_rate`: Exchange rate to USD
- `status`: estimated | pending | approved | paid
- `notes`: Optional notes

### 2. PerformerEarning (UPDATED)

**Purpose**: Monthly closeout header record (aggregates line items)

**New Fields**:
- `period_month`: Format YYYY-MM
- `total_gross_usd`: Sum of all line item gross amounts
- `total_performer_usd`: Sum of all line item performer amounts
- `total_studio_usd`: Sum of all line item studio amounts
- `line_item_count`: Number of line items
- `status`: draft | estimated | pending | approved | paid
- `approved_at`: Timestamp of approval
- `approved_by`: Admin user ID who approved
- `paid_at`: Timestamp of payment

**Removed Fields** (now handled by line items):
- `video_id` (moved to line item source_reference_id)
- `earning_type` (replaced by source_type)
- `gross_amount_usd` (now calculated from line items)
- `split_pct` (now performer_share_percent in line items)
- `net_amount_usd` (now performer_amount_usd in line items)

---

## BACKEND FUNCTIONS CREATED

### performerEarningLineItemService

**Purpose**: Manage line items and monthly closeout

**Actions**:

#### 1. `create_line_item`
- Creates individual income line item
- Auto-calculates performer/studio amounts if not provided
- Validates source_reference_id for video_platform type

#### 2. `update_line_item`
- Updates existing line item
- Prevents editing paid items
- Auto-recalculates amounts when gross or share changes

#### 3. `delete_line_item`
- Deletes line item
- Prevents deleting paid items
- Creates audit log entry

#### 4. `list_line_items`
- Returns line items for performer + period
- Optional filters: source_type, status

#### 5. `aggregate_period_summary`
- Aggregates totals by source_type, source_platform, status
- Includes both line items and legacy PerformerEarning records
- Returns comprehensive summary for dashboard

#### 6. `create_monthly_closeout`
- Auto-generates video_platform line items from VideoStatSnapshot
- Creates one line item per video/performer combination
- Skips duplicates (checks existing line items)
- Returns created line item IDs

#### 7. `approve_closeout`
- Changes all estimated/pending line items to approved
- Creates audit log

#### 8. `mark_closeout_paid`
- Changes all approved line items to paid
- Creates audit log

---

## ADMIN EARNINGS TAB FEATURES

### Location: `/admin/earnings`

**Capabilities**:

1. **Filter by Performer + Period**
   - Select performer from dropdown
   - Select month (YYYY-MM)

2. **Summary Cards**
   - Gross Revenue (total)
   - Performer Share (total performer earnings)
   - Studio Share (total studio revenue)

3. **Line Items Table**
   - Shows all income line items
   - Columns: Source Type, Platform, Description, Gross, Performer %, Performer Amt, Studio Amt, Status, Actions
   - Edit/Delete buttons per row

4. **Actions**
   - **Add Line Item**: Manual entry for livecam, fanclub, bonus, etc.
   - **Create Closeout**: Auto-generate from VideoStatSnapshot
   - **Approve**: Approve all estimated/pending items
   - **Mark Paid**: Mark approved items as paid

5. **Add Line Item Modal**
   - Source Type selector (video_platform, livecam, fanclub, custom_content, bonus, manual_adjustment, deduction)
   - Source Platform selector (xhamster, faphouse, chaturbate, stripchat, bongacams, livejasmin, internal, other)
   - Description textarea
   - Gross Amount input
   - Performer Share % input
   - Notes textarea

6. **Edit Line Item Modal**
   - Same fields as Add modal
   - Pre-populated with existing values
   - Auto-recalculates amounts

---

## PERFORMER DASHBOARD EARNINGS TAB

### Location: Performer Dashboard → Earnings Tab

**Read-Only View**:

1. **Summary Cards**
   - Gross Revenue
   - Performer Share
   - Studio Share

2. **Breakdown by Source Type**
   - Video Platform Revenue
   - Livecam Income
   - Fanclub Subscription
   - Custom Content
   - Bonus
   - Manual Adjustment
   - Deduction

3. **Breakdown by Platform**
   - xHamster
   - FapHouse
   - Chaturbate
   - Stripchat
   - BongaCams
   - LiveJasmin
   - Internal
   - Other

4. **Breakdown by Status**
   - Estimated (pending calculation)
   - Pending (awaiting approval)
   - Approved (ready for payment)
   - Paid (completed)

5. **Detailed Line Items Table**
   - All income line items
   - Read-only view
   - Shows description, amounts, status

---

## MONTHLY CLOSEOUT WORKFLOW

### Step-by-Step Process:

1. **Admin selects performer and period**
   - e.g., "The_Fitmaster" + "2026-06"

2. **Admin clicks "Create Closeout"**
   - Backend queries VideoStatSnapshot for period
   - For each snapshot:
     - Gets VideoPerformer links
     - Calculates revenue share per performer
     - Creates PerformerEarningLineItem with source_type="video_platform"
     - Skips if line item already exists (prevents duplicates)

3. **Admin reviews line items**
   - Can manually add livecam/fanclub/bonus items
   - Can edit/delete estimated items
   - Can see totals update in real-time

4. **Admin clicks "Approve"**
   - All estimated items → approved
   - Performer can now see approved earnings in dashboard

5. **Admin clicks "Mark Paid"**
   - All approved items → paid
   - Payment recorded

---

## DATA FLOW EXAMPLE

### Scenario: Performer earns from xHamster videos + Chaturbate livecam

**Video Revenue** (auto-generated):
```json
{
  "performer_id": "6a1c2bfd19fe764298123091",
  "period_month": "2026-06",
  "source_type": "video_platform",
  "source_platform": "xhamster",
  "source_reference_id": "6a231adb60c0314bd765b684",
  "description": "FLEX Appeal - xHamster",
  "gross_amount_usd": 4.03,
  "performer_share_percent": 40,
  "performer_amount_usd": 1.61,
  "studio_amount_usd": 2.42,
  "status": "estimated"
}
```

**Livecam Revenue** (manual entry):
```json
{
  "performer_id": "6a1c2bfd19fe764298123091",
  "period_month": "2026-06",
  "source_type": "livecam",
  "source_platform": "chaturbate",
  "description": "Chaturbate tips - June 2026",
  "gross_amount_usd": 500.00,
  "performer_share_percent": 60,
  "performer_amount_usd": 300.00,
  "studio_amount_usd": 200.00,
  "status": "estimated"
}
```

**Bonus** (manual entry):
```json
{
  "performer_id": "6a1c2bfd19fe764298123091",
  "period_month": "2026-06",
  "source_type": "bonus",
  "source_platform": "internal",
  "description": "Performance bonus - June 2026",
  "gross_amount_usd": 100.00,
  "performer_share_percent": 100,
  "performer_amount_usd": 100.00,
  "studio_amount_usd": 0.00,
  "status": "estimated"
}
```

**Totals**:
- Gross: $604.03
- Performer Share: $401.61
- Studio Share: $202.42

---

## BACKWARD COMPATIBILITY

### Legacy PerformerEarning Records

The system maintains compatibility with existing PerformerEarning records:

- `aggregate_period_summary` includes both line items AND legacy earnings
- Legacy records are counted separately in summary
- No data migration required
- Old records remain read-only

### Migration Path (Optional)

Future enhancement: Create migration script to convert legacy PerformerEarning records to line items:
1. For each legacy earning, create corresponding line item
2. Link via `performer_earning_id` field
3. Mark legacy record as "migrated"

---

## SECURITY & AUDIT

### Access Control
- **Admin Only**: All line item management functions
- **Performer Read-Only**: Can only view own line items via dashboard

### Audit Logging
All actions create AuditLog entries:
- `line_item_created`: Records all fields
- `line_item_updated`: Records changes
- `line_item_deleted`: Records deleted values
- `monthly_closeout_created`: Records count of created items
- `closeout_approved`: Records approved count
- `closeout_paid`: Records paid count

### Validation Rules
- Cannot edit/delete paid line items
- Video platform items require source_reference_id (VideoStatSnapshot ID)
- Period month must be YYYY-MM format
- Performer must exist
- Amounts auto-calculated to prevent errors

---

## FILES CREATED/MODIFIED

### New Entities
- `entities/PerformerEarningLineItem.json` (NEW)
- `entities/PerformerEarning.json` (UPDATED)

### New Backend Functions
- `functions/performerEarningLineItemService` (NEW)

### New Components
- `components/admin/PerformerEarningsTab` (NEW - Admin UI)
- `components/admin/earnings/EarningsSummaryCards` (NEW)
- `components/admin/earnings/LineItemsTable` (NEW)
- `components/admin/earnings/AddLineItemModal` (NEW)
- `components/performerDashboard/PerformerEarningsTab` (NEW - Performer UI)

### Updated Components
- None (admin earnings page is standalone)

---

## TESTING CHECKLIST

### Admin Earnings Tab
- [ ] Select performer from dropdown
- [ ] Select period month
- [ ] Click "Create Closeout" → Auto-generates video revenue line items
- [ ] Click "Add Line Item" → Opens modal
- [ ] Add livecam income → Appears in table
- [ ] Edit line item → Updates amounts
- [ ] Delete line item → Removes from table
- [ ] Click "Approve" → Changes status to approved
- [ ] Click "Mark Paid" → Changes status to paid
- [ ] Summary cards update correctly

### Performer Dashboard Earnings Tab
- [ ] Shows correct gross total
- [ ] Shows correct performer share
- [ ] Shows correct studio share
- [ ] Breakdown by source type is accurate
- [ ] Breakdown by platform is accurate
- [ ] Breakdown by status is accurate
- [ ] Line items table shows all items
- [ ] Read-only (no edit/delete buttons)

### Backend Functions
- [ ] `create_line_item` validates required fields
- [ ] `update_line_item` prevents editing paid items
- [ ] `delete_line_item` prevents deleting paid items
- [ ] `list_line_items` returns correct array
- [ ] `aggregate_period_summary` calculates correct totals
- [ ] `create_monthly_closeout` creates line items from snapshots
- [ ] `approve_closeout` changes status correctly
- [ ] `mark_closeout_paid` changes status correctly
- [ ] Audit logs created for all actions

---

## BENEFITS

### Separation of Concerns
- **VideoStatSnapshot**: Pure video performance metrics (views, likes, revenue)
- **PerformerEarningLineItem**: Financial aggregation and income tracking
- No mixing of livecam income with video revenue

### Flexibility
- Easy to add new income sources (new source_type enum values)
- Easy to add new platforms (new source_platform enum values)
- Manual adjustments and deductions supported
- Bonus payments supported

### Transparency
- Performers see detailed breakdown of all income sources
- Clear separation of performer vs studio share
- Status tracking (estimated → pending → approved → paid)

### Audit Trail
- Every action logged
- Cannot modify paid items
- Full historical record

---

## NEXT STEPS (OPTIONAL ENHANCEMENTS)

1. **Payout Request Integration**
   - Link line items to payout requests
   - Track which line items paid in which payout

2. **Recurring Income**
   - Auto-generate fanclub subscription line items
   - Recurring livecam income templates

3. **Multi-Currency Support**
   - Store original currency
   - Auto-convert to USD using exchange_rate field

4. **Tax Reporting**
   - Generate 1099 forms
   - Export earnings data for tax purposes

5. **Notifications**
   - Email performer when closeout approved
   - Email performer when payment marked as paid

---

**Implementation Complete**: All entities, backend functions, and UI components created and ready for testing.