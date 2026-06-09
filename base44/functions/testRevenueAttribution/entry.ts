/**
 * testRevenueAttribution — Admin-Only Revenue Attribution Runtime Test
 * 
 * PURPOSE:
 * Tests the complete Revenue Attribution flow WITHOUT real payments.
 * Creates controlled test data with metadata.test_mode = true.
 * 
 * SECURITY:
 * - Admin-only (role check)
 * - Creates test data marked as test_mode
 * - Does NOT affect real payout closeout
 * 
 * USAGE:
 * POST with testScenario:
 * - "ppv_single_performer" - Test PPV with 1 performer
 * - "ppv_idempotency" - Run same payment twice
 * - "fanclub_performer" - Test performer-specific fanclub
 * - "fanclub_global" - Test global fanclub (no performer)
 * - "failed_payment" - Test failed payment (no entitlement)
 * 
 * RETURNS:
 * Detailed test results with entity IDs for verification/cleanup
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Revenue Model Resolver (inline) ──────────────────────────────────────────
function resolvePerformerRevenueModel(performer) {
  if (!performer) return { model_key: 'studio_managed', model_label: 'Studio Managed', performer_share_percentage: 40, studio_share_percentage: 60, source: 'default' };
  if (performer.revenue_model === 'established_network') return { model_key: 'established_network', model_label: 'Established/Network', performer_share_percentage: 70, studio_share_percentage: 30, source: 'explicit_contract' };
  if (performer.revenue_split_pct !== undefined && performer.revenue_split_pct !== null) {
    const splitPct = parseFloat(performer.revenue_split_pct);
    if (splitPct === 70) return { model_key: 'established_network', model_label: 'Established/Network', performer_share_percentage: 70, studio_share_percentage: 30, source: 'performer_profile' };
    return { model_key: 'studio_managed', model_label: 'Studio Managed', performer_share_percentage: splitPct, studio_share_percentage: 100 - splitPct, source: 'performer_profile' };
  }
  return { model_key: 'studio_managed', model_label: 'Studio Managed', performer_share_percentage: 40, studio_share_percentage: 60, source: 'default' };
}

// ── Create PerformerEarningLineItem with idempotency ─────────────────────────
async function createPerformerEarningLineItem(base44, params) {
  const { performer_id, gross_amount_usd, performer_share_percent, source_type, source_platform, payment_idempotency_key, video_id, subscription_id, period_month, description, payment_intent_id, provider } = params;
  
  // IDEMPOTENCY CHECK
  const existingItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({ performer_id, source_type, period_month });
  const existingItem = existingItems.find(item => {
    try {
      const meta = JSON.parse(item.description || '{}');
      return meta.payment_idempotency_key === payment_idempotency_key || meta.payment_intent_id === payment_intent_id;
    } catch { return false; }
  });
  
  if (existingItem) {
    console.log('[testRevenueAttribution] PerformerEarningLineItem already exists — skipping (idempotent)', { performer_id, source_type, existingItemId: existingItem.id });
    return { duplicate: true, item: existingItem };
  }
  
  const performer_amount_usd = gross_amount_usd * performer_share_percent / 100;
  const studio_amount_usd = gross_amount_usd - performer_amount_usd;

  
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
    notes: `TEST - Auto-created from ${source_type} payment via revenue attribution test`,
    test_mode: true, // EXPLICITLY SET test_mode field
  });
  
  console.log('[testRevenueAttribution] PerformerEarningLineItem created:', { 
    performer_id, source_type, gross: gross_amount_usd, 
    performer_share: performer_share_percent,
    performer_amount: performer_amount_usd,
    studio_amount: studio_amount_usd,
    lineItemId: lineItem.id 
  });
  return { duplicate: false, item: lineItem };
}

// ── Grant entitlements with Revenue Attribution ──────────────────────────────
async function grantEntitlement(base44, intent, testMode = true) {
  const providerPaymentKey = `${intent.provider}:${intent.provider_session_id}`;
  const periodMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  if (intent.payment_type === 'ppv') {
    // ── CRITICAL: Idempotency Check BEFORE creating Payment ─────────────────
    // Check if Payment already exists for this provider_session_id
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({
      user_id: intent.user_id,
      payment_type: 'ppv',
      status: 'completed',
    });
    
    // Search through metadata for matching provider_session_id
    const existingPayment = existingPayments.find(p => {
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.provider_session_id === intent.provider_session_id ||
               meta.provider_payment_id === intent.provider_session_id ||
               meta.payment_intent_id === intent.id;
      } catch {
        return false;
      }
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
      user_id: intent.user_id,
      amount_usd: intent.amount,
      currency: intent.currency || 'usd',
      payment_type: 'ppv',
      status: 'completed',
      related_entity_type: 'Video',
      related_entity_id: intent.video_id,
      metadata: JSON.stringify({
        provider: intent.provider,
        provider_session_id: intent.provider_session_id,
        provider_payment_id: intent.provider_session_id,
        price_tier: intent.price_tier,
        payment_intent_id: intent.id,
        test_mode: testMode,
      }),
    });
    
    console.log('[testRevenueAttribution] PPV entitlement granted:', { userId: intent.user_id, videoId: intent.video_id, paymentId: payment.id });
    
    // REVENUE ATTRIBUTION: Find performers for this video
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({ video_id: intent.video_id });
    
    if (videoPerformers.length === 0) {
      console.warn('[testRevenueAttribution] PPV payment has no VideoPerformer records — skipping revenue attribution', { videoId: intent.video_id, paymentId: payment.id });
      return { ok: true, duplicate: false, entitlement_type: 'ppv', payment_id: payment.id, revenue_attribution: 'no_performers' };
    }
    
    // Create earning line items for each performer
    const revenueAttributions = [];
    for (const vp of videoPerformers) {
      const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id);
      if (!performer || performer.status === 'inactive') {
        console.warn('[testRevenueAttribution] Performer not found or inactive — skipping', { performer_id: vp.performer_id, videoId: intent.video_id });
        continue;
      }
      
      const revenueModel = resolvePerformerRevenueModel(performer);
      const performerGross = intent.amount / videoPerformers.length;
      
      const lineItemResult = await createPerformerEarningLineItem(base44, {
        performer_id: vp.performer_id,
        gross_amount_usd: performerGross,
        performer_share_percent: revenueModel.performer_share_percentage,
        source_type: 'ppv_purchase',
        source_platform: 'fleshlab',
        payment_idempotency_key: providerPaymentKey,
        payment_intent_id: intent.id,
        video_id: intent.video_id,
        period_month: periodMonth,
        description: `PPV purchase (TEST) - ${performer.display_name}`,
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
    // IDEMPOTENCY CHECK: Check for existing subscription
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
      console.log('[testRevenueAttribution] Fanclub subscription already exists — skipping (idempotent)', { 
        userId: intent.user_id, 
        planId: intent.plan_id, 
        existingSubscriptionId: existingSubscription.id 
      });
      return { ok: true, duplicate: true, entitlement_type: 'fanclub', subscription_id: existingSubscription.id };
    }
    
    const ACCESS_PERIODS = { fanclub_monthly: 1, premium_monthly: 1, fanclub_3mo: 3, fanclub_6mo: 6, fanclub_annual: 12 };
    const months = ACCESS_PERIODS[intent.plan_id] || 1;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: intent.user_id,
      fanclub_id: intent.plan_id,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      amount_usd: intent.amount,
      stripe_subscription_id: `nowpayments_${intent.provider_session_id}`,
      payment_intent_id: intent.id,
      provider: 'nowpayments',
    });
    
    console.log('[testRevenueAttribution] Fanclub access pass granted:', { userId: intent.user_id, planId: intent.plan_id, months, subscriptionId: subscription.id });
    
    // REVENUE ATTRIBUTION: Check if fanclub is performer-specific
    const fanclub = await base44.asServiceRole.entities.Fanclub.get(intent.plan_id);
    
    if (!fanclub) {
      console.warn('[testRevenueAttribution] Fanclub not found — skipping revenue attribution', { planId: intent.plan_id, subscriptionId: subscription.id });
      return { ok: true, duplicate: false, entitlement_type: 'fanclub', subscription_id: subscription.id, revenue_attribution: 'fanclub_not_found' };
    }
    
    if (!fanclub.performer_id) {
      console.log('[testRevenueAttribution] Fanclub is global (no performer_id) — marking as unattributed revenue', { fanclubId: fanclub.id, fanclubName: fanclub.name });
      return {
        ok: true,
        duplicate: false,
        entitlement_type: 'fanclub',
        subscription_id: subscription.id,
        revenue_attribution: 'global_fanclub_unattributed',
        fanclub_name: fanclub.name,
      };
    }
    
    const performer = await base44.asServiceRole.entities.Performer.get(fanclub.performer_id);
    if (!performer || performer.status === 'inactive') {
      console.warn('[testRevenueAttribution] Performer not found or inactive for fanclub — skipping revenue attribution', { performer_id: fanclub.performer_id, fanclubId: fanclub.id });
      return { ok: true, duplicate: false, entitlement_type: 'fanclub', subscription_id: subscription.id, revenue_attribution: 'performer_not_found' };
    }
    
    const revenueModel = resolvePerformerRevenueModel(performer);
    
    const lineItemResult = await createPerformerEarningLineItem(base44, {
      performer_id: fanclub.performer_id,
      gross_amount_usd: intent.amount,
      performer_share_percent: revenueModel.performer_share_percentage,
      source_type: 'fanclub_subscription',
      source_platform: 'fleshlab',
      payment_idempotency_key: providerPaymentKey,
      payment_intent_id: intent.id,
      subscription_id: subscription.id,
      period_month: periodMonth,
      description: `Fanclub subscription (TEST) - ${fanclub.name} - ${performer.display_name}`,
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
      console.warn('[testRevenueAttribution] Guest Production deposit missing application_id');
      return { ok: false, error: 'missing_application_id' };
    }
    
    await base44.asServiceRole.entities.GuestProductionApplication.update(intent.application_id, {
      status: 'reviewing',
      admin_notes: `Deposit payment confirmed (TEST). Provider: ${intent.provider}, Session: ${intent.provider_session_id}`,
    });

    const payment = await base44.asServiceRole.entities.Payment.create({
      user_id: intent.user_id,
      amount_usd: intent.amount,
      currency: intent.currency || 'usd',
      payment_type: 'ppv',
      status: 'completed',
      related_entity_type: 'GuestProductionApplication',
      related_entity_id: intent.application_id,
      metadata: JSON.stringify({
        provider: intent.provider,
        provider_session_id: intent.provider_session_id,
        provider_payment_id: intent.provider_session_id,
        payment_type: 'guest_production_deposit',
        payment_intent_id: intent.id,
        test_mode: true,
      }),
    });
    
    console.log('[testRevenueAttribution] Guest Production deposit marked paid:', { userId: intent.user_id, appId: intent.application_id, paymentId: payment.id });
    
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

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN-ONLY CHECK
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required', success: false }, { status: 403 });
    }

    const body = await req.json();
    const { testScenario, videoId, performerId, planId, userId, amount } = body;

    if (!testScenario) {
      return Response.json({ 
        error: 'testScenario required',
        available_scenarios: [
          'ppv_single_performer',
          'ppv_idempotency',
          'fanclub_performer',
          'fanclub_global',
          'failed_payment',
        ],
      }, { status: 400 });
    }

    console.log('[testRevenueAttribution] Starting test:', { testScenario, adminUser: user.email });

    // ── TEST SCENARIO 1: PPV Single Performer ────────────────────────────────
    if (testScenario === 'ppv_single_performer') {
      // Use test video + performer
      const testVideoId = videoId || '6a22ae6fc793e2843243f212'; // Filipino twink bareback
      const testUserId = userId || user.id;
      const testAmount = amount || 20.99;
      
      // Check VideoPerformer relation
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({ video_id: testVideoId });
      
      if (videoPerformers.length === 0) {
        return Response.json({
          success: false,
          test_scenario: testScenario,
          error: 'No VideoPerformer relations found for this video',
          video_id: testVideoId,
          suggestion: 'Please assign a performer to this video first',
        }, { status: 400 });
      }
      
      const performer = await base44.asServiceRole.entities.Performer.get(videoPerformers[0].performer_id);
      
      // Create test PaymentIntent
      const intent = await base44.asServiceRole.entities.PaymentIntent.create({
        user_id: testUserId,
        provider: 'nowpayments',
        payment_type: 'ppv',
        video_id: testVideoId,
        price_tier: 'standard',
        amount: testAmount,
        currency: 'usd',
        status: 'pending',
        provider_session_id: `TEST_REVENUE_${Date.now()}`,
        metadata: JSON.stringify({
          test_mode: true,
          test_scenario: 'ppv_single_performer',
          test_started_at: new Date().toISOString(),
          test_admin: user.email,
        }),
      });
      
      // Simulate payment.completed
      const grantResult = await grantEntitlement(base44, {
        ...intent,
        id: intent.id,
        provider_session_id: intent.provider_session_id,
      });
      
      // Update PaymentIntent
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: JSON.stringify({
          ...JSON.parse(intent.metadata || '{}'),
          test_completed_at: new Date().toISOString(),
          entitlement_granted: true,
        }),
      });
      
      return Response.json({
        success: true,
        test_scenario: testScenario,
        test_data: {
          payment_intent_id: intent.id,
          payment_id: grantResult.payment_id,
          video_id: testVideoId,
          performer_id: videoPerformers[0].performer_id,
          performer_name: performer.display_name,
          amount: testAmount,
          revenue_attribution: grantResult.revenue_attribution,
        },
        cleanup_note: 'Test data marked with test_mode=true. Can be safely deleted.',
      });
    }

    // ── TEST SCENARIO 2: PPV Idempotency ────────────────────────────────────
    if (testScenario === 'ppv_idempotency') {
      const testVideoId = videoId || '6a22ae6fc793e2843243f212';
      const testUserId = userId || user.id;
      const testAmount = amount || 20.99;
      
      // First run
      const intent1 = await base44.asServiceRole.entities.PaymentIntent.create({
        user_id: testUserId,
        provider: 'nowpayments',
        payment_type: 'ppv',
        video_id: testVideoId,
        price_tier: 'standard',
        amount: testAmount,
        currency: 'usd',
        status: 'pending',
        provider_session_id: `TEST_IDEMPOTENCY_${Date.now()}`,
        metadata: JSON.stringify({ test_mode: true, test_scenario: 'ppv_idempotency', run: 1 }),
      });
      
      const result1 = await grantEntitlement(base44, { ...intent1, id: intent1.id });
      
      // Second run (same session ID)
      const intent2 = await base44.asServiceRole.entities.PaymentIntent.create({
        user_id: testUserId,
        provider: 'nowpayments',
        payment_type: 'ppv',
        video_id: testVideoId,
        price_tier: 'standard',
        amount: testAmount,
        currency: 'usd',
        status: 'pending',
        provider_session_id: intent1.provider_session_id, // SAME!
        metadata: JSON.stringify({ test_mode: true, test_scenario: 'ppv_idempotency', run: 2 }),
      });
      
      const result2 = await grantEntitlement(base44, { ...intent2, id: intent2.id });
      
      return Response.json({
        success: true,
        test_scenario: testScenario,
        idempotency_test: {
          first_run: {
            payment_intent_id: intent1.id,
            payment_id: result1.payment_id,
            duplicate: result1.duplicate || false,
            revenue_attribution: result1.revenue_attribution,
          },
          second_run: {
            payment_intent_id: intent2.id,
            payment_id: result2?.payment_id,
            duplicate: result2?.duplicate || false,
            note: result2?.duplicate ? 'Idempotency check passed - no duplicate created' : 'WARNING: Should have been duplicate',
          },
        },
      });
    }

    // ── TEST SCENARIO 3: Fanclub Performer-Specific ─────────────────────────
    if (testScenario === 'fanclub_performer') {
      const testUserId = userId || user.id;
      const testAmount = amount || 20.99;
      const testPlanId = planId || 'fanclub_monthly';
      
      // Check if fanclub has performer_id
      const fanclub = await base44.asServiceRole.entities.Fanclub.get(testPlanId);
      
      if (!fanclub) {
        return Response.json({
          success: false,
          test_scenario: testScenario,
          error: 'Fanclub not found',
          plan_id: testPlanId,
        }, { status: 400 });
      }
      
      if (!fanclub.performer_id) {
        return Response.json({
          success: false,
          test_scenario: testScenario,
          note: 'This fanclub is global (no performer_id) - use fanclub_global test instead',
          fanclub_name: fanclub.name,
          fanclub_id: fanclub.id,
        });
      }
      
      const performer = await base44.asServiceRole.entities.Performer.get(fanclub.performer_id);
      
      const intent = await base44.asServiceRole.entities.PaymentIntent.create({
        user_id: testUserId,
        provider: 'nowpayments',
        payment_type: 'fanclub',
        plan_id: testPlanId,
        amount: testAmount,
        currency: 'usd',
        status: 'pending',
        provider_session_id: `TEST_FANCLUB_${Date.now()}`,
        metadata: JSON.stringify({ test_mode: true, test_scenario: 'fanclub_performer' }),
      });
      
      const grantResult = await grantEntitlement(base44, { ...intent, id: intent.id });
      
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      
      return Response.json({
        success: true,
        test_scenario: testScenario,
        test_data: {
          payment_intent_id: intent.id,
          subscription_id: grantResult.subscription_id,
          fanclub_id: testPlanId,
          fanclub_name: fanclub.name,
          performer_id: fanclub.performer_id,
          performer_name: performer.display_name,
          amount: testAmount,
          revenue_attribution: grantResult.revenue_attribution,
        },
      });
    }

    // ── TEST SCENARIO 4: Fanclub Global / Unattributed ──────────────────────
    if (testScenario === 'fanclub_global') {
      const testUserId = userId || user.id;
      const testAmount = amount || 20.99;
      const testPlanId = planId || 'fanclub_monthly';
      
      const fanclub = await base44.asServiceRole.entities.Fanclub.get(testPlanId);
      
      if (!fanclub) {
        return Response.json({
          success: false,
          test_scenario: testScenario,
          error: 'Fanclub not found',
          plan_id: testPlanId,
        }, { status: 400 });
      }
      
      // Temporarily remove performer_id for test (or use a different fanclub)
      const intent = await base44.asServiceRole.entities.PaymentIntent.create({
        user_id: testUserId,
        provider: 'nowpayments',
        payment_type: 'fanclub',
        plan_id: testPlanId,
        amount: testAmount,
        currency: 'usd',
        status: 'pending',
        provider_session_id: `TEST_FANCLUB_GLOBAL_${Date.now()}`,
        metadata: JSON.stringify({ test_mode: true, test_scenario: 'fanclub_global' }),
      });
      
      const grantResult = await grantEntitlement(base44, { ...intent, id: intent.id });
      
      return Response.json({
        success: true,
        test_scenario: testScenario,
        test_data: {
          payment_intent_id: intent.id,
          subscription_id: grantResult.subscription_id,
          fanclub_id: testPlanId,
          fanclub_name: fanclub.name,
          has_performer_id: !!fanclub.performer_id,
          revenue_attribution: grantResult.revenue_attribution,
          note: grantResult.revenue_attribution === 'global_fanclub_unattributed' ? 
            'Correctly identified as unattributed' : 
            'This fanclub has performer_id - attribution created',
        },
      });
    }

    // ── TEST SCENARIO 5: Failed Payment ─────────────────────────────────────
    if (testScenario === 'failed_payment') {
      const testUserId = userId || user.id;
      const testVideoId = videoId || '6a22ae6fc793e2843243f212';
      const testAmount = amount || 20.99;
      
      const intent = await base44.asServiceRole.entities.PaymentIntent.create({
        user_id: testUserId,
        provider: 'nowpayments',
        payment_type: 'ppv',
        video_id: testVideoId,
        price_tier: 'standard',
        amount: testAmount,
        currency: 'usd',
        status: 'pending',
        provider_session_id: `TEST_FAILED_${Date.now()}`,
        metadata: JSON.stringify({ test_mode: true, test_scenario: 'failed_payment' }),
      });
      
      // Simulate failed payment - NO entitlement grant
      await base44.asServiceRole.entities.PaymentIntent.update(intent.id, {
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: 'Test: Payment failed (simulated)',
        metadata: JSON.stringify({
          test_mode: true,
          test_scenario: 'failed_payment',
          entitlement_granted: false,
        }),
      });
      
      // Verify NO Payment/Subscription/Earning was created
      const payments = await base44.asServiceRole.entities.Payment.filter({
        user_id: testUserId,
        related_entity_type: 'Video',
        related_entity_id: testVideoId,
        status: 'completed',
      });
      
      return Response.json({
        success: true,
        test_scenario: testScenario,
        test_data: {
          payment_intent_id: intent.id,
          intent_status: 'failed',
          payments_created: payments.length,
          note: payments.length === 0 ? 
            'Correct: No entitlement created for failed payment' : 
            'WARNING: Payment created despite failed status',
        },
      });
    }

    return Response.json({
      error: 'Unknown testScenario',
      available_scenarios: [
        'ppv_single_performer',
        'ppv_idempotency',
        'fanclub_performer',
        'fanclub_global',
        'failed_payment',
      ],
    }, { status: 400 });

  } catch (err) {
    console.error('[testRevenueAttribution] Error:', err);
    return Response.json({ 
      error: err.message,
      success: false,
    }, { status: 500 });
  }
});