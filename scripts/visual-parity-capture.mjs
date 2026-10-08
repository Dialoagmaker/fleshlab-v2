import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const outputDir = path.join(repoRoot, 'tmp', 'visual-parity');
const referencePath = path.join(repoRoot, 'docs', 'design-reference', 'mockup-fleshlab.png');
const viewport = (() => {
  const [width, height] = String(process.env.VISUAL_PARITY_VIEWPORT || '1672x941').split('x').map(Number);
  return { width: width || 1672, height: height || 941 };
})();
const baseUrl = String(process.env.VISUAL_PARITY_BASE_URL || 'http://127.0.0.1:4177').replace(/\/$/, '');
const dataSource = String(process.env.VISUAL_PARITY_DATA_SOURCE || 'fixtures').toLowerCase();
const useFixtures = dataSource === 'fixtures';
const useRealData = dataSource === 'real';
const realApiOrigin = String(process.env.VISUAL_PARITY_API_ORIGIN || 'https://fleshlab.online').replace(/\/$/, '');
const artifactPrefix = String(process.env.VISUAL_PARITY_ARTIFACT_PREFIX || '').trim();
const artifactPath = name => path.join(outputDir, artifactPrefix ? `${artifactPrefix}-${name}` : name);

const asset = relative => `${baseUrl}/v3/src/assets/${relative}`;
const fixtureVideo = (index, performer) => ({
  id: `visual-qa-video-${index}`,
  slug: `visual-qa-video-${index}`,
  title: `Visual QA fixture ${String(index).padStart(2, '0')}`,
  short_summary: 'Development-only visual comparison fixture.',
  full_duration_seconds: 480 + index * 37,
  duration_seconds: 480 + index * 37,
  thumbnail_url: asset(['recruitment/creator-studio-group.png', 'recruitment/new-creator-phone.png', 'recruitment/existing-creators-camera.png', 'recruitment/international-creator-city.png', 'recruitment/gay-creators-studio.png'][index % 5]),
  brand_name: ['FLESHLAB ASIA', 'FLESHLAB BAREBACK TWINKS', 'TWINKS GLOBAL'][index % 3],
  brand_slug: ['fleshlabasia', 'fleshlab-bareback-twinks', 'fleshlab-twinks-global'][index % 3],
  performers: [{ id: performer.id, name: performer.display_name, slug: performer.slug }]
});

const fixturePayload = () => {
  const performer = {
    id: 'visual-qa-performer',
    slug: 'visual-qa-performer',
    display_name: 'Visual QA Performer',
    public_location: 'LOCAL DEVELOPMENT',
    profile_image_url: asset('recruitment/male-performer-fitness.png')
  };
  const videos = Array.from({ length: 8 }, (_, index) => fixtureVideo(index + 1, performer));
  return {
    homepage: {
      hero: {
        kind: 'video',
        record: videos[0],
        image: videos[0].thumbnail_url,
        eyebrow: 'FLESHLAB / INDEPENDENT STUDIO',
        title: 'Stories with presence.',
        summary: 'Development-only fixture data used to render the approved homepage layout without production requests.',
        cta_label: 'Explore videos',
        cta_target: '/v3/videos'
      },
      featured_videos: videos.slice(0, 6),
      new_releases: videos.slice(2),
      featured_performers: [performer],
      featured_collections: [],
      sections: { featured_videos: true, new_releases: true, performers: true, collections: true, creator_cta: true, trust: true }
    },
    brands: [
      { id: 'visual-qa-brand-asia', slug: 'fleshlabasia', name: 'FLESHLAB ASIA', description: 'Development-only visual comparison fixture.' },
      { id: 'visual-qa-brand-bareback', slug: 'fleshlab-bareback-twinks', name: 'FLESHLAB BAREBACK TWINKS', description: 'Development-only visual comparison fixture.' },
      { id: 'visual-qa-brand-global', slug: 'fleshlab-twinks-global', name: 'TWINKS GLOBAL', description: 'Development-only visual comparison fixture.' }
    ],
    offers: [
      { id: 'visual-qa-plan-1', plan_key: 'visual-qa-monthly', name: 'Monthly access', amount_minor: 1999, currency: 'USD', interval: 'month', description: 'Development-only visual comparison fixture.' },
      { id: 'visual-qa-plan-2', plan_key: 'visual-qa-quarterly', name: 'Quarterly access', amount_minor: 4999, currency: 'USD', interval: 'month', description: 'Development-only visual comparison fixture.' },
      { id: 'visual-qa-plan-3', plan_key: 'visual-qa-yearly', name: 'Annual access', amount_minor: 14999, currency: 'USD', interval: 'year', description: 'Development-only visual comparison fixture.' },
      { id: 'visual-qa-plan-4', plan_key: 'visual-qa-studio', name: 'Studio access', amount_minor: 24999, currency: 'USD', interval: 'year', description: 'Development-only visual comparison fixture.' }
    ]
  };
};

