import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { PassThrough, Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm, statfs } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MP4_BRANDS = new Set(['isom','iso2','iso3','iso4','iso5','iso6','mp41','mp42','avc1','M4V ','M4VP','dash','MSNV']);
const ERROR_DOCUMENT_MIME = new Set(['text/html','text/xml','application/xml','application/xhtml+xml','image/svg+xml']);
const PRIVATE = new BlockList();
for (const [address, prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],
  ['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],
  ['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]]) PRIVATE.addSubnet(address,prefix,'ipv4');

export function mediaError(code, retryable = false) {
  return Object.assign(new Error('Provider media ingestion could not complete.'), { code, retryable });
}

export function providerMediaIdentity(input,{allowContentOnly=false}={}) {
  const provider = input?.provider;
  const transactionId = input?.transactionId;
  const contentUid = input?.contentUid;
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(provider || '') ||
      (transactionId == null ? allowContentOnly!==true : !/^[A-Za-z0-9_-]{1,255}$/.test(transactionId)) ||
      !/^[A-Za-z0-9_-]{1,255}$/.test(contentUid || '')) {
    throw mediaError('MEDIA_IDENTITY_INVALID');
  }
  return { provider, transactionId: transactionId ?? null, contentUid };
}

export function validateSignedMediaSource(value, allowedHosts = [], allowedSubdomains = []) {
  let url;
  try { url = new URL(value); } catch { throw mediaError('MEDIA_SOURCE_INVALID'); }
  const hosts = allowedHosts.map(host => String(host).trim().toLowerCase());
  const roots = allowedSubdomains.map(host => String(host).trim().toLowerCase());
  if ([...hosts,...roots].some(host => !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host))) throw mediaError('MEDIA_HOST_POLICY_INVALID');
  const permitted = hosts.includes(url.hostname.toLowerCase()) || roots.some(root => url.hostname.toLowerCase().endsWith(`.${root}`));
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443') ||
      isIP(url.hostname) || !permitted) throw mediaError('MEDIA_HOST_NOT_ALLOWED');
  return url;
}

function publicAddress(address) {
  const family = isIP(address);
  if (family === 4) return !PRIVATE.check(address, 'ipv4');
  // Permit globally routable IPv6 only; exclude documentation/transition ranges.
  return family === 6 && /^[23][0-9a-f]{3}:/i.test(address) &&
    !/^2001:(?:db8|0|10|20)(?::|$)/i.test(address) && !/^2002:/i.test(address);
}

function validateSourceReferer(value) {
  if (value == null) return null;
  if (typeof value !== 'string' || !value || value.length > 2048) throw mediaError('MEDIA_REFERER_INVALID');
  let referer;
  try { referer = new URL(value); } catch { throw mediaError('MEDIA_REFERER_INVALID'); }
  if (referer.protocol !== 'https:' || referer.username || referer.password || referer.hash) throw mediaError('MEDIA_REFERER_INVALID');
  return referer.toString();
}

/** Pin validated DNS for the HTTPS connection; never forward provider credentials. */
export async function openSignedMediaSource(url, { signal, sourceReferer = null } = {}) {
  const referer = validateSourceReferer(sourceReferer);
  let addresses;
  try { addresses = await lookup(url.hostname, { all: true, verbatim: true }); }
  catch { throw mediaError('MEDIA_DNS_FAILED', true); }
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw mediaError('MEDIA_HOST_NOT_ALLOWED');
  const pinned = addresses[0];
  const headers = { accept: 'video/*' };
  if (referer) headers.referer = referer;
  return new Promise((resolve, reject) => {
    const req = request(url, { method: 'GET', headers, signal,
      lookup: (_hostname, options, callback) => options?.all
        ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family) }, response => {
      resolve({ status: response.statusCode, headers: response.headers, stream: response });
    });
    req.on('error', () => reject(mediaError(signal.aborted ? 'MEDIA_TIMEOUT' : 'MEDIA_FETCH_FAILED', true)));
    req.end();
  });
}

