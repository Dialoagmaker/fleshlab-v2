import React, { useEffect, useRef, useState } from 'react';
import {
  buildBreadcrumbListJsonLd,
  buildOrganizationJsonLd,
  buildSeoMetadata,
  buildVideoObjectJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from '../../src/lib/seoMetadata.js';
import { canonicalUrl, isProduction } from '../../src/lib/seoConfig.js';
import './public.css';
import { ReferenceHeader, ReferenceHome } from './reference-home.jsx';
import FleshLabLogo from './FleshLabLogo.jsx';
import asiaLogo from './assets/labels/asia_Transparent.png';
import asiaLogoBlack from './assets/labels/asia_black.png';
import twinksGlobalLogo from './assets/labels/twinkglobal_transparent.png';
import twinksGlobalLogoBlack from './assets/labels/twinkglobal_Black.png';
import barebackTwinksLogo from './assets/labels/barebacktwinks_transparent.png';
import asiaBrandMotif from './assets/labels/fleshlab-asia-brand-motif.png';
import twinksGlobalBrandMotif from './assets/labels/fleshlab-twinks-global-brand-motif.png';
import barebackTwinksBrandMotif from './assets/labels/fleshlab-bareback-twinks-brand-motif.png';
import recruitmentHero from './assets/recruitment/creator-studio-group.png';
import recruitmentNewCreator from './assets/recruitment/new-creator-phone.png';
import recruitmentEstablished from './assets/recruitment/existing-creators-camera.png';
import recruitmentInternational from './assets/recruitment/international-creator-city.png';
import recruitmentGay from './assets/recruitment/gay-creators-studio.png';
import recruitmentLiveCam from './assets/recruitment/live-cam-streaming.png';
import recruitmentEscorts from './assets/recruitment/escorts-creator-path.png';
import recruitmentMalePerformer from './assets/recruitment/male-performer-fitness.png';
import recruitmentManagement from './assets/recruitment/creator-management.png';
import recruitmentDistribution from './assets/recruitment/content-distribution.png';
import recruitmentNewStory from './assets/recruitment/new-creators-process.png';
import recruitmentExistingStory from './assets/recruitment/existing-creators-shoot.png';
import recruitmentInternationalHero from './assets/recruitment/international-creators-hero.png';
import recruitmentInternationalStory from './assets/recruitment/international-creators-story.png';
import recruitmentGayStory from './assets/recruitment/gay-creators-story.png';
import recruitmentMalePerformerStory from './assets/recruitment/male-performers-story.png';
import recruitmentLiveCamStory from './assets/recruitment/live-cam-story.png';
import recruitmentEscortsStory from './assets/recruitment/escorts-story.png';
import recruitmentManagementStory from './assets/recruitment/creator-management-story.png';
import recruitmentDistributionStory from './assets/recruitment/content-distribution-story.png';
import recruitmentDistributionSecondary from './assets/recruitment/content-distribution-secondary.png';
import recruitmentFinalCreator from './assets/recruitment/final-creator-cta-v2.png';
import recruitmentEricPortrait from './assets/recruitment/eric-contact-portrait.png';
import fleshlabAmateurWins from './assets/brand/fleshlab-amateur-wins-approved.png';
import { PurchaseLibrary } from './purchase-library.jsx';
import { PaymentCheckout } from './public-payment.jsx';
import './chain2pay.css';
import './public-editorial.css';

const get = async path => {
  const response = await fetch(`/api/v3/public${path}`, { headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || 'This page is unavailable.');
  return data;
};

const esc = value => String(value || '').replace(/[<>]/g, '');
const publicImage = value => {
  const url = String(value || '').trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/api\/v3\/public\/media\/[0-9a-f-]{36}\/file$/i.test(url)) return url;
  return undefined;
};
const imageFor = (record = {}) => publicImage(record.thumbnail_url || record.poster_url || record.profile_image_url || record.cover_image_url || record.trailer_url || record.legacy_cover_image_url || record.legacy_profile_image_url || record.legacy_logo_url || record.cover_asset_reference);
const labelFor = record => record?.title || record?.display_name || record?.name || 'FLESHLAB';
const formatRuntime = value => { const seconds = Number(value); if (!Number.isFinite(seconds) || seconds <= 0) return ''; const whole = Math.floor(seconds); const hours = Math.floor(whole / 3600); const minutes = Math.floor((whole % 3600) / 60); const remainder = whole % 60; return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`; };
const fullDuration = video => video?.full_duration_seconds ?? video?.duration_seconds;
const formatPrice = option => `${String(option?.currency || 'USD').toUpperCase() === 'USD' ? '$' : `${String(option?.currency || 'USD').toUpperCase()} `}${(Number(option?.amount_minor || 0) / 100).toFixed(2)}`;
const intervalLabel = option => option?.interval === 'month' ? ' / MONTH' : option?.interval === 'year' ? ' / YEAR' : '';
const periodLabel = option => option?.interval === 'month' ? 'one month' : option?.interval === 'year' ? 'one year' : option?.interval === 'week' ? 'one week' : 'the plan period';
const membershipOption = options => options.find(option => option?.purchase_type === 'subscription' && (option.membership_included || !option.product_id));
const accessSummaryItems = video => { const options = Array.isArray(video?.access_options) ? video.access_options : []; const ppv = options.find(option => option?.purchase_type === 'ppv'); const membership = membershipOption(options); const state = video?.access_state || {}; const watch = state.full_access_owned || options.some(option => option?.label === 'WATCH NOW'); if (watch) return ['FULL ACCESS ACTIVE']; const items = []; if (state.free_preview || video?.trailer_url) items.push('FREE PREVIEW'); if (ppv) items.push(`${formatPrice(ppv)} PPV · ONE-TIME`); if (membership) items.push(`INCLUDED WITH MEMBERSHIP · ${formatPrice(membership)}${intervalLabel(membership)}`); else { const subscription = options.find(option => option?.purchase_type === 'subscription'); if (subscription) items.push(`SUBSCRIBE ${formatPrice(subscription)}${intervalLabel(subscription)} · VIDEO ACCESS`); } if (state.external_distribution || video?.external_distribution?.url) items.push('FAPHOUSE AVAILABLE'); return items.length ? items : ['ACCESS NOT CONFIGURED']; };
const videoDurationIso = value => { const seconds = Math.max(0, Math.round(Number(value) || 0)); if (!seconds) return undefined; const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const remainder = seconds % 60; return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${remainder ? `${remainder}S` : ''}`; };
const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';
const videoHref = video => video?.slug ? `/v3/videos/${encodeURIComponent(video.slug)}` : '/v3/videos';
const performerHref = performer => `/v3/performers/${encodeURIComponent(performer.slug)}`;
const collectionHref = collection => `/v3/collections/${encodeURIComponent(collection.slug)}`;
const performerPlace = performer => String(performer.public_location || performer.nationality || '').trim() || 'FLESHLAB';
const performerLabels = performer => Array.isArray(performer.labels) ? performer.labels.filter(label => label?.name) : [];
const LABEL_BRAND_ASSETS = Object.freeze({
  fleshlabasia: { logo: asiaLogo, darkLogo: asiaLogoBlack, motif: asiaBrandMotif, descriptor: 'Asian twinks. Real places. Always amateur.' },
  'fleshlab-twinks-global': { logo: twinksGlobalLogo, darkLogo: twinksGlobalLogoBlack, motif: twinksGlobalBrandMotif, descriptor: 'International twinks. Different faces. Same energy.' },
  'fleshlab-bareback-twinks': { logo: barebackTwinksLogo, motif: barebackTwinksBrandMotif, descriptor: 'Adult twinks. Real chemistry. Without condoms.' }
});
const brandAsset = brand => LABEL_BRAND_ASSETS[brand?.slug];
const brandDescriptor = brand => brandAsset(brand)?.descriptor || String(brand?.description || 'FLESHLAB label archive.').split('\n')[0];
const CREATOR_HUB = '/v3/become-a-creator';
const PUBLIC_CANONICAL_ORIGIN = 'https://fleshlab.online';
const applicationHref = journey => {
  const params = new URLSearchParams();
  if (journey) params.set('journey', journey);
  if (typeof window !== 'undefined') {
    const query = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(key => { const value = query.get(key); if (value) params.set(key, value); });
  }
  const query = params.toString();
  return `/v3/performer-application${query ? `?${query}` : ''}`;
};
const recruitmentContext = () => {
  const query = new URLSearchParams(window.location.search);
  const journey = String(query.get('journey') || '').replace(/[^a-z-]/g, '');
  return {
    landing_route: journey === 'hub' ? CREATOR_HUB : journey ? `${CREATOR_HUB}/${journey}` : (window.location.pathname.replace(/\/+$/, '') || '/v3'),
    route: window.location.pathname,
    utm_source: query.get('utm_source') || '', utm_medium: query.get('utm_medium') || '',
    utm_campaign: query.get('utm_campaign') || '', utm_content: query.get('utm_content') || '',
    referrer: document.referrer || ''
  };
};
const RECRUITMENT_MEDIA = Object.freeze({
  hub: recruitmentHero,
  'new-creators': recruitmentNewCreator,
  'existing-creators': recruitmentEstablished,
  'international-creators': recruitmentInternationalHero,
  'creator-management': recruitmentManagement,
  'content-distribution': recruitmentDistributionStory,
  'gay-creators': recruitmentGay,
  'male-performers': recruitmentMalePerformer,
  escorts: recruitmentEscorts,
  'live-cam': recruitmentLiveCam
});
const RECRUITMENT_IMAGE_ALT = Object.freeze({
  hub: 'Three clearly adult male creators, including East Asian, Southeast Asian and European-looking adults, filming smartphone content together in a modern apartment.',
  'new-creators': 'Clearly adult East Asian creator filming smartphone content in a bright apartment.',
  'existing-creators': 'Two clearly adult creators, one Southeast Asian and one European-looking, reviewing smartphone footage beside a pool.',
  'international-creators': 'Two clearly adult creators, one East Asian and one European-looking, relaxing together in a premium hotel apartment above an international city.',
  'gay-creators': 'Two clearly adult gay male creators, one East Asian and one mixed Asian-European, reviewing phone and camera footage together.',
  'male-performers': 'Clearly adult European-looking male performer making a confident creator portrait with a smartphone in a modern apartment.',
  'live-cam': 'Clearly adult Southeast Asian creator preparing a live stream beside a phone and ring light in a warm apartment.',
  escorts: 'Clearly adult East Asian creator considering an additional creator income path with a phone and tripod in a neutral apartment.',
  'creator-management': 'Two clearly adult creators, one East Asian and one European-looking, reviewing a phone and content plan with a trusted collaborator.',
  'content-distribution': 'Clearly adult mixed Asian-European creator reviewing approved smartphone footage and a release plan in a city apartment.',
  final: 'Clearly adult East Asian creator reviewing smartphone footage beside his creator setup in a modern apartment.'
});
const RECRUITMENT_STORY_MEDIA = Object.freeze({
  'new-creators': recruitmentNewStory,
  'existing-creators': recruitmentExistingStory,
  'international-creators': recruitmentInternationalStory,
  'gay-creators': recruitmentGayStory,
  'male-performers': recruitmentMalePerformerStory,
  'live-cam': recruitmentLiveCamStory,
  escorts: recruitmentEscortsStory,
  'creator-management': recruitmentManagementStory,
  'content-distribution': recruitmentDistributionSecondary
});
const RECRUITMENT_STORY_ALT = Object.freeze({
  'new-creators': 'Clearly adult East Asian creator preparing a smartphone portrait in a warm apartment creator setup.',
  'existing-creators': 'Two clearly adult creators, one East Asian and one European-looking, preparing a camera shoot together in an apartment studio.',
  'international-creators': 'Clearly adult Southeast Asian creator preparing content in a premium hotel apartment with an international city skyline.',
  'gay-creators': 'Two clearly adult male creators, one East Asian and one European-looking, preparing a smartphone portrait and camera shoot together.',
  'male-performers': 'Clearly adult European-looking male performer preparing a self-tape in a warm bedroom creator space.',
  'live-cam': 'Clearly adult Southeast Asian live creator seated close to camera in a warm apartment streaming setup.',
  escorts: 'Clearly adult East Asian creator in a refined hotel apartment considering an additional creator income path.',
  'creator-management': 'Two clearly adult creators, one East Asian and one European-looking, planning content together with a trusted collaborator.',
  'content-distribution': 'Clearly adult mixed Asian-European creator reviewing a content library in a premium city apartment.'
});
const RECRUITMENT_STORY_COPY = Object.freeze({
  'new-creators': 'Start with a conversation about your pace, your boundaries and the kind of creator work you want to try. The first step is designed to make the next decision clearer.',
  'existing-creators': 'Bring the work you already make into a more deliberate business conversation, with room to discuss audience, release choices and the support that would actually help.',
  'international-creators': 'Your country and working setup shape the route. We review the practical details with you before discussing any approved opportunity or distribution plan.',
  'gay-creators': 'FLESHLAB is made for adult gay male creators who want attractive, personal work to feel intentional, well-supported and connected to a real professional process.',
  'male-performers': 'Performance can be physical, creative and camera-aware. We begin with your interests and comfort level, then talk through the formats that may fit.',
  'live-cam': 'Live work depends on consistency, presence and a reliable setup. We help clarify the practical requirements before you decide whether the format suits you.',
  escorts: 'If you are exploring another income path alongside existing work, FLESHLAB can be part of that conversation without asking you to erase your experience or identity.',
  'creator-management': 'Management works best when it reflects the creator. We start by understanding your output, priorities and boundaries before discussing where support could add value.',
  'content-distribution': 'Good distribution starts before a release: rights, consent, media quality and the commercial route all need to make sense for the specific work.'
});
const RECRUITMENT_CTA = Object.freeze({
  hub: 'APPLY TO FLESHLAB',
  'new-creators': 'START A CONVERSATION',
  'existing-creators': 'TALK ABOUT YOUR WORK',
  'international-creators': 'DISCUSS YOUR ROUTE',
  'gay-creators': 'EXPLORE THE FIT',
  'male-performers': 'START YOUR APPLICATION',
  'live-cam': 'TALK ABOUT LIVE WORK',
  escorts: 'EXPLORE CREATOR OPTIONS',
  'creator-management': 'TALK TO FLESHLAB',
  'content-distribution': 'EXPLORE DISTRIBUTION'
});
const RECRUITING_CONTACT_NUMBER = '886958679186';
const RECRUITING_CONTACT_MESSAGE = 'Hi Eric, I would like to discuss becoming a FLESHLAB creator.';
const recruitmentContactHref = channel => {
  const message = encodeURIComponent(RECRUITING_CONTACT_MESSAGE);
  return channel === 'telegram' ? `https://t.me/+${RECRUITING_CONTACT_NUMBER}?text=${message}` : `https://wa.me/${RECRUITING_CONTACT_NUMBER}?text=${message}`;
};
function RecruitmentContactBanner({ contact = {} }) {
  const whatsappHref = contact.whatsapp_url || recruitmentContactHref('whatsapp');
  const telegramHref = contact.telegram_url || recruitmentContactHref('telegram');
  return <aside className="application-contact-banner" aria-label="Direct contact with Eric"><div className="application-contact-copy"><span>QUESTIONS BEFORE YOU APPLY?</span><h2>TALK TO<br/><em>ERIC.</em></h2><p>Not sure which creator path fits you?<br/>Message me directly before you apply.</p><div className="application-contact-actions"><a className="application-contact-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer"><span className="application-contact-label"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5.5A18.5 18.5 0 0 0 8.2 33.6l-2.7 8.9 9.2-2.4A18.5 18.5 0 1 0 24 5.5Zm0 34.2a15.6 15.6 0 0 1-8-2.2l-.6-.4-5.5 1.4 1.5-5.3-.4-.6A15.6 15.6 0 1 1 24 39.7Z"/><path d="M17.2 15.6c.5-.7 1.3-.7 1.8-.1l2.2 2.8c.5.6.5 1.2 0 1.8l-1.1 1.3a14.4 14.4 0 0 0 4.9 4.8l1.2-1.1c.6-.6 1.2-.6 1.9-.1l2.7 2.1c.7.5.7 1.3.1 1.9l-1 1c-.8.8-2 1.1-3.1.7-5.9-2.1-10.1-6.2-12.2-12.2-.4-1.1-.1-2.3.7-3.1l.9-.8Z"/></svg><b>WHATSAPP ERIC</b></span><span className="application-contact-arrow">→</span></a><a className="application-contact-telegram" href={telegramHref} target="_blank" rel="noreferrer"><span className="application-contact-label"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="m42.2 7.2-37.1 14.3c-1.7.7-1.7 1.8-.3 2.3l9.5 3 3.6 11.2c.4 1.2.2 1.7 1 1.7.6 0 .9-.3 1.3-.7l4.6-4.5 9.6 7.1c1.8 1 3.1.5 3.6-1.7l6.2-29c.7-2.7-1-3.9-2.4-3.7ZM16 25.9 36.7 13c1-.6 1.9-.3 1.2.4L20.8 28.7l-.6 6.1-2.5-7.8-1.7-1.1Z"/></svg><b>TELEGRAM ERIC</b></span><span className="application-contact-arrow">→</span></a></div></div><figure className="application-contact-portrait"><img src={recruitmentEricPortrait} alt="Eric from FLESHLAB"/></figure></aside>;
}
const trackRecruitment = event_type => {
  const context = recruitmentContext();
  if (!/^\/v3\/(become-a-creator|performer-application)/.test(context.landing_route)) return;
  fetch('/api/v3/public/recruitment/events', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event_type, ...context }) }).catch(() => {});
};
const trackPublicEvent = (event_type, extra = {}) => {
  const context = recruitmentContext();
  fetch('/api/v3/public/recruitment/events', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event_type, ...context, ...extra }) }).catch(() => {});
};

