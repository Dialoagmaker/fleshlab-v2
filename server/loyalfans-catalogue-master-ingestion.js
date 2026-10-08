import { createHash } from 'node:crypto';
import { mediaError } from './provider-media-ingestion.js';

const UID=/^[A-Za-z0-9_-]{16,255}$/;
const PROVIDER='loyalfans';
const MIMES=new Set(['video/mp4','video/webm','video/quicktime']);
const SAFE_CODE=/^[A-Z0-9_]{1,80}$/;

function fail(code){return mediaError(SAFE_CODE.test(code||'')?code:'LOYALFANS_FULL_VIDEO_INGEST_FAILED');}
function positive(value){if(value==null||value==='')return null;const n=Number(value);return Number.isFinite(n)&&n>0?n:null;}
function dimension(value){if(value==null||value==='')return null;const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null;}
function mime(value){if(value==null||value==='')return null;const normalized=String(value).split(';',1)[0].trim().toLowerCase();return MIMES.has(normalized)?normalized:null;}
function hashSourceIdentity(postUid,videoUid){return createHash('sha256').update(`${PROVIDER}\0${postUid}\0${videoUid}`).digest('hex');}
function datePart(value){
  if(value==null)return null;
  const date=value instanceof Date?value:new Date(value);
  return Number.isFinite(date.getTime())?date.toISOString().slice(0,10):null;
}
async function mapBounded(values,limit,run){
  const results=new Array(values.length);let next=0;
  await Promise.all(Array.from({length:Math.min(limit,values.length)},async()=>{
    while(true){const index=next++;if(index>=values.length)return;results[index]=await run(values[index],index);}
  }));
  return results;
}

export class PostgresLoyalFansCatalogueMasterRepository {
  constructor(db){this.db=db;}

  async selectProducts(selection){
    const mode=selection?.mode;
    const limit=selection?.limit;
    if(mode==='single'){
      if(!UID.test(selection.post_uid||''))throw fail('LOYALFANS_POST_UID_REQUIRED');
      const result=await this.db.query(`SELECT loyalfans_post_uid,loyalfans_video_uid,video_legacy_id,source_created_at,metadata_sync_state,
        sync_status,full_video_state,full_video_asset_id,full_video_error_code FROM v3_loyalfans_catalogue_products
        WHERE loyalfans_post_uid=$1 AND metadata_sync_state='synced' AND sync_status IN ('active','unmapped')`,[selection.post_uid]);
      if(!result.rowCount)throw fail('LOYALFANS_SYNCED_PRODUCT_NOT_FOUND');
      return result.rows;
    }
    if(mode==='set'){
      const ids=selection.post_uids;
      if(!Array.isArray(ids)||ids.length<1||ids.length>20||ids.some(uid=>!UID.test(uid))||new Set(ids).size!==ids.length){
        throw fail('LOYALFANS_POST_UID_SET_INVALID');
      }
      const result=await this.db.query(`SELECT loyalfans_post_uid,loyalfans_video_uid,video_legacy_id,source_created_at,metadata_sync_state,
        sync_status,full_video_state,full_video_asset_id,full_video_error_code FROM v3_loyalfans_catalogue_products
        WHERE loyalfans_post_uid=ANY($1::text[]) AND metadata_sync_state='synced' AND sync_status IN ('active','unmapped')`,[ids]);
      if(result.rowCount!==ids.length)throw fail('LOYALFANS_SYNCED_PRODUCT_NOT_FOUND');
      const byUid=new Map(result.rows.map(row=>[row.loyalfans_post_uid,row]));
      return ids.map(uid=>byUid.get(uid));
    }
    if(!['limited','remaining','all'].includes(mode))throw fail('LOYALFANS_INGEST_SELECTION_INVALID');
    if(mode==='limited'&&(!Number.isSafeInteger(limit)||limit<1||limit>25))throw fail('LOYALFANS_INGEST_LIMIT_INVALID');
    if(mode==='remaining'&&limit!=null&&(!Number.isSafeInteger(limit)||limit<1||limit>1000))throw fail('LOYALFANS_INGEST_LIMIT_INVALID');
    const bounded=mode==='limited'?limit:mode==='remaining'?Math.min(1000,Number.isSafeInteger(limit)?limit:1000):1000;
    const condition=mode==='remaining'?'AND full_video_state <> \'ready\'':'';
    const result=await this.db.query(`SELECT loyalfans_post_uid,loyalfans_video_uid,video_legacy_id,source_created_at,metadata_sync_state,
      sync_status,full_video_state,full_video_asset_id,full_video_error_code FROM v3_loyalfans_catalogue_products
      WHERE metadata_sync_state='synced' AND sync_status IN ('active','unmapped') ${condition}
      ORDER BY loyalfans_post_uid LIMIT $1`,[bounded]);
    return result.rows;
  }

