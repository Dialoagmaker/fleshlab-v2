import test from 'node:test';
import assert from 'node:assert/strict';
import { LoyalFansCommerceAdapter, CommerceProviderRegistry } from './commerce-providers.js';
import { LoyalFansProviderClient } from './loyalfans-provider-client.js';
import { normalizeLoyalFansTransaction } from './loyalfans-transactions.js';
import { parseLoyalFansCommentProof } from './loyalfans-comment-proof.js';
import { parseLoyalFansClientPurchase } from './loyalfans-ppv-protocol.js';
import { V3StoreCommerceService } from './v3-store-commerce.js';

const memberUid = 'oDpQFtQ8yzypVS5l7B2p8fQdgjFY5jM9yuxjfWOzRUY';
const postUid = '0Qkybb8-2B8wc9XznSwOkJbvq8Ikn3xYgOheGGEnVczDg';
const commentUid = 'kkOUhHLCplQTNG8PAnddGCI97ZNk3R2JNt2o36FIihA';
const challenge = 'FL-LF-7K4P-92XM';
const transactionId = 'synthetic-test-transaction-0001';
const order = { processor:'loyalfans', linked_buyer_uid:memberUid, external_content_uid:postUid,
  total_minor:199, currency:'USD', created_at:'2026-10-06T11:00:00Z' };

test('captured Joe comment fields identify the member by UID; display fields are required metadata', () => {
  const response = { uid:commentUid, comment:challenge, created_at:'2026-10-06T11:01:00Z',
    user:{ uid:memberUid, name:'Joe Test', slug:'joetest' } };
  assert.equal(parseLoyalFansCommentProof(response,postUid,challenge,postUid).provider_member_uid,memberUid);
  assert.equal(parseLoyalFansCommentProof({...response,user:{name:'Joe Test',slug:'joetest'}},postUid,challenge,postUid),null);
  assert.equal(parseLoyalFansCommentProof({...response,comment:'other'},postUid,challenge,postUid),null);
});

test('captured Joe buy response is client evidence only',()=>{
  const buy={success:true,httpCode:200,message:'Post bought succesfully',price:1.99,is_bought:true,can_see:true};
  assert.equal(parseLoyalFansClientPurchase(buy).paymentVerified,false);
});

function sale(overrides = {}) {
  return normalizeLoyalFansTransaction({ id:transactionId, type:'clip_store', charge:'1.99', currency:'USD',
    status:'paid', created_at:'2026-10-06T11:02:00Z', member:{uid:memberUid,name:'Joe Test',slug:'joetest'},
    attached_to:{uid:postUid}, ...overrides });
}
function adapterWith(records) {
  const client = { status:()=>({status:'CONNECTED'}), listAllTransactions:async()=>({transactions:records}) };
  return new LoyalFansCommerceAdapter({providerClient:client,settlementCurrency:'USD'});
}

test('exact creator sale projects one final transaction for the existing atomic entitlement writer', async () => {
  const result = await adapterWith([sale()]).verifyTransaction(order);
  assert.deepEqual({id:result.transactionId,buyer:result.buyerUid,post:result.contentUid,amount:result.amountMinor,
    currency:result.currency,status:result.status,verified:result.verified,final:result.finalityVerified},
  {id:transactionId,buyer:memberUid,post:postUid,amount:199,currency:'USD',status:'paid',verified:true,final:true});
});

for (const [name,records] of [
  ['wrong buyer UID',[sale({member:{uid:'another-member-0000000000000001'}})]],
  ['wrong post UID',[sale({attached_to:{uid:'another-post-000000000000000001'}})]],
  ['wrong amount',[sale({charge:'2.99'})]],
  ['duplicate matching sale',[sale(),sale({id:'synthetic-test-transaction-0002'})]],
  ['missing final status',[sale({status:null})]],
  ['wrong currency',[sale({currency:'EUR'})]],
  ['purchase before order',[sale({created_at:'2026-10-06T10:59:00Z'})]]
]) test(`${name} never becomes a paid claim`,async()=>{
  await assert.rejects(()=>adapterWith(records).verifyTransaction(order),{code:'PAYMENT_REQUIRES_REVIEW'});
});

test('missing transaction ID in captured history cannot be normalized as payment proof',()=>{
  assert.throws(()=>sale({id:null}),{code:'INVALID_LOYALFANS_TRANSACTION'});
});

