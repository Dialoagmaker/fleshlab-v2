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
const formatRuntime = value => {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};
const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';
const videoHref = video => video?.slug ? `/v3/videos/${encodeURIComponent(video.slug)}` : '/v3/videos';
const performerHref = performer => `/v3/performers/${encodeURIComponent(performer.slug)}`;
const collectionHref = collection => `/v3/collections/${encodeURIComponent(collection.slug)}`;

function Seo({ title, description, image }) {
  useEffect(() => {
    const canonical = `${window.location.origin}${window.location.pathname}`;
    document.title = title;
    [['name', 'description', description], ['property', 'og:title', title], ['property', 'og:description', description], ['property', 'og:image', publicImage(image)]].forEach(([attribute, name, content]) => {
      if (!content) return;
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        element.setAttribute('property', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', String(content).slice(0, 300));
    });
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
    let schema = document.head.querySelector('#fleshlab-public-schema');
    if (!schema) {
      schema = document.createElement('script');
      schema.id = 'fleshlab-public-schema';
      schema.type = 'application/ld+json';
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'FLESHLAB', url: canonical, description: String(description || '').slice(0, 300), ...(publicImage(image) ? { image: publicImage(image) } : {}) });
  }, [title, description, image]);
  return null;
}

function HomeNavigation() {
  const links = <><a href="/v3/home">Home</a><a href="/v3/videos">Videos</a><a href="/v3/performers">Performers</a><a href="/v3/collections">Collections</a><a href="/v3/brands">Brands</a></>;
  return <header className="public-nav">
    <a href="/v3/home" className="public-brand" aria-label="FLESHLAB home"><b>FLESH</b><span>LAB</span></a>
    <nav aria-label="Public navigation">{links}</nav>
    <div className="public-nav-actions"><a className="nav-search" href="/v3/videos#search-videos" aria-label="Search the FLESHLAB catalogue"><span aria-hidden="true"/></a><a className="nav-join" href="https://earn.fleshlab.online">Earn with FLESHLAB <span aria-hidden="true">↗</span></a></div>
    <details className="public-mobile-nav"><summary aria-label="Open public navigation"><span>Menu</span><i aria-hidden="true">+</i></summary><div aria-label="Mobile public navigation">{links}<a className="nav-search-mobile" href="/v3/videos#search-videos">Search catalogue</a><a className="nav-join" href="https://earn.fleshlab.online">Earn with FLESHLAB ↗</a></div></details>
  </header>;
}

function HomeFooter() {
  return <footer className="public-footer">
    <div className="footer-brand"><a className="public-brand" href="/v3/home"><b>FLESH</b><span>LAB</span></a><p>Independent, creator-led films.</p></div>
    <div><span className="footer-label">Browse</span><div className="footer-links"><a href="/v3/videos">Videos</a><a href="/v3/performers">Performers</a><a href="/v3/collections">Collections</a><a href="/v3/brands">Brands</a></div></div>
    <div><span className="footer-label">Create</span><div className="footer-links"><a href="https://earn.fleshlab.online">Earn with FLESHLAB ↗</a><a href="https://performer.fleshlab.online">Performer login ↗</a></div></div>
    <div><span className="footer-label">Company</span><div className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/compliance">Legal</a><a href="mailto:studiosupport@fleshlab.online">Contact</a></div></div>
    <small className="footer-copyright">© {new Date().getFullYear()} FLESHLAB. Published catalogue only.</small>
  </footer>;
}

function Shell({ children, seo = {} }) {
  return <div className="public-shell"><Seo title={seo.title || 'FLESHLAB | Independent creator studio'} description={seo.description || 'Creator-led films from FLESHLAB.'} image={seo.image}/><HomeNavigation/>{children}<HomeFooter/></div>;
}

function Image({ record = {}, alt = '', eager = false, className = '', position }) {
  const src = imageFor(record);
  return <div className={`public-image ${className}`}>{src ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} {...(eager ? { fetchPriority: 'high' } : {})} style={position ? { objectPosition: position } : undefined}/> : <span className="image-fallback">FLESHLAB</span>}</div>;
}

function VideoMeta({ video, featured = false }) {
  const people = video.performers?.map(item => item.name).filter(Boolean).join(' · ');
  const facts = [people || video.brand_name || 'FLESHLAB original', formatRuntime(video.duration_seconds || video.runtime_seconds), formatDate(video.release_date || video.published_at)].filter(Boolean);
  return <div className="content-meta"><strong>{esc(video.title)}</strong><small>{facts.join('  · ')}</small>{featured && <span className="content-action">Watch now <b aria-hidden="true">↗</b></span>}</div>;
}

