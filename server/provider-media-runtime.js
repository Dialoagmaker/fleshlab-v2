import { SignedSourceMediaIngestionService, mediaError } from './provider-media-ingestion.js';
import { PostgresProviderMediaRepository } from './provider-media-repository.js';
import { ProviderTransactionFulfillmentService } from './provider-transaction-fulfillment.js';
import { PostgresProviderFulfillmentRepository } from './provider-fulfillment-repository.js';

function safeFailure(error) {
  return mediaError(/^MEDIA_[A-Z_]+$/.test(error?.code || '') ? error.code : 'MEDIA_ADAPTER_FAILED',error?.retryable === true);
}

/** Technical submission is not proof. Only a registered server adapter can attest it. */
export function normalizeProviderMediaSubmission(input) {
  if (!input || typeof input !== 'object') throw mediaError('MEDIA_SUBMISSION_INVALID');
  const result = {
    provider:input.provider,transactionId:input.provider_transaction_id,buyerUid:input.external_buyer_uid,
    contentUid:input.external_content_uid,transactionType:input.provider_transaction_type ?? input.transaction_type,amountMinor:input.amount_minor,
    timestamp:input.provider_transaction_timestamp,
    currency:input.currency,evidence:input.finality_evidence,
    media:{uid:input.external_media_uid,
      mimeType:input.expected_mime ?? input.mime_type,durationSeconds:input.expected_duration ?? input.duration_seconds,
      dimensions:input.expected_dimensions,
      byteSize:input.byte_size,checksum:input.checksum_sha256}
  };
  Object.defineProperty(result.media,'sourceUrl',{value:input.temporary_media_url,enumerable:false});
  return result;
}

export function createProviderMediaRuntime({ db, mediaDb = db, blob, config, mediaOptions = {} }) {
  const adapters=new Map();
  const media=new SignedSourceMediaIngestionService({ repository:new PostgresProviderMediaRepository(mediaDb),blob,
    privateContainer:config.uploadContainer,allowedHosts:config.providerMedia?.allowedHosts || [],
    allowedSubdomains:config.providerMedia?.allowedSubdomains || [],maxBytes:config.providerMedia?.maxBytes,
    timeoutMs:config.providerMedia?.timeoutMs,...mediaOptions });
  const repository=new PostgresProviderFulfillmentRepository(db);
  const run=async(provider,orderId,candidate) => {
    if (!config.providerMedia?.enabled) throw mediaError('MEDIA_SERVICE_DISABLED');
    const adapter=adapters.get(provider);
    if (!adapter) throw mediaError('MEDIA_ADAPTER_NOT_REGISTERED');
    const service=new ProviderTransactionFulfillmentService({repository,media,acceptPosted:adapter.acceptPosted,
      expectedTransactionType:adapter.transactionType,onMediaReady:adapter.onMediaReady,
      verifyEvidence:async order=>{
        if (order.provider!==provider) throw mediaError('MEDIA_PROVIDER_MISMATCH');
        const evidence=await adapter.verifyTransaction(order,candidate);
        if (!evidence || evidence.provider!==provider) throw mediaError('MEDIA_PROVIDER_MISMATCH');
        return evidence;
      }});
    try {return await service.fulfill(orderId);}catch(error){throw safeFailure(error);}
  };
  return Object.freeze({
    status:()=>({configured:config.providerMedia?.enabled === true,registeredProviders:[...adapters.keys()]}),
    async prepareContent(provider,contentUid,{retryFailed=false}={}) {
      if(!config.providerMedia?.enabled)throw mediaError('MEDIA_SERVICE_DISABLED');
      if(!adapters.has(provider))throw mediaError('MEDIA_ADAPTER_NOT_REGISTERED');
      try{return await media.prepareContent({provider,contentUid,retryFailed});}catch(error){throw safeFailure(error);}
    },
    async ingestContent(provider,input) {
      if(!config.providerMedia?.enabled)throw mediaError('MEDIA_SERVICE_DISABLED');
      if(!adapters.has(provider))throw mediaError('MEDIA_ADAPTER_NOT_REGISTERED');
      if(input?.provider!==provider)throw mediaError('MEDIA_PROVIDER_MISMATCH');
      try{return await media.ingestContent(input);}catch(error){throw safeFailure(error);}
    },
    registerAdapter(provider,adapter) {
      if (!/^[a-z][a-z0-9_-]{0,63}$/.test(provider || '') || !adapter || typeof adapter.verifyTransaction!=='function' ||
          !/^[a-z][a-z0-9_-]{0,63}$/.test(adapter.transactionType || '') || adapters.has(provider)) throw mediaError('MEDIA_ADAPTER_INVALID');
      adapters.set(provider,{verifyTransaction:adapter.verifyTransaction.bind(adapter),acceptPosted:adapter.acceptPosted===true,
        transactionType:adapter.transactionType,
        onMediaReady:typeof adapter.onMediaReady==='function'?adapter.onMediaReady.bind(adapter):null,
        verifyReversal:typeof adapter.verifyReversal==='function'?adapter.verifyReversal.bind(adapter):null});
      return Object.freeze({
        submit:async(orderId,input)=>{
          const candidate=normalizeProviderMediaSubmission(input);
          if(candidate.provider!==provider)throw mediaError('MEDIA_PROVIDER_MISMATCH');
          return run(provider,orderId,candidate);
        },
        reconcile:orderId=>run(provider,orderId),
        observeReversal:async observationId=>{
          if(!config.providerMedia?.enabled)throw mediaError('MEDIA_SERVICE_DISABLED');
          if(typeof adapters.get(provider).verifyReversal!=='function')throw mediaError('MEDIA_REVERSAL_VERIFIER_UNAVAILABLE');
          const service=new ProviderTransactionFulfillmentService({repository,media,
            verifyEvidence:async()=>{
              const observation=await adapters.get(provider).verifyReversal(observationId);
              if(observation?.provider!==provider)throw mediaError('MEDIA_PROVIDER_MISMATCH');
              return observation;
            }});
          try{return await service.observeReversal(observationId);}catch(error){throw safeFailure(error);}
        }
      });
    },
    async reconcile(orderId) {
      try {
        if(!config.providerMedia?.enabled)throw mediaError('MEDIA_SERVICE_DISABLED');
        const order=await repository.order(orderId);
        if(!order)throw mediaError('MEDIA_ORDER_NOT_FOUND');
        return await run(order.provider,orderId);
      }catch(error){throw safeFailure(error);}
    }
  });
}
