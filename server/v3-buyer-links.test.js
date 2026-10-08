import test from 'node:test';
import assert from 'node:assert/strict';
import { V3BuyerLinkService, V3BuyerLinkRepository } from './v3-buyer-links.js';
import { matchesVerifiedBuyer } from './loyalfans-ppv-protocol.js';
import { ACTOR_UID, TARGET_UID, capturedStyleNotification } from './loyalfans-reaction-fixture.js';

const DESTINATIONS = [
  'https://www.loyalfans.com/fleshlabstudios/video/verification-post-a',
  'https://www.loyalfans.com/fleshlabstudios/video/verification-post-b',
  'https://www.loyalfans.com/fleshlabstudios/video/verification-post-c'
];
const INITIAL_TIME = new Date('2026-10-06T11:59:00.000Z');

function clone(value) { return structuredClone(value); }

function harness({ targetCount = 1, adapterEnabled = true, adapterThrows = false, notifications = [] } = {}) {
  const state = {
    now: new Date(INITIAL_TIME),
    targets: Array.from({ length: targetCount }, (_, index) => ({
      provider: 'loyalfans', target_uid: index === 0 ? TARGET_UID : `target-uid-${String(index).padStart(16, '0')}`,
      destination_url: DESTINATIONS[index % DESTINATIONS.length], active: true
    })),
    links: new Map(), challenges: [], evidence: [],
    grants: []
  };
  let transactionTail = Promise.resolve();
  const db = {
    state,
    async query(sql, values = []) {
      if (sql.includes('FROM v3_commerce_buyer_link_challenges') && sql.includes("status='pending'")) {
        const row = state.challenges.filter(challenge => challenge.user_id === values[1] && challenge.status === 'pending')
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
        return { rows: row ? [clone(row)] : [], rowCount: row ? 1 : 0 };
      }
      if (sql.includes('FROM v3_commerce_buyer_links')) {
        const row = state.links.get(values[1]);
        return { rows: row ? [clone(row)] : [], rowCount: row ? 1 : 0 };
      }
      throw Error(`Unexpected db query: ${sql}`);
    },
    async connect() {
      const prior = transactionTail;
      let unlock;
      transactionTail = new Promise(resolve => { unlock = resolve; });
      await prior;
      let snapshot;
      return {
        release: unlock,
        async query(sql, values = []) {
          const nowIso = state.now.toISOString();
          if (sql === 'BEGIN') { snapshot = clone({ targets: state.targets, links: [...state.links], challenges: state.challenges, evidence: state.evidence, grants: state.grants }); return { rows: [] }; }
          if (sql === 'ROLLBACK') {
            state.targets = snapshot.targets; state.links = new Map(snapshot.links);
            state.challenges = snapshot.challenges; state.evidence = snapshot.evidence; state.grants = snapshot.grants;
            return { rows: [] };
          }
          if (sql === 'COMMIT' || sql.includes('pg_advisory_xact_lock')) return { rows: [] };
          if (sql.includes("SET status='expired'") && sql.includes('v3_commerce_buyer_link_challenges')) {
            for (const challenge of state.challenges) if (challenge.status === 'pending' && Date.parse(challenge.expires_at) <= state.now.getTime()) {
              challenge.status = 'expired'; challenge.consumed_at = nowIso;
            }
            return { rows: [] };
          }
          if (sql.includes('UPDATE v3_commerce_buyer_links bl SET status=\'expired\'')) {
            for (const [userId, link] of state.links) if (link.status === 'pending_verification' && !state.challenges.some(challenge => challenge.user_id === userId && challenge.status === 'pending' && Date.parse(challenge.expires_at) > state.now.getTime())) link.status = 'expired';
            return { rows: [] };
          }
          if (sql.includes('SELECT user_id,provider_member_uid,status,verified_at')) {
            const row = state.links.get(values[1]); return { rows: row ? [clone(row)] : [] };
          }
          if (sql.includes('SELECT id,created_at,expires_at,target_uid,destination_url') && sql.includes('v3_commerce_buyer_link_challenges')) {
            const row = state.challenges.filter(challenge => challenge.user_id === values[1] && challenge.status === 'pending' && Date.parse(challenge.expires_at) > state.now.getTime()).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
            return { rows: row ? [clone(row)] : [] };
          }
          if (sql.includes('FROM v3_commerce_buyer_verification_targets t')) {
            const available = state.targets.filter(target => target.active && target.destination_url && !state.challenges.some(challenge => challenge.target_uid === target.target_uid && challenge.status === 'pending' && Date.parse(challenge.expires_at) > state.now.getTime()));
            return { rows: clone(available) };
          }
          if (sql.includes('FROM v3_commerce_buyer_verification_targets')) {
            return { rows: state.targets.some(target => target.active) ? [{ '?column?': 1 }] : [], rowCount: state.targets.some(target => target.active) ? 1 : 0 };
          }
          if (sql.includes('INSERT INTO v3_commerce_buyer_links')) {
            const userId = values[1];
            const existing = state.links.get(userId);
            if (!existing || existing.status !== 'verified') state.links.set(userId, { user_id: userId, status: 'pending_verification', provider_member_uid: existing?.provider_member_uid || null });
            return { rows: [] };
          }
          if (sql.includes('INSERT INTO v3_commerce_buyer_link_challenges')) {
            const challenge = { id: values[0], provider: values[1], user_id: values[2], target_uid: values[3], destination_url: values[4], status: 'pending', created_at: nowIso, expires_at: new Date(state.now.getTime() + 10 * 60_000).toISOString() };
            state.challenges.push(challenge); return { rows: [clone(challenge)] };
          }
          if (sql.includes('SELECT id,status,expires_at FROM v3_commerce_buyer_link_challenges')) {
            const row = state.challenges.find(challenge => challenge.id === values[0] && challenge.user_id === values[2]); return { rows: row ? [clone(row)] : [] };
          }
          if (sql.includes('SELECT id,status,target_uid,created_at,expires_at')) {
            const row = state.challenges.find(challenge => challenge.id === values[0] && challenge.user_id === values[2]); return { rows: row ? [clone(row)] : [] };
          }
          if (sql.includes('INSERT INTO v3_commerce_buyer_link_evidence')) {
            if (state.evidence.some(item => item.fingerprint === values[7])) return { rows: [] };
            const row = { id: `evidence-${state.evidence.length + 1}`, challenge_id: values[0], actor_uid: values[2], target_uid: values[3], reaction: values[4], observed_at: values[5], notification_id: values[6], fingerprint: values[7] };
            state.evidence.push(row); return { rows: [{ id: row.id }] };
          }
          if (sql.includes('SELECT status FROM v3_commerce_buyer_links')) {
            const row = state.links.get(values[1]); return { rows: row ? [{ status: row.status }] : [] };
          }
          if (sql.includes("UPDATE v3_commerce_buyer_links SET status='verified'")) {
            const [provider, userId, memberUid, proofReference, verificationMethod, metadata] = values;
            if ([...state.links.entries()].some(([id, link]) => id !== userId && link.status === 'verified' && link.provider_member_uid === memberUid)) {
              const error = Error('unique buyer UID'); error.code = '23505'; throw error;
            }
            const link = state.links.get(userId);
            if (link) Object.assign(link, { provider, status: 'verified', provider_member_uid: memberUid, proof_reference: proofReference, verification_method: verificationMethod, evidence_metadata: JSON.parse(metadata), verified_at: nowIso, revoked_at: null });
            return { rows: [] };
          }
          if (sql.includes("UPDATE v3_commerce_buyer_link_challenges SET status='consumed'")) {
            const challenge = state.challenges.find(item => item.id === values[0]);
            if (challenge) { challenge.status = 'consumed'; challenge.consumed_at = nowIso; challenge.verified_at = nowIso; }
            return { rows: [] };
          }
          if (sql.includes("UPDATE v3_commerce_buyer_link_challenges SET status='expired'")) {
            const challenge = state.challenges.find(item => item.id === values[0]);
            if (challenge) { challenge.status = 'expired'; challenge.consumed_at = nowIso; }
            return { rows: [] };
          }
          if (sql.includes("UPDATE v3_commerce_buyer_links SET status='expired'")) {
            const link = state.links.get(values[1]); if (link) link.status = 'expired'; return { rows: [] };
          }
          throw Error(`Unexpected transaction query: ${sql}`);
        }
      };
    }
  };
  const adapter = {
    capabilities: { reactionNotificationLookup: adapterEnabled },
    observeReactionNotifications: async () => {
      if (adapterThrows) throw Error('provider unavailable');
      return typeof notifications === 'function' ? notifications() : notifications;
    }
  };
  const service = new V3BuyerLinkService(db, { get: () => adapter }, { customer: async user => { if (!user?.id) throw Error('missing customer'); } }, { now: () => state.now });
  return { db, adapter, service };
}

