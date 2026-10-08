import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { BlobServiceClient } from '@azure/storage-blob';
import { Readable } from 'node:stream';
import { execFile,spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createProviderMediaRuntime } from './provider-media-runtime.js';
import { createAzureBlob } from './blob.js';
import { validateStoredProviderMedia } from './provider-media-ingestion.js';
import { createHash } from 'node:crypto';
import { LoyalFansFulfillmentAdapter } from './loyalfans-fulfillment-adapter.js';
import { LoyalFansProviderClient } from './loyalfans-provider-client.js';
import { LoyalFansCatalogueSyncService } from './loyalfans-catalogue-sync.js';
import { LoyalFansCatalogueMasterIngestionService } from './loyalfans-catalogue-master-ingestion.js';
import { normalizeLoyalFansCatalogueItem } from './loyalfans-catalogue.js';
import { V3BuyerCommentLinkService } from './v3-buyer-comment-links.js';
import { CommerceProviderRegistry,LoyalFansCommerceAdapter } from './commerce-providers.js';

const exec=promisify(execFile);
const enabled=process.env.PROVIDER_MEDIA_PG_INTEGRATION_ENABLED==='true';
const baseline=`
CREATE TABLE app_users(id uuid PRIMARY KEY);
CREATE TABLE catalog_videos(legacy_id text PRIMARY KEY,status text,v3_lifecycle text,
 legacy_thumbnail_url text,legacy_trailer_url text,legacy_source_media_url text);
CREATE TABLE catalog_performers(legacy_id text PRIMARY KEY);
CREATE TABLE catalog_brands(legacy_id text PRIMARY KEY);
CREATE TABLE v3_commerce_orders(id uuid PRIMARY KEY,user_id uuid REFERENCES app_users(id),product_id text,
 processor text,total_minor bigint,currency text,status text DEFAULT 'pending',
 fulfillment_status text DEFAULT 'pending',created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE v3_commerce_content_entitlements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid REFERENCES app_users(id),video_legacy_id text,order_id uuid UNIQUE REFERENCES v3_commerce_orders(id),
 status text,starts_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),UNIQUE(user_id,video_legacy_id));
`;

