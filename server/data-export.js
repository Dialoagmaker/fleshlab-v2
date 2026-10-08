// Admin-only export of the self-hosted catalogue.  This intentionally reads
// PostgreSQL directly and never contacts Base44.  The export envelope matches
// the controlled catalogue-import format so it can be archived or replayed.

const entities = Object.freeze(['Brand', 'Performer', 'Video', 'VideoPerformer']);

function envelope(entity, records) {
  return {
    entity,
    exported_at: new Date().toISOString(),
    count: records.length,
    records
  };
}

function sourceRecord(row, fallback) {
  // The immutable legacy identifier is the authoritative ID.  Do not let a
  // stale JSON payload replace it when an import has been replayed.
  return { ...(row.source_payload || {}), ...fallback, id: row.legacy_id };
}

export class DataExportService {
  constructor(db) { this.db = db; }

  async exports(requested = 'all') {
    const key = String(requested || 'all').toLowerCase();
    const wanted = key === 'all'
      ? entities
      : entities.filter((entity) => entity.toLowerCase() === key);
    if (!wanted.length) {
      const error = new Error('Unsupported export entity.');
      error.code = 'EXPORT_ENTITY_INVALID';
      throw error;
    }

    const output = {};
    if (wanted.includes('Brand')) {
      const result = await this.db.query('SELECT legacy_id,source_payload FROM catalog_brands ORDER BY name,legacy_id');
      output.Brand = envelope('Brand', result.rows.map((row) => sourceRecord(row, {})));
    }
    if (wanted.includes('Performer')) {
      const result = await this.db.query('SELECT legacy_id,source_payload FROM catalog_performers ORDER BY display_name,legacy_id');
      output.Performer = envelope('Performer', result.rows.map((row) => sourceRecord(row, {})));
    }
    if (wanted.includes('Video')) {
      const result = await this.db.query('SELECT legacy_id,source_payload FROM catalog_videos ORDER BY release_date DESC NULLS LAST,legacy_id');
      output.Video = envelope('Video', result.rows.map((row) => sourceRecord(row, {})));
    }
    if (wanted.includes('VideoPerformer')) {
      const result = await this.db.query('SELECT video_legacy_id,performer_legacy_id,role_name,display_order,featured,lead_performer FROM catalog_video_performers ORDER BY video_legacy_id,performer_legacy_id');
      output.VideoPerformer = envelope('VideoPerformer', result.rows.map((row) => ({
        // The original Base44 credit-row ID was not retained by migration 0004.
        // This deterministic compound key preserves the relationship and makes
        // subsequent controlled imports idempotent without pretending it is an
        // original Base44 record ID.
        id: `${row.video_legacy_id}:${row.performer_legacy_id}`,
        video_id: row.video_legacy_id,
        performer_id: row.performer_legacy_id,
        role: row.role_name,
        order: row.display_order,
        featured: row.featured,
        lead_performer: row.lead_performer
      })));
    }
    return output;
  }
}

