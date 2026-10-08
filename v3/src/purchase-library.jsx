import React, { useEffect, useState } from 'react';
export function PurchaseLibrary() {
  const [records,setRecords] = useState(null); const [error,setError] = useState('');
  const [verification,setVerification] = useState(null); const [verificationError,setVerificationError] = useState(''); const [verificationBusy,setVerificationBusy] = useState(false);
  useEffect(() => { let active=true; fetch('/api/v3/commerce/library',{credentials:'include'}).then(async r => { const data=await r.json(); if(!r.ok) throw new Error(data.error?.message || 'Library unavailable.'); if(active) setRecords(data.records); }).catch(e => { if(active) setError(e.message); }); return () => { active=false; }; },[]);
  const requestVerification = async (operation) => {
    setVerificationBusy(true); setVerificationError('');
    try {
      const response = await fetch(`/api/v3/commerce/buyer-links/loyalfans/${operation}`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body:'{}' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Unable to verify right now. Try again later.');
      setVerification(previous => ({ ...previous, ...data, destination_url:data.destination_url || previous?.destination_url, expires_at:data.expires_at || previous?.expires_at }));
    } catch (e) {
      setVerification(previous => ({ ...previous, status:'unable_to_verify' }));
      setVerificationError(e.message || 'Unable to verify right now. Try again later.');
    } finally { setVerificationBusy(false); }
  };
  const verified = verification?.status === 'verified';
  const expired = verification?.status === 'expired';
  const unable = verification?.status === 'unable_to_verify' || verification?.verification_status === 'unable_to_verify' || Boolean(verificationError);
  return <main className="public-main"><h1>Your FLESHLAB library</h1>
    <section aria-labelledby="loyalfans-verification-title">
      <h2 id="loyalfans-verification-title">Verify LoyalFans account</h2>
      {verified ? <p role="status">Verified. Your account is linked. Video access still requires a separately verified purchase.</p> : <>
        {expired && <p role="status">Expired. Start again to get a new verification window.</p>}
        {unable && <p role="alert">Unable to verify. {verificationError || verification?.message || 'Try again later.'}</p>}
        {verification?.status === 'pending' && !unable && <p role="status">{verification?.verification_status === 'waiting' ? 'Waiting for verification. Like the selected post, then click Verify.' : 'Waiting for verification.'}</p>}
        {verification?.destination_url && <p><a href={verification.destination_url} target="_blank" rel="noreferrer">Open the selected FLESHLAB Studios post on LoyalFans</a></p>}
        {verification?.destination_url && <p>Like this post, return to FLESHLAB, then verify. This proves account identity only.</p>}
        <button type="button" disabled={verificationBusy} onClick={() => requestVerification(verification?.destination_url ? 'verify' : 'start')}>
          {verificationBusy ? 'Checking…' : verification?.destination_url ? 'Verify' : expired ? 'Start verification again' : 'Start verification'}
        </button>
      </>}
    </section>
    {error && <p role="alert">{error} <a href="/v3/checkout">Sign in</a></p>}{!error && records===null && <p>Loading your videos…</p>}{records?.length===0 && <p>Your purchased videos will appear here.</p>}{records?.map(v => <article key={v.id}><h2><a href={v.href}>{v.title}</a></h2><video controls playsInline preload="none" src={v.playback_url}/>{v.download_url && <a href={v.download_url}>Download video</a>}</article>)}</main>;
}
