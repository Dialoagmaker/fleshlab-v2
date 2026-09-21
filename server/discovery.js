import { HttpError } from './errors.js';

// Discovery intentionally reports only signals FLESHLAB owns in PostgreSQL.
// The former Base44 page also displayed GA4/GSC connector data; that data is
// neither imported nor inferred here, so it cannot be mistaken for live data.
export class DiscoveryService {
  constructor(db) { this.db = db; }

  async snapshot(user) {
    if (!['staff', 'admin'].includes(user?.role)) {
      throw new HttpError(403, 'FORBIDDEN', 'An authorized staff role is required.');
    }
    const [metrics, candidates, catalogue] = await Promise.all([
      this.db.query(`SELECT
        (SELECT count(*)::int FROM performer_applications WHERE status IN ('submitted','under_review')) AS review_queue,
        (SELECT count(*)::int FROM performer_applications WHERE created_at >= now() - interval '30 days') AS applications_last_30_days,
        (SELECT count(*)::int FROM performer_applications WHERE updated_at < now() - interval '7 days' AND status IN ('submitted','under_review')) AS stale_reviews,
        (SELECT count(*)::int FROM catalog_performers WHERE status='active') AS active_performers,
        (SELECT count(*)::int FROM catalog_videos WHERE status='published') AS published_videos,
        (SELECT count(*)::int FROM catalog_videos WHERE status='published' AND (description IS NULL OR btrim(description)='')) AS videos_missing_description,
        (SELECT count(*)::int FROM catalog_videos WHERE status='published' AND (legacy_thumbnail_url IS NULL OR btrim(legacy_thumbnail_url)='')) AS videos_missing_thumbnail`),
      this.db.query(`SELECT id,full_name,country,status,created_at,updated_at
        FROM performer_applications
        WHERE status IN ('submitted','under_review')
        ORDER BY created_at ASC,id ASC LIMIT 20`),
      this.db.query(`SELECT b.name AS brand, count(v.legacy_id)::int AS published_videos
        FROM catalog_brands b LEFT JOIN catalog_videos v ON v.brand_legacy_id=b.legacy_id AND v.status='published'
        WHERE b.status='active' GROUP BY b.legacy_id,b.name ORDER BY published_videos DESC,b.name ASC`)
    ]);
    return {
      metrics: metrics.rows[0],
      review_queue: candidates.rows,
      catalogue_by_brand: catalogue.rows,
      sources: {
        catalogue: 'postgresql',
        recruiting: 'postgresql',
        external_analytics: 'not_migrated'
      }
    };
  }
}
