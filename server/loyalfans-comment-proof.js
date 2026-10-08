import { normalizeLoyalFansTimestamp } from './loyalfans-timestamps.js';

const UID = /^[A-Za-z0-9_-]{16,255}$/;
const TOKEN_CHARACTER = /[\p{L}\p{N}\p{M}\p{Cf}_-]/u;

export function containsLoyalFansChallengeToken(text, challenge) {
  if (typeof text !== 'string' || typeof challenge !== 'string' ||
      !/^FL-LF-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(challenge) || challenge.length > 256) return false;
  for (let index = text.indexOf(challenge); index !== -1; index = text.indexOf(challenge, index + 1)) {
    const before = [...text.slice(Math.max(0, index - 2), index)].at(-1);
    const afterCodePoint = text.codePointAt(index + challenge.length);
    const after = afterCodePoint === undefined ? undefined : String.fromCodePoint(afterCodePoint);
    if ((!before || !TOKEN_CHARACTER.test(before)) && (!after || !TOKEN_CHARACTER.test(after))) return true;
  }
  return false;
}

// The scope is an internal attestation by the creator-side adapter, not a
// field invented in the LoyalFans response. An unscoped comment cannot prove
// which post was inspected. Browser-submitted comments never reach this parser.
export function parseLoyalFansCommentProof(raw, expectedPostUid, expectedChallenge, scopePostUid = null,{requireParentUid=false}={}) {
  const comment = raw?.response?.comment && typeof raw.response.comment === 'object' ? raw.response.comment
    : raw?.comment && typeof raw.comment === 'object' ? raw.comment : raw;
  const uid = comment?.uid;
  const memberUid = comment?.user?.uid;
  const memberName = comment?.user?.name;
  const memberSlug = comment?.user?.slug;
  const postUid = comment?.post?.uid ?? comment?.post_uid ?? comment?.parent?.uid ?? scopePostUid;
  const text = comment?.text ?? comment?.body ?? (typeof comment?.comment === 'string' ? comment.comment : null);
  let createdAt;
  try { createdAt = normalizeLoyalFansTimestamp(comment?.created_at ?? comment?.added_at, { required: true }); }
  catch { return null; }
  if(requireParentUid && comment?.parent?.uid!==expectedPostUid)return null;
  if (typeof uid !== 'string' || typeof memberUid !== 'string' || !UID.test(uid) || !UID.test(memberUid) ||
      (!requireParentUid && (typeof memberName !== 'string' || !memberName.trim() || typeof memberSlug !== 'string' || !memberSlug.trim())) ||
      postUid !== expectedPostUid || (scopePostUid !== null && scopePostUid !== expectedPostUid) ||
      !containsLoyalFansChallengeToken(text, expectedChallenge)) return null;
  return { comment_uid: uid, provider_member_uid: memberUid, post_uid: postUid, created_at: createdAt };
}
