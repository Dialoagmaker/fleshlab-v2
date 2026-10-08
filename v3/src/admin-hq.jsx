import React, { useEffect, useMemo, useState } from 'react';

const exportEntities = [
  ['Brand', 'Brands'],
  ['Performer', 'Performers'],
  ['Video', 'Videos'],
  ['VideoPerformer', 'Video / Performer relationships']
];

const operationDefinitions = {
  rendering: { title: 'Rendering Intelligence', description: 'Observed render jobs and provider execution state. Execution remains fail-closed when no provider is configured.', fields: ['asset_id', 'provider_id', 'status', 'output_reference'] },
  qa: { title: 'Production QA', description: 'Technical quality records and explicit review decisions.', fields: ['asset_id', 'performer_id', 'video_id', 'severity', 'status', 'decision', 'reviewer_notes'] },
  audit: { title: 'Studio Audit', description: 'Auditable scope, findings and remediation notes.', fields: ['scope', 'status', 'severity', 'notes'] },
  certification: { title: 'Certification', description: 'Certification records, evidence status and review dates.', fields: ['asset_id', 'performer_id', 'video_id', 'status', 'review_due_at', 'reviewer_notes'] },
  readiness: { title: 'Adult Provider Readiness', description: 'Provider readiness records and explicit requirements.', fields: ['provider_name', 'status', 'notes'] },
  automation: { title: 'Automation', description: 'Stored automation definitions. No external automation is activated by viewing this area.', fields: ['name', 'enabled'] },
  settings: { title: 'Operations Settings', description: 'Administrative settings stored by the existing V3 operations service.', fields: ['key', 'value'] }
};

function pretty(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleString();
}

