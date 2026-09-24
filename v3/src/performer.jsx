import React, { useEffect, useMemo, useState } from 'react';
import './performer-portal.css';

const call = async (path, options = {}) => {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Request failed (${response.status})`);
  return payload;
};
const api = (path, options) => call(`/api/v1${path}`, options);
const apiV3 = (path, options) => call(`/api/v3${path}`, options);
const money = value => value == null ? '—' : `$${(Number(value) / 100).toFixed(2)}`;
const runtime = value => value == null ? '—' : `${Math.floor(Number(value) / 60)}:${String(Number(value) % 60).padStart(2, '0')}`;

function Login({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await onSuccess();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return <main className="performer-login"><div className="performer-login-art"><span>FLESHLAB</span><strong>Work<br /><i>in focus.</i></strong><p>Private operations for contracted performers.</p></div><form onSubmit={submit} className="performer-login-card"><span className="performer-eyebrow">PERFORMER PORTAL</span><h1>Welcome back.</h1><p>Sign in with your FLESHLAB account to access your contracted workspace.</p><label>Email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label><label>Password<input type="password" required value={password} onChange={event => setPassword(event.target.value)} /></label>{error && <p className="performer-error">{error}</p>}<button className="performer-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><small>Access is limited to active contracted performer accounts.</small></form></main>;
}

function Empty({ title, children }) {
  return <div className="performer-empty"><b>{title}</b><p>{children}</p></div>;
}

function Overview({ data, user }) {
  const wallet = data.commerce?.wallets?.records?.[0];
  const openActions = data.profile?.actions?.length || data.actions?.length || 0;
  return <section className="performer-section"><div className="performer-hero"><span className="performer-eyebrow">CONTRACTED PERFORMER</span><h1>{data.profile?.preferred_name || data.creator?.full_name || user.email}</h1><p>Your private FLESHLAB workspace, scoped to your linked performer identity.</p></div><div className="performer-metrics"><article><span>ACCOUNT</span><strong>{data.creator?.lifecycle || '—'}</strong><small>{data.link?.display_name || 'Active performer link'}</small></article><article><span>COMPLIANCE</span><strong>{data.identity?.verification?.status || data.documents?.[0]?.review_state || 'Not started'}</strong><small>Identity and document review</small></article><article><span>PRODUCTIONS</span><strong>{data.productions.length}</strong><small>Linked assignments</small></article><article><span>AVAILABLE</span><strong>{wallet ? money(wallet.available_minor) : '—'}</strong><small>{data.commerce?.historical_data === 'NOT_MIGRATED' ? 'No historical data migrated' : 'Ledger-derived balance'}</small></article></div><div className="performer-columns"><section><span className="performer-eyebrow">NEXT ACTIONS</span>{openActions ? data.actions.map(action => <article className="performer-row" key={action.id}><b>{action.title}</b><span>{action.body}</span></article>) : <Empty title="No open actions">Required account and production actions will appear here.</Empty>}</section><section><span className="performer-eyebrow">UPCOMING PRODUCTIONS</span>{data.productions.length ? data.productions.slice(0, 5).map(item => <article className="performer-row" key={item.id}><b>{item.title}</b><span>{item.scene_title || 'Production assignment'} · {item.status}</span></article>) : <Empty title="No assignments">Only productions linked to your performer identity are shown.</Empty>}</section></div></section>;
}

function Profile({ data, setData }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const save = async event => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const profile = await apiV3('/creator/profile', { method: 'PATCH', body: JSON.stringify(Object.fromEntries(form.entries())) });
      setData(current => ({ ...current, profile: { ...current.profile, ...profile } }));
      setMessage('Profile saved.');
    } catch (failure) {
      setMessage(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">PROFILE</span><h2>Your structured profile.</h2><p>Only your own private account and creator profile are editable here.</p></div><form className="performer-form" onSubmit={save}><label>Preferred name<input name="preferred_name" defaultValue={data.profile?.preferred_name || ''} /></label><label>Contact email<input name="contact_email" type="email" defaultValue={data.profile?.contact_email || ''} /></label><label>Contact phone<input name="contact_phone" defaultValue={data.profile?.contact_phone || ''} /></label><label>Locale<input name="locale" defaultValue={data.profile?.locale || ''} /></label><label>Timezone<input name="timezone" defaultValue={data.profile?.timezone || ''} /></label><button className="performer-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>{message && <p className="performer-note">{message}</p>}</form></section>;
}

function Account({ user }) {
  const [message, setMessage] = useState('');
  const requestReset = async () => {
    try { await api('/auth/password/reset-request', { method: 'POST', body: JSON.stringify({ email: user.email }) }); setMessage('If the account is eligible, a reset link will be sent for this Performer Portal.'); } catch (failure) { setMessage(failure.message); }
  };
  return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">ACCOUNT</span><h2>Account security.</h2><p>{user.email} · {user.account_status || 'active'}</p></div><div className="performer-card"><b>Password</b><p>Reset links are generated for the Performer Portal and sessions are revoked after a successful reset.</p><button className="performer-secondary" onClick={requestReset}>Request password reset</button>{message && <p className="performer-note">{message}</p>}</div></section>;
}

function Compliance({ data }) {
  const documents = data.documents || [];
  return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">COMPLIANCE / KYC</span><h2>Private review status.</h2><p>Documents and identity status are visible only to your account and authorized review staff.</p></div><div className="performer-status-card"><span>IDENTITY</span><strong>{data.identity?.verification?.status || 'not_started'}</strong><small>{data.identity?.verification?.reviewed_at ? `Reviewed ${new Date(data.identity.verification.reviewed_at).toLocaleDateString()}` : 'No review decision recorded.'}</small></div><div className="performer-list">{documents.length ? documents.map(document => <article className="performer-row" key={document.id}><b>{document.file_name || document.document_type}</b><span>{document.review_state || document.status} · {document.document_type}</span></article>) : <Empty title="No creator documents">Required compliance files will appear after secure submission.</Empty>}</div></section>;
}

function Contracts({ records }) {
  return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">CONTRACTS</span><h2>Your agreements.</h2><p>Contract access is limited to instances assigned to your creator record.</p></div><div className="performer-list">{records.length ? records.map(contract => <article className="performer-row performer-row-wide" key={contract.id}><div><b>{contract.title || contract.contract_number}</b><span>{contract.status} · version {contract.version || 'legacy'}</span></div><a href={`/api/v3/creator/contracts/${contract.id}/pdf`}>View PDF ↗</a></article>) : <Empty title="No contract assigned">Contracted agreements will appear here when assigned.</Empty>}</div></section>;
}

function Videos({ data }) {
  return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">VIDEOS</span><h2>Linked catalogue work.</h2><p>Only published or internally linked work for your performer identity is shown.</p></div><div className="performer-list">{data.videos.length ? data.videos.map(video => <article className="performer-row" key={video.legacy_id}><b>{video.title}</b><span>{video.v3_lifecycle} · {video.status}</span></article>) : <Empty title="No linked videos">Your catalogue appearances will appear here.</Empty>}</div></section>;
}

function Uploads({ submissions, refresh }) {
  const [file, setFile] = useState(null); const [duration, setDuration] = useState(null); const [title, setTitle] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const choose = selected => { setFile(selected); setError(''); const video = document.createElement('video'); video.preload = 'metadata'; video.onloadedmetadata = () => { setDuration(Math.floor(video.duration)); URL.revokeObjectURL(video.src); }; video.src = URL.createObjectURL(selected); };
  const submit = async event => { event.preventDefault(); if (busy) return; setBusy(true); setError(''); try { if (!duration || duration < 180) throw new Error('VIDEO TOO SHORT — a submission must be at least 3 minutes.'); const intent = await apiV3('/creator/submissions/upload', { method: 'POST', body: JSON.stringify({ title, file_name: file.name, content_type: file.type, byte_size: file.size }) }); await fetch(intent.upload_url, { method: 'PUT', credentials: 'include', headers: intent.upload_url.startsWith('/api/') ? { 'content-type': file.type } : { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': file.type, 'content-type': file.type }, body: file }).then(response => { if (!response.ok) throw new Error('Secure upload failed.'); }); await apiV3(`/creator/submissions/${intent.submission_id}/confirm`, { method: 'POST', body: '{}' }); await apiV3(`/creator/submissions/${intent.submission_id}/rights`, { method: 'PUT', body: JSON.stringify({ created_or_controlled: true, all_adults: true, recording_consent: true, submission_consent: true, participants: [] }) }); setTitle(''); setFile(null); setDuration(null); await refresh(); } catch (failure) { setError(failure.message); } finally { setBusy(false); } };
  return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">UPLOADS</span><h2>Submit new work.</h2><p>Uploads stay private while technical, rights and review checks are completed. Minimum runtime: 3:00.</p></div><form className="performer-upload" onSubmit={submit}><label>Video title<input required value={title} onChange={event => setTitle(event.target.value)} /></label><label className="performer-file">Choose video<input required type="file" accept="video/mp4,video/quicktime,video/webm" onChange={event => event.target.files?.[0] && choose(event.target.files[0])} /><small>{file ? `${file.name} · ${runtime(duration)}` : 'MP4, MOV or WEBM'}</small></label><p>Estimated base value: <b>{duration >= 180 ? money(Math.round(duration * 100 / 60)) : '—'}</b></p>{error && <p className="performer-error">{error}</p>}<button className="performer-primary" disabled={busy || !file || duration < 180}>{busy ? 'Uploading securely…' : 'Upload for review'}</button></form><div className="performer-list performer-list-spaced">{submissions.length ? submissions.map(submission => <article className="performer-row performer-row-wide" key={submission.id}><div><b>{submission.title}</b><span>{runtime(submission.verified_runtime_seconds || submission.original_runtime_seconds)} · {submission.status}</span></div><strong>{money(submission.approved_payout_minor ?? submission.base_value_minor)}</strong></article>) : <Empty title="No submissions yet">Your private submission history will appear after the first upload.</Empty>}</div></section>;
}

function Productions({ records }) { return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">PRODUCTIONS</span><h2>Your schedule and assignments.</h2><p>Production records are scoped to your linked creator and performer identities.</p></div><div className="performer-list">{records.length ? records.map(record => <article className="performer-row" key={record.id}><b>{record.title}</b><span>{record.scene_title || 'Assignment'} · {record.participation_status} · {record.status}</span></article>) : <Empty title="No production assignments">Upcoming linked productions will appear here.</Empty>}</div></section>; }

function Commerce({ commerce, statement }) { const earnings = statement.records || commerce?.earnings?.records || []; const settlements = commerce?.settlements?.records || []; const payouts = commerce?.payouts?.records || []; return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">EARNINGS / SETTLEMENTS / PAYOUTS</span><h2>Financial visibility.</h2><p>Balances and records come from the V3 ledger. No values are fabricated when historical data is unavailable.</p></div><div className="performer-metrics"><article><span>WALLET AVAILABLE</span><strong>{money(commerce?.wallets?.records?.[0]?.available_minor)}</strong><small>Ledger-derived</small></article><article><span>EARNINGS EVENTS</span><strong>{earnings.length}</strong><small>{statement.financial_data_state || commerce?.historical_data}</small></article><article><span>SETTLEMENTS</span><strong>{settlements.length}</strong><small>Own records only</small></article><article><span>PAYOUTS</span><strong>{payouts.length}</strong><small>{commerce?.payout_profile?.status || 'Profile not configured'}</small></article></div><div className="performer-list">{earnings.length ? earnings.slice(0, 20).map(earning => <article className="performer-row performer-row-wide" key={earning.id}><div><b>{earning.source_type || earning.event_type}</b><span>{new Date(earning.created_at).toLocaleDateString()} · {earning.original_currency || 'USD'}</span></div><strong>{money(earning.performer_amount_minor || earning.original_amount_minor)}</strong></article>) : <Empty title="No financial history">Historical financial data is not migrated or no ledger events exist.</Empty>}</div></section>; }

function Notifications({ actions, notifications }) { const records = actions.length ? actions : notifications; return <section className="performer-section"><div className="performer-heading"><span className="performer-eyebrow">NOTIFICATIONS</span><h2>Stay in the loop.</h2><p>Open actions and account messages for your own creator workspace.</p></div><div className="performer-list">{records.length ? records.map(item => <article className="performer-row" key={item.id}><b>{item.title || item.kind || 'Notification'}</b><span>{item.body || item.action_state || 'No additional detail.'}</span></article>) : <Empty title="No notifications">New account, production or review messages will appear here.</Empty>}</div></section>; }

export function PerformerApp() {
  const [user, setUser] = useState(null); const [data, setData] = useState(null); const [section, setSection] = useState('Dashboard'); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const nav = useMemo(() => ['Dashboard', 'Profile', 'Account', 'Compliance / KYC', 'Contracts', 'Videos', 'Uploads', 'Productions', 'Earnings', 'Settlements / Payouts', 'Notifications'], []);
  const load = async () => { setLoading(true); setError(''); try { const current = await api('/auth/me'); if (current.role !== 'performer') throw new Error('A performer-compatible account is required.'); const [profile, identity, submissions, contracts, productions, commerce, statement, actions] = await Promise.all([apiV3('/creator/me'), apiV3('/creator/submissions/identity'), apiV3('/creator/submissions'), apiV3('/creator/contracts'), apiV3('/creator/productions'), apiV3('/creator/commerce'), apiV3('/creator/compensation'), apiV3('/creator/actions')]); setUser(current); setData({ ...profile, identity, submissions: submissions.records || [], contracts: contracts.records || [], productions: productions.records || [], commerce, statement, actions: actions.records || actions || [] }); } catch (failure) { setError(failure.message); } finally { setLoading(false); } };
  useEffect(() => { api('/auth/me').then(current => { if (current.role === 'performer') { setUser(current); load(); } else { setLoading(false); } }).catch(() => setLoading(false)); }, []);
  const logout = async () => { await api('/auth/logout', { method: 'POST', body: '{}' }).catch(() => {}); setUser(null); setData(null); };
  if (!user && loading) return <main className="performer-loading">Loading Performer Portal…</main>;
  if (!user) return <Login onSuccess={load} />;
  if (error && !data) return <main className="performer-denied"><span className="performer-eyebrow">PERFORMER PORTAL</span><h1>Access is not linked.</h1><p>{error}</p><button className="performer-secondary" onClick={logout}>Sign out</button></main>;
  if (!data) return <main className="performer-loading">Loading your private workspace…</main>;
  const view = { Dashboard: <Overview data={data} user={user} />, Profile: <Profile data={data} setData={setData} />, Account: <Account user={user} />, 'Compliance / KYC': <Compliance data={data} />, Contracts: <Contracts records={data.contracts} />, Videos: <Videos data={data} />, Uploads: <Uploads submissions={data.submissions} refresh={load} />, Productions: <Productions records={data.productions} />, Earnings: <Commerce commerce={data.commerce} statement={data.statement} />, 'Settlements / Payouts': <Commerce commerce={data.commerce} statement={data.statement} />, Notifications: <Notifications actions={data.actions} notifications={data.notifications || []} /> }[section];
  return <main className="performer-portal"><aside className="performer-sidebar"><a className="performer-brand" href="/"><span>FLESH</span>LAB<small>PERFORMER PORTAL</small></a><div className="performer-nav">{nav.map(item => <button className={section === item ? 'active' : ''} key={item} onClick={() => setSection(item)}>{item}</button>)}</div><button className="performer-signout" onClick={logout}>Sign out</button></aside><div className="performer-content"><header className="performer-topbar"><span>PRIVATE WORKSPACE</span><b>{user.email}</b></header>{error && <p className="performer-error performer-global-error">{error}</p>}{view}</div></main>;
}
