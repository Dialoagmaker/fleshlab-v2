export class V3CommerceService {
  constructor(db) { this.db = db; }
  async overview() {
    const counts = await this.db.query(`SELECT
      (SELECT count(*)::int FROM v3_commerce_customers) customers,
      (SELECT count(*)::int FROM v3_commerce_orders) orders,
      (SELECT count(*)::int FROM v3_commerce_subscriptions) subscriptions,
      (SELECT count(*)::int FROM v3_commerce_payments) payments,
      (SELECT count(*)::int FROM v3_commerce_wallets) wallets,
      (SELECT count(*)::int FROM v3_creator_earnings) creator_earnings,
      (SELECT count(*)::int FROM v3_payout_requests) payout_requests`);
    const recordCounts = counts.rows[0];
    const readiness = [
      ['customers','Customers',recordCounts.customers ? 'READ_ONLY_DATA' : 'NO_MIGRATED_DATA',recordCounts.customers ? 'Self-hosted customer records are available for read-only operations.' : 'No self-hosted customer records have been migrated.'],
      ['orders','Orders',recordCounts.orders ? 'READ_ONLY_DATA' : 'NO_MIGRATED_DATA',recordCounts.orders ? 'Imported order records are read only.' : 'No self-hosted order records are available.'],
      ['subscriptions','Subscriptions',recordCounts.subscriptions ? 'READ_ONLY_DATA' : 'NO_MIGRATED_DATA',recordCounts.subscriptions ? 'Imported subscription records are read only.' : 'No self-hosted subscription records are available.'],
      ['payments','Payments','NOT_CONFIGURED','A verified provider connection and signed webhook processing are required before payment operations can be enabled.'],
      ['wallet','Wallet / ledger','NOT_INITIALIZED','The transactional ledger schema exists, but no financial data was migrated and writes are disabled.'],
      ['earnings','Creator earnings',recordCounts.creator_earnings ? 'READ_ONLY_DATA' : 'NO_MIGRATED_DATA',recordCounts.creator_earnings ? 'Imported earnings are available read only.' : 'No creator earnings data has been migrated.'],
      ['payouts','Payouts','DISABLED','Provider connection, approval workflow and reconciliation are required before any payout action.']
    ].map(([key,label,state,detail]) => ({ key,label,state,detail }));
    return { record_counts: recordCounts, readiness, providers: [
      { key:'nowpayments',label:'NOWPayments',state:'NOT_CONFIGURED',detail:'No verified self-hosted credentials or webhook endpoint are configured.' },
      { key:'ccbill',label:'CCBill',state:'NOT_CONFIGURED',detail:'No verified self-hosted credentials or callback configuration are configured.' },
      { key:'segpay',label:'Segpay',state:'NOT_CONFIGURED',detail:'No verified self-hosted credentials or callback configuration are configured.' }
    ], requirements: ['A verified payment-provider account and credentials','Signed webhook verification with replay protection','Idempotency keys and reconciliation for every provider event','A reviewed financial-data migration with control totals','A dual-control payout approval and execution process'] };
  }
}
