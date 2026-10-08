import test from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { LoyalFansFulfillmentAdapter,normalizeLoyalFansFulfillmentRecord,projectLoyalFansCreatorLedgerRecord } from './loyalfans-fulfillment-adapter.js';
import { LoyalFansProviderClient } from './loyalfans-provider-client.js';
import { loadConfig } from './config.js';
import { ProviderTransactionFulfillmentService,assertFulfillmentTransition } from './provider-transaction-fulfillment.js';
import { SignedSourceMediaIngestionService,mediaError } from './provider-media-ingestion.js';
import { createProviderMediaRuntime } from './provider-media-runtime.js';
import { Readable } from 'node:stream';

const transactionId='aaaaaaaaaaaaaaaaaaaaaaaa';
const buyerUid='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const contentUid='cccccccccccccccccccccccccccccccc';
const mediaUid='dddddddddddddddddddddddddddddddd';
const temporary='https://media.example.test/source?sig=neutral-ephemeral';
function record(){return{id:transactionId,member:{uid:buyerUid},type:'clip_store',charge:1.99,
  payout:1.59,fee:0.40,rate:80,created_at:'2026-01-02T12:00:00Z',attached_to:{uid:contentUid,
    video_object:{uid:mediaUid,video_url:temporary,mime:'video/mp4',duration:1,size:{width:64,height:64}}}};}
function harness({records=[record()],mapping=['video-neutral'],master=false,enabled=true,posted=true,clientError=null,verified=true}={}){
  const queried=[];
  const db={query:async(sql,values)=>{
    queried.push({sql,values});
    const rows=sql.includes('v3_commerce_buyer_links')?(verified?[{provider_member_uid:buyerUid}]:[]):
      sql.includes('v3_catalogue_external_content_mappings')?mapping.map(video_legacy_id=>({video_legacy_id})):
        sql.includes('v3_media_assets')?(master?[{id:'asset-neutral'}]:[]):assert.fail('Unexpected query');
    return{rowCount:rows.length,rows};
  }};
  let historyCalls=0;
  const client={listAllFulfillmentTransactions:async range=>{
    historyCalls++;assert.deepEqual(range,{dateFrom:'2026-01-01',dateTo:'2026-01-03'});
    if(clientError)throw clientError;
    return{authority:'creator_authenticated',complete:true,transactions:records};
  }};
  const adapter=new LoyalFansFulfillmentAdapter({db,client,enabled,ledgerPostedConfirmed:posted,
    settlementCurrency:'USD',allowedHosts:['media.example.test'],now:()=>new Date('2026-01-03T00:00:00Z')});
  const order={id:'order-neutral',provider:'loyalfans',userId:'user-neutral',videoId:'video-neutral',
    buyerUid,buyerVerified:true,contentUid,amountMinor:199,currency:'USD',createdAt:'2026-01-01T00:00:00Z'};
  return{adapter,order,queried,calls:()=>historyCalls};
}

test('normalizes only technical ledger fields with explicit server attestation',()=>{
  const r=record();
  for(const object of [r,r.member,r.attached_to])for(const key of ['title','slug','description','content','name']){
    Object.defineProperty(object,key,{get(){assert.fail('Descriptive fields must not be read');}});
  }
  const projected=projectLoyalFansCreatorLedgerRecord(r);
  const n=normalizeLoyalFansFulfillmentRecord(projected,{settlementCurrency:'USD',authorityVerified:true,ledgerPostedConfirmed:true});
  assert.equal(n.provider_transaction_id,transactionId);assert.equal(n.external_buyer_uid,buyerUid);
  assert.equal(n.external_content_uid,contentUid);assert.equal(n.provider_transaction_type,'clip_store');
  assert.equal(n.amount,1.99);assert.equal(n.amount_minor,199);assert.equal(n.currency,'USD');
  assert.equal(n.provider_transaction_timestamp,new Date(r.created_at).toISOString());assert.equal(n.external_media_uid,mediaUid);
  assert.equal(n.expected_mime,'video/mp4');assert.equal(n.expected_duration,1);
  assert.deepEqual(n.expected_dimensions,{width:64,height:64});assert.equal(n.temporary_media_url,temporary);
  assert.equal(n.finality,'POSTED');
  for(const value of [projected,n]){assert.equal(JSON.stringify(value).includes('neutral-ephemeral'),false);assert.equal(inspect(value).includes('neutral-ephemeral'),false);}
});