const user = id => ({ id, role: 'customer' });
function likeNotification({ uid = ACTOR_UID, targetUid = TARGET_UID, time = '2026-10-06T12:00:00.000Z', id = 'notification-test-001' } = {}) {
  const notification = capturedStyleNotification({ created_at: time, id });
  notification.from_user.uid = uid;
  notification.object.parent.uid = targetUid;
  notification.object.user.uid = uid;
  notification.top_parent.uid = targetUid;
  return notification;
}

test('start reserves a server-selected target, returns only safe instructions, and restarting reuses the challenge', async () => {
  const h = harness({ targetCount: 2 });
  const first = await h.service.start(user('buyer-a'));
  const second = await h.service.start(user('buyer-a'), { target_uid: 'browser-chosen-target' });
  assert.equal(first.status, 'pending');
  assert.equal(first.destination_url, DESTINATIONS[0]);
  assert.deepEqual(first.instructions, [
    'Open the selected FLESHLAB Studios post on LoyalFans.',
    'Click Like on that post.',
    'Return to FLESHLAB and click Verify.'
  ]);
  assert.equal(second.destination_url, first.destination_url);
  assert.equal(h.db.state.challenges.length, 1);
  assert.doesNotMatch(JSON.stringify(first), /target_uid|provider_member_uid|notification|actor_uid/);
});