function detectVideoMime(bytes) {
  if (bytes.length >= 4 && bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))) return 'video/webm';
  if (bytes.length < 16 || bytes.toString('ascii',4,8) !== 'ftyp') return null;
  const boxSize = bytes.readUInt32BE(0);
  const brandsOffset = boxSize === 1 ? 16 : 8;
  if (boxSize === 0 || (boxSize !== 1 && boxSize < 16) || bytes.length < brandsOffset + 8) return null;
  const major = bytes.toString('ascii',brandsOffset,brandsOffset+4);
  const compatible = [];
  for(let offset=brandsOffset+8;offset+4<=Math.min(boxSize===1?bytes.length:boxSize,bytes.length);offset+=4) {
    compatible.push(bytes.toString('ascii',offset,offset+4));
  }
  const brands=[major,...compatible];
  if(brands.includes('qt  '))return 'video/quicktime';
  return brands.some(brand=>MP4_BRANDS.has(brand))?'video/mp4':null;
}

function safeDeclaredMime(value) {
  const mime=String(value||'').split(';',1)[0].trim().toLowerCase();
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mime)?mime:null;
}

async function peekVideoStream(stream) {
  const iterator=stream[Symbol.asyncIterator]();
  const chunks=[];
  let prefix=Buffer.alloc(0);
  let detected=null;
  let done=false;
  while(!detected&&prefix.length<4096&&!done) {
    const next=await iterator.next();
    done=next.done;
    if(done)break;
    const chunk=Buffer.isBuffer(next.value)?next.value:Buffer.from(next.value);
    chunks.push(chunk);
    prefix=Buffer.concat([prefix,chunk.subarray(0,4096-prefix.length)]);
    detected=detectVideoMime(prefix);
  }
  if(!detected) {
    await iterator.return?.();
    throw mediaError('MEDIA_VALIDATION_FAILED');
  }
  const replay=Readable.from((async function*(){
    for(const chunk of chunks)yield chunk;
    if(!done)while(true){const next=await iterator.next();if(next.done)break;yield next.value;}
  })());
  return {detected,replay};
}

