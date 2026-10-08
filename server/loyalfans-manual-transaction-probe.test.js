import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  HiddenInputBuffer,
  clearLoyalFansProbeSession,
  loadLoyalFansProbeSession,
  loyalFansProbeSessionPath,
  printSafeFailure,
  readAndDeleteCookieFile,
  readHidden,
  runtimeCredentialMetadata,
  safeFailureDiagnostics,
  saveLoyalFansProbeSession,
  summarizeManualTransactionProbe
} from './loyalfans-manual-transaction-probe.js';
import { LoyalFansProviderClient } from './loyalfans-provider-client.js';

const transaction = {
  provider: 'loyalfans',
  provider_transaction_id: 'test-transaction-id-0001',
  transaction_type: 'clip_store',
  provider_member_uid: 'test-member-uid-00000001',
  provider_content_uid: 'test-content-uid-0000001',
  gross_amount: '12.99',
  creator_payout: '10.39',
  purchased_at: '2026-08-23T16:58:11.000000Z'
};

test('manual probe emits a narrow verification summary and does not attempt a catalogue fallback or entitlement', async () => {
  const result = await summarizeManualTransactionProbe({ http_status: 200, transactions: [transaction] }, transaction.provider_transaction_id);
  assert.deepEqual(result, {
    http_status: 200,
    transaction_count: 1,
    expected_transaction_found: true,
    transaction: {
      provider_transaction_id: transaction.provider_transaction_id,
      transaction_type: 'clip_store',
      buyer_member_uid: transaction.provider_member_uid,
      attached_content_uid: transaction.provider_content_uid,
      gross_amount: '12.99',
      creator_payout: '10.39',
      purchased_at: '2026-08-23T16:58:11.000000Z'
    },
    catalogue_match: { status: 'UNMAPPED', reason: 'UNMAPPED_EXTERNAL_CONTENT_UID' },
    entitlement: 'NOT_ATTEMPTED'
  });
});

test('manual probe reports a repository-backed catalogue match without creating an entitlement', async () => {
  const repository = {
    findByExternalContentId: async (provider, uid) => ({
      provider,
      external_content_uid: uid,
      video_legacy_id: 'video-42',
      status: 'active'
    })
  };
  const result = await summarizeManualTransactionProbe({ http_status: 200, transactions: [transaction] }, transaction.provider_transaction_id, repository);
  assert.deepEqual(result.catalogue_match, { status: 'MATCHED', fleshlab_video_id: 'video-42' });
  assert.equal(result.entitlement, 'NOT_ATTEMPTED');
});

test('hidden input parser retains same-chunk and split bracketed paste content without terminal markers', () => {
  const sameChunk = new HiddenInputBuffer();
  assert.deepEqual(sameChunk.consume('\u001b[200~test-jwt-not-a-real-token\u001b[201~\r\n'), { value: 'test-jwt-not-a-real-token', cancelled: false, complete: true });
  const splitChunks = new HiddenInputBuffer();
  assert.equal(splitChunks.consume('\u001b[2').complete, false);
  assert.equal(splitChunks.consume('00~NEXOSESSION=test-jwt-not-a-real-token; XSRF-TOKEN=test-xsrf-not-a-real-token').complete, false);
  assert.deepEqual(splitChunks.consume('\u001b[20'), { value: 'NEXOSESSION=test-jwt-not-a-real-token; XSRF-TOKEN=test-xsrf-not-a-real-token', cancelled: false, complete: false });
  assert.deepEqual(splitChunks.consume('1~\r'), { value: 'NEXOSESSION=test-jwt-not-a-real-token; XSRF-TOKEN=test-xsrf-not-a-real-token', cancelled: false, complete: true });
});

class FakeTtyInput extends EventEmitter {
  constructor() { super(); this.isTTY = true; }
  setRawMode() {}
  resume() {}
  pause() {}
  setEncoding() {}
}

function fakeTtyOutput() { return { isTTY: true, write() {} }; }

async function pastedPrompt(input, output, chunks) {
  const answer = readHidden('hidden: ', { input, output });
  for (const chunk of chunks) input.emit('data', chunk);
  return answer;
}

