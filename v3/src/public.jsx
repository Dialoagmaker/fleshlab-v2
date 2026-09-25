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
  const links = <><a href="/v3/videos">Archive</a><a href="/v3/performers">People</a><a href="/v3/collections">Series</a><a href="/v3/brands">Labels</a></>;
  return <header className="flesh-nav">
    <a href="/v3/home" className="flesh-logo" aria-label="FLESHLAB home"><strong>FLESH<span>LAB</span><sup>®</sup></strong><small>AMATEUR WINS.</small></a>
    <nav aria-label="Public navigation">{links}</nav>
    <div className="flesh-nav-actions"><a className="nav-earn" href="https://earn.fleshlab.online">Earn</a><a className="nav-search" href="/v3/videos#search-videos" aria-label="Search the FLESHLAB archive">⌕</a><span className="nav-rule" aria-hidden="true"/><a className="nav-login" href="https://performer.fleshlab.online">Log in</a><a className="nav-join" href="https://earn.fleshlab.online">Join the lab →</a></div>
    <details className="flesh-mobile-nav"><summary aria-label="Open public navigation"><span>MENU</span><b>+</b></summary><div>{links}<a href="/v3/videos#search-videos">Search archive</a><a href="https://performer.fleshlab.online">Log in</a><a className="nav-earn" href="https://earn.fleshlab.online">Join the lab →</a></div></details>
  </header>;
}

function FleshFooter() {
  return <footer className="flesh-footer">
    <div className="footer-lockup"><a href="/v3/home" className="flesh-logo"><strong>FLESH<span>LAB</span><sup>®</sup></strong><small>AMATEUR WINS.</small></a><span className="footer-socials"><a href="https://twitter.com/fleshlabasia" target="_blank" rel="noreferrer" aria-label="FLESHLAB on X">X</a><a href="https://www.instagram.com/fleshlabstudios/" target="_blank" rel="noreferrer" aria-label="FLESHLAB on Instagram">IG</a></span></div>
    <div><span>ARCHIVE</span><a href="/v3/videos">All tapes</a><a href="/v3/performers">People</a><a href="/v3/collections">Series</a><a href="/v3/brands">Labels</a><a href="https://earn.fleshlab.online">Earn</a></div>
    <div><span>ABOUT / HELP</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/compliance">Contact</a></div>
    <div><span>CREATOR / ACCOUNT</span><a href="https://performer.fleshlab.online">Log in ↗</a><a href="https://earn.fleshlab.online">Creator terms ↗</a><a href="https://earn.fleshlab.online">Become a creator ↗</a></div>
    <small className="footer-credit">© {new Date().getFullYear()} FLESHLAB. ALL RIGHTS RESERVED.</small>
  </footer>;
}

function Shell({ children, seo = {} }) { return <div className="flesh-shell"><Seo title={seo.title || 'FLESHLAB / AMATEUR WINS.'} description={seo.description || 'Independent, creator-led media from FLESHLAB.'} image={seo.image}/><FleshNav/>{children}<FleshFooter/></div>; }
function Image({ record = {}, alt = '', eager = false, className = '', position }) { const src = imageFor(record); return <div className={`flesh-image ${className}`}>{src ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} {...(eager ? { fetchPriority: 'high' } : {})} style={position ? { objectPosition: position } : undefined}/> : <span>NO IMAGE / FLESHLAB</span>}</div>; }
function RecBadge() { return <span className="rec-badge"><i/> REC</span>; }
function Timecode({ video }) { const duration = formatRuntime(video.duration_seconds || video.runtime_seconds); return <span className="timecode">{duration ? `00:${duration}` : 'TIME UNKNOWN'}</span>; }
function FilmMetadata({ video, index = 0 }) { const people = video.performers?.map(item => item.name).filter(Boolean).join(' · '); const year = video.release_date || video.published_at ? new Date(video.release_date || video.published_at).getFullYear() : ''; return <div className="film-metadata"><span>{tapeCode(index)}</span><span>{people || video.brand_name || 'FLESHLAB'}</span><Timecode video={video}/>{year ? <span>{year}</span> : null}</div>; }

