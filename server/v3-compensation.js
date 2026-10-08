import { HttpError } from './errors.js';

export const STANDARD_PERFORMER_SHARE = 30;
export const STANDARD_STUDIO_SHARE = 70;
export const MINIMUM_PAYOUT_MINOR = 5000;

export function calculateRevenueShare({ eligibleRevenueMinor, adjustmentsMinor = 0, performerSharePercentage = STANDARD_PERFORMER_SHARE }) {
  const eligible = Number(eligibleRevenueMinor);
  const adjustments = Number(adjustmentsMinor);
  const share = Number(performerSharePercentage);
  if (!Number.isSafeInteger(eligible) || eligible < 0 || !Number.isSafeInteger(adjustments) || share < 0 || share > 100) throw new HttpError(422, 'INVALID_COMPENSATION_INPUT', 'Compensation inputs are invalid.');
  const base = Math.max(0, eligible + adjustments);
  const performer = Math.floor(base * share / 100);
  return { eligible_revenue_minor: eligible, adjustments_minor: adjustments, revenue_share_base_minor: base, performer_share_percentage: share, studio_share_percentage: 100 - share, performer_amount_minor: performer, studio_amount_minor: base - performer };
}

export function allocatePerformerPool(poolMinor, allocations) {
  const pool = Number(poolMinor);
  if (!Number.isSafeInteger(pool) || pool < 0 || !Array.isArray(allocations) || !allocations.length) throw new HttpError(422, 'INVALID_ALLOCATION', 'A non-empty valid allocation is required.');
  const total = allocations.reduce((sum, item) => sum + Number(item.percentage), 0);
  if (Math.abs(total - 100) > 0.0001 || allocations.some(item => !item.performer_legacy_id || Number(item.percentage) < 0)) throw new HttpError(422, 'INVALID_ALLOCATION', 'Performer allocations must total 100%.');
  return allocations.map(item => ({ ...item, amount_minor: Math.floor(pool * Number(item.percentage) / 100) }));
}

export function settlementPolicy(kind) {
  if (kind === 'live_cam') return { frequency: '14_days', payout_days: [5, 20] };
  return { frequency: 'monthly', payout_days: [5, 20] };
}

export function applyCarryForward(amountMinor, carryForwardMinor = 0, minimumPayoutMinor = MINIMUM_PAYOUT_MINOR) {
  const amount = Number(amountMinor) + Number(carryForwardMinor);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new HttpError(422, 'INVALID_BALANCE', 'Balance is invalid.');
  return amount < minimumPayoutMinor ? { payable_amount_minor: 0, carry_forward_minor: amount } : { payable_amount_minor: amount, carry_forward_minor: 0 };
}

export class V3CompensationService {
  constructor(db) { this.db = db; }
  async overview() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM v3_compensation_plans) plans,
      (SELECT count(*)::int FROM v3_compensation_assignments) assignments,
      (SELECT count(*)::int FROM v3_earnings_ledger) ledger_events,
      (SELECT count(*)::int FROM v3_compensation_settlements) settlements,
      (SELECT count(*)::int FROM v3_compensation_settlements WHERE status IN ('open','calculated','reviewed','payable')) open_settlements`);
    return { counts: result.rows[0], standard: { performer_share_percentage: 30, studio_share_percentage: 70, currency: 'USD', minimum_payout_minor: 5000, recorded_frequency: 'monthly', live_frequency: '14_days', payout_days: [5, 20] }, financial_data_state: result.rows[0].ledger_events ? 'REAL_DATA' : 'NO_PRODUCTION_FINANCIAL_DATA', actions_enabled: false };
  }
  async creatorStatement(user) {
    const creator = await this.db.query('SELECT id FROM v3_creator_records WHERE user_id=$1', [user.id]);
    if (!creator.rowCount) return { records: [], financial_data_state: 'NO_CREATOR_RECORD' };
    const rows = await this.db.query(`SELECT id,event_type,source_type,source_reference,original_currency,original_amount_minor,converted_usd_amount_minor,eligible_revenue_minor,revenue_share_base_minor,performer_share_percentage,performer_amount_minor,adjustment_reason,settlement_period_start,settlement_period_end,created_at FROM v3_earnings_ledger WHERE creator_id=$1 ORDER BY created_at DESC`, [creator.rows[0].id]);
    return { records: rows.rows, financial_data_state: rows.rowCount ? 'REAL_DATA' : 'NO_PRODUCTION_FINANCIAL_DATA' };
  }
}
