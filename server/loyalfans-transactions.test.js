import test from 'node:test';
import assert from 'node:assert/strict';
import { matchLoyalFansTransactionToCatalogue, normalizeLoyalFansTransaction, planLoyalFansTransactionReconciliation } from './loyalfans-transactions.js';

const transactionId = '1a8b26a3323739b7bebb9e11';
const memberUid = 'pOwp_2FIvC8yXcbOVxEMv3O8onUkBaV0t2qCZNRSbm5UQ';
const contentUid = '827TrUAjyCHPre6_2FIxNh95AeR_2Bk0NBxNAk9baUD';
const capture = overrides => ({
  id: transactionId,
  transaction_type: 'clip_store',
  charge: '12.99',
  payout: '10.39',
  fee: '2.60',
  rate: '80',
  created_at: '2026-08-23T16:58:11.000000Z',
  member: { uid: memberUid, slug: 'redacted-member' },
  attached_to: { uid: contentUid, slug: 'redacted-product', short_url: 'https://tinylf.com/redactedProduct' },
  ...overrides
});

test('normalizes a redacted creator clip-store transaction without title identity or credentials', () => {
  const result = normalizeLoyalFansTransaction(capture(), { observedAt: '2026-10-01T12:00:00.000Z' });
  assert.equal(result.provider, 'loyalfans');
  assert.equal(result.provider_transaction_id, transactionId);
  assert.equal(result.provider_member_uid, memberUid);
  assert.equal(result.provider_content_uid, contentUid);
  assert.equal(result.gross_amount_minor, 1299);
  assert.equal(result.creator_payout_minor, 1039);
  assert.equal(result.provider_fee_minor, 260);
  assert.equal(result.currency, null);
  assert.equal('title' in result, false);
  assert.equal(JSON.stringify(result).match(/cookie|authorization|token/i), null);
});

test('Joe-style creator sale records exact member, post, price and transaction ID without requiring a slug or URL', () => {
  const row = { id: transactionId, type: 'clip_store', charge: '1.99',
    created_at: '2026-10-06T12:00:00Z', member: { name: 'Joe Test', uid: memberUid },
    attached_to: { uid: contentUid } };
  const result = normalizeLoyalFansTransaction(row);
  assert.equal(result.provider_member_uid, memberUid);
  assert.equal(result.provider_content_uid, contentUid);
  assert.equal(result.provider_transaction_id, transactionId);
  assert.equal(result.gross_amount_minor, 199);
  assert.equal(result.provider_content_url, null);
  assert.equal(result.currency, null);
  assert.equal(result.raw_provider_status, null);
  assert.equal('name' in result, false);
});

test('matches a clip-store purchase only by the canonical LoyalFans content UID', () => {
  const transaction = normalizeLoyalFansTransaction(capture());
  const result = matchLoyalFansTransactionToCatalogue(transaction, [{ provider: 'loyalfans', external_content_uid: contentUid, fleshlab_video_id: 'fleshlab-video-42', title: 'Not used' }]);
  assert.equal(result.matched, true);
  assert.equal(result.fleshlab_video_id, 'fleshlab-video-42');
  assert.deepEqual(matchLoyalFansTransactionToCatalogue(transaction, [{ provider: 'loyalfans', external_content_uid: 'other-content-uid-000', fleshlab_video_id: 'wrong' }]).matched, false);
});

test('rejects ambiguous UID mapping and non-clip transactions', () => {
  const transaction = normalizeLoyalFansTransaction(capture());
  assert.throws(() => matchLoyalFansTransactionToCatalogue(transaction, [
    { provider: 'loyalfans', external_content_uid: contentUid, fleshlab_video_id: 'one' },
    { provider: 'loyalfans', external_content_uid: contentUid, fleshlab_video_id: 'two' }
  ]), { code: 'AMBIGUOUS_EXTERNAL_CONTENT_MAPPING' });
  assert.throws(() => matchLoyalFansTransactionToCatalogue({ ...transaction, transaction_type: 'subscription' }, []), { code: 'UNSUPPORTED_LOYALFANS_TRANSACTION' });
});

test('uses provider transaction ID as an idempotency key and remains fail-closed without linked buyer identity', () => {
  const transaction = normalizeLoyalFansTransaction(capture());
  const match = matchLoyalFansTransactionToCatalogue(transaction, [{ provider: 'loyalfans', external_content_uid: contentUid, fleshlab_video_id: 'fleshlab-video-42' }]);
  const blocked = planLoyalFansTransactionReconciliation(match);
  assert.deepEqual(blocked, { action: 'blocked', reason: 'UNLINKED_LOYALFANS_MEMBER', idempotency_key: `loyalfans:transaction:${transactionId}`, provider_member_uid: memberUid });
  const duplicate = planLoyalFansTransactionReconciliation(match, { existingTransaction: { provider: 'loyalfans', provider_transaction_id: transactionId, provider_content_uid: contentUid } });
  assert.equal(duplicate.action, 'duplicate');
  assert.throws(() => planLoyalFansTransactionReconciliation(match, { existingTransaction: { provider: 'loyalfans', provider_transaction_id: transactionId, provider_content_uid: 'other' } }), { code: 'LOYALFANS_TRANSACTION_IDEMPOTENCY_CONFLICT' });
});

test('rejects unsafe integer transaction amounts without rounding purchase value', () => {
  assert.throws(() => normalizeLoyalFansTransaction(capture({ charge: '900719925474099.99' })), { code: 'INVALID_LOYALFANS_TRANSACTION' });
});
