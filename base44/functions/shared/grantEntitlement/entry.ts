/**
 * grantEntitlement — Shared Helper Module
 *
 * Grants user entitlements after verified payment completion.
 * Creates PerformerEarningLineItem records for revenue attribution.
 * Imported by paymentWebhook.js and simulatePaymentWebhook.js
 *
 * SECURITY:
 *   - ONLY called after payment.completed status confirmed
 *   - ONLY called after signature verification (production) or admin auth (test)
 *   - Creates audit trail in Payment/Subscription/PerformerEarningLineItem records
 *   - Idempotent: safe to call multiple times with same intent
 */

/**
 * resolvePerformerRevenueModel - Inline Helper
 * Determines the correct revenue share percentage for a performer.
 */
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

/**
 * Create PerformerEarningLineItem with idempotency check
 */
async function createEarningLineItem(base44, params) {
  const {
    performer_id,
    gross_amount_usd,
    performer_share_percent,
    source_type,
    source_platform,
    payment_idempotency_key,
    video_id,
    subscription_id,
    period_month,
    description,
    payment_intent_id,
    provider,
  } = params;

  // IDEMPOTENCY CHECK: Look for existing line item
  const existingItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
    performer_id,
    source_type,
    period_month,
  });

  const existingItem = existingItems.find(item => {
    try {
      const meta = JSON.parse(item.description || '{}');
      return meta.payment_idempotency_key === payment_idempotency_key ||
             meta.payment_intent_id === payment_intent_id;
    } catch {
      return false;
    }
  });

  if (existingItem) {
    console.log('[grantEntitlement] PerformerEarningLineItem already exists — skipping (idempotent)', {
      performer_id,
      source_type,
      existingItemId: existingItem.id,
    });
    return { duplicate: true, item: existingItem };
  }

  // Calculate amounts
  const performer_amount_usd = gross_amount_usd * performer_share_percent / 100;
  const studio_amount_usd = gross_amount_usd - performer_amount_usd;

  // Create line item
  const lineItem = await base44.asServiceRole.entities.PerformerEarningLineItem.create({
    performer_id,
    performer_earning_id: null,
    period_month,
    source_type,
    source_platform,
    source_reference_id: video_id || subscription_id,
    description: JSON.stringify({
      payment_idempotency_key,
      payment_intent_id,
      provider,
      ...(description ? { note: description } : {}),
    }),
    gross_amount_usd,
    performer_share_percent,
    performer_amount_usd,
    studio_amount_usd,
    currency: 'usd',
    exchange_rate: 1,
    status: 'approved',
    notes: `Auto-created from ${source_type} payment via webhook`,
  });

  console.log('[grantEntitlement] PerformerEarningLineItem created:', {
    performer_id,
    source_type,
    gross: gross_amount_usd,
    performer_share: performer_share_percent,
    performer_amount: performer_amount_usd,
    studio_amount: studio_amount_usd,
    lineItemId: lineItem.id,
  });

  return { duplicate: false, item: lineItem };
}

/**
 * Grant entitlements based on payment type
 */
