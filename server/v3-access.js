import { HttpError } from './errors.js';

export const purchaseAccessPredicate = `e.status='active' AND e.revoked_at IS NULL AND e.starts_at<=now() AND (e.ends_at IS NULL OR e.ends_at>now())`;
export class V3AccessService {
  constructor(db, blob) { this.db = db; this.blob = blob; }
  async customer(user) {
    if (!user?.id) throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to your FLESHLAB account.');
    if (user.role !== 'customer') throw new HttpError(403, 'CUSTOMER_REQUIRED', 'A customer account is required.');
    const account = await this.db.query("SELECT id FROM app_users WHERE id=$1 AND account_status='active'", [user.id]);
    if (!account.rowCount) throw new HttpError(403, 'ACCOUNT_NOT_ACTIVE', 'Your account is not active.');
  }
  async allowed(user, videoId, download = false) {
    await this.customer(user);
    const result = await this.db.query(`SELECT 1 FROM v3_commerce_content_entitlements e WHERE e.user_id=$1 AND e.video_legacy_id=$2 AND ${purchaseAccessPredicate} ${download ? 'AND e.download_allowed=true' : ''}
      ${download ? '' : `UNION ALL SELECT 1 FROM v3_commerce_subscriptions s WHERE s.user_id=$1 AND s.status='active' AND s.current_period_start<=now() AND s.current_period_end>now() AND EXISTS (SELECT 1 FROM v3_commerce_plan_offers o WHERE o.plan_id=s.plan_id AND o.purchase_type='subscription' AND o.active=true AND (o.product_id=$2 OR o.product_id IS NULL OR o.product_id=''))`} LIMIT 1`, [user.id, String(videoId)]);
    return Boolean(result.rowCount);
  }
  async media(user, videoId, download = false) {
    if (!await this.allowed(user, videoId, download)) throw new HttpError(403, 'VIDEO_ACCESS_REQUIRED', 'This account does not have the requested access.');
    const asset = await this.db.query(`SELECT a.storage_reference,a.mime_type,a.byte_size FROM v3_media_assets a JOIN v3_media_asset_links l ON l.asset_id=a.id JOIN catalog_videos v ON v.legacy_id=l.video_legacy_id WHERE l.video_legacy_id=$1 AND l.is_primary=true AND a.asset_type='source' AND a.visibility='private' AND a.processing_state='ready' AND v.v3_lifecycle='published' AND v.status='published' LIMIT 1`, [String(videoId)]);
    if (!this.blob || !asset.rowCount || !asset.rows[0].storage_reference) throw new HttpError(503, 'PRIVATE_PLAYBACK_UNAVAILABLE', 'This video is temporarily unavailable.');
    const a = asset.rows[0]; const media = await this.blob.downloadStream(a.storage_reference);
    return { ...media, content_type: a.mime_type || 'video/mp4', contentLength: Number(a.byte_size || media.contentLength || 0), file_name: 'fleshlab-video.mp4', attachment: download };
  }
  async library(user) {
    await this.customer(user);
    const result = await this.db.query(`SELECT v.legacy_id id,v.title,v.slug,bool_or(e.download_allowed) download_allowed FROM v3_commerce_content_entitlements e JOIN catalog_videos v ON v.legacy_id=e.video_legacy_id WHERE e.user_id=$1 AND ${purchaseAccessPredicate} AND v.v3_lifecycle='published' AND v.status='published' GROUP BY v.legacy_id ORDER BY v.title`, [user.id]);
    return { records: result.rows.map(v => ({ id: v.id, title: v.title, href: '/v3/videos/' + encodeURIComponent(v.slug), playback_url: '/api/v3/public/videos/' + encodeURIComponent(v.id) + '/playback', download_url: v.download_allowed ? '/api/v3/commerce/videos/' + encodeURIComponent(v.id) + '/download' : null })) };
  }
}