test('two users reserve different pool targets; a single target cannot host concurrent challenges', async () => {
  const h = harness({ targetCount: 2 });
  const [a, b] = await Promise.all([h.service.start(user('buyer-a')), h.service.start(user('buyer-b'))]);
  assert.notEqual(a.destination_url, b.destination_url);
  const oneTarget = harness();
  await oneTarget.service.start(user('buyer-a'));
  await assert.rejects(() => oneTarget.service.start(user('buyer-b')), { code: 'VERIFICATION_TARGET_BUSY' });
});

test('successful verification atomically consumes one Like observation and stores only normalized evidence', async () => {
  const h = harness({ notifications: [] });
  await h.service.start(user('buyer-a'));
  h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
  h.adapter.observeReactionNotifications = async () => [likeNotification()];
  const result = await h.service.verify(user('buyer-a'));
  const link = await new V3BuyerLinkRepository(h.db).find('loyalfans', 'buyer-a');
  assert.equal(result.status, 'verified');
  assert.equal(link.status, 'verified');
  assert.equal(link.provider_member_uid, ACTOR_UID);
  assert.equal(h.db.state.challenges[0].status, 'consumed');
  assert.equal(h.db.state.evidence.length, 1);
  assert.equal(h.db.state.evidence[0].target_uid, TARGET_UID);
  assert.equal(link.verification_method, 'reaction_like');
  assert.deepEqual(h.db.state.grants, []);
});

test('pre-existing Like notification before challenge creation cannot satisfy it', async () => {
  const h = harness({ notifications: [likeNotification({ time: '2026-10-06T11:58:59.000Z' })] });
  await h.service.start(user('buyer-a'));
  h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
  const result = await h.service.verify(user('buyer-a'));
  assert.equal(result.status, 'pending');
  assert.equal(result.verification_status, 'waiting');
  assert.equal(h.db.state.evidence.length, 0);
  assert.equal(h.db.state.links.get('buyer-a').status, 'pending_verification');
});

test('stale, future, and mismatched-target notifications fail closed', async () => {
  for (const notification of [
    likeNotification({ time: '2026-10-06T11:00:00.000Z' }),
    likeNotification({ time: '2026-10-06T12:10:01.000Z' }),
    likeNotification({ targetUid: 'wrong-target-uid-000001', time: '2026-10-06T12:00:01.000Z' })
  ]) {
    const h = harness({ notifications: [notification] });
    await h.service.start(user('buyer-a'));
    h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
    assert.equal((await h.service.verify(user('buyer-a'))).status, 'pending');
    assert.equal(h.db.state.evidence.length, 0);
  }
});

test('duplicate pagination entries count once and replay after consumption cannot relink', async () => {
  const duplicate = likeNotification();
  const h = harness({ targetCount: 2, notifications: [duplicate, clone(duplicate)] });
  await h.service.start(user('buyer-a'));
  h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
  assert.equal((await h.service.verify(user('buyer-a'))).status, 'verified');
  assert.equal(h.db.state.evidence.length, 1);
  h.adapter.observeReactionNotifications = async () => [duplicate];
  assert.equal((await h.service.verify(user('buyer-a'))).status, 'verified');
  h.db.state.now = new Date('2026-10-06T12:01:00.000Z');
  await h.service.start(user('buyer-b'));
  assert.equal((await h.service.verify(user('buyer-b'))).status, 'pending');
  assert.equal(h.db.state.links.get('buyer-b').status, 'pending_verification');
  assert.equal(h.db.state.evidence.length, 1);
});

