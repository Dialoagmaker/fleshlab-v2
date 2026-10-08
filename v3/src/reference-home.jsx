import React from 'react';
import asiaLogo from './assets/labels/asia_Transparent.png';
import asiaBrandMotif from './assets/labels/fleshlab-asia-brand-motif.png';
import twinksGlobalLogo from './assets/labels/twinkglobal_transparent.png';
import twinksGlobalBrandMotif from './assets/labels/fleshlab-twinks-global-brand-motif.png';
import barebackTwinksLogo from './assets/labels/barebacktwinks_transparent.png';
import barebackTwinksBrandMotif from './assets/labels/fleshlab-bareback-twinks-brand-motif.png';
import zedStoryBefore from './assets/reference/zed-start.png';
import zedStoryJourney from './assets/reference/journey.png';
import zedStoryProduction from './assets/reference/production.png';
import zedStoryNext from './assets/reference/after.png';
import './reference-home.css';

const imageValue = record => record?.thumbnail_url || record?.poster_url || record?.profile_image_url || record?.cover_image_url || record?.legacy_cover_image_url || record?.legacy_profile_image_url || record?.legacy_logo_url || record?.cover_asset_reference || record?.trailer_url || '';
const hrefForVideo = record => record?.slug ? `/v3/videos/${encodeURIComponent(record.slug)}` : '/v3/videos';
const hrefForPerformer = record => record?.slug ? `/v3/performers/${encodeURIComponent(record.slug)}` : '/v3/performers';
const hrefForBrand = record => record?.slug ? `/v3/brands/${encodeURIComponent(record.slug)}` : '/v3/brands';
const runtime = value => {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const price = option => `${String(option?.currency || 'USD').toUpperCase() === 'USD' ? '$' : `${String(option?.currency || 'USD').toUpperCase()} `}${(Number(option?.amount_minor || 0) / 100).toFixed(2)}`;
const period = option => option?.interval === 'year' ? '/ YEAR' : option?.interval === 'month' ? '/ MONTH' : '';
const recordTitle = record => record?.editorial_title || record?.public_title || record?.short_title || record?.homepage_title || record?.title || record?.display_name || record?.name || 'FLESHLAB';
const APPROVED_MEDIA = Object.freeze({
  hero: 'https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/video_2023-07-07_14-15-12.jpg',
  recruitment: 'https://video.fleshlab.online/performers/yero/profile.jpg',
  fanclub: 'https://video.fleshlab.online/performers/jameson/profile.png',
  membership: 'https://video.fleshlab.online/studios/unassigned/thumbnails/949c1165-bd44-4120-a943-93fff3c612e9-thumb-1781765305852.jpg',
  storyBefore: 'https://video.fleshlab.online/performers/zed/profile.jpg',
  storyJourney: 'https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/rentagay-bareback-twinks/thumbnails/00212211.jpg',
  storyProduction: 'https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/video_2025-08-14_05-20-41.jpg',
  storyAfter: 'https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/document_6321350149201201671.jpg',
  storyNext: 'https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/video_2023-07-06_15-03-44.jpg'
});
const APPROVED_LATEST_SLUGS = [
  'pinoy-muscle-twink-jerks-his-hard-cock-until-a-stranger-takes-over',
  'pinoy-muscle-twink-jerks-of-after-work-out',
  'outdoor-hookup-asian-twink-sucks-cock-for-quick-dirty-money'
];
const APPROVED_LATEST_THUMBNAILS = {
  'pinoy-muscle-twink-jerks-his-hard-cock-until-a-stranger-takes-over': 'https://video.fleshlab.online/studios/unassigned/thumbnails/1c2d03ed-a197-4573-a2d0-80f1edc862cd-thumb-1783166910402.jpg',
  'pinoy-muscle-twink-jerks-of-after-work-out': APPROVED_MEDIA.membership,
  'outdoor-hookup-asian-twink-sucks-cock-for-quick-dirty-money': 'https://video.fleshlab.online/studios/unassigned/thumbnails/a7b96ba9-3523-44d8-83cd-447f7481f08f-thumb-1781956376387.jpg'
};
const APPROVED_STORY_CARDS = [
  { slug: 'zed', title: 'ZE[D] / BEFORE', thumbnail_url: zedStoryBefore, objectPosition: '50% 42%' },
  { slug: 'ze-d-twink-bareback-shower', title: 'ZE[D] / THE JOURNEY', thumbnail_url: zedStoryJourney, objectPosition: '50% 58%' },
  { slug: 'ze-d-asian-shower-cumshot', title: 'ZE[D] / THE PRODUCTION', thumbnail_url: zedStoryProduction, objectPosition: '50% 32%' },
  { slug: 'watch-this-hot-asian-twink-guy-get-clean-and-play-with-his-lathered-body', title: 'ZE[D] / AFTER', thumbnail_url: APPROVED_MEDIA.storyAfter, objectPosition: '50% 50%' },
  { slug: 'asian-man-fingers-himself-while-jerking-off-brazenly', title: "ZE[D] / WHAT'S NEXT", thumbnail_url: zedStoryNext, objectPosition: '50% 50%' }
];
const APPROVED_RECRUITMENT_PERFORMER = { slug: 'yero', display_name: 'Yero', profile_image_url: APPROVED_MEDIA.recruitment };
const APPROVED_STORY_PERFORMER = { slug: 'zed', display_name: 'ZE[D]', profile_image_url: APPROVED_MEDIA.storyBefore };
const APPROVED_FANCLUB_PERFORMER = { slug: 'jameson', display_name: 'Jameson', profile_image_url: APPROVED_MEDIA.fanclub };
const labelAsset = slug => ({
  fleshlabasia: { logo: asiaLogo, motif: asiaBrandMotif },
  'fleshlab-twinks-global': { logo: twinksGlobalLogo, motif: twinksGlobalBrandMotif },
  'fleshlab-bareback-twinks': { logo: barebackTwinksLogo, motif: barebackTwinksBrandMotif }
}[slug] || null);
const labelDisplay = slug => ({
  fleshlabasia: ['FLESHLAB', 'ASIA'],
  'fleshlab-bareback-twinks': ['BAREBACK', 'TWINKS'],
  'fleshlab-twinks-global': ['GLOBAL', 'TWINKS']
}[slug] || null);

function ReferenceMedia({ record, alt = '', eager = false, className = '', objectPosition = '' }) {
  const src = imageValue(record);
  return <div className={`reference-media ${className}`} data-reference-media={src}>{src ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} style={objectPosition ? { objectPosition } : undefined}/> : <span className="reference-media-empty">NO IMAGE / FLESHLAB</span>}</div>;
}

