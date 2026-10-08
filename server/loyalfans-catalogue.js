import { createHash } from 'node:crypto';
import { normalizeLoyalFansTimestamp } from './loyalfans-timestamps.js';

const PROVIDER = 'loyalfans';
const UID_PATTERN = /^[A-Za-z0-9_-]{16,255}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const SENSITIVE_QUERY_KEY = /^(expires|signature|key-pair-id|token|sig|auth|x-amz-.+)$/i;

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function text(value, max = 10000) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result ? result.slice(0, max) : null;
}

function sourceContent(value) {
  return typeof value === 'string' ? value : null;
}

function publicHttpsUrl(value, { product = false } = {}) {
  const raw = text(value, 4096);
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw invalid('INVALID_EXTERNAL_URL', 'External URLs must be valid HTTPS URLs.');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw invalid('INVALID_EXTERNAL_URL', 'External URLs must be public HTTPS URLs without credentials.');
  }
  if ([...parsed.searchParams.keys()].some(key => SENSITIVE_QUERY_KEY.test(key))) {
    throw invalid('EPHEMERAL_EXTERNAL_URL', 'Signed or credential-bearing external URLs must not be persisted.');
  }
  const host = parsed.hostname.toLowerCase();
  if (product && !(host === 'loyalfans.com' || host.endsWith('.loyalfans.com') || host === 'tinylf.com' || host.endsWith('.tinylf.com'))) {
    throw invalid('INVALID_PROVIDER_PRODUCT_URL', 'LoyalFans product URLs must use a LoyalFans public domain.');
  }
  return parsed.toString();
}

export function normalizeLoyalFansPublicProductUrl(value) {
  return publicHttpsUrl(value, { product: true });
}

function moneyToMinor(value) {
  if (value === null || value === undefined || value === '') return null;
  const raw = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    throw invalid('INVALID_EXTERNAL_PRICE', 'External price must be a non-negative decimal with at most two fraction digits.');
  }
  const [whole, fraction = ''] = raw.split('.');
  const cents = `${fraction}00`.slice(0, 2);
  const minor = Number(whole) * 100 + Number(cents);
  if (!Number.isSafeInteger(minor)) throw invalid('INVALID_EXTERNAL_PRICE', 'External price is outside the supported range.');
  return minor;
}

/**
 * Normalizes an already-authorized, manually captured public product record.
 * This legacy public-record helper does not fetch or ingest media. Live Store
 * synchronization uses normalizeLoyalFansCatalogueItem and the registered
 * catalogue service; purchased private media uses the generic fulfillment runtime.
 */
export function normalizeLoyalFansProduct(record) {
  const uid = text(record?.uid, 255);
  if (!uid || !UID_PATTERN.test(uid)) throw invalid('INVALID_EXTERNAL_PRODUCT_ID', 'A valid LoyalFans product UID is required.');

  const productUrl = normalizeLoyalFansPublicProductUrl(record.product_url || record.short_url);
  if (!productUrl) throw invalid('MISSING_EXTERNAL_PRODUCT_URL', 'A public LoyalFans product URL is required.');

  const currency = text(record.currency, 3)?.toUpperCase() || null;
  if (currency && !CURRENCY_PATTERN.test(currency)) throw invalid('INVALID_EXTERNAL_CURRENCY', 'External currency must be a three-letter ISO code.');
  const priceMinor = moneyToMinor(record.price);
  if ((priceMinor === null) !== (currency === null)) {
    throw invalid('INCOMPLETE_EXTERNAL_PRICE', 'External price and currency must be supplied together.');
  }

  const thumbnailUrl = publicHttpsUrl(record.thumbnail_url || record.image_url);
  return {
    provider: PROVIDER,
    external_product_id: uid,
    external_product_slug: text(record.slug, 255),
    external_product_url: productUrl,
    external_checkout_url: null,
    external_thumbnail_url: thumbnailUrl,
    external_price_minor: priceMinor,
    external_currency: currency,
    title: text(record.title, 500),
    description: text(record.description || record.content),
    published_at: text(record.published_at || record.created_at, 64),
    updated_at: text(record.updated_at, 64),
    sync_capability: 'manual_authorized_capture_only',
    checkout_capability: 'unverified',
    entitlement_capability: 'unverified',
    playback_capability: 'unsupported'
  };
}

