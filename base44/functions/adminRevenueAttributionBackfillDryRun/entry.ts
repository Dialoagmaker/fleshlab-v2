/**
 * adminRevenueAttributionBackfillDryRun — Admin-Only Read-Only Audit
 * 
 * PURPOSE:
 * Scans internal payments without revenue attribution and reports what line items would be created.
 * Does NOT create any records - dry-run only.
 * 
 * SECURITY:
 * - Admin-only (role check)
 * - Read-only (no mutations)
 * - Excludes test_mode payments by default
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── TEST MODE DETECTION ────────────────────────────────────────────────────
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

// ── REVENUE MODEL RESOLVER ────────────────────────────────────────────────
function resolvePerformerRevenueModel(performer) {
  if (!performer) {
    return {
      model_key: 'studio_managed',
      model_label: 'Studio Managed',
      performer_share_percentage: 40,
      studio_share_percentage: 60,
      source: 'default'
    };
  }

  if (performer.revenue_model === 'established_network') {
    return {
      model_key: 'established_network',
      model_label: 'Established/Network',
      performer_share_percentage: 70,
      studio_share_percentage: 30,
      source: 'explicit_contract'
    };
  }

  if (performer.revenue_split_pct !== undefined && performer.revenue_split_pct !== null) {
    const splitPct = parseFloat(performer.revenue_split_pct);
    if (splitPct === 70) {
      return {
        model_key: 'established_network',
        model_label: 'Established/Network',
        performer_share_percentage: 70,
        studio_share_percentage: 30,
        source: 'performer_profile'
      };
    }
    return {
      model_key: 'studio_managed',
      model_label: 'Studio Managed',
      performer_share_percentage: splitPct,
      studio_share_percentage: 100 - splitPct,
      source: 'performer_profile'
    };
  }

  return {
    model_key: 'studio_managed',
    model_label: 'Studio Managed',
    performer_share_percentage: 40,
    studio_share_percentage: 60,
    source: 'default'
  };
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN-ONLY CHECK
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required', success: false }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { include_test_mode = false, payment_id = null } = body;

    console.log('[adminRevenueAttributionBackfillDryRun] Request:', {
      adminUser: user.email,
      include_test_mode,
      payment_id,
    });

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [allPayments, allLineItems, allPerformers, allVideos, allVideoPerformers, allSubscriptions, allFanclubs] = await Promise.all([
      base44.asServiceRole.entities.Payment.filter({ status: 'completed' }),
      base44.asServiceRole.entities.PerformerEarningLineItem.filter({}),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.Video.list(),
      base44.asServiceRole.entities.VideoPerformer.filter({}),
      base44.asServiceRole.entities.Subscription.filter({}),
      base44.asServiceRole.entities.Fanclub.list(),
    ]);

    // Build lookup maps
    const performerMap = {};
    allPerformers.forEach(p => { performerMap[p.id] = p; });
    
    const videoMap = {};
    allVideos.forEach(v => { videoMap[v.id] = v; });
    
    const fanclubMap = {};
    allFanclubs.forEach(f => { fanclubMap[f.id] = f; });

    // Filter payments
    const payments = allPayments.filter(p => {
      if (include_test_mode) return true;
      return !isTestPayment(p);
    });

    // Find payments without attribution
    const unattributedPayments = payments.filter(p => {
      // If specific payment_id requested, only check that one
      if (payment_id && p.id !== payment_id) return false;
      
      // Check if any line item references this payment
      return !allLineItems.some(li => {
        try {
          const desc = JSON.parse(li.description || '{}');
          return desc.payment_intent_id === p.id || desc.payment_reference === p.id;
        } catch {
          return false;
        }
      });
    });

    console.log(`[adminRevenueAttributionBackfillDryRun] Found ${unattributedPayments.length} unattributed payments`);

    // ── Analyze each unattributed payment ─────────────────────────────────
    const backfillPlan = [];
    const skippedPayments = [];
    const errors = [];

    for (const payment of unattributedPayments) {
      try {
        const metadata = (() => {
          try {
            return typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
          } catch {
            return null;
          }
        })();

        const planEntry = {
          payment_id: payment.id,
          payment_type: payment.payment_type,
          amount: payment.amount_usd,
          currency: payment.currency || 'usd',
          user_id: payment.user_id,
          created_date: payment.created_date,
          related_entity_id: payment.related_entity_id,
          related_entity_type: payment.related_entity_type,
          provider: payment.provider,
          provider_session_id: payment.provider_session_id,
          would_create_line_items: [],
          skip_reason: null,
          error: null,
        };

        // ── PPV Payments ───────────────────────────────────────────────────
        if (payment.payment_type === 'ppv' && payment.related_entity_id) {
          const video = videoMap[payment.related_entity_id];
          
          if (!video) {
            planEntry.skip_reason = 'VIDEO_NOT_FOUND';
            planEntry.error = `Video ${payment.related_entity_id} not found`;
            skippedPayments.push(planEntry);
            continue;
          }

          // Get performers for this video
          const videoPerformers = allVideoPerformers.filter(vp => vp.video_id === payment.related_entity_id);
          
          if (videoPerformers.length === 0) {
            planEntry.skip_reason = 'NO_PERFORMERS_MAPPED';
            planEntry.error = `Video ${video.title} has no VideoPerformer records`;
            skippedPayments.push(planEntry);
            continue;
          }

          // Calculate split per performer
          const performerGross = payment.amount_usd / videoPerformers.length;

          for (const vp of videoPerformers) {
            const performer = performerMap[vp.performer_id];
            
            if (!performer) {
              errors.push({
                payment_id: payment.id,
                performer_id: vp.performer_id,
                error: 'Performer not found',
              });
              continue;
            }

            if (performer.status === 'inactive') {
              errors.push({
                payment_id: payment.id,
                performer_id: vp.performer_id,
                error: 'Performer is inactive',
              });
              continue;
            }

            const revenueModel = resolvePerformerRevenueModel(performer);
            const performerAmount = performerGross * revenueModel.performer_share_percentage / 100;
            const studioAmount = performerGross - performerAmount;

            planEntry.would_create_line_items.push({
              performer_id: performer.id,
              performer_name: performer.display_name,
              source_type: 'ppv_purchase',
              source_platform: 'fleshlab',
              source_reference_id: payment.related_entity_id,
              video_title: video.title,
              gross_amount_usd: parseFloat(performerGross.toFixed(2)),
              performer_share_percent: revenueModel.performer_share_percentage,
              performer_amount_usd: parseFloat(performerAmount.toFixed(2)),
              studio_amount_usd: parseFloat(studioAmount.toFixed(2)),
              period_month: new Date().toISOString().slice(0, 7),
              description: `PPV purchase - ${video.title} - ${performer.display_name}`,
              idempotency_key: `${payment.provider}:${payment.provider_session_id}`,
            });
          }

          if (planEntry.would_create_line_items.length === 0) {
            planEntry.skip_reason = 'NO_VALID_PERFORMERS';
            planEntry.error = 'No valid performers found for this video';
            skippedPayments.push(planEntry);
            continue;
          }

        // ── Fanclub Payments ──────────────────────────────────────────────
        } else if (payment.payment_type === 'fanclub' && payment.related_entity_id) {
          const subscription = allSubscriptions.find(s => s.id === payment.related_entity_id);
          
          if (!subscription) {
            planEntry.skip_reason = 'SUBSCRIPTION_NOT_FOUND';
            planEntry.error = `Subscription ${payment.related_entity_id} not found`;
            skippedPayments.push(planEntry);
            continue;
          }

          const fanclub = fanclubMap[subscription.fanclub_id];
          
          if (!fanclub) {
            planEntry.skip_reason = 'FANCLUB_NOT_FOUND';
            planEntry.error = `Fanclub ${subscription.fanclub_id} not found`;
            skippedPayments.push(planEntry);
            continue;
          }

          if (!fanclub.performer_id) {
            planEntry.skip_reason = 'GLOBAL_FANCLUB_NO_PERFORMER';
            planEntry.error = 'Fanclub has no performer_id (global fanclub)';
            skippedPayments.push(planEntry);
            continue;
          }

          const performer = performerMap[fanclub.performer_id];
          
          if (!performer) {
            planEntry.skip_reason = 'PERFORMER_NOT_FOUND';
            planEntry.error = `Performer ${fanclub.performer_id} not found`;
            skippedPayments.push(planEntry);
            continue;
          }

          if (performer.status === 'inactive') {
            planEntry.skip_reason = 'PERFORMER_INACTIVE';
            planEntry.error = 'Performer is inactive';
            skippedPayments.push(planEntry);
            continue;
          }

          const revenueModel = resolvePerformerRevenueModel(performer);
          const performerAmount = payment.amount_usd * revenueModel.performer_share_percentage / 100;
          const studioAmount = payment.amount_usd - performerAmount;

          planEntry.would_create_line_items.push({
            performer_id: performer.id,
            performer_name: performer.display_name,
            source_type: 'fanclub_subscription',
            source_platform: 'fleshlab',
            source_reference_id: subscription.id,
            fanclub_name: fanclub.name,
            gross_amount_usd: parseFloat(payment.amount_usd.toFixed(2)),
            performer_share_percent: revenueModel.performer_share_percentage,
            performer_amount_usd: parseFloat(performerAmount.toFixed(2)),
            studio_amount_usd: parseFloat(studioAmount.toFixed(2)),
            period_month: new Date(subscription.created_date).toISOString().slice(0, 7),
            description: `Fanclub subscription - ${fanclub.name} - ${performer.display_name}`,
            idempotency_key: `${payment.provider}:${payment.provider_session_id}`,
          });

        // ── Guest Production Deposits ─────────────────────────────────────
        } else if (payment.payment_type === 'guest_production_deposit') {
          planEntry.skip_reason = 'GUEST_PRODUCTION_NO_AUTO_ATTRIBUTION';
          planEntry.error = 'Guest production deposits require manual attribution by admin';
          skippedPayments.push(planEntry);
          continue;

        // ── Unknown Payment Type ──────────────────────────────────────────
        } else {
          planEntry.skip_reason = 'UNKNOWN_PAYMENT_TYPE_OR_MISSING_ENTITY';
          planEntry.error = `Payment type: ${payment.payment_type || 'unknown'}, Related entity: ${payment.related_entity_id || 'none'}`;
          skippedPayments.push(planEntry);
          continue;
        }

        backfillPlan.push(planEntry);

      } catch (err) {
        errors.push({
          payment_id: payment.id,
          error: err.message,
        });
      }
    }

    // ── Calculate totals ──────────────────────────────────────────────────
    const summary = {
      total_unattributed_payments: unattributedPayments.length,
      total_payments_analyzed: backfillPlan.length + skippedPayments.length,
      total_line_items_would_create: backfillPlan.reduce((sum, p) => sum + p.would_create_line_items.length, 0),
      total_gross_to_attribute: backfillPlan.reduce((sum, p) => sum + p.amount, 0),
      total_performer_amount: backfillPlan.reduce((sum, p) => {
        return sum + p.would_create_line_items.reduce((s, li) => s + li.performer_amount_usd, 0);
      }, 0),
      total_studio_amount: backfillPlan.reduce((sum, p) => {
        return sum + p.would_create_line_items.reduce((s, li) => s + li.studio_amount_usd, 0);
      }, 0),
      skipped_count: skippedPayments.length,
      error_count: errors.length,
    };

    // ── RESPONSE ───────────────────────────────────────────────────────────
    return Response.json({
      success: true,
      dry_run: true,
      no_records_created: true,
      summary,
      backfill_plan: backfillPlan,
      skipped_payments: skippedPayments,
      errors,
      metadata: {
        include_test_mode,
        payment_id_filter: payment_id,
        analyzed_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[adminRevenueAttributionBackfillDryRun] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false,
    }, { status: 500 });
  }
});