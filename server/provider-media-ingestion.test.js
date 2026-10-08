import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { SignedSourceMediaIngestionService, openSignedMediaSource, validateStoredProviderMedia, mediaError } from './provider-media-ingestion.js';

const bytes = Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypisom'),Buffer.alloc(64)]);
const checksum = createHash('sha256').update(bytes).digest('hex');
const input = { provider: 'sample',transactionId: 'transaction-1',contentUid: 'content-1',
  sourceUrl: 'https://media.example.test/file?signature=temporary-secret',expectedMime: 'video/mp4',
  expectedDuration: 10,expectedBytes: bytes.length };

function harness() {
  const jobs = new Map(); const transactions = new Map(); const locks = new Map();
  const objects = new Map(); const persisted = []; const states = [];
  let downloads = 0; let uploads = 0; let sourceStatus = 200; let invalid = false;
  const repository = { async withJob(identity,run) {
    const key = `${identity.provider}:${identity.contentUid}`;
    const previous = locks.get(key) || Promise.resolve(); let unlock;
    const gate = new Promise(resolve => { unlock=resolve; }); locks.set(key,gate);
    await previous;
    try {
      const tx = `${identity.provider}:${identity.transactionId}`;
      if (transactions.has(tx) && transactions.get(tx) !== key) throw mediaError('MEDIA_TRANSACTION_CONFLICT');
      transactions.set(tx,key); persisted.push(identity);
      let job = jobs.get(key);
      if (!job) {
        job = { state: 'MEDIA_PENDING',assetId: 'asset-1',objectKey: `private/${identity.contentUid}`,attempts: 0,
          start: async () => { job.state='MEDIA_INGESTING'; job.attempts++; states.push(job.state); },
          ready: async metadata => { job.state='MEDIA_READY'; persisted.push(metadata); states.push(job.state); },
          failed: async (code,retryable) => { job.state='FAILED'; job.error=code; job.retryable=retryable; states.push(job.state); }
        }; jobs.set(key,job);
      }
      if (job.state==='FAILED' && !job.retryable) throw mediaError('MEDIA_RETRY_NOT_ALLOWED');
      return await run(job);
    } finally { unlock(); }
  } };
  const blob = {
    verifyPrivateContainer: async container => { assert.equal(container,'private-assets'); return true; },
    uploadStream: async (key,stream,mime,options) => {
      assert.equal(options.container,'private-assets'); assert.equal(mime,'video/mp4'); uploads++;
      const parts=[]; for await(const chunk of stream) parts.push(chunk); objects.set(key,Buffer.concat(parts));
    },
    verifyObject: async key => objects.has(key) ? { byteSize: objects.get(key).length } : null,
    deleteObject: async key => { objects.delete(key); },
    downloadStream: async key => ({ stream: Readable.from(objects.get(key)),contentLength: objects.get(key).length })
  };
  const service = new SignedSourceMediaIngestionService({ repository,blob,privateContainer:'private-assets',allowedHosts:['media.example.test'],
    openSource: async (url,options) => {
      assert.equal(url.protocol,'https:'); assert.ok(options.signal); assert.equal(options.sourceReferer,undefined); assert.deepEqual(Object.keys(options).sort(),['signal','sourceReferer']); downloads++;
      return { status:sourceStatus,headers:{ 'content-type':'video/mp4','content-length':String(bytes.length) },stream:Readable.from(bytes) };
    },
    validateMedia: async options => {
      if(invalid) throw mediaError('MEDIA_VALIDATION_FAILED');
      return validateStoredProviderMedia({ ...options,probeMedia: async (command,args) => {
        assert.equal(command,'ffprobe'); assert.equal(args.includes(input.sourceUrl),false);
        return { stdout: JSON.stringify({ format:{ duration:'10',format_name:'mov,mp4' },
          streams:[{ codec_type:'video',width:1280,height:720 }] }) };
      } });
    }
  });
  return { service,blob,jobs,transactions,persisted,states,objects,
    counts:()=>({downloads,uploads,jobs:jobs.size,transactions:transactions.size}),
    expire:()=>{sourceStatus=403;},restore:()=>{sourceStatus=200;},invalidate:()=>{invalid=true;} };
}