for(const [name,change,code] of [
  ['invalid type',r=>{r.type='subscription';},'MEDIA_LF_TRANSACTION_TYPE_INVALID'],
  ['missing transaction ID',r=>{delete r.id;},'MEDIA_LF_TRANSACTION_ID_REQUIRED'],
  ['missing buyer UID',r=>{delete r.member.uid;},'MEDIA_LF_BUYER_UID_REQUIRED'],
  ['missing content UID',r=>{delete r.attached_to.uid;},'MEDIA_LF_CONTENT_UID_REQUIRED'],
  ['invalid charge',r=>{r.charge='NaN';},'MEDIA_LF_AMOUNT_INVALID'],
  ['fractional minor units',r=>{r.charge='1.999';},'MEDIA_LF_AMOUNT_INVALID'],
  ['object charge',r=>{r.charge={toString(){assert.fail('Untrusted coercion');}};},'MEDIA_LF_AMOUNT_INVALID'],
  ['boolean duration',r=>{r.attached_to.video_object.duration=true;},'MEDIA_LF_METADATA_INVALID'],
  ['missing timestamp',r=>{delete r.created_at;},'MEDIA_LF_TIMESTAMP_REQUIRED']
])test(name,()=>{const r=record();change(r);assert.throws(()=>normalizeLoyalFansFulfillmentRecord(r),{code});});

test('ledger data alone and missing accounting evidence retain FINALITY_UNKNOWN',()=>{
  assert.equal(normalizeLoyalFansFulfillmentRecord(record()).finality,'FINALITY_UNKNOWN');
  const r=record();delete r.payout;
  assert.equal(normalizeLoyalFansFulfillmentRecord(r,{authorityVerified:true,ledgerPostedConfirmed:true}).finality,'FINALITY_UNKNOWN');
});

for(const rate of ['',true,{},Infinity,-1])test(`invalid accounting rate (${typeof rate}) cannot attest POSTED`,()=>{
  const r=record();r.rate=rate;
  assert.equal(normalizeLoyalFansFulfillmentRecord(r,{authorityVerified:true,ledgerPostedConfirmed:true}).finality,'FINALITY_UNKNOWN');
});

test('explicit row currency takes precedence and missing currency is never inferred',()=>{
  const r=record();r.currency='EUR';
  assert.equal(normalizeLoyalFansFulfillmentRecord(r,{settlementCurrency:'USD'}).currency,'EUR');
  delete r.currency;assert.equal(normalizeLoyalFansFulfillmentRecord(r).currency,null);
});

test('valid transaction produces an authoritative generic media handoff',async()=>{
  const h=harness();const sale=await h.adapter.verifyTransaction(h.order);
  assert.equal(sale.transactionId,transactionId);assert.equal(sale.authorityVerified,true);
  assert.equal(sale.media.sourceUrl,temporary);assert.equal(sale.media.uid,mediaUid);
  assert.deepEqual(sale.media.dimensions,{width:64,height:64});
  assert.equal(JSON.stringify(sale).includes('neutral-ephemeral'),false);
  assert.equal(inspect(sale).includes('neutral-ephemeral'),false);
  assert.equal(JSON.stringify(h.queried).includes('https:'),false);
});

for(const [name,options,code] of [
  ['unknown mapping',{mapping:[]},'MEDIA_LF_MAPPING_UNKNOWN'],
  ['ambiguous mapping',{mapping:['video-neutral','video-other']},'MEDIA_LF_MAPPING_AMBIGUOUS'],
  ['wrong mapping',{mapping:['video-other']},'MEDIA_LF_MAPPING_MISMATCH'],
  ['unverified buyer',{verified:false},'MEDIA_LF_BUYER_NOT_VERIFIED'],
  ['disabled adapter',{enabled:false},'MEDIA_LF_ADAPTER_DISABLED'],
  ['string activation flag',{enabled:'true'},'MEDIA_LF_ADAPTER_DISABLED'],
  ['unconfirmed posting',{posted:false},'MEDIA_LF_FINALITY_UNKNOWN']
])test(name,async()=>{const h=harness(options);await assert.rejects(h.adapter.verifyTransaction(h.order),{code});});

