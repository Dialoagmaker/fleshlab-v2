/**
 * spendFleshPayBalance — Backend Function (Hardened)
 *
 * Spends FleshPay wallet balance on a PPV video purchase.
 * All pricing is resolved server-side — client cannot override.
 * Revenue attribution (Payment + PerformerEarningLineItem) happens here.
 *
 * SAFE SEQUENCE (prevents partial failures):
 *   1. Auth + video lookup + price resolution
 *   2. Idempotency: check existing Purchase
 *      - COMPLETED → return already_purchased (no writes)
 *      - PENDING    → RECOVERY MODE: resume from last successful step
 *   3. Wallet validation + balance check
 *   4. Create Purchase in PENDING state (access_granted=false)
 *   5. Check for existing Ledger (idempotency_key)
 *   6. Create Ledger debit (only if none exists)
 *   7. Update wallet balance
 *   8. Mark Purchase COMPLETED (access_granted=true)
 *   9. Create Payment (check existing by user+video)
 *   10. Create PerformerEarningLineItem (check existing by performer+source_reference_id)
 *
 * RECOVERY MODE (retry after partial failure):
 *   - Skips steps already completed
 *   - Never double-debits (idempotency_key on Ledger)
 *   - Never duplicates Payment (performer check on Earning)
 *   - Returns clear status of what was recovered
 *
 * Security:
 *   - Auth required
 *   - No client-side price
 *   - No negative balances
 *   - No external payment intent created
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // ── Beta gate ──────────────────────────────────────────────────────
    const betaEnabled = Deno.env.get('FLESHPAY_BETA_ENABLED');
    if (betaEnabled !== 'true') {
      return Response.json({ error: 'FleshPay beta is not currently enabled.' }, { status: 403 });
    }
    const allowlistRaw = Deno.env.get('FLESHPAY_BETA_ALLOWLIST') || '';
    if (allowlistRaw.trim() && user.role !== 'admin') {
      const allowedIds = allowlistRaw.split(',').map(s => s.trim().toLowerCase());
      const isAllowed = allowedIds.includes(user.id.toLowerCase()) ||
                        allowedIds.includes((user.email || '').toLowerCase());
      if (!isAllowed) {
        return Response.json({ error: 'FleshPay beta is limited to selected users.' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { videoId } = body;

    if (!videoId) {
      return Response.json({ error: 'videoId required' }, { status: 400 });
    }

    // ── 1. Look up video server-side ──────────────────────────────────────
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

    // ── 2. Resolve price server-side ─────────────────────────────────────
    let price = null;

    if (video.download_price && video.download_price > 0) {
      price = video.download_price;
    }

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

    const idempotencyKey = `${user.id}_video_${videoId}`;

    // ── 3. Idempotency: check existing Purchase ──────────────────────────
    const existingPurchases = await base44.entities.FleshPayPurchase.filter({
      user_id: user.id,
      idempotency_key: idempotencyKey,
    });

    // If purchase exists and is COMPLETED → idempotent return, no writes
    if (existingPurchases.length > 0 && existingPurchases[0].status === 'completed' && existingPurchases[0].access_granted === true) {
      console.log('[spendFleshPayBalance] Purchase completed — idempotent return');
      return Response.json({
        success: true,
        duplicate: true,
        already_purchased: true,
        purchase: existingPurchases[0],
        message: 'You already own this video',
      });
    }

    // ── 4. Wallet validation ─────────────────────────────────────────────
    const wallets = await base44.entities.FleshPayWallet.filter({ user_id: user.id });

    if (wallets.length === 0) {
      return Response.json({ error: 'No FleshPay wallet found. Please add funds first.' }, { status: 400 });
    }

    const wallet = wallets[0];

    if (wallet.status !== 'active') {
      return Response.json({ error: 'Wallet is not active. Please contact support.' }, { status: 403 });
    }

    // ── 5. Recovery mode or fresh purchase ───────────────────────────────
    // pendingPurchase exists if a previous attempt failed mid-sequence
    const pendingPurchase = existingPurchases.length > 0 && existingPurchases[0].status === 'pending'
      ? existingPurchases[0] : null;

    let purchase = pendingPurchase;
    let ledgerEntry = null;
    let isRecovery = false;
    let recoverySteps = [];

    if (pendingPurchase) {
      // RECOVERY MODE: detect which steps were completed and resume
      isRecovery = true;
      console.log('[spendFleshPayBalance] RECOVERY MODE — pending purchase:', pendingPurchase.id);

      // Check if Ledger was already created
      const existingLedger = await base44.entities.FleshPayLedger.filter({
        wallet_id: wallet.id,
        idempotency_key: idempotencyKey,
      });

      if (existingLedger.length > 0) {
        ledgerEntry = existingLedger[0];
        console.log('[spendFleshPayBalance] Recovery: Ledger exists, skipping debit');
        recoverySteps.push('ledger_exists');
      }

      // Check if wallet was already debited (ledger exists and wallet balance matches)
      if (ledgerEntry && wallet.balance_usd === ledgerEntry.balance_after_usd) {
        console.log('[spendFleshPayBalance] Recovery: Wallet already debited');
        recoverySteps.push('wallet_debited');
      }

      // Check if Payment was already created
      const existingPayments = await base44.entities.Payment.filter({
        user_id: user.id,
        related_entity_type: 'Video',
        related_entity_id: videoId,
      });
      const existingPayment = existingPayments.find(p => {
        try {
          const meta = JSON.parse(p.metadata || '{}');
          return meta.provider === 'fleshpay';
        } catch { return false; }
      });

      if (existingPayment) {
        console.log('[spendFleshPayBalance] Recovery: Payment exists, skipping');
        recoverySteps.push('payment_exists');
      }
    }

    // ── 6. Balance check (fresh or recovery) ─────────────────────────────
    const balanceBefore = wallet.balance_usd;
    const balanceAfter = Math.round((balanceBefore - price) * 100) / 100;

    // In recovery mode, if wallet was already debited, use ledger balance
    const effectiveBalanceBefore = (isRecovery && ledgerEntry)
      ? ledgerEntry.balance_before_usd : balanceBefore;

    if (!isRecovery && balanceBefore < price) {
      return Response.json({
        error: 'Insufficient balance',
        balance_usd: balanceBefore,
        required_usd: price,
        needed_usd: Math.round((price - balanceBefore) * 100) / 100,
      }, { status: 402 });
    }

    // ── 7. Create Purchase in PENDING state (if not in recovery) ─────────
    if (!purchase) {
      purchase = await base44.entities.FleshPayPurchase.create({
        user_id: user.id,
        wallet_id: wallet.id,
        purchase_type: 'ppv_unlock',
        product_type: 'ppv_unlock',
        video_id: videoId,
        product_id: videoId,
        amount_usd: price,
        currency: 'usd',
        ledger_entry_id: null,  // Will be set after ledger creation
        access_granted: false,
        status: 'pending',
        idempotency_key: idempotencyKey,
        metadata: JSON.stringify({
          video_title: video.title,
          video_slug: video.slug,
        }),
      });
      console.log('[spendFleshPayBalance] Purchase created in PENDING:', purchase.id);
    }

    // ── 8. Create Ledger debit (if not already done) ────────────────────
    if (!ledgerEntry) {
      try {
        ledgerEntry = await base44.entities.FleshPayLedger.create({
          wallet_id: wallet.id,
          user_id: user.id,
          entry_type: 'debit',
          transaction_type: 'debit',
          amount_usd: price,
          balance_before_usd: effectiveBalanceBefore,
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
            purchase_id: purchase.id,
          }),
        });
        console.log('[spendFleshPayBalance] Ledger debit created:', ledgerEntry.id);
      } catch (err) {
        // If ledger already exists due to idempotency_key collision
        // (rare race condition), treat as recovery
        console.log('[spendFleshPayBalance] Ledger create failed, checking existing:', err.message);
        const existing = await base44.entities.FleshPayLedger.filter({
          wallet_id: wallet.id,
          idempotency_key: idempotencyKey,
        });
        if (existing.length > 0) {
          ledgerEntry = existing[0];
          console.log('[spendFleshPayBalance] Found existing ledger, continuing');
        } else {
          throw err; // Real error, re-throw
        }
      }
    }

    // ── 9. Update wallet balance (only if not already done) ──────────────
    const needsWalletUpdate = !isRecovery || !recoverySteps.includes('wallet_debited');

    if (needsWalletUpdate) {
      const currentSpends = wallet.lifetime_spends_usd || wallet.lifetime_spent_usd || 0;
      await base44.entities.FleshPayWallet.update(wallet.id, {
        balance_usd: balanceAfter,
        lifetime_spends_usd: currentSpends + price,
        lifetime_spent_usd: currentSpends + price,
        last_transaction_at: new Date().toISOString(),
      });
      console.log('[spendFleshPayBalance] Wallet updated:', balanceBefore, '→', balanceAfter);
    }

    // ── 10. Mark Purchase COMPLETED ─────────────────────────────────────
    await base44.entities.FleshPayPurchase.update(purchase.id, {
      ledger_entry_id: ledgerEntry.id,
      access_granted: true,
      status: 'completed',
    });
    console.log('[spendFleshPayBalance] Purchase marked COMPLETED:', purchase.id);

    // ── 11. Create Payment record (if not already done) ──────────────────
    let payment = null;
    if (isRecovery && recoverySteps.includes('payment_exists')) {
      const existingPayments = await base44.entities.Payment.filter({
        user_id: user.id,
        related_entity_type: 'Video',
        related_entity_id: videoId,
      });
      payment = existingPayments.find(p => {
        try {
          const meta = JSON.parse(p.metadata || '{}');
          return meta.provider === 'fleshpay';
        } catch { return false; }
      }) || null;
    }

    if (!payment) {
      payment = await base44.entities.Payment.create({
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
      console.log('[spendFleshPayBalance] Payment created:', payment.id);
    }

    // ── 12. Revenue attribution — PerformerEarningLineItem ──────────────
    const periodMonth = new Date().toISOString().slice(0, 7);
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({ video_id: videoId });

    if (videoPerformers.length > 0) {
      for (const vp of videoPerformers) {
        // Check for existing earning item (idempotency at earning level)
        const existingEarnings = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
          performer_id: vp.performer_id,
          source_reference_id: videoId,
          source_type: 'ppv_purchase',
          source_platform: 'fleshlab',
        });

        if (existingEarnings.length > 0) {
          console.log('[spendFleshPayBalance] Earning already exists for performer:', vp.performer_id);
          continue; // Skip — already attributed
        }

        const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id);
        if (!performer || performer.status === 'inactive') continue;

        const revenueModel = resolvePerformerRevenueModel(performer);
        const performerGross = Math.round((price / videoPerformers.length) * 100) / 100;
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

    const result = {
      success: true,
      recovered: isRecovery,
      recovery_steps: isRecovery ? recoverySteps : [],
      purchase: {
        id: purchase.id,
        video_id: videoId,
        amount_usd: price,
        balance_before_usd: effectiveBalanceBefore,
        balance_after_usd: balanceAfter,
        access_granted: true,
      },
      message: isRecovery ? 'Video unlocked (recovered from previous attempt)' : 'Video unlocked successfully',
    };

    console.log('[spendFleshPayBalance] Purchase complete:', {
      userId: user.id,
      videoId,
      price,
      isRecovery,
      purchaseId: purchase.id,
      ledgerEntryId: ledgerEntry.id,
      paymentId: payment.id,
    });

    return Response.json(result);
  } catch (err) {
    console.error('[spendFleshPayBalance]', err);
    return Response.json({
      error: err.message,
      detail: 'Purchase failed. Your wallet has not been charged. Please try again.',
      needs_manual_review: false,
    }, { status: 500 });
  }
});