export function DataExportWorkspace({ api }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    try { setError(''); setData(await api('/admin/exports/all')); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const download = async entity => {
    setBusy(entity);
    try {
      const response = await fetch(`/api/v1/admin/exports/${entity}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Export failed (${response.status})`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fleshlab-${entity.toLowerCase()}-export.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };

  return <section className="hq-workspace">
    <div className="catalogue-head"><div><span className="eyebrow">DATA EXPORT</span><h2>Controlled catalogue exports.</h2><p>These exports contain the public catalogue projection and relationship envelopes only. Private documents, source media, credentials and audit secrets are not included.</p></div><button onClick={load}>Refresh</button></div>
    {error && <p className="error">{error}</p>}
    <div className="hq-card-grid">{exportEntities.map(([entity, label]) => {
      const item = data?.[entity];
      return <article className="hq-card" key={entity}><span className="eyebrow">{entity}</span><h3>{label}</h3><strong>{item?.count ?? '—'}</strong><p>{item ? `Exported ${formatDate(item.exported_at)}.` : 'Loading live export count.'}</p><button className="save" disabled={busy === entity} onClick={() => download(entity)}>{busy === entity ? 'Preparing…' : 'Download JSON'}</button></article>;
    })}</div>
    <section className="readiness-panel"><span className="eyebrow">PARITY NOTE</span><h3>V2 export coverage is connected to the V3 admin.</h3><p>Brand, Performer, Video and Video/Performer exports use the canonical PostgreSQL catalogue IDs. The download is permission-checked by the server and each export remains separately auditable at the access boundary.</p></section>
  </section>;
}

export function AdminSnapshotWorkspace({ api, kind }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const endpoint = kind === 'Discovery' ? '/admin/discovery' : '/admin/marketing';
  useEffect(() => { setData(null); setError(''); api(endpoint).then(setData).catch(e => setError(e.message)); }, [endpoint]);

  if (error) return <section className="hq-workspace"><p className="error">{error}</p></section>;
  if (!data) return <section className="hq-workspace"><p>Loading {kind}…</p></section>;
  if (kind === 'Discovery') return <section className="hq-workspace"><div className="catalogue-head"><div><span className="eyebrow">DISCOVERY</span><h2>Owned signals, not guessed traffic.</h2><p>Discovery shows PostgreSQL-owned recruitment and catalogue signals. GA4 and Search Console remain explicitly not migrated.</p></div><span className="state-label">LIVE DATA</span></div><div className="metric-grid domain-metrics">{Object.entries(data.metrics || {}).map(([key, value]) => <article className="metric" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value ?? '—'}</strong><small>PostgreSQL</small></article>)}</div><div className="overview-columns"><section className="readiness-panel"><span className="eyebrow">REVIEW QUEUE</span>{data.review_queue?.length ? data.review_queue.map(item => <div className="ops-row" key={item.id}><b>{item.full_name}</b><span>{item.status} · {item.country || 'Country not recorded'}</span></div>) : <p>No applications in the discovery review queue.</p>}</section><section className="readiness-panel"><span className="eyebrow">CATALOGUE BY BRAND</span>{data.catalogue_by_brand?.length ? data.catalogue_by_brand.map(item => <div className="ops-row" key={item.brand}><b>{item.brand}</b><span>{item.published_videos} published videos</span></div>) : <p>No active brand catalogue records.</p>}</section></div></section>;

  return <section className="hq-workspace"><div className="catalogue-head"><div><span className="eyebrow">MARKETING</span><h2>Campaign and content signals.</h2><p>Recruitment campaigns, news inventory and catalogue state are shown from self-hosted records. External posting and analytics providers are not presented as active.</p></div><span className="state-label">LIVE DATA</span></div><div className="metric-grid domain-metrics"><Metric label="Campaigns" value={data.campaigns?.length ?? 0}/><Metric label="News articles" value={data.content?.articles ?? 0}/><Metric label="Published articles" value={data.content?.published_articles ?? 0}/><Metric label="Published videos" value={data.catalogue?.published_videos ?? 0}/><Metric label="Active performers" value={data.catalogue?.active_performers ?? 0}/></div><div className="system-table">{data.campaigns?.length ? data.campaigns.map(item => <article key={item.id}><div><b>{item.name}</b><span>{item.status} · {item.slug}</span><small>{item.applications} attributed applications · {item.generated_url || 'No generated URL'}</small></div></article>) : <p>No recruitment campaigns are stored.</p>}</div><section className="readiness-panel"><span className="eyebrow">INTEGRATIONS</span>{Object.entries(data.external || {}).map(([key, value]) => <div className="ops-row" key={key}><b>{key.replaceAll('_', ' ')}</b><span className="commerce-state">{String(value).replaceAll('_', ' ')}</span></div>)}</section></section>;
}

function Metric({ label, value }) { return <article className="metric"><span>{label}</span><strong>{value ?? '—'}</strong><small>PostgreSQL</small></article>; }

export function AdminOperationsWorkspace({ api, kind }) {
  const definition = operationDefinitions[kind];
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [showTechnical, setShowTechnical] = useState(false);
  const [form, setForm] = useState({});
  const load = async () => { try { setError(''); const result = await api(`/admin/operations/${kind.toLowerCase()}`); setRecords(result.records || []); } catch (e) { setError(e.message); } };
  useEffect(() => { setForm({}); load(); }, [kind]);
  const save = async event => { event.preventDefault(); try { const payload = { ...form }; if (kind === 'settings' && payload.value) { try { payload.value = JSON.parse(payload.value); } catch { throw new Error('Value must be valid JSON.'); } } await api(`/admin/operations/${kind.toLowerCase()}`, { method: 'POST', body: JSON.stringify(payload) }); setForm({}); await load(); } catch (e) { setError(e.message); } };
  if (!definition) return null;
  return <section className="hq-workspace"><div className="catalogue-head"><div><span className="eyebrow">{definition.title}</span><h2>Operational records with evidence.</h2><p>{definition.description}</p></div><span className="state-label">SELF-HOSTED DATA</span></div>{error && <p className="error">{error}</p>}<div className="hq-operation-layout"><section className="readiness-panel"><span className="eyebrow">NEW RECORD</span><form className="hq-form" onSubmit={save}>{definition.fields.map(field => <label key={field}>{field.replaceAll('_', ' ')}<input value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })}/></label>)}<button className="save">Save audited record</button><button type="button" onClick={() => setShowTechnical(!showTechnical)}>{showTechnical ? 'Hide' : 'Show'} technical field guidance</button>{showTechnical && <p className="muted">Technical references are accepted by the existing operations API. Normal production workflows should use searchable entity selection; this legacy operation module remains a documented partial parity area until those projections are connected.</p>}</form></section><section className="system-table"><div className="catalogue-head"><div><span className="eyebrow">RECORDS</span><h3>{records.length} stored records</h3></div><button onClick={load}>Refresh</button></div>{records.length ? records.map(item => <article key={item.id || item.key}><div><b>{item.name || item.key || item.provider_name || item.scope || item.id}</b><span>{item.status || item.severity || (item.enabled ? 'enabled' : 'disabled')}</span><small>{Object.entries(item).filter(([key]) => !['id', 'created_at', 'updated_at', 'created_by'].includes(key)).slice(0, 5).map(([key, value]) => `${key}: ${pretty(value)}`).join(' · ')}</small></div></article>) : <p>No records are stored for this module.</p>}</section></div></section>;
}