for(const [name,change] of [
  ['wrong buyer',r=>{r.member.uid='eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';}],
  ['wrong content',r=>{r.attached_to.uid='ffffffffffffffffffffffffffffffff';}],
  ['wrong amount',r=>{r.charge=2.99;}],
  ['wrong currency',r=>{r.currency='EUR';}],
  ['unsupported type',r=>{r.type='subscription';}],
  ['sale before order',r=>{r.created_at='2025-01-01T00:00:00Z';}],
  ['future sale',r=>{r.created_at='2027-01-01T00:00:00Z';}]
])test(`${name} cannot fulfill an order`,async()=>{
  const r=record();change(r);const h=harness({records:[r]});
  await assert.rejects(h.adapter.verifyTransaction(h.order),{code:'MEDIA_LF_PURCHASE_NOT_UNIQUE'});
});

for(const createdAt of [null,undefined,'',0,'2027-01-01T00:00:00Z'])test('invalid order timestamp prevents history access',async()=>{
  const h=harness();await assert.rejects(h.adapter.verifyTransaction({...h.order,createdAt}),{code:'MEDIA_LF_ORDER_TIMESTAMP_REQUIRED'});
  assert.equal(h.calls(),0);
});

test('multiple purchases or duplicate ledger rows require an unambiguous stable ID',async()=>{
  const a=record();const b=record();b.id='eeeeeeeeeeeeeeeeeeeeeeee';
  const h=harness({records:[a,b]});await assert.rejects(h.adapter.verifyTransaction(h.order),{code:'MEDIA_LF_PURCHASE_NOT_UNIQUE'});
  const sale=await h.adapter.verifyTransaction({...h.order,providerTransactionId:b.id});assert.equal(sale.transactionId,b.id);
  const duplicate=harness({records:[a,a]});await assert.rejects(duplicate.adapter.verifyTransaction(duplicate.order),{code:'MEDIA_LF_PURCHASE_NOT_UNIQUE'});
});

test('candidate ID cannot replace fresh authoritative history',async()=>{
  const h=harness();await assert.rejects(h.adapter.verifyTransaction(h.order,{transactionId:'eeeeeeeeeeeeeeeeeeeeeeee'}),{code:'MEDIA_LF_PURCHASE_NOT_UNIQUE'});
  assert.equal(h.calls(),1);
});

test('existing READY master needs no upstream media URL or metadata',async()=>{
  const r=record();delete r.attached_to.video_object;const h=harness({records:[r],master:true});
  const sale=await h.adapter.verifyTransaction(h.order);assert.equal(sale.media.sourceUrl,undefined);
});

test('new ingestion requires a configured approved HTTPS host',async()=>{
  const r=record();r.attached_to.video_object.video_url='https://unapproved.example.test/a?sig=neutral-ephemeral';
  const h=harness({records:[r]});await assert.rejects(h.adapter.verifyTransaction(h.order),error=>{
    assert.equal(error.code,'MEDIA_HOST_NOT_ALLOWED');assert.equal(JSON.stringify(error).includes('neutral-ephemeral'),false);return true;
  });
});

for(const [sourceCode,expectedCode] of [['LOYALFANS_REAUTH_REQUIRED','MEDIA_LF_AUTH_EXPIRED'],
  ['LOYALFANS_AUTH_NOT_CONFIGURED','MEDIA_LF_AUTH_NOT_CONFIGURED'],['LOYALFANS_NETWORK_FAILED','MEDIA_LF_HISTORY_UNAVAILABLE']]){
  test(`provider failure ${sourceCode} is sanitized`,async()=>{
    const h=harness({clientError:Object.assign(new Error(temporary),{code:sourceCode})});
    await assert.rejects(h.adapter.verifyTransaction(h.order),error=>{
      assert.equal(error.code,expectedCode);assert.equal(error.retryable,true);assert.equal(inspect(error).includes('neutral-ephemeral'),false);return true;
    });
  });
}