const absolutePublicUrl = value => {
  const normalized = String(value || '').trim();
  if (!normalized) return undefined;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return normalized.startsWith('/') ? `${PUBLIC_CANONICAL_ORIGIN}${normalized}` : undefined;
};

function Seo({ title, description, image, schemaType = 'WebSite', schemaData = {}, breadcrumbItems = [], faqItems = [], noindex = false }) {
  useEffect(() => {
    const pathname = window.location.pathname || '/';
    const search = window.location.search || '';
    const canonical = canonicalUrl(window.__FLESHLAB_CANONICAL__ || pathname);
    const canonicalPath = canonical ? new URL(canonical).pathname : pathname;
    const initialRobots = document.querySelector('meta[name="robots"]')?.content || '';
    const metadata = buildSeoMetadata({
      title,
      description,
      canonicalUrl: canonical,
      imageUrl: image,
      pageType: schemaType,
      production: isProduction(),
      noindex,
      initialRobots,
      pathname: canonicalPath,
      search,
      publishedAt: schemaData?.uploadDate,
      modifiedAt: schemaData?.modifiedAt,
      duration: schemaData?.duration,
    });
    document.title = metadata.title || 'FLESHLAB';

    const setMeta = ({ attribute, key, content }) => {
      const selector = attribute === 'property' ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      const elements = [...document.head.querySelectorAll(selector)];
      const element = elements.shift() || document.createElement('meta');
      elements.forEach(item => item.remove());
      if (!content) { element.remove(); return; }
      element.setAttribute(attribute, key);
      element.removeAttribute(attribute === 'name' ? 'property' : 'name');
      element.setAttribute('content', content);
      if (!element.parentNode) document.head.appendChild(element);
    };
    metadata.metaTags.forEach(setMeta);

    const links = [...document.head.querySelectorAll('link[rel="canonical"]')];
    const canonicalLink = links.shift() || document.createElement('link');
    links.forEach(item => item.remove());
    canonicalLink.rel = 'canonical';
    canonicalLink.href = metadata.canonical;
    window.__FLESHLAB_CANONICAL__ = metadata.canonical;
    if (!canonicalLink.parentNode) document.head.appendChild(canonicalLink);

    const organizationId = `${PUBLIC_CANONICAL_ORIGIN}/#organization`;
    const websiteId = `${PUBLIC_CANONICAL_ORIGIN}/#website`;
    const breadcrumbId = `${canonical}#breadcrumb`;
    const faqId = `${canonical}#faq`;
    const videoId = `${canonical}#video`;
    const {
      mainEntity: _mainEntity,
      breadcrumbItems: _schemaBreadcrumbItems,
      videoObject: suppliedVideoObject,
      ...pageSchemaData
    } = schemaData || {};
    const videoObjectData = suppliedVideoObject || (schemaType === 'VideoObject' ? {
      name: title,
      description,
      thumbnailUrl: image,
      uploadDate: schemaData?.uploadDate,
      modifiedAt: schemaData?.modifiedAt,
      duration: schemaData?.duration,
      contentUrl: schemaData?.contentUrl,
      embedUrl: schemaData?.embedUrl,
    } : null);
    const normalizedPageType = schemaType === 'FAQPage' || schemaType === 'WebSite' || schemaType === 'VideoObject' ? 'WebPage' : schemaType;
    const organization = buildOrganizationJsonLd({
      id: organizationId,
      name: 'FLESHLAB',
      url: PUBLIC_CANONICAL_ORIGIN,
      sameAs: ['https://twitter.com/fleshlabasia', 'https://www.instagram.com/fleshlabstudios/'],
    });
    const website = buildWebSiteJsonLd({
      id: websiteId,
      name: 'FLESHLAB',
      url: PUBLIC_CANONICAL_ORIGIN,
      organizationId,
    });
    const graph = [organization, website, {
      '@type': normalizedPageType,
      '@id': `${canonical}#webpage`,
      name: title,
      url: canonical,
      description,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
      ...(metadata.image ? { primaryImageOfPage: { '@type': 'ImageObject', url: metadata.image } } : {}),
      ...(breadcrumbItems.length ? { breadcrumb: { '@id': breadcrumbId } } : {}),
      ...(videoObjectData ? { mainEntity: { '@id': videoId } } : {}),
      ...pageSchemaData,
    }];
    if (videoObjectData) graph.push(buildVideoObjectJsonLd({
      id: videoId,
      url: canonical,
      name: videoObjectData.name ?? title,
      description: videoObjectData.description ?? description,
      thumbnailUrl: videoObjectData.thumbnailUrl ?? image,
      uploadDate: videoObjectData.uploadDate ?? schemaData?.uploadDate,
      modifiedAt: videoObjectData.modifiedAt ?? schemaData?.modifiedAt,
      duration: videoObjectData.duration ?? schemaData?.duration,
      contentUrl: videoObjectData.contentUrl,
      embedUrl: videoObjectData.embedUrl,
    }));
    if (breadcrumbItems.length) graph.push(buildBreadcrumbListJsonLd(breadcrumbItems));
    if (faqItems.length) graph.push({
      '@type': 'FAQPage',
      '@id': faqId,
      url: canonical,
      isPartOf: { '@id': `${canonical}#webpage` },
      mainEntity: faqItems.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })),
    });
    let schema = document.querySelector('#fleshlab-public-schema');
    if (!schema) { schema = document.createElement('script'); schema.id = 'fleshlab-public-schema'; schema.type = 'application/ld+json'; document.head.appendChild(schema); }
    schema.textContent = serializeJsonLd({ '@context': 'https://schema.org', '@graph': graph });
  }, [title, description, image, schemaType, schemaData, breadcrumbItems, faqItems, noindex]);
  return null;
}

function FleshNav() {
  const links = <><a href="/v3/videos">Archive</a><a href="/v3/performers">Performers</a><a href="/v3/collections">Series</a><a href="/v3/brands">Labels</a><a href="/v3/pricing">Pricing</a><a href="/v3/library">My library</a></>;
  return <header className="flesh-nav">
    <a href="/v3/home" className="flesh-logo" aria-label="FLESHLAB home"><FleshLabLogo /></a>
    <nav aria-label="Public navigation">{links}</nav>
    <div className="flesh-nav-actions"><a className="nav-performer-apply" href={CREATOR_HUB}>Become a creator</a><a className="nav-earn" href="https://earn.fleshlab.online">Earn</a><a className="nav-search" href="/v3/videos#search-videos" aria-label="Search the FLESHLAB archive">⌕</a><span className="nav-rule" aria-hidden="true"/><a className="nav-login" href="https://performer.fleshlab.online">Log in</a><a className="nav-join" href={CREATOR_HUB}>Join the lab →</a></div>
    <details className="flesh-mobile-nav"><summary aria-label="Open public navigation"><span>MENU</span><b>+</b></summary><div>{links}<a href={CREATOR_HUB}>Become a creator</a><a href="/v3/videos#search-videos">Search archive</a><a href="https://performer.fleshlab.online">Log in</a><a className="nav-earn" href={CREATOR_HUB}>Join the lab →</a></div></details>
  </header>;
}

function FleshFooter() {
  return <footer className="flesh-footer">
    <div className="footer-lockup">
      <a href="/v3/home" className="footer-wordmark" aria-label="FLESHLAB home"><span>FLESH<span>LAB</span></span><small>MORE THAN JUST AN ACT</small></a>
      <p>Real people. Real stories.<br/>More than just an act.</p>
      <div className="footer-socials"><a href="https://twitter.com/fleshlabasia" target="_blank" rel="noreferrer" aria-label="FLESHLAB on X">X</a><a href="https://www.instagram.com/fleshlabstudios/" target="_blank" rel="noreferrer" aria-label="FLESHLAB on Instagram">INSTAGRAM</a></div>
    </div>
    <div><span>EXPLORE</span><a href="/v3/videos">All videos</a><a href="/v3/performers">Performers</a><a href="/v3/collections">Series</a><a href="/v3/brands">Labels</a><a href="/v3/pricing">Pricing</a><a href="/v3/library">My library</a></div>
    <div><span>CREATORS</span><a href={CREATOR_HUB}>Become a creator ↗</a><a href={applicationHref()}>Apply to FLESHLAB ↗</a><a href="https://earn.fleshlab.online">Creator earnings ↗</a><a href="https://performer.fleshlab.online">Creator login ↗</a></div>
    <div><span>LEGAL</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/compliance">Compliance</a></div>
    <small className="footer-credit"><span>© {new Date().getFullYear()} FLESHLAB. ALL RIGHTS RESERVED.</span><span>18+ ADULT CONTENT · CONSENT · CREATOR-LED MEDIA</span></small>
  </footer>;
}

function Shell({ children, seo = {}, theme = '', header = 'reference' }) { useEffect(() => { if (!seo.noindex) trackPublicEvent('public_page_view'); }, [seo.noindex]); return <div className={`flesh-shell${theme ? ` flesh-shell-${theme}` : ''}`}><Seo title={seo.title || 'FLESHLAB / AMATEUR WINS.'} description={seo.description || 'Independent, creator-led media from FLESHLAB.'} image={seo.image} schemaType={seo.schemaType} schemaData={seo.schemaData} breadcrumbItems={seo.breadcrumbItems} faqItems={seo.faqItems} noindex={seo.noindex}/>{header === 'reference' ? <ReferenceHeader creatorHub={CREATOR_HUB}/> : <FleshNav/>}{children}<FleshFooter/></div>; }
function Image({ record = {}, alt = '', eager = false, className = '', position }) { const src = imageFor(record); return <div className={`flesh-image ${className}`}>{src ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} style={position ? { objectPosition: position } : undefined}/> : <span>NO IMAGE / FLESHLAB</span>}</div>; }
function RecBadge() { return <span className="rec-badge"><i/> REC</span>; }
function Timecode({ video }) { const duration = formatRuntime(fullDuration(video)); return <span className="timecode">{duration ? `FULL ${duration}` : 'FULL LENGTH UNAVAILABLE'}</span>; }
function FilmMetadata({ video }) { const people = video.performers?.map(item => item.name).filter(Boolean).join(' · '); const duration = formatRuntime(fullDuration(video)); return <div className="film-metadata"><span className="film-performer">{people || video.brand_name || 'FLESHLAB'}</span><div className="film-commerce"><span className="film-runtime">{duration || 'DURATION UNAVAILABLE'}</span>{accessSummaryItems(video).map(label => <span className="film-access" key={label}>{label}</span>)}</div></div>; }

let activePreviewStop = null;

