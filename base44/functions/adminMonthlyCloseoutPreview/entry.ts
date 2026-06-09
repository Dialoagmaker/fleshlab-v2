/**
 * adminMonthlyCloseoutPreview — Admin-Only Read-Only Closeout Preview
 * 
 * PURPOSE:
 * Provides a safe preview of what monthly payout closeout drafts would be generated.
 * Does NOT create any payouts, mark anything paid, or send notifications.
 * Preview-only for admin review before actual closeout generation.
 * 
 * SECURITY:
 * - Admin-only (role check)
 * - Read-only (no mutations)
 * - Excludes test_mode by default
 * 
 * PARAMETERS:
 * - month: Format YYYY-MM (required)
 * - performer_id: Optional filter
 * - include_test_mode: Include test records (default: false)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── TEST MODE DETECTION (same as adminMonthlyPayoutSummary) ─────────────────
function isTestLineItem(item) {
  if (!item) return false;
  
  // Check explicit test_mode field
  if (item.test_mode === true) return true;
  
  // Check description JSON for test markers
  try {
    const desc = JSON.parse(item.description || '{}');
    if (desc.test_mode === true) return true;
    if (desc.simulated === true) return true;
    if (desc.note) {
      const note = desc.note.toUpperCase();
      if (note.includes('TEST') || note.includes('SIMULATED') || note.includes('REVENUE_ATTRIBUTION_TEST')) return true;
    }
  } catch {}
  
  // Check notes field
  if (item.notes) {
    const notes = item.notes.toUpperCase();
    if (notes.includes('TEST') || notes.includes('SIMULATED')) return true;
  }
  
  return false;
}

// ── SOURCE CLASSIFICATION (same as adminMonthlyPayoutSummary) ───────────────
function classifySource(li) {
  const sources = {
    is_internal_fleshlab: false,
    is_external: false,
    is_livecam: false,
    is_imported_platform: false,
  };
  
  // Internal Fleshlab payments
  if (li.source_type && ['ppv_purchase', 'fanclub_subscription', 'custom_content'].includes(li.source_type)) {
    if (li.source_platform === 'fleshlab' || li.source_platform === 'internal') {
      sources.is_internal_fleshlab = true;
    }
  }
  
  // External platforms
  if (li.source_type && ['video_platform', 'livecam', 'bonus', 'manual_adjustment'].includes(li.source_type)) {
    sources.is_external = true;
    
    // Livecam
    if (li.source_platform && ['chaturbate', 'stripchat', 'bongacams', 'livejasmin'].includes(li.source_platform)) {
      sources.is_livecam = true;
    }
    
    // Imported platforms
    if (li.source_platform && ['xhamster', 'faphouse', 'pornhub', 'xvideos', 'boyfriendtv', 'zapping'].includes(li.source_platform)) {
      sources.is_imported_platform = true;
    }
  }
  
  return sources;
}

// ── PAYOUT STATUS DETECTION ─────────────────────────────────────────────────
async function getPayoutStatus(base44, performer_id, month) {
  try {
    // Check if there's a PerformerEarning header record for this performer/month
    const earnings = await base44.asServiceRole.entities.PerformerEarning.filter({
      performer_id,
      period_month: month,
    });
    
    if (earnings.length === 0) {
      return 'not_generated';
    }
    
    const earning = earnings[0];
    return earning.status || 'draft';
  } catch (err) {
    console.error('[getPayoutStatus] Error:', err.message);
    return 'unknown';
  }
}

// ── UNPAID CARRYOVER CALCULATION ────────────────────────────────────────────
async function getUnpaidCarryover(base44, performer_id, before_month) {
  try {
    // Get all line items before the specified month that are not paid
    const allLineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
      performer_id,
    });
    
    const carryoverItems = allLineItems.filter(li => {
      if (li.period_month >= before_month) return false;
      if (isTestLineItem(li)) return false;
      if (li.status === 'paid') return false;
      return true;
    });
    
    const total = carryoverItems.reduce((sum, li) => sum + (li.performer_amount_usd || 0), 0);
    return total > 0 ? total : null;
  } catch (err) {
    console.error('[getUnpaidCarryover] Error:', err.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN-ONLY CHECK
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required', success: false }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      month, 
      performer_id, 
      include_test_mode = false 
    } = body;

    // Validate month
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ 
        error: 'Invalid month format. Use YYYY-MM', 
        success: false 
      }, { status: 400 });
    }

    console.log('[adminMonthlyCloseoutPreview] Request:', {
      adminUser: user.email,
      month,
      performer_id,
      include_test_mode,
    });

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [allLineItems, allPerformers, allEarnings] = await Promise.all([
      base44.asServiceRole.entities.PerformerEarningLineItem.filter({}),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.PerformerEarning.filter({}),
    ]);

    // Build lookup maps
    const performerMap = {};
    allPerformers.forEach(p => { performerMap[p.id] = p; });
    
    // Build map of existing earnings (payout headers)
    const earningsMap = {};
    allEarnings.forEach(e => {
      const key = `${e.performer_id}:${e.period_month}`;
      earningsMap[key] = e;
    });

    // ── FILTER FUNCTIONS ────────────────────────────────────────────────────
    const isNotTest = (item) => {
      if (include_test_mode) return true;
      return !isTestLineItem(item);
    };

    const isInMonth = (item) => {
      return item.period_month === month;
    };

    // Filter line items
    let lineItems = allLineItems.filter(li => 
      isInMonth(li) && isNotTest(li)
    );

    // Filter by performer if specified
    if (performer_id) {
      lineItems = lineItems.filter(li => li.performer_id === performer_id);
    }

    // ── AGGREGATE BY PERFORMER ──────────────────────────────────────────────
    const performerSummary = {};
    
    lineItems.forEach(li => {
      if (!performerSummary[li.performer_id]) {
        performerSummary[li.performer_id] = {
          performer_id: li.performer_id,
          performer_name: performerMap[li.performer_id]?.display_name || 'Unknown',
          stage_name: performerMap[li.performer_id]?.display_name || 'Unknown',
          month: month,
          gross_revenue_total: 0,
          performer_share_total: 0,
          studio_share_total: 0,
          line_item_count: 0,
          line_item_ids: [],
          source_breakdown: {
            internal_fleshlab_gross: 0,
            external_platform_gross: 0,
            livecam_gross: 0,
            imported_platform_gross: 0,
          },
        };
      }
      
      const summary = performerSummary[li.performer_id];
      summary.gross_revenue_total += (li.gross_amount_usd || 0);
      summary.performer_share_total += (li.performer_amount_usd || 0);
      summary.studio_share_total += (li.studio_amount_usd || 0);
      summary.line_item_count++;
      summary.line_item_ids.push(li.id);
      
      // Source breakdown
      const sources = classifySource(li);
      if (sources.is_internal_fleshlab) {
        summary.source_breakdown.internal_fleshlab_gross += (li.gross_amount_usd || 0);
      }
      if (sources.is_external) {
        summary.source_breakdown.external_platform_gross += (li.gross_amount_usd || 0);
      }
      if (sources.is_livecam) {
        summary.source_breakdown.livecam_gross += (li.gross_amount_usd || 0);
      }
      if (sources.is_imported_platform) {
        summary.source_breakdown.imported_platform_gross += (li.gross_amount_usd || 0);
      }
    });

    // ── PREVIEW LOGIC: DETERMINE ACTION FOR EACH PERFORMER ──────────────────
    const PAYOUT_THRESHOLD = 100; // USD
    
    const enrichedSummaries = await Promise.all(
      Object.values(performerSummary).map(async (summary) => {
        const earningsKey = `${summary.performer_id}:${month}`;
        const existingEarning = earningsMap[earningsKey];
        
        // Get existing payout status
        let existing_payout_status = 'not_generated';
        if (existingEarning) {
          existing_payout_status = existingEarning.status || 'draft';
        }
        
        // Get unpaid carryover
        const unpaid_carryover_amount = await getUnpaidCarryover(base44, summary.performer_id, month);
        
        // Calculate total eligible amount
        const total_eligible = summary.performer_share_total + (unpaid_carryover_amount || 0);
        const threshold_status = total_eligible >= PAYOUT_THRESHOLD ? 'eligible' : 'below_threshold';
        
        // Determine preview action (SAFETY LOGIC)
        let payout_action_preview = 'skip_no_data';
        
        if (existing_payout_status === 'paid') {
          payout_action_preview = 'skip_paid';
        } else if (existing_payout_status === 'on_hold') {
          payout_action_preview = 'skip_on_hold';
        } else if (existing_payout_status === 'draft' || existing_payout_status === 'approved') {
          payout_action_preview = 'skip_existing_draft';
        } else if (threshold_status === 'below_threshold') {
          payout_action_preview = 'carryover';
        } else if (threshold_status === 'eligible') {
          payout_action_preview = 'create_draft';
        }
        
        return {
          ...summary,
          existing_payout_status,
          minimum_payout_threshold_status: threshold_status,
          payout_threshold_amount: PAYOUT_THRESHOLD,
          unpaid_carryover_amount,
          total_eligible_amount: total_eligible,
          payout_action_preview,
        };
      })
    );

    // Sort by performer_share_total descending
    enrichedSummaries.sort((a, b) => b.performer_share_total - a.performer_share_total);

    // ── SUMMARY TOTALS ──────────────────────────────────────────────────────
    const total_performer_earnings = enrichedSummaries.reduce((sum, p) => sum + p.performer_share_total, 0);
    const total_studio_share = enrichedSummaries.reduce((sum, p) => sum + p.studio_share_total, 0);
    const performers_count = enrichedSummaries.length;
    const eligible_count = enrichedSummaries.filter(p => p.payout_action_preview === 'create_draft').length;
    const below_threshold_count = enrichedSummaries.filter(p => p.payout_action_preview === 'carryover').length;
    const on_hold_count = enrichedSummaries.filter(p => p.payout_action_preview === 'skip_on_hold').length;
    const draft_exists_count = enrichedSummaries.filter(p => p.payout_action_preview === 'skip_existing_draft').length;
    const paid_count = enrichedSummaries.filter(p => p.payout_action_preview === 'skip_paid').length;

    // ── SAFETY CHECKS ───────────────────────────────────────────────────────
    const safetyWarnings = [];
    
    // Check split math per performer
    enrichedSummaries.forEach(summary => {
      const splitSum = summary.performer_share_total + summary.studio_share_total;
      const diff = Math.abs(splitSum - summary.gross_revenue_total);
      
      if (diff > 0.01) {
        safetyWarnings.push({
          code: 'SPLIT_MISMATCH',
          performer_id: summary.performer_id,
          performer_name: summary.performer_name,
          message: `Performer ($${summary.performer_share_total.toFixed(2)}) + Studio ($${summary.studio_share_total.toFixed(2)}) = $${splitSum.toFixed(2)}, but gross is $${summary.gross_revenue_total.toFixed(2)}. Diff: $${diff.toFixed(2)}`,
          severity: 'error',
        });
      }
    });

    // Check for guest production studio-only revenue (should not have performer share)
    const guestProductionItems = lineItems.filter(li => 
      li.source_type === 'guest_production_deposit' && 
      li.performer_amount_usd > 0
    );
    
    if (guestProductionItems.length > 0) {
      safetyWarnings.push({
        code: 'GUEST_PRODUCTION_WITH_PERFORMER_SHARE',
        message: `${guestProductionItems.length} guest production deposits have performer share - verify if intentional (guest production should be studio-only unless explicitly marked performer-payable)`,
        severity: 'warning',
        count: guestProductionItems.length,
      });
    }

    // Check for test records that would be excluded
    if (!include_test_mode) {
      const excludedTestItems = allLineItems.filter(li => 
        isInMonth(li) && !isNotTest(li)
      ).length;
      
      if (excludedTestItems > 0) {
        safetyWarnings.push({
          code: 'TEST_RECORDS_EXCLUDED',
          message: `${excludedTestItems} test mode line items excluded from preview (set include_test_mode=true to include)`,
          severity: 'info',
          count: excludedTestItems,
        });
      }
    }

    // ── RESPONSE ───────────────────────────────────────────────────────────
    return Response.json({
      success: true,
      preview_mode: true,
      period: {
        month,
        include_test_mode,
      },
      summary: {
        total_performer_earnings,
        total_studio_share,
        total_gross_revenue: enrichedSummaries.reduce((sum, p) => sum + p.gross_revenue_total, 0),
        performers_count,
        eligible_count,
        below_threshold_count,
        on_hold_count,
        draft_exists_count,
        paid_count,
      },
      performer_previews: enrichedSummaries,
      safety_warnings: safetyWarnings,
      metadata: {
        payout_threshold_usd: PAYOUT_THRESHOLD,
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        preview_only: true,
        no_mutations: true,
      },
    });

  } catch (error) {
    console.error('[adminMonthlyCloseoutPreview] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false,
    }, { status: 500 });
  }
});