const publicMediaKeys = new Set([
  'image', 'thumbnail_url', 'poster_url', 'profile_image_url', 'cover_image_url',
  'legacy_cover_image_url', 'legacy_profile_image_url', 'legacy_logo_url',
  'cover_asset_reference', 'logo_url', 'asset_url'
]);

function normalizePublicMedia(value, key = '') {
  if (Array.isArray(value)) return value.map(item => normalizePublicMedia(item, key));
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && publicMediaKeys.has(key) && value.startsWith('/')) return `${realApiOrigin}${value}`;
    return value;
  }
  return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, normalizePublicMedia(childValue, childKey)]));
}

async function fetchRealPayload() {
  const getJson = async endpoint => {
    const response = await fetch(`${realApiOrigin}${endpoint}`, { headers: { accept: 'application/json' } });
    const body = await response.json();
    if (!response.ok) throw new Error(`Real FLESHLAB API request failed (${response.status}): ${endpoint}`);
    return body;
  };
  const [homepage, brands, offers] = await Promise.all([
    getJson('/api/v3/public/homepage'),
    getJson('/api/v3/public/brands?limit=12'),
    getJson('/api/v3/public/commerce/membership-offers')
  ]);
  const featuredPerformers = homepage?.featured_performers || [];
  const selectedPerformer = featuredPerformers.find(item => /elias/i.test(String(item?.display_name || ''))) || featuredPerformers[0];
  const performerProfile = selectedPerformer?.slug ? await getJson(`/api/v3/public/performers/${encodeURIComponent(selectedPerformer.slug)}`) : null;
  return {
    homepage: normalizePublicMedia(homepage),
    performerProfile: normalizePublicMedia(performerProfile),
    brands: normalizePublicMedia(brands),
    offers: normalizePublicMedia(offers)
  };
}

const recordImagePresent = record => Boolean(record && (
  record.thumbnail_url || record.poster_url || record.profile_image_url || record.cover_image_url ||
  record.legacy_cover_image_url || record.legacy_profile_image_url || record.legacy_logo_url ||
  record.cover_asset_reference || record.image
));

function summarizeRealData(payload) {
  const homepage = payload.homepage || {};
  const featured = homepage.featured_videos || [];
  const releases = homepage.new_releases || [];
  const profileVideos = payload.performerProfile?.videos || [];
  const allVideos = [...profileVideos, ...featured, ...releases].filter((item, index, list) => item && list.findIndex(other => (other.id || other.slug) === (item.id || item.slug)) === index);
  const performers = homepage.featured_performers || [];
  const performer = payload.performerProfile?.record || performers.find(item => /elias/i.test(String(item?.display_name || ''))) || performers[0] || null;
  const brands = Array.isArray(payload.brands) ? payload.brands : payload.brands?.records || [];
  const offers = Array.isArray(payload.offers) ? payload.offers : payload.offers?.records || [];
  const performerTokens = new Set([performer?.id, performer?.slug, performer?.display_name].filter(Boolean).map(value => String(value).toLowerCase()));
  const hasPerformer = video => (video?.performers || []).some(item => [item?.id, item?.slug, item?.name, item?.display_name].filter(Boolean).some(value => performerTokens.has(String(value).toLowerCase())));
  const storyVideos = [...featured.slice(0, 3), featured[4], featured[5], ...allVideos.filter(hasPerformer)]
    .filter((video, index, list) => video && list.findIndex(other => (other.id || other.slug) === (video.id || video.slug)) === index)
    .slice(0, 5);
  const latestVideos = (releases.length ? releases : featured).slice(0, 3);
  const compactVideo = video => ({
    id: video?.id || null,
    slug: video?.slug || null,
    title: video?.title || video?.public_title || video?.editorial_title || null,
    duration_seconds: video?.full_duration_seconds ?? video?.duration_seconds ?? null,
    thumbnail_present: recordImagePresent(video),
    performers: (video?.performers || []).slice(0, 5).map(item => ({ id: item?.id || null, slug: item?.slug || null, name: item?.name || item?.display_name || null }))
  });
  return {
    source: realApiOrigin,
    homepage_counts: {
      featured_videos: featured.length,
      new_releases: releases.length,
      featured_performers: performers.length,
      featured_collections: (homepage.featured_collections || []).length
    },
    selected_hero: {
      id: homepage.hero?.record?.id || homepage.hero?.id || null,
      slug: homepage.hero?.record?.slug || homepage.hero?.slug || null,
      title: homepage.hero?.record?.title || homepage.hero?.title || null,
      image_present: Boolean(homepage.hero?.image || recordImagePresent(homepage.hero?.record))
    },
    selected_performer: {
      id: performer?.id || null,
      slug: performer?.slug || null,
      display_name: performer?.display_name || performer?.name || null,
      image_present: recordImagePresent(performer),
      associated_story_video_count: allVideos.filter(hasPerformer).length
    },
    story_records: storyVideos.map(compactVideo),
    labels: brands.slice(0, 3).map(brand => ({ id: brand?.id || null, slug: brand?.slug || null, name: brand?.name || null, api_asset_present: recordImagePresent(brand) })),
    latest_videos: latestVideos.map(compactVideo),
    membership_offers: offers.map(offer => ({ id: offer?.id || null, name: offer?.name || offer?.title || offer?.plan_key || null, currency: offer?.currency || null, interval: offer?.interval || null }))
  };
}

