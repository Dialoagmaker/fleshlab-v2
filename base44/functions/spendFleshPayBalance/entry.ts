/**
 * spendFleshPayBalance — Backend Function
 *
 * Spends FleshPay wallet balance on a PPV video purchase.
 * All pricing is resolved server-side — client cannot override.
 * Revenue attribution (Payment + PerformerEarningLineItem) happens here.
 *
 * Security:
 *   - Auth required
 *   - No client-side price
 *   - Idempotency via FleshPayPurchase.idempotency_key
 *   - No duplicate debit on retry
 *   - No negative balances
 *   - No external payment intent created
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Server-side pricing (must match createCheckoutSession) ──────────────────
const SERVER_PRICING = {
  ppv: {
    standard:  20.99,
    premium:   24.99,
    exclusive: 29.99,
  },
};

// ── Revenue model resolver (inline, same as paymentWebhook) ─────────────────
function resolvePerformerRevenueModel(performer) {
  if (!performer) return { model_key: 'studio_managed', performer_share_percentage: 40, studio_share_percentage: 60, source: 'default' };
  if (performer.revenue_model === 'established_network') return { model_key: 'established_network', performer_share_percentage: 70, studio_share_percentage: 30, source: 'explicit_contract' };
  if (performer.revenue_split_pct !== undefined && performer.revenue_split_pct !== null) {
    const splitPct = parseFloat(performer.revenue_split_pct);
    return { model_key: 'studio_managed', performer_share_percentage: splitPct, studio_share_percentage: 100 - splitPct, source: 'performer_profile' };
  }
  return { model_key: 'studio_managed', performer_share_percentage: 40, studio_share_percentage: 60, source: 'default' };
}

// ── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { videoId } = body;

    if (!videoId) {
      return Response.json({ error: 'videoId required' }, { status: 400 });
    }

    // ── Look up video server-side ─────────────────────────────────────────
    let video;
    try {
      video = await base44.entities.Video.get(videoId);
    } catch {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    if (!video || video.status !== 'published') {
      return Response.json({ error: 'Video is not published or not available' }, { status: 404 });
    }

    if (video.access_tier !== 'ppv') {
      return Response.json({ error: 'This video is not a PPV purchase' }, { status: 400 });
    }

    // ── Resolve price server-side ─────────────────────────────────────────
    // Valid price sources (checked in order):
    //   1. video.download_price  — explicit schema field
    //   2. ai_metadata_draft.ppv_price  — AI-generated metadata
    // If neither source provides a valid price (> 0), the purchase is REJECTED.
    // No hardcoded default — every PPV video MUST have a configured price.
    let price = null;

    // 1. Explicit download_price field
    if (video.download_price && video.download_price > 0) {
      price = video.download_price;
    }

    // 2. AI metadata ppv_price
    if (!price && video.ai_metadata_draft) {
      try {
        const aiMeta = JSON.parse(video.ai_metadata_draft);
        if (aiMeta.ppv_price && aiMeta.ppv_price > 0) {
          price = aiMeta.ppv_price;
        }
      } catch { /* ignore parse errors */ }
    }

    if (!price) {
      return Response.json({
        error: 'No valid PPV price configured',
        detail: 'This video has no download_price or ai_metadata_draft.ppv_price set.',
      }, { status: 400 });
    }

    // ── Idempotency check ─────────────────────────────────────────────────
    const idempotencyKey = `${user.id}_video_${videoId}`;

    const existingPurchases = await base44.entities.FleshPayPurchase.filter({
      user_id: user.id,
      idempotency_key: idempotencyKey,
    });

    if (existingPurchases.length > 0 && existingPurchases[0].access_granted === true) {
      console.log('[spendFleshPayBalance] Purchase already exists — idempotent return');
      return Response.json({
        success: true,
        duplicate: true,
        already_purchased: true,
        purchase: existingPurchases[0],
        message: 'You already own this video',
      });
    }

    // ── Get wallet ────────────────────────────────────────────────────────
    const wallets = await base44.entities.FleshPayWallet.filter({ user_id: user.id });

    if (wallets.length === 0) {
      return Response.json({ error: 'No FleshPay wallet found. Please add funds first.' }, { status: 400 });
    }

    const wallet = wallets[0];

    if (wallet.status !== 'active') {
      return Response.json({ error: 'Wallet is not active. Please contact support.' }, { status: 403 });
    }

    if (wallet.balance_usd < price) {
      return Response.json({
        error: 'Insufficient balance',
        balance_usd: wallet.balance_usd,
        required_usd: price,
        needed_usd: Math.round((price - wallet.balance_usd) * 100) / 100,
      }, { status: 402 });
    }

    // ── Execute debit ─────────────────────────────────────────────────────
    const balanceBefore = wallet.balance_usd;
    const balanceAfter = Math.round((balanceBefore - price) * 100) / 100;

    // 1. Create FleshPayLedger debit entry
    const ledgerEntry = await base44.entities.FleshPayLedger.create({
      wallet_id: wallet.id,
      user_id: user.id,
      entry_type: 'debit',
      transaction_type: 'debit',
      amount_usd: price,
      balance_before_usd: balanceBefore,
      balance_after_usd: balanceAfter,
      source_type: 'ppv_unlock',
      reference_type: 'ppv_unlock',
      source_id: videoId,
      reference_id: videoId,
      provider: 'fleshpay',
      provider_transaction_id: '',
      idempotency_key: idempotencyKey,
      status: 'completed',
      description: `PPV purchase — ${video.title}`,
      metadata_json: JSON.stringify({
        video_id: videoId,
        video_title: video.title,
        video_slug: video.slug,
        price_usd: price,
      }),
    });

    // 2. Update wallet balance
    await base44.entities.FleshPayWallet.update(wallet.id, {
      balance_usd: balanceAfter,
      lifetime_spends_usd: (wallet.lifetime_spends_usd || wallet.lifetime_spent_usd || 0) + price,
      lifetime_spent_usd: (wallet.lifetime_spent_usd || wallet.lifetime_spent_usd || 0) + price,
      last_transaction_at: new Date().toISOString(),
    });

    // 3. Create FleshPayPurchase record
    const purchase = await base44.entities.FleshPayPurchase.create({
      user_id: user.id,
      wallet_id: wallet.id,
      purchase_type: 'ppv_unlock',
      product_type: 'ppv_unlock',
      video_id: videoId,
      product_id: videoId,
      amount_usd: price,
      currency: 'usd',
      ledger_entry_id: ledgerEntry.id,
      access_granted: true,
      status: 'completed',
      idempotency_key: idempotencyKey,
      metadata: JSON.stringify({
        video_title: video.title,
        video_slug: video.slug,
      }),
    });

    // 4. Create Payment record for getMyPurchases / revenue dashboard
    const payment = await base44.entities.Payment.create({
      user_id: user.id,
      amount_usd: price,
      currency: 'usd',
      payment_type: 'ppv',
      status: 'completed',
      related_entity_type: 'Video',
      related_entity_id: videoId,
      metadata: JSON.stringify({
        provider: 'fleshpay',
        method: 'wallet',
        fleshpay_purchase_id: purchase.id,
        fleshpay_ledger_entry_id: ledgerEntry.id,
        video_title: video.title,
      }),
    });

    // 5. Revenue attribution — PerformerEarningLineItem
    const periodMonth = new Date().toISOString().slice(0, 7);
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({ video_id: videoId });

    if (videoPerformers.length > 0) {
      for (const vp of videoPerformers) {
        const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id);
        if (!performer || performer.status === 'inactive') continue;

        const revenueModel = resolvePerformerRevenueModel(performer);
        const performerGross = price / videoPerformers.length;
        const performerAmount = Math.round((performerGross * revenueModel.performer_share_percentage / 100) * 100) / 100;
        const studioAmount = Math.round((performerGross - performerAmount) * 100) / 100;

        await base44.asServiceRole.entities.PerformerEarningLineItem.create({
          performer_id: vp.performer_id,
          performer_earning_id: null,
          period_month: periodMonth,
          source_type: 'ppv_purchase',
          source_platform: 'fleshlab',
          source_reference_id: videoId,
          description: JSON.stringify({ payment_id: payment.id, method: 'fleshpay_wallet', video_title: video.title }),
          gross_amount_usd: performerGross,
          performer_share_percent: revenueModel.performer_share_percentage,
          performer_amount_usd: performerAmount,
          studio_amount_usd: studioAmount,
          currency: 'usd',
          exchange_rate: 1,
          status: 'approved',
          notes: `FleshPay wallet PPV purchase — ${video.title}`,
        });
      }
    }

    console.log('[spendFleshPayBalance] Purchase complete:', {
      userId: user.id,
      videoId,
      price,
      balanceBefore,
      balanceAfter,
      purchaseId: purchase.id,
      ledgerEntryId: ledgerEntry.id,
      paymentId: payment.id,
    });

    return Response.json({
      success: true,
      purchase: {
        id: purchase.id,
        video_id: videoId,
        amount_usd: price,
        balance_before_usd: balanceBefore,
        balance_after_usd: balanceAfter,
        access_granted: true,
      },
      message: 'Video unlocked successfully',
    });
  } catch (err) {
    console.error('[spendFleshPayBalance]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});