import { createHash, randomUUID } from 'node:crypto';
import { mediaError, providerMediaIdentity } from './provider-media-ingestion.js';

/** PostgreSQL session locks span streaming; only technical identifiers enter SQL. */
export class PostgresProviderMediaRepository {
  constructor(db) { this.db = db; }

  async withJob(input, run) {
    const identity = providerMediaIdentity(input,{allowContentOnly:input?.contentOnly===true});
    const client = await this.db.connect();
    const keys = [
      ...(identity.transactionId ? [JSON.stringify(['provider-media-transaction',identity.provider,identity.transactionId])] : []),
      JSON.stringify(['provider-media-content',identity.provider,identity.contentUid])
    ];
    const locked = [];
    let broken = false;
    try {
      for (const key of keys) {
        await client.query('SELECT pg_advisory_lock(hashtextextended($1,0))', [key]); locked.push(key);
      }
      await client.query('BEGIN');
      const previous = identity.transactionId ? await client.query(`SELECT external_content_uid FROM v3_provider_media_transactions
        WHERE provider=$1 AND provider_transaction_id=$2`, [identity.provider,identity.transactionId]) : {rowCount:0,rows:[]};
      if (previous.rowCount && previous.rows[0].external_content_uid !== identity.contentUid) throw mediaError('MEDIA_TRANSACTION_CONFLICT');
      let row = (await client.query(`INSERT INTO v3_provider_media_jobs(provider,external_content_uid)
        VALUES($1,$2) ON CONFLICT(provider,external_content_uid) DO UPDATE SET updated_at=now() RETURNING *`,
      [identity.provider,identity.contentUid])).rows[0];
      if(identity.transactionId)await client.query(`INSERT INTO v3_provider_media_transactions(provider,provider_transaction_id,external_content_uid,job_id)
        VALUES($1,$2,$3,$4) ON CONFLICT(provider,provider_transaction_id) DO NOTHING`,
      [identity.provider,identity.transactionId,identity.contentUid,row.id]);
      let recovered=false;
      if(row.state==='MEDIA_INGESTING') {
        if(row.asset_id)await client.query(`UPDATE v3_media_assets SET processing_state='failed',updated_at=now()
          WHERE id=$1 AND processing_state<>'ready'`,[row.asset_id]);
        row=(await client.query(`UPDATE v3_provider_media_jobs SET state='FAILED',last_error_code='MEDIA_INGESTION_INTERRUPTED',
          retryable=true,available_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[row.id])).rows[0];
        recovered=true;
      }
      await client.query('COMMIT');

      if (row.state === 'MEDIA_READY') {
        const ready = await client.query(`SELECT 1 FROM v3_media_assets WHERE id=$1 AND asset_type='source'
          AND visibility='private' AND processing_state='ready' AND storage_reference IS NOT NULL`,[row.asset_id]);
        if (!ready.rowCount) throw mediaError('MEDIA_READY_ASSET_UNAVAILABLE', true);
      }

      const mappings = await client.query(`SELECT video_legacy_id FROM v3_catalogue_external_content_mappings
        WHERE provider=$1 AND external_content_uid=$2 AND status='active'`, [identity.provider,identity.contentUid]);
      if (mappings.rowCount > 1) throw mediaError('MEDIA_MAPPING_AMBIGUOUS');
      if (row.state !== 'MEDIA_READY' && mappings.rowCount === 1) {
        const existing = await client.query(`SELECT a.id,a.byte_size,a.content_hash,a.mime_type FROM v3_media_assets a
          JOIN v3_media_asset_links l ON l.asset_id=a.id
          WHERE l.video_legacy_id=$1 AND l.is_primary=true AND a.asset_type='source'
            AND a.visibility='private' AND a.processing_state='ready' AND a.storage_reference IS NOT NULL`,
        [mappings.rows[0].video_legacy_id]);
        if (existing.rowCount > 1) throw mediaError('MEDIA_MAPPING_AMBIGUOUS');
        if (existing.rowCount) {
          const asset = existing.rows[0];
          row = (await client.query(`UPDATE v3_provider_media_jobs SET state='MEDIA_READY',asset_id=$2,
            byte_size=$3,checksum_sha256=$4,mime_type=$5,last_error_code=NULL,retryable=false,updated_at=now()
            WHERE id=$1 RETURNING *`, [row.id,asset.id,Number(asset.byte_size)>0?asset.byte_size:null,
            /^[a-f0-9]{64}$/.test(asset.content_hash || '')?asset.content_hash:null,asset.mime_type])).rows[0];
        }
      }
      if(row.state==='FAILED' && input?.retryFailed===true) {
        row=(await client.query(`UPDATE v3_provider_media_jobs SET state='MEDIA_PENDING',last_error_code=NULL,retryable=false,
          available_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[row.id])).rows[0];
      }
      if (row.state === 'FAILED' && (!row.retryable || new Date(row.available_at).getTime() > Date.now())) {
        throw mediaError(row.retryable ? 'MEDIA_RETRY_NOT_DUE' : 'MEDIA_RETRY_NOT_ALLOWED', row.retryable);
      }
      const objectKey = `provider-media/${identity.provider}/${createHash('sha256').update(identity.contentUid).digest('hex')}/source`;
      const job = {
        get state() { return row.state; },
        get assetId() { return row.asset_id; },
        recovered,
        objectKey,
        start: async mimeType => {
          await client.query('BEGIN');
          try {
            const assetId = row.asset_id || randomUUID();
            await client.query(`INSERT INTO v3_media_assets(id,asset_type,storage_reference,mime_type,processing_state,visibility)
              VALUES($1,'source',$2,$3,'processing','private') ON CONFLICT(id) DO UPDATE
              SET processing_state='processing',updated_at=now()`, [assetId,objectKey,mimeType]);
            row = (await client.query(`UPDATE v3_provider_media_jobs SET state='MEDIA_INGESTING',asset_id=$2,
              attempts=attempts+1,last_error_code=NULL,retryable=false,updated_at=now() WHERE id=$1 RETURNING *`,
            [row.id,assetId])).rows[0];
            await client.query('COMMIT');
          } catch(error) { await client.query('ROLLBACK'); throw error; }
        },
        ready: async metadata => {
          await client.query('BEGIN');
          try {
            await client.query(`UPDATE v3_media_assets SET processing_state='ready',byte_size=$2,content_hash=$3,
              mime_type=$4,updated_at=now() WHERE id=$1 AND visibility='private' AND asset_type='source'`,
            [row.asset_id,metadata.byteSize,metadata.checksum,metadata.mimeType]);
            row = (await client.query(`UPDATE v3_provider_media_jobs SET state='MEDIA_READY',byte_size=$2,
              checksum_sha256=$3,mime_type=$4,duration_seconds=$5,width=$6,height=$7,last_error_code=NULL,
              retryable=false,updated_at=now() WHERE id=$1 RETURNING *`,
            [row.id,metadata.byteSize,metadata.checksum,metadata.mimeType,metadata.durationSeconds,metadata.width,metadata.height])).rows[0];
            await client.query('COMMIT');
          } catch(error) { await client.query('ROLLBACK'); throw error; }
        },
        failed: async (code,retryable,retryDelaySeconds=30) => {
          const delay=Number.isSafeInteger(retryDelaySeconds)?Math.max(0,Math.min(3600,retryDelaySeconds)):30;
          await client.query('BEGIN');
          try {
            if (row.asset_id) await client.query(`UPDATE v3_media_assets SET processing_state='failed',updated_at=now()
              WHERE id=$1 AND processing_state <> 'ready'`, [row.asset_id]);
            row = (await client.query(`UPDATE v3_provider_media_jobs SET state='FAILED',last_error_code=$2,retryable=$3,
              available_at=now()+($4 * interval '1 second'),updated_at=now() WHERE id=$1 RETURNING *`, [row.id,code,retryable,delay])).rows[0];
            await client.query('COMMIT');
          } catch(error) { await client.query('ROLLBACK'); throw error; }
        }
      };
      return await run(job);
    } catch(error) {
      await client.query('ROLLBACK').catch(() => { broken = true; });
      if (/^MEDIA_[A-Z_]+$/.test(error?.code || '')) throw error;
      throw mediaError('MEDIA_REPOSITORY_FAILED', true);
    } finally {
      for (const key of locked.reverse()) {
        try { await client.query('SELECT pg_advisory_unlock(hashtextextended($1,0))', [key]); }
        catch { broken = true; }
      }
      client.release(broken);
    }
  }
}