for(const kind of ['reimbursement','chargeback']) test(`${kind} stays an observation without original transaction linkage`,async()=>{
  const reversal=normalizeLoyalFansTransaction({id:`synthetic-${kind}-000000000001`,type:kind,
    member:{uid:memberUid},attached_to:{uid:postUid}});
  const result=await adapterWith([sale(),reversal]).verifyTransaction(order);
  assert.equal(result.status,'paid');
  assert.equal(result.reversalObservations[0].transaction_type,kind);
  assert.equal(result.reversalObservations[0].may_revoke,false);
});

test('production creator client sends configured User-Agent and reports connected state',async()=>{
  let headers;
  const client=new LoyalFansProviderClient({enabled:true,environment:'production',bearerToken:'test-bearer',
    cookieHeader:'NEXOSESSION=test-session',xsrfToken:'test-xsrf',userAgent:'FLESHLAB-Creator-Test/1.0',
    fetchImpl:async(_url,options)=>{headers=options.headers;return new Response(JSON.stringify({success:true,httpCode:200,
      page_meta:{total:0,per_page:1,current_page:1,last_page:1,from:0,to:0},transactions:[]}),
      {status:200,headers:{'content-type':'application/json'}});}});
  assert.equal(client.status().status,'UPSTREAM_ERROR');
  await client.listTransactions({dateFrom:'2026-10-06',dateTo:'2026-10-06',limit:1});
  assert.equal(headers['user-agent'],'FLESHLAB-Creator-Test/1.0');
  assert.equal(client.status().status,'CONNECTED');
});

test('expired creator credential is explicit and credential values remain absent from status',async()=>{
  const client=new LoyalFansProviderClient({enabled:true,environment:'production',bearerToken:'test-bearer',
    cookieHeader:'NEXOSESSION=test-session',xsrfToken:'test-xsrf',userAgent:'FLESHLAB-Creator-Test/1.0',
    fetchImpl:async()=>new Response('',{status:401})});
  await assert.rejects(()=>client.listTransactions({dateFrom:'2026-10-06',dateTo:'2026-10-06'}),
    {code:'LOYALFANS_REAUTH_REQUIRED'});
  assert.deepEqual(client.status(),{status:'AUTH_EXPIRED'});
  await assert.rejects(()=>client.listTransactions({dateFrom:'2026-10-06',dateTo:'2026-10-06'}),
    {code:'LOYALFANS_REAUTH_REQUIRED'});
  assert.equal(JSON.stringify(client.status()).includes('test-bearer'),false);
});

test('missing creator configuration is never considered connected',()=>{
  assert.deepEqual(new LoyalFansProviderClient({enabled:false}).status(),{status:'NOT_CONFIGURED'});
});

test('production commerce dispatches to the existing generic fulfillment runtime and disables legacy verification',async()=>{
  let calls=0;
  const client={environment:'production',status:()=>({status:'CONNECTED'}),commentsConfigured:()=>true,supportsCompleteComments:()=>true};
  const adapter=new LoyalFansCommerceAdapter({providerClient:client,fulfillmentEnabled:true,fulfillment:{reconcile:async id=>{
    assert.equal(id,'order-neutral');calls++;return{state:'FULFILLED',duplicate:false};
  }}});
  const db={query:async()=>({rowCount:1,rows:[{id:'order-neutral',processor:'loyalfans'}]}),
    connect:async()=>assert.fail('legacy writer must not run')};
  const service=new V3StoreCommerceService(db,new CommerceProviderRegistry([adapter]),null,null);
  assert.deepEqual(await service.reconcile('order-neutral'),{fulfilled:true,duplicate:false,state:'FULFILLED'});
  assert.equal(calls,1);
  await assert.rejects(adapter.verifyTransaction(order),{code:'LOYALFANS_BRIDGE_NOT_READY'});
  assert.equal(new LoyalFansCommerceAdapter({providerClient:client}).capabilities.authoritativeVerification,false);
  assert.equal(new LoyalFansCommerceAdapter({providerClient:client,fulfillment:{reconcile:async()=>{}}}).capabilities.authoritativeVerification,false);
});