export async function grantEntitlement(base44, intent) {
  const providerPaymentKey = `${intent.provider}:${intent.provider_session_id}`;
  const periodMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  if (intent.payment_type === 'ppv') {
    // ── CRITICAL: Payment Idempotency Check BEFORE create ─────────────────
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({
      user_id: intent.user_id,
      payment_type: 'ppv',
      status: 'completed',
    });
    
    const existingPayment = existingPayments.find(p => {
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.provider_session_id === intent.provider_session_id ||
               meta.provider_payment_id === intent.provider_session_id ||
               meta.payment_intent_id === intent.id;
      } catch { return false; }
    });
    
    if (existingPayment) {
      console.log('[grantEntitlement] Payment already exists — skipping (idempotent)', {
        userId: intent.user_id,
        videoId: intent.video_id,
        provider_session_id: intent.provider_session_id,
        existingPaymentId: existingPayment.id,
      });
      return { ok: true, duplicate: true, entitlement_type: 'ppv', payment_id: existingPayment.id };
    }
    
    // Create Payment record
    const payment = await base44.asServiceRole.entities.Payment.create({
      user_id:             intent.user_id,
      amount_usd:          intent.amount,
      currency:            intent.currency || 'usd',
      payment_type:        'ppv',
      status:              'completed',
      related_entity_type: 'Video',
      related_entity_id:   intent.video_id,
      metadata: JSON.stringify({
        provider:            intent.provider,
        provider_session_id: intent.provider_session_id,
        provider_payment_id: intent.provider_session_id,
        price_tier:          intent.price_tier,
        payment_intent_id:   intent.id,
      }),
    });
    
    console.log('[grantEntitlement] PPV entitlement granted:', { userId: intent.user_id, videoId: intent.video_id, paymentId: payment.id });
    
    // REVENUE ATTRIBUTION: Find performers for this video
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
      video_id: intent.video_id,
    });
    
    if (videoPerformers.length === 0) {
      console.warn('[grantEntitlement] PPV payment has no VideoPerformer records — skipping revenue attribution', {
        videoId: intent.video_id,
        paymentId: payment.id,
      });
      return { ok: true, duplicate: false, entitlement_type: 'ppv', payment_id: payment.id, revenue_attribution: 'no_performers' };
    }
    
    // Get performer details and calculate splits
    const revenueAttributions = [];
    for (const vp of videoPerformers) {
      const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id);
      if (!performer || performer.status === 'inactive') {
        console.warn('[grantEntitlement] Performer not found or inactive — skipping', {
          performer_id: vp.performer_id,
          videoId: intent.video_id,
        });
        continue;
      }
      
      // Resolve revenue model (40/60 or 70/30)
      const revenueModel = resolvePerformerRevenueModel(performer);
      
      // Calculate performer's share of the payment (split equally among performers)
      const performerGross = intent.amount / videoPerformers.length;
      
      // Create earning line item
      const lineItemResult = await createEarningLineItem(base44, {
        performer_id: vp.performer_id,
        gross_amount_usd: performerGross,
        performer_share_percent: revenueModel.performer_share_percentage,
        source_type: 'ppv_purchase',
        source_platform: 'fleshlab',
        payment_idempotency_key: providerPaymentKey,
        payment_intent_id: intent.id,
        video_id: intent.video_id,
        period_month: periodMonth,
        description: `PPV purchase - ${performer.display_name}`,
        provider: intent.provider,
      });
      
      revenueAttributions.push({
        performer_id: vp.performer_id,
        performer_name: performer.display_name,
        gross: performerGross,
        performer_share_percent: revenueModel.performer_share_percentage,
        line_item_id: lineItemResult.item?.id,
        duplicate: lineItemResult.duplicate,
      });
    }
    
    return {
      ok: true,
      duplicate: false,
      entitlement_type: 'ppv',
      payment_id: payment.id,
      revenue_attribution: revenueAttributions,
    };

  } else if (intent.payment_type === 'fanclub') {
    // ── CRITICAL: Subscription Idempotency Check BEFORE create ────────────
    const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: intent.user_id,
      fanclub_id: intent.plan_id,
      status: 'active',
    });
    
    const existingSubscription = existingSubscriptions.find(s => {
      return s.stripe_subscription_id === `nowpayments_${intent.provider_session_id}` ||
             s.payment_intent_id === intent.id;
    });
    
    if (existingSubscription) {
      console.log('[grantEntitlement] Subscription already exists — skipping (idempotent)', {
        userId: intent.user_id,
        planId: intent.plan_id,
        existingSubscriptionId: existingSubscription.id,
      });
      return { ok: true, duplicate: true, entitlement_type: 'fanclub', subscription_id: existingSubscription.id };
    }
    
    const ACCESS_PERIODS = {
      fanclub_monthly:  1,
      premium_monthly:  1,
      fanclub_3mo:      3,
      fanclub_6mo:      6,
      fanclub_annual:   12,
    };
    const months = ACCESS_PERIODS[intent.plan_id] || 1;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id:                intent.user_id,
      fanclub_id:             intent.plan_id,
      status:                 'active',
      current_period_start:   new Date().toISOString(),
      current_period_end:     periodEnd.toISOString(),
      amount_usd:             intent.amount,
      stripe_subscription_id: `nowpayments_${intent.provider_session_id}`,
      payment_intent_id:      intent.id,
      provider:               'nowpayments',
    });
    
    console.log('[grantEntitlement] Fanclub access pass granted:', { userId: intent.user_id, planId: intent.plan_id, months, subscriptionId: subscription.id });
    
    // REVENUE ATTRIBUTION: Check if fanclub is performer-specific
    const fanclub = await base44.asServiceRole.entities.Fanclub.get(intent.plan_id);
    
    if (!fanclub) {
      console.warn('[grantEntitlement] Fanclub not found — skipping revenue attribution', {
        planId: intent.plan_id,
        subscriptionId: subscription.id,
      });
      return { ok: true, duplicate: false, entitlement_type: 'fanclub', subscription_id: subscription.id, revenue_attribution: 'fanclub_not_found' };
    }
    
    // Check if fanclub has performer_id (performer-specific fanclub)
    if (!fanclub.performer_id) {
      console.log('[grantEntitlement] Fanclub is global (no performer_id) — marking as unattributed revenue', {
        fanclubId: fanclub.id,
        fanclubName: fanclub.name,
      });
      return {
        ok: true,
        duplicate: false,
        entitlement_type: 'fanclub',
        subscription_id: subscription.id,
        revenue_attribution: 'global_fanclub_unattributed',
        fanclub_name: fanclub.name,
      };
    }
    
    // Performer-specific fanclub - create earning line item
    const performer = await base44.asServiceRole.entities.Performer.get(fanclub.performer_id);
    
    if (!performer || performer.status === 'inactive') {
      console.warn('[grantEntitlement] Performer not found or inactive for fanclub — skipping revenue attribution', {
        performer_id: fanclub.performer_id,
        fanclubId: fanclub.id,
      });
      return { ok: true, duplicate: false, entitlement_type: 'fanclub', subscription_id: subscription.id, revenue_attribution: 'performer_not_found' };
    }
    
    // Resolve revenue model
    const revenueModel = resolvePerformerRevenueModel(performer);
    
    // Create earning line item for fanclub subscription
    const lineItemResult = await createEarningLineItem(base44, {
      performer_id: fanclub.performer_id,
      gross_amount_usd: intent.amount,
      performer_share_percent: revenueModel.performer_share_percentage,
      source_type: 'fanclub_subscription',
      source_platform: 'fleshlab',
      payment_idempotency_key: providerPaymentKey,
      payment_intent_id: intent.id,
      subscription_id: subscription.id,
      period_month: periodMonth,
      description: `Fanclub subscription - ${fanclub.name} - ${performer.display_name}`,
      provider: intent.provider,
    });
    
    return {
      ok: true,
      duplicate: false,
      entitlement_type: 'fanclub',
      subscription_id: subscription.id,
      revenue_attribution: {
        performer_id: fanclub.performer_id,
        performer_name: performer.display_name,
        fanclub_name: fanclub.name,
        gross: intent.amount,
        performer_share_percent: revenueModel.performer_share_percentage,
        line_item_id: lineItemResult.item?.id,
        duplicate: lineItemResult.duplicate,
      },
    };

  } else if (intent.payment_type === 'guest_production_deposit') {
    if (!intent.application_id) {
      console.warn('[grantEntitlement] Guest Production deposit missing application_id');
      return { ok: false, error: 'missing_application_id' };
    }
    
    await base44.asServiceRole.entities.GuestProductionApplication.update(intent.application_id, {
      status: 'reviewing',
      admin_notes: `Deposit payment confirmed. Provider: ${intent.provider}, Session: ${intent.provider_session_id}`,
    });

    const payment = await base44.asServiceRole.entities.Payment.create({
      user_id:             intent.user_id,
      amount_usd:          intent.amount,
      currency:            intent.currency || 'usd',
      payment_type:        'ppv',
      status:              'completed',
      related_entity_type: 'GuestProductionApplication',
      related_entity_id:   intent.application_id,
      metadata: JSON.stringify({
        provider:            intent.provider,
        provider_session_id: intent.provider_session_id,
        provider_payment_id: intent.provider_session_id,
        payment_type:        'guest_production_deposit',
        payment_intent_id:   intent.id,
      }),
    });
    
    console.log('[grantEntitlement] Guest Production deposit marked paid:', { userId: intent.user_id, appId: intent.application_id, paymentId: payment.id });
    
    return {
      ok: true,
      duplicate: false,
      entitlement_type: 'guest_production',
      payment_id: payment.id,
      revenue_attribution: 'admin_attributed_later',
    };
  }
  
  return { ok: false, error: 'unknown_payment_type' };
}