function TapeCard({ video, index = 0, featured = false, homepage = false }) {
  const displayTitle = homepage ? (video.editorial_title || video.public_title || video.short_title || video.homepage_title || `TAPE ${String(index + 1).padStart(3, '0')}`) : video.title;
  return <a className={`tape-card${featured ? ' tape-card-featured' : ''}`} href={videoHref(video)} aria-label={`Open ${labelFor(video)}`}><Image record={video} alt={labelFor(video)} eager={featured}/><div className="tape-noise"/><div className="tape-top"><span>{tapeCode(index)}</span><span>{featured ? 'NEW STORY' : 'RAW CUT'}</span></div><div className="tape-bottom"><h3>{esc(displayTitle)}</h3><FilmMetadata video={video} index={index}/><span className="tape-open">VIEW ENTRY +</span></div></a>;
}

function SectionLabel({ number, title, accent, detail, action, href }) { return <div className="archive-section-head"><div><span className="section-number">{number || '01'} /</span><h2>{title}{accent && <span className="section-accent"> {accent}</span>}</h2>{detail && <span className="section-detail">{detail}</span>}</div>{href && <a href={href}>{action || 'View all'} →</a>}</div>; }

function RawHero({ hero, fallbackVideo }) {
  const record = hero?.record || fallbackVideo || {};
  const image = hero?.image || imageFor(record);
  const year = record.release_date || record.published_at ? new Date(record.release_date || record.published_at).getFullYear() : '';
  const location = record.location || record.country || '';
  return <section className="raw-hero"><div className="raw-hero-copy"><span className="raw-kicker">AMATEUR FOOTAGE. REAL LIVES. NO FILTERS.</span><h1><span>REAL PEOPLE.</span><span>RAW STORIES.</span></h1><span className="raw-mark" aria-hidden="true"/><p>A home for real guys, real moments and the stories they choose to share.</p><a className="raw-button raw-button-red" href={hero?.cta_target || '/v3/videos'}>EXPLORE THE ARCHIVE →</a></div><div className="raw-hero-media"><Image record={{ thumbnail_url: image }} alt={labelFor(record)} eager position="center center"/><div className="hero-media-shade"/><div className="hero-frame"/><div className="hero-rec"><i/> REC</div><div className="hero-time"><Timecode video={record}/></div><div className="hero-meta">{tapeCode(0)}<br/>{location ? `${esc(location)} / ` : ''}{year || 'PUBLIC ARCHIVE'}<br/>RAW CUT / <Timecode video={record}/></div><span className="hero-scribble">REAL GUYS.<br/>REAL PLACES.<br/>ALWAYS<br/>AMATEUR.</span></div></section>;
}

