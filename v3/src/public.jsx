import React, { useEffect, useState } from 'react';
import './public.css';

const get = async path => {
  const response = await fetch(`/api/v3/public${path}`, { headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || 'This page is unavailable.');
  return data;
};

const esc = value => String(value || '').replace(/[<>]/g, '');
const publicImage = value => /^https?:\/\//i.test(String(value || '')) ? value : undefined;
const imageFor = (record = {}) => publicImage(record.thumbnail_url || record.poster_url || record.trailer_url || record.legacy_cover_image_url || record.legacy_profile_image_url || record.legacy_logo_url || record.cover_asset_reference);
const labelFor = record => record?.title || record?.display_name || record?.name || 'FLESHLAB';
const formatRuntime = value => { const seconds = Number(value); return Number.isFinite(seconds) && seconds >= 0 ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : ''; };
const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';
const videoHref = video => video?.slug ? `/v3/videos/${encodeURIComponent(video.slug)}` : '/v3/videos';
const performerHref = performer => `/v3/performers/${encodeURIComponent(performer.slug)}`;
const collectionHref = collection => `/v3/collections/${encodeURIComponent(collection.slug)}`;
const tapeCode = index => `FL-${String((index || 0) + 1).padStart(3, '0')}`;

function Seo({ title, description, image }) {
  useEffect(() => {
    const canonical = `${window.location.origin}${window.location.pathname}`;
    document.title = title;
    [['name', 'description', description], ['property', 'og:title', title], ['property', 'og:description', description], ['property', 'og:image', publicImage(image)]].forEach(([attribute, name, content]) => {
      if (!content) return;
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute('name', name); element.setAttribute('property', name); document.head.appendChild(element); }
      element.setAttribute('content', String(content).slice(0, 300));
    });
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = canonical;
    let schema = document.head.querySelector('#fleshlab-public-schema');
    if (!schema) { schema = document.createElement('script'); schema.id = 'fleshlab-public-schema'; schema.type = 'application/ld+json'; document.head.appendChild(schema); }
    schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'FLESHLAB', url: canonical, description: String(description || '').slice(0, 300), ...(publicImage(image) ? { image: publicImage(image) } : {}) });
  }, [title, description, image]);
  return null;
}

function FleshNav() {
  const links = <><a href="/v3/home">Home</a><a href="/v3/videos">Archive</a><a href="/v3/performers">People</a><a href="/v3/collections">Series</a><a href="/v3/brands">Labels</a></>;
  return <header className="flesh-nav">
    <a href="/v3/home" className="flesh-logo" aria-label="FLESHLAB home"><strong>FLESHLAB</strong><small>AMATEUR WINS.</small></a>
    <nav aria-label="Public navigation">{links}</nav>
    <div className="flesh-nav-actions"><a className="nav-search" href="/v3/videos#search-videos" aria-label="Search the FLESHLAB archive">SEARCH</a><a className="nav-earn" href="https://earn.fleshlab.online">EARN ↗</a><span className="nav-menu-label">MENU</span></div>
    <details className="flesh-mobile-nav"><summary aria-label="Open public navigation"><span>MENU</span><b>+</b></summary><div>{links}<a href="/v3/videos#search-videos">Search archive</a><a className="nav-earn" href="https://earn.fleshlab.online">Earn with FLESHLAB ↗</a></div></details>
  </header>;
}

function FleshFooter() {
  return <footer className="flesh-footer"><div className="footer-lockup"><a href="/v3/home" className="flesh-logo"><strong>FLESHLAB</strong><small>AMATEUR WINS.</small></a><p>Independent media from real rooms, real people and real encounters.</p></div><div><span>ARCHIVE</span><a href="/v3/videos">All tapes</a><a href="/v3/collections">Series</a><a href="/v3/brands">Labels</a></div><div><span>PEOPLE</span><a href="/v3/performers">Performers</a><a href="https://performer.fleshlab.online">Performer login ↗</a><a href="https://earn.fleshlab.online">Submit footage ↗</a></div><div><span>LEGAL</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/compliance">Contact / legal</a></div><small className="footer-credit">© {new Date().getFullYear()} FLESHLAB / AMATEUR WINS.</small></footer>;
}