function testClient(fetchImpl){return new LoyalFansProviderClient({enabled:true,environment:'test',
  cookieHeader:'synthetic-cookie',xsrfToken:'synthetic-xsrf',bearerToken:'synthetic-bearer',fetchImpl});}
function envelope(rows,page=1,total=1,last=1){return{success:true,httpCode:200,
  page_meta:{total,per_page:100,current_page:page,last_page:last,from:0,to:rows.length},
  transactions:[{dateKey:'2026-01-02',transactions:rows}]};}
test('technical history uses the observed authenticated grouped response without reading descriptive fields',async()=>{
  const r=record();Object.defineProperty(r.attached_to,'title',{enumerable:true,get(){assert.fail('Descriptive data read');}});
  const client=testClient(async(_url,options)=>{
    assert.equal(options.method,'POST');assert.equal(JSON.parse(options.body).page,1);
    return{ok:true,status:200,json:async()=>envelope([r])};
  });
  const history=await client.listAllFulfillmentTransactions({dateFrom:'2026-01-01',dateTo:'2026-01-03'});
  assert.equal(history.complete,true);assert.equal(history.authority,'creator_authenticated');
  assert.equal(history.transactions[0].attached_to.video_object.video_url,temporary);
  assert.equal(JSON.stringify(history).includes('neutral-ephemeral'),false);
});
test('technical history rejects changing pagination and incomplete snapshots',async()=>{
  let page=0;const client=testClient(async()=>({ok:true,status:200,json:async()=>{
    page++;return envelope([record()],page,page===1?2:3,2);
  }}));
  await assert.rejects(client.listAllFulfillmentTransactions({dateFrom:'2026-01-01',dateTo:'2026-01-03'}),{code:'LOYALFANS_INCOMPLETE_HISTORY'});
});
test('actual client detects expired creator authentication',async()=>{
  const client=testClient(async()=>new Response('',{status:401}));
  await assert.rejects(client.listAllFulfillmentTransactions({dateFrom:'2026-01-01',dateTo:'2026-01-03'}),{code:'LOYALFANS_REAUTH_REQUIRED'});
  assert.equal(client.status().status,'AUTH_EXPIRED');
});
test('production activation and ledger attestation default to disabled',()=>{
  const c=loadConfig({NODE_ENV:'production',PUBLIC_ORIGIN:'https://app.example.test',
    DATABASE_URL:'postgresql://synthetic@database.example.test/test',SESSION_SECRET:'synthetic-test-session'});
  assert.equal(c.loyalFans.mediaFulfillmentEnabled,false);
  assert.equal(c.loyalFans.ledgerPostedConfirmed,false);assert.equal(c.providerMedia.enabled,false);
});