  async exactProduct(postUid){
    const result=await this.db.query(`SELECT loyalfans_post_uid,loyalfans_video_uid,video_legacy_id,source_created_at,metadata_sync_state,
      sync_status,full_video_state,full_video_asset_id,full_video_error_code FROM v3_loyalfans_catalogue_products
      WHERE loyalfans_post_uid=$1`,[postUid]);
    if(result.rowCount!==1)throw fail('LOYALFANS_CATALOGUE_PRODUCT_CONFLICT');
    const product=result.rows[0];
    if(product.metadata_sync_state!=='synced'||!['active','unmapped'].includes(product.sync_status))throw fail('LOYALFANS_PRODUCT_NOT_SYNCED');
    if(!UID.test(product.loyalfans_video_uid||''))throw fail('LOYALFANS_VIDEO_UID_INVALID');
    const mappings=await this.db.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
      WHERE provider=$1 AND external_content_uid=$2 AND status='active'`,[PROVIDER,postUid]);
    if(mappings.rowCount>1)throw fail('LOYALFANS_MAPPING_AMBIGUOUS');
    if(product.video_legacy_id){
      if(mappings.rowCount!==1||mappings.rows[0].video_legacy_id!==product.video_legacy_id)throw fail('LOYALFANS_MAPPING_MISMATCH');
    }else if(mappings.rowCount)throw fail('LOYALFANS_MAPPING_MISMATCH');
    return product;
  }

  async pending(postUid){
    await this.db.query(`UPDATE v3_loyalfans_catalogue_products SET full_video_state='pending',full_video_error_code=NULL,
      full_video_existing_master_reused=false,updated_at=now() WHERE loyalfans_post_uid=$1 AND full_video_state<>'ready'`,[postUid]);
  }

  async ingesting(postUid){
    await this.db.query(`UPDATE v3_loyalfans_catalogue_products SET full_video_state='ingesting',full_video_error_code=NULL,
      updated_at=now() WHERE loyalfans_post_uid=$1 AND full_video_state<>'ready'`,[postUid]);
  }

  async failed(postUid,code){
    await this.db.query(`UPDATE v3_loyalfans_catalogue_products SET full_video_state='failed',full_video_error_code=$2,
      updated_at=now() WHERE loyalfans_post_uid=$1 AND full_video_state<>'ready'`,[postUid,SAFE_CODE.test(code||'')?code:'LOYALFANS_FULL_VIDEO_INGEST_FAILED']);
  }

  async ready(postUid,videoUid,assetId,{reused=false}={}){
    const client=await this.db.connect();
    try{
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`loyalfans:full-video:${postUid}`]);
      const productResult=await client.query(`SELECT loyalfans_video_uid,video_legacy_id,metadata_sync_state,sync_status
        FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1 FOR UPDATE`,[postUid]);
      if(productResult.rowCount!==1)throw fail('LOYALFANS_CATALOGUE_PRODUCT_CONFLICT');
      const product=productResult.rows[0];
      if(product.loyalfans_video_uid!==videoUid||product.metadata_sync_state!=='synced'||!['active','unmapped'].includes(product.sync_status))throw fail('LOYALFANS_PRODUCT_CHANGED');
      const mappings=await client.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
        WHERE provider=$1 AND external_content_uid=$2 AND status='active' FOR SHARE`,[PROVIDER,postUid]);
      if(mappings.rowCount>1||(product.video_legacy_id&&(mappings.rowCount!==1||mappings.rows[0].video_legacy_id!==product.video_legacy_id))||
        (!product.video_legacy_id&&mappings.rowCount))throw fail('LOYALFANS_MAPPING_MISMATCH');
      const master=await client.query(`SELECT j.id,a.id AS asset_id,a.storage_reference,a.content_hash,a.byte_size,a.mime_type
        FROM v3_provider_media_jobs j JOIN v3_media_assets a ON a.id=j.asset_id
        WHERE j.provider=$1 AND j.external_content_uid=$2 AND j.asset_id=$3 AND j.state='MEDIA_READY'
          AND a.asset_type='source' AND a.visibility='private' AND a.processing_state='ready'
          AND a.storage_reference IS NOT NULL AND a.storage_reference !~* '^https?://'`,[PROVIDER,postUid,assetId]);
      if(master.rowCount!==1||!Number(master.rows[0].byte_size)||! /^[a-f0-9]{64}$/.test(master.rows[0].content_hash||''))throw fail('LOYALFANS_MASTER_NOT_READY');
      if(product.video_legacy_id){
        const prior=await client.query(`SELECT a.id FROM v3_media_asset_links l JOIN v3_media_assets a ON a.id=l.asset_id
          WHERE l.video_legacy_id=$1 AND l.is_primary=true AND a.asset_type='source' AND a.visibility='private'
            AND a.processing_state='ready' AND a.storage_reference IS NOT NULL`,[product.video_legacy_id]);
        if(prior.rows.some(row=>row.id!==assetId))throw fail('LOYALFANS_EXISTING_MASTER_CONFLICT');
        if(!prior.rowCount)await client.query(`INSERT INTO v3_media_asset_links(asset_id,video_legacy_id,is_primary)
          VALUES($1,$2,true) ON CONFLICT DO NOTHING`,[assetId,product.video_legacy_id]);
      }
      const fingerprint=hashSourceIdentity(postUid,videoUid);
      await client.query(`INSERT INTO v3_loyalfans_catalogue_media_provenance(loyalfans_post_uid,media_kind,source_fingerprint,
        media_asset_id,content_hash,byte_size) VALUES($1,'full_video',$2,$3,$4,$5)
        ON CONFLICT(loyalfans_post_uid,media_kind,source_fingerprint) DO UPDATE SET media_asset_id=EXCLUDED.media_asset_id,
          content_hash=EXCLUDED.content_hash,byte_size=EXCLUDED.byte_size,ingested_at=now()`,
      [postUid,fingerprint,assetId,master.rows[0].content_hash,master.rows[0].byte_size]);
      await client.query(`UPDATE v3_loyalfans_catalogue_products SET full_video_state='ready',full_video_asset_id=$2,
        full_video_error_code=NULL,full_video_existing_master_reused=$3,updated_at=now() WHERE loyalfans_post_uid=$1`,
      [postUid,assetId,reused===true]);
      await client.query('COMMIT');
      return{state:'ready',assetId,reused:reused===true};
    }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}
    finally{client.release();}
  }

  async status(){
    const result=await this.db.query(`SELECT count(*)::int AS full_video_total,
      count(*) FILTER (WHERE p.full_video_state='ready' AND j.id IS NOT NULL AND a.processing_state='ready' AND a.visibility='private'
        AND a.asset_type='source' AND a.storage_reference IS NOT NULL AND a.storage_reference !~* '^https?://')::int AS full_video_ready,
      count(*) FILTER (WHERE p.full_video_state='pending')::int AS full_video_pending,
      count(*) FILTER (WHERE p.full_video_state='ingesting')::int AS full_video_ingesting,
      count(*) FILTER (WHERE p.full_video_state='failed')::int AS full_video_failed,
      count(*) FILTER (WHERE p.full_video_state='not_imported')::int AS full_video_not_imported,
      count(*) FILTER (WHERE p.full_video_state='ready' AND p.full_video_existing_master_reused=true AND j.id IS NOT NULL
        AND a.processing_state='ready' AND a.visibility='private' AND a.asset_type='source'
        AND a.storage_reference IS NOT NULL AND a.storage_reference !~* '^https?://')::int AS full_video_existing_master_reused
      FROM v3_loyalfans_catalogue_products p
      LEFT JOIN v3_provider_media_jobs j ON j.provider='loyalfans' AND j.external_content_uid=p.loyalfans_post_uid
        AND j.asset_id=p.full_video_asset_id AND j.state='MEDIA_READY'
      LEFT JOIN v3_media_assets a ON a.id=p.full_video_asset_id`);
    return result.rows[0]||{full_video_total:0,full_video_ready:0,full_video_pending:0,full_video_ingesting:0,
      full_video_failed:0,full_video_not_imported:0,full_video_existing_master_reused:0};
  }
}

