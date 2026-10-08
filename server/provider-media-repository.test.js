import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresProviderMediaRepository } from './provider-media-repository.js';
import { PostgresProviderFulfillmentRepository } from './provider-fulfillment-repository.js';

test('PostgreSQL repository locks transaction and content identities, persists no signed sources, and reuses the asset on retry',async()=>{
  const writes=[];const locks=[];const unlocks=[];let releases=0;
  let job={id:'job-1',provider:'sample',external_content_uid:'content-1',state:'MEDIA_PENDING',asset_id:null,attempts:0};
  const client={release:()=>{releases++;},query:async(sql,params=[])=>{
    writes.push({sql,params});
    if(sql.includes('pg_advisory_unlock')){unlocks.push(params[0]);return{rows:[],rowCount:1};}
    if(sql.includes('pg_advisory_lock')){locks.push(params[0]);return{rows:[],rowCount:1};}
    if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return{rows:[],rowCount:0};
    if(sql.includes('SELECT external_content_uid'))return{rows:[],rowCount:0};
    if(sql.includes('INSERT INTO v3_provider_media_jobs'))return{rows:[{...job}],rowCount:1};
    if(sql.includes('SELECT video_legacy_id'))return{rows:[],rowCount:0};
    if(sql.includes('INSERT INTO v3_provider_media_transactions') || sql.includes('INSERT INTO v3_media_assets') ||
      sql.includes('UPDATE v3_media_assets'))return{rows:[],rowCount:1};
    if(sql.includes('UPDATE v3_provider_media_jobs')){
      if(sql.includes("state='MEDIA_INGESTING'")){job={...job,state:'MEDIA_INGESTING',asset_id:params[1],attempts:job.attempts+1};}
      if(sql.includes("state='FAILED'")){job={...job,state:'FAILED',retryable:true,available_at:'2000-01-01',last_error_code:params[1]};}
      if(sql.includes("state='MEDIA_READY'")){job={...job,state:'MEDIA_READY'};}
      return{rows:[{...job}],rowCount:1};
    }
    throw new Error('Unexpected technical SQL query.');
  }};
  const repository=new PostgresProviderMediaRepository({connect:async()=>client});
  const identity={provider:'sample',transactionId:'transaction-1',contentUid:'content-1'};
  let originalAsset;
  await repository.withJob(identity,async j=>{await j.start('video/mp4');originalAsset=j.assetId;await j.failed('MEDIA_SOURCE_EXPIRED',true);});
  await repository.withJob(identity,async j=>{
    await j.start('video/mp4');assert.equal(j.assetId,originalAsset);
    await j.ready({byteSize:24,checksum:'a'.repeat(64),mimeType:'video/mp4',durationSeconds:1,width:1,height:1});
  });
  assert.equal(job.attempts,2);assert.equal(job.state,'MEDIA_READY');assert.equal(releases,2);
  assert.deepEqual(unlocks,[locks[1],locks[0],locks[3],locks[2]]);
  assert.equal(JSON.stringify(writes).includes('https:'),false);
  assert.equal(JSON.stringify(writes).includes('signature'),false);
});

test('PostgreSQL entitlement gate refuses an order without all readiness and identity prerequisites',async()=>{
  const queries=[];
  const repository=new PostgresProviderFulfillmentRepository({query:async(sql)=>{
    queries.push(sql);
    if(sql.startsWith('SELECT processor'))return{rows:[{processor:'sample'}],rowCount:1};
    return{rows:[],rowCount:0};
  }});
  await assert.rejects(repository.complete('order-1','transaction-1'),{code:'MEDIA_ENTITLEMENT_PRECONDITION_FAILED'});
  assert.equal(queries.some(sql=>sql.includes('INSERT INTO v3_commerce_content_entitlements')),false);
  assert.equal(queries.at(-1),'ROLLBACK');
});

test('unlinked reversal is persisted without changing orders or entitlements',async()=>{
  const queries=[];let released=false;
  const client={release:()=>{released=true;},query:async(sql)=>{
    queries.push(sql);
    if(sql.startsWith('SELECT * FROM v3_provider_reversal_observations'))return{
      rows:[{provider:'sample',observation_id:'observation-1',authority_verified:true,original_transaction_id:null}],rowCount:1};
    return{rows:[],rowCount:1};
  }};
  const repository=new PostgresProviderFulfillmentRepository({connect:async()=>client});
  assert.deepEqual(await repository.reversal({provider:'sample',id:'observation-1',type:'chargeback',
    authorityVerified:true,originalTransactionId:null}),{linked:false,revoked:false});
  assert.equal(queries.some(sql=>sql.includes('UPDATE v3_commerce')),false);assert.equal(released,true);
});