function ContentCard({ video, featured = false, position }) {
  return <a className={`content-card${featured ? ' content-card-featured' : ''}`} href={videoHref(video)} aria-label={`Open ${labelFor(video)}`}>
    <Image record={video} alt={labelFor(video)} eager={featured}/>
    <div className="content-shade"/><div className="content-topline"><span>{position ? String(position).padStart(2, '0') : '01'}</span>{featured && <em>Featured</em>}</div>
    <div className="content-overlay"><VideoMeta video={video} featured={featured}/></div>
  </a>;
}

function SectionHeading({ title, action, href }) {
  return <div className="section-heading"><h2>{title}</h2>{href && <a href={href}>{action || 'View all'} <span aria-hidden="true">→</span></a>}</div>;
}

function HomeHero({ hero, fallbackVideo }) {
  const record = hero?.record || fallbackVideo || {};
  const image = hero?.image || imageFor(record);
  const runtime = formatRuntime(record.duration_seconds || record.runtime_seconds);
  const people = record.performers?.map(item => item.name).filter(Boolean).join(' · ');
  const target = hero?.cta_target || videoHref(record);
  return <section className="home-hero">
    <div className="hero-media"><Image record={{ thumbnail_url: image }} alt="" eager position="center center"/></div><div className="hero-overlay"/>
    <div className="hero-inner public-main">
      <div className="hero-copy"><span className="hero-kicker">{esc(hero?.eyebrow || 'FLESHLAB ORIGINAL')}</span><h1>{esc(hero?.title || 'Real people. Real stories.')}</h1><p>{esc(hero?.summary || 'Creator-led films, real chemistry and a catalogue made to be explored.')}</p><div className="hero-meta">{people && <span>{esc(people)}</span>}{runtime && <span>{runtime}</span>}{record.release_date && <span>{new Date(record.release_date).getFullYear()}</span>}</div><div className="hero-actions"><a className="button button-primary" href={target}>{esc(hero?.cta_label || 'Watch now')} <span aria-hidden="true">→</span></a><a className="button button-secondary" href={record.slug ? videoHref(record) : '/v3/videos'}>More info <span aria-hidden="true">i</span></a></div></div>
    </div><div className="hero-scrollline"><span>Scroll to browse</span><i/></div>
  </section>;
}

function PerformerCard({ performer }) {
  return <a className="performer-tile" href={performerHref(performer)}><Image record={performer} alt={`Portrait of ${performer.display_name}`}/><div className="performer-shade"/><div className="performer-info"><strong>{esc(performer.display_name)}</strong><small>{performer.video_count != null ? `${performer.video_count} videos` : 'View profile'} <span aria-hidden="true">→</span></small></div></a>;
}

function CollectionFeature({ collection, fallbackRecord }) {
  const imageRecord = { ...(fallbackRecord || {}), cover_asset_reference: collection.cover_asset_reference, legacy_cover_image_url: collection.legacy_cover_image_url };
  return <a className="collection-feature" href={collectionHref(collection)}><Image record={imageRecord} alt={collection.title}/><div className="collection-shade"/><div className="collection-info"><small>COLLECTION · {collection.video_count || 0} VIDEOS</small><h3>{esc(collection.title)}</h3><p>{esc(collection.description || 'A curated FLESHLAB selection.')}</p><span>Explore collection <b aria-hidden="true">→</b></span></div></a>;
}

function BrandHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { get('/homepage').then(setData).catch(e => setError(e.message)); }, []);
  const hero = data?.hero;
  const featured = data?.featured_videos || [];
  const releases = data?.new_releases || [];
  const performers = data?.featured_performers || [];
  const collections = data?.featured_collections || [];
  const seoImage = hero?.image || imageFor(featured[0]);
  const seo = { title: hero?.title ? `${hero.title} | FLESHLAB` : 'FLESHLAB | Premium creator-led films', description: hero?.summary || 'Premium creator-led films, real chemistry and stories worth watching.', image: seoImage };
  return <Shell seo={seo}><main className="public-home">{error ? <div className="public-main public-state"><p className="error">{error}</p></div> : !data ? <div className="public-main public-state"><div className="public-empty">Loading the catalogue…</div></div> : <>
    <HomeHero hero={hero} fallbackVideo={featured[0]}/>
    {data.sections?.featured_videos !== false && <section className="home-section public-main"><SectionHeading title="Featured now" action="View all" href="/v3/videos"/><div className="featured-grid">{featured.slice(0, 5).map((item, index) => <ContentCard key={item.id || item.slug} video={item} featured={index === 0} position={index + 1}/>)}</div>{!featured.length && <div className="public-empty">Published films will appear here.</div>}</section>}
    {data.sections?.new_releases !== false && <section className="home-section home-section-dark public-main"><SectionHeading title="New releases" action="See all" href="/v3/videos"/><div className="content-rail">{releases.slice(0, 8).map((item, index) => <ContentCard key={item.id || item.slug} video={item} position={index + 1}/>)}</div>{!releases.length && <div className="public-empty">No new releases are available yet.</div>}</section>}
    {data.sections?.performers !== false && <section className="home-section public-main"><SectionHeading title="Performers" action="View all" href="/v3/performers"/><div className="performer-rail">{performers.slice(0, 6).map(item => <PerformerCard key={item.id || item.slug} performer={item}/>)}</div>{!performers.length && <div className="public-empty">Public performer profiles will appear here.</div>}</section>}
    {data.sections?.collections !== false && collections.length > 0 && <section className="home-section home-section-dark public-main"><SectionHeading title="Collections" action="View all" href="/v3/collections"/><div className="collection-layout">{collections.length === 1 ? <CollectionFeature collection={collections[0]} fallbackRecord={featured[0]}/> : collections.slice(0, 3).map(item => <CollectionFeature key={item.id || item.slug} collection={item}/>)}</div></section>}
    {data.sections?.creator_cta !== false && <section className="creator-band public-main"><div><small>CREATE WITH FLESHLAB</small><h2>Put your work<br/>in the frame.</h2><p>Submit original content and earn from approved footage.</p></div><a className="button button-primary" href="https://earn.fleshlab.online">Start earning <span aria-hidden="true">→</span></a></section>}
    <section className="browse-band public-main"><div><small>THE FLESHLAB CATALOGUE</small><h2>Find your next watch.</h2></div><a className="button button-secondary" href="/v3/videos#search-videos">Search videos <span aria-hidden="true">⌕</span></a></section>
  </>}</main></Shell>;
}

