/**
 * adminRevenueDashboard — Admin-Only Read-Only Revenue Analytics
 * 
 * PURPOSE:
 * Provides read-only revenue analytics for admin dashboard.
 * Aggregates data from Payments, Subscriptions, PerformerEarningLineItems.
 * 
 * SECURITY:
 * - Admin-only (role check)
 * - Read-only (no mutations)
 * - Excludes test_mode by default
 * 
 * PARAMETERS:
 * - from: Start date (YYYY-MM-DD), defaults to current month start
 * - to: End date (YYYY-MM-DD), defaults to current month end
 * - source_platform_filter: 'all' or 'fleshlab' (default: 'fleshlab')
 * - include_test_mode: Include test records (default: false)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── TEST MODE DETECTION HELPERS (same as performerDashboardService) ────────
function isTestLineItem(item) {
  if (!item) return false;
  
  // Check explicit test_mode field
  if (item.test_mode === true) return true;
  
  // Check description JSON for test_mode
  try {
    const desc = JSON.parse(item.description || '{}');
    if (desc.test_mode === true) return true;
    if (desc.note && desc.note.includes('TEST')) return true;
    if (desc.note && desc.note.includes('REVENUE_ATTRIBUTION_TEST')) return true;
  } catch {}
  
  // Check notes field
  if (item.notes && item.notes.includes('TEST')) return true;
  
  // Check source_type for test patterns
  if (item.source_type && item.source_type.includes('test')) return true;
  
  return false;
}

function isTestPayment(payment) {
  if (!payment) return false;
  
  // Check metadata for test_mode
  try {
    if (payment.metadata) {
      const meta = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
      if (meta.test_mode === true) return true;
    }
  } catch {}
  
  // Check provider_session_id for TEST pattern
  if (payment.provider_session_id && payment.provider_session_id.includes('TEST')) return true;
  
  return false;
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
    const { from, to, source_platform_filter = 'all', include_test_mode = false } = body;

    // Date range defaults to current month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const fromDate = from ? new Date(from) : currentMonthStart;
    const toDate = to ? new Date(to) : currentMonthEnd;

    console.log('[adminRevenueDashboard] Request:', {
      adminUser: user.email,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      include_test_mode,
      source_platform_filter
    });

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [allPayments, allSubscriptions, allLineItems, allPerformers, allVideos, allPaymentIntents, allVideoPerformers] = await Promise.all([
      base44.asServiceRole.entities.Payment.filter({}),
      base44.asServiceRole.entities.Subscription.filter({}),
      base44.asServiceRole.entities.PerformerEarningLineItem.filter({}),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.Video.list(),
      base44.asServiceRole.entities.PaymentIntent.filter({}),
      base44.asServiceRole.entities.VideoPerformer.filter({}),
    ]);

    // Build performer lookup map
    const performerMap = {};
    allPerformers.forEach(p => {
      performerMap[p.id] = p;
    });

    // Build video lookup map
    const videoMap = {};
    allVideos.forEach(v => {
      videoMap[v.id] = v;
    });

    // ── UNIFIED FILTER FUNCTIONS ────────────────────────────────────────────
    const isInDateRange = (record) => {
      let recordDate;
      if (record.created_date) {
        recordDate = new Date(record.created_date);
      } else if (record.period_month) {
        recordDate = new Date(record.period_month + '-01');
      } else {
        recordDate = new Date(0);
      }
      return recordDate >= fromDate && recordDate <= toDate;
    };

    const isNotTest = (record) => {
      if (include_test_mode) return true;
      
      if (record.amount_usd !== undefined && record.payment_type !== undefined) {
        // Payment record
        return !isTestPayment(record);
      } else if (record.gross_amount_usd !== undefined && record.performer_amount_usd !== undefined) {
        // PerformerEarningLineItem record
        return !isTestLineItem(record);
      }
      
      // Fallback: check test_mode field
      if (record.test_mode === true) return false;
      return true;
    };

    const isFleshlabSource = (record) => {
      if (source_platform_filter === 'all') return true;
      if (source_platform_filter === 'fleshlab') {
        // For Payments: check provider
        if (record.provider && ['nowpayments', 'ccbill', 'segpay'].includes(record.provider)) return true;
        // For LineItems: check source_platform
        if (record.source_platform && record.source_platform === 'fleshlab') return true;
        // For Subscriptions: check provider
        if (record.provider && ['nowpayments', 'ccbill', 'segpay'].includes(record.provider)) return true;
        return false;
      }
      return true;
    };

    // Filter payments - COMPLETED status only, exclude test_mode
    const payments = allPayments.filter(p => 
      isInDateRange(p) && 
      isNotTest(p) &&
      isFleshlabSource(p)
    );
    const testPayments = allPayments.filter(p => isInDateRange(p) && !isNotTest(p));

    // Filter line items - exclude test_mode, match date range
    const lineItems = allLineItems.filter(li => 
      isInDateRange(li) && 
      isNotTest(li) &&
      isFleshlabSource(li)
    );
    const testLineItems = allLineItems.filter(li => isInDateRange(li) && !isNotTest(li));

    // Filter subscriptions
    const subscriptions = allSubscriptions.filter(s => isInDateRange(s) && isNotTest(s) && isFleshlabSource(s));

    // ── A) GROSS REVENUE ────────────────────────────────────────────────────
    const completedPayments = payments.filter(p => p.status === 'completed');
    
    const grossRevenue = {
      total: completedPayments.reduce((sum, p) => sum + (p.amount_usd || 0), 0),
      by_type: {
        ppv: completedPayments.filter(p => p.payment_type === 'ppv').reduce((sum, p) => sum + (p.amount_usd || 0), 0),
        fanclub_subscription: completedPayments.filter(p => p.payment_type === 'fanclub').reduce((sum, p) => sum + (p.amount_usd || 0), 0),
        guest_production_deposit: completedPayments.filter(p => p.payment_type === 'guest_production_deposit').reduce((sum, p) => sum + (p.amount_usd || 0), 0),
        other: completedPayments.filter(p => !['ppv', 'fanclub', 'guest_production_deposit'].includes(p.payment_type)).reduce((sum, p) => sum + (p.amount_usd || 0), 0),
      },
      payment_count: completedPayments.length,
    };

    // ── B) PPV REVENUE ─────────────────────────────────────────────────────
    const ppvPayments = completedPayments.filter(p => p.payment_type === 'ppv');
    const ppvGross = ppvPayments.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
    
    // Check attribution for PPV payments
    const ppvAttributed = ppvPayments.filter(p => {
      return lineItems.some(li => {
        try {
          const desc = JSON.parse(li.description || '{}');
          return desc.payment_intent_id === p.id || desc.source_reference_id === p.related_entity_id;
        } catch {
          return false;
        }
      });
    });
    const ppvAttributedGross = ppvAttributed.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
    const ppvUnattributedGross = ppvGross - ppvAttributedGross;

    // Top videos by PPV gross
    const videoPpvRevenue = {};
    ppvPayments.forEach(p => {
      if (!p.related_entity_id) return;
      if (!videoPpvRevenue[p.related_entity_id]) {
        videoPpvRevenue[p.related_entity_id] = 0;
      }
      videoPpvRevenue[p.related_entity_id] += (p.amount_usd || 0);
    });

    const topVideosByPpvGross = Object.entries(videoPpvRevenue)
      .map(([videoId, gross]) => ({
        video_id: videoId,
        video_title: videoMap[videoId]?.title || 'Unknown',
        gross,
      }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 10);

    // Top performers by PPV performer_amount
    const performerPpvRevenue = {};
    lineItems.filter(li => li.source_type === 'ppv_purchase').forEach(li => {
      if (!performerPpvRevenue[li.performer_id]) {
        performerPpvRevenue[li.performer_id] = 0;
      }
      performerPpvRevenue[li.performer_id] += (li.performer_amount_usd || 0);
    });

    const topPerformersByPpv = Object.entries(performerPpvRevenue)
      .map(([performerId, amount]) => ({
        performer_id: performerId,
        performer_name: performerMap[performerId]?.display_name || 'Unknown',
        performer_amount: amount,
      }))
      .sort((a, b) => b.performer_amount - a.performer_amount)
      .slice(0, 10);

    const ppvRevenue = {
      count: ppvPayments.length,
      gross: ppvGross,
      attributed: ppvAttributedGross,
      unattributed: ppvUnattributedGross,
      top_videos: topVideosByPpvGross,
      top_performers: topPerformersByPpv,
    };

    // ── C) FANCLUB REVENUE ─────────────────────────────────────────────────
    const fanclubPayments = completedPayments.filter(p => p.payment_type === 'fanclub');
    const fanclubGross = fanclubPayments.reduce((sum, p) => sum + (p.amount_usd || 0), 0);

    // Active subscriptions
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const newSubscriptionsInPeriod = subscriptions.filter(s => {
      const createdDate = new Date(s.created_date);
      return createdDate >= fromDate && createdDate <= toDate;
    });

    // Check fanclub attribution
    const fanclubAttributed = lineItems.filter(li => li.source_type === 'fanclub_subscription');
    const fanclubAttributedGross = fanclubAttributed.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0);
    const fanclubUnattributedGross = fanclubGross - fanclubAttributedGross;

    const fanclubRevenue = {
      active_subscriptions: activeSubscriptions.length,
      new_subscriptions: newSubscriptionsInPeriod.length,
      gross: fanclubGross,
      attributed: fanclubAttributedGross,
      unattributed: fanclubUnattributedGross,
    };

    // ── D) PERFORMER SHARES ────────────────────────────────────────────────
    const performerShares = {};
    lineItems.forEach(li => {
      if (!performerShares[li.performer_id]) {
        performerShares[li.performer_id] = {
          performer_id: li.performer_id,
          performer_name: performerMap[li.performer_id]?.display_name || 'Unknown',
          gross: 0,
          performer_amount: 0,
          studio_amount: 0,
          by_source_type: {},
        };
      }
      performerShares[li.performer_id].gross += (li.gross_amount_usd || 0);
      performerShares[li.performer_id].performer_amount += (li.performer_amount_usd || 0);
      performerShares[li.performer_id].studio_amount += (li.studio_amount_usd || 0);
      
      if (!performerShares[li.performer_id].by_source_type[li.source_type]) {
        performerShares[li.performer_id].by_source_type[li.source_type] = 0;
      }
      performerShares[li.performer_id].by_source_type[li.source_type] += (li.performer_amount_usd || 0);
    });

    const performerSharesList = Object.values(performerShares)
      .sort((a, b) => b.performer_amount - a.performer_amount);

    // ── E) STUDIO SHARE ────────────────────────────────────────────────────
    const totalPerformerAmount = lineItems.reduce((sum, li) => sum + (li.performer_amount_usd || 0), 0);
    const totalStudioAmount = lineItems.reduce((sum, li) => sum + (li.studio_amount_usd || 0), 0);
    const totalGrossAttributed = lineItems.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0);
    
    // Unattributed = gross revenue from payments minus attributed gross from line items
    const unattributedGross = grossRevenue.total - totalGrossAttributed;

    // ── SANITY CHECKS ──────────────────────────────────────────────────────
    const sanityWarnings = [];
    
    // Check 1: Attributed gross should not exceed payment gross (unless external revenue)
    if (totalGrossAttributed > grossRevenue.total && totalGrossAttributed > 0) {
      const excess = totalGrossAttributed - grossRevenue.total;
      sanityWarnings.push({
        code: 'ATTRIBUTED_EXCEEDS_PAYMENTS',
        message: `Attributed gross ($${totalGrossAttributed.toFixed(2)}) exceeds payment gross ($${grossRevenue.total.toFixed(2)}) by $${excess.toFixed(2)}. May include external platform revenue.`,
        severity: 'warning',
        data: { attributed: totalGrossAttributed, payments: grossRevenue.total, excess }
      });
    }
    
    // Check 2: Performer + Studio should equal attributed gross
    const splitSum = totalPerformerAmount + totalStudioAmount;
    const splitDiff = Math.abs(splitSum - totalGrossAttributed);
    if (splitDiff > 0.01) { // Allow 1 cent rounding error
      sanityWarnings.push({
        code: 'SPLIT_MISMATCH',
        message: `Performer ($${totalPerformerAmount.toFixed(2)}) + Studio ($${totalStudioAmount.toFixed(2)}) = $${splitSum.toFixed(2)}, but attributed gross is $${totalGrossAttributed.toFixed(2)}. Difference: $${splitDiff.toFixed(2)}`,
        severity: 'error',
        data: { performer: totalPerformerAmount, studio: totalStudioAmount, sum: splitSum, attributed: totalGrossAttributed, difference: splitDiff }
      });
    }
    
    // Check 3: Line items without matching payment
    const lineItemsWithoutPayment = lineItems.filter(li => {
      try {
        const desc = JSON.parse(li.description || '{}');
        return desc.payment_intent_id && !completedPayments.some(p => p.id === desc.payment_intent_id);
      } catch {
        return false;
      }
    }).length;
    
    if (lineItemsWithoutPayment > 0) {
      sanityWarnings.push({
        code: 'LINE_ITEMS_WITHOUT_PAYMENT',
        message: `${lineItemsWithoutPayment} line items reference payments not found in completed payments list`,
        severity: 'warning',
        data: { count: lineItemsWithoutPayment }
      });
    }
    
    // Check 4: Payments without line items (unattributed payments)
    const paymentsWithoutLineItems = completedPayments.filter(p => {
      return !lineItems.some(li => {
        try {
          const desc = JSON.parse(li.description || '{}');
          return desc.payment_intent_id === p.id;
        } catch {
          return false;
        }
      });
    }).length;
    
    if (paymentsWithoutLineItems > 0) {
      sanityWarnings.push({
        code: 'PAYMENTS_WITHOUT_ATTRIBUTION',
        message: `${paymentsWithoutLineItems} completed payments have no revenue attribution`,
        severity: 'warning',
        data: { count: paymentsWithoutLineItems }
      });
    }

    const studioShare = {
      total_gross_attributed: totalGrossAttributed,
      total_performer_amount: totalPerformerAmount,
      total_studio_amount: totalStudioAmount,
      unattributed_gross: unattributedGross,
      performer_percentage: totalGrossAttributed > 0 ? (totalPerformerAmount / totalGrossAttributed * 100).toFixed(2) : 0,
      studio_percentage: totalGrossAttributed > 0 ? (totalStudioAmount / totalGrossAttributed * 100).toFixed(2) : 0,
      sanity_warnings: sanityWarnings,
    };

    // ── F) DIAGNOSTICS ─────────────────────────────────────────────────────
    const paymentsWithoutEntitlement = completedPayments.filter(p => !p.related_entity_id).length;

    const ppvWithoutAttribution = ppvPayments.filter(p => {
      return !lineItems.some(li => {
        try {
          const desc = JSON.parse(li.description || '{}');
          return desc.payment_intent_id === p.id;
        } catch {
          return false;
        }
      });
    }).length;

    const ppvMissingVideoId = ppvPayments.filter(p => !p.related_entity_id).length;

    const videosWithPpvPayments = [...new Set(ppvPayments.map(p => p.related_entity_id).filter(Boolean))];
    const videosWithoutPerformers = videosWithPpvPayments.filter(vid => {
      return !allVideoPerformers.some(vp => vp.video_id === vid);
    }).length;

    const fanclubUnattributedCount = fanclubPayments.filter(p => !p.related_entity_id).length;

    const testRecordsExcluded = testPayments.length + testLineItems.length;

    let duplicateWebhookCount = 0;
    try {
      const webhookEvents = await base44.asServiceRole.entities.PaymentWebhookEvent.filter({});
      duplicateWebhookCount = webhookEvents.filter(e => e.event_type === 'payment.completed' && e.processed === false).length;
    } catch {}

    const diagnostics = {
      payments_without_entitlement: paymentsWithoutEntitlement,
      ppv_without_attribution: ppvWithoutAttribution,
      ppv_missing_video_id: ppvMissingVideoId,
      videos_without_performers: videosWithoutPerformers,
      fanclub_unattributed: fanclubUnattributedCount,
      test_records_excluded: testRecordsExcluded,
      duplicate_webhooks: duplicateWebhookCount,
    };

    // ── TEST DATA SUMMARY ──────────────────────────────────────────────────
    const testDataSummary = {
      test_payments_count: testPayments.length,
      test_payments_gross: testPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount_usd || 0), 0),
      test_line_items_count: testLineItems.length,
      test_line_items_gross: testLineItems.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0),
      test_line_items_performer_amount: testLineItems.reduce((sum, li) => sum + (li.performer_amount_usd || 0), 0),
    };

    // ── RESPONSE ───────────────────────────────────────────────────────────
    return Response.json({
      success: true,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        include_test_mode,
        source_platform_filter,
      },
      gross_revenue: grossRevenue,
      ppv_revenue: ppvRevenue,
      fanclub_revenue: fanclubRevenue,
      performer_shares: performerSharesList,
      studio_share: studioShare,
      diagnostics: diagnostics,
      test_data_summary: testDataSummary,
    });

  } catch (error) {
    console.error('[adminRevenueDashboard] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false,
    }, { status: 500 });
  }
});