function TapeCard({ video, index = 0, featured = false, homepage = false }) {
  const displayTitle = homepage ? (video.editorial_title || video.public_title || video.short_title || video.homepage_title || video.title || 'FLESHLAB VIDEO') : video.title;
  const previewUrl = video.trailer_url || video.preview_url || '';
  const cardRef = useRef(null); const mediaRef = useRef(null); const timerRef = useRef(null); const hoveringRef = useRef(false); const previewGenerationRef = useRef(0);
  const [previewRequested, setPreviewRequested] = useState(false); const [previewPlaying, setPreviewPlaying] = useState(false); const [previewError, setPreviewError] = useState(false);
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || window.matchMedia?.('(pointer: coarse)').matches;
  const stopPreview = () => { hoveringRef.current = false; previewGenerationRef.current += 1; if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = null; const media = mediaRef.current; if (media) { media.pause(); media.currentTime = 0; media.removeAttribute('src'); media.load(); } setPreviewRequested(false); setPreviewPlaying(false); if (activePreviewStop === stopPreview) activePreviewStop = null; };
  const startPreview = () => { if (!previewUrl || previewError) return; activePreviewStop?.(); activePreviewStop = stopPreview; setPreviewRequested(true); };
  const schedulePreview = () => { hoveringRef.current = true; if (!previewUrl || reducedMotion()) return; if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = window.setTimeout(() => { if (hoveringRef.current) startPreview(); }, 250); };
  const manualPreview = event => { event.preventDefault(); event.stopPropagation(); if (previewPlaying || previewRequested) stopPreview(); else startPreview(); };
  useEffect(() => { if (!previewRequested || !mediaRef.current) return undefined; const media = mediaRef.current; const generation = previewGenerationRef.current; media.src = previewUrl; media.muted = true; media.load(); media.play().then(() => { if (previewGenerationRef.current === generation) setPreviewPlaying(true); else media.pause(); }).catch(() => { if (previewGenerationRef.current === generation) stopPreview(); }); return () => { if (previewGenerationRef.current === generation) media.pause(); }; }, [previewRequested, previewUrl]);
  useEffect(() => { const card = cardRef.current; if (!card) return undefined; const visibility = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) stopPreview(); }, { threshold: 0.05 }); visibility.observe(card); const tab = () => { if (document.hidden) stopPreview(); }; document.addEventListener('visibilitychange', tab); return () => { visibility.disconnect(); document.removeEventListener('visibilitychange', tab); stopPreview(); }; }, []);
  return <article ref={cardRef} className={`tape-card${featured ? ' tape-card-featured' : ''}${previewPlaying ? ' tape-card-previewing' : ''}`} onMouseEnter={schedulePreview} onMouseLeave={stopPreview}>
    <a className="tape-card-link" href={videoHref(video)} aria-label={`Open ${labelFor(video)}`}>
      <div className="tape-card-media"><Image record={video} alt={labelFor(video)} eager={featured}/>{previewUrl && <video ref={mediaRef} className="tape-preview-video" muted playsInline loop preload="metadata" aria-hidden="true" onError={() => { setPreviewError(true); stopPreview(); }}/>}</div>
      <div className="tape-noise"/><div className="tape-bottom"><h3>{esc(displayTitle)}</h3><FilmMetadata video={video}/></div>
    </a>
    <div className="tape-card-actions">
      {previewUrl && <button type="button" className="tape-preview-button" onClick={manualPreview} aria-label={`${previewPlaying ? 'Stop' : 'Start'} preview for ${labelFor(video)}`}>{previewPlaying ? 'STOP PREVIEW' : 'PREVIEW'}</button>}
      <a className="tape-view-button" href={videoHref(video)} aria-label={`View ${labelFor(video)}`}>VIEW →</a>
    </div>
  </article>;
}

function SectionLabel({ number, title, accent, detail, action, href }) { return <div className="archive-section-head"><div>{number !== false && <span className="section-number">{number || '01'} /</span>}<h2>{title}{accent && <span className="section-accent"> {accent}</span>}</h2>{detail && <span className="section-detail">{detail}</span>}</div>{href && <a href={href}>{action || 'View all'} →</a>}</div>; }

function RawHero({ hero, fallbackVideo }) {
  const record = hero?.record || fallbackVideo || {};
  const image = hero?.image || imageFor(record);
  const year = record.release_date || record.published_at ? new Date(record.release_date || record.published_at).getFullYear() : '';
  const location = record.location || record.country || '';
  return <section className="raw-hero"><div className="raw-hero-copy"><span className="raw-kicker">AMATEUR FOOTAGE. REAL LIVES. NO FILTERS.</span><h1><span>REAL PEOPLE.</span><span>RAW STORIES.</span></h1><span className="raw-mark" aria-hidden="true"/><p>A home for real guys, real moments and the stories they choose to share.</p><a className="raw-button raw-button-red" href={hero?.cta_target || '/v3/videos'}>EXPLORE VIDEOS →</a></div><div className="raw-hero-media"><Image record={{ thumbnail_url: image }} alt={labelFor(record)} eager position="center center"/><div className="hero-media-shade"/><div className="hero-frame"/><div className="hero-rec"><i/> FEATURED VIDEO</div><div className="hero-time"><Timecode video={record}/></div><div className="hero-meta">FEATURED VIDEO<br/>{location ? `${esc(location)} / ` : ''}{year || 'FLESHLAB'}<br/><Timecode video={record}/></div><span className="hero-scribble">REAL GUYS.<br/>REAL PLACES.<br/>ALWAYS<br/>AMATEUR.</span></div></section>;
}

