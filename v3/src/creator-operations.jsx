import React, { useEffect, useState } from 'react';

function Metric({ label, value }) {
  return <article className="metric"><span>{label}</span><strong>{value ?? '—'}</strong><small>PostgreSQL</small></article>;
}

function Empty({ title, body }) {
  return <div className="empty"><b>{title}</b><p>{body}</p></div>;
}

export function CreatorOperations({ user, apiV3 }) {
  const [overview, setOverview] = useState(null);
  const [apps, setApps] = useState([]);
  const [creators, setCreators] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [catalogueVideos, setCatalogueVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [creatorDetail, setCreatorDetail] = useState(null);
  const [linkId, setLinkId] = useState('');
  const [videoId, setVideoId] = useState('');
  const [newName, setNewName] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [identityType, setIdentityType] = useState('id_front');
  const [identityFile, setIdentityFile] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUsage, setMediaUsage] = useState('profile');
  const [mediaType, setMediaType] = useState('thumbnail');
  const [loginUsername, setLoginUsername] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [credentialMessage, setCredentialMessage] = useState('');
  const [error, setError] = useState('');
  const isAdmin = user.role === 'admin';

  const load = async () => {
    try {
      const [o, a, c, p, v] = await Promise.all([
        apiV3('/admin/creators/overview'),
        apiV3('/admin/creators/applications?limit=24'),
        apiV3('/admin/creators?limit=24'),
        apiV3('/admin/catalogue/performers?limit=100'),
        apiV3('/admin/catalogue/videos?limit=100')
      ]);
      setOverview(o); setApps(a.records || []); setCreators(c.records || []); setPerformers(p.records || []); setCatalogueVideos(v.records || []);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const open = async app => { try { setSelected(app); setDetail(await apiV3(`/admin/creators/applications/${app.id}`)); } catch (e) { setError(e.message); } };
  const openCreator = async creator => { try { setCreatorDetail(await apiV3(`/admin/creators/records/${creator.id}`)); } catch (e) { setError(e.message); } };
  const refreshCreator = async () => { if (creatorDetail?.creator?.id) await openCreator({ id: creatorDetail.creator.id }); await load(); };
  const update = async status => { try { await apiV3(`/admin/creators/applications/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await open(selected); await load(); } catch (e) { setError(e.message); } };
  const convert = async () => { try { await apiV3(`/admin/creators/applications/${selected.id}/convert`, { method: 'POST', body: '{}' }); await open(selected); await load(); } catch (e) { setError(e.message); } };
  const linkApplicationPerformer = async create => { try { await apiV3(`/admin/creators/applications/${selected.id}/performer-link`, { method: 'POST', body: JSON.stringify(create ? { create_performer: true, display_name: newName } : { performer_legacy_id: linkId }) }); setNewName(''); setLinkId(''); await open(selected); await load(); } catch (e) { setError(e.message); } };
  const changeItem = async (item, state) => { try { await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/onboarding/${item.requirement_key}`, { method: 'PATCH', body: JSON.stringify({ state }) }); await refreshCreator(); } catch (e) { setError(e.message); } };
  const reviewDocument = async (doc, review_state) => { try { await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/documents/${doc.id}`, { method: 'PATCH', body: JSON.stringify({ review_state }) }); await refreshCreator(); } catch (e) { setError(e.message); } };
  const action = async (path, body = {}) => { try { await apiV3(path, { method: 'POST', body: JSON.stringify(body) }); await refreshCreator(); } catch (e) { setError(e.message); } };
  const createLogin = async () => {
    if (!creatorDetail) { setError('Open the Creator record before creating a login.'); return; }
    if (!isAdmin) { setError('Your current Admin account is not authorized to create Creator logins.'); return; }
    if (!loginUsername.trim()) { setError('Enter a username, for example elias.santos.'); return; }
    if (temporaryPassword.length < 8) { setError('The temporary password must contain at least 8 characters.'); return; }
    try {
      await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/account`, { method: 'POST', body: JSON.stringify({ username: loginUsername, temporary_password: temporaryPassword }) });
      setCredentialMessage('Login created. Copy the temporary password now; it is never returned or shown again by the server.');
      setTemporaryPassword('');
      await refreshCreator();
    } catch (e) { setError(e.message); }
  };
  const resetLoginPassword = async () => {
    if (!creatorDetail) { setError('Open the Creator record before resetting its password.'); return; }
    if (temporaryPassword.length < 8) { setError('The temporary password must contain at least 8 characters.'); return; }
    try {
      await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/account/password-reset`, { method: 'POST', body: JSON.stringify({ temporary_password: temporaryPassword }) });
      setCredentialMessage('Password reset. Copy the temporary password before clearing this form; it is never returned by the server.');
      setTemporaryPassword('');
      await refreshCreator();
    } catch (e) { setError(e.message); }
  };
  const copyLoginUrl = async () => { const value = creatorDetail?.account?.login_url; if (value) { await navigator.clipboard?.writeText(value); setCredentialMessage('Creator Portal login URL copied.'); } };
  const copyTemporaryPassword = async () => { if (temporaryPassword) { await navigator.clipboard?.writeText(temporaryPassword); setCredentialMessage('Temporary password copied. It will not be shown again after this action.'); } };
  const setLoginState = async status => { try { await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/account`, { method: 'PATCH', body: JSON.stringify({ status }) }); await refreshCreator(); } catch (e) { setError(e.message); } };
  const uploadToUrl = async (url, file) => { const result = await fetch(url, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'content-type': file.type }, body: file }); if (!result.ok) throw new Error(`Upload failed (${result.status})`); };
  const uploadIdentity = async () => {
    if (!identityFile || !creatorDetail) return;
    try {
      const id = creatorDetail.creator.id;
      const issued = await apiV3(`/admin/creators/records/${id}/identity/upload`, { method: 'POST', body: JSON.stringify({ document_type: identityType, file_name: identityFile.name, content_type: identityFile.type, byte_size: identityFile.size }) });
      await uploadToUrl(issued.upload_url, identityFile);
      await apiV3(`/admin/creators/records/${id}/identity/${issued.document_id}/confirm`, { method: 'POST', body: '{}' });
      setIdentityFile(null); await refreshCreator();
    } catch (e) { setError(e.message); }
  };
  const uploadMedia = async () => {
    if (!mediaFile || !creatorDetail) return;
    try {
      const id = creatorDetail.creator.id;
      const issued = await apiV3(`/admin/creators/records/${id}/media/upload`, { method: 'POST', body: JSON.stringify({ asset_type: mediaType, usage: mediaUsage, performer_legacy_id: creatorDetail.performers[0]?.performer_legacy_id, file_name: mediaFile.name, content_type: mediaFile.type, byte_size: mediaFile.size, visibility: 'private' }) });
      await uploadToUrl(issued.upload_url, mediaFile);
      await apiV3(`/admin/creators/records/${id}/media/${issued.asset_id}/confirm`, { method: 'POST', body: '{}' });
      setMediaFile(null); await refreshCreator();
    } catch (e) { setError(e.message); }
  };
  const reviewIdentity = async status => { try { await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/identity`, { method: 'PATCH', body: JSON.stringify({ status }) }); await refreshCreator(); } catch (e) { setError(e.message); } };
  const viewIdentity = async documentId => { try { const result = await apiV3(`/admin/creator-submissions/identity/${documentId}/view`, { method: 'POST', body: '{}' }); window.open(result.view_url, '_blank', 'noopener'); } catch (e) { setError(e.message); } };
  const viewMedia = async assetId => { try { const result = await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/media/${assetId}/view`, { method: 'POST', body: '{}' }); window.open(result.view_url, '_blank', 'noopener'); } catch (e) { setError(e.message); } };
  const reviewMedia = async (assetId, review_status) => { try { await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/media/${assetId}`, { method: 'PATCH', body: JSON.stringify({ review_status }) }); await refreshCreator(); } catch (e) { setError(e.message); } };
  const publishProfileMedia = async assetId => { try { await apiV3(`/admin/creators/records/${creatorDetail.creator.id}/media/${assetId}/publish-profile`, { method: 'POST', body: '{}' }); await refreshCreator(); } catch (e) { setError(e.message); } };
  const createPerformer = async () => { if (!newName.trim()) return; await action(`/admin/creators/records/${creatorDetail.creator.id}/performer`, { display_name: newName }); setNewName(''); };
  const linkPerformer = async () => { if (!linkId) return; await action(`/admin/creators/records/${creatorDetail.creator.id}/performer-link`, { performer_legacy_id: linkId }); setLinkId(''); };
  const linkVideo = async create => { if (create && !videoTitle.trim()) return; if (!create && !videoId) return; await action(`/admin/creators/records/${creatorDetail.creator.id}/videos`, create ? { create: true, title: videoTitle, performer_legacy_id: creatorDetail.performers[0]?.performer_legacy_id } : { video_legacy_id: videoId, performer_legacy_id: creatorDetail.performers[0]?.performer_legacy_id }); setVideoTitle(''); setVideoId(''); };
  const openContract = () => { window.location.href = `/admin?section=Contracts&creatorId=${encodeURIComponent(creatorDetail.creator.id)}&performerId=${encodeURIComponent(creatorDetail.performers[0]?.performer_legacy_id || '')}`; };

  return <section className="creators">
    <div className="catalogue-head"><div><span className="eyebrow">CREATOR OPERATIONS</span><h2>People behind the work.</h2><p>Creator account, private identity, public performer, contract, media and catalogue relationships stay separate and auditable.</p></div></div>
    {error && <p className="error">{error}</p>}
    <div className="metric-grid creator-metrics"><Metric label="Awaiting review" value={overview?.metrics?.awaiting_review}/><Metric label="Onboarding" value={overview?.metrics?.onboarding_incomplete}/><Metric label="Document review" value={overview?.metrics?.documents_needing_review}/><Metric label="Active creators" value={overview?.metrics?.active_creators}/></div>
    <div className="creator-layout">
      <section><span className="eyebrow">APPLICATIONS</span>{apps.length ? apps.map(app => <button className="creator-row" key={app.id} onClick={() => open(app)}><b>{app.full_name}</b><span>{app.country} · {app.status}</span><small>{app.campaign_id ? `Campaign: ${app.campaign_id}` : 'No campaign attribution'}</small></button>) : <Empty title="No self-hosted applications" body="New applications will appear here when submitted through the existing recruiting intake."/>}</section>
      <section><span className="eyebrow">CREATOR RECORDS</span>{creators.length ? creators.map(creator => <button className="creator-row" key={creator.id} onClick={() => openCreator(creator)}><b>{creator.full_name}</b><span>{creator.lifecycle} · {creator.performer_count} performer links</span><small>{creator.onboarding_open} onboarding requirements open</small></button>) : <Empty title="No creator records yet" body="Approved applications can be converted without creating duplicate catalogue performers."/>}</section>
    </div>
    {selected && detail && <aside className="detail creator-detail"><button onClick={() => setSelected(null)}>Close</button><span className="eyebrow">APPLICATION REVIEW</span><h2>{detail.application.full_name}</h2><p>{detail.application.country} · {detail.application.status}</p><p className="muted">Campaign: {detail.application.answers?.recruitment_campaign_id || 'No attribution recorded'}</p><h3>Private application documents</h3>{detail.documents.length ? detail.documents.map(doc => <article className="document" key={doc.upload_id}><b>{doc.file_name}</b><span>{doc.review_state} · {doc.classification}</span></article>) : <p className="muted">No confirmed private uploads are available.</p>}<h3>Performer linkage</h3><p className="muted">{detail.performers.length ? detail.performers.map(p => p.display_name).join(', ') : 'No catalogue performer linked.'}</p><div className="actions"><button onClick={() => update('under_review')}>Start review</button><button onClick={() => update('needs_information')}>Needs information</button><button onClick={() => update('approved')}>Approve</button><button onClick={() => update('rejected')}>Reject</button>{isAdmin && <button className="primary" onClick={convert}>Create creator record</button>}</div>{isAdmin && detail.application.status === 'approved' && <><label>Link existing performer<select value={linkId} onChange={e => setLinkId(e.target.value)}><option value="">Select performer</option>{performers.map(p => <option value={p.legacy_id} key={p.legacy_id}>{p.display_name}</option>)}</select></label><div className="actions"><button disabled={!linkId} onClick={() => linkApplicationPerformer(false)}>Link performer</button></div><label>Create draft performer<input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Public performer name"/></label><div className="actions"><button disabled={!newName.trim()} onClick={() => linkApplicationPerformer(true)}>Create and link</button></div></>}</aside>}
    {creatorDetail && <aside className="detail creator-detail"><button onClick={() => setCreatorDetail(null)}>Close</button><span className="eyebrow">CREATOR RECORD</span><h2>{creatorDetail.creator.full_name}</h2><p>{creatorDetail.creator.lifecycle} · {creatorDetail.creator.country}</p>
      <section className="onboarding-card"><h3>1. Creator / Performer Login</h3><p><b>Creator:</b> {creatorDetail.creator.full_name}</p><p><b>Public performer:</b> {creatorDetail.performers[0]?.display_name || 'Not linked'}</p><p><b>Account status:</b> {creatorDetail.account ? String(creatorDetail.account.account_status || 'active').toUpperCase() : 'NOT CREATED'}</p>{creatorDetail.account ? <><p><b>Username:</b> {creatorDetail.account.username || 'Not set'}</p><p><b>Password status:</b> {String(creatorDetail.account.password_status || (creatorDetail.account.must_change_password ? 'temporary' : 'changed')).toUpperCase()}</p><p><b>Last login:</b> {creatorDetail.account.last_login_at ? new Date(creatorDetail.account.last_login_at).toLocaleString() : 'Never'}</p><p><b>Portal URL:</b> <code>{creatorDetail.account.login_url}</code></p><div className="actions"><button type="button" onClick={copyLoginUrl}>COPY LOGIN URL</button><button type="button" onClick={resetLoginPassword}>RESET PASSWORD</button>{creatorDetail.account.account_status === 'disabled' ? <button type="button" onClick={() => setLoginState('active')}>REACTIVATE ACCOUNT</button> : <button type="button" onClick={() => setLoginState('disabled')}>DISABLE ACCOUNT</button>}</div></> : <><label>Username<input value={loginUsername} onChange={e => setLoginUsername(e.target.value)} placeholder="elias.santos" autoComplete="off" /></label><button type="button" className="primary" onClick={createLogin}>CREATE LOGIN</button></>}<label>{creatorDetail.account ? 'New temporary password' : 'Temporary password'}<input type="password" value={temporaryPassword} onChange={e => setTemporaryPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} /></label>{temporaryPassword.length > 0 && temporaryPassword.length < 8 && <p className="muted">Temporary password must contain at least 8 characters.</p>}<button type="button" onClick={copyTemporaryPassword} disabled={!temporaryPassword}>COPY TEMPORARY PASSWORD</button>{credentialMessage && <p className="muted">{credentialMessage}</p>}<p className="muted">Passwords are hashed server-side, never returned by the API, and never written to audit logs.</p></section>
      <section className="onboarding-card"><h3>2. Performer Identity</h3><p><b>Legal / Creator name:</b> {creatorDetail.creator.full_name}</p>{creatorDetail.performers.length ? creatorDetail.performers.map(item => <article className="document" key={item.performer_legacy_id}><p><b>Performer name:</b> {item.display_name}</p><p><b>Performer ID:</b> {item.performer_legacy_id}</p><a className="report-button" href={`/admin?section=Performers&performerId=${encodeURIComponent(item.performer_legacy_id)}`} target="_blank" rel="noreferrer">OPEN PERFORMER PROFILE ↗</a></article>) : <p className="muted">No public performer persona linked.</p>}{isAdmin && <><label>Create performer<input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Public performer name"/></label><button disabled={!newName.trim()} onClick={createPerformer}>CREATE PERFORMER</button><label>Link existing performer<select value={linkId} onChange={e => setLinkId(e.target.value)}><option value="">Select performer</option>{performers.map(p => <option value={p.legacy_id} key={p.legacy_id}>{p.display_name}</option>)}</select></label><button disabled={!linkId} onClick={linkPerformer}>LINK EXISTING PERFORMER</button></>}</section>
      <section className="onboarding-card"><h3>3. Identity Verification</h3><p><b>Country:</b> {creatorDetail.identity?.country || creatorDetail.creator.country || '—'}</p><p><b>Date of birth:</b> {creatorDetail.identity?.date_of_birth || 'Not recorded'}</p><p><b>Age verified:</b> {creatorDetail.identity?.age_verified ? 'Yes' : 'No'}</p><p><b>Verification status:</b> {creatorDetail.identity?.status || 'not_started'}</p>{creatorDetail.identity?.documents?.map(doc => <article className="document" key={doc.id}><b>{doc.document_type}</b><span>{doc.status} · v{doc.document_version}</span>{doc.status === 'uploaded' && <button onClick={() => viewIdentity(doc.id)}>Review private document</button>}</article>)}{isAdmin && <><div className="button-row"><select value={identityType} onChange={e => setIdentityType(e.target.value)}><option value="id_front">Government ID / front</option><option value="id_back">Government ID / back</option><option value="verification_selfie">Selfie / ID verification</option></select><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setIdentityFile(e.target.files?.[0] || null)}/><button disabled={!identityFile} onClick={uploadIdentity}>UPLOAD DOCUMENT</button></div><div className="actions"><button onClick={() => reviewIdentity('under_review')}>REVIEW</button><button onClick={() => reviewIdentity('approved')}>VERIFY</button><button onClick={() => reviewIdentity('rejected')}>REJECT</button><button onClick={() => reviewIdentity('resubmission_required')}>REQUEST REPLACEMENT</button></div></>}</section>
      <section className="onboarding-card"><h3>4. Contract</h3>{creatorDetail.contracts.length ? creatorDetail.contracts.map(contract => <article className="document" key={contract.id}><b>{contract.title || contract.contract_number}</b><span>{contract.status} · {contract.template_version || 'legacy'}</span><small>{contract.creator_legal_name} · {contract.performer_name}</small></article>) : <p className="muted">Not created</p>}<button className="primary" disabled={!isAdmin} onClick={openContract}>CREATE CONTRACT</button><p className="muted">The existing Contract Center preserves Creator ID, performer identity, template version and rendered snapshot. Signature sending remains unavailable until the legal gate is enabled.</p></section>
      <section className="onboarding-card"><h3>5. Media Library</h3><p className="muted">Performer photos and submitted videos are linked here automatically. Admin can open the full original, approve/reject it, and publish an approved profile picture only after a signed contract.</p>{creatorDetail.media?.length ? creatorDetail.media.map(asset => <article className="document" key={asset.id}><b>{asset.file_name || asset.asset_type}</b><span>{asset.asset_type} · {asset.usage} · {asset.review_status || 'approved'} · {asset.visibility} · {asset.processing_state}</span><small>{asset.performer_name || 'Creator-owned'} · {asset.id}</small><div className="actions">{asset.upload_status === 'uploaded' && <button onClick={() => viewMedia(asset.id)}>VIEW FULL {String(asset.mime_type || '').startsWith('video/') ? 'VIDEO' : 'IMAGE'}</button>}{isAdmin && asset.upload_status === 'uploaded' && asset.review_status !== 'approved' && <button className="save" onClick={() => reviewMedia(asset.id, 'approved')}>APPROVE MEDIA</button>}{isAdmin && asset.review_status === 'approved' && <button onClick={() => reviewMedia(asset.id, 'rejected')}>REJECT MEDIA</button>}{isAdmin && asset.review_status === 'approved' && String(asset.mime_type || '').startsWith('image/') && <button className="primary" onClick={() => publishProfileMedia(asset.id)}>PUBLISH PROFILE PHOTO</button>}</div></article>) : <p className="muted">No media assets yet.</p>}{isAdmin && <><div className="button-row"><select value={mediaUsage} onChange={e => setMediaUsage(e.target.value)}><option value="profile">PROFILE</option><option value="cover">COVER</option><option value="gallery">GALLERY</option><option value="promo">PROMO</option><option value="source_video">SOURCE VIDEO</option><option value="preview_trailer">PREVIEW / TRAILER</option><option value="full_video">FULL VIDEO</option></select><select value={mediaType} onChange={e => setMediaType(e.target.value)}><option value="thumbnail">Image</option><option value="poster">Poster</option><option value="trailer">Trailer</option><option value="source">Video source</option></select><input type="file" accept={mediaType === 'source' || mediaType === 'trailer' ? 'video/mp4,video/quicktime,video/webm' : 'image/jpeg,image/png,image/webp'} onChange={e => setMediaFile(e.target.files?.[0] || null)}/><button disabled={!mediaFile} onClick={uploadMedia}>UPLOAD MEDIA</button></div><p className="muted">New media stays private and pending review until an administrator approves it.</p></>}</section>
      <section className="onboarding-card"><h3>6. Video / Catalogue</h3>{creatorDetail.videos.length ? creatorDetail.videos.map(video => <article className="document" key={video.legacy_id}><b>{video.title}</b><span>{video.v3_lifecycle} · {video.legacy_id}</span></article>) : <p className="muted">No catalogue videos yet.</p>}{isAdmin && <><label>Link existing video<select value={videoId} onChange={e => setVideoId(e.target.value)}><option value="">Select catalogue video</option>{catalogueVideos.map(video => <option value={video.legacy_id} key={video.legacy_id}>{video.title}</option>)}</select></label><button disabled={!videoId} onClick={() => linkVideo(false)}>LINK EXISTING VIDEO</button><label>Create draft video<input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Public title"/></label><button disabled={!videoTitle.trim()} onClick={() => linkVideo(true)}>CREATE VIDEO</button></>}</section>
      <h3>Onboarding controls</h3>{creatorDetail.onboarding.map(item => <article className="document" key={item.id}><b>{item.requirement_key.replaceAll('_', ' ')}</b><span>{item.state}</span><div className="actions"><button onClick={() => changeItem(item, 'needs_review')}>Needs review</button><button onClick={() => changeItem(item, 'complete')}>Complete</button><button onClick={() => changeItem(item, 'blocked')}>Blocked</button></div></article>)}<h3>Application documents</h3>{creatorDetail.documents.length ? creatorDetail.documents.map(doc => <article className="document" key={doc.id}><b>{doc.file_name}</b><span>{doc.review_state}</span><div className="actions"><button onClick={() => reviewDocument(doc, 'accepted')}>Accept</button><button onClick={() => reviewDocument(doc, 'rejected')}>Reject</button></div></article>) : <p className="muted">No confirmed documents are linked.</p>}<pre>{JSON.stringify(creatorDetail.history, null, 2)}</pre>
    </aside>}
  </section>;
}
