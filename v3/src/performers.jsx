import React, { useEffect, useMemo, useState } from 'react';

const emptyForm = {
  display_name: '', slug: '', nationality: '', date_of_birth: '', bio: '', operational_status: 'active',
  public_visibility: false, featured: false, verified: false, internal_admin_notes: '', availability_notes: '',
  profile_media_asset_id: '', cover_media_asset_id: '', label_ids: []
};
const tabs = ['Overview', 'Profile', 'Account', 'Compliance', 'Media', 'Videos', 'Contracts', 'Production', 'Earnings'];
const title = value => String(value || '').replaceAll('_', ' ');

function formFromDetail(detail) {
  return {
    ...emptyForm,
    ...detail.performer,
    label_ids: (detail.performer.labels || []).map(label => label.id),
    date_of_birth: detail.performer.date_of_birth || '',
    profile_media_asset_id: detail.performer.profile_media_asset_id || '',
    cover_media_asset_id: detail.performer.cover_media_asset_id || ''
  };
}

export function PerformerOperations({ apiV3 }) {
  const [data, setData] = useState({ records: [], pages: 1, page: 1 });
  const [labelOptions, setLabelOptions] = useState([]);
  const [filters, setFilters] = useState({ q: '', operational_status: '', verified: '', featured: '', public_visibility: '', account_link: '', label: '' });
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [form, setForm] = useState(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (page = 1) => {
    try {
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '24', ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')) });
      setData(await apiV3(`/admin/performers?${params}`));
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { load(); }, [filters.q, filters.operational_status, filters.verified, filters.featured, filters.public_visibility, filters.account_link, filters.label]);
  useEffect(() => { apiV3('/admin/catalogue/brands?limit=100&status=active').then(result => setLabelOptions(result.records || [])).catch(() => {}); }, []);
  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const index = parts.indexOf('performers');
    const query = new URLSearchParams(window.location.search);
    const queryId = query.get('performerId');
    const queryTab = query.get('performerTab') || 'overview';
    if (index >= 0 && parts[index + 1]) open(parts[index + 1], parts[index + 2]);
    else if (queryId) open(queryId, queryTab);
  }, []);

  const open = async (id, requestedTab = 'overview') => {
    try {
      setError('');
      const detail = await apiV3(`/admin/performers/${id}`);
      setSelected(detail);
      setTab(tabs.find(item => item.toLowerCase() === String(requestedTab).toLowerCase()) || 'Overview');
      setForm(formFromDetail(detail));
    } catch (err) { setError(err.message); }
  };

  const refresh = () => selected && open(selected.performer.legacy_id, tab.toLowerCase());
  const route = nextTab => {
    if (!selected) return;
    const segment = nextTab.toLowerCase().replaceAll(' ', '-');
    const url = new URL(window.location.href);
    url.pathname = '/admin';
    url.searchParams.set('section', 'Performers');
    url.searchParams.set('performerId', selected.performer.legacy_id);
    url.searchParams.set('performerTab', segment);
    window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
    setTab(nextTab);
  };

  const save = async event => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const { label_ids, ...profile } = form;
      await apiV3(`/admin/performers/${selected.performer.legacy_id}`, { method: 'PATCH', body: JSON.stringify({ ...profile, profile_media_asset_id: form.profile_media_asset_id || null, cover_media_asset_id: form.cover_media_asset_id || null }) });
      await apiV3(`/admin/performers/${selected.performer.legacy_id}/labels`, { method: 'PUT', body: JSON.stringify({ brand_ids: label_ids || [] }) });
      await load(data.page);
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const create = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      const { label_ids, ...profile } = form;
      let detail = await apiV3('/admin/performers', { method: 'POST', body: JSON.stringify({ ...profile, profile_media_asset_id: form.profile_media_asset_id || null, cover_media_asset_id: form.cover_media_asset_id || null }) });
      if (label_ids?.length) detail = await apiV3(`/admin/performers/${detail.performer.legacy_id}/labels`, { method: 'PUT', body: JSON.stringify({ brand_ids: label_ids }) });
      setCreateOpen(false);
      await load();
      await open(detail.performer.legacy_id, 'account');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const status = selected?.performer;
  const listFilters = useMemo(() => ([
    ['operational_status', 'Operational state', ['', 'active', 'inactive', 'archived']],
    ['verified', 'Verified', ['', 'true', 'false']],
    ['featured', 'Featured', ['', 'true', 'false']],
    ['public_visibility', 'Visibility', ['', 'true', 'false']],
    ['account_link', 'Account link', ['', 'linked', 'unlinked']]
  ]), []);

  const labelField = <fieldset className="performer-label-fieldset wide"><legend>Public label affiliation</legend>{labelOptions.length ? labelOptions.map(label => <label key={label.legacy_id} className="performer-check"><input type="checkbox" checked={(form.label_ids || []).includes(label.legacy_id)} onChange={event => setForm({ ...form, label_ids: event.target.checked ? [...(form.label_ids || []), label.legacy_id] : (form.label_ids || []).filter(id => id !== label.legacy_id) })} /> {label.name}</label>) : <small>No active labels available.</small>}</fieldset>;
  const fields = <>
    <label>Display name<input value={form.display_name || ''} onChange={event => setForm({ ...form, display_name: event.target.value })} required /></label>
    <label>Slug<input value={form.slug || ''} onChange={event => setForm({ ...form, slug: event.target.value })} required /></label>
    <label>Nationality<input value={form.nationality || ''} onChange={event => setForm({ ...form, nationality: event.target.value })} /></label>
    <label>Date of birth<input type="date" value={form.date_of_birth || ''} onChange={event => setForm({ ...form, date_of_birth: event.target.value })} /></label>
    <label>Operational status<select value={form.operational_status || 'active'} onChange={event => setForm({ ...form, operational_status: event.target.value })}><option>active</option><option>inactive</option><option>archived</option></select></label>
    <label className="performer-check"><input type="checkbox" checked={Boolean(form.public_visibility)} onChange={event => setForm({ ...form, public_visibility: event.target.checked })} /> Public catalogue visibility</label>
    <label className="performer-check"><input type="checkbox" checked={Boolean(form.featured)} onChange={event => setForm({ ...form, featured: event.target.checked })} /> Featured</label>
    <label className="performer-check"><input type="checkbox" checked={Boolean(form.verified)} onChange={event => setForm({ ...form, verified: event.target.checked })} /> Verified</label>
    <label className="wide">Bio<textarea value={form.bio || ''} onChange={event => setForm({ ...form, bio: event.target.value })} /></label>
    <label className="wide">Availability<input value={form.availability_notes || ''} onChange={event => setForm({ ...form, availability_notes: event.target.value })} /></label>
    <label className="wide">Internal admin notes<textarea value={form.internal_admin_notes || ''} onChange={event => setForm({ ...form, internal_admin_notes: event.target.value })} /></label>
    <label>Profile media asset ID<input value={form.profile_media_asset_id || ''} onChange={event => setForm({ ...form, profile_media_asset_id: event.target.value })} /></label>
    <label>Cover media asset ID<input value={form.cover_media_asset_id || ''} onChange={event => setForm({ ...form, cover_media_asset_id: event.target.value })} /></label>
    {labelField}
  </>;

  return <section className="performer-operations">
    <div className="catalogue-head"><div><span className="eyebrow">PERFORMER OPERATIONS</span><h2>Talent, operated separately.</h2><p>Create a canonical performer first, then prepare the private workspace that powers contracts, videos and the linked Performer Portal.</p></div><button className="save" onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>New performer</button></div>
    {error && <p className="error">{error}</p>}
    <div className="performer-toolbar"><input placeholder="Search performers" value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} />{listFilters.map(([key, label, options]) => <label key={key}><span>{label}</span><select value={filters[key]} onChange={event => setFilters({ ...filters, [key]: event.target.value })}>{options.map(option => <option key={option} value={option}>{option || 'All'}</option>)}</select></label>)}<label><span>Label</span><select value={filters.label} onChange={event => setFilters({ ...filters, label: event.target.value })}><option value="">All</option>{labelOptions.map(label => <option key={label.legacy_id} value={label.legacy_id}>{label.name}</option>)}</select></label></div>
    <div className="performer-layout">
      <div className="performer-list">{data.records.map(item => <button key={item.legacy_id} className={`performer-row ${status?.legacy_id === item.legacy_id ? 'active' : ''}`} onClick={() => open(item.legacy_id)}><div>{item.profile_image_url ? <img src={item.profile_image_url} alt="" /> : <span className="performer-avatar">{item.display_name?.slice(0, 1)}</span>}<b>{item.display_name}</b></div><span>{title(item.operational_status)} · {item.public_visibility ? 'public' : 'private'}</span><small>{item.labels?.length ? item.labels.map(label => label.name).join(' · ') : 'no labels'} · {item.verified ? 'verified · ' : ''}{item.featured ? 'featured · ' : ''}{item.has_creator_link ? 'creator linked' : 'no creator'} · {item.has_user_link ? 'account linked' : 'no account'} · KYC {title(item.kyc_status)}</small></button>)}{!data.records.length && <p className="system-muted">No performers match these filters.</p>}<div className="pagination"><button disabled={data.page <= 1} onClick={() => load(data.page - 1)}>Previous</button><span>Page {data.page} of {data.pages}</span><button disabled={data.page >= data.pages} onClick={() => load(data.page + 1)}>Next</button></div></div>
      {selected && <div className="performer-detail"><div className="performer-detail-head"><div><span className="eyebrow">{status.legacy_id}</span><h2>{status.display_name}</h2><p>{status.operational_status} · catalogue {status.status}/{status.v3_lifecycle} · {status.public_visibility ? 'public' : 'private'}</p></div><button onClick={() => { setSelected(null); window.history.replaceState({}, '', '/admin?section=Performers'); }}>Close</button></div><nav className="system-tabs">{tabs.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => route(item)}>{item}</button>)}</nav>
        {tab === 'Overview' && <><div className="metric-grid domain-metrics"><Metric label="Linked videos" value={selected.videos.length}/><Metric label="Productions" value={selected.productions.length}/><Metric label="Contracts" value={selected.contracts.length}/><Metric label="Creator links" value={status.creators?.length || 0}/></div><section className="readiness-panel"><b>Label affiliation</b><p>{status.labels?.length ? status.labels.map(label => label.name).join(' · ') : 'No public label affiliation assigned.'}</p></section><section className="readiness-panel"><b>Workspace readiness</b><p>{status.creators?.length ? 'Private workspace exists. Account, compliance and contract state remain separate.' : 'Standalone catalogue identity only. Prepare a private workspace to make address, contracts and portal data available to the performer.'}</p></section><section className="readiness-panel"><span className="eyebrow">AUDIT HISTORY</span>{selected.audit.map(item => <div className="ops-row" key={item.id}><b>{item.action}</b><span>{new Date(item.created_at).toLocaleString()}</span></div>)}</section></>}
        {tab === 'Profile' && <><section className="performer-admin-profile-image">{status.profile_image_url ? <img src={status.profile_image_url} alt={`${status.display_name} profile`} /> : <span className="performer-avatar">{status.display_name?.slice(0, 1)}</span>}<div><span className="eyebrow">CURRENT PROFILE IMAGE</span><b>{status.profile_media_asset_id ? 'Canonical V3 profile image' : 'No approved profile image'}</b></div></section><form className="performer-form" onSubmit={save}>{fields}<button className="save" disabled={busy}>{busy ? 'Saving…' : 'Save audited profile'}</button></form></>}
        {tab === 'Account' && <AccountPanel apiV3={apiV3} status={status} performerId={status.legacy_id} onUpdated={refresh}/>}
        {tab === 'Compliance' && <section className="readiness-panel"><h3>Compliance projection</h3><p>KYC status: <b>{title(status.kyc_status)}</b></p><p>Full identity-document review remains in Creator Submissions. This performer workspace exposes relationship state only and never private files.</p></section>}
        {tab === 'Media' && <MediaPanel apiV3={apiV3} creator={status.creators?.[0]} onUpdated={refresh}/>}
        {tab === 'Videos' && <VideoPanel apiV3={apiV3} performerId={status.legacy_id} records={selected.videos} onUpdated={refresh}/>}
        {tab === 'Contracts' && <ContractPanel performerId={status.legacy_id} creators={status.creators} records={selected.contracts}/>}
        {tab === 'Production' && <><Records title="Production participation" records={selected.productions} empty="No production participation is recorded." render={item => `${item.title} · ${item.status}`} /><p className="performer-admin-link"><a href="/admin?section=Production">Open Production workspace →</a> Assignments made there are visible in the linked Performer Portal.</p></>}
        {tab === 'Earnings' && <Records title="Immutable earnings ledger" records={selected.earnings} empty="No observed earnings records." render={item => `${item.event_type} · ${item.original_currency} ${Number(item.performer_amount_minor || 0) / 100}`} />}
      </div>}
    </div>
    {createOpen && <aside className="detail performer-create"><button onClick={() => setCreateOpen(false)}>Close</button><span className="eyebrow">NEW PERFORMER</span><h2>Create a standalone talent identity.</h2><p>This first step creates the canonical catalogue performer. Address, account access and contracts are private workspace steps in Account, so no private data is placed in the public performer record.</p><form className="performer-form" onSubmit={create}>{fields}<button className="save" disabled={busy}>{busy ? 'Creating…' : 'Create performer'}</button></form></aside>}
  </section>;
}