test('signed source streams into private storage, validates stored bytes, and persists only durable metadata',async()=>{
  const h=harness(); const result=await h.service.ingest(input);
  assert.equal(result.state,'MEDIA_READY'); assert.deepEqual(h.states,['MEDIA_INGESTING','MEDIA_READY']);
  assert.equal(h.persisted.at(-1).checksum,checksum);
  assert.equal(JSON.stringify(h.persisted).includes('temporary-secret'),false);
  assert.equal(JSON.stringify(h.persisted).includes('https:'),false);
});

test('optional source referer is forwarded without persistence or provider credentials',async()=>{
  const h=harness();let seen;
  h.service.openSource=async(_url,options)=>{seen=options;return{status:200,headers:{'content-type':'video/mp4','content-length':String(bytes.length)},stream:Readable.from(bytes)};};
  const request={...input};Object.defineProperty(request,'sourceReferer',{value:'https://www.loyalfans.com/',enumerable:false});
  await h.service.ingest(request);
  assert.equal(seen.sourceReferer,'https://www.loyalfans.com/');assert.deepEqual(Object.keys(seen).sort(),['signal','sourceReferer']);
  assert.equal('authorization' in seen,false);assert.equal('cookie' in seen,false);assert.equal('xsrf' in seen,false);
  assert.equal(JSON.stringify(request).includes('loyalfans.com'),false);assert.equal(JSON.stringify(h.persisted).includes('loyalfans.com'),false);
});

test('source referer policy rejects non-HTTPS, credentials and fragments before any network access',async()=>{for(const sourceReferer of ['http://www.loyalfans.com/','https://user:pass@www.loyalfans.com/','https://www.loyalfans.com/#private'])await assert.rejects(openSignedMediaSource(new URL('https://media.example.test/file'),{sourceReferer}),{code:'MEDIA_REFERER_INVALID'});});

for(const sourceUrl of ['http://media.example.test/a','https://evil.example.test/a',
  'https://media.example.test.evil.test/a','https://127.0.0.1/a','https://media.example.test:8443/a']) {
  test(`source policy rejects invalid source ${sourceUrl}`,async()=>{
    const h=harness(); await assert.rejects(h.service.ingest({...input,sourceUrl}),{code:'MEDIA_HOST_NOT_ALLOWED'});
    assert.equal(h.counts().downloads,0); assert.equal(h.counts().uploads,0);
  });
}

test('public Azure container never receives the source',async()=>{
  const h=harness(); h.blob.verifyPrivateContainer=async()=>false;
  await assert.rejects(h.service.ingest(input),{code:'MEDIA_STORAGE_NOT_PRIVATE'});
  assert.equal(h.counts().downloads,0);
});

test('redirect response is rejected without following or persisting its target URL',async()=>{
  const h=harness();let requests=0;
  h.service.openSource=async()=>{
    requests++;
    return{status:302,headers:{location:'https://not-allowed.example.test/a?sig=private'},stream:Readable.from([])};
  };
  await assert.rejects(h.service.ingest(input),{code:'MEDIA_REDIRECT_REJECTED'});
  assert.equal(requests,1);assert.equal(h.counts().uploads,0);
  assert.equal(JSON.stringify(h.persisted).includes('sig=private'),false);
});

test('expired source records retryable failure and a fresh source succeeds on retry',async()=>{
  const h=harness();h.expire();await assert.rejects(h.service.ingest(input),{code:'MEDIA_SOURCE_EXPIRED'});
  assert.equal([...h.jobs.values()][0].state,'FAILED');assert.equal([...h.jobs.values()][0].retryable,true);
  h.restore();await h.service.ingest({...input,sourceUrl:'https://media.example.test/file?signature=renewed'});
  assert.equal([...h.jobs.values()][0].attempts,2);assert.equal(h.counts().jobs,1);
});