/** Re-read private Azure bytes for checksum validation and local ffprobe, never a remote URL. */
export async function validateStoredProviderMedia({ blob, objectKey, byteSize, checksum, mimeType, expectedDuration, signal, probeMedia = exec }) {
  let directory;
  let media;
  try {
    const space = await statfs(tmpdir());
    if (Number(space.bavail) * Number(space.bsize) < byteSize + 64 * 1024 * 1024) throw mediaError('MEDIA_VALIDATION_SPACE_UNAVAILABLE', true);
    directory = await mkdtemp(join(tmpdir(), 'fleshlab-private-media-'));
    media = await blob.downloadStream(objectKey);
    if (!media?.stream) throw mediaError('MEDIA_STORAGE_UNAVAILABLE', true);
    const file = join(directory, 'asset');
    const hash = createHash('sha256');
    let size = 0;
    const meter = new Transform({ transform(chunk, _encoding, callback) {
      size += chunk.length;
      if (size > byteSize) return callback(mediaError('MEDIA_CHECKSUM_MISMATCH'));
      hash.update(chunk); callback(null,chunk);
    } });
    await pipeline(media.stream, meter, createWriteStream(file, { flags: 'wx', mode: 0o600 }), { signal });
    if (size !== byteSize || hash.digest('hex') !== checksum) throw mediaError('MEDIA_CHECKSUM_MISMATCH');
    let result;
    try {
      result = await probeMedia('ffprobe', ['-v','error','-protocol_whitelist','file,pipe','-show_entries',
        'format=duration,format_name:stream=codec_type,codec_name,width,height','-of','json',file],
      { timeout: 120_000, maxBuffer: 1024 * 1024, signal });
    } catch (error) {
      if (error.code === 'ENOENT') throw mediaError('MEDIA_VALIDATOR_UNAVAILABLE', true);
      throw mediaError('MEDIA_VALIDATION_FAILED', error.killed === true);
    }
    let probe;
    try { probe = JSON.parse(result.stdout); } catch { throw mediaError('MEDIA_VALIDATION_FAILED'); }
    const video = probe.streams?.find(stream => stream.codec_type === 'video');
    const duration = Number(probe.format?.duration);
    const format = String(probe.format?.format_name || '');
    if (!video || !Number.isFinite(duration) || duration <= 0 || !(Number(video.width)>0) || !(Number(video.height)>0) ||
        !(mimeType === 'video/webm' ? /webm/.test(format) : /mov|mp4/.test(format))) throw mediaError('MEDIA_VALIDATION_FAILED');
    if (expectedDuration != null && Math.abs(duration - expectedDuration) > Math.max(1, expectedDuration * 0.02)) throw mediaError('MEDIA_DURATION_MISMATCH');
    return { durationSeconds: duration, width: Number(video.width), height: Number(video.height) };
  } finally {
    media?.stream?.destroy();
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}

/** Server-only service. Only its invocation holds the ephemeral URL in memory. */
export class SignedSourceMediaIngestionService {
  constructor({ repository, blob, privateContainer, allowedHosts = [], allowedSubdomains = [], openSource = openSignedMediaSource,
    validateMedia = validateStoredProviderMedia, maxBytes = 20 * 1024 ** 3, timeoutMs = 30 * 60_000 } = {}) {
    Object.assign(this, { repository, blob, privateContainer, allowedHosts, allowedSubdomains, openSource, validateMedia, maxBytes, timeoutMs });
  }

  async ingest(input) {
    const identity = providerMediaIdentity(input,{allowContentOnly:input?.contentOnly===true});
    const expectedMime = input.expectedMime;
    if (!Number.isSafeInteger(this.maxBytes) || this.maxBytes < 1 || !Number.isSafeInteger(this.timeoutMs) || this.timeoutMs < 1) throw mediaError('MEDIA_LIMIT_INVALID');
    if (!this.repository?.withJob || !this.blob?.uploadStream || !this.blob?.verifyObject || !this.blob?.verifyPrivateContainer ||
        !this.blob?.deleteObject || !this.privateContainer) throw mediaError('MEDIA_STORAGE_NOT_CONFIGURED');
    try {
      if (!await this.blob.verifyPrivateContainer(this.privateContainer)) throw mediaError('MEDIA_STORAGE_NOT_PRIVATE');
    } catch(error) {
      throw mediaError(error.code === 'MEDIA_STORAGE_NOT_PRIVATE' ? error.code : 'MEDIA_STORAGE_UNAVAILABLE', true);
    }
    return this.repository.withJob({...identity,retryFailed:input.retryFailed===true,contentOnly:input.contentOnly===true}, async job => {
      if (job.state === 'MEDIA_READY') return { state: 'MEDIA_READY', assetId: job.assetId, duplicate: true };
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      let response;
      let wrote = false;
      let readyCommitAttempted = false;
      const scopedBlob = {
        downloadStream: key => this.blob.downloadStream(key, { container: this.privateContainer })
      };
      try {
        // A durable READY master needs no upstream source or download metadata.
        if (expectedMime != null && !MIME.has(expectedMime)) throw mediaError('MEDIA_MIME_UNSUPPORTED');
        for (const value of [input.expectedBytes,input.expectedDuration]) {
          if (value != null && (!Number.isFinite(value) || value <= 0)) throw mediaError('MEDIA_EXPECTATION_INVALID');
        }
        if (input.expectedBytes != null && (!Number.isSafeInteger(input.expectedBytes) || input.expectedBytes > this.maxBytes)) throw mediaError('MEDIA_EXPECTATION_INVALID');
        if (input.expectedChecksum != null && !/^[a-f0-9]{64}$/.test(input.expectedChecksum)) throw mediaError('MEDIA_EXPECTATION_INVALID');
        for (const dimension of ['width','height']) {
          const value=input.expectedDimensions?.[dimension];
          if(value!=null && (!Number.isSafeInteger(value) || value<=0))throw mediaError('MEDIA_EXPECTATION_INVALID');
        }
        const source = validateSignedMediaSource(input.sourceUrl, this.allowedHosts, this.allowedSubdomains);
        if(job.recovered) await this.blob.deleteObject(job.objectKey,{container:this.privateContainer});
        await job.start(expectedMime);
        response = await this.openSource(source, { signal: controller.signal, sourceReferer: input.sourceReferer });
        if (response.status >= 300 && response.status < 400) throw mediaError('MEDIA_REDIRECT_REJECTED');
        if ([401,403,410].includes(response.status)) throw mediaError('MEDIA_SOURCE_EXPIRED', true);
        if (response.status !== 200 || !response.stream) throw mediaError('MEDIA_FETCH_FAILED', response.status >= 500 || response.status === 429);
        const declaredMime = safeDeclaredMime(response.headers?.['content-type'] ?? response.headers?.get?.('content-type'));
        const sniffed = await peekVideoStream(response.stream);
        const mimeType = sniffed.detected;
        if (!MIME.has(mimeType)) throw mediaError('MEDIA_MIME_UNSUPPORTED');
        if (expectedMime && mimeType !== expectedMime) throw mediaError('MEDIA_MIME_MISMATCH');
        if (declaredMime && ERROR_DOCUMENT_MIME.has(declaredMime)) throw mediaError('MEDIA_MIME_MISMATCH');
        const rawContentLength=response.headers?.['content-length'] ?? response.headers?.get?.('content-length');
        const announced = rawContentLength == null ? null : Number(rawContentLength);
        if (announced != null && (!Number.isSafeInteger(announced) || announced <= 0 || announced > this.maxBytes)) throw mediaError('MEDIA_SIZE_INVALID');
        if (input.expectedBytes != null && announced != null && input.expectedBytes !== announced) throw mediaError('MEDIA_SIZE_MISMATCH');
        const hash = createHash('sha256');
        let byteSize = 0;
        const meter = new Transform({ transform: (chunk,_encoding,callback) => {
          byteSize += chunk.length;
          if (byteSize > this.maxBytes) return callback(mediaError('MEDIA_SIZE_INVALID'));
          hash.update(chunk); callback(null,chunk);
        } });
        const uploadStream = new PassThrough();
        const transfer = pipeline(sniffed.replay, meter, uploadStream, { signal: controller.signal });
        wrote = true;
        const upload = Promise.resolve().then(() => this.blob.uploadStream(job.objectKey, uploadStream, mimeType,
          { container: this.privateContainer })).catch(error => { uploadStream.destroy(); controller.abort(); throw error; });
        transfer.catch(() => { uploadStream.destroy(); controller.abort(); });
        const transfers = await Promise.allSettled([transfer,upload]);
        const failure = transfers.find(result => result.status === 'rejected');
        if (failure) throw failure.reason;
        const checksum = hash.digest('hex');
        if (!byteSize) throw mediaError('MEDIA_VALIDATION_FAILED');
        if ((announced != null && byteSize !== announced) || (input.expectedBytes != null && byteSize !== input.expectedBytes)) throw mediaError('MEDIA_SIZE_MISMATCH');
        if (input.expectedChecksum && input.expectedChecksum !== checksum) throw mediaError('MEDIA_CHECKSUM_MISMATCH');
        const stored = await this.blob.verifyObject(job.objectKey, { container: this.privateContainer });
        if (!stored || stored.byteSize !== byteSize) throw mediaError('MEDIA_STORAGE_INCOMPLETE', true);
        const technical = await this.validateMedia({ blob: scopedBlob, objectKey: job.objectKey, byteSize,
          checksum, mimeType, expectedDuration: input.expectedDuration, signal: controller.signal });
        if (!technical || !Number.isFinite(technical.durationSeconds) || technical.durationSeconds <= 0 ||
            !(technical.width > 0) || !(technical.height > 0)) throw mediaError('MEDIA_VALIDATION_FAILED');
        if (input.expectedDuration != null && Math.abs(technical.durationSeconds - input.expectedDuration) > Math.max(1,input.expectedDuration*0.02)) throw mediaError('MEDIA_DURATION_MISMATCH');
        const dimensionsTolerance=Number(input.expectedDimensionsToleranceRatio||0);
        if(!Number.isFinite(dimensionsTolerance)||dimensionsTolerance<0||dimensionsTolerance>0.1)throw mediaError('MEDIA_EXPECTATION_INVALID');
        const expectedWidth=input.expectedDimensions?.width;const expectedHeight=input.expectedDimensions?.height;
        const dimensionMatches=(actual,expected)=>expected==null||Math.abs(actual-expected)<=Math.max(2,expected*dimensionsTolerance);
        const directDimensionsMatch=dimensionMatches(technical.width,expectedWidth)&&dimensionMatches(technical.height,expectedHeight);
        const swappedDimensionsMatch=expectedWidth!=null&&expectedHeight!=null&&dimensionMatches(technical.width,expectedHeight)&&dimensionMatches(technical.height,expectedWidth);
        if(!directDimensionsMatch&&!swappedDimensionsMatch)throw mediaError('MEDIA_DIMENSIONS_MISMATCH');
        readyCommitAttempted = true;
        await job.ready({ byteSize, checksum, mimeType, durationSeconds: technical.durationSeconds,
          width: technical.width,height: technical.height });
        return { state: 'MEDIA_READY', assetId: job.assetId, duplicate: false };
      } catch (error) {
        // An interrupted COMMIT may already have published READY metadata.
        // Preserve the private object; retry reads the durable state first.
        if (readyCommitAttempted) throw mediaError('MEDIA_READY_COMMIT_UNKNOWN', true);
        const safe = /^MEDIA_[A-Z_]+$/.test(error?.code || '') ? error : mediaError('MEDIA_INGESTION_FAILED', true);
        if (wrote) {
          try { await this.blob.deleteObject(job.objectKey, { container: this.privateContainer }); }
          catch { await job.failed('MEDIA_CLEANUP_FAILED', true); throw mediaError('MEDIA_CLEANUP_FAILED', true); }
        }
        await job.failed(safe.code, safe.retryable === true, Number.isInteger(input.retryDelaySeconds)?input.retryDelaySeconds:30);
        throw mediaError(safe.code, safe.retryable === true);
      } finally {
        controller.abort(); clearTimeout(timer); response?.stream?.destroy();
      }
    });
  }

  /** Prepare/reuse the unique provider+content job without claiming a purchase or acquiring a source. */
  async prepareContent({provider,contentUid,retryFailed=false}={}) {
    const identity=providerMediaIdentity({provider,contentUid},{allowContentOnly:true});
    if(!this.repository?.withJob)throw mediaError('MEDIA_STORAGE_NOT_CONFIGURED');
    return this.repository.withJob({...identity,retryFailed:retryFailed===true,contentOnly:true},async job=>({state:job.state,assetId:job.assetId}));
  }

  /** Catalogue ingestion shares the JIT job and private asset identity without inventing a transaction ID. */
  async ingestContent(input) {
    const contentInput={...input,transactionId:null,contentOnly:true};
    // sourceUrl is intentionally non-enumerable at the provider boundary. A
    // spread must not silently drop the one-time URL before the stream starts.
    Object.defineProperty(contentInput,'sourceUrl',{value:input?.sourceUrl,enumerable:false});
    Object.defineProperty(contentInput,'sourceReferer',{value:input?.sourceReferer,enumerable:false});
    return this.ingest(contentInput);
  }
}
