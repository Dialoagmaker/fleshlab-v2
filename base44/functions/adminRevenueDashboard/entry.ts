/**
 * adminRevenueDashboard — Admin-Only Read-Only Revenue Analytics
 * 
 * PURPOSE:
 * Provides read-only revenue analytics with clear separation between:
 * - Internal Payment Revenue (from FLESHLAB payment records)
 * - External Platform Revenue (from livecam, imported platform earnings, etc.)
 * 
 * SECURITY:
 * - Admin-only (role check)
 * - Read-only (no mutations)
 * - Excludes test_mode by default
 * 
 * PARAMETERS:
 * - from: Start date (YYYY-MM-DD), defaults to current month start
 * - to: End date (YYYY-MM-DD), defaults to current month end
 * - include_test_mode: Include test records (default: false)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── TEST MODE DETECTION HELPERS ────────────────────────────────────────────
function isTestLineItem(item) {
  if (!item) return false;
  if (item.test_mode === true) return true;
  try {
    const desc = JSON.parse(item.description || '{}');
    if (desc.test_mode === true) return true;
    if (desc.note && desc.note.includes('TEST')) return true;
    if (desc.note && desc.note.includes('REVENUE_ATTRIBUTION_TEST')) return true;
  } catch {}
  if (item.notes && item.notes.includes('TEST')) return true;
  if (item.source_type && item.source_type.includes('test')) return true;
  return false;
}

function isTestPayment(payment) {
  if (!payment) return false;
  try {
    if (payment.metadata) {
      const meta = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
      if (meta.test_mode === true) return true;
    }
  } catch {}
  if (payment.provider_session_id && payment.provider_session_id.includes('TEST')) return true;
  return false;
}

// ── SOURCE CLASSIFICATION HELPERS ─────────────────────────────────────────
/**
 * Classifies a line item as internal or external based on source attribution.
 * Internal = linked to a FLESHLAB Payment record (has payment_intent_id or payment_reference)
 * External = no payment link, from livecam/platform imports, manual adjustments, etc.
 */
function isInternalPaymentLineItem(li, paymentIds) {
  if (!li) return false;
  
  // Check description JSON for payment_intent_id
  try {
    const desc = JSON.parse(li.description || '{}');
    if (desc.payment_intent_id && paymentIds.has(desc.payment_intent_id)) {
      return true;
    }
    if (desc.payment_reference && paymentIds.has(desc.payment_reference)) {
      return true;
    }
  } catch {}
  
  // Check source_reference_id for Payment entity
  if (li.source_reference_id && paymentIds.has(li.source_reference_id)) {
    return true;
  }
  
  return false;
}

function isExternalPlatformLineItem(li, paymentIds) {
  return !isInternalPaymentLineItem(li, paymentIds);
}

function isLivecamLineItem(li) {
  return li.source_type === 'livecam' || 
         (li.source_platform && ['chaturbate', 'stripchat', 'bongacams', 'livejasmin'].includes(li.source_platform));
}