/**
 * Audits supplied page snapshots without performing network discovery.
 * Duplicate records are retained only as audit metadata; the returned products
 * are strictly deduplicated by provider product UID.
 */
export function auditLoyalFansCataloguePages(pages) {
  if (!Array.isArray(pages)) throw invalid('INVALID_CATALOGUE_PAGES', 'Catalogue pages must be an array.');
  const productsByUid = new Map();
  const duplicates = [];
  let itemCount = 0;

  for (const page of pages) {
    const records = Array.isArray(page?.records) ? page.records : [];
    for (const record of records) {
      itemCount += 1;
      const product = normalizeLoyalFansProduct(record);
      if (productsByUid.has(product.external_product_id)) {
        duplicates.push({
          external_product_id: product.external_product_id,
          first_page: productsByUid.get(product.external_product_id).page,
          duplicate_page: page?.page ?? null
        });
        continue;
      }
      productsByUid.set(product.external_product_id, { page: page?.page ?? null, product });
    }
  }

  return {
    page_count: pages.length,
    item_count: itemCount,
    unique_uid_count: productsByUid.size,
    duplicate_count: duplicates.length,
    duplicates,
    products: [...productsByUid.values()].map(entry => entry.product)
  };
}

function sourceTimestamp(value, field) {
  try { return normalizeLoyalFansTimestamp(value); }
  catch { throw invalid('INVALID_CATALOGUE_TIMESTAMP', `${field} must be a valid timestamp.`); }
}

function optionalBoolean(value, field) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'boolean') throw invalid('INVALID_CATALOGUE_BOOLEAN', `${field} must be a boolean.`);
  return value;
}

function optionalPositiveNumber(value, field, { integer = false } = {}) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || (integer && !Number.isSafeInteger(number))) {
    throw invalid('INVALID_CATALOGUE_DIMENSION', `${field} must be a positive ${integer ? 'integer' : 'number'}.`);
  }
  return number;
}

// Rounded upstream display sizes are metadata, never an exact upload size or validation target.
function downloadableFileSize(value) {
  if (value == null || value === '') return { bytes: null, display: null };
  const failure = () => invalid('INVALID_CATALOGUE_FILE_SIZE', 'The optional downloadable file size is invalid.');
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value <= 0) throw failure();
    return { bytes: value, display: null };
  }
  if (typeof value !== 'string' || value.length > 128) throw failure();
  if (/^\s*\d+\s*$/.test(value)) {
    const bytes = Number(value);
    if (!Number.isSafeInteger(bytes) || bytes <= 0) throw failure();
    return { bytes, display: value };
  }
  const match = /^\s*(\d+(?:\.\d+)?)\s*(?:[KMGTPE]?B|[KMGTPE]iB)\s*$/i.exec(value);
  if (!match || !Number.isFinite(Number(match[1])) || Number(match[1]) <= 0) throw failure();
  return { bytes: null, display: value };
}

