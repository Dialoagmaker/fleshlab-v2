import { loyalFansPpvProtocol } from './loyalfans-ppv-protocol.js';
import { HttpError } from './errors.js';
const blocked = () => { throw new HttpError(503, 'CHECKOUT_UNAVAILABLE', 'FLESHLAB checkout is temporarily unavailable.'); };
// Default operational readiness; implemented retrieval contracts do not activate credentials or fulfillment.
export const LOYALFANS_BRIDGE_READINESS = Object.freeze({
  status: 'NOT_READY',
  comment_retrieval: 'OBSERVED_TERMINAL_FIRST_PAGE',
  transaction_history: 'AUTHENTICATED_CREATOR_LEDGER',
  purchase_verification: 'REGISTERED_GENERIC_RUNTIME',
  blockers: Object.freeze([
    'CREATOR_CREDENTIAL_CONFIGURATION',
    'EXPLICIT_PROVIDER_ACTIVATION',
    'EXACT_BUYER_AND_CONTENT_MAPPINGS',
    'TRANSACTION_CURRENCY_AND_POSTED_ADOPTION'
  ])
});
const UID = /^[A-Za-z0-9_-]{16,255}$/;
const FINAL = new Set(['paid', 'settled', 'completed']);
const REVERSED = new Map([['refunded', 'refunded'], ['reimbursement', 'refunded'], ['chargeback', 'chargeback'], ['reversed', 'reversed']]);
// The production client uses only dedicated creator-account server secrets.
export class LoyalFansCommerceAdapter {
  constructor({ observationClient = null, reactionObservationClient = null, commentObservationClient = null,
    providerClient = null, fulfillment = null, fulfillmentEnabled = false, settlementCurrency = null, controlled = false, environment = process.env.NODE_ENV } = {}) {
    const injected = controlled && environment !== 'production' && process.env.NODE_ENV !== 'production';
    this.providerClient = providerClient;
    if(fulfillment){
      this.reconcileOrder=async orderId=>{
        const result=await fulfillment.reconcile(orderId);
        return{fulfilled:result.state==='FULFILLED',duplicate:result.duplicate===true,state:result.state};
      };
    }
    const configured = providerClient?.status().status !== 'NOT_CONFIGURED' && Boolean(providerClient);
    this.observationClient = configured ? providerClient : (injected ? observationClient : null);
    this.reactionObservationClient = injected ? reactionObservationClient : null;
    const commentsConfigured = configured && providerClient.commentsConfigured?.() === true &&
      (providerClient.supportsCompleteComments?.() ?? providerClient.canAttestCompleteComments?.()) === true;
    this.commentObservationClient = commentsConfigured ? providerClient : (injected ? commentObservationClient : null);
    this.settlementCurrency = /^[A-Z]{3}$/.test(settlementCurrency || '') ? settlementCurrency : null;
    this.key = 'loyalfans'; this.protocol = loyalFansPpvProtocol; this.embeddedCheckout = false;
    this.readiness = LOYALFANS_BRIDGE_READINESS;
    this.capabilities = { hostedPurchase:true, transactionLookup:Boolean(this.observationClient), buyerIdentity:commentsConfigured,
      refundEvents:false, automaticReturn:false, authoritativeVerification:configured && commentsConfigured &&
        ((Boolean(fulfillment) && fulfillmentEnabled) || providerClient?.environment!=='production'),
      authorizedCommentRetrieval:commentsConfigured, authorizedTransactionHistory:configured,
      reactionLikeVerificationEvidence:'CAPTURED_SERVER_PROVEN', creatorReactionNotificationEvidence:'CAPTURED_SERVER_PROVEN',
      automatedCreatorNotificationRetrieval:'UNKNOWN', reactionNotificationLookup:Boolean(this.reactionObservationClient),
      commentLookup:Boolean(this.commentObservationClient) };
  }
  status() { return this.providerClient?.status() || { status: 'NOT_CONFIGURED' }; }
  async createCheckout() { return blocked(); }
  async observeTransactions(order) {
    if (!this.observationClient) return [];
    const start = new Date(order.created_at);
    if (!Number.isFinite(start.getTime())) return [];
    const range = {dateFrom:start.toISOString().slice(0,10),dateTo:new Date().toISOString().slice(0,10)};
    const result = this.providerClient ? await this.providerClient.listAllTransactions(range)
      : await this.observationClient.listTransactions({...range,page:1,limit:100});
    return result.transactions;
  }
  async observeReactionNotifications(challenge) {
    if (!this.reactionObservationClient) throw new HttpError(503, 'VERIFICATION_UNAVAILABLE', 'LoyalFans creator notifications are unavailable.');
    // Controlled non-production injection only. No production retrieval endpoint
    // or creator credential flow has been authorized or implemented.
    return this.reactionObservationClient.listReactionNotifications({
      targetUid: challenge.targetUid,
      createdAt: challenge.createdAt,
      expiresAt: challenge.expiresAt
    });
  }
  async observeComments(challenge) {
    if (!this.commentObservationClient) throw new HttpError(503, 'VERIFICATION_UNAVAILABLE', 'LoyalFans creator comments are unavailable.');
    const page = await this.commentObservationClient.listComments({ postUid: challenge.postUid,
      createdAt: challenge.createdAt, expiresAt: challenge.expiresAt });
    if (page?.authority !== 'creator_authenticated' || page.scope_post_uid !== challenge.postUid ||
        page.complete !== true || !Array.isArray(page.comments)) {
      throw new HttpError(503, 'VERIFICATION_UNAVAILABLE', 'LoyalFans creator comments are incomplete.');
    }
    return page;
  }
  async verifyTransaction(order) {
    if(this.reconcileOrder || this.providerClient?.environment==='production')throw new HttpError(503,'LOYALFANS_BRIDGE_NOT_READY','Use the registered provider fulfillment runtime.');
    if (!this.providerClient) throw new HttpError(503, 'LOYALFANS_BRIDGE_NOT_READY', 'LoyalFans purchase verification is unavailable.');
    if (!UID.test(order?.linked_buyer_uid || '') || !UID.test(order?.external_content_uid || '') || !order?.created_at) {
      throw new HttpError(409, 'BUYER_VERIFICATION_REQUIRED', 'A verified buyer and exact post are required.');
    }
    const observations = await this.observeTransactions(order);
    const created = Date.parse(order.created_at);
    const matches = observations.filter(t => t.transaction_type === 'clip_store' &&
      t.provider_member_uid === order.linked_buyer_uid && t.provider_content_uid === order.external_content_uid &&
      UID.test(t.provider_transaction_id || '') && Number.isFinite(Date.parse(t.purchased_at)) &&
      Date.parse(t.purchased_at) >= created && t.gross_amount_minor === Number(order.total_minor));
    const unique = new Map(matches.map(t => [t.provider_transaction_id, t]));
    if (matches.length !== 1 || unique.size !== 1) throw new HttpError(409, 'PAYMENT_REQUIRES_REVIEW', 'The creator history does not contain one exact purchase.');
    const sale = matches[0];
    const status = String(sale.raw_provider_status || '').toLowerCase();
    const final = FINAL.has(status);
    const reversed = REVERSED.get(status);
    if (!final && !reversed) throw new HttpError(409, 'PAYMENT_REQUIRES_REVIEW', 'The creator history does not establish a final payment state.');
    const currency = sale.currency || this.settlementCurrency;
    if (!currency || currency !== order.currency) throw new HttpError(409, 'PAYMENT_REQUIRES_REVIEW', 'The creator history currency does not match the order.');
    const reversalObservations = observations.filter(t => ['reimbursement','chargeback'].includes(t.transaction_type) &&
      t.provider_member_uid === order.linked_buyer_uid && t.provider_content_uid === order.external_content_uid &&
      UID.test(t.provider_transaction_id || ''));
    return { provider:'loyalfans', transactionId:sale.provider_transaction_id, transactionType:sale.transaction_type, buyerUid:sale.provider_member_uid,
      contentUid:sale.provider_content_uid, amountMinor:sale.gross_amount_minor, currency,
      status:reversed || 'paid', revision:reversed ? 1 : 0, verified:true, buyerVerified:true,
      claimVerified:true, finalityVerified:true, correlation:null, reversalObservations };
  }
}
export class Chain2PayCommerceAdapter {
  constructor(service) { this.key = 'chain2pay'; this.service = service; this.embeddedCheckout = false; }
  // Existing hosted checkout is not evidence of an invisible embedded contract.
  async createCheckout() { return blocked(); }
  async verifyTransaction() { return blocked(); }
}
export class CommerceProviderRegistry {
  constructor(adapters) { this.adapters = new Map(adapters.map(a => [a.key, a])); }
  get(key) { const adapter = this.adapters.get(key); if (!adapter) return blocked(); return adapter; }
}
