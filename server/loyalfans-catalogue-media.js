import { createHash } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { isIP } from 'node:net';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const TRAILER_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_TRAILER_BYTES = 512 * 1024 * 1024;
const MAX_SNIFF_BYTES = 4096;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const EBML_SIGNATURE = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const MP4_BRANDS = new Set(['isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'M4V ', 'M4VP', 'dash', 'MSNV']);

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function hostAllowed(host, allowlist) {
  const name = String(host || '').toLowerCase();
  return allowlist.some(entry => name === entry || name.endsWith(`.${entry}`));
}

function ebmlVint(bytes, offset, identifier = false) {
  if (offset >= bytes.length) return null;
  const first = bytes[offset];
  let marker = 0x80;
  let width = 1;
  while (width <= (identifier ? 4 : 8) && !(first & marker)) { marker >>= 1; width += 1; }
  if (width > (identifier ? 4 : 8)) return { invalid: true };
  if (offset + width > bytes.length) return null;
  let value = BigInt(identifier ? first : first & (marker - 1));
  for (let index = 1; index < width; index += 1) value = (value << 8n) | BigInt(bytes[offset + index]);
  if (!identifier && value === (1n << BigInt(7 * width)) - 1n) return { invalid: true };
  return { value, next: offset + width };
}

function isWebm(bytes) {
  if (bytes.length < 4 || !bytes.subarray(0, 4).equals(EBML_SIGNATURE)) return false;
  const headerSize = ebmlVint(bytes, 4);
  if (!headerSize) return null;
  if (headerSize.invalid || headerSize.value > BigInt(MAX_SNIFF_BYTES)) return false;
  const end = headerSize.next + Number(headerSize.value);
  if (end > bytes.length) return null;
  let offset = headerSize.next;
  while (offset < end) {
    const id = ebmlVint(bytes, offset, true);
    if (!id) return null;
    if (id.invalid) return false;
    const size = ebmlVint(bytes, id.next);
    if (!size) return null;
    if (size.invalid) return false;
    const length = Number(size.value);
    const valueEnd = size.next + length;
    if (valueEnd > end) return false;
    if (id.value === 0x4282n) return length === 4 && bytes.toString('ascii', size.next, valueEnd) === 'webm';
    offset = valueEnd;
  }
  return false;
}

function isoBmffMime(bytes) {
  if (bytes.length < 8 || bytes.toString('ascii', 4, 8) !== 'ftyp') return null;
  let boxSize = bytes.readUInt32BE(0);
  let brandsOffset = 8;
  if (boxSize === 1) {
    if (bytes.length < 16) return null;
    const largeSize = bytes.readBigUInt64BE(8);
    if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    boxSize = Number(largeSize);
    brandsOffset = 16;
  }
  if (boxSize === 0 || boxSize < brandsOffset + 8) return null;
  if (bytes.length < brandsOffset + 8) return null;
  const major = bytes.toString('ascii', brandsOffset, brandsOffset + 4);
  const compatible = [];
  for (let offset = brandsOffset + 8; offset + 4 <= Math.min(boxSize, bytes.length); offset += 4) {
    compatible.push(bytes.toString('ascii', offset, offset + 4));
  }
  const brands = [major, ...compatible];
  if (brands.some(brand => brand === 'avif' || brand === 'avis')) return 'image/avif';
  if (brands.includes('qt  ')) return 'video/quicktime';
  if (brands.some(brand => MP4_BRANDS.has(brand))) return 'video/mp4';
  return null;
}

/** Detect only formats whose container signature is unambiguous from the prefix. */
export function detectLoyalFansMediaMime(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes || []);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  const isoBmff = isoBmffMime(bytes);
  if (isoBmff) return isoBmff;
  if (bytes.length >= 4 && bytes.subarray(0, 4).equals(EBML_SIGNATURE)) return isWebm(bytes) ? 'video/webm' : null;
  return null;
}

function allowedForAsset(mime, assetType) {
  return (assetType === 'poster' ? IMAGE_MIME : TRAILER_MIME).has(mime);
}

function normalizedContentType(value) {
  const type = String(value || '').split(';', 1)[0].trim().toLowerCase();
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(type) ? type : null;
}

function safeLength(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  if (!/^\d{1,16}$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function reportDiagnostic(onDiagnostic, fields) {
  if (typeof onDiagnostic !== 'function') return;
  try {
    onDiagnostic({
      asset_type: fields.asset_type,
      normalized_hostname: fields.normalized_hostname || null,
      http_status: fields.http_status ?? null,
      declared_content_type: fields.declared_content_type || null,
      detected_mime_type: fields.detected_mime_type || null,
      content_length: fields.content_length ?? null,
      error_code: fields.error_code
    });
  } catch { /* Diagnostics must never change an ingestion result. */ }
}

async function readSniffPrefix(stream, assetType) {
  const iterator = stream[Symbol.asyncIterator]();
  const buffered = [];
  let prefix = Buffer.alloc(0);
  let done = false;
  let detectedMime = null;
  while (!detectedMime && prefix.length < MAX_SNIFF_BYTES && !done) {
    const next = await iterator.next();
    done = next.done;
    if (done) break;
    const chunk = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value);
    buffered.push(chunk);
    const remaining = MAX_SNIFF_BYTES - prefix.length;
    prefix = Buffer.concat([prefix, chunk.subarray(0, remaining)]);
    detectedMime = detectLoyalFansMediaMime(prefix);
  }
  if (!detectedMime || !allowedForAsset(detectedMime, assetType)) {
    await iterator.return?.();
    throw invalid('CATALOGUE_MEDIA_TYPE_UNSUPPORTED', 'The catalogue media bytes do not identify a supported format.');
  }
  const replay = Readable.from((async function* () {
    for (const chunk of buffered) yield chunk;
    if (!done) {
      while (true) {
        const next = await iterator.next();
        if (next.done) break;
        yield next.value;
      }
    }
  })());
  return { detectedMime, replay };
}

function fileExtension(mime) {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' })[mime];
}

export function createLoyalFansMediaCopier({ blob, fetchImpl = globalThis.fetch, allowedHosts = [], onDiagnostic } = {}) {
  const hosts = [...new Set(allowedHosts.map(value => String(value || '').trim().toLowerCase()).filter(value => /^[a-z0-9.-]+$/.test(value)))];
  return async function copyMedia({ url, sourceFingerprint, postUid, assetType }) {
    let source = null;
    let response = null;
    let detectedMime = null;
    let declaredType = null;
    let contentLength = null;
    let contentLengthWasPresent = false;
    let storageKey = null;
    let status = null;
    let timer = null;
    let controller = null;
    try {
      if (!blob || typeof blob.uploadStream !== 'function') throw invalid('CATALOGUE_MEDIA_STORAGE_UNAVAILABLE', 'FLESHLAB media storage is unavailable.');
      if (typeof fetchImpl !== 'function') throw invalid('CATALOGUE_MEDIA_FETCH_UNAVAILABLE', 'Media retrieval is unavailable.');
      if (!['poster', 'trailer'].includes(assetType)) throw invalid('CATALOGUE_MEDIA_TYPE_INVALID', 'Unsupported LoyalFans catalogue media type.');
      try { source = new URL(url); } catch { throw invalid('CATALOGUE_MEDIA_URL_INVALID', 'The catalogue media source is invalid.'); }
      if (source.protocol !== 'https:' || source.username || source.password || isIP(source.hostname) || !hostAllowed(source.hostname, hosts)) {
        throw invalid('CATALOGUE_MEDIA_HOST_NOT_ALLOWED', 'The catalogue media host is not allowlisted for server-side ingestion.');
      }
      const maximumBytes = assetType === 'poster' ? MAX_IMAGE_BYTES : MAX_TRAILER_BYTES;
      controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 120_000);
      try { response = await fetchImpl(source.toString(), { method: 'GET', headers: { accept: assetType === 'poster' ? 'image/*' : 'video/*' }, redirect: 'error', signal: controller.signal }); }
      catch { throw invalid('CATALOGUE_MEDIA_FETCH_FAILED', 'The catalogue media could not be retrieved.'); }
      status = Number.isInteger(response.status) ? response.status : null;
      declaredType = normalizedContentType(response.headers?.get?.('content-type'));
      const rawLength = response.headers?.get?.('content-length');
      contentLengthWasPresent = rawLength != null;
      contentLength = safeLength(rawLength);
      if (!response.ok || !response.body) throw invalid(status === 401 || status === 403 || status === 410 ? 'CATALOGUE_MEDIA_SOURCE_EXPIRED' : 'CATALOGUE_MEDIA_FETCH_FAILED', 'The catalogue media could not be retrieved.');
      if (rawLength != null && contentLength == null) throw invalid('CATALOGUE_MEDIA_LENGTH_INVALID', 'The catalogue media length is invalid.');
      if (contentLength != null && contentLength > maximumBytes) throw invalid('CATALOGUE_MEDIA_TOO_LARGE', 'The catalogue media exceeds the ingestion size limit.');

      const sniffed = await readSniffPrefix(Readable.fromWeb(response.body), assetType);
      detectedMime = sniffed.detectedMime;
      const extension = fileExtension(detectedMime);
      const hash = createHash('sha256');
      let byteSize = 0;
      const meter = new Transform({
        transform(chunk, _encoding, callback) {
          byteSize += chunk.length;
          if (byteSize > maximumBytes) return callback(invalid('CATALOGUE_MEDIA_TOO_LARGE', 'The catalogue media exceeds the ingestion size limit.'));
          hash.update(chunk);
          callback(null, chunk);
        }
      });
      const fingerprint = /^[0-9a-f]{64}$/.test(sourceFingerprint || '') ? sourceFingerprint : createHash('sha256').update(source.pathname).digest('hex');
      storageKey = `loyalfans/catalogue/${postUid}/${assetType}/${fingerprint}.${extension}`;
      const uploadStream = sniffed.replay.pipe(meter);
      try { await blob.uploadStream(storageKey, uploadStream, detectedMime); }
      catch (error) {
        controller.abort();
        uploadStream.destroy();
        if (typeof blob.deleteObject === 'function') {
          try { await blob.deleteObject(storageKey); } catch { /* Keep the safe storage failure below. */ }
        }
        if (error?.code?.startsWith('CATALOGUE_MEDIA_')) throw error;
        throw invalid('CATALOGUE_MEDIA_STORE_FAILED', 'The catalogue media could not be stored in FLESHLAB media storage.');
      }
      if (!byteSize) throw invalid('CATALOGUE_MEDIA_CONTENT_INVALID', 'The catalogue media is empty.');
      if (contentLength != null && contentLength !== byteSize) throw invalid('CATALOGUE_MEDIA_LENGTH_MISMATCH', 'The catalogue media length did not match its response metadata.');
      return { object_key: storageKey, mime_type: detectedMime, byte_size: byteSize, content_hash: hash.digest('hex'),
        source_fingerprint: fingerprint, diagnostic: { normalized_hostname: source.hostname.toLowerCase(), http_status: status,
          declared_content_type: declaredType, detected_mime_type: detectedMime, content_length: contentLength } };
    } catch (error) {
      const code = /^[A-Z0-9_]{1,80}$/.test(error?.code || '') ? error.code : 'CATALOGUE_MEDIA_FETCH_FAILED';
      if (storageKey && typeof blob?.deleteObject === 'function') {
        try { await blob.deleteObject(storageKey); } catch { /* Preserve the original safe failure code. */ }
      }
      reportDiagnostic(onDiagnostic, { asset_type: assetType, normalized_hostname: source?.hostname?.toLowerCase(), http_status: status,
        declared_content_type: declaredType, detected_mime_type: detectedMime,
        content_length: contentLength ?? (contentLengthWasPresent ? 'invalid' : null), error_code: code });
      throw invalid(code, 'Catalogue promotional media ingestion failed.');
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
}
