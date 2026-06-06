/**
 * grantEntitlement — Shared Helper Module
 *
 * Grants user entitlements after verified payment completion.
 * Imported by paymentWebhook.js and simulatePaymentWebhook.js
 *
 * SECURITY:
 *   - ONLY called after payment.completed status confirmed
 *   - ONLY called after signature verification (production) or admin auth (test)
 *   - Creates audit trail in Payment/Subscription records
 */

/**
 * Grant entitlements based on payment type
 * @param {Object} base44 - Base44 SDK client (service role)
 * @param {Object} intent - PaymentIntent record
 */
export async function grantEntitlement(base44, intent) {
  if (intent.payment_type === 'ppv') {
    await base44.asServiceRole.entities.Payment.create({
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
        price_tier:          intent.price_tier,
      }),
    });
    console.log('[grantEntitlement] PPV entitlement granted:', { userId: intent.user_id, videoId: intent.video_id });

  } else if (intent.payment_type === 'fanclub') {
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

    await base44.asServiceRole.entities.Subscription.create({
      user_id:                intent.user_id,
      fanclub_id:             intent.plan_id,
      status:                 'active',
      current_period_start:   new Date().toISOString(),
      current_period_end:     periodEnd.toISOString(),
      amount_usd:             intent.amount,
      stripe_subscription_id: `nowpayments_${intent.provider_session_id}`,
    });
    console.log('[grantEntitlement] Fanclub access pass granted:', { userId: intent.user_id, planId: intent.plan_id, months });

  } else if (intent.payment_type === 'guest_production_deposit') {
    if (intent.application_id) {
      await base44.asServiceRole.entities.GuestProductionApplication.update(intent.application_id, {
        status: 'reviewing',
        admin_notes: `Deposit payment confirmed. Provider: ${intent.provider}, Session: ${intent.provider_session_id}`,
      });

      await base44.asServiceRole.entities.Payment.create({
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
          payment_type:        'guest_production_deposit',
        }),
      });
    }
    console.log('[grantEntitlement] Guest Production deposit marked paid:', { userId: intent.user_id, appId: intent.application_id });
  }
}