const expected = {
  header: { x: 0, y: 0, width: 1672, height: 58 },
  hero: { x: 0, y: 58, width: 1672, height: 310 },
  story: { x: 0, y: 368, width: 1672, height: 228 },
  editorial: { x: 0, y: 596, width: 1672, height: 197 },
  membership: { x: 0, y: 793, width: 1672, height: 148 },
  heroMain: { x: 0, y: 58, width: 1238, height: 310 },
  heroSide: { x: 1238, y: 58, width: 434, height: 310 },
  storyMain: { x: 0, y: 368, width: 1221, height: 228 },
  fanclub: { x: 1221, y: 368, width: 451, height: 228 },
  labels: { x: 0, y: 596, width: 1031, height: 197 },
  latest: { x: 1031, y: 596, width: 641, height: 197 }
};

const referenceGeometry = {
  header: { x: 0, y: 0, width: 1672, height: 58 },
  heroLeft: { x: 0, y: 58, width: 1238, height: 310 },
  recruitment: { x: 1238, y: 58, width: 434, height: 310 },
  story: { x: 0, y: 368, width: 1672, height: 228 },
  storyMain: { x: 0, y: 368, width: 1221, height: 228 },
  fanclub: { x: 1221, y: 368, width: 451, height: 228 },
  labels: { x: 0, y: 596, width: 1031, height: 197 },
  latest: { x: 1031, y: 596, width: 641, height: 197 },
  membership: { x: 0, y: 793, width: 1672, height: 148 }
};

const geometryRegionMap = {
  header: 'header',
  heroLeft: 'heroMain',
  recruitment: 'heroSide',
  story: 'story',
  storyMain: 'storyMain',
  fanclub: 'fanclub',
  labels: 'labels',
  latest: 'latest',
  membership: 'membership'
};

const selectorMap = {
  header: '.reference-nav',
  hero: '.reference-hero',
  story: '.reference-story-row',
  editorial: '.reference-editorial-row',
  membership: '.reference-membership',
  heroMain: '.reference-hero-main',
  heroSide: '.reference-hero-side',
  storyMain: '.reference-story-main',
  fanclub: '.reference-fanclub',
  labels: '.reference-labels',
  latest: '.reference-latest'
};

const roundRect = rect => rect ? Object.fromEntries(['x', 'y', 'width', 'height', 'top', 'right', 'bottom', 'left'].map(key => [key, Math.round(rect[key] * 100) / 100])) : null;

async function ensureOutput() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.copyFile(referencePath, path.join(outputDir, 'reference.png'));
}

