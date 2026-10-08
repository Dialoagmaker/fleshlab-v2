import { HttpError } from './errors.js';
export function loyalFansPurchaseDestination(value) {
  try {
    const url=new URL(value);
    if(url.protocol!=='https:' || url.username || url.password || url.port || !['loyalfans.com','www.loyalfans.com','tinylf.com','www.tinylf.com'].includes(url.hostname) || url.search || url.hash) throw Error();
    if(url.pathname==='/' || (url.hostname.includes('loyalfans.com') && !/^\/[^/]+\/video\/[^/]+$/.test(url.pathname))) throw Error();
    return url.toString();
  } catch { throw new HttpError(422,'PURCHASE_DESTINATION_INVALID','This purchase destination is unavailable.'); }
}
export function normalizeLoyalFansPrecheck(uid,payload) {
  // UID is opaque: '-2F' has no evidenced decoding rule.
  if(typeof uid!=='string' || !/^[A-Za-z0-9_-]{16,255}$/.test(uid) || payload?.success!==true || payload.httpCode!==200) throw new HttpError(422,'PRECHECK_INVALID','Invalid pre-check evidence.');
  const r=payload.response;
  if(!r || typeof r.can_buy!=='boolean' || typeof r.can_subscribe!=='boolean' || !Number.isFinite(r.individual_price) || r.individual_price<0 || !Number.isSafeInteger(Math.round(r.individual_price*100))) throw new HttpError(422,'PRECHECK_INVALID','Invalid pre-check evidence.');
  return {external_content_uid:uid,individual_price:r.individual_price,currency:null,can_buy:r.can_buy,can_subscribe:r.can_subscribe,payment_verified:false};
}