function Shell({ children, seo = {} }) { return <div className="flesh-shell"><Seo title={seo.title || 'FLESHLAB / AMATEUR WINS.'} description={seo.description || 'Independent, creator-led media from FLESHLAB.'} image={seo.image}/><FleshNav/>{children}<FleshFooter/></div>; }
function Image({ record = {}, alt = '', eager = false, className = '', position }) { const src = imageFor(record); return <div className={`flesh-image ${className}`}>{src ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} {...(eager ? { fetchPriority: 'high' } : {})} style={position ? { objectPosition: position } : undefined}/> : <span>NO IMAGE / FLESHLAB</span>}</div>; }
function RecBadge({ code = 'FL-001' }) { return <span className="rec-badge"><i/> REC / {code}</span>; }
function Timecode({ video }) { const duration = formatRuntime(video.duration_seconds || video.runtime_seconds); return <span className="timecode">{duration ? `00:${duration}` : 'TIME UNKNOWN'}</span>; }
function FilmMetadata({ video, index = 0 }) { const people = video.performers?.map(item => item.name).filter(Boolean).join(' · '); return <div className="film-metadata"><span>{tapeCode(index)}</span><span>{people || video.brand_name || 'FLESHLAB'}</span><Timecode video={video}/><span>{formatDate(video.release_date || video.published_at)}</span></div>; }

function TapeCard({ video, index = 0, featured = false }) {
  return <a className={`tape-card${featured ? ' tape-card-featured' : ''}`} href={videoHref(video)} aria-label={`Open ${labelFor(video)}`}><Image record={video} alt={labelFor(video)} eager={featured}/><div className="tape-noise"/><div className="tape-top"><RecBadge code={tapeCode(index)}/><span>{featured ? 'NEW DROP' : 'RAW CUT'}</span></div><div className="tape-bottom"><h3>{esc(video.title)}</h3><FilmMetadata video={video} index={index}/><span className="tape-open">VIEW ENTRY ↗</span></div></a>;
}

function SectionLabel({ number, title, action, href }) { return <div className="archive-section-head"><div><span className="section-number">{number || '01'} /</span><h2>{title}</h2></div>{href && <a href={href}>{action || 'View all'} ↗</a>}</div>; }

function RawHero({ hero, fallbackVideo }) {
  const record = hero?.record || fallbackVideo || {};
  const image = hero?.image || imageFor(record);
  const people = record.performers?.map(item => item.name).filter(Boolean).join(' · ');
  return <section className="raw-hero"><div className="raw-hero-media"><Image record={{ thumbnail_url: image }} alt="" eager position="center center"/></div><div className="raw-hero-overlay"/><div className="raw-frame-corner raw-frame-corner-a"/><div className="raw-frame-corner raw-frame-corner-b"/><div className="raw-hero-top"><span>FLESHLAB PRESENTS</span><span>REC 00:00:00</span></div><div className="raw-hero-content public-main"><div className="raw-hero-brand"><strong>AMATEUR<br/><em>WINS.</em></strong><small>THE LAB / PUBLIC DROP</small></div><div className="raw-hero-entry"><span className="raw-kicker">{esc(hero?.eyebrow || 'SELECTED FOOTAGE')}</span><h1>{esc(hero?.title || 'Real people. Real rooms.')}</h1><p>{esc(hero?.summary || 'Independent stories from FLESHLAB.')}</p><div className="raw-hero-meta">{people && <span>{esc(people)}</span>}<Timecode video={record}/>{record.release_date && <span>{new Date(record.release_date).getFullYear()}</span>}</div><div className="raw-actions"><a className="raw-button raw-button-red" href={hero?.cta_target || videoHref(record)}>WATCH ↗</a><a className="raw-button" href={record.slug ? videoHref(record) : '/v3/videos'}>VIEW ENTRY</a></div></div></div><div className="raw-hero-bottom"><span>FRAME SELECTED / {tapeCode(0)}</span><span>MANILA / FLESHLAB ARCHIVE</span></div></section>;
}