async function main() {
  await ensureOutput();
  if (!useFixtures && !useRealData) throw new Error(`Unsupported VISUAL_PARITY_DATA_SOURCE: ${dataSource}`);
  const payload = useRealData ? await fetchRealPayload() : fixturePayload();
  const fixture = useFixtures ? payload : null;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce' });
  const blockedRequests = [];
  const failedRequests = [];
  page.on('requestfailed', request => {
    if (request.url().includes('/api/v3/public/recruitment/events')) return;
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'request failed' });
  });
  await page.route('**/api/v3/public/recruitment/events', route => {
    blockedRequests.push({ method: route.request().method(), url: route.request().url() });
    return route.fulfill({ status: 204, body: '' });
  });
  if (useFixtures) {
    await page.route('**/api/v3/public/homepage*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture.homepage) }));
    await page.route('**/api/v3/public/brands*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ records: fixture.brands, total: fixture.brands.length }) }));
    await page.route('**/api/v3/public/commerce/membership-offers*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ records: fixture.offers }) }));
  }
  if (useRealData) {
    await page.route('**/api/v3/public/homepage*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload.homepage) }));
    await page.route('**/api/v3/public/performers/*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload.performerProfile || { record: null, videos: [] }) }));
    await page.route('**/api/v3/public/brands*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload.brands) }));
    await page.route('**/api/v3/public/commerce/membership-offers*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload.offers) }));
  }
  await page.addStyleTag({ content: '* { animation: none !important; transition: none !important; caret-color: transparent !important; } video { display: none !important; }' });
  await page.goto(`${baseUrl}/v3/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.reference-home');
  if (useRealData) await page.waitForFunction(() => document.querySelector('.reference-home')?.dataset.performerProfileLoaded === 'true');
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await Promise.all(Array.from(document.images).map(image => image.complete ? Promise.resolve() : new Promise(resolve => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }); })));
  });
  await page.waitForTimeout(150);
  const geometry = await page.evaluate((selectors, expectedGeometry) => {
    const result = { viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio }, regions: {}, expected: expectedGeometry, counts: {} };
    for (const [name, selector] of Object.entries(selectors)) result.regions[name] = resultRect(document.querySelector(selector));
    result.counts = {
      storyCards: document.querySelectorAll('.reference-story-card').length,
      labelCards: document.querySelectorAll('.reference-label-card').length,
      videoCards: document.querySelectorAll('.reference-video-card').length,
      planCards: document.querySelectorAll('.reference-plan-card').length,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    };
    return result;
    function resultRect(node) {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return ['x', 'y', 'width', 'height', 'top', 'right', 'bottom', 'left'].reduce((acc, key) => { acc[key] = Math.round(rect[key] * 100) / 100; return acc; }, {});
    }
  }, selectorMap, expected);
  const screenshotPath = artifactPrefix
    ? artifactPath('current-render.png')
    : (useRealData ? artifactPath('current-render.png') : path.join(outputDir, 'fixture-render.png'));
  const currentBuffer = await page.screenshot({ path: screenshotPath, fullPage: false });
  const currentPng = PNG.sync.read(currentBuffer);
  const referencePng = PNG.sync.read(await fs.readFile(referencePath));
  const diffPng = new PNG({ width: Math.min(referencePng.width, currentPng.width), height: Math.min(referencePng.height, currentPng.height) });
  let diffPixels = 0;
  if (referencePng.width === currentPng.width && referencePng.height === currentPng.height) diffPixels = pixelmatch(referencePng.data, currentPng.data, diffPng.data, referencePng.width, referencePng.height, { threshold: .1 });
  else diffPixels = referencePng.width * referencePng.height;
  await fs.writeFile(artifactPath('visual-diff.png'), PNG.sync.write(diffPng));
  if (!artifactPrefix && useRealData) {
    try { await fs.access(artifactPath('baseline.png')); } catch { await fs.copyFile(screenshotPath, artifactPath('baseline.png')); }
  }
  const geometryDelta = Object.fromEntries(Object.entries(expected).map(([name, target]) => {
    const actual = geometry.regions[name];
    return [name, actual ? { x: actual.x - target.x, y: actual.y - target.y, width: actual.width - target.width, height: actual.height - target.height } : null];
  }));
  const geometryTable = Object.fromEntries(Object.entries(referenceGeometry).map(([name, reference]) => {
    const sourceRegion = geometry.regions[geometryRegionMap[name]];
    const current = sourceRegion ? { ...sourceRegion } : null;
    if (name === 'membership' && current) {
      current.height = Math.max(0, Math.min(current.height, viewport.height - current.y));
      current.bottom = current.y + current.height;
    }
    return [name, {
      reference,
      current,
      delta: current ? {
        x: current.x - reference.x,
        y: current.y - reference.y,
        width: current.width - reference.width,
        height: current.height - reference.height
      } : null
    }];
  }));
  geometry.referenceGeometry = referenceGeometry;
  geometry.geometryTable = geometryTable;
  const metrics = {
    generated_at: new Date().toISOString(),
    reference: { path: referencePath, width: referencePng.width, height: referencePng.height },
    render: { width: currentPng.width, height: currentPng.height, viewport, baseUrl, data_source: dataSource, fixtures: useFixtures },
    pixel_diff: { differing_pixels: diffPixels, ratio: (diffPixels / (referencePng.width * referencePng.height)).toFixed(6), note: 'Signal only; geometry, typography, imagery and responsive checks are evaluated separately.' },
    geometry_delta: geometryDelta,
    geometry_table: geometryTable,
    blocked_requests: blockedRequests,
    failed_requests: failedRequests,
    counts: geometry.counts
  };
  await fs.writeFile(artifactPath('geometry.json'), JSON.stringify(geometry, null, 2));
  await fs.writeFile(artifactPath('metrics.json'), JSON.stringify(metrics, null, 2));
  if (useRealData && !artifactPrefix) await fs.writeFile(path.join(outputDir, 'real-data-summary.json'), JSON.stringify(summarizeRealData(payload), null, 2));
  await browser.close();
  console.log(JSON.stringify({ viewport, dataSource, screenshotPath, regions: geometry.regions, counts: geometry.counts, pixelDiff: metrics.pixel_diff, blockedRequests: blockedRequests.length, failedRequests: failedRequests.length }, null, 2));
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