function PerformerSheet({ performer, index = 0 }) { const labels = performerLabels(performer); return <a className="performer-sheet" href={performerHref(performer)}><Image record={performer} alt={`Portrait of ${performer.display_name}`}/><div className="sheet-mark">#{String(index + 1).padStart(3, '0')}</div><div className="sheet-caption"><div><strong>{esc(performer.display_name)}</strong><span>{esc(performerPlace(performer))}</span></div><b aria-hidden="true">+</b></div>{labels.length ? <div className="sheet-labels"><span>{labels.length > 1 ? 'LABELS' : 'LABEL'} /</span> {labels.map((label, labelIndex) => <React.Fragment key={label.id || label.slug || labelIndex}>{labelIndex > 0 ? ' · ' : ''}{esc(label.name)}</React.Fragment>)}</div> : null}</a>; }
function SeriesPoster({ collection, fallbackRecord }) { const imageRecord = { ...(fallbackRecord || {}), cover_asset_reference: collection.cover_asset_reference, legacy_cover_image_url: collection.legacy_cover_image_url }; return <a className="series-poster" href={collectionHref(collection)}><Image record={imageRecord} alt={collection.title}/><div className="series-overlay"/><div className="series-caption"><span>FLESHLAB SERIES / {collection.video_count || 0} VIDEOS</span><h3>{esc(collection.title)}</h3><p>{esc(collection.description || 'A FLESHLAB project.')}</p><b>EXPLORE SERIES ↗</b></div></a>; }
function BrandLogo({ brand, dark = false }) { const asset = brandAsset(brand); if (!asset) return <span className="brand-logo-fallback">{esc(brand?.name || 'FLESHLAB')}</span>; return <img className="brand-logo-asset" src={dark && asset.darkLogo ? asset.darkLogo : asset.logo} alt={`${brand.name} logo`}/>; }
function BrandArtwork({ brand }) { const asset = brandAsset(brand); if (asset?.motif) return <img className="brand-motif-image" src={asset.motif} alt={`${brand.name} documentary brand motif`}/>; const cover = imageFor(brand); return cover ? <Image record={brand} alt={`${brand.name} label artwork`}/> : <BrandLogo brand={brand}/>; }
function BrandSheet({ brand, index = 0 }) {
  const asset = brandAsset(brand);
  const hasArtwork = Boolean(asset?.motif || imageFor(brand));
  return <a className={`brand-sheet${asset ? ' brand-sheet-approved' : ''}`} href={`/v3/brands/${encodeURIComponent(brand.slug)}`}>
    <div className={`brand-sheet-visual${hasArtwork ? '' : ' brand-sheet-visual-logo'}`}>
      <BrandArtwork brand={brand}/><span className="brand-sheet-index">#{String(index + 1).padStart(2, '0')} / LABEL</span><span className="brand-sheet-stamp">FLESHLAB LABEL</span>
    </div>
    <div className="brand-sheet-logo"><BrandLogo brand={brand}/></div>
    <div className="brand-sheet-caption"><h2>{esc(brand.name)}</h2><p>{esc(brandDescriptor(brand))}</p><span>VIEW LABEL +</span></div>
    {!asset && <div className="brand-sheet-note">LABEL COLLECTION</div>}
  </a>;
}

function BrandStatement({ performers = [] }) { return <><section className="brand-statement public-main"><div className="manifesto-aside"><span>OUR MANIFESTO</span><i/><p>REAL PEOPLE<br/>REAL PLACES<br/>REAL STORIES<br/>NO SCRIPTS<br/>NO PERFECTION<br/>JUST LIFE</p><small>FLESHLAB<br/>INDEPENDENT MEDIA LABEL<br/>EST. 2024</small></div><div className="manifesto-wordmark"><span>AMATEUR</span><strong>WINS.</strong></div><div className="manifesto-copy"><span>WE BELIEVE IN REAL PEOPLE.<br/>IN IMPERFECT MOMENTS.<br/>IN UNTOLD STORIES.</span><p>Amateur isn't a limitation.<br/>It's a movement.</p><b>AMATEUR WINS.</b></div><div className="manifesto-contact">{performers.slice(0, 9).map((item, index) => <Image key={item.id || item.slug || index} record={item} alt=""/>)}<span>SAME GUYS.<br/>DIFFERENT STORIES.</span></div></section><section className="performer-open-call public-main"><div><span className="poster-kicker">OPEN CALL / FLESHLAB CREATORS</span><h2>BECOME A<br/><em>FLESHLAB PERFORMER.</em></h2><p>Join FLESHLAB as a consenting adult performer. Build authentic content with professional management, distribution and a process that respects your boundaries.</p></div><a className="raw-button raw-button-red" href={CREATOR_HUB} onClick={() => trackRecruitment('creator_cta_click')}>APPLY TO FLESHLAB →</a></section></>; }
function EarnPoster({ record }) { return <section className="earn-poster public-main"><div className="earn-image"><Image record={record || {}} alt=""/><span className="earn-image-note">YOUR STORY<br/>BELONGS<br/>HERE.</span><RecBadge/></div><div className="earn-copy"><span className="poster-kicker">OPEN CALL</span><h2>YOU DON'T NEED A STUDIO.</h2><p>REAL GUYS. REAL PHONES. REAL OPPORTUNITY.<br/>CREATE ON YOUR TERMS AND GET PAID.</p><strong>EARN UP TO $1 PER APPROVED MINUTE.</strong><div className="earn-actions"><a className="raw-button raw-button-red" href="https://earn.fleshlab.online">BECOME A CREATOR →</a><a className="raw-button earn-learn-more" href="https://earn.fleshlab.online">LEARN MORE →</a></div></div><div className="public-earn-steps"><span><i aria-hidden="true">▧</i> SHOOT ON YOUR PHONE</span><span><i aria-hidden="true">↥</i> UPLOAD YOUR CONTENT</span><span><i aria-hidden="true">$</i> EARN UP TO $1 / MINUTE</span><span><i aria-hidden="true">♧</i> KEEP YOUR CREATIVE CONTROL</span></div><div className="earn-brand-block"><div className="earn-brand-image"><Image record={record || {}} alt=""/><span>REAL CREATORS.<br/>REAL MOMENTS.<br/>REAL FREEDOM.</span></div><i className="earn-barcode" aria-hidden="true"/><FleshLabLogo className="earn-brand-logo"/><small>INDEPENDENT<br/>AMATEUR MEDIA<br/>ALWAYS REAL</small></div></section>; }

function PerformerApplication() {
  const [form, setForm] = useState({ full_name: '', age: '', country: '', city: '', email: '', experience_level: '', interests: [], preferred_contact: 'email', whatsapp_number: '', telegram: '', profile_links: '', message: '', model_preference: '', age_confirmed: false, adult_work_confirmed: false, privacy_confirmed: false });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState(null);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const toggleInterest = key => update('interests', form.interests.includes(key) ? form.interests.filter(item => item !== key) : [...form.interests, key]);
  useEffect(() => { trackRecruitment('creator_application_start'); }, []);
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const normalizedWhatsapp = String(form.whatsapp_number || '').replace(/[\s().-]/g, '');
      if (form.preferred_contact === 'whatsapp' && !/^\+[1-9]\d{7,14}$/.test(normalizedWhatsapp)) {
        throw new Error('Please provide a WhatsApp number with country code, for example +63 962 193 0722.');
      }
      const key = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await fetch('/api/v3/public/performer-applications', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', 'idempotency-key': key }, body: JSON.stringify({ ...form, whatsapp_number: normalizedWhatsapp, profile_links: form.profile_links.split(/\n|,/).map(item => item.trim()).filter(Boolean), attribution: recruitmentContext() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message || `The application could not be submitted (HTTP ${response.status}).`);
      if (!data?.application?.id || !data?.public_reference) throw new Error('The application could not be confirmed. Please try again.');
      trackRecruitment('creator_application_complete'); setResult(data);
    } catch (submissionError) { setError(submissionError?.message || 'The application could not be submitted. Please try again.'); } finally { setBusy(false); }
  };
  if (result) return <Shell theme="recruitment" seo={{ title: 'Application received / FLESHLAB', description: 'Your FLESHLAB performer application has been received.', noindex: true }}><main className="public-main performer-application-page"><section className="application-success"><span className="archive-kicker">FLESHLAB / APPLICATION</span><h1>APPLICATION<br/><em>RECEIVED.</em></h1><p>Your application has been saved and will be reviewed personally by the FLESHLAB team.</p><strong>Your reference: {result.public_reference}</strong><RecruitmentContactBanner contact={result.contact}/><div className="application-success-actions"><a className="raw-button" href="/v3/">BACK TO FLESHLAB</a></div><small>Use WhatsApp or Telegram to contact Eric directly. The application reference is included in the prepared message.</small></section></main></Shell>;
  const interests = [['own_content', 'MY OWN CONTENT'], ['studio_productions', 'STUDIO PRODUCTIONS'], ['livecam', 'LIVECAM'], ['couple_application', 'COUPLE APPLICATION'], ['undecided', 'I AM NOT SURE YET']];
  return <Shell theme="recruitment" seo={{ title: 'Become a FLESHLAB Performer', description: 'Apply to join FLESHLAB as an adult performer.', noindex: true }}><main className="public-main performer-application-page"><section className="application-hero"><div><span className="archive-kicker">FLESHLAB / OPEN CALL</span><h1>BECOME A<br/><em>FLESHLAB PERFORMER.</em></h1><p>Join FLESHLAB as an adult performer. Tell us about yourself, your experience and what you are interested in. Our team reviews every application personally.</p></div><div className="application-stamp">18+<br/><span>PRIVATE<br/>REVIEW</span></div></section><section className="application-info-grid"><article><span>WHO CAN APPLY?</span><h2>REAL PEOPLE,<br/>REAL STARTS.</h2><p>Adults who want to explore independent content work can apply — whether you are new, already creating, performing live or have studio experience.</p></article><article><span>WHAT HAPPENS NEXT?</span><h2>PERSONAL.<br/>CLEAR. PRIVATE.</h2><p>We review your information, follow up with questions where needed and complete verification before any contract, production or public release.</p></article><article><span>WHAT WE OFFER</span><h2>CHOOSE YOUR<br/>OWN DIRECTION.</h2><p>Depending on the approved path, FLESHLAB may discuss creator-led content, studio productions, live work or collaborations. Your preference is not a contract or an acceptance.</p></article></section><RecruitmentContactBanner/><section className="application-form-section"><div className="application-form-intro"><span className="archive-kicker">FLESHLAB / FIRST CONTACT</span><h2>START YOUR<br/><em>APPLICATION.</em></h2><p>No explicit media or identity document is required at this first step. If we continue, the protected follow-up process will be explained directly.</p></div><form className="performer-application-form" onSubmit={submit}><div className="application-form-grid"><label>NAME OR ARTIST NAME *<input value={form.full_name} onChange={event => update('full_name', event.target.value)} required maxLength="160" /></label><label>AGE *<input type="number" min="18" max="100" value={form.age} onChange={event => update('age', event.target.value)} required /></label><label>COUNTRY *<input value={form.country} onChange={event => update('country', event.target.value)} required maxLength="100" /></label><label>CITY *<input value={form.city} onChange={event => update('city', event.target.value)} required maxLength="120" /></label><label>EMAIL *<input type="email" value={form.email} onChange={event => update('email', event.target.value)} required maxLength="240" /></label><label>EXPERIENCE *<select value={form.experience_level} onChange={event => update('experience_level', event.target.value)} required><option value="">Select one</option><option value="new">I am new</option><option value="content">I already create content</option><option value="live">I perform live</option><option value="studio">I have studio experience</option><option value="unsure">Not sure yet</option></select></label></div><fieldset><legend>WHAT ARE YOU INTERESTED IN? *</legend><div className="application-check-grid">{interests.map(([key, label]) => <label key={key}><input type="checkbox" checked={form.interests.includes(key)} onChange={() => toggleInterest(key)} />{label}</label>)}</div></fieldset><div className="application-form-grid"><label>PREFERRED CONTACT *<select value={form.preferred_contact} onChange={event => update('preferred_contact', event.target.value)} required><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></label><label>WHATSAPP NUMBER (WITH COUNTRY CODE)<input type="tel" inputMode="tel" autoComplete="tel" value={form.whatsapp_number} onChange={event => update('whatsapp_number', event.target.value)} placeholder="+63 962 193 0722" /></label><label>TELEGRAM / OTHER CONTACT<input value={form.telegram} onChange={event => update('telegram', event.target.value)} /></label><label>MODEL PREFERENCE<select value={form.model_preference} onChange={event => update('model_preference', event.target.value)}><option value="">Prefer to discuss</option><option value="creator_led">Creator-led content</option><option value="studio">Studio production</option><option value="live">Live work</option><option value="couple">Couple application</option><option value="undecided">Not decided</option></select></label></div><label>PROFILE OR PORTFOLIO LINKS <textarea value={form.profile_links} onChange={event => update('profile_links', event.target.value)} placeholder="One link per line" rows="3" /></label><label>SHORT INTRO, QUESTIONS OR BOUNDARIES <textarea value={form.message} onChange={event => update('message', event.target.value)} rows="5" maxLength="3000" /></label><div className="application-consents"><label><input type="checkbox" checked={form.age_confirmed} onChange={event => update('age_confirmed', event.target.checked)} required /> I confirm that I am 18 or older.</label><label><input type="checkbox" checked={form.adult_work_confirmed} onChange={event => update('adult_work_confirmed', event.target.checked)} required /> I am voluntarily applying for adult-content work.</label><label><input type="checkbox" checked={form.privacy_confirmed} onChange={event => update('privacy_confirmed', event.target.checked)} required /> I agree that FLESHLAB may process this application for review and contact.</label></div>{error && <p className="error">{error}</p>}<button className="raw-button raw-button-red" disabled={busy}>{busy ? 'SUBMITTING…' : 'SUBMIT APPLICATION →'}</button><small>Submitting an application does not guarantee acceptance, a contract, publication or earnings.</small></form></section></main></Shell>;
}

const RECRUITMENT_PAGES = Object.freeze({
  hub: {
    title: 'Adult Creator Opportunities & Management | FLESHLAB',
    description: 'Explore FLESHLAB adult creator opportunities, management, production and distribution for consenting adults 18+ worldwide. Apply for a private review.',
    eyebrow: 'FLESHLAB / CREATOR REPRESENTATION',
    headline: <>YOU CREATE.<br/><em>WE HANDLE THE BUSINESS.</em></>,
    lead: 'FLESHLAB works with consenting adult creators worldwide to develop, distribute and monetize authentic content — with professional management behind your own personality and boundaries.',
    audience: [['New creators', 'You do not need to arrive as an established performer. Start with a clear process and a team that understands distribution.'], ['Existing creators', 'Already creating, streaming or building a fanbase? Add management, distribution and commercial strategy.'], ['International creators', 'Platform availability and onboarding rules vary by country. FLESHLAB works with creators internationally through our own and partner channels.']],
    faqs: [['Who can apply?', 'Consenting adults aged 18 or older who want to explore creator-led content, studio productions, live work or a combination of these paths.'], ['Do I need experience?', 'No. Experience can help, but reliability, communication, clear boundaries and a willingness to create consistently matter more.'], ['Is applying a contract or acceptance?', 'No. Every application is reviewed individually. Verification, consent documentation and any contract discussion happen only later in the process.']]
  },
  'new-creators': {
    title: 'Become an Adult Creator | FLESHLAB', description: 'Learn how to become an adult creator with FLESHLAB. Beginners 18+ can discuss support, equipment, distribution and realistic creator income without guarantees.', eyebrow: 'CREATOR PATH / NEW', headline: <>BECOME AN ADULT CREATOR?<br/><em>START WITH A TEAM BEHIND YOU.</em></>, lead: 'You can apply if you are a consenting adult aged 18 or older, even if you have never made adult content before. FLESHLAB starts with a private conversation about your boundaries, interests and pace. We can discuss creator-led production, practical phone-and-lighting setups, approved distribution through FLESHLAB and applicable partner channels, and commercial arrangements such as content or live revenue where applicable. Income is never guaranteed, and an application is not acceptance, a contract or a promise of publication.', audience: [['Guidance', 'Understand age, identity, consent and production steps before any approved public release.'], ['Creator development', 'Build content habits, presentation and a realistic release plan around your own boundaries and pace.'], ['Commercial direction', 'Discuss how approved content may be distributed and settled under the applicable arrangement without promises about income.']], faqs: [['Do I need experience to become an adult creator?', 'No. New and experienced consenting adults aged 18 or older can apply. Reliability, communication, clear boundaries and a willingness to learn matter more than a professional history.'], ['Can I apply if I have never created adult content?', 'Yes. The first application is a private conversation about your interests, boundaries and experience level. Applying does not guarantee acceptance or a contract.'], ['What equipment do I need?', 'For recorded content, a modern HD-capable phone, good lighting and a stable setup are a practical starting point. Live work may require a suitable computer, broadband, camera or webcam and lighting.'], ['Can international creators apply?', 'Yes. FLESHLAB reviews adult creator applications internationally, but platform availability, onboarding and payment requirements vary by country.'], ['How does FLESHLAB distribute creator content?', 'Approved content may be prepared for FLESHLAB and applicable partner distribution routes after rights, consent, technical and operational review.'], ['How can creators earn?', 'Applicable arrangements may include content, video, live or other approved revenue. Earnings are not guaranteed and depend on the work, audience, distribution, terms and other factors.'], ['Do I need an existing audience?', 'No. An existing audience can help, but it is not a universal requirement for starting a conversation.'], ['Is FLESHLAB only for gay male creators?', 'No. FLESHLAB welcomes consenting adult creators across its recruitment paths. Gay male creators are an important audience, but applicants do not need to fit one identity.'], ['What happens after I apply?', 'FLESHLAB reviews the application personally and may ask follow-up questions. Age, identity and consent verification happen before any approved contract, production or public release.'], ['Do I need to upload explicit material with my first application?', 'No. The first application does not require explicit media or identity documents.']]
  },
  'existing-creators': {
    title: 'Adult Creator Management & Distribution | FLESHLAB', description: 'Already creating adult content? Explore FLESHLAB creator management, distribution and monetization support, including an OnlyFans alternative for adults 18+.', eyebrow: 'CREATOR PATH / ESTABLISHED', headline: <>ADULT CREATOR MANAGEMENT?<br/><em>GO FURTHER.</em></>, lead: 'You already know how to perform. FLESHLAB can help turn regular output into a more organized distribution, monetization and production strategy.', audience: [['Distribution', 'Prepare approved content for appropriate FLESHLAB and partner distribution channels.'], ['Representation', 'Work with a management-minded team on release planning, positioning and professional relationships.'], ['Audience development', 'Build a clearer creator identity around the personality your audience actually follows.']], faqs: [['Do I have to leave my existing platforms?', 'No. Existing platform activity does not automatically prevent a conversation. Each distribution and rights arrangement is discussed individually.'], ['Can I submit an existing portfolio?', 'Yes. Portfolio links are optional in the first application and help us understand your current work.'], ['Is FLESHLAB an OnlyFans alternative?', 'FLESHLAB can be discussed as a managed alternative or complement to relying on a single subscription platform. Rights, distribution, audience and commercial terms are reviewed individually.'], ['Can FLESHLAB help monetize existing adult content?', 'Approved content may be prepared for applicable distribution or sales routes after rights, consent and technical review. Revenue is not guaranteed.'], ['Are earnings guaranteed?', 'No. Revenue depends on content, distribution, audience response, applicable terms and many other factors.']]
  },
  escorts: {
    title: 'Adult Creator Options for Escorts | FLESHLAB', description: 'Explore content, live cam and management options for consenting adult escorts with FLESHLAB. Discuss an additional creator path, clear boundaries and commercial terms without guarantees.', eyebrow: 'CREATOR PATH / INDEPENDENT WORKERS', headline: <>YOUR EXPERIENCE<br/><em>CAN BECOME CONTENT.</em></>, lead: 'For consenting adult sex workers, recorded content and live cam can be an additional or alternative commercial path. FLESHLAB does not judge existing work — we discuss whether managed content creation fits your own goals and boundaries.', audience: [['Remote content options', 'Creator-led recording and live work can offer formats that do not require in-person client interaction.'], ['Clear boundaries', 'Your limits, consent and the agreed production rules remain central to every conversation.'], ['Managed production', 'For FLESHLAB-arranged partnered productions, we use performer safety and testing procedures; these reduce risk but never eliminate it.']], faqs: [['Do I need to stop escorting to apply?', 'No. Applying is simply a conversation about an additional content or live-work path.'], ['Is live cam required?', 'No. Recorded content, studio production and live work are separate interests you can discuss.'], ['Does FLESHLAB guarantee safety?', 'No adult production can promise zero risk. Verification, consent, boundaries and applicable safety/testing procedures are managed seriously.'], ['Can I apply for content creation without changing my current work?', 'Yes. FLESHLAB can discuss an additional or alternative path; the choice depends on your goals, boundaries and any applicable agreement.'], ['How are payments handled?', 'Applicable content or live revenue is handled under the written commercial arrangement for the approved work. Amounts and timing vary, and earnings are not guaranteed.'], ['Can international applicants apply?', 'Yes. International adults can apply, subject to country, platform, verification and payment requirements.'], ['What happens after I apply?', 'FLESHLAB reviews the application personally and discusses fit, verification and any approved next steps before production or publication.']]
  },
  'live-cam': {
    title: 'Live Cam Creator Opportunities | FLESHLAB', description: 'Explore live cam creator opportunities with FLESHLAB for consenting adults 18+, including male and gay cam performers seeking practical support without income guarantees.', eyebrow: 'CREATOR PATH / LIVE', headline: <>GO LIVE WITH A<br/><em>REAL PLAN.</em></>, lead: 'Live work is a performance format, not a shortcut. FLESHLAB discusses creator fit, presentation, scheduling and commercial planning with adult performers who can work consistently.', audience: [['Technical readiness', 'A suitable laptop or computer, reliable broadband, a good camera/webcam, lighting and a production-ready environment matter.'], ['Personal boundaries', 'Live work should fit your comfort level and agreed limits; it is not required for every creator relationship.'], ['Settlement clarity', 'Where applicable, live-cam revenue is settled approximately every 14 days under the relevant approved arrangement.']], faqs: [['Do I need a specific computer specification?', 'No arbitrary universal RAM requirement is published. We assess the actual platform and streaming setup before onboarding.'], ['Can beginners apply?', 'Yes. New creators can apply, but steady availability and willingness to learn are important.'], ['Is live cam a guaranteed income source?', 'No. Income is never guaranteed and depends on real performance, audience and applicable terms.'], ['Do I need to be a professional streamer?', 'No. Beginners can apply, but the setup, availability and willingness to learn are reviewed before any approved arrangement.'], ['What equipment is useful for live cam?', 'A suitable computer, reliable broadband, camera or webcam, lighting and a production-ready environment are practical requirements to discuss.']]
  },
  'international-creators': {
    title: 'International Adult Creator Opportunities | FLESHLAB', description: 'Explore international adult creator opportunities with FLESHLAB for adults 18+ in the Philippines, Southeast Asia, Europe and other markets. Availability varies by country.', eyebrow: 'CREATOR PATH / WORLDWIDE', headline: <>YOUR MARKET ISN'T<br/><em>LIMITED TO ONE PLATFORM.</em></>, lead: 'Creators from the Philippines, Southeast Asia, Latin America, Europe, North America and other markets can apply. Platform availability and onboarding rules vary by country; FLESHLAB works internationally through its own and partner channels.', audience: [['International review', 'Applications are reviewed individually, with country and operational requirements handled transparently.'], ['Distribution options', 'Approved content can be considered for FLESHLAB and relevant partner distribution routes.'], ['Practical communication', 'Clear contact details, consistency and a reliable remote setup help an international relationship work.']], faqs: [['Can creators outside the United States apply?', 'Yes. FLESHLAB reviews adult creator applications internationally.'], ['Do you claim every platform accepts every country?', 'No. Third-party availability and onboarding rules vary, so we do not make blanket claims.'], ['Are payouts the same everywhere?', 'Payout methods, timing and availability depend on the applicable arrangement and operational requirements.'], ['Can creators from the Philippines or Southeast Asia apply?', 'Yes. Adults in those markets can submit an application, subject to country, platform, verification and payment requirements.'], ['Can creators in Europe apply?', 'Yes. European adults can apply, while the available route and onboarding requirements are reviewed for the specific country.']]
  },
  'gay-creators': {
    title: 'Gay Male Creator Opportunities | FLESHLAB', description: 'Explore gay adult creator opportunities with FLESHLAB for consenting adults 18+. Discuss authentic content, management, distribution and a private performer application.', eyebrow: 'CREATOR PATH / GAY & BISEXUAL CREATORS', headline: <>YOUR PERSONALITY.<br/><em>YOUR AUDIENCE.</em></>, lead: 'FLESHLAB is built around real personalities, real environments and authentic amateur energy — with professional production and distribution behind it.', audience: [['Creator-first', 'Your personality is not a catalogue field. It is part of how an audience understands and follows your work.'], ['Authentic production', 'Natural environments and creator-led ideas can be commercially strong when they are produced responsibly.'], ['Professional support', 'Management, distribution and commercial planning sit behind the content without erasing the person in it.']], faqs: [['Do I need a public following?', 'No. A following can help, but it is not a universal requirement.'], ['Can I keep control over my boundaries?', 'Yes. Boundaries, consent and contractual production rules remain performer-controlled.'], ['Can couples apply?', 'Yes, but every adult participant must later complete their own verification and consent process.'], ['Is FLESHLAB only for gay male creators?', 'No. Gay male creators are an important audience, while FLESHLAB welcomes consenting adults across its recruitment paths.'], ['Can international gay creators apply?', 'Yes. International adults can apply, subject to country, platform, verification and payment requirements.']]
  },
  'male-performers': {
    title: 'Male Adult Performer Opportunities | FLESHLAB', description: 'Explore male adult performer opportunities with FLESHLAB for consenting adults 18+. Apply for creator-led content, studio production, live work or distribution without guaranteed earnings.', eyebrow: 'CREATOR PATH / MALE PERFORMERS', headline: <>REAL GUYS.<br/><em>REAL WORK.</em></>, lead: 'FLESHLAB works with consenting adult male performers who want to create consistently, communicate professionally and build work around their own boundaries.', audience: [['Creator-led', 'Make content with your own personality and real-world environment at the center.'], ['Studio production', 'Discuss FLESHLAB-arranged productions only after appropriate verification, consent and planning.'], ['Long-form value', 'Longer, well-prepared content can create more useful studio-distribution opportunities than occasional short clips.']], faqs: [['What is the age requirement?', 'Applicants must be 18 or older. Age and identity verification are required before participation.'], ['Do I need previous studio experience?', 'No. New and experienced performers can apply.'], ['Do I receive an advance?', 'No. FLESHLAB does not provide cash advances simply because someone applies.'], ['Can a new male performer apply?', 'Yes. Experience is not required for the first application, which is reviewed privately before any approved work or agreement.'], ['What happens before a production?', 'FLESHLAB discusses fit, boundaries and the applicable process, then completes age, identity and consent verification before approved participation.']]
  },
  'creator-management': {
    title: 'Adult Creator Management & Representation | FLESHLAB', description: 'Explore adult creator management, representation, planning and distribution support with FLESHLAB. Adults 18+ can discuss boundaries and commercial terms without guaranteed revenue.', eyebrow: 'FLESHLAB / MANAGEMENT', headline: <>TURN YOUR CONTENT<br/><em>INTO A CREATOR BUSINESS.</em></>, lead: 'Creator management means more than posting a clip. FLESHLAB helps organize approved content, production priorities, distribution relationships and commercial strategy around a creator’s actual work.', audience: [['Production strategy', 'Plan work that is realistic to create consistently and appropriate for your agreed route.'], ['Representation', 'Maintain clearer professional communication around approved opportunities and partner relationships.'], ['Commercialization', 'Combine applicable PPV, video sales, subscriptions, live revenue, tips and distribution revenue without inventing a fixed outcome.']], faqs: [['What does management include?', 'The exact scope depends on the creator and approved agreement. It can include production planning, distribution and commercial support.'], ['Do I keep control over my content?', 'Rights, releases and commercial terms must be documented in the applicable agreement; creator boundaries are part of that discussion.'], ['Can FLESHLAB manage distribution?', 'Approved content may be prepared for FLESHLAB and applicable partner distribution after rights, consent and technical review. The exact arrangement varies by work and territory.'], ['How are earnings and payouts handled?', 'Content, PPV and video-sale settlements are generally monthly where applicable, under the applicable written commercial arrangement.'], ['Do I need an existing audience for management?', 'No universal audience threshold is stated. FLESHLAB reviews the creator, work, goals and fit for the applicable support.'], ['Can international creators apply?', 'Yes. International adults can apply, subject to country, platform, verification and payment requirements.'], ['Does management guarantee income?', 'No. Revenue depends on approved work, distribution, audience response and the applicable written terms.']]
  },
  'content-distribution': {
    title: 'Adult Content Distribution | FLESHLAB', description: 'Explore adult content distribution, release preparation, partner channels and creator monetization with FLESHLAB. Approved work is reviewed for rights, consent and route requirements.', eyebrow: 'FLESHLAB / DISTRIBUTION', headline: <>CREATE ONCE.<br/><em>DISTRIBUTE FURTHER.</em></>, lead: 'FLESHLAB prepares approved creator content for distribution through FLESHLAB and applicable partner channels. The work stays creator-led; the business side becomes more organized.', audience: [['Release preparation', 'Content is reviewed for the rights, consent, media and publishing requirements that apply to its route.'], ['Partner channels', 'Distribution relationships may include established adult-industry partner networks, including xHamster and FapHouse, depending on content, territory and onboarding.'], ['Revenue tracking', 'Applicable revenue-share, sales and settlement records are handled through the agreed commercial process.']], faqs: [['Which platforms does FLESHLAB distribute to?', 'Distribution & Studio Partners may include xHamster and FapHouse where applicable. The route depends on approved content, territory, onboarding and the commercial arrangement.'], ['How does adult content distribution work?', 'FLESHLAB reviews approved work for rights, consent, media quality, technical requirements and the applicable distribution route before release.'], ['Can I distribute existing content?', 'Existing content can be discussed, subject to rights, releases, consent, technical review and the applicable distribution arrangement.'], ['Do I need exclusive content?', 'There is no blanket exclusivity claim. Whether existing rights can be used depends on the specific distribution arrangement.'], ['Will every upload be distributed?', 'No. Approval, rights, consent and technical review are required before any release.'], ['How are earnings tracked?', 'Applicable revenue-share, sales and settlement records are handled through the agreed commercial process.'], ['Can distribution guarantee sales or income?', 'No. Distribution can create an opportunity for revenue, but sales and earnings depend on the work, audience, route and applicable terms.']]
  }
});

function PartnerTrust() { return <section className="recruitment-partners"><span>FLESHLAB / DISTRIBUTION &amp; STUDIO PARTNERS</span><div><strong>xHamster</strong><strong>FapHouse</strong></div><p>FLESHLAB content may be distributed through established adult-industry partner networks. Availability depends on approved content, territory, onboarding and the applicable commercial arrangement.</p></section>; }
const RECRUITMENT_BREADCRUMB_LABELS = Object.freeze({
  hub: 'Become a creator',
  'new-creators': 'New creators',
  'existing-creators': 'Existing creators',
  'international-creators': 'International creators',
  'gay-creators': 'Gay creators',
  'male-performers': 'Male performers',
  'live-cam': 'Live cam creators',
  escorts: 'Adult creator options for escorts',
  'creator-management': 'Creator management',
  'content-distribution': 'Content distribution'
});
const RECRUITMENT_LINK_LABELS = Object.freeze({
  hub: 'Return to the creator recruitment hub',
  'new-creators': 'Learn how to start as a new adult creator',
  'existing-creators': 'Explore management for existing creators',
  'international-creators': 'Explore international adult creator opportunities',
  'gay-creators': 'Explore gay male creator opportunities',
  'male-performers': 'Learn about male adult performer applications',
  'live-cam': 'Explore live cam creator opportunities',
  escorts: 'Discuss another creator path for adult workers',
  'creator-management': 'Explore adult creator management',
  'content-distribution': 'Learn about adult content distribution'
});
const RECRUITMENT_INTERNAL_LINKS = Object.freeze({
  hub: ['new-creators', 'existing-creators', 'international-creators', 'gay-creators', 'male-performers', 'live-cam', 'escorts', 'creator-management', 'content-distribution'],
  'new-creators': ['hub', 'gay-creators', 'male-performers', 'international-creators'],
  'existing-creators': ['hub', 'creator-management', 'content-distribution', 'international-creators'],
  'international-creators': ['hub', 'new-creators', 'content-distribution', 'creator-management'],
  'gay-creators': ['hub', 'new-creators', 'male-performers', 'live-cam'],
  'male-performers': ['hub', 'new-creators', 'gay-creators', 'live-cam'],
  'live-cam': ['hub', 'new-creators', 'gay-creators', 'escorts'],
  escorts: ['hub', 'new-creators', 'live-cam', 'creator-management'],
  'creator-management': ['hub', 'existing-creators', 'new-creators', 'content-distribution', 'international-creators'],
  'content-distribution': ['hub', 'existing-creators', 'creator-management', 'international-creators']
});
function RecruitmentLinks({ current }) { const keys = RECRUITMENT_INTERNAL_LINKS[current] || RECRUITMENT_INTERNAL_LINKS.hub; return <nav className="recruitment-links" aria-label="Creator paths"><span>EXPLORE CREATOR PATHS</span>{keys.map(key => <a key={key} href={key === 'hub' ? CREATOR_HUB : `${CREATOR_HUB}/${key}`}>{RECRUITMENT_LINK_LABELS[key]} →</a>)}</nav>; }
const RECRUITMENT_IMAGE_DIMENSIONS = new Map([
  [recruitmentHero, [1774, 887]], [recruitmentNewCreator, [1024, 1536]], [recruitmentEstablished, [1024, 1536]], [recruitmentInternational, [1024, 1536]], [recruitmentGay, [1024, 1536]], [recruitmentLiveCam, [1024, 1536]], [recruitmentEscorts, [1024, 1536]], [recruitmentMalePerformer, [1024, 1536]], [recruitmentManagement, [1024, 1536]], [recruitmentDistribution, [1024, 1536]], [recruitmentNewStory, [1024, 1536]], [recruitmentExistingStory, [1024, 1536]], [recruitmentInternationalHero, [1024, 1536]], [recruitmentInternationalStory, [1145, 1374]], [recruitmentGayStory, [1370, 1148]], [recruitmentMalePerformerStory, [1024, 1536]], [recruitmentLiveCamStory, [1370, 1148]], [recruitmentEscortsStory, [1024, 1536]], [recruitmentManagementStory, [1145, 1374]], [recruitmentDistributionStory, [1370, 1148]], [recruitmentDistributionSecondary, [1145, 1374]], [recruitmentFinalCreator, [1536, 1024]]
]);
function RecruitmentImage({ src, alt, className = '', eager = false }) { const [width, height] = RECRUITMENT_IMAGE_DIMENSIONS.get(src) || [1024, 1536]; return <div className={`recruitment-image ${className}`.trim()}><img src={src} alt={alt} width={width} height={height} loading={eager ? 'eager' : 'lazy'}/></div>; }
function RecruitmentPage({ pageKey = 'hub' }) {
  const page = RECRUITMENT_PAGES[pageKey] || RECRUITMENT_PAGES.hub;
  const isHub = pageKey === 'hub';
  useEffect(() => { trackRecruitment('creator_page_view'); }, [pageKey]);
  const apply = () => trackRecruitment('creator_cta_click');
  const heroImage = RECRUITMENT_MEDIA[pageKey] || recruitmentHero;
  const heroAlt = RECRUITMENT_IMAGE_ALT[pageKey] || RECRUITMENT_IMAGE_ALT.hub;
  const storyImage = RECRUITMENT_STORY_MEDIA[pageKey];
  const storyAlt = RECRUITMENT_STORY_ALT[pageKey] || heroAlt;
  const ctaLabel = RECRUITMENT_CTA[pageKey] || RECRUITMENT_CTA.hub;
  const breadcrumbItems = isHub ? [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }, { name: RECRUITMENT_BREADCRUMB_LABELS.hub, item: `${PUBLIC_CANONICAL_ORIGIN}${CREATOR_HUB}` }] : [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }, { name: RECRUITMENT_BREADCRUMB_LABELS.hub, item: `${PUBLIC_CANONICAL_ORIGIN}${CREATOR_HUB}` }, { name: RECRUITMENT_BREADCRUMB_LABELS[pageKey], item: `${PUBLIC_CANONICAL_ORIGIN}${CREATOR_HUB}/${pageKey}` }];
  return <Shell theme="recruitment" seo={{ title: page.title, description: page.description, image: heroImage, schemaType: 'WebPage', breadcrumbItems, faqItems: page.faqs }}><main className={`public-main recruitment-page recruitment-page-${pageKey}`}>
    <section className="recruitment-hero"><div className="recruitment-hero-copy"><span className="recruitment-eyebrow">{page.eyebrow}</span><h1>{page.headline}</h1><p>{page.lead}</p><div className="recruitment-actions"><a className="recruitment-button recruitment-button-primary" href={applicationHref(isHub ? 'hub' : pageKey)} onClick={apply}>{ctaLabel} <span>→</span></a><a className="recruitment-button recruitment-button-quiet" href="#how-it-works">SEE THE PROCESS <span>↓</span></a></div><div className="recruitment-hero-meta"><span>18+ ONLY</span><span>PRIVATE FIRST CONTACT</span><span>INTERNATIONAL REVIEW</span></div></div><figure className="recruitment-hero-media"><RecruitmentImage src={heroImage} alt={heroAlt} eager/><figcaption><span>FLESHLAB / CREATOR STORIES</span><b>ADULT CREATORS<br/>MAKING THEIR OWN WORK</b></figcaption></figure></section>
    <section className="recruitment-trust" aria-label="Creator standards"><span><b>18+</b><small>ADULT CREATORS ONLY</small></span><span><b>01</b><small>CONSENT AND BOUNDARIES</small></span><span><b>02</b><small>TERMS DISCUSSED CLEARLY</small></span><span><b>03</b><small>INTERNATIONAL REVIEW</small></span><span><b>04</b><small>CREATOR SUPPORT</small></span></section>
    {isHub && <section className="recruitment-path-grid"><a className="recruitment-path-card recruitment-path-new" href={`${CREATOR_HUB}/new-creators`}><RecruitmentImage src={recruitmentNewCreator} alt={RECRUITMENT_IMAGE_ALT['new-creators']}/><div className="recruitment-path-copy"><span>01 / START HERE</span><h2>NEW<br/>CREATORS</h2><p>Build a professional rhythm with clear expectations and support behind the work.</p><b>FIND YOUR START <span>↗</span></b></div></a><a className="recruitment-path-card recruitment-path-established" href={`${CREATOR_HUB}/existing-creators`}><RecruitmentImage src={recruitmentEstablished} alt={RECRUITMENT_IMAGE_ALT['existing-creators']}/><div className="recruitment-path-copy"><span>02 / ALREADY CREATING</span><h2>EXISTING<br/>CREATORS</h2><p>Bring your audience and your point of view. Add structure, reach and a team.</p><b>EXPLORE THE FIT <span>↗</span></b></div></a><a className="recruitment-path-card recruitment-path-international" href={`${CREATOR_HUB}/international-creators`}><RecruitmentImage src={recruitmentInternational} alt={RECRUITMENT_IMAGE_ALT['international-creators']}/><div className="recruitment-path-copy"><span>03 / WORK WORLDWIDE</span><h2>INTERNATIONAL<br/>CREATORS</h2><p>Work across markets with transparent country-by-country review and onboarding.</p><b>SEE HOW IT WORKS <span>↗</span></b></div></a></section>}
    {!isHub && <section className="recruitment-story"><RecruitmentImage src={storyImage} alt={storyAlt}/><div><span className="recruitment-eyebrow">THE CREATOR SIDE OF THE BUSINESS</span><h2>MAKE WORK<br/><em>THAT FEELS LIKE YOU.</em></h2><p>{RECRUITMENT_STORY_COPY[pageKey]}</p><a className="recruitment-text-link" href="#how-it-works">Read the process <span>↓</span></a></div></section>}
    <section className="recruitment-value"><SectionLabel number="01" title={isHub ? 'WHO WE WORK WITH' : 'WHAT THIS PATH CAN OFFER'}/><div>{page.audience.map(([heading, copy], index) => <article key={heading}><span className="recruitment-card-index">{String(index + 1).padStart(2, '0')}</span><h3>{heading}</h3><p>{copy}</p></article>)}</div></section>
    <section className="recruitment-support"><div><span className="recruitment-eyebrow">THE DETAILS MATTER</span><h2>PROFESSIONAL<br/><em>FROM THE FIRST MESSAGE.</em></h2><p>Good creator work needs a good working relationship. We make the important conversations visible early, before any approved production or release.</p></div><div className="recruitment-support-grid"><article><b>01</b><h3>CONTRACTS</h3><p>Any approved work is discussed through the applicable written terms before production or publication.</p></article><article><b>02</b><h3>PRIVACY</h3><p>The first application is a private conversation. Public identity and distribution choices are discussed before release.</p></article><article><b>03</b><h3>CONSENT</h3><p>Age, identity, consent and personal boundaries stay central to review and production planning.</p></article><article><b>04</b><h3>SUPPORT</h3><p>Production planning, distribution and creator communication are handled with a real person behind the process.</p></article></div></section>
    <section className="recruitment-how" id="how-it-works"><SectionLabel number="02" title="HOW IT WORKS" detail="A CLEAR PROCESS FOR ADULT CREATORS."/><ol><li><b>01</b><span>APPLY</span><p>Tell us who you are, what you create and what you are interested in.</p></li><li><b>02</b><span>REVIEW</span><p>We review every application personally and may request more context.</p></li><li><b>03</b><span>VERIFY</span><p>Age, identity and consent verification take place in the protected follow-up process.</p></li><li><b>04</b><span>PREPARE</span><p>Discuss an approved creator, production, live or distribution path.</p></li><li><b>05</b><span>DISTRIBUTE</span><p>Only approved content proceeds through the applicable release workflow.</p></li><li><b>06</b><span>SETTLE</span><p>Applicable live revenue is generally settled about every 14 days; content and video revenue monthly.</p></li></ol></section>
    <section className="recruitment-expectations"><div><span className="recruitment-eyebrow">WHAT WE EXPECT</span><h2>CONSISTENCY<br/><em>CHANGES THE FIT.</em></h2><p>FLESHLAB is looking for creators who want to build a real output rhythm. Around two substantial videos every 14 days — or four to five per month — is a useful target for representation, not an automatic universal contract term.</p></div><div><h3>RECORDED CONTENT</h3><p>Modern HD-capable phone, good lighting and a stable recording setup. Multiple angles can help where appropriate.</p><h3>LIVE STREAMING</h3><p>Reliable broadband, a suitable computer or laptop, a good camera/webcam, lighting and a production-ready environment.</p><h3>NO ADVANCES</h3><p>FLESHLAB does not provide cash advances simply because someone applies. Revenue depends on approved work and actual commercial performance.</p></div></section>
    <PartnerTrust/>
    <section className="recruitment-faq"><SectionLabel number="03" title="CREATOR QUESTIONS"/>{page.faqs.map(([question, answer], index) => <article key={question}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{question}</h3><p>{answer}</p></div></article>)}</section>
    <RecruitmentLinks current={pageKey}/>
    <section className="recruitment-final">
      <div className="recruitment-final-copy">
        <span className="recruitment-eyebrow">FLESHLAB / YOUR NEXT MOVE</span>
        <h2>YOUR CONTENT.<br/><em>YOUR BOUNDARIES.</em><br/>YOUR NEXT MOVE.</h2>
        <p>Create on your terms. We bring the production, support and distribution.</p>
        <a className="recruitment-button recruitment-button-primary" href={applicationHref(isHub ? 'hub' : pageKey)} onClick={apply}>APPLY TO FLESHLAB <span>→</span></a>
        <small className="recruitment-final-disclaimer">Every application is reviewed personally. Applying does not guarantee acceptance, a contract, publication or earnings.</small>
      </div>
      <figure className="recruitment-final-media">
      <RecruitmentImage src={recruitmentFinalCreator} alt={RECRUITMENT_IMAGE_ALT.final} eager/>
        <figcaption><span>18+ / CREATOR STORIES</span><b>MAKE THE NEXT<br/>MOVE YOURS.</b></figcaption>
      </figure>
    </section>
    <a className="recruitment-mobile-cta" href={applicationHref(isHub ? 'hub' : pageKey)} onClick={apply}>{ctaLabel} <span>→</span></a>
  </main></Shell>;
}