function AccountPanel({ apiV3, status, performerId, onUpdated }) {
  const creator = status.creators?.[0] || null;
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [creatorSearch, setCreatorSearch] = useState('');
  const [creators, setCreators] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [workspace, setWorkspace] = useState(() => workspaceFrom(creator, status));
  const [accountId, setAccountId] = useState('');
  const [username, setUsername] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  useEffect(() => setWorkspace(workspaceFrom(creator, status)), [creator?.id, status.display_name]);
  useEffect(() => {
    if (creator?.id && !username) setUsername(usernameSuggestion(status.display_name));
  }, [creator?.id, status.display_name]);
  const searchCreators = async () => { try { setCreators((await apiV3(`/admin/creators?limit=50&q=${encodeURIComponent(creatorSearch)}`)).records || []); } catch (error) { setMessage(error.message); } };
  const searchAccounts = async () => { try { setAccounts((await apiV3('/admin/performer-account-options?q=')).records || []); } catch (error) { setMessage(error.message); } };
  useEffect(() => { if (!creator) { searchCreators(); searchAccounts(); } }, []);
  const mutate = async (path, method, body) => {
    setBusy(true);
    setMessage('');
    try {
      await apiV3(path, { method, body: JSON.stringify(body) });
      setMessage('Saved.');
      await onUpdated();
      return true;
    } catch (error) {
      // Keep the error visible and, importantly, let credential actions retain
      // the value the admin entered so a failed save cannot silently discard it.
      setMessage(error.message || 'The account change could not be saved.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const linkedUser = status.users?.[0] || null;
  const createLogin = async () => {
    if (!creator) { setMessage('No linked Creator workspace is available for this performer.'); return; }
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) { setMessage('Enter a username before creating the login.'); return; }
    if (temporaryPassword.length < 8) { setMessage('Temporary password must contain at least 8 characters.'); return; }
    if (await mutate(`/admin/creators/records/${creator.id}/account`, 'POST', { username: normalizedUsername, temporary_password: temporaryPassword })) setTemporaryPassword('');
  };
  const resetLogin = async () => {
    if (!creator) { setMessage('No linked Creator workspace is available for this performer.'); return; }
    if (await mutate(`/admin/creators/records/${creator.id}/account/password-reset`, 'POST', { temporary_password: temporaryPassword })) setTemporaryPassword('');
  };
  const copyLoginUrl = async () => { await navigator.clipboard?.writeText('https://performer.fleshlab.online/creator/login'); setMessage('Creator Portal login URL copied.'); };
  return <section className="performer-account-panel">
    <div className="readiness-panel"><span className="eyebrow">PRIVATE WORKSPACE</span><h3>{creator ? 'Creator workspace linked' : 'No private workspace yet'}</h3><p>{creator ? 'Private identity data stays in the Creator domain. The linked Performer Portal reads the same records after account and compliance requirements are complete.' : 'The catalogue performer can exist without a Creator or user. Prepare the private workspace when you are ready to manage address, contracts and portal access.'}</p></div>
    {!creator ? <>
      <form className="performer-form performer-private-form" onSubmit={event => { event.preventDefault(); mutate(`/admin/performers/${performerId}/workspace`, 'POST', workspace); }}><h3 className="wide">Prepare private performer workspace</h3><label>Legal / account name<input value={workspace.full_name} onChange={event => setWorkspace({ ...workspace, full_name: event.target.value })} required /></label><label>Private email<input type="email" value={workspace.email} onChange={event => setWorkspace({ ...workspace, email: event.target.value })} required /></label><label>Country<input value={workspace.country} onChange={event => setWorkspace({ ...workspace, country: event.target.value })} required /></label><label>Contact phone<input value={workspace.contact_phone} onChange={event => setWorkspace({ ...workspace, contact_phone: event.target.value })} /></label><AddressFields value={workspace.address} onChange={address => setWorkspace({ ...workspace, address })}/><button className="save wide" disabled={busy}>{busy ? 'Preparing…' : 'Prepare private workspace'}</button></form>
      <div className="readiness-panel"><h3>Link an existing Creator instead</h3><p>Use this only when the Creator record is already canonical. It does not duplicate the performer.</p><div className="performer-inline-tools"><input placeholder="Search Creator" value={creatorSearch} onChange={event => setCreatorSearch(event.target.value)} /><button onClick={searchCreators}>Search</button></div>{creators.map(item => <button className="creator-choice" key={item.id} onClick={() => mutate(`/admin/performers/${performerId}/creator-link`, 'POST', { creator_id: item.id })}><b>{item.full_name}</b><span>{item.email} · {item.lifecycle} · {item.performer_count || 0} performer link(s)</span></button>)}</div>
    </> : <>
      <form className="performer-form performer-private-form" onSubmit={event => { event.preventDefault(); mutate(`/admin/performers/${performerId}/workspace`, 'PATCH', workspace); }}><h3 className="wide">Private identity and contact</h3><p className="wide private-data-note">Admin-only data. It is not returned by public performer APIs.</p><label>Legal / account name<input value={workspace.full_name} onChange={event => setWorkspace({ ...workspace, full_name: event.target.value })} required /></label><label>Private email<input type="email" value={workspace.email} onChange={event => setWorkspace({ ...workspace, email: event.target.value })} required /></label><label>Country<input value={workspace.country} onChange={event => setWorkspace({ ...workspace, country: event.target.value })} required /></label><label>Contact phone<input value={workspace.contact_phone} onChange={event => setWorkspace({ ...workspace, contact_phone: event.target.value })} /></label><AddressFields value={workspace.address} onChange={address => setWorkspace({ ...workspace, address })}/><button className="save wide" disabled={busy}>{busy ? 'Saving…' : 'Save private identity'}</button></form>
      <section className="readiness-panel"><span className="eyebrow">PORTAL ACCESS</span><h3>{creator.lifecycle} · {linkedUser ? 'login provisioned' : 'login not created'}</h3><p>Legal identity and public performer identity remain separate. Login access is controlled here; compliance, contracts and publication are separate gates.</p>{linkedUser ? <><div className="ops-row"><b>Username: {linkedUser.username || 'not set'}</b><span>ACCOUNT {String(linkedUser.account_status || 'unknown').toUpperCase()} · PASSWORD {String(linkedUser.password_status || 'changed').toUpperCase()}</span></div><div className="ops-row"><b>Last login</b><span>{linkedUser.last_login_at ? new Date(linkedUser.last_login_at).toLocaleString() : 'Never'}</span></div><label>New temporary password<input type="password" value={temporaryPassword} onChange={event => setTemporaryPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} /></label>{temporaryPassword.length > 0 && temporaryPassword.length < 8 && <p className="performer-note">Temporary password must contain at least 8 characters.</p>}<div className="performer-inline-tools"><button type="button" onClick={copyLoginUrl}>COPY LOGIN URL</button><button type="button" onClick={resetLogin}>RESET PASSWORD</button><button type="button" disabled={busy} onClick={() => mutate(`/admin/creators/records/${creator.id}/account`, 'PATCH', { status: linkedUser.account_status === 'disabled' ? 'active' : 'disabled' })}>{linkedUser.account_status === 'disabled' ? 'REACTIVATE ACCOUNT' : 'DISABLE ACCOUNT'}</button></div></> : <div className="performer-form performer-private-form"><label>Username<input value={username} onChange={event => setUsername(event.target.value)} placeholder="elias.santos" autoComplete="off" /></label><label>Temporary password<input type="password" value={temporaryPassword} onChange={event => setTemporaryPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} /></label>{temporaryPassword.length > 0 && temporaryPassword.length < 8 && <p className="performer-note">Temporary password must contain at least 8 characters.</p>}<div className="performer-inline-tools"><button type="button" onClick={createLogin}>CREATE LOGIN</button><button type="button" disabled={!temporaryPassword} onClick={async () => { await navigator.clipboard?.writeText(temporaryPassword); setMessage('Temporary password copied.'); }}>COPY TEMPORARY PASSWORD</button></div></div>}<div className="performer-inline-tools"><select value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Select existing active account to link</option>{accounts.map(account => <option value={account.id} key={account.id}>{account.email} · {account.account_status}</option>)}</select><button type="button" disabled={!accountId || busy} onClick={() => mutate(`/admin/performers/${performerId}/account-link`, 'POST', { user_id: accountId })}>Link account</button></div></section>
    </>}
    {message && <p className="performer-note">{message}</p>}
  </section>;
}

function workspaceFrom(creator, status) {
  const privateProfile = creator?.private_profile || {};
  return { full_name: creator?.full_name || status.display_name || '', email: creator?.email || '', country: creator?.country || status.nationality || '', contact_phone: creator?.contact_phone || '', address: privateProfile.address || {} };
}

function usernameSuggestion(displayName) {
  const words = String(displayName || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+/g) || [];
  return words.slice(0, 2).join('.');
}

function AddressFields({ value = {}, onChange }) {
  const update = (key, next) => onChange({ ...value, [key]: next });
  return <fieldset className="performer-address-fieldset wide"><legend>Private address</legend><label>Address line 1<input value={value.line1 || ''} onChange={event => update('line1', event.target.value)} /></label><label>Address line 2<input value={value.line2 || ''} onChange={event => update('line2', event.target.value)} /></label><label>Postal code<input value={value.postal_code || ''} onChange={event => update('postal_code', event.target.value)} /></label><label>City<input value={value.city || ''} onChange={event => update('city', event.target.value)} /></label><label>Region<input value={value.region || ''} onChange={event => update('region', event.target.value)} /></label><label>Country<input value={value.country || ''} onChange={event => update('country', event.target.value)} /></label></fieldset>;
}

function MediaPanel({ apiV3, creator, onUpdated }) {
  const [media, setMedia] = useState([]);
  const [previews, setPreviews] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const load = async () => {
    if (!creator?.id) { setMedia([]); setPreviews({}); return; }
    try {
      setMessage('');
      const detail = await apiV3(`/admin/creators/records/${creator.id}`);
      const assets = detail.media || [];
      setMedia(assets);
      const previewAssets = assets.filter(asset => asset.upload_status === 'uploaded' && /^(image|video)\//.test(asset.mime_type || ''));
      const issued = await Promise.all(previewAssets.map(async asset => {
        try {
          const result = await apiV3(`/admin/creators/records/${creator.id}/media/${asset.id}/view`, { method: 'POST', body: '{}' });
          return [asset.id, result.view_url];
        } catch { return null; }
      }));
      setPreviews(Object.fromEntries(issued.filter(Boolean)));
    } catch (error) { setMessage(error.message); }
  };
  useEffect(() => { load(); }, [creator?.id]);
  const act = async (asset, action) => {
    if (!creator?.id) return;
    setBusy(`${asset.id}:${action}`);
    setMessage('');
    try {
      if (action === 'view') {
        const result = await apiV3(`/admin/creators/records/${creator.id}/media/${asset.id}/view`, { method: 'POST', body: '{}' });
        window.open(result.view_url, '_blank', 'noopener');
      } else if (action === 'publish-profile' || action === 'approve-profile') {
        await apiV3(`/admin/creators/records/${creator.id}/media/${asset.id}/publish-profile`, { method: 'POST', body: JSON.stringify({ approve: action === 'approve-profile' }) });
        setMessage('Profile image set. It remains private until the contract is signed.');
        await onUpdated();
      } else {
        await apiV3(`/admin/creators/records/${creator.id}/media/${asset.id}`, { method: 'PATCH', body: JSON.stringify({ review_status: action }) });
        setMessage(action === 'approved' ? 'Media approved and kept private.' : 'Media rejected.');
      }
      await load();
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  };
  if (!creator) return <section className="readiness-panel"><h3>Private workspace required</h3><p>There is no linked Creator workspace from which private performer uploads can be reviewed.</p></section>;
  return <section className="performer-media-panel"><section className="readiness-panel"><span className="eyebrow">PRIVATE MEDIA REVIEW</span><h3>Performer uploads</h3><p>Photos and source videos uploaded in the Performer Portal appear below as private previews. View access is short-lived and audited. Approval alone never makes media public.</p></section><section className="system-table"><div className="performer-media-head"><h3>{media.length} uploaded asset{media.length === 1 ? '' : 's'}</h3><button onClick={load}>Refresh previews</button></div>{media.length ? media.map(asset => { const preview = previews[asset.id]; const isImage = (asset.mime_type || '').startsWith('image/'); const isVideo = (asset.mime_type || '').startsWith('video/'); const profileCandidate = asset.usage === 'profile' && isImage; return <article className="performer-media-row" key={asset.id}>{preview && isImage && <div className="performer-media-preview image"><img src={preview} alt={`Private ${title(asset.usage)} upload`} /></div>}{preview && isVideo && <div className="performer-media-preview video"><video controls preload="none" src={preview}>Your browser cannot play this private video preview.</video></div>}<div className="performer-media-details"><b>{asset.file_name || asset.asset_type}</b><small>{asset.performer_name || 'Linked performer'} · {profileCandidate ? 'Profile picture' : title(asset.usage)} · {asset.mime_type || asset.asset_type} · {title(asset.upload_status)} / {title(asset.processing_state)} · {title(asset.review_status)} · {title(asset.visibility)}</small>{(isImage || isVideo) && !preview && <small>Private preview unavailable. Refresh previews to issue a new secure link.</small>}</div><div className="performer-media-actions"><button disabled={Boolean(busy)} onClick={() => act(asset, 'view')}>{busy === `${asset.id}:view` ? 'Opening…' : 'Open full size'}</button>{profileCandidate && asset.review_status !== 'approved' && <button className="save" disabled={Boolean(busy) || asset.upload_status !== 'uploaded'} onClick={() => act(asset, 'approve-profile')}>Approve and set as profile</button>}{!profileCandidate && asset.review_status !== 'approved' && <button className="save" disabled={Boolean(busy) || asset.upload_status !== 'uploaded'} onClick={() => act(asset, 'approved')}>Approve</button>}{asset.review_status !== 'rejected' && <button className="danger" disabled={Boolean(busy)} onClick={() => act(asset, 'rejected')}>Reject</button>}{profileCandidate && asset.review_status === 'approved' && <button disabled={Boolean(busy)} onClick={() => act(asset, 'publish-profile')}>Set as profile</button>}</div></article>; }) : <p className="system-muted">No portal uploads have been confirmed yet.</p>}</section>{message && <p className="performer-note">{message}</p>}</section>;
}

function VideoPanel({ apiV3, performerId, records, onUpdated }) {
  const [options, setOptions] = useState([]); const [ids, setIds] = useState(records.map(item => item.legacy_id)); const [q, setQ] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => setIds(records.map(item => item.legacy_id)), [records]);
  const search = async () => { try { setOptions((await apiV3(`/admin/catalogue/videos?limit=80&q=${encodeURIComponent(q)}`)).records || []); } catch (error) { setMessage(error.message); } };
  const save = async () => { setBusy(true); setMessage(''); try { await apiV3(`/admin/performers/${performerId}/videos`, { method: 'PUT', body: JSON.stringify({ video_ids: ids }) }); setMessage('Video relationships saved.'); await onUpdated(); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  return <section className="performer-video-panel"><div className="system-table"><h3>Linked catalogue videos</h3>{records.length ? records.map(item => <article key={item.legacy_id}><div><b>{item.title}</b><small>{item.status} / {item.v3_lifecycle}</small></div><button onClick={() => setIds(ids.filter(id => id !== item.legacy_id))}>Remove</button></article>) : <p className="system-muted">No catalogue videos are linked yet.</p>}</div><section className="readiness-panel"><h3>Add existing catalogue videos</h3><p>These are canonical catalogue relationships. Private submission source files are not selected here.</p><div className="performer-inline-tools"><input placeholder="Search videos by title" value={q} onChange={event => setQ(event.target.value)} /><button onClick={search}>Search</button></div>{options.map(item => <label className="video-choice" key={item.legacy_id}><input type="checkbox" checked={ids.includes(item.legacy_id)} onChange={event => setIds(event.target.checked ? [...new Set([...ids, item.legacy_id])] : ids.filter(id => id !== item.legacy_id))}/><span><b>{item.title}</b><small>{item.status} · {item.performer_names?.join(', ') || 'No performers currently listed'}</small></span></label>)}<button className="save" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save video relationships'}</button>{message && <p className="performer-note">{message}</p>}</section></section>;
}

function ContractPanel({ performerId, creators, records }) {
  const creator = creators?.[0];
  return <section className="performer-contract-panel"><section className="system-table"><h3>Contract records</h3>{records.length ? records.map(item => <article key={item.id}><div><b>{item.contract_number}</b><small>{item.title || 'Contract'} · {title(item.status)} · {item.version || 'legacy'}</small></div><a href={`/api/v3/admin/contracts/${item.id}/pdf`}>PDF</a></article>) : <p className="system-muted">No contract instance is attached to this performer.</p>}</section>{creator ? <section className="readiness-panel"><h3>Prepare a contract draft</h3><p>The existing Contract Center will open with {creator.full_name || creator.name} preselected. Drafts remain internal and legal review/signing gates stay enforced.</p><a className="save performer-admin-link-button" href={`/admin?section=Contracts&creatorId=${encodeURIComponent(creator.id)}&performerId=${encodeURIComponent(performerId)}`}>Open Contract Center for this performer →</a></section> : <section className="readiness-panel"><h3>Private workspace required</h3><p>Prepare or link a Creator workspace in Account before creating a contract instance. No legal record is fabricated for a standalone catalogue performer.</p></section>}</section>;
}

function Metric({ label, value }) { return <article className="metric"><span>{label}</span><strong>{value ?? '—'}</strong><small>Performer scope</small></article>; }
function Records({ title: heading, records, empty, render }) { return <section className="system-table"><h3>{heading}</h3>{records.length ? records.map(item => <article key={item.id || item.legacy_id}><div><b>{render(item)}</b><small>{item.created_at ? new Date(item.created_at).toLocaleString() : item.reference || item.slug || ''}</small></div></article>) : <p className="system-muted">{empty}</p>}</section>; }
