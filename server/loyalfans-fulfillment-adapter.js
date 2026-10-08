import { mediaError,validateSignedMediaSource } from './provider-media-ingestion.js';
import { classifyPaymentEvidence } from './provider-transaction-fulfillment.js';
import { normalizeLoyalFansTimestamp } from './loyalfans-timestamps.js';

const UID=/^[A-Za-z0-9_-]{16,255}$/;
const MIME=new Set(['video/mp4','video/webm','video/quicktime']);
function id(value,code) {
  if(typeof value!=='string' || !UID.test(value))throw mediaError(code);
  return value;
}
function minor(value,required=false) {
  if(value==null || value===''){if(required)throw mediaError('MEDIA_LF_AMOUNT_INVALID');return null;}
  if(!['number','string'].includes(typeof value))throw mediaError('MEDIA_LF_AMOUNT_INVALID');
  const decimal=String(value);
  if(!/^\d+(?:\.\d{1,2})?$/.test(decimal))throw mediaError('MEDIA_LF_AMOUNT_INVALID');
  const [whole,fraction='']=decimal.split('.');
  const result=Number(whole)*100+Number(`${fraction}00`.slice(0,2));
  if(!Number.isSafeInteger(result))throw mediaError('MEDIA_LF_AMOUNT_INVALID');
  return result;
}
function positive(value,integer=false) {
  if(value==null)return null;
  if(!['number','string'].includes(typeof value) || String(value).trim()==='')throw mediaError('MEDIA_LF_METADATA_INVALID');
  const result=Number(value);
  if(!Number.isFinite(result) || result<=0 || (integer && !Number.isSafeInteger(result)))throw mediaError('MEDIA_LF_METADATA_INVALID');
  return result;
}

function accountingRate(value) {
  if(!['number','string'].includes(typeof value) || String(value).trim()==='')return null;
  const rate=Number(value);
  return Number.isFinite(rate) && rate>=0?rate:null;
}

/** Pick technical fields only. Source URLs are ephemeral, non-enumerable properties. */
export function projectLoyalFansCreatorLedgerRecord(record) {
  const media=record?.attached_to?.video_object;
  const projection={id:record?.id,type:record?.type,charge:record?.charge,payout:record?.payout,
    fee:record?.fee,rate:record?.rate,currency:record?.currency,created_at:record?.created_at,
    member:{uid:record?.member?.uid},attached_to:{uid:record?.attached_to?.uid,
      video_object:media?{uid:media.uid,mime:media.mime,duration:media.duration,
        size:media.size?{width:media.size.width,height:media.size.height}:null}:null}};
  if(media)Object.defineProperty(projection.attached_to.video_object,'video_url',{value:media.video_url,enumerable:false});
  return projection;
}

/** Pure normalization never attests a caller-supplied record as authoritative. */
export function normalizeLoyalFansFulfillmentRecord(record,{settlementCurrency=null,authorityVerified=false,
  ledgerPostedConfirmed=false}={}) {
  if(record?.type!=='clip_store')throw mediaError('MEDIA_LF_TRANSACTION_TYPE_INVALID');
  const transactionId=id(record.id,'MEDIA_LF_TRANSACTION_ID_REQUIRED');
  const buyerUid=id(record.member?.uid,'MEDIA_LF_BUYER_UID_REQUIRED');
  const contentUid=id(record.attached_to?.uid,'MEDIA_LF_CONTENT_UID_REQUIRED');
  const amountMinor=minor(record.charge,true);
  if(amountMinor<=0)throw mediaError('MEDIA_LF_AMOUNT_INVALID');
  let timestamp;
  try { timestamp=normalizeLoyalFansTimestamp(record.created_at,{required:true}); }
  catch { throw mediaError('MEDIA_LF_TIMESTAMP_REQUIRED'); }
  const currency=record.currency==null?settlementCurrency:record.currency;
  if(currency!=null && !/^[A-Z]{3}$/.test(currency))throw mediaError('MEDIA_LF_CURRENCY_INVALID');
  const video=record.attached_to?.video_object;
  const mediaUid=video?.uid==null?null:id(video.uid,'MEDIA_LF_MEDIA_UID_INVALID');
  const mime=video?.mime==null?null:video.mime;
  if(mime!=null && !MIME.has(mime))throw mediaError('MEDIA_MIME_UNSUPPORTED');
  const duration=positive(video?.duration);
  const width=positive(video?.size?.width,true);const height=positive(video?.size?.height,true);
  const evidence={authorityVerified,kind:'ledger_sale',postingConfirmed:ledgerPostedConfirmed,
    chargeMinor:amountMinor,payoutMinor:minor(record.payout),feeMinor:minor(record.fee),
    rate:accountingRate(record.rate),timestamp};
  const result={provider:'loyalfans',provider_transaction_id:transactionId,external_buyer_uid:buyerUid,
    provider_transaction_type:'clip_store',external_content_uid:contentUid,amount:amountMinor/100,amount_minor:amountMinor,
    currency:currency || null,provider_transaction_timestamp:timestamp,external_media_uid:mediaUid,
    expected_mime:mime,expected_duration:duration,expected_dimensions:{width,height},
    finality:classifyPaymentEvidence(evidence,transactionId),finality_evidence:evidence};
  Object.defineProperty(result,'temporary_media_url',{value:video?.video_url,enumerable:false});
  return result;
}