function BrandHome() {
  const [data, setData] = useState(null); const [performerProfile, setPerformerProfile] = useState(null); const [brands, setBrands] = useState([]); const [offers, setOffers] = useState([]); const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([get('/homepage'), get('/brands?limit=12'), get('/commerce/membership-offers')]).then(([homepage, brandList, membership]) => {
      if (cancelled) return;
      if (homepage.status === 'rejected') { setError(homepage.reason?.message || 'This page is unavailable.'); return; }
      setData(homepage.value);
      setBrands(brandList.status === 'fulfilled' ? brandList.value?.records || [] : []);
      setOffers(membership.status === 'fulfilled' ? membership.value?.records || [] : []);
      const featuredPerformer = (homepage.value?.featured_performers || []).find(item => /elias/i.test(String(item?.display_name || ''))) || homepage.value?.featured_performers?.[0];
      if (featuredPerformer?.slug) get(`/performers/${encodeURIComponent(featuredPerformer.slug)}`).then(profile => { if (!cancelled) setPerformerProfile(profile); }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, []);
  const hero = data?.hero; const featured = data?.featured_videos || []; const performers = data?.featured_performers || [];
  const seoImage = hero?.image || imageFor(featured[0]);
  const seo = { title: 'FLESHLAB / MORE THAN JUST AN ACT', description: hero?.summary || 'Real people. Real stories. More than just an act.', image: seoImage, breadcrumbItems: [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }] };
  return <Shell seo={seo} header="reference">{error ? <main className="reference-home"><div className="reference-empty-note reference-home-error">{error}</div></main> : !data ? <main className="reference-home"><div className="reference-empty-note reference-home-loading">Loading FLESHLAB…</div></main> : <ReferenceHome data={data} performerProfile={performerProfile} brands={brands} offers={offers} creatorHub={CREATOR_HUB}/>}</Shell>;
}

function ArchiveGrid({ records = [] }) { return records.length ? <div className="archive-grid">{records.map((item, index) => <TapeCard key={item.id || item.slug} video={item} index={index}/>)}</div> : <div className="public-empty">No public tapes are available.</div>; }
function MembershipPromo({ records = [], catalogueCount = null }) {
  const offer = records.flatMap(record => Array.isArray(record.access_options) ? record.access_options : []).find(option => option?.purchase_type === 'subscription' && option.membership_included);
  if (!offer) return null;
  const countLabel = Number(catalogueCount) > 0 ? `${catalogueCount} public videos` : 'the current public catalogue';
  return <section className="membership-promo" aria-label="FLESHLAB membership"><div><span>FLESHLAB / MEMBERSHIP</span><h2>MORE THAN<br/><em>ONE VIDEO?</em></h2></div><div><strong>{formatPrice(offer)}{intervalLabel(offer)}</strong><p>One successful checkout grants one month of membership access to {countLabel}, while the subscription is active and before its current period end.</p><a className="raw-button raw-button-red" href="/v3/pricing" onClick={() => trackPublicEvent('pricing_membership_cta_click')}>EXPLORE MEMBERSHIP →</a></div></section>;
}
function Listing({ kind }) {
  const initialLabel = new URLSearchParams(window.location.search).get('label') || '';
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [labelFilter] = useState(initialLabel);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      setError(null);

      if (kind !== 'videos') {
        const result = await get(
          `/${kind}?q=${encodeURIComponent(q)}&limit=40${kind === 'performers' && labelFilter ? `&label=${encodeURIComponent(labelFilter)}` : ''}`
        );
        setData(result);
        return;
      }

      const query = `q=${encodeURIComponent(q)}&limit=48`;

      const first = await get(`/videos?${query}&page=1`);

      const total = Number(first.total || 0);
      const totalPages = Math.ceil(total / 48);

      const remaining = await Promise.all(
        Array.from(
          { length: Math.max(0, totalPages - 1) },
          (_, i) => get(`/videos?${query}&page=${i + 2}`)
        )
      );

      const records = [first, ...remaining].flatMap(
        page => page.records || []
      );

      const uniqueIds = new Set(records.map(video => video.id));

      if (records.length !== total || uniqueIds.size !== total) {
        throw new Error(
          `Catalogue incomplete: ${records.length}/${total} records, ${uniqueIds.size} unique videos`
        );
      }

      setData({
        ...first,
        records,
        total
      });

    } catch (error) {
      setError(error.message);
    }
  };
  useEffect(() => { load(); }, [kind, labelFilter]);
  const records = data?.records || [];
  const title = kind === 'videos' ? 'WATCH THE STORIES.' : kind === 'performers' ? 'MEET THE PEOPLE BEHIND THE STORIES.' : 'OUR LABELS.';
  const description = kind === 'videos' ? 'Explore real creator-led productions, then choose how you want to watch.' : kind === 'performers' ? 'Real creators, different places and distinct points of view. Explore the people behind the FLESHLAB work.' : 'Different worlds, distinct identities and a shared commitment to creator-led work.';
  const kicker = kind === 'videos' ? 'THE VIDEO LIBRARY' : kind === 'performers' ? 'OUR CREATORS' : 'OUR LABELS';
  const labelOptions = [['', 'ALL'], ['fleshlabasia', 'FLESHLAB ASIA'], ['fleshlab-twinks-global', 'FLESHLAB TWINKS GLOBAL'], ['fleshlab-bareback-twinks', 'FLESHLAB BAREBACK TWINKS']];
  const parentPath = `/v3/${kind}`;
  const breadcrumbItems = [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }, { name: title.replace('FLESHLAB ', ''), item: `${PUBLIC_CANONICAL_ORIGIN}${parentPath}` }];
  return <Shell seo={{ title: `${title} / FLESHLAB`, description, image: imageFor(records[0]), schemaType: 'WebPage', breadcrumbItems }}>
    <main className={`public-main public-listing public-listing-${kind}`}>
      <section className="archive-title"><span className="archive-kicker">FLESHLAB / {kicker}</span><h1>{title}</h1><p>{description}</p></section>
      {kind === 'videos' && <div id="search-videos" className="archive-controls"><label className="archive-search"><span>SEARCH VIDEOS</span><input value={q} onChange={event => setQ(event.target.value)} onKeyDown={event => event.key === 'Enter' && load()} placeholder="title, performer, label"/><button onClick={load}>FIND ↗</button></label><div className="archive-filters"><a href="/v3/videos">ALL</a><a href="/v3/videos?q=latest">LATEST</a><a href="/v3/performers">PERFORMER</a><a href="/v3/collections">SERIES</a><a href="/v3/brands">LABEL</a><a href="/v3/pricing">PRICING</a></div></div>}
      {kind === 'performers' && <div className="archive-controls performer-label-filters" aria-label="Filter performers by label"><span>FILTER BY LABEL</span><div className="archive-filters">{labelOptions.map(([value, label]) => <a key={value || 'all'} className={!labelFilter && !value || labelFilter === value ? 'active' : ''} href={value ? `/v3/performers?label=${encodeURIComponent(value)}` : '/v3/performers'}>{label}</a>)}</div></div>}
      {error ? <p className="error">{error}</p> : kind === 'videos' ? <><ArchiveGrid records={records}/><MembershipPromo records={records} catalogueCount={data?.total}/></> : kind === 'brands' ? <div className="brand-index">{records.map((item, index) => <BrandSheet key={item.id || item.slug} brand={item} index={index}/>)}</div> : <div className="people-index">{records.map((item, index) => <PerformerSheet key={item.id || item.slug} performer={item} index={index}/>)}</div>}
    </main>
  </Shell>;
}