function PerformerSheet({ performer, index = 0 }) { const place = performer.public_location || performer.location || performer.country; const detail = place || 'Public file'; return <a className="performer-sheet" href={performerHref(performer)}><Image record={performer} alt={`Portrait of ${performer.display_name}`}/><div className="sheet-mark">#{String(index + 1).padStart(3, '0')}</div><div className="sheet-caption"><strong>{esc(performer.display_name)}</strong><span>{esc(detail)} <b>+</b></span></div></a>; }
function SeriesPoster({ collection, fallbackRecord }) { const imageRecord = { ...(fallbackRecord || {}), cover_asset_reference: collection.cover_asset_reference, legacy_cover_image_url: collection.legacy_cover_image_url }; return <a className="series-poster" href={collectionHref(collection)}><Image record={imageRecord} alt={collection.title}/><div className="series-overlay"/><div className="series-caption"><span>FLESHLAB SERIES / {collection.video_count || 0} TAPES</span><h3>{esc(collection.title)}</h3><p>{esc(collection.description || 'A FLESHLAB project.')}</p><b>EXPLORE SERIES ↗</b></div></a>; }

function BrandStatement({ performers = [] }) { return <section className="brand-statement public-main"><div className="manifesto-aside"><span>OUR MANIFESTO</span><i/><p>REAL PEOPLE<br/>REAL PLACES<br/>REAL STORIES<br/>NO SCRIPTS<br/>NO PERFECTION<br/>JUST LIFE</p><small>FLESHLAB<br/>INDEPENDENT MEDIA LABEL<br/>EST. 2024</small></div><div className="manifesto-wordmark"><span>AMATEUR</span><strong>WINS.</strong></div><div className="manifesto-copy"><span>WE BELIEVE IN REAL PEOPLE.<br/>IN IMPERFECT MOMENTS.<br/>IN UNTOLD STORIES.</span><p>Amateur isn't a limitation.<br/>It's a movement.</p><b>AMATEUR WINS.</b></div><div className="manifesto-contact">{performers.slice(0, 9).map((item, index) => <Image key={item.id || item.slug || index} record={item} alt=""/>)}<span>SAME GUYS.<br/>DIFFERENT STORIES.</span></div></section>; }
function EarnPoster({ record }) { return <section className="earn-poster public-main"><div className="earn-image"><Image record={record || {}} alt=""/><span className="earn-image-note">YOUR STORY<br/>BELONGS<br/>HERE.</span><RecBadge/></div><div className="earn-copy"><span className="poster-kicker">OPEN CALL</span><h2>YOU DON'T NEED A STUDIO.</h2><p>REAL GUYS. REAL PHONES. REAL OPPORTUNITY.<br/>CREATE ON YOUR TERMS AND GET PAID.</p><strong>EARN UP TO $1 PER APPROVED MINUTE.</strong><div className="earn-actions"><a className="raw-button raw-button-red" href="https://earn.fleshlab.online">BECOME A CREATOR →</a><a className="raw-button earn-learn-more" href="https://earn.fleshlab.online">LEARN MORE →</a></div></div><div className="public-earn-steps"><span><i aria-hidden="true">▧</i> SHOOT ON YOUR PHONE</span><span><i aria-hidden="true">↥</i> UPLOAD YOUR CONTENT</span><span><i aria-hidden="true">$</i> EARN UP TO $1 / MINUTE</span><span><i aria-hidden="true">♧</i> KEEP YOUR CREATIVE CONTROL</span></div><div className="earn-brand-block"><div className="earn-brand-image"><Image record={record || {}} alt=""/><span>REAL CREATORS.<br/>REAL MOMENTS.<br/>REAL FREEDOM.</span></div><i className="earn-barcode" aria-hidden="true"/><strong>FL<sup>®</sup></strong><small>INDEPENDENT<br/>AMATEUR MEDIA<br/>ALWAYS REAL</small></div></section>; }

function BrandHome() {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { get('/homepage').then(setData).catch(e => setError(e.message)); }, []);
  const hero = data?.hero; const featured = data?.featured_videos || []; const performers = data?.featured_performers || [];
  const seoImage = hero?.image || imageFor(featured[0]);
  const seo = { title: 'FLESHLAB / AMATEUR WINS.', description: hero?.summary || 'Independent, creator-led media from FLESHLAB.', image: seoImage };
  return <Shell seo={seo}><main className="public-home">{error ? <div className="public-main public-state"><p className="error">{error}</p></div> : !data ? <div className="public-main public-state"><div className="public-empty">Loading the archive…</div></div> : <>
    <RawHero hero={hero} fallbackVideo={featured[0]}/>
    {data.sections?.featured_videos !== false && <section className="archive-section public-main"><SectionLabel number="01" title="LATEST FROM THE LAB" detail="NEW STORIES. FRESH PERSPECTIVES. ALWAYS REAL." action="VIEW ALL RELEASES" href="/v3/videos"/><div className="contact-sheet">{featured.slice(0, 5).map((item, index) => <TapeCard key={item.id || item.slug} video={item} index={index} featured={index === 0} homepage/>)}</div>{!featured.length && <div className="public-empty">No public tapes are available.</div>}</section>}
    {data.sections?.performers !== false && <section className="archive-section public-main"><SectionLabel number="02" title="PEOPLE OF" accent="FLESHLAB." detail="REAL GUYS. DIFFERENT PLACES. SAME ENERGY." action="VIEW ALL PEOPLE" href="/v3/performers"/><div className="people-sheet">{performers.slice(0, 6).map((item, index) => <PerformerSheet key={item.id || item.slug} performer={item} index={index}/>)}<div className="people-note">DIFFERENT<br/>BACKGROUNDS.<br/>REAL PEOPLE.<br/>SAME FREEDOM.<span>↗</span></div></div>{!performers.length && <div className="public-empty">No public performer files are available.</div>}</section>}
    <BrandStatement performers={performers}/>
    {data.sections?.creator_cta !== false && (
      <EarnPoster record={performers[0] || featured[0] || hero?.record}/>
    )}
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
