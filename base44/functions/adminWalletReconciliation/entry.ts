/**
 * adminWalletReconciliation — Admin-Only Diagnostic
 *
 * Detects wallet inconsistencies:
 *   - balance_usd != ledger sum
 *   - pending/incomplete purchases
 *   - purchases without payment
 *   - payments without earnings
 *   - earnings missing test_mode if notes contain TEST
 *
 * READ-ONLY. Returns warnings only. Never auto-fixes money balances.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function formatUsd(n) {
  if (n === null || n === undefined) return '$0.00';
  return '$' + Number(n).toFixed(2);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const diagnostics = [];
    const wallets = await base44.asServiceRole.entities.FleshPayWallet.list('-updated_date', 500);

    for (const wallet of wallets) {
      const walletDiag = {
        wallet_id: wallet.id,
        user_id: wallet.user_id,
        balance_usd: wallet.balance_usd,
        status: wallet.status,
        warnings: [],
      };

      // ── Ledger sum ─────────────────────────────────────────────────────
      const ledger = await base44.asServiceRole.entities.FleshPayLedger.filter(
        { wallet_id: wallet.id, status: 'completed' },
        '-created_date',
        200
      );

      let totalCredits = 0;
      let totalDebits = 0;

      for (const entry of ledger) {
        if (entry.entry_type === 'credit') totalCredits += (entry.amount_usd || 0);
        if (entry.entry_type === 'debit') totalDebits += (entry.amount_usd || 0);
      }

      const ledgerBalance = Math.round((totalCredits - totalDebits) * 100) / 100;
      const difference = Math.round((wallet.balance_usd - ledgerBalance) * 100) / 100;

      walletDiag.total_credits = totalCredits;
      walletDiag.total_debits = totalDebits;
      walletDiag.ledger_balance = ledgerBalance;
      walletDiag.difference = difference;

      if (Math.abs(difference) > 0.001) {
        walletDiag.warnings.push({
          severity: 'error',
          code: 'BALANCE_MISMATCH',
          message: `Wallet balance ${formatUsd(wallet.balance_usd)} != ledger sum ${formatUsd(ledgerBalance)} (diff: ${formatUsd(difference)})`,
        });
      }

      // ── Pending/incomplete purchases ────────────────────────────────────
      const purchases = await base44.asServiceRole.entities.FleshPayPurchase.filter(
        { wallet_id: wallet.id },
        '-created_date',
        50
      );

      const pendingPurchases = purchases.filter(p => p.status === 'pending');
      if (pendingPurchases.length > 0) {
        walletDiag.warnings.push({
          severity: 'warning',
          code: 'PENDING_PURCHASES',
          message: `${pendingPurchases.length} purchase(s) in pending state`,
          purchase_ids: pendingPurchases.map(p => p.id),
        });
      }

      // ── Purchases without Payment ───────────────────────────────────────
      const completedPurchases = purchases.filter(p => p.status === 'completed');
      const userPayments = await base44.asServiceRole.entities.Payment.filter({
        user_id: wallet.user_id,
        payment_type: 'ppv',
      });

      for (const p of completedPurchases) {
        const hasPayment = userPayments.some(pay => {
          try {
            const meta = JSON.parse(pay.metadata || '{}');
            return meta.provider === 'fleshpay' && meta.fleshpay_purchase_id === p.id;
          } catch { return false; }
        });

        if (!hasPayment) {
          walletDiag.warnings.push({
            severity: 'error',
            code: 'PURCHASE_WITHOUT_PAYMENT',
            message: `Purchase ${p.id} ($${p.amount_usd}) has no matching Payment record`,
          });
        }
      }

      // ── Wallet topup/purchase consistency ──────────────────────────────
      const walletTopupSum = totalCredits;
      const walletSpendSum = totalDebits;
      const reportedTopups = wallet.lifetime_topups_usd || wallet.lifetime_topup_usd || 0;
      const reportedSpends = wallet.lifetime_spends_usd || wallet.lifetime_spent_usd || 0;

      if (Math.abs(reportedTopups - walletTopupSum) > 0.001) {
        walletDiag.warnings.push({
          severity: 'warning',
          code: 'TOPUP_SUM_MISMATCH',
          message: `Reported topups ${formatUsd(reportedTopups)} != ledger credits ${formatUsd(walletTopupSum)}`,
        });
      }

      if (Math.abs(reportedSpends - walletSpendSum) > 0.001) {
        walletDiag.warnings.push({
          severity: 'warning',
          code: 'SPEND_SUM_MISMATCH',
          message: `Reported spends ${formatUsd(reportedSpends)} != ledger debits ${formatUsd(walletSpendSum)}`,
        });
      }

      diagnostics.push(walletDiag);
    }

    // ── Global: payments without earnings ───────────────────────────────
    const globalWarnings = [];
    const allFleshPayPayments = await base44.asServiceRole.entities.Payment.filter(
      { payment_type: 'ppv', status: 'completed' },
      '-created_date',
      500
    );

    for (const pay of allFleshPayPayments) {
      try {
        const meta = JSON.parse(pay.metadata || '{}');
        if (meta.provider !== 'fleshpay') continue;

        const earnings = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
          source_reference_id: pay.related_entity_id,
          source_type: 'ppv_purchase',
          source_platform: 'fleshlab',
        });

        if (earnings.length === 0) {
          globalWarnings.push({
            severity: 'warning',
            code: 'PAYMENT_WITHOUT_EARNING',
            message: `Payment ${pay.id} ($${pay.amount_usd}, video ${pay.related_entity_id}) has no PerformerEarningLineItem`,
            payment_id: pay.id,
            video_id: pay.related_entity_id,
            amount_usd: pay.amount_usd,
          });
        }
      } catch { /* skip broken metadata */ }
    }

    // ── Global: earnings missing test_mode with TEST in notes ────────────
    const allEarnings = await base44.asServiceRole.entities.PerformerEarningLineItem.list('-created_date', 500);
    const testFlagWarnings = [];

    for (const earn of allEarnings) {
      if (earn.test_mode === true) continue;
      const notes = (earn.notes || '').toLowerCase();
      const desc = (earn.description || '').toLowerCase();
      if (notes.includes('test') || desc.includes('test')) {
        testFlagWarnings.push({
          severity: 'warning',
          code: 'TEST_EARNING_NOT_FLAGGED',
          message: `Earning ${earn.id} (${formatUsd(earn.gross_amount_usd)}) has TEST in notes but test_mode=false`,
          earning_id: earn.id,
          performer_id: earn.performer_id,
          amount_usd: earn.gross_amount_usd,
          notes: earn.notes,
        });
      }
    }

    // ── Summary ─────────────────────────────────────────────────────────
    const errorCount = diagnostics.reduce((sum, d) =>
      sum + d.warnings.filter(w => w.severity === 'error').length, 0);
    const warningCount = diagnostics.reduce((sum, d) =>
      sum + d.warnings.filter(w => w.severity === 'warning').length, 0);

    return Response.json({
      success: true,
      summary: {
        total_wallets: wallets.length,
        wallets_with_errors: diagnostics.filter(d => d.warnings.some(w => w.severity === 'error')).length,
        wallets_with_warnings: diagnostics.filter(d => d.warnings.some(w => w.severity === 'warning')).length,
        total_errors: errorCount,
        total_warnings: warningCount,
        global_payment_earning_warnings: globalWarnings.length,
        test_flag_warnings: testFlagWarnings.length,
      },
      diagnostics,
      global_warnings: {
        payment_without_earning: globalWarnings,
        test_earnings_not_flagged: testFlagWarnings,
      },
    });
  } catch (err) {
    console.error('[adminWalletReconciliation]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});