const pricingFaqItems = (catalogueCount, membershipOffer) => {
  const countLabel = Number(catalogueCount) > 0 ? `${catalogueCount} public videos` : 'the current public catalogue';
  const membershipPrice = membershipOffer ? `${formatPrice(membershipOffer)}${intervalLabel(membershipOffer)}` : 'the active membership price';
  return [
    ['What is included with membership?', `The current global membership offer covers ${countLabel}. Access is checked while the membership is active and before its recorded period end.`],
    ['Can I buy a video without subscribing?', 'Yes. A selected public title can be bought individually when it has an active PPV offer. No subscription is required for that purchase.'],
    ['Are all FLESHLAB videos included?', `The current active global offer is attached to ${countLabel}. This can change if an offer is deactivated or the catalogue rules change.`],
    ['How often am I billed?', `The active membership plan is priced at ${membershipPrice}. The current checkout flow records one successful payment and grants the plan period; automatic renewal is not implemented in the current public checkout.`],
    ['What happens if membership access ends?', 'Membership playback is available only while the subscription is active and its current period has not ended. Separately purchased PPV entitlements are checked independently.'],
    ['Can I still access individually purchased videos?', 'Yes, where the PPV entitlement remains active. The current PPV fulfilment creates an entitlement without an end date; access can still be revoked or marked expired by the system.'],
    ['Can I download purchased videos?', 'The current public flow provides entitlement-protected streaming playback. It does not expose a public download-rights or download endpoint.'],
    ['What preview do I get before purchase?', 'Where available, the public page shows the separate trailer or preview asset. Preview duration is kept separate from the full video runtime.']
  ];
};

