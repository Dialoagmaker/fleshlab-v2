import { createHash, randomUUID } from 'node:crypto';
import { loyalFansPurchaseDestination } from './loyalfans-purchase-evidence.js';
import { matchesVerifiedBuyer } from './loyalfans-ppv-protocol.js';
import { parseLoyalFansReactionNotification } from './loyalfans-reaction-notifications.js';
import { HttpError } from './errors.js';

const PROVIDER = 'loyalfans';
const VERIFICATION_METHOD = 'reaction_like';
const TARGET_BUSY = new HttpError(409, 'VERIFICATION_TARGET_BUSY', 'Account verification is busy. Try again shortly.');
const TARGET_UNAVAILABLE = new HttpError(503, 'VERIFICATION_UNAVAILABLE', 'Account verification is temporarily unavailable.');
const GENERIC_VERIFY_MESSAGE = 'Unable to verify right now. Try again later.';

const publicStatus = status => status === 'pending_verification' ? 'pending' : status || 'unlinked';
const observationFingerprint = observation => createHash('sha256')
  .update(observation.provider_notification_id
    ? `${PROVIDER}:notification:${observation.provider_notification_id}`
    : `${PROVIDER}:${observation.actor_uid}:${observation.target_uid}:${observation.reaction}:${observation.observed_at}`)
  .digest('hex');

function statusResult(status, fields = {}) {
  return { status: publicStatus(status), ...fields };
}

function waitingResult(verificationStatus = 'waiting') {
  return statusResult('pending', {
    verification_status: verificationStatus,
    message: verificationStatus === 'waiting'
      ? 'Waiting for verification. Like the selected post, then try again.'
      : GENERIC_VERIFY_MESSAGE
  });
}

