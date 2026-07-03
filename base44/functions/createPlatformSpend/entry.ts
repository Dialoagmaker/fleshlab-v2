/**
 * createPlatformSpend — Backend Function
 *
 * Generic FlashPay wallet spend for eligible purchase types:
 *   ppv | fanclub (incl. premium membership plans) | guest_production_deposit
 *
 * Pricing is always resolved SERVER-SIDE — client cannot override amount.
 * After a successful wallet debit, entitlement is granted via the SAME
 * shared pipeline used by NOWPayments (shared/grantEntitlement) — no
 * duplicated entitlement logic.
 *
 * Safety:
 *   - Idempotency key required on every ledger entry (never double-charge)
 *   - No negative balances allowed
 *   - Content is only unlocked after the wallet debit succeeds
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPPORTED_TYPES = ['ppv', 'fanclub', 'guest_production_deposit'];

// Kept in sync with SERVER_PRICING in createCheckoutSession/entry.ts
const FANCLUB_PRICING = {
  fanclub_monthly: 20.99,
  premium_monthly: 29.99,
  fanclub_3mo: 49.99,
};
const GUEST_PRODUCTION_DEPOSIT_PRICE = 999;

const PURCHASE_TYPE_MAP = {
  ppv: 'ppv_unlock',
  fanclub: 'fanclub',
  guest_production_deposit: 'guest_production_deposit',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Beta gate (same as other FleshPay endpoints) ──────────────────────
    const betaEnabled = Deno.env.get('FLESHPAY_BETA_ENABLED');
    if (betaEnabled !== 'true') {
      return Response.json({ error: 'FleshPay beta is not currently enabled.' }, { status: 403 });
    }
    const allowlistRaw = Deno.env.get('FLESHPAY_BETA_ALLOWLIST') || '';
    if (allowlistRaw.trim() && user.role !== 'admin') {
      const allowedIds = allowlistRaw.split(',').map(s => s.trim().toLowerCase());
      const isAllowed = allowedIds.includes(user.id.toLowerCase()) || allowedIds.includes((user.email || '').toLowerCase());
      if (!isAllowed) {
        return Response.json({ error: 'FleshPay beta is limited to selected users.' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { item_type, item_id, plan_id, price_tier, idempotency_key } = body;

    if (!SUPPORTED_TYPES.includes(item_type)) {
      return Response.json({ error: `Unsupported item_type: ${item_type}` }, { status: 400 });
    }

    // ── Resolve price + entity refs server-side ───────────────────────────
    let amount = null, videoId = null, planId = null, applicationId = null, video = null;

    if (item_type === 'ppv') {
      videoId = item_id;
      if (!videoId) return Response.json({ error: 'item_id (videoId) required for ppv' }, { status: 400 });
      try {
        video = await base44.entities.Video.get(videoId);
      } catch {
        return Response.json({ error: 'Video not found' }, { status: 404 });
      }
      if (!video || video.status !== 'published') return Response.json({ error: 'Video is not published or not available' }, { status: 404 });
      if (video.access_tier !== 'ppv') return Response.json({ error: 'This video is not a PPV purchase' }, { status: 400 });
      if (video.download_price && video.download_price > 0) amount = video.download_price;
      if (!amount && video.ai_metadata_draft) {
        try {
          const m = JSON.parse(video.ai_metadata_draft);
          if (m.ppv_price && m.ppv_price > 0) amount = m.ppv_price;
        } catch (_) { /* ignore */ }
      }
      if (!amount) return Response.json({ error: 'No valid PPV price configured for this video' }, { status: 400 });
    } else if (item_type === 'fanclub') {
      planId = plan_id || item_id;
      if (!planId) return Response.json({ error: 'plan_id required for fanclub' }, { status: 400 });
      amount = FANCLUB_PRICING[planId];
      if (!amount) return Response.json({ error: `Invalid plan_id: ${planId}` }, { status: 400 });
    } else if (item_type === 'guest_production_deposit') {
      applicationId = item_id;
      if (!applicationId) return Response.json({ error: 'item_id (applicationId) required for guest production deposit' }, { status: 400 });
      amount = GUEST_PRODUCTION_DEPOSIT_PRICE;
    }

    const idempotencyKey = idempotency_key || `${user.id}_wallet_${item_type}_${item_id}`;
    const purchaseType = PURCHASE_TYPE_MAP[item_type];
    const productId = videoId || planId || applicationId;

    // ── Idempotency: existing purchase ─────────────────────────────────────
    const existingPurchases = await base44.entities.FleshPayPurchase.filter({ user_id: user.id, idempotency_key: idempotencyKey });
    if (existingPurchases.length > 0 && existingPurchases[0].status === 'completed' && existingPurchases[0].access_granted === true) {
      return Response.json({ success: true, duplicate: true, already_purchased: true, purchase: existingPurchases[0] });
    }

    // ── Wallet validation ───────────────────────────────────────────────────
    const wallets = await base44.entities.FleshPayWallet.filter({ user_id: user.id });
    if (wallets.length === 0) return Response.json({ error: 'No FleshPay wallet found. Please add funds first.' }, { status: 400 });
    const wallet = wallets[0];
    if (wallet.status !== 'active') return Response.json({ error: 'Wallet is not active. Please contact support.' }, { status: 403 });

    const pendingPurchase = existingPurchases.find(p => p.status === 'pending') || null;
    let purchase = pendingPurchase;
    const isRecovery = !!pendingPurchase;

    let ledgerEntry = null;
    if (isRecovery) {
      const existingLedger = await base44.entities.FleshPayLedger.filter({ wallet_id: wallet.id, idempotency_key: idempotencyKey });
      if (existingLedger.length > 0) ledgerEntry = existingLedger[0];
    }

    const balanceBefore = wallet.balance_usd;
    const balanceAfter = Math.round((balanceBefore - amount) * 100) / 100;

    if (!isRecovery && balanceBefore < amount) {
      return Response.json({
        error: 'Insufficient balance',
        balance_usd: balanceBefore,
        required_usd: amount,
        needed_usd: Math.round((amount - balanceBefore) * 100) / 100,
      }, { status: 402 });
    }

    // ── Create Purchase in PENDING state (if not recovering) ───────────────
    if (!purchase) {
      purchase = await base44.entities.FleshPayPurchase.create({
        user_id: user.id,
        wallet_id: wallet.id,
        purchase_type: purchaseType,
        product_type: purchaseType,
        video_id: videoId || undefined,
        fanclub_id: planId || undefined,
        application_id: applicationId || undefined,
        product_id: productId,
        amount_usd: amount,
        currency: 'usd',
        access_granted: false,
        status: 'pending',
        idempotency_key: idempotencyKey,
        metadata: JSON.stringify({ item_type, video_title: video?.title || null }),
      });
    }

    // ── Ledger debit (if not already done) ─────────────────────────────────
    if (!ledgerEntry) {
      ledgerEntry = await base44.entities.FleshPayLedger.create({
        wallet_id: wallet.id,
        user_id: user.id,
        entry_type: 'debit',
        transaction_type: 'debit',
        amount_usd: amount,
        balance_before_usd: balanceBefore,
        balance_after_usd: balanceAfter,
        source_type: purchaseType,
        reference_type: purchaseType,
        source_id: productId,
        reference_id: productId,
        provider: 'fleshpay',
        provider_transaction_id: '',
        idempotency_key: idempotencyKey,
        status: 'completed',
        description: `${item_type} purchase via FlashPay wallet`,
        metadata_json: JSON.stringify({ item_type, product_id: productId, price_usd: amount, purchase_id: purchase.id }),
      });

      const currentSpends = wallet.lifetime_spends_usd || wallet.lifetime_spent_usd || 0;
      await base44.entities.FleshPayWallet.update(wallet.id, {
        balance_usd: balanceAfter,
        lifetime_spends_usd: currentSpends + amount,
        lifetime_spent_usd: currentSpends + amount,
        last_transaction_at: new Date().toISOString(),
      });
    }

    await base44.entities.FleshPayPurchase.update(purchase.id, {
      ledger_entry_id: ledgerEntry.id,
      access_granted: true,
      status: 'completed',
    });

    // ── Grant entitlement via the existing shared pipeline (no duplication) ──
    const entitlementIntent = {
      user_id: user.id,
      provider: 'fleshpay',
      provider_session_id: purchase.id,
      payment_type: item_type,
      plan_id: planId,
      video_id: videoId,
      application_id: applicationId,
      price_tier: price_tier || null,
      amount,
      currency: 'usd',
    };

    let entitlementResult;
    try {
      const res = await base44.functions.invoke('shared/grantEntitlement', { intent: entitlementIntent });
      entitlementResult = res.data;
    } catch (entErr) {
      console.error('[createPlatformSpend] Entitlement grant error:', entErr.message);
      entitlementResult = { ok: false, error: entErr.message };
    }

    return Response.json({
      success: true,
      recovered: isRecovery,
      purchase: {
        id: purchase.id,
        item_type,
        amount_usd: amount,
        balance_before_usd: balanceBefore,
        balance_after_usd: balanceAfter,
        access_granted: true,
      },
      entitlement: entitlementResult,
      message: 'Purchase completed via FlashPay Wallet',
    });
  } catch (err) {
    console.error('[createPlatformSpend]', err);
    return Response.json({
      error: err.message,
      detail: 'Purchase failed. Your wallet has not been charged further. Please try again or contact support.',
    }, { status: 500 });
  }
});