function PricingPage() {
  const [data, setData] = useState(null); const [error, setError] = useState(''); const comparisonRef = useRef(null);
  useEffect(() => { trackPublicEvent('pricing_page_view'); Promise.all([get('/commerce/membership-offers'), ...[1, 2, 3].map(page => get(`/videos?limit=48&page=${page}`))]).then(([membership, ...videoPages]) => { const firstPage = videoPages[0] || {}; setData({ membership: membership.records || [], videos: videoPages.flatMap(page => page.records || []), total: firstPage.total || 0 }); }).catch(e => setError(e.message)); }, []);
  useEffect(() => { const node = comparisonRef.current; if (!node || !window.IntersectionObserver) return undefined; const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) { trackPublicEvent('pricing_comparison_view'); observer.disconnect(); } }, { threshold: .25 }); observer.observe(node); return () => observer.disconnect(); }, []);
  const membershipOffer = data?.membership?.[0]; const videos = data?.videos || []; const ppvOffers = videos.flatMap(video => Array.isArray(video.access_options) ? video.access_options : []).filter(option => option?.purchase_type === 'ppv'); const lowestPpv = ppvOffers.sort((a, b) => Number(a.amount_minor || 0) - Number(b.amount_minor || 0))[0]; const countLabel = data?.total ? `${data.total} public videos` : 'the current public catalogue'; const faqItems = pricingFaqItems(data?.total, membershipOffer); const membershipHref = membershipOffer?.href || '#membership';
  const comparisonRows = [['Payment', 'One-time PPV checkout', `One successful checkout for ${periodLabel(membershipOffer)}`], ['Selected title', 'The purchased title only', `Included in ${countLabel} while membership is active`], ['Current catalogue', 'Selected title only', `${countLabel} covered by the active global offer`], ['Access duration', 'No end date recorded in the current PPV entitlement', 'Until current_period_end while the subscription is active'], ['Subscription required', 'No', 'Yes'], ['New releases', 'Purchase individually when an active PPV offer exists', 'Included only while the active global offer covers them'], ['Cancellation', 'Not applicable', 'No public self-service cancellation flow is currently exposed'], ['Purchased title access', 'Remains available while its entitlement is active', 'Membership access is separate from PPV purchases']];
  return <Shell seo={{ title: 'FLESHLAB Pricing | PPV & Membership', description: 'Compare FLESHLAB pay-per-view video access with the current membership offer and choose how you want to watch.', image: imageFor(videos[0]) || fleshlabAmateurWins, schemaType: 'WebPage', breadcrumbItems: [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }, { name: 'Pricing', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/pricing` }], faqItems }}><main className="public-main pricing-page">
    <section className="pricing-hero"><div><span className="archive-kicker">FLESHLAB / ACCESS</span><h1>CHOOSE HOW<br/><em>YOU WATCH.</em></h1><p>One title or catalogue access for the plan period. Pick what works for you.</p><div className="pricing-hero-actions"><a className="raw-button raw-button-red" href="/v3/videos" onClick={() => trackPublicEvent('pricing_ppv_cta_click')}>BROWSE VIDEOS →</a><a className="raw-button" href="#membership" onClick={() => trackPublicEvent('pricing_membership_cta_click')}>SEE MEMBERSHIP ↓</a></div></div><div className="pricing-hero-stamp"><b>PPV</b><span>OR</span><b>MEMBERSHIP</b></div></section>
    {error && <p className="error">{error}</p>}
    <section className="pricing-choice-grid"><article className="pricing-choice pricing-choice-ppv"><span className="pricing-choice-kicker">01 / SELECTED TITLE</span><h2>BUY<br/>INDIVIDUALLY</h2><strong>{lowestPpv ? `FROM ${formatPrice(lowestPpv)}` : 'PAY PER VIEW'}</strong><p>Pay once for a selected public video. No subscription is required.</p><ul><li>One-time payment for one selected title</li><li>PPV entitlement is separate from membership</li><li>Access remains available under the current PPV entitlement rule</li></ul><a className="raw-button raw-button-red" href="/v3/videos" onClick={() => trackPublicEvent('pricing_ppv_cta_click')}>BROWSE VIDEOS →</a></article><article id="membership" className="pricing-choice pricing-choice-membership"><span className="pricing-choice-kicker">02 / CURRENT GLOBAL OFFER</span><h2>FLESHLAB<br/>MEMBERSHIP</h2><strong>{membershipOffer ? `${formatPrice(membershipOffer)}${intervalLabel(membershipOffer)}` : 'MEMBERSHIP PRICE UNAVAILABLE'}</strong><p>One successful checkout grants one month of access to {countLabel} while the membership is active and before its recorded period end.</p><ul><li>{countLabel} are covered by the active global offer</li><li>Selected titles are included while membership access is active</li><li>Streaming access through entitlement-protected playback</li></ul>{membershipOffer ? <a className="raw-button raw-button-red" href={membershipHref} onClick={() => trackPublicEvent('pricing_membership_cta_click')}>JOIN FLESHLAB →</a> : <span className="pricing-unavailable">Membership checkout is currently unavailable.</span>}<small>Automatic renewal and customer cancellation are not exposed by the current checkout flow.</small></article></section>
    <section ref={comparisonRef} className="pricing-comparison"><div className="pricing-section-heading"><span>FLESHLAB / ACCESS MODEL</span><h2>WHAT'S THE<br/><em>DIFFERENCE?</em></h2><p>PPV is for a particular title. Membership is for ongoing access to the current catalogue during its active plan period.</p></div><div className="pricing-table-wrap"><table><thead><tr><th scope="col">ACCESS</th><th scope="col">PPV</th><th scope="col">MEMBERSHIP</th></tr></thead><tbody>{comparisonRows.map(([label, ppv, membership]) => <tr key={label}><th scope="row">{label}</th><td>{ppv}</td><td>{membership}</td></tr>)}</tbody></table></div></section>
    <section className="pricing-explain"><span>THE CUSTOMER CHOICE</span><h2>ONE TITLE.<br/><em>OR THE WHOLE ROUTE.</em></h2><div><p>Choose PPV when you already know which video you want and do not want a membership checkout.</p><p>Choose membership when you want the current public catalogue covered by the active global offer for its plan period. The video pages show the same options beside the title, so the choice stays visible.</p><a className="raw-button" href="/v3/videos">RETURN TO VIDEOS →</a></div></section>
    <section className="pricing-faq"><div className="pricing-section-heading"><span>QUESTIONS BEFORE CHECKOUT</span><h2>ACCESS,<br/><em>EXPLAINED.</em></h2></div><div className="pricing-faq-list">{faqItems.map(([question, answer]) => <details key={question} onToggle={event => event.currentTarget.open && trackPublicEvent('pricing_faq_interaction')}><summary>{question}<b>+</b></summary><p>{answer}</p></details>)}</div></section>
  </main></Shell>;
}

function PerformerLinks({ performers = [], className = '' }) { return <span className={className}>{performers.length ? performers.map((performer, index) => <React.Fragment key={performer.id || performer.slug || index}>{index > 0 ? ' · ' : ''}{performer.slug ? <a href={performerHref(performer)}>{esc(performer.name)}</a> : esc(performer.name)}</React.Fragment>) : null}</span>; }
function FilmMetadataBlock({ record, previewAvailable = false, previewRuntime = '' }) { const membership = membershipOption(record.access_options || []); const access = record.access_state?.full_access_owned ? 'FULL ACCESS ACTIVE' : record.access_state?.fleshlab_ppv ? 'PPV AVAILABLE' : record.access_state?.fleshlab_membership ? 'MEMBERSHIP INCLUDED' : record.access_state?.external_distribution ? 'FAPHOUSE AVAILABLE' : 'PREVIEW ONLY'; return <div className="video-facts"><div><span>PERFORMER</span><strong><PerformerLinks performers={record.performers || []}/>{!record.performers?.length && (record.brand_name || 'FLESHLAB')}</strong></div><div><span>FULL RUNTIME</span><strong>{formatRuntime(fullDuration(record)) || 'DURATION UNAVAILABLE'}</strong></div><div><span>PREVIEW</span><strong>{previewRuntime ? `${previewRuntime} PREVIEW` : previewAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}</strong></div><div><span>ACCESS</span><strong>{membership && !record.access_state?.full_access_owned ? 'MEMBERSHIP INCLUDED' : access}</strong></div></div>; }
function AccessStatus({ record }) { const configured = (Array.isArray(record.access_options) ? record.access_options : []).filter(option => option && ['BUY NOW', 'SUBSCRIBE', 'WATCH NOW'].includes(option.label) && (/^https?:\/\//i.test(String(option.href || '')) || /^\/v3\//i.test(String(option.href || '')))); const canWatch = configured.some(option => option.label === 'WATCH NOW'); const membership = membershipOption(configured); useEffect(() => { if (membership) trackPublicEvent('subscription_section_view', { video_id: record.id, video_slug: record.slug, access_type: 'membership' }); }, [record.id, record.slug, Boolean(membership)]); const optionLabel = option => option.label === 'WATCH NOW' ? 'WATCH FULL VIDEO' : option.purchase_type === 'subscription' ? `JOIN & WATCH — ${formatPrice(option)}${intervalLabel(option)}` : `BUY THIS VIDEO — ${formatPrice(option)}`; const optionHeading = option => option.label === 'WATCH NOW' ? 'YOUR ACCESS IS ACTIVE' : option.purchase_type === 'subscription' ? 'WATCH WITH MEMBERSHIP' : 'GET THIS VIDEO'; const optionBenefit = option => option.provider === 'loyalfans' ? 'Purchase on LoyalFans; FLESHLAB opens access after verification.' : option.label === 'WATCH NOW' ? 'Your access is active' : option.purchase_type === 'subscription' ? (option.membership_included || !option.product_id ? 'Membership includes this video' : 'Subscription access to this video') : 'One-time access · no subscription required'; const external = record.external_distribution?.url ? record.external_distribution : null; return <section id="access" className="purchase-panel" aria-label="Video purchase options"><div className="purchase-panel-heading"><span>CHOOSE HOW YOU WANT TO WATCH</span><strong>COMPARE YOUR ACCESS OPTIONS</strong></div><p>{canWatch ? 'Your access is active. Watch the full video now.' : configured.length > 1 ? 'Buy this title once or use the active membership offer.' : external ? 'Watch the preview here, then choose FLESHLAB access or the listed external distribution.' : 'Choose how you want to watch this video.'}</p>{configured.length ? <div className="purchase-actions">{configured.map(option => <a key={`${option.label}-${option.href}`} className={`purchase-action ${option.purchase_type === 'subscription' ? 'purchase-action-membership' : 'purchase-action-primary'}`} href={option.href} onClick={() => trackPublicEvent(option.purchase_type === 'subscription' ? 'video_membership_cta_click' : 'video_ppv_cta_click', { video_id: record.id, video_slug: record.slug, offer_id: option.offer_id, access_type: option.purchase_type })}><span className="purchase-action-copy"><small className="purchase-action-heading">{optionHeading(option)}</small><b>{optionLabel(option)}</b><small>{optionBenefit(option)}</small></span><span aria-hidden="true">→</span></a>)}</div> : <small className="purchase-unavailable">This video is not currently available for FLESHLAB purchase or membership access.</small>}{external && <a className="purchase-action purchase-action-external" href={external.url} target="_blank" rel="noreferrer" onClick={() => trackPublicEvent('external_distribution_click', { video_id: record.id, video_slug: record.slug, channel: external.channel, destination: external.url, access_type: 'external_distribution' })}><span className="purchase-action-copy"><small className="purchase-action-heading">EXTERNAL DISTRIBUTION</small><b>WATCH ON FAPHOUSE →</b><small>Opens the configured external title destination. This is an outbound click.</small></span><span aria-hidden="true">↗</span></a>}<a className="purchase-compare-link" href="/v3/pricing">COMPARE ACCESS OPTIONS →</a><small className="purchase-reassurance">Your FLESHLAB access opens after verified payment confirmation.</small></section>; }
function BrandDetail({ data, slug }) {
  const record = data.record;
  const asset = brandAsset(record);
  const hasArtwork = Boolean(asset?.motif || imageFor(record));
  const title = slug === 'fleshlab-bareback-twinks' ? <>BAREBACK<br/>TWINKS</> : record.name;
  const breadcrumbItems = [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }, { name: 'Labels', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/brands` }, { name: record.name, item: `${PUBLIC_CANONICAL_ORIGIN}/v3/brands/${record.slug}` }];
  return <Shell seo={{ title: `${record.name} / FLESHLAB`, description: brandDescriptor(record), image: asset?.motif || asset?.logo || imageFor(record), schemaType: 'WebPage', breadcrumbItems }}><main className="public-main public-detail brand-detail"><div className="detail-kicker">FLESHLAB / LABEL</div><section className="brand-detail-heading"><div className={`brand-detail-art${hasArtwork ? '' : ' brand-detail-art-logo'}`}><BrandArtwork brand={record}/><span className="brand-detail-stamp">LABEL / {slug}</span></div><div className="brand-detail-copy"><span className="detail-stamp">{asset ? 'FLESHLAB LABEL' : 'PUBLIC LABEL'}</span><div className="brand-detail-logo"><BrandLogo brand={record}/></div><h1 className={slug === 'fleshlab-bareback-twinks' ? 'brand-detail-short-title' : ''}>{title}</h1><p>{brandDescriptor(record)}</p><a className="raw-button raw-button-red" href="#label-tapes">VIEW LABEL VIDEOS →</a></div></section><section className="detail-section" id="label-tapes"><SectionLabel number={false} title="LABEL VIDEOS"/><ArchiveGrid records={data.videos}/></section></main></Shell>;
}
function ProtectedPlayback({ record, image, title, previewUrl, onPreviewMetadata, onPreviewStarted, onPreviewCompleted, previewCompleted, conversionOption }) {
  const canWatch = (record.access_options || []).some(option => option.label === 'WATCH NOW');
  const conversionLabel = conversionOption?.label === 'WATCH NOW' ? 'CONTINUE WATCHING' : conversionOption?.purchase_type === 'subscription' ? 'JOIN & WATCH' : conversionOption ? 'WATCH THE FULL VIDEO' : 'EXPLORE MORE VIDEOS';
  const conversionHref = conversionOption?.href || '/v3/videos';
  const conversionEvent = conversionOption?.purchase_type === 'subscription' ? 'video_membership_cta_click' : conversionOption?.purchase_type === 'ppv' ? 'video_ppv_cta_click' : '';
  const trackConversion = () => { if (conversionEvent) trackPublicEvent(conversionEvent, { video_id: record.id, video_slug: record.slug, offer_id: conversionOption.offer_id, access_type: conversionOption.purchase_type }); };
  return <div id="watch" className="detail-frame"><div className="frame-label">{canWatch ? 'FULL VIDEO' : previewUrl ? 'PREVIEW' : 'VIDEO'}</div>{canWatch ? <video controls playsInline poster={image || undefined} src={`/api/v3/public/videos/${encodeURIComponent(record.id)}/playback`}/> : previewUrl ? <video controls playsInline preload="metadata" poster={image || undefined} src={previewUrl} onLoadedMetadata={event => onPreviewMetadata?.(formatRuntime(event.currentTarget.duration))} onPlay={onPreviewStarted} onEnded={onPreviewCompleted}/> : image ? <img src={image} alt={title}/> : <span>MEDIA PREVIEW UNAVAILABLE</span>}{previewCompleted && !canWatch && <div className="preview-conversion" role="status"><span>PREVIEW COMPLETE</span><strong>READY FOR THE FULL TITLE?</strong><p>Choose the access option that fits how you want to watch.</p><a className="raw-button raw-button-red" href={conversionHref} onClick={trackConversion}>{conversionLabel} →</a></div>}</div>;
}