function Card({ video }) { return <a className="public-simple-card" href={videoHref(video)}><Image record={video} alt={labelFor(video)}/><div className="public-card-meta"><b>{esc(video.title)}</b><small>{video.performers?.map(item => item.name).filter(Boolean).join(' · ') || video.brand_name || 'FLESHLAB original'}{formatRuntime(video.duration_seconds) ? ` · ${formatRuntime(video.duration_seconds)}` : ''}</small></div></a>; }
function Grid({ records = [], empty = 'No published records are available.' }) { return records.length ? <div className="public-simple-grid">{records.map(item => <Card video={item} key={item.id || item.slug}/>)}</div> : <div className="public-empty">{empty}</div>; }
function ListingEntity({ item, kind }) { return <a className="public-entity" href={`/v3/${kind}/${encodeURIComponent(item.slug)}`}><Image record={item} alt={item.display_name || item.name}/><span className="entity-type">{kind.slice(0, -1)}</span><h3>{item.display_name || item.name}</h3><small>{item.video_count ? `${item.video_count} published videos` : item.nationality || item.slug}</small></a>; }
function Listing({ kind }) { const [data, setData] = useState(null); const [q, setQ] = useState(''); const [error, setError] = useState(''); const load = () => get(`/${kind}?q=${encodeURIComponent(q)}&limit=24`).then(setData).catch(e => setError(e.message)); useEffect(load, []); const records = data?.records || []; const label = kind === 'videos' ? 'Videos' : kind === 'performers' ? 'Performers' : 'Brands'; return <Shell seo={{ title: `${label} | FLESHLAB`, description: `Browse published FLESHLAB ${label.toLowerCase()}.` }}><main className="public-main public-listing"><section className="public-title"><span className="entity-type">FLESHLAB / {kind.toUpperCase()}</span><h1>{kind === 'videos' ? 'Published films' : kind === 'performers' ? 'Performers' : 'Brands'}</h1><p>Explore the public FLESHLAB catalogue.</p></section><div className="public-search"><label className="sr-only" htmlFor={`search-${kind}`}>Search {kind}</label><input id={`search-${kind}`} value={q} onChange={event => setQ(event.target.value)} onKeyDown={event => event.key === 'Enter' && load()} placeholder={`Search ${kind}`} /><button onClick={load}>Search</button></div>{error ? <p className="error">{error}</p> : kind === 'videos' ? <Grid records={records}/> : <div className="public-entity-grid">{records.length ? records.map(item => <ListingEntity key={item.id} item={item} kind={kind}/>) : <div className="public-empty">No published records are available.</div>}</div>}</main></Shell>; }
function Detail({ kind, slug }) { const [data, setData] = useState(null); const [error, setError] = useState(''); useEffect(() => { get(`/${kind}/${encodeURIComponent(slug)}`).then(setData).catch(e => setError(e.message)); }, [kind, slug]); if (error) return <Shell seo={{ title: 'Not found | FLESHLAB', description: 'The requested public record was not found.' }}><main className="public-main public-state"><div className="public-empty">{error}</div></main></Shell>; if (!data) return <Shell seo={{ title: 'Loading | FLESHLAB', description: 'Loading the public FLESHLAB record.' }}><main className="public-main public-state"><div className="public-empty">Loading catalogue record…</div></main></Shell>; const record = data.record; const video = kind === 'videos'; const title = record.title || record.display_name || record.name; const description = record.description || record.bio || 'Published FLESHLAB catalogue record.'; const image = publicImage(data.assets?.find(asset => asset.type === 'thumbnail')?.url || data.assets?.find(asset => asset.type === 'trailer')?.url || imageFor(record)); return <Shell seo={{ title: `${title} | FLESHLAB`, description, image }}><main className="public-main public-detail"><span className="entity-type">FLESHLAB / {kind.slice(0, -1).toUpperCase()}</span><h1>{title}</h1><p className="public-lede">{description}</p>{video && <div className="detail-stage">{image ? <img src={image} alt={title}/> : <span>MEDIA PREVIEW</span>}</div>}{!video && <section className="detail-section"><SectionHeading title="Published content"/><Grid records={data.videos}/></section>}{video && <><div className="detail-facts"><span>{record.brand_name || 'FLESHLAB'}</span><span>{record.performers?.map(item => item.name).join(' · ') || 'Uncredited'}</span><span>{record.release_date || 'Published catalogue'}</span></div><section className="detail-section"><SectionHeading title="More from the library"/><Grid records={data.related}/></section></>}</main></Shell>; }
function Collection({ slug }) { const [data, setData] = useState(null); const [error, setError] = useState(''); useEffect(() => { get(`/collections/${encodeURIComponent(slug)}`).then(setData).catch(e => setError(e.message)); }, [slug]); const title = data?.record?.title || 'Collection'; const description = data?.record?.description || 'A curated FLESHLAB collection.'; return <Shell seo={{ title: `${title} | FLESHLAB`, description, image: data?.record?.cover_asset_reference }}><main className="public-main public-listing">{error ? <div className="public-state"><div className="public-empty">{error}</div></div> : !data ? <div className="public-state"><div className="public-empty">Loading collection…</div></div> : <><section className="public-title"><span className="entity-type">COLLECTION</span><h1>{data.record.title}</h1><p>{description}</p></section><Grid records={data.videos}/></>}</main></Shell>; }
function CollectionListing() { const [data, setData] = useState(null); const [error, setError] = useState(''); useEffect(() => { get('/collections').then(setData).catch(e => setError(e.message)); }, []); return <Shell seo={{ title: 'Collections | FLESHLAB', description: 'Curated public FLESHLAB collections.' }}><main className="public-main public-listing"><section className="public-title"><span className="entity-type">FLESHLAB / COLLECTIONS</span><h1>Collections</h1><p>Curated selections from the FLESHLAB catalogue.</p></section>{error ? <p className="error">{error}</p> : <div className="public-entity-grid">{data?.records?.map(item => <CollectionFeature key={item.id || item.slug} collection={item}/>)}</div>}</main></Shell>; }

export function PublicApp() { const path = window.location.pathname.replace(/^\/v3\/?/, ''); if (!path) return <BrandHome/>; const parts = path.split('/').filter(Boolean); if (parts[0] === 'home') return <BrandHome/>; if (parts[0] === 'catalogue') return <Listing kind="videos"/>; if (parts[0] === 'videos' && parts[1]) return <Detail kind="videos" slug={parts[1]}/>; if (parts[0] === 'performers' && parts[1]) return <Detail kind="performers" slug={parts[1]}/>; if (parts[0] === 'brands' && parts[1]) return <Detail kind="brands" slug={parts[1]}/>; if (parts[0] === 'collections' && parts[1]) return <Collection slug={parts[1]}/>; if (parts[0] === 'collections') return <CollectionListing/>; if (['videos', 'performers', 'brands'].includes(parts[0])) return <Listing kind={parts[0]}/>; return <BrandHome/>; }
