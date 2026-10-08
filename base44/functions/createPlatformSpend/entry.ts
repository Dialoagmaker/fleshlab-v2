import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SUPPORTED_TYPES = ['ppv', 'fanclub', 'guest_production_deposit'];
const FANCLUB_PRICING = { fanclub_monthly: 20.99, premium_monthly: 29.99, fanclub_3mo: 49.99, fanclub_6mo: 49.99 };
const GUEST_PRODUCTION_DEPOSIT_PRICE = 999;
const TRANSACTION_TYPE = { ppv: 'video_purchase', fanclub: 'fanclub_purchase', guest_production_deposit: 'subscription_purchase' };

async function getOrCreateWallet(base44, userId) {
  const wallets = await base44.entities.FlashPayWallet.filter({ user_id: userId });
  if (wallets.length > 0) {
    const candidates = wallets.filter(wallet => wallet.status !== 'closed');
    return (candidates.length ? candidates : wallets).sort((a, b) => ((b.available_balance || 0) + (b.pending_balance || 0) + (b.lifetime_deposited || 0)) - ((a.available_balance || 0) + (a.pending_balance || 0) + (a.lifetime_deposited || 0)))[0];
  }
  const now = new Date().toISOString();
  return await base44.entities.FlashPayWallet.create({ user_id: userId, currency: 'usd', available_balance: 0, pending_balance: 0, lifetime_deposited: 0, lifetime_spent: 0, status: 'active', created_at: now, updated_at: now });
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { item_type, item_id, plan_id, price_tier, idempotency_key } = body;
    if (!SUPPORTED_TYPES.includes(item_type)) return Response.json({ error: `Unsupported item_type: ${item_type}` }, { status: 400 });

    let amount = null;
    let videoId = null;
    let planId = null;
    let applicationId = null;
    let label = 'FlashPay purchase';

    if (item_type === 'ppv') {
      videoId = item_id;
      if (!videoId) return Response.json({ error: 'Video required.' }, { status: 400 });
      let video;
      try { video = await base44.entities.Video.get(videoId); } catch { return Response.json({ error: 'Video not found.' }, { status: 404 }); }
      if (!video || video.status !== 'published') return Response.json({ error: 'Video is not available.' }, { status: 404 });
      if (video.access_tier !== 'ppv') return Response.json({ error: 'This video is not a PPV purchase.' }, { status: 400 });
      amount = Number(video.download_price || 0);
      if (!amount && video.ai_metadata_draft) {
        try { const meta = JSON.parse(video.ai_metadata_draft); amount = Number(meta.ppv_price || 0); } catch { amount = 0; }
      }
      if (!amount || amount <= 0) return Response.json({ error: 'No valid server-side price configured.' }, { status: 400 });
      label = video.title || 'Video purchase';

      const existingAccess = await base44.entities.Payment.filter({ user_id: user.id, payment_type: 'ppv', status: 'completed', related_entity_type: 'Video', related_entity_id: videoId });
      if (existingAccess.length > 0) return Response.json({ success: true, already_purchased: true, duplicate: true, message: 'You already own this video.' });
    }

    if (item_type === 'fanclub') {
      planId = plan_id || item_id;
      amount = FANCLUB_PRICING[planId];
      if (!amount) return Response.json({ error: 'Invalid fanclub plan.' }, { status: 400 });
      label = 'Fanclub access';
      const activeSubs = await base44.entities.Subscription.filter({ user_id: user.id, fanclub_id: planId, status: 'active' });
      if (activeSubs.some(s => !s.current_period_end || new Date(s.current_period_end) > new Date())) {
        return Response.json({ success: true, already_purchased: true, duplicate: true, message: 'You already have active fanclub access.' });
      }
    }

    if (item_type === 'guest_production_deposit') {
      applicationId = item_id;
      if (!applicationId) return Response.json({ error: 'Application required.' }, { status: 400 });
      amount = GUEST_PRODUCTION_DEPOSIT_PRICE;
      label = 'Fan Production reservation';
    }

    amount = roundMoney(amount);
    const productId = videoId || planId || applicationId;
    const serverKey = idempotency_key ? `${user.id}_${idempotency_key}` : `${user.id}_flashpay_${item_type}_${productId}`;

    const existingTx = await base44.entities.FlashPayTransaction.filter({ user_id: user.id, idempotency_key: serverKey });
    const completedTx = existingTx.find(t => t.status === 'completed');
    if (completedTx) return Response.json({ success: true, duplicate: true, already_purchased: true, transaction: completedTx });
    if (existingTx.some(t => t.status === 'pending')) return Response.json({ error: 'A purchase for this item is already in progress.', pending: true }, { status: 409 });

    const wallet = await getOrCreateWallet(base44, user.id);
    if (wallet.status !== 'active') return Response.json({ error: 'Wallet is not active.' }, { status: 403 });

    const balanceBefore = roundMoney(wallet.available_balance);
    if (balanceBefore < amount) return Response.json({ error: 'Insufficient balance', balance_usd: balanceBefore, required_usd: amount, needed_usd: roundMoney(amount - balanceBefore) }, { status: 402 });
    const balanceAfter = roundMoney(balanceBefore - amount);

    const transaction = await base44.entities.FlashPayTransaction.create({
      wallet_id: wallet.id,
      user_id: user.id,
      transaction_type: TRANSACTION_TYPE[item_type],
      direction: 'debit',
      amount,
      currency: 'usd',
      status: 'pending',
      reference_type: item_type,
      reference_id: productId,
      provider: 'flashpay',
      provider_transaction_id: '',
      idempotency_key: serverKey,
      description: label,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      metadata: JSON.stringify({ item_type, product_id: productId, price_tier: price_tier || null }),
    });

    await base44.entities.FlashPayWallet.update(wallet.id, { available_balance: balanceAfter, lifetime_spent: roundMoney((wallet.lifetime_spent || 0) + amount), updated_at: new Date().toISOString() });

    const entitlementIntent = { user_id: user.id, provider: 'flashpay', provider_session_id: transaction.id, payment_type: item_type, plan_id: planId, video_id: videoId, application_id: applicationId, price_tier: price_tier || null, amount, currency: 'usd', id: transaction.id };
    let entitlement;
    try {
      const res = await base44.functions.invoke('shared/grantEntitlement', { intent: entitlementIntent });
      entitlement = res.data;
    } catch (err) {
      entitlement = { ok: false, error: err.message };
    }

    if (!entitlement?.ok) {
      const freshWallets = await base44.entities.FlashPayWallet.filter({ user_id: user.id });
      const freshWallet = freshWallets[0] || { ...wallet, available_balance: balanceAfter };
      const reversalBefore = roundMoney(freshWallet.available_balance);
      const reversalAfter = roundMoney(reversalBefore + amount);
      await base44.entities.FlashPayTransaction.create({
        wallet_id: wallet.id,
        user_id: user.id,
        transaction_type: 'reversal',
        direction: 'credit',
        amount,
        currency: 'usd',
        status: 'completed',
        reference_type: 'failed_purchase',
        reference_id: transaction.id,
        provider: 'flashpay',
        provider_transaction_id: '',
        idempotency_key: `${serverKey}_reversal`,
        description: `Automatic reversal — ${label}`,
        balance_before: reversalBefore,
        balance_after: reversalAfter,
        completed_at: new Date().toISOString(),
        metadata: JSON.stringify({ failed_transaction_id: transaction.id, entitlement_error: entitlement?.error || 'unknown' }),
      });
      await base44.entities.FlashPayWallet.update(wallet.id, { available_balance: reversalAfter, lifetime_spent: Math.max(0, roundMoney((freshWallet.lifetime_spent || 0) - amount)), updated_at: new Date().toISOString() });
      await base44.entities.FlashPayTransaction.update(transaction.id, { status: 'failed', failed_at: new Date().toISOString(), metadata: JSON.stringify({ item_type, product_id: productId, entitlement_error: entitlement?.error || 'unknown' }) });
      return Response.json({ success: false, error: 'Purchase failed before access was granted. Your wallet debit was reversed.', transaction_id: transaction.id }, { status: 502 });
    }

    await base44.entities.FlashPayTransaction.update(transaction.id, { status: 'completed', completed_at: new Date().toISOString(), metadata: JSON.stringify({ item_type, product_id: productId, entitlement, price_tier: price_tier || null }) });
    const userWallets = await base44.entities.FlashPayWallet.filter({ user_id: user.id });
    const updatedWallet = userWallets.sort((a, b) => ((b.available_balance || 0) + (b.pending_balance || 0) + (b.lifetime_deposited || 0)) - ((a.available_balance || 0) + (a.pending_balance || 0) + (a.lifetime_deposited || 0)))[0];

    return Response.json({ success: true, transaction: { ...transaction, status: 'completed' }, wallet: updatedWallet, entitlement, message: 'Purchase completed with FlashPay.' });
  } catch (error) {
    console.error('[createPlatformSpend]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});