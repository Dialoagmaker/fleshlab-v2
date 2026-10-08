import test from 'node:test';
import assert from 'node:assert/strict';
import { LoyalFansProviderClient, LOYALFANS_TRANSACTION_HISTORY_REQUEST, safeResponseShape } from './loyalfans-provider-client.js';
import { matchLoyalFansTransactionToCatalogue, planLoyalFansTransactionReconciliation } from './loyalfans-transactions.js';

const transactionId = '2a8b26a3323739b7bebb9e11';
const memberUid = 'aOwp_2FIvC8yXcbOVxEMv3O8onUkBaV0t2qCZNRSbm5UQ';
const contentUid = '927TrUAjyCHPre6_2FIxNh95AeR_2Bk0NBxNAk9baUD';
const responseBody = {
  success: true,
  httpCode: 200,
  page_meta: { total: 1, per_page: 10, current_page: 1, last_page: 1, from: 1, to: 1 },
  data: [{
    id: transactionId,
    type: 'clip_store',
    charge: '12.99', payout: '10.39', fee: '2.60', rate: 80,
    created_at: '2026-08-23T16:58:11.000000Z',
    member: { uid: memberUid, slug: 'redacted-member' },
    attached_to: { uid: contentUid, slug: 'redacted-content', short_url: 'https://tinylf.com/redactedClip' }
  }]
};
const fakeCookie = 'NEXOSESSION=test-jwt-not-a-real-token; XSRF-TOKEN=test-xsrf-cookie-not-a-real-token';
const fakeXsrf = 'test-xsrf-not-a-real-token';
const fakeBearer = 'test-jwt-not-a-real-token';

function transactionRecord(id) {
  return { ...responseBody.data[0], id };
}

function observedGroupedResponse(groups, overrides = {}) {
  return {
    success: true,
    httpCode: 200,
    page_meta: { total: 1, per_page: 10, current_page: 1, last_page: 1, from: 1, to: 1 },
    transactions: groups,
    ...overrides
  };
}

async function parseResponse(payload) {
  const client = new LoyalFansProviderClient({
    enabled: true,
    environment: 'test',
    cookieHeader: fakeCookie,
    xsrfToken: fakeXsrf,
    bearerToken: fakeBearer,
    fetchImpl: async () => new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } })
  });
  return client.listTransactions({ dateFrom: '2026-08-22', dateTo: '2026-08-24' });
}

test('uses the confirmed POST request shape without logging or persisting runtime credentials', async () => {
  let call;
  const client = new LoyalFansProviderClient({
    enabled: true,
    environment: 'test',
    cookieHeader: fakeCookie,
    xsrfToken: fakeXsrf,
    bearerToken: fakeBearer,
    fetchImpl: async (url, options) => {
      call = { url, options };
      return new Response(JSON.stringify(responseBody), { status: 200, headers: { 'content-type': 'application/json' } });
    }
  });
  const result = await client.listTransactions({ dateFrom: '2026-08-22', dateTo: '2026-08-24' });
  assert.equal(call.url, 'https://www.loyalfans.com/api/v2/funds/transactions-history/list?ngsw-bypass=true');
  assert.equal(call.url, LOYALFANS_TRANSACTION_HISTORY_REQUEST.url);
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.headers.accept, 'application/json, text/plain, */*');
  assert.equal(call.options.headers['content-type'], 'application/json');
  assert.equal(call.options.headers.cookie, fakeCookie);
  assert.equal(call.options.headers['x-api-version'], '3.4.4');
  assert.equal(call.options.headers.authorization, `Bearer ${fakeBearer}`);
  assert.equal(call.options.headers['x-xsrf-token'], fakeXsrf);
  assert.equal(call.options.headers['x-api-version'], '3.4.4');
  assert.equal(call.options.headers.origin, 'https://www.loyalfans.com');
  assert.equal(call.options.headers.referer, 'https://www.loyalfans.com/settings/earnings/statements');
  assert.deepEqual(JSON.parse(call.options.body), { page: 1, limit: 10, date_from: '2026-08-22', date_to: '2026-08-24', withCalendarAddons: true });
  assert.equal(result.http_status, 200);
  assert.equal(result.transactions[0].provider_content_uid, contentUid);
});