test('expired challenge expires the pending link and never calls provider retrieval', async () => {
  const h = harness({ adapterThrows: true });
  await h.service.start(user('buyer-a'));
  h.db.state.now = new Date('2026-10-06T12:10:00.001Z');
  assert.equal((await h.service.verify(user('buyer-a'))).status, 'expired');
  assert.equal(h.db.state.links.get('buyer-a').status, 'expired');
  assert.equal(h.db.state.evidence.length, 0);
});

test('provider capability unavailable or provider outage remains verification-pending without raw output', async () => {
  for (const options of [{ adapterEnabled: false }, { adapterThrows: true }]) {
    const h = harness(options);
    await h.service.start(user('buyer-a'));
    h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
    const result = await h.service.verify(user('buyer-a'));
    assert.equal(result.status, 'pending');
    assert.equal(result.verification_status, 'unable_to_verify');
    assert.doesNotMatch(JSON.stringify(result), /from_user|object|uid|cookie|token/);
    assert.equal(h.db.state.links.get('buyer-a').status, 'pending_verification');
  }
});

test('different actors in the same target window are ambiguous and fail closed', async () => {
  const h = harness({ notifications: [likeNotification(), likeNotification({ uid: 'another-member-uid-000001', id: 'notification-test-002' })] });
  await h.service.start(user('buyer-a'));
  h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
  const result = await h.service.verify(user('buyer-a'));
  assert.equal(result.verification_status, 'unable_to_verify');
  assert.equal(h.db.state.evidence.length, 0);
});

test('two simultaneous verification requests consume evidence once', async () => {
  const h = harness({ notifications: [likeNotification()] });
  await h.service.start(user('buyer-a'));
  h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
  const results = await Promise.all([h.service.verify(user('buyer-a')), h.service.verify(user('buyer-a'))]);
  assert.deepEqual(results.map(result => result.status), ['verified', 'verified']);
  assert.equal(h.db.state.evidence.length, 1);
  assert.equal(h.db.state.challenges[0].status, 'consumed');
});

test('one LoyalFans UID cannot bind to two FLESHLAB users, including concurrent attempts', async () => {
  const h = harness({ targetCount: 2 });
  await h.service.start(user('buyer-a'));
  await h.service.start(user('buyer-b'));
  h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
  h.adapter.observeReactionNotifications = async ({ targetUid }) => [likeNotification({ targetUid, id: `notification-for-${targetUid}` })];
  const results = await Promise.all([h.service.verify(user('buyer-a')), h.service.verify(user('buyer-b'))]);
  assert.equal(results.filter(result => result.status === 'verified').length, 1);
  assert.equal([...h.db.state.links.values()].filter(link => link.status === 'verified' && link.provider_member_uid === ACTOR_UID).length, 1);
});

test('unlike does not revoke a verified account link; a later fresh Like can prove a challenge', async () => {
  const h = harness({ notifications: [likeNotification()] });
  await h.service.start(user('buyer-a'));
  h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
  assert.equal((await h.service.verify(user('buyer-a'))).status, 'verified');
  h.adapter.observeReactionNotifications = async () => [];
  assert.equal((await h.service.verify(user('buyer-a'))).status, 'verified');
  assert.equal(h.db.state.links.get('buyer-a').status, 'verified');
});

test('browser supplied actor UID is ignored and cannot create verified state', async () => {
  const h = harness({ adapterEnabled: false });
  await h.service.start(user('buyer-a'));
  const result = await h.service.verify(user('buyer-a'), { actor_uid: ACTOR_UID });
  assert.equal(result.status, 'pending');
  assert.notEqual(h.db.state.links.get('buyer-a').status, 'verified');
});

test('verified link comparison requires exact owner, status, and immutable UID', () => {
  const verified = { user_id: 'buyer-a', status: 'verified', provider_member_uid: ACTOR_UID };
  assert.equal(matchesVerifiedBuyer(verified, 'buyer-a', ACTOR_UID), true);
  for (const status of ['pending_verification', 'expired', 'revoked']) {
    assert.equal(matchesVerifiedBuyer({ ...verified, status }, 'buyer-a', ACTOR_UID), false);
  }
  assert.equal(matchesVerifiedBuyer(verified, 'buyer-b', ACTOR_UID), false);
  assert.equal(matchesVerifiedBuyer(verified, 'buyer-a', `${ACTOR_UID}=`), false);
});

test('fresh verification never grants purchase entitlement by itself', async () => {
  const h = harness({ notifications: [likeNotification()] });
  await h.service.start(user('buyer-a'));
  h.db.state.now = new Date('2026-10-06T12:00:02.000Z');
  assert.equal((await h.service.verify(user('buyer-a'))).status, 'verified');
  assert.deepEqual(h.db.state.grants, []);
});
