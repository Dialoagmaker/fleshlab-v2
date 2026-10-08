import { HttpError } from './errors.js';
const descriptor = (method,path,evidence) => Object.freeze({method,path,evidence});
export const loyalFansPpvProtocol = Object.freeze({
  precheck:descriptor('POST','/api/v2/ecommerce-engine/buy-pre-check','SERVER-PROVEN'),
  purchase:descriptor('POST','/api/v2/ecommerce-engine/buy','CLIENT-PROVEN'),
  currentUser:descriptor('GET','/api/v1/auth/user/me','CLIENT-PROVEN'),
  balance:descriptor('POST','/api/v1/balance','CLIENT-PROVEN'),
  history:descriptor('POST','/api/v2/funds/transactions-history/list','SERVER-PROVEN'),
  reversalCategories:Object.freeze(['reimbursement','chargeback']),
  reversalEvidence:'CLIENT-PROVEN',
  finalityEvidence:'UNKNOWN',
  automatedAuthorizationEvidence:'UNKNOWN'
});
export function loyalFansUidPayload(uid) {
  if(typeof uid!=='string' || !/^[A-Za-z0-9_-]{16,255}$/.test(uid)) throw new HttpError(422,'INVALID_CONTENT_UID','Invalid content identity.');
  return {uid}; // opaque bytes, never decode '-2F'
}
export function parseLoyalFansClientPurchase(payload) {
  // Preserve only a projection of client-consumed post fields, never media URLs
  // or arbitrary provider response fields. A client success is not verification.
  const post=payload?.post;
  return {clientSuccess:Boolean(payload?.success),post:post && typeof post==='object' && !Array.isArray(post) ? {uid:typeof post.uid==='string'?post.uid:null,is_bought:post.is_bought===true,can_see:post.can_see===true} : null,evidence:'CLIENT-PROVEN',paymentVerified:false};
}
export function parseLoyalFansCurrentUser(payload) {
  const uid=payload?.response?.user?.uid;
  return {memberUid:loyalFansUidPayload(uid).uid,evidence:'CLIENT-PROVEN',controlVerified:false};
}
export function matchesVerifiedBuyer(link,userId,memberUid) {
  return link?.status==='verified' && link.user_id===userId && typeof memberUid==='string' && link.provider_member_uid===memberUid;
}
export function exactPurchaseContent(purchaseUid,attachedUid) {
  return typeof purchaseUid==='string' && purchaseUid.length>0 && purchaseUid===attachedUid;
}
export function classifyLoyalFansObservation(t) {
  const type=t?.transaction_type ?? t?.type;
  return {category:type==='clip_store'?'purchase':loyalFansPpvProtocol.reversalCategories.includes(type)?'reversal':'unsupported',type,evidence:'CLIENT-PROVEN',originalTransactionId:null,linkage:'UNKNOWN',mayGrant:false,mayRevoke:false};
}