test('completes the local transaction pipeline and blocks before entitlement without buyer identity linking', async () => {
  const client = new LoyalFansProviderClient({
    enabled: true, environment: 'test', cookieHeader: fakeCookie, xsrfToken: fakeXsrf, bearerToken: fakeBearer,
    fetchImpl: async () => new Response(JSON.stringify(responseBody), { status: 200 })
  });
  const transaction = (await client.listTransactions({ dateFrom: '2026-08-01', dateTo: '2026-08-31' })).transactions[0];
  const match = matchLoyalFansTransactionToCatalogue(transaction, [{ provider: 'loyalfans', external_content_uid: contentUid, fleshlab_video_id: 'video-42' }]);
  const plan = planLoyalFansTransactionReconciliation(match);
  assert.deepEqual(plan, {
    action: 'blocked', reason: 'UNLINKED_LOYALFANS_MEMBER',
    idempotency_key: `loyalfans:transaction:${transactionId}`,
    provider_member_uid: memberUid
  });
});

test('flattens one observed date group containing one transaction', async () => {
  const result = await parseResponse(observedGroupedResponse([
    { dateKey: '2026-08-23', transactions: [transactionRecord(transactionId)] }
  ]));
  assert.equal(result.transactions.length, 1);
  assert.equal(result.transactions[0].provider_transaction_id, transactionId);
});

test('flattens multiple observed date groups without changing transaction field contents', async () => {
  const firstId = '2a8b26a3323739b7bebb9e12';
  const secondId = '2a8b26a3323739b7bebb9e13';
  const result = await parseResponse(observedGroupedResponse([
    { dateKey: '2026-08-22', transactions: [transactionRecord(firstId)] },
    { dateKey: '2026-08-23', transactions: [transactionRecord(secondId)] }
  ]));
  assert.deepEqual(result.transactions.map(item => item.provider_transaction_id), [firstId, secondId]);
  assert.equal(result.transactions[0].provider_content_uid, contentUid);
});

test('flattens multiple transactions within one observed date group', async () => {
  const firstId = '2a8b26a3323739b7bebb9e14';
  const secondId = '2a8b26a3323739b7bebb9e15';
  const result = await parseResponse(observedGroupedResponse([
    { dateKey: '2026-08-23', transactions: [transactionRecord(firstId), transactionRecord(secondId)] }
  ]));
  assert.deepEqual(result.transactions.map(item => item.provider_transaction_id), [firstId, secondId]);
});

test('accepts an empty observed transactions array', async () => {
  const result = await parseResponse(observedGroupedResponse([]));
  assert.deepEqual(result.transactions, []);
});

for (const [name, payload] of [
  ['malformed date group', observedGroupedResponse([{ dateKey: 20260823, transactions: [] }])],
  ['missing nested transactions array', observedGroupedResponse([{ dateKey: '2026-08-23' }])],
  ['malformed page_meta', observedGroupedResponse([], { page_meta: { total: 1 } })],
  ['success not true', observedGroupedResponse([], { success: false })],
  ['httpCode not 200', observedGroupedResponse([], { httpCode: 201 })]
]) {
  test(`rejects ${name}`, async () => {
    await assert.rejects(() => parseResponse(payload), { code: 'LOYALFANS_RESPONSE_VALIDATION_FAILED' });
  });
}