test('customer retry reaches generic runtime for MEDIA_PENDING paid order and never accepts browser proof',async()=>{
  let calls=0;
  const row={id:'order-neutral',processor:'loyalfans',user_id:'user-neutral',status:'paid',fulfillment_status:'media_pending'};
  const db={query:async sql=>sql.includes('FROM v3_commerce_buyer_links')?{rowCount:1,rows:[{
    user_id:'user-neutral',provider:'loyalfans',status:'verified',verification_method:'comment_challenge',provider_member_uid:memberUid
  }]}:{rowCount:1,rows:[row]},connect:async()=>assert.fail('no legacy writer')};
  const adapter={key:'loyalfans',capabilities:{authoritativeVerification:true},reconcileOrder:async()=>{
    calls++;throw Object.assign(Error('safe retry required'),{code:'MEDIA_SOURCE_EXPIRED'});
  }};
  const service=new V3StoreCommerceService(db,new CommerceProviderRegistry([adapter]),{customer:async()=>{}},null);
  const result=await service.checkPurchase({id:'user-neutral'},'order-neutral');
  assert.equal(calls,1);assert.equal(result.fulfilled,false);assert.equal(result.order.fulfillment_status,'media_pending');
  assert.equal(result.verification_state,'manual_verification');
});

test('malformed creator response reports AUTH_FAILED and network outage reports UPSTREAM_ERROR',async()=>{
  const credentials={enabled:true,environment:'production',bearerToken:'test-bearer',
    cookieHeader:'NEXOSESSION=test-session',xsrfToken:'test-xsrf',userAgent:'FLESHLAB-Creator-Test/1.0'};
  const malformed=new LoyalFansProviderClient({...credentials,fetchImpl:async()=>new Response(JSON.stringify({success:true}),{status:200})});
  await assert.rejects(()=>malformed.listTransactions({dateFrom:'2026-10-06',dateTo:'2026-10-06'}),
    {code:'LOYALFANS_RESPONSE_VALIDATION_FAILED'});
  assert.deepEqual(malformed.status(),{status:'AUTH_FAILED'});
  const unavailable=new LoyalFansProviderClient({...credentials,fetchImpl:async()=>{throw Error('network down');}});
  await assert.rejects(()=>unavailable.listTransactions({dateFrom:'2026-10-06',dateTo:'2026-10-06'}),
    {code:'LOYALFANS_NETWORK_FAILED'});
  assert.deepEqual(unavailable.status(),{status:'UPSTREAM_ERROR'});
});

test('transaction history rejects an incomplete page scan',async()=>{
  const client=new LoyalFansProviderClient({enabled:true,environment:'test',bearerToken:'test-bearer',
    cookieHeader:'NEXOSESSION=test-session',xsrfToken:'test-xsrf',fetchImpl:async()=>new Response(JSON.stringify({
      success:true,httpCode:200,page_meta:{total:200,per_page:100,current_page:1,last_page:2,from:1,to:100},transactions:[]
    }),{status:200})});
  await assert.rejects(()=>client.listAllTransactions({dateFrom:'2026-10-06',dateTo:'2026-10-06'}),
    {code:'LOYALFANS_INCOMPLETE_HISTORY'});
});

test('configured creator GET parses the captured comments envelope without inventing terminal pagination semantics',async()=>{
  let request;
  const credentials={enabled:true,environment:'production',bearerToken:'test-bearer',
    cookieHeader:'NEXOSESSION=test-session',xsrfToken:'test-xsrf',userAgent:'FLESHLAB-Creator-Test/1.0',
    commentPathTemplate:'/api/v2/posts/{postUid}/comments?ngsw-bypass=true'};
  const comment={uid:commentUid,comment:challenge,created_at:'2026-10-06T11:01:00Z',
    user:{uid:memberUid,name:'Joe Test',slug:'joetest'}};
  let token='synthetic-continuation';
  const client=new LoyalFansProviderClient({...credentials,fetchImpl:async(url,options)=>{
    request={url,options};return new Response(JSON.stringify({success:true,httpCode:200,page_token:token,
      page_token_newer:null,token_id:null,token_newer_id:null,comments:[comment]}),{status:200});
  }});
  const adapter=new LoyalFansCommerceAdapter({providerClient:client,settlementCurrency:'USD'});
  assert.equal(adapter.capabilities.commentLookup,false);
  const input={postUid,createdAt:'2026-10-06T11:00:00Z',expiresAt:'2026-10-06T11:10:00Z'};
  const partial=await client.listComments(input);
  assert.equal(partial.complete,false);
  assert.equal(request.options.method,'GET');
  assert.equal(request.url,`https://www.loyalfans.com/api/v2/posts/${postUid}/comments?ngsw-bypass=true`);
  assert.equal(request.options.headers.authorization,'Bearer test-bearer');
  token=null;
  const page=await client.listComments(input);
  assert.equal(page.complete,false);
  assert.equal(page.scope_post_uid,postUid);
  assert.equal(page.comments[0].user.uid,memberUid);
  await assert.rejects(()=>adapter.observeComments(input),{code:'VERIFICATION_UNAVAILABLE'});
});

