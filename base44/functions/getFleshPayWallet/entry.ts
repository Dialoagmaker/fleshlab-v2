/**
 * getFleshPayWallet — Backend Function
 *
 * Returns the user's FleshPayWallet + last 20 ledger entries.
 * Auto-creates wallet on first access with zero balance.
 * User can only access their own wallet.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // Find existing wallet
    let wallets = await base44.entities.FleshPayWallet.filter({ user_id: user.id });
    let wallet;

    if (wallets.length === 0) {
      // Auto-create wallet on first access
      wallet = await base44.entities.FleshPayWallet.create({
        user_id: user.id,
        balance_usd: 0,
        currency: 'usd',
        status: 'active',
        lifetime_topups_usd: 0,
        lifetime_spends_usd: 0,
      });
      console.log('[getFleshPayWallet] Auto-created wallet for user:', user.id);
    } else {
      wallet = wallets[0];
    }

    // Get last 20 ledger entries for this wallet
    const ledger = await base44.entities.FleshPayLedger.filter(
      { wallet_id: wallet.id },
      '-created_date',
      20
    );

    return Response.json({
      wallet,
      ledger,
    });
  } catch (err) {
    console.error('[getFleshPayWallet]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});