// Exercise the existing generic services with neutral in-memory repository/storage boundaries.
// No alternative ingestion or fulfillment implementation and no external service requests.
function fulfillmentHarness({existingMaster=false}={}){
  const upstream=record();if(existingMaster)delete upstream.attached_to.video_object;
  const h=harness({records:[upstream],master:existingMaster});
  const order={...h.order,state:'VERIFICATION_PENDING'};
  const transitions=[];const writes=[];const objects=new Map();const jobs=new Map();
  let grants=0;let fetches=0;let uploads=0;let status=200;let gate=Promise.resolve();
  const bytes=Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypisom'),Buffer.alloc(64)]);
  const repository={
    async withOrder(_id,run){const previous=gate;let release;gate=new Promise(resolve=>{release=resolve;});
      await previous;try{return await run(repository);}finally{release();}},
    order:async()=>({...order}),
    bindTransaction:async(_order,sale)=>{
      if(order.providerTransactionId && order.providerTransactionId!==sale.transactionId)throw mediaError('MEDIA_TRANSACTION_CONFLICT');
      order.providerTransactionId=sale.transactionId;
      writes.push({transactionId:sale.transactionId,buyerUid:sale.buyerUid,contentUid:sale.contentUid,
        externalMediaUid:sale.media.uid,timestamp:sale.timestamp});
    },
    transition:async(_id,state)=>{assertFulfillmentTransition(order.state,state);order.state=state;transitions.push(state);},
    markReady:async(_order,_sale,assetId)=>{
      assert.equal([...jobs.values()][0].state,'MEDIA_READY');assert.equal(assetId,'asset-neutral');
      assertFulfillmentTransition(order.state,'MEDIA_READY');order.state='MEDIA_READY';transitions.push(order.state);
    },
    complete:async()=>{assert.equal(order.state,'MEDIA_READY');grants++;order.state='FULFILLED';transitions.push(order.state);},
    fail:async()=>{order.state='FAILED';}
  };
  const mediaRepository={withJob:async(identity,run)=>{
    writes.push(identity);
    let job=jobs.get(identity.contentUid);
    if(!job){
      job={state:existingMaster?'MEDIA_READY':'MEDIA_PENDING',assetId:'asset-neutral',objectKey:'private/neutral-source',attempts:0,
        start:async()=>{job.state='MEDIA_INGESTING';job.attempts++;},
        ready:async metadata=>{job.state='MEDIA_READY';writes.push(metadata);},
        failed:async(code,retryable)=>{job.state='FAILED';writes.push({code,retryable});}};
      jobs.set(identity.contentUid,job);
    }
    return run(job);
  }};
  const blob={verifyPrivateContainer:async()=>true,
    uploadStream:async(key,stream)=>{uploads++;const chunks=[];for await(const chunk of stream)chunks.push(chunk);objects.set(key,Buffer.concat(chunks));},
    verifyObject:async key=>objects.has(key)?{byteSize:objects.get(key).length}:null,
    deleteObject:async key=>{objects.delete(key);}
  };
  const media=new SignedSourceMediaIngestionService({repository:mediaRepository,blob,privateContainer:'private-neutral',
    allowedHosts:['media.example.test'],openSource:async(_url,options)=>{
      fetches++;assert.equal(grants,0);assert.equal(order.state,'MEDIA_INGESTING');
      assert.equal(options.sourceReferer,'https://www.loyalfans.com/');assert.deepEqual(Object.keys(options).sort(),['signal','sourceReferer']);
      assert.equal('authorization' in options,false);assert.equal('cookie' in options,false);assert.equal('xsrf' in options,false);
      return{status,headers:{'content-type':'video/mp4','content-length':String(bytes.length)},stream:Readable.from(bytes)};
    },validateMedia:async()=>{
      assert.equal(grants,0);return{width:64,height:64,durationSeconds:1};
    }});
  const service=new ProviderTransactionFulfillmentService({repository,media,
    verifyEvidence:current=>h.adapter.verifyTransaction(current),acceptPosted:h.adapter.acceptPosted,expectedTransactionType:'clip_store'});
  return{service,order,upstream,transitions,writes,jobs,
    stats:()=>({grants,fetches,uploads,jobs:jobs.size,historyCalls:h.calls()}),expire:()=>{status=403;},
    refresh:()=>{status=200;upstream.attached_to.video_object.video_url='https://media.example.test/source?sig=renewed-neutral';}};
}

test('adapter feeds generic ingestion; concurrent and duplicate fulfillment create one job and grant',async()=>{
  const h=fulfillmentHarness();
  const results=await Promise.all([h.service.fulfill(h.order.id),h.service.fulfill(h.order.id)]);
  assert.equal(results.every(result=>result.state==='FULFILLED'),true);
  assert.deepEqual(h.stats(),{grants:1,fetches:1,uploads:1,jobs:1,historyCalls:1});
  assert.deepEqual(h.transitions,['MEDIA_PENDING','MEDIA_INGESTING','MEDIA_READY','FULFILLED']);
  await h.service.fulfill(h.order.id);assert.equal(h.stats().grants,1);
  assert.match(h.writes.find(row=>row.checksum)?.checksum,/^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(h.writes).includes('https:'),false);assert.equal(JSON.stringify(results).includes('sig='),false);
});