test('duplicate and concurrent transactions/jobs reuse one private asset',async()=>{
  const h=harness();const results=await Promise.all([h.service.ingest(input),h.service.ingest(input),
    h.service.ingest({...input,transactionId:'transaction-2'})]);
  assert.equal(results.filter(r=>r.duplicate).length,2);
  assert.deepEqual(h.counts(),{downloads:1,uploads:1,jobs:1,transactions:2});
  await assert.rejects(h.service.ingest({...input,contentUid:'content-2'}),{code:'MEDIA_TRANSACTION_CONFLICT'});
});

test('checksum failure deletes the uploaded object and never marks it ready',async()=>{
  const h=harness();await assert.rejects(h.service.ingest({...input,expectedChecksum:'0'.repeat(64)}),{code:'MEDIA_CHECKSUM_MISMATCH'});
  assert.equal(h.objects.size,0);assert.equal(h.states.includes('MEDIA_READY'),false);
});

test('media validation failure leaves no usable object or ready asset',async()=>{
  const h=harness();h.invalidate();await assert.rejects(h.service.ingest(input),{code:'MEDIA_VALIDATION_FAILED'});
  assert.equal(h.objects.size,0);assert.equal(h.states.includes('MEDIA_READY'),false);
});

test('stored object checksum is validated independently from the upload stream',async()=>{
  const corrupt=Buffer.from(bytes);corrupt[20]=1;
  await assert.rejects(validateStoredProviderMedia({ blob:{downloadStream:async()=>({stream:Readable.from(corrupt)})},
    objectKey:'private/source',byteSize:bytes.length,checksum,mimeType:'video/mp4',signal:new AbortController().signal }),
  {code:'MEDIA_CHECKSUM_MISMATCH'});
});

test('missing media validator is explicit and cannot make an asset ready',async()=>{
  await assert.rejects(validateStoredProviderMedia({ blob:{downloadStream:async()=>({stream:Readable.from(bytes)})},
    objectKey:'private/source',byteSize:bytes.length,checksum,mimeType:'video/mp4',signal:new AbortController().signal,
    probeMedia:async()=>{throw Object.assign(new Error('unavailable'),{code:'ENOENT'});} }),{code:'MEDIA_VALIDATOR_UNAVAILABLE'});
});

test('unknown READY commit outcome preserves private bytes for durable-state retry',async()=>{
  const h=harness();
  h.service.repository.withJob=async(_identity,run)=>run({state:'MEDIA_PENDING',assetId:'asset-1',objectKey:'private/content-1',
    start:async()=>{},ready:async()=>{throw new Error('commit outcome unknown');},
    failed:async()=>{assert.fail('A potentially committed READY asset must not be changed to failed.');}});
  await assert.rejects(h.service.ingest(input),{code:'MEDIA_READY_COMMIT_UNKNOWN'});
  assert.equal(h.objects.size,1);
});

test('dimension mismatch cleans up the source and never marks READY',async()=>{
  const h=harness();await assert.rejects(h.service.ingest({...input,expectedDimensions:{width:1920,height:1080}}),{code:'MEDIA_DIMENSIONS_MISMATCH'});
  assert.equal(h.objects.size,0);assert.equal(h.states.includes('MEDIA_READY'),false);
});

test('swapped width and height from provider metadata are accepted as the same video geometry',async()=>{
  const h=harness();const result=await h.service.ingest({...input,expectedDimensions:{width:720,height:1280},expectedDimensionsToleranceRatio:0.02});
  assert.equal(result.state,'MEDIA_READY');assert.equal(h.states.includes('MEDIA_READY'),true);
});

test('READY master reuse requires no temporary source, MIME or duration',async()=>{
  const h=harness();h.service.repository.withJob=async(_identity,run)=>run({state:'MEDIA_READY',assetId:'existing-master'});
  const result=await h.service.ingest({provider:'sample',transactionId:'transaction-reuse',contentUid:'content-reuse'});
  assert.equal(result.assetId,'existing-master');assert.equal(result.duplicate,true);assert.equal(h.counts().downloads,0);
});

