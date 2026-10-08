import test from 'node:test';
import assert from 'node:assert/strict';
import { LoyalFansCatalogueMasterIngestionService } from './loyalfans-catalogue-master-ingestion.js';
import { mediaError } from './provider-media-ingestion.js';

const postA='neutral-post-uid-000000000001';
const videoA='neutral-video-uid-000000000001';
const postB='neutral-post-uid-000000000002';
const videoB='neutral-video-uid-000000000002';

function harness({products=[postA],existingReady=[],fail=[],expireOnce=[],sourceErrors={}}={}){
  const rows=new Map(products.map((uid)=>[uid,{loyalfans_post_uid:uid,loyalfans_video_uid:uid===postA?videoA:videoB,
    video_legacy_id:uid===postA?null:`legacy-${uid}`,metadata_sync_state:'synced',sync_status:uid===postA?'unmapped':'active',
    source_created_at:'2026-01-01T00:00:00Z',full_video_state:'not_imported',full_video_asset_id:null}]));
  const events=[];const ingested=new Map();const transactions=[];const entitlements=[];const fresh=[];const sourceRequests=[];
  const repository={
    selectProducts:async selection=>{
      let chosen=selection.mode==='single'?[selection.post_uid]:selection.mode==='set'?selection.post_uids:
        selection.mode==='remaining'||selection.mode==='all'?[...rows.keys()]:[...rows.keys()].slice(0,selection.limit);
      return chosen.map(uid=>rows.get(uid)).filter(Boolean);
    },
    exactProduct:async uid=>rows.get(uid),
    pending:async uid=>{rows.get(uid).full_video_state='pending';events.push(['pending',uid]);},
    ingesting:async uid=>{rows.get(uid).full_video_state='ingesting';events.push(['ingesting',uid]);},
    failed:async(uid,code)=>{const r=rows.get(uid);r.full_video_state='failed';r.full_video_error_code=code;events.push(['failed',uid,code]);},
    ready:async(uid,mediaUid,assetId,{reused=false}={})=>{
      assert.equal(rows.get(uid).loyalfans_video_uid,mediaUid);
      const r=rows.get(uid);r.full_video_state='ready';r.full_video_asset_id=assetId;r.reused=reused;
      events.push(['ready',uid,assetId,reused]);return{state:'ready',assetId,reused};
    },
    status:async()=>({})
  };
  let active=0,maxActive=0;
  const mediaRuntime={
    prepareContent:async(_provider,uid)=>existingReady.includes(uid)?{state:'MEDIA_READY',assetId:`master-${uid}`}:
      ingested.has(uid)?{state:'MEDIA_READY',assetId:ingested.get(uid)}:{state:'MEDIA_PENDING',assetId:null},
    ingestContent:async(_provider,input)=>{
      active++;maxActive=Math.max(active,maxActive);
      try{
        assert.equal(input.provider,'loyalfans');assert.equal(rows.has(input.contentUid),true);
        assert.equal(input.transactionId,undefined);
        assert.equal(JSON.stringify(input).includes('Signature='),false);
        assert.equal(input.sourceReferer,'https://www.loyalfans.com/');
        assert.equal(JSON.stringify(input).includes('loyalfans.com'),false);
        const url=input.sourceUrl;assert.equal(typeof url,'string');assert.match(url,/^https:\/\/cdn2\.loyalfans\.com\//);
        transactions.push(input.transactionId??null);
        const key=input.contentUid;
        if(expireOnce.includes(key)&&!fresh.includes(key)){fresh.push(key);throw mediaError('MEDIA_SOURCE_EXPIRED',true);}
        if(fail.includes(key))throw mediaError('MEDIA_VALIDATION_FAILED');
        if(ingested.has(key))return{state:'MEDIA_READY',assetId:ingested.get(key),duplicate:true};
        const assetId=`private-master-${key}`;ingested.set(key,assetId);
        return{state:'MEDIA_READY',assetId,duplicate:false};
      }finally{active--;}
    }
  };
  const provider={
    listAllFulfillmentTransactions:async()=>{throw Object.assign(new Error('D2 must use the canonical source resolver.'),{code:'DUPLICATE_RESOLVER_USED'});},
    getCatalogueFullVideoSource:async({postUid,videoUid,dateFrom})=>{
      sourceRequests.push({postUid,videoUid,dateFrom});
      if(sourceErrors[postUid])throw sourceErrors[postUid];
      assert.equal(rows.get(postUid)?.loyalfans_video_uid,videoUid);
      const value={postUid,videoUid,mime:'video/mp4',duration:10,dimensions:{width:1920,height:1080}};
      Object.defineProperty(value,'sourceUrl',{value:`https://cdn2.loyalfans.com/refreshed.mp4?Signature=fresh-${postUid}`,enumerable:false});
      return value;
    }
  };
  const service=new LoyalFansCatalogueMasterIngestionService({db:{},repository,provider,mediaRuntime,enabled:true,maxConcurrency:2});
  return{service,rows,repository,provider,events,ingested,transactions,entitlements,fresh,sourceRequests,mediaRuntime,active:()=>active,maxActive:()=>maxActive};
}

test('unmapped synced catalogue product receives the generic private master without mapping or commerce writes',async()=>{
  const h=harness();const result=await h.service.run({mode:'single',post_uid:postA});
  assert.deepEqual({status:result.status,ready:result.ready,failed:result.failed},{status:'complete',ready:1,failed:0});
  assert.equal(h.rows.get(postA).video_legacy_id,null);assert.equal(h.rows.get(postA).full_video_state,'ready');
  assert.equal(h.events.filter(event=>event[0]==='ready').length,1);assert.deepEqual(h.transactions,[null]);
  assert.deepEqual(h.entitlements,[]);
});

test('mapped product reuses an existing exact READY FLESHLAB master and skips download',async()=>{
  const h=harness({products:[postB],existingReady:[postB]});
  const result=await h.service.run({mode:'single',post_uid:postB});
  assert.equal(result.reused,1);assert.equal(h.rows.get(postB).full_video_asset_id,`master-${postB}`);
  assert.equal(h.ingested.size,0);assert.equal(h.sourceRequests.length,0);
});

test('master ingestion uses the canonical fresh source resolver with exact IDs and source date only',async()=>{
  const h=harness();
  const result=await h.service.run({mode:'single',post_uid:postA});
  assert.equal(result.ready,1);
  assert.deepEqual(h.sourceRequests,[{postUid:postA,videoUid:videoA,dateFrom:'2026-01-01'}]);
  assert.deepEqual(h.transactions,[null]);
});

test('D2 never creates or changes exact content mappings',async()=>{
  const h=harness();await h.service.run({mode:'single',post_uid:postA});
  assert.equal(h.rows.get(postA).video_legacy_id,null);
  assert.equal(h.events.some(event=>String(event[0]).includes('mapping')),false);
});

test('valid full video advances to ready while private asset identity is the only persisted value',async()=>{
  const h=harness();const result=await h.service.run({mode:'single',post_uid:postA});
  assert.equal(result.ready,1);assert.match(h.rows.get(postA).full_video_asset_id,/^private-master-/);
  assert.doesNotMatch(JSON.stringify(h.rows.get(postA)),/cdn2|Expires|Signature|https:/);
});

test('invalid or truncated video fails only its product and never reaches READY',async()=>{
  const h=harness({fail:[postA]});const result=await h.service.run({mode:'single',post_uid:postA});
  assert.equal(result.failed,1);assert.equal(h.rows.get(postA).full_video_state,'failed');
  assert.notEqual(h.rows.get(postA).full_video_state,'ready');
});

test('expired source is reacquired using exact post/media UIDs and retried once',async()=>{
  const h=harness({expireOnce:[postA]});const result=await h.service.run({mode:'single',post_uid:postA});
  assert.equal(result.ready,1);assert.deepEqual(h.fresh,[postA]);assert.equal(h.sourceRequests.length,2);
});

test('signed source never enters persisted job state, result JSON, or diagnostics',async()=>{
  const h=harness();const result=await h.service.run({mode:'single',post_uid:postA});
  assert.doesNotMatch(JSON.stringify({result,row:h.rows.get(postA),events:h.events,requests:h.sourceRequests}),/cdn2|Expires|Signature|neutral-secret|https:/);
});

test('second identical run is idempotent and does not request source again',async()=>{
  const h=harness();await h.service.run({mode:'single',post_uid:postA});
  const sourceCalls=h.sourceRequests.length;
  const result=await h.service.run({mode:'single',post_uid:postA});
  assert.equal(result.unchanged,1);assert.equal(result.ready,0);assert.equal(h.ingested.size,1);assert.equal(h.sourceRequests.length,sourceCalls);
});

test('explicit set and small limited-batch modes remain bounded and per-item isolated',async()=>{
  const h=harness({products:[postA,postB],fail:[postA]});
  const result=await h.service.run({mode:'set',post_uids:[postA,postB]});
  assert.equal(result.status,'partial');
  assert.equal(result.ready,1);assert.equal(result.failed,1);assert.equal(h.rows.get(postB).full_video_state,'ready');
  assert.ok(h.maxActive()<=2);
});

test('resume processes unfinished products and an explicit retry can recover a failed product',async()=>{
  const h=harness({products:[postA],fail:[postA]});
  await h.service.run({mode:'single',post_uid:postA});assert.equal(h.rows.get(postA).full_video_state,'failed');
  h.mediaRuntime.ingestContent=async(_provider,input)=>({state:'MEDIA_READY',assetId:`private-master-${input.contentUid}`,duplicate:false});
  const retry=await h.service.run({mode:'remaining',retry_failed:true});
  assert.equal(retry.ready,1);assert.equal(h.rows.get(postA).full_video_state,'ready');
});

test('canonical provider errors keep their safe code and do not abort sibling products',async()=>{
  const h=harness({products:[postA,postB],sourceErrors:{[postA]:Object.assign(new Error('redacted provider failure'),
    {code:'LOYALFANS_INCOMPLETE_HISTORY'})}});
  const result=await h.service.run({mode:'all'});
  assert.equal(result.failed,1);assert.equal(result.ready,1);
  assert.equal(result.results.find(row=>row.post_uid===postA).error_code,'LOYALFANS_INCOMPLETE_HISTORY');
});

test('canonical resolver source stays transient and never appears in persisted or returned data',async()=>{
  const h=harness();
  const result=await h.service.run({mode:'single',post_uid:postA});
  assert.equal(result.ready,1);assert.equal(result.failed,0);
  assert.equal(h.rows.get(postA).full_video_state,'ready');
  assert.doesNotMatch(JSON.stringify({result,row:h.rows.get(postA),events:h.events,requests:h.sourceRequests}),/Expires|Signature|cdn2|https:/);
});

test('failed full-video product retries through the supported retry_failed flag',async()=>{
  const h=harness({fail:[postA]});
  const first=await h.service.run({mode:'single',post_uid:postA});
  assert.equal(first.failed,1);assert.equal(h.rows.get(postA).full_video_state,'failed');
  h.mediaRuntime.ingestContent=async(_provider,input)=>({state:'MEDIA_READY',assetId:`private-master-${input.contentUid}`,duplicate:false});
  const retried=await h.service.run({mode:'single',post_uid:postA,retry_failed:true});
  assert.equal(retried.ready,1);assert.equal(h.rows.get(postA).full_video_state,'ready');
  assert.deepEqual(h.sourceRequests.map(request=>request.postUid),[postA,postA]);
});

test('runtime remains disabled by default and no D2 path creates commerce rows',async()=>{
  const h=harness();h.service.enabled=false;
  await assert.rejects(h.service.run({mode:'single',post_uid:postA}),{code:'LOYALFANS_FULL_VIDEO_INGESTION_DISABLED'});
  assert.deepEqual(h.entitlements,[]);
});
