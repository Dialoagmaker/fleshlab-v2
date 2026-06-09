/**
 * adminMonthlyPayoutSummary — Admin-Only Read-Only Payout Summary
 * 
 * PURPOSE:
 * Provides read-only monthly payout summary showing performer earnings before any payout approval/generation.
 * Does NOT create payouts, mark as paid, or modify any records - reporting only.
 * 
 * SECURITY:
 * - Admin-only (role check)
 * - Read-only (no mutations)
 * - Excludes test_mode by default
 * 
 * PARAMETERS:
 * - month: Format YYYY-MM (required)
 * - performer_id: Optional filter
 * - source_platform: all / fleshlab / external / livecam / imported (default: all)
 * - include_test_mode: Include test records (default: false)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── TEST MODE DETECTION (same as adminRevenueDashboard) ─────────────────────
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

// ── SOURCE CLASSIFICATION ───────────────────────────────────────────────────
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
      source_platform = 'all',
      include_test_mode = false 
    } = body;

    // Validate month
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ 
        error: 'Invalid month format. Use YYYY-MM', 
        success: false 
      }, { status: 400 });
    }

    console.log('[adminMonthlyPayoutSummary] Request:', {
      adminUser: user.email,
      month,
      performer_id,
      source_platform,
      include_test_mode,
    });

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [allLineItems, allPerformers, allVideos, allPayments] = await Promise.all([
      base44.asServiceRole.entities.PerformerEarningLineItem.filter({}),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.Video.list(),
      base44.asServiceRole.entities.Payment.filter({}),
    ]);

    // Build lookup maps
    const performerMap = {};
    allPerformers.forEach(p => { performerMap[p.id] = p; });
    
    const videoMap = {};
    allVideos.forEach(v => { videoMap[v.id] = v; });

    // Build set of payment IDs for source classification
    const paymentIds = new Set();
    allPayments.forEach(p => paymentIds.add(p.id));

    // ── FILTER FUNCTIONS ────────────────────────────────────────────────────
    const isNotTest = (item) => {
      if (include_test_mode) return true;
      return !isTestLineItem(item);
    };

    const isInMonth = (item) => {
      return item.period_month === month;
    };

    const matchesSourceFilter = (li, filter) => {
      if (filter === 'all') return true;
      
      const sources = classifySource(li);
      
      if (filter === 'fleshlab') return sources.is_internal_fleshlab;
      if (filter === 'external') return sources.is_external;
      if (filter === 'livecam') return sources.is_livecam;
      if (filter === 'imported') return sources.is_imported_platform;
      
      return true;
    };

    // Filter line items
    let lineItems = allLineItems.filter(li => 
      isInMonth(li) && 
      isNotTest(li) &&
      matchesSourceFilter(li, source_platform)
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
          source_breakdown: {
            internal_fleshlab_gross: 0,
            external_platform_gross: 0,
            livecam_gross: 0,
            imported_platform_gross: 0,
          },
          line_items: [],
        };
      }
      
      const summary = performerSummary[li.performer_id];
      summary.gross_revenue_total += (li.gross_amount_usd || 0);
      summary.performer_share_total += (li.performer_amount_usd || 0);
      summary.studio_share_total += (li.studio_amount_usd || 0);
      summary.line_item_count++;
      
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
      
      // Store line item details
      summary.line_items.push({
        id: li.id,
        created_date: li.created_date,
        source_type: li.source_type,
        source_platform: li.source_platform,
        description: li.description,
        gross_amount_usd: li.gross_amount_usd,
        performer_amount_usd: li.performer_amount_usd,
        studio_amount_usd: li.studio_amount_usd,
        status: li.status,
        video_reference: li.source_reference_id && li.source_type === 'ppv_purchase' ? videoMap[li.source_reference_id]?.title : null,
        payment_reference: li.source_reference_id && ['ppv_purchase', 'fanclub_subscription'].includes(li.source_type) ? li.source_reference_id : null,
      });
    });

    // ── ENRICH WITH PAYOUT STATUS & THRESHOLDS ──────────────────────────────
    const PAYOUT_THRESHOLD = 100; // USD
    
    const enrichedSummaries = await Promise.all(
      Object.values(performerSummary).map(async (summary) => {
        // Get payout status
        const payout_status = await getPayoutStatus(base44, summary.performer_id, month);
        
        // Get unpaid carryover
        const unpaid_carryover_amount = await getUnpaidCarryover(base44, summary.performer_id, month);
        
        // Threshold status
        const total_eligible = summary.performer_share_total + (unpaid_carryover_amount || 0);
        const minimum_payout_threshold_status = total_eligible >= PAYOUT_THRESHOLD ? 'eligible' : 'below_threshold';
        
        return {
          ...summary,
          payout_status,
          minimum_payout_threshold_status,
          payout_threshold_amount: PAYOUT_THRESHOLD,
          unpaid_carryover_amount,
          total_eligible_amount: total_eligible,
        };
      })
    );

    // Sort by performer_share_total descending
    enrichedSummaries.sort((a, b) => b.performer_share_total - a.performer_share_total);

    // ── SANITY CHECKS ───────────────────────────────────────────────────────
    const sanityWarnings = [];
    
    // Check split math per performer
    enrichedSummaries.forEach(summary => {
      const splitSum = summary.performer_share_total + summary.studio_share_total;
      const diff = Math.abs(splitSum - summary.gross_revenue_total);
      
      if (diff > 0.01) {
        sanityWarnings.push({
          code: 'SPLIT_MISMATCH',
          performer_id: summary.performer_id,
          performer_name: summary.performer_name,
          message: `Performer ($${summary.performer_share_total.toFixed(2)}) + Studio ($${summary.studio_share_total.toFixed(2)}) = $${splitSum.toFixed(2)}, but gross is $${summary.gross_revenue_total.toFixed(2)}. Diff: $${diff.toFixed(2)}`,
          severity: 'warning',
        });
      }
    });

    // Check for guest production studio-only revenue (should not have performer share)
    const guestProductionItems = lineItems.filter(li => 
      li.source_type === 'guest_production_deposit' && 
      li.performer_amount_usd > 0
    );
    
    if (guestProductionItems.length > 0) {
      sanityWarnings.push({
        code: 'GUEST_PRODUCTION_WITH_PERFORMER_SHARE',
        message: `${guestProductionItems.length} guest production deposits have performer share - verify if intentional`,
        severity: 'info',
        count: guestProductionItems.length,
      });
    }

    // ── SUMMARY TOTALS ──────────────────────────────────────────────────────
    const total_performer_earnings = enrichedSummaries.reduce((sum, p) => sum + p.performer_share_total, 0);
    const total_studio_share = enrichedSummaries.reduce((sum, p) => sum + p.studio_share_total, 0);
    const total_gross = enrichedSummaries.reduce((sum, p) => sum + p.gross_revenue_total, 0);
    const eligible_count = enrichedSummaries.filter(p => p.minimum_payout_threshold_status === 'eligible').length;
    const below_threshold_count = enrichedSummaries.filter(p => p.minimum_payout_threshold_status === 'below_threshold').length;
    const on_hold_count = enrichedSummaries.filter(p => p.payout_status === 'on_hold').length;

    // ── RESPONSE ───────────────────────────────────────────────────────────
    return Response.json({
      success: true,
      period: {
        month,
        source_platform,
        include_test_mode,
      },
      summary: {
        total_performer_earnings,
        total_studio_share,
        total_gross_revenue: total_gross,
        eligible_for_payout_count: eligible_count,
        below_threshold_count,
        on_hold_count,
        total_performers: enrichedSummaries.length,
      },
      performer_summaries: enrichedSummaries,
      sanity_warnings: sanityWarnings,
      metadata: {
        payout_threshold_usd: PAYOUT_THRESHOLD,
        generated_at: new Date().toISOString(),
        generated_by: user.email,
      },
    });

  } catch (error) {
    console.error('[adminMonthlyPayoutSummary] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false,
    }, { status: 500 });
  }
});