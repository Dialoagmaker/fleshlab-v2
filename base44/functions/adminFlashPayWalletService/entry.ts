import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function roundMoney(value) { return Math.round(Number(value || 0) * 100) / 100; }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      const wallets = await base44.asServiceRole.entities.FlashPayWallet.list('-updated_date', 100);
      return Response.json({ wallets });
    }

    if (action === 'detail') {
      if (!body.wallet_id) return Response.json({ error: 'wallet_id required' }, { status: 400 });
      const wallet = await base44.asServiceRole.entities.FlashPayWallet.get(body.wallet_id);
      const transactions = await base44.asServiceRole.entities.FlashPayTransaction.filter({ wallet_id: wallet.id }, '-created_date', 100);
      return Response.json({ wallet, transactions });
    }

    if (action === 'adjust') {
      const { wallet_id, amount, direction, reason } = body;
      if (!wallet_id || !amount || !['credit', 'debit'].includes(direction) || !reason) return Response.json({ error: 'wallet_id, amount, direction and reason are required' }, { status: 400 });
      const wallet = await base44.asServiceRole.entities.FlashPayWallet.get(wallet_id);
      if (wallet.status !== 'active') return Response.json({ error: 'Wallet is not active' }, { status: 403 });
      const change = roundMoney(amount);
      const before = roundMoney(wallet.available_balance);
      const after = direction === 'credit' ? roundMoney(before + change) : roundMoney(before - change);
      if (after < 0) return Response.json({ error: 'Adjustment would create a negative balance' }, { status: 400 });
      const key = `admin_adjust_${wallet.id}_${Date.now()}`;
      const tx = await base44.asServiceRole.entities.FlashPayTransaction.create({
        wallet_id: wallet.id, user_id: wallet.user_id, transaction_type: 'adjustment', direction, amount: change, currency: wallet.currency || 'usd', status: 'completed', reference_type: 'admin_adjustment', reference_id: user.id, provider: 'internal', provider_transaction_id: '', idempotency_key: key, description: reason, balance_before: before, balance_after: after, completed_at: new Date().toISOString(), metadata: JSON.stringify({ admin_user_id: user.id, admin_email: user.email, reason })
      });
      await base44.asServiceRole.entities.FlashPayWallet.update(wallet.id, { available_balance: after, updated_at: new Date().toISOString() });
      return Response.json({ success: true, transaction: tx, wallet: { ...wallet, available_balance: after } });
    }

    if (action === 'refund') {
      const { transaction_id, amount, reason } = body;
      if (!transaction_id || !amount || !reason) return Response.json({ error: 'transaction_id, amount and reason are required' }, { status: 400 });
      const original = await base44.asServiceRole.entities.FlashPayTransaction.get(transaction_id);
      if (!original || original.direction !== 'debit' || original.status !== 'completed') return Response.json({ error: 'Only completed debit transactions can be refunded' }, { status: 400 });
      const wallet = await base44.asServiceRole.entities.FlashPayWallet.get(original.wallet_id);
      const related = await base44.asServiceRole.entities.FlashPayTransaction.filter({ reference_type: 'refund_of', reference_id: original.id });
      const alreadyRefunded = related.filter(t => t.status === 'completed').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const refundAmount = roundMoney(amount);
      if (refundAmount <= 0 || refundAmount > roundMoney(original.amount - alreadyRefunded)) return Response.json({ error: 'Refund exceeds refundable amount' }, { status: 400 });
      const before = roundMoney(wallet.available_balance);
      const after = roundMoney(before + refundAmount);
      const key = `refund_${original.id}_${refundAmount}`;
      const existing = await base44.asServiceRole.entities.FlashPayTransaction.filter({ idempotency_key: key });
      if (existing.some(t => t.status === 'completed')) return Response.json({ success: true, duplicate: true, transaction: existing[0] });
      const tx = await base44.asServiceRole.entities.FlashPayTransaction.create({
        wallet_id: wallet.id, user_id: wallet.user_id, transaction_type: 'refund', direction: 'credit', amount: refundAmount, currency: wallet.currency || 'usd', status: 'completed', reference_type: 'refund_of', reference_id: original.id, provider: 'internal', provider_transaction_id: '', idempotency_key: key, description: reason, balance_before: before, balance_after: after, completed_at: new Date().toISOString(), metadata: JSON.stringify({ admin_user_id: user.id, admin_email: user.email, original_transaction_id: original.id, reason })
      });
      await base44.asServiceRole.entities.FlashPayWallet.update(wallet.id, { available_balance: after, updated_at: new Date().toISOString() });
      if (original.transaction_type === 'video_purchase' && original.reference_id) {
        const payments = await base44.asServiceRole.entities.Payment.filter({ user_id: original.user_id, payment_type: 'ppv', status: 'completed', related_entity_type: 'Video', related_entity_id: original.reference_id });
        for (const payment of payments) await base44.asServiceRole.entities.Payment.update(payment.id, { status: 'refunded' });
      }
      if (original.transaction_type === 'fanclub_purchase' && original.reference_id) {
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: original.user_id, fanclub_id: original.reference_id, status: 'active' });
        for (const subscription of subscriptions) await base44.asServiceRole.entities.Subscription.update(subscription.id, { status: 'cancelled', cancelled_at: new Date().toISOString() });
      }
      return Response.json({ success: true, transaction: tx, wallet: { ...wallet, available_balance: after } });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminFlashPayWalletService]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});