test('fails closed when disabled, observed auth material is incomplete, or response schema is malformed without exposing secrets', async () => {
  const disabled = new LoyalFansProviderClient({ fetchImpl: async () => { throw new Error('must not call'); } });
  await assert.rejects(() => disabled.listTransactions({ dateFrom: '2026-08-01', dateTo: '2026-08-31' }), { code: 'LOYALFANS_CLIENT_DISABLED' });
  const missingAuth = new LoyalFansProviderClient({ enabled: true, environment: 'test', cookieHeader: fakeCookie, xsrfToken: fakeXsrf, fetchImpl: async () => { throw new Error('must not call'); } });
  await assert.rejects(async () => {
    try {
      await missingAuth.listTransactions({ dateFrom: '2026-08-01', dateTo: '2026-08-31' });
    } catch (error) {
      assert.equal(error.message.includes(fakeCookie), false);
      assert.equal(error.message.includes(fakeXsrf), false);
      assert.equal(error.message.includes(fakeBearer), false);
      throw error;
    }
  }, { code: 'LOYALFANS_AUTH_NOT_CONFIGURED' });
  const sensitiveMalformedPayload = {
    success: true,
    httpCode: 200,
    data: { items: [{ id: 'transaction-description-must-not-appear', buyer: 'test-user@example.invalid', token: fakeBearer }] },
    creator_note: `cookie=${fakeCookie}`
  };
  const malformed = new LoyalFansProviderClient({ enabled: true, environment: 'test', cookieHeader: fakeCookie, xsrfToken: fakeXsrf, bearerToken: fakeBearer, fetchImpl: async () => new Response(JSON.stringify(sensitiveMalformedPayload), { status: 200, headers: { 'content-type': 'application/json' } }) });
  await assert.rejects(async () => {
    try {
      await malformed.listTransactions({ dateFrom: '2026-08-01', dateTo: '2026-08-31' });
    } catch (error) {
      assert.equal(error.code, 'LOYALFANS_RESPONSE_VALIDATION_FAILED');
      assert.deepEqual(error.diagnostics.response_shape, safeResponseShape(sensitiveMalformedPayload));
      const diagnosticText = JSON.stringify(error.diagnostics);
      assert.equal(diagnosticText.includes('transaction-description-must-not-appear'), false);
      assert.equal(diagnosticText.includes('test-user@example.invalid'), false);
      assert.equal(diagnosticText.includes(fakeBearer), false);
      assert.equal(diagnosticText.includes(fakeCookie), false);
      throw error;
    }
  }, { code: 'LOYALFANS_RESPONSE_VALIDATION_FAILED' });
});

test('production client requires a configured creator User-Agent', async () => {
  const client = LoyalFansProviderClient.fromRuntimeEnvironment({
    NODE_ENV: 'production', LOYALFANS_PROVIDER_CLIENT_ENABLED: 'true',
    LOYALFANS_CREATOR_COOKIE_HEADER: fakeCookie,
    LOYALFANS_XSRF_TOKEN: fakeXsrf,
    LOYALFANS_CREATOR_BEARER_TOKEN: fakeBearer
  }, { fetchImpl: async () => { throw Error('network must remain disabled'); } });
  await assert.rejects(() => client.listTransactions({ dateFrom: '2026-08-01', dateTo: '2026-08-31' }),
    { code: 'LOYALFANS_AUTH_NOT_CONFIGURED' });
});

test('response shape diagnostics contain only object keys, types, and array lengths', () => {
  assert.deepEqual(safeResponseShape({ data: [{ id: 'must-not-appear', amount: 12.99 }], page_meta: { total: 1 } }), {
    type: 'object',
    keys: ['data', 'page_meta'],
    properties: {
      data: {
        type: 'array',
        length: 1,
        first_item: {
          type: 'object',
          keys: ['id', 'amount'],
          properties: { id: { type: 'string' }, amount: { type: 'number' } }
        }
      },
      page_meta: { type: 'object', keys: ['total'], properties: { total: { type: 'number' } } }
    }
  });
});

test('explicitly supplied fake runtime auth passes the local configuration guard without a network call', () => {
  const client = new LoyalFansProviderClient({
    enabled: true,
    environment: 'test',
    cookieHeader: fakeCookie,
    xsrfToken: fakeXsrf,
    bearerToken: fakeBearer,
    fetchImpl: async () => { throw new Error('network must not be called'); }
  });
  assert.doesNotThrow(() => client.assertReady());
});

test('legacy standalone original lookup cannot replace authoritative creator-ledger media fulfillment', async () => {
  let calls = 0;
  const client = new LoyalFansProviderClient({ enabled: true, environment: 'test', cookieHeader: fakeCookie,
    xsrfToken: fakeXsrf, bearerToken: fakeBearer, fetchImpl: async () => { calls += 1; throw new Error('must not call'); } });
  await assert.rejects(() => client.retrieveOwnedOriginal({ postUid: contentUid, videoUid: memberUid }),
    { code: 'LOYALFANS_ORIGINAL_MEDIA_NOT_SUPPORTED' });
  assert.equal(calls, 0);
});