test('actual sequential CLI prompt path preserves long pasted auth values and passes the provider guard without network', async () => {
  const input = new FakeTtyInput();
  const output = fakeTtyOutput();
  const confirmation = await pastedPrompt(input, output, ['\u001b[200~LOCAL-ONLY\u001b[201~\r\n']);
  const bearer = await pastedPrompt(input, output, ['\u001b[200~test-jwt-not-a-real-token.with-long-value_/+%=-.\u001b[201~\r']);
  const cookie = await pastedPrompt(input, output, ['\u001b[2', '00~NEXOSESSION=test-jwt-not-a-real-token; XSRF-TOKEN=test-xsrf-not-a-real-token; loyalXlm3=value=/+%_-.,\u001b[20', '1~\r\n']);
  const xsrf = await pastedPrompt(input, output, ['\u001b[200~test-xsrf-not-a-real-token_/+%=-.\u001b[201~\n']);
  const transactionId = await pastedPrompt(input, output, ['\u001b[200~test-transaction-id\u001b[201~\r']);
  const metadata = runtimeCredentialMetadata({ bearerToken: bearer, cookieHeader: cookie, xsrfToken: xsrf });
  assert.equal(confirmation, 'LOCAL-ONLY');
  assert.equal(transactionId, 'test-transaction-id');
  assert.deepEqual(metadata, {
    bearerPresent: true, bearerLength: bearer.length,
    cookiePresent: true, cookieLength: cookie.length,
    xsrfPresent: true, xsrfLength: xsrf.length
  });
  const client = new LoyalFansProviderClient({
    enabled: true, environment: 'test', bearerToken: bearer, cookieHeader: cookie, xsrfToken: xsrf,
    fetchImpl: async () => { throw new Error('network must not be called'); }
  });
  assert.doesNotThrow(() => client.assertReady());
});

test('runtime auth metadata detects a missing component without exposing values', () => {
  const metadata = runtimeCredentialMetadata({ bearerToken: 'test-jwt-not-a-real-token', cookieHeader: '', xsrfToken: 'test-xsrf-not-a-real-token' });
  assert.deepEqual(metadata, { bearerPresent: true, bearerLength: 25, cookiePresent: false, cookieLength: 0, xsrfPresent: true, xsrfLength: 26 });
});

test('saves and loads local-only credentials with exact owner-only modes and no credential-bearing errors', async () => {
  const homeDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'fleshlab-loyalfans-session-home-'));
  const credentials = {
    bearerToken: 'test-jwt-not-a-real-token',
    cookieHeader: 'NEXOSESSION=test-jwt-not-a-real-token; XSRF-TOKEN=test-xsrf-not-a-real-token',
    xsrfToken: 'test-xsrf-not-a-real-token'
  };
  try {
    await saveLoyalFansProbeSession(credentials, { homeDirectory });
    const filePath = loyalFansProbeSessionPath(homeDirectory);
    const directoryStat = await fs.stat(path.dirname(filePath));
    const fileStat = await fs.stat(filePath);
    assert.equal(directoryStat.mode & 0o777, 0o700);
    assert.equal(fileStat.mode & 0o777, 0o600);
    assert.deepEqual(await loadLoyalFansProbeSession({ homeDirectory }), credentials);
    await fs.chmod(filePath, 0o644);
    await assert.rejects(async () => {
      try {
        await loadLoyalFansProbeSession({ homeDirectory });
      } catch (error) {
        assert.equal(error.message.includes(credentials.bearerToken), false);
        assert.equal(error.message.includes(credentials.cookieHeader), false);
        assert.equal(error.message.includes(credentials.xsrfToken), false);
        throw error;
      }
    }, { code: 'INSECURE_LOYALFANS_SESSION_FILE' });
  } finally {
    await fs.rm(homeDirectory, { recursive: true, force: true });
  }
});

