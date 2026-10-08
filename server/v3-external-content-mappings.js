import { loyalFansPurchaseDestination } from './loyalfans-purchase-evidence.js';
import { HttpError } from './errors.js';

const PROVIDER = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const STATUS = new Set(['active', 'inactive', 'archived']);

function text(value, maximum = 512) {
  const result = String(value ?? '').trim();
  return result ? result.slice(0, maximum) : '';
}

export function normalizeExternalContentProvider(value) {
  const provider = text(value, 64).toLowerCase();
  if (!PROVIDER.test(provider)) throw new HttpError(422, 'EXTERNAL_CONTENT_PROVIDER_INVALID', 'A normalized external content provider is required.');
  return provider;
}

function externalContentUid(value) {
  const uid = text(value, 512);
  if (!uid) throw new HttpError(422, 'EXTERNAL_CONTENT_UID_REQUIRED', 'An external content UID is required.');
  return uid;
}

function videoLegacyId(value) {
  const id = text(value, 200);
  if (!id) throw new HttpError(422, 'VIDEO_LEGACY_ID_REQUIRED', 'A FLESHLAB video ID is required.');
  return id;
}

function nullableText(value, maximum) {
  const result = text(value, maximum);
  return result || null;
}

function publicUrl(value) {
  const url = nullableText(value, 2000);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('invalid');
    if ([...parsed.searchParams.keys()].some(key => /^(expires|signature|key-pair-id|token|sig|auth|x-amz-.+)$/i.test(key))) throw new Error('sensitive');
    return parsed.toString();
  } catch {
    throw new HttpError(422, 'EXTERNAL_CONTENT_PUBLIC_URL_INVALID', 'A public external content URL must use public HTTPS without signed credentials.');
  }
}

function safeMapping(row) {
  if (!row) return null;
  return {
    id: row.id,
    video_legacy_id: row.video_legacy_id,
    provider: row.provider,
    external_content_uid: row.external_content_uid,
    external_slug: row.external_slug,
    public_url: row.public_url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by
  };
}

/**
 * Canonical provider-to-FLESHLAB-content identity repository. It has no
 * checkout, entitlement, or provider-network behavior.
 */
export class V3ExternalContentMappingRepository {
  constructor(db) {
    if (!db || typeof db.query !== 'function') throw new TypeError('A database query interface is required.');
    this.db = db;
  }

  async findByExternalContentId(providerInput, externalContentUidInput) {
    const provider = normalizeExternalContentProvider(providerInput);
    const external_content_uid = externalContentUid(externalContentUidInput);
    const result = await this.db.query(`SELECT id,video_legacy_id,provider,external_content_uid,external_slug,public_url,status,created_at,updated_at,created_by
      FROM v3_catalogue_external_content_mappings
      WHERE provider=$1 AND external_content_uid=$2 AND status='active' LIMIT 2`, [provider, external_content_uid]);
    if (result.rows.length > 1) throw new HttpError(409, 'AMBIGUOUS_EXTERNAL_CONTENT_MAPPING', 'External content identity is ambiguous.');
    return safeMapping(result.rows[0]);
  }

  async findByVideoId(videoLegacyIdInput) {
    const video_legacy_id = videoLegacyId(videoLegacyIdInput);
    const result = await this.db.query(`SELECT id,video_legacy_id,provider,external_content_uid,external_slug,public_url,status,created_at,updated_at,created_by
      FROM v3_catalogue_external_content_mappings
      WHERE video_legacy_id=$1 ORDER BY provider,external_content_uid`, [video_legacy_id]);
    return result.rows.map(safeMapping);
  }

  async createMapping(input = {}, actor = null) {
    const provider = normalizeExternalContentProvider(input.provider);
    const external_content_uid = externalContentUid(input.external_content_uid ?? input.externalContentUid);
    const video_legacy_id = videoLegacyId(input.video_legacy_id ?? input.videoLegacyId);
    const status = text(input.status || 'active', 20).toLowerCase();
    if (!STATUS.has(status)) throw new HttpError(422, 'EXTERNAL_CONTENT_MAPPING_STATUS_INVALID', 'External content mapping status is invalid.');
    const external_slug = nullableText(input.external_slug ?? input.externalSlug, 255);
    const public_url = publicUrl(input.public_url ?? input.publicUrl);
    if (provider === 'loyalfans' && public_url) loyalFansPurchaseDestination(public_url);

    const video = await this.db.query('SELECT legacy_id FROM catalog_videos WHERE legacy_id=$1', [video_legacy_id]);
    if (!video.rowCount) throw new HttpError(422, 'EXTERNAL_CONTENT_MAPPING_VIDEO_NOT_FOUND', 'The FLESHLAB video does not exist.');
    const existing = await this.db.query('SELECT id FROM v3_catalogue_external_content_mappings WHERE provider=$1 AND external_content_uid=$2', [provider, external_content_uid]);
    if (existing.rowCount) throw new HttpError(409, 'EXTERNAL_CONTENT_MAPPING_DUPLICATE', 'This provider content UID is already mapped.');
    try {
      const result = await this.db.query(`INSERT INTO v3_catalogue_external_content_mappings(video_legacy_id,provider,external_content_uid,external_slug,public_url,status,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7)
        RETURNING id,video_legacy_id,provider,external_content_uid,external_slug,public_url,status,created_at,updated_at,created_by`, [video_legacy_id, provider, external_content_uid, external_slug, public_url, status, actor?.id || null]);
      return safeMapping(result.rows[0]);
    } catch (error) {
      if (error?.code === '23505') throw new HttpError(409, 'EXTERNAL_CONTENT_MAPPING_DUPLICATE', 'This provider content UID is already mapped.');
      throw error;
    }
  }
}
