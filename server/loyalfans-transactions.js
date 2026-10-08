import { normalizeLoyalFansPublicProductUrl } from './loyalfans-catalogue.js';
import { normalizeLoyalFansTimestamp } from './loyalfans-timestamps.js';

const PROVIDER = 'loyalfans';
const IDENTIFIER = /^[A-Za-z0-9_-]{16,255}$/;
const CURRENCY = /^[A-Z]{3}$/;

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function text(value, max = 10000) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result ? result.slice(0, max) : null;
}

function identifier(value, field) {
  const result = text(value, 255);
  if (!result || !IDENTIFIER.test(result)) throw invalid('INVALID_LOYALFANS_TRANSACTION', `${field} is required.`);
  return result;
}

function decimal(value, field, { required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) throw invalid('INVALID_LOYALFANS_TRANSACTION', `${field} is required.`);
    return null;
  }
  const result = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(result)) throw invalid('INVALID_LOYALFANS_TRANSACTION', `${field} must be a non-negative decimal.`);
  return result;
}

function decimalMinor(value) {
  if (value === null) return null;
  const [whole, fraction = ''] = value.split('.');
  const minor = Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
  if (!Number.isSafeInteger(minor)) throw invalid('INVALID_LOYALFANS_TRANSACTION', 'Transaction amount is outside the supported range.');
  return minor;
}

function timestamp(value, field, { required = false } = {}) {
  try { return normalizeLoyalFansTimestamp(value, { required }); }
  catch { throw invalid('INVALID_LOYALFANS_TRANSACTION', `${field} must be a valid timestamp.`); }
}

/**
 * Normalizes a manually authorized creator transaction response. It performs
 * no network request and never treats a browser capture as an entitlement.
 */
export function normalizeLoyalFansTransaction(record, { observedAt = null } = {}) {
  const member = record?.member || {};
  const content = record?.attached_to || {};
  const transactionType = text(record?.transaction_type || record?.type, 100);
  if (!transactionType) throw invalid('INVALID_LOYALFANS_TRANSACTION', 'transaction_type is required.');
  if (['reimbursement','chargeback'].includes(transactionType)) {
    // Client proves these categories, not the full server reversal schema.
    // Preserve only available observed fields; never invent original linkage.
    return {provider:PROVIDER,transaction_type:transactionType,
      provider_transaction_id:text(record?.id || record?.transaction_id,255),
      provider_member_uid:text(member.uid,255),provider_content_uid:text(content.uid,255),
      currency:null,gross_amount_minor:null,purchased_at:null,
      original_transaction_id:null,linkage:'UNKNOWN',may_revoke:false};
  }
  const currency = text(record?.currency, 3)?.toUpperCase() || null;
  if (currency && !CURRENCY.test(currency)) throw invalid('INVALID_LOYALFANS_TRANSACTION', 'currency must be a three-letter ISO code.');
  const grossAmount = decimal(record?.charge ?? record?.gross_amount, 'charge', { required: true });
  const creatorPayout = decimal(record?.payout ?? record?.creator_payout, 'payout');
  const providerFee = decimal(record?.fee ?? record?.provider_fee, 'fee');
  const providerRate = decimal(record?.rate ?? record?.provider_rate, 'rate');
  const contentUrl = normalizeLoyalFansPublicProductUrl(content.short_url || content.url || record?.provider_content_url);
  // A creator sale can identify the product by attached_to.uid even when the
  // response omits a public URL. URLs are never transaction identities.

  return {
    provider: PROVIDER,
    provider_transaction_id: identifier(record?.id || record?.transaction_id, 'provider_transaction_id'),
    provider_member_uid: identifier(member.uid || record?.provider_member_uid, 'provider_member_uid'),
    provider_member_slug: text(member.slug || record?.provider_member_slug, 255),
    transaction_type: transactionType,
    gross_amount: grossAmount,
    gross_amount_minor: decimalMinor(grossAmount),
    creator_payout: creatorPayout,
    creator_payout_minor: decimalMinor(creatorPayout),
    provider_fee: providerFee,
    provider_fee_minor: decimalMinor(providerFee),
    provider_rate: providerRate,
    currency,
    purchased_at: timestamp(record?.created_at || record?.purchased_at, 'created_at', { required: true }),
    provider_content_uid: identifier(content.uid || record?.provider_content_uid, 'provider_content_uid'),
    provider_content_slug: text(content.slug || record?.provider_content_slug, 255),
    provider_content_url: contentUrl,
    raw_provider_status: text(record?.status || record?.state || record?.transaction_status, 100),
    observed_at: timestamp(observedAt || record?.observed_at, 'observed_at')
  };
}