test('observed initial POST enables production comment retrieval without a guessed legacy path',()=>{
  const client=new LoyalFansProviderClient({enabled:true,environment:'production',bearerToken:'test-bearer',
    cookieHeader:'NEXOSESSION=test-session',xsrfToken:'test-xsrf',userAgent:'FLESHLAB-Creator-Test/1.0'});
  assert.equal(new LoyalFansCommerceAdapter({providerClient:client}).capabilities.commentLookup,true);
  assert.equal(client.canAttestCompleteComments(),false);
});

test('reconciliation stores exact reimbursement and chargeback observations idempotently without revoking',async()=>{
  const saved=new Map(); let entitlementWrites=0;
  const records=['reimbursement','chargeback'].map(type=>normalizeLoyalFansTransaction({
    id:`synthetic-${type}-000000000001`,type,member:{uid:memberUid},attached_to:{uid:postUid}
  }));
  records.push(normalizeLoyalFansTransaction({id:'synthetic-other-reversal-000001',type:'chargeback',
    member:{uid:'other-member-000000000000000001'},attached_to:{uid:postUid}}));
  const db={query:async(sql,values=[])=>{
    if(sql.includes('FROM v3_commerce_orders'))return {rows:[{...order,id:'order-1',user_id:'user-1'}]};
    if(sql.includes('FROM v3_commerce_buyer_links'))return {rows:[{user_id:'user-1',provider_member_uid:memberUid,
      status:'verified',verification_method:'comment_challenge'}]};
    if(sql.includes('INSERT INTO v3_commerce_reconciliation_observations')){
      assert.match(sql,/ON CONFLICT\(order_id,provider,provider_transaction_id\) DO NOTHING/);
      saved.set(values[2],values[8]);return {rows:[]};
    }
    if(sql.includes('entitlements'))entitlementWrites+=1;
    throw Error(`Unexpected query: ${sql}`);
  }};
  const adapter={key:'loyalfans',capabilities:{transactionLookup:true},observeTransactions:async()=>records};
  const service=new V3StoreCommerceService(db,new CommerceProviderRegistry([adapter]),null,null);
  assert.equal(await service.captureReversalObservations('order-1'),2);
  assert.equal(await service.captureReversalObservations('order-1'),2);
  assert.deepEqual([...saved.values()].sort(),['chargeback','reimbursement']);
  assert.equal(saved.size,2);
  assert.equal(entitlementWrites,0);
});

test('reconciliation batch uses a bounded cursor and can be repeated safely',async()=>{
  const ids=['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002'];
  const seen=[];
  const db={query:async(sql,values)=>{
    assert.match(sql,/ORDER BY id LIMIT \$2/);
    return {rows:ids.filter(id=>!values[0]||id>values[0]).slice(0,values[1]).map(id=>({id}))};
  }};
  const service=new V3StoreCommerceService(db,null,null,null);
  service.captureReversalObservations=async()=>0;
  service.reconcile=async id=>{seen.push(id);return {fulfilled:true};};
  const first=await service.reconcileBatch({limit:1});
  const second=await service.reconcileBatch({limit:1,cursor:first.next_cursor});
  const final=await service.reconcileBatch({limit:1,cursor:second.next_cursor});
  assert.deepEqual(seen,ids);
  assert.equal(first.next_cursor,ids[0]);
  assert.equal(second.next_cursor,ids[1]);
  assert.equal(final.next_cursor,null);
  assert.equal(final.examined,0);
});
