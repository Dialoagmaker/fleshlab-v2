import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLoyalFansReactionNotification } from './loyalfans-reaction-notifications.js';
import { ACTOR_UID, CAPTURED_LIKE_AT, TARGET_UID, capturedStyleNotification } from './loyalfans-reaction-fixture.js';

test('parses captured-style Like notification and agrees on actor UIDs', () => {
  const parsed = parseLoyalFansReactionNotification(capturedStyleNotification(), TARGET_UID);
  assert.deepEqual(parsed, {
    provider: 'loyalfans', actor_uid: ACTOR_UID, target_uid: TARGET_UID,
    reaction: 'like', observed_at: CAPTURED_LIKE_AT,
    provider_notification_id: 'notification-test-001'
  });
});

test('rejects mismatching duplicated actor UID locations', () => {
  const notification = capturedStyleNotification({ object: {
    reaction: 'like', parent: { uid: TARGET_UID }, user: { uid: 'different-actor-uid-00000001' }
  } });
  assert.equal(parseLoyalFansReactionNotification(notification, TARGET_UID), null);
});

test('rejects wrong target UID without normalization', () => {
  const notification = capturedStyleNotification({ object: {
    reaction: 'like', parent: { uid: `${TARGET_UID}=` }, user: { uid: ACTOR_UID }
  } });
  assert.equal(parseLoyalFansReactionNotification(notification, TARGET_UID), null);
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification(), TARGET_UID.replaceAll('-', '_')), null);
});

test('rejects unlike, wrong notification type, missing or malformed actors', () => {
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({ object: {
    reaction: 'unlike', parent: { uid: TARGET_UID }, user: { uid: ACTOR_UID }
  } }), TARGET_UID), null);
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({ type: 'comment' }), TARGET_UID), null);
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({ from_user: {} }), TARGET_UID), null);
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({ from_user: { uid: 'bad uid' } }), TARGET_UID), null);
});

test('rejects malformed target, inconsistent top parent, and missing or invalid timestamp', () => {
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({ object: {
    reaction: 'like', parent: { uid: 'bad uid' }, user: { uid: ACTOR_UID }
  } }), TARGET_UID), null);
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({ top_parent: { uid: 'different-target-uid-00000001' } }), TARGET_UID), null);
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({ created_at: undefined }), TARGET_UID), null);
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({ created_at: 'not-a-time' }), TARGET_UID), null);
});

test('does not use labels, slug, or username when UID evidence is missing', () => {
  assert.equal(parseLoyalFansReactionNotification(capturedStyleNotification({
    from_user: { name: 'member', slug: 'member' },
    object: { reaction: 'like', parent: { uid: TARGET_UID }, user: { display_name: 'member' } }
  }), TARGET_UID), null);
});
