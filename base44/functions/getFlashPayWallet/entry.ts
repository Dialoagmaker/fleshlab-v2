import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

async function getOrCreateWallet(base44, userId) {
  const wallets = await base44.entities.FlashPayWallet.filter({ user_id: userId });
  if (wallets.length > 0) {
    const candidates = wallets.filter(wallet => wallet.status !== 'closed');
    return (candidates.length ? candidates : wallets).sort((a, b) => ((b.available_balance || 0) + (b.pending_balance || 0) + (b.lifetime_deposited || 0)) - ((a.available_balance || 0) + (a.pending_balance || 0) + (a.lifetime_deposited || 0)))[0];
  }
  const now = new Date().toISOString();
  return await base44.entities.FlashPayWallet.create({
    user_id: userId,
    currency: 'usd',
    available_balance: 0,
    pending_balance: 0,
    lifetime_deposited: 0,
    lifetime_spent: 0,
    status: 'active',
    created_at: now,
    updated_at: now,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const filter = body.filter || 'all';
    const wallet = await getOrCreateWallet(base44, user.id);
    let transactions = await base44.entities.FlashPayTransaction.filter({ wallet_id: wallet.id }, '-created_date', 100);

    if (filter !== 'all') {
      if (filter === 'purchases') transactions = transactions.filter(t => ['video_purchase', 'subscription_purchase', 'fanclub_purchase'].includes(t.transaction_type));
      else if (filter === 'pending' || filter === 'failed') transactions = transactions.filter(t => t.status === filter);
      else transactions = transactions.filter(t => t.transaction_type === filter || t.transaction_type === filter.slice(0, -1));
    }

    return Response.json({
      wallet,
      transactions,
      balance: {
        available: wallet.available_balance || 0,
        pending: wallet.pending_balance || 0,
        currency: wallet.currency || 'usd',
      },
    });
  } catch (error) {
    console.error('[getFlashPayWallet]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});