function validDate(value) {
  const milliseconds = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function safeTarget(row) {
  try { return loyalFansPurchaseDestination(row.destination_url); }
  catch { return null; }
}

export class V3BuyerLinkRepository {
  constructor(db) { this.db = db; }

  async find(provider, userId) {
    return (await this.db.query(
      'SELECT user_id,provider_member_uid,status,proof_reference,verification_method,verified_at,revoked_at FROM v3_commerce_buyer_links WHERE provider=$1 AND user_id=$2',
      [provider, userId]
    )).rows[0] || { user_id: userId, status: 'unlinked' };
  }

  // Kept for existing internal callers. This never accepts a provider UID and
  // cannot mark a buyer link verified.
  async requestVerification(provider, userId) {
    await this.db.query(`INSERT INTO v3_commerce_buyer_links(provider,user_id,status)
      VALUES($1,$2,'pending_verification')
      ON CONFLICT(provider,user_id) DO UPDATE SET status=CASE
        WHEN v3_commerce_buyer_links.status='verified' THEN 'verified'
        ELSE 'pending_verification' END`, [provider, userId]);
  }
}

export class V3BuyerLinkService {
  constructor(db, registry, access, { now = () => new Date() } = {}) {
    Object.assign(this, { db, registry, access, now });
  }

  async start(user) {
    await this.access.customer(user);
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      // Serialize target reservation and expiry cleanup across customer starts.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${PROVIDER}:buyer-verification`]);
      await client.query(`UPDATE v3_commerce_buyer_link_challenges
        SET status='expired', consumed_at=COALESCE(consumed_at,now())
        WHERE provider=$1 AND status='pending' AND expires_at<=now()`, [PROVIDER]);
      await client.query(`UPDATE v3_commerce_buyer_links bl SET status='expired'
        WHERE bl.provider=$1 AND bl.status='pending_verification'
        AND NOT EXISTS (SELECT 1 FROM v3_commerce_buyer_link_challenges c
          WHERE c.provider=bl.provider AND c.user_id=bl.user_id AND c.status='pending' AND c.expires_at>now())`, [PROVIDER]);

      const link = (await client.query(`SELECT user_id,provider_member_uid,status,verified_at
        FROM v3_commerce_buyer_links WHERE provider=$1 AND user_id=$2 FOR UPDATE`, [PROVIDER, user.id])).rows[0];
      if (link?.status === 'verified') {
        await client.query('COMMIT');
        return statusResult('verified', { verified_at: link.verified_at });
      }

      const current = (await client.query(`SELECT id,created_at,expires_at,target_uid,destination_url
        FROM v3_commerce_buyer_link_challenges
        WHERE provider=$1 AND user_id=$2 AND status='pending' AND expires_at>now()
        ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [PROVIDER, user.id])).rows[0];
      if (current) {
        const destination = safeTarget({ destination_url: current.destination_url });
        if (!destination) throw TARGET_UNAVAILABLE;
        await client.query('COMMIT');
        return this.startProjection(current, destination);
      }

      const targets = (await client.query(`SELECT t.target_uid,t.destination_url
        FROM v3_commerce_buyer_verification_targets t
        WHERE t.provider=$1 AND t.active=true AND t.destination_url IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM v3_commerce_buyer_link_challenges c
            WHERE c.provider=t.provider AND c.target_uid=t.target_uid AND c.status='pending' AND c.expires_at>now())
        ORDER BY t.created_at,t.target_uid FOR UPDATE OF t SKIP LOCKED LIMIT 32`, [PROVIDER])).rows;
      const target = targets.find(row => safeTarget(row));
      if (!target) {
        const configured = (await client.query(`SELECT 1 FROM v3_commerce_buyer_verification_targets
          WHERE provider=$1 AND active=true LIMIT 1`, [PROVIDER])).rowCount > 0;
        if (configured) throw TARGET_BUSY;
        throw TARGET_UNAVAILABLE;
      }

      await client.query(`INSERT INTO v3_commerce_buyer_links(provider,user_id,status)
        VALUES($1,$2,'pending_verification')
        ON CONFLICT(provider,user_id) DO UPDATE SET
          status=CASE WHEN v3_commerce_buyer_links.status='verified' THEN 'verified' ELSE 'pending_verification' END,
          revoked_at=NULL`, [PROVIDER, user.id]);
      const challenge = (await client.query(`INSERT INTO v3_commerce_buyer_link_challenges
        (id,provider,user_id,target_uid,destination_url,status,created_at,expires_at)
        VALUES($1,$2,$3,$4,$5,'pending',now(),now()+interval '10 minutes')
        RETURNING id,created_at,expires_at,target_uid,destination_url`,
      [randomUUID(), PROVIDER, user.id, target.target_uid, safeTarget(target)])).rows[0];
      await client.query('COMMIT');
      return this.startProjection(challenge, safeTarget(challenge));
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      if (error?.code === '23505') throw TARGET_BUSY;
      throw error;
    } finally { client.release(); }
  }

  startProjection(challenge, destination) {
    return statusResult('pending', {
      expires_at: new Date(challenge.expires_at).toISOString(),
      destination_url: destination,
      instructions: [
        'Open the selected FLESHLAB Studios post on LoyalFans.',
        'Click Like on that post.',
        'Return to FLESHLAB and click Verify.'
      ]
    });
  }

  async verify(user) {
    await this.access.customer(user);
    const challenge = (await this.db.query(`SELECT id,user_id,status,target_uid,created_at,expires_at
      FROM v3_commerce_buyer_link_challenges
      WHERE provider=$1 AND user_id=$2 AND status='pending'
      ORDER BY created_at DESC LIMIT 1`, [PROVIDER, user.id])).rows[0];
    if (!challenge) {
      const link = await new V3BuyerLinkRepository(this.db).find(PROVIDER, user.id);
      return statusResult(link.status);
    }

    const nowMs = validDate(this.now());
    const createdMs = validDate(challenge.created_at);
    const expiresMs = validDate(challenge.expires_at);
    if (nowMs === null || createdMs === null || expiresMs === null) return waitingResult('unable_to_verify');
    if (nowMs >= expiresMs) return this.expire(user.id, challenge.id);

    const adapter = this.registry.get(PROVIDER);
    if (adapter.capabilities?.reactionNotificationLookup !== true || typeof adapter.observeReactionNotifications !== 'function') {
      return waitingResult('unable_to_verify');
    }

    let notifications;
    try {
      notifications = await adapter.observeReactionNotifications({
        targetUid: challenge.target_uid,
        createdAt: new Date(createdMs).toISOString(),
        expiresAt: new Date(expiresMs).toISOString()
      });
    } catch {
      return waitingResult('unable_to_verify');
    }
    if (!Array.isArray(notifications)) return waitingResult('unable_to_verify');

    const unique = new Map();
    let conflictingDuplicate = false;
    for (const raw of notifications) {
      const observation = parseLoyalFansReactionNotification(raw, challenge.target_uid);
      if (!observation) continue;
      const observedMs = validDate(observation.observed_at);
      if (observedMs === null || observedMs < createdMs || observedMs > expiresMs || observedMs > nowMs) continue;
      const fingerprint = observationFingerprint(observation);
      const prior = unique.get(fingerprint);
      if (prior && (prior.actor_uid !== observation.actor_uid || prior.target_uid !== observation.target_uid || prior.observed_at !== observation.observed_at)) {
        conflictingDuplicate = true;
      } else unique.set(fingerprint, { ...observation, fingerprint });
    }
    const actors = new Set([...unique.values()].map(item => item.actor_uid));
    if (conflictingDuplicate || actors.size > 1) return waitingResult('unable_to_verify');
    if (unique.size === 0) return waitingResult('waiting');
    const evidence = [...unique.values()].sort((a, b) => a.observed_at.localeCompare(b.observed_at))[0];
    return this.consumeEvidence(user.id, challenge, evidence);
  }

  async expire(userId, challengeId) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const current = (await client.query(`SELECT id,status,expires_at FROM v3_commerce_buyer_link_challenges
        WHERE id=$1 AND provider=$2 AND user_id=$3 FOR UPDATE`, [challengeId, PROVIDER, userId])).rows[0];
      if (!current) { await client.query('COMMIT'); return statusResult('unlinked'); }
      if (current.status === 'consumed') { await client.query('COMMIT'); return statusResult('verified'); }
      if (current.status === 'pending' && validDate(this.now()) >= validDate(current.expires_at)) {
        await client.query(`UPDATE v3_commerce_buyer_link_challenges SET status='expired',consumed_at=now() WHERE id=$1`, [challengeId]);
        await client.query(`UPDATE v3_commerce_buyer_links SET status='expired'
          WHERE provider=$1 AND user_id=$2 AND status='pending_verification'`, [PROVIDER, userId]);
        await client.query('COMMIT');
        return statusResult('expired');
      }
      await client.query('COMMIT');
      return statusResult(current.status === 'pending' ? 'pending_verification' : current.status);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  }

  async consumeEvidence(userId, fetchedChallenge, observation) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const challenge = (await client.query(`SELECT id,status,target_uid,created_at,expires_at
        FROM v3_commerce_buyer_link_challenges
        WHERE id=$1 AND provider=$2 AND user_id=$3 FOR UPDATE`, [fetchedChallenge.id, PROVIDER, userId])).rows[0];
      if (!challenge) { await client.query('COMMIT'); return statusResult('unlinked'); }
      if (challenge.status === 'consumed') { await client.query('COMMIT'); return statusResult('verified'); }
      if (challenge.status !== 'pending') { await client.query('COMMIT'); return statusResult(challenge.status); }
      const nowMs = validDate(this.now());
      if (nowMs === null || nowMs >= validDate(challenge.expires_at)) {
        await client.query(`UPDATE v3_commerce_buyer_link_challenges SET status='expired',consumed_at=now() WHERE id=$1`, [challenge.id]);
        await client.query(`UPDATE v3_commerce_buyer_links SET status='expired'
          WHERE provider=$1 AND user_id=$2 AND status='pending_verification'`, [PROVIDER, userId]);
        await client.query('COMMIT');
        return statusResult('expired');
      }
      if (challenge.target_uid !== observation.target_uid || validDate(observation.observed_at) < validDate(challenge.created_at)) {
        await client.query('COMMIT');
        return waitingResult('waiting');
      }

      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${PROVIDER}:${observation.actor_uid}`]);
      const evidence = (await client.query(`INSERT INTO v3_commerce_buyer_link_evidence
        (challenge_id,provider,provider_member_uid,target_uid,reaction,observed_at,provider_notification_id,evidence_fingerprint)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT DO NOTHING RETURNING id`, [challenge.id, PROVIDER, observation.actor_uid, observation.target_uid,
        observation.reaction, observation.observed_at, observation.provider_notification_id, observation.fingerprint])).rows[0];
      if (!evidence) { await client.query('COMMIT'); return waitingResult('unable_to_verify'); }

      const link = (await client.query(`SELECT status FROM v3_commerce_buyer_links
        WHERE provider=$1 AND user_id=$2 FOR UPDATE`, [PROVIDER, userId])).rows[0];
      if (!link || link.status !== 'pending_verification') {
        await client.query('ROLLBACK');
        return link?.status === 'verified' ? statusResult('verified') : waitingResult('unable_to_verify');
      }
      const metadata = {
        method: VERIFICATION_METHOD,
        target_uid: observation.target_uid,
        reaction: observation.reaction,
        observed_at: observation.observed_at,
        provider_notification_id: observation.provider_notification_id
      };
      await client.query(`UPDATE v3_commerce_buyer_links SET status='verified',provider_member_uid=$3,
        proof_reference=$4,verification_method=$5,evidence_metadata=$6::jsonb,verified_at=now(),revoked_at=NULL
        WHERE provider=$1 AND user_id=$2 AND status='pending_verification'`,
      [PROVIDER, userId, observation.actor_uid, evidence.id, VERIFICATION_METHOD, JSON.stringify(metadata)]);
      await client.query(`UPDATE v3_commerce_buyer_link_challenges SET status='consumed',consumed_at=now(),verified_at=now()
        WHERE id=$1 AND status='pending'`, [challenge.id]);
      await client.query('COMMIT');
      return statusResult('verified', { verified_at: new Date(this.now()).toISOString() });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      // The partial unique index makes one provider UID belong to one FLESHLAB
      // customer even when two verification transactions race.
      if (error?.code === '23505') return waitingResult('unable_to_verify');
      throw error;
    } finally { client.release(); }
  }
}

export { matchesVerifiedBuyer };