function ReferenceIcon({ type }) {
  if (type === 'user') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.6-3.4 3.2-5.4 7.5-5.4s6.9 2 7.5 5.4"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2"/><path d="m16 16 4.2 4.2"/></svg>;
}

function ReferenceFeatureIcon({ type }) {
  const paths = {
    management: <><rect x="4" y="7" width="16" height="12" rx="1"/><path d="M9 7V5h6v2M8 12h8M12 12v3"/></>,
    training: <><path d="m3 9 9-4 9 4-9 4-9-4Z"/><path d="M7 11v5c2.5 2 7.5 2 10 0v-5M21 9v6"/></>,
    secure: <><rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    opportunities: <><path d="m12 3 2.8 5.6 6.2.9-4.5 4.3 1.1 6.1-5.6-2.9-5.6 2.9 1.1-6.1L3 9.5l6.2-.9L12 3Z"/></>,
    photos: <><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M8 5 9 3h6l1 2"/></>,
    updates: <><path d="M5 7h14v12H5zM8 3v4M16 3v4M5 10h14"/></>,
    interaction: <><path d="M5 5h14v10H9l-4 4V5Z"/><circle cx="9" cy="10" r=".7"/><circle cx="12" cy="10" r=".7"/><circle cx="15" cy="10" r=".7"/></>,
    live: <><rect x="4" y="6" width="16" height="12" rx="2"/><path d="m10 9 5 3-5 3V9Z"/></>
  };
  return <svg className="reference-feature-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[type] || paths.opportunities}</svg>;
}

