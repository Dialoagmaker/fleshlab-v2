import { loyalFansUidPayload } from './loyalfans-ppv-protocol.js';

const uid = value => {
  try { return loyalFansUidPayload(value).uid; }
  catch { return null; }
};

function notificationTime(notification) {
  const fields = ['created_at', 'createdAt', 'timestamp'];
  const values = fields.filter(field => Object.hasOwn(notification, field)).map(field => notification[field]);
  const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!values.length || values.some(value => typeof value !== 'string' || !isoTimestamp.test(value) || !Number.isFinite(Date.parse(value)))) return null;
  const milliseconds = values.map(Date.parse);
  if (milliseconds.some(value => value !== milliseconds[0])) return null;
  return new Date(milliseconds[0]).toISOString();
}

function notificationId(notification) {
  const value = notification.id;
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,255}$/.test(value) ? value : null;
}

/**
 * Strict projection of the captured creator-side LoyalFans reaction shape.
 * No labels, slugs, usernames or browser-submitted data participate in identity.
 */
export function parseLoyalFansReactionNotification(notification, expectedTargetUid) {
  if (!notification || typeof notification !== 'object' || Array.isArray(notification)) return null;
  if (notification.type !== 'reaction' || notification.object?.reaction !== 'like') return null;

  const actorFrom = uid(notification.from_user?.uid);
  const actorFromObject = uid(notification.object?.user?.uid);
  const target = uid(notification.object?.parent?.uid);
  const expectedTarget = uid(expectedTargetUid);
  const topParent = notification.top_parent?.uid === undefined ? target : uid(notification.top_parent.uid);
  const observedAt = notificationTime(notification);
  if (!actorFrom || !actorFromObject || actorFrom !== actorFromObject || !target || !expectedTarget || target !== expectedTarget || topParent !== target || !observedAt) return null;

  return {
    provider: 'loyalfans',
    actor_uid: actorFrom,
    target_uid: target,
    reaction: 'like',
    observed_at: observedAt,
    provider_notification_id: notificationId(notification)
  };
}