function Detail({ kind, slug }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [previewRuntime, setPreviewRuntime] = useState('');
  const [previewCompleted, setPreviewCompleted] = useState(false);
  const previewStartedRef = useRef(false);
  const previewCompletedRef = useRef(false);
  const isVideo = kind === 'videos';
  useEffect(() => {
    setData(null); setError(''); setPreviewRuntime(''); setPreviewCompleted(false); previewStartedRef.current = false; previewCompletedRef.current = false;
    get(`/${kind}/${encodeURIComponent(slug)}`).then(setData).catch(e => setError(e.message));
  }, [kind, slug]);
  useEffect(() => {
    if (!data) return undefined;
    const record = data.record;
    if (isVideo) trackPublicEvent('video_title_open', { video_id: record.id, video_slug: record.slug, access_type: record.access_state?.primary });
    else if (kind === 'performers') trackPublicEvent('performer_profile_open', { performer_id: record.id, performer_slug: record.slug });
    return undefined;
  }, [data, isVideo, kind]);
  if (error) return <Shell seo={{ title: 'Not found / FLESHLAB', description: 'The requested public record was not found.', noindex: true }}><main className="public-main public-state"><div className="public-empty">{error}</div></main></Shell>;
  if (!data) return <Shell seo={{ title: 'Loading / FLESHLAB', description: 'Loading the public FLESHLAB record.' }}><main className="public-main public-state"><div className="public-empty">Loading public file…</div></main></Shell>;
  if (kind === 'brands') return <BrandDetail data={data} slug={slug}/>;
  const record = data.record;
  const title = record.title || record.display_name || record.name;
  const description = record.short_summary || record.description || record.bio || (kind === 'performers' ? `${title} is a public FLESHLAB performer profile${record.public_location ? ` from ${record.public_location}` : ''}. Explore public appearances, labels and archive files.` : 'Public FLESHLAB archive entry.');
  const image = publicImage(data.assets?.find(asset => asset.type === 'thumbnail')?.url || data.assets?.find(asset => asset.type === 'trailer')?.url || imageFor(record));
  const previewUrl = data.assets?.find(asset => asset.type === 'trailer')?.url || record.trailer_url || '';
  const labels = performerLabels(record);
  const parentPath = `/v3/${kind}`;
  const parentLabel = kind === 'performers' ? 'Performers' : 'Videos';
  const breadcrumbItems = [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }, { name: parentLabel, item: `${PUBLIC_CANONICAL_ORIGIN}${parentPath}` }, { name: title, item: `${PUBLIC_CANONICAL_ORIGIN}${parentPath}/${record.slug}` }];
  const videoObject = isVideo && image ? { name: title, thumbnailUrl: image, ...(record.release_date ? { uploadDate: new Date(record.release_date).toISOString() } : {}), ...(videoDurationIso(fullDuration(record)) ? { duration: videoDurationIso(fullDuration(record)) } : {}) } : undefined;
  const handlePreviewStarted = () => { if (previewStartedRef.current) return; previewStartedRef.current = true; trackPublicEvent('preview_started', { video_id: record.id, video_slug: record.slug, access_type: 'free_preview' }); };
  const handlePreviewCompleted = () => { if (previewCompletedRef.current) return; previewCompletedRef.current = true; setPreviewCompleted(true); trackPublicEvent('preview_completed', { video_id: record.id, video_slug: record.slug, access_type: 'free_preview' }); };
  if (isVideo) {
    const conversionOption = (record.access_options || []).find(option => option.purchase_type === 'ppv' || option.purchase_type === 'subscription' || option.label === 'WATCH NOW');
    return <Shell seo={{ title: `${title} / FLESHLAB`, description, image, schemaType: 'VideoObject', schemaData: videoObject ? { videoObject } : {}, breadcrumbItems }}><main className="public-main public-detail video-detail"><div className="detail-kicker">FLESHLAB / VIDEO</div><section className="video-purchase-hero"><div className="video-purchase-media"><ProtectedPlayback record={record} image={image} title={title} previewUrl={previewUrl} onPreviewMetadata={setPreviewRuntime} onPreviewStarted={handlePreviewStarted} onPreviewCompleted={handlePreviewCompleted} previewCompleted={previewCompleted} conversionOption={conversionOption}/></div><div className="video-purchase-copy"><span className="detail-stamp">FLESHLAB VIDEO</span><h1>{title}</h1><p className="video-performer"><PerformerLinks performers={record.performers || []}/>{!record.performers?.length && (record.brand_name || 'FLESHLAB')}</p><p className="video-teaser">{description}</p><FilmMetadataBlock record={record} previewAvailable={Boolean(previewUrl)} previewRuntime={previewRuntime || formatRuntime(record.preview_duration_seconds)}/><AccessStatus record={record}/></div></section><section className="detail-section video-related-section"><SectionLabel number={false} title="MORE TO WATCH" detail="Related creator-led videos"/><ArchiveGrid records={data.related}/></section></main></Shell>;
  }
  return <Shell seo={{ title: `${title} / FLESHLAB`, description, image, schemaType: 'WebPage', breadcrumbItems }}><main className="public-main public-detail performer-detail"><div className="detail-kicker">FLESHLAB / CREATOR</div><section className="detail-profile-hero"><div className="detail-profile-media"><Image record={record} alt={`Portrait of ${title}`} eager/></div><div className="detail-profile-copy"><span className="detail-stamp">CREATOR PROFILE</span><h1>{title}</h1><p>{description}</p><a className="raw-button raw-button-red" href="#performer-videos">EXPLORE VIDEOS <span>↘</span></a></div></section><div className="dossier-meta"><span>PUBLIC NAME</span><strong>{record.display_name || record.name}</strong><span>APPEARANCES</span><strong>{data.videos?.length || 0} public videos</strong></div><section className="detail-section"><SectionLabel number={false} title="LABEL AFFILIATION"/><div className="public-label-list">{labels.length ? labels.map(label => <span key={label.id || label.slug}>{esc(label.name)}</span>) : <span>NO PUBLIC LABEL AFFILIATION</span>}</div></section><section className="detail-section" id="performer-videos"><SectionLabel number={false} title="RELATED VIDEOS"/><ArchiveGrid records={data.videos}/></section></main></Shell>;
}

function Collection({ slug }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { get(`/collections/${encodeURIComponent(slug)}`).then(setData).catch(e => setError(e.message)); }, [slug]);
  const record = data?.record;
  const breadcrumbItems = [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }, { name: 'Series', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/collections` }, ...(record ? [{ name: record.title, item: `${PUBLIC_CANONICAL_ORIGIN}/v3/collections/${record.slug}` }] : [])];
  const image = imageFor(record) || imageFor(data?.videos?.[0]);
  return <Shell seo={{ title: `${record?.title || 'Series'} / FLESHLAB`, description: record?.description || 'A FLESHLAB series.', image, schemaType: 'WebPage', breadcrumbItems }}><main className="public-main public-detail">{error ? <div className="public-empty">{error}</div> : !data ? <div className="public-empty">Loading series…</div> : <><div className="detail-kicker">FLESHLAB / SERIES</div><div className="detail-heading"><span className="detail-stamp">SERIES</span><h1>{record.title}</h1><p>{record.description || 'A FLESHLAB series.'}</p></div><section className="detail-section"><SectionLabel number="SERIES" title="VIDEOS IN THIS SERIES"/><ArchiveGrid records={data.videos}/></section></>}</main></Shell>;
}
function CollectionListing() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { get('/collections').then(setData).catch(e => setError(e.message)); }, []);
  const image = imageFor(data?.records?.find(item => item.slug !== 'new-releases')) || fleshlabAmateurWins;
  return <Shell seo={{ title: 'Series / FLESHLAB', description: 'Public FLESHLAB series and projects.', image, schemaType: 'WebPage', breadcrumbItems: [{ name: 'FLESHLAB', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/` }, { name: 'Series', item: `${PUBLIC_CANONICAL_ORIGIN}/v3/collections` }] }}><main className="public-main public-listing public-listing-collections"><section className="archive-title"><span className="archive-kicker">FLESHLAB / SERIES</span><h1>THE SERIES.</h1><p>Projects, chapters and rooms from the FLESHLAB world.</p></section>{error ? <p className="error">{error}</p> : <div className="series-index">{data?.records?.map((item, index) => <SeriesPoster key={item.id || item.slug} collection={item} fallbackRecord={data.records[index - 1]}/>)}</div>}</main></Shell>;
}

export function PublicApp() { const path = window.location.pathname.replace(/^\/v3\/?/, ''); if (!path) return <BrandHome/>; const parts = path.split('/').filter(Boolean); if (parts[0] === 'home') return <BrandHome/>; if (parts[0] === 'library') return <Shell seo={{title:'Your FLESHLAB library',noindex:true}}><PurchaseLibrary/></Shell>; if (parts[0] === 'pricing') return <PricingPage/>; if (parts[0] === 'become-a-creator') return <RecruitmentPage pageKey={parts[1] || 'hub'}/>; if (parts[0] === 'performer-application') return <PerformerApplication/>; if (parts[0] === 'checkout') return <Shell seo={{ title: 'Secure checkout / FLESHLAB', description: 'Secure FLESHLAB payment checkout.', noindex: true }}><PaymentCheckout query={new URLSearchParams(window.location.search)}/></Shell>; if (parts[0] === 'catalogue') return <Listing kind="videos"/>; if (parts[0] === 'videos' && parts[1]) return <Detail kind="videos" slug={parts[1]}/>; if (parts[0] === 'performers' && parts[1]) return <Detail kind="performers" slug={parts[1]}/>; if (parts[0] === 'brands' && parts[1]) return <Detail kind="brands" slug={parts[1]}/>; if (parts[0] === 'collections' && parts[1]) return <Collection slug={parts[1]}/>; if (parts[0] === 'collections') return <CollectionListing/>; if (['videos', 'performers', 'brands'].includes(parts[0])) return <Listing kind={parts[0]}/>; return <BrandHome/>; }
