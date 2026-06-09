/**
 * adminPaymentsList — Admin Payment Visibility + Revenue Attribution
 * 
 * PURPOSE:
 * Admin-only endpoint to view all payments with entitlement + revenue attribution status.
 * Includes diagnostic flags for error detection.
 * 
 * SECURITY:
 * - Admin-only (role check)
 * - Includes test_mode payments with TEST badge
 * - No sensitive provider secrets exposed
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN-ONLY CHECK
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      payment_type, 
      status, 
      include_test_mode,
      limit = 100,
      skip = 0 
    } = body;

    // ── Fetch Payments ──────────────────────────────────────────────────────
    const query = {};
    if (payment_type) query.payment_type = payment_type;
    if (status) query.status = status;

    const allPayments = await base44.asServiceRole.entities.Payment.filter(query);
    
    // Sort by created_date descending
    const sortedPayments = (allPayments || [])
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(skip, skip + limit);

    // ── Enrich Payments with Entitlement + Attribution Data ─────────────────
    const enrichedPayments = await Promise.all(sortedPayments.map(async p => {
      const meta = JSON.parse(p.metadata || '{}');
      const isTestMode = meta.test_mode === true;
      
      // Fetch user
      const paymentUser = await base44.asServiceRole.entities.User.get(p.user_id).catch(() => null);
      
      // Fetch related entity details
      let relatedEntity = null;
      let relatedEntityTitle = null;
      
      if (p.related_entity_type === 'Video' && p.related_entity_id) {
        relatedEntity = await base44.asServiceRole.entities.Video.get(p.related_entity_id).catch(() => null);
        relatedEntityTitle = relatedEntity?.title;
      } else if (p.related_entity_type === 'Subscription' || p.payment_type === 'fanclub') {
        // For fanclub, fetch fanclub details
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          user_id: p.user_id,
          status: 'active',
        }).catch(() => []);
        const sub = subscriptions.find(s => s.payment_intent_id === p.id);
        if (sub) {
          relatedEntity = await base44.asServiceRole.entities.Fanclub.get(sub.fanclub_id).catch(() => null);
          relatedEntityTitle = relatedEntity?.name;
        }
      } else if (p.related_entity_type === 'GuestProductionApplication' && p.related_entity_id) {
        relatedEntity = await base44.asServiceRole.entities.GuestProductionApplication.get(p.related_entity_id).catch(() => null);
        relatedEntityTitle = relatedEntity?.applicant_name;
      }

      // ── Entitlement Status Check ─────────────────────────────────────────
      let entitlementStatus = 'not_granted';
      let entitlementDetails = null;

      if (p.payment_type === 'ppv' && p.related_entity_type === 'Video') {
        // Check if user has a completed payment for this video
        const userPayments = await base44.asServiceRole.entities.Payment.filter({
          user_id: p.user_id,
          payment_type: 'ppv',
          related_entity_type: 'Video',
          related_entity_id: p.related_entity_id,
          status: 'completed',
        }).catch(() => []);
        
        if (userPayments.length > 0) {
          entitlementStatus = 'granted';
          entitlementDetails = {
            type: 'ppv_access',
            video_id: p.related_entity_id,
            payment_count: userPayments.length,
          };
        }
      } else if (p.payment_type === 'fanclub') {
        // Check for active subscription
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          user_id: p.user_id,
          payment_type: 'fanclub',
          status: 'active',
        }).catch(() => []);
        
        if (subscriptions.length > 0) {
          entitlementStatus = 'granted';
          entitlementDetails = {
            type: 'fanclub_access',
            subscription_count: subscriptions.length,
          };
        }
      } else if (p.payment_type === 'guest_production_deposit') {
        // Check application status
        if (relatedEntity?.status && ['reviewing', 'approved', 'contract_pending'].includes(relatedEntity.status)) {
          entitlementStatus = 'granted';
          entitlementDetails = {
            type: 'guest_production_access',
            application_status: relatedEntity.status,
          };
        }
      }

      // ── Revenue Attribution Status Check ─────────────────────────────────
      let attributionStatus = 'not_attributed';
      let attributionDetails = null;
      let performerEarningLineItems = [];

      if (p.payment_type === 'ppv' && p.related_entity_type === 'Video' && relatedEntity) {
        // Find VideoPerformers for this video
        const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
          video_id: p.related_entity_id,
        }).catch(() => []);

        if (videoPerformers.length === 0) {
          attributionStatus = 'missing_video_performers';
        } else {
          // Check for PerformerEarningLineItems linked to this payment
          const periodMonth = new Date(p.created_date).toISOString().slice(0, 7);
          
          for (const vp of videoPerformers) {
            const lineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
              performer_id: vp.performer_id,
              period_month: periodMonth,
              source_type: 'ppv_purchase',
            }).catch(() => []);

            // Check if any line item references this payment
            const matchingLineItem = lineItems.find(item => {
              try {
                const itemMeta = JSON.parse(item.description || '{}');
                return itemMeta.payment_intent_id === p.id || 
                       itemMeta.payment_idempotency_key === `${meta.provider}:${meta.provider_session_id}`;
              } catch {
                return false;
              }
            });

            if (matchingLineItem) {
              const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id).catch(() => null);
              performerEarningLineItems.push({
                line_item_id: matchingLineItem.id,
                performer_id: vp.performer_id,
                performer_name: performer?.display_name || 'Unknown',
                gross_amount_usd: matchingLineItem.gross_amount_usd,
                performer_share_percent: matchingLineItem.performer_share_percent,
                performer_amount_usd: matchingLineItem.performer_amount_usd,
                studio_amount_usd: matchingLineItem.studio_amount_usd,
                status: matchingLineItem.status,
                test_mode: matchingLineItem.test_mode || false,
              });
            }
          }

          if (performerEarningLineItems.length > 0) {
            attributionStatus = 'attributed';
            attributionDetails = {
              type: 'ppv_revenue',
              video_performers_count: videoPerformers.length,
              line_items_count: performerEarningLineItems.length,
            };
          } else {
            attributionStatus = 'missing_attribution';
          }
        }
      } else if (p.payment_type === 'fanclub') {
        // Check if fanclub has performer_id
        if (relatedEntity && !relatedEntity.performer_id) {
          attributionStatus = 'global_fanclub_unattributed';
          attributionDetails = {
            type: 'fanclub_revenue',
            reason: 'Global fanclub without performer_id',
          };
        } else if (relatedEntity && relatedEntity.performer_id) {
          // Check for line items
          const periodMonth = new Date(p.created_date).toISOString().slice(0, 7);
          const lineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
            performer_id: relatedEntity.performer_id,
            period_month: periodMonth,
            source_type: 'fanclub_subscription',
          }).catch(() => []);

          const matchingLineItem = lineItems.find(item => {
            try {
              const itemMeta = JSON.parse(item.description || '{}');
              return itemMeta.payment_intent_id === p.id;
            } catch {
              return false;
            }
          });

          if (matchingLineItem) {
            const performer = await base44.asServiceRole.entities.Performer.get(relatedEntity.performer_id).catch(() => null);
            attributionStatus = 'attributed';
            attributionDetails = {
              type: 'fanclub_revenue',
              line_item_id: matchingLineItem.id,
              performer_id: relatedEntity.performer_id,
              performer_name: performer?.display_name || 'Unknown',
              gross_amount_usd: matchingLineItem.gross_amount_usd,
              performer_share_percent: matchingLineItem.performer_share_percent,
              performer_amount_usd: matchingLineItem.performer_amount_usd,
              studio_amount_usd: matchingLineItem.studio_amount_usd,
              status: matchingLineItem.status,
              test_mode: matchingLineItem.test_mode || false,
            };
          } else {
            attributionStatus = 'missing_attribution';
          }
        }
      }

      // ── Diagnostic Flags ─────────────────────────────────────────────────
      const diagnosticFlags = [];

      if (p.status === 'completed' && entitlementStatus === 'not_granted') {
        diagnosticFlags.push({
          type: 'error',
          code: 'PAYMENT_COMPLETED_NO_ENTITLEMENT',
          message: 'Payment completed but entitlement not granted',
          severity: 'high',
        });
      }

      if (entitlementStatus === 'granted' && attributionStatus === 'not_attributed' && p.payment_type !== 'guest_production_deposit') {
        diagnosticFlags.push({
          type: 'warning',
          code: 'ENTITLEMENT_GRANTED_NO_ATTRIBUTION',
          message: 'Entitlement granted but revenue attribution missing',
          severity: 'medium',
        });
      }

      if (p.payment_type === 'ppv' && !p.related_entity_id) {
        diagnosticFlags.push({
          type: 'error',
          code: 'PPV_PAYMENT_NO_VIDEO_ID',
          message: 'PPV payment missing related_entity_id',
          severity: 'high',
        });
      }

      // Check for VideoPerformers if PPV
      let videoPerformers = [];
      if (p.payment_type === 'ppv' && p.related_entity_id) {
        videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
          video_id: p.related_entity_id,
        }).catch(() => []);
        
        if (videoPerformers.length === 0) {
          diagnosticFlags.push({
            type: 'warning',
            code: 'PPV_VIDEO_NO_PERFORMERS',
            message: 'PPV video has no VideoPerformer records',
            severity: 'medium',
          });
        }
      }

      if (p.payment_type === 'fanclub' && relatedEntity && !relatedEntity.performer_id) {
        diagnosticFlags.push({
          type: 'info',
          code: 'GLOBAL_FANCLUB_UNATTRIBUTED',
          message: 'Global fanclub (no performer attribution)',
          severity: 'low',
        });
      }

      if (meta.test_mode === true) {
        diagnosticFlags.push({
          type: 'info',
          code: 'TEST_MODE_PAYMENT',
          message: 'Test mode payment',
          severity: 'info',
        });
      }

      return {
        id: p.id,
        user_id: p.user_id,
        user_email: paymentUser?.email || 'unknown',
        payment_type: p.payment_type,
        amount_usd: p.amount_usd,
        currency: p.currency || 'usd',
        status: p.status,
        provider: meta.provider || 'unknown',
        provider_session_id: meta.provider_session_id,
        invoice_id: meta.provider_payment_id,
        related_entity_type: p.related_entity_type,
        related_entity_id: p.related_entity_id,
        related_entity_title: relatedEntityTitle,
        created_date: p.created_date,
        is_test_mode: isTestMode,
        entitlement: {
          status: entitlementStatus,
          details: entitlementDetails,
        },
        revenue_attribution: {
          status: attributionStatus,
          details: attributionDetails,
          performer_line_items: performerEarningLineItems,
        },
        diagnostic_flags: diagnosticFlags,
      };
    }));

    // ── Summary Statistics ─────────────────────────────────────────────────
    const summary = {
      total_payments: enrichedPayments.length,
      by_type: {
        ppv: enrichedPayments.filter(p => p.payment_type === 'ppv').length,
        fanclub: enrichedPayments.filter(p => p.payment_type === 'fanclub').length,
        guest_production_deposit: enrichedPayments.filter(p => p.payment_type === 'guest_production_deposit').length,
      },
      by_status: {
        completed: enrichedPayments.filter(p => p.status === 'completed').length,
        pending: enrichedPayments.filter(p => p.status === 'pending').length,
        failed: enrichedPayments.filter(p => p.status === 'failed').length,
        refunded: enrichedPayments.filter(p => p.status === 'refunded').length,
      },
      test_mode_count: enrichedPayments.filter(p => p.is_test_mode).length,
      entitlement_issues: enrichedPayments.filter(p => 
        p.diagnostic_flags.some(f => f.code === 'PAYMENT_COMPLETED_NO_ENTITLEMENT')
      ).length,
      attribution_issues: enrichedPayments.filter(p => 
        p.diagnostic_flags.some(f => f.code === 'ENTITLEMENT_GRANTED_NO_ATTRIBUTION')
      ).length,
    };

    return Response.json({
      success: true,
      payments: enrichedPayments,
      summary,
      pagination: {
        limit,
        skip,
        has_more: skip + limit < allPayments.length,
      }
    });

  } catch (error) {
    console.error('adminPaymentsList error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});