function PerformerSheet({ performer, index = 0 }) { return <a className="performer-sheet" href={performerHref(performer)}><Image record={performer} alt={`Portrait of ${performer.display_name}`}/><div className="sheet-mark">P-{String(index + 1).padStart(2, '0')}</div><div className="sheet-caption"><strong>{esc(performer.display_name)}</strong><span>{performer.video_count != null ? `${performer.video_count} appearances` : 'Public file'} ↗</span></div></a>; }
function SeriesPoster({ collection, fallbackRecord }) { const imageRecord = { ...(fallbackRecord || {}), cover_asset_reference: collection.cover_asset_reference, legacy_cover_image_url: collection.legacy_cover_image_url }; return <a className="series-poster" href={collectionHref(collection)}><Image record={imageRecord} alt={collection.title}/><div className="series-overlay"/><div className="series-caption"><span>FLESHLAB SERIES / {collection.video_count || 0} TAPES</span><h3>{esc(collection.title)}</h3><p>{esc(collection.description || 'A FLESHLAB project.')}</p><b>EXPLORE SERIES ↗</b></div></a>; }

function BrandStatement() { return <section className="brand-statement public-main"><div className="statement-rule"><span>FLESHLAB / 2026</span><i/></div><h2>AMATEUR<br/><span>WINS.</span></h2><p>Real beats polished. Independent beats manufactured. The imperfections stay in the frame.</p></section>; }
function EarnPoster() { return <section className="earn-poster public-main"><div><span className="poster-kicker">YOU DON'T NEED A STUDIO.</span><h2>AMATEUR<br/><em>WINS.</em></h2><p>Submit your own footage.<br/>Earn up to $1 per approved minute.</p></div><a className="raw-button raw-button-red" href="https://earn.fleshlab.online">START HERE ↗</a><div className="poster-stamp">OPEN CALL / FLESHLAB</div></section>; }

function BrandHome() {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { get('/homepage').then(setData).catch(e => setError(e.message)); }, []);
  const hero = data?.hero; const featured = data?.featured_videos || []; const releases = data?.new_releases || []; const performers = data?.featured_performers || []; const collections = data?.featured_collections || [];
  const seoImage = hero?.image || imageFor(featured[0]);
  const seo = { title: 'FLESHLAB / AMATEUR WINS.', description: hero?.summary || 'Independent, creator-led media from FLESHLAB.', image: seoImage };
  return <Shell seo={seo}><main className="public-home">{error ? <div className="public-main public-state"><p className="error">{error}</p></div> : !data ? <div className="public-main public-state"><div className="public-empty">Loading the archive…</div></div> : <>
    <RawHero hero={hero} fallbackVideo={featured[0]}/>
    {data.sections?.featured_videos !== false && <section className="archive-section public-main"><SectionLabel number="01" title="LATEST FROM THE LAB" action="THE ARCHIVE" href="/v3/videos"/><div className="contact-sheet">{featured.slice(0, 5).map((item, index) => <TapeCard key={item.id || item.slug} video={item} index={index} featured={index === 0}/>)}</div>{!featured.length && <div className="public-empty">No public tapes are available.</div>}</section>}
    {data.sections?.new_releases !== false && <section className="archive-section archive-section-black public-main"><SectionLabel number="02" title="NEW TAPES" action="ALL TAPES" href="/v3/videos"/><div className="tape-strip">{releases.slice(0, 8).map((item, index) => <TapeCard key={item.id || item.slug} video={item} index={index}/>)}</div></section>}
    {data.sections?.performers !== false && <section className="archive-section public-main"><SectionLabel number="03" title="PEOPLE OF FLESHLAB" action="VIEW PEOPLE" href="/v3/performers"/><div className="people-sheet">{performers.slice(0, 6).map((item, index) => <PerformerSheet key={item.id || item.slug} performer={item} index={index}/>)}</div>{!performers.length && <div className="public-empty">No public performer files are available.</div>}</section>}
    {data.sections?.collections !== false && collections.length > 0 && <section className="archive-section archive-section-black public-main"><SectionLabel number="04" title="FROM THE ARCHIVE" action="ALL SERIES" href="/v3/collections"/><div className="series-layout">{collections.length === 1 ? <SeriesPoster collection={collections[0]} fallbackRecord={featured[0]}/> : collections.slice(0, 3).map(item => <SeriesPoster key={item.id || item.slug} collection={item}/>)}</div></section>}
    <BrandStatement/>{data.sections?.creator_cta !== false && <EarnPoster/>}
  </>}</main></Shell>;
}