const emptyNews = { title: '', slug: '', category: 'behindTheScenes', excerpt: '', content: '', cover_image_url: '', meta_title: '', meta_description: '', tags: '', campaign_id: '', status: 'draft' };

export function AdminNewsWorkspace({ apiV3 }) {
  const [records, setRecords] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(emptyNews);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = async () => { try { setError(''); const [news, campaignData] = await Promise.all([apiV3('/admin/growth/news?limit=100'), apiV3('/admin/growth/campaigns?limit=100')]); setRecords(news.records || []); setCampaigns(campaignData.records || []); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  const update = (key, value) => setForm(value === undefined ? emptyNews : { ...form, [key]: value });
  const edit = record => { setSelected(record.id); setForm({ ...emptyNews, ...record, tags: Array.isArray(record.tags) ? record.tags.join(', ') : '' }); setPreview(false); };
  const save = async event => { event.preventDefault(); setBusy(true); try { const payload = { ...form, tags: form.tags.split(',').map(item => item.trim()).filter(Boolean), campaign_id: form.campaign_id || null, cover_image_url: form.cover_image_url || null, meta_title: form.meta_title || null, meta_description: form.meta_description || null }; const path = selected ? `/admin/growth/news/${selected}` : '/admin/growth/news'; await apiV3(path, { method: selected ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); setForm(emptyNews); setSelected(null); setPreview(false); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const publish = async id => { try { await apiV3(`/admin/growth/news/${id}/publish`, { method: 'POST', body: '{}' }); await load(); } catch (e) { setError(e.message); } };
  return <section className="hq-workspace"><div className="catalogue-head"><div><span className="eyebrow">NEWS EDITOR</span><h2>Editorial workflow, not a text box.</h2><p>Draft, review, preview and publish articles with cover, taxonomy, tags and SEO metadata. Changes use the audited V3 Growth API.</p></div><div className="button-row"><button onClick={() => { setForm(emptyNews); setSelected(null); setPreview(false); }}>New article</button><button onClick={load}>Refresh</button></div></div>{error && <p className="error">{error}</p>}<div className="hq-news-layout"><section className="readiness-panel"><div className="catalogue-head"><div><span className="eyebrow">{selected ? 'EDIT ARTICLE' : 'NEW ARTICLE'}</span><h3>{selected ? 'Update existing article' : 'Create editorial draft'}</h3></div><button type="button" onClick={() => setPreview(!preview)}>{preview ? 'Edit' : 'Preview'}</button></div>{preview ? <article className="news-preview"><span className="eyebrow">{form.category}</span><h2>{form.title || 'Untitled article'}</h2><p>{form.excerpt}</p>{form.cover_image_url && <img src={form.cover_image_url} alt=""/>}<div>{form.content || 'No body content yet.'}</div><small>{form.tags || 'No tags'}</small></article> : <form className="hq-form" onSubmit={save}><label>Title<input required value={form.title} onChange={e => update('title', e.target.value)}/></label><label>Slug<input required value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="auto-generated if blank"/></label><label>Category<input value={form.category} onChange={e => update('category', e.target.value)}/></label><label>Short description<textarea value={form.excerpt} onChange={e => update('excerpt', e.target.value)}/></label><label>Article content<textarea className="large-editor" required value={form.content} onChange={e => update('content', e.target.value)}/></label><label>Cover image URL<input type="url" value={form.cover_image_url || ''} onChange={e => update('cover_image_url', e.target.value)} placeholder="Public-ready media URL"/></label><p className="muted">The current V3 media API does not expose a news-cover upload endpoint; URL selection is kept public-safe and this gap remains explicit.</p><label>Tags<input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="behind the scenes, release"/></label><label>Campaign<select value={form.campaign_id || ''} onChange={e => update('campaign_id', e.target.value)}><option value="">No campaign</option>{campaigns.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>SEO title<input value={form.meta_title || ''} onChange={e => update('meta_title', e.target.value)}/></label><label>SEO description<textarea value={form.meta_description || ''} onChange={e => update('meta_description', e.target.value)}/></label><label>Status<select value={form.status} onChange={e => update('status', e.target.value)}><option value="draft">Draft</option><option value="review">Review</option><option value="archived">Archived</option></select></label><button className="save" disabled={busy}>{busy ? 'Saving…' : selected ? 'Save article' : 'Create draft'}</button></form>}</section><section className="system-table"><div className="catalogue-head"><div><span className="eyebrow">ARTICLES</span><h3>{records.length} records</h3></div></div>{records.length ? records.map(record => <article key={record.id}><div><b>{record.title}</b><span>{record.status} · {record.category} · {formatDate(record.updated_at)}</span><small>{record.excerpt || 'No summary'}{record.tags?.length ? ` · ${record.tags.join(', ')}` : ''}</small></div><div className="button-row"><button onClick={() => edit(record)}>Edit</button>{record.status !== 'published' && <button onClick={() => publish(record.id)}>Publish</button>}</div></article>) : <p>No articles stored. This is a valid empty state, not proof of migration.</p>}</section></div></section>;
}

export function CollectionOperations({ apiV3 }) {
  const [collections, setCollections] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', visibility: 'private', display_order: 0, videoIds: [] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => { try { setError(''); const [collectionData, videoData] = await Promise.all([apiV3('/admin/catalogue/collections'), apiV3('/admin/catalogue/videos?limit=100')]); setCollections(collectionData.records || []); setVideos(videoData.records || []); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  const open = async item => { try { const related = await apiV3(`/admin/catalogue/collections/${item.id}/videos`); setSelected(item.id); setForm({ ...item, videoIds: (related.records || []).map(video => video.legacy_id) }); } catch (e) { setError(e.message); } };
  const save = async event => { event.preventDefault(); setBusy(true); try { const payload = { title: form.title, slug: form.slug, description: form.description, visibility: form.visibility, display_order: Number(form.display_order || 0) }; const result = selected ? await apiV3(`/admin/catalogue/collections/${selected}`, { method: 'PATCH', body: JSON.stringify(payload) }) : await apiV3('/admin/catalogue/collections', { method: 'POST', body: JSON.stringify(payload) }); await apiV3(`/admin/catalogue/collections/${result.id}/videos`, { method: 'PUT', body: JSON.stringify({ video_ids: form.videoIds }) }); setSelected(result.id); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const toggleVideo = id => setForm(current => ({ ...current, videoIds: current.videoIds.includes(id) ? current.videoIds.filter(value => value !== id) : [...current.videoIds, id] }));
  return <section className="hq-workspace"><div className="catalogue-head"><div><span className="eyebrow">COLLECTIONS / SERIES</span><h2>Projects with ordered releases.</h2><p>Collections remain distinct from brands. Visibility, display order, episode membership and public-safe video relationships are saved together and audited.</p></div><div className="button-row"><button onClick={() => { setSelected(null); setForm({ title: '', slug: '', description: '', visibility: 'private', display_order: 0, videoIds: [] }); }}>New collection</button><button onClick={load}>Refresh</button></div></div>{error && <p className="error">{error}</p>}<div className="hq-operation-layout"><section className="readiness-panel"><span className="eyebrow">{selected ? 'EDIT SERIES' : 'NEW SERIES'}</span><form className="hq-form" onSubmit={save}><label>Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label><label>Slug<input value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Generated from title when blank"/></label><label>Description<textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}/></label><label>Visibility<select value={form.visibility || 'private'} onChange={e => setForm({ ...form, visibility: e.target.value })}><option value="private">Private</option><option value="public">Public</option><option value="archived">Archived</option></select></label><label>Homepage / index order<input type="number" value={form.display_order || 0} onChange={e => setForm({ ...form, display_order: e.target.value })}/></label><fieldset className="hq-checklist"><legend>Videos / episodes</legend>{videos.length ? videos.map(video => <label key={video.legacy_id}><input type="checkbox" checked={form.videoIds.includes(video.legacy_id)} onChange={() => toggleVideo(video.legacy_id)}/><span>{video.title} · {video.v3_lifecycle || video.status}</span></label>) : <p>No catalogue videos available.</p>}</fieldset><button className="save" disabled={busy}>{busy ? 'Saving…' : selected ? 'Save collection' : 'Create collection'}</button></form></section><section className="system-table"><div className="catalogue-head"><div><span className="eyebrow">STORED COLLECTIONS</span><h3>{collections.length} records</h3></div></div>{collections.length ? collections.map(item => <article key={item.id}><div><b>{item.title}</b><span>{item.visibility} · {item.video_count || 0} videos · order {item.display_order || 0}</span><small>{item.description || 'No description recorded.'}</small></div><button onClick={() => open(item)}>Edit</button></article>) : <p>No collections are stored. This is a valid empty state.</p>}</section></div></section>;
}

export function MissingHqModule({ title, reason }) {
  return <section className="hq-workspace"><div className="readiness-panel"><span className="eyebrow">NOT YET REPLACED</span><h2>{title}</h2><p>{reason}</p><p className="muted">This is intentionally reported as a parity gap. No fake execution, provider result or migrated data is displayed.</p></div></section>;
}