/**
 * Resolves only the provider's immutable content UID. Titles and slugs are
 * intentionally not candidates for fallback matching.
 */
export function matchLoyalFansTransactionToCatalogue(transaction, mappings) {
  if (transaction?.provider !== PROVIDER || transaction.transaction_type !== 'clip_store') {
    throw invalid('UNSUPPORTED_LOYALFANS_TRANSACTION', 'Only LoyalFans clip_store transactions can be reconciled.');
  }
  if (!Array.isArray(mappings)) throw invalid('INVALID_EXTERNAL_CONTENT_MAPPINGS', 'External content mappings must be an array.');
  const matches = mappings.filter(mapping => mapping?.provider === PROVIDER && String(mapping.external_content_uid || '') === transaction.provider_content_uid);
  if (matches.length > 1) throw invalid('AMBIGUOUS_EXTERNAL_CONTENT_MAPPING', 'A LoyalFans content UID maps to more than one FLESHLAB video.');
  if (!matches.length) return { matched: false, reason: 'UNMAPPED_EXTERNAL_CONTENT_UID', transaction };
  const videoId = text(matches[0].video_legacy_id ?? matches[0].fleshlab_video_id, 255);
  if (!videoId) throw invalid('INVALID_EXTERNAL_CONTENT_MAPPING', 'Mapped FLESHLAB video ID is required.');
  return { matched: true, transaction, fleshlab_video_id: videoId, mapping: { provider: PROVIDER, external_content_uid: transaction.provider_content_uid } };
}

/**
 * Resolves through the canonical provider-neutral mapping repository. The
 * provider/content UID pair is the only lookup key; titles and slugs never
 * participate in identity resolution.
 */
export async function resolveLoyalFansTransactionToCatalogue(transaction, mappingRepository) {
  if (!mappingRepository || typeof mappingRepository.findByExternalContentId !== 'function') {
    throw invalid('EXTERNAL_CONTENT_MAPPING_REPOSITORY_REQUIRED', 'An external content mapping repository is required.');
  }
  if (transaction?.provider !== PROVIDER || transaction.transaction_type !== 'clip_store') {
    throw invalid('UNSUPPORTED_LOYALFANS_TRANSACTION', 'Only LoyalFans clip_store transactions can be reconciled.');
  }
  const mapping = await mappingRepository.findByExternalContentId(PROVIDER, transaction.provider_content_uid);
  return matchLoyalFansTransactionToCatalogue(transaction, mapping ? [mapping] : []);
}

/**
 * Produces a fail-closed reconciliation plan for a future verified provider
 * integration. It never grants an entitlement; a documented server-side
 * LoyalFans verification and buyer-account binding are still prerequisites.
 */
export function planLoyalFansTransactionReconciliation(match, { fleshlabUserId = null, existingTransaction = null } = {}) {
  if (!match?.matched) return { action: 'blocked', reason: match?.reason || 'UNMAPPED_EXTERNAL_CONTENT_UID' };
  const transaction = match.transaction;
  const idempotencyKey = `${PROVIDER}:transaction:${transaction.provider_transaction_id}`;
  if (existingTransaction) {
    if (existingTransaction.provider !== PROVIDER || existingTransaction.provider_transaction_id !== transaction.provider_transaction_id || existingTransaction.provider_content_uid !== transaction.provider_content_uid) {
      throw invalid('LOYALFANS_TRANSACTION_IDEMPOTENCY_CONFLICT', 'The provider transaction ID is already associated with different content.');
    }
    return { action: 'duplicate', idempotency_key: idempotencyKey, provider_transaction_id: transaction.provider_transaction_id };
  }
  if (!text(fleshlabUserId, 255)) {
    return { action: 'blocked', reason: 'UNLINKED_LOYALFANS_MEMBER', idempotency_key: idempotencyKey, provider_member_uid: transaction.provider_member_uid };
  }
  return {
    action: 'await_authoritative_provider_verification',
    idempotency_key: idempotencyKey,
    provider_transaction_id: transaction.provider_transaction_id,
    fleshlab_user_id: fleshlabUserId,
    fleshlab_video_id: match.fleshlab_video_id,
    provider_member_uid: transaction.provider_member_uid,
    provider_content_uid: transaction.provider_content_uid
  };
}

export const LOYALFANS_TRANSACTION_PROVIDER = PROVIDER;