function isImportedPlatformLineItem(li) {
  return li.source_type === 'video_platform' && 
         li.source_platform && ['xhamster', 'faphouse', 'pornhub', 'xvideos'].includes(li.source_platform);
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
    const { from, to, include_test_mode = false } = body;

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
      include_test_mode
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

    // Build lookup maps
    const performerMap = {};
    allPerformers.forEach(p => { performerMap[p.id] = p; });
    
    const videoMap = {};
    allVideos.forEach(v => { videoMap[v.id] = v; });
    
    // Build set of completed payment IDs for classification
    const completedPaymentIds = new Set();

    // ── FILTER FUNCTIONS ────────────────────────────────────────────────────
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
        return !isTestPayment(record);
      } else if (record.gross_amount_usd !== undefined && record.performer_amount_usd !== undefined) {
        return !isTestLineItem(record);
      }
      if (record.test_mode === true) return false;
      return true;
    };

    // Filter payments - COMPLETED status only, exclude test_mode
    const payments = allPayments.filter(p => isInDateRange(p) && isNotTest(p));
    const completedPayments = payments.filter(p => p.status === 'completed');
    
    // Build set of completed payment IDs
    completedPayments.forEach(p => {
      completedPaymentIds.add(p.id);
      if (p.related_entity_id) {
        completedPaymentIds.add(p.related_entity_id);
      }
    });
    
    const testPayments = allPayments.filter(p => isInDateRange(p) && !isNotTest(p));

    // Filter line items - exclude test_mode, match date range
    const lineItems = allLineItems.filter(li => isInDateRange(li) && isNotTest(li));
    const testLineItems = allLineItems.filter(li => isInDateRange(li) && !isNotTest(li));

    // Filter subscriptions
    const subscriptions = allSubscriptions.filter(s => isInDateRange(s) && isNotTest(s));

    // ── CLASSIFY LINE ITEMS ────────────────────────────────────────────────
    const internalLineItems = lineItems.filter(li => isInternalPaymentLineItem(li, completedPaymentIds));
    const externalLineItems = lineItems.filter(li => isExternalPlatformLineItem(li, completedPaymentIds));
    
    const livecamLineItems = lineItems.filter(li => isLivecamLineItem(li));
    const importedPlatformLineItems = lineItems.filter(li => isImportedPlatformLineItem(li));

    // ── A) INTERNAL PAYMENT REVENUE ────────────────────────────────────────
    const internalPaymentGross = completedPayments.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
    
    const internalPaymentByType = {
      ppv: completedPayments.filter(p => p.payment_type === 'ppv').reduce((sum, p) => sum + (p.amount_usd || 0), 0),
      fanclub_subscription: completedPayments.filter(p => p.payment_type === 'fanclub').reduce((sum, p) => sum + (p.amount_usd || 0), 0),
      guest_production_deposit: completedPayments.filter(p => p.payment_type === 'guest_production_deposit').reduce((sum, p) => sum + (p.amount_usd || 0), 0),
      other: completedPayments.filter(p => !['ppv', 'fanclub', 'guest_production_deposit'].includes(p.payment_type)).reduce((sum, p) => sum + (p.amount_usd || 0), 0),
    };

    // ── B) INTERNAL ATTRIBUTED REVENUE ─────────────────────────────────────
    const internalAttributedGross = internalLineItems.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0);
    const internalPerformerAmount = internalLineItems.reduce((sum, li) => sum + (li.performer_amount_usd || 0), 0);
    const internalStudioAmount = internalLineItems.reduce((sum, li) => sum + (li.studio_amount_usd || 0), 0);
    const internalUnattributedGross = internalPaymentGross - internalAttributedGross;

    // ── C) EXTERNAL PLATFORM REVENUE ───────────────────────────────────────
    const externalPlatformGross = externalLineItems.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0);
    const externalPerformerAmount = externalLineItems.reduce((sum, li) => sum + (li.performer_amount_usd || 0), 0);
    const externalStudioAmount = externalLineItems.reduce((sum, li) => sum + (li.studio_amount_usd || 0), 0);
    
    const externalBySource = {
      livecam: livecamLineItems.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0),
      imported_platform: importedPlatformLineItems.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0),
      other: externalLineItems.filter(li => !isLivecamLineItem(li) && !isImportedPlatformLineItem(li)).reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0),
    };

    // ── D) TOTAL BUSINESS REVENUE ──────────────────────────────────────────
    const totalAttributedGross = internalAttributedGross + externalPlatformGross;
    const totalPerformerAmount = internalPerformerAmount + externalPerformerAmount;
    const totalStudioAmount = internalStudioAmount + externalStudioAmount;
    const totalBusinessRevenue = internalPaymentGross + externalPlatformGross;

    // ── E) PPV REVENUE (Internal Only) ─────────────────────────────────────
    const ppvPayments = completedPayments.filter(p => p.payment_type === 'ppv');
    const ppvGross = ppvPayments.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
    
    const ppvInternalLineItems = internalLineItems.filter(li => li.source_type === 'ppv_purchase');
    const ppvAttributedGross = ppvInternalLineItems.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0);
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

    // Top performers by PPV performer_amount (internal only)
    const performerPpvRevenue = {};
    ppvInternalLineItems.forEach(li => {
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

    // ── F) FANCLUB REVENUE (Internal Only) ─────────────────────────────────
    const fanclubPayments = completedPayments.filter(p => p.payment_type === 'fanclub');
    const fanclubGross = fanclubPayments.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const newSubscriptionsInPeriod = subscriptions.filter(s => {
      const createdDate = new Date(s.created_date);
      return createdDate >= fromDate && createdDate <= toDate;
    });

    const fanclubInternalLineItems = internalLineItems.filter(li => li.source_type === 'fanclub_subscription');
    const fanclubAttributedGross = fanclubInternalLineItems.reduce((sum, li) => sum + (li.gross_amount_usd || 0), 0);
    const fanclubUnattributedGross = fanclubGross - fanclubAttributedGross;

    const fanclubRevenue = {
      active_subscriptions: activeSubscriptions.length,
      new_subscriptions: newSubscriptionsInPeriod.length,
      gross: fanclubGross,
      attributed: fanclubAttributedGross,
      unattributed: fanclubUnattributedGross,
    };

    // ── G) PERFORMER SHARES (All Line Items) ───────────────────────────────
    const performerShares = {};
    lineItems.forEach(li => {
      if (!performerShares[li.performer_id]) {
        performerShares[li.performer_id] = {
          performer_id: li.performer_id,
          performer_name: performerMap[li.performer_id]?.display_name || 'Unknown',
          gross: 0,
          performer_amount: 0,
          studio_amount: 0,
          internal_gross: 0,
          external_gross: 0,
          by_source_type: {},
        };
      }
      performerShares[li.performer_id].gross += (li.gross_amount_usd || 0);
      performerShares[li.performer_id].performer_amount += (li.performer_amount_usd || 0);
      performerShares[li.performer_id].studio_amount += (li.studio_amount_usd || 0);
      
      if (isInternalPaymentLineItem(li, completedPaymentIds)) {
        performerShares[li.performer_id].internal_gross += (li.gross_amount_usd || 0);
      } else {
        performerShares[li.performer_id].external_gross += (li.gross_amount_usd || 0);
      }
      
      if (!performerShares[li.performer_id].by_source_type[li.source_type]) {
        performerShares[li.performer_id].by_source_type[li.source_type] = 0;
      }
      performerShares[li.performer_id].by_source_type[li.source_type] += (li.performer_amount_usd || 0);
    });

    const performerSharesList = Object.values(performerShares)
      .sort((a, b) => b.performer_amount - a.performer_amount);

    // ── H) SANITY CHECKS ───────────────────────────────────────────────────
    const sanityWarnings = [];
    
    // Internal split check
    const internalSplitSum = internalPerformerAmount + internalStudioAmount;
    const internalSplitDiff = Math.abs(internalSplitSum - internalAttributedGross);
    if (internalSplitDiff > 0.01) {
      sanityWarnings.push({
        code: 'INTERNAL_SPLIT_MISMATCH',
        message: `Internal: Performer ($${internalPerformerAmount.toFixed(2)}) + Studio ($${internalStudioAmount.toFixed(2)}) = $${internalSplitSum.toFixed(2)}, but attributed gross is $${internalAttributedGross.toFixed(2)}. Difference: $${internalSplitDiff.toFixed(2)}`,
        severity: 'error',
        data: { performer: internalPerformerAmount, studio: internalStudioAmount, sum: internalSplitSum, attributed: internalAttributedGross, difference: internalSplitDiff }
      });
    }
    
    // Total split check
    const totalSplitSum = totalPerformerAmount + totalStudioAmount;
    const totalSplitDiff = Math.abs(totalSplitSum - totalAttributedGross);
    if (totalSplitDiff > 0.01) {
      sanityWarnings.push({
        code: 'TOTAL_SPLIT_MISMATCH',
        message: `Total: Performer ($${totalPerformerAmount.toFixed(2)}) + Studio ($${totalStudioAmount.toFixed(2)}) = $${totalSplitSum.toFixed(2)}, but attributed gross is $${totalAttributedGross.toFixed(2)}. Difference: $${totalSplitDiff.toFixed(2)}`,
        severity: 'error',
        data: { performer: totalPerformerAmount, studio: totalStudioAmount, sum: totalSplitSum, attributed: totalAttributedGross, difference: totalSplitDiff }
      });
    }
    
    // Internal attributed exceeds payments (only for internal)
    if (internalAttributedGross > internalPaymentGross && internalAttributedGross > 0) {
      const excess = internalAttributedGross - internalPaymentGross;
      sanityWarnings.push({
        code: 'INTERNAL_ATTRIBUTED_EXCEEDS_PAYMENTS',
        message: `Internal attributed gross ($${internalAttributedGross.toFixed(2)}) exceeds internal payment gross ($${internalPaymentGross.toFixed(2)}) by $${excess.toFixed(2)}. Check for duplicate attribution.`,
        severity: 'error',
        data: { attributed: internalAttributedGross, payments: internalPaymentGross, excess }
      });
    }
    
    // Internal payments without attribution
    const internalPaymentsWithoutAttribution = completedPayments.filter(p => {
      return !internalLineItems.some(li => {
        try {
          const desc = JSON.parse(li.description || '{}');
          return desc.payment_intent_id === p.id || desc.payment_reference === p.id;
        } catch {
          return false;
        }
      });
    }).length;
    
    if (internalPaymentsWithoutAttribution > 0) {
      sanityWarnings.push({
        code: 'PAYMENTS_WITHOUT_ATTRIBUTION',
        message: `${internalPaymentsWithoutAttribution} completed internal payments have no revenue attribution`,
        severity: 'warning',
        data: { count: internalPaymentsWithoutAttribution }
      });
    }
    
    // External revenue without payment (info only)
    const externalRevenueWithoutPayment = externalLineItems.length;
    if (externalRevenueWithoutPayment > 0) {
      sanityWarnings.push({
        code: 'EXTERNAL_REVENUE_WITHOUT_PAYMENT',
        message: `${externalRevenueWithoutPayment} external platform line items (no internal payment records) - this is expected for livecam/imported revenue`,
        severity: 'info',
        data: { count: externalRevenueWithoutPayment, gross: externalPlatformGross }
      });
    }

    // ── I) DIAGNOSTICS ─────────────────────────────────────────────────────
    const paymentsWithoutEntitlement = completedPayments.filter(p => !p.related_entity_id).length;
    const ppvWithoutAttribution = ppvPayments.filter(p => {
      return !internalLineItems.some(li => {
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
      external_line_items_count: externalLineItems.length,
      livecam_line_items_count: livecamLineItems.length,
      imported_platform_line_items_count: importedPlatformLineItems.length,
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
      },
      revenue_summary: {
        internal_payment_gross: internalPaymentGross,
        internal_attributed_gross: internalAttributedGross,
        internal_unattributed_gross: internalUnattributedGross,
        external_platform_gross: externalPlatformGross,
        total_attributed_gross: totalAttributedGross,
        total_business_revenue: totalBusinessRevenue,
        performer_share_total: totalPerformerAmount,
        studio_share_total: totalStudioAmount,
      },
      internal_breakdown: {
        gross: internalPaymentGross,
        by_type: internalPaymentByType,
        attributed_gross: internalAttributedGross,
        performer_amount: internalPerformerAmount,
        studio_amount: internalStudioAmount,
        unattributed_gross: internalUnattributedGross,
      },
      external_breakdown: {
        gross: externalPlatformGross,
        by_source: externalBySource,
        performer_amount: externalPerformerAmount,
        studio_amount: externalStudioAmount,
      },
      ppv_revenue: ppvRevenue,
      fanclub_revenue: fanclubRevenue,
      performer_shares: performerSharesList,
      studio_share: {
        total_performer_amount: totalPerformerAmount,
        total_studio_amount: totalStudioAmount,
        total_gross_attributed: totalAttributedGross,
        internal_performer_amount: internalPerformerAmount,
        internal_studio_amount: internalStudioAmount,
        internal_gross_attributed: internalAttributedGross,
        external_performer_amount: externalPerformerAmount,
        external_studio_amount: externalStudioAmount,
        external_gross_attributed: externalPlatformGross,
        performer_percentage: totalAttributedGross > 0 ? (totalPerformerAmount / totalAttributedGross * 100).toFixed(2) : 0,
        studio_percentage: totalAttributedGross > 0 ? (totalStudioAmount / totalAttributedGross * 100).toFixed(2) : 0,
      },
      sanity_warnings: sanityWarnings,
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