export function ReferenceHeader({ creatorHub = '/v3/become-a-creator' }) {
  const links = [
    ['HOME', '/v3/home'],
    ['PERFORMERS', '/v3/performers'],
    ['LABELS', '/v3/brands'],
    ['VIDEOS', '/v3/videos'],
    ['SERIES', '/v3/collections'],
    ['FANCLUBS', '#fanclubs'],
    ['BECOME A PERFORMER', creatorHub]
  ];
  return <header className="reference-nav">
    <div className="reference-nav-inner">
      <a className="reference-wordmark" href="/v3/home" aria-label="FLESHLAB home"><span>FLESH<span>LAB</span></span><small>MORE THAN JUST AN ACT</small></a>
      <nav className="reference-nav-links" aria-label="FLESHLAB homepage navigation">{links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav>
      <div className="reference-nav-actions"><a className="reference-nav-icon" href="/v3/videos#search-videos" aria-label="Search the FLESHLAB archive"><ReferenceIcon type="search"/></a><a className="reference-nav-icon" href="https://performer.fleshlab.online" aria-label="Open account"><ReferenceIcon type="user"/></a><a className="reference-join" href={creatorHub}>JOIN NOW <span>↗</span></a></div>
      <details className="reference-nav-mobile"><summary aria-label="Open public navigation"><span>MENU</span><b>+</b></summary><div>{links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}<a className="reference-join" href={creatorHub}>JOIN NOW <span>↗</span></a></div></details>
    </div>
  </header>;
}

function ReferenceHero({ hero, fallbackVideo, performer, heroMedia, creatorHub }) {
  const record = hero?.record || fallbackVideo || {};
  const performerRecord = performer || (record?.display_name ? record : null);
  const preferredHeroImage = heroMedia?.thumbnail_url || heroMedia?.poster_url || hero?.image || imageValue(record);
  const heroVisual = preferredHeroImage
    ? { thumbnail_url: preferredHeroImage }
    : performerRecord;
  const heroSubject = heroMedia?.performers?.[0]?.name || heroMedia?.performers?.[0]?.display_name || record?.performers?.[0]?.name || record?.performers?.[0]?.display_name || (heroVisual === performerRecord ? performerRecord?.display_name : 'FLESHLAB');
  return <section className="reference-hero">
    <div className="reference-hero-main">
      <ReferenceMedia record={heroVisual} alt={`FLESHLAB media featuring ${heroSubject}`} eager className="reference-hero-image" objectPosition="67% 24%"/>
      <div className="reference-hero-overlay"/>
      <div className="reference-amateur-wins" aria-label="Amateur Wins"><span>Amateur</span><span>Wins.</span></div>
      <div className="reference-hero-copy"><span className="reference-hero-eyebrow">REAL PEOPLE. REAL STORIES.</span><h1><span>MORE THAN</span><span>JUST <em>AN ACT.</em></span></h1><p>FLESHLAB is the home for authentic creators, bold performers and curious fans. Real lives. Exclusive content. A community that goes deeper.</p><div className="reference-hero-actions"><a className="reference-button reference-button-pink" href="/v3/performers">EXPLORE OUR CREATORS <span>→</span></a><a className="reference-button reference-button-outline" href="/v3/videos">WATCH TRAILER <span>▷</span></a></div></div>
      <div className="reference-hero-meta"><span>18+ / FLESHLAB</span><span>{heroSubject}</span></div>
    </div>
    <aside className="reference-hero-side"><ReferenceMedia record={performerRecord || record} alt={performerRecord ? `FLESHLAB performer ${performerRecord.display_name}` : 'FLESHLAB creator'} eager className="reference-hero-side-image" objectPosition="50% 18%"/><div className="reference-hero-side-overlay"/><div className="reference-hero-side-copy"><h2>BECOME A<br/>FLESHLAB <em>PERFORMER.</em></h2><p>Turn your story into something real. Get professional support, great production opportunities and real income.</p><a className="reference-button reference-button-pink" href={creatorHub}>WRITE YOUR OWN STORY <span>→</span></a><ul className="reference-hero-benefits"><li><ReferenceFeatureIcon type="management"/><span>Professional<br/>management</span></li><li><ReferenceFeatureIcon type="training"/><span>Training &amp;<br/>support</span></li><li><ReferenceFeatureIcon type="secure"/><span>Secure<br/>&amp; private</span></li><li><ReferenceFeatureIcon type="opportunities"/><span>Real<br/>opportunities</span></li></ul></div></aside>
  </section>;
}

function ReferenceStoryCard({ video, visualRecord, objectPosition, performer, index }) {
  if (!video) return null;
  const chapters = ['BEFORE', 'THE JOURNEY', 'THE PRODUCTION', 'AFTER', "WHAT'S NEXT"];
  const descriptions = ['Before the production.', 'Getting ready for the shoot.', 'Behind the scenes.', 'After the production.', `More from ${performer?.display_name || 'FLESHLAB'}.`];
  return <a className="reference-story-card" href={hrefForVideo(video)}><ReferenceMedia record={visualRecord || video} alt="FLESHLAB editorial story image" eager={index === 0} objectPosition={objectPosition}/><div className="reference-card-shade"/><span className="reference-card-index">0{index + 1}</span><div className="reference-story-caption"><strong>{index + 1}. {chapters[index] || 'STORY'}</strong><small>{descriptions[index]}</small><span>{runtime(video.full_duration_seconds ?? video.duration_seconds) || 'PUBLIC VIDEO'}</span></div><span className="reference-story-arrow">↗</span></a>;
}

function ReferenceStory({ performer, fanclubPerformer, cards }) {
  const name = performer?.display_name || 'THE PEOPLE';
  return <section className="reference-story-row" aria-labelledby="reference-story-heading"><div className="reference-story-main"><div className="reference-section-head"><div><h2 id="reference-story-heading">MEET {name.toUpperCase()}. <em>MORE THAN A SCENE.</em></h2></div><a href={hrefForPerformer(performer)}>VIEW FULL PROFILE <span>↗</span></a></div><div className="reference-story-grid">{cards.slice(0, 5).map(({ video, visualRecord, objectPosition }, index) => <ReferenceStoryCard key={video.id || video.slug || index} video={video} visualRecord={visualRecord} objectPosition={objectPosition} performer={performer} index={index}/>)}</div>{!cards.length && <p className="reference-empty-note">Public story content is not currently available.</p>}</div><ReferenceFanclub performer={fanclubPerformer}/></section>;
}

function ReferenceFanclub({ performer }) {
  const name = performer?.display_name || 'THIS PERFORMER';
  return <aside id="fanclubs" className="reference-fanclub"><div className="reference-fanclub-head"><h2>FANCLUBS. <em>GET CLOSER.</em></h2><a href="#fanclubs">VIEW ALL FANCLUBS <span>↗</span></a></div><div className="reference-fanclub-body"><ReferenceMedia record={performer} alt={performer ? `FLESHLAB performer ${performer.display_name}` : 'FLESHLAB performer'} eager className="reference-fanclub-image" objectPosition="50% 14%"/><div className="reference-fanclub-copy"><ul><li><ReferenceFeatureIcon type="photos"/><span>Exclusive photos &amp; videos</span></li><li><ReferenceFeatureIcon type="updates"/><span>Personal updates</span></li><li><ReferenceFeatureIcon type="interaction"/><span>Direct interaction</span></li><li><ReferenceFeatureIcon type="live"/><span>Special live streams</span></li></ul><a className="reference-button reference-button-pink" href={hrefForPerformer(performer)}>JOIN {name.toUpperCase()}'S FANCLUB <span>→</span></a></div></div></aside>;
}

function ReferenceLabelCard({ brand, index }) {
  const asset = labelAsset(brand?.slug);
  const display = labelDisplay(brand?.slug) || [brand?.name || 'FLESHLAB'];
  return <a className="reference-label-card" href={hrefForBrand(brand)}><div className="reference-label-art">{asset?.motif ? <img src={asset.motif} alt={`${brand.name} label artwork`}/> : <ReferenceMedia record={brand} alt={`${brand?.name || 'FLESHLAB'} label artwork`}/>}<div className="reference-card-shade"/><span className="reference-card-index">0{index + 1} / LABEL</span><div className="reference-label-copy"><strong>{display[0]}<em>{display[1] ? <><br/>{display[1]}</> : null}</em></strong><small>{brand?.description || 'FLESHLAB label archive.'}</small></div><span className="reference-label-arrow">↗</span>{asset?.logo ? <img className="reference-label-logo" src={asset.logo} alt={`${brand.name} logo`}/> : null}</div></a>;
}

function ReferenceVideoCard({ video, index }) {
  return <a className="reference-video-card" href={hrefForVideo(video)}><ReferenceMedia record={video} alt={recordTitle(video)} eager={index === 0}/><span className="reference-video-play">▶</span>{runtime(video?.full_duration_seconds ?? video?.duration_seconds) && <span className="reference-video-duration">{runtime(video?.full_duration_seconds ?? video?.duration_seconds)}</span>}<div className="reference-video-copy"><span>{video?.brand_name || video?.performers?.[0]?.name || 'FLESHLAB'}</span><strong>{recordTitle(video)}</strong></div></a>;
}

function ReferenceEditorialRow({ brands, videos }) {
  return <section className="reference-editorial-row"><div className="reference-labels"><div className="reference-section-head"><div><h2>OUR LABELS. <em>DIFFERENT WORLDS. SAME PASSION.</em></h2></div><a href="/v3/brands">EXPLORE ALL LABELS <span>↗</span></a></div><div className="reference-label-grid">{brands.slice(0, 3).map((brand, index) => <ReferenceLabelCard key={brand.id || brand.slug || index} brand={brand} index={index}/>)}{!brands.length && <p className="reference-empty-note">Public labels are not currently available.</p>}</div></div><div className="reference-latest"><div className="reference-section-head"><div><h2>LATEST <em>VIDEOS.</em></h2></div><a href="/v3/videos">VIEW ALL VIDEOS <span>↗</span></a></div><div className="reference-video-grid">{videos.slice(0, 3).map((video, index) => <ReferenceVideoCard key={video.id || video.slug || index} video={video} index={index}/>)}{!videos.length && <p className="reference-empty-note">Published videos are not currently available.</p>}</div></div></section>;
}

function ReferenceMembership({ offers, creatorHub, background }) {
  return <section className="reference-membership"><ReferenceMedia record={background} alt="" className="reference-membership-media" objectPosition="50% 50%"/><div className="reference-membership-overlay"/><div className="reference-membership-intro"><span className="reference-membership-label">MEMBERSHIP PLANS.</span><h2>MORE OF <em>WHAT YOU LOVE.</em></h2><p>Choose from the active FLESHLAB membership offers and keep following the stories that matter to you.</p><a className="reference-button reference-button-pink" href="/v3/pricing">COMPARE MEMBERSHIP <span>↗</span></a></div><div className="reference-membership-grid">{offers.length ? offers.map((offer, index) => <a className={`reference-plan-card${offer?.popular || offer?.is_popular ? ' is-popular' : ''}`} key={offer.id || offer.plan_key || index} href={offer.href || '/v3/pricing'}><span className="reference-plan-index">0{index + 1}</span><strong>{offer.name || offer.title || offer.plan_key || 'FLESHLAB MEMBERSHIP'}</strong><b>{price(offer)} <small>{period(offer)}</small></b><p>{offer.description || 'Active FLESHLAB access for the current plan period.'}</p><span className="reference-plan-link">SELECT PLAN <b>↗</b></span></a>) : <div className="reference-membership-empty"><div className="reference-empty-offer-copy"><span>MEMBERSHIP</span><strong>COMING SOON</strong><small>Membership offers are not currently published.</small><a href="/v3/pricing">VIEW MEMBERSHIP INFO <b>↗</b></a></div></div>}</div></section>;
}

export function ReferenceHome({ data, performerProfile = null, brands = [], offers = [], creatorHub = '/v3/become-a-creator' }) {
  const featured = data?.featured_videos || [];
  const releases = data?.new_releases || [];
  const profileVideos = performerProfile?.videos || [];
  const allVideos = [...profileVideos, ...featured, ...releases].filter((item, index, list) => item && list.findIndex(other => (other.id || other.slug) === (item.id || item.slug)) === index);
  const findRealVideo = slug => allVideos.find(video => video?.slug === slug);
  const latestVideos = APPROVED_LATEST_SLUGS.map(slug => {
    const video = findRealVideo(slug);
    return video ? { ...video, thumbnail_url: APPROVED_LATEST_THUMBNAILS[slug] } : null;
  }).filter(Boolean);
  const heroMedia = { thumbnail_url: APPROVED_MEDIA.hero, performers: [{ name: 'ZE[D]', slug: 'zed' }] };
  const storyCards = APPROVED_STORY_CARDS.map(({ slug, title, thumbnail_url, objectPosition }) => ({
    video: { slug, title, performers: [{ name: 'ZE[D]', slug: 'zed' }] },
    visualRecord: { thumbnail_url },
    objectPosition
  }));
  const membershipBackground = { thumbnail_url: APPROVED_MEDIA.membership };
  const hero = data?.hero;
  return <main className="reference-home" data-performer-profile-loaded={performerProfile ? 'true' : 'false'}>
    <ReferenceHero hero={hero} fallbackVideo={allVideos[0]} performer={APPROVED_RECRUITMENT_PERFORMER} heroMedia={heroMedia} creatorHub={creatorHub}/>
    <ReferenceStory performer={APPROVED_STORY_PERFORMER} fanclubPerformer={APPROVED_FANCLUB_PERFORMER} cards={storyCards}/>
    <ReferenceEditorialRow brands={brands} videos={latestVideos}/>
    <ReferenceMembership offers={offers} creatorHub={creatorHub} background={membershipBackground}/>
  </main>;
}