test('D2 source reacquisition uses the confirmed Store request and exact post/media UIDs only',async()=>{
  let request;
  const item={uid:contentUid,video_object:{uid:memberUid,video_url:'https://cdn2.loyalfans.com/full.mp4?Signature=neutral-secret',
    mime:'video/mp4',duration:10,size:{width:1920,height:1080}}};
  const client=new LoyalFansProviderClient({enabled:true,environment:'test',cookieHeader:fakeCookie,xsrfToken:fakeXsrf,bearerToken:fakeBearer,
    catalogueCreatorSlug:'neutral-creator',catalogueLimit:36,
    fetchImpl:async(url,options)=>{
      request={url,options};
      return new Response(JSON.stringify({success:true,httpCode:200,list:[item],page_meta:{total:1,per_page:36,
        current_page:1,last_page:1,from:0,to:1}}),{status:200,headers:{'content-type':'application/json'}});
    }});
  const result=await client.getCatalogueFullVideoSource({postUid:contentUid,videoUid:memberUid});
  assert.equal(request.url,'https://www.loyalfans.com/api/v2/videos-store?ngsw-bypass=true');
  assert.equal(request.options.method,'POST');
  assert.deepEqual(JSON.parse(request.options.body),{slug:'neutral-creator',page:'1',limit:36,type:'video'});
  assert.equal(result.postUid,contentUid);assert.equal(result.videoUid,memberUid);assert.equal(result.sourceUrl,item.video_object.video_url);
  assert.equal(JSON.stringify(result).includes('Signature='),false);
  await assert.rejects(client.getCatalogueFullVideoSource({postUid:contentUid,videoUid:'other-neutral-media-uid-000000000'}),
    {code:'LOYALFANS_MEDIA_UID_MISMATCH'});
});

test('D2 refuses a fresh Store record that does not contain its exact full-video source',async()=>{
  const item={uid:contentUid,video_object:{uid:memberUid,mime:'video/mp4'}};
  const client=new LoyalFansProviderClient({enabled:true,environment:'test',cookieHeader:fakeCookie,xsrfToken:fakeXsrf,bearerToken:fakeBearer,
    catalogueCreatorSlug:'neutral-creator',fetchImpl:async()=>new Response(JSON.stringify({success:true,httpCode:200,list:[item],
      page_meta:{total:1,per_page:1,current_page:1,last_page:1,from:0,to:1}}),{status:200})});
  client.listAllFulfillmentTransactions=async()=>({authority:'creator_authenticated',complete:true,transactions:[]});
  await assert.rejects(client.getCatalogueFullVideoSource({postUid:contentUid,videoUid:memberUid}),
    {code:'LOYALFANS_FULL_VIDEO_SOURCE_UNAVAILABLE'});
});

test('D2 may reacquire an exact source from a fresh creator ledger row without persisting its signed URL',async()=>{
  const item={uid:contentUid,video_object:{uid:memberUid,mime:'video/mp4',duration:10,size:{width:1920,height:1080}}};
  const client=new LoyalFansProviderClient({enabled:true,environment:'test',cookieHeader:fakeCookie,xsrfToken:fakeXsrf,bearerToken:fakeBearer,
    catalogueCreatorSlug:'neutral-creator',fetchImpl:async()=>new Response(JSON.stringify({success:true,httpCode:200,list:[item],
      page_meta:{total:1,per_page:1,current_page:1,last_page:1,from:0,to:1}}),{status:200})});
  let range;
  const source='https://cdn2.loyalfans.com/full.mp4?Signature=neutral-ledger-secret';
  const media={uid:memberUid,mime:'video/mp4',duration:10};Object.defineProperty(media,'video_url',{value:source,enumerable:false});
  client.listAllFulfillmentTransactions=async value=>{range=value;return{authority:'creator_authenticated',complete:true,
    transactions:[{id:'neutral-ledger-transaction-0001',type:'clip_store',attached_to:{uid:contentUid,video_object:media}}]};};
  const result=await client.getCatalogueFullVideoSource({postUid:contentUid,videoUid:memberUid,dateFrom:'2026-01-01'});
  assert.deepEqual(range,{dateFrom:'2026-01-01',dateTo:new Date().toISOString().slice(0,10)});
  assert.equal(result.sourceUrl,source);assert.equal(JSON.stringify(result).includes('Signature='),false);
});

test('upstream diagnostics redact signed media URLs from provider errors',async()=>{
  const client=new LoyalFansProviderClient({enabled:true,environment:'test',cookieHeader:fakeCookie,xsrfToken:fakeXsrf,bearerToken:fakeBearer,
    fetchImpl:async()=>new Response(JSON.stringify({success:false,httpCode:500,
      message:'neutral failure https://media.example.test/source?sig=must-never-persist'}),{status:500})});
  await assert.rejects(client.listTransactions({dateFrom:'2026-08-01',dateTo:'2026-08-31'}),error=>{
    const diagnostic=JSON.stringify(error.diagnostics);assert.equal(diagnostic.includes('must-never-persist'),false);
    assert.equal(diagnostic.includes('media.example.test'),false);return true;
  });
});

