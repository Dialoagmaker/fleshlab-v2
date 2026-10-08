import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLoyalFansTimestamp } from './loyalfans-timestamps.js';
import { normalizeLoyalFansFulfillmentRecord } from './loyalfans-fulfillment-adapter.js';
import { normalizeLoyalFansTransaction } from './loyalfans-transactions.js';

const observed = (date = '2026-07-22 20:24:19', timezone = 'UTC') => ({ date, timezone_type: 3, timezone });

test('ISO strings and observed UTC objects normalize to the same canonical instant', () => {
  assert.equal(normalizeLoyalFansTimestamp('2026-07-22T20:24:19Z'), '2026-07-22T20:24:19.000Z');
  assert.equal(normalizeLoyalFansTimestamp(observed()), '2026-07-22T20:24:19.000Z');
  assert.equal(normalizeLoyalFansTimestamp(observed('2026-07-22 20:24:19.123456')), '2026-07-22T20:24:19.123Z');
  assert.equal(normalizeLoyalFansTimestamp('2026-07-22T22:24:19+02:00'), '2026-07-22T20:24:19.000Z');
});

test('named timezone and numeric offset timestamps respect the upstream timezone', () => {
  assert.equal(normalizeLoyalFansTimestamp(observed('2026-07-22 22:24:19', 'Europe/Berlin')), '2026-07-22T20:24:19.000Z');
  assert.equal(normalizeLoyalFansTimestamp(observed('2026-01-22 21:24:19', 'Europe/Berlin')), '2026-01-22T20:24:19.000Z');
  assert.equal(normalizeLoyalFansTimestamp({date:'2026-07-22 22:24:19',timezone_type:1,timezone:'+02:00'}), '2026-07-22T20:24:19.000Z');
});

test('missing optional timestamps stay null; required dates are never invented', () => {
  for (const value of [undefined, null, '']) {
    assert.equal(normalizeLoyalFansTimestamp(value), null);
    assert.throws(() => normalizeLoyalFansTimestamp(value, {required:true}), {code:'INVALID_LOYALFANS_TIMESTAMP'});
  }
});

test('malformed dates, zones, wire objects and ambiguous DST times fail closed', () => {
  for (const value of [{}, [], 0, {date:'2026-07-22 20:24:19'}, {...observed(), timezone_type:'3'},
    {...observed(),timezone_type:2}, observed('2026-02-30 20:24:19'), observed('2026-07-22 24:24:19'),
    observed('2026-07-22 20:24:19','invalid-zone'), observed('2026-03-29 02:30:00','Europe/Berlin'),
    observed('2026-10-25 02:30:00','Europe/Berlin'), {...observed(), date:null}, {...observed(),timezone:null},
    '2026-02-30T20:24:19Z', '2026-07-22T24:00:00Z', '2026-07-22 20:24:19']) {
    assert.throws(() => normalizeLoyalFansTimestamp(value), {code:'INVALID_LOYALFANS_TIMESTAMP'});
  }
});

test('transaction and fulfillment normalizers share the observed timestamp format without invented finality', () => {
  const row={id:'neutral-transaction-0000001',type:'clip_store',member:{uid:'neutral-buyer-000000000001'},charge:1.99,
    payout:1.59,fee:0.4,rate:80,created_at:observed(),attached_to:{uid:'neutral-content-0000000001'}};
  assert.equal(normalizeLoyalFansTransaction(row).purchased_at,'2026-07-22T20:24:19.000Z');
  const sale=normalizeLoyalFansFulfillmentRecord(row,{settlementCurrency:'USD'});
  assert.equal(sale.provider_transaction_timestamp,'2026-07-22T20:24:19.000Z');
  assert.equal(sale.finality,'FINALITY_UNKNOWN');
  assert.throws(()=>normalizeLoyalFansFulfillmentRecord({...row,created_at:{} }),{code:'MEDIA_LF_TIMESTAMP_REQUIRED'});
});