test('missing and cleared local-only sessions fail safely without retaining credentials', async () => {
  const homeDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'fleshlab-loyalfans-session-clear-'));
  const credentials = {
    bearerToken: 'test-jwt-not-a-real-token',
    cookieHeader: 'NEXOSESSION=test-jwt-not-a-real-token',
    xsrfToken: 'test-xsrf-not-a-real-token'
  };
  try {
    await assert.rejects(() => loadLoyalFansProbeSession({ homeDirectory }), { code: 'LOYALFANS_PROBE_SESSION_MISSING' });
    await saveLoyalFansProbeSession(credentials, { homeDirectory });
    assert.equal(await clearLoyalFansProbeSession({ homeDirectory }), true);
    await assert.rejects(() => fs.stat(loyalFansProbeSessionPath(homeDirectory)), { code: 'ENOENT' });
    assert.equal(await clearLoyalFansProbeSession({ homeDirectory }), false);
    await assert.rejects(() => loadLoyalFansProbeSession({ homeDirectory }), { code: 'LOYALFANS_PROBE_SESSION_MISSING' });
  } finally {
    await fs.rm(homeDirectory, { recursive: true, force: true });
  }
});

test('secure cookie-file path preserves a realistic long cookie exactly, deletes it, and reaches the mocked provider unchanged', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'fleshlab-loyalfans-test-'));
  const filePath = path.join(directory, 'cookie.txt');
  const cookie = `NEXOSESSION=${'a'.repeat(2600)}; XSRF-TOKEN=${'b'.repeat(2600)}; loyalXlm3=value=/+%_-.`;
  await fs.writeFile(filePath, `${cookie}\r\n`, { mode: 0o600 });
  await fs.chmod(filePath, 0o600);
  const received = await readAndDeleteCookieFile(filePath);
  assert.equal(received, cookie);
  assert.ok(received.length > 5000);
  await assert.rejects(() => fs.stat(filePath), { code: 'ENOENT' });
  const metadata = runtimeCredentialMetadata({ bearerToken: 'test-jwt-not-a-real-token', cookieHeader: received, xsrfToken: 'test-xsrf-not-a-real-token' });
  assert.equal(metadata.cookiePresent, true);
  assert.ok(metadata.cookieLength > 5000);
  let providerCookie = null;
  const client = new LoyalFansProviderClient({
    enabled: true,
    environment: 'test',
    bearerToken: 'test-jwt-not-a-real-token',
    cookieHeader: received,
    xsrfToken: 'test-xsrf-not-a-real-token',
    fetchImpl: async (_url, options) => {
      providerCookie = options.headers.cookie;
      return new Response(JSON.stringify({ success: true, httpCode: 200, page_meta: { total: 0, per_page: 10, current_page: 1, last_page: 1, from: 0, to: 0 }, data: [] }), { status: 200 });
    }
  });
  await client.listTransactions({ dateFrom: '2026-08-22', dateTo: '2026-08-24' });
  assert.equal(providerCookie, cookie);
  await fs.rmdir(directory).catch(() => {});
});

test('manual probe exposes only whitelisted, value-free failure diagnostics', () => {
  const diagnostics = safeFailureDiagnostics({
    diagnostics: { failure_stage: 'validation', request_url: 'https://www.loyalfans.com/api/v2/funds/transactions-history/list?ngsw-bypass=true', request_path: '/api/v2/funds/transactions-history/list', request_method: 'POST', http_status: 200, validation_code: 'INVALID_LOYALFANS_RESPONSE', response_shape: { type: 'object', keys: ['data'], properties: { data: { type: 'array', length: 1 } } }, cookie: 'test-cookie-must-not-appear' }
  });
  assert.deepEqual(diagnostics, { failure_stage: 'validation', request_url: 'https://www.loyalfans.com/api/v2/funds/transactions-history/list?ngsw-bypass=true', request_path: '/api/v2/funds/transactions-history/list', request_method: 'POST', http_status: 200, validation_code: 'INVALID_LOYALFANS_RESPONSE', response_shape: { type: 'object', keys: ['data'], properties: { data: { type: 'array', length: 1 } } } });
});

test('expired saved-session guidance is safe and does not include runtime credential values', () => {
  const secret = 'test-jwt-not-a-real-token';
  let output = '';
  printSafeFailure({
    code: 'LOYALFANS_REQUEST_FAILED',
    diagnostics: {
      failure_stage: 'http',
      http_status: 401,
      provider_error_message: `Rejected Bearer ${secret}`
    }
  }, { write: text => { output += text; } });
  assert.match(output, /Saved local session may have expired\. Run --setup again\./);
  assert.equal(output.includes(secret), false);
});