async function failureFor(responseOrError) {
  const client = new LoyalFansProviderClient({
    enabled: true, environment: 'test', cookieHeader: fakeCookie, xsrfToken: fakeXsrf, bearerToken: fakeBearer,
    fetchImpl: async () => {
      if (responseOrError instanceof Error) throw responseOrError;
      return responseOrError;
    }
  });
  try {
    await client.listTransactions({ dateFrom: '2026-08-22', dateTo: '2026-08-24' });
  } catch (error) {
    return error;
  }
  throw new Error('Expected client failure.');
}

for (const status of [401, 403, 419, 422, 500]) {
  test(`reports safe HTTP diagnostics for ${status} without exposing runtime credentials`, async () => {
    const error = await failureFor(new Response(JSON.stringify({ code: `HTTP_${status}`, message: `Rejected Bearer ${fakeBearer}; NEXOSESSION=${fakeBearer}; XSRF-TOKEN=${fakeXsrf}` }), { status, statusText: 'Rejected', headers: { 'content-type': 'application/json; charset=utf-8' } }));
    assert.equal(error.code, [401,403,419].includes(status) ? 'LOYALFANS_REAUTH_REQUIRED' : 'LOYALFANS_REQUEST_FAILED');
    assert.deepEqual(error.diagnostics, [401,403,419].includes(status) ? {
      failure_stage: 'auth', request_url: 'https://www.loyalfans.com/api/v2/funds/transactions-history/list?ngsw-bypass=true', request_path: '/api/v2/funds/transactions-history/list', request_method: 'POST', http_status: status, http_status_text: 'Rejected', response_content_type: 'application/json; charset=utf-8'
    } : {
      failure_stage: 'http', request_url: 'https://www.loyalfans.com/api/v2/funds/transactions-history/list?ngsw-bypass=true', request_path: '/api/v2/funds/transactions-history/list', request_method: 'POST', http_status: status, http_status_text: 'Rejected', response_content_type: 'application/json; charset=utf-8', provider_error_code: `HTTP_${status}`, provider_error_message: 'Rejected Bearer [REDACTED]; NEXOSESSION=[REDACTED]; XSRF-TOKEN=[REDACTED]'
    });
    assert.equal(JSON.stringify(error).includes(fakeBearer), false);
    assert.equal(JSON.stringify(error).includes(fakeXsrf), false);
    assert.equal(error.message.includes(fakeCookie), false);
  });
}

test('reports safe HTTP diagnostics for non-JSON failures', async () => {
  const error = await failureFor(new Response('<html>gateway failure</html>', { status: 500, statusText: 'Gateway Failure', headers: { 'content-type': 'text/html' } }));
  assert.equal(error.code, 'LOYALFANS_REQUEST_FAILED');
  assert.deepEqual(error.diagnostics, {
    failure_stage: 'http', request_url: 'https://www.loyalfans.com/api/v2/funds/transactions-history/list?ngsw-bypass=true', request_path: '/api/v2/funds/transactions-history/list', request_method: 'POST', http_status: 500, http_status_text: 'Gateway Failure', response_content_type: 'text/html'
  });
});

test('reports safe network and JSON-parse failures without exposing runtime credentials', async () => {
  const network = await failureFor(new Error(`network rejected Bearer ${fakeBearer}`));
  assert.equal(network.code, 'LOYALFANS_NETWORK_FAILED');
  assert.equal(network.diagnostics.failure_stage, 'network');
  assert.equal(JSON.stringify(network).includes(fakeBearer), false);
  const json = await failureFor(new Response('not json', { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } }));
  assert.equal(json.code, 'LOYALFANS_JSON_PARSE_FAILED');
  assert.deepEqual(json.diagnostics, {
    failure_stage: 'json-parse', request_url: 'https://www.loyalfans.com/api/v2/funds/transactions-history/list?ngsw-bypass=true', request_path: '/api/v2/funds/transactions-history/list', request_method: 'POST', http_status: 200, http_status_text: 'OK', response_content_type: 'application/json'
  });
});
