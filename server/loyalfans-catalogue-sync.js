import { createHash } from 'node:crypto';
import { normalizeLoyalFansCatalogueItem, validateLoyalFansCataloguePage } from './loyalfans-catalogue.js';
import { V3ExternalContentMappingRepository } from './v3-external-content-mappings.js';
import { createLoyalFansMediaCopier } from './loyalfans-catalogue-media.js';
const UID=/^[A-Za-z0-9_-]{16,255}$/;

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function metadataFingerprint(metadata) {
  const { metadata_fingerprint: _ignored, ...value } = metadata;
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function safeConflict(postUid, error) {
  return { post_uid: postUid || null, code: /^[A-Z0-9_]{1,80}$/.test(error?.code || '') ? error.code : 'CATALOGUE_SYNC_ITEM_FAILED' };
}

export class LoyalFansCatalogueSyncService {
  constructor({ db, provider, blob, currency = '', mediaHosts = [], trailerIngestionEnabled = false,
    syncEnabled = false, fetchImpl = globalThis.fetch, onMediaDiagnostic = null } = {}) {
    if (!db || typeof db.query !== 'function' || typeof db.connect !== 'function') throw new TypeError('A PostgreSQL pool is required.');
    if (!provider || typeof provider.listAllCatalogue !== 'function') throw new TypeError('A LoyalFans catalogue provider is required.');
    this.db = db;
    this.provider = provider;
    this.currency = String(currency || '').trim().toUpperCase();
    this.trailerIngestionEnabled = Boolean(trailerIngestionEnabled);
    this.syncEnabled = Boolean(syncEnabled);
    this.blob = blob;
    this.onMediaDiagnostic = onMediaDiagnostic;
    this.copyMedia = createLoyalFansMediaCopier({ blob, fetchImpl, allowedHosts: mediaHosts, onDiagnostic: onMediaDiagnostic });
  }

  async sync({ dryRun = true, maxPages = 100, maxItems = 10000, restart = false } = {}) {
    if(!Number.isInteger(maxPages) || maxPages<1 || maxPages>100 || !Number.isInteger(maxItems) || maxItems<1 || maxItems>100000){
      throw invalid('INVALID_LOYALFANS_CATALOGUE_BOUND','Valid page and item safety bounds are required.');
    }
    maxPages=Math.min(maxPages,this.provider.catalogueRequestContract?.pagination.maxPages || 100);
    maxItems=Math.min(maxItems,this.provider.catalogueRequestContract?.pagination.maxItems || 10000);
    if (!dryRun && !this.syncEnabled) throw invalid('LOYALFANS_CATALOGUE_SYNC_DISABLED', 'LoyalFans catalogue writes are disabled.');
    // listCataloguePage is the only network boundary used for durable paging.
    // Compatibility fallback keeps local/sanitized one-shot fixtures usable.
    if (typeof this.provider.listCataloguePage !== 'function') {
      if (typeof this.provider.listAllCatalogue !== 'function') throw invalid('LOYALFANS_CATALOGUE_NOT_CONFIGURED', 'LoyalFans catalogue pagination is unavailable.');
      const capture = await this.provider.listAllCatalogue({ maxPages,maxItems });
      return this.syncItems(capture.records, { dryRun, pageMeta: capture.page_meta });
    }

    let run = dryRun ? null : await this.startOrResumeRun({ restart });
    let page = run?.next_page || 1;
    let expected = run?.expected_total == null ? null : {
      total: Number(run.expected_total), per_page: Number(run.expected_per_page), last_page: Number(run.expected_last_page)
    };
    const seenUids=new Set();
    const result = { dry_run: Boolean(dryRun), page_meta: null, scanned: Number(run?.scanned || 0), unique: 0,
      created: Number(run?.created || 0), updated: Number(run?.updated || 0), unchanged: Number(run?.unchanged || 0),
      conflicted: Number(run?.conflicted || 0), failed: Number(run?.failed || 0), unmapped: Number(run?.unmapped || 0), duplicate_items: 0,
      posters_copied: 0, trailers_copied: 0, poster_failures: 0, trailer_failures: 0,
      promo_partial: 0, trailer_ingestion_disabled: 0, conflicts: [] };

    try {
      for (; page <= maxPages; page += 1) {
        const payload = await this.provider.listCataloguePage({ page });
        const parsed = validateLoyalFansCataloguePage(payload, page);
        if(parsed.last_page>maxPages || parsed.total>maxItems || result.scanned+parsed.records.length>maxItems){
          throw invalid('INCOMPLETE_LOYALFANS_CATALOGUE','The creator catalogue exceeded the configured safety bounds.');
        }
        if (expected && (parsed.total !== expected.total || parsed.per_page !== expected.per_page || parsed.last_page !== expected.last_page)) {
          throw invalid('INCONSISTENT_LOYALFANS_CATALOGUE_PAGES', 'Catalogue pagination changed during the resumable scan.');
        }
        if(parsed.from!==result.scanned)throw invalid('INCONSISTENT_LOYALFANS_CATALOGUE_PAGES','Catalogue ranges do not continue the resumable scan.');
        expected ||= parsed;
        for(const item of parsed.records){
          if(typeof item?.uid!=='string' || !UID.test(item.uid) || seenUids.has(item.uid)){
            throw invalid('REPEATED_LOYALFANS_CATALOGUE_ITEM','Catalogue identities repeat or are invalid during the scan.');
          }
          seenUids.add(item.uid);
        }
        if(run && parsed.records.length){
          const prior=await this.db.query(`SELECT loyalfans_post_uid,source_page FROM v3_loyalfans_catalogue_sync_items
            WHERE run_id=$1 AND loyalfans_post_uid=ANY($2::text[])`,[run.id,parsed.records.map(item=>item.uid)]);
          if(prior.rows.some(item=>Number(item.source_page)!==page)){
            throw invalid('REPEATED_LOYALFANS_CATALOGUE_ITEM','Catalogue identities repeat across persisted pages.');
          }
        }
        const pageResult = await this.syncItems(parsed.records, { dryRun, pageMeta: parsed, runId: run?.id, sourcePage: page });
        result.page_meta = { total: parsed.total, per_page: parsed.per_page, last_page: parsed.last_page };
        for (const key of ['scanned','unique','created','updated','unchanged','conflicted','failed','unmapped','duplicate_items',
          'posters_copied','trailers_copied','poster_failures','trailer_failures','promo_partial','trailer_ingestion_disabled']) result[key] += pageResult[key];
        result.conflicts.push(...pageResult.conflicts);
        if(page===parsed.last_page && result.scanned!==parsed.total){
          throw invalid('INCOMPLETE_LOYALFANS_CATALOGUE','The resumable creator catalogue scan did not return the declared item count.');
        }
        if (run) {
          const saved = await this.db.query(`UPDATE v3_loyalfans_catalogue_sync_runs SET
            expected_total=$2,expected_per_page=$3,expected_last_page=$4,next_page=$5,
            scanned=$6,created=$7,updated=$8,unchanged=$9,conflicted=$10,failed=$11,unmapped=$12,
            status=$13,lease_expires_at=CASE WHEN $13='complete' THEN NULL ELSE now()+interval '1 hour' END,
            finished_at=CASE WHEN $13='complete' THEN now() ELSE NULL END,
            last_error_code=NULL,updated_at=now() WHERE id=$1 RETURNING *`,
          [run.id, parsed.total, parsed.per_page, parsed.last_page, page + 1,
            result.scanned, result.created, result.updated, result.unchanged, result.conflicted, result.failed,
            result.unmapped, page === parsed.last_page ? 'complete' : 'running']);
          run = saved.rows[0];
        }
        if (page === parsed.last_page) {
          return result;
        }
      }
      throw invalid('INCOMPLETE_LOYALFANS_CATALOGUE', 'The creator catalogue exceeded the configured page bound.');
    } catch (error) {
      if (run) await this.db.query(`UPDATE v3_loyalfans_catalogue_sync_runs SET status='failed',lease_expires_at=NULL,last_error_code=$2,updated_at=now() WHERE id=$1`,
        [run.id, /^[A-Z0-9_]{1,80}$/.test(error?.code || '') ? error.code : 'CATALOGUE_SYNC_FAILED']).catch(() => {});
      throw error;
    }
  }

  async startOrResumeRun({ restart = false } = {}) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended('loyalfans:catalogue:sync',0))");
      const active = await client.query("SELECT * FROM v3_loyalfans_catalogue_sync_runs WHERE status IN ('running','failed') ORDER BY started_at DESC LIMIT 1 FOR UPDATE");
      if (active.rowCount && !restart && active.rows[0].status === 'running' && active.rows[0].lease_expires_at &&
          new Date(active.rows[0].lease_expires_at).getTime() > Date.now()) {
        throw invalid('LOYALFANS_CATALOGUE_SYNC_IN_PROGRESS', 'A LoyalFans catalogue sync is already running.');
      }
      if (active.rowCount && !restart) {
        await client.query("UPDATE v3_loyalfans_catalogue_sync_items SET status='failed',error_code='SYNC_INTERRUPTED',updated_at=now() WHERE run_id=$1 AND status='processing'", [active.rows[0].id]);
        await client.query("UPDATE v3_loyalfans_catalogue_sync_runs SET status='running',lease_expires_at=now()+interval '1 hour',last_error_code=NULL,updated_at=now() WHERE id=$1", [active.rows[0].id]);
        const resumed = await client.query('SELECT * FROM v3_loyalfans_catalogue_sync_runs WHERE id=$1', [active.rows[0].id]);
        await client.query('COMMIT');
        return resumed.rows[0];
      }
      if (active.rowCount) await client.query("UPDATE v3_loyalfans_catalogue_sync_runs SET status='abandoned',finished_at=now(),updated_at=now() WHERE id=$1", [active.rows[0].id]);
      const created = await client.query("INSERT INTO v3_loyalfans_catalogue_sync_runs(status,next_page,lease_expires_at) VALUES('running',1,now()+interval '1 hour') RETURNING *");
      await client.query('COMMIT');
      return created.rows[0];
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }

  async syncItems(records, { dryRun = true, pageMeta = null, runId = null, sourcePage = null } = {}) {
    if (!Array.isArray(records)) throw invalid('INVALID_CATALOGUE_RECORDS', 'Catalogue records must be an array.');
    if (!dryRun && !this.syncEnabled) throw invalid('LOYALFANS_CATALOGUE_SYNC_DISABLED', 'LoyalFans catalogue writes are disabled.');
    const result = { dry_run: Boolean(dryRun), page_meta: pageMeta, scanned: records.length,
      unique: 0, created: 0, updated: 0, unchanged: 0, conflicted: 0, failed: 0, unmapped: 0, duplicate_items: 0,
      posters_copied: 0, trailers_copied: 0, poster_failures: 0, trailer_failures: 0,
      promo_partial: 0, trailer_ingestion_disabled: 0, conflicts: [] };
    const unique = new Map();
    const blockedUids = new Set();
    const invalidRecords = [];

    for (const record of records) {
      let normalized;
      try { normalized = normalizeLoyalFansCatalogueItem(record, { currency: this.currency }); }
      catch (error) { invalidRecords.push(safeConflict(record?.uid, error)); continue; }
      const uid = normalized.metadata.post_uid;
      if (blockedUids.has(uid)) continue;
      const prior = unique.get(uid);
      if (!prior) { unique.set(uid, normalized); continue; }
      if (prior.metadata.metadata_fingerprint === normalized.metadata.metadata_fingerprint) {
        result.duplicate_items += 1;
        continue;
      }
      unique.delete(uid);
      blockedUids.add(uid);
      invalidRecords.push(safeConflict(uid, invalid('DUPLICATE_CATALOGUE_UID_CONFLICT', 'Duplicate catalogue UIDs contain conflicting data.')));
    }

    result.unique = unique.size + invalidRecords.length;
    result.conflicts.push(...invalidRecords);
    result.conflicted += invalidRecords.length;
    if (runId) for (const item of invalidRecords) {
      if (item.post_uid) await this.markProductConflict(item.post_uid);
      await this.db.query(`INSERT INTO v3_loyalfans_catalogue_sync_items(run_id,loyalfans_post_uid,status,error_code,mapped,updated_at)
        VALUES($1,$2,'conflict',$3,false,now()) ON CONFLICT(run_id,loyalfans_post_uid) DO UPDATE SET
          status='conflict',error_code=EXCLUDED.error_code,mapped=false,updated_at=now()`,
      [runId, String(item.post_uid || 'unknown-invalid-catalogue-uid').slice(0,255), item.code]);
    }
    for (const normalized of unique.values()) {
      if (runId) {
        const claim = await this.claimRunItem(runId, normalized.metadata, sourcePage);
        if (claim.kind === 'duplicate') { result.duplicate_items += 1; continue; }
        if (claim.kind === 'replay') { result[claim.action || 'unchanged'] += 1; if (!claim.mapped) result.unmapped += 1; continue; }
        if (claim.kind === 'conflict') {
          result.conflicted += 1;
          result.conflicts.push({ post_uid: normalized.metadata.post_uid, code: 'DUPLICATE_CATALOGUE_UID_CONFLICT' });
          continue;
        }
        if (claim.kind === 'busy') throw invalid('LOYALFANS_CATALOGUE_SYNC_ITEM_IN_PROGRESS', 'A catalogue item is already being processed.');
      }
      try {
        const outcome = await this.syncItem(normalized, { dryRun, runId });
        result[outcome.action] += 1;
        if (!outcome.mapped) result.unmapped += 1;
        result.posters_copied += outcome.posterCopied ? 1 : 0;
        result.trailers_copied += outcome.trailerCopied ? 1 : 0;
        result.poster_failures += outcome.posterFailed ? 1 : 0;
        result.trailer_failures += outcome.trailerFailed ? 1 : 0;
        result.promo_partial += outcome.promoState === 'partial' ? 1 : 0;
        result.trailer_ingestion_disabled += outcome.trailerDeferred ? 1 : 0;
        if (runId && !outcome.itemStored) await this.finishRunItem(runId, normalized.metadata.post_uid, 'synced', null, normalized.metadata, outcome.action, outcome.mapped);
      } catch (error) {
        const conflictCodes = new Set(['LOYALFANS_CONTENT_MAPPING_REQUIRED','AMBIGUOUS_EXTERNAL_CONTENT_MAPPING',
          'CATALOGUE_MAPPING_CHANGED','FLESHLAB_VIDEO_ALREADY_MAPPED','DUPLICATE_CATALOGUE_UID_CONFLICT',
          'MAPPED_FLESHLAB_VIDEO_NOT_FOUND','LOYALFANS_POSTER_REQUIRED']);
        const category = conflictCodes.has(error?.code) ? 'conflicted' : 'failed';
        result[category] += 1;
        result.conflicts.push(safeConflict(normalized.metadata.post_uid, error));
        if (runId && category === 'conflicted') await this.markProductConflict(normalized.metadata.post_uid);
        if (runId) await this.finishRunItem(runId, normalized.metadata.post_uid,
          category === 'conflicted' ? 'conflict' : 'failed', safeConflict(normalized.metadata.post_uid, error).code, normalized.metadata);
      }
    }
    return result;
  }

  async claimRunItem(runId, metadata, sourcePage) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`loyalfans:sync-item:${runId}:${metadata.post_uid}`]);
      const prior = await client.query('SELECT metadata_fingerprint,status,source_page,action,mapped FROM v3_loyalfans_catalogue_sync_items WHERE run_id=$1 AND loyalfans_post_uid=$2 FOR UPDATE', [runId, metadata.post_uid]);
      if (prior.rowCount && prior.rows[0].metadata_fingerprint !== metadata.metadata_fingerprint) {
        await client.query(`UPDATE v3_loyalfans_catalogue_sync_items SET status='conflict',error_code='DUPLICATE_CATALOGUE_UID_CONFLICT',updated_at=now() WHERE run_id=$1 AND loyalfans_post_uid=$2`, [runId, metadata.post_uid]);
        await client.query(`UPDATE v3_loyalfans_catalogue_products SET sync_status='conflict',availability_state='unknown',updated_at=now() WHERE loyalfans_post_uid=$1`, [metadata.post_uid]);
        await client.query('COMMIT');
        return { kind: 'conflict' };
      }
      if (prior.rowCount && ['synced','conflict'].includes(prior.rows[0].status)) {
        await client.query('COMMIT');
        if (prior.rows[0].status === 'conflict') return { kind: 'conflict' };
        return Number(prior.rows[0].source_page) === Number(sourcePage)
          ? { kind: 'replay', action: prior.rows[0].action, mapped: prior.rows[0].mapped === true } : { kind: 'duplicate' };
      }
      if (prior.rowCount && prior.rows[0].status === 'processing') {
        await client.query('COMMIT');
        return { kind: 'busy' };
      }
      await client.query(`INSERT INTO v3_loyalfans_catalogue_sync_items(run_id,loyalfans_post_uid,loyalfans_video_uid,title,current_price_minor,currency,source_page,metadata_fingerprint,status,error_code,action,mapped,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,'processing',NULL,NULL,false,now())
        ON CONFLICT(run_id,loyalfans_post_uid) DO UPDATE SET loyalfans_video_uid=EXCLUDED.loyalfans_video_uid,title=EXCLUDED.title,
          current_price_minor=EXCLUDED.current_price_minor,currency=EXCLUDED.currency,metadata_fingerprint=EXCLUDED.metadata_fingerprint,
          source_page=EXCLUDED.source_page,status='processing',error_code=NULL,action=NULL,mapped=false,updated_at=now()`,
      [runId, metadata.post_uid, metadata.video_uid, metadata.title, metadata.current_price_minor, metadata.currency, sourcePage, metadata.metadata_fingerprint]);
      await client.query('COMMIT');
      return { kind: 'claimed' };
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }

  async finishRunItem(runId, postUid, status, errorCode = null, metadata = null, action = null, mapped = false) {
    await this.db.query(`UPDATE v3_loyalfans_catalogue_sync_items SET status=$3,error_code=$4,
      loyalfans_video_uid=COALESCE($5,loyalfans_video_uid),title=COALESCE($6,title),
      current_price_minor=COALESCE($7,current_price_minor),currency=COALESCE($8,currency),action=COALESCE($9,action),mapped=$10,updated_at=now()
      WHERE run_id=$1 AND loyalfans_post_uid=$2`,
    [runId, postUid, status, errorCode, metadata?.video_uid || null, metadata?.title || null,
      metadata?.current_price_minor ?? null, metadata?.currency || null, action, Boolean(mapped)]);
  }

  async syncItem(normalized, { dryRun, runId = null }) {
    const incoming = normalized.metadata;
    const mapping = await new V3ExternalContentMappingRepository(this.db).findByExternalContentId('loyalfans', incoming.post_uid);
    const current = await this.db.query('SELECT * FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1', [incoming.post_uid]);
    const existing = current.rows[0] || null;
    const mapped = Boolean(mapping && mapping.status === 'active');
    if (existing?.video_legacy_id && (!mapped || existing.video_legacy_id !== mapping.video_legacy_id)) {
      throw invalid('CATALOGUE_MAPPING_CHANGED', 'The synced product mapping no longer matches its FLESHLAB video.');
    }
    if (mapped) {
      const video = await this.db.query('SELECT legacy_id FROM catalog_videos WHERE legacy_id=$1', [mapping.video_legacy_id]);
      if (!video.rowCount) throw invalid('MAPPED_FLESHLAB_VIDEO_NOT_FOUND', 'The mapped FLESHLAB video does not exist.');
      const byVideo = await this.db.query('SELECT loyalfans_post_uid FROM v3_loyalfans_catalogue_products WHERE video_legacy_id=$1', [mapping.video_legacy_id]);
      if (byVideo.rowCount && byVideo.rows.some(row => row.loyalfans_post_uid !== incoming.post_uid)) {
        throw invalid('FLESHLAB_VIDEO_ALREADY_MAPPED', 'A different LoyalFans post is already assigned to this FLESHLAB master.');
      }
    }

    const metadata = { ...incoming, video_legacy_id: mapped ? mapping.video_legacy_id : null,
      sync_status: mapped ? 'active' : 'unmapped' };
    metadata.metadata_fingerprint = metadataFingerprint(metadata);
    const posterChanged = Boolean(normalized.media.poster && (
      normalized.media.poster.error_code || !existing?.poster_media_asset_id || existing.poster_source_fingerprint !== normalized.media.poster.source_fingerprint ||
      (existing.source_updated_at && incoming.source_updated_at && new Date(existing.source_updated_at).getTime() !== new Date(incoming.source_updated_at).getTime())));
    const trailerAvailable = Boolean(normalized.media.trailer);
    const trailerChanged = Boolean(this.trailerIngestionEnabled && normalized.media.trailer && (
      normalized.media.trailer.error_code || !existing?.trailer_media_asset_id || existing.trailer_source_fingerprint !== normalized.media.trailer.source_fingerprint));
    const posterProvenanceRetry = Boolean(existing?.poster_error_code === 'CATALOGUE_MEDIA_RECORD_FAILED' && existing.poster_media_asset_id && !posterChanged);
    const trailerProvenanceRetry = Boolean(existing?.trailer_error_code === 'CATALOGUE_MEDIA_RECORD_FAILED' && existing.trailer_media_asset_id && !trailerChanged);
    const action = !existing ? 'created' : (existing.metadata_fingerprint === metadata.metadata_fingerprint && !posterChanged && !trailerChanged &&
      !posterProvenanceRetry && !trailerProvenanceRetry ? 'unchanged' : 'updated');
    const trailerDeferred = Boolean(trailerAvailable && !this.trailerIngestionEnabled && !existing?.trailer_media_asset_id);
    if (dryRun || action === 'unchanged') {
      if (runId && !dryRun) await this.finishRunItem(runId, incoming.post_uid, 'synced', null, incoming, action, mapped);
      return { action, posterCopied: false, trailerCopied: false, trailerDeferred, mapped, itemStored: Boolean(runId) };
    }

    let posterResult = null;
    let trailerResult = null;
    let posterError = null;
    let trailerError = null;
    if (posterChanged) {
      try { posterResult = await this.copyMedia({ url: normalized.media.poster.url, sourceFingerprint: normalized.media.poster.source_fingerprint, postUid: incoming.post_uid, assetType: 'poster' }); }
      catch (error) { posterError = /^[A-Z0-9_]{1,80}$/.test(error?.code || '') ? error.code : 'CATALOGUE_MEDIA_FAILED'; }
    }
    if (trailerChanged) {
      try { trailerResult = await this.copyMedia({ url: normalized.media.trailer.url, sourceFingerprint: normalized.media.trailer.source_fingerprint, postUid: incoming.post_uid, assetType: 'trailer' }); }
      catch (error) { trailerError = /^[A-Z0-9_]{1,80}$/.test(error?.code || '') ? error.code : 'CATALOGUE_MEDIA_FAILED'; }
    }

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`loyalfans:catalogue:${incoming.post_uid}`]);
      const exactMapping = mapped ? await client.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
        WHERE provider='loyalfans' AND external_content_uid=$1 AND video_legacy_id=$2 AND status='active' FOR SHARE`, [incoming.post_uid, mapping.video_legacy_id]) :
        await client.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
          WHERE provider='loyalfans' AND external_content_uid=$1 AND status='active' FOR SHARE`, [incoming.post_uid]);
      if (mapped && !exactMapping.rowCount) throw invalid('LOYALFANS_CONTENT_MAPPING_REQUIRED', 'The LoyalFans post UID must remain actively mapped to this FLESHLAB video.');
      if (!mapped && exactMapping.rowCount) throw invalid('CATALOGUE_MAPPING_CHANGED', 'A new exact FLESHLAB mapping appeared during this catalogue sync; retry the item.');
      const locked = await client.query('SELECT * FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1 FOR UPDATE', [incoming.post_uid]);
      if (locked.rowCount && locked.rows[0].video_legacy_id && locked.rows[0].video_legacy_id !== metadata.video_legacy_id) throw invalid('CATALOGUE_MAPPING_CHANGED', 'The synced product mapping no longer matches its FLESHLAB video.');
      if (mapped) {
        const mappedVideo = await client.query('SELECT loyalfans_post_uid FROM v3_loyalfans_catalogue_products WHERE video_legacy_id=$1 AND loyalfans_post_uid<>$2 FOR UPDATE', [mapping.video_legacy_id, incoming.post_uid]);
        if (mappedVideo.rowCount) throw invalid('FLESHLAB_VIDEO_ALREADY_MAPPED', 'A different LoyalFans post is already assigned to this FLESHLAB master.');
      }

      const posterSaved = posterResult ? await this.savePromoMediaAsset(client, {
        result: posterResult, mediaKind: 'poster', assetType: 'thumbnail', usage: 'other', postUid: incoming.post_uid,
        visibility: 'public', reviewStatus: 'approved',
        existingAssetId: locked.rows[0]?.poster_media_asset_id || null, videoLegacyId: mapped ? mapping.video_legacy_id : null
      }) : { assetId: locked.rows[0]?.poster_media_asset_id || null, persisted: false, errorCode: null };
      const trailerSaved = trailerResult ? await this.savePromoMediaAsset(client, {
        result: trailerResult, mediaKind: 'trailer', assetType: 'trailer', usage: 'preview_trailer', postUid: incoming.post_uid,
        visibility: 'private', reviewStatus: 'pending_review',
        existingAssetId: locked.rows[0]?.trailer_media_asset_id || null, videoLegacyId: mapped ? mapping.video_legacy_id : null
      }) : { assetId: locked.rows[0]?.trailer_media_asset_id || null, persisted: false, errorCode: null };
      if (posterSaved.errorCode) posterError ||= posterSaved.errorCode;
      if (trailerSaved.errorCode) trailerError ||= trailerSaved.errorCode;
      const savedPosterId = posterSaved.assetId;
      const savedTrailerId = trailerSaved.assetId;
      let posterState = posterError ? 'failed' : savedPosterId ? 'ready' : 'absent';
      let trailerState = trailerError ? 'failed' : savedTrailerId ? 'ready' : trailerDeferred ? 'pending' : 'absent';
      let promoState = posterState === 'ready' && ['ready', 'absent'].includes(trailerState) ? 'complete' : 'partial';
      const savedMetadata = {
        ...metadata,
        poster_source_fingerprint: posterSaved.persisted ? normalized.media.poster.source_fingerprint : (locked.rows[0]?.poster_source_fingerprint || null),
        trailer_source_fingerprint: trailerSaved.persisted ? normalized.media.trailer.source_fingerprint : (locked.rows[0]?.trailer_source_fingerprint || null)
      };
      await this.upsertProduct(client, savedMetadata, savedPosterId, savedTrailerId, {
        metadataSyncState: 'synced', promoState, posterState, posterError, trailerState, trailerError
      });
      await this.recordPriceSnapshot(client, metadata);
      const posterProvenanceFailure = (posterResult && posterSaved.persisted)
        ? await this.recordPromoProvenanceSafely(client, incoming.post_uid, 'poster', normalized.media.poster.source_fingerprint, savedPosterId, posterResult)
        : posterProvenanceRetry ? await this.retryPromoProvenance(client, locked.rows[0], 'poster') : null;
      const trailerProvenanceFailure = (trailerResult && trailerSaved.persisted)
        ? await this.recordPromoProvenanceSafely(client, incoming.post_uid, 'trailer', normalized.media.trailer.source_fingerprint, savedTrailerId, trailerResult)
        : trailerProvenanceRetry ? await this.retryPromoProvenance(client, locked.rows[0], 'trailer') : null;
      if (posterProvenanceFailure) posterError ||= posterProvenanceFailure;
      if (trailerProvenanceFailure) trailerError ||= trailerProvenanceFailure;
      if (posterError || trailerError) promoState = 'partial';
      if (posterProvenanceFailure || trailerProvenanceFailure) await client.query(`UPDATE v3_loyalfans_catalogue_products SET
        promo_media_state='partial',poster_error_code=COALESCE($2,poster_error_code),trailer_error_code=COALESCE($3,trailer_error_code)
        WHERE loyalfans_post_uid=$1`, [incoming.post_uid, posterProvenanceFailure, trailerProvenanceFailure]);
      if (runId) await client.query(`UPDATE v3_loyalfans_catalogue_sync_items SET status='synced',action=$3,mapped=$4,error_code=NULL,updated_at=now()
        WHERE run_id=$1 AND loyalfans_post_uid=$2`, [runId, incoming.post_uid, action, mapped]);
      await client.query('COMMIT');
      return { action, posterCopied: posterSaved.persisted, trailerCopied: trailerSaved.persisted,
        posterFailed: Boolean(posterError), trailerFailed: Boolean(trailerError), promoState, trailerDeferred, mapped, itemStored: Boolean(runId) };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  }

  async saveMediaAsset(client, { result, assetType, usage, postUid, visibility, reviewStatus }) {
    const saved = await client.query(`INSERT INTO v3_media_assets(asset_type,storage_reference,mime_type,byte_size,content_hash,
      processing_state,visibility,review_status,usage,upload_status,file_name)
      VALUES($1,$2,$3,$4,$5,'ready',$6,$7,$8,'uploaded',$9) RETURNING id`,
    [assetType, result.object_key, result.mime_type, result.byte_size, result.content_hash, visibility, reviewStatus, usage, `${postUid}-${assetType}`]);
    return saved.rows[0].id;
  }

  async savePromoMediaAsset(client, { result, mediaKind, assetType, usage, postUid, visibility, reviewStatus,
    existingAssetId, videoLegacyId }) {
    const savepoint = `${mediaKind}_promo_asset`;
    await client.query(`SAVEPOINT ${savepoint}`);
    try {
      const assetId = await this.saveMediaAsset(client, { result, assetType, usage, postUid, visibility, reviewStatus });
      if (videoLegacyId) await this.linkMediaAsset(client, assetId, videoLegacyId);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return { assetId, persisted: true, errorCode: null };
    } catch {
      try {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      } catch (error) {
        throw error;
      }
      try { await this.blob?.deleteObject?.(result.object_key); } catch { /* The local record stays failed and can be retried. */ }
      this.reportPromoPersistenceFailure({ mediaKind, diagnostic: result.diagnostic });
      return { assetId: existingAssetId, persisted: false, errorCode: 'CATALOGUE_MEDIA_RECORD_FAILED' };
    }
  }

  reportPromoPersistenceFailure({ mediaKind, diagnostic = {} }) {
    // This callback only receives the safe diagnostic shape; no source URL or
    // provider error object is retained or forwarded.
    try {
      this.onMediaDiagnostic?.({ asset_type: mediaKind, normalized_hostname: diagnostic.normalized_hostname || null,
        http_status: diagnostic.http_status ?? null, declared_content_type: diagnostic.declared_content_type || null,
        detected_mime_type: diagnostic.detected_mime_type || null, content_length: diagnostic.content_length ?? null,
        error_code: 'CATALOGUE_MEDIA_RECORD_FAILED' });
    } catch { /* Diagnostics cannot affect catalogue persistence. */ }
  }

  async recordPromoProvenanceSafely(client, postUid, mediaKind, sourceFingerprint, assetId, result) {
    const savepoint = `${mediaKind}_provenance`;
    await client.query(`SAVEPOINT ${savepoint}`);
    try {
      await this.recordMediaProvenance(client, postUid, mediaKind, sourceFingerprint, assetId, result);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return null;
    } catch {
      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      this.reportPromoPersistenceFailure({ mediaKind, diagnostic: result?.diagnostic });
      return 'CATALOGUE_MEDIA_RECORD_FAILED';
    }
  }

  async retryPromoProvenance(client, product, mediaKind) {
    const isPoster = mediaKind === 'poster';
    const assetId = isPoster ? product.poster_media_asset_id : product.trailer_media_asset_id;
    const fingerprint = isPoster ? product.poster_source_fingerprint : product.trailer_source_fingerprint;
    if (!assetId || !fingerprint) return 'CATALOGUE_MEDIA_RECORD_FAILED';
    const asset = await client.query(`SELECT mime_type,byte_size,content_hash FROM v3_media_assets WHERE id=$1 AND processing_state='ready'`, [assetId]);
    if (!asset.rowCount) return 'CATALOGUE_MEDIA_RECORD_FAILED';
    return this.recordPromoProvenanceSafely(client, product.loyalfans_post_uid, mediaKind, fingerprint, assetId, asset.rows[0]);
  }

  async linkMediaAsset(client, assetId, videoLegacyId) {
    await client.query(`INSERT INTO v3_media_asset_links(asset_id,video_legacy_id,is_primary) VALUES($1,$2,false) ON CONFLICT DO NOTHING`, [assetId, videoLegacyId]);
  }

  async upsertProduct(client, metadata, posterAssetId, trailerAssetId, mediaStatus = {}) {
    mediaStatus = { metadataSyncState: 'synced', promoState: 'partial', posterState: posterAssetId ? 'ready' : 'absent',
      posterError: null, trailerState: trailerAssetId ? 'ready' : 'absent', trailerError: null, ...mediaStatus };
    const values = [metadata.post_uid, metadata.video_uid, metadata.short_url, metadata.video_legacy_id, metadata.owner_uid, metadata.slug,
      metadata.title, metadata.description, metadata.clean_description, JSON.stringify(metadata.hashtags), metadata.current_price_minor,
      metadata.old_price_minor, metadata.currency, metadata.discount_percent, metadata.discount_expire_at, metadata.duration_seconds,
      metadata.width, metadata.height, metadata.mime_type, metadata.preview_option, metadata.orientation, metadata.downloadable_resolution, metadata.downloadable_format,
      metadata.downloadable_size_bytes, metadata.video_available, metadata.downloadable, metadata.can_buy, metadata.can_see, metadata.availability_state,
      metadata.privacy_rule, metadata.source_created_at, metadata.source_updated_at, posterAssetId, trailerAssetId,
      metadata.poster_source_fingerprint, metadata.trailer_source_fingerprint, metadata.metadata_fingerprint, metadata.sync_status, metadata.downloadable_size_display,
      mediaStatus.metadataSyncState, mediaStatus.promoState, mediaStatus.posterState, mediaStatus.posterError,
      mediaStatus.trailerState, mediaStatus.trailerError];
    await client.query(`INSERT INTO v3_loyalfans_catalogue_products(
      loyalfans_post_uid,loyalfans_video_uid,short_url,video_legacy_id,owner_uid,slug,title,description,clean_description,hashtags,
      current_price_minor,old_price_minor,currency,discount_percent,discount_expire_at,duration_seconds,width,height,mime_type,preview_option,orientation,
      downloadable_resolution,downloadable_format,downloadable_size_bytes,video_available,downloadable,can_buy,can_see,availability_state,
      privacy_rule,source_created_at,source_updated_at,poster_media_asset_id,trailer_media_asset_id,poster_source_fingerprint,
      trailer_source_fingerprint,metadata_fingerprint,sync_status,downloadable_size_display,metadata_sync_state,promo_media_state,
      poster_ingest_state,poster_error_code,trailer_ingest_state,trailer_error_code,last_synced_at,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,now(),now())
      ON CONFLICT(loyalfans_post_uid) DO UPDATE SET
        loyalfans_video_uid=EXCLUDED.loyalfans_video_uid,short_url=EXCLUDED.short_url,video_legacy_id=EXCLUDED.video_legacy_id,owner_uid=EXCLUDED.owner_uid,
        slug=EXCLUDED.slug,title=EXCLUDED.title,description=EXCLUDED.description,clean_description=EXCLUDED.clean_description,
        hashtags=EXCLUDED.hashtags,current_price_minor=EXCLUDED.current_price_minor,old_price_minor=EXCLUDED.old_price_minor,
        currency=EXCLUDED.currency,discount_percent=EXCLUDED.discount_percent,discount_expire_at=EXCLUDED.discount_expire_at,
        duration_seconds=EXCLUDED.duration_seconds,width=EXCLUDED.width,height=EXCLUDED.height,mime_type=EXCLUDED.mime_type,
        preview_option=EXCLUDED.preview_option,orientation=EXCLUDED.orientation,
        downloadable_resolution=EXCLUDED.downloadable_resolution,downloadable_format=EXCLUDED.downloadable_format,
        downloadable_size_bytes=EXCLUDED.downloadable_size_bytes,downloadable_size_display=EXCLUDED.downloadable_size_display,
        video_available=EXCLUDED.video_available,
        downloadable=EXCLUDED.downloadable,can_buy=EXCLUDED.can_buy,
        can_see=EXCLUDED.can_see,availability_state=EXCLUDED.availability_state,privacy_rule=EXCLUDED.privacy_rule,
        source_created_at=EXCLUDED.source_created_at,source_updated_at=EXCLUDED.source_updated_at,
        poster_media_asset_id=EXCLUDED.poster_media_asset_id,trailer_media_asset_id=EXCLUDED.trailer_media_asset_id,
        poster_source_fingerprint=EXCLUDED.poster_source_fingerprint,trailer_source_fingerprint=EXCLUDED.trailer_source_fingerprint,
        metadata_fingerprint=EXCLUDED.metadata_fingerprint,sync_status=EXCLUDED.sync_status,
        metadata_sync_state=EXCLUDED.metadata_sync_state,promo_media_state=EXCLUDED.promo_media_state,
        poster_ingest_state=EXCLUDED.poster_ingest_state,poster_error_code=EXCLUDED.poster_error_code,
        trailer_ingest_state=EXCLUDED.trailer_ingest_state,trailer_error_code=EXCLUDED.trailer_error_code,
        last_synced_at=now(),updated_at=now()
      WHERE v3_loyalfans_catalogue_products.video_legacy_id IS NULL OR v3_loyalfans_catalogue_products.video_legacy_id=EXCLUDED.video_legacy_id`, values);
  }

  async markProductConflict(postUid) {
    await this.db.query(`UPDATE v3_loyalfans_catalogue_products SET sync_status='conflict',availability_state='unknown',updated_at=now()
      WHERE loyalfans_post_uid=$1`, [postUid]);
  }

  async recordPriceSnapshot(client, metadata) {
    const snapshot = { current_price_minor: metadata.current_price_minor, old_price_minor: metadata.old_price_minor,
      discount_percent: metadata.discount_percent, discount_expire_at: metadata.discount_expire_at, currency: metadata.currency };
    const fingerprint = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
    await client.query(`INSERT INTO v3_loyalfans_catalogue_price_history(loyalfans_post_uid,current_price_minor,old_price_minor,
      discount_percent,discount_expire_at,currency,source_updated_at,snapshot_fingerprint)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(loyalfans_post_uid,snapshot_fingerprint) DO NOTHING`,
    [metadata.post_uid, metadata.current_price_minor, metadata.old_price_minor, metadata.discount_percent,
      metadata.discount_expire_at, metadata.currency, metadata.source_updated_at, fingerprint]);
  }

  async recordMediaProvenance(client, postUid, mediaKind, sourceFingerprint, assetId, result) {
    await client.query(`INSERT INTO v3_loyalfans_catalogue_media_provenance(loyalfans_post_uid,media_kind,source_fingerprint,
      media_asset_id,content_hash,byte_size) VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(loyalfans_post_uid,media_kind,source_fingerprint) DO NOTHING`,
    [postUid, mediaKind, sourceFingerprint, assetId, result.content_hash, result.byte_size]);
  }

  async status() {
    const [totals, lastRun, lastSuccess] = await Promise.all([
      this.db.query(`SELECT count(*)::int AS catalogued,
        count(*) FILTER (WHERE p.sync_status='active' AND m.id IS NOT NULL)::int AS mapped,
        count(*) FILTER (WHERE p.sync_status='unmapped' OR p.video_legacy_id IS NULL OR m.id IS NULL)::int AS unmapped,
        count(*) FILTER (WHERE poster.id IS NOT NULL)::int AS with_poster,
        count(*) FILTER (WHERE p.trailer_media_asset_id IS NOT NULL)::int AS with_trailer,
        count(*) FILTER (WHERE p.metadata_sync_state='synced')::int AS metadata_synced,
        count(*) FILTER (WHERE p.promo_media_state='complete')::int AS promo_complete,
        count(*) FILTER (WHERE p.promo_media_state='partial')::int AS promo_partial,
        count(*) FILTER (WHERE p.poster_ingest_state='failed')::int AS poster_failures,
        count(*) FILTER (WHERE p.trailer_ingest_state='failed')::int AS trailer_failures,
        count(*) FILTER (WHERE m.id IS NOT NULL AND source_asset.id IS NOT NULL)::int AS fully_ingested,
        count(*) FILTER (WHERE m.id IS NOT NULL AND source_asset.id IS NULL)::int AS metadata_only,
        count(*) FILTER (WHERE source_asset.id IS NULL)::int AS missing_full_video,
        count(*) FILTER (WHERE poster.id IS NULL)::int AS missing_poster,
        count(*) FILTER (WHERE p.availability_state='available' AND p.sync_status='active')::int AS available
        FROM v3_loyalfans_catalogue_products p
        LEFT JOIN v3_catalogue_external_content_mappings m ON m.provider='loyalfans' AND m.external_content_uid=p.loyalfans_post_uid
          AND m.video_legacy_id=p.video_legacy_id AND m.status='active'
        LEFT JOIN v3_media_assets poster ON poster.id=p.poster_media_asset_id AND poster.visibility='public'
          AND poster.processing_state='ready' AND poster.review_status='approved'
        LEFT JOIN LATERAL (SELECT a.id FROM v3_media_asset_links l JOIN v3_media_assets a ON a.id=l.asset_id
          WHERE l.video_legacy_id=p.video_legacy_id AND l.is_primary=true AND a.asset_type='source'
            AND a.visibility='private' AND a.processing_state='ready' AND a.storage_reference IS NOT NULL LIMIT 1) source_asset ON true`),
      this.db.query(`SELECT * FROM v3_loyalfans_catalogue_sync_runs ORDER BY started_at DESC LIMIT 1`),
      this.db.query(`SELECT finished_at FROM v3_loyalfans_catalogue_sync_runs WHERE status='complete' ORDER BY finished_at DESC LIMIT 1`)
    ]);
    const summary = totals.rows[0] || {};
    const run = lastRun.rows[0] || null;
    const unresolved = await this.db.query(`SELECT count(*)::int AS count FROM v3_loyalfans_catalogue_sync_items
      WHERE status IN ('conflict','failed')`);
    const [catalogueConflicts, mediaJobs] = await Promise.all([
      this.db.query("SELECT count(*)::int AS count FROM v3_loyalfans_catalogue_products WHERE sync_status='conflict'"),
      this.db.query("SELECT count(*) FILTER (WHERE state='MEDIA_PENDING')::int AS pending,count(*) FILTER (WHERE state='MEDIA_INGESTING')::int AS ingesting,count(*) FILTER (WHERE state='FAILED')::int AS failed FROM v3_provider_media_jobs WHERE provider='loyalfans'")
    ]);
    const fullVideo=await this.db.query(`SELECT count(*)::int AS total,
      count(*) FILTER(WHERE p.full_video_state='ready' AND j.id IS NOT NULL AND a.processing_state='ready' AND a.visibility='private'
        AND a.asset_type='source' AND a.storage_reference IS NOT NULL AND a.storage_reference !~* '^https?://')::int AS ready,
      count(*) FILTER(WHERE p.full_video_state='pending')::int AS pending,
      count(*) FILTER(WHERE p.full_video_state='ingesting')::int AS ingesting,
      count(*) FILTER(WHERE p.full_video_state='failed')::int AS failed,
      count(*) FILTER(WHERE p.full_video_state='not_imported')::int AS not_imported,
      count(*) FILTER(WHERE p.full_video_state='ready' AND p.full_video_existing_master_reused AND j.id IS NOT NULL
        AND a.processing_state='ready' AND a.visibility='private' AND a.asset_type='source'
        AND a.storage_reference IS NOT NULL AND a.storage_reference !~* '^https?://')::int AS existing_master_reused
      FROM v3_loyalfans_catalogue_products p
      LEFT JOIN v3_provider_media_jobs j ON j.provider='loyalfans' AND j.external_content_uid=p.loyalfans_post_uid
        AND j.asset_id=p.full_video_asset_id AND j.state='MEDIA_READY'
      LEFT JOIN v3_media_assets a ON a.id=p.full_video_asset_id`);
    const fullVideoCounts=fullVideo.rows[0]||{};
    return { total_upstream_products: run?.expected_total == null ? null : Number(run.expected_total),
      catalogued: Number(summary.catalogued || 0), mapped: Number(summary.mapped || 0), unmapped: Number(summary.unmapped || 0),
      fully_ingested: Number(summary.fully_ingested || 0), metadata_only: Number(summary.metadata_only || 0),
      metadata_synced: Number(summary.metadata_synced || 0), promo_complete: Number(summary.promo_complete || 0),
      promo_partial: Number(summary.promo_partial || 0), poster_failures: Number(summary.poster_failures || 0),
      trailer_failures: Number(summary.trailer_failures || 0),
      missing_full_video: Number(summary.missing_full_video || 0), missing_poster: Number(summary.missing_poster || 0),
      available: Number(summary.available || 0), conflicts: Number(unresolved.rows[0]?.count || 0) + Number(catalogueConflicts.rows[0]?.count || 0),
      media_ingestion_jobs: { pending: Number(mediaJobs.rows[0]?.pending || 0), ingesting: Number(mediaJobs.rows[0]?.ingesting || 0), failed: Number(mediaJobs.rows[0]?.failed || 0) },
      full_video: { total:Number(fullVideoCounts.total||0),ready:Number(fullVideoCounts.ready||0),pending:Number(fullVideoCounts.pending||0),
        ingesting:Number(fullVideoCounts.ingesting||0),failed:Number(fullVideoCounts.failed||0),not_imported:Number(fullVideoCounts.not_imported||0),
        existing_master_reused:Number(fullVideoCounts.existing_master_reused||0) },
      sync: run ? { id: run.id, status: run.status, next_page: run.next_page, scanned: Number(run.scanned),
        created: Number(run.created), updated: Number(run.updated), unchanged: Number(run.unchanged),
        conflicted: Number(run.conflicted), failed: Number(run.failed), unmapped: Number(run.unmapped || 0) } : null,
      last_successful_sync: lastSuccess.rows[0]?.finished_at || null };
  }

  async resolveProductMapping(input, actor = null) {
    if (!String(input?.public_url || '').trim()) throw invalid('LOYALFANS_PUBLIC_URL_REQUIRED', 'A verified public LoyalFans post URL is required for a purchase mapping.');
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const postUid = String(input?.external_content_uid || '').trim();
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`loyalfans:catalogue:${postUid}`]);
      const mapping = await new V3ExternalContentMappingRepository(client).createMapping({ ...input, provider: 'loyalfans' }, actor);
      const attached = await this.attachExistingMappedProduct(mapping.external_content_uid, { client, mapping });
      await client.query('COMMIT');
      return { mapping, ...attached };
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }

  async attachExistingMappedProduct(postUid, { client: transactionClient = null, mapping: suppliedMapping = null } = {}) {
    const mapping = suppliedMapping || await new V3ExternalContentMappingRepository(this.db).findByExternalContentId('loyalfans', postUid);
    if (!mapping) throw invalid('LOYALFANS_CONTENT_MAPPING_REQUIRED', 'An active exact post UID mapping is required.');
    const video = await (transactionClient || this.db).query('SELECT legacy_id FROM catalog_videos WHERE legacy_id=$1', [mapping.video_legacy_id]);
    if (!video.rowCount) throw invalid('MAPPED_FLESHLAB_VIDEO_NOT_FOUND', 'The mapped FLESHLAB video does not exist.');
    const ownsTransaction = !transactionClient;
    const client = transactionClient || await this.db.connect();
    try {
      if (ownsTransaction) await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`loyalfans:catalogue:${postUid}`]);
      const exact = await client.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
        WHERE provider='loyalfans' AND external_content_uid=$1 AND video_legacy_id=$2 AND status='active' FOR SHARE`, [postUid, mapping.video_legacy_id]);
      if (!exact.rowCount) throw invalid('CATALOGUE_MAPPING_CHANGED', 'The active exact post UID mapping changed during resolution.');
      const product = await client.query('SELECT * FROM v3_loyalfans_catalogue_products WHERE loyalfans_post_uid=$1 FOR UPDATE', [postUid]);
      if (!product.rowCount) { if (ownsTransaction) await client.query('COMMIT'); return { attached: false, video_legacy_id: mapping.video_legacy_id }; }
      if (product.rows[0].video_legacy_id && product.rows[0].video_legacy_id !== mapping.video_legacy_id) {
        throw invalid('CATALOGUE_MAPPING_CHANGED', 'The product is already assigned to another FLESHLAB video.');
      }
      const other = await client.query('SELECT loyalfans_post_uid FROM v3_loyalfans_catalogue_products WHERE video_legacy_id=$1 AND loyalfans_post_uid<>$2 FOR UPDATE', [mapping.video_legacy_id, postUid]);
      if (other.rowCount) throw invalid('FLESHLAB_VIDEO_ALREADY_MAPPED', 'A different LoyalFans post is already assigned to this FLESHLAB master.');
      await client.query(`UPDATE v3_loyalfans_catalogue_products SET video_legacy_id=$2,
        sync_status=CASE WHEN sync_status='conflict' THEN 'conflict' ELSE 'active' END,updated_at=now()
        WHERE loyalfans_post_uid=$1`, [postUid, mapping.video_legacy_id]);
      for (const assetId of [product.rows[0].poster_media_asset_id, product.rows[0].trailer_media_asset_id].filter(Boolean)) {
        await this.linkMediaAsset(client, assetId, mapping.video_legacy_id);
      }
      if (ownsTransaction) await client.query('COMMIT');
      return { attached: true, video_legacy_id: mapping.video_legacy_id };
    } catch (error) { if (ownsTransaction) await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { if (ownsTransaction) client.release(); }
  }

  async unresolvedItems({ limit = 100 } = {}) {
    const bounded = Math.max(1, Math.min(250, Number(limit) || 100));
    const result = await this.db.query(`WITH latest_items AS (
        SELECT DISTINCT ON (loyalfans_post_uid) loyalfans_post_uid,loyalfans_video_uid,title,current_price_minor,currency,status,error_code,updated_at
        FROM v3_loyalfans_catalogue_sync_items ORDER BY loyalfans_post_uid,updated_at DESC
      )
      SELECT p.loyalfans_post_uid,p.loyalfans_video_uid,p.slug,p.title,p.current_price_minor,p.currency,
        COALESCE(i.status,'synced') status,COALESCE(i.error_code,'LOYALFANS_CONTENT_MAPPING_REQUIRED') error_code,
        p.short_url,p.sync_status,p.video_legacy_id,m.video_legacy_id AS mapping_video_legacy_id,COALESCE(i.updated_at,p.updated_at) updated_at
      FROM v3_loyalfans_catalogue_products p
      LEFT JOIN v3_catalogue_external_content_mappings m ON m.provider='loyalfans' AND m.external_content_uid=p.loyalfans_post_uid
        AND m.status='active'
      LEFT JOIN latest_items i ON i.loyalfans_post_uid=p.loyalfans_post_uid
      WHERE p.sync_status IN ('unmapped','conflict') OR i.status IN ('conflict','failed')
      UNION ALL
      SELECT i.loyalfans_post_uid,i.loyalfans_video_uid,NULL::text AS slug,i.title,i.current_price_minor,i.currency,i.status,i.error_code,
        NULL::text AS short_url,NULL::text AS sync_status,NULL::text AS video_legacy_id,NULL::text AS mapping_video_legacy_id,i.updated_at
      FROM latest_items i LEFT JOIN v3_loyalfans_catalogue_products p USING(loyalfans_post_uid)
      WHERE p.loyalfans_post_uid IS NULL AND i.status IN ('conflict','failed')
      ORDER BY updated_at DESC,loyalfans_post_uid LIMIT $1`, [bounded]);
    return { records: result.rows };
  }
}
