import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPaymentEvidence,matchProviderTransaction,assertFulfillmentTransition,
  ProviderTransactionFulfillmentService } from './provider-transaction-fulfillment.js';
import { mediaError } from './provider-media-ingestion.js';

const order={id:'order-1',provider:'sample',contentUid:'content-1',buyerUid:'buyer-1',buyerVerified:true,
  transactionType:'clip_store',amountMinor:199,currency:'USD',state:'VERIFICATION_PENDING'};
const evidence={authorityVerified:true,kind:'ledger_sale',postingConfirmed:true,chargeMinor:199,
  payoutMinor:159,feeMinor:40,rate:20,timestamp:'2026-01-01T00:00:00Z'};
const sale={provider:'sample',transactionId:'transaction-1',contentUid:'content-1',buyerUid:'buyer-1',
  transactionType:'clip_store',amountMinor:199,currency:'USD',authorityVerified:true,evidence,
  media:{sourceUrl:'https://media.example.test/file?signature=temporary',mimeType:'video/mp4'}};

test('POSTED requires authoritative posting attestation without an upstream status field',()=>{
  assert.equal(classifyPaymentEvidence(evidence,sale.transactionId),'POSTED');
  assert.equal(classifyPaymentEvidence({...evidence,postingConfirmed:false},sale.transactionId),'FINALITY_UNKNOWN');
  assert.equal(classifyPaymentEvidence({...evidence,authorityVerified:false},sale.transactionId),'FINALITY_UNKNOWN');
  assert.throws(()=>matchProviderTransaction(order,sale),{code:'MEDIA_PURCHASE_VERIFICATION_REQUIRED'});
  assert.equal(matchProviderTransaction(order,sale,{acceptPosted:true}).finality,'POSTED');
});

for(const changed of [{buyerUid:'different'},{contentUid:'different'},{amountMinor:200},
  {currency:'EUR'},{transactionId:''},{transactionType:'other'},{authorityVerified:false}]) {
  test(`matching rejects ${Object.keys(changed)[0]} mismatch`,()=>{
    assert.throws(()=>matchProviderTransaction(order,{...sale,...changed},{acceptPosted:true}));
  });
}

test('reversal evidence requires exact original transaction linkage',()=>{
  const reversal={authorityVerified:true,kind:'reversal',type:'chargeback',originalTransactionId:'transaction-1'};
  assert.equal(classifyPaymentEvidence(reversal,'transaction-1'),'REVERSED');
  assert.equal(classifyPaymentEvidence(reversal,'transaction-2'),'FINALITY_UNKNOWN');
  assert.equal(classifyPaymentEvidence({...reversal,originalTransactionId:null},'transaction-1'),'FINALITY_UNKNOWN');
});

function harness() {
  const current={...order};const transitions=[];const observations=[];let grants=0;let calls=0;let failing=false;
  let lock=Promise.resolve();
  const repository={
    async withOrder(_id,run){const previous=lock;let release;lock=new Promise(r=>{release=r;});await previous;try{return await run(repository);}finally{release();}},
    order:async()=>({...current}),
    transition:async(_id,state)=>{assertFulfillmentTransition(current.state,state);current.state=state;transitions.push(state);},
    bindTransaction:async()=>{},
    markReady:async()=>{assertFulfillmentTransition(current.state,'MEDIA_READY');current.state='MEDIA_READY';transitions.push(current.state);},
    complete:async()=>{assert.equal(current.state,'MEDIA_READY');grants++;current.state='FULFILLED';transitions.push(current.state);},
    fail:async()=>{current.state='FAILED';},
    reversal:async observation=>{observations.push(observation);const linked=observation.authorityVerified && observation.originalTransactionId===sale.transactionId;return{linked,revoked:linked};}
  };
  let reversal={provider:'sample',id:'reversal-1',type:'reimbursement',authorityVerified:true};
  const service=new ProviderTransactionFulfillmentService({repository,acceptPosted:true,
    verifyEvidence:async request=>request.operation==='reversal'?reversal:sale,
    media:{ingest:async()=>{calls++;assert.equal(grants,0);assert.equal(current.state,'MEDIA_INGESTING');
      if(failing)throw mediaError('MEDIA_SOURCE_EXPIRED',true);return{state:'MEDIA_READY',assetId:'asset-1'};}}
  });
  return{service,transitions,observations,stats:()=>({grants,calls,state:current.state}),
    fail:()=>{failing=true;},retry:()=>{failing=false;},link:()=>{reversal={...reversal,originalTransactionId:sale.transactionId};}};
}

test('MEDIA_PENDING to MEDIA_READY to FULFILLED grants only after readiness, duplicate orders grant once',async()=>{
  const h=harness();await Promise.all([h.service.fulfill(order.id),h.service.fulfill(order.id)]);
  assert.deepEqual(h.transitions,['MEDIA_PENDING','MEDIA_INGESTING','MEDIA_READY','FULFILLED']);
  assert.deepEqual(h.stats(),{grants:1,calls:1,state:'FULFILLED'});
});

test('failed ingestion creates no entitlement; retry re-verifies and completes',async()=>{
  const h=harness();h.fail();await assert.rejects(h.service.fulfill(order.id),{code:'MEDIA_SOURCE_EXPIRED'});
  assert.deepEqual(h.stats(),{grants:0,calls:1,state:'FAILED'});
  h.retry();await h.service.fulfill(order.id);assert.equal(h.stats().grants,1);
});

test('unlinked reversal observations are retained separately; exact authoritative linkage may revoke',async()=>{
  const h=harness();assert.deepEqual(await h.service.observeReversal('reversal-1'),{linked:false,revoked:false});
  h.link();assert.deepEqual(await h.service.observeReversal('reversal-1'),{linked:true,revoked:true});
  assert.equal(h.observations.length,2);assert.equal(JSON.stringify(h.observations).includes('signature'),false);
});

test('state machine rejects direct grants from unready states',()=>{
  for(const state of ['VERIFICATION_PENDING','MEDIA_PENDING','MEDIA_INGESTING','FAILED']) {
    assert.throws(()=>assertFulfillmentTransition(state,'FULFILLED'),{code:'MEDIA_STATE_TRANSITION_INVALID'});
  }
});