test('catalogue D2 ingestion uses the exact provider/content identity without inventing a transaction row',async()=>{
  const calls=[];let ready=false;
  const repository={withJob:async(identity,run)=>{
    calls.push(identity);
    const job={state:ready?'MEDIA_READY':'MEDIA_PENDING',assetId:ready?'asset-master':'asset-d2',objectKey:'private/d2-master',
      start:async()=>{},ready:async()=>{ready=true;},failed:async()=>{}};
    return run(job);
  }};
  const uploaded=[];
  const blob={verifyPrivateContainer:async()=>true,uploadStream:async(_key,stream,mimeType)=>{
    uploaded.push(mimeType);for await(const _chunk of stream){};
  },verifyObject:async()=>({byteSize:bytes.length}),deleteObject:async()=>{},
    downloadStream:async()=>({stream:Readable.from(bytes)})};
  const service=new SignedSourceMediaIngestionService({repository,blob,privateContainer:'private-assets',allowedHosts:['media.example.test'],
    openSource:async()=>({status:200,headers:{'content-type':'application/octet-stream','content-length':String(bytes.length)},stream:Readable.from(bytes)}),
    validateMedia:async()=>({durationSeconds:10,width:1280,height:720})});
  const contentInput={provider:'loyalfans',contentUid:'neutral-post-uid-000000000001',
    expectedMime:'video/mp4',expectedDuration:10};
  Object.defineProperty(contentInput,'sourceUrl',{value:'https://media.example.test/source?sig=temporary',enumerable:false});
  const result=await service.ingestContent(contentInput);
  assert.equal(result.state,'MEDIA_READY');assert.deepEqual(uploaded,['video/mp4']);
  assert.equal(calls[0].transactionId,null);assert.equal(JSON.stringify(calls).includes('sig=temporary'),false);
  const reused=await service.ingestContent({provider:'loyalfans',contentUid:'neutral-post-uid-000000000001'});
  assert.equal(reused.assetId,'asset-master');assert.equal(reused.duplicate,true);
});

test('content-only identity still requires an exact provider and content UID',async()=>{
  const h=harness();
  await assert.rejects(h.service.ingestContent({provider:'loyalfans',sourceUrl:'https://media.example.test/a'}),
    {code:'MEDIA_IDENTITY_INVALID'});
});

test('missing Content-Type accepts byte-verified MP4 while HTML/XML fails closed',async()=>{
  const h=harness();
  h.service.openSource=async()=>({status:200,headers:{'content-length':String(bytes.length)},stream:Readable.from(bytes)});
  assert.equal((await h.service.ingest(input)).state,'MEDIA_READY');
  const bad=harness();
  bad.service.openSource=async()=>({status:200,headers:{'content-type':'text/html'},stream:Readable.from(Buffer.from('<html>error</html>'))});
  await assert.rejects(bad.service.ingest(input),{code:'MEDIA_VALIDATION_FAILED'});
  assert.equal(bad.objects.size,0);
});
test('catalogue ingestContent preserves the transient non-enumerable source referer',async()=>{const h=harness();let seen;h.service.openSource=async(_url,options)=>{seen=options;return{status:200,headers:{'content-type':'video/mp4','content-length':String(bytes.length)},stream:Readable.from(bytes)};};const request={provider:'sample',contentUid:'catalogue-content-referer',expectedMime:'video/mp4',expectedDuration:10,expectedBytes:bytes.length};Object.defineProperty(request,'sourceUrl',{value:'https://media.example.test/file?signature=catalogue-secret',enumerable:false});Object.defineProperty(request,'sourceReferer',{value:'https://www.loyalfans.com/',enumerable:false});await h.service.ingestContent(request);assert.equal(seen.sourceReferer,'https://www.loyalfans.com/');assert.equal(JSON.stringify(request).includes('loyalfans.com'),false);assert.equal(JSON.stringify(h.persisted).includes('loyalfans.com'),false);});