export class LoyalFansCatalogueMasterIngestionService {
  constructor({db,repository=new PostgresLoyalFansCatalogueMasterRepository(db),provider,mediaRuntime,
    enabled=false,maxConcurrency=2,maxItems=1000}={}){
    if(!db||!provider||!mediaRuntime)throw new TypeError('Database, provider client and generic media runtime are required.');
    this.db=db;this.repository=repository;this.provider=provider;this.mediaRuntime=mediaRuntime;
    this.enabled=enabled===true;this.maxConcurrency=Math.max(1,Math.min(4,maxConcurrency));
    this.maxItems=Math.max(1,Math.min(10000,maxItems));
  }

  async status(){
    const counts=await this.repository.status();
    return{enabled:this.enabled,FULL_VIDEO_TOTAL:Number(counts.full_video_total||0),FULL_VIDEO_READY:Number(counts.full_video_ready||0),
      FULL_VIDEO_PENDING:Number(counts.full_video_pending||0),FULL_VIDEO_INGESTING:Number(counts.full_video_ingesting||0),
      FULL_VIDEO_FAILED:Number(counts.full_video_failed||0),FULL_VIDEO_NOT_IMPORTED:Number(counts.full_video_not_imported||0),
      FULL_VIDEO_EXISTING_MASTER_REUSED:Number(counts.full_video_existing_master_reused||0)};
  }