function ArchiveGrid({ records = [] }) { return records.length ? <div className="archive-grid">{records.map((item, index) => <TapeCard key={item.id || item.slug} video={item} index={index}/>)}</div> : <div className="public-empty">No public tapes are available.</div>; }
function Listing({ kind }) {
  const [data, setData] = useState(null); const [q, setQ] = useState(''); const [error, setError] = useState('');
  const load = () => get(`/${kind}?q=${encodeURIComponent(q)}&limit=40`).then(setData).catch(e => setError(e.message)); useEffect(load, []);
  const records = data?.records || []; const title = kind === 'videos' ? 'THE ARCHIVE' : kind === 'performers' ? 'THE PEOPLE' : 'THE LABELS'; const description = kind === 'videos' ? 'Unfiltered releases from FLESHLAB.' : `Public ${kind} files from the FLESHLAB world.`;
  return <Shell seo={{ title: `${title} / FLESHLAB`, description }}><main className="public-main public-listing"><section className="archive-title"><span className="archive-kicker">FLESHLAB / PUBLIC INDEX</span><h1>{title}</h1><p>{description}</p></section>{kind === 'videos' && <div id="search-videos" className="archive-controls"><label className="archive-search"><span>SEARCH THE FILES</span><input value={q} onChange={event => setQ(event.target.value)} onKeyDown={event => event.key === 'Enter' && load()} placeholder="title, performer, label"/><button onClick={load}>FIND ↗</button></label><div className="archive-filters"><a href="/v3/videos">ALL</a><a href="/v3/videos?q=latest">LATEST</a><a href="/v3/performers">PERFORMER</a><a href="/v3/collections">SERIES</a><a href="/v3/brands">LABEL</a></div></div>}{error ? <p className="error">{error}</p> : kind === 'videos' ? <ArchiveGrid records={records}/> : <div className="people-index">{records.map((item, index) => <PerformerSheet key={item.id || item.slug} performer={item} index={index}/>)}</div>}</main></Shell>;
}

function FilmMetadataBlock({ record }) { const people = record.performers?.map(item => item.name).filter(Boolean).join(' · '); return <div className="film-file"><div><span>FILE</span><strong>{record.slug || 'PUBLIC-ENTRY'}</strong></div><div><span>PEOPLE</span><strong>{people || 'FLESHLAB / UNLISTED'}</strong></div><div><span>RUN TIME</span><strong>{formatRuntime(record.duration_seconds || record.runtime_seconds) || 'UNKNOWN'}</strong></div><div><span>RELEASED</span><strong>{record.release_date || 'PUBLIC ARCHIVE'}</strong></div><div><span>LABEL</span><strong>{record.brand_name || 'FLESHLAB'}</strong></div></div>; }
function Detail({ kind, slug }) {
  const [data, setData] = useState(null); const [error, setError] = useState(''); useEffect(() => { get(`/${kind}/${encodeURIComponent(slug)}`).then(setData).catch(e => setError(e.message)); }, [kind, slug]);
  if (error) return <Shell seo={{ title: 'Not found / FLESHLAB', description: 'The requested public record was not found.' }}><main className="public-main public-state"><div className="public-empty">{error}</div></main></Shell>;
  if (!data) return <Shell seo={{ title: 'Loading / FLESHLAB', description: 'Loading the public FLESHLAB record.' }}><main className="public-main public-state"><div className="public-empty">Loading public file…</div></main></Shell>;
  const record = data.record; const isVideo = kind === 'videos'; const title = record.title || record.display_name || record.name; const description = record.short_summary || record.description || record.bio || 'Public FLESHLAB archive entry.'; const image = publicImage(data.assets?.find(asset => asset.type === 'thumbnail')?.url || data.assets?.find(asset => asset.type === 'trailer')?.url || imageFor(record));
  return <Shell seo={{ title: `${title} / FLESHLAB`, description, image }}><main className="public-main public-detail"><div className="detail-kicker">FLESHLAB / {kind.slice(0, -1).toUpperCase()} / PUBLIC FILE</div><div className="detail-heading"><span className="detail-stamp">{isVideo ? 'RAW CUT' : 'DOSSIER'}</span><h1>{title}</h1><p>{description}</p></div>{isVideo && <div className="detail-frame"><div className="frame-label">VIEWING FILE / {record.slug}</div>{image ? <img src={image} alt={title}/> : <span>MEDIA PREVIEW UNAVAILABLE</span>}</div>}{isVideo ? <FilmMetadataBlock record={record}/> : <div className="dossier-meta"><span>PUBLIC NAME</span><strong>{record.display_name || record.name}</strong><span>APPEARANCES</span><strong>{record.videos?.length || 0} public files</strong></div>} {!isVideo && <section className="detail-section"><SectionLabel number="FILE" title="RELATED TAPES"/><ArchiveGrid records={data.videos}/></section>}{isVideo && <section className="detail-section"><SectionLabel number="FILE" title="RELATED TAPES"/><ArchiveGrid records={data.related}/></section>}</main></Shell>;
}

