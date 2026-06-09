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
 * - source_type: Filter by source type (optional)
 * - include_test_mode: Include test records (default: false)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN-ONLY CHECK
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required', success: false }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { from, to, source_type, include_test_mode = false } = body;

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
      source_type: source_type || 'all'
    });

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [allPayments, allSubscriptions, allLineItems, allPerformers, allVideos, allPaymentIntents] = await Promise.all([
      base44.asServiceRole.entities.Payment.filter({}),
      base44.asServiceRole.entities.Subscription.filter({}),
      base44.asServiceRole.entities.PerformerEarningLineItem.filter({}),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.Video.list(),
      base44.asServiceRole.entities.PaymentIntent.filter({}),
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

    // Filter by date range and test_mode
    const isInDateRange = (record) => {
      const recordDate = new Date(record.created_date || record.period_month + '-01');
      return recordDate >= fromDate && recordDate <= toDate;
    };

    const isNotTest = (record) => {
      if (include_test_mode) return true;
      // Check test_mode field
      if (record.test_mode === true) return false;
      // Check metadata for test_mode
      try {
        if (record.metadata) {
          const meta = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
          if (meta.test_mode === true) return false;
        }
      } catch {}
      // Check description for TEST
      if (record.description && record.description.includes('TEST')) return false;
      // Check notes for TEST
      if (record.notes && record.notes.includes('TEST')) return false;
      return true;
    };

    // Filter payments
    const payments = allPayments.filter(p => isInDateRange(p) && isNotTest(p));
    const testPayments = allPayments.filter(p => isInDateRange(p) && !isNotTest(p));

    // Filter subscriptions
    const subscriptions = allSubscriptions.filter(s => isInDateRange(s) && isNotTest(s));

    // Filter line items
    const lineItems = allLineItems.filter(li => isInDateRange(li) && isNotTest(li));
    const testLineItems = allLineItems.filter(li => isInDateRange(li) && !isNotTest(li));

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

    const studioShare = {
      total_gross_attributed: totalGrossAttributed,
      total_performer_amount: totalPerformerAmount,
      total_studio_amount: totalStudioAmount,
      unattributed_gross: unattributedGross,
      performer_percentage: totalGrossAttributed > 0 ? (totalPerformerAmount / totalGrossAttributed * 100).toFixed(2) : 0,
      studio_percentage: totalGrossAttributed > 0 ? (totalStudioAmount / totalGrossAttributed * 100).toFixed(2) : 0,
    };

    // ── F) DIAGNOSTICS ─────────────────────────────────────────────────────
    // Completed payments without entitlement (check Payment entity for related data)
    const paymentsWithoutEntitlement = completedPayments.filter(p => {
      // Simple heuristic: if no related_entity_id, likely missing entitlement
      return !p.related_entity_id;
    }).length;

    // PPV payments without revenue attribution
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

    // PPV payments missing related_entity_id
    const ppvMissingVideoId = ppvPayments.filter(p => !p.related_entity_id).length;

    // Check for videos without VideoPerformer (need to fetch VideoPerformer entities)
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({});
    const videosWithPpvPayments = [...new Set(ppvPayments.map(p => p.related_entity_id).filter(Boolean))];
    const videosWithoutPerformers = videosWithPpvPayments.filter(vid => {
      return !videoPerformers.some(vp => vp.video_id === vid);
    }).length;

    // Fanclub global/unattributed count
    const fanclubUnattributedCount = fanclubPayments.filter(p => {
      // Check if subscription has no performer link
      return !p.related_entity_id;
    }).length;

    // Test mode records excluded
    const testRecordsExcluded = testPayments.length + testLineItems.length;

    // Duplicate webhook count (if PaymentWebhookEvent exists)
    let duplicateWebhookCount = 0;
    try {
      const webhookEvents = await base44.asServiceRole.entities.PaymentWebhookEvent.filter({});
      duplicateWebhookCount = webhookEvents.filter(e => e.event_type === 'payment.completed' && e.processed === false).length;
    } catch {
      // PaymentWebhookEvent entity may not exist
    }

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