  async run(selection){
    if(!this.enabled)throw fail('LOYALFANS_FULL_VIDEO_INGESTION_DISABLED');
    const products=await this.repository.selectProducts(selection);
    if(!products.length)return{status:'complete',selected:0,ready:0,reused:0,failed:0,unchanged:0,results:[]};
    if(products.length>this.maxItems)throw fail('LOYALFANS_FULL_VIDEO_BATCH_TOO_LARGE');
    let candidates=products.filter(product=>product.full_video_state!=='ready');
    const retryFailed=selection?.retry_failed===true;
    const unchanged=products.length-candidates.length;
    const results=[];
    const needsSource=[];
    for(const candidate of candidates){
      try{
        const product=await this.repository.exactProduct(candidate.loyalfans_post_uid);
        await this.repository.pending(product.loyalfans_post_uid);
        const prepared=await this.mediaRuntime.prepareContent(PROVIDER,product.loyalfans_post_uid,{retryFailed});
        if(prepared.state==='MEDIA_READY'){
          const saved=await this.repository.ready(product.loyalfans_post_uid,product.loyalfans_video_uid,prepared.assetId,{reused:true});
          results.push({post_uid:product.loyalfans_post_uid,state:'ready',reused:saved.reused});
        }else needsSource.push(candidate);
      }catch(error){
        const code=SAFE_CODE.test(error?.code||'')?error.code:'LOYALFANS_FULL_VIDEO_INGEST_FAILED';
        await this.repository.failed(candidate.loyalfans_post_uid,code).catch(()=>{});
        results.push({post_uid:candidate.loyalfans_post_uid,state:'failed',error_code:code});
      }
    }
    candidates=needsSource;
    if(!candidates.length){
      const ready=results.filter(row=>row.state==='ready').length;
      return{status:results.some(row=>row.state==='failed')?'partial':'complete',selected:products.length,ready,
        reused:results.filter(row=>row.state==='ready'&&row.reused).length,failed:results.filter(row=>row.state==='failed').length,unchanged,results};
    }
    const sourceResults=await mapBounded(candidates,this.maxConcurrency,async candidate=>{
      const postUid=candidate.loyalfans_post_uid;
      try{
        const product=await this.repository.exactProduct(postUid);
        if(typeof this.provider.getCatalogueFullVideoSource!=='function')throw fail('LOYALFANS_FULL_VIDEO_SOURCE_UNAVAILABLE');
        const dateFrom=datePart(product.source_created_at);
        const source=await this.provider.getCatalogueFullVideoSource({
          postUid:product.loyalfans_post_uid,
          videoUid:product.loyalfans_video_uid,
          dateFrom
        });
        return await this.processItem(product,source,{retryFailed});
      }catch(error){
        const code=SAFE_CODE.test(error?.code||'')?error.code:'LOYALFANS_FULL_VIDEO_INGEST_FAILED';
        await this.repository.failed(postUid,code).catch(()=>{});
        return{post_uid:postUid,state:'failed',error_code:code};
      }
    });
    results.push(...sourceResults);
    const overallStatus=results.some(row=>row.state==='failed')?'partial':'complete';
    const ready=results.filter(row=>row.state==='ready').length;
    const reused=results.filter(row=>row.state==='ready'&&row.reused).length;
    const failed=results.filter(row=>row.state==='failed').length;
    return{status:overallStatus,selected:products.length,ready,reused,failed,unchanged,results};
  }

  async processItem(selectedProduct,source,{retryFailed=false}={}){
    const postUid=selectedProduct.loyalfans_post_uid;
    try{
      const product=await this.repository.exactProduct(postUid);
      if(source?.postUid!==postUid||source?.videoUid!==product.loyalfans_video_uid)throw fail('LOYALFANS_MEDIA_UID_MISMATCH');
      if(typeof source?.sourceUrl!=='string'||!source.sourceUrl.trim())throw fail('LOYALFANS_FULL_VIDEO_SOURCE_UNAVAILABLE');
      await this.repository.pending(postUid);
      const prepared=await this.mediaRuntime.prepareContent(PROVIDER,postUid,{retryFailed});
      if(prepared.state==='MEDIA_READY'){
        const result=await this.repository.ready(postUid,product.loyalfans_video_uid,prepared.assetId,{reused:true});
        return{post_uid:postUid,state:'ready',reused:result.reused};
      }
      let sourceUrl=source.sourceUrl;
      let final;
      for(let attempt=0;attempt<2;attempt++){
        if(attempt>0){
          if(typeof this.provider.getCatalogueFullVideoSource!=='function')throw fail('LOYALFANS_FULL_VIDEO_SOURCE_UNAVAILABLE');
          const dateFrom=datePart(product.source_created_at);
          source=await this.provider.getCatalogueFullVideoSource({
            postUid:product.loyalfans_post_uid,
            videoUid:product.loyalfans_video_uid,
            dateFrom
          });
          if(source?.postUid!==postUid||source?.videoUid!==product.loyalfans_video_uid)throw fail('LOYALFANS_MEDIA_UID_MISMATCH');
          if(typeof source?.sourceUrl!=='string'||!source.sourceUrl.trim())throw fail('LOYALFANS_FULL_VIDEO_SOURCE_UNAVAILABLE');
          sourceUrl=source.sourceUrl;
        }
        const expectedMime=mime(source?.mime);
        if(source?.mime&&!expectedMime)throw fail('MEDIA_MIME_UNSUPPORTED');
        const dimensions=source?.dimensions||{};
        const input={provider:PROVIDER,contentUid:postUid,expectedMime,
          expectedDuration:positive(source?.duration),
          expectedDimensions:{width:dimension(dimensions.width),height:dimension(dimensions.height)},
          expectedDimensionsToleranceRatio:0.02,retryDelaySeconds:0,retryFailed};
        Object.defineProperty(input,'sourceReferer',{value:'https://www.loyalfans.com/',enumerable:false,configurable:false});
        Object.defineProperty(input,'sourceUrl',{value:sourceUrl,enumerable:false,configurable:false});
        await this.repository.ingesting(postUid);
        try{final=await this.mediaRuntime.ingestContent(PROVIDER,input);break;}
        catch(error){
          if(error?.code==='MEDIA_SOURCE_EXPIRED'&&attempt===0)continue;
          throw error;
        }
      }
      if(final?.state!=='MEDIA_READY'||!final.assetId)throw fail('MEDIA_NOT_READY');
      const result=await this.repository.ready(postUid,product.loyalfans_video_uid,final.assetId,{reused:final.duplicate===true});
      return{post_uid:postUid,state:'ready',reused:result.reused};
    }catch(error){
      const code=SAFE_CODE.test(error?.code||'')?error.code:'LOYALFANS_FULL_VIDEO_INGEST_FAILED';
      try{
        const prepared=await this.mediaRuntime.prepareContent(PROVIDER,postUid,{retryFailed:false});
        if(prepared.state==='MEDIA_READY'){
          const current=await this.repository.exactProduct(postUid);
          const saved=await this.repository.ready(postUid,current.loyalfans_video_uid,prepared.assetId,{reused:true});
          return{post_uid:postUid,state:'ready',reused:saved.reused};
        }
      }catch{/* Preserve the original secret-safe item failure. */}
      await this.repository.failed(postUid,code).catch(()=>{});
      return{post_uid:postUid,state:'failed',error_code:code};
    }
  }
}