function internalSale(normalized) {
  const media={uid:normalized.external_media_uid,mimeType:normalized.expected_mime,
    durationSeconds:normalized.expected_duration,dimensions:normalized.expected_dimensions};
  Object.defineProperty(media,'sourceUrl',{value:normalized.temporary_media_url,enumerable:false});
  Object.defineProperty(media,'sourceReferer',{value:'https://www.loyalfans.com/',enumerable:false});
  return{provider:'loyalfans',transactionId:normalized.provider_transaction_id,buyerUid:normalized.external_buyer_uid,
    contentUid:normalized.external_content_uid,transactionType:normalized.provider_transaction_type,
    amountMinor:normalized.amount_minor,currency:normalized.currency,timestamp:normalized.provider_transaction_timestamp,
    authorityVerified:normalized.finality_evidence.authorityVerified,evidence:normalized.finality_evidence,media};
}

export class LoyalFansFulfillmentAdapter {
  constructor({client,db,enabled=false,settlementCurrency=null,ledgerPostedConfirmed=false,
    allowedHosts=[],allowedSubdomains=[],now=()=>new Date()}={}) {
    Object.assign(this,{client,db,enabled,settlementCurrency,ledgerPostedConfirmed,allowedHosts,allowedSubdomains,now});
    this.transactionType='clip_store';this.acceptPosted=ledgerPostedConfirmed===true;
  }