test('isolated PostgreSQL, API ffprobe and private-storage fulfillment integration', {skip:!enabled},async t=>{
  const databaseUrl=process.env.PROVIDER_MEDIA_TEST_DATABASE_URL;
  if(!databaseUrl || new URL(databaseUrl).pathname!=='/provider_media_test')throw new Error('An explicitly isolated provider_media_test database is required.');
  const db=new Pool({connectionString:databaseUrl,max:10});
  const schema=`provider_media_${randomUUID().replaceAll('-','')}`;
  let directory;
  let pool;
  let cleanupAzure;
  let cleanupContainer;
  const cleanupKeys=new Set();
  try{
    await db.query(`CREATE SCHEMA ${schema}`);
    pool=new Pool({connectionString:databaseUrl,max:10,options:`-c search_path=${schema},public`});
    await pool.query(baseline);
    const migrations=['0021_v3_media_public_catalogue.sql','0053_v3_catalogue_external_content_mappings.sql',
      '0054_v3_commerce_verified_transactions.sql','0055_v3_hosted_purchase_bridge.sql',
      '0057_v3_buyer_link_reaction_verification.sql','0058_v3_buyer_comment_challenges.sql',
      '0059_v3_loyalfans_catalogue_products.sql','0060_v3_loyalfans_catalogue_operations.sql','0061_v3_provider_media_ingestion.sql',
      '0062_v3_provider_transaction_media_provenance.sql','0063_v3_loyalfans_catalogue_display_size.sql',
      '0064_v3_loyalfans_catalogue_promo_media_status.sql','0065_v3_loyalfans_catalogue_full_video_master.sql'];
    for(const name of migrations){
      const client=await pool.connect();
      try{await client.query('BEGIN');await client.query(await readFile(new URL(`../migrations/${name}`,import.meta.url),'utf8'));await client.query('COMMIT');}
      catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
    }
    await t.test('catalogue display size persists independently of dimensions and exact bytes in PostgreSQL',async()=>{
      const migration=await readFile(new URL('../migrations/0063_v3_loyalfans_catalogue_display_size.sql',import.meta.url),'utf8');
      await pool.query(migration); // Additive migration is repeatable; existing rows remain intact.
      const service=new LoyalFansCatalogueSyncService({db:pool,provider:{listAllCatalogue:async()=>{}},currency:'USD'});
      const item={uid:'neutral-post-filesize-000001',title:'Neutral fixture',price:1.99,
        video_object:{uid:'neutral-media-filesize-000001',size:{width:1920,height:1080},downloadable_video_meta:{size:'262.41MB'}}};
      const normalized=normalizeLoyalFansCatalogueItem(item,{currency:'USD'});
      await service.upsertProduct(pool,{...normalized.metadata,sync_status:'unmapped'},null,null);
      const query=()=>pool.query('SELECT downloadable_size_display,downloadable_size_bytes,width,height,metadata_sync_state,promo_media_state,poster_ingest_state,trailer_ingest_state FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1',[item.uid]);
      assert.deepEqual((await query()).rows[0],{downloadable_size_display:'262.41MB',downloadable_size_bytes:null,width:1920,height:1080,
        metadata_sync_state:'synced',promo_media_state:'partial',poster_ingest_state:'absent',trailer_ingest_state:'absent'});
      await pool.query(await readFile(new URL('../migrations/0064_v3_loyalfans_catalogue_promo_media_status.sql',import.meta.url),'utf8'));
      assert.equal((await query()).rows[0].metadata_sync_state,'synced');
      await service.upsertProduct(pool,{...normalized.metadata,sync_status:'unmapped'},null,null);
      item.video_object.downloadable_video_meta.size='1.13GB';
      await service.upsertProduct(pool,{...normalizeLoyalFansCatalogueItem(item,{currency:'USD'}).metadata,sync_status:'unmapped'},null,null);
      assert.equal((await query()).rows[0].downloadable_size_display,'1.13GB');
      assert.equal((await query()).rows[0].downloadable_size_bytes,null);
      item.video_object.downloadable_video_meta.size=123456789;
      await service.upsertProduct(pool,{...normalizeLoyalFansCatalogueItem(item,{currency:'USD'}).metadata,sync_status:'unmapped'},null,null);
      assert.equal((await query()).rows[0].downloadable_size_bytes,'123456789');assert.equal((await query()).rows[0].downloadable_size_display,null);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1',[item.uid])).rows[0].count,1);
      await assert.rejects(()=>pool.query('UPDATE v3_loyalfans_catalogue_products SET width=0 WHERE loyalfans_post_uid=$1',[item.uid]),{code:'23514'});
      await assert.rejects(()=>pool.query('UPDATE v3_loyalfans_catalogue_products SET downloadable_size_display=$2 WHERE loyalfans_post_uid=$1',[item.uid,'x'.repeat(129)]),{code:'23514'});
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_commerce_content_entitlements')).rows[0].count,0);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_provider_media_jobs')).rows[0].count,0);
    });
    await t.test('catalogue metadata and price persist in PostgreSQL when poster byte validation fails',async()=>{
      const postUid=`neutral-promo-post-${schema}`;
      const mediaUid=`neutral-promo-media-${schema}`;
      const item={uid:postUid,title:'Neutral fixture',price:1.99,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-02T00:00:00Z',
        video_object:{uid:mediaUid,poster:'https://cdn.loyalfans.com/neutral.jpg?sig=temporary'}};
      const service=new LoyalFansCatalogueSyncService({db:pool,provider:{listAllCatalogue:async()=>{}},currency:'USD',
        mediaHosts:['cdn.loyalfans.com'],syncEnabled:true,blob:{uploadStream:async()=>{throw new Error('unexpected upload');}},
        fetchImpl:async()=>new Response('<html>neutral response</html>',{status:200,headers:{'content-type':'image/jpeg'}})});
      const result=await service.syncItems([item],{dryRun:false});
      assert.equal(result.created,1);assert.equal(result.failed,0);assert.equal(result.poster_failures,1);
      const product=(await pool.query(`SELECT current_price_minor,metadata_sync_state,promo_media_state,poster_ingest_state,poster_error_code
        FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1`,[postUid])).rows[0];
      assert.deepEqual(product,{current_price_minor:'199',metadata_sync_state:'synced',promo_media_state:'partial',
        poster_ingest_state:'failed',poster_error_code:'CATALOGUE_MEDIA_TYPE_UNSUPPORTED'});
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_loyalfans_catalogue_price_history WHERE loyalfans_post_uid=$1',[postUid])).rows[0].count,1);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_commerce_content_entitlements')).rows[0].count,0);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_provider_media_jobs')).rows[0].count,0);
    });
    await t.test('0065 is additive and repeatable; a product can exist without a legacy master',async()=>{
      const migration=await readFile(new URL('../migrations/0065_v3_loyalfans_catalogue_full_video_master.sql',import.meta.url),'utf8');
      await pool.query(migration);
      const product=(await pool.query(`SELECT full_video_state,full_video_asset_id,full_video_error_code,
        full_video_existing_master_reused,video_legacy_id FROM v3_loyalfans_catalogue_products
        WHERE loyalfans_post_uid='neutral-post-filesize-000001'`)).rows[0];
      assert.deepEqual(product,{full_video_state:'not_imported',full_video_asset_id:null,full_video_error_code:null,
        full_video_existing_master_reused:false,video_legacy_id:null});
      await assert.rejects(()=>pool.query(`UPDATE v3_loyalfans_catalogue_products SET full_video_state='ready'
        WHERE loyalfans_post_uid='neutral-post-filesize-000001'`),{code:'23514'});
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_provider_media_jobs')).rows[0].count,0);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_commerce_content_entitlements')).rows[0].count,0);
    });
    directory=await mkdtemp(join(tmpdir(),'provider-neutral-fixture-'));
    const mediaFile=join(directory,'neutral.mp4');
    await exec('ffmpeg',['-v','error','-f','lavfi','-i','color=c=black:s=64x64:r=10:d=1',
      '-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',mediaFile],{timeout:30000});
    const valid=await readFile(mediaFile);
    const objects=new Map();let uploads=0;let fetches=0;let phase='valid';let failedDuringReady=false;let entitlementBaseline=0;
    const azureUrl=process.env.PROVIDER_MEDIA_TEST_AZURE_STORAGE_ACCOUNT_URL;
    const azureContainer=process.env.PROVIDER_MEDIA_TEST_PRIVATE_CONTAINER;
    const azureMode=process.env.PROVIDER_MEDIA_AZURE_INTEGRATION_ENABLED==='true';
    if(azureMode && (!azureUrl || !azureContainer))throw new Error('Missing explicit Azure test account/container configuration.');
    const emulator=process.env.PROVIDER_MEDIA_TEST_AZURITE_CONNECTION_STRING;
    const emulatorService=emulator?BlobServiceClient.fromConnectionString(emulator):null;
    const azure=azureMode?createAzureBlob({storageAccountUrl:azureUrl,uploadContainer:azureContainer})
      :emulatorService?createAzureBlob({uploadContainer:'private-test-assets'},{serviceClient:emulatorService}):null;
    const container=azureContainer || 'private-test-assets';
    cleanupAzure=azure;cleanupContainer=container;
    if(emulatorService)await emulatorService.getContainerClient(container).createIfNotExists();
    if(azureMode)await t.test('real Azure identity and private container access',async()=>{
      assert.equal(await azure.verifyPrivateContainer(container),true);
    });
    const objectKeys=new Set();
    const blob={
      verifyPrivateContainer:async name=>azure?azure.verifyPrivateContainer(name):true,
      uploadStream:async(key,stream,mime,options)=>{
        uploads++;objectKeys.add(key);cleanupKeys.add(key);
        if(azure)return azure.uploadStream(key,stream,mime,options);
        const parts=[];for await(const chunk of stream)parts.push(chunk);objects.set(key,Buffer.concat(parts));
      },
      verifyObject:async(key,options)=>azure?azure.verifyObject(key,options):objects.has(key)?{byteSize:objects.get(key).length}:null,
      deleteObject:async(key,options)=>azure?azure.deleteObject(key,options):objects.delete(key),
      downloadStream:async(key,options)=>azure?azure.downloadStream(key,options):{
        stream:Readable.from(objects.get(key)),contentLength:objects.get(key).length}
    };
    const config={uploadContainer:container,providerMedia:{enabled:true,allowedHosts:['media.example.test'],
      allowedSubdomains:[],maxBytes:1024*1024,timeoutMs:60000}};
    const runtime=createProviderMediaRuntime({db:pool,blob,config,mediaOptions:{openSource:async()=>{
      fetches++;
      const grants=await pool.query("SELECT count(*)::int AS count FROM v3_commerce_content_entitlements WHERE status='active'");
      if(phase==='no-entitlement-check')assert.equal(grants.rows[0].count,entitlementBaseline);
      if(phase==='expired')return{status:403,headers:{},stream:Readable.from([])};
      const bytes=phase==='corrupt'?Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypisom'),Buffer.alloc(100)]):valid;
      return{status:200,headers:{'content-type':phase==='mime-mismatch'?'video/webm':'video/mp4',
        'content-length':String(bytes.length)},stream:Readable.from(bytes)};
    }}});
    const handles=new Map();
    const adapter=runtime.registerAdapter('sample',{
      acceptPosted:true,
      transactionType:'clip_store',
      verifyTransaction:async(order,candidate)=>{
        const sale=candidate || handles.get(order.id);
        return{...sale,authorityVerified:true,evidence:{authorityVerified:true,kind:'ledger_sale',postingConfirmed:true,
          chargeMinor:199,payoutMinor:159,feeMinor:40,rate:20,timestamp:'2026-01-01T00:00:00Z'}};
      },
      verifyReversal:async id=>({provider:'sample',id,type:'reimbursement',authorityVerified:true})
    });
    const ledger=[];
    const loyalImplementation=new LoyalFansFulfillmentAdapter({client:{listAllFulfillmentTransactions:async()=>({
      authority:'creator_authenticated',complete:true,transactions:ledger})},db:pool,enabled:true,
      ledgerPostedConfirmed:true,settlementCurrency:'USD',allowedHosts:['media.example.test'],
      now:()=>new Date('2026-01-03T00:00:00Z')});
    const loyal=runtime.registerAdapter('loyalfans',loyalImplementation);
    await t.test('D2 imports an unmapped private master once and JIT reuses the same generic content job',async()=>{
      phase='valid';
      const postUid=`neutral-d2-post-${schema}`;const videoUid=`neutral-d2-video-${schema}`;
      const item={uid:postUid,title:'Neutral D2 fixture',price:1.99,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-02T00:00:00Z',
        video_object:{uid:videoUid,video_url:'https://media.example.test/d2?sig=neutral-ephemeral',mime:'video/mp4',duration:1,
          size:{width:64,height:64}}};
      const catalogue=new LoyalFansCatalogueSyncService({db:pool,provider:{listAllCatalogue:async()=>{}},currency:'USD'});
      const normalized=normalizeLoyalFansCatalogueItem(item,{currency:'USD'});
      await catalogue.upsertProduct(pool,{...normalized.metadata,sync_status:'unmapped'},null,null);
      const provider={getCatalogueFullVideoSource:async(request)=>{
        assert.equal(request.postUid,postUid);assert.equal(request.videoUid,videoUid);
        const source={postUid:request.postUid,videoUid:request.videoUid,mime:'video/mp4',duration:1,dimensions:{width:64,height:64}};
        Object.defineProperty(source,'sourceUrl',{value:item.video_object.video_url,enumerable:false});return source;
      }};
      const d2=new LoyalFansCatalogueMasterIngestionService({db:pool,provider,mediaRuntime:runtime,enabled:true,maxConcurrency:1});
      const before={uploads,fetches};
      const imported=await d2.run({mode:'single',post_uid:postUid});
      assert.equal(imported.ready,1);assert.equal(imported.failed,0);
      const product=(await pool.query(`SELECT full_video_state,full_video_asset_id,video_legacy_id
        FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1`,[postUid])).rows[0];
      assert.equal(product.full_video_state,'ready');assert.equal(product.video_legacy_id,null);assert.ok(product.full_video_asset_id);
      const master=(await pool.query(`SELECT j.id,j.state,j.asset_id,j.checksum_sha256,a.visibility,a.processing_state,
        a.storage_reference,a.content_hash,a.byte_size FROM v3_provider_media_jobs j JOIN v3_media_assets a ON a.id=j.asset_id
        WHERE j.provider='loyalfans' AND j.external_content_uid=$1`,[postUid])).rows[0];
      assert.equal(master.state,'MEDIA_READY');assert.equal(master.visibility,'private');assert.equal(master.processing_state,'ready');
      assert.match(master.checksum_sha256,/^[a-f0-9]{64}$/);assert.equal(master.content_hash,master.checksum_sha256);
      assert.equal(Number(master.byte_size),valid.length);assert.match(master.storage_reference,/^provider-media\/loyalfans\//);
      assert.doesNotMatch(master.storage_reference,/^https?:\/\//);assert.equal(uploads-before.uploads,1);
      assert.equal((await pool.query(`SELECT count(*)::int count FROM v3_provider_media_transactions WHERE job_id=$1`,[master.id])).rows[0].count,0);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_catalogue_external_content_mappings WHERE provider=\'loyalfans\' AND external_content_uid=$1',[postUid])).rows[0].count,0);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_commerce_content_entitlements')).rows[0].count,0);
      assert.doesNotMatch(JSON.stringify(product),/sig=|https:/);

      const userId=randomUUID();const orderId=randomUUID();const videoId=`video-${schema}-d2-jit`;
      await pool.query('INSERT INTO app_users(id) VALUES($1)',[userId]);
      await pool.query("INSERT INTO catalog_videos(legacy_id,status,v3_lifecycle) VALUES($1,'published','published')",[videoId]);
      await pool.query("INSERT INTO v3_catalogue_external_content_mappings(provider,external_content_uid,video_legacy_id) VALUES('loyalfans',$1,$2)",[postUid,videoId]);
      await pool.query("UPDATE v3_loyalfans_catalogue_products SET video_legacy_id=$2,sync_status='active' WHERE loyalfans_post_uid=$1",[postUid,videoId]);
      await pool.query("INSERT INTO v3_commerce_buyer_links(provider,user_id,provider_member_uid,status,proof_reference,verified_at) VALUES('loyalfans',$1,'neutral-buyer-d2','verified','neutral-proof',now())",[userId]);
      await pool.query("INSERT INTO v3_commerce_orders(id,user_id,product_id,processor,total_minor,currency,external_content_uid) VALUES($1,$2,$3,'loyalfans',199,'USD',$4)",[orderId,userId,videoId,postUid]);
      const transaction=`neutral-transaction-${schema}`;
      await pool.query("UPDATE v3_commerce_orders SET created_at='2026-01-01T00:00:00Z' WHERE id=$1",[orderId]);
      ledger.push({id:transaction,type:'clip_store',member:{uid:'neutral-buyer-d2'},charge:1.99,payout:1.59,fee:0.40,
        rate:20,created_at:'2026-01-02T12:00:00Z',attached_to:{uid:postUid,video_object:{uid:videoUid,mime:'video/mp4',
          duration:1,size:{width:64,height:64},video_url:'https://media.example.test/expired?sig=not-used'}}});
      const submission={provider:'loyalfans',provider_transaction_id:transaction,external_buyer_uid:'neutral-buyer-d2',
        external_content_uid:postUid,provider_transaction_type:'clip_store',amount_minor:199,currency:'USD',
        finality_evidence:{},temporary_media_url:'https://media.example.test/expired?sig=not-used',expected_mime:'video/mp4',expected_duration:1};
      const fulfilled=await loyal.submit(orderId,submission);
      assert.equal(fulfilled.state,'FULFILLED');assert.equal(fulfilled.assetId,product.full_video_asset_id);
      assert.equal((await pool.query(`SELECT full_video_state,full_video_asset_id,full_video_existing_master_reused
        FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1`,[postUid])).rows[0].full_video_existing_master_reused,true);
      assert.equal(uploads-before.uploads,1);assert.equal(fetches-before.fetches,1);
      assert.equal((await pool.query(`SELECT count(*)::int count FROM v3_provider_media_jobs WHERE provider='loyalfans' AND external_content_uid=$1`,[postUid])).rows[0].count,1);
      assert.equal((await pool.query(`SELECT count(*)::int count FROM v3_provider_media_transactions WHERE provider='loyalfans' AND external_content_uid=$1`,[postUid])).rows[0].count,1);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_commerce_content_entitlements WHERE order_id=$1',[orderId])).rows[0].count,1);
      const d2Again=await d2.run({mode:'single',post_uid:postUid});
      assert.equal(d2Again.unchanged,1);assert.equal(d2Again.ready,0);assert.equal(uploads-before.uploads,1);
    });
    await t.test('D2 links an exact mapped private READY master without fetching or uploading another copy',async()=>{
      const postUid=`neutral-d2-mapped-post-${schema}`;const videoUid=`neutral-d2-mapped-video-${schema}`;
      const videoId=`video-${schema}-mapped-d2`;const key=`neutral-d2-existing/${schema}`;cleanupKeys.add(key);
      const catalogue=new LoyalFansCatalogueSyncService({db:pool,provider:{listAllCatalogue:async()=>{}},currency:'USD'});
      const item={uid:postUid,title:'Neutral mapped fixture',price:1.99,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-02T00:00:00Z',
        video_object:{uid:videoUid,mime:'video/mp4',duration:1,size:{width:64,height:64}}};
      await pool.query("INSERT INTO catalog_videos(legacy_id,status,v3_lifecycle) VALUES($1,'draft','draft')",[videoId]);
      await pool.query("INSERT INTO v3_catalogue_external_content_mappings(provider,external_content_uid,video_legacy_id) VALUES('loyalfans',$1,$2)",[postUid,videoId]);
      const metadata={...normalizeLoyalFansCatalogueItem(item,{currency:'USD'}).metadata,video_legacy_id:videoId,sync_status:'active'};
      await catalogue.upsertProduct(pool,metadata,null,null);
      await blob.uploadStream(key,Readable.from(valid),'video/mp4',{container});
      const hash=createHash('sha256').update(valid).digest('hex');const assetId=randomUUID();
      await pool.query(`INSERT INTO v3_media_assets(id,asset_type,storage_reference,mime_type,processing_state,visibility,byte_size,content_hash)
        VALUES($1,'source',$2,'video/mp4','ready','private',$3,$4)`,[assetId,key,valid.length,hash]);
      await pool.query('INSERT INTO v3_media_asset_links(asset_id,video_legacy_id,is_primary) VALUES($1,$2,true)',[assetId,videoId]);
      const before={uploads,fetches};
      const d2=new LoyalFansCatalogueMasterIngestionService({db:pool,provider:{getCatalogueFullVideoSource:async()=>assert.fail('Master reuse must not resolve a Store source.')},
        mediaRuntime:runtime,enabled:true,maxConcurrency:1});
      const result=await d2.run({mode:'single',post_uid:postUid});
      assert.equal(result.ready,1);assert.equal(result.reused,1);assert.equal(result.failed,0);
      assert.deepEqual({uploads,fetches},before);
      const product=(await pool.query(`SELECT full_video_state,full_video_asset_id,full_video_existing_master_reused
        FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1`,[postUid])).rows[0];
      assert.deepEqual(product,{full_video_state:'ready',full_video_asset_id:assetId,full_video_existing_master_reused:true});
      const job=(await pool.query(`SELECT state,asset_id,checksum_sha256 FROM v3_provider_media_jobs
        WHERE provider='loyalfans' AND external_content_uid=$1`,[postUid])).rows[0];
      assert.deepEqual(job,{state:'MEDIA_READY',asset_id:assetId,checksum_sha256:hash});
      assert.equal((await pool.query("SELECT count(*)::int count FROM v3_provider_media_transactions WHERE provider='loyalfans' AND external_content_uid=$1",[postUid])).rows[0].count,0);
    });
    await t.test('concurrent D2 requests for one product stream and create one generic private master',async()=>{
      const postUid=`neutral-d2-concurrent-post-${schema}`;const videoUid=`neutral-d2-concurrent-video-${schema}`;
      const item={uid:postUid,title:'Neutral concurrent fixture',price:1.99,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-02T00:00:00Z',
        video_object:{uid:videoUid,video_url:'https://media.example.test/concurrent?sig=neutral-concurrent',mime:'video/mp4',duration:1,
          size:{width:64,height:64}}};
      const catalogue=new LoyalFansCatalogueSyncService({db:pool,provider:{listAllCatalogue:async()=>{}},currency:'USD'});
      const normalized=normalizeLoyalFansCatalogueItem(item,{currency:'USD'});
      await catalogue.upsertProduct(pool,{...normalized.metadata,sync_status:'unmapped'},null,null);
      const provider={getCatalogueFullVideoSource:async({postUid,videoUid})=>{
        const source={postUid,videoUid,mime:'video/mp4',duration:1,dimensions:{width:64,height:64}};
        Object.defineProperty(source,'sourceUrl',{value:item.video_object.video_url,enumerable:false});return source;
      }};
      const makeService=()=>new LoyalFansCatalogueMasterIngestionService({db:pool,provider,mediaRuntime:runtime,enabled:true,maxConcurrency:1});
      const before={uploads,fetches,entitlements:(await pool.query('SELECT count(*)::int count FROM v3_commerce_content_entitlements')).rows[0].count};
      const results=await Promise.all([makeService().run({mode:'single',post_uid:postUid}),makeService().run({mode:'single',post_uid:postUid})]);
      assert.equal(results.every(result=>result.ready===1&&result.failed===0),true);
      assert.equal(uploads-before.uploads,1);assert.equal(fetches-before.fetches,1);
      assert.equal((await pool.query("SELECT count(*)::int count FROM v3_provider_media_jobs WHERE provider='loyalfans' AND external_content_uid=$1",[postUid])).rows[0].count,1);
      assert.equal((await pool.query("SELECT count(*)::int count FROM v3_provider_media_transactions WHERE provider='loyalfans' AND external_content_uid=$1",[postUid])).rows[0].count,0);
      assert.equal((await pool.query('SELECT count(*)::int count FROM v3_commerce_content_entitlements')).rows[0].count,before.entitlements);
    });
    const prepare=async(suffix,provider='sample')=>{
      const userId=randomUUID();const orderId=randomUUID();const videoId=`video-${suffix}`;
      const content=`content-${schema}-${suffix}`;
      await pool.query('INSERT INTO app_users(id) VALUES($1)',[userId]);
      await pool.query("INSERT INTO catalog_videos(legacy_id,status,v3_lifecycle) VALUES($1,'published','published')",[videoId]);
      await pool.query("INSERT INTO v3_catalogue_external_content_mappings(provider,external_content_uid,video_legacy_id) VALUES($3,$1,$2)",[content,videoId,provider]);
      await pool.query("INSERT INTO v3_commerce_buyer_links(provider,user_id,provider_member_uid,status,proof_reference,verified_at) VALUES($3,$1,$2,'verified','neutral-proof',now())",[userId,`buyer-${suffix}`,provider]);
      await pool.query("INSERT INTO v3_commerce_orders(id,user_id,product_id,processor,total_minor,currency,external_content_uid) VALUES($1,$2,$3,$5,199,'USD',$4)",[orderId,userId,videoId,content,provider]);
      const submission={provider:'sample',provider_transaction_id:`transaction-${suffix}`,external_buyer_uid:`buyer-${suffix}`,
        external_content_uid:content,transaction_type:'clip_store',amount_minor:199,currency:'USD',
        temporary_media_url:'https://media.example.test/a?sig=neutral-temporary',mime_type:'video/mp4',duration_seconds:1};
      handles.set(orderId,{provider:'sample',transactionId:submission.provider_transaction_id,buyerUid:submission.external_buyer_uid,
        contentUid:content,transactionType:'clip_store',amountMinor:199,currency:'USD',media:{sourceUrl:submission.temporary_media_url,mimeType:'video/mp4',durationSeconds:1}});
      return{orderId,submission,content,userId,videoId};
    };
    await t.test('valid MP4 runs every durable state and grants once after readiness',async()=>{
      const h=await prepare('success');phase='no-entitlement-check';
      entitlementBaseline=(await pool.query("SELECT count(*)::int AS count FROM v3_commerce_content_entitlements WHERE status='active'")).rows[0].count;
      const client=await pool.connect();
      try{
        await client.query(`CREATE TABLE neutral_state_audit(state text)`);
        await client.query(`CREATE FUNCTION record_neutral_state() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
          IF NEW.provider_fulfillment_state IS DISTINCT FROM OLD.provider_fulfillment_state THEN
            INSERT INTO neutral_state_audit(state) VALUES(NEW.provider_fulfillment_state); END IF;RETURN NEW;END $$`);
        await client.query(`CREATE TRIGGER neutral_state_trigger AFTER UPDATE ON v3_commerce_orders
          FOR EACH ROW EXECUTE FUNCTION record_neutral_state()`);
      }finally{client.release();}
      const result=await adapter.submit(h.orderId,h.submission);assert.equal(result.state,'FULFILLED');
      const states=(await pool.query('SELECT state FROM neutral_state_audit')).rows.map(r=>r.state);
      assert.deepEqual(states,['VERIFICATION_PENDING','MEDIA_PENDING','MEDIA_INGESTING','MEDIA_READY','FULFILLED']);
      const metadata=(await pool.query('SELECT state,byte_size,checksum_sha256,duration_seconds FROM v3_provider_media_jobs')).rows[0];
      assert.equal(metadata.state,'MEDIA_READY');assert.equal(Number(metadata.byte_size),valid.length);assert.match(metadata.checksum_sha256,/^[a-f0-9]{64}$/);
      const durable=(await pool.query(`SELECT a.storage_reference,a.mime_type,a.byte_size,a.content_hash,a.visibility,
        a.processing_state,j.checksum_sha256 FROM v3_provider_media_jobs j JOIN v3_media_assets a ON a.id=j.asset_id
        WHERE j.external_content_uid=$1`,[h.content])).rows[0];
      assert.equal(durable.visibility,'private');assert.equal(durable.processing_state,'ready');
      assert.equal(durable.mime_type,'video/mp4');assert.equal(Number(durable.byte_size),valid.length);
      assert.equal(durable.content_hash,createHash('sha256').update(valid).digest('hex'));
      assert.equal(durable.checksum_sha256,durable.content_hash);assert.equal(durable.storage_reference.includes('https:'),false);
      assert.equal(JSON.stringify(durable).includes('neutral-temporary'),false);
      if(azureMode){
        const anonymous=await fetch(`${azureUrl.replace(/\/$/,'')}/${container}/${durable.storage_reference}`,
          {headers:{'x-ms-version':'2023-11-03'}});
        const body=await anonymous.text();
        const denial=anonymous.headers.get('x-ms-error-code') || body.match(/<Code>([A-Za-z0-9_]+)<\/Code>/)?.[1];
        console.log(JSON.stringify({event:'azure_anonymous_read_probe',httpStatus:anonymous.status,
          errorCode:/^[A-Za-z0-9_]+$/.test(denial || '')?denial:null}));
        assert.ok([401,403,404].includes(anonymous.status) ||
          (anonymous.status===409 && denial==='PublicAccessNotPermitted'),
        'An uploaded private asset must not be readable anonymously.');
      }
      const before=uploads;await adapter.submit(h.orderId,h.submission);assert.equal(uploads,before);
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM v3_commerce_content_entitlements WHERE order_id=$1',[h.orderId])).rows[0].count,1);
      if(azureMode){
        const service=new BlobServiceClient(azureUrl,new (await import('@azure/identity')).DefaultAzureCredential());
        const stored=[];for await(const item of service.getContainerClient(container).listBlobsFlat({prefix:durable.storage_reference}))stored.push(item.name);
        assert.deepEqual(stored,[durable.storage_reference]);
      }
    });
    await t.test('concurrent duplicate request creates one job/asset/blob/entitlement',async()=>{
      const h=await prepare('concurrent');phase='valid';const before=uploads;
      await Promise.all([adapter.submit(h.orderId,h.submission),adapter.submit(h.orderId,h.submission)]);
      assert.equal(uploads-before,1);
      const count=await pool.query('SELECT count(*)::int AS count FROM v3_provider_media_jobs WHERE external_content_uid=$1',[h.content]);assert.equal(count.rows[0].count,1);
    });
    await t.test('expired source fails, retry requires fresh URL, and still creates one asset',async()=>{
      const h=await prepare('retry');phase='expired';await assert.rejects(adapter.submit(h.orderId,h.submission),{code:'MEDIA_SOURCE_EXPIRED'});
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM v3_commerce_content_entitlements WHERE order_id=$1',[h.orderId])).rows[0].count,0);
      await pool.query("UPDATE v3_provider_media_jobs SET available_at=now()-interval '1 second' WHERE external_content_uid=$1",[h.content]);
      phase='valid';await adapter.submit(h.orderId,{...h.submission,temporary_media_url:'https://media.example.test/a?sig=fresh'});
      assert.equal((await pool.query('SELECT attempts FROM v3_provider_media_jobs WHERE external_content_uid=$1',[h.content])).rows[0].attempts,2);
    });
    await t.test('corrupt media fails and never becomes MEDIA_READY',async()=>{
      const invalid='corrupt';const h=await prepare(invalid);phase=invalid;
      await assert.rejects(adapter.submit(h.orderId,h.submission),error=>['MEDIA_VALIDATION_FAILED','MEDIA_MIME_MISMATCH'].includes(error.code));
      const j=(await pool.query('SELECT state,asset_id FROM v3_provider_media_jobs WHERE external_content_uid=$1',[h.content])).rows[0];
      assert.equal(j.state,'FAILED');assert.equal((await pool.query('SELECT processing_state FROM v3_media_assets WHERE id=$1',[j.asset_id])).rows[0].processing_state,'failed');
      const reference=(await pool.query('SELECT storage_reference FROM v3_media_assets WHERE id=$1',[j.asset_id])).rows[0].storage_reference;
      assert.equal(await blob.verifyObject(reference,{container}),null);
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM v3_commerce_content_entitlements WHERE order_id=$1',[h.orderId])).rows[0].count,0);
      failedDuringReady ||= j.state==='MEDIA_READY';
    });
    await t.test('mislabelled response MIME is canonicalized from valid MP4 bytes',async()=>{
      const h=await prepare('mime-mismatch');phase='mime-mismatch';
      const result=await adapter.submit(h.orderId,h.submission);assert.equal(result.state,'FULFILLED');
      const job=(await pool.query('SELECT state,mime_type FROM v3_provider_media_jobs WHERE external_content_uid=$1',[h.content])).rows[0];
      assert.deepEqual(job,{state:'MEDIA_READY',mime_type:'video/mp4'});
    });
    await t.test('real ffprobe rejects a valid MP4 when the expected container is WebM',async()=>{
      const key=`neutral-validation/${schema}`;cleanupKeys.add(key);objectKeys.add(key);
      await blob.uploadStream(key,Readable.from(valid),'video/mp4',{container});
      await assert.rejects(validateStoredProviderMedia({blob:{downloadStream:objectKey=>blob.downloadStream(objectKey,{container})},
        objectKey:key,byteSize:valid.length,checksum:createHash('sha256').update(valid).digest('hex'),
        mimeType:'video/webm',signal:new AbortController().signal}),{code:'MEDIA_VALIDATION_FAILED'});
    });
    await t.test('unlinked reversal remains observation and never revokes an entitlement',async()=>{
      assert.deepEqual(await adapter.observeReversal('neutral-reversal'),{linked:false,revoked:false});
      assert.equal((await pool.query("SELECT count(*)::int AS count FROM v3_commerce_content_entitlements WHERE status='revoked'")).rows[0].count,0);
    });
    await t.test('migration constraints reject mismatched transaction/job content and invalid retry states',async()=>{
      const row=(await pool.query('SELECT * FROM v3_provider_media_jobs LIMIT 1')).rows[0];
      await assert.rejects(pool.query(`INSERT INTO v3_provider_media_transactions(provider,provider_transaction_id,external_content_uid,job_id)
        VALUES('sample','invalid-foreign-key','wrong-content',$1)`,[row.id]),{code:'23503'});
      await assert.rejects(pool.query("UPDATE v3_provider_media_jobs SET retryable=true WHERE id=$1",[row.id]),{code:'23514'});
    });
    await t.test('duplicate transaction cannot bind a different order or content identity',async()=>{
      const h=await prepare('transaction-conflict');phase='valid';
      await assert.rejects(adapter.submit(h.orderId,{...h.submission,provider_transaction_id:'transaction-success'}),{code:'MEDIA_TRANSACTION_CONFLICT'});
    });
    await t.test('existing mapped private master is reused without a second source download',async()=>{
      const h=await prepare('master-reuse');phase='valid';const key=`neutral-existing/${schema}`;cleanupKeys.add(key);
      await blob.uploadStream(key,Readable.from(valid),'video/mp4',{container});
      const asset=randomUUID();
      await pool.query("INSERT INTO v3_media_assets(id,asset_type,storage_reference,visibility,processing_state,mime_type,byte_size) VALUES($1,'source',$2,'private','ready','video/mp4',$3)",[asset,key,valid.length]);
      await pool.query('INSERT INTO v3_media_asset_links(asset_id,video_legacy_id,is_primary) VALUES($1,$2,true)',[asset,h.videoId]);
      const before=fetches;const result=await adapter.submit(h.orderId,h.submission);
      assert.equal(fetches,before);assert.equal(result.assetId,asset);
    });
    // Fresh mocked authenticated creator responses; real SQL, generic streaming and container validation.
    let authExpired=false;
    const creatorClient=new LoyalFansProviderClient({enabled:true,environment:'test',
      cookieHeader:'synthetic-cookie',xsrfToken:'synthetic-xsrf',bearerToken:'synthetic-bearer',
      fetchImpl:async()=>authExpired?new Response('',{status:401}):{
        ok:true,status:200,json:async()=>({success:true,httpCode:200,
          page_meta:{total:ledger.length,per_page:100,current_page:1,last_page:1,from:0,to:ledger.length},
          transactions:[{dateKey:'2026-01-02',transactions:ledger}]})
      }});
    loyalImplementation.client=creatorClient;
    const prepareLedger=async suffix=>{
      const h=await prepare(`loyal-neutral-${suffix}`,'loyalfans');
      await pool.query("UPDATE v3_commerce_orders SET created_at='2026-01-01T00:00:00Z' WHERE id=$1",[h.orderId]);
      const row={id:`transaction-neutral-${suffix}`,type:'clip_store',member:{uid:h.submission.external_buyer_uid},
        charge:1.99,payout:1.59,fee:0.40,rate:80,created_at:'2026-01-02T12:00:00Z',
        attached_to:{uid:h.content,video_object:{uid:`media-neutral-${suffix}`,mime:'video/mp4',duration:1,
          size:{width:64,height:64},video_url:'https://media.example.test/source?sig=loyal-neutral-ephemeral'}}};
      ledger.push(row);return{...h,row};
    };
    await t.test('LoyalFans authoritative normalization feeds generic runtime and persists technical provenance only',async()=>{
      const h=await prepareLedger('success');phase='valid';const before=uploads;
      await pool.query(`INSERT INTO v3_loyalfans_catalogue_products(loyalfans_post_uid,loyalfans_video_uid,video_legacy_id,title,
        current_price_minor,currency,downloadable,availability_state,metadata_fingerprint)
        VALUES($1,$2,$3,'Neutral fixture',199,'USD',true,'available',$4)`,[h.content,h.row.attached_to.video_object.uid,h.videoId,'0'.repeat(64)]);
      const result=await loyal.reconcile(h.orderId);assert.equal(result.state,'FULFILLED');assert.equal(uploads-before,1);
      assert.equal((await pool.query('SELECT download_allowed FROM v3_commerce_content_entitlements WHERE order_id=$1',[h.orderId])).rows[0].download_allowed,true);
      const rows=(await pool.query(`SELECT t.provider_transaction_id,t.external_media_uid,t.provider_transaction_timestamp,
        o.provider_fulfillment_state,j.width,j.height FROM v3_commerce_provider_transactions t
        JOIN v3_commerce_orders o ON o.id=t.order_id JOIN v3_provider_media_jobs j
          ON j.provider=t.provider AND j.external_content_uid=t.provider_content_uid WHERE o.id=$1`,[h.orderId])).rows;
      assert.equal(rows.length,1);assert.equal(rows[0].provider_transaction_id,h.row.id);
      assert.equal(rows[0].external_media_uid,h.row.attached_to.video_object.uid);
      assert.equal(rows[0].provider_transaction_timestamp.toISOString(),'2026-01-02T12:00:00.000Z');
      assert.equal(rows[0].width,64);assert.equal(rows[0].height,64);
      for(const table of ['v3_commerce_provider_transactions','v3_provider_media_transactions','v3_provider_media_jobs','v3_media_assets']){
        const durable=await pool.query(`SELECT to_jsonb(t) AS row FROM ${table} t`);
        assert.equal(JSON.stringify(durable.rows).includes('loyal-neutral-ephemeral'),false);
        assert.equal(JSON.stringify(durable.rows).includes('https://media.example.test'),false);
      }
      await loyal.reconcile(h.orderId);assert.equal(uploads-before,1);
    });
    await t.test('LoyalFans concurrent reconciliation creates one asset, job, transaction and grant',async()=>{
      const h=await prepareLedger('concurrent');phase='valid';const before=uploads;
      const results=await Promise.all([loyal.reconcile(h.orderId),loyal.reconcile(h.orderId)]);
      assert.equal(results.every(r=>r.state==='FULFILLED'),true);assert.equal(uploads-before,1);
      for(const [table,column,value] of [['v3_provider_media_jobs','external_content_uid',h.content],
        ['v3_commerce_provider_transactions','provider_transaction_id',h.row.id],
        ['v3_commerce_content_entitlements','order_id',h.orderId]]){
        assert.equal((await pool.query(`SELECT count(*)::int AS count FROM ${table} WHERE ${column}=$1`,[value])).rows[0].count,1);
      }
    });
    await t.test('LoyalFans existing READY master is reused with no upstream media URL or MIME',async()=>{
      const h=await prepareLedger('reuse');delete h.row.attached_to.video_object;
      const asset=randomUUID();const key=`neutral-existing/${schema}-loyal`;cleanupKeys.add(key);
      await blob.uploadStream(key,Readable.from(valid),'video/mp4',{container});
      await pool.query("INSERT INTO v3_media_assets(id,asset_type,storage_reference,visibility,processing_state,mime_type,byte_size) VALUES($1,'source',$2,'private','ready','video/mp4',$3)",[asset,key,valid.length]);
      await pool.query('INSERT INTO v3_media_asset_links(asset_id,video_legacy_id,is_primary) VALUES($1,$2,true)',[asset,h.videoId]);
      const before=fetches;const result=await loyal.reconcile(h.orderId);
      assert.equal(fetches,before);assert.equal(result.assetId,asset);assert.equal(result.state,'FULFILLED');
    });
    await t.test('LoyalFans expired source cannot grant; fresh history permits one retry',async()=>{
      const h=await prepareLedger('retry');phase='expired';
      await assert.rejects(loyal.reconcile(h.orderId),{code:'MEDIA_SOURCE_EXPIRED'});
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM v3_commerce_content_entitlements WHERE order_id=$1',[h.orderId])).rows[0].count,0);
      assert.equal((await pool.query('SELECT provider_fulfillment_state FROM v3_commerce_orders WHERE id=$1',[h.orderId])).rows[0].provider_fulfillment_state,'FAILED');
      await pool.query("UPDATE v3_provider_media_jobs SET available_at=now()-interval '1 second' WHERE external_content_uid=$1",[h.content]);
      h.row.attached_to.video_object.video_url='https://media.example.test/source?sig=fresh-neutral';phase='valid';
      assert.equal((await loyal.reconcile(h.orderId)).state,'FULFILLED');
      assert.equal((await pool.query('SELECT attempts FROM v3_provider_media_jobs WHERE external_content_uid=$1',[h.content])).rows[0].attempts,2);
    });
    await t.test('LoyalFans authentication expiry cannot create a job or entitlement',async()=>{
      const h=await prepareLedger('auth');authExpired=true;
      await assert.rejects(loyal.reconcile(h.orderId),{code:'MEDIA_LF_AUTH_EXPIRED'});
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM v3_provider_media_jobs WHERE external_content_uid=$1',[h.content])).rows[0].count,0);
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM v3_commerce_content_entitlements WHERE order_id=$1',[h.orderId])).rows[0].count,0);
      authExpired=false;
    });
    await t.test('live-shape terminal comments bind once against actual PostgreSQL without media or entitlement writes',async()=>{
      const h=await prepare('buyer-wire-compatibility','loyalfans');
      await pool.query("UPDATE v3_commerce_buyer_links SET status='unlinked',provider_member_uid=NULL,proof_reference=NULL,verified_at=NULL WHERE user_id=$1",[h.userId]);
      let payload;let clock=new Date();
      const commentsClient=new LoyalFansProviderClient({enabled:true,environment:'test',bearerToken:'synthetic',cookieHeader:'synthetic',xsrfToken:'synthetic',
        fetchImpl:async()=>new Response(JSON.stringify(payload),{status:200})});
      const registry=new CommerceProviderRegistry([new LoyalFansCommerceAdapter({providerClient:commentsClient})]);
      const service=new V3BuyerCommentLinkService(pool,registry,{customer:async()=>{}},{now:()=>clock});
      const user={id:h.userId};const started=await service.start(user,h.orderId);
      const created=(await pool.query('SELECT created_at FROM v3_commerce_buyer_comment_challenges WHERE user_id=$1',[h.userId])).rows[0].created_at;
      const added=new Date(created.getTime()+1000);clock=new Date(created.getTime()+2000);
      payload={success:true,httpCode:200,page_token:null,comments:[{uid:`neutral-comment-${schema}`,parent:{uid:h.content},user:{uid:`buyer-buyer-wire-compatibility`},
        comment:`hello ${started.challenge} thanks`,added_at:{date:added.toISOString().replace('T',' ').replace('Z',''),timezone_type:3,timezone:'UTC'}}]};
      const before=(await pool.query(`SELECT (SELECT count(*) FROM v3_commerce_content_entitlements) grants,
        (SELECT count(*) FROM v3_provider_media_jobs) jobs`)).rows[0];
      payload.token_id='synthetic-continuation';
      assert.equal((await service.verify(user)).verification_status,'continuation_contract_required');
      delete payload.token_id;
      const results=await Promise.all([service.verify(user),service.verify(user)]);
      assert.equal(results.every(r=>r.status==='verified'),true);
      const link=(await pool.query('SELECT status,provider_member_uid,verification_method FROM v3_commerce_buyer_links WHERE user_id=$1',[h.userId])).rows[0];
      assert.equal(link.provider_member_uid,payload.comments[0].user.uid);assert.equal(link.verification_method,'comment_challenge');
      assert.equal((await pool.query("SELECT count(*)::int count FROM v3_commerce_buyer_comment_challenges WHERE user_id=$1 AND status='consumed'",[h.userId])).rows[0].count,1);
      assert.equal((await service.verify(user)).status,'verified');
      assert.deepEqual((await pool.query(`SELECT (SELECT count(*) FROM v3_commerce_content_entitlements) grants,
        (SELECT count(*) FROM v3_provider_media_jobs) jobs`)).rows[0],before);
    });
    await t.test('actual API initializes the runtime and protected routes without activating a provider',async()=>{
      const server=spawn(process.execPath,['server/index.js'],{cwd:new URL('..',import.meta.url),
        env:{...process.env,NODE_ENV:'test',PORT:'18877',DATABASE_URL:databaseUrl,PROVIDER_MEDIA_ENABLED:'false'},
        stdio:['ignore','pipe','pipe']});
      let started=false;let failure=false;let stderrOutput='';
      server.on('error',()=>{failure=true;});
      server.stdout.on('data',chunk=>{if(chunk.toString().includes('listening on internal port'))started=true;});
      server.stderr.on('data',chunk=>{stderrOutput+=chunk.toString();});
      try{
        for(let attempt=0;attempt<100 && !started && !failure;attempt++)await new Promise(resolve=>setTimeout(resolve,25));
        assert.equal(started,true,`API runtime must initialize successfully (process error: ${failure}). ${stderrOutput.slice(0,1000)}`);
        const health=await fetch('http://127.0.0.1:18877/healthz');assert.equal(health.status,200);
        const status=await fetch('http://127.0.0.1:18877/api/v3/admin/commerce/provider-media/status');
        assert.ok([401,403].includes(status.status));
        const d2Status=await fetch('http://127.0.0.1:18877/api/v3/admin/commerce/loyalfans/full-video-status');
        assert.ok([401,403].includes(d2Status.status));
        const d2Run=await fetch('http://127.0.0.1:18877/api/v3/admin/commerce/loyalfans/full-video-ingest',{
          method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'single',post_uid:'neutral-post-uid-000000001'})});
        assert.ok([401,403].includes(d2Run.status));
      }finally{
        if(server.exitCode===null&&server.signalCode===null){
          const exited=new Promise(resolve=>server.once('exit',resolve));server.kill('SIGTERM');await exited;
        }
      }
    });
    assert.equal(failedDuringReady,false);assert.ok(fetches>0);
    if(azure)await t.test('integration artifacts are deleted and absence is verified',async()=>{
      for(const key of cleanupKeys){await azure.deleteObject(key,{container});assert.equal(await azure.verifyObject(key,{container}),null);}
    });
    if(!azureMode)await t.test('cloud Azure integration', {skip:'No explicit test Azure target was configured.'},()=>{});
  }finally{
    if(cleanupAzure)for(const key of cleanupKeys)await cleanupAzure.deleteObject(key,{container:cleanupContainer});
    if(pool)await pool.end();await db.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await db.end();
    if(directory)await rm(directory,{recursive:true,force:true});
  }
});
