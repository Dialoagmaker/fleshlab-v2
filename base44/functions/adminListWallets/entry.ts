/**
 * adminListWallets — Admin-Only Wallet Data Access
 *
 * Returns all FleshPay wallets with optional detail.
 * Server-side admin check prevents unauthorized access even if
 * frontend guards are bypassed.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { walletId, includeLedger, includePurchases } = body;

    // ── Single wallet detail ────────────────────────────────────────────
    if (walletId) {
      const wallet = await base44.asServiceRole.entities.FleshPayWallet.get(walletId);

      let ledger = [];
      let purchases = [];

      if (includeLedger) {
        ledger = await base44.asServiceRole.entities.FleshPayLedger.filter(
          { wallet_id: walletId },
          '-created_date',
          50
        );
      }

      if (includePurchases) {
        purchases = await base44.asServiceRole.entities.FleshPayPurchase.filter(
          { wallet_id: walletId },
          '-created_date',
          50
        );
      }

      return Response.json({ success: true, wallet, ledger, purchases });
    }

    // ── All wallets list ─────────────────────────────────────────────────
    const wallets = await base44.asServiceRole.entities.FleshPayWallet.list('-updated_date', 200);

    return Response.json({
      success: true,
      wallets,
      total: wallets.length,
    });
  } catch (err) {
    console.error('[adminListWallets]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});