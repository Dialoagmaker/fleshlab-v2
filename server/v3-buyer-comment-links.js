import { randomBytes, randomUUID } from 'node:crypto';
import { HttpError } from './errors.js';
import { parseLoyalFansCommentProof } from './loyalfans-comment-proof.js';

const PROVIDER = 'loyalfans';
const UID = /^[A-Za-z0-9_-]{16,255}$/;
const pending = (verification_status = 'waiting') => ({ status: 'pending', verification_status });

export class V3BuyerCommentLinkService {
  constructor(db, registry, access, { now = () => new Date() } = {}) {
    Object.assign(this, { db, registry, access, now });
  }

  async start(user, orderId) {
    await this.access.customer(user);
    const adapter = this.registry.get(PROVIDER);
    if (adapter.capabilities?.commentLookup !== true || typeof adapter.observeComments !== 'function') {
      throw new HttpError(503, 'VERIFICATION_UNAVAILABLE', 'Account verification is temporarily unavailable.');
    }
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${PROVIDER}:comment:${user.id}`]);
      await client.query(`UPDATE v3_commerce_buyer_comment_challenges SET status='expired'
        WHERE provider=$1 AND user_id=$2 AND status='pending' AND expires_at<=now()`, [PROVIDER, user.id]);
      const order = (await client.query(`SELECT id,user_id,status,processor,external_content_uid
        FROM v3_commerce_orders WHERE id=$1 AND user_id=$2 FOR UPDATE`, [orderId, user.id])).rows[0];
      if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order was not found.');
      if (order.status !== 'pending' || order.processor !== PROVIDER || !UID.test(order.external_content_uid)) {
        throw new HttpError(409, 'VERIFICATION_UNAVAILABLE', 'Account verification is unavailable for this order.');
      }
      const existingLink = (await client.query(`SELECT status,verified_at FROM v3_commerce_buyer_links
        WHERE provider=$1 AND user_id=$2 FOR UPDATE`, [PROVIDER, user.id])).rows[0];
      if (existingLink?.status === 'verified') {
        await client.query('COMMIT');
        return { status: 'verified', verified_at: existingLink.verified_at };
      }
      const existing = (await client.query(`SELECT id,order_id,post_uid,challenge_code,expires_at
        FROM v3_commerce_buyer_comment_challenges
        WHERE provider=$1 AND user_id=$2 AND status='pending' AND expires_at>now() FOR UPDATE`, [PROVIDER, user.id])).rows[0];
      if (existing) {
        if (existing.order_id !== order.id || existing.post_uid !== order.external_content_uid) {
          throw new HttpError(409, 'VERIFICATION_ALREADY_PENDING', 'Another verification is pending.');
        }
        await client.query('COMMIT');
        return this.startProjection(existing);
      }
      await client.query(`INSERT INTO v3_commerce_buyer_links(provider,user_id,status)
        VALUES($1,$2,'pending_verification') ON CONFLICT(provider,user_id) DO UPDATE
        SET status='pending_verification',revoked_at=NULL`, [PROVIDER, user.id]);
      const challenge = (await client.query(`INSERT INTO v3_commerce_buyer_comment_challenges
        (id,provider,user_id,order_id,post_uid,challenge_code,status,created_at,expires_at)
        VALUES($1,$2,$3,$4,$5,$6,'pending',now(),now()+interval '10 minutes')
        RETURNING id,order_id,post_uid,challenge_code,expires_at`,
      [randomUUID(), PROVIDER, user.id, order.id, order.external_content_uid, `FL-LF-${randomBytes(16).toString('hex').toUpperCase()}`])).rows[0];
      await client.query('COMMIT');
      return this.startProjection(challenge);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  }

  startProjection(challenge) {
    return { status: 'pending', challenge: challenge.challenge_code,
      expires_at: new Date(challenge.expires_at).toISOString(),
      instructions: 'Post the exact challenge as a comment on the LoyalFans post for this order, then return and verify.' };
  }

  async verify(user) {
    await this.access.customer(user);
    const challenge = (await this.db.query(`SELECT id,order_id,post_uid,challenge_code,created_at,expires_at
      FROM v3_commerce_buyer_comment_challenges
      WHERE provider=$1 AND user_id=$2 AND status='pending' ORDER BY created_at DESC LIMIT 1`, [PROVIDER, user.id])).rows[0];
    if (!challenge) {
      const link = (await this.db.query(`SELECT status FROM v3_commerce_buyer_links
        WHERE provider=$1 AND user_id=$2`, [PROVIDER, user.id])).rows[0];
      return { status: link?.status === 'verified' ? 'verified' : 'unlinked' };
    }
    const now = new Date(this.now()).getTime();
    const created = new Date(challenge.created_at).getTime();
    const expires = new Date(challenge.expires_at).getTime();
    if (![now, created, expires].every(Number.isFinite)) return pending('unable_to_verify');
    if (now >= expires) return this.expire(user.id, challenge.id);
    const adapter = this.registry.get(PROVIDER);
    if (adapter.capabilities?.commentLookup !== true || typeof adapter.observeComments !== 'function') return pending('unable_to_verify');
    let page;
    try {
      page = await adapter.observeComments({ postUid: challenge.post_uid,
        createdAt: new Date(created).toISOString(), expiresAt: new Date(expires).toISOString() });
    } catch(error) { return pending(error?.code==='LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED'
      ?'continuation_contract_required':'unable_to_verify'); }
    // A partial page could hide a second actor using the same challenge.
    // The adapter must attest both the authenticated source and exact scope.
    if (page?.authority !== 'creator_authenticated' || page.scope_post_uid !== challenge.post_uid ||
        page.complete !== true || !Array.isArray(page.comments)) return pending('unable_to_verify');
    const candidates = new Map();
    for (const raw of page.comments) {
      const proof = parseLoyalFansCommentProof(raw, challenge.post_uid, challenge.challenge_code, page.scope_post_uid,
        {requireParentUid:page.proof_requires_parent_uid===true});
      if (!proof) continue;
      const timestamp = new Date(proof.created_at).getTime();
      if (timestamp < created || timestamp > now || timestamp >= expires) continue;
      const prior = candidates.get(proof.comment_uid);
      if (prior && prior.provider_member_uid !== proof.provider_member_uid) return pending('unable_to_verify');
      candidates.set(proof.comment_uid, proof);
    }
    if (candidates.size === 0) return pending();
    if (candidates.size !== 1) return pending('unable_to_verify');
    return this.consume(user.id, challenge, [...candidates.values()][0]);
  }

  async expire(userId, challengeId) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const row = (await client.query(`SELECT status,expires_at FROM v3_commerce_buyer_comment_challenges
        WHERE id=$1 AND provider=$2 AND user_id=$3 FOR UPDATE`, [challengeId, PROVIDER, userId])).rows[0];
      const expired = row?.status === 'pending' && new Date(this.now()).getTime() >= new Date(row.expires_at).getTime();
      if (expired) {
        await client.query(`UPDATE v3_commerce_buyer_comment_challenges SET status='expired' WHERE id=$1`, [challengeId]);
        await client.query(`UPDATE v3_commerce_buyer_links SET status='expired'
          WHERE provider=$1 AND user_id=$2 AND status='pending_verification'`, [PROVIDER, userId]);
      }
      await client.query('COMMIT');
      return { status: expired ? 'expired' : row?.status === 'pending' ? 'pending' : row?.status === 'consumed' ? 'verified' : 'unlinked' };
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }

  async consume(userId, fetched, proof) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const challenge = (await client.query(`SELECT id,status,post_uid,challenge_code,created_at,expires_at
        FROM v3_commerce_buyer_comment_challenges
        WHERE id=$1 AND provider=$2 AND user_id=$3 FOR UPDATE`, [fetched.id, PROVIDER, userId])).rows[0];
      if (challenge?.status === 'consumed') { await client.query('COMMIT'); return { status: 'verified' }; }
      if (challenge?.status !== 'pending') { await client.query('COMMIT'); return { status: 'unlinked' }; }
      const time = new Date(proof.created_at).getTime();
      const now = new Date(this.now()).getTime();
      if (challenge.post_uid !== proof.post_uid || challenge.challenge_code !== fetched.challenge_code ||
          time < new Date(challenge.created_at).getTime() || time >= new Date(challenge.expires_at).getTime() ||
          now >= new Date(challenge.expires_at).getTime() || time > now) {
        await client.query('COMMIT'); return pending('unable_to_verify');
      }
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${PROVIDER}:${proof.provider_member_uid}`]);
      const link = (await client.query(`SELECT status FROM v3_commerce_buyer_links
        WHERE provider=$1 AND user_id=$2 FOR UPDATE`, [PROVIDER, userId])).rows[0];
      if (link?.status !== 'pending_verification') { await client.query('COMMIT'); return pending('unable_to_verify'); }
      await client.query(`UPDATE v3_commerce_buyer_comment_challenges
        SET status='consumed',consumed_at=now(),comment_uid=$2,provider_member_uid=$3
        WHERE id=$1 AND status='pending'`, [challenge.id, proof.comment_uid, proof.provider_member_uid]);
      await client.query(`UPDATE v3_commerce_buyer_links
        SET status='verified',provider_member_uid=$3,proof_reference=$4,
          verification_method='comment_challenge',evidence_metadata=$5::jsonb,verified_at=now(),revoked_at=NULL
        WHERE provider=$1 AND user_id=$2 AND status='pending_verification'`,
      [PROVIDER, userId, proof.provider_member_uid, challenge.id,
        JSON.stringify({ comment_uid: proof.comment_uid, post_uid: proof.post_uid, observed_at: proof.created_at })]);
      await client.query('COMMIT');
      return { status: 'verified', verified_at: new Date(this.now()).toISOString() };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      if (error?.code === '23505') return pending('unable_to_verify');
      throw error;
    } finally { client.release(); }
  }
}