  async verifyTransaction(order,candidate) {
    if(this.enabled!==true)throw mediaError('MEDIA_LF_ADAPTER_DISABLED');
    if(order?.provider!=='loyalfans' || !order.userId || !order.videoId)throw mediaError('MEDIA_PROVIDER_MISMATCH');
    id(order.contentUid,'MEDIA_LF_CONTENT_UID_REQUIRED');
    const timestamp=order.createdAt;
    if(!(timestamp instanceof Date) && (typeof timestamp!=='string' || !timestamp.trim()))throw mediaError('MEDIA_LF_ORDER_TIMESTAMP_REQUIRED');
    const start=new Date(timestamp);const end=new Date(this.now());
    if(!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start>end)throw mediaError('MEDIA_LF_ORDER_TIMESTAMP_REQUIRED');
    const link=await this.db.query(`SELECT provider_member_uid FROM v3_commerce_buyer_links
      WHERE provider='loyalfans' AND user_id=$1 AND status='verified' AND revoked_at IS NULL`,[order.userId]);
    if(link.rowCount!==1 || !UID.test(link.rows[0].provider_member_uid || '') || order.buyerVerified!==true ||
      order.buyerUid!==link.rows[0].provider_member_uid)throw mediaError('MEDIA_LF_BUYER_NOT_VERIFIED');
    const mapping=await this.db.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
      WHERE provider='loyalfans' AND external_content_uid=$1 AND status='active'`,[order.contentUid]);
    if(!mapping.rowCount)throw mediaError('MEDIA_LF_MAPPING_UNKNOWN');
    if(mapping.rowCount!==1)throw mediaError('MEDIA_LF_MAPPING_AMBIGUOUS');
    if(mapping.rows[0].video_legacy_id!==order.videoId)throw mediaError('MEDIA_LF_MAPPING_MISMATCH');
    const range={dateFrom:start.toISOString().slice(0,10),dateTo:end.toISOString().slice(0,10)};
    let history;
    try{history=await this.client.listAllFulfillmentTransactions(range);}
    catch(error){
      if(['LOYALFANS_REAUTH_REQUIRED','LOYALFANS_AUTH_NOT_CONFIGURED','LOYALFANS_CLIENT_DISABLED'].includes(error?.code)){
        throw mediaError(error.code==='LOYALFANS_REAUTH_REQUIRED'?'MEDIA_LF_AUTH_EXPIRED':'MEDIA_LF_AUTH_NOT_CONFIGURED',true);
      }
      throw mediaError('MEDIA_LF_HISTORY_UNAVAILABLE',true);
    }
    if(history?.authority!=='creator_authenticated' || history.complete!==true || !Array.isArray(history.transactions))throw mediaError('MEDIA_LF_HISTORY_INCOMPLETE');
    const matches=[];
    for(const record of history.transactions){
      if(record?.type!=='clip_store' || record.member?.uid!==order.buyerUid || record.attached_to?.uid!==order.contentUid)continue;
      const normalized=normalizeLoyalFansFulfillmentRecord(record,{settlementCurrency:this.settlementCurrency,
        authorityVerified:true,ledgerPostedConfirmed:this.ledgerPostedConfirmed});
      if(normalized.amount_minor!==order.amountMinor || normalized.currency!==order.currency ||
        Date.parse(normalized.provider_transaction_timestamp)<start.getTime() ||
        Date.parse(normalized.provider_transaction_timestamp)>end.getTime())continue;
      if(order.providerTransactionId && normalized.provider_transaction_id!==order.providerTransactionId)continue;
      // A submission can select a stable ID only within fresh server-verified history.
      if(candidate?.transactionId && normalized.provider_transaction_id!==candidate.transactionId)continue;
      matches.push(normalized);
    }
    if(matches.length!==1)throw mediaError('MEDIA_LF_PURCHASE_NOT_UNIQUE');
    const sale=internalSale(matches[0]);
    if(sale.evidence.postingConfirmed!==true || matches[0].finality!=='POSTED')throw mediaError('MEDIA_LF_FINALITY_UNKNOWN');
    const masters=await this.db.query(`SELECT a.id FROM v3_media_assets a JOIN v3_media_asset_links l ON l.asset_id=a.id
      WHERE l.video_legacy_id=$1 AND l.is_primary=true AND a.asset_type='source' AND a.visibility='private'
        AND a.processing_state='ready' AND a.storage_reference IS NOT NULL`,[order.videoId]);
    if(masters.rowCount>1)throw mediaError('MEDIA_LF_MASTER_AMBIGUOUS');
    if(!masters.rowCount){
      if(!sale.media.uid || !sale.media.mimeType || !sale.media.sourceUrl)throw mediaError('MEDIA_LF_SOURCE_REQUIRED',true);
      validateSignedMediaSource(sale.media.sourceUrl,this.allowedHosts,this.allowedSubdomains);
    }
    return sale;
  }

  /** Keep the catalogue's master pointer converged with the shared JIT media job. */
  async onMediaReady(order,sale,asset){
    if(sale?.provider!=='loyalfans'||order?.provider!=='loyalfans'||!UID.test(sale.contentUid||'')||
      (sale.media?.uid!=null&&!UID.test(sale.media.uid))||!asset?.assetId)throw mediaError('MEDIA_LF_MASTER_IDENTITY_INVALID');
    const product=await this.db.query(`SELECT loyalfans_post_uid FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1`,[sale.contentUid]);
    if(!product.rowCount)return {catalogueProductPresent:false};
    const updated=await this.db.query(`UPDATE v3_loyalfans_catalogue_products p SET full_video_state='ready',full_video_asset_id=$3,
      full_video_error_code=NULL,full_video_existing_master_reused=$4,updated_at=now()
      WHERE p.loyalfans_post_uid=$1 AND ($2::text IS NULL OR p.loyalfans_video_uid=$2) AND p.video_legacy_id=$5
        AND p.metadata_sync_state='synced' AND p.sync_status='active'
        AND EXISTS(SELECT 1 FROM v3_catalogue_external_content_mappings m WHERE m.provider='loyalfans'
          AND m.external_content_uid=p.loyalfans_post_uid AND m.video_legacy_id=p.video_legacy_id AND m.status='active')
        AND EXISTS(SELECT 1 FROM v3_provider_media_jobs j JOIN v3_media_assets a ON a.id=j.asset_id
          WHERE j.provider='loyalfans' AND j.external_content_uid=p.loyalfans_post_uid AND j.asset_id=$3
            AND j.state='MEDIA_READY' AND a.asset_type='source' AND a.visibility='private'
            AND a.processing_state='ready' AND a.storage_reference IS NOT NULL AND a.storage_reference !~* '^https?://')
      RETURNING p.loyalfans_post_uid`,[sale.contentUid,sale.media.uid,asset.assetId,asset.duplicate===true,order.videoId]);
    if(updated.rowCount!==1)throw mediaError('MEDIA_LF_CATALOGUE_MASTER_CONFLICT');
    return {catalogueProductPresent:true};
  }
}
