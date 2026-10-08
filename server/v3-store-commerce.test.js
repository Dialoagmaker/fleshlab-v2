import test from 'node:test';
import assert from 'node:assert/strict';
import { V3StoreCommerceService, validateVerifiedTransaction, publicCommerceOrder } from './v3-store-commerce.js';
import { V3AccessService } from './v3-access.js';
import { CommerceProviderRegistry, LoyalFansCommerceAdapter, Chain2PayCommerceAdapter } from './commerce-providers.js';
const order = {id:'order',user_id:'user',product_id:'video',purchase_type:'ppv',processor:'test',verified_buyer_uid:'buyer',commerce_correlation:'secret',total_minor:1299,currency:'USD'};
const evidence = {provider:'test',transactionId:'transaction',contentUid:'content',buyerUid:'buyer',correlation:'secret',verified:true,buyerVerified:true,amountMinor:1299,currency:'USD',status:'paid',revision:1};
const mapping = {video_legacy_id:'video'};
for (const [name,patch] of Object.entries({ 'wrong buyer':{buyerUid:'other'}, 'unverified buyer':{buyerVerified:false}, 'unverified payment':{verified:false}, 'wrong order correlation':{correlation:'other'}, 'invalid amount':{amountMinor:1}, 'invalid currency':{currency:'EUR'}, 'invalid revision':{revision:-1} })) test(name,()=>assert.throws(()=>validateVerifiedTransaction(order,{...evidence,...patch},mapping)));
test('unknown content fails closed',()=>assert.throws(()=>validateVerifiedTransaction(order,evidence,null)));
function harness() {
  let saved=null, grant=null, state=null, release=Promise.resolve();
  const db={query:async()=>({rows:[order],rowCount:1}),connect:async()=>{
    const previous=release; let unlock; release=new Promise(r=>unlock=r); await previous;
    let snapshot;
    return {release:unlock,query:async(sql,v=[])=>{
      if(sql==='BEGIN') { snapshot={saved:structuredClone(saved),grant:structuredClone(grant),state}; return {rows:[]}; }
      if(sql==='ROLLBACK'){({saved,grant,state}=snapshot);return {rows:[]};}
      if(sql==='COMMIT'||sql.includes('pg_advisory'))return {rows:[]};
      if(sql.includes('SELECT * FROM v3_commerce_orders'))return {rows:[order]};
      if(sql.includes('FROM v3_catalogue_external'))return {rows:[mapping]};
      if(sql.includes('SELECT * FROM v3_commerce_provider_transactions'))return {rows:saved?[saved]:[]};
      if(sql.includes('INSERT INTO v3_commerce_provider_transactions')){saved={provider:v[0],provider_transaction_id:v[1],order_id:v[2],user_id:v[3],provider_content_uid:v[5],provider_buyer_uid:v[6],status:v[9],revision:v[10]};return {rows:[]};}
      if(sql.includes('INSERT INTO v3_commerce_content_entitlements')){grant='active';return {rows:[]};}
      if(sql.includes('UPDATE v3_commerce_content_entitlements')){grant='revoked';return {rows:[]};}
      if(sql.includes('UPDATE v3_commerce_orders')){if(db.fail){db.fail=false;throw Error('partial failure');}state=v[1];return {rows:[]};}
      throw Error(sql);
    }};
  }};
  let t={...evidence}; const adapter={key:'test',verifyTransaction:async()=>{if(t instanceof Error)throw t; return t;}};
  const service=new V3StoreCommerceService(db,new CommerceProviderRegistry([adapter]),null,null,'test');
  return {service,db,set:t2=>t=t2,get:()=>({saved,grant,state})};
}
test('successful fulfillment and idempotent retry',async()=>{const h=harness();assert.deepEqual(await h.service.reconcile('order'),{fulfilled:true});assert.deepEqual(await h.service.reconcile('order'),{duplicate:true});assert.equal(h.get().grant,'active');});
test('concurrent duplicate requests',async()=>{const h=harness();const r=await Promise.all([h.service.reconcile('order'),h.service.reconcile('order')]);assert.equal(r.filter(x=>x.duplicate).length,1);});
for(const status of ['pending','failed','refunded','chargeback','reversed'])test(status,async()=>{const h=harness();if(status!=='pending') await h.service.reconcile('order');h.set({...evidence,status,revision:2});await h.service.reconcile('order');assert.equal(h.get().grant,status==='pending'?null:'revoked');});
test('verified restoration only',async()=>{const h=harness();h.set({...evidence,status:'refunded'});await h.service.reconcile('order');h.set({...evidence,revision:2});await assert.rejects(()=>h.service.reconcile('order'));h.set({...evidence,revision:2,restorationVerified:true});await h.service.reconcile('order');assert.equal(h.get().grant,'active');});
for(const name of ['provider outage','provider timeout'])test(name,async()=>{const h=harness();h.set(Error(name));await assert.rejects(()=>h.service.reconcile('order'));assert.equal(h.get().grant,null);});
test('retry after partial failure is atomic',async()=>{const h=harness();h.db.fail=true;await assert.rejects(()=>h.service.reconcile('order'));assert.equal(h.get().saved,null);await h.service.reconcile('order');assert.equal(h.get().grant,'active');});
test('public orders exclude provider data',()=>{assert.doesNotMatch(JSON.stringify(publicCommerceOrder({...order,provider_member_uid:'secret',checkout_url:'https://loyalfans.com'})),/secret|loyalfans|processor|buyer|correlation/);});
test('installed adapters block before network or checkout writes',async()=>{for(const a of [new LoyalFansCommerceAdapter(),new Chain2PayCommerceAdapter({})]){await assert.rejects(()=>a.createCheckout());await assert.rejects(()=>a.verifyTransaction());}});
function accessHarness({grant=true,subscription=false,download=false,status='active',starts=0,ends=Infinity,revoked=false}={}) {
 const db={query:async(sql)=>{if(sql.includes('FROM app_users'))return {rowCount:1};if(sql.includes('SELECT a.storage_reference'))return {rowCount:1,rows:[{storage_reference:'private'}]};const allowed=grant&&status==='active'&&!revoked&&starts<=10&&ends>10&&(!sql.includes('e.download_allowed=true')||download); const member=subscription&&sql.includes('UNION ALL');assert.match(sql,/starts_at<=now\(\)/);return {rowCount:allowed||member?1:0};}};
 return new V3AccessService(db,{downloadStream:async()=>({stream:'stream'})});
}
const user={id:'user',role:'customer'};
for(const [name,options] of Object.entries({'revoked entitlement':{revoked:true},'expired entitlement':{ends:5},'future starts_at':{starts:20},'unauthorized playback':{grant:false}}))test(name,async()=>assert.rejects(()=>accessHarness(options).media(user,'video')));
test('authorized playback',async()=>assert.equal((await accessHarness().media(user,'video')).stream,'stream'));
test('anonymous playback',async()=>assert.rejects(()=>accessHarness().media(null,'video')));
test('subscription survives refunded PPV',async()=>assert.equal((await accessHarness({revoked:true,subscription:true}).media(user,'video')).stream,'stream'));
test('unauthorized download including subscription-only',async()=>assert.rejects(()=>accessHarness({grant:false,subscription:true}).media(user,'video',true)));
test('authorized download when explicitly configured',async()=>assert.equal((await accessHarness({download:true}).media(user,'video',true)).attachment,true));
test('order lookup binds authenticated customer and hides another user',async()=>{const service=new V3StoreCommerceService({query:async(sql,v)=>{assert.deepEqual(v,['order','other']);return {rows:[],rowCount:0};}},null,{customer:async()=>{}},null);await assert.rejects(()=>service.order({id:'other'},'order'),{code:'ORDER_NOT_FOUND'});});
test('pending cannot overwrite settled purchase',async()=>{const h=harness();await h.service.reconcile('order');h.set({...evidence,status:'pending',revision:2});await assert.rejects(()=>h.service.reconcile('order'));assert.equal(h.get().grant,'active');});
test('old revision cannot resurrect refunded grant',async()=>{const h=harness();h.set({...evidence,status:'refunded',revision:2});await h.service.reconcile('order');h.set(evidence);assert.deepEqual(await h.service.reconcile('order'),{ignored:true});assert.equal(h.get().grant,'revoked');});
function loyalFansIdentityHarness(link, transactionPatch = {}, {sourceReady=true,published=true}={}) {
  let grant=false, saved=null;
  let queued=0, orderFulfillment=null;
  const contentUid='content-uid-00000000000000000001';
  const loyalOrder={...order,processor:'loyalfans',verified_buyer_uid:'buyer',commerce_correlation:'correlation',external_content_uid:contentUid};
  const transaction={...evidence,provider:'loyalfans',transactionId:'transaction-uid-0000000000000001',transactionType:'clip_store',contentUid,buyerUid:'buyer',correlation:'correlation',buyerVerified:true,verified:true,finalityVerified:true,...transactionPatch};
  const db={query:async(sql)=>sql.includes('FROM v3_commerce_buyer_links')
    ? {rows:link?[link]:[],rowCount:link?1:0} : {rows:[loyalOrder],rowCount:1},connect:async()=>({release(){},query:async(sql,v=[])=>{
    if(sql==='BEGIN'||sql==='COMMIT'||sql==='ROLLBACK'||sql.includes('pg_advisory'))return {rows:[]};
    if(sql.includes('SELECT * FROM v3_commerce_orders'))return {rows:[loyalOrder],rowCount:1};
    if(sql.includes('SELECT user_id,provider_member_uid,status'))return {rows:link?[link]:[],rowCount:link?1:0};
    if(sql.includes('FROM v3_catalogue_external_content_mappings'))return {rows:[mapping],rowCount:1};
    if(sql.includes('FROM v3_loyalfans_catalogue_products'))return {rows:[{loyalfans_post_uid:contentUid,video_legacy_id:'video',downloadable:true}],rowCount:1};
    if(sql.includes('SELECT EXISTS('))return {rows:[{source_ready:sourceReady,published}],rowCount:1};
    if(sql.includes('SELECT * FROM v3_commerce_provider_transactions'))return {rows:saved?[saved]:[],rowCount:saved?1:0};
    if(sql.includes('INSERT INTO v3_commerce_provider_transactions')){saved={provider:v[0],provider_transaction_id:v[1],order_id:v[2],user_id:v[3],provider_content_uid:v[5],provider_buyer_uid:v[6],status:v[9],revision:v[10]};return {rows:[]};}
    if(sql.includes('INSERT INTO v3_commerce_content_entitlements')){grant=true;return {rows:[]};}
    if(sql.includes('INSERT INTO v3_loyalfans_media_ingestion_jobs')){queued+=1;return {rows:[]};}
    if(sql.includes('UPDATE v3_loyalfans_media_ingestion_jobs'))return {rows:[]};
    if(sql.includes('UPDATE v3_commerce_orders')){orderFulfillment=v[2];return {rows:[]};}
    throw Error(sql);
  }})};
  const adapter={key:'loyalfans',verifyTransaction:async()=>transaction};
  return {service:new V3StoreCommerceService(db,new CommerceProviderRegistry([adapter]),null,null),getGrant:()=>grant,getQueued:()=>queued,getFulfillment:()=>orderFulfillment};
}
test('LoyalFans fulfillment requires a verified exact buyer UID match from the account link',async()=>{
  const accepted=loyalFansIdentityHarness({user_id:'user',status:'verified',provider_member_uid:'buyer',verification_method:'comment_challenge'});
  assert.deepEqual(await accepted.service.reconcile('order'),{fulfilled:true});
  assert.equal(accepted.getGrant(),true);
  for(const status of ['pending_verification','expired','revoked']) {
    const rejected=loyalFansIdentityHarness({user_id:'user',status,provider_member_uid:'buyer',verification_method:'comment_challenge'});
    await assert.rejects(()=>rejected.service.reconcile('order'),{code:'PAYMENT_REQUIRES_REVIEW'});
    assert.equal(rejected.getGrant(),false);
  }
  const wrongUid=loyalFansIdentityHarness({user_id:'user',status:'verified',provider_member_uid:'other-member',verification_method:'comment_challenge'});
  await assert.rejects(()=>wrongUid.service.reconcile('order'),{code:'PAYMENT_REQUIRES_REVIEW'});
  assert.equal(wrongUid.getGrant(),false);
  const reactionOnly=loyalFansIdentityHarness({user_id:'user',status:'verified',provider_member_uid:'buyer',verification_method:'reaction_like'});
  await assert.rejects(()=>reactionOnly.service.reconcile('order'),{code:'PAYMENT_REQUIRES_REVIEW'});
  assert.equal(reactionOnly.getGrant(),false);
  const missingFinality=loyalFansIdentityHarness({user_id:'user',status:'verified',provider_member_uid:'buyer',verification_method:'comment_challenge'},{finalityVerified:false});
  await assert.rejects(()=>missingFinality.service.reconcile('order'),{code:'PAYMENT_REQUIRES_REVIEW'});
  assert.equal(missingFinality.getGrant(),false);
  const wrongType=loyalFansIdentityHarness({user_id:'user',status:'verified',provider_member_uid:'buyer',verification_method:'comment_challenge'},{transactionType:'subscription'});
  await assert.rejects(()=>wrongType.service.reconcile('order'),{code:'PAYMENT_REQUIRES_REVIEW'});
  assert.equal(wrongType.getGrant(),false);
});
test('LoyalFans claim can grant only from final server-verified exact post and linked UID',async()=>{
  const link={user_id:'user',status:'verified',provider_member_uid:'buyer',verification_method:'comment_challenge'};
  const proof={correlation:null,claimVerified:true,finalityVerified:true};
  const accepted=loyalFansIdentityHarness(link,proof);
  assert.deepEqual(await accepted.service.reconcile('order'),{fulfilled:true});
  assert.deepEqual(await accepted.service.reconcile('order'),{duplicate:true});
  assert.equal(accepted.getGrant(),true);
  for(const bad of [
    {...proof,claimVerified:false},
    {...proof,finalityVerified:false},
    {...proof,buyerUid:'other'},
    {...proof,contentUid:'other-post-00000000000000000000'},
    {...proof,amountMinor:1},
    {...proof,transactionType:'subscription'},
    {...proof,currency:null},
    {...proof,verified:false}
  ]) {
    const rejected=loyalFansIdentityHarness(link,bad);
    await assert.rejects(()=>rejected.service.reconcile('order'),{code:'PAYMENT_REQUIRES_REVIEW'});
    assert.equal(rejected.getGrant(),false);
  }
});
test('valid paid transaction becomes MEDIA_PENDING with one idempotent job until a private master is ready',async()=>{
  const link={user_id:'user',status:'verified',provider_member_uid:'buyer',verification_method:'comment_challenge'};
  const h=loyalFansIdentityHarness(link,{correlation:null,claimVerified:true,finalityVerified:true},{sourceReady:false});
  assert.deepEqual(await h.service.reconcile('order'),{fulfilled:false,media_pending:true});
  assert.equal(h.getGrant(),false);
  assert.equal(h.getQueued(),1);
  assert.equal(h.getFulfillment(),'media_pending');
});
test('mapping rejects HTTP and credential-bearing URLs',async()=>{const {V3ExternalContentMappingRepository}=await import('./v3-external-content-mappings.js');const repository=new V3ExternalContentMappingRepository({query:async()=>{throw Error('must not query');}});for(const public_url of ['http://example.com','https://example.com?Signature=secret','https://user:password@example.com'])await assert.rejects(()=>repository.createMapping({provider:'test',external_content_uid:'uid',video_legacy_id:'video',public_url}),{code:'EXTERNAL_CONTENT_PUBLIC_URL_INVALID'});});
test('repository refuses ambiguous rows even without installed unique constraint',async()=>{const {V3ExternalContentMappingRepository}=await import('./v3-external-content-mappings.js');await assert.rejects(()=>new V3ExternalContentMappingRepository({query:async()=>({rows:[mapping,mapping]})}).findByExternalContentId('test','uid'),{code:'AMBIGUOUS_EXTERNAL_CONTENT_MAPPING'});});