function mediaSource(value, sourceVersion = '') {
  if (value === null || value === undefined || value === '') return null;
  const failed = code => ({ url: null, source_fingerprint: null, error_code: code });
  if (typeof value !== 'string') return failed('UNSUPPORTED_CATALOGUE_MEDIA_SHAPE');
  let parsed;
  try { parsed = new URL(value); } catch { return failed('INVALID_CATALOGUE_MEDIA_URL'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    return failed('INVALID_CATALOGUE_MEDIA_URL');
  }
  // The signed query may be required for this one-time server-side copy. Only
  // its query-free resource identity is persisted; the URL itself is transient.
  return {
    url: parsed.toString(),
    source_fingerprint: createHash('sha256').update(`${parsed.origin}${parsed.pathname}\n${sourceVersion || ''}`).digest('hex')
  };
}

/**
 * Normalizes the observed creator `videos-store` item. Media URLs are returned
 * separately for immediate ingestion and must never be written to SQL or API
 * responses. Per-viewer `is_bought` is intentionally ignored.
 */
export function normalizeLoyalFansCatalogueItem(record, { currency = null } = {}) {
  const postUid = text(record?.uid, 255);
  if (!postUid || !UID_PATTERN.test(postUid)) throw invalid('INVALID_EXTERNAL_PRODUCT_ID', 'A valid LoyalFans post UID is required.');
  const video = record?.video_object;
  const videoUid = text(video?.uid, 255);
  if (!videoUid || !UID_PATTERN.test(videoUid)) throw invalid('MISSING_LOYALFANS_VIDEO_UID', 'The LoyalFans video UID is required.');
  const title = text(record?.title, 500);
  if (!title) throw invalid('MISSING_EXTERNAL_PRODUCT_TITLE', 'A LoyalFans catalogue title is required.');
  const normalizedCurrency = text(currency, 3)?.toUpperCase() || null;
  if (!normalizedCurrency || !CURRENCY_PATTERN.test(normalizedCurrency)) {
    throw invalid('LOYALFANS_CATALOGUE_CURRENCY_REQUIRED', 'Configure the creator account settlement currency before syncing commercial prices.');
  }
  const currentPriceMinor = moneyToMinor(record?.price);
  if (currentPriceMinor === null) throw invalid('MISSING_EXTERNAL_PRICE', 'A current LoyalFans price is required.');
  const oldPriceMinor = moneyToMinor(record?.old_price);
  const discountPercent = record?.discount_percent === null || record?.discount_percent === undefined || record?.discount_percent === ''
    ? null : Number(record.discount_percent);
  if (discountPercent !== null && (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
    throw invalid('INVALID_EXTERNAL_DISCOUNT', 'Discount percent must be between zero and one hundred.');
  }
  const dimensions = video?.size || {};
  const downloadableMeta = video?.downloadable_video_meta || {};
  const fileSize = downloadableFileSize(downloadableMeta.size);
  const sourceUpdatedAt = sourceTimestamp(record?.updated_at, 'updated_at');
  const poster = mediaSource(video?.poster || record?.image_placeholder, sourceUpdatedAt || '');
  const trailer = mediaSource(video?.video_trailer, sourceUpdatedAt || '');
  const canBuy = optionalBoolean(record?.can_buy, 'can_buy');
  const canSee = optionalBoolean(record?.can_see, 'can_see');

  const metadata = {
    provider: PROVIDER,
    post_uid: postUid,
    video_uid: videoUid,
    video_available: typeof record?.video === 'boolean' ? record.video : null,
    video_legacy_id: null,
    owner_uid: text(record?.owner?.uid, 255),
    short_url: normalizeLoyalFansPublicProductUrl(record?.short_url),
    slug: text(record?.slug, 255),
    title,
    description: sourceContent(record?.content),
    clean_description: sourceContent(record?.clean_content),
    hashtags: Array.isArray(record?.hashtags) ? [...new Set(record.hashtags.filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))].slice(0, 100) : [],
    current_price_minor: currentPriceMinor,
    old_price_minor: oldPriceMinor,
    currency: normalizedCurrency,
    discount_percent: discountPercent,
    discount_expire_at: sourceTimestamp(record?.discount_expire_at, 'discount_expire_at'),
    duration_seconds: optionalPositiveNumber(video?.duration, 'video_object.duration'),
    width: optionalPositiveNumber(dimensions.width, 'video_object.size.width', { integer: true }),
    height: optionalPositiveNumber(dimensions.height, 'video_object.size.height', { integer: true }),
    mime_type: text(video?.mime, 255),
    preview_option: text(video?.preview_option, 100),
    orientation: text(video?.orientation, 40),
    downloadable_resolution: text(downloadableMeta.resolution, 80),
    downloadable_format: text(downloadableMeta.format, 80),
    downloadable_size_bytes: fileSize.bytes,
    downloadable_size_display: fileSize.display,
    downloadable: optionalBoolean(record?.downloadable, 'downloadable'),
    can_buy: canBuy,
    can_see: canSee,
    availability_state: canBuy === true ? 'available' : canBuy === false ? 'unavailable' : 'unknown',
    privacy_rule: text(record?.privacy?.privacy_rule, 255),
    source_created_at: sourceTimestamp(record?.created_at, 'created_at'),
    source_updated_at: sourceUpdatedAt,
    poster_source_fingerprint: poster?.source_fingerprint || null,
    trailer_source_fingerprint: trailer?.source_fingerprint || null
  };

  const fingerprint = createHash('sha256').update(JSON.stringify(metadata)).digest('hex');
  return { metadata: { ...metadata, metadata_fingerprint: fingerprint }, media: { poster, trailer } };
}

export function validateLoyalFansCataloguePage(payload, requestedPage) {
  const meta = payload?.page_meta;
  if (!payload || payload.success !== true || Number(payload.httpCode) !== 200 || !Array.isArray(payload.list)) {
    throw invalid('INVALID_LOYALFANS_CATALOGUE_ENVELOPE', 'The creator catalogue response did not match the observed envelope.');
  }
  const fields = ['total', 'per_page', 'current_page', 'last_page', 'from', 'to'];
  if (!meta || typeof meta!=='object' || Array.isArray(meta) || fields.some(key => !Number.isSafeInteger(meta[key])) ||
      !Number.isSafeInteger(requestedPage) || requestedPage<1) {
    throw invalid('INVALID_LOYALFANS_CATALOGUE_PAGE_META', 'The creator catalogue page metadata is incomplete.');
  }
  const total = Number(meta.total);
  const perPage = Number(meta.per_page);
  const currentPage = Number(meta.current_page);
  const lastPage = Number(meta.last_page);
  // Captured page_meta uses a zero-based, end-exclusive [from,to) range.
  const from=meta.from;
  const to=meta.to;
  if (total < 0 || perPage < 1 || currentPage !== requestedPage || lastPage < 1 || currentPage > lastPage ||
      lastPage > Math.max(1,total) || payload.list.length > perPage ||
      (total > 0 && payload.list.length === 0) || from<0 || to<from || to-from!==payload.list.length || to>total ||
      (currentPage===1 && from!==0) || (currentPage===lastPage && to!==total)) {
    throw invalid('INVALID_LOYALFANS_CATALOGUE_PAGINATION', 'Creator catalogue pagination metadata is inconsistent.');
  }
  return { total, per_page: perPage, current_page: currentPage, last_page: lastPage,
    from: Number(meta.from), to: Number(meta.to), records: payload.list };
}

/** Fetches every page through the provider boundary; this function never
 * constructs LoyalFans URLs or request parameters. */
export async function fetchAllLoyalFansCataloguePages(fetchPage, { maxPages = 100, maxItems = 10000 } = {}) {
  if (typeof fetchPage !== 'function') throw new TypeError('A provider page loader is required.');
  if(!Number.isInteger(maxPages) || maxPages<1 || maxPages>100)throw invalid('INVALID_LOYALFANS_CATALOGUE_BOUND','A bounded page scan is required.');
  if(!Number.isInteger(maxItems) || maxItems<1 || maxItems>100000)throw invalid('INVALID_LOYALFANS_CATALOGUE_BOUND','A bounded item scan is required.');
  const pages = [];
  const ids=new Set();
  let expected = null;
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchPage({ page });
    const parsed = validateLoyalFansCataloguePage(response, page);
    if(parsed.last_page>maxPages || parsed.total>maxItems || ids.size+parsed.records.length>maxItems){
      throw invalid('INCOMPLETE_LOYALFANS_CATALOGUE','The creator catalogue exceeded the configured safety bounds.');
    }
    if (expected && (parsed.total !== expected.total || parsed.per_page !== expected.per_page || parsed.last_page !== expected.last_page)) {
      throw invalid('INCONSISTENT_LOYALFANS_CATALOGUE_PAGES', 'Catalogue pagination changed during the scan.');
    }
    if(parsed.from!==ids.size)throw invalid('INCONSISTENT_LOYALFANS_CATALOGUE_PAGES','Catalogue page ranges do not continue the scan.');
    expected = parsed;
    for(const item of parsed.records){
      if(typeof item?.uid!=='string' || !UID_PATTERN.test(item.uid) || ids.has(item.uid))throw invalid('REPEATED_LOYALFANS_CATALOGUE_ITEM','Catalogue identities repeat or are invalid during the scan.');
      ids.add(item.uid);
    }
    pages.push(parsed);
    if (page === parsed.last_page) {
      const records = pages.flatMap(entry => entry.records);
      if (records.length !== parsed.total) throw invalid('INCOMPLETE_LOYALFANS_CATALOGUE', 'The bounded creator catalogue scan did not return the declared item count.');
      return { pages, records, page_meta: { total: parsed.total, per_page: parsed.per_page, last_page: parsed.last_page } };
    }
  }
  throw invalid('INCOMPLETE_LOYALFANS_CATALOGUE', 'The creator catalogue exceeded the bounded page scan.');
}

export const LOYALFANS_CATALOGUE_PROVIDER = PROVIDER;