test('adapter and generic media runtime reuse READY master without a source URL',async()=>{
  const h=fulfillmentHarness({existingMaster:true});assert.equal((await h.service.fulfill(h.order.id)).assetId,'asset-neutral');
  assert.deepEqual(h.stats(),{grants:1,fetches:0,uploads:0,jobs:1,historyCalls:1});
});

test('expired source never grants; retry reloads history and completes the same job',async()=>{
  const h=fulfillmentHarness();h.expire();
  await assert.rejects(h.service.fulfill(h.order.id),error=>{
    assert.equal(error.code,'MEDIA_SOURCE_EXPIRED');assert.equal(inspect(error).includes('neutral-ephemeral'),false);return true;
  });
  assert.equal(h.stats().grants,0);assert.equal(h.order.state,'FAILED');
  h.refresh();assert.equal((await h.service.fulfill(h.order.id)).state,'FULFILLED');
  assert.equal(h.stats().jobs,1);assert.equal(h.stats().historyCalls,2);assert.equal(h.stats().grants,1);
  assert.equal([...h.jobs.values()][0].attempts,2);assert.equal(JSON.stringify(h.writes).includes('sig='),false);
});

test('unresolved provider reversal cannot invoke generic revocation or fetch history',async()=>{
  const h=harness();
  const runtime=createProviderMediaRuntime({db:{},blob:{},config:{providerMedia:{enabled:true}}});
  const registered=runtime.registerAdapter('loyalfans',h.adapter);
  await assert.rejects(registered.observeReversal('neutral-reversal'),{code:'MEDIA_REVERSAL_VERIFIER_UNAVAILABLE'});
  assert.equal(h.calls(),0);
});

test('JIT readiness records the same exact private master on an existing catalogue product',async()=>{
  const calls=[];
  const db={query:async(sql,values)=>{
    calls.push({sql,values});
    if(sql.includes('SELECT loyalfans_post_uid FROM v3_loyalfans_catalogue_products'))return{rowCount:1,rows:[{loyalfans_post_uid:contentUid}]};
    if(sql.includes('UPDATE v3_loyalfans_catalogue_products'))return{rowCount:1,rows:[{loyalfans_post_uid:contentUid}]};
    assert.fail('Unexpected SQL');
  }};
  const adapter=new LoyalFansFulfillmentAdapter({db,enabled:false});
  const result=await adapter.onMediaReady({provider:'loyalfans',videoId:'video-neutral'},
    {provider:'loyalfans',contentUid,media:{uid:mediaUid}},
    {assetId:'private-master-neutral',duplicate:true});
  assert.deepEqual(result,{catalogueProductPresent:true});
  const update=calls[1];
  assert.deepEqual(update.values,[contentUid,mediaUid,'private-master-neutral',true,'video-neutral']);
  assert.match(update.sql,/m\.external_content_uid=p\.loyalfans_post_uid/);
  assert.match(update.sql,/a\.visibility='private'/);assert.match(update.sql,/a\.processing_state='ready'/);
  assert.doesNotMatch(JSON.stringify(calls),/https:|sig=/);
});

test('JIT can record an existing exact mapped master when ledger media metadata is absent',async()=>{
  const calls=[];
  const db={query:async(sql,values)=>{
    calls.push({sql,values});
    if(sql.includes('SELECT loyalfans_post_uid FROM v3_loyalfans_catalogue_products'))return{rowCount:1,rows:[{loyalfans_post_uid:contentUid}]};
    if(sql.includes('UPDATE v3_loyalfans_catalogue_products'))return{rowCount:1,rows:[{loyalfans_post_uid:contentUid}]};
    assert.fail('Unexpected SQL');
  }};
  const adapter=new LoyalFansFulfillmentAdapter({db});
  assert.deepEqual(await adapter.onMediaReady({provider:'loyalfans',videoId:'video-neutral'},
    {provider:'loyalfans',contentUid,media:{uid:null}},{assetId:'private-master-neutral',duplicate:true}),
  {catalogueProductPresent:true});
  assert.equal(calls[1].values[1],null);
  assert.match(calls[1].sql,/\$2::text IS NULL OR p\.loyalfans_video_uid=\$2/);
});
