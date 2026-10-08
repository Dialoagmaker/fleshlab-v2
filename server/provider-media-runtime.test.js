import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderMediaRuntime,normalizeProviderMediaSubmission } from './provider-media-runtime.js';
import { loadConfig } from './config.js';
import { validateSignedMediaSource } from './provider-media-ingestion.js';

test('host configuration permits exact hosts and explicit subdomains only',()=>{
  const config=loadConfig({PROVIDER_MEDIA_ENABLED:'true',PROVIDER_MEDIA_ALLOWED_HOSTS:'media.example.test',
    PROVIDER_MEDIA_ALLOWED_SUBDOMAIN_ROOTS:'cdn.example.test'});
  assert.equal(config.providerMedia.enabled,true);
  assert.equal(validateSignedMediaSource('https://media.example.test/a',config.providerMedia.allowedHosts).hostname,'media.example.test');
  assert.equal(validateSignedMediaSource('https://a.cdn.example.test/a',[],config.providerMedia.allowedSubdomains).hostname,'a.cdn.example.test');
  for(const url of ['https://cdn.example.test/a','https://evilcdn.example.test/a','https://cdn.example.test.evil.test/a']){
    assert.throws(()=>validateSignedMediaSource(url,[],config.providerMedia.allowedSubdomains),{code:'MEDIA_HOST_NOT_ALLOWED'});
  }
  assert.throws(()=>validateSignedMediaSource('https://media.example.test/a',['*.example.test']),{code:'MEDIA_HOST_POLICY_INVALID'});
  assert.equal(loadConfig({}).loyalFans.fullVideoIngestionEnabled,false);
});

test('disabled runtime cannot execute media or database writes',async()=>{
  const runtime=createProviderMediaRuntime({db:{},blob:{},config:{providerMedia:{enabled:false}}});
  const adapter=runtime.registerAdapter('sample',{transactionType:'sale',verifyTransaction:async()=>assert.fail('disabled adapter called')});
  await assert.rejects(adapter.submit('order-1',{provider:'sample'}),{code:'MEDIA_SERVICE_DISABLED'});
  await assert.rejects(runtime.prepareContent('sample','neutral-content-uid-000001'),{code:'MEDIA_SERVICE_DISABLED'});
  await assert.rejects(runtime.ingestContent('sample',{provider:'sample',contentUid:'neutral-content-uid-000001'}),{code:'MEDIA_SERVICE_DISABLED'});
  assert.deepEqual(runtime.status(),{configured:false,registeredProviders:['sample']});
});

test('adapter errors never escape as raw URL, token or message',async()=>{
  const fakeDb={connect:async()=>({query:async(sql)=>{
    if(sql.includes('FROM v3_commerce_orders o'))return{rowCount:1,rows:[{id:'order-1',processor:'sample',
      provider_fulfillment_state:'VERIFICATION_PENDING'}]};return{rowCount:0,rows:[]};},release(){}})};
  const runtime=createProviderMediaRuntime({db:fakeDb,blob:{},config:{providerMedia:{enabled:true}}});
  const adapter=runtime.registerAdapter('sample',{transactionType:'sale',verifyTransaction:async()=>{
    throw Object.assign(new Error('https://media.example.test/a?sig=secret'),{code:'https://media.example.test/a?sig=secret'});
  }});
  await assert.rejects(adapter.submit('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',{provider:'sample'}),error=>{
    assert.equal(error.code,'MEDIA_ADAPTER_FAILED');assert.equal(error.message.includes('secret'),false);return true;
  });
});

test('technical submission selects only the documented neutral contract fields',()=>{
  const normalized=normalizeProviderMediaSubmission({provider:'sample',provider_transaction_id:'tx-1',
    external_buyer_uid:'buyer-1',external_content_uid:'content-1',amount_minor:199,currency:'USD',
    temporary_media_url:'https://media.example.test/a?sig=temporary',mime_type:'video/mp4',
    unwanted_field:'discard'});
  assert.equal(normalized.transactionId,'tx-1');assert.equal('unwanted_field' in normalized,false);
  assert.equal('authorityVerified' in normalized,false);
  assert.equal(normalized.media.sourceUrl,'https://media.example.test/a?sig=temporary');
  assert.equal(JSON.stringify(normalized).includes('sig=temporary'),false);
});

test('technical provider normalization accepts the adapter media and transaction contract',()=>{
  const normalized=normalizeProviderMediaSubmission({provider:'loyalfans',provider_transaction_id:'tx-neutral',
    provider_transaction_type:'clip_store',provider_transaction_timestamp:'2026-01-01T00:00:00Z',
    external_media_uid:'media-neutral',expected_mime:'video/mp4',expected_duration:1,
    expected_dimensions:{width:64,height:64},temporary_media_url:'https://media.example.test/a?sig=neutral'});
  assert.equal(normalized.transactionType,'clip_store');assert.equal(normalized.timestamp,'2026-01-01T00:00:00Z');
  assert.equal(normalized.media.uid,'media-neutral');assert.equal(normalized.media.mimeType,'video/mp4');
  assert.equal(normalized.media.durationSeconds,1);assert.deepEqual(normalized.media.dimensions,{width:64,height:64});
  assert.equal(JSON.stringify(normalized).includes('sig=neutral'),false);
});
