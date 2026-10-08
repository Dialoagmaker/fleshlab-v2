import { mediaError, providerMediaIdentity } from './provider-media-ingestion.js';

export const FULFILLMENT_STATES = Object.freeze(['VERIFICATION_PENDING','MEDIA_PENDING',
  'MEDIA_INGESTING','MEDIA_READY','FULFILLED','FAILED']);
const TRANSITIONS = {
  VERIFICATION_PENDING: ['MEDIA_PENDING','FAILED'],
  MEDIA_PENDING: ['MEDIA_INGESTING','MEDIA_READY','FAILED'],
  MEDIA_INGESTING: ['MEDIA_READY','FAILED'],
  MEDIA_READY: ['FULFILLED','FAILED'],
  FULFILLED: ['FAILED'],
  FAILED: ['VERIFICATION_PENDING']
};
export function assertFulfillmentTransition(from,to) {
  if (!FULFILLMENT_STATES.includes(from) || !FULFILLMENT_STATES.includes(to) ||
      (from !== to && !TRANSITIONS[from].includes(to))) throw mediaError('MEDIA_STATE_TRANSITION_INVALID');
}

/** Internal evidence, never a fabricated upstream status. Posting must be attested by a server adapter. */
export function classifyPaymentEvidence(evidence, transactionId) {
  if (evidence?.authorityVerified !== true) return 'FINALITY_UNKNOWN';
  if (evidence.kind === 'reversal' && evidence.originalTransactionId === transactionId &&
      ['reimbursement','chargeback'].includes(evidence.type)) return 'REVERSED';
  if (evidence.kind === 'ledger_sale' && evidence.postingConfirmed === true &&
      [evidence.chargeMinor,evidence.payoutMinor,evidence.feeMinor,evidence.rate].every(Number.isFinite) &&
      evidence.chargeMinor > 0 && evidence.payoutMinor >= 0 && evidence.feeMinor >= 0 && evidence.rate >= 0 &&
      Number.isFinite(Date.parse(evidence.timestamp))) return 'POSTED';
  return 'FINALITY_UNKNOWN';
}

export function matchProviderTransaction(order, sale, { acceptPosted = false } = {}) {
  providerMediaIdentity(sale);
  const finality = classifyPaymentEvidence(sale.evidence,sale.transactionId);
  if (sale.authorityVerified !== true || order.buyerVerified !== true || !order.buyerUid || sale.buyerUid !== order.buyerUid ||
      sale.provider !== order.provider || sale.contentUid !== order.contentUid || sale.transactionType !== order.transactionType ||
      !Number.isSafeInteger(sale.amountMinor) || sale.amountMinor < 0 || sale.amountMinor !== Number(order.amountMinor) ||
      !/^[A-Z]{3}$/.test(sale.currency || '') || sale.currency !== order.currency ||
      finality !== 'POSTED' || !acceptPosted || sale.evidence.chargeMinor !== sale.amountMinor) {
    throw mediaError('MEDIA_PURCHASE_VERIFICATION_REQUIRED');
  }
  return { ...providerMediaIdentity(sale), finality };
}

/** Call only from a trusted server-side reconciliation adapter; no client proof endpoint. */
export class ProviderTransactionFulfillmentService {
  constructor({ repository, media, verifyEvidence, acceptPosted = false, expectedTransactionType = null,onMediaReady=null }) {
    Object.assign(this,{ repository,media,verifyEvidence,acceptPosted,expectedTransactionType,onMediaReady });
  }

  async fulfill(orderId) {
    return this.repository.withOrder(orderId, repository => this.fulfillLocked(orderId,repository));
  }

  async fulfillLocked(orderId, repository) {
    const order = await repository.order(orderId);
    if (!order) throw mediaError('MEDIA_ORDER_NOT_FOUND');
    if (this.expectedTransactionType) order.transactionType=this.expectedTransactionType;
    if (order.state === 'FULFILLED') return { state: 'FULFILLED', duplicate: true };
    if (order.state !== 'VERIFICATION_PENDING') {
      if (order.state !== 'FAILED') await repository.fail(orderId);
      await repository.transition(orderId,'VERIFICATION_PENDING');
    }
    // Fresh authoritative evidence and fresh source URL for every attempt.
    const sale = await this.verifyEvidence(order);
    matchProviderTransaction(order,sale,{ acceptPosted: this.acceptPosted });
    await repository.bindTransaction(order,sale);
    await repository.transition(orderId,'MEDIA_PENDING');
    await repository.transition(orderId,'MEDIA_INGESTING');
    try {
      const mediaInput = { ...providerMediaIdentity(sale),
        expectedMime: sale.media?.mimeType, expectedDuration: sale.media?.durationSeconds,
        expectedDimensions: sale.media?.dimensions,
        expectedBytes: sale.media?.byteSize, expectedChecksum: sale.media?.checksum };
      Object.defineProperty(mediaInput,'sourceUrl',{value:sale.media?.sourceUrl,enumerable:false});
      Object.defineProperty(mediaInput,'sourceReferer',{value:sale.media?.sourceReferer,enumerable:false});
      const asset = await this.media.ingest(mediaInput);
      if (asset.state !== 'MEDIA_READY') throw mediaError('MEDIA_NOT_READY');
      await repository.markReady(order,sale,asset.assetId);
      if(typeof this.onMediaReady==='function')await this.onMediaReady(order,sale,asset);
      await repository.complete(order.id,sale.transactionId,sale.transactionType);
      return { state: 'FULFILLED', assetId: asset.assetId, duplicate: asset.duplicate };
    } catch(error) {
      await repository.fail(orderId);
      throw mediaError(/^MEDIA_[A-Z_]+$/.test(error?.code || '') ? error.code : 'MEDIA_FULFILLMENT_FAILED', error?.retryable === true);
    }
  }

  async observeReversal(observationId) {
    const observation = await this.verifyEvidence({ observationId, operation: 'reversal' });
    if (!observation || !['reimbursement','chargeback'].includes(observation.type) ||
        !/^[a-z][a-z0-9_-]{0,63}$/.test(observation.provider || '') ||
        !/^[A-Za-z0-9_-]{1,255}$/.test(observation.id || '') ||
        (observation.originalTransactionId != null && !/^[A-Za-z0-9_-]{1,255}$/.test(observation.originalTransactionId))) throw mediaError('MEDIA_REVERSAL_INVALID');
    // Do not pass raw response fields or source URLs to persistence.
    return this.repository.reversal({ provider: observation.provider,id: observation.id,type: observation.type,
      authorityVerified: observation.authorityVerified === true,originalTransactionId: observation.originalTransactionId || null });
  }
}