function Collection({ slug }) { const [data, setData] = useState(null); const [error, setError] = useState(''); useEffect(() => { get(`/collections/${encodeURIComponent(slug)}`).then(setData).catch(e => setError(e.message)); }, [slug]); const record = data?.record; return <Shell seo={{ title: `${record?.title || 'Series'} / FLESHLAB`, description: record?.description || 'A FLESHLAB series.' }}><main className="public-main public-detail">{error ? <div className="public-empty">{error}</div> : !data ? <div className="public-empty">Loading series…</div> : <><div className="detail-kicker">FLESHLAB SERIES / PUBLIC FILE</div><div className="detail-heading"><span className="detail-stamp">SERIES</span><h1>{record.title}</h1><p>{record.description || 'A FLESHLAB series.'}</p></div><section className="detail-section"><SectionLabel number="SERIES" title="TAPES IN THIS FILE"/><ArchiveGrid records={data.videos}/></section></>}</main></Shell>; }
function CollectionListing() { const [data, setData] = useState(null); const [error, setError] = useState(''); useEffect(() => { get('/collections').then(setData).catch(e => setError(e.message)); }, []); return <Shell seo={{ title: 'Series / FLESHLAB', description: 'Public FLESHLAB series and projects.' }}><main className="public-main public-listing"><section className="archive-title"><span className="archive-kicker">FLESHLAB / PROJECT INDEX</span><h1>THE SERIES</h1><p>Projects, chapters and rooms from the FLESHLAB archive.</p></section>{error ? <p className="error">{error}</p> : <div className="series-index">{data?.records?.map((item, index) => <SeriesPoster key={item.id || item.slug} collection={item} fallbackRecord={data.records[index - 1]}/>)}</div>}</main></Shell>; }

export function PublicApp() { const path = window.location.pathname.replace(/^\/v3\/?/, ''); if (!path) return <BrandHome/>; const parts = path.split('/').filter(Boolean); if (parts[0] === 'home') return <BrandHome/>; if (parts[0] === 'catalogue') return <Listing kind="videos"/>; if (parts[0] === 'videos' && parts[1]) return <Detail kind="videos" slug={parts[1]}/>; if (parts[0] === 'performers' && parts[1]) return <Detail kind="performers" slug={parts[1]}/>; if (parts[0] === 'brands' && parts[1]) return <Detail kind="brands" slug={parts[1]}/>; if (parts[0] === 'collections' && parts[1]) return <Collection slug={parts[1]}/>; if (parts[0] === 'collections') return <CollectionListing/>; if (['videos', 'performers', 'brands'].includes(parts[0])) return <Listing kind={parts[0]}/>; return <BrandHome/>; }
