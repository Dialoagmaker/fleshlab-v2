import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { V3ExternalContentMappingRepository } from './v3-external-content-mappings.js';
import { resolveLoyalFansTransactionToCatalogue } from './loyalfans-transactions.js';

function mappingDb(videoIds = ['video-a', 'video-b']) {
  const mappings = [];
  let sequence = 0;
  return {
    mappings,
    async query(sql, values = []) {
      if (sql.includes('SELECT legacy_id FROM catalog_videos')) {
        const found = videoIds.includes(values[0]);
        return { rows: found ? [{ legacy_id: values[0] }] : [], rowCount: found ? 1 : 0 };
      }
      if (sql.includes('SELECT id FROM v3_catalogue_external_content_mappings WHERE provider')) {
        const row = mappings.find(item => item.provider === values[0] && item.external_content_uid === values[1]);
        return { rows: row ? [{ id: row.id }] : [], rowCount: row ? 1 : 0 };
      }
      if (sql.includes('WHERE provider=$1 AND external_content_uid=$2 AND status')) {
        const row = mappings.find(item => item.provider === values[0] && item.external_content_uid === values[1] && item.status === 'active');
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }
      if (sql.includes('WHERE video_legacy_id=$1 ORDER BY')) {
        const rows = mappings.filter(item => item.video_legacy_id === values[0]).sort((a, b) => `${a.provider}:${a.external_content_uid}`.localeCompare(`${b.provider}:${b.external_content_uid}`));
        return { rows, rowCount: rows.length };
      }
      if (sql.includes('INSERT INTO v3_catalogue_external_content_mappings')) {
        const [video_legacy_id, provider, external_content_uid, external_slug, public_url, status, created_by] = values;
        if (mappings.some(item => item.provider === provider && item.external_content_uid === external_content_uid)) {
          const error = new Error('duplicate');
          error.code = '23505';
          throw error;
        }
        const row = { id: `mapping-${++sequence}`, video_legacy_id, provider, external_content_uid, external_slug, public_url, status, created_by, created_at: '2026-10-02T00:00:00.000Z', updated_at: '2026-10-02T00:00:00.000Z' };
        mappings.push(row);
        return { rows: [row], rowCount: 1 };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    }
  };
}

function transaction(contentUid) {
  return {
    provider: 'loyalfans',
    provider_transaction_id: 'test-provider-transaction-0001',
    transaction_type: 'clip_store',
    provider_member_uid: 'test-provider-member-0001',
    provider_content_uid: contentUid,
    provider_content_slug: 'a-title-that-is-not-an-identity-key'
  };
}

test('migration creates provider-scoped external content identity with a video index', async () => {
  const migration = await fs.readFile(new URL('../migrations/0053_v3_catalogue_external_content_mappings.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS v3_catalogue_external_content_mappings/);
  assert.match(migration, /video_legacy_id text NOT NULL REFERENCES catalog_videos\(legacy_id\)/);
  assert.match(migration, /provider text NOT NULL CHECK \(btrim\(provider\) <> ''\) CHECK \(provider = lower\(provider\)\)/);
  assert.match(migration, /external_content_uid text NOT NULL CHECK \(btrim\(external_content_uid\) <> ''\)/);
  assert.match(migration, /UNIQUE\(provider, external_content_uid\)/);
  assert.match(migration, /v3_catalogue_external_content_mappings_video_idx/);
});

test('resolves only an exact normalized provider plus external content UID', async () => {
  const db = mappingDb();
  const repository = new V3ExternalContentMappingRepository(db);
  await repository.createMapping({ videoLegacyId: 'video-a', provider: 'LoyalFans', externalContentUid: 'same-uid', externalSlug: 'not-used-for-resolution' });
  const mapping = await repository.findByExternalContentId('loyalfans', 'same-uid');
  assert.equal(mapping.video_legacy_id, 'video-a');
  assert.equal(mapping.provider, 'loyalfans');
  assert.equal(await repository.findByExternalContentId('loyalfans', 'unknown-uid'), null);
  assert.equal(await repository.findByExternalContentId('unknown-provider', 'same-uid'), null);
});

test('rejects blank identifiers and normalizes uppercase providers before persistence', async () => {
  const db = mappingDb();
  const repository = new V3ExternalContentMappingRepository(db);
  await assert.rejects(() => repository.createMapping({ videoLegacyId: 'video-a', provider: '', externalContentUid: 'content-id' }), { code: 'EXTERNAL_CONTENT_PROVIDER_INVALID' });
  await assert.rejects(() => repository.createMapping({ videoLegacyId: 'video-a', provider: '   ', externalContentUid: 'content-id' }), { code: 'EXTERNAL_CONTENT_PROVIDER_INVALID' });
  await assert.rejects(() => repository.createMapping({ videoLegacyId: 'video-a', provider: 'loyalfans', externalContentUid: '' }), { code: 'EXTERNAL_CONTENT_UID_REQUIRED' });
  await assert.rejects(() => repository.createMapping({ videoLegacyId: 'video-a', provider: 'loyalfans', externalContentUid: '   ' }), { code: 'EXTERNAL_CONTENT_UID_REQUIRED' });
  const mapping = await repository.createMapping({ videoLegacyId: 'video-a', provider: 'LoyalFans', externalContentUid: 'content-id' });
  assert.equal(mapping.provider, 'loyalfans');
  assert.equal(db.mappings[0].provider, 'loyalfans');
});

test('permits the same external UID under different providers and multiple providers for one video', async () => {
  const db = mappingDb();
  const repository = new V3ExternalContentMappingRepository(db);
  await repository.createMapping({ videoLegacyId: 'video-a', provider: 'loyalfans', externalContentUid: 'shared-uid' });
  await repository.createMapping({ videoLegacyId: 'video-b', provider: 'faphouse', externalContentUid: 'shared-uid' });
  await repository.createMapping({ videoLegacyId: 'video-a', provider: 'clips4sale', externalContentUid: 'clips-id' });
  assert.equal((await repository.findByExternalContentId('loyalfans', 'shared-uid')).video_legacy_id, 'video-a');
  assert.equal((await repository.findByExternalContentId('faphouse', 'shared-uid')).video_legacy_id, 'video-b');
  assert.deepEqual((await repository.findByVideoId('video-a')).map(item => item.provider), ['clips4sale', 'loyalfans']);
});

test('does not resolve inactive mappings and rejects duplicate or nonexistent-video mappings', async () => {
  const db = mappingDb();
  const repository = new V3ExternalContentMappingRepository(db);
  await repository.createMapping({ videoLegacyId: 'video-a', provider: 'loyalfans', externalContentUid: 'inactive-uid', status: 'inactive' });
  assert.equal(await repository.findByExternalContentId('loyalfans', 'inactive-uid'), null);
  await assert.rejects(() => repository.createMapping({ videoLegacyId: 'video-a', provider: 'loyalfans', externalContentUid: 'inactive-uid' }), { code: 'EXTERNAL_CONTENT_MAPPING_DUPLICATE' });
  await assert.rejects(() => repository.createMapping({ videoLegacyId: 'missing-video', provider: 'loyalfans', externalContentUid: 'new-uid' }), { code: 'EXTERNAL_CONTENT_MAPPING_VIDEO_NOT_FOUND' });
});

test('LoyalFans matching resolves only through the repository provider-plus-UID lookup and retains unmapped behavior', async () => {
  const db = mappingDb();
  const repository = new V3ExternalContentMappingRepository(db);
  await repository.createMapping({ videoLegacyId: 'video-a', provider: 'loyalfans', externalContentUid: 'loyalfans-content-uid' });
  const matched = await resolveLoyalFansTransactionToCatalogue(transaction('loyalfans-content-uid'), repository);
  assert.equal(matched.matched, true);
  assert.equal(matched.fleshlab_video_id, 'video-a');
  const unmapped = await resolveLoyalFansTransactionToCatalogue(transaction('different-uid-with-the-same-title'), repository);
  assert.deepEqual(unmapped.matched, false);
  assert.equal(unmapped.reason, 'UNMAPPED_EXTERNAL_CONTENT_UID');
});
