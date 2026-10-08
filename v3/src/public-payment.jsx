import React, { useEffect, useMemo, useState } from 'react';

const apiJson = async (path, options = {}) => {
  const response = await fetch(path, { credentials: 'include', headers: { accept: 'application/json', 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Request failed (${response.status})`);
  return data;
};

const formatPrice = offer => offer ? `${offer.currency} ${(Number(offer.amount_minor || 0) / 100).toFixed(2)}` : '';
const randomKey = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-checkout`;

function Methods() {
  return <section className="checkout-methods"><span className="checkout-kicker">PAY SECURELY</span><div className="checkout-method-strip"><b>Visa</b><b>Mastercard</b><b>Amex</b><b>Apple Pay</b><b>Google Pay</b><b>Bank transfer</b></div><p>Payment options will appear when checkout is available.</p></section>;
}

function AccountGate({ onLogin, busy, error }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  return <section className="checkout-account"><div><span className="checkout-kicker">ACCOUNT REQUIRED</span><h2>Sign in to continue.</h2><p>Your purchase and entitlement must be linked to your FLESHLAB customer account.</p></div><form onSubmit={event => { event.preventDefault(); onLogin({ email, password }); }}><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password"/></label>{error && <p className="error">{error}</p>}<button className="raw-button raw-button-red" disabled={busy}>{busy ? 'SIGNING IN…' : 'SIGN IN'}</button></form></section>;
}

function StatusView({ orderId }) {
  const [state, setState] = useState(null); const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false; let timer;
    const poll = async () => {
      try { const data = await apiJson(`/api/v3/commerce/orders/${encodeURIComponent(orderId)}`); if (!cancelled) { setState(data); setError(''); if (!data.fulfilled && (['pending', 'processing'].includes(data.order?.status) || data.order?.fulfillment_status === 'media_pending')) timer = window.setTimeout(poll, 3000); } }
      catch (requestError) { if (!cancelled) { setError(requestError.message); timer = window.setTimeout(poll, 5000); } }
    };
    poll(); return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [orderId]);
  const check = async () => { try { setError(''); setState(await apiJson(`/api/v3/commerce/orders/${encodeURIComponent(orderId)}/reconcile`,{method:'POST',body:'{}'})); } catch(e) { setError(e.message); } };
  const status = state?.order?.status;
  const mediaPending = state?.order?.fulfillment_status === 'media_pending';
  const heading = state?.fulfilled ? (state.order.purchase_type === 'subscription' ? 'Your membership is active.' : state.order.purchase_type === 'ppv' ? 'Unlocked. Watch now.' : 'Credit added.') : mediaPending ? 'Your FLESHLAB copy is being prepared.' : status === 'expired' ? 'Payment session expired.' : status === 'failed' || status === 'dispatch_failed' ? 'Payment could not be completed.' : 'Waiting for purchase verification.';
  const statusMessage = state?.fulfilled ? (state.order.subscription_end ? `Active until ${new Date(state.order.subscription_end).toLocaleDateString()}.` : 'Your account has been updated.') : mediaPending ? 'The purchase is verified. Protected playback will open after the private FLESHLAB video is ready.' : status === 'expired' ? 'Start a new checkout session to try again.' : error || 'Returning to FLESHLAB does not confirm payment; access opens only after server verification.';
  return <section className="checkout-status"><span className="checkout-kicker">FLESHLAB / PURCHASE STATUS</span><h1>{heading}</h1><p>{statusMessage}</p>{!state?.fulfilled && state?.order?.purchase_launch_url && <><p>Complete the purchase in the opened LoyalFans window, then return to FLESHLAB. Returning does not confirm payment.</p><a className="raw-button" href={state.order.purchase_launch_url} target="_blank" rel="noopener noreferrer">OPEN LOYALFANS</a><button className="raw-button" onClick={check}>CHECK PURCHASE</button></>}{mediaPending && <button className="raw-button" onClick={check}>REFRESH STATUS</button>}{state?.fulfilled && state.order.purchase_type === 'ppv' && <a className="raw-button raw-button-red" href="/v3/library">WATCH NOW</a>}{(status === 'expired' || status === 'failed') && <a className="raw-button" href="/v3/videos">BACK TO ARCHIVE</a>}</section>;
}

export function PaymentCheckout({ query }) {
  const provider = query.get('provider') === 'loyalfans' ? 'loyalfans' : ''; const offerId = query.get('offer') || ''; const productId = query.get('product') || ''; const orderId = query.get('order') || '';
  const [offers, setOffers] = useState([]); const [user, setUser] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [loginBusy, setLoginBusy] = useState(false);
  const [idempotencyKey] = useState(() => randomKey());
  useEffect(() => { if (orderId) return; const path = provider === 'loyalfans' ? `/api/v3/public/commerce/loyalfans-offer?product_id=${encodeURIComponent(productId)}` : `/api/v3/public/commerce/offers?product_id=${encodeURIComponent(productId)}`; apiJson(path).then(data => setOffers(provider === 'loyalfans' ? (data.record ? [data.record] : []) : (data.records || []))).catch(e => setError(e.message)); }, [productId, orderId, provider]);
  useEffect(() => { if (orderId) return; apiJson('/api/v1/auth/me').then(setUser).catch(() => setUser(null)); }, [orderId]);
  const offer = useMemo(() => provider === 'loyalfans' ? offers[0] || null : offers.find(item => item.offer_id === offerId) || null, [offers, offerId, provider]);
  if (orderId) return <main className="public-main checkout-page"><StatusView orderId={orderId}/></main>;
  const login = async credentials => { setLoginBusy(true); setError(''); try { setUser(await apiJson('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(credentials) })); } catch (e) { setError(e.message); } finally { setLoginBusy(false); } };
  const start = async () => { if (!offer) return; setBusy(true); setError(''); try { const checkout = provider === 'loyalfans' ? { provider: 'loyalfans', product_id: productId } : { offer_id: offer.offer_id, purchase_type: offer.purchase_type, product_id: offer.product_id || productId }; const data = await apiJson('/api/v3/commerce/checkout', { method: 'POST', headers: { 'idempotency-key': idempotencyKey }, body: JSON.stringify(checkout) }); window.location.assign(`/v3/checkout?order=${encodeURIComponent(data.order.id)}`); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <main className="public-main checkout-page"><section className="checkout-heading"><span className="archive-kicker">FLESHLAB / CHECKOUT</span><h1>{provider === 'loyalfans' ? <>PURCHASE ON<br/><em>LOYALFANS.</em></> : <>CHOOSE HOW<br/><em>YOU WANT TO PAY.</em></>}</h1><p>Your purchase and FLESHLAB entitlement are linked to your FLESHLAB account.</p></section>{error && <p className="error">{error}</p>}{!offer && <div className="public-empty">This payment offer is not available. Return to the video and choose an active option.</div>}{offer && <section className="checkout-order"><div><span className="checkout-kicker">YOUR ORDER</span><h2>{offer.name}</h2><p>{offer.description || (offer.purchase_type === 'ppv' ? 'One-time access to this public video.' : 'Entitlement period for your FLESHLAB account.')}</p>{provider === 'loyalfans' && <p>Payment takes place in LoyalFans. FLESHLAB verifies the creator account transaction before granting protected access.</p>}</div><strong>{formatPrice(offer)}{offer.purchase_type === 'subscription' ? ` / ${offer.interval}` : ''}</strong>{user ? <><p className="checkout-signed">Signed in as {user.email}</p><button className="raw-button raw-button-red" onClick={start} disabled={busy}>{busy ? 'OPENING CHECKOUT…' : provider === 'loyalfans' ? `CONTINUE TO LOYALFANS — ${formatPrice(offer)}` : `CONTINUE ${formatPrice(offer)}`}</button></> : <AccountGate onLogin={login} busy={loginBusy} error={error}/